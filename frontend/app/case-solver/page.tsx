"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    created_at: string;
}

interface StructuredOutput {
    type: 'text' | 'table' | 'chart' | 'analysis' | 'recommendation' | 'metric';
    content: any;
    title?: string;
    description?: string;
}

export default function CaseSolverPage() {
    const [query, setQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [streamingMessage, setStreamingMessage] = useState('');
    const [structuredOutputs, setStructuredOutputs] = useState<StructuredOutput[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    useEffect(() => {
        checkAuth();
        fetchMessages();
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, streamingMessage]);

    const checkAuth = async () => {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error || !session) {
            router.push('/auth');
        }
    };

    const fetchMessages = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const response = await fetch('http://localhost:5000/api/get_answer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    query: "get_history",
                    user_id: session.user.id
                })
            });
            const data = await response.json();
            if (data.success) {
                setMessages(data.messages || []);
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim() || isLoading) return;

        setIsLoading(true);
        setStreamingMessage('');
        setStructuredOutputs([]);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const response = await fetch('http://localhost:5000/api/get_answer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    query: query,
                    user_id: session.user.id,
                    chat_history: messages.map(msg => ({
                        role: msg.role,
                        content: msg.content
                    }))
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.success) {
                // Add user message
                setMessages(prev => [{
                    id: Date.now().toString(),
                    role: 'user',
                    content: query,
                    created_at: new Date().toISOString()
                }, ...prev]);

                // Add assistant message with structured output
                if (data.answer) {
                    setMessages(prev => [{
                        id: (Date.now() + 1).toString(),
                        role: 'assistant',
                        content: data.answer.content?.sections?.[0]?.content || 'Analysis complete.',
                        created_at: new Date().toISOString()
                    }, ...prev]);
                    
                    // Add structured output if available
                    if (data.answer.type) {
                        setStructuredOutputs(prev => [data.answer, ...prev]);
                    }
                }
                
                setQuery('');
            } else {
                throw new Error(data.error || 'Failed to get response');
            }
        } catch (error) {
            console.error('Error during chat:', error);
            // Add error message to chat
            setMessages(prev => [{
                id: Date.now().toString(),
                role: 'assistant',
                content: 'Sorry, I encountered an error while processing your request. Please try again.',
                created_at: new Date().toISOString()
            }, ...prev]);
        } finally {
            setIsLoading(false);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="case-solver-page">
            <div className="query-section">
                <div className="query-container">
                    <h1 className="page-title">Case Solver</h1>
                    <form onSubmit={handleSubmit} className="query-form">
                        <div className="input-wrapper">
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Enter your case study..."
                                disabled={isLoading}
                                className="query-input"
                            />
                            <button
                                type="submit"
                                disabled={isLoading || !query.trim()}
                                className="submit-button"
                            >
                                {isLoading ? (
                                    <div className="button-content">
                                        <div className="loading-spinner"></div>
                                        <span>Processing</span>
                                    </div>
                                ) : (
                                    <div className="button-content">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </svg>
                                        <span>Solve</span>
                                    </div>
                                )}
                            </button>
                        </div>
                        {isLoading && (
                            <div className="progress-bar">
                                <div className="progress-indicator"></div>
                            </div>
                        )}
                    </form>
                </div>
            </div>

            <div className="content-section">
                <div className="messages-container">
                    {streamingMessage && (
                        <div className="message streaming">
                            <div className="message-content">
                                {streamingMessage}
                            </div>
                        </div>
                    )}
                    {messages.map((message) => (
                        <div key={message.id} className={`message ${message.role}`}>
                            <div className="message-content">
                                {message.content}
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            <style jsx>{`
                .case-solver-page {
                    height: 100vh;
                    display: flex;
                    flex-direction: column;
                    background: #ffffff;
                }

                .query-section {
                    position: sticky;
                    top: 0;
                    left: 0;
                    right: 0;
                    background: #ffffff;
                    z-index: 100;
                    border-bottom: 1px solid #e2e8f0;
                }

                .query-container {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 1.5rem 2rem;
                }

                .page-title {
                    font-size: 1.5rem;
                    font-weight: 600;
                    color: #1e293b;
                    margin-bottom: 1.5rem;
                }

                .query-form {
                    max-width: 800px;
                    margin: 0 auto;
                }

                .input-wrapper {
                    display: flex;
                    align-items: center;
                    background: #ffffff;
                    border-radius: 12px;
                    border: 1px solid #e2e8f0;
                    transition: all 0.2s;
                    position: relative;
                }

                .input-wrapper:focus-within {
                    border-color: #3b82f6;
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
                }

                .query-input {
                    flex: 1;
                    padding: 1rem 1.5rem;
                    border: none;
                    border-radius: 12px;
                    font-size: 1rem;
                    transition: all 0.2s;
                    background: transparent;
                    padding-right: 140px; /* Make space for the button */
                }

                .query-input:focus {
                    outline: none;
                }

                .query-input::placeholder {
                    color: #94a3b8;
                }

                .submit-button {
                    position: absolute;
                    right: 0.5rem;
                    top: 50%;
                    transform: translateY(-50%);
                    padding: 0.75rem 1.25rem;
                    background: #3b82f6;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 0.875rem;
                    font-weight: 500;
                    transition: all 0.2s;
                    white-space: nowrap;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-width: 100px;
                }

                .button-content {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .loading-spinner {
                    width: 16px;
                    height: 16px;
                    border: 2px solid #ffffff;
                    border-top-color: transparent;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    to {
                        transform: rotate(360deg);
                    }
                }

                .submit-button:disabled {
                    background: #94a3b8;
                    cursor: not-allowed;
                }

                .submit-button:hover:not(:disabled) {
                    background: #2563eb;
                    transform: translateY(-50%) scale(1.02);
                }

                .progress-bar {
                    height: 2px;
                    background: #e2e8f0;
                    margin-top: 0.5rem;
                    border-radius: 1px;
                    overflow: hidden;
                }

                .progress-indicator {
                    height: 100%;
                    background: #3b82f6;
                    width: 0%;
                    animation: progress 2s ease-in-out infinite;
                }

                @keyframes progress {
                    0% { width: 0%; }
                    50% { width: 70%; }
                    100% { width: 100%; }
                }

                .content-section {
                    flex: 1;
                    overflow: hidden;
                    background: #ffffff;
                }

                .messages-container {
                    height: 100%;
                    overflow-y: auto;
                    padding: 2rem;
                    display: flex;
                    flex-direction: column;
                    gap: 2rem;
                    max-width: 1200px;
                    margin: 0 auto;
                }

                .message {
                    max-width: 800px;
                    margin: 0 auto;
                    width: 100%;
                }

                .message.user {
                    align-self: flex-end;
                }

                .message.assistant {
                    align-self: flex-start;
                }

                .message-content {
                    padding: 1.5rem;
                    border-radius: 16px;
                    background: #ffffff;
                    white-space: pre-wrap;
                    line-height: 1.6;
                    border: 1px solid #e2e8f0;
                }

                .message.user .message-content {
                    background: #3b82f6;
                    color: white;
                    border: none;
                }

                .message.streaming .message-content {
                    background: #ffffff;
                    border: 1px solid #e2e8f0;
                }

                @media (max-width: 768px) {
                    .query-container {
                        padding: 1rem;
                    }

                    .messages-container {
                        padding: 1rem;
                    }

                    .message-content {
                        padding: 1rem;
                    }
                }
            `}</style>
        </div>
    );
} 