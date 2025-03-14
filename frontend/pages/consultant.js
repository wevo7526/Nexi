"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { 
    CircularProgress, 
    Typography, 
    Box,
    Card,
    Grid,
    Button,
    IconButton,
    Chip,
    Menu,
    MenuItem,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from "@mui/material";
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

    useEffect(() => {
        const checkSession = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push(`/auth?redirectTo=/consultant`);
            } else {
                setUser(user);
                // Load user's conversations
                loadConversations(user.id);
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
                .order('created_at', { ascending: false });

            if (error) throw error;
            setConversations(data || []);
        } catch (error) {
            console.error("Error loading conversations:", error);
        }
    };

    const handleGetAnswer = async () => {
        if (!query.trim()) return;
        
        setLoading(true);
        setError(null);
        
        const formData = new FormData();
        formData.append("query", query);
        formData.append("thread_id", currentConversation?.id || "default");
        if (user?.id) {
            formData.append("user_id", user.id);
        }
        if (file) {
            formData.append("file", file);
        }

        try {
            const response = await axios.post("http://127.0.0.1:5000/get_answer", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            const newMessage = {
                type: 'message',
                content: response.data.answer,
                timestamp: new Date().toISOString(),
                role: 'assistant'
            };

            if (currentConversation) {
                // Update existing conversation
                const updatedConversation = {
                    ...currentConversation,
                    messages: [...currentConversation.messages, newMessage]
                };
                setCurrentConversation(updatedConversation);
                // Update in Supabase
                await updateConversationInSupabase(updatedConversation);
            } else {
                // Create new conversation
                const newConversation = {
                    id: Date.now().toString(),
                    title: query.substring(0, 50) + "...",
                    messages: [
                        {
                            type: 'message',
                            content: query,
                            timestamp: new Date().toISOString(),
                            role: 'user'
                        },
                        newMessage
                    ],
                    created_at: new Date().toISOString(),
                    user_id: user.id
                };
                setCurrentConversation(newConversation);
                setConversations([newConversation, ...conversations]);
                // Save to Supabase
                await saveConversationToSupabase(newConversation);
            }

            setQuery("");
            setFile(null);
        } catch (error) {
            console.error("Error getting answer:", error);
            setError("Failed to get an answer. Please try again.");
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

    if (!user) return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
            <CircularProgress />
        </Box>
    );

    return (
        <div className="consultant">
            <Sidebar />
            <div className="main-content">
                <Navbar />
                
                {/* Quick Actions */}
                <Box mb={4} mt={3}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={4}>
                            <Card className="quick-action-card">
                                <Typography variant="h6">Active Conversations</Typography>
                                <Typography variant="h3">{conversations.length}</Typography>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Card className="quick-action-card">
                                <Typography variant="h6">Files Analyzed</Typography>
                                <Typography variant="h3">{conversations.reduce((acc, conv) => 
                                    acc + (conv.messages.filter(m => m.type === 'file').length), 0)}</Typography>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Card className="quick-action-card">
                                <Typography variant="h6">Total Interactions</Typography>
                                <Typography variant="h3">{conversations.reduce((acc, conv) => 
                                    acc + conv.messages.length, 0)}</Typography>
                            </Card>
                        </Grid>
                    </Grid>
                </Box>

                {/* Query Section */}
                <div className="query-section">
                    <Box mb={2} display="flex" gap={1}>
                        <Button
                            variant="outlined"
                            onClick={handleTemplateClick}
                            className="template-button"
                        >
                            Use Template
                        </Button>
                        {file && (
                            <Chip
                                label={file.name}
                                onDelete={() => setFile(null)}
                                className="file-chip"
                            />
                        )}
                    </Box>
                    
                    <div className="input-container">
                        <textarea
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Ask me anything about your business..."
                            className="query-input"
                            rows={3}
                        />
                        <div className="action-buttons">
                            <input
                                type="file"
                                id="file-upload"
                                accept=".docx,.pdf,.xls,.xlsx,.ppt,.pptx"
                                onChange={handleFileChange}
                                style={{ display: 'none' }}
                            />
                            <label htmlFor="file-upload">
                                <Button
                                    component="span"
                                    variant="outlined"
                                    className="upload-button"
                                >
                                    Attach File
                                </Button>
                            </label>
                            <Button
                                onClick={handleGetAnswer}
                                variant="contained"
                                disabled={loading || !query.trim()}
                                className="submit-button"
                            >
                                {loading ? <CircularProgress size={24} /> : "Ask Question"}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Conversation Display */}
                <div className="conversation-section">
                    {error && (
                        <Box mb={2}>
                            <Typography color="error">{error}</Typography>
                        </Box>
                    )}
                    
                    {currentConversation?.messages.map((message, index) => (
                        <Box
                            key={index}
                            className={`message ${message.role}`}
                            mb={2}
                        >
                            <Typography variant="body1">
                                {message.content}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                                {new Date(message.timestamp).toLocaleTimeString()}
                            </Typography>
                        </Box>
                    ))}
                </div>

                {/* Template Menu */}
                <Menu
                    anchorEl={templateMenuAnchor}
                    open={Boolean(templateMenuAnchor)}
                    onClose={() => setTemplateMenuAnchor(null)}
                >
                    {Object.keys(QUERY_TEMPLATES).map((category) => (
                        <MenuItem
                            key={category}
                            onClick={() => handleCategorySelect(category)}
                        >
                            {category}
                        </MenuItem>
                    ))}
                </Menu>

                {/* Template Selection Dialog */}
                <Dialog
                    open={Boolean(selectedCategory)}
                    onClose={() => setSelectedCategory(null)}
                    maxWidth="sm"
                    fullWidth
                >
                    <DialogTitle>{selectedCategory}</DialogTitle>
                    <DialogContent>
                        {selectedCategory && QUERY_TEMPLATES[selectedCategory].map((template, index) => (
                            <Button
                                key={index}
                                fullWidth
                                variant="outlined"
                                onClick={() => handleTemplateSelect(template)}
                                sx={{ mb: 1 }}
                            >
                                {template}
                            </Button>
                        ))}
                    </DialogContent>
                </Dialog>

                {/* Export Dialog */}
                <Dialog
                    open={showExportDialog}
                    onClose={() => setShowExportDialog(false)}
                >
                    <DialogTitle>Export Conversation</DialogTitle>
                    <DialogContent>
                        <Typography>
                            Download this conversation as a text file?
                        </Typography>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setShowExportDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleExport} variant="contained">
                            Export
                        </Button>
                    </DialogActions>
                </Dialog>
            </div>

            <style jsx>{`
                .consultant {
                    display: flex;
                    min-height: 100vh;
                    background: #f8f9fa;
                }

                .main-content {
                    flex-grow: 1;
                    padding: 24px;
                    overflow-y: auto;
                }

                .quick-action-card {
                    padding: 24px;
                    text-align: center;
                    height: 100%;
                    transition: transform 0.2s ease;
                }

                .quick-action-card:hover {
                    transform: translateY(-2px);
                }

                .input-container {
                    background: white;
                    border-radius: 12px;
                    padding: 16px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                }

                .query-input {
                    width: 100%;
                    padding: 12px;
                    font-size: 16px;
                    border: 1px solid #e0e0e0;
                    border-radius: 8px;
                    resize: vertical;
                    min-height: 60px;
                    margin-bottom: 16px;
                }

                .query-input:focus {
                    outline: none;
                    border-color: #1a1a1a;
                }

                .action-buttons {
                    display: flex;
                    justify-content: flex-end;
                    gap: 12px;
                }

                .upload-button {
                    color: #1a1a1a;
                    border-color: #1a1a1a;
                }

                .submit-button {
                    background: #1a1a1a;
                    color: white;
                    min-width: 140px;
                }

                .submit-button:hover {
                    background: #333;
                }

                .conversation-section {
                    margin-top: 32px;
                }

                .message {
                    padding: 16px;
                    border-radius: 12px;
                    margin-bottom: 16px;
                }

                .message.user {
                    background: #f0f0f0;
                    margin-left: auto;
                    max-width: 80%;
                }

                .message.assistant {
                    background: white;
                    margin-right: auto;
                    max-width: 80%;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                }

                .template-button {
                    color: #1a1a1a;
                    border-color: #1a1a1a;
                }

                .file-chip {
                    background: #f0f0f0;
                }

                @media (max-width: 768px) {
                    .main-content {
                        padding: 16px;
                    }

                    .message {
                        max-width: 100%;
                    }
                }
            `}</style>
        </div>
    );
}

export default Consultant;