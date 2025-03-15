"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import { useToast } from "../components/ToastProvider";
import {
    CircularProgress, Typography, Box, Card, Grid, Button,
    IconButton, TextField, Paper, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow,
    InputAdornment, Badge, Tabs, Tab, Accordion,
    AccordionSummary, AccordionDetails, Chip, Stack,
    LinearProgress, Avatar, Divider
} from "@mui/material";
import {
    AttachFile, Send, Delete, SaveAlt,
    ExpandMore, Assessment, Timeline,
    TrendingUp, Assignment, Chat as ChatIcon
} from "@mui/icons-material";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/router";
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer, ScatterChart, Scatter
} from 'recharts';

function Consultant({ initialData }) {
    const [query, setQuery] = useState("");
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState(null);
    const [error, setError] = useState(null);
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState(0);
    const router = useRouter();
    const { showToast } = useToast();

    useEffect(() => {
        const checkSession = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    router.push(`/auth?redirectTo=/consultant`);
                } else {
                    setUser(user);
                }
            } catch (error) {
                showToast('Error checking session', 'error');
            }
        };
        checkSession();
    }, [router]);

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
        
        const userMessage = {
            content: query,
            timestamp: new Date().toISOString(),
            role: 'user'
        };
        
        try {
            const formData = new FormData();
            formData.append("query", query);
            
            // Add chat history to the request
            const chatHistory = conversations.map(msg => ({
                content: msg.content,
                role: msg.role
            }));
            formData.append("chat_history", JSON.stringify(chatHistory));
            
            if (user?.id) {
                formData.append("user_id", user.id);
            }
            if (file) {
                formData.append("file", file);
            }

            const response = await axios.post("http://127.0.0.1:5000/get_answer", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            const assistantMessage = {
                content: response.data.answer,
                timestamp: new Date().toISOString(),
                role: 'assistant'
            };

            setConversations(prev => [...prev, userMessage, assistantMessage]);
            setQuery("");
            setFile(null);
        } catch (error) {
            console.error("Error getting answer:", error);
            setError(error.response?.data?.error || "Failed to get an answer. Please try again.");
            showToast('Error getting answer', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (event) => {
        const selectedFile = event.target.files[0];
        setFile(selectedFile);
    };

    const renderChart = (data, type) => {
        switch (type) {
            case 'line':
                return (
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="value" stroke="#8884d8" />
                        </LineChart>
                    </ResponsiveContainer>
                );
            case 'bar':
                return (
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="value" fill="#8884d8" />
                        </BarChart>
                    </ResponsiveContainer>
                );
            case 'pie':
                return (
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={data}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={100}
                                fill="#8884d8"
                                label
                            />
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                );
            case 'scatter':
                return (
                    <ResponsiveContainer width="100%" height={300}>
                        <ScatterChart>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="x" />
                            <YAxis dataKey="y" />
                            <Tooltip />
                            <Legend />
                            <Scatter name="Data" data={data} fill="#8884d8" />
                        </ScatterChart>
                    </ResponsiveContainer>
                );
            default:
                return null;
        }
    };

    const renderMessage = (message, index) => {
        const isUser = message.role === 'user';
        
        return (
            <Box
                key={index}
                sx={{
                    display: 'flex',
                    flexDirection: isUser ? 'row-reverse' : 'row',
                    mb: 2,
                    gap: 2
                }}
            >
                <Avatar
                    sx={{
                        bgcolor: isUser ? 'primary.main' : 'secondary.main',
                        width: 40,
                        height: 40
                    }}
                >
                    {isUser ? user?.email?.[0].toUpperCase() : 'AI'}
                </Avatar>
                <Paper
                    sx={{
                        p: 2,
                        maxWidth: '70%',
                        bgcolor: isUser ? 'primary.light' : 'background.paper',
                        borderRadius: 2
                    }}
                >
                    {isUser ? (
                        <Typography>{message.content}</Typography>
                    ) : (
                        renderStructuredAnalysis(message.content)
                    )}
                </Paper>
            </Box>
        );
    };

    const renderAnalysisSection = (title, content, icon) => (
        <Accordion defaultExpanded sx={{ mb: 2 }}>
            <AccordionSummary 
                expandIcon={<ExpandMore />}
                sx={{ 
                    bgcolor: 'primary.main', 
                    color: 'white',
                    '&:hover': { bgcolor: 'primary.dark' }
                }}
            >
                <Stack direction="row" spacing={1} alignItems="center">
                    {icon}
                    <Typography variant="h6">{title}</Typography>
                </Stack>
            </AccordionSummary>
            <AccordionDetails>
                {content}
            </AccordionDetails>
        </Accordion>
    );

    const parseListItems = (text, section = null) => {
        const items = [];
        const lines = text.split('\n');
        let inSection = !section;
        let currentSection = '';

        for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine) continue;

            // Check if this is a section header in PESTEL
            if (section && ['Political:', 'Economic:', 'Social:', 'Technological:', 'Environmental:', 'Legal:'].includes(trimmedLine)) {
                currentSection = trimmedLine.replace(':', '');
                inSection = currentSection === section;
                continue;
            }
            // For SWOT sections
            else if (section && trimmedLine.toLowerCase().includes(section.toLowerCase())) {
                inSection = true;
                continue;
            } else if (section && trimmedLine.match(/^[A-Z][a-z]+:/) && !['Political:', 'Economic:', 'Social:', 'Technological:', 'Environmental:', 'Legal:'].includes(trimmedLine)) {
                inSection = false;
            }

            if (inSection && (trimmedLine.startsWith('•') || trimmedLine.startsWith('-'))) {
                items.push(trimmedLine.replace(/^[•\-]\s*/, ''));
            } else if (inSection && !section) {
                items.push(trimmedLine);
            }
        }

        return items;
    };

    const renderStructuredAnalysis = (content) => {
        // Extract different sections using more precise regex patterns
        const sections = {
            swot: content.match(/SWOT Analysis:([\s\S]*?)(?=(?:PESTEL Analysis:|Porter's Five Forces:|BCG Matrix:|Recommendations:|Implementation Plan:|$))/i),
            pestel: content.match(/PESTEL Analysis:([\s\S]*?)(?=(?:SWOT Analysis:|Porter's Five Forces:|BCG Matrix:|Recommendations:|Implementation Plan:|$))/i),
            fiveForces: content.match(/Porter's Five Forces:([\s\S]*?)(?=(?:SWOT Analysis:|PESTEL Analysis:|BCG Matrix:|Recommendations:|Implementation Plan:|$))/i),
            bcgMatrix: content.match(/BCG Matrix:([\s\S]*?)(?=(?:SWOT Analysis:|PESTEL Analysis:|Porter's Five Forces:|Recommendations:|Implementation Plan:|$))/i),
            recommendations: content.match(/Recommendations:([\s\S]*?)(?=(?:Implementation Plan:|$))/i),
            implementation: content.match(/Implementation Plan:([\s\S]*?)(?=$)/i)
        };

        // If no structured sections are found, render as plain text
        if (!Object.values(sections).some(section => section)) {
            return (
                <Paper elevation={0} sx={{ border: '1px solid rgba(224, 224, 224, 1)', p: 2 }}>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
                        {content}
                    </Typography>
                </Paper>
            );
        }

        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {sections.swot && (
                    <Box>
                        <Typography variant="h6" sx={{ mb: 2, color: 'primary.main', fontWeight: 500 }}>
                            SWOT Analysis
                        </Typography>
                        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid rgba(224, 224, 224, 1)' }}>
                            <Table>
                                <TableBody>
                                    <TableRow>
                                        <TableCell sx={{ 
                                            width: '50%', 
                                            borderRight: '1px solid rgba(224, 224, 224, 1)',
                                            borderBottom: '1px solid rgba(224, 224, 224, 1)',
                                            bgcolor: 'rgba(76, 175, 80, 0.08)'
                                        }}>
                                            <Typography variant="subtitle2" color="primary" gutterBottom>
                                                Strengths
                                            </Typography>
                                            <Box component="ul" sx={{ m: 0, pl: 2 }}>
                                                {parseListItems(sections.swot[1], 'Strengths').map((item, index) => (
                                                    <li key={index}>{item}</li>
                                                ))}
                                            </Box>
                                        </TableCell>
                                        <TableCell sx={{ 
                                            width: '50%',
                                            borderBottom: '1px solid rgba(224, 224, 224, 1)',
                                            bgcolor: 'rgba(244, 67, 54, 0.08)'
                                        }}>
                                            <Typography variant="subtitle2" color="error" gutterBottom>
                                                Weaknesses
                                            </Typography>
                                            <Box component="ul" sx={{ m: 0, pl: 2 }}>
                                                {parseListItems(sections.swot[1], 'Weaknesses').map((item, index) => (
                                                    <li key={index}>{item}</li>
                                                ))}
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell sx={{ 
                                            borderRight: '1px solid rgba(224, 224, 224, 1)',
                                            bgcolor: 'rgba(33, 150, 243, 0.08)'
                                        }}>
                                            <Typography variant="subtitle2" color="info.main" gutterBottom>
                                                Opportunities
                                            </Typography>
                                            <Box component="ul" sx={{ m: 0, pl: 2 }}>
                                                {parseListItems(sections.swot[1], 'Opportunities').map((item, index) => (
                                                    <li key={index}>{item}</li>
                                                ))}
                                            </Box>
                                        </TableCell>
                                        <TableCell sx={{ bgcolor: 'rgba(255, 152, 0, 0.08)' }}>
                                            <Typography variant="subtitle2" color="warning.main" gutterBottom>
                                                Threats
                                            </Typography>
                                            <Box component="ul" sx={{ m: 0, pl: 2 }}>
                                                {parseListItems(sections.swot[1], 'Threats').map((item, index) => (
                                                    <li key={index}>{item}</li>
                                                ))}
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                )}

                {sections.pestel && (
                    <Box>
                        <Typography variant="h6" sx={{ mb: 2, color: 'primary.main', fontWeight: 500 }}>
                            PESTEL Analysis
                        </Typography>
                        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid rgba(224, 224, 224, 1)' }}>
                            <Table>
                                <TableBody>
                                    {['Political', 'Economic', 'Social', 'Technological', 'Environmental', 'Legal'].map((factor, index) => {
                                        const items = parseListItems(sections.pestel[1], factor);
                                        return items.length > 0 ? (
                                            <TableRow key={factor}>
                                                <TableCell 
                                                    sx={{ 
                                                        width: '20%',
                                                        bgcolor: index % 2 === 0 ? 'rgba(0, 0, 0, 0.02)' : 'transparent',
                                                        borderRight: '1px solid rgba(224, 224, 224, 1)'
                                                    }}
                                                >
                                                    <Typography variant="subtitle2" color="primary">
                                                        {factor}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell sx={{ bgcolor: index % 2 === 0 ? 'rgba(0, 0, 0, 0.02)' : 'transparent' }}>
                                                    <Box component="ul" sx={{ m: 0, pl: 2 }}>
                                                        {items.map((item, idx) => (
                                                            <li key={idx}>{item}</li>
                                                        ))}
                                                    </Box>
                                                </TableCell>
                                            </TableRow>
                                        ) : null;
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                )}

                {sections.fiveForces && (
                    <Box>
                        <Typography variant="h6" sx={{ mb: 2, color: 'primary.main', fontWeight: 500 }}>
                            Porter's Five Forces
                        </Typography>
                        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid rgba(224, 224, 224, 1)' }}>
                            <Table>
                                <TableBody>
                                    {[
                                        'Threat of New Entrants',
                                        'Bargaining Power of Suppliers',
                                        'Bargaining Power of Buyers',
                                        'Threat of Substitutes',
                                        'Competitive Rivalry'
                                    ].map((force, index) => {
                                        const items = parseListItems(sections.fiveForces[1], force);
                                        return items.length > 0 ? (
                                            <TableRow key={force}>
                                                <TableCell 
                                                    sx={{ 
                                                        width: '25%',
                                                        bgcolor: index % 2 === 0 ? 'rgba(0, 0, 0, 0.02)' : 'transparent',
                                                        borderRight: '1px solid rgba(224, 224, 224, 1)'
                                                    }}
                                                >
                                                    <Typography variant="subtitle2" color="primary">
                                                        {force}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell sx={{ bgcolor: index % 2 === 0 ? 'rgba(0, 0, 0, 0.02)' : 'transparent' }}>
                                                    <Box component="ul" sx={{ m: 0, pl: 2 }}>
                                                        {items.map((item, idx) => (
                                                            <li key={idx}>{item}</li>
                                                        ))}
                                                    </Box>
                                                </TableCell>
                                            </TableRow>
                                        ) : null;
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                )}

                {sections.bcgMatrix && (
                    <Box>
                        <Typography variant="h6" sx={{ mb: 2, color: 'primary.main', fontWeight: 500 }}>
                            BCG Matrix
                        </Typography>
                        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid rgba(224, 224, 224, 1)' }}>
                            <Table>
                                <TableBody>
                                    <TableRow>
                                        <TableCell sx={{ 
                                            width: '50%', 
                                            borderRight: '1px solid rgba(224, 224, 224, 1)',
                                            borderBottom: '1px solid rgba(224, 224, 224, 1)',
                                            bgcolor: 'rgba(76, 175, 80, 0.08)'
                                        }}>
                                            <Typography variant="subtitle2" color="success.main" gutterBottom>
                                                Stars
                                            </Typography>
                                            <Box component="ul" sx={{ m: 0, pl: 2 }}>
                                                {parseListItems(sections.bcgMatrix[1], 'Stars').map((item, index) => (
                                                    <li key={index}>{item}</li>
                                                ))}
                                            </Box>
                                        </TableCell>
                                        <TableCell sx={{ 
                                            width: '50%',
                                            borderBottom: '1px solid rgba(224, 224, 224, 1)',
                                            bgcolor: 'rgba(33, 150, 243, 0.08)'
                                        }}>
                                            <Typography variant="subtitle2" color="info.main" gutterBottom>
                                                Question Marks
                                            </Typography>
                                            <Box component="ul" sx={{ m: 0, pl: 2 }}>
                                                {parseListItems(sections.bcgMatrix[1], 'Question Marks').map((item, index) => (
                                                    <li key={index}>{item}</li>
                                                ))}
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell sx={{ 
                                            borderRight: '1px solid rgba(224, 224, 224, 1)',
                                            bgcolor: 'rgba(255, 152, 0, 0.08)'
                                        }}>
                                            <Typography variant="subtitle2" color="warning.main" gutterBottom>
                                                Cash Cows
                                            </Typography>
                                            <Box component="ul" sx={{ m: 0, pl: 2 }}>
                                                {parseListItems(sections.bcgMatrix[1], 'Cash Cows').map((item, index) => (
                                                    <li key={index}>{item}</li>
                                                ))}
                                            </Box>
                                        </TableCell>
                                        <TableCell sx={{ bgcolor: 'rgba(244, 67, 54, 0.08)' }}>
                                            <Typography variant="subtitle2" color="error" gutterBottom>
                                                Dogs
                                            </Typography>
                                            <Box component="ul" sx={{ m: 0, pl: 2 }}>
                                                {parseListItems(sections.bcgMatrix[1], 'Dogs').map((item, index) => (
                                                    <li key={index}>{item}</li>
                                                ))}
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                )}

                {sections.recommendations && (
                    <Box>
                        <Typography variant="h6" sx={{ mb: 2, color: 'primary.main', fontWeight: 500 }}>
                            Recommendations
                        </Typography>
                        <Paper elevation={0} sx={{ border: '1px solid rgba(224, 224, 224, 1)', p: 2 }}>
                            <Box component="ul" sx={{ m: 0, pl: 2 }}>
                                {parseListItems(sections.recommendations[1]).map((item, index) => (
                                    <li key={index} style={{ marginBottom: '12px', lineHeight: 1.6 }}>{item}</li>
                                ))}
                            </Box>
                        </Paper>
                    </Box>
                )}

                {sections.implementation && (
                    <Box>
                        <Typography variant="h6" sx={{ mb: 2, color: 'primary.main', fontWeight: 500 }}>
                            Implementation Plan
                        </Typography>
                        <Paper elevation={0} sx={{ border: '1px solid rgba(224, 224, 224, 1)', p: 2 }}>
                            <Box component="ol" sx={{ m: 0, pl: 3 }}>
                                {parseListItems(sections.implementation[1]).map((item, index) => (
                                    <li key={index} style={{ marginBottom: '12px', lineHeight: 1.6 }}>{item}</li>
                                ))}
                            </Box>
                        </Paper>
                    </Box>
                )}
            </Box>
        );
    };

    return (
        <div className="consultant">
            <div className="content">
                <Sidebar />
                <div className="main-content">
                    <Card sx={{ mb: 3, p: 2, bgcolor: 'background.paper' }}>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={3}
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Enter your business analysis query..."
                                    variant="outlined"
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    onClick={() => document.getElementById('file-input').click()}
                                                    size="large"
                                                >
                                                    <Badge color="primary" variant="dot" invisible={!file}>
                                                        <AttachFile />
                                                    </Badge>
                                                </IconButton>
                                            </InputAdornment>
                                        )
                                    }}
                                />
                                <input
                                    id="file-input"
                                    type="file"
                                    onChange={handleFileChange}
                                    style={{ display: 'none' }}
                                    accept=".csv,.xlsx,.docx,.pdf,.ppt,.pptx"
                                />
                            </Grid>
                            <Grid item xs={12} container justifyContent="space-between" alignItems="center">
                                <Grid item>
                                    {file && (
                                        <Chip
                                            label={file.name}
                                            onDelete={() => setFile(null)}
                                            sx={{ mr: 1 }}
                                        />
                                    )}
                                </Grid>
                                <Grid item>
                                    <Button
                                        variant="contained"
                                        onClick={handleGetAnswer}
                                        disabled={loading || !query.trim()}
                                        startIcon={loading ? <CircularProgress size={20} /> : <Send />}
                                        sx={{
                                            bgcolor: 'primary.main',
                                            '&:hover': { bgcolor: 'primary.dark' }
                                        }}
                                    >
                                        {loading ? 'Analyzing...' : 'Analyze'}
                                    </Button>
                                </Grid>
                            </Grid>
                        </Grid>
                    </Card>

                    {loading && (
                        <Box sx={{ width: '100%', mb: 3 }}>
                            <LinearProgress />
                        </Box>
                    )}

                    <Box sx={{ 
                        maxHeight: 'calc(100vh - 300px)',
                        overflowY: 'auto',
                        p: 2,
                        bgcolor: 'grey.100',
                        borderRadius: 2
                    }}>
                        {conversations.map((message, index) => renderMessage(message, index))}
                    </Box>

                    {error && (
                        <Card sx={{ p: 2, bgcolor: 'error.light', mt: 2 }}>
                            <Typography color="error">{error}</Typography>
                        </Card>
                    )}
                </div>
            </div>

            <style jsx>{`
                .consultant {
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

export default Consultant;