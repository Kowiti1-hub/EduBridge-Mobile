
import React, { useState, useEffect, useRef } from 'react';
import { Message, MessageType, Subject, LessonContent } from './types';
import { USSD_MENU, SUBJECTS, HELP_MESSAGE } from './constants';
import { LESSON_DATA } from './lessons';
import ChatBubble from './components/ChatBubble';
import SubjectGrid from './components/SubjectGrid';
import { generateEducationalResponse } from './services/geminiService';

// Extend Window interface for SpeechRecognition
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
  const [isThinking, setIsThinking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition
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
        // Automatically send the voice input
        handleUssdInput(transcript);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isThinking]);

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

  const addMessage = (content: string, type: MessageType, isUssd = false) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      content,
      type,
      timestamp: new Date(),
      isUssd
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const deliverLesson = (subjectId: string, lessonNum: number) => {
    const subjectContent = LESSON_DATA[subjectId];
    if (subjectContent && subjectContent[lessonNum]) {
      const lesson = subjectContent[lessonNum];
      const formattedContent = `📖 *${lesson.title}*\n\n${lesson.theory}\n\n❓ *Question:* ${lesson.question}`;
      addMessage(formattedContent, MessageType.BOT);
    } else {
      addMessage("You've completed all lessons for this subject! Great job. Type 'Menu' to choose another.", MessageType.BOT);
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

  const selectSubject = (subject: Subject) => {
    setCurrentSubject(subject);
    setCurrentLesson(1); // Reset lesson progress for new subject
    setView('chat');
    addMessage(`Started: ${subject.title}`, MessageType.SYSTEM);
    addMessage(`Hello! Let's learn ${subject.title}.`, MessageType.BOT);
    
    // Deliver the first lesson immediately
    deliverLesson(subject.id, 1);
  };

  const triggerUssd = () => {
    setView('chat');
    addMessage("*123#", MessageType.USER, true);
    addMessage(USSD_MENU, MessageType.BOT, true);
  };

  const handleUssdInput = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    setInput('');

    // Handle lesson progression
    if (trimmed.toLowerCase() === 'next') {
      const nextLesson = currentLesson + 1;
      if (nextLesson <= TOTAL_LESSONS && currentSubject) {
        addMessage('Next', MessageType.USER);
        setCurrentLesson(nextLesson);
        deliverLesson(currentSubject.id, nextLesson);
        return;
      } else if (nextLesson > TOTAL_LESSONS) {
        addMessage('Next', MessageType.USER);
        addMessage("Congratulations! You've reached the end of this course. Type 'Menu' to go back home.", MessageType.BOT);
        return;
      }
    }

    // Handle return to menu
    if (trimmed.toLowerCase() === 'menu') {
      setView('home');
      return;
    }

    // Handle direct USSD codes like *123*1#
    if (trimmed.startsWith('*') && trimmed.endsWith('#')) {
      const parts = trimmed.slice(1, -1).split('*');
      if (parts[0] === '123') {
        if (parts.length === 1) {
          triggerUssd();
          return;
        }
        if (parts.length === 2) {
          const num = parseInt(parts[1]);
          if (!isNaN(num) && num >= 1 && num <= SUBJECTS.length) {
            addMessage(trimmed, MessageType.USER, true);
            selectSubject(SUBJECTS[num - 1]);
            return;
          }
        }
      }
    }

    // Handle menu navigation (0 for Help Guide)
    if (trimmed === '0') {
      addMessage('0', MessageType.USER, true);
      addMessage(HELP_MESSAGE, MessageType.BOT, true);
      return;
    }

    // Handle numeric selection for subjects
    const num = parseInt(trimmed);
    if (!isNaN(num) && num >= 1 && num <= SUBJECTS.length) {
      addMessage(trimmed, MessageType.USER, true);
      selectSubject(SUBJECTS[num - 1]);
    } else {
      // Regular chat message
      handleSend(trimmed);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-lg mx-auto bg-gray-50 border-x border-gray-200 shadow-2xl relative overflow-hidden">
      {/* Mobile-First Status Bar Simulation */}
      <div className="absolute top-0 w-full h-6 bg-black/10 flex items-center justify-between px-4 pointer-events-none z-20">
         <span className="text-[10px] text-white font-bold">EduNet 4G</span>
         <div className="flex gap-1 items-center">
           <div className="w-1 h-3 bg-white/80 rounded-sm"></div>
           <div className="w-1 h-3 bg-white/80 rounded-sm"></div>
           <div className="w-1 h-3 bg-white/40 rounded-sm"></div>
           <span className="text-[10px] text-white font-bold ml-1">82%</span>
         </div>
      </div>

      {/* Header */}
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
        <div className="flex gap-2">
          <button 
            onClick={triggerUssd}
            className="text-[10px] bg-white/20 px-2 py-1 rounded border border-white/30 font-mono active:bg-white/40 transition-colors"
          >
            *123#
          </button>
        </div>
      </header>

      {/* Main Content */}
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
              <button 
                onClick={triggerUssd}
                className="w-full bg-slate-800 text-white p-4 rounded-xl shadow-lg flex items-center justify-between group hover:bg-slate-900 transition-all active:scale-[0.98]"
              >
                <div className="text-left">
                  <span className="block font-bold">Launch USSD Portal</span>
                  <span className="text-[10px] opacity-60">Interactive Menu (*123#)</span>
                </div>
                <span className="text-2xl group-hover:translate-x-1 transition-transform">📱</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 pb-24">
            {messages.length === 0 && (
              <div className="text-center py-20">
                <div className="text-4xl mb-4">👋</div>
                <p className="text-gray-500 text-sm">Send a message, dial a number, or use your voice!</p>
              </div>
            )}
            {messages.map((msg) => (
              <ChatBubble key={msg.id} message={msg} />
            ))}
            {isThinking && (
              <div className="flex justify-start mb-3">
                <div className="bg-white px-4 py-2 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce"></div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Persistent "Next Lesson" Button & Progress Indicator */}
      {view === 'chat' && currentSubject && (
        <div className="absolute bottom-[72px] left-0 right-0 flex flex-col items-center pointer-events-none z-10">
          <button
            onClick={() => handleUssdInput('Next')}
            className="pointer-events-auto bg-white/95 backdrop-blur-md border border-emerald-200 text-emerald-700 px-4 py-1.5 rounded-full text-xs font-bold shadow-lg hover:bg-emerald-50 active:scale-95 transition-all flex items-center gap-2"
          >
            Next Lesson <span>➡️</span>
          </button>
          <div className="mt-1 bg-black/30 backdrop-blur-sm px-2.5 py-0.5 rounded shadow-sm text-[9px] text-white font-bold uppercase tracking-wider">
            Lesson {currentLesson} of {TOTAL_LESSONS}
          </div>
        </div>
      )}

      {/* Input Area (Only in Chat) */}
      {view === 'chat' && (
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gray-50/90 backdrop-blur-sm border-t border-gray-200 z-10">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleUssdInput(input); }}
            className="flex items-center gap-2"
          >
            <div className="flex-1 bg-white rounded-full px-4 py-2 shadow-inner border border-gray-200 flex items-center gap-2">
              <button 
                type="button" 
                onClick={toggleListening}
                className={`p-1.5 rounded-full transition-all ${isListening ? 'bg-red-500 text-white animate-pulse shadow-md' : 'text-gray-400 hover:text-emerald-500 hover:bg-emerald-50'}`}
                title={isListening ? "Listening..." : "Voice Input"}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </button>
              
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isListening ? "Listening..." : "Type message or *123#..."}
                className="flex-1 outline-none text-sm py-1 bg-transparent"
              />
              
              <button type="button" className="text-gray-300 p-1 hover:text-emerald-500 transition-colors hidden sm:block">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </button>
            </div>
            
            <button
              type="submit"
              disabled={!input.trim() || isThinking}
              className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-90 ${
                !input.trim() || isThinking ? 'bg-gray-300 cursor-not-allowed' : 'bg-emerald-500 hover:bg-emerald-600 text-white'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default App;
