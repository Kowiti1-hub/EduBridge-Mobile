
import React, { useState, useEffect, useRef } from 'react';
import { Message, MessageType, Subject, LessonContent } from './types';
import { USSD_MENU, SUBJECTS, HELP_MESSAGE } from './constants';
import { LESSON_DATA } from './lessons';
import ChatBubble from './components/ChatBubble';
import SubjectGrid from './components/SubjectGrid';
import { generateEducationalResponse, generateEducationalImage } from './services/geminiService';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

const TOTAL_LESSONS = 5;

const App: React.FC = () => {
  const [view, setView] = useState<'home' | 'chat'>('home');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [currentSubject, setCurrentSubject] = useState<Subject | null>(null);
  const [currentLesson, setCurrentLesson] = useState(1);
  const [isCourseCompleted, setIsCourseCompleted] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);
  const [attachmentMode, setAttachmentMode] = useState<'menu' | 'note' | 'audio' | 'image' | 'generate_image'>('menu');
  const [noteInput, setNoteInput] = useState('');
  const [imagePrompt, setImagePrompt] = useState('');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  
  // Audio Recording States
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
        handleUssdInput(transcript);
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isThinking]);

  // Helper for audible feedback tones (Web Audio API)
  const playTone = (freq: number, duration: number, type: 'sine' | 'square' | 'sawtooth' | 'triangle' = 'sine') => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      
      const audioCtx = new AudioContextClass();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
      
      // Gentle gain ramp to avoid clicks
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + duration);
    } catch (e) {
      console.warn("Audio feedback tone failed to play", e);
    }
  };

  const playSuccessSound = () => playTone(880, 0.15); // High A
  const playErrorSound = () => playTone(220, 0.3, 'triangle'); // Low A buzz

  // Helper for audible feedback speech
  const speakFeedback = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel(); // Stop current speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.3;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          sendAudioNote(base64Audio, recordingTime);
        };
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Please allow microphone access to record audio notes.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const sendAudioNote = (audioData: string, duration: number) => {
    addMessage("Voice Note", MessageType.AUDIO, false, { audioData, duration });
    addMessage("I've received your voice note. It has been compressed for low bandwidth storage! 🎙️", MessageType.BOT);
    setIsAttachmentMenuOpen(false);
    setAttachmentMode('menu');
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Image = reader.result as string;
        sendImageAttachment(base64Image);
      };
      reader.readAsDataURL(file);
    }
  };

  const sendImageAttachment = (imageData: string) => {
    addMessage("Educational Image", MessageType.IMAGE, false, { imageData });
    addMessage("Thank you for sharing the image! It has been optimized for the EduBridge network. 🖼️", MessageType.BOT);
    setIsAttachmentMenuOpen(false);
    setAttachmentMode('menu');
  };

  const handleAiImageGeneration = async () => {
    if (!imagePrompt.trim()) return;
    setIsGeneratingImage(true);
    speakFeedback("Generating educational graphic...");
    const base64Image = await generateEducationalImage(imagePrompt, currentSubject?.title || null);
    setIsGeneratingImage(false);
    
    if (base64Image) {
      addMessage(`AI Generated Graphic: ${imagePrompt}`, MessageType.IMAGE, false, { imageData: base64Image });
      addMessage("I've generated this educational graphic for you! 🎨", MessageType.BOT);
      setIsAttachmentMenuOpen(false);
      setAttachmentMode('menu');
      setImagePrompt('');
      speakFeedback("Graphic generated successfully.");
    } else {
      addMessage("I'm sorry, I couldn't generate that image right now. Please try again.", MessageType.BOT);
      playErrorSound();
      speakFeedback("Image generation failed.");
    }
  };

  const addMessage = (content: string, type: MessageType, isUssd = false, metadata?: any) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      content,
      type,
      timestamp: new Date(),
      isUssd,
      metadata
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const deliverLesson = (subjectId: string, lessonNum: number) => {
    const subjectContent = LESSON_DATA[subjectId];
    if (subjectContent && subjectContent[lessonNum]) {
      const lesson = subjectContent[lessonNum];
      const formattedContent = `📖 *${lesson.title}*\n\n${lesson.theory}\n\n❓ *Question:* ${lesson.question}`;
      addMessage(formattedContent, MessageType.BOT, false, { lessonNum, totalLessons: TOTAL_LESSONS });
    }
  };

  const selectSubject = (subject: Subject) => {
    setCurrentSubject(subject);
    setCurrentLesson(1);
    setIsCourseCompleted(false);
    setShowConfetti(false);
    setView('chat');
    addMessage(`Started: ${subject.title}`, MessageType.SYSTEM);
    addMessage(`Hello! Let's learn ${subject.title}.`, MessageType.BOT);
    deliverLesson(subject.id, 1);
  };

  const triggerUssd = () => {
    setView('chat');
    addMessage("*123#", MessageType.USER, true);
    addMessage(USSD_MENU, MessageType.BOT, true);
    playSuccessSound();
    speakFeedback("Main menu opened.");
  };

  const handleSendLink = () => {
    if (!currentSubject) return;
    const url = `https://edubridge.org/ref/${currentSubject.id}/L${currentLesson}`;
    addMessage(`Found a helpful resource for our ${currentSubject.title} lesson!`, MessageType.LINK, false, { url });
    addMessage("This resource link has been shared successfully! 🔗", MessageType.BOT);
    setIsAttachmentMenuOpen(false);
    speakFeedback("Resource link sent.");
  };

  const handleSendNote = () => {
    if (!noteInput.trim()) return;
    addMessage(noteInput, MessageType.NOTE);
    addMessage("Your study note has been pinned to your lesson history! 📌", MessageType.BOT);
    setNoteInput('');
    setAttachmentMode('menu');
    setIsAttachmentMenuOpen(false);
    speakFeedback("Study note saved.");
  };

  const handleUssdInput = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setInput('');

    // Shortcut for Attachment Menu
    if (trimmed === '*5#') {
      addMessage("*5#", MessageType.USER, true);
      setIsAttachmentMenuOpen(true);
      setAttachmentMode('menu');
      playSuccessSound();
      speakFeedback("Attachment menu opened.");
      return;
    }

    // Number navigation while attachment menu is open
    if (isAttachmentMenuOpen && attachmentMode === 'menu') {
      if (trimmed === '1') {
        addMessage("1", MessageType.USER, true);
        setAttachmentMode('note');
        speakFeedback("Text note mode.");
        return;
      }
      if (trimmed === '2') {
        addMessage("2", MessageType.USER, true);
        handleSendLink();
        return;
      }
      if (trimmed === '3') {
        addMessage("3", MessageType.USER, true);
        setAttachmentMode('audio');
        speakFeedback("Voice note mode.");
        return;
      }
      if (trimmed === '4') {
        addMessage("4", MessageType.USER, true);
        fileInputRef.current?.click();
        speakFeedback("Selecting image.");
        return;
      }
      if (trimmed === '5') {
        addMessage("5", MessageType.USER, true);
        setAttachmentMode('generate_image');
        speakFeedback("AI image generation mode.");
        return;
      }
      
      // Invalid input in attachment menu
      if (!['1','2','3','4','5'].includes(trimmed) && trimmed.length === 1 && !isNaN(parseInt(trimmed))) {
        playErrorSound();
        speakFeedback("Invalid menu selection.");
      }
    }

    if (trimmed.toLowerCase() === 'next') {
      if (isCourseCompleted) return;
      const nextLesson = currentLesson + 1;
      if (nextLesson <= TOTAL_LESSONS && currentSubject) {
        addMessage('Next', MessageType.USER);
        setCurrentLesson(nextLesson);
        deliverLesson(currentSubject.id, nextLesson);
        speakFeedback("Next lesson.");
        return;
      } else if (nextLesson > TOTAL_LESSONS && currentSubject) {
        addMessage('Next', MessageType.USER);
        setIsCourseCompleted(true);
        setShowConfetti(true);
        addMessage(`🎓 Congratulations! You have successfully completed the ${currentSubject.title} course. Type 'Menu' to choose another subject.`, MessageType.BOT, false, { lessonNum: TOTAL_LESSONS, totalLessons: TOTAL_LESSONS, isComplete: true });
        speakFeedback("Course completed! Congratulations!");
        setTimeout(() => setShowConfetti(false), 5000);
        return;
      }
    }

    if (trimmed.toLowerCase() === 'previous' || trimmed === '*99#') {
      if (currentSubject) {
        if (isCourseCompleted) {
          addMessage('Previous', MessageType.USER);
          setIsCourseCompleted(false);
          setShowConfetti(false);
          setCurrentLesson(TOTAL_LESSONS);
          deliverLesson(currentSubject.id, TOTAL_LESSONS);
          speakFeedback("Returning to last lesson.");
          return;
        }
        const prevLesson = currentLesson - 1;
        if (prevLesson >= 1) {
          addMessage('Previous', MessageType.USER);
          setCurrentLesson(prevLesson);
          deliverLesson(currentSubject.id, prevLesson);
          speakFeedback("Previous lesson.");
          return;
        } else {
          addMessage("You are already at the first lesson.", MessageType.BOT);
          speakFeedback("Already at the start.");
          return;
        }
      }
    }

    if (trimmed.toLowerCase() === 'menu') {
      setView('home');
      speakFeedback("Returning home.");
      return;
    }

    if (trimmed.startsWith('*') && trimmed.endsWith('#')) {
      const parts = trimmed.slice(1, -1).split('*');
      if (parts[0] === '123') {
        if (parts.length === 1) { triggerUssd(); return; }
        if (parts.length === 2) {
          const num = parseInt(parts[1]);
          if (!isNaN(num) && num >= 1 && num <= SUBJECTS.length) {
            addMessage(trimmed, MessageType.USER, true);
            selectSubject(SUBJECTS[num - 1]);
            playSuccessSound();
            speakFeedback(`Selected ${SUBJECTS[num - 1].title}.`);
            return;
          }
        }
      }
      // If we reach here, it was a USSD-like code but invalid
      addMessage(trimmed, MessageType.USER, true);
      addMessage("Invalid service code. Please try *123# or *5#.", MessageType.BOT);
      playErrorSound();
      speakFeedback("Invalid service code.");
      return;
    }

    if (trimmed === '0') {
      addMessage('0', MessageType.USER, true);
      addMessage(HELP_MESSAGE, MessageType.BOT, true);
      speakFeedback("Help center opened.");
      return;
    }

    const num = parseInt(trimmed);
    if (!isNaN(num) && num >= 1 && num <= SUBJECTS.length) {
      addMessage(trimmed, MessageType.USER, true);
      selectSubject(SUBJECTS[num - 1]);
      speakFeedback(`Starting ${SUBJECTS[num - 1].title}.`);
    } else if (!isNaN(num)) {
      // It's a number but out of bounds
      addMessage(trimmed, MessageType.USER, true);
      addMessage("Invalid selection. Reply with 1-8 or 0 for help.", MessageType.BOT);
      playErrorSound();
      speakFeedback("Invalid selection.");
    } else {
      handleSend(trimmed);
    }
  };

  const handleSend = async (text: string) => {
    if (!text.trim()) return;
    setInput('');
    addMessage(text, MessageType.USER);
    setIsThinking(true);
    const response = await generateEducationalResponse(text, messages, currentSubject?.title || null);
    setIsThinking(false);
    addMessage(response, MessageType.BOT);
  };

  return (
    <div className="flex flex-col h-full max-w-lg mx-auto bg-gray-50 border-x border-gray-200 shadow-2xl relative overflow-hidden">
      {showConfetti && Array.from({ length: 20 }).map((_, i) => (
        <div key={i} className="confetti" style={{ 
          left: `${Math.random() * 100}%`, 
          backgroundColor: ['#10b981', '#fbbf24', '#3b82f6', '#ef4444'][Math.floor(Math.random() * 4)],
          animationDelay: `${Math.random() * 2}s`
        }} />
      ))}
      <div className="absolute top-0 w-full h-6 bg-black/10 flex items-center justify-between px-4 pointer-events-none z-20">
         <span className="text-[10px] text-white font-bold">EduNet 4G</span>
         <div className="flex gap-1 items-center">
           <div className="w-1 h-3 bg-white/80 rounded-sm"></div>
           <div className="w-1 h-3 bg-white/80 rounded-sm"></div>
           <div className="w-1 h-3 bg-white/40 rounded-sm"></div>
           <span className="text-[10px] text-white font-bold ml-1">82%</span>
         </div>
      </div>
      <header className="bg-emerald-600 text-white p-4 pt-8 shadow-md flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          {view === 'chat' && (
            <button onClick={() => setView('home')} className="p-1 hover:bg-emerald-700 rounded-full transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <div>
            <h1 className="font-bold text-lg leading-tight">EduBridge</h1>
            <p className="text-[10px] opacity-90 uppercase tracking-tighter">Low Data Education Network</p>
          </div>
        </div>
        <button onClick={triggerUssd} className="text-[10px] bg-white/20 px-2 py-1 rounded border border-white/30 font-mono active:bg-white/40">*123#</button>
      </header>

      {/* HORIZONTAL NAVIGATION BAR - TOP ALIGNED */}
      {view === 'chat' && currentSubject && (
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-gray-200 px-3 py-2 flex items-center justify-between shadow-sm">
          <button
            onClick={() => handleUssdInput('Previous')}
            disabled={currentLesson === 1 && !isCourseCompleted}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              currentLesson === 1 && !isCourseCompleted
                ? 'text-gray-300 cursor-not-allowed'
                : 'text-gray-600 hover:bg-gray-100 active:scale-95'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
            Prev
          </button>

          <div className={`px-4 py-1.5 rounded-full flex flex-col items-center transition-all ${isCourseCompleted ? 'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200' : 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100'}`}>
            <span className="text-[10px] font-bold uppercase tracking-widest leading-none">
              {isCourseCompleted ? 'Completed' : `Lesson ${currentLesson} / ${TOTAL_LESSONS}`}
            </span>
            <div className="w-12 h-1 bg-gray-200 rounded-full mt-1 overflow-hidden">
               <div 
                 className={`h-full transition-all duration-500 ${isCourseCompleted ? 'bg-yellow-400' : 'bg-emerald-500'}`} 
                 style={{ width: `${(currentLesson/TOTAL_LESSONS) * 100}%` }}
               />
            </div>
          </div>

          <button
            onClick={() => handleUssdInput('Next')}
            disabled={isCourseCompleted}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              isCourseCompleted
                ? 'text-gray-300 cursor-not-allowed'
                : 'text-emerald-600 hover:bg-emerald-50 active:scale-95'
            }`}
          >
            Next
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

      <main className="flex-1 overflow-y-auto whatsapp-bg relative" ref={scrollRef}>
        {view === 'home' ? (
          <div className="pb-20">
            <div className="bg-white m-4 p-5 rounded-2xl shadow-sm border border-emerald-100">
              <h2 className="text-xl font-bold text-emerald-800 mb-2">Welcome Back! 📖</h2>
              <p className="text-sm text-gray-600 mb-4">You have used <span className="font-bold">120 KB</span> of data today. Education for everyone, everywhere.</p>
              <div className="bg-emerald-50 p-3 rounded-lg flex items-center gap-3 border border-emerald-100">
                <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-lg">💡</div>
                <p className="text-xs text-emerald-900 font-medium italic">"An investment in knowledge pays the best interest."</p>
              </div>
            </div>
            <h2 className="px-6 text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Subjects</h2>
            <SubjectGrid onSelect={selectSubject} />
            <div className="p-4 mt-4">
              <button onClick={triggerUssd} className="w-full bg-slate-800 text-white p-4 rounded-xl shadow-lg flex items-center justify-between group hover:bg-slate-900 transition-all active:scale-[0.98]">
                <div className="text-left"><span className="block font-bold">Launch USSD Portal</span><span className="text-[10px] opacity-60">Interactive Menu (*123#)</span></div>
                <span className="text-2xl group-hover:translate-x-1 transition-transform">📱</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 pb-32">
            {messages.length === 0 && <div className="text-center py-20"><div className="text-4xl mb-4">👋</div><p className="text-gray-500 text-sm">Send a message, dial a number, or use your voice!</p></div>}
            {messages.map((msg) => <ChatBubble key={msg.id} message={msg} />)}
            {isThinking && <div className="flex justify-start mb-3"><div className="bg-white px-4 py-2 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-1"><div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:-0.3s]"></div><div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:-0.15s]"></div><div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce"></div></div></div>}
          </div>
        )}
      </main>

      {/* Hidden File Input for Images */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImageSelect} 
        accept="image/*" 
        className="hidden" 
      />

      {/* Attachment Menu Modal */}
      {view === 'chat' && isAttachmentMenuOpen && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-30 flex items-end justify-center p-4">
          <div className="w-full bg-white rounded-3xl shadow-2xl animate-in slide-in-from-bottom duration-300 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-gray-800">Learning Attachments</h3>
              <button onClick={() => { setIsAttachmentMenuOpen(false); setAttachmentMode('menu'); stopRecording(); }} className="text-gray-400 p-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            
            <div className="p-4 min-h-[220px] flex flex-col justify-center">
              {attachmentMode === 'menu' ? (
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setAttachmentMode('note')}
                    className="flex flex-col items-center gap-2 p-3 rounded-2xl border-2 border-amber-50 bg-amber-50 hover:border-amber-200 transition-all active:scale-95 group relative"
                  >
                    <div className="absolute top-1.5 left-1.5 w-4 h-4 bg-amber-200 rounded-full flex items-center justify-center text-[8px] font-bold text-amber-700">1</div>
                    <div className="w-10 h-10 bg-amber-400 text-white rounded-full flex items-center justify-center text-lg shadow-sm">📌</div>
                    <span className="text-[10px] font-bold text-amber-800">Text Note</span>
                  </button>
                  <button 
                    onClick={handleSendLink}
                    className="flex flex-col items-center gap-2 p-3 rounded-2xl border-2 border-blue-50 bg-blue-50 hover:border-blue-200 transition-all active:scale-95 group relative"
                  >
                    <div className="absolute top-1.5 left-1.5 w-4 h-4 bg-blue-200 rounded-full flex items-center justify-center text-[8px] font-bold text-blue-700">2</div>
                    <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center text-lg shadow-sm">🔗</div>
                    <span className="text-[10px] font-bold text-blue-800">Resource</span>
                  </button>
                  <button 
                    onClick={() => setAttachmentMode('audio')}
                    className="flex flex-col items-center gap-2 p-3 rounded-2xl border-2 border-emerald-50 bg-emerald-50 hover:border-emerald-200 transition-all active:scale-95 group relative"
                  >
                    <div className="absolute top-1.5 left-1.5 w-4 h-4 bg-emerald-200 rounded-full flex items-center justify-center text-[8px] font-bold text-emerald-700">3</div>
                    <div className="w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center text-lg shadow-sm">🎙️</div>
                    <span className="text-[10px] font-bold text-emerald-800">Voice Note</span>
                  </button>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center gap-2 p-3 rounded-2xl border-2 border-purple-50 bg-purple-50 hover:border-purple-200 transition-all active:scale-95 group relative"
                  >
                    <div className="absolute top-1.5 left-1.5 w-4 h-4 bg-purple-200 rounded-full flex items-center justify-center text-[8px] font-bold text-purple-700">4</div>
                    <div className="w-10 h-10 bg-purple-500 text-white rounded-full flex items-center justify-center text-lg shadow-sm">🖼️</div>
                    <span className="text-[10px] font-bold text-purple-800">Send Image</span>
                  </button>
                  <button 
                    onClick={() => setAttachmentMode('generate_image')}
                    className="flex flex-col items-center gap-2 p-3 rounded-2xl border-2 border-rose-50 bg-rose-50 hover:border-rose-200 transition-all active:scale-95 group relative col-span-2"
                  >
                    <div className="absolute top-1.5 left-1.5 w-4 h-4 bg-rose-200 rounded-full flex items-center justify-center text-[8px] font-bold text-rose-700">5</div>
                    <div className="w-10 h-10 bg-rose-500 text-white rounded-full flex items-center justify-center text-lg shadow-sm">✨</div>
                    <span className="text-[10px] font-bold text-rose-800">AI Generate Graphic</span>
                  </button>
                </div>
              ) : attachmentMode === 'note' ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-amber-600 uppercase mb-1 block">New Study Note</label>
                    <textarea 
                      autoFocus
                      value={noteInput}
                      onChange={(e) => setNoteInput(e.target.value)}
                      placeholder="Type a reminder or key fact..."
                      className="w-full h-24 p-3 bg-amber-50/50 border-2 border-amber-100 rounded-xl outline-none focus:border-amber-400 text-sm italic font-medium"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setAttachmentMode('menu')} className="flex-1 py-3 rounded-xl font-bold text-gray-500 text-sm">Back</button>
                    <button 
                      onClick={handleSendNote}
                      disabled={!noteInput.trim()}
                      className="flex-[2] bg-amber-400 text-white py-3 rounded-xl font-bold text-sm shadow-md active:scale-95 disabled:opacity-50"
                    >
                      Send Study Note
                    </button>
                  </div>
                </div>
              ) : attachmentMode === 'generate_image' ? (
                <div className="space-y-4">
                   <div className="text-center">
                    <h4 className="text-rose-800 font-bold mb-1">AI Educational Graphic</h4>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Describe what you want to see</p>
                  </div>
                  <div>
                    <textarea 
                      autoFocus
                      value={imagePrompt}
                      onChange={(e) => setImagePrompt(e.target.value)}
                      placeholder="e.g., A simple diagram of a cell, a math triangle..."
                      className="w-full h-24 p-3 bg-rose-50/50 border-2 border-rose-100 rounded-xl outline-none focus:border-rose-400 text-sm italic font-medium"
                      disabled={isGeneratingImage}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setAttachmentMode('menu')} className="flex-1 py-3 rounded-xl font-bold text-gray-500 text-sm" disabled={isGeneratingImage}>Back</button>
                    <button 
                      onClick={handleAiImageGeneration}
                      disabled={!imagePrompt.trim() || isGeneratingImage}
                      className={`flex-[2] bg-rose-500 text-white py-3 rounded-xl font-bold text-sm shadow-md active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2`}
                    >
                      {isGeneratingImage ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Generating...
                        </>
                      ) : 'Generate Graphic'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-6 py-4">
                  <div className="text-center">
                    <h4 className="text-emerald-800 font-bold mb-1">Voice Recording</h4>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                      {isRecording ? "Recording Audio..." : "Ready to record"}
                    </p>
                  </div>

                  <div className="relative flex items-center justify-center">
                    {isRecording && (
                      <div className="absolute w-32 h-32 bg-emerald-100 rounded-full animate-ping opacity-20"></div>
                    )}
                    <button 
                      onPointerDown={startRecording}
                      onPointerUp={stopRecording}
                      onPointerLeave={stopRecording}
                      className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl shadow-xl transition-all active:scale-90 ${isRecording ? 'bg-emerald-600 text-white' : 'bg-emerald-500 text-white'}`}
                    >
                      {isRecording ? '⏺️' : '🎙️'}
                    </button>
                  </div>

                  <div className="flex flex-col items-center gap-2">
                    <span className={`font-mono text-2xl font-bold ${isRecording ? 'text-red-500 animate-pulse' : 'text-emerald-800'}`}>
                      0:{recordingTime.toString().padStart(2, '0')}
                    </span>
                    <p className="text-[10px] text-gray-400 font-medium italic">Hold button to record, release to send.</p>
                  </div>

                  <button 
                    onClick={() => { setAttachmentMode('menu'); stopRecording(); }}
                    className="text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
            <div className="bg-gray-50 p-3 text-[10px] text-gray-400 text-center font-medium">
              Data Saving: {attachmentMode === 'audio' ? 'Simulated 8KB/sec compression' : attachmentMode === 'image' || attachmentMode === 'generate_image' ? 'Automatic resolution reduction' : 'Minimal payload size'}
            </div>
          </div>
        </div>
      )}

      {view === 'chat' && (
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gray-50/90 backdrop-blur-sm border-t border-gray-200 z-10">
          <form onSubmit={(e) => { e.preventDefault(); handleUssdInput(input); }} className="flex items-center gap-2">
            <div className="flex-1 bg-white rounded-full px-3 py-2 shadow-inner border border-gray-200 flex items-center gap-1.5">
              <button type="button" onClick={toggleListening} className={`p-1.5 rounded-full transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-gray-400 hover:text-emerald-500 hover:bg-emerald-50'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </button>
              
              <button 
                type="button" 
                onClick={() => setIsAttachmentMenuOpen(true)}
                className="p-1.5 rounded-full text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 rotate-45" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </button>

              <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder={isListening ? "Listening..." : "Type message or *123#..."} className="flex-1 outline-none text-sm py-1 bg-transparent" />
            </div>
            <button type="submit" disabled={!input.trim() || isThinking} className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-90 ${!input.trim() || isThinking ? 'bg-gray-300 cursor-not-allowed' : 'bg-emerald-500 hover:bg-emerald-600 text-white'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default App;
