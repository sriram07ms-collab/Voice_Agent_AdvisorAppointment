'use client';

import { format } from 'date-fns';

interface ChatMessageProps {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    functionCalls?: Array<{ name: string; arguments: Record<string, any> }>;
    stateTransition?: { from: string; to: string };
  };
}

export default function ChatMessage({ role, content, timestamp, metadata }: ChatMessageProps) {
  if (role === 'system') {
    return (
      <div className="flex justify-center my-3 animate-fade-in">
        <div className="bg-groww-gray-100 text-groww-gray-700 text-xs font-medium px-4 py-2 rounded-full border border-groww-gray-200 shadow-groww">
          {content}
        </div>
      </div>
    );
  }

  const isUser = role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 animate-fade-in`}>
      <div className={`max-w-[85%] sm:max-w-[75%] ${isUser ? 'order-2' : 'order-1'}`}>
        <div
          className={`
            rounded-2xl px-4 py-2.5 shadow-groww
            ${isUser
              ? 'bg-groww-primary text-white'
              : 'bg-white text-groww-dark border border-groww-gray-200'
            }
          `}
        >
          <p className={`whitespace-pre-wrap leading-relaxed ${isUser ? 'text-white' : 'text-groww-gray-800'}`}>
            {content}
          </p>
          <p className={`text-xs mt-1.5 ${isUser ? 'text-white/80' : 'text-groww-gray-500'}`}>
            {format(timestamp, 'HH:mm')}
          </p>
        </div>
        
        {metadata?.functionCalls && metadata.functionCalls.length > 0 && (
          <div className="mt-2 text-xs text-groww-gray-500">
            <details className="cursor-pointer">
              <summary className="hover:text-groww-gray-700 transition-colors font-medium">
                Function calls ({metadata.functionCalls.length})
              </summary>
              <div className="mt-2 bg-groww-gray-50 p-3 rounded-lg border border-groww-gray-200 text-xs font-mono">
                {metadata.functionCalls.map((fc, i) => (
                  <div key={i} className="mb-2 last:mb-0">
                    <strong className="text-groww-primary">{fc.name}</strong>: {JSON.stringify(fc.arguments, null, 2)}
                  </div>
                ))}
              </div>
            </details>
          </div>
        )}
        
        {metadata?.stateTransition && (
          <div className="mt-2 text-xs text-groww-gray-500 font-medium">
            <span className="bg-groww-gray-100 px-2 py-1 rounded-md">
              {metadata.stateTransition.from} → {metadata.stateTransition.to}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}







