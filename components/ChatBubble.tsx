
import React from 'react';
import { Message, MessageType } from '../types';

interface ChatBubbleProps {
  message: Message;
}

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

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className={`max-w-[85%] px-4 py-2 rounded-2xl shadow-sm text-sm md:text-base leading-relaxed whitespace-pre-wrap
          ${isUser 
            ? 'bg-emerald-100 text-emerald-900 rounded-tr-none' 
            : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'}
          ${message.isUssd ? 'font-mono border-2 border-emerald-500 bg-black text-emerald-400' : ''}
        `}
      >
        {message.content}
        <div className="text-[10px] text-gray-400 mt-1 text-right">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
};

export default ChatBubble;
