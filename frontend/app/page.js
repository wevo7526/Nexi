"use client";

import Image from 'next/image';
import Head from 'next/head';

export default function Home() {
    return (
        <>
            <Head>
                <title>Welcome</title>
                <meta name="description" content="Welcome to your AI-powered business platform" />
            </Head>
            
            <main className="home">
                <div className="content">
                    <div className="logo-container">
                        <Image
                            src="/Nexi.png"
                            alt="Logo"
                            className="logo"
                            priority={true}
                            width={240}
                            height={80}
                            quality={100}
                        />
                    </div>
                    <div className="button-group">
                        <a href="/auth?redirectTo=/consultant" className="button-link">
                            <button className="button">Consultant</button>
                        </a>
                        <a href="/auth?redirectTo=/wealthmanager" className="button-link">
                            <button className="button">Wealth Manager</button>
                        </a>
                        <a href="/auth?redirectTo=/multiagent" className="button-link">
                            <button className="button">Team</button>
                        </a>
                    </div>
                    <p className="footer">Powered by Langchain + Anthropic</p>
                </div>
            </main>

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
                    gap: 1.25rem;
                }

                .button-link {
                    text-decoration: none;
                    width: 100%;
                }

                .button {
                    width: 100%;
                    padding: 1rem;
                    font-size: 1.125rem;
                    font-weight: 500;
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
                    transform: translateY(-1px);
                }

                .button:active {
                    transform: translateY(0);
                }

                .footer {
                    margin-top: 3rem;
                    color: #666;
                    font-size: 0.875rem;
                    text-align: center;
                    user-select: none;
                }

                @media (max-width: 640px) {
                    .content {
                        padding: 1.5rem;
                    }

                    .logo-container {
                        margin-bottom: 3rem;
                    }

                    .button {
                        padding: 0.875rem;
                        font-size: 1rem;
                        -webkit-touch-callout: none;
                    }

                    .button-group {
                        gap: 1rem;
                    }
                }
            `}</style>
        </>
    );
}

