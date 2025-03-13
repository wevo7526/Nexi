"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar"; // Import the Sidebar component
import Navbar from "../components/Navbar"; // Import the Navbar component
import { CircularProgress, Typography, Box } from "@mui/material";
import { supabase } from "../supabaseClient"; // Supabase client for authentication
import { useRouter } from "next/router"; // To handle redirection

function Consultant({ initialData }) {
    const [query, setQuery] = useState("");
    const [formattedResponse, setFormattedResponse] = useState(null); // Formatted response
    const [loading, setLoading] = useState(false); // Track loading state
    const [file, setFile] = useState(null); // Track selected file
    const [error, setError] = useState(null); // Track errors
    const [user, setUser] = useState(null); // User authentication state
    const router = useRouter();

    // Check user session on mount
    useEffect(() => {
        const checkSession = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push(`/auth?redirectTo=/consultant`); // Redirect to auth if user is not logged in
            } else {
                setUser(user); // Set authenticated user
            }
        };
        checkSession();
    }, [router]);

    // Handle form submission to get answers
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

    // Handle file change event
    const handleFileChange = (event) => {
        const selectedFile = event.target.files[0];
        setFile(selectedFile);
    };

    // Format response content into sections
    const formatResponse = (responseContent) => {
        const sections = responseContent
            .split("\n\n")
            .map((section) => section.trim())
            .filter((section) => section.length > 0);

        return sections;
    };

    // Show loading state until session is verified
    if (!user) return <p>Loading...</p>;

    return (
        <div className="consultant">
            <Sidebar /> {/* Render the Sidebar component */}
            <div className="main-content">
                <Navbar /> {/* Render the Navbar component */}
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
                    margin-top: 20px; /* Add space between the navbar and the query bar */
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