'use client';

import { useState, KeyboardEvent } from 'react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSendMessage, disabled }: ChatInputProps) {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="w-full">
      <div className="flex gap-3">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message..."
          disabled={disabled}
          className="
            flex-1 px-4 py-3 
            border border-groww-gray-300 rounded-xl
            focus:outline-none focus:ring-2 focus:ring-groww-primary focus:border-transparent
            disabled:bg-groww-gray-100 disabled:cursor-not-allowed
            text-groww-dark placeholder-groww-gray-400
            transition-all duration-200
            shadow-groww
          "
        />
        <button
          onClick={handleSend}
          disabled={disabled || !message.trim()}
          className="
            px-6 py-3 
            bg-groww-primary text-white font-medium
            rounded-xl
            hover:bg-groww-primary-dark 
            disabled:bg-groww-gray-300 disabled:text-groww-gray-500 disabled:cursor-not-allowed 
            transition-all duration-200
            shadow-groww hover:shadow-groww-lg
            active:scale-95
            focus:outline-none focus:ring-2 focus:ring-groww-primary focus:ring-offset-2
          "
        >
          Send
        </button>
      </div>
    </div>
  );
}







