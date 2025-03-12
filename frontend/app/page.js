"use client";

import Link from "next/link";

export default function Home() {
    return (
        <div className="home">
            {/* Logo at the top */}
            <img
                src="/Nexi.png" // Path to your logo in the public directory
                alt="Nexi Logo"
                className="logo"
            />
            <div className="button-group">
                <Link href="/consultant">
                    <button className="button">Consultant</button>
                </Link>
                <Link href="/wealthmanager">
                    <button className="button">Wealth Manager</button>
                </Link>
                <Link href="/multiagent">
                    <button className="button">Team</button> {/* New button */}
                </Link>
            </div>
            {/* Footer Section */}
            <p className="footer">Powered by Langchain + Anthropic</p>
            <style jsx>{`
                .home {
                    background-color: #ffffff; /* Light gray background */
                    min-height: 100vh;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    font-family: "Arial", sans-serif;
                    text-align: center;
                }

                .logo {
                    max-width: 200px; /* Restrict the logo's width */
                    height: auto; /* Maintain aspect ratio */
                    margin-bottom: 50px; /* Space below the logo */
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
