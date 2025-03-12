"use client";
import React, { useState } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar"; // Import the Sidebar component
import { CircularProgress, Typography, Box } from "@mui/material";

function Consultant({ initialData }) {
    const [query, setQuery] = useState("");
    const [formattedResponse, setFormattedResponse] = useState(null); // Formatted response
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
            const response = await axios.post("http://127.0.0.1:5000/get_answer", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            const content = response.data.answer;
            const formatted = formatResponse(content); // Clean up and structure the response
            setFormattedResponse(formatted);
        } catch (error) {
            console.error("Error getting answer:", error);
            setError("Failed to get an answer. Please try again.");
        } finally {
            setLoading(false); // Hide loading spinner
        }
    };

    const handleFileChange = (event) => {
        const selectedFile = event.target.files[0];
        setFile(selectedFile);
    };

    const formatResponse = (responseContent) => {
        // Example logic: Split into clean sections with headers if the output has delimited parts
        const sections = responseContent
            .split("\n\n") // Separate by double line breaks
            .map((section) => section.trim()) // Clean up white spaces
            .filter((section) => section.length > 0); // Remove empty sections

        return sections;
    };

    return (
        <div className="consultant">
            <Sidebar /> {/* Render the Sidebar component */}
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
                        accept=".docx,.pdf,.xls,.xlsx,.ppt,.pptx"
                        onChange={handleFileChange}
                        className="file-input"
                    />
                    <button onClick={handleGetAnswer} className="submit-button">
                        {loading ? <CircularProgress size={20} color="inherit" /> : "Submit"}
                    </button>
                </div>

                {/* Response Section */}
                <div className="response-section">
                    {loading && <p>Loading...</p>}
                    {error && <p className="error-message">{error}</p>}
                    {formattedResponse && (
                        <Box>
                            {formattedResponse.map((section, index) => (
                                <Box key={index} sx={{ mb: 3, p: 2, border: "1px solid #ccc", borderRadius: "8px" }}>
                                    <Typography variant="body1" sx={{ color: "#333" }}>
                                        {section}
                                    </Typography>
                                </Box>
                            ))}
                        </Box>
                    )}
                </div>
            </div>
            <style jsx>{`
                .consultant {
                    display: flex;
                    flex-direction: row;
                    min-height: 100vh;
                    font-family: "Arial", sans-serif;
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
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .submit-button:hover {
                    background-color: #005bb5;
                }
                .response-section {
                    margin-top: 20px;
                }
                .error-message {
                    color: red;
                }
            `}</style>
        </div>
    );
}

export async function getServerSideProps() {
    // Fetch initial data for the page
    const initialData = {}; // Replace with actual data fetching logic
    return { props: { initialData } };
}

export default Consultant;
