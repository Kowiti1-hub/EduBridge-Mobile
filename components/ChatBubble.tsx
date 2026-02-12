
import React from 'react';
import { Message, MessageType } from '../types';

interface ChatBubbleProps {
  message: Message;
}

const ProgressBar: React.FC<{ current: number; total: number }> = ({ current, total }) => {
  const percentage = (current / total) * 100;
  return (
    <div className="w-full bg-gray-100 h-1.5 rounded-full mt-2 mb-3 overflow-hidden border border-gray-50">
      <div 
        className="bg-emerald-500 h-full transition-all duration-500 ease-out rounded-full shadow-[0_0_8px_rgba(16,185,129,0.3)]"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};

const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
  const isUser = message.type === MessageType.USER;
  const isSystem = message.type === MessageType.SYSTEM;

  if (isSystem) {
    return (
      <div className="flex justify-center my-4">
        <span className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full uppercase tracking-wider font-semibold">
          {message.content}
        </span>
      </div>
    );
  }

  // Handle lesson content parsing for progress bar insertion
  const isLesson = !!message.metadata?.lessonNum;
  let contentNodes: React.ReactNode = message.content;

  if (isLesson && message.metadata) {
    const lines = message.content.split('\n\n');
    const title = lines[0];
    const rest = lines.slice(1).join('\n\n');
    
    contentNodes = (
      <>
        <div className="font-bold text-emerald-800">{title}</div>
        <ProgressBar 
          current={message.metadata.lessonNum || 0} 
          total={message.metadata.totalLessons || 1} 
        />
        <div className="text-gray-700">{rest}</div>
      </>
    );
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3 animate-in fade-in slide-in-from-bottom-2 duration-300`}>
      <div
        className={`max-w-[85%] px-4 py-2 rounded-2xl shadow-sm text-sm md:text-base leading-relaxed whitespace-pre-wrap
          ${isUser 
            ? 'bg-emerald-100 text-emerald-900 rounded-tr-none' 
            : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'}
          ${message.isUssd ? 'font-mono border-2 border-emerald-500 bg-black text-emerald-400' : ''}
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
