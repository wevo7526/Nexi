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
    LinearProgress
} from "@mui/material";
import {
    AttachFile, Send, Delete, SaveAlt,
    ExpandMore, Assessment, Timeline,
    TrendingUp, Assignment
} from "@mui/icons-material";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/router";

function Consultant({ initialData }) {
    const [query, setQuery] = useState("");
    const [currentConversation, setCurrentConversation] = useState(null);
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

            setCurrentConversation({
                messages: [userMessage, assistantMessage]
            });
            
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

    const renderStructuredAnalysis = (content) => {
        // Extract different analyses
        const swotMatch = content.match(/SWOT Analysis:([\s\S]*?)(?=\n\n|$)/i);
        const pestelMatch = content.match(/PESTEL Analysis:([\s\S]*?)(?=\n\n|$)/i);
        const recommendationsMatch = content.match(/Recommendations:([\s\S]*?)(?=\n\n|$)/i);
        const nextStepsMatch = content.match(/Next Steps:([\s\S]*?)(?=\n\n|$)/i);

        return (
            <Box>
                {swotMatch && renderAnalysisSection("SWOT Analysis", 
                    <TableContainer>
                        <Table>
                            <TableBody>
                                <TableRow>
                                    <TableCell sx={{ 
                                        width: '50%', 
                                        borderRight: '1px solid rgba(224, 224, 224, 1)',
                                        bgcolor: 'success.light'
                                    }}>
                                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                            Strengths
                                        </Typography>
                                        <Box component="ul" sx={{ m: 0, pl: 2 }}>
                                            {parseListItems(swotMatch[1], 'Strengths')}
                                        </Box>
                                    </TableCell>
                                    <TableCell sx={{ 
                                        width: '50%',
                                        bgcolor: 'error.light'
                                    }}>
                                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                            Weaknesses
                                        </Typography>
                                        <Box component="ul" sx={{ m: 0, pl: 2 }}>
                                            {parseListItems(swotMatch[1], 'Weaknesses')}
                                        </Box>
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell sx={{ 
                                        borderRight: '1px solid rgba(224, 224, 224, 1)',
                                        bgcolor: 'info.light'
                                    }}>
                                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                            Opportunities
                                        </Typography>
                                        <Box component="ul" sx={{ m: 0, pl: 2 }}>
                                            {parseListItems(swotMatch[1], 'Opportunities')}
                                        </Box>
                                    </TableCell>
                                    <TableCell sx={{ bgcolor: 'warning.light' }}>
                                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                            Threats
                                        </Typography>
                                        <Box component="ul" sx={{ m: 0, pl: 2 }}>
                                            {parseListItems(swotMatch[1], 'Threats')}
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>,
                    <Assessment />
                )}

                {pestelMatch && renderAnalysisSection("PESTEL Analysis",
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell width="20%">Factor</TableCell>
                                    <TableCell>Analysis</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {['Political', 'Economic', 'Social', 'Technological', 'Environmental', 'Legal'].map((factor) => (
                                    <TableRow key={factor} sx={{ 
                                        '&:nth-of-type(odd)': { bgcolor: 'action.hover' }
                                    }}>
                                        <TableCell>
                                            <Typography variant="subtitle2" fontWeight="bold">
                                                {factor}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Box component="ul" sx={{ m: 0, pl: 2 }}>
                                                {parseListItems(pestelMatch[1], factor)}
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>,
                    <Timeline />
                )}

                {recommendationsMatch && renderAnalysisSection("Recommendations",
                    <Box>
                        <Stack spacing={1}>
                            {parseListItems(recommendationsMatch[1]).map((item, index) => (
                                <Paper key={index} elevation={1} sx={{ p: 2, bgcolor: 'primary.light' }}>
                                    <Typography variant="body1" color="primary.contrastText">
                                        {item}
                                    </Typography>
                                </Paper>
                            ))}
                        </Stack>
                    </Box>,
                    <TrendingUp />
                )}

                {nextStepsMatch && renderAnalysisSection("Implementation Plan",
                    <Box>
                        <Stack spacing={2}>
                            {parseListItems(nextStepsMatch[1]).map((item, index) => (
                                <Paper key={index} elevation={2} sx={{ p: 2 }}>
                                    <Stack direction="row" spacing={2} alignItems="center">
                                        <Chip 
                                            label={`Step ${index + 1}`} 
                                            color="primary" 
                                            sx={{ minWidth: 80 }}
                                        />
                                        <Typography variant="body1">{item}</Typography>
                                    </Stack>
                                </Paper>
                            ))}
                        </Stack>
                    </Box>,
                    <Assignment />
                )}

                {!swotMatch && !pestelMatch && !recommendationsMatch && !nextStepsMatch && (
                    <Card sx={{ mb: 3, p: 2 }}>
                        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                            {content}
                        </Typography>
                    </Card>
                )}
            </Box>
        );
    };

    const parseListItems = (text, section = null) => {
        const items = [];
        const lines = text.split('\n');
        let inSection = !section;

        for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine) continue;

            if (section && trimmedLine.toLowerCase().includes(section.toLowerCase())) {
                inSection = true;
                continue;
            } else if (section && trimmedLine.match(/^[A-Z]/)) {
                inSection = false;
            }

            if (inSection && !trimmedLine.match(/^[A-Z][a-z]+:/)) {
                items.push(trimmedLine.replace(/^[•\-]\s*/, ''));
            }
        }

        return items;
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

                    {currentConversation && currentConversation.messages.map((message, index) => (
                        message.role === 'assistant' && (
                            <Box key={index}>
                                {renderStructuredAnalysis(message.content)}
                            </Box>
                        )
                    ))}

                    {error && (
                        <Card sx={{ p: 2, bgcolor: 'error.light' }}>
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
                }
            `}</style>
        </div>
    );
}

export default Consultant;