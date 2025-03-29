"use client";
import React, { useState, useEffect } from "react";
import {
    Box, Typography, Grid, Paper, Card, CardContent,
    CircularProgress, Alert, Chip, List, ListItem,
    ListItemText, ListItemIcon, Divider, IconButton,
    Tooltip, useTheme
} from "@mui/material";
import {
    TrendingUp, TrendingDown, Assessment,
    Description, Lightbulb, Warning,
    CheckCircle, Schedule, PriorityHigh
} from "@mui/icons-material";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip as ChartTooltip,
    Legend,
    BarElement,
    ArcElement
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import Sidebar from "../components/Sidebar";

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    ChartTooltip,
    Legend
);

// API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000';

function Insights() {
    const theme = useTheme();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [insights, setInsights] = useState({
        business_overview: {},
        document_insights: {},
        ai_insights: {}
    });

    useEffect(() => {
        fetchUnifiedInsights();
        const interval = setInterval(fetchUnifiedInsights, 5 * 60 * 1000); // Refresh every 5 minutes
        return () => clearInterval(interval);
    }, []);

    const fetchUnifiedInsights = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/api/insights/unified?user_id=test_user`);
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.message);
            }

            setInsights(data.data);
            setError(null);
        } catch (err) {
            setError(err.message);
            console.error('Error fetching insights:', err);
        } finally {
            setLoading(false);
        }
    };

    const renderBusinessOverview = () => {
        const { key_metrics = [], business_sentiment = { overall_sentiment: 'neutral', confidence: 0 }, industry_performance = [] } = insights.business_overview || {};
        
        return (
            <Card>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Business Overview
                    </Typography>
                    <Grid container spacing={2}>
                        {/* Key Metrics */}
                        <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" gutterBottom>
                                Key Metrics
                            </Typography>
                            {key_metrics.map((metric, index) => (
                                <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                    <Typography variant="body2" sx={{ flex: 1 }}>
                                        {metric.name}
                                    </Typography>
                                    <Typography variant="body2" sx={{ mr: 1 }}>
                                        {metric.value}
                                    </Typography>
                                    <Chip
                                        size="small"
                                        icon={metric.trend === 'positive' ? <TrendingUp /> : metric.trend === 'negative' ? <TrendingDown /> : null}
                                        label={metric.period}
                                        color={metric.trend === 'positive' ? 'success' : metric.trend === 'negative' ? 'error' : 'default'}
                                    />
                                </Box>
                            ))}
                        </Grid>
                        
                        {/* Business Sentiment */}
                        <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" gutterBottom>
                                Business Sentiment
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <Typography variant="body2" sx={{ flex: 1 }}>
                                    Overall Sentiment
                                </Typography>
                                <Chip
                                    size="small"
                                    label={business_sentiment.overall_sentiment}
                                    color={business_sentiment.overall_sentiment === 'positive' ? 'success' : 'error'}
                                />
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                                Confidence: {(business_sentiment.confidence * 100).toFixed(1)}%
                            </Typography>
                            <List dense>
                                {business_sentiment.key_factors?.map((factor, index) => (
                                    <ListItem key={index}>
                                        <ListItemIcon>
                                            <CheckCircle color="success" />
                                        </ListItemIcon>
                                        <ListItemText primary={factor} />
                                    </ListItem>
                                ))}
                            </List>
                        </Grid>

                        {/* Industry Performance */}
                        <Grid item xs={12}>
                            <Typography variant="subtitle2" gutterBottom>
                                Industry Performance
                            </Typography>
                            <Box sx={{ height: 200 }}>
                                <Bar
                                    data={{
                                        labels: industry_performance.map(s => s.sector || 'Unknown'),
                                        datasets: [{
                                            label: 'Performance (%)',
                                            data: industry_performance.map(s => s.performance || 0),
                                            backgroundColor: theme.palette.primary.main
                                        }]
                                    }}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        scales: {
                                            y: {
                                                beginAtZero: true
                                            }
                                        }
                                    }}
                                />
                            </Box>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>
        );
    };

    const renderDocumentInsights = () => {
        const { recent_documents = [], key_themes = [], action_items = [] } = insights.document_insights || {};
        
        return (
            <Card>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Document Insights
                    </Typography>
                    <Grid container spacing={2}>
                        {/* Key Themes */}
                        <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" gutterBottom>
                                Key Themes
                            </Typography>
                            <List dense>
                                {key_themes.map((theme, index) => (
                                    <ListItem key={index}>
                                        <ListItemIcon>
                                            <Description />
                                        </ListItemIcon>
                                        <ListItemText primary={theme} />
                                    </ListItem>
                                ))}
                            </List>
                        </Grid>

                        {/* Action Items */}
                        <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" gutterBottom>
                                Action Items
                            </Typography>
                            <List dense>
                                {action_items.map((item, index) => (
                                    <ListItem key={index}>
                                        <ListItemIcon>
                                            <PriorityHigh color={item.priority === 'high' ? 'error' : 'warning'} />
                                        </ListItemIcon>
                                        <ListItemText 
                                            primary={item.description || 'No description'}
                                            secondary={item.type || 'No type'}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>
        );
    };

    const renderAIInsights = () => {
        const { market_research = [], wealth_management = {}, recommendations = [] } = insights.ai_insights || {};
        
        return (
            <Card>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        AI Insights
                    </Typography>
                    <Grid container spacing={2}>
                        {/* Market Research */}
                        <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" gutterBottom>
                                Market Research
                            </Typography>
                            <List dense>
                                {market_research.map((insight, index) => (
                                    <ListItem key={index}>
                                        <ListItemIcon>
                                            <Assessment />
                                        </ListItemIcon>
                                        <ListItemText primary={insight || 'No insight available'} />
                                    </ListItem>
                                ))}
                            </List>
                        </Grid>

                        {/* Recommendations */}
                        <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" gutterBottom>
                                Recommendations
                            </Typography>
                            <List dense>
                                {recommendations.map((rec, index) => (
                                    <ListItem key={index}>
                                        <ListItemIcon>
                                            <Lightbulb color="primary" />
                                        </ListItemIcon>
                                        <ListItemText 
                                            primary={rec.description || 'No recommendation available'}
                                            secondary={`Confidence: ${((rec.confidence || 0) * 100).toFixed(1)}%`}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>
        );
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">{error}</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ display: 'flex' }}>
            <Sidebar />
            <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
                <Typography variant="h4" gutterBottom>
                    Unified Insights Dashboard
                </Typography>
                <Grid container spacing={3}>
                    <Grid item xs={12}>
                        {renderBusinessOverview()}
                    </Grid>
                    <Grid item xs={12} md={6}>
                        {renderDocumentInsights()}
                    </Grid>
                    <Grid item xs={12} md={6}>
                        {renderAIInsights()}
                    </Grid>
                </Grid>
            </Box>
        </Box>
    );
}

export default Insights; 