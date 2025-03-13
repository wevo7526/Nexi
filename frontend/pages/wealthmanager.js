"use client";
import React, { useState } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar"; // Assuming you have a Sidebar component for navigation

function WealthManager({ initialData }) {
    const [query, setQuery] = useState("");
    const [answer, setAnswer] = useState(null); // Stores the structured response
    const [loading, setLoading] = useState(false); // Tracks the loading state
    const [file, setFile] = useState(null); // Stores the uploaded file
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
            setAnswer(response.data.answer); // Sets the structured response
        } catch (error) {
            console.error("Error getting answer:", error);
            setError("Failed to get an answer. Please try again.");
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
                    <h1>Wealth Manager</h1>
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
                            <p>Loading... Please wait while we analyze your data.</p>
                        ) : answer && answer.categories ? (
                            <div>
                                <h3>Analysis Results:</h3>
                                <table className="output-table">
                                    <thead>
                                        <tr>
                                            <th>Category</th>
                                            <th>Details</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {answer.categories.map((category, index) => (
                                            <tr key={index}>
                                                <td>{category.name}</td>
                                                <td>{category.details}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : error ? (
                            <p className="error-message">{error}</p>
                        ) : (
                            <p>No data available.</p>
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
                .output-table {
                    width: 100%;
                    border-collapse: collapse;
                }
                .output-table th,
                .output-table td {
                    border: 1px solid #ddd;
                    padding: 8px;
                }
                .output-table th {
                    background-color: #f4f4f4;
                }
            `}</style>
        </div>
    );
}

export default WealthManager;
