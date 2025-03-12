"use client";

export default function Home() {
    return (
        <div className="home">
            <img
                src="/Nexi.png"
                alt="Nexi Logo"
                className="logo"
            />
            <div className="button-group">
                <a href="/auth?redirectTo=/consultant">
                    <button className="button">Consultant</button>
                </a>
                <a href="/auth?redirectTo=/wealthmanager">
                    <button className="button">Wealth Manager</button>
                </a>
                <a href="/auth?redirectTo=/multiagent">
                    <button className="button">Team</button>
                </a>
            </div>
            <p className="footer">Powered by Langchain + Anthropic</p>
            <style jsx>{`
                .home {
                    background-color: #ffffff;
                    min-height: 100vh;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    text-align: center;
                }
                .logo {
                    max-width: 200px;
                    height: auto;
                    margin-bottom: 50px;
                }
                .button-group {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 20px;
                }
                .button {
                    padding: 20px 40px;
                    font-size: 1.5rem;
                    color: #000;
                    border: 2px solid #000;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                .button:hover {
                    background-color: #000;
                    color: #fff;
                }
                .footer {
                    margin-top: 50px;
                    color: #665;
                }
            `}</style>
        </div>
    );
}
