"use client";

import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useRouter } from 'next/router';

export default function Auth() {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const router = useRouter();
    const { redirectTo } = router.query; // Capture redirect destination

    const handleMagicLinkSignIn = async () => {
        setMessage('');
        try {
            const { error } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth-redirect?redirectTo=${encodeURIComponent(redirectTo || '/consultant')}`,
                },
            });
            if (error) {
                setMessage(`Error: ${error.message}`);
            } else {
                setMessage('Check your email for the Magic Link to log in!');
            }
        } catch (err) {
            setMessage(`Error: ${err.message}`);
        }
    };

    return (
        <div className="auth-container">
            <div className="card">
                <h2>Welcome Back</h2>
                <p>Enter your email to receive a Magic Link to log in:</p>
                <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="email-input"
                />
                <button onClick={handleMagicLinkSignIn} className="sign-in-button">
                    Send Magic Link
                </button>
                {message && <p className="message">{message}</p>}
            </div>
            <style jsx>{`
                .auth-container {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                    background-color: #f7f8fa;
                    font-family: Arial, sans-serif;
                }
                .card {
                    background: #fff;
                    padding: 30px;
                    border-radius: 8px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    text-align: center;
                    max-width: 400px;
                    width: 100%;
                }
                .email-input {
                    width: 90%;
                    padding: 10px;
                    border: 1px solid #ddd;
                    border-radius: 5px;
                    font-size: 16px;
                    margin-bottom: 20px;
                }
                .sign-in-button {
                    width: 100%;
                    padding: 10px;
                    background-color:rgb(11, 11, 11);
                    color: #fff;
                    border: none;
                    border-radius: 5px;
                    font-size: 16px;
                    cursor: pointer;
                    transition: background-color 0.3s;
                }
                .sign-in-button:hover {
                    background-color:rgb(109, 113, 117);
                }
                .message {
                    margin-top: 20px;
                    color:rgb(15, 15, 16);
                }
            `}</style>
        </div>
    );
}
