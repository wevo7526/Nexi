"use client";
import React, { useState } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar"; // Import the Sidebar component
import { CircularProgress, Box, Typography } from "@mui/material";

function MultiAgentConsultant({ initialData }) {
    const [query, setQuery] = useState("");
    const [structuredResponse, setStructuredResponse] = useState(null); // For structured output
    const [loading, setLoading] = useState(false); // Track loading state
    const [currentChat, setCurrentChat] = useState([]); // Track the current chat session

    const handleAskTeam = async () => {
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
                setStructuredResponse(data); // Store structured response
            } else {
                setStructuredResponse(null); // Clear structured response if not valid
            }
            const newChatEntry = { query, answer: data };
            setCurrentChat([...currentChat, newChatEntry]);
        } catch (error) {
            console.error("Error getting answer:", error);
        } finally {
            setLoading(false); // Hide loading spinner
        }
    };

    const renderStructuredOutput = () => {
        if (!structuredResponse || typeof structuredResponse !== "object") return null;

        const { agent1, agent2 } = structuredResponse;

        return (
            <div className="structured-output">
                <Box sx={{ display: "flex", border: "1px solid #ddd", borderRadius: "8px", overflow: "hidden" }}>
                    {/* Agent 1 Section */}
                    {agent1 && (
                        <Box sx={{ flex: 1, padding: "20px", borderRight: "1px solid #ddd" }}>
                            <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold", color: "#333" }}>
                                Strategic Insights (Agent 1)
                            </Typography>
                            <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1 }}>
                                Key Findings:
                            </Typography>
                            <ul>
                                {agent1.keyFindings &&
                                    agent1.keyFindings.map((finding, index) => (
                                        <li key={index}>
                                            <Typography variant="body2">{finding}</Typography>
                                        </li>
                                    ))}
                            </ul>
                            <Typography variant="subtitle1" sx={{ fontWeight: "bold", mt: 2, mb: 1 }}>
                                Strategic Recommendations:
                            </Typography>
                            <ul>
                                {agent1.recommendations &&
                                    agent1.recommendations.map((rec, index) => (
                                        <li key={index}>
                                            <Typography variant="body2">{rec}</Typography>
                                        </li>
                                    ))}
                            </ul>
                        </Box>
                    )}

                    {/* Agent 2 Section */}
                    {agent2 && (
                        <Box sx={{ flex: 1, padding: "20px" }}>
                            <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold", color: "#333" }}>
                                Detailed Research (Agent 2)
                            </Typography>
                            <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1 }}>
                                Supporting Analysis:
                            </Typography>
                            <ul>
                                {agent2.detailedAnalysis &&
                                    agent2.detailedAnalysis.map((analysis, index) => (
                                        <li key={index}>
                                            <Typography variant="body2">{analysis}</Typography>
                                        </li>
                                    ))}
                            </ul>
                        </Box>
                    )}
                </Box>
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
                            className="query-input"
                        />
                        <button onClick={handleAskTeam} disabled={loading} className="ask-team-button">
                            {loading ? <CircularProgress size={20} color="inherit" /> : "Ask Team"}
                        </button>
                    </div>
                    {structuredResponse && renderStructuredOutput()}
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
                .query-input {
                    width: 100%;
                    padding: 10px;
                    border: 1px solid #ddd;
                    border-radius: 5px;
                    margin-bottom: 10px;
                    font-size: 16px;
                }
                .ask-team-button {
                    padding: 10px 20px;
                    border: none;
                    border-radius: 5px;
                    background-color:rgb(11, 11, 11);
                    color: white;
                    font-size: 16px;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                }
                .ask-team-button:hover {
                    background-color:rgb(18, 19, 20);
                }
                .ask-team-button:disabled {
                    background-color: #ccc;
                    cursor: not-allowed;
                }
                .structured-output {
                    margin-top: 20px;
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
