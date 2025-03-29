"use client";
import React, { useState, useEffect, useRef } from "react";
import Sidebar from "../components/Sidebar";
import { useTheme } from '@mui/material/styles';
import {
    CircularProgress, Box, Typography, Card, Grid, Button,
    TextField, useMediaQuery, Paper, Avatar, Stack, Divider,
    IconButton, Tooltip, Fade, Tabs, Tab, Dialog, DialogTitle,
    DialogContent, DialogActions, Alert, Container
} from "@mui/material";
import { Send, Save, Download, Description, History, Delete } from "@mui/icons-material";
import { createClient } from '@supabase/supabase-js';
import { useToast } from "../components/ToastProvider";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000';
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

function Reports() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const { showToast } = useToast();
    const [selectedTab, setSelectedTab] = useState(0);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [report, setReport] = useState(null);
    const [savedReports, setSavedReports] = useState([]);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [selectedReport, setSelectedReport] = useState(null);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        fetchSavedReports();
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchSavedReports = async () => {
        try {
            const { data, error } = await supabase
                .from('reports')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setSavedReports(data || []);
        } catch (err) {
            console.error('Error fetching reports:', err);
            showToast('Failed to load saved reports');
        }
    };

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMessage = {
            role: 'user',
            content: input,
            timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput("");
        setLoading(true);
        setError(null);

        try {
            // First, check if this is a report generation request
            const isReportRequest = input.toLowerCase().includes('report') || 
                                  input.toLowerCase().includes('generate') ||
                                  input.toLowerCase().includes('analysis');

            if (isReportRequest) {
                // Use the hierarchical agent team for report generation
                const response = await fetch(`${API_BASE_URL}/api/report-generator/generate`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        query: input
                    }),
                });

                if (!response.ok) {
                    throw new Error('Failed to generate report');
                }

                // Handle streaming response
                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let reportContent = '';

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value);
                    const lines = chunk.split('\n');

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const data = JSON.parse(line.slice(6));
                            if (data.content) {
                                reportContent += data.content + '\n';
                            }
                        }
                    }
                }

                // Create a report object from the response
                const generatedReport = {
                    title: `Report: ${input.substring(0, 50)}...`,
                    content: reportContent,
                    status: 'completed',
                    created_at: new Date().toISOString(),
                    completed_at: new Date().toISOString()
                };

                // Add the report to the messages
                const assistantMessage = {
                    role: 'assistant',
                    content: `I've generated a comprehensive report based on your request. You can preview, save, or download it using the buttons below.`,
                    timestamp: new Date().toISOString()
                };

                setMessages(prev => [...prev, assistantMessage]);
                setReport(generatedReport);
            } else {
                // Use the regular chat endpoint for non-report queries
                const response = await fetch(`${API_BASE_URL}/api/multi-agent/chat`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ message: input }),
                });

                if (!response.ok) {
                    throw new Error('Failed to get response');
                }

                const data = await response.json();
                const assistantMessage = {
                    role: 'assistant',
                    content: data.response,
                    timestamp: new Date().toISOString()
                };

                setMessages(prev => [...prev, assistantMessage]);
            }
        } catch (err) {
            setError(err.message || 'Failed to get response');
            showToast('Failed to process your request');
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleSaveReport = async () => {
        if (!report) return;

        try {
            const { data, error } = await supabase
                .from('reports')
                .insert([
                    {
                        title: report.title || 'Generated Report',
                        content: report.content,
                        status: 'completed',
                        created_at: new Date().toISOString(),
                        completed_at: new Date().toISOString()
                    }
                ]);

            if (error) throw error;
            showToast('Report saved successfully!');
            fetchSavedReports();
        } catch (err) {
            console.error('Error saving report:', err);
            showToast('Failed to save report');
        }
    };

    const handlePreview = (report) => {
        setSelectedReport(report);
        setPreviewOpen(true);
    };

    const handleDelete = async (report) => {
        if (!window.confirm('Are you sure you want to delete this report?')) return;

        try {
            const { error } = await supabase
                .from('reports')
                .delete()
                .eq('id', report.id);

            if (error) throw error;
            showToast('Report deleted successfully');
            fetchSavedReports();
        } catch (err) {
            console.error('Error deleting report:', err);
            showToast('Failed to delete report');
        }
    };

    const handleTabChange = (event, newValue) => {
        setSelectedTab(newValue);
    };

    return (
        <div className="reports-page">
            <div className="content">
                <Sidebar />
                <div className="main-content">
                    <Container maxWidth="lg">
                        <Card sx={{ mb: 3 }}>
                            <Tabs
                                value={selectedTab}
                                onChange={handleTabChange}
                                sx={{ borderBottom: 1, borderColor: 'divider' }}
                            >
                                <Tab 
                                    icon={<Description />} 
                                    label="Generate Report" 
                                    iconPosition="start"
                                />
                                <Tab 
                                    icon={<History />} 
                                    label="Saved Reports" 
                                    iconPosition="start"
                                />
                            </Tabs>

                            {selectedTab === 0 ? (
                                // Report Generation Tab
                                <Box sx={{ p: 3 }}>
                                    <Typography variant="h6" gutterBottom>
                                        Generate Report with AI Team
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" paragraph>
                                        Chat with our AI team of experts to generate comprehensive reports
                                    </Typography>

                                    {/* Messages Area */}
                                    <Box sx={{ 
                                        height: '400px',
                                        overflow: 'auto', 
                                        mb: 2,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 2
                                    }}>
                                        {messages.map((message, index) => (
                                            <Fade in key={index}>
                                                <Box sx={{ 
                                                    display: 'flex', 
                                                    justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                                                    gap: 1
                                                }}>
                                                    {message.role === 'assistant' && (
                                                        <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                                                            AI
                                                        </Avatar>
                                                    )}
                                                    <Paper 
                                                        sx={{ 
                                                            p: 2, 
                                                            maxWidth: '70%',
                                                            bgcolor: message.role === 'user' ? 
                                                                theme.palette.primary.main : 
                                                                theme.palette.background.paper,
                                                            color: message.role === 'user' ? 
                                                                theme.palette.primary.contrastText : 
                                                                theme.palette.text.primary
                                                        }}
                                                    >
                                                        <Typography variant="body1">
                                                            {message.content}
                                                        </Typography>
                                                        <Typography 
                                                            variant="caption" 
                                                            sx={{ 
                                                                display: 'block', 
                                                                mt: 1,
                                                                opacity: 0.7
                                                            }}
                                                        >
                                                            {new Date(message.timestamp).toLocaleTimeString()}
                                                        </Typography>
                                                    </Paper>
                                                </Box>
                                            </Fade>
                                        ))}
                                        {loading && (
                                            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                                                <CircularProgress size={24} />
                                            </Box>
                                        )}
                                        <div ref={messagesEndRef} />
                                    </Box>

                                    {/* Input Area */}
                                    <Box sx={{ mt: 2 }}>
                                        <Grid container spacing={2} alignItems="center">
                                            <Grid item xs>
                                                <TextField
                                                    fullWidth
                                                    multiline
                                                    maxRows={4}
                                                    value={input}
                                                    onChange={(e) => setInput(e.target.value)}
                                                    onKeyPress={handleKeyPress}
                                                    placeholder="Type your message..."
                                                    disabled={loading}
                                                    variant="outlined"
                                                    size="small"
                                                />
                                            </Grid>
                                            <Grid item>
                                                <Button
                                                    variant="contained"
                                                    onClick={handleSend}
                                                    disabled={loading || !input.trim()}
                                                    startIcon={loading ? <CircularProgress size={20} /> : <Send />}
                                                >
                                                    Send
                                                </Button>
                                            </Grid>
                                        </Grid>
                                    </Box>

                                    {/* Report Actions */}
                                    {report && (
                                        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                            <Tooltip title="Save Report">
                                                <IconButton onClick={handleSaveReport} color="primary">
                                                    <Save />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Download Report">
                                                <IconButton color="primary">
                                                    <Download />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    )}
                                </Box>
                            ) : (
                                // Saved Reports Tab
                                <Box sx={{ p: 3 }}>
                                    <Typography variant="h6" gutterBottom>
                                        Saved Reports
                                    </Typography>
                                    {savedReports.length === 0 ? (
                                        <Typography color="text.secondary">
                                            No saved reports yet. Generate a report using the AI team.
                                        </Typography>
                                    ) : (
                                        <Grid container spacing={2}>
                                            {savedReports.map((report) => (
                                                <Grid item xs={12} key={report.id}>
                                                    <Paper sx={{ p: 2 }}>
                                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <Box>
                                                                <Typography variant="subtitle1">
                                                                    {report.title}
                                                                </Typography>
                                                                <Typography variant="body2" color="text.secondary">
                                                                    Created: {new Date(report.created_at).toLocaleDateString()}
                                                                </Typography>
                                                            </Box>
                                                            <Box>
                                                                <Tooltip title="Preview">
                                                                    <IconButton onClick={() => handlePreview(report)} color="primary">
                                                                        <Description />
                                                                    </IconButton>
                                                                </Tooltip>
                                                                <Tooltip title="Download">
                                                                    <IconButton color="primary">
                                                                        <Download />
                                                                    </IconButton>
                                                                </Tooltip>
                                                                <Tooltip title="Delete">
                                                                    <IconButton onClick={() => handleDelete(report)} color="error">
                                                                        <Delete />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            </Box>
                                                        </Box>
                                                    </Paper>
                                                </Grid>
                                            ))}
                                        </Grid>
                                    )}
                                </Box>
                            )}
                        </Card>
                    </Container>
                </div>
            </div>

            {/* Report Preview Dialog */}
            <Dialog
                open={previewOpen}
                onClose={() => setPreviewOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    Report Preview
                </DialogTitle>
                <DialogContent>
                    {selectedReport && (
                        <Box>
                            <Typography variant="h6" gutterBottom>
                                {selectedReport.title}
                            </Typography>
                            <Typography color="text.secondary" gutterBottom>
                                Created: {new Date(selectedReport.created_at).toLocaleDateString()}
                            </Typography>
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                                {selectedReport.content}
                            </Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setPreviewOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>

            <style jsx>{`
                .reports-page {
                    display: flex;
                    flex-direction: column;
                    min-height: 100vh;
                    background-color: var(--background);
                }
                .content {
                    display: flex;
                    flex-direction: row;
                    flex-grow: 1;
                }
                .main-content {
                    flex-grow: 1;
                    padding: ${theme.spacing(3)};
                    background-color: ${theme.palette.background.default};
                }
            `}</style>
        </div>
    );
}

export default Reports; 