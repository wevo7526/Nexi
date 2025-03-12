"use client";
import React, { useState } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar"; // Import the Sidebar component

function WealthManager({ initialData }) {
    const [query, setQuery] = useState("");
    const [answer, setAnswer] = useState("");
    const [loading, setLoading] = useState(false); // Track loading state
    const [file, setFile] = useState(null); // Track selected file
    const [error, setError] = useState(null); // Track errors

    const handleGetAnswer = async () => {
        setLoading(true); // Show loading spinner
        setError(null); // Reset error state
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
            const newAnswer = {
                role: "assistant",
                content: response.data.answer,
            };
            setAnswer(newAnswer.content);
        } catch (error) {
            console.error("Error getting answer:", error);
            setError("Failed to get an answer. Please try again.");
        } finally {
            setLoading(false); // Hide loading spinner
        }
    };

    const handleFileChange = (event) => {
        const selectedFile = event.target.files[0];
        console.log("Selected file:", selectedFile); // Debugging line
        setFile(selectedFile);
    };

    return (
        <div className="wealth-manager">
            <div className="content">
                {/* Integrate the Sidebar component */}
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
                        {loading ? <p>Loading...</p> : <p>{answer}</p>}
                        {error && <p className="error-message">{error}</p>}
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
                    flex: 1;
                }
                .main-content {
                    flex-grow: 1;
                    padding: 20px;
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

export async function getServerSideProps() {
    // Fetch initial data for the page
    const initialData = {}; // Replace with actual data fetching logic if needed
    return { props: { initialData } };
}

export default WealthManager;
