"use client";
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import { useToast } from "../components/ToastProvider";
import {
    CircularProgress, Typography, Box, Card, Grid,
    IconButton, Paper, Chip, Stack, TextField,
    LinearProgress, Button, Divider
} from "@mui/material";
import {
    Upload as UploadIcon, Delete, Send as SendIcon,
    Article, Description, Chat as ChatIcon
} from "@mui/icons-material";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/router";

function Documents() {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState(null);
    const [user, setUser] = useState(null);
    const router = useRouter();
    const { showToast } = useToast();
    const [processingProgress, setProcessingProgress] = useState({});
    const [selectedDocument, setSelectedDocument] = useState(null);
    const [chatMessages, setChatMessages] = useState([]);
    const [userInput, setUserInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const chatEndRef = useRef(null);

    useEffect(() => {
        const checkSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) {
                    router.push(`/auth?redirectTo=/documents`);
                } else {
                    setUser(session.user);
                    fetchDocuments();
                }
            } catch (error) {
                showToast('Error checking session', 'error');
            }
        };
        checkSession();
    }, [router]);

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
            showToast('File too large. Maximum size is 10MB.', 'error');
            return;
        }

        // Validate file type
        const fileExt = '.' + file.name.split('.').pop().toLowerCase();
        const supportedTypes = ['.pdf', '.doc', '.docx', '.txt'];
        if (!supportedTypes.includes(fileExt)) {
            showToast('Unsupported file type. Please upload PDF, DOC, DOCX, or TXT files.', 'error');
            return;
        }

        try {
            setUploading(true);
            setUploadProgress(0);
            const { data: { session } } = await supabase.auth.getSession();
            const formData = new FormData();
            formData.append('file', file);

            const response = await axios.post('/api/upload_document', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${session.access_token}`
                },
                onUploadProgress: (progressEvent) => {
                    const progress = (progressEvent.loaded / progressEvent.total) * 100;
                    setUploadProgress(progress);
                }
            });

            // Start polling for processing progress
            if (response.data.id) {
                pollProcessingProgress(response.data.id);
            }

            showToast('Document uploaded successfully', 'success');
            fetchDocuments();
        } catch (error) {
            showToast(error.response?.data?.error || 'Error uploading document', 'error');
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    };

    const pollProcessingProgress = async (documentId) => {
        const interval = setInterval(async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                const response = await axios.get(`/api/document_status/${documentId}`, {
                    headers: {
                        'Authorization': `Bearer ${session.access_token}`
                    }
                });

                setProcessingProgress(prev => ({
                    ...prev,
                    [documentId]: response.data.processing_progress || 0
                }));

                if (response.data.status === 'complete' || response.data.status === 'failed') {
                    clearInterval(interval);
                    fetchDocuments();
                }
            } catch (error) {
                clearInterval(interval);
            }
        }, 2000);
    };

    const fetchDocuments = async () => {
        try {
            setLoading(true);
            const { data: { session } } = await supabase.auth.getSession();
            const response = await axios.get('/api/get_documents', {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            });
            setDocuments(response.data.documents);
        } catch (error) {
            showToast('Error fetching documents', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (documentId) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            await axios.delete(`/api/delete_document/${documentId}`, {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            });
            showToast('Document deleted successfully', 'success');
            fetchDocuments();
            if (selectedDocument?.id === documentId) {
                setSelectedDocument(null);
            }
        } catch (error) {
            showToast('Error deleting document', 'error');
        }
    };

    const renderInsights = (insights) => {
        if (!insights) return null;
        
        try {
            const parsedInsights = typeof insights === 'string' ? JSON.parse(insights) : insights;
            
            return (
                <Box sx={{ mt: 2 }}>
                    {Object.entries(parsedInsights).map(([key, value]) => (
                        <Box key={key} sx={{ mb: 2 }}>
                            <Typography variant="h6" gutterBottom>
                                {key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                            </Typography>
                            {Array.isArray(value) ? (
                                <ul>
                                    {value.map((item, index) => (
                                        <li key={index}>
                                            <Typography variant="body1">{item}</Typography>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <Typography variant="body1">{value}</Typography>
                            )}
                        </Box>
                    ))}
                </Box>
            );
        } catch (error) {
            return (
                <Typography color="error">
                    Error displaying insights: {error.message}
                </Typography>
            );
        }
    };

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [chatMessages]);

    const handleSendMessage = async () => {
        if (!userInput.trim()) return;

        try {
            setIsTyping(true);
            const { data: { session } } = await supabase.auth.getSession();
            
            // Add user message to chat
            const userMessage = {
                role: 'user',
                content: userInput,
                timestamp: new Date().toISOString()
            };
            setChatMessages(prev => [...prev, userMessage]);
            setUserInput("");

            // Get response from agent
            const response = await axios.post('/api/chat', 
                { 
                    message: userInput,
                    chat_history: chatMessages
                },
                {
                    headers: {
                        'Authorization': `Bearer ${session.access_token}`
                    }
                }
            );

            // Add assistant response to chat
            const assistantMessage = {
                role: 'assistant',
                content: response.data.answer,
                sources: response.data.sources,
                timestamp: new Date().toISOString()
            };
            setChatMessages(prev => [...prev, assistantMessage]);

        } catch (error) {
            showToast(error.response?.data?.error || 'Error sending message', 'error');
        } finally {
            setIsTyping(false);
        }
    };

    const handleKeyPress = (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSendMessage();
        }
    };

    const renderChatMessage = (message, index) => {
        const isUser = message.role === 'user';
        return (
            <Box
                key={index}
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isUser ? 'flex-end' : 'flex-start',
                    mb: 2
                }}
            >
                <Paper
                    sx={{
                        p: 2,
                        maxWidth: '70%',
                        bgcolor: isUser ? 'primary.main' : 'background.paper',
                        color: isUser ? 'white' : 'text.primary',
                        borderRadius: 2
                    }}
                >
                    <Typography>{message.content}</Typography>
                    {message.sources && message.sources.length > 0 && (
                        <Box sx={{ mt: 2 }}>
                            <Typography variant="subtitle2" color={isUser ? 'white' : 'text.secondary'}>
                                Sources:
                            </Typography>
                            {message.sources.map((source, idx) => (
                                <Paper
                                    key={idx}
                                    sx={{
                                        p: 1,
                                        mt: 1,
                                        bgcolor: 'rgba(0, 0, 0, 0.05)'
                                    }}
                                >
                                    <Typography variant="caption" display="block">
                                        From: {source.document_name}
                                    </Typography>
                                    <Typography variant="body2">
                                        {source.content}
                                    </Typography>
                                </Paper>
                            ))}
                        </Box>
                    )}
                </Paper>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                    {new Date(message.timestamp).toLocaleTimeString()}
                </Typography>
            </Box>
        );
    };

    return (
        <div className="documents">
            <div className="content">
                <Sidebar />
                <div className="main-content">
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={selectedDocument ? 4 : 6}>
                            <Card sx={{ mb: 3, p: 2 }}>
                                <Paper sx={{ p: 2, textAlign: 'center' }}>
                                    <input
                                        type="file"
                                        id="document-upload"
                                        style={{ display: 'none' }}
                                        onChange={handleFileUpload}
                                        accept=".pdf,.doc,.docx,.txt"
                                    />
                                    <label htmlFor="document-upload">
                                        <Button
                                            variant="contained"
                                            component="span"
                                            startIcon={<UploadIcon />}
                                            disabled={uploading}
                                            fullWidth
                                        >
                                            Upload Document
                                        </Button>
                                    </label>
                                    {uploading && (
                                        <Box sx={{ width: '100%', mt: 1 }}>
                                            <LinearProgress 
                                                variant="determinate" 
                                                value={uploadProgress} 
                                            />
                                            <Typography variant="caption">
                                                {Math.round(uploadProgress)}%
                                            </Typography>
                                        </Box>
                                    )}
                                </Paper>
                            </Card>

                            {loading && (
                                <Box sx={{ width: '100%', mb: 3 }}>
                                    <LinearProgress />
                                </Box>
                            )}

                            <Grid container spacing={2}>
                                {documents.map((doc) => (
                                    <Grid item xs={12} sm={6} md={4} key={doc.id}>
                                        <Card 
                                            sx={{ 
                                                height: '100%',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                position: 'relative',
                                                cursor: 'pointer',
                                                bgcolor: selectedDocument?.id === doc.id ? 'action.selected' : 'background.paper',
                                                '&:hover': {
                                                    boxShadow: 6
                                                }
                                            }}
                                            onClick={() => setSelectedDocument(doc)}
                                        >
                                            <Box 
                                                sx={{ 
                                                    p: 2,
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    flexGrow: 1
                                                }}
                                            >
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                    <Article color="primary" />
                                                    <IconButton
                                                        size="small"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDelete(doc.id);
                                                        }}
                                                        sx={{
                                                            position: 'absolute',
                                                            top: 8,
                                                            right: 8
                                                        }}
                                                    >
                                                        <Delete />
                                                    </IconButton>
                                                </Box>
                                                <Typography 
                                                    variant="subtitle1" 
                                                    sx={{ 
                                                        mb: 1,
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        display: '-webkit-box',
                                                        WebkitLineClamp: 2,
                                                        WebkitBoxOrient: 'vertical'
                                                    }}
                                                >
                                                    {doc.name}
                                                </Typography>
                                                <Box sx={{ mt: 'auto' }}>
                                                    <Chip
                                                        size="small"
                                                        label={doc.status}
                                                        color={
                                                            doc.status === 'complete' ? 'success' : 
                                                            doc.status === 'processing' ? 'warning' : 
                                                            'error'
                                                        }
                                                        sx={{ mr: 1 }}
                                                    />
                                                    <Typography variant="caption" color="text.secondary">
                                                        {new Date(doc.created_at).toLocaleDateString()}
                                                    </Typography>
                                                </Box>
                                                
                                                {doc.status === 'processing' && (
                                                    <Box sx={{ width: '100%', mt: 1 }}>
                                                        <LinearProgress 
                                                            variant="determinate" 
                                                            value={processingProgress[doc.id] || 0} 
                                                        />
                                                        <Typography variant="caption">
                                                            Processing: {Math.round(processingProgress[doc.id] || 0)}%
                                                        </Typography>
                                                    </Box>
                                                )}
                                                
                                                {doc.status === 'failed' && doc.processing_error && (
                                                    <Typography variant="caption" color="error">
                                                        Error: {doc.processing_error}
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>
                        </Grid>

                        <Grid item xs={12} md={selectedDocument ? 4 : 6}>
                            <Card sx={{ height: '80vh', display: 'flex', flexDirection: 'column' }}>
                                <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                        <ChatIcon />
                                        <Typography variant="h6">
                                            Chat with Documents
                                        </Typography>
                                    </Stack>
                                </Box>

                                <Box sx={{ 
                                    flexGrow: 1, 
                                    overflowY: 'auto',
                                    p: 2,
                                    display: 'flex',
                                    flexDirection: 'column'
                                }}>
                                    {chatMessages.map((message, index) => renderChatMessage(message, index))}
                                    {isTyping && (
                                        <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
                                            <CircularProgress size={20} />
                                        </Box>
                                    )}
                                    <div ref={chatEndRef} />
                                </Box>

                                <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                                    <Stack direction="row" spacing={1}>
                                        <TextField
                                            fullWidth
                                            multiline
                                            maxRows={4}
                                            value={userInput}
                                            onChange={(e) => setUserInput(e.target.value)}
                                            onKeyPress={handleKeyPress}
                                            placeholder="Ask about your documents..."
                                            variant="outlined"
                                            size="small"
                                        />
                                        <IconButton 
                                            color="primary"
                                            onClick={handleSendMessage}
                                            disabled={!userInput.trim() || isTyping}
                                        >
                                            <SendIcon />
                                        </IconButton>
                                    </Stack>
                                </Box>
                            </Card>
                        </Grid>

                        {selectedDocument && (
                            <Grid item xs={12} md={4}>
                                <Card sx={{ p: 2, position: 'sticky', top: 20 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                        <Description sx={{ mr: 1 }} />
                                        <Typography variant="h6">
                                            Document Insights
                                        </Typography>
                                    </Box>
                                    {selectedDocument.status === 'complete' ? (
                                        renderInsights(selectedDocument.initial_insights)
                                    ) : (
                                        <Typography color="text.secondary">
                                            {selectedDocument.status === 'processing' 
                                                ? 'Processing document...' 
                                                : 'Failed to generate insights'}
                                        </Typography>
                                    )}
                                </Card>
                            </Grid>
                        )}
                    </Grid>

                    {error && (
                        <Card sx={{ p: 2, bgcolor: 'error.light', mt: 2 }}>
                            <Typography color="error">{error}</Typography>
                        </Card>
                    )}
                </div>
            </div>

            <style jsx>{`
                .documents {
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
                }
            `}</style>
        </div>
    );
}

export default Documents; 