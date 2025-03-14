"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabaseClient';
import Head from 'next/head';
import Image from 'next/image';

export default function OnboardingChat() {
    const [session, setSession] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const messagesEndRef = useRef(null);
    const router = useRouter();
    const { id: conversationId } = router.query;

    useEffect(() => {
        // Check authentication and load conversation
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (!session) {
                router.push('/auth');
            } else {
                loadConversation();
            }
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (!session) {
                router.push('/auth');
            }
        });

        return () => subscription.unsubscribe();
    }, [conversationId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const loadConversation = async () => {
        // Initial message is handled by the backend, no need to load conversation
        setMessages([{
            role: 'assistant',
            content: "Hello! I'm your AI wealth management assistant. I'll help you create your personalized financial profile. Let's start with your financial goals. What are your main financial objectives?"
        }]);
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const messageText = input.trim();
        setInput('');
        setLoading(true);
        setError(null);

        // Add user message to chat immediately
        const userMessage = { role: 'user', content: messageText };
        setMessages(prev => [...prev, userMessage]);

        try {
            const response = await fetch('http://localhost:5000/api/onboarding/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Origin': window.location.origin
                },
                body: JSON.stringify({
                    user_id: session.user.id,
                    message: messageText
                }),
                mode: 'cors',
                credentials: 'include'
            });

            // Handle non-JSON responses
            let data;
            try {
                const text = await response.text();
                data = text ? JSON.parse(text) : {};
            } catch (parseError) {
                console.error('Failed to parse response:', parseError);
                throw new Error('Invalid response from server. Please ensure the backend server is running.');
            }

            if (!response.ok) {
                throw new Error(data.error || `Server error: ${response.status}`);
            }

            // Add AI response to chat
            setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);

            // If onboarding is complete, redirect to dashboard
            if (data.is_complete) {
                setMessages(prev => [...prev, {
                    role: 'system',
                    content: 'Profile creation complete! Redirecting to your dashboard...'
                }]);
                setTimeout(() => {
                    router.push('/dashboard');
                }, 3000);
            }

        } catch (error) {
            console.error('Chat error:', error);
            let errorMessage = error.message;
            
            // Handle specific network errors
            if (error instanceof TypeError && error.message.includes('NetworkError')) {
                errorMessage = 'Unable to connect to the server. Please ensure the backend server is running at http://localhost:5000';
            }
            
            setError(errorMessage || 'Failed to send message. Please try again.');
            // Remove the user message if the API call failed
            setMessages(prev => prev.slice(0, -1));
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Head>
                <title>Profile Setup | Nexi</title>
                <meta name="description" content="Complete your profile setup with our AI assistant" />
            </Head>

            <div className="flex h-screen flex-col bg-gray-900">
                {/* Header */}
                <header className="sticky top-0 z-10 border-b border-gray-700/50 bg-gray-900/80 backdrop-blur-sm">
                    <div className="mx-auto flex h-16 max-w-screen-2xl items-center justify-between px-4">
                        <div className="flex items-center space-x-4">
                            <Image
                                src="/Nexi.png"
                                alt="Nexi Logo"
                                width={100}
                                height={32}
                                priority
                                className="h-8 w-auto"
                            />
                            <div className="hidden sm:block">
                                <h1 className="text-lg font-semibold text-white">Profile Setup</h1>
                                <p className="text-sm text-gray-400">AI-Guided Onboarding</p>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main chat area */}
                <div className="flex-1 overflow-hidden">
                    <div className="relative h-full">
                        {/* Messages container */}
                        <div className="h-full overflow-y-auto" ref={messagesEndRef}>
                            <div className="mx-auto max-w-3xl px-4 pt-6 pb-24">
                                {messages.map((message, index) => (
                                    <div
                                        key={index}
                                        className={`group mb-4 flex ${
                                            message.role === 'system' 
                                                ? 'justify-center' 
                                                : 'items-start'
                                        }`}
                                    >
                                        {message.role === 'system' ? (
                                            <div className="mx-auto max-w-xl rounded-md bg-blue-500/10 px-4 py-2 text-sm text-blue-200">
                                                {message.content}
                                            </div>
                                        ) : (
                                            <div className={`flex w-full ${message.role === 'assistant' ? 'bg-gray-800/40' : ''} px-4 py-6`}>
                                                <div className="mx-auto flex w-full max-w-3xl">
                                                    {message.role === 'assistant' && (
                                                        <div className="mr-4 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-blue-700">
                                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-white">
                                                                <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zm0 16c-3.86 0-7-3.14-7-7s3.14-7 7-7 7 3.14 7 7-3.14 7-7 7z"/>
                                                                <path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/>
                                                            </svg>
                                                        </div>
                                                    )}
                                                    {message.role === 'user' && (
                                                        <div className="mr-4 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gray-600">
                                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-white">
                                                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                                                                <path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/>
                                                            </svg>
                                                        </div>
                                                    )}
                                                    <div className="min-w-0 flex-1 space-y-2">
                                                        <p className="text-sm font-medium text-gray-400">
                                                            {message.role === 'assistant' ? 'AI Assistant' : 'You'}
                                                        </p>
                                                        <div className="prose prose-invert max-w-none">
                                                            <p className="text-gray-100">{message.content}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Input form */}
                        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-gray-900 via-gray-900 to-transparent pt-6">
                            <div className="mx-auto max-w-3xl px-4 pb-6">
                                {error && (
                                    <div className="mb-4 rounded-md bg-red-500/10 px-4 py-3 text-sm text-red-200">
                                        {error}
                                    </div>
                                )}
                                <form onSubmit={handleSendMessage} className="relative">
                                    <input
                                        type="text"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder="Type your message..."
                                        className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 pr-16 text-white placeholder-gray-400 shadow-lg focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                                        disabled={loading}
                                    />
                                    <button
                                        type="submit"
                                        disabled={loading || !input.trim()}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-blue-600 p-2 text-white transition-all hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600"
                                    >
                                        {loading ? (
                                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                                                <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086l-1.414 4.926a.75.75 0 00.826.95 28.896 28.896 0 0015.293-7.154.75.75 0 000-1.115A28.897 28.897 0 003.105 2.289z" />
                                            </svg>
                                        )}
                                    </button>
                                </form>
                                <p className="mt-2 text-center text-xs text-gray-400">
                                    Your responses help us create a personalized wealth management strategy.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
} 