"use client";

import React, { useState, useEffect, useRef } from "react";
import {
    Box,
    Paper,
    TextField,
    Button,
    Typography,
    CircularProgress,
    Alert,
} from "@mui/material";
import { createClient } from '@supabase/supabase-js';
import Sidebar from "../../components/Sidebar";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

function ProfileCreation() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [userId, setUserId] = useState(null);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        checkAuth();
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const checkAuth = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            setUserId(user.id);
            // Start the conversation
            handleSendMessage("Hi, I'd like to create my wealth management profile.");
        }
    };

    const handleSendMessage = async (messageText) => {
        if (!messageText.trim()) return;

        setLoading(true);
        setError(null);

        // Add user message to chat
        const userMessage = { type: 'user', content: messageText };
        setMessages(prev => [...prev, userMessage]);
        setInput('');

        try {
            const response = await fetch(`${API_URL}/api/onboarding/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    user_id: userId,
                    message: messageText
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Add AI response to chat
            const aiMessage = { 
                type: 'assistant', 
                content: data.response,
                profileData: data.profile_data,
                isComplete: data.is_complete
            };
            setMessages(prev => [...prev, aiMessage]);

            if (data.is_complete) {
                // Add completion message
                setMessages(prev => [...prev, {
                    type: 'system',
                    content: 'Profile creation complete! Your information has been saved.'
                }]);
            }

        } catch (err) {
            console.error('API Error:', err);
            setError(err.message || 'Failed to communicate with the server');
            setMessages(prev => [...prev, {
                type: 'system',
                content: 'Sorry, there was an error processing your message. Please try again.'
            }]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage(input);
        }
    };

    const renderMessage = (message, index) => {
        const isUser = message.type === 'user';
        const isSystem = message.type === 'system';

        return (
            <Box
                key={index}
                sx={{
                    display: 'flex',
                    justifyContent: isUser ? 'flex-end' : 'flex-start',
                    mb: 2
                }}
            >
                <Paper
                    sx={{
                        p: 2,
                        maxWidth: '70%',
                        bgcolor: isSystem ? 'info.light' : 
                                isUser ? 'primary.light' : 'background.paper',
                        color: isUser ? 'white' : 'text.primary'
                    }}
                >
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                        {message.content}
                    </Typography>
                </Paper>
            </Box>
        );
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Box sx={{ display: 'flex', flexDirection: 'row', flexGrow: 1 }}>
                <Sidebar />
                <Box sx={{ 
                    flexGrow: 1, 
                    p: 3, 
                    display: 'flex', 
                    flexDirection: 'column',
                    height: '100vh'
                }}>
                    <Typography variant="h4" gutterBottom sx={{ fontWeight: 500 }}>
                        Create Wealth Management Profile
                    </Typography>

                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <Paper 
                        sx={{ 
                            p: 3,
                            flexGrow: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            maxHeight: 'calc(100vh - 200px)',
                            mb: 2
                        }}
                    >
                        <Box sx={{ 
                            flexGrow: 1, 
                            overflowY: 'auto',
                            mb: 2
                        }}>
                            {messages.map((message, index) => renderMessage(message, index))}
                            <div ref={messagesEndRef} />
                        </Box>

                        <Box sx={{ 
                            display: 'flex', 
                            gap: 2,
                            mt: 'auto'
                        }}>
                            <TextField
                                fullWidth
                                multiline
                                maxRows={4}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Type your message..."
                                disabled={loading}
                            />
                            <Button
                                variant="contained"
                                onClick={() => handleSendMessage(input)}
                                disabled={loading || !input.trim()}
                                sx={{ minWidth: '80px', height: '40px' }}
                            >
                                {loading ? (
                                    <CircularProgress size={20} sx={{ color: 'inherit' }} />
                                ) : (
                                    'Send'
                                )}
                            </Button>
                        </Box>
                    </Paper>
                </Box>
            </Box>
        </Box>
    );
}

export default ProfileCreation; 