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
    Search as SearchIcon,
    Timeline,
    Assessment,
    TrendingFlat,
    TrendingDown,
    TrendingUp as TrendingUpIcon,
    CompareArrows,
    Timeline as TimelineIcon,
    Analytics,
    BarChart,
    PieChart,
    TableChart,
    Download,
    Share,
    Bookmark,
    FilterList,
    Sort
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

interface ResearchTemplate {
    label: string;
    icon: JSX.Element;
    query: string;
    description: string;
    category: 'market' | 'competitor' | 'consumer' | 'financial' | 'strategic';
    suggestedPrompts: string[];
}

interface AnalysisSection {
    title: string;
    content: string;
    type: 'text' | 'chart' | 'table' | 'timeline';
    data?: any;
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

const researchTemplates: ResearchTemplate[] = [
    {
        label: 'Market Size & Growth',
        icon: <ShowChartOutlined />,
        query: 'Analyze the market size and growth potential for',
        description: 'Get detailed market size analysis including TAM, SAM, and SOM',
        category: 'market',
        suggestedPrompts: [
            'What is the total addressable market?',
            'What are the key growth drivers?',
            'What are the market segments?'
        ]
    },
    {
        label: 'Competitive Landscape',
        icon: <CompareArrows />,
        query: 'Analyze the competitive landscape for',
        description: 'Understand market positioning and competitive advantages',
        category: 'competitor',
        suggestedPrompts: [
            'Who are the key competitors?',
            'What are their market shares?',
            'What are their strengths and weaknesses?'
        ]
    },
    {
        label: 'Consumer Insights',
        icon: <PeopleOutlined />,
        query: 'Analyze consumer behavior and preferences in',
        description: 'Deep dive into customer segments and buying patterns',
        category: 'consumer',
        suggestedPrompts: [
            'What are the key customer segments?',
            'What are their buying behaviors?',
            'What are their pain points?'
        ]
    },
    {
        label: 'Financial Analysis',
        icon: <Analytics />,
        query: 'Analyze financial metrics and performance in',
        description: 'Get detailed financial analysis and metrics',
        category: 'financial',
        suggestedPrompts: [
            'What are the key financial metrics?',
            'What is the revenue potential?',
            'What are the cost structures?'
        ]
    },
    {
        label: 'Strategic Insights',
        icon: <TimelineIcon />,
        query: 'Provide strategic analysis and recommendations for',
        description: 'Get actionable strategic insights and recommendations',
        category: 'strategic',
        suggestedPrompts: [
            'What are the key opportunities?',
            'What are the main risks?',
            'What are the strategic recommendations?'
        ]
    }
];

export default function MarketResearch() {
    const [query, setQuery] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const { showToast } = useToast();
    const theme = useTheme();
    const [selectedTemplate, setSelectedTemplate] = useState<ResearchTemplate | null>(null);
    const [analysisSections, setAnalysisSections] = useState<AnalysisSection[]>([]);
    const [viewMode, setViewMode] = useState<'chat' | 'analysis'>('chat');
    const [sortBy, setSortBy] = useState<'date' | 'relevance'>('date');
    const [filterCategory, setFilterCategory] = useState<string | null>(null);
    const [savedAnalyses, setSavedAnalyses] = useState<Array<{
        id: string;
        title: string;
        date: string;
        sections: AnalysisSection[];
    }>>([]);

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
            const response = await fetch(`${API_BASE_URL}/api/market-research/research`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query: userMessage.content })
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const reader = response.body?.getReader();
            if (!reader) {
                throw new Error('Failed to get response reader');
            }

            const decoder = new TextDecoder();
            let buffer = '';
            let currentMessage: Message | null = null;

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

                        // Handle different types of messages
                        if (data.type === 'thought' || data.type === 'action' || data.type === 'observation') {
                            // Update or create a new message for this type
                            setMessages(prev => {
                                const lastMessage = prev[prev.length - 1];
                                if (lastMessage && lastMessage.role === data.type) {
                                    return [
                                        ...prev.slice(0, -1),
                                        { ...lastMessage, content: lastMessage.content + '\n' + data.content }
                                    ];
                                }
                                return [...prev, { role: data.type, content: data.content }];
                            });
                        } else if (data.type === 'final') {
                            // Handle final answer
                            setMessages(prev => {
                                const lastMessage = prev[prev.length - 1];
                                if (lastMessage && lastMessage.role === 'assistant') {
                                    return [
                                        ...prev.slice(0, -1),
                                        { ...lastMessage, content: lastMessage.content + '\n' + data.content }
                                    ];
                                }
                                return [...prev, { role: 'assistant', content: data.content }];
                            });
                        }
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

    const handleTemplateSelect = (template: ResearchTemplate) => {
        setSelectedTemplate(template);
        setQuery(template.query);
        showToast({
            title: template.label,
            message: template.description,
            type: 'info'
        });
    };

    const handleSuggestedPromptClick = (prompt: string) => {
        if (selectedTemplate) {
            setQuery(`${selectedTemplate.query} ${prompt}`);
        }
    };

    const renderTemplateCard = (template: ResearchTemplate) => (
        <Card 
            sx={{ 
                mb: 2, 
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 3
                }
            }}
            onClick={() => handleTemplateSelect(template)}
        >
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Box sx={{ mr: 2, color: 'primary.main' }}>
                        {template.icon}
                    </Box>
                    <Typography variant="h6">
                        {template.label}
                    </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" paragraph>
                    {template.description}
                </Typography>
                <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                        Suggested Prompts:
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        {template.suggestedPrompts.map((prompt, index) => (
                            <Chip
                                key={index}
                                label={prompt}
                                size="small"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleSuggestedPromptClick(prompt);
                                }}
                            />
                        ))}
                    </Stack>
                </Box>
            </CardContent>
        </Card>
    );

    const renderAnalysisView = () => (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h5">Analysis Dashboard</Typography>
                <Box>
                    <IconButton onClick={() => setSortBy(sortBy === 'date' ? 'relevance' : 'date')}>
                        <Sort />
                    </IconButton>
                    <IconButton onClick={() => setFilterCategory(null)}>
                        <FilterList />
                    </IconButton>
                    <IconButton>
                        <Download />
                    </IconButton>
                    <IconButton>
                        <Share />
                    </IconButton>
                </Box>
            </Box>

            <Grid container spacing={3}>
                {analysisSections.map((section, index) => (
                    <Grid item xs={12} key={index}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    {section.title}
                                </Typography>
                                {section.type === 'chart' && (
                                    <Box sx={{ height: 300 }}>
                                        {/* Render chart based on section.data */}
                                    </Box>
                                )}
                                {section.type === 'table' && (
                                    <Box sx={{ overflowX: 'auto' }}>
                                        {/* Render table based on section.data */}
                                    </Box>
                                )}
                                {section.type === 'timeline' && (
                                    <Box sx={{ mt: 2 }}>
                                        {/* Render timeline based on section.data */}
                                    </Box>
                                )}
                                {section.type === 'text' && (
                                    <Typography variant="body1">
                                        {section.content}
                                    </Typography>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            <Sidebar />
            <Box sx={{ flex: 1, p: 3, bgcolor: 'background.default' }}>
                <Container maxWidth="lg">
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <Card sx={{ mb: 3 }}>
                                <CardContent>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                                        <Typography variant="h5">
                                            Market Research Assistant
                                        </Typography>
                                        <Box>
                                            <Button
                                                variant={viewMode === 'chat' ? 'contained' : 'outlined'}
                                                onClick={() => setViewMode('chat')}
                                                sx={{ mr: 1 }}
                                            >
                                                Chat View
                                            </Button>
                                            <Button
                                                variant={viewMode === 'analysis' ? 'contained' : 'outlined'}
                                                onClick={() => setViewMode('analysis')}
                                            >
                                                Analysis View
                                            </Button>
                                        </Box>
                                    </Box>

                                    {viewMode === 'chat' ? (
                                        <>
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

                                            <Box sx={{ mt: 3 }}>
                                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                    Research Templates
                                                </Typography>
                                                <Grid container spacing={2}>
                                                    {researchTemplates.map((template, index) => (
                                                        <Grid item xs={12} md={6} key={index}>
                                                            {renderTemplateCard(template)}
                                                        </Grid>
                                                    ))}
                                                </Grid>
                                            </Box>
                                        </>
                                    ) : (
                                        renderAnalysisView()
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>

                        {viewMode === 'chat' && (
                            <Grid item xs={12}>
                                <Paper sx={{ p: 3, height: 'calc(100vh - 250px)', overflow: 'auto' }}>
                                    {messages.length === 0 ? (
                                        <Box sx={{ textAlign: 'center', py: 4 }}>
                                            <Typography variant="h6" color="text.secondary" gutterBottom>
                                                Start Your Market Research
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Choose a research template or ask a custom question to begin.
                                            </Typography>
                                        </Box>
                                    ) : (
                                        messages.map((message, index) => renderMessage(message, index))
                                    )}
                                    <div ref={messagesEndRef} />
                                </Paper>
                            </Grid>
                        )}
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