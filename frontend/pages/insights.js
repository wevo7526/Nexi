"use client";
import React, { useState, useEffect } from "react";
import {
    CircularProgress, Box, Typography, Grid, Button,
    Paper, useMediaQuery, IconButton, Divider
} from "@mui/material";
import { useTheme } from '@mui/material/styles';
import {
    TrendingUp,
    Assessment,
    Business,
    Analytics,
    Download,
    Share,
    FilterList
} from "@mui/icons-material";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
} from 'chart.js';
import { Line, Pie } from 'react-chartjs-2';
import Sidebar from "../components/Sidebar";
import { createClient } from '@supabase/supabase-js';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Sample data for charts
const revenueGrowthData = {
    labels: ['Q1', 'Q2', 'Q3', 'Q4'],
    datasets: [
        {
            label: 'Revenue Growth',
            data: [12, 15, 18, 22],
            borderColor: '#1976d2',
            backgroundColor: 'rgba(25, 118, 210, 0.1)',
            tension: 0.4,
            fill: true
        }
    ]
};

const marketShareData = {
    labels: ['Competitor A', 'Competitor B', 'Competitor C', 'Others'],
    datasets: [
        {
            data: [35, 25, 20, 20],
            backgroundColor: [
                '#1976d2',
                '#2e7d32',
                '#ed6c02',
                '#757575'
            ]
        }
    ]
};

const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'top',
        },
        title: {
            display: false
        }
    },
    scales: {
        y: {
            beginAtZero: true,
            grid: {
                color: 'rgba(0, 0, 0, 0.05)',
            }
        },
        x: {
            grid: {
                display: false
            }
        }
    }
};

const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'right',
        }
    }
};

function Insights() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [insights, setInsights] = useState({
        keyMetrics: {
            revenueGrowth: 22,
            marketShare: 35,
            customerSatisfaction: 92,
            operationalEfficiency: 85
        },
        trends: [
            "Increasing market share in emerging markets",
            "Growing customer base in enterprise segment",
            "Improving operational efficiency",
            "Rising customer satisfaction scores"
        ],
        recommendations: [
            "Expand presence in Asian markets",
            "Invest in digital transformation",
            "Optimize supply chain operations",
            "Enhance customer support capabilities"
        ]
    });

    useEffect(() => {
        fetchInsights();
    }, []);

    const fetchInsights = async () => {
        try {
            const { data: reports, error } = await supabase.storage
                .from('reports')
                .list();

            if (error) throw error;

            // Process reports to extract business insights
            // This is where you would analyze the actual report content
            // For now, we're using sample data
            setInsights({
                keyMetrics: {
                    revenueGrowth: 22,
                    marketShare: 35,
                    customerSatisfaction: 92,
                    operationalEfficiency: 85
                },
                trends: [
                    "Increasing market share in emerging markets",
                    "Growing customer base in enterprise segment",
                    "Improving operational efficiency",
                    "Rising customer satisfaction scores"
                ],
                recommendations: [
                    "Expand presence in Asian markets",
                    "Invest in digital transformation",
                    "Optimize supply chain operations",
                    "Enhance customer support capabilities"
                ]
            });
        } catch (error) {
            console.error('Error fetching insights:', error);
            setError(error.message || 'Failed to load insights');
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        // Implement export functionality
        console.log('Exporting insights...');
    };

    const handleShare = () => {
        // Implement share functionality
        console.log('Sharing insights...');
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                <Box sx={{ display: 'flex', flexDirection: 'row', flexGrow: 1 }}>
                    <Sidebar />
                    <Box sx={{ flexGrow: 1, p: 3 }}>
                        <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                            <CircularProgress />
                        </Box>
                    </Box>
                </Box>
            </Box>
        );
    }

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Box sx={{ display: 'flex', flexDirection: 'row', flexGrow: 1 }}>
                <Sidebar />
                <Box sx={{ flexGrow: 1, p: 3 }}>
                    {/* Header */}
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                        <Box>
                            <Typography variant="h4" gutterBottom sx={{ fontWeight: 500 }}>
                                Business Insights
                            </Typography>
                            <Typography color="textSecondary" sx={{ fontSize: '0.9rem' }}>
                                Key metrics and trends from your business analysis
                            </Typography>
                        </Box>
                        <Box>
                            <IconButton onClick={handleExport} sx={{ mr: 1 }}>
                                <Download />
                            </IconButton>
                            <IconButton onClick={handleShare} sx={{ mr: 1 }}>
                                <Share />
                            </IconButton>
                            <IconButton>
                                <FilterList />
                            </IconButton>
                        </Box>
                    </Box>

                    {error && (
                        <Paper sx={{ mb: 3, p: 2, bgcolor: 'error.light' }}>
                            <Typography color="error">{error}</Typography>
                        </Paper>
                    )}

                    {/* Key Metrics */}
                    <Grid container spacing={3} mb={4}>
                        <Grid item xs={12} md={3}>
                            <Paper 
                                sx={{ 
                                    p: 2, 
                                    height: '100%',
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    borderRadius: 1
                                }}
                            >
                                <Box display="flex" alignItems="center" mb={2}>
                                    <TrendingUp sx={{ color: theme.palette.primary.main, mr: 1 }} />
                                    <Typography variant="subtitle2" color="textSecondary">
                                        Revenue Growth
                                    </Typography>
                                </Box>
                                <Typography variant="h3" component="div" sx={{ fontWeight: 500 }}>
                                    {insights.keyMetrics.revenueGrowth}%
                                </Typography>
                            </Paper>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Paper 
                                sx={{ 
                                    p: 2, 
                                    height: '100%',
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    borderRadius: 1
                                }}
                            >
                                <Box display="flex" alignItems="center" mb={2}>
                                    <Business sx={{ color: theme.palette.success.main, mr: 1 }} />
                                    <Typography variant="subtitle2" color="textSecondary">
                                        Market Share
                                    </Typography>
                                </Box>
                                <Typography variant="h3" component="div" sx={{ fontWeight: 500 }}>
                                    {insights.keyMetrics.marketShare}%
                                </Typography>
                            </Paper>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Paper 
                                sx={{ 
                                    p: 2, 
                                    height: '100%',
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    borderRadius: 1
                                }}
                            >
                                <Box display="flex" alignItems="center" mb={2}>
                                    <Assessment sx={{ color: theme.palette.warning.main, mr: 1 }} />
                                    <Typography variant="subtitle2" color="textSecondary">
                                        Customer Satisfaction
                                    </Typography>
                                </Box>
                                <Typography variant="h3" component="div" sx={{ fontWeight: 500 }}>
                                    {insights.keyMetrics.customerSatisfaction}%
                                </Typography>
                            </Paper>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Paper 
                                sx={{ 
                                    p: 2, 
                                    height: '100%',
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    borderRadius: 1
                                }}
                            >
                                <Box display="flex" alignItems="center" mb={2}>
                                    <Analytics sx={{ color: theme.palette.info.main, mr: 1 }} />
                                    <Typography variant="subtitle2" color="textSecondary">
                                        Operational Efficiency
                                    </Typography>
                                </Box>
                                <Typography variant="h3" component="div" sx={{ fontWeight: 500 }}>
                                    {insights.keyMetrics.operationalEfficiency}%
                                </Typography>
                            </Paper>
                        </Grid>
                    </Grid>

                    {/* Charts */}
                    <Grid container spacing={3} mb={4}>
                        <Grid item xs={12} md={8}>
                            <Paper 
                                sx={{ 
                                    p: 3, 
                                    height: '100%',
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    borderRadius: 1
                                }}
                            >
                                <Typography variant="h6" gutterBottom sx={{ fontWeight: 500 }}>
                                    Revenue Growth Trend
                                </Typography>
                                <Box sx={{ height: 300 }}>
                                    <Line data={revenueGrowthData} options={chartOptions} />
                                </Box>
                            </Paper>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Paper 
                                sx={{ 
                                    p: 3, 
                                    height: '100%',
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    borderRadius: 1
                                }}
                            >
                                <Typography variant="h6" gutterBottom sx={{ fontWeight: 500 }}>
                                    Market Share Distribution
                                </Typography>
                                <Box sx={{ height: 300 }}>
                                    <Pie data={marketShareData} options={pieOptions} />
                                </Box>
                            </Paper>
                        </Grid>
                    </Grid>

                    {/* Trends and Recommendations */}
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <Paper 
                                sx={{ 
                                    p: 3,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    borderRadius: 1
                                }}
                            >
                                <Typography variant="h6" gutterBottom sx={{ fontWeight: 500 }}>
                                    Key Trends
                                </Typography>
                                <Box component="ul" sx={{ pl: 2, mt: 2 }}>
                                    {insights.trends.map((trend, index) => (
                                        <Typography
                                            component="li"
                                            key={index}
                                            sx={{ mb: 1, color: 'text.secondary' }}
                                        >
                                            {trend}
                                        </Typography>
                                    ))}
                                </Box>
                            </Paper>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Paper 
                                sx={{ 
                                    p: 3,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    borderRadius: 1
                                }}
                            >
                                <Typography variant="h6" gutterBottom sx={{ fontWeight: 500 }}>
                                    Recommendations
                                </Typography>
                                <Box component="ul" sx={{ pl: 2, mt: 2 }}>
                                    {insights.recommendations.map((rec, index) => (
                                        <Typography
                                            component="li"
                                            key={index}
                                            sx={{ mb: 1, color: 'text.secondary' }}
                                        >
                                            {rec}
                                        </Typography>
                                    ))}
                                </Box>
                            </Paper>
                        </Grid>
                    </Grid>
                </Box>
            </Box>
        </Box>
    );
}

export default Insights; 