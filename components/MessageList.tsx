
import React from 'react';
import type { Message } from '../types';
import { XMarkIcon } from './icons';

interface MessageListProps {
  messages: Message[];
  selectedMessage: Message | null;
  onSelectMessage: (message: Message) => void;
  isComposing: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const Highlight: React.FC<{ text: string; query: string }> = ({ text, query }) => {
  if (!query.trim()) {
    return <>{text}</>;
  }
  // Escape special characters for regex
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapedQuery})`, 'gi');
  const parts = text.split(regex);
  
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <span key={i} className="bg-yellow-300 dark:bg-yellow-600/70 rounded-[2px] px-0.5 py-0.5 -my-0.5">
            {part}
          </span>
        ) : (
          part
        )
      )}
    </>
  );
};

const MessageItem: React.FC<{
  message: Message;
  isSelected: boolean;
  onSelect: () => void;
  searchQuery: string;
}> = ({ message, isSelected, onSelect, searchQuery }) => (
  <li
    onClick={onSelect}
    className={`p-4 cursor-pointer rounded-lg transition-colors duration-200 flex items-start space-x-4 ${
      isSelected ? 'bg-primary-100 dark:bg-primary-900/50' : 'hover:bg-gray-200/50 dark:hover:bg-gray-800/50'
    }`}
  >
    <img src={message.avatar} alt={message.sender} className="w-10 h-10 rounded-full flex-shrink-0 mt-1" />
    <div className="flex-1 overflow-hidden">
      <div className="flex justify-between items-baseline">
        <p className={`truncate ${
          message.read
            ? 'font-semibold text-gray-600 dark:text-gray-400'
            : 'font-bold text-gray-800 dark:text-gray-200'
        }`}><Highlight text={message.sender} query={searchQuery} /></p>
        <p className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">{message.timestamp}</p>
      </div>
      <p className={`truncate ${
        message.read
          ? 'font-normal text-gray-500 dark:text-gray-400'
          : 'font-semibold text-primary-600 dark:text-primary-400'
      }`}>
        <Highlight text={message.subject} query={searchQuery} />
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
        <Highlight text={message.body} query={searchQuery} />
      </p>
    </div>
    {!message.read && (
      <div className="w-2.5 h-2.5 bg-primary-500 rounded-full self-center flex-shrink-0" aria-label="Unread message"></div>
    )}
  </li>
);

export const MessageList: React.FC<MessageListProps> = ({ messages, selectedMessage, onSelectMessage, isComposing, searchQuery, onSearchChange }) => {
  return (
    <div className="w-1/3 max-w-sm flex-shrink-0 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-inherit">
        <div className="relative">
          <input 
            type="text" 
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full px-4 py-2 rounded-full bg-gray-200 dark:bg-gray-700 border border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
              aria-label="Clear search"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
      <ul className="p-2 space-y-1">
        {messages.length > 0 ? (
          messages.map(message => (
            <MessageItem
              key={message.id}
              message={message}
              isSelected={!isComposing && selectedMessage?.id === message.id}
              onSelect={() => onSelectMessage(message)}
              searchQuery={searchQuery}
            />
          ))
        ) : (
          <div className="text-center py-10 text-gray-500">
            <p>No messages found.</p>
          </div>
        )}
      </ul>
    </div>
  );
};
