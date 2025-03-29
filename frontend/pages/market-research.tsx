"use client";
import React, { useState, useEffect, useRef, FormEvent } from "react";
import Sidebar from "../components/Sidebar";
import { useToast } from "../components/ToastProvider";
import {
    CircularProgress, Typography, Box, Card, Grid, Button,
    IconButton, TextField, Paper, Avatar, Stack,
    LinearProgress, Divider, CardContent, Alert, Container,
    useTheme, Fade, Tooltip, Chip, InputAdornment
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
    Search,
    History,
    AutoGraph,
    Insights,
    Search as SearchIcon
} from "@mui/icons-material";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/router";
import { api } from '../lib/api';

// API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000';

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
            return { bg: '#e3f2fd', text: '#1565c0' };
        case 'action':
            return { bg: '#e8f5e9', text: '#2e7d32' };
        case 'observation':
            return { bg: '#fff3e0', text: '#e65100' };
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
    const theme = useTheme();

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
            const response = await api.get('/api/market-research/history');
            if (response.data.status === 'success') {
                setMessages(response.data.history.map(msg => ({
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
            const response = await api.post('/api/market-research/research', {
                query: userMessage.content
            }, {
                responseType: 'stream'
            });

            const reader = response.data.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.trim() === '') continue;
                    if (!line.startsWith('data: ')) continue;

                    try {
                        const jsonStr = line.slice(6);
                        const data = JSON.parse(jsonStr);

                        if (data.status === 'error') {
                            setError(data.message || 'An error occurred');
                            break;
                        }

                        const message: Message = {
                            role: data.type as Message['role'],
                            content: data.content
                        };

                        setMessages(prev => {
                            const lastMessage = prev[prev.length - 1];
                            if (lastMessage && lastMessage.role === message.role) {
                                return [
                                    ...prev.slice(0, -1),
                                    { ...lastMessage, content: lastMessage.content + '\n' + message.content }
                                ];
                            }
                            return [...prev, message];
                        });
                    } catch (err) {
                        console.error('Error parsing SSE data:', err);
                        setError('Error processing server response');
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
            <Fade in key={index}>
                <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
                    <Avatar sx={{ bgcolor: colors.bg, color: colors.text }}>
                        {icon}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 2,
                                bgcolor: colors.bg,
                                color: colors.text,
                                borderRadius: 2,
                                whiteSpace: 'pre-wrap'
                            }}
                        >
                            <Typography variant="body1">
                                {message.content}
                            </Typography>
                        </Paper>
                    </Box>
                </Box>
            </Fade>
        );
    };

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            <Sidebar />
            <Box sx={{ flex: 1, p: 3, bgcolor: 'background.default' }}>
                <Container maxWidth="lg">
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <Card sx={{ mb: 3 }}>
                                <CardContent>
                                    <Typography variant="h5" gutterBottom>
                                        Market Research Assistant
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" paragraph>
                                        Get detailed market analysis and insights for any industry or company.
                                    </Typography>
                                    
                                    <form onSubmit={handleSubmit}>
                                        <TextField
                                            fullWidth
                                            multiline
                                            rows={2}
                                            value={query}
                                            onChange={(e) => setQuery(e.target.value)}
                                            placeholder="Enter your market research query..."
                                            disabled={loading}
                                            sx={{ mb: 2 }}
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <SearchIcon color="action" />
                                                    </InputAdornment>
                                                ),
                                                endAdornment: (
                                                    <InputAdornment position="end">
                                                        <Tooltip title="Send query">
                                                            <IconButton
                                                                type="submit"
                                                                color="primary"
                                                                disabled={loading || !query.trim()}
                                                            >
                                                                {loading ? <CircularProgress size={24} /> : <Send />}
                                                            </IconButton>
                                                        </Tooltip>
                                                    </InputAdornment>
                                                ),
                                            }}
                                        />
                                    </form>

                                    <Box sx={{ mt: 2 }}>
                                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                            Quick Research Templates
                                        </Typography>
                                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                            {researchCategories.map((category, index) => (
                                                <Chip
                                                    key={index}
                                                    icon={category.icon}
                                                    label={category.label}
                                                    onClick={() => setQuery(category.query)}
                                                    sx={{
                                                        m: 0.5,
                                                        '&:hover': {
                                                            bgcolor: 'primary.light',
                                                            color: 'primary.main'
                                                        }
                                                    }}
                                                />
                                            ))}
                                        </Stack>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid item xs={12}>
                            <Paper sx={{ p: 3, height: 'calc(100vh - 250px)', overflow: 'auto' }}>
                                {messages.length === 0 ? (
                                    <Box sx={{ textAlign: 'center', py: 4 }}>
                                        <Typography variant="h6" color="text.secondary" gutterBottom>
                                            Start Your Market Research
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Ask questions about market trends, competitors, or industry analysis.
                                        </Typography>
                                    </Box>
                                ) : (
                                    messages.map((message, index) => renderMessage(message, index))
                                )}
                                <div ref={messagesEndRef} />
                            </Paper>
                        </Grid>
                    </Grid>

                    {error && (
                        <Alert severity="error" sx={{ mt: 2 }}>
                            {error}
                        </Alert>
                    )}
                </Container>
            </Box>
        </Box>
    );
}