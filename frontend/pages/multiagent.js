"use client";
import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import { useTheme } from '@mui/material/styles';
import {
    CircularProgress, Box, Typography, Card, Grid, Button,
    TextField, useMediaQuery, Paper, Avatar, Stack, Divider,
    IconButton, Tooltip, Fade, List, ListItem, ListItemIcon, ListItemText, Alert
} from "@mui/material";
import { Send, Save, Download } from "@mui/icons-material";
import { createClient } from '@supabase/supabase-js';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000';
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

function MultiAgentConsultant() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [report, setReport] = useState(null);
    const messagesEndRef = useRef(null);
    const [currentStatus, setCurrentStatus] = useState(null);
    const [currentAgent, setCurrentAgent] = useState(null);
    const [reportSections, setReportSections] = useState({
        strategy: null,
        market: null,
        financial: null,
        implementation: null
    });

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

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
        setCurrentStatus(null);
        setCurrentAgent(null);
        setReportSections({
            strategy: null,
            market: null,
            financial: null,
            implementation: null
        });

        try {
            const response = await fetch(`${API_BASE_URL}/api/multi-agent/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: input,
                    client_info: {
                        name: "Client",
                        industry: "Technology",
                        size: "Enterprise"
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            let assistantMessage = null;

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || ''; // Keep the last incomplete line in the buffer

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const dataStr = line.slice(6);
                        if (dataStr === '[DONE]') {
                            setLoading(false);
                            if (assistantMessage) {
                                setMessages(prev => [...prev, assistantMessage]);
                            }
                            continue;
                        }

                        try {
                            const data = JSON.parse(dataStr);
                            
                            if (data.type === 'status') {
                                setCurrentStatus(data.content);
                                setCurrentAgent(data.agent);
                            } else if (data.type === 'content') {
                                setReportSections(prev => ({
                                    ...prev,
                                    [data.section]: data.content
                                }));
                            } else if (data.type === 'report') {
                                setReport(data.content);
                                // Create a structured message from the report
                                assistantMessage = {
                                    role: 'assistant',
                                    content: data.content,
                                    sections: [
                                        {
                                            title: 'Executive Summary',
                                            content: data.content.executive_summary.overview || []
                                        },
                                        {
                                            title: 'Key Findings',
                                            content: data.content.executive_summary.key_findings || []
                                        },
                                        {
                                            title: 'Market Highlights',
                                            content: data.content.executive_summary.market_highlights || []
                                        },
                                        {
                                            title: 'Financial Highlights',
                                            content: data.content.executive_summary.financial_highlights || []
                                        },
                                        {
                                            title: 'Strategic Analysis',
                                            content: data.content.strategic_analysis.strategic_recommendations || []
                                        },
                                        {
                                            title: 'Market Analysis',
                                            content: data.content.market_analysis.market_opportunities || []
                                        },
                                        {
                                            title: 'Implementation Roadmap',
                                            content: data.content.implementation_roadmap.phases || []
                                        }
                                    ].filter(section => section.content.length > 0),
                                    timestamp: new Date().toISOString()
                                };
                                setLoading(false);
                            } else if (data.type === 'error') {
                                setError(data.content);
                                setLoading(false);
                            }
                        } catch (parseError) {
                            console.error('Error parsing SSE data:', parseError);
                            console.error('Raw data:', dataStr);
                            setError('Error parsing server response');
                            setLoading(false);
                        }
                    }
                }
            }
        } catch (err) {
            console.error('Error in handleSend:', err);
            setError(err.message || 'Failed to get response');
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
            alert('Report saved successfully!');
        } catch (err) {
            console.error('Error saving report:', err);
            alert('Failed to save report');
        }
    };

    return (
        <div className="multi-agent-consultant">
            <div className="content">
                <Sidebar />
                <div className="main-content">
                    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                            <Typography variant="h5" gutterBottom>
                                Team Collaboration
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Chat with our AI team of experts for comprehensive analysis and insights
                            </Typography>
                        </Box>

                        {/* Status Display */}
                        {currentStatus && (
                            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                                <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                                    <Stack direction="row" spacing={2} alignItems="center">
                                        <CircularProgress size={20} />
                                        <Box>
                                            <Typography variant="subtitle2" color="primary">
                                                {currentAgent.charAt(0).toUpperCase() + currentAgent.slice(1)} Agent
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {currentStatus}
                                            </Typography>
                                        </Box>
                                    </Stack>
                                </Paper>
                            </Box>
                        )}

                        {/* Messages Area */}
                        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
                            {messages.map((message, index) => (
                                <Box key={index} sx={{ mb: 2 }}>
                                    <Typography
                                        variant="subtitle2"
                                        color="text.secondary"
                                        gutterBottom
                                    >
                                        {message.role === 'user' ? 'You' : 'AI Team'}
                                    </Typography>
                                    <Paper
                                        sx={{
                                            p: 2,
                                            backgroundColor: message.role === 'user' ? 'background.paper' : 'background.default',
                                            border: 1,
                                            borderColor: 'divider'
                                        }}
                                    >
                                        {message.sections ? (
                                            // Render structured sections
                                            message.sections.map((section, sectionIndex) => (
                                                <Box key={sectionIndex} sx={{ mb: 2 }}>
                                                    <Typography variant="subtitle1" gutterBottom>
                                                        {section.title}
                                                    </Typography>
                                                    <List>
                                                        {section.content.map((item, itemIndex) => (
                                                            <ListItem key={itemIndex}>
                                                                <ListItemIcon>
                                                                    <FiberManualRecordIcon sx={{ fontSize: 8 }} />
                                                                </ListItemIcon>
                                                                <ListItemText primary={item} />
                                                            </ListItem>
                                                        ))}
                                                    </List>
                                                </Box>
                                            ))
                                        ) : (
                                            // Render plain text message
                                            <Typography variant="body1">
                                                {message.content}
                                            </Typography>
                                        )}
                                    </Paper>
                                </Box>
                            ))}
                            {loading && !currentStatus && (
                                <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                                    <CircularProgress size={24} />
                                </Box>
                            )}
                            {error && (
                                <Alert severity="error" sx={{ mt: 2 }}>
                                    {error}
                                </Alert>
                            )}
                        </Box>

                        {/* Input Area */}
                        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
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
                            <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                                <Stack direction="row" spacing={1} justifyContent="flex-end">
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
                                </Stack>
                            </Box>
                        )}
                    </Card>
                </div>
            </div>

            <style jsx>{`
                .multi-agent-consultant {
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

export default MultiAgentConsultant;