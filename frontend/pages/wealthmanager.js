"use client";
import React, { useState } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar"; // Assuming Sidebar exists for navigation
import VisualDashboard from "../components/VisualDashboard"; // For rendering charts and graphs

function WealthManager({ initialData }) {
    const [query, setQuery] = useState("");
    const [answer, setAnswer] = useState(null); // Holds the structured backend response
    const [loading, setLoading] = useState(false); // Tracks loading state
    const [file, setFile] = useState(null); // Tracks uploaded files
    const [error, setError] = useState(null); // Tracks errors

    const handleGetAnswer = async () => {
        setLoading(true);
        setError(null);
        const formData = new FormData();
        formData.append("query", query);
        formData.append("thread_id", "default");
        if (file) {
            formData.append("file", file);
        }

        try {
            const response = await axios.post("http://127.0.0.1:5000/get_wealth_answer", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });
            console.log("Response from backend:", response.data); // Log for debugging
            if (response.data && response.data.answer) {
                setAnswer(response.data.answer); // Update the structured response
            } else {
                throw new Error("Backend returned no data.");
            }
        } catch (err) {
            console.error("Error fetching response:", err);
            setError("Failed to fetch data from the backend. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (event) => {
        const selectedFile = event.target.files[0];
        setFile(selectedFile);
    };

    return (
        <div className="wealth-manager">
            <div className="content">
                <Sidebar />
                <div className="main-content">
                    <div className="query-section">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Enter your query..."
                            className="query-input"
                        />
                        <input
                            type="file"
                            accept=".csv,.xlsx,.docx,.pdf,.ppt,.pptx"
                            onChange={handleFileChange}
                            className="file-input"
                        />
                        <button onClick={handleGetAnswer} className="submit-button">
                            Submit
                        </button>
                    </div>
                    <div className="response-section">
                        {loading ? (
                            <p>Loading... Please wait while we process your request.</p>
                        ) : error ? (
                            <p className="error-message">{error}</p>
                        ) : answer ? (
                            <>
                                {/* Portfolio Insights */}
                                <h3>Portfolio Insights</h3>
                                {answer.visual_data?.portfolio_performance?.length > 0 ||
                                (answer.visual_data?.allocations?.labels.length > 0 &&
                                    answer.visual_data?.allocations?.values.length > 0) ? (
                                    <VisualDashboard data={answer} />
                                ) : (
                                    <p>No portfolio insights to display.</p>
                                )}
                            </>
                        ) : (
                            <p>No data available. Submit a query to get started.</p>
                        )}
                    </div>
                </div>
            </div>
            <style jsx>{`
                .wealth-manager {
                    display: flex;
                    flex-direction: column;
                    min-height: 100vh;
                    background-color: var(--background);
                    font-family: "Geist", sans-serif;
                }
                .content {
                    display: flex;
                    flex-direction: row;
                    flex-grow: 1;
                }
                .main-content {
                    flex-grow: 1;
                    padding: 20px;
                    background-color: var(--content-background);
                }
                .query-section {
                    display: flex;
                    align-items: center;
                    margin-bottom: 20px;
                }
                .query-input {
                    flex: 1;
                    padding: 10px;
                    font-size: 16px;
                    border: 1px solid #ccc;
                    border-radius: 4px;
                    margin-right: 10px;
                }
                .file-input {
                    margin-right: 10px;
                }
                .submit-button {
                    padding: 10px 20px;
                    font-size: 16px;
                    background-color: #0070f3;
                    color: #fff;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                }
                .submit-button:hover {
                    background-color: #005bb5;
                }
                .response-section {
                    padding: 20px;
                    background-color: #fff;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    min-height: 300px;
                }
                .error-message {
                    color: red;
                    margin-top: 10px;
                }
            `}</style>
        </div>
    );
}

export default WealthManager;
