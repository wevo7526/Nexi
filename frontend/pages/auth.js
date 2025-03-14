"use client";

import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Head from 'next/head';

export default function Auth() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', content: '' });
    const router = useRouter();
    const { redirectTo } = router.query;

    const validateEmail = (email) => {
        return email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    };

    const handleMagicLinkSignIn = async (e) => {
        e.preventDefault();
        setMessage({ type: '', content: '' });

        if (!email) {
            setMessage({ type: 'error', content: 'Please enter your email address.' });
            return;
        }

        if (!validateEmail(email)) {
            setMessage({ type: 'error', content: 'Please enter a valid email address.' });
            return;
        }

        setIsLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth-redirect?redirectTo=${encodeURIComponent(redirectTo || '/consultant')}`,
                },
            });
            
            if (error) throw error;
            
            setMessage({
                type: 'success',
                content: 'Check your email for the magic link to log in!'
            });
            setEmail('');
        } catch (err) {
            setMessage({
                type: 'error',
                content: err.message || 'An error occurred while sending the magic link.'
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <Head>
                <title>Sign In</title>
                <meta name="description" content="Sign in to your account" />
            </Head>

            <div className="auth-page">
                <div className="auth-container">
                    <div className="left-panel">
                        <div className="logo">
                            <Image
                                src="/Nexi.png"
                                alt="Logo"
                                width={300}
                                height={100}
                                priority
                            />
                        </div>
                    </div>

                    <div className="right-panel">
                        <div className="auth-card">
                            <h1>Sign In</h1>
                            <p className="subtitle">Enter your email to receive a secure magic link</p>

                            <form onSubmit={handleMagicLinkSignIn} className="auth-form">
                                <div className="form-group">
                                    <label htmlFor="email">Email address</label>
                                    <input
                                        id="email"
                                        type="email"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        disabled={isLoading}
                                        className="email-input"
                                        autoComplete="email"
                                        autoFocus
                                    />
                                </div>

                                {message.content && (
                                    <div className={`message ${message.type}`}>
                                        <span className="message-icon">
                                            {message.type === 'success' ? '✓' : '!'}
                                        </span>
                                        {message.content}
                                    </div>
                                )}

                                <button 
                                    type="submit" 
                                    className={`sign-in-button ${isLoading ? 'loading' : ''}`}
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <span className="loading-spinner"></span>
                                            Sending link...
                                        </>
                                    ) : (
                                        'Continue with Email'
                                    )}
                                </button>
                            </form>

                            <div className="divider">
                                <span>Protected by AI</span>
                            </div>

                            <p className="help-text">
                                By continuing, you agree to our <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .auth-page {
                    min-height: 100vh;
                    background: #ffffff;
                }

                .auth-container {
                    display: flex;
                    min-height: 100vh;
                }

                .left-panel {
                    flex: 1;
                    background: #ffffff;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .logo {
                    text-align: center;
                }

                .right-panel {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 2rem;
                    background: #1a1a1a;
                }

                .auth-card {
                    width: 100%;
                    max-width: 420px;
                    padding: 2.5rem;
                    background: #1a1a1a;
                    border-radius: 24px;
                    color: white;
                }

                h1 {
                    margin: 0;
                    font-size: 2rem;
                    font-weight: 700;
                    color: white;
                    letter-spacing: -0.5px;
                }

                .subtitle {
                    color: #e0e0e0;
                    margin: 0.75rem 0 2rem;
                    font-size: 1.125rem;
                }

                .auth-form {
                    margin-bottom: 2rem;
                }

                .form-group {
                    margin-bottom: 1.5rem;
                    width: 100%;
                }

                label {
                    display: block;
                    margin-bottom: 0.5rem;
                    color: white;
                    font-size: 0.875rem;
                    font-weight: 600;
                }

                .email-input {
                    width: 100%;
                    padding: 1rem;
                    border: none;
                    border-radius: 12px;
                    font-size: 1rem;
                    transition: all 0.2s ease;
                    background: #333;
                    color: white;
                    box-sizing: border-box;
                    height: 48px;
                }

                .email-input::placeholder {
                    color: #888;
                }

                .email-input:focus {
                    outline: none;
                    background: #404040;
                }

                .email-input:disabled {
                    background-color: #282828;
                    cursor: not-allowed;
                }

                .sign-in-button {
                    width: 100%;
                    padding: 1rem;
                    background: #333;
                    color: white;
                    border: none;
                    border-radius: 12px;
                    font-size: 1rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    height: 48px;
                    box-sizing: border-box;
                }

                .sign-in-button:hover:not(:disabled) {
                    background: #404040;
                }

                .sign-in-button:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                }

                .loading-spinner {
                    width: 20px;
                    height: 20px;
                    border: 2px solid rgba(255, 255, 255, 0.3);
                    border-radius: 50%;
                    border-top-color: white;
                    animation: spin 0.8s linear infinite;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                .message {
                    margin-bottom: 1.5rem;
                    padding: 1rem;
                    border-radius: 12px;
                    font-size: 0.875rem;
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }

                .message-icon {
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 600;
                    flex-shrink: 0;
                }

                .message.error {
                    background-color: rgba(229, 62, 62, 0.1);
                    color: #feb2b2;
                    border: 1px solid rgba(229, 62, 62, 0.2);
                }

                .message.error .message-icon {
                    background-color: #e53e3e;
                    color: white;
                }

                .message.success {
                    background-color: rgba(56, 161, 105, 0.1);
                    color: #9ae6b4;
                    border: 1px solid rgba(56, 161, 105, 0.2);
                }

                .message.success .message-icon {
                    background-color: #38a169;
                    color: white;
                }

                .divider {
                    position: relative;
                    text-align: center;
                    margin: 1.5rem 0;
                }

                .divider::before {
                    content: '';
                    position: absolute;
                    left: 0;
                    top: 50%;
                    width: 100%;
                    height: 1px;
                    background: #333;
                }

                .divider span {
                    position: relative;
                    background: #1a1a1a;
                    padding: 0 1rem;
                    color: #888;
                    font-size: 0.875rem;
                }

                .help-text {
                    text-align: center;
                    color: #888;
                    font-size: 0.875rem;
                    margin: 0;
                }

                .help-text a {
                    color: white;
                    text-decoration: none;
                    font-weight: 500;
                }

                .help-text a:hover {
                    text-decoration: underline;
                }

                @media (max-width: 1024px) {
                    .left-panel {
                        display: none;
                    }

                    .right-panel {
                        padding: 1.5rem;
                    }

                    .auth-card {
                        padding: 2rem;
                    }
                }

                @media (max-width: 480px) {
                    .right-panel {
                        padding: 1rem;
                    }

                    .auth-card {
                        padding: 1.5rem;
                    }

                    h1 {
                        font-size: 1.75rem;
                    }

                    .subtitle {
                        font-size: 1rem;
                    }
                }
            `}</style>
        </>
    );
}
