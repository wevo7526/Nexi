import React from "react";

function ChatHistory({ chatHistory, onSelectChat }) {
    return (
        <div className="chat-history">
            <h2>Chat History</h2>
            {chatHistory.length > 0 ? (
                <ul className="history-list">
                    {chatHistory.map((entry, index) => (
                        <li key={index} className="history-item" onClick={() => onSelectChat(index)}>
                            <strong>Query:</strong> {entry.query}
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="no-history">No chat history yet.</p>
            )}

            <style jsx>{`
                .chat-history {
                    width: 250px;
                    background-color: #f7f8fa;
                    padding: 20px;
                    border-right: 1px solid #ddd;
                    overflow-y: auto;
                }

                .history-list {
                    list-style-type: none;
                    padding: 0;
                }

                .history-item {
                    background: #f9f9f9;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    padding: 10px;
                    margin-bottom: 10px;
                    font-size: 0.9rem;
                    color: #333;
                    cursor: pointer;
                }

                .history-item:hover {
                    background-color: #e0e0e0;
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