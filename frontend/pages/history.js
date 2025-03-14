"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar"; // Import the Sidebar component
import { CircularProgress, Typography, Box } from "@mui/material";
import { supabase } from "../lib/supabaseClient"; // Supabase client for authentication
import { useRouter } from "next/router"; // To handle redirection

function History() {
    const [chats, setChats] = useState([]);
    const [loading, setLoading] = useState(true); // Track loading state
    const [error, setError] = useState(null); // Track errors
    const [user, setUser] = useState(null); // User authentication state
    const router = useRouter();

    // Check user session on mount
    useEffect(() => {
        const checkSession = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push(`/auth?redirectTo=/history`); // Redirect to auth if user is not logged in
            } else {
                setUser(user); // Set authenticated user
                fetchChatHistory(user.id); // Fetch chat history for the user
            }
        };
        checkSession();
    }, [router]);

    // Fetch chat history for the user
    const fetchChatHistory = async (userId) => {
        setLoading(true); // Show loading spinner
        setError(null); // Reset error state

        try {
            const { data, error } = await supabase
                .from('chat_history')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) {
                throw error;
            }

            setChats(data);
        } catch (error) {
            console.error("Error fetching chat history:", error);
            setError("Failed to fetch chat history. Please try again.");
        } finally {
            setLoading(false); // Hide loading spinner
        }
    };

    // Show loading state until session is verified
    if (!user) return <p>Loading...</p>;

    return (
        <div className="history">
            <Sidebar /> {/* Render the Sidebar component */}
            <div className="main-content">
                <h1>Chat History</h1>
                {loading && <p>Loading...</p>}
                {error && <p className="error-message">{error}</p>}
                {chats.length > 0 ? (
                    <Box>
                        {chats.map((chat, index) => (
                            <Box key={index} sx={{ mb: 3, p: 2, border: "1px solid #ccc", borderRadius: "8px" }}>
                                <Typography variant="body1" sx={{ color: "#333" }}>
                                    <strong>{chat.role}:</strong> {chat.message}
                                </Typography>
                                <Typography variant="body2" sx={{ color: "#666" }}>
                                    {new Date(chat.created_at).toLocaleString()}
                                </Typography>
                            </Box>
                        ))}
                    </Box>
                ) : (
                    <p>No chat history found.</p>
                )}
            </div>
            <style jsx>{`
                .history {
                    display: flex;
                    flex-direction: row;
                    min-height: 100vh;
                    font-family: "Arial", sans-serif;
                }
                .main-content {
                    flex-grow: 1;
                    padding: 20px;
                }
                .error-message {
                    color: red;
                }
            `}</style>
        </div>
    );
}

export default History;