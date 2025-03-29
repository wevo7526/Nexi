"use client";
import React, { useState } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import { useTheme } from '@mui/material/styles';
import {
    CircularProgress, Box, Typography, Card, Grid, Button,
    TextField, Paper, Stack, Alert, List, ListItem, ListItemIcon,
    ListItemText, Collapse, IconButton, Divider
} from "@mui/material";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000';

function BusinessCaseSolver() {
    const theme = useTheme();
    const [caseDescription, setCaseDescription] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [analysis, setAnalysis] = useState(null);
    const [statusMessage, setStatusMessage] = useState("");
    const [currentStatus, setCurrentStatus] = useState("");
    const [expandedSections, setExpandedSections] = useState({
        keyFactors: false,
        constraints: false,
        solutions: false
    });

    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const handleSubmit = async () => {
        if (!caseDescription.trim() || loading) return;

        setLoading(true);
        setError(null);
        setAnalysis(null);
        setStatusMessage("Starting analysis...");
        setCurrentStatus("started");

        try {
            const response = await fetch(`${API_BASE_URL}/api/business-case/solve`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    case_description: caseDescription
                })
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6));
                            setStatusMessage(data.message);
                            setCurrentStatus(data.status);

                            if (data.data) {
                                setAnalysis(prevAnalysis => {
                                    const newAnalysis = { ...prevAnalysis };
                                    Object.entries(data.data).forEach(([key, value]) => {
                                        newAnalysis[key] = value;
                                    });
                                    return newAnalysis;
                                });
                            }
                        } catch (e) {
                            console.error('Error parsing SSE data:', e);
                        }
                    }
                }
            }
        } catch (err) {
            setError(err.message || 'Failed to analyze business case');
            setStatusMessage("Analysis failed");
            setCurrentStatus("error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="business-case-solver">
            <div className="content">
                <Sidebar />
                <div className="main-content">
                    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                            <Typography variant="h5" gutterBottom>
                                Business Case Solver
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Get AI-powered analysis and solutions for your business cases
                            </Typography>
                        </Box>

                        {/* Input Area */}
                        <Box sx={{ p: 2 }}>
                            <Stack spacing={2}>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={4}
                                    value={caseDescription}
                                    onChange={(e) => setCaseDescription(e.target.value)}
                                    placeholder="Describe your business case..."
                                    disabled={loading}
                                    variant="outlined"
                                />
                                <Button
                                    variant="contained"
                                    onClick={handleSubmit}
                                    disabled={loading || !caseDescription.trim()}
                                    startIcon={loading ? <CircularProgress size={20} /> : null}
                                >
                                    {loading ? 'Analyzing...' : 'Analyze Case'}
                                </Button>
                            </Stack>
                        </Box>

                        {/* Status Message */}
                        {statusMessage && (
                            <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                                <Alert 
                                    severity={
                                        currentStatus === 'error' ? 'error' :
                                        currentStatus === 'done' ? 'success' :
                                        'info'
                                    }
                                >
                                    {statusMessage}
                                </Alert>
                            </Box>
                        )}

                        {/* Results Area */}
                        {analysis && (
                            <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                                <Stack spacing={3}>
                                    {/* Problem Statement */}
                                    {analysis.problem_statement && (
                                        <Paper sx={{ p: 2 }}>
                                            <Typography variant="h6" gutterBottom>
                                                Problem Statement
                                            </Typography>
                                            <Typography variant="body1">
                                                {analysis.problem_statement}
                                            </Typography>
                                        </Paper>
                                    )}

                                    {/* Key Factors */}
                                    {analysis.key_factors && analysis.key_factors.length > 0 && (
                                        <Paper sx={{ p: 2 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                                <Typography variant="h6">Key Factors</Typography>
                                                <IconButton onClick={() => toggleSection('keyFactors')}>
                                                    {expandedSections.keyFactors ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                                </IconButton>
                                            </Box>
                                            <Collapse in={expandedSections.keyFactors}>
                                                <List>
                                                    {analysis.key_factors.map((factor, index) => (
                                                        <ListItem key={index}>
                                                            <ListItemIcon>
                                                                <FiberManualRecordIcon sx={{ fontSize: 8 }} />
                                                            </ListItemIcon>
                                                            <ListItemText primary={factor} />
                                                        </ListItem>
                                                    ))}
                                                </List>
                                            </Collapse>
                                        </Paper>
                                    )}

                                    {/* Constraints */}
                                    {analysis.constraints && analysis.constraints.length > 0 && (
                                        <Paper sx={{ p: 2 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                                <Typography variant="h6">Constraints</Typography>
                                                <IconButton onClick={() => toggleSection('constraints')}>
                                                    {expandedSections.constraints ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                                </IconButton>
                                            </Box>
                                            <Collapse in={expandedSections.constraints}>
                                                <List>
                                                    {analysis.constraints.map((constraint, index) => (
                                                        <ListItem key={index}>
                                                            <ListItemIcon>
                                                                <FiberManualRecordIcon sx={{ fontSize: 8 }} />
                                                            </ListItemIcon>
                                                            <ListItemText primary={constraint} />
                                                        </ListItem>
                                                    ))}
                                                </List>
                                            </Collapse>
                                        </Paper>
                                    )}

                                    {/* Solutions */}
                                    {analysis.solutions && analysis.solutions.length > 0 && (
                                        <Paper sx={{ p: 2 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                                <Typography variant="h6">Potential Solutions</Typography>
                                                <IconButton onClick={() => toggleSection('solutions')}>
                                                    {expandedSections.solutions ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                                </IconButton>
                                            </Box>
                                            <Collapse in={expandedSections.solutions}>
                                                <Stack spacing={3}>
                                                    {analysis.solutions.map((solution, index) => (
                                                        <Paper key={index} sx={{ p: 2, bgcolor: 'background.default' }}>
                                                            <Typography variant="subtitle1" gutterBottom>
                                                                Solution {index + 1}
                                                            </Typography>
                                                            <Typography variant="body1" paragraph>
                                                                {solution.description}
                                                            </Typography>
                                                            <Grid container spacing={2}>
                                                                <Grid item xs={6}>
                                                                    <Typography variant="subtitle2" gutterBottom>
                                                                        Pros
                                                                    </Typography>
                                                                    <List>
                                                                        {solution.pros.map((pro, idx) => (
                                                                            <ListItem key={idx}>
                                                                                <ListItemIcon>
                                                                                    <FiberManualRecordIcon sx={{ fontSize: 8, color: 'success.main' }} />
                                                                                </ListItemIcon>
                                                                                <ListItemText primary={pro} />
                                                                            </ListItem>
                                                                        ))}
                                                                    </List>
                                                                </Grid>
                                                                <Grid item xs={6}>
                                                                    <Typography variant="subtitle2" gutterBottom>
                                                                        Cons
                                                                    </Typography>
                                                                    <List>
                                                                        {solution.cons.map((con, idx) => (
                                                                            <ListItem key={idx}>
                                                                                <ListItemIcon>
                                                                                    <FiberManualRecordIcon sx={{ fontSize: 8, color: 'error.main' }} />
                                                                                </ListItemIcon>
                                                                                <ListItemText primary={con} />
                                                                            </ListItem>
                                                                        ))}
                                                                    </List>
                                                                </Grid>
                                                            </Grid>
                                                        </Paper>
                                                    ))}
                                                </Stack>
                                            </Collapse>
                                        </Paper>
                                    )}

                                    {/* Recommendation */}
                                    {analysis.recommendation && (
                                        <Paper sx={{ p: 3, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                                            <Typography variant="h5" gutterBottom>
                                                Recommended Solution
                                            </Typography>
                                            <Divider sx={{ my: 2, bgcolor: 'primary.contrastText' }} />
                                            
                                            <Typography variant="h6" gutterBottom>
                                                Solution
                                            </Typography>
                                            <Typography variant="body1" paragraph>
                                                {analysis.recommendation.solution}
                                            </Typography>

                                            <Typography variant="h6" gutterBottom>
                                                Rationale
                                            </Typography>
                                            <Typography variant="body1" paragraph>
                                                {analysis.recommendation.rationale}
                                            </Typography>

                                            <Typography variant="h6" gutterBottom>
                                                Implementation Timeline
                                            </Typography>
                                            <Typography variant="body1" paragraph>
                                                {analysis.recommendation.implementation_timeline}
                                            </Typography>

                                            <Typography variant="h6" gutterBottom>
                                                Success Metrics
                                            </Typography>
                                            <List>
                                                {analysis.recommendation.success_metrics.map((metric, index) => (
                                                    <ListItem key={index}>
                                                        <ListItemIcon>
                                                            <FiberManualRecordIcon sx={{ fontSize: 8, color: 'primary.contrastText' }} />
                                                        </ListItemIcon>
                                                        <ListItemText primary={metric} />
                                                    </ListItem>
                                                ))}
                                            </List>
                                        </Paper>
                                    )}
                                </Stack>
                            </Box>
                        )}

                        {/* Error Display */}
                        {error && (
                            <Box sx={{ p: 2 }}>
                                <Alert severity="error">
                                    {error}
                                </Alert>
                            </Box>
                        )}
                    </Card>
                </div>
            </div>

            <style jsx>{`
                .business-case-solver {
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

export default BusinessCaseSolver; 