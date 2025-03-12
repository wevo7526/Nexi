"use client";
import React, { useState } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar"; // Import the Sidebar component

function MultiAgentConsultant({ initialData }) {
    const [query, setQuery] = useState("");
    const [structuredResponse, setStructuredResponse] = useState(null); // For structured output
    const [loading, setLoading] = useState(false); // Track loading state
    const [currentChat, setCurrentChat] = useState([]); // Track the current chat session

    const handleGetAnswer = async () => {
        setLoading(true); // Show loading spinner
        try {
            const response = await axios.post("http://127.0.0.1:5000/get_multi_agent_answer", {
                query: query,
                chat_history: currentChat.map((chat) => ({
                    role: "user",
                    content: chat.query,
                })),
                thread_id: "default",
            });

            const data = response.data.answer; // Backend response is structured
            if (typeof data === "object") {
                // Validate if structured response is an object
                setStructuredResponse(data);
            } else {
                setStructuredResponse(null); // Clear structured response
            }
            const newChatEntry = { query, answer: data };
            setCurrentChat([...currentChat, newChatEntry]);
        } catch (error) {
            console.error("Error getting answer:", error);
        } finally {
            setLoading(false); // Hide loading spinner
        }
    };

    const handleFileChange = (event) => {
        const selectedFile = event.target.files[0];
        console.log("Selected file:", selectedFile); // Debugging line
    };

    const handleNewChat = () => {
        setQuery("");
        setStructuredResponse(null);
        setCurrentChat([]);
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
                        border-radius: 10px;
                        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                    }
                    .agent-section {
                        margin-bottom: 20px;
                    }
                    .section-content {
                        padding: 15px;
                        border-radius: 8px;
                    }
                    h2 {
                        color: #333;
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
                {/* Sidebar Component */}
                <Sidebar />
                <div className="main-content">
                    <div className="query-section">
                        <textarea
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Enter your query here..."
                            rows="4"
                        />
                        <button onClick={handleGetAnswer} disabled={loading}>
                            {loading ? "Loading..." : "Get Answer"}
                        </button>
                    </div>
                    {renderStructuredOutput()}
                </div>
            </div>
            <style jsx>{`
                .multi-agent-consultant {
                    display: flex;
                    flex-direction: column;
                    min-height: 100vh;
                    font-family: "Arial", sans-serif;
                }
                .content {
                    display: flex;
                    flex: 1;
                    padding: 20px;
                }
                .main-content {
                    flex-grow: 1;
                    padding: 20px;
                }
                .query-section {
                    display: flex;
                    flex-direction: column;
                    margin-bottom: 20px;
                }
                textarea {
                    width: 100%;
                    padding: 10px;
                    border: 1px solid #ddd;
                    border-radius: 5px;
                    margin-bottom: 10px;
                    font-size: 16px;
                }
                button {
                    padding: 10px 20px;
                    border: none;
                    border-radius: 5px;
                    background-color: #0070f3;
                    color: white;
                    font-size: 16px;
                    cursor: pointer;
                }
                button:disabled {
                    background-color: #ccc;
                    cursor: not-allowed;
                }
                .structured-output {
                    margin-top: 20px;
                }
                .agent-section {
                    margin-bottom: 20px;
                }
                .section-content {
                    padding: 15px;
                    border-radius: 8px;
                }
                h2 {
                    color: #333;
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
    const initialData = {}; // Replace with actual data fetching logic if needed
    return { props: { initialData } };
}

export default MultiAgentConsultant;
