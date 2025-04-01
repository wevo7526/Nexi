"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { supabase, checkAuth } from '../../lib/supabaseClient';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface DynamicContent {
  type: 'text' | 'list' | 'section' | 'analysis';
  content: string | string[] | Record<string, string[]>;
  title?: string;
}

interface TextContent {
  type: 'text';
  content: string;
  title?: string;
}

interface ListContent {
  type: 'list';
  content: string[];
  title?: string;
}

interface SectionContent {
  type: 'section';
  content: string | string[];
  title?: string;
}

interface AnalysisContent {
  type: 'analysis';
  content: Record<string, string[]>;
  title?: string;
}

type ContentType = TextContent | ListContent | SectionContent | AnalysisContent;

const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

const ErrorMessage = ({ message }: { message: string }) => (
  <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
    <p className="text-red-700">{message}</p>
  </div>
);

export default function MultiAgentPage() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [dynamicContent, setDynamicContent] = useState<ContentType[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const initialize = async () => {
      try {
        const { session, error } = await checkAuth();
        if (error) throw error;
        if (!session) {
          router.push('/auth');
          return;
        }
        setIsInitialized(true);
      } catch (err) {
        console.error('Initialization error:', err);
        setError('Failed to initialize the application');
      }
    };

    initialize();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        router.push('/auth');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, dynamicContent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError(null);
    setDynamicContent([]);

    try {
      const { session, error } = await checkAuth();
      if (error) throw error;
      if (!session) {
        router.push('/auth');
        return;
      }

      console.log('Sending request to backend...');
      const response = await fetch('http://localhost:5000/api/multi-agent/get_answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          query: input.trim(),
          user_id: session.user.id,
          chat_history: messages.map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to process request');
      }

      console.log('Received response from backend');
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Failed to initialize stream reader');
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let currentMessage = '';
      let currentOutput: ContentType | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          console.log('Stream complete');
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              console.log('Received data:', data);

              switch (data.type) {
                case 'status':
                  console.log('Processing status message');
                  setMessages(prev => {
                    const newMessages = [...prev];
                    const lastMessage = newMessages[newMessages.length - 1];
                    if (lastMessage && lastMessage.role === 'assistant') {
                      lastMessage.content = data.content;
                    } else {
                      newMessages.push({
                        role: 'assistant',
                        content: data.content,
                        timestamp: new Date()
                      });
                    }
                    return newMessages;
                  });
                  break;

                case 'content':
                  console.log('Processing content message');
                  currentMessage += data.content;
                  setMessages(prev => {
                    const newMessages = [...prev];
                    const lastMessage = newMessages[newMessages.length - 1];
                    if (lastMessage && lastMessage.role === 'assistant') {
                      lastMessage.content = currentMessage;
                    } else {
                      newMessages.push({
                        role: 'assistant',
                        content: currentMessage,
                        timestamp: new Date()
                      });
                    }
                    return newMessages;
                  });
                  break;

                case 'output':
                  console.log('Processing output message');
                  if (!currentOutput) {
                    currentOutput = {
                      type: data.output_type === 'analysis' ? 'analysis' : 'text',
                      content: data.content,
                      title: data.title
                    } as ContentType;
                  } else {
                    currentOutput.content = typeof currentOutput.content === 'string'
                      ? currentOutput.content + data.content
                      : currentOutput.content;
                  }
                  setDynamicContent(prev => {
                    const newContent = [...prev];
                    const existingIndex = newContent.findIndex(c => c.title === currentOutput?.title);
                    if (existingIndex >= 0) {
                      newContent[existingIndex] = currentOutput!;
                    } else {
                      newContent.push(currentOutput!);
                    }
                    return newContent;
                  });
                  break;

                case 'error':
                  console.error('Received error:', data.content);
                  setError(data.content);
                  setLoading(false);
                  break;

                case 'complete':
                  console.log('Received completion message');
                  setLoading(false);
                  break;

                default:
                  console.warn('Unknown message type:', data.type);
              }
            } catch (err) {
              console.error('Error parsing SSE data:', err);
              setError(err instanceof Error ? err.message : 'Failed to parse server response');
              setLoading(false);
            }
          }
        }
      }
    } catch (err) {
      console.error('Error during chat:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error while processing your request. Please try again.',
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const renderDynamicContent = (content: ContentType) => {
    switch (content.type) {
      case 'text':
        return <p className="text-gray-700">{content.content}</p>;
      case 'list':
        return (
          <ul className="list-disc pl-5 space-y-1">
            {content.content.map((item, index) => (
              <li key={index} className="text-gray-700">{item}</li>
            ))}
          </ul>
        );
      case 'section':
        return (
          <div className="mb-6">
            {content.title && (
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{content.title}</h3>
            )}
            {Array.isArray(content.content) ? (
              <ul className="list-disc pl-5 space-y-1">
                {content.content.map((item, index) => (
                  <li key={index} className="text-gray-700">{item}</li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-700">{content.content}</p>
            )}
          </div>
        );
      case 'analysis':
        return (
          <div className="mb-6">
            {content.title && (
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{content.title}</h3>
            )}
            {Object.entries(content.content).map(([section, items]) => (
              <div key={section} className="mb-4">
                <h4 className="text-md font-medium text-gray-800 mb-2">
                  {section.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </h4>
                <ul className="list-disc pl-5 space-y-1">
                  {items.map((item, index) => (
                    <li key={index} className="text-gray-700">{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  if (!isInitialized) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Research Assistant</h1>
      
      <div className="flex flex-col h-[calc(100vh-12rem)]">
        <div className="flex-1 overflow-y-auto mb-4 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-4 ${
                  message.role === 'user'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
          
          {dynamicContent.map((content, index) => (
            <div key={index} className="bg-white rounded-lg p-4 shadow-sm">
              {renderDynamicContent(content as ContentType)}
            </div>
          ))}
          
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                  <span>Thinking...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="flex space-x-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 p-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
              loading || !input.trim() ? 'bg-gray-400' : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            <PaperAirplaneIcon className="h-5 w-5" />
          </button>
        </form>
      </div>

      {error && <ErrorMessage message={error} />}
    </div>
  );
} 