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
            return { bg: '#f0f4c3', text: '#827717' }; // Light yellow background
        case 'action':
            return { bg: '#b2dfdb', text: '#004d40' }; // Light teal background
        case 'observation':
            return { bg: '#ffccbc', text: '#bf360c' }; // Light orange background
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
            return <Psychology />;
        case 'action':
            return <Build />;
        case 'observation':
            return <Search />;
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
            const response = await fetch('http://localhost:5000/api/market-research/research', {
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

            console.log('Starting to read stream...');
            const reader = response.body?.getReader();
            if (!reader) throw new Error('No reader available');

            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    console.log('Stream complete');
                    break;
                }

                const chunk = new TextDecoder().decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data: ResearchResponse = JSON.parse(line.slice(6));
                            console.log('Received chunk:', data);
                            
                            if (data.status === 'error') {
                                console.error('Error in stream:', data.content);
                                setError(data.content);
                                continue;
                            }

                            let role: Message['role'];
                            switch (data.type) {
                                case 'thought':
                                    role = 'thought';
                                    break;
                                case 'action':
                                    role = 'action';
                                    break;
                                case 'observation':
                                    role = 'observation';
                                    break;
                                case 'final':
                                    role = 'assistant';
                                    break;
                                default:
                                    console.log('Unknown message type:', data.type);
                                    continue;
                            }

                            const newMessage: Message = { role, content: data.content };
                            console.log('Adding message:', newMessage);
                            setMessages(prev => [...prev, newMessage]);
                        } catch (e) {
                            console.error('Error parsing SSE data:', e, '\nRaw line:', line);
                        }
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
                    }
                }}
            >
                <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Avatar
                            sx={{
                                bgcolor: colors.text,
                                width: 28,
                                height: 28,
                                mr: 1
                            }}
                        >
                            {icon}
                        </Avatar>
                        <Typography 
                            variant="caption" 
                            sx={{ 
                                textTransform: 'uppercase', 
                                fontWeight: 'bold',
                                color: colors.text
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
                            }
                        }}
                    >
                        {message.content}
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
                    <Box component="main" sx={{ flexGrow: 1, p: 3, display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <Paper 
                            elevation={3} 
                            sx={{ 
                                flex: 1, 
                                mb: 2, 
                                p: 2, 
                                overflowY: 'auto',
                                display: 'flex',
                                flexDirection: 'column',
                                bgcolor: 'grey.50'
                            }}
                        >
                            {messages.map((message, index) => renderMessage(message, index))}
                            {loading && (
                                <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                                    <CircularProgress />
                                </Box>
                            )}
                            <div ref={messagesEndRef} />
                        </Paper>

                        {error && (
                            <Alert 
                                severity="error" 
                                onClose={() => setError(null)} 
                                sx={{ 
                                    mb: 2,
                                    '& .MuiAlert-message': {
                                        width: '100%'
                                    }
                                }}
                            >
                                {error}
                            </Alert>
                        )}

                        <Paper 
                            component="form" 
                            onSubmit={handleSubmit} 
                            sx={{ 
                                p: 2,
                                bgcolor: 'background.paper',
                                boxShadow: 2
                            }}
                        >
                            <Grid container spacing={2}>
                                <Grid item xs>
                                    <TextField
                                        fullWidth
                                        multiline
                                        rows={2}
                                        variant="outlined"
                                        placeholder="Enter your market research query..."
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        disabled={loading}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                bgcolor: 'background.paper'
                                            }
                                        }}
                                    />
                                </Grid>
                                <Grid item>
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
                                </Grid>
                            </Grid>
                        </Paper>
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