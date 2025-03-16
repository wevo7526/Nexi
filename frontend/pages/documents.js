"use client";
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import {
    CircularProgress, Typography, Box, Card, Grid,
    IconButton, Paper, Chip, Stack, TextField,
    LinearProgress, Button, Divider, List,
    ListItem, ListItemText, ListItemSecondaryAction,
    Container, Snackbar, Alert
} from "@mui/material";
import {
    Upload as UploadIcon, Delete, Send as SendIcon,
    Article, Description, Chat as ChatIcon,
    AttachmentOutlined as AttachmentIcon
} from "@mui/icons-material";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/router";
import {
    uploadDocument,
    getDocuments,
    deleteDocument,
    getDocumentStatus,
} from "../lib/api";

function Documents() {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({});
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [user, setUser] = useState(null);
    const router = useRouter();
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
    const [processingProgress, setProcessingProgress] = useState({});
    const [selectedDocument, setSelectedDocument] = useState(null);
    const [chatMessages, setChatMessages] = useState([]);
    const [userInput, setUserInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const chatEndRef = useRef(null);

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    const showNotification = (message, severity = 'info') => {
        setSnackbar({
            open: true,
            message,
            severity
        });
    };

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
                showNotification('Error checking session', 'error');
            }
        };
        checkSession();
    }, [router]);

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file size (max 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB in bytes
        if (file.size > maxSize) {
            setError('File size exceeds 10MB limit');
            return;
        }

        // Validate file type
        const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
        if (!allowedTypes.includes(file.type)) {
            setError('File type not supported. Please upload PDF, DOC, DOCX, or TXT files.');
            return;
        }

        try {
            setUploading(true);
            const response = await uploadDocument(file);
            
            if (response.document_id) {
                // Start polling for document status
                const pollInterval = setInterval(async () => {
                    try {
                        const statusResponse = await getDocumentStatus(response.document_id);
                        if (statusResponse.status === 'completed') {
                            clearInterval(pollInterval);
                            setSuccess('Document uploaded and processed successfully');
                            fetchDocuments(); // Refresh document list
                            setUploading(false);
                        } else if (statusResponse.status === 'failed') {
                            clearInterval(pollInterval);
                            setError('Document processing failed');
                            setUploading(false);
                        }
                    } catch (error) {
                        clearInterval(pollInterval);
                        setError(error.message);
                        setUploading(false);
                    }
                }, 2000); // Poll every 2 seconds
            }
        } catch (error) {
            setError(error.message);
            setUploading(false);
        }
    };

    const fetchDocuments = async () => {
        try {
            setLoading(true);
            const data = await getDocuments();
            setDocuments(data.documents || []);
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (documentId) => {
        try {
            await deleteDocument(documentId);
            setSuccess('Document deleted successfully');
            fetchDocuments(); // Refresh document list
        } catch (error) {
            setError(error.message);
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
            
            // Add user message to chat
            const userMessage = {
                role: 'user',
                content: userInput,
                timestamp: new Date().toISOString()
            };
            setChatMessages(prev => [...prev, userMessage]);
            setUserInput("");

            // Get response from agent
            const response = await axios.post('/api/chat', { 
                message: userInput,
                chat_history: chatMessages
            });

            // Add assistant response to chat
            if (response.data.success) {
                const assistantMessage = {
                    role: 'assistant',
                    content: response.data.answer,
                    sources: response.data.sources,
                    timestamp: new Date().toISOString()
                };
                setChatMessages(prev => [...prev, assistantMessage]);
            } else {
                showNotification(response.data.error || 'Error getting response', 'error');
            }
        } catch (error) {
            console.error("Error sending message:", error);
            showNotification(error.message, 'error');
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
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
            <div className="content">
                <Sidebar />
                <div className="main-content">
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={selectedDocument ? 4 : 6}>
                            <Box mb={8}>
                                <Typography variant="h4" gutterBottom>
                                    Documents
                                </Typography>
                                <input
                                    type="file"
                                    id="file-upload"
                                    style={{ display: "none" }}
                                    onChange={handleFileUpload}
                                    accept=".txt,.pdf,.doc,.docx"
                                />
                                <Button
                                    variant="contained"
                                    startIcon={<AttachmentIcon />}
                                    onClick={() => document.getElementById("file-upload").click()}
                                    disabled={uploading}
                                    sx={{ mb: 4 }}
                                >
                                    {uploading ? "Uploading..." : "Upload Document"}
                                </Button>
                            </Box>

                            {loading && (
                                <Box sx={{ width: '100%', mb: 3 }}>
                                    <LinearProgress />
                                </Box>
                            )}

                            <Paper elevation={2}>
                                <List>
                                    {documents.map((doc) => (
                                        <ListItem
                                            key={doc.id}
                                            sx={{
                                                borderBottom: "1px solid",
                                                borderColor: "divider",
                                                "&:last-child": { borderBottom: "none" },
                                            }}
                                        >
                                            <ListItemText
                                                primary={doc.filename}
                                                secondary={`Uploaded: ${new Date(
                                                    doc.created_at
                                                ).toLocaleDateString()}`}
                                            />
                                            <ListItemSecondaryAction>
                                                {uploadProgress[doc.id] === "processing" && (
                                                    <CircularProgress size={20} sx={{ mr: 2 }} />
                                                )}
                                                <IconButton
                                                    edge="end"
                                                    aria-label="delete"
                                                    onClick={() => handleDelete(doc.id)}
                                                    color="error"
                                                >
                                                    <Delete />
                                                </IconButton>
                                            </ListItemSecondaryAction>
                                        </ListItem>
                                    ))}
                                    {documents.length === 0 && (
                                        <ListItem>
                                            <ListItemText primary="No documents uploaded yet" />
                                        </ListItem>
                                    )}
                                </List>
                            </Paper>
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