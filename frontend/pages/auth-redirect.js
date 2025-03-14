"use client";

import { useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Image from 'next/image';

export default function AuthRedirect() {
    const router = useRouter();
    const { redirectTo } = router.query; // Get the intended destination

    useEffect(() => {
        const checkSession = async () => {
            const { data: { user }, error } = await supabase.auth.getUser();
            if (error) {
                console.error("Error fetching session:", error);
                router.push('/auth'); // Redirect to auth page on error
                return;
            }
            if (user) {
                // Redirect to intended page or default to "/consultant"
                router.push(redirectTo ? decodeURIComponent(redirectTo) : '/consultant');
            } else {
                router.push('/auth'); // Redirect to auth if no session
            }
        };
        checkSession();
    }, [redirectTo, router]);

    return (
        <>
            <Head>
                <title>Authenticating...</title>
            </Head>
            <div className="redirect-container">
                <div className="content">
                    <div className="logo-container">
                        <Image
                            src="/Nexi.png"
                            alt="Logo"
                            width={180}
                            height={60}
                            priority={true}
                            quality={100}
                        />
                    </div>
                    <div className="spinner-container">
                        <div className="spinner"></div>
                        <p className="message">Authenticating your session...</p>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .redirect-container {
                    min-height: 100vh;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    background: #ffffff;
                }

                .content {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 3rem;
                }

                .logo-container {
                    display: flex;
                    justify-content: center;
                }

                .spinner-container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 1.5rem;
                }

                .spinner {
                    width: 40px;
                    height: 40px;
                    border: 3px solid #f3f3f3;
                    border-top: 3px solid #1a1a1a;
                    border-radius: 50%;
                    animation: spin 1s cubic-bezier(0.76, 0.35, 0.2, 0.7) infinite;
                }

                .message {
                    color: #666;
                    font-size: 1rem;
                    margin: 0;
                    font-weight: 500;
                }

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                @media (max-width: 640px) {
                    .content {
                        gap: 2.5rem;
                        padding: 1.5rem;
                    }

                    .spinner {
                        width: 32px;
                        height: 32px;
                        border-width: 2px;
                    }

                    .message {
                        font-size: 0.875rem;
                    }
                }
            `}</style>
        </>
    );
}
