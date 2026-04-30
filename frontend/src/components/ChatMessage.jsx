import React from 'react';
import { Bot, User, BookOpen } from 'lucide-react';

export default function ChatMessage({ message, isStreaming }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''} mb-6`}>
      {/* Avatar */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm
        ${isUser
          ? 'bg-blue-600 text-white'
          : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
        }`}>
        {isUser ? <User size={15} /> : <Bot size={15} />}
      </div>

      {/* Bubble */}
      <div className={`max-w-[80%] flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1`}>
        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap
          ${isUser
            ? 'bg-blue-600 text-white rounded-tr-sm'
            : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-tl-sm shadow-sm'
          }`}>
          {message.content}
          {isStreaming && <span className="cursor ml-0.5 inline-block w-0.5 h-4 bg-current align-middle">▋</span>}
        </div>

        {/* Sources */}
        {!isUser && message.sources?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1 max-w-full">
            {message.sources.map((src, i) => (
              <span key={i}
                className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30
                  text-blue-700 dark:text-blue-300 text-xs rounded-full border border-blue-200 dark:border-blue-700">
                <BookOpen size={10} /> {src}
              </span>
            ))}
          </div>
        )}

        <span className="text-xs text-gray-400">
          {new Date(message.created_at || Date.now()).toLocaleTimeString([], {
            hour: '2-digit', minute: '2-digit'
          })}
        </span>
      </div>
    </div>
  );
}
