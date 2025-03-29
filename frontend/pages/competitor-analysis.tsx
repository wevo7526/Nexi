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
    Business,
    TrendingUp,
    Assessment,
    Timeline,
    CompareArrows,
    Add as AddIcon,
    Search as SearchIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Star,
    StarBorder,
    StarHalf,
    TrendingDown,
    TrendingFlat,
    Timeline as TimelineIcon,
    BarChart,
    PieChart,
    TableChart
} from "@mui/icons-material";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/router";
import { api } from '../lib/api';

interface Competitor {
    id: string;
    name: string;
    description: string;
    marketShare: number;
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
    metrics: {
        revenue: number;
        growth: number;
        customerBase: number;
        brandValue: number;
    };
    activities: {
        date: string;
        type: 'product' | 'marketing' | 'acquisition' | 'partnership';
        description: string;
        impact: 'high' | 'medium' | 'low';
    }[];
}

interface CompetitorMetric {
    name: string;
    value: number;
    change: number;
    trend: 'up' | 'down' | 'stable';
}

const competitorMetrics: CompetitorMetric[] = [
    { name: 'Market Share', value: 25, change: 2.5, trend: 'up' },
    { name: 'Revenue Growth', value: 15, change: -1.2, trend: 'down' },
    { name: 'Customer Satisfaction', value: 4.2, change: 0.3, trend: 'up' },
    { name: 'Brand Recognition', value: 85, change: 5, trend: 'up' },
];

const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
        case 'up':
            return <TrendingUp color="success" />;
        case 'down':
            return <TrendingDown color="error" />;
        case 'stable':
            return <TrendingFlat color="warning" />;
        default:
            return null;
    }
};

const getImpactColor = (impact: 'high' | 'medium' | 'low') => {
    switch (impact) {
        case 'high':
            return 'error';
        case 'medium':
            return 'warning';
        case 'low':
            return 'success';
        default:
            return 'inherit';
    }
};

export default function CompetitorAnalysis() {
    const [selectedTab, setSelectedTab] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [competitors, setCompetitors] = useState<Competitor[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedCompetitor, setSelectedCompetitor] = useState<Competitor | null>(null);
    const router = useRouter();
    const { showToast } = useToast();
    const theme = useTheme();

    useEffect(() => {
        const checkSession = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    router.push(`/auth?redirectTo=/competitor-analysis`);
                } else {
                    fetchCompetitors();
                }
            } catch (error) {
                setError('Error checking session');
            }
        };
        checkSession();
    }, [router]);

    const fetchCompetitors = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/competitor-analysis/competitors');
            if (response.data.status === 'success') {
                setCompetitors(response.data.competitors);
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

    const handleOpenDialog = (competitor: Competitor) => {
        setSelectedCompetitor(competitor);
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setSelectedCompetitor(null);
        setOpenDialog(false);
    };

    const renderCompetitorCard = (competitor: Competitor) => (
        <Fade in>
            <Card sx={{ mb: 2 }}>
                <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                                <Business />
                            </Avatar>
                            <Box>
                                <Typography variant="h6">{competitor.name}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Market Share: {competitor.marketShare}%
                                </Typography>
                            </Box>
                        </Box>
                        <Box>
                            <IconButton onClick={() => handleOpenDialog(competitor)}>
                                <EditIcon />
                            </IconButton>
                            <IconButton color="error">
                                <DeleteIcon />
                            </IconButton>
                        </Box>
                    </Box>
                    <Typography variant="body2" color="text.secondary" paragraph>
                        {competitor.description}
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>Key Metrics</Typography>
                        <Grid container spacing={2}>
                            {Object.entries(competitor.metrics).map(([key, value]) => (
                                <Grid item xs={6} key={key}>
                                    <Paper sx={{ p: 1 }}>
                                        <Typography variant="caption" color="text.secondary">
                                            {key.charAt(0).toUpperCase() + key.slice(1)}
                                        </Typography>
                                        <Typography variant="h6">
                                            {typeof value === 'number' ? value.toLocaleString() : value}
                                        </Typography>
                                    </Paper>
                                </Grid>
                            ))}
                        </Grid>
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
                                                Competitor Analysis
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Track and analyze your competitors' performance and strategies
                                            </Typography>
                                        </Box>
                                        <Button
                                            variant="contained"
                                            startIcon={<AddIcon />}
                                            onClick={() => setOpenDialog(true)}
                                        >
                                            Add Competitor
                                        </Button>
                                    </Box>

                                    <TextField
                                        fullWidth
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search competitors..."
                                        sx={{ mb: 2 }}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <SearchIcon />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />

                                    <Tabs
                                        value={selectedTab}
                                        onChange={handleTabChange}
                                        sx={{ mb: 3 }}
                                    >
                                        <Tab label="Overview" icon={<BarChart />} />
                                        <Tab label="SWOT Analysis" icon={<Assessment />} />
                                        <Tab label="Activity Timeline" icon={<Timeline />} />
                                        <Tab label="Comparison" icon={<CompareArrows />} />
                                    </Tabs>

                                    {loading ? (
                                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                                            <CircularProgress />
                                        </Box>
                                    ) : error ? (
                                        <Alert severity="error" sx={{ mb: 2 }}>
                                            {error}
                                        </Alert>
                                    ) : (
                                        <>
                                            <Grid container spacing={2}>
                                                <Grid item xs={12} md={8}>
                                                    <Paper sx={{ p: 2 }}>
                                                        <Typography variant="h6" gutterBottom>
                                                            Competitor Overview
                                                        </Typography>
                                                        <List>
                                                            {competitors
                                                                .filter(competitor =>
                                                                    searchQuery === "" ||
                                                                    competitor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                                    competitor.description.toLowerCase().includes(searchQuery.toLowerCase())
                                                                )
                                                                .map((competitor, index) => (
                                                                    <ListItem key={index} divider={index !== competitors.length - 1}>
                                                                        <ListItemIcon>
                                                                            <Avatar sx={{ bgcolor: 'primary.main' }}>
                                                                                <Business />
                                                                            </Avatar>
                                                                        </ListItemIcon>
                                                                        <ListItemText
                                                                            primary={
                                                                                <Typography variant="subtitle1" component="div">
                                                                                    {competitor.name}
                                                                                </Typography>
                                                                            }
                                                                            secondary={
                                                                                <React.Fragment>
                                                                                    <Typography component="span" variant="body2" color="text.primary">
                                                                                        {competitor.description}
                                                                                    </Typography>
                                                                                    <Box sx={{ mt: 1 }}>
                                                                                        <Typography variant="caption" color="text.secondary">
                                                                                            Market Share: {competitor.marketShare}%
                                                                                        </Typography>
                                                                                        <MuiLinearProgress
                                                                                            variant="determinate"
                                                                                            value={competitor.marketShare}
                                                                                            sx={{ mt: 0.5 }}
                                                                                        />
                                                                                    </Box>
                                                                                </React.Fragment>
                                                                            }
                                                                        />
                                                                    </ListItem>
                                                                ))}
                                                        </List>
                                                    </Paper>
                                                </Grid>
                                                <Grid item xs={12} md={4}>
                                                    <Paper sx={{ p: 2 }}>
                                                        <Typography variant="h6" gutterBottom>
                                                            Market Share Distribution
                                                        </Typography>
                                                        <TableContainer>
                                                            <Table size="small">
                                                                <TableHead>
                                                                    <TableRow>
                                                                        <TableCell>Competitor</TableCell>
                                                                        <TableCell align="right">Share</TableCell>
                                                                    </TableRow>
                                                                </TableHead>
                                                                <TableBody>
                                                                    {competitors.map((competitor, index) => (
                                                                        <TableRow key={index}>
                                                                            <TableCell>{competitor.name}</TableCell>
                                                                            <TableCell align="right">
                                                                                {competitor.marketShare}%
                                                                            </TableCell>
                                                                        </TableRow>
                                                                    ))}
                                                                </TableBody>
                                                            </Table>
                                                        </TableContainer>
                                                    </Paper>
                                                </Grid>
                                            </Grid>
                                        </>
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
                    {selectedCompetitor ? 'Edit Competitor' : 'Add New Competitor'}
                </DialogTitle>
                <DialogContent>
                    {/* Add form fields here */}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button variant="contained" onClick={handleCloseDialog}>
                        {selectedCompetitor ? 'Save Changes' : 'Add Competitor'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
} 