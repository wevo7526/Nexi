"use client";
import React, { useState, useEffect, useRef, FormEvent } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import { useToast } from "../components/ToastProvider";
import {
    CircularProgress, Typography, Box, Card, Grid, Button,
    IconButton, TextField, Paper, Avatar, Stack,
    LinearProgress, Divider, CardContent, Alert
} from "@mui/material";
import {
    Send,
    TrendingUp,
    BusinessOutlined,
    PeopleOutlined,
    ShowChartOutlined,
    Person,
    SmartToy,
    Psychology,
    Build,
    Search
} from "@mui/icons-material";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/router";
import { api } from '../lib/api';

interface Message {
    role: 'user' | 'assistant' | 'system' | 'thought' | 'action' | 'observation';
    content: string;
}

interface ResearchResponse {
    status?: 'streaming' | 'complete' | 'error';
    type: 'thought' | 'action' | 'observation' | 'final';
    content: string;
}

interface HistoryResponse {
    status: 'success' | 'error';
    history: Array<{
        role: 'human' | 'assistant';
        content: string;
    }>;
}

const researchCategories = [
    { label: 'Market Trends', icon: <TrendingUp />, query: 'Analyze current market trends for' },
    { label: 'Competitor Analysis', icon: <BusinessOutlined />, query: 'Analyze key competitors in' },
    { label: 'Consumer Behavior', icon: <PeopleOutlined />, query: 'Analyze consumer behavior in' },
    { label: 'Market Size', icon: <ShowChartOutlined />, query: 'What is the market size and growth potential for' },
];

const getRoleColor = (role: Message['role']) => {
    switch (role) {
        case 'user':
            return { bg: 'primary.light', text: 'primary.dark' };
        case 'assistant':
            return { bg: 'background.paper', text: 'text.primary' };
        case 'thought':
            return { bg: '#e3f2fd', text: '#1565c0' }; // Light blue for thoughts
        case 'action':
            return { bg: '#e8f5e9', text: '#2e7d32' }; // Light green for actions
        case 'observation':
            return { bg: '#fff3e0', text: '#e65100' }; // Light orange for observations
        default:
            return { bg: 'background.paper', text: 'text.primary' };
    }
};

const getRoleIcon = (role: Message['role']) => {
    switch (role) {
        case 'user':
            return <Person />;
        case 'assistant':
            return <SmartToy />;
        case 'thought':
            return <Psychology sx={{ color: '#1565c0' }} />;
        case 'action':
            return <Build sx={{ color: '#2e7d32' }} />;
        case 'observation':
            return <Search sx={{ color: '#e65100' }} />;
        default:
            return null;
    }
};

export default function MarketResearch() {
    const [query, setQuery] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const { showToast } = useToast();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        const checkSession = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    router.push(`/auth?redirectTo=/market-research`);
                } else {
                    fetchHistory();
                }
            } catch (error) {
                setError('Error checking session');
            }
        };
        checkSession();
    }, [router]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchHistory = async () => {
        try {
            const response = await fetch('/api/market-research/history');
            if (!response.ok) {
                throw new Error('Error fetching history');
            }

            const data: HistoryResponse = await response.json();
            if (data.status === 'success') {
                setMessages(data.history.map(msg => ({
                    role: msg.role === 'human' ? 'user' as const : 'assistant' as const,
                    content: msg.content
                })));
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        setError(null);
        const userMessage: Message = { role: 'user', content: query };
        setMessages(prev => [...prev, userMessage]);
        setQuery('');

        try {
            console.log('Sending request to backend...');
            const response = await fetch('/api/market-research/research', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query: userMessage.content }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Error response:', errorData);
                throw new Error(errorData.message || 'Error getting research results');
            }

            const reader = response.body?.getReader();
            if (!reader) throw new Error('No reader available');

            let buffer = '';
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (!line.trim() || !line.startsWith('data: ')) continue;
                    
                    try {
                        const data: ResearchResponse = JSON.parse(line.slice(6));
                        console.log('Received message:', data);

                        if (data.status === 'error') {
                            console.error('Error in stream:', data.content);
                            setError(data.content);
                            continue;
                        }

                        let role: Message['role'];
                        let content = data.content.trim();

                        // Handle different message types
                        switch (data.type) {
                            case 'thought':
                                role = 'thought';
                                if (!content.toLowerCase().startsWith('thought:')) {
                                    content = `Thought: ${content}`;
                                }
                                break;
                            case 'action':
                                role = 'action';
                                if (!content.toLowerCase().startsWith('action:')) {
                                    content = `Action: ${content}`;
                                }
                                break;
                            case 'observation':
                                role = 'observation';
                                if (!content.toLowerCase().startsWith('observation:')) {
                                    content = `Observation: ${content}`;
                                }
                                break;
                            case 'final':
                                role = 'assistant';
                                if (!content.toLowerCase().startsWith('final answer:')) {
                                    content = `Final Answer: ${content}`;
                                }
                                break;
                            default:
                                console.log('Unknown message type:', data.type);
                                continue;
                        }

                        // Only add non-empty messages
                        if (content.trim()) {
                            const newMessage: Message = { role, content };
                            console.log('Adding message:', newMessage);
                            setMessages(prev => {
                                // Check if this is a continuation of the previous message
                                const lastMessage = prev[prev.length - 1];
                                if (lastMessage && lastMessage.role === role) {
                                    // Update the last message instead of adding a new one
                                    const updatedMessages = [...prev];
                                    updatedMessages[updatedMessages.length - 1] = {
                                        ...lastMessage,
                                        content: lastMessage.content + '\n' + content
                                    };
                                    return updatedMessages;
                                }
                                return [...prev, newMessage];
                            });
                        }
                    } catch (e) {
                        console.error('Error parsing SSE data:', e, '\nRaw line:', line);
                    }
                }
            }
        } catch (err) {
            console.error('Error in handleSubmit:', err);
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const renderMessage = (message: Message, index: number) => {
        const colors = getRoleColor(message.role);
        const icon = getRoleIcon(message.role);

        // Format the content based on the role
        let formattedContent = message.content;
        
        // Ensure proper formatting for each message type
        if (!formattedContent.toLowerCase().startsWith(message.role + ':') && 
            ['thought', 'action', 'observation'].includes(message.role)) {
            formattedContent = `${message.role.charAt(0).toUpperCase() + message.role.slice(1)}: ${formattedContent}`;
        }

        return (
            <Card 
                key={index} 
                sx={{ 
                    mb: 2,
                    bgcolor: colors.bg,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: 3
                    },
                    borderLeft: message.role !== 'user' ? `4px solid ${colors.text}` : 'none'
                }}
            >
                <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Avatar
                            sx={{
                                bgcolor: 'transparent',
                                width: 28,
                                height: 28,
                                mr: 1,
                                '& .MuiSvgIcon-root': {
                                    color: colors.text
                                }
                            }}
                        >
                            {icon}
                        </Avatar>
                        <Typography 
                            variant="caption" 
                            sx={{ 
                                textTransform: 'uppercase', 
                                fontWeight: 'bold',
                                color: colors.text,
                                letterSpacing: '0.5px'
                            }}
                        >
                            {message.role}
                        </Typography>
                    </Box>
                    <Typography 
                        variant="body1" 
                        component="div" 
                        sx={{ 
                            whiteSpace: 'pre-wrap',
                            pl: 4.5,
                            color: 'text.primary',
                            '& code': {
                                bgcolor: 'rgba(0, 0, 0, 0.04)',
                                p: 0.5,
                                borderRadius: 1,
                                fontFamily: 'monospace'
                            },
                            '& ul, & ol': {
                                pl: 2,
                                '& li': {
                                    mb: 1
                                }
                            }
                        }}
                    >
                        {formattedContent}
                    </Typography>
                </CardContent>
            </Card>
        );
    };

    return (
        <div className="market-research">
            <div className="content">
                <Sidebar />
                <div className="main-content">
                    <Box sx={{ mb: 4 }}>
                        <Typography variant="h4" gutterBottom>
                            Market Research
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            Get comprehensive market research and analysis for your business queries.
                        </Typography>
                    </Box>

                    <Card sx={{ mb: 4 }}>
                        <CardContent>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <Paper
                                        component="form"
                                        onSubmit={handleSubmit}
                                        sx={{
                                            p: 2,
                                            display: 'flex',
                                            alignItems: 'center',
                                            border: '1px solid',
                                            borderColor: 'divider',
                                            borderRadius: 2
                                        }}
                                    >
                                        <TextField
                                            fullWidth
                                            value={query}
                                            onChange={(e) => setQuery(e.target.value)}
                                            placeholder="Enter your market research query..."
                                            disabled={loading}
                                            sx={{ mr: 2 }}
                                        />
                                        <Button
                                            type="submit"
                                            variant="contained"
                                            disabled={loading || !query.trim()}
                                            sx={{ 
                                                height: '100%',
                                                px: 4,
                                                bgcolor: 'primary.main',
                                                '&:hover': {
                                                    bgcolor: 'primary.dark'
                                                }
                                            }}
                                        >
                                            {loading ? <CircularProgress size={24} /> : 'Research'}
                                        </Button>
                                    </Paper>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>

                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
                        {messages.map((message, index) => (
                            <Box key={index} sx={{ mb: 2 }}>
                                {renderMessage(message, index)}
                            </Box>
                        ))}
                        <div ref={messagesEndRef} />
                    </Box>
                </div>
            </div>

            <style jsx>{`
                .market-research {
                    display: flex;
                    flex-direction: column;
                    min-height: 100vh;
                    background-color: #f5f5f5;
                }
                .content {
                    display: flex;
                    flex-direction: row;
                    flex-grow: 1;
                }
                .main-content {
                    flex-grow: 1;
                    padding: 20px;
                    background-color: #f5f5f5;
                    display: flex;
                    flex-direction: column;
                }
            `}</style>
        </div>
    );
} 