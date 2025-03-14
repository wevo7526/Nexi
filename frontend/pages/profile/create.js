"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabaseClient';
import Head from 'next/head';
import Image from 'next/image';

export default function CreateProfile() {
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ type: '', content: '' });
    const router = useRouter();

    useEffect(() => {
        // Check authentication status
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setLoading(false);
            if (!session) {
                router.push('/auth');
            }
        });

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (!session) {
                router.push('/auth');
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const startOnboarding = async () => {
        if (!session?.user?.id) return;

        setLoading(true);
        setMessage({ type: '', content: '' });
        
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
                    message: "start"
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

            // Redirect to the chat interface - we'll handle profile status updates in the chat interface
            router.push(`/onboarding/chat`);

        } catch (error) {
            console.error('Onboarding error:', error);
            let errorMessage = error.message;
            
            // Handle specific network errors
            if (error instanceof TypeError && error.message.includes('NetworkError')) {
                errorMessage = 'Unable to connect to the server. Please ensure the backend server is running at http://localhost:5000';
            }
            
            setMessage({
                type: 'error',
                content: errorMessage || 'Failed to start onboarding process. Please try again.'
            });
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <>
            <Head>
                <title>Create Your Profile | Nexi</title>
                <meta name="description" content="Set up your wealth management profile" />
            </Head>

            <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
                <div className="max-w-3xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
                    {/* Logo */}
                    <div className="flex justify-center mb-8">
                        <Image
                            src="/Nexi.png"
                            alt="Nexi Logo"
                            width={160}
                            height={53}
                            priority
                            className="h-10 w-auto"
                        />
                    </div>

                    <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-gray-700/50">
                        <div className="p-6 sm:p-8">
                            <div className="text-center">
                                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent mb-4">
                                    Welcome to Your Wealth Journey
                                </h1>
                                <p className="text-lg text-gray-300 mb-8">
                                    Let's create your personalized wealth management profile with our AI-powered assistant
                                </p>
                            </div>

                            <div className="space-y-4 mb-8">
                                <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50">
                                    <h3 className="text-lg font-semibold text-blue-400 mb-2">AI-Powered Analysis</h3>
                                    <p className="text-gray-400 text-sm leading-relaxed">Our AI will analyze your financial goals and create a personalized strategy tailored to your needs.</p>
                                </div>

                                <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50">
                                    <h3 className="text-lg font-semibold text-blue-400 mb-2">Secure & Private</h3>
                                    <p className="text-gray-400 text-sm leading-relaxed">Your data is encrypted and protected with enterprise-grade security measures.</p>
                                </div>

                                <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50">
                                    <h3 className="text-lg font-semibold text-blue-400 mb-2">Quick Setup</h3>
                                    <p className="text-gray-400 text-sm leading-relaxed">Complete your profile in minutes with our streamlined onboarding process.</p>
                                </div>
                            </div>

                            {message.content && (
                                <div className={`mb-6 p-4 rounded-lg ${
                                    message.type === 'error' 
                                        ? 'bg-red-500/10 text-red-200 border border-red-500/20' 
                                        : 'bg-green-500/10 text-green-200 border border-green-500/20'
                                }`}>
                                    {message.content}
                                </div>
                            )}

                            <div className="flex justify-center">
                                <button
                                    onClick={startOnboarding}
                                    disabled={loading}
                                    className={`
                                        w-full sm:w-auto
                                        px-8 py-3 text-base font-medium rounded-xl
                                        bg-gradient-to-r from-blue-600 to-blue-700
                                        text-white shadow-lg
                                        transition-all duration-200
                                        hover:translate-y-[-1px] hover:shadow-lg hover:shadow-blue-500/25
                                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800
                                        disabled:opacity-50 disabled:cursor-not-allowed
                                    `}
                                >
                                    {loading ? 'Starting...' : 'Begin Profile Setup'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
} 