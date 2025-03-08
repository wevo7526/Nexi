"use client";

import Link from "next/link";

export default function Home() {
    return (
        <div className="home">
            <h1 className="title">Nexi AI</h1>
            <div className="button-group">
                <Link href="/consultant">
                    <button className="button">Consultant</button>
                </Link>
                <Link href="/wealthmanager">
                    <button className="button">Wealth Manager</button>
                </Link>
            </div>
            {/* Footer has been moved */}
            <p className="footer">Powered by Langchain + Anthropic</p>
            <style jsx>{`
                .home {
                    background-color: #f7f8fa; /* Light gray background */
                    min-height: 100vh;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    font-family: "Arial", sans-serif;
                    text-align: center;
                }

                .title {
                    font-size: 3rem;
                    color: #000;
                    margin-bottom: 50px;
                }

                .button-group {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 20px;
                    margin-bottom: 20px; /* Added space between buttons and footer */
                }

                .button {
                    padding: 20px 40px;
                    font-size: 1.5rem;
                    color: #000;
                    background-color: transparent;
                    border: 2px solid #000;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: transform 0.3s ease, background-color 0.3s ease, color 0.3s ease;
                }

                .button:hover {
                    background-color: #000;
                    color: #fff;
                    transform: scale(1.1);
                }

                .button:active {
                    transform: scale(0.95);
                }

                .footer {
                    margin-top: 220px; /* Adds spacing above footer */
                    font-size: 1rem;
                    color: #665;
                }
            `}</style>
        </div>
    );
}
