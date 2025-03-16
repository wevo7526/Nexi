import React, { useState, useEffect } from 'react';
import {
    Box, Paper, Typography, Grid, Card, CardContent,
    CircularProgress, Tabs, Tab, Divider
} from '@mui/material';
import { Line } from 'react-chartjs-2';

const AdvancedInsights = ({ symbol }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [technicalData, setTechnicalData] = useState(null);
    const [earningsData, setEarningsData] = useState(null);
    const [activeTab, setActiveTab] = useState(0);

    useEffect(() => {
        if (symbol) {
            fetchData();
        }
    }, [symbol]);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch technical indicators
            const techResponse = await fetch(`/api/market-data/technical/${symbol}`);
            const techData = await techResponse.json();
            if (!techResponse.ok) throw new Error(techData.message);
            setTechnicalData(techData.data);

            // Fetch earnings data
            const earningsResponse = await fetch(`/api/market-data/earnings/${symbol}`);
            const earningsData = await earningsResponse.json();
            if (!earningsResponse.ok) throw new Error(earningsData.message);
            setEarningsData(earningsData.data);

        } catch (error) {
            console.error('Error fetching advanced insights:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const renderTechnicalIndicators = () => {
        if (!technicalData) return null;

        const chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)',
                    }
                }
            }
        };

        return (
            <Grid container spacing={3}>
                {/* RSI Chart */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Relative Strength Index (RSI)
                            </Typography>
                            <Box sx={{ height: 300 }}>
                                <Line
                                    data={{
                                        labels: technicalData.rsi.values.map(d => d.date),
                                        datasets: [{
                                            label: 'RSI',
                                            data: technicalData.rsi.values.map(d => d.value),
                                            borderColor: '#2196f3',
                                            tension: 0.4
                                        }]
                                    }}
                                    options={chartOptions}
                                />
                            </Box>
                            <Typography variant="body2" color="text.secondary" mt={2}>
                                Latest RSI: {technicalData.rsi.latest?.value.toFixed(2)}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                {/* MACD Chart */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Moving Average Convergence Divergence (MACD)
                            </Typography>
                            <Box sx={{ height: 300 }}>
                                <Line
                                    data={{
                                        labels: technicalData.macd.values.map(d => d.date),
                                        datasets: [{
                                            label: 'MACD',
                                            data: technicalData.macd.values.map(d => d.value),
                                            borderColor: '#4caf50',
                                            tension: 0.4
                                        }]
                                    }}
                                    options={chartOptions}
                                />
                            </Box>
                            <Typography variant="body2" color="text.secondary" mt={2}>
                                Latest MACD: {technicalData.macd.latest?.value.toFixed(2)}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Moving Average Chart */}
                <Grid item xs={12}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Simple Moving Average (20-day)
                            </Typography>
                            <Box sx={{ height: 300 }}>
                                <Line
                                    data={{
                                        labels: technicalData.sma.values.map(d => d.date),
                                        datasets: [{
                                            label: 'SMA',
                                            data: technicalData.sma.values.map(d => d.value),
                                            borderColor: '#ff9800',
                                            tension: 0.4
                                        }]
                                    }}
                                    options={chartOptions}
                                />
                            </Box>
                            <Typography variant="body2" color="text.secondary" mt={2}>
                                Latest SMA: {technicalData.sma.latest?.value.toFixed(2)}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        );
    };

    const renderEarningsAnalysis = () => {
        if (!earningsData) return null;

        const chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                }
            }
        };

        return (
            <Grid container spacing={3}>
                {/* Quarterly Earnings Chart */}
                <Grid item xs={12}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Quarterly Earnings Performance
                            </Typography>
                            <Box sx={{ height: 400 }}>
                                <Line
                                    data={{
                                        labels: earningsData.quarterly.map(q => q.date),
                                        datasets: [
                                            {
                                                label: 'Reported EPS',
                                                data: earningsData.quarterly.map(q => q.reportedEPS),
                                                borderColor: '#2196f3',
                                                tension: 0.4
                                            },
                                            {
                                                label: 'Estimated EPS',
                                                data: earningsData.quarterly.map(q => q.estimatedEPS),
                                                borderColor: '#4caf50',
                                                tension: 0.4,
                                                borderDash: [5, 5]
                                            }
                                        ]
                                    }}
                                    options={chartOptions}
                                />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Latest Earnings Summary */}
                <Grid item xs={12}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Latest Earnings Summary
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Reported EPS
                                    </Typography>
                                    <Typography variant="h6">
                                        ${earningsData.latest?.reportedEPS.toFixed(2)}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Estimated EPS
                                    </Typography>
                                    <Typography variant="h6">
                                        ${earningsData.latest?.estimatedEPS.toFixed(2)}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Surprise
                                    </Typography>
                                    <Typography variant="h6">
                                        ${earningsData.latest?.surprise.toFixed(2)}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Surprise %
                                    </Typography>
                                    <Typography variant="h6">
                                        {earningsData.latest?.surprisePercentage.toFixed(2)}%
                                    </Typography>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        );
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Typography color="error" p={3}>
                {error}
            </Typography>
        );
    }

    return (
        <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 500 }}>
                Advanced Insights for {symbol}
            </Typography>
            
            <Tabs
                value={activeTab}
                onChange={(e, newValue) => setActiveTab(newValue)}
                sx={{ mb: 3 }}
            >
                <Tab label="Technical Indicators" />
                <Tab label="Earnings Analysis" />
            </Tabs>

            <Box mt={2}>
                {activeTab === 0 && renderTechnicalIndicators()}
                {activeTab === 1 && renderEarningsAnalysis()}
            </Box>
        </Paper>
    );
};

export default AdvancedInsights; 