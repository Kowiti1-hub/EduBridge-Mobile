
import React, { useState, useRef, useEffect } from 'react';
import { Message, MessageType } from '../types';

interface ChatBubbleProps {
  message: Message;
  onShare?: (message: Message) => void;
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
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = playbackSpeed;
  }, [playbackSpeed]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.pause(); else audioRef.current.play();
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="flex flex-col gap-2 min-w-[240px] p-1">
      <div className="flex items-center gap-3">
        <button onClick={togglePlay} className="w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-md active:scale-90 transition-transform flex-shrink-0">
          {isPlaying ? <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg> : <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>}
        </button>
        <div className="flex-1 flex flex-col gap-1.5">
          <input type="range" min="0" max="100" value={progress} readOnly className="w-full h-1.5 bg-emerald-100 rounded-full appearance-none accent-emerald-500" />
          <div className="flex justify-between items-center"><span className="text-[10px] font-bold text-emerald-800">Voice Note</span><span className="text-[10px] font-mono text-gray-500">{formatTime(currentTime)} / {formatTime(duration)}</span></div>
        </div>
      </div>
      <audio ref={audioRef} src={data} onTimeUpdate={() => { if(audioRef.current) { setCurrentTime(audioRef.current.currentTime); setProgress((audioRef.current.currentTime/duration)*100); } }} onEnded={() => setIsPlaying(false)} hidden />
    </div>
  );
};

const ChatBubble: React.FC<ChatBubbleProps> = ({ message, onShare }) => {
  const isUser = message.type === MessageType.USER;
  const isSystem = message.type === MessageType.SYSTEM;
  const isNote = message.type === MessageType.NOTE;
  const isLink = message.type === MessageType.LINK;
  const isAudio = message.type === MessageType.AUDIO;
  const isImage = message.type === MessageType.IMAGE;
  const isBot = message.type === MessageType.BOT;

  if (isSystem) return <div className="flex justify-center my-4"><span className="bg-blue-100 text-blue-800 text-[10px] px-3 py-1 rounded-full uppercase tracking-wider font-semibold">{message.content}</span></div>;

  const renderContent = () => {
    if (isNote) {
      return (
        <div className="bg-amber-50 border-l-4 border-amber-400 p-3 rounded-r-xl">
          <div className="flex items-center gap-2 mb-1"><span className="text-[8px] font-black text-amber-600 uppercase tracking-tighter">📌 Note</span></div>
          <p className="text-sm text-amber-900 italic font-medium">{message.content}</p>
        </div>
      );
    }

    if (isLink) {
      return (
        <div className="bg-white border border-blue-100 rounded-2xl overflow-hidden shadow-sm">
          <div className="bg-blue-500 p-2"><span className="text-[9px] font-black text-white uppercase">Resource Link</span></div>
          <div className="p-3">
            <p className="text-sm font-medium mb-2">{message.content}</p>
            <a href={message.metadata?.url} target="_blank" rel="noopener noreferrer" className="bg-blue-50 p-2 rounded block text-blue-600 text-[10px] font-mono truncate hover:bg-blue-100">{message.metadata?.url}</a>
          </div>
        </div>
      );
    }

    if (isAudio && message.metadata?.audioData) {
      return <VoicePlayer data={message.metadata.audioData} duration={message.metadata.duration || 0} />;
    }

    if (isImage && message.metadata?.imageData) {
      return (
        <div className="relative group">
          <img src={message.metadata.imageData} alt="Educational" className="w-full rounded-xl object-cover max-h-72" />
          <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[8px] text-white font-black uppercase shadow-sm ${message.metadata.isHighQuality ? 'bg-indigo-600/80' : 'bg-emerald-600/80'}`}>
            {message.metadata.isHighQuality ? 'High-Res' : 'Data-Saver'}
          </div>
        </div>
      );
    }

    const isLesson = !!message.metadata?.lessonNum;
    const isComplete = !!message.metadata?.isComplete;
    if (isLesson && message.metadata) {
      const lines = message.content.split('\n\n');
      return (
        <>
          <div className={`font-bold ${isComplete ? 'text-yellow-700' : 'text-emerald-800'}`}>{isComplete ? '🎓 COURSE COMPLETED' : lines[0]}</div>
          <ProgressBar current={message.metadata.lessonNum || 0} total={message.metadata.totalLessons || 1} isComplete={isComplete} />
          <div className="text-gray-700 italic leading-relaxed">{lines.slice(1).join('\n\n')}</div>
        </>
      );
    }

    return <div className="leading-relaxed whitespace-pre-wrap">{message.content}</div>;
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3 animate-in fade-in slide-in-from-bottom-2`}>
      <div className={`max-w-[85%] px-4 py-2 rounded-2xl shadow-sm text-sm relative ${isUser ? 'bg-emerald-100 text-emerald-900 rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'} ${message.isUssd ? 'font-mono border-2 border-emerald-500 bg-slate-900 text-emerald-400' : ''}`}>
        {renderContent()}
        <div className="text-[10px] text-gray-400 mt-2 text-right flex items-center justify-end gap-2">
          {isBot && onShare && (
            <button onClick={() => onShare(message)} className="text-emerald-700 hover:bg-emerald-200 font-bold flex items-center gap-1.5 bg-emerald-50 px-2 py-1 rounded-full transition-all active:scale-95 border border-emerald-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
              Share
            </button>
          )}
          <span>{message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>
    </div>
  );
};

export default ChatBubble;
