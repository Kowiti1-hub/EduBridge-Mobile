import React, { useState, useEffect, useRef } from 'react';
import { Message, MessageType, Subject, EducationLevel } from './types';
import { USSD_MENU, SUBJECTS, HELP_MESSAGE } from './constants';
import { LESSON_DATA } from './lessons';
import ChatBubble from './components/ChatBubble';
import SubjectGrid from './components/SubjectGrid';
import { generateEducationalResponse, generateEducationalImage, summarizeTheory, generateEducationalVideo, getVideosOperation } from './services/geminiService';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

const TOTAL_LESSONS = 5;

const App: React.FC = () => {
  const [view, setView] = useState<'home' | 'chat' | 'setup'>('setup');
  const [educationLevel, setEducationLevel] = useState<EducationLevel | null>(null);
  const [yearOfStudy, setYearOfStudy] = useState<number>(1);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [currentSubject, setCurrentSubject] = useState<Subject | null>(null);
  const [currentLesson, setCurrentLesson] = useState(1);
  const [isCourseCompleted, setIsCourseCompleted] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(true);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);
  const [attachmentMode, setAttachmentMode] = useState<'menu' | 'note' | 'audio' | 'image' | 'generate_image' | 'generate_video' | 'link'>('menu');
  const [imageQuality, setImageQuality] = useState<'low' | 'high'>('low');
  const [noteInput, setNoteInput] = useState('');
  const [linkInput, setLinkInput] = useState('');
  const [imagePrompt, setImagePrompt] = useState('');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [videoPrompt, setVideoPrompt] = useState('');
  const [isOptimizingImage, setIsOptimizingImage] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [sharingMessage, setSharingMessage] = useState<Message | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  
  // Audio Recording States
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Audio Feedback Implementation
  const playTone = (freq: number, duration: number, type: 'sine' | 'triangle' | 'square' = 'sine', volume = 0.05) => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) { console.warn("Audio Context Error", e); }
  };

  const playSuccessSound = () => playTone(880, 0.1, 'sine');
  const playErrorSound = () => playTone(220, 0.2, 'triangle', 0.1);
  const playNavigationSound = () => playTone(440, 0.05, 'sine');

  const addMessage = (content: string, type: MessageType, isUssd: boolean = false, metadata?: any) => {
    const newMessage: Message = {
      id: Date.now().toString() + Math.random().toString(36).substring(7),
      type,
      content,
      timestamp: new Date(),
      isUssd,
      metadata
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const deliverLesson = (subjectId: string, lessonNum: number) => {
    const lesson = LESSON_DATA[subjectId]?.[lessonNum];
    if (lesson) {
      const content = `${lesson.title}\n\n${lesson.theory}\n\nQuestion: ${lesson.question}`;
      addMessage(content, MessageType.BOT, false, { lessonNum, totalLessons: TOTAL_LESSONS });
      speakFeedback(lesson.title);
    }
  };

  const speakFeedback = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.3;
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Load persisted state
    const savedMessages = localStorage.getItem('edubridge_messages');
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        setMessages(parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })));
      } catch (e) { console.error("Failed to load messages", e); }
    }

    const savedState = localStorage.getItem('edubridge_state');
    if (savedState) {
      try {
        const { subject, lesson, view: savedView, educationLevel: savedLevel, yearOfStudy: savedYear } = JSON.parse(savedState);
        if (subject) setCurrentSubject(subject);
        if (lesson) setCurrentLesson(lesson);
        if (savedView) setView(savedView);
        if (savedLevel) setEducationLevel(savedLevel);
        if (savedYear) setYearOfStudy(savedYear);
      } catch (e) { console.error("Failed to load state", e); }
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setInterimTranscript('');
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            const transcript = event.results[i][0].transcript;
            setInput(transcript);
            setInterimTranscript('');
            setIsListening(false);
            handleUssdInput(transcript);
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        setInterimTranscript(interim);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          playErrorSound();
          addMessage("Microphone access denied. Please enable it in your browser settings.", MessageType.BOT);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimTranscript('');
      };

      recognitionRef.current = recognition;
    } else {
      setIsSpeechSupported(false);
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    // Persist messages
    localStorage.setItem('edubridge_messages', JSON.stringify(messages));
  }, [messages, isThinking]);

  useEffect(() => {
    // Persist app state
    localStorage.setItem('edubridge_state', JSON.stringify({
      subject: currentSubject,
      lesson: currentLesson,
      educationLevel,
      yearOfStudy,
      view
    }));
  }, [currentSubject, currentLesson, view, educationLevel, yearOfStudy]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      if (!isSpeechSupported) {
        addMessage("Speech recognition is not supported in your browser.", MessageType.BOT);
        playErrorSound();
      }
      return;
    }
    
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
        playNavigationSound();
      } catch (e) {
        console.error("Speech start error", e);
        setIsListening(false);
      }
    }
  };

  const handleSummarize = async () => {
    if (!currentSubject || isThinking) return;
    if (isOffline) {
      addMessage("Cannot summarize while offline. Please check your connection.", MessageType.BOT);
      playErrorSound();
      return;
    }
    const theory = LESSON_DATA[currentSubject.id]?.[currentLesson]?.theory;
    if (!theory) return;
    setIsThinking(true);
    const summary = await summarizeTheory(theory);
    setIsThinking(false);
    addMessage(`Summarize Lesson ${currentLesson}`, MessageType.USER);
    addMessage(`📝 *Recap:* ${summary}`, MessageType.BOT);
    playSuccessSound();
  };

  const shareViaSms = () => {
    if (!sharingMessage) return;
    const context = currentSubject ? ` [${currentSubject.title} L${currentLesson}]` : "";
    const body = `EduBridge Lesson${context}: ${sharingMessage.content.slice(0, 100)}... Learn more at edubridge.org`;
    window.location.href = `sms:?body=${encodeURIComponent(body)}`;
    setSharingMessage(null);
    playSuccessSound();
  };

  const shareViaWhatsApp = () => {
    if (!sharingMessage) return;
    const context = currentSubject ? ` *[${currentSubject.title} - L${currentLesson}]*` : "";
    const body = `📚 *EduBridge*${context}\n\n${sharingMessage.content.slice(0, 200)}...\n\n🔗 edubridge.org`;
    window.location.href = `https://wa.me/?text=${encodeURIComponent(body)}`;
    setSharingMessage(null);
    playSuccessSound();
  };

  const compressImage = (base64Str: string, quality: 'low' | 'high'): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = quality === 'high' ? 1200 : 600;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_DIM) { height *= MAX_DIM / width; width = MAX_DIM; }
        } else {
          if (height > MAX_DIM) { width *= MAX_DIM / height; height = MAX_DIM; }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality === 'high' ? 0.8 : 0.4));
      };
    });
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsOptimizingImage(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const optimizedImage = await compressImage(reader.result as string, imageQuality);
        addMessage("Image Attachment", MessageType.IMAGE, false, { imageData: optimizedImage, isHighQuality: imageQuality === 'high' });
        addMessage(`Shared image in ${imageQuality === 'high' ? 'High Quality' : 'Data-Saver'} mode.`, MessageType.BOT);
        setIsOptimizingImage(false);
        setIsAttachmentMenuOpen(false);
        setAttachmentMode('menu');
        playSuccessSound();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAiImageGeneration = async () => {
    if (!imagePrompt.trim()) return;
    if (isOffline) {
      addMessage("AI Image generation requires an internet connection.", MessageType.BOT);
      playErrorSound();
      return;
    }
    setIsGeneratingImage(true);
    speakFeedback("Generating educational graphic...");
    const base64Image = await generateEducationalImage(imagePrompt, currentSubject?.title || null);
    setIsGeneratingImage(false);
    
    if (base64Image) {
      addMessage(`Educational Graphic: ${imagePrompt}`, MessageType.IMAGE, false, { imageData: base64Image, isHighQuality: false });
      addMessage(`AI generated a low-bandwidth graphic for "${imagePrompt}" 🎨`, MessageType.BOT);
      setIsAttachmentMenuOpen(false);
      setAttachmentMode('menu');
      setImagePrompt('');
      playSuccessSound();
    } else {
      playErrorSound();
      addMessage("Sorry, I couldn't generate that image. Please try a different description.", MessageType.BOT);
    }
  };

  const handleAiVideoGeneration = async () => {
    if (!videoPrompt.trim()) return;
    if (isOffline) {
      addMessage("AI Video generation requires an internet connection.", MessageType.BOT);
      playErrorSound();
      return;
    }

    // Check for API key
    if (typeof window.aistudio !== 'undefined' && !(await window.aistudio.hasSelectedApiKey())) {
      await window.aistudio.openSelectKey();
      // After opening, we assume they selected or will retry.
      // The platform handles the key injection.
    }

    setIsGeneratingVideo(true);
    speakFeedback("Starting video generation. This may take a few minutes...");
    addMessage(`Generating educational video for: ${videoPrompt}...`, MessageType.SYSTEM);

    try {
      let operation = await generateEducationalVideo(videoPrompt, currentSubject?.title || null);
      
      // Polling loop
      let attempts = 0;
      const maxAttempts = 60; // 10 minutes (10s intervals)
      
      while (!operation.done && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await getVideosOperation(operation);
        attempts++;
        
        if (attempts % 3 === 0) {
          speakFeedback("Still working on your video. Thank you for your patience.");
        }
      }

      if (operation.done && operation.response?.generatedVideos?.[0]?.video?.uri) {
        const videoUrl = operation.response.generatedVideos[0].video.uri;
        addMessage(`Educational Video: ${videoPrompt}`, MessageType.VIDEO, false, { videoUrl });
        addMessage(`Your educational video for "${videoPrompt}" is ready! 🎥`, MessageType.BOT);
        playSuccessSound();
      } else {
        throw new Error("Video generation timed out or failed.");
      }
    } catch (error: any) {
      console.error("Video Error:", error);
      if (error.message?.includes("Requested entity was not found")) {
        // Reset key if it failed due to key issues
        if (typeof window.aistudio !== 'undefined') await window.aistudio.openSelectKey();
      }
      playErrorSound();
      addMessage("Sorry, I couldn't generate that video. Please try again later.", MessageType.BOT);
    } finally {
      setIsGeneratingVideo(false);
      setIsAttachmentMenuOpen(false);
      setAttachmentMode('menu');
      setVideoPrompt('');
    }
  };

  const handleSendLink = () => {
    if (!linkInput.trim()) return;
    addMessage("Educational Resource", MessageType.LINK, false, { url: linkInput.trim() });
    setLinkInput('');
    setAttachmentMode('menu');
    setIsAttachmentMenuOpen(false);
    playSuccessSound();
  };

  const handleUssdInput = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setInput('');
    const command = trimmed.toLowerCase();

    if (trimmed === '*5#') {
      setIsAttachmentMenuOpen(true);
      setAttachmentMode('menu');
      playSuccessSound();
      return;
    }

    // Handle USSD subject navigation like *1*, *2*, etc.
    const ussdSubjectMatch = trimmed.match(/^\*(\d+)\*$/) || trimmed.match(/^\*(\d+)#$/);
    if (ussdSubjectMatch) {
      const num = parseInt(ussdSubjectMatch[1]);
      if (num >= 1 && num <= SUBJECTS.length) {
        const sub = SUBJECTS[num - 1];
        setCurrentSubject(sub);
        setCurrentLesson(1);
        setIsCourseCompleted(false);
        setView('chat');
        addMessage(trimmed, MessageType.USER, true);
        deliverLesson(sub.id, 1);
        playSuccessSound();
        return;
      }
    }

    if (command === 'next' || command === 'next lesson' || command.includes('next')) {
      if (isCourseCompleted) return;
      const nextLesson = currentLesson + 1;
      if (nextLesson <= TOTAL_LESSONS && currentSubject) {
        addMessage('Next Lesson', MessageType.USER);
        setCurrentLesson(nextLesson);
        deliverLesson(currentSubject.id, nextLesson);
        playSuccessSound();
        return;
      } else if (nextLesson > TOTAL_LESSONS && currentSubject) {
        setIsCourseCompleted(true);
        setShowConfetti(true);
        addMessage(`🎓 Course Complete! Great job with ${currentSubject.title}.`, MessageType.BOT, false, { lessonNum: TOTAL_LESSONS, totalLessons: TOTAL_LESSONS, isComplete: true });
        playSuccessSound();
        setTimeout(() => setShowConfetti(false), 5000);
        return;
      }
    }

    // Handle Previous Lesson navigation via command or USSD codes *2# and *99#
    if (command === 'previous' || command === 'back' || trimmed === '*99#' || trimmed === '*2#') {
      if (currentSubject && currentLesson > 1) {
        const prevLesson = currentLesson - 1;
        setCurrentLesson(prevLesson);
        deliverLesson(currentSubject.id, prevLesson);
        playNavigationSound();
        return;
      }
    }

    if (command === 'menu') { setView('home'); playNavigationSound(); return; }
    if (trimmed === '0' || trimmed === '*0#') {
      addMessage(trimmed, MessageType.USER, true);
      addMessage(HELP_MESSAGE, MessageType.BOT, true);
      playSuccessSound();
      return;
    }

    const num = parseInt(trimmed);
    if (!isNaN(num) && num >= 1 && num <= SUBJECTS.length && view === 'home') {
      const sub = SUBJECTS[num - 1];
      setCurrentSubject(sub);
      setCurrentLesson(1);
      setIsCourseCompleted(false);
      setView('chat');
      deliverLesson(sub.id, 1);
      playSuccessSound();
    } else if (view === 'chat' && !isAttachmentMenuOpen) {
      handleSend(trimmed);
    } else if (isAttachmentMenuOpen && attachmentMode === 'menu') {
      const menuMap: Record<string, 'menu' | 'note' | 'audio' | 'image' | 'generate_image' | 'link'> = { 
        '1': 'note', 
        '2': 'link', 
        '3': 'audio', 
        '4': 'image',
        '5': 'generate_image'
      };
      if (menuMap[trimmed]) {
        setAttachmentMode(menuMap[trimmed]);
        playSuccessSound();
      } else {
        playErrorSound();
      }
    } else {
      playErrorSound();
    }
  };

  const handleSend = async (text: string) => {
    if (!text.trim()) return;
    addMessage(text, MessageType.USER);
    if (isOffline) {
      addMessage("You are offline. I'll respond once you're back online! 📡", MessageType.BOT);
      playErrorSound();
      return;
    }
    setIsThinking(true);
    const response = await generateEducationalResponse(text, messages, currentSubject?.title || null);
    setIsThinking(false);
    addMessage(response, MessageType.BOT);
  };

  const handleDownloadSubject = (subject: Subject) => {
    const lessons = LESSON_DATA[subject.id];
    if (!lessons) return;

    addMessage(`Downloading all lessons for ${subject.title}...`, MessageType.SYSTEM);
    
    Object.entries(lessons).forEach(([num, lesson]) => {
      const lessonNum = parseInt(num);
      const content = `${lesson.title}\n\n${lesson.theory}\n\nQuestion: ${lesson.question}`;
      addMessage(content, MessageType.BOT, false, { lessonNum, totalLessons: TOTAL_LESSONS, isDownloaded: true });
    });

    addMessage(`Successfully downloaded ${Object.keys(lessons).length} lessons for ${subject.title}. You can now view them offline! ✅`, MessageType.BOT);
    playSuccessSound();
  };

  const handleDownloadMessage = (message: Message) => {
    setMessages(prev => prev.map(m => 
      m.id === message.id 
        ? { ...m, metadata: { ...m.metadata, isDownloaded: true } } 
        : m
    ));
    playSuccessSound();
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          addMessage("Voice Note", MessageType.AUDIO, false, { audioData: reader.result as string, duration: recordingTime });
          addMessage("Voice note received. 🎙️", MessageType.BOT);
          setIsAttachmentMenuOpen(false);
          setAttachmentMode('menu');
          playSuccessSound();
        };
        stream.getTracks().forEach(t => t.stop());
      };
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = window.setInterval(() => setRecordingTime(p => p + 1), 1000);
    } catch (e) { playErrorSound(); }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const triggerUssd = () => {
    if (view === 'chat') { setView('home'); playNavigationSound(); return; }
    setView('chat');
    addMessage("*123#", MessageType.USER, true);
    addMessage(USSD_MENU, MessageType.BOT, true);
    playSuccessSound();
  };

  return (
    <div className="flex flex-col h-full max-w-lg mx-auto bg-gray-50 border-x border-gray-200 shadow-2xl relative overflow-hidden">
      {isListening && (
        <div className="absolute inset-0 bg-emerald-600/95 backdrop-blur-xl z-[100] flex flex-col items-center justify-center text-white p-8 text-center animate-in fade-in duration-300">
          <div className="relative mb-12">
            <div className="absolute inset-0 bg-white/20 rounded-full animate-ping scale-150" />
            <div className="absolute inset-0 bg-white/10 rounded-full animate-pulse scale-125" />
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-emerald-600 text-4xl shadow-2xl relative z-10">
              🎙️
            </div>
          </div>
          <h2 className="text-3xl font-black tracking-tight mb-2">Listening...</h2>
          <p className="text-emerald-100/80 text-sm font-medium mb-8 max-w-[200px]">
            {interimTranscript || "Speak your question or command clearly"}
          </p>
          <div className="flex flex-col gap-4 w-full max-w-[240px]">
            <button 
              onClick={toggleListening}
              className="w-full py-4 bg-white text-emerald-600 rounded-2xl font-black shadow-xl active:scale-95 transition-all uppercase tracking-widest text-xs"
            >
              Stop Listening
            </button>
            <p className="text-[10px] text-emerald-200/50 uppercase tracking-widest font-bold">Powered by Web Speech API</p>
          </div>
        </div>
      )}
      {showConfetti && Array.from({ length: 20 }).map((_, i) => (
        <div key={i} className="confetti" style={{ left: `${Math.random() * 100}%`, backgroundColor: ['#10b981', '#fbbf24', '#3b82f6', '#ef4444'][Math.floor(Math.random() * 4)], animationDelay: `${Math.random() * 2}s` }} />
      ))}
      <header className="bg-emerald-600 text-white p-4 pt-8 shadow-md flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          {view === 'chat' && (
            <button onClick={() => setView('home')} className="p-1 hover:bg-emerald-700 rounded-full transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg leading-tight">EduBridge</h1>
              {isOffline && (
                <span className="bg-red-500 text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-tighter animate-pulse">Offline</span>
              )}
            </div>
            <p className="text-[10px] opacity-90 uppercase tracking-tighter">Low Data Education Network</p>
          </div>
        </div>
        <button onClick={triggerUssd} className="text-[10px] bg-white/20 px-2 py-1 rounded border border-white/30 font-mono active:bg-white/40">*123#</button>
      </header>

      {view === 'chat' && currentSubject && (
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-gray-200 px-3 py-2 flex items-center justify-between shadow-sm">
          <button onClick={() => handleUssdInput('Previous')} disabled={currentLesson === 1} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${currentLesson === 1 ? 'text-gray-300' : 'text-gray-600 hover:bg-gray-100 active:scale-95'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
            Prev
          </button>
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-bold uppercase tracking-widest leading-none text-emerald-800">
              {isCourseCompleted ? 'Done' : `Lesson ${currentLesson} / ${TOTAL_LESSONS}`}
            </span>
            {!isCourseCompleted && (
              <button onClick={handleSummarize} disabled={isThinking} className="mt-1 px-3 py-1 bg-emerald-500 text-white rounded-lg text-[9px] font-bold hover:bg-emerald-600 disabled:opacity-50 flex items-center gap-1 shadow-sm transition-transform active:scale-95">
                <span>✨</span> Summarize Lesson
              </button>
            )}
          </div>
          <button onClick={() => handleUssdInput('Next')} disabled={isCourseCompleted} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${isCourseCompleted ? 'text-gray-300' : 'text-emerald-600 hover:bg-emerald-50 active:scale-95'}`}>
            Next
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      )}

      <main className="flex-1 overflow-y-auto whatsapp-bg relative" ref={scrollRef}>
        {view === 'home' ? (
          <div className="pb-20">
            <div className="bg-white m-4 p-5 rounded-2xl shadow-sm border border-emerald-100">
              <h2 className="text-xl font-bold text-emerald-800 mb-1">Welcome! 📖</h2>
              <p className="text-xs text-gray-500 mb-4">You've saved 2.4MB of data today.</p>
              <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100 font-medium italic text-[11px] text-emerald-900">"Education is the most powerful weapon which you can use to change the world."</div>
            </div>
            <SubjectGrid 
              onSelect={(s) => { 
                const num = SUBJECTS.findIndex(x => x.id === s.id) + 1;
                handleUssdInput(num.toString());
              }} 
              onDownload={handleDownloadSubject}
              isOffline={isOffline}
            />
          </div>
        ) : (
          <div className="p-4 pb-32">
            {messages.map((msg) => (
              <ChatBubble 
                key={msg.id} 
                message={msg} 
                onShare={(m) => { setSharingMessage(m); playNavigationSound(); }} 
                onDownload={handleDownloadMessage}
                isOffline={isOffline}
              />
            ))}
            {(isThinking || isGeneratingImage || isGeneratingVideo) && (
              <div className="flex flex-col gap-1 p-3 bg-white rounded-xl w-fit ml-2 shadow-sm animate-pulse border border-gray-100">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                </div>
                {isGeneratingImage && <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-tighter">AI Drawing...</span>}
                {isGeneratingVideo && <span className="text-[10px] text-rose-600 font-bold uppercase tracking-tighter">AI Animating...</span>}
              </div>
            )}
          </div>
        )}
      </main>

      {sharingMessage && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden p-5 space-y-4 animate-in zoom-in-95">
            <h3 className="font-bold text-gray-800">Share Lesson</h3>
            <button onClick={shareViaWhatsApp} className="w-full flex items-center gap-4 p-4 rounded-2xl bg-emerald-50 text-emerald-800 font-bold border border-emerald-100 active:scale-95 transition-transform"><span className="text-xl">💬</span> WhatsApp</button>
            <button onClick={shareViaSms} className="w-full flex items-center gap-4 p-4 rounded-2xl bg-indigo-50 text-indigo-800 font-bold border border-indigo-100 active:scale-95 transition-transform"><span className="text-xl">📱</span> Share via SMS</button>
            <button onClick={() => setSharingMessage(null)} className="w-full py-3 text-gray-400 font-bold text-sm">Cancel</button>
          </div>
        </div>
      )}

      {isAttachmentMenuOpen && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-30 flex items-end justify-center p-4">
          <div className="w-full bg-white rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center"><h3 className="font-bold text-gray-800">Learning Tools</h3><button onClick={() => { setIsAttachmentMenuOpen(false); setAttachmentMode('menu'); }} className="text-gray-400">✕</button></div>
            <div className="p-4 min-h-[220px]">
              {attachmentMode === 'menu' ? (
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => { setAttachmentMode('note'); playSuccessSound(); }} className="p-4 rounded-2xl bg-amber-50 border border-amber-100 text-[10px] font-bold text-amber-800 flex flex-col items-center gap-2"><span>📌</span>Text Note</button>
                  <button onClick={() => { setAttachmentMode('link'); playSuccessSound(); }} className="p-4 rounded-2xl bg-blue-50 border border-blue-100 text-[10px] font-bold text-blue-800 flex flex-col items-center gap-2"><span>🔗</span>Resource Link</button>
                  <button onClick={() => { setAttachmentMode('audio'); playSuccessSound(); }} className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-[10px] font-bold text-emerald-800 flex flex-col items-center gap-2"><span>🎙️</span>Voice Note</button>
                  <button onClick={() => { setAttachmentMode('image'); playSuccessSound(); }} className="p-4 rounded-2xl bg-purple-50 border border-purple-100 text-[10px] font-bold text-purple-800 flex flex-col items-center gap-2"><span>🖼️</span>Send Photo</button>
                  <button onClick={() => { setAttachmentMode('generate_image'); playSuccessSound(); }} className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 text-[10px] font-bold text-indigo-800 flex flex-col items-center gap-2"><span>🎨</span>Generate Graphic (AI)</button>
                  <button onClick={() => { setAttachmentMode('generate_video'); playSuccessSound(); }} className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-[10px] font-bold text-rose-800 flex flex-col items-center gap-2"><span>🎥</span>Generate Video (AI)</button>
                </div>
              ) : attachmentMode === 'generate_image' ? (
                <div className="space-y-4">
                  <div className="text-center">
                    <h4 className="font-bold text-indigo-800">AI Graphic Generator</h4>
                    <p className="text-[10px] text-gray-500 uppercase">Describe an educational image to create</p>
                  </div>
                  <input 
                    type="text" 
                    autoFocus 
                    value={imagePrompt} 
                    onChange={e => setImagePrompt(e.target.value)} 
                    placeholder="e.g. Parts of a flower diagram..." 
                    className="w-full p-3 bg-indigo-50/50 border-2 border-indigo-100 rounded-xl outline-none text-sm" 
                  />
                  <div className="bg-emerald-50 p-2 rounded-lg text-[10px] text-emerald-800 font-medium">✨ Optimized for low data. Graphics are simple and clear.</div>
                  <button 
                    onClick={handleAiImageGeneration} 
                    disabled={!imagePrompt.trim() || isGeneratingImage} 
                    className="w-full bg-indigo-500 text-white py-3 rounded-xl font-bold shadow-md active:scale-95 disabled:opacity-50"
                  >
                    {isGeneratingImage ? 'Generating...' : 'Create & Attach Graphic'}
                  </button>
                  <button onClick={() => setAttachmentMode('menu')} className="w-full py-2 text-gray-400 text-sm">Back</button>
                </div>
              ) : attachmentMode === 'generate_video' ? (
                <div className="space-y-4">
                  <div className="text-center">
                    <h4 className="font-bold text-rose-800">AI Video Generator</h4>
                    <p className="text-[10px] text-gray-500 uppercase">Describe an educational animation to create</p>
                  </div>
                  <input 
                    type="text" 
                    autoFocus 
                    value={videoPrompt} 
                    onChange={e => setVideoPrompt(e.target.value)} 
                    placeholder="e.g. How the heart pumps blood..." 
                    className="w-full p-3 bg-rose-50/50 border-2 border-rose-100 rounded-xl outline-none text-sm" 
                  />
                  <div className="bg-amber-50 p-2 rounded-lg text-[10px] text-amber-800 font-medium">✨ High quality video. May take up to 2 minutes to generate.</div>
                  <button 
                    onClick={handleAiVideoGeneration} 
                    disabled={!videoPrompt.trim() || isGeneratingVideo} 
                    className="w-full bg-rose-500 text-white py-3 rounded-xl font-bold shadow-md active:scale-95 disabled:opacity-50"
                  >
                    {isGeneratingVideo ? 'Generating...' : 'Create & Attach Video'}
                  </button>
                  <button onClick={() => setAttachmentMode('menu')} className="w-full py-2 text-gray-400 text-sm">Back</button>
                </div>
              ) : attachmentMode === 'image' ? (
                <div className="space-y-4">
                  <div className="text-center">
                    <h4 className="font-bold text-purple-800">Choose Quality</h4>
                    <p className="text-[10px] text-gray-500 uppercase">Save data or send high-res</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button onClick={() => { setImageQuality('low'); playNavigationSound(); }} className={`p-3 rounded-xl border-2 flex justify-between items-center ${imageQuality === 'low' ? 'bg-purple-50 border-purple-400 ring-2 ring-purple-100' : 'bg-white border-gray-100'}`}><div><span className="block font-bold text-sm">Low Data</span><span className="text-[10px] text-emerald-600 font-bold">~20KB • Recommended</span></div>{imageQuality === 'low' && '✓'}</button>
                    <button onClick={() => { setImageQuality('high'); playNavigationSound(); }} className={`p-3 rounded-xl border-2 flex justify-between items-center ${imageQuality === 'high' ? 'bg-purple-50 border-purple-400 ring-2 ring-purple-100' : 'bg-white border-gray-100'}`}><div><span className="block font-bold text-sm">High Quality</span><span className="text-[10px] text-indigo-600 font-bold">~150KB • Uses more data</span></div>{imageQuality === 'high' && '✓'}</button>
                  </div>
                  {imageQuality === 'high' && <div className="bg-amber-50 border border-amber-100 p-2 rounded-lg text-[10px] text-amber-800 font-medium">⚠️ Warning: Increased data usage on weak signals.</div>}
                  <button onClick={() => fileInputRef.current?.click()} className="w-full bg-purple-500 text-white py-3 rounded-xl font-bold shadow-md active:scale-95">Select & Send Image</button>
                  <button onClick={() => setAttachmentMode('menu')} className="w-full py-2 text-gray-400 text-sm">Back</button>
                </div>
              ) : attachmentMode === 'link' ? (
                <div className="space-y-4">
                  <input type="url" autoFocus value={linkInput} onChange={e => setLinkInput(e.target.value)} placeholder="https://..." className="w-full p-3 bg-blue-50/50 border-2 border-blue-100 rounded-xl outline-none text-sm" />
                  <button onClick={handleSendLink} disabled={!linkInput.trim()} className="w-full bg-blue-500 text-white py-3 rounded-xl font-bold shadow-md active:scale-95 disabled:opacity-50">Share Resource</button>
                  <button onClick={() => setAttachmentMode('menu')} className="w-full py-2 text-gray-400 text-sm">Back</button>
                </div>
              ) : attachmentMode === 'audio' ? (
                <div className="flex flex-col items-center gap-4 py-4">
                  <button onPointerDown={startRecording} onPointerUp={stopRecording} onPointerLeave={stopRecording} className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl shadow-xl transition-all active:scale-90 ${isRecording ? 'bg-red-500' : 'bg-emerald-500 text-white'}`}>{isRecording ? '⏺️' : '🎙️'}</button>
                  <span className={`font-mono text-xl ${isRecording ? 'text-red-500 animate-pulse' : 'text-emerald-800'}`}>0:{recordingTime.toString().padStart(2, '0')}</span>
                  <button onClick={() => setAttachmentMode('menu')} className="text-xs text-gray-400">Back</button>
                </div>
              ) : (
                <div className="space-y-4">
                  <textarea autoFocus value={noteInput} onChange={e => setNoteInput(e.target.value)} placeholder="Type a study note..." className="w-full h-24 p-3 bg-amber-50/50 border-2 border-amber-100 rounded-xl outline-none text-sm" />
                  <button onClick={() => { addMessage(noteInput, MessageType.NOTE); setNoteInput(''); setAttachmentMode('menu'); setIsAttachmentMenuOpen(false); playSuccessSound(); }} disabled={!noteInput.trim()} className="w-full bg-amber-400 text-white py-3 rounded-xl font-bold shadow-md active:scale-95 disabled:opacity-50">Save Note</button>
                  <button onClick={() => setAttachmentMode('menu')} className="w-full py-2 text-gray-400 text-sm">Back</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {view === 'chat' && (
        <div className="p-3 bg-gray-50/90 backdrop-blur-sm border-t border-gray-200">
          <form onSubmit={e => { e.preventDefault(); handleUssdInput(input); }} className="flex gap-2">
            <div className="flex-1 bg-white rounded-full px-3 py-2 border border-gray-200 flex items-center gap-1.5">
              <button 
                type="button" 
                onClick={toggleListening} 
                disabled={!isSpeechSupported}
                className={`p-1.5 rounded-full transition-all ${!isSpeechSupported ? 'opacity-20 grayscale' : isListening ? 'bg-red-500 text-white' : 'text-gray-400 hover:text-emerald-500'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </button>
              <button type="button" onClick={() => { setIsAttachmentMenuOpen(true); playNavigationSound(); }} className="p-1.5 text-gray-400"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 rotate-45" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg></button>
              <input type="text" value={input} onChange={e => setInput(e.target.value)} placeholder={isListening ? "Listening..." : "Type or *123#..."} className="flex-1 outline-none text-sm" />
            </div>
            <button type="submit" className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg active:scale-90 transition-transform"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg></button>
          </form>
        </div>
      )}
      <input type="file" ref={fileInputRef} onChange={handleImageSelect} accept="image/*" className="hidden" />
    </div>
  );
};

export default App;