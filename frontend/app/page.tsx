"use client";

import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
    return (
        <main className="home">
            <div className="content">
                <div className="logo-container">
                    <Image
                        src="/logo.png"
                        alt="Logo"
                        className="logo"
                        priority={true}
                        width={240}
                        height={80}
                        quality={100}
                    />
                </div>
                <div className="button-group">
                    <Link href="/auth?redirectTo=/consultant" className="button-link">
                        <button className="button">Enter</button>
                    </Link>
                </div>
                <p className="footer">Powered by Langchain + Anthropic</p>
            </div>

            <style jsx>{`
                .home {
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
                    max-width: 480px;
                    width: 100%;
                    padding: 2rem;
                }

                .logo-container {
                    margin-bottom: 4rem;
                    display: flex;
                    justify-content: center;
                }

                .button-group {
                    display: flex;
                    flex-direction: column;
                    align-items: stretch;
                    width: 100%;
                    max-width: 200px;
                }

                .button-link {
                    text-decoration: none;
                    width: 100%;
                }

                .button {
                    width: 100%;
                    padding: 1.25rem;
                    font-size: 1.25rem;
                    font-weight: 600;
                    color: #1a1a1a;
                    background: #ffffff;
                    border: 2px solid #1a1a1a;
                    border-radius: 12px;
                    cursor: pointer;
                    transition: transform 0.2s ease, background-color 0.2s ease, color 0.2s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0;
                    -webkit-tap-highlight-color: transparent;
                }

                .button:hover {
                    background: #1a1a1a;
                    color: white;
                    transform: translateY(-2px);
                }

                .button:active {
                    transform: translateY(0);
                }

                .footer {
                    margin-top: 2rem;
                    font-size: 0.875rem;
                    color: #666;
                }
            `}</style>
        </main>
    );
} 