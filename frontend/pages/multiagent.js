"use client";
import React, { useState } from "react";
import axios from "axios";
import ChatHistory from "../components/ChatHistory";
import MainContent from "../components/MainContent";

function MultiAgentConsultant({ initialData }) {
    const [query, setQuery] = useState("");
    const [structuredResponse, setStructuredResponse] = useState(null); // For structured output
    const [chatHistory, setChatHistory] = useState(initialData.chatHistory || []);
    const [loading, setLoading] = useState(false); // Track loading state
    const [answer, setAnswer] = useState(""); // Track the answer state

    const handleGetAnswer = async () => {
        setLoading(true); // Show loading spinner
        try {
            const response = await axios.post("http://127.0.0.1:5000/get_multi_agent_answer", {
                query: query,
                chat_history: chatHistory.map((chat) => ({
                    role: "user",
                    content: chat.query,
                })),
                thread_id: "default",
            });

            const data = response.data.answer; // Backend response is structured
            if (typeof data === "object") {
                // Validate if structured response is an object
                setStructuredResponse(data);
                setAnswer(""); // Clear plain answer state
            } else {
                setAnswer(data); // Handle fallback to plain answer if needed
                setStructuredResponse(null); // Clear structured response
            }
            setChatHistory([...chatHistory, { query, answer: data }]);
        } catch (error) {
            console.error("Error getting answer:", error);
        } finally {
            setLoading(false); // Hide loading spinner
        }
    };

    const handleSelectChat = (index) => {
        const selectedChat = chatHistory[index];
        setQuery(selectedChat.query);
        setStructuredResponse(selectedChat.answer); // Assumes structured data
    };

    const renderStructuredOutput = () => {
        if (!structuredResponse || typeof structuredResponse !== "object") return null;

        const { agent1, agent2 } = structuredResponse;

        return (
            <div className="structured-output">
                {/* Agent 1 Section */}
                {agent1 && (
                    <div className="agent-section">
                        <h2>Strategic Insights (Agent 1)</h2>
                        <div className="section-content">
                            <h3>Key Findings:</h3>
                            <ul>
                                {agent1.keyFindings &&
                                    agent1.keyFindings.map((finding, index) => (
                                        <li key={index}>{finding}</li>
                                    ))}
                            </ul>
                            <h3>Strategic Recommendations:</h3>
                            <ul>
                                {agent1.recommendations &&
                                    agent1.recommendations.map((rec, index) => (
                                        <li key={index}>{rec}</li>
                                    ))}
                            </ul>
                        </div>
                    </div>
                )}

                {/* Agent 2 Section */}
                {agent2 && (
                    <div className="agent-section">
                        <h2>Detailed Research (Agent 2)</h2>
                        <div className="section-content">
                            <h3>Supporting Analysis:</h3>
                            <ul>
                                {agent2.detailedAnalysis &&
                                    agent2.detailedAnalysis.map((analysis, index) => (
                                        <li key={index}>{analysis}</li>
                                    ))}
                            </ul>
                        </div>
                    </div>
                )}

                <style jsx>{`
                    .structured-output {
                        margin: 20px 0;
                        padding: 20px;
                        background: #ffffff;
                        border-radius: 10px;
                        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                    }
                    .agent-section {
                        margin-bottom: 20px;
                    }
                    .section-content {
                        background: #f9f9f9;
                        padding: 15px;
                        border-radius: 8px;
                    }
                    h2 {
                        color: #333;
                        border-bottom: 2px solid #ddd;
                        padding-bottom: 5px;
                    }
                    h3 {
                        margin-top: 10px;
                        color: #555;
                    }
                    ul {
                        list-style: disc;
                        padding-left: 20px;
                    }
                `}</style>
            </div>
        );
    };

    return (
        <div className="multi-agent-consultant">
            <div className="content">
                <div className="sidebar">
                    <ChatHistory
                        chatHistory={chatHistory}
                        onSelectChat={handleSelectChat}
                    />
                </div>
                <div className="main-content">
                    <MainContent
                        query={query}
                        setQuery={setQuery}
                        answer={answer}
                        loading={loading}
                        handleGetAnswer={handleGetAnswer}
                    />
                    {renderStructuredOutput()}
                </div>
            </div>
            <style jsx>{`
                .multi-agent-consultant {
                    display: flex;
                    flex-direction: column;
                    min-height: 100vh;
                    background-color: #f0f2f5;
                    font-family: "Arial", sans-serif;
                }
                .content {
                    display: flex;
                    flex: 1;
                    padding: 20px;
                }
                .sidebar {
                    width: 25%;
                    background-color: #ffffff;
                    padding: 20px;
                    border-right: 1px solid #ddd;
                    overflow-y: auto;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                }
                .main-content {
                    width: 75%;
                    padding: 20px;
                    background-color: #ffffff;
                    border-radius: 10px;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                }
                .structured-output {
                    margin-top: 20px;
                }
                .agent-section {
                    margin-bottom: 20px;
                }
                .section-content {
                    background: #f9f9f9;
                    padding: 15px;
                    border-radius: 8px;
                }
                h2 {
                    color: #333;
                    border-bottom: 2px solid #ddd;
                    padding-bottom: 5px;
                }
                h3 {
                    margin-top: 10px;
                    color: #555;
                }
                ul {
                    list-style: disc;
                    padding-left: 20px;
                }
            `}</style>
        </div>
    );
}

export async function getServerSideProps() {
    const initialData = { chatHistory: [] };
    return { props: { initialData } };
}

export default MultiAgentConsultant;