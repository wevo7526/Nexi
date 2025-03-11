import React from "react";

function ChatHistory({ chatHistory, onSelectChat, onNewChat }) {
    return (
        <div className="chat-history">
            <div className="header">
                <h2>Chat History</h2>
                <button className="new-chat-button" onClick={onNewChat}>+</button>
            </div>
            {chatHistory.length > 0 ? (
                <ul className="history-list">
                    {chatHistory.map((entry, index) => (
                        <li key={index} className="history-item" onClick={() => onSelectChat(index)}>
                            <strong>Chat {index + 1}:</strong> {entry.query}
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="no-history">No chat history yet.</p>
            )}

            <style jsx>{`
                .chat-history {
                    width: 250px;
                    padding: 20px;
                    overflow-y: auto;
                }

                .header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .new-chat-button {
                    background: none;
                    border: none;
                    font-size: 1.5rem;
                    cursor: pointer;
                    color: #0070f3;
                }

                .history-list {
                    list-style-type: none;
                    padding: 0;
                }

                .history-item {
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    padding: 10px;
                    margin-bottom: 10px;
                    font-size: 0.9rem;
                    color: #333;
                    cursor: pointer;
                }

                .history-item:hover {
                    background-color: #f0f0f0;
                }

                .no-history {
                    font-size: 0.9rem;
                    color: #666;
                    text-align: center;
                }
            `}</style>
        </div>
    );
}

export default ChatHistory;