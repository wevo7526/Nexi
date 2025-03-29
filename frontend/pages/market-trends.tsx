"use client";
import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import { useToast } from "../components/ToastProvider";
import {
    CircularProgress, Typography, Box, Card, Grid, Button,
    IconButton, TextField, Paper, Avatar, Stack,
    LinearProgress, Divider, CardContent, Alert, Container,
    useTheme, Fade, Tooltip, Chip, InputAdornment,
    Tabs, Tab, List, ListItem, ListItemText, ListItemIcon
} from "@mui/material";
import {
    TrendingUp,
    BusinessOutlined,
    PeopleOutlined,
    ShowChartOutlined,
    Person,
    SmartToy,
    Psychology,
    Build,
    Search,
    History,
    AutoGraph,
    Insights,
    Search as SearchIcon,
    Timeline,
    Assessment,
    TrendingFlat,
    TrendingDown,
    TrendingUp as TrendingUpIcon
} from "@mui/icons-material";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/router";
import { api } from '../lib/api';

interface TrendData {
    category: string;
    trend: 'up' | 'down' | 'stable';
    value: string;
    change: string;
    description: string;
}

interface MarketInsight {
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    category: string;
    date: string;
}

const trendCategories = [
    { label: 'Overall Market', icon: <TrendingUp /> },
    { label: 'Industry Specific', icon: <BusinessOutlined /> },
    { label: 'Consumer Behavior', icon: <PeopleOutlined /> },
    { label: 'Economic Indicators', icon: <ShowChartOutlined /> },
];

const getTrendIcon = (trend: TrendData['trend']) => {
    switch (trend) {
        case 'up':
            return <TrendingUpIcon color="success" />;
        case 'down':
            return <TrendingDown color="error" />;
        case 'stable':
            return <TrendingFlat color="warning" />;
        default:
            return null;
    }
};

const getImpactColor = (impact: MarketInsight['impact']) => {
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

export default function MarketTrends() {
    const [selectedTab, setSelectedTab] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [trends, setTrends] = useState<TrendData[]>([]);
    const [insights, setInsights] = useState<MarketInsight[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const router = useRouter();
    const { showToast } = useToast();
    const theme = useTheme();

    useEffect(() => {
        const checkSession = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    router.push(`/auth?redirectTo=/market-trends`);
                } else {
                    fetchTrends();
                }
            } catch (error) {
                setError('Error checking session');
            }
        };
        checkSession();
    }, [router]);

    const fetchTrends = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/market-research/trends');
            if (response.data.status === 'success') {
                setTrends(response.data.trends);
                setInsights(response.data.insights);
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

    const renderTrendCard = (trend: TrendData) => (
        <Fade in>
            <Card sx={{ mb: 2 }}>
                <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        {getTrendIcon(trend.trend)}
                        <Typography variant="h6" sx={{ ml: 1 }}>
                            {trend.category}
                        </Typography>
                    </Box>
                    <Typography variant="h4" color="primary" gutterBottom>
                        {trend.value}
                    </Typography>
                    <Typography variant="subtitle1" color={trend.trend === 'up' ? 'success.main' : trend.trend === 'down' ? 'error.main' : 'warning.main'}>
                        {trend.change}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {trend.description}
                    </Typography>
                </CardContent>
            </Card>
        </Fade>
    );

    const renderInsightItem = (insight: MarketInsight) => (
        <ListItem key={insight.title}>
            <ListItemIcon>
                <Insights color={getImpactColor(insight.impact)} />
            </ListItemIcon>
            <ListItemText
                primary={insight.title}
                secondary={
                    <React.Fragment>
                        <Typography component="span" variant="body2" color="text.primary">
                            {insight.description}
                        </Typography>
                        <Typography variant="caption" display="block" color="text.secondary">
                            {new Date(insight.date).toLocaleDateString()}
                        </Typography>
                    </React.Fragment>
                }
            />
        </ListItem>
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
                                    <Typography variant="h5" gutterBottom>
                                        Market Trends & Insights
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" paragraph>
                                        Stay updated with the latest market trends and insights.
                                    </Typography>

                                    <TextField
                                        fullWidth
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search trends and insights..."
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
                                        {trendCategories.map((category, index) => (
                                            <Tab
                                                key={category.label}
                                                label={category.label}
                                                icon={category.icon}
                                                iconPosition="start"
                                                value={index}
                                            />
                                        ))}
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
                                                            Current Trends
                                                        </Typography>
                                                        <List>
                                                            {trends
                                                                .filter(trend => 
                                                                    trendCategories[selectedTab].label === trend.category &&
                                                                    (searchQuery === "" || 
                                                                     trend.description.toLowerCase().includes(searchQuery.toLowerCase()))
                                                                )
                                                                .map((trend, index) => (
                                                                    <ListItem key={index} divider={index !== trends.length - 1}>
                                                                        <ListItemIcon>
                                                                            {getTrendIcon(trend.trend)}
                                                                        </ListItemIcon>
                                                                        <ListItemText
                                                                            primary={
                                                                                <Typography variant="subtitle1" component="div">
                                                                                    {trend.value}
                                                                                </Typography>
                                                                            }
                                                                            secondary={
                                                                                <React.Fragment>
                                                                                    <Typography component="span" variant="body2" color="text.primary">
                                                                                        {trend.description}
                                                                                    </Typography>
                                                                                    <Typography variant="caption" display="block" color={trend.trend === 'up' ? 'success.main' : trend.trend === 'down' ? 'error.main' : 'warning.main'}>
                                                                                        {trend.change}
                                                                                    </Typography>
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
                                                            Key Insights
                                                        </Typography>
                                                        <List>
                                                            {insights
                                                                .filter(insight => 
                                                                    trendCategories[selectedTab].label === insight.category &&
                                                                    (searchQuery === "" || 
                                                                     insight.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                                     insight.description.toLowerCase().includes(searchQuery.toLowerCase()))
                                                                )
                                                                .map((insight, index) => (
                                                                    <ListItem key={index} divider={index !== insights.length - 1}>
                                                                        <ListItemIcon>
                                                                            <Insights color={getImpactColor(insight.impact)} />
                                                                        </ListItemIcon>
                                                                        <ListItemText
                                                                            primary={
                                                                                <Typography variant="subtitle1" component="div">
                                                                                    {insight.title}
                                                                                </Typography>
                                                                            }
                                                                            secondary={
                                                                                <React.Fragment>
                                                                                    <Typography component="span" variant="body2" color="text.primary">
                                                                                        {insight.description}
                                                                                    </Typography>
                                                                                    <Typography variant="caption" display="block" color="text.secondary">
                                                                                        {new Date(insight.date).toLocaleDateString()}
                                                                                    </Typography>
                                                                                </React.Fragment>
                                                                            }
                                                                        />
                                                                    </ListItem>
                                                                ))}
                                                        </List>
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
        </Box>
    );
} 