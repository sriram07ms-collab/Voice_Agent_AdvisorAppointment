'use client';

import { useState, useEffect, useRef } from 'react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import VoiceButton from '../voice/VoiceButton';
import { startConversation, sendMessage, MessageResponse } from '@/lib/api/client';
import { format } from 'date-fns';

export default function ChatWindow() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    metadata?: any;
  }>>([]);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initializeConversation();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initializeConversation = async () => {
    try {
      const response = await startConversation();
      setSessionId(response.sessionId);
      
      // Don't add initial greeting message - welcome screen will show instead
      // Welcome message is displayed in the empty state
    } catch (error) {
      console.error('Error starting conversation:', error);
      setMessages([{
        role: 'system',
        content: 'Failed to start conversation. Please refresh the page.',
        timestamp: new Date(),
      }]);
    }
  };

  const handleSendMessage = async (message: string) => {
    if (!sessionId) return;

    // Add user message to chat
    const userMessage = {
      role: 'user' as const,
      content: message,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const response: MessageResponse = await sendMessage(sessionId, message);
      
      // Update current step
      if (response.currentStep) {
        setCurrentStep(response.currentStep);
      }

      // Add assistant response
      const assistantMessage = {
        role: 'assistant' as const,
        content: response.message,
        timestamp: new Date(),
        metadata: {
          functionCalls: response.functionCalls,
          stateTransition: response.stateTransition,
        },
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // Show booking code if available
      if (response.bookingCode) {
        const bookingMessage = {
          role: 'system' as const,
          content: `✅ Booking Code: ${response.bookingCode}`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, bookingMessage]);
      }

      // Show educational links if available
      if (response.educationalLinks && response.educationalLinks.length > 0) {
        const linksMessage = {
          role: 'assistant' as const,
          content: `📚 Educational Resources:\n${response.educationalLinks.map(link => `- ${link}`).join('\n')}`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, linksMessage]);
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      const errorDetails = error?.response?.data?.details || error?.response?.data?.error || error?.message || 'Unknown error';
      const errorMessage = {
        role: 'system' as const,
        content: `Failed to send message: ${errorDetails}. Please try again.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-groww-light">
      {/* Header */}
      <div className="bg-white border-b border-groww-gray-200 shadow-groww">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-groww-dark">Groww Advisor Scheduler</h1>
              {currentStep && (
                <p className="text-xs sm:text-sm text-groww-gray-600 mt-1 font-medium">
                  {currentStep}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-groww-primary rounded-full animate-pulse"></div>
              <span className="text-xs text-groww-gray-600 font-medium">Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          {messages.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="w-16 h-16 bg-groww-primary-light rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-groww-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-groww-dark mb-2">Welcome to Groww Advisor Scheduler</h2>
              <p className="text-groww-gray-600 max-w-md">
                Click the microphone button or type a message to get started. I can help you book, reschedule, or cancel advisor appointments.
              </p>
            </div>
          )}
          
          {messages.map((msg, index) => (
            <ChatMessage
              key={index}
              role={msg.role}
              content={msg.content}
              timestamp={msg.timestamp}
              metadata={msg.metadata}
            />
          ))}
          
          {loading && (
            <div className="flex justify-start mb-4 animate-fade-in">
              <div className="bg-white border border-groww-gray-200 rounded-2xl px-4 py-3 shadow-groww">
                <div className="flex gap-1.5 items-center">
                  <div className="w-2 h-2 bg-groww-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-groww-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-groww-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t border-groww-gray-200 shadow-groww-lg">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-end gap-3">
            <VoiceButton
              sessionId={sessionId || undefined}
              onTranscript={(transcript) => {
                // Show user transcript in chat (voice WebSocket handles processing, no need to call handleSendMessage)
                if (transcript.trim()) {
                  const userMessage = {
                    role: 'user' as const,
                    content: transcript,
                    timestamp: new Date(),
                  };
                  setMessages((prev) => [...prev, userMessage]);
                }
              }}
              onResponse={(text, audioUrl) => {
                // Add assistant response from voice (voice WebSocket already processed the conversation)
                const assistantMessage = {
                  role: 'assistant' as const,
                  content: text,
                  timestamp: new Date(),
                };
                setMessages((prev) => [...prev, assistantMessage]);
              }}
            />
            <div className="flex-1">
              <ChatInput onSendMessage={handleSendMessage} disabled={loading || !sessionId} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}




