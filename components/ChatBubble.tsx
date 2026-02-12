
import React, { useState, useRef } from 'react';
import { Message, MessageType } from '../types';

interface ChatBubbleProps {
  message: Message;
}

const ProgressBar: React.FC<{ current: number; total: number; isComplete?: boolean }> = ({ current, total, isComplete }) => {
  const percentage = (current / total) * 100;
  return (
    <div className="w-full bg-gray-100 h-1.5 rounded-full mt-2 mb-3 overflow-hidden border border-gray-50">
      <div 
        className={`h-full transition-all duration-700 ease-out rounded-full shadow-[0_0_8px_rgba(16,185,129,0.3)] ${isComplete ? 'bg-yellow-400' : 'bg-emerald-500'}`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};

const VoicePlayer: React.FC<{ data: string; duration: number }> = ({ data, duration }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const onTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      setProgress((current / duration) * 100);
    }
  };

  const onEnded = () => {
    setIsPlaying(false);
    setProgress(0);
  };

  return (
    <div className="flex flex-col gap-2 min-w-[200px]">
      <div className="flex items-center gap-3">
        <button 
          onClick={togglePlay}
          className="w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-md active:scale-90 transition-transform"
        >
          {isPlaying ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          )}
        </button>
        
        <div className="flex-1 flex flex-col gap-1">
          <div className="relative h-1 bg-emerald-100 rounded-full overflow-hidden">
            <div className="absolute left-0 top-0 h-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex justify-between items-center px-0.5">
            <span className="text-[10px] font-bold text-emerald-800">
              {isPlaying ? 'Playing...' : 'Voice Note'}
            </span>
            <span className="text-[10px] font-mono text-gray-500">
              0:{duration.toString().padStart(2, '0')}
            </span>
          </div>
        </div>
      </div>
      
      <div className="flex justify-between items-center border-t border-emerald-50 pt-1 mt-1">
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
          <span className="text-[8px] font-bold text-emerald-600 uppercase">Compressed (8KB)</span>
        </div>
        <span className="text-[8px] text-gray-300">EduBridge Voice Network</span>
      </div>

      <audio 
        ref={audioRef} 
        src={data} 
        onTimeUpdate={onTimeUpdate} 
        onEnded={onEnded}
        hidden
      />
    </div>
  );
};

const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
  const isUser = message.type === MessageType.USER;
  const isSystem = message.type === MessageType.SYSTEM;
  const isNote = message.type === MessageType.NOTE;
  const isLink = message.type === MessageType.LINK;
  const isAudio = message.type === MessageType.AUDIO;
  const isImage = message.type === MessageType.IMAGE;

  if (isSystem) {
    return (
      <div className="flex justify-center my-4">
        <span className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full uppercase tracking-wider font-semibold">
          {message.content}
        </span>
      </div>
    );
  }

  // Handle Note style
  if (isNote) {
    return (
      <div className="flex justify-end mb-3 animate-in fade-in slide-in-from-right-2 duration-300">
        <div className="max-w-[85%] bg-amber-50 border-l-4 border-amber-400 p-3 rounded-r-xl shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-tighter">📌 Personal Note</span>
          </div>
          <p className="text-sm text-amber-900 italic font-medium leading-relaxed">{message.content}</p>
          <div className="text-[10px] text-amber-400 mt-1 text-right">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
    );
  }

  // Handle Link style
  if (isLink) {
    return (
      <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3 animate-in fade-in duration-300`}>
        <div className="max-w-[85%] bg-white border border-blue-100 rounded-2xl overflow-hidden shadow-sm">
          <div className="bg-blue-500 p-2 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <span className="text-[10px] font-bold text-white uppercase tracking-tighter">Educational Resource</span>
          </div>
          <div className="p-3">
            <p className="text-sm font-medium text-gray-800 mb-2">{message.content}</p>
            <div className="bg-gray-50 p-2 rounded border border-gray-100 flex items-center justify-between group cursor-pointer active:bg-gray-100">
              <span className="text-[10px] text-blue-600 font-mono truncate mr-2">
                {message.metadata?.url || 'edubridge.org/resource'}
              </span>
              <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold uppercase">Open</span>
            </div>
          </div>
          <div className="px-3 pb-2 text-[10px] text-gray-400 flex justify-between items-center">
            <span className="text-[8px] font-bold text-emerald-600">Low-Data Optimized</span>
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
    );
  }

  // Handle Audio Note style
  if (isAudio && message.metadata?.audioData) {
    return (
      <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3 animate-in fade-in slide-in-from-bottom-2 duration-300`}>
        <div className="max-w-[85%] bg-white p-3 rounded-2xl rounded-tr-none shadow-sm border border-emerald-50">
          <VoicePlayer data={message.metadata.audioData} duration={message.metadata.duration || 0} />
          <div className="text-[10px] text-gray-400 mt-1 text-right flex items-center justify-end gap-1">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </div>
    );
  }

  // Handle Image Note style
  if (isImage && message.metadata?.imageData) {
    return (
      <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3 animate-in fade-in slide-in-from-bottom-2 duration-300`}>
        <div className="max-w-[85%] bg-white p-2 rounded-2xl rounded-tr-none shadow-sm border border-emerald-50">
          <div className="relative group">
            <img 
              src={message.metadata.imageData} 
              alt="Attachment" 
              className="w-full rounded-xl object-cover max-h-60" 
              loading="lazy"
            />
            <div className="absolute top-2 left-2 bg-emerald-500/80 backdrop-blur-sm text-[8px] text-white px-1.5 py-0.5 rounded-full font-bold uppercase tracking-tighter">
              Low-Res (15KB)
            </div>
          </div>
          <div className="text-[10px] text-gray-400 mt-1.5 text-right flex items-center justify-end gap-1 px-1">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            {isUser && (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Handle lesson content parsing for progress bar insertion
  const isLesson = !!message.metadata?.lessonNum;
  const isComplete = !!message.metadata?.isComplete;
  let contentNodes: React.ReactNode = message.content;

  if (isLesson && message.metadata) {
    const lines = message.content.split('\n\n');
    const title = lines[0];
    const rest = lines.slice(1).join('\n\n');
    
    contentNodes = (
      <>
        <div className={`font-bold ${isComplete ? 'text-yellow-700' : 'text-emerald-800'}`}>
          {isComplete ? '🏆 COURSE COMPLETED' : title}
        </div>
        <ProgressBar 
          current={message.metadata.lessonNum || 0} 
          total={message.metadata.totalLessons || 1}
          isComplete={isComplete}
        />
        <div className="text-gray-700 italic leading-relaxed">{rest}</div>
      </>
    );
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3 animate-in fade-in slide-in-from-bottom-2 duration-300`}>
      <div
        className={`max-w-[85%] px-4 py-2 rounded-2xl shadow-sm text-sm md:text-base leading-relaxed whitespace-pre-wrap relative overflow-hidden
          ${isUser 
            ? 'bg-emerald-100 text-emerald-900 rounded-tr-none' 
            : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'}
          ${message.isUssd ? 'font-mono border-2 border-emerald-500 bg-black text-emerald-400' : ''}
          ${isComplete ? 'border-2 border-yellow-400 ring-2 ring-yellow-200' : ''}
        `}
      >
        {contentNodes}
        <div className="text-[10px] text-gray-400 mt-1 text-right flex items-center justify-end gap-1">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          {isUser && (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatBubble;
