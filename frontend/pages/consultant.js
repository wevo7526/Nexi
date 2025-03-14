"use client";
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import { useToast } from "../components/ToastProvider";
import { useTheme } from '@mui/material/styles';
import {
    CircularProgress, Typography, Box, Card, Grid, Button,
    IconButton, TextField, Paper, Divider, Chip, Dialog,
    DialogTitle, DialogContent, DialogActions, useMediaQuery,
    Skeleton, LinearProgress, Tooltip
} from "@mui/material";
import {
    AttachFile, Send, Delete, SaveAlt, History,
    Refresh, MoreVert, FilterList
} from "@mui/icons-material";
import { supabase } from "../supabaseClient";
import { useRouter } from "next/router";

// Template categories and their queries
const QUERY_TEMPLATES = {
    "Business Analysis": [
        "Analyze my company's market position and provide strategic recommendations",
        "Review my business plan and suggest improvements",
        "Identify potential growth opportunities in my industry"
    ],
    "Financial Planning": [
        "Create a financial forecast for the next 12 months",
        "Analyze my company's cash flow and suggest optimizations",
        "Review my pricing strategy and provide recommendations"
    ],
    "Operations": [
        "Optimize my business processes for efficiency",
        "Develop a risk management strategy",
        "Create an operational improvement plan"
    ],
    "Marketing": [
        "Develop a marketing strategy for my product",
        "Analyze my target market and customer segments",
        "Create a competitive analysis"
    ]
};

// Add these utility functions at the top
const saveConversationToSupabase = async (conversation) => {
    try {
        const { error } = await supabase
            .from('conversations')
            .insert([conversation]);
        if (error) throw error;
    } catch (error) {
        console.error("Error saving conversation:", error);
        throw error;
    }
};

const updateConversationInSupabase = async (conversation) => {
    try {
        const { error } = await supabase
            .from('conversations')
            .update(conversation)
            .eq('id', conversation.id);
        if (error) throw error;
    } catch (error) {
        console.error("Error updating conversation:", error);
        throw error;
    }
};

function Consultant({ initialData }) {
    const [query, setQuery] = useState("");
    const [conversations, setConversations] = useState([]);
    const [currentConversation, setCurrentConversation] = useState(null);
    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState(null);
    const [error, setError] = useState(null);
    const [user, setUser] = useState(null);
    const [templateMenuAnchor, setTemplateMenuAnchor] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [showExportDialog, setShowExportDialog] = useState(false);
    const router = useRouter();
    const theme = useTheme();
    const { showToast } = useToast();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [responseTime, setResponseTime] = useState(0);
    const [showTemplates, setShowTemplates] = useState(false);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);

    useEffect(() => {
        const checkSession = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    router.push(`/auth?redirectTo=/consultant`);
                } else {
                    setUser(user);
                    await loadConversations(user.id);
                }
            } catch (error) {
                showToast('Error checking session', 'error');
            } finally {
                setIsLoadingHistory(false);
            }
        };
        checkSession();
    }, [router]);

    const loadConversations = async (userId) => {
        try {
            const { data, error } = await supabase
                .from('conversations')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            setConversations(data || []);
        } catch (error) {
            showToast('Error loading conversations', 'error');
        }
    };

    // Add this function to handle keypress
    const handleKeyPress = (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleGetAnswer();
        }
    };

    const handleGetAnswer = async () => {
        if (!query.trim() || loading) return;
        
        setLoading(true);
        setError(null);
        
        const startTime = Date.now();
        const userMessage = {
            type: 'message',
            content: query,
            timestamp: new Date().toISOString(),
            role: 'user'
        };
        
        try {
            // Optimistic update
            const updatedConversation = currentConversation ? {
                ...currentConversation,
                messages: [...currentConversation.messages, userMessage]
            } : {
                id: Date.now().toString(),
                title: query.substring(0, 50) + "...",
                messages: [userMessage],
                created_at: new Date().toISOString(),
                user_id: user.id
            };

            setCurrentConversation(updatedConversation);
            if (!currentConversation) {
                setConversations(prev => [updatedConversation, ...prev]);
            }

            const formData = new FormData();
            formData.append("query", query);
            formData.append("thread_id", updatedConversation.id);
            if (user?.id) {
                formData.append("user_id", user.id);
            }
            if (file) {
                formData.append("file", file);
            }

            const response = await axios.post("http://127.0.0.1:5000/get_answer", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            const endTime = Date.now();
            setResponseTime((endTime - startTime) / 1000);

            const assistantMessage = {
                type: 'message',
                content: response.data.answer,
                timestamp: new Date().toISOString(),
                role: 'assistant'
            };

            const finalConversation = {
                ...updatedConversation,
                messages: [...updatedConversation.messages, assistantMessage]
            };

            setCurrentConversation(finalConversation);
            await saveConversationToSupabase(finalConversation);
            
            showToast('Response received successfully', 'success');
            setQuery("");
            setFile(null);
        } catch (error) {
            console.error("Error getting answer:", error);
            setError(error.response?.data?.error || "Failed to get an answer. Please try again.");
            showToast('Error getting answer', 'error');
            
            // Revert optimistic update
            if (currentConversation) {
                setCurrentConversation(prev => ({
                    ...prev,
                    messages: prev.messages.slice(0, -1)
                }));
            }
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (event) => {
        const selectedFile = event.target.files[0];
        setFile(selectedFile);
    };

    const handleTemplateClick = (event) => {
        setTemplateMenuAnchor(event.currentTarget);
    };

    const handleCategorySelect = (category) => {
        setSelectedCategory(category);
        setTemplateMenuAnchor(null);
    };

    const handleTemplateSelect = (template) => {
        setQuery(template);
        setSelectedCategory(null);
    };

    const handleExport = async () => {
        if (!currentConversation) return;
        
        // Create export content
        const content = currentConversation.messages
            .map(msg => `${msg.role.toUpperCase()}: ${msg.content}`)
            .join('\n\n');
            
        // Create download link
        const blob = new Blob([content], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `conversation-${currentConversation.id}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        setShowExportDialog(false);
    };

    const formatResponse = (text) => {
        // Split response into sections based on common patterns
        const sections = text.split(/(?=\n[A-Z][A-Za-z\s]*:|\n\d+\.|\n•)/g);
        return sections.map((section, index) => {
            const trimmedSection = section.trim();
            if (!trimmedSection) return null;

            // Check if section starts with a bullet point or number
            const isList = /^(\d+\.|\•|\-)\s/.test(trimmedSection);
            // Check if section is a heading
            const isHeading = /^[A-Z][A-Za-z\s]*:/.test(trimmedSection);

            return (
                <Box key={index} mb={2}>
                    {isHeading ? (
                        <Typography variant="h6" gutterBottom sx={{ color: '#1a1a1a', fontWeight: 600 }}>
                            {trimmedSection}
                        </Typography>
                    ) : (
                        <Typography
                            variant="body1"
                            component={isList ? 'li' : 'p'}
                            sx={{
                                marginLeft: isList ? 2 : 0,
                                listStyleType: isList ? 'inherit' : 'none'
                            }}
                        >
                            {trimmedSection}
                        </Typography>
                    )}
                </Box>
            );
        });
    };

    if (!user) return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
            <CircularProgress />
        </Box>
    );

    return (
        <div className="consultant">
            <Sidebar />
            <div className="main-content">
                {/* Dashboard Stats */}
                <Box mb={4}>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={3}>
                            <Card className="stat-card">
                                <Box p={3}>
                                    <Typography variant="overline" color="textSecondary">
                                        Active Conversations
                                    </Typography>
                                    <Typography variant="h3" component="div" sx={{ mt: 1 }}>
                                        {conversations.length}
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                                        {conversations.length > 0 ? 
                                            `Last updated ${new Date(conversations[0].created_at).toLocaleDateString()}` :
                                            'No conversations yet'}
                                    </Typography>
                                </Box>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Card className="stat-card">
                                <Box p={3}>
                                    <Typography variant="overline" color="textSecondary">
                                        Total Messages
                                    </Typography>
                                    <Typography variant="h3" component="div" sx={{ mt: 1 }}>
                                        {conversations.reduce((acc, conv) => acc + conv.messages.length, 0)}
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                                        Across all conversations
                                    </Typography>
                                </Box>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Card className="stat-card">
                                <Box p={3}>
                                    <Typography variant="overline" color="textSecondary">
                                        Response Time
                                    </Typography>
                                    <Typography variant="h3" component="div" sx={{ mt: 1 }}>
                                        {responseTime.toFixed(1)}s
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                                        Last response
                                    </Typography>
                                </Box>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Card className="stat-card" onClick={() => setShowTemplates(true)} sx={{ cursor: 'pointer' }}>
                                <Box p={3}>
                                    <Typography variant="overline" color="textSecondary">
                                        Templates
                                    </Typography>
                                    <Typography variant="h3" component="div" sx={{ mt: 1 }}>
                                        {Object.keys(QUERY_TEMPLATES).length}
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                                        Click to view
                                    </Typography>
                                </Box>
                            </Card>
                        </Grid>
                    </Grid>
                </Box>

                {/* Chat Interface */}
                <Paper elevation={0} className="chat-container">
                    {/* Messages Area */}
                    <Box className="messages-container">
                        {currentConversation?.messages.map((message, index) => (
                            <Box
                                key={index}
                                className={`message ${message.role}`}
                                sx={{
                                    maxWidth: '80%',
                                    alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
                                    opacity: loading && index === currentConversation.messages.length - 1 ? 0.7 : 1
                                }}
                            >
                                <Paper 
                                    elevation={1} 
                                    sx={{ 
                                        p: 2,
                                        backgroundColor: message.role === 'user' ? 
                                            theme.palette.primary.main : 
                                            theme.palette.background.paper,
                                        borderRadius: message.role === 'user' ? 
                                            '12px 12px 0 12px' : 
                                            '12px 12px 12px 0'
                                    }}
                                >
                                    {message.role === 'user' ? (
                                        <Typography sx={{ color: theme.palette.primary.contrastText }}>
                                            {message.content}
                                        </Typography>
                                    ) : (
                                        <Box sx={{ color: theme.palette.text.primary }}>
                                            {formatResponse(message.content)}
                                        </Box>
                                    )}
                                    <Typography 
                                        variant="caption" 
                                        sx={{ 
                                            display: 'block',
                                            mt: 1,
                                            color: message.role === 'user' ? 
                                                'rgba(255,255,255,0.7)' : 
                                                theme.palette.text.secondary
                                        }}
                                    >
                                        {new Date(message.timestamp).toLocaleTimeString()}
                                    </Typography>
                                </Paper>
                            </Box>
                        ))}
                        {loading && (
                            <Box display="flex" justifyContent="center" alignItems="center" my={2}>
                                <CircularProgress size={24} />
                                <Typography variant="body2" sx={{ ml: 1, color: 'text.secondary' }}>
                                    Generating response...
                                </Typography>
                            </Box>
                        )}
                        {error && (
                            <Box 
                                sx={{ 
                                    p: 2, 
                                    bgcolor: theme.palette.error.light,
                                    borderRadius: 1,
                                    color: theme.palette.error.contrastText,
                                    mt: 2
                                }}
                            >
                                <Typography variant="body2">{error}</Typography>
                            </Box>
                        )}
                    </Box>

                    {/* Input Area */}
                    <Box className="input-area">
                        {file && (
                            <Chip
                                label={file.name}
                                onDelete={() => setFile(null)}
                                sx={{ mb: 1 }}
                                color="primary"
                                variant="outlined"
                            />
                        )}
                        <Box display="flex" gap={1}>
                            <input
                                type="file"
                                id="file-upload"
                                onChange={handleFileChange}
                                accept=".pdf,.doc,.docx,.txt,.csv"
                                style={{ display: 'none' }}
                            />
                            <Tooltip title="Attach file">
                                <label htmlFor="file-upload">
                                    <IconButton 
                                        component="span" 
                                        color="primary"
                                        sx={{
                                            '&:hover': {
                                                backgroundColor: theme.palette.primary.light + '1A'
                                            }
                                        }}
                                    >
                                        <AttachFile />
                                    </IconButton>
                                </label>
                            </Tooltip>
                            <TextField
                                fullWidth
                                multiline
                                maxRows={4}
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Ask your business question... (Press Enter to send)"
                                variant="outlined"
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        backgroundColor: theme.palette.background.paper,
                                        '&:hover': {
                                            '& > fieldset': {
                                                borderColor: theme.palette.primary.main
                                            }
                                        }
                                    }
                                }}
                            />
                            <Tooltip title="Send message">
                                <span>
                                    <Button
                                        variant="contained"
                                        onClick={handleGetAnswer}
                                        disabled={loading || !query.trim()}
                                        sx={{
                                            minWidth: '56px',
                                            width: '56px',
                                            height: '56px',
                                            borderRadius: '8px'
                                        }}
                                    >
                                        <Send />
                                    </Button>
                                </span>
                            </Tooltip>
                        </Box>
                    </Box>
                </Paper>

                {/* Templates Dialog */}
                <Dialog
                    open={showTemplates}
                    onClose={() => setShowTemplates(false)}
                    maxWidth="md"
                    fullWidth
                >
                    <DialogTitle>
                        <Typography variant="h6">Query Templates</Typography>
                        <Typography variant="body2" color="textSecondary">
                            Select a template to quickly start a conversation
                        </Typography>
                    </DialogTitle>
                    <DialogContent>
                        <Grid container spacing={2}>
                            {Object.entries(QUERY_TEMPLATES).map(([category, templates]) => (
                                <Grid item xs={12} md={6} key={category}>
                                    <Card sx={{ height: '100%' }}>
                                        <Box p={2}>
                                            <Typography variant="h6" gutterBottom>
                                                {category}
                                            </Typography>
                                            <Divider sx={{ mb: 2 }} />
                                            {templates.map((template, index) => (
                                                <Button
                                                    key={index}
                                                    fullWidth
                                                    variant="outlined"
                                                    onClick={() => {
                                                        setQuery(template);
                                                        setShowTemplates(false);
                                                    }}
                                                    sx={{ mb: 1 }}
                                                >
                                                    {template}
                                                </Button>
                                            ))}
                                        </Box>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    </DialogContent>
                </Dialog>
            </div>

            <style jsx>{`
                .consultant {
                    display: flex;
                    min-height: 100vh;
                    background: ${theme.palette.background.default};
                }

                .main-content {
                    flex-grow: 1;
                    padding: ${isMobile ? '16px' : '24px'};
                    overflow-y: auto;
                }

                .stat-card {
                    height: 100%;
                    transition: all 0.3s ease;
                    cursor: pointer;
                }

                .stat-card:hover {
                    transform: translateY(-4px);
                    box-shadow: ${theme.shadows[4]};
                }

                .chat-container {
                    display: flex;
                    flex-direction: column;
                    height: calc(100vh - 300px);
                    background: ${theme.palette.background.default};
                    border: 1px solid ${theme.palette.divider};
                    border-radius: 12px;
                    overflow: hidden;
                }

                .messages-container {
                    flex-grow: 1;
                    overflow-y: auto;
                    padding: 24px;
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                    scroll-behavior: smooth;
                }

                .messages-container::-webkit-scrollbar {
                    width: 8px;
                }

                .messages-container::-webkit-scrollbar-track {
                    background: ${theme.palette.background.default};
                }

                .messages-container::-webkit-scrollbar-thumb {
                    background: ${theme.palette.grey[400]};
                    border-radius: 4px;
                }

                .messages-container::-webkit-scrollbar-thumb:hover {
                    background: ${theme.palette.grey[600]};
                }

                .input-area {
                    padding: 16px;
                    background: ${theme.palette.background.paper};
                    border-top: 1px solid ${theme.palette.divider};
                }

                .message {
                    display: flex;
                    flex-direction: column;
                    animation: fadeIn 0.3s ease;
                }

                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @media (max-width: 600px) {
                    .chat-container {
                        height: calc(100vh - 250px);
                    }

                    .messages-container {
                        padding: 16px;
                    }

                    .input-area {
                        padding: 12px;
                    }
                }
            `}</style>
        </div>
    );
}

export default Consultant;