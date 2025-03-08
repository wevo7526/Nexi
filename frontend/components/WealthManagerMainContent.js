import React from "react";

function WealthManagerMainContent({ query, setQuery, answer, loading, handleGetAnswer }) {
    return (
        <div className="main-content">
            <h1 className="title">Wealth Manager</h1>
            <div className="input-group">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Enter your query"
                    className="input"
                />
                <button onClick={handleGetAnswer} className="button" disabled={loading}>
                    Ask Agent
                </button>
            </div>
            {loading && <div className="spinner"></div>} {/* Loading spinner */}
            <div className="output-section">
                <h2>Answer:</h2>
                <p className="output">{answer || "No answer yet."}</p>
            </div>

            <style jsx>{`
                .main-content {
                    flex: 1;
                    padding: 20px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }

                .title {
                    font-size: 3rem;
                    color: #000;
                    margin-bottom: 30px;
                }

                .input-group {
                    display: flex;
                    gap: 10px;
                    margin-bottom: 20px;
                    width: 100%;
                    max-width: 600px;
                }

                .input {
                    flex: 1;
                    padding: 15px;
                    font-size: 1.2rem;
                    border: 2px solid #000;
                    border-radius: 8px;
                    outline: none;
                    transition: all 0.3s ease;
                }

                .input:focus {
                    border-color: #0078d7;
                    box-shadow: 0 0 5px rgba(0, 120, 215, 0.5);
                }

                .button {
                    padding: 15px 30px;
                    font-size: 1.2rem;
                    color: #000;
                    background-color: transparent;
                    border: 2px solid #000;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: transform 0.3s ease, background-color 0.3s ease, color 0.3s ease;
                }

                .button:disabled {
                    background-color: #a1c2e8;
                    cursor: not-allowed;
                }

                .button:hover:not(:disabled) {
                    background-color: #000;
                    color: #fff;
                    transform: scale(1.1);
                }

                .button:active {
                    transform: scale(0.95);
                }

                .spinner {
                    margin: 20px auto;
                    width: 40px;
                    height: 40px;
                    border: 4px solid rgba(0, 120, 215, 0.3);
                    border-top-color: #0078d7;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    0% {
                        transform: rotate(0deg);
                    }
                    100% {
                        transform: rotate(360deg);
                    }
                }

                .output-section {
                    margin-top: 20px;
                    text-align: left;
                    width: 100%;
                    max-width: 600px;
                }

                .output {
                    padding: 15px;
                    background-color: #f9f9f9;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    font-size: 1rem;
                    color: #333;
                }
            `}</style>
        </div>
    );
}

export default WealthManagerMainContent;