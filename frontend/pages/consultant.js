"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import { useToast } from "../components/ToastProvider";
import {
    CircularProgress, Typography, Box, Card, Grid, Button,
    IconButton, TextField, Paper, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow,
    InputAdornment, Badge
} from "@mui/material";
import {
    AttachFile, Send, Delete, SaveAlt
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

    const renderStructuredAnalysis = (content) => {
        // Extract SWOT analysis
        const swotMatch = content.match(/SWOT Analysis:([\s\S]*?)(?=\n\n|$)/i);
        const swotData = swotMatch ? parseSwotData(swotMatch[1]) : null;

        // Extract PESTEL analysis
        const pestelMatch = content.match(/PESTEL Analysis:([\s\S]*?)(?=\n\n|$)/i);
        const pestelData = pestelMatch ? parsePestelData(pestelMatch[1]) : null;

        return (
            <Box>
                {swotData && (
                    <Card sx={{ mb: 3, p: 2 }}>
                        <Typography variant="h6" gutterBottom>SWOT Analysis</Typography>
                        <TableContainer>
                            <Table>
                                <TableBody>
                                    <TableRow>
                                        <TableCell sx={{ width: '50%', borderRight: '1px solid rgba(224, 224, 224, 1)' }}>
                                            <Typography variant="subtitle2" gutterBottom>Strengths</Typography>
                                            <ul style={{ margin: 0, paddingLeft: '20px' }}>
                                                {swotData.strengths.map((item, index) => (
                                                    <li key={index}>{item}</li>
                                                ))}
                                            </ul>
                                        </TableCell>
                                        <TableCell sx={{ width: '50%' }}>
                                            <Typography variant="subtitle2" gutterBottom>Weaknesses</Typography>
                                            <ul style={{ margin: 0, paddingLeft: '20px' }}>
                                                {swotData.weaknesses.map((item, index) => (
                                                    <li key={index}>{item}</li>
                                                ))}
                                            </ul>
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell sx={{ borderRight: '1px solid rgba(224, 224, 224, 1)' }}>
                                            <Typography variant="subtitle2" gutterBottom>Opportunities</Typography>
                                            <ul style={{ margin: 0, paddingLeft: '20px' }}>
                                                {swotData.opportunities.map((item, index) => (
                                                    <li key={index}>{item}</li>
                                                ))}
                                            </ul>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="subtitle2" gutterBottom>Threats</Typography>
                                            <ul style={{ margin: 0, paddingLeft: '20px' }}>
                                                {swotData.threats.map((item, index) => (
                                                    <li key={index}>{item}</li>
                                                ))}
                                            </ul>
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Card>
                )}

                {pestelData && (
                    <Card sx={{ mb: 3, p: 2 }}>
                        <Typography variant="h6" gutterBottom>PESTEL Analysis</Typography>
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Factor</TableCell>
                                        <TableCell>Analysis</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {Object.entries(pestelData).map(([factor, analysis]) => (
                                        <TableRow key={factor}>
                                            <TableCell sx={{ width: '20%' }}>
                                                <Typography variant="subtitle2">{factor}</Typography>
                                            </TableCell>
                                            <TableCell>
                                                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                                                    {analysis.map((item, index) => (
                                                        <li key={index}>{item}</li>
                                                    ))}
                                                </ul>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Card>
                )}

                {!swotData && !pestelData && (
                    <Card sx={{ mb: 3, p: 2 }}>
                        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                            {content}
                        </Typography>
                    </Card>
                )}
            </Box>
        );
    };

    const parseSwotData = (text) => {
        const sections = {
            strengths: [],
            weaknesses: [],
            opportunities: [],
            threats: []
        };

        let currentSection = null;
        text.split('\n').forEach(line => {
            line = line.trim();
            if (line.toLowerCase().includes('strengths')) currentSection = 'strengths';
            else if (line.toLowerCase().includes('weaknesses')) currentSection = 'weaknesses';
            else if (line.toLowerCase().includes('opportunities')) currentSection = 'opportunities';
            else if (line.toLowerCase().includes('threats')) currentSection = 'threats';
            else if (line && currentSection && !line.includes(':')) {
                sections[currentSection].push(line.replace(/^[•\-]\s*/, ''));
            }
        });

        return sections;
    };

    const parsePestelData = (text) => {
        const sections = {
            Political: [],
            Economic: [],
            Social: [],
            Technological: [],
            Environmental: [],
            Legal: []
        };

        let currentSection = null;
        text.split('\n').forEach(line => {
            line = line.trim();
            if (line.toLowerCase().includes('political')) currentSection = 'Political';
            else if (line.toLowerCase().includes('economic')) currentSection = 'Economic';
            else if (line.toLowerCase().includes('social')) currentSection = 'Social';
            else if (line.toLowerCase().includes('technological')) currentSection = 'Technological';
            else if (line.toLowerCase().includes('environmental')) currentSection = 'Environmental';
            else if (line.toLowerCase().includes('legal')) currentSection = 'Legal';
            else if (line && currentSection && !line.includes(':')) {
                sections[currentSection].push(line.replace(/^[•\-]\s*/, ''));
            }
        });

        return sections;
    };

    return (
        <div className="consultant">
            <div className="content">
                <Sidebar />
                <div className="main-content">
                    {/* Query Section */}
                    <Card sx={{ mb: 3, p: 2 }}>
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
                                        <Badge
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
                                    >
                                        {loading ? 'Analyzing...' : 'Analyze'}
                                    </Button>
                                </Grid>
                            </Grid>
                        </Grid>
                    </Card>

                    {/* Analysis Output */}
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
                    background-color: var(--background);
                    font-family: "Geist", sans-serif;
                }
                .content {
                    display: flex;
                    flex-direction: row;
                    flex-grow: 1;
                }
                .main-content {
                    flex-grow: 1;
                    padding: 20px;
                    background-color: var(--content-background);
                }
            `}</style>
        </div>
    );
}

export default Consultant;