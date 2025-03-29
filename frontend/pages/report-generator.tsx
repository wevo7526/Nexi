"use client";
import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import { useToast } from "../components/ToastProvider";
import {
    CircularProgress, Typography, Box, Card, Grid, Button,
    IconButton, TextField, Paper, Avatar, Stack,
    LinearProgress, Divider, CardContent, Alert, Container,
    useTheme, Fade, Tooltip, Chip, InputAdornment,
    Tabs, Tab, List, ListItem, ListItemText, ListItemIcon,
    Dialog, DialogTitle, DialogContent, DialogActions,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Rating, LinearProgress as MuiLinearProgress
} from "@mui/material";
import {
    Description,
    Search,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Add as AddIcon,
    History,
    AutoGraph,
    Insights,
    Search as SearchIcon,
    Timeline,
    Assessment,
    TrendingFlat,
    TrendingDown,
    TrendingUp as TrendingUpIcon,
    Save as SaveIcon,
    Download as DownloadIcon
} from "@mui/icons-material";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/router";
import { api } from '../lib/api';

interface Report {
    id: string;
    title: string;
    content: string;
    createdAt: string;
    status: 'draft' | 'completed';
    sections: {
        title: string;
        content: string;
        status: 'pending' | 'completed';
    }[];
}

// Add status message interface
interface StatusMessage {
    type: 'status';
    content: string;
    timestamp: string;
}

export default function ReportGenerator() {
    const [selectedTab, setSelectedTab] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [reports, setReports] = useState<Report[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    const [generating, setGenerating] = useState(false);
    const [currentReport, setCurrentReport] = useState<Report | null>(null);
    const [statusMessages, setStatusMessages] = useState<StatusMessage[]>([]);
    const router = useRouter();
    const { showToast } = useToast();
    const theme = useTheme();

    useEffect(() => {
        const checkSession = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    router.push(`/auth?redirectTo=/report-generator`);
                } else {
                    fetchReports();
                }
            } catch (error) {
                setError('Error checking session');
            }
        };
        checkSession();
    }, [router]);

    const fetchReports = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/report-generator/reports');
            if (response.data.status === 'success') {
                setReports(response.data.reports);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setSelectedTab(newValue);
    };

    const handleOpenDialog = (report: Report) => {
        setSelectedReport(report);
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setSelectedReport(null);
        setOpenDialog(false);
    };

    const handleGenerateReport = async () => {
        try {
            setGenerating(true);
            setError(null);
            setStatusMessages([]); // Clear previous status messages

            const response = await fetch('/api/report-generator/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query: searchQuery
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to generate report');
            }

            const reader = response.body?.getReader();
            if (!reader) {
                throw new Error('Failed to get response reader');
            }

            let reportContent = '';
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') {
                            // Report generation complete
                            setGenerating(false);
                            showToast('Report generated successfully');
                            // Fetch the latest report from Supabase
                            const { data: report, error: fetchError } = await supabase
                                .from('reports')
                                .select('*')
                                .order('created_at', { ascending: false })
                                .limit(1)
                                .single();

                            if (fetchError) throw fetchError;

                            setCurrentReport({
                                id: report.id,
                                title: report.title,
                                content: report.content,
                                createdAt: report.created_at,
                                status: report.status,
                                sections: []
                            });
                            return;
                        }

                        try {
                            const parsed = JSON.parse(data);
                            if (parsed.error) {
                                throw new Error(parsed.error);
                            }
                            if (parsed.status) {
                                // Add status message
                                setStatusMessages(prev => [...prev, parsed.status]);
                            }
                            if (parsed.content) {
                                reportContent = parsed.content;
                                // Update the current report display
                                setCurrentReport(prev => ({
                                    ...prev!,
                                    content: reportContent
                                }));
                            }
                        } catch (e) {
                            console.error('Error parsing SSE data:', e);
                        }
                    }
                }
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            showToast('Failed to generate report');
        } finally {
            setGenerating(false);
        }
    };

    const renderReportCard = (report: Report) => (
        <Fade in>
            <Card sx={{ mb: 2 }}>
                <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                                <Description />
                            </Avatar>
                            <Box>
                                <Typography variant="h6">{report.title}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Created: {new Date(report.createdAt).toLocaleDateString()}
                                </Typography>
                            </Box>
                        </Box>
                        <Box>
                            <IconButton onClick={() => handleOpenDialog(report)}>
                                <EditIcon />
                            </IconButton>
                            <IconButton color="error">
                                <DeleteIcon />
                            </IconButton>
                        </Box>
                    </Box>
                    <Typography variant="body2" color="text.secondary" paragraph>
                        {report.content.substring(0, 200)}...
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>Progress</Typography>
                        <LinearProgress 
                            variant="determinate" 
                            value={(report.sections.filter(s => s.status === 'completed').length / report.sections.length) * 100} 
                            sx={{ height: 8, borderRadius: 4 }}
                        />
                    </Box>
                </CardContent>
            </Card>
        </Fade>
    );

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            <Sidebar />
            <Box sx={{ flex: 1, p: 3, bgcolor: 'background.default' }}>
                <Container maxWidth="lg">
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <Card sx={{ mb: 3 }}>
                                <CardContent>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                        <Box>
                                            <Typography variant="h5" gutterBottom>
                                                Report Generator
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Generate comprehensive reports using AI-powered research and writing teams
                                            </Typography>
                                        </Box>
                                        <Button
                                            variant="contained"
                                            startIcon={<AddIcon />}
                                            onClick={() => setOpenDialog(true)}
                                        >
                                            New Report
                                        </Button>
                                    </Box>

                                    <TextField
                                        fullWidth
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Enter your research topic..."
                                        sx={{ mb: 2 }}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <SearchIcon />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />

                                    <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                                        <Button
                                            variant="contained"
                                            onClick={handleGenerateReport}
                                            disabled={generating || !searchQuery}
                                            startIcon={generating ? <CircularProgress size={20} /> : <AutoGraph />}
                                        >
                                            {generating ? 'Generating...' : 'Generate Report'}
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            startIcon={<History />}
                                            onClick={fetchReports}
                                        >
                                            View History
                                        </Button>
                                    </Box>

                                    {error && (
                                        <Alert severity="error" sx={{ mb: 2 }}>
                                            {error}
                                        </Alert>
                                    )}

                                    {currentReport && (
                                        <Paper sx={{ p: 2, mb: 2 }}>
                                            <Typography variant="h6" gutterBottom>
                                                Current Report
                                            </Typography>
                                            
                                            {/* Status Messages */}
                                            <Box sx={{ mb: 2 }}>
                                                <Typography variant="subtitle2" gutterBottom>
                                                    Generation Status
                                                </Typography>
                                                <Stack spacing={1}>
                                                    {statusMessages.map((status, index) => (
                                                        <Alert 
                                                            key={index} 
                                                            severity="info" 
                                                            sx={{ 
                                                                py: 1,
                                                                '& .MuiAlert-message': { 
                                                                    py: 0.5,
                                                                    fontSize: '0.875rem'
                                                                }
                                                            }}
                                                        >
                                                            {status.content}
                                                        </Alert>
                                                    ))}
                                                </Stack>
                                            </Box>

                                            <Typography variant="body2" color="text.secondary" paragraph>
                                                {currentReport.content}
                                            </Typography>
                                            <Box sx={{ display: 'flex', gap: 1 }}>
                                                <Button
                                                    variant="outlined"
                                                    startIcon={<SaveIcon />}
                                                >
                                                    Save Draft
                                                </Button>
                                                <Button
                                                    variant="outlined"
                                                    startIcon={<DownloadIcon />}
                                                >
                                                    Download
                                                </Button>
                                            </Box>
                                        </Paper>
                                    )}

                                    <Tabs
                                        value={selectedTab}
                                        onChange={handleTabChange}
                                        sx={{ mb: 3 }}
                                    >
                                        <Tab label="Recent Reports" icon={<History />} />
                                        <Tab label="Drafts" icon={<Description />} />
                                        <Tab label="Completed" icon={<Assessment />} />
                                    </Tabs>

                                    {loading ? (
                                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                                            <CircularProgress />
                                        </Box>
                                    ) : (
                                        <Grid container spacing={2}>
                                            {reports
                                                .filter(report =>
                                                    searchQuery === "" ||
                                                    report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                    report.content.toLowerCase().includes(searchQuery.toLowerCase())
                                                )
                                                .map((report, index) => (
                                                    <Grid item xs={12} key={index}>
                                                        {renderReportCard(report)}
                                                    </Grid>
                                                ))}
                                        </Grid>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </Container>
            </Box>

            <Dialog
                open={openDialog}
                onClose={handleCloseDialog}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    {selectedReport ? 'Edit Report' : 'New Report'}
                </DialogTitle>
                <DialogContent>
                    {/* Add form fields here */}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button variant="contained" onClick={handleCloseDialog}>
                        {selectedReport ? 'Save Changes' : 'Create Report'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
} 