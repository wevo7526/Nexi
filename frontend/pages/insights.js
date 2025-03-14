"use client";
import React, { useState, useEffect, useMemo } from "react";
import {
    CircularProgress, Box, Typography, Grid, Button,
    Paper, useMediaQuery, IconButton, Divider,
    Menu, MenuItem, Select, FormControl,
    InputLabel, Card, CardContent, Alert
} from "@mui/material";
import { useTheme } from '@mui/material/styles';
import {
    TrendingUp, Assessment, Business, Analytics,
    Download, Share, FilterList, Timeline,
    ShowChart, CompareArrows, Speed
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
    ArcElement,
    BarElement
} from 'chart.js';
import { Line, Pie, Bar } from 'react-chartjs-2';
import Sidebar from "../components/Sidebar";
import { supabase } from "../lib/supabaseClient";

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

function Insights() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [timeRange, setTimeRange] = useState('month');
    const [filterAnchorEl, setFilterAnchorEl] = useState(null);
    const [selectedMetrics, setSelectedMetrics] = useState(['revenue', 'market_share', 'satisfaction', 'efficiency']);
    const [insights, setInsights] = useState(null);
    const [comparisonData, setComparisonData] = useState(null);

    useEffect(() => {
        fetchInsights();
        const subscription = supabase
            .channel('insights_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'insights' }, 
                payload => {
                    fetchInsights();
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [timeRange]);

    const fetchInsights = async () => {
        try {
            setLoading(true);
            
            // Fetch insights from Supabase
            const { data: insightsData, error: insightsError } = await supabase
                .from('insights')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(1);

            if (insightsError) throw insightsError;

            // Fetch historical data for comparison
            const { data: historicalData, error: historicalError } = await supabase
                .from('insights_history')
                .select('*')
                .gte('created_at', getTimeRangeDate())
                .order('created_at', { ascending: true });

            if (historicalError) throw historicalError;

            setInsights(insightsData[0]);
            setComparisonData(processHistoricalData(historicalData));

        } catch (error) {
            console.error('Error fetching insights:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const getTimeRangeDate = () => {
        const date = new Date();
        switch (timeRange) {
            case 'week':
                date.setDate(date.getDate() - 7);
                break;
            case 'month':
                date.setMonth(date.getMonth() - 1);
                break;
            case 'quarter':
                date.setMonth(date.getMonth() - 3);
                break;
            case 'year':
                date.setFullYear(date.getFullYear() - 1);
                break;
        }
        return date.toISOString();
    };

    const processHistoricalData = (data) => {
        if (!data?.length) return null;

        const metrics = {
            revenue: [],
            market_share: [],
            satisfaction: [],
            efficiency: [],
            dates: []
        };

        data.forEach(item => {
            metrics.revenue.push(item.revenue_growth);
            metrics.market_share.push(item.market_share);
            metrics.satisfaction.push(item.customer_satisfaction);
            metrics.efficiency.push(item.operational_efficiency);
            metrics.dates.push(new Date(item.created_at).toLocaleDateString());
        });

        return metrics;
    };

    const getTrendData = useMemo(() => {
        if (!comparisonData) return null;

        return {
            labels: comparisonData.dates,
            datasets: selectedMetrics.map((metric, index) => ({
                label: metric.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
                data: comparisonData[metric],
                borderColor: [
                    theme.palette.primary.main,
                    theme.palette.success.main,
                    theme.palette.warning.main,
                    theme.palette.info.main
                ][index],
                tension: 0.4
            }))
        };
    }, [comparisonData, selectedMetrics, theme]);

    const renderMetricCard = (title, value, icon, trend) => (
        <Card sx={{ height: '100%' }}>
            <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                    {icon}
                    <Typography variant="subtitle2" color="textSecondary" ml={1}>
                        {title}
                    </Typography>
                </Box>
                <Typography variant="h3" component="div" sx={{ fontWeight: 500 }}>
                    {value}%
                </Typography>
                {trend && (
                    <Box display="flex" alignItems="center" mt={1}>
                        <CompareArrows 
                            sx={{ 
                                color: trend > 0 ? 'success.main' : 'error.main',
                                transform: trend > 0 ? 'rotate(-45deg)' : 'rotate(45deg)'
                            }} 
                        />
                        <Typography 
                            variant="body2" 
                            color={trend > 0 ? 'success.main' : 'error.main'}
                            ml={0.5}
                        >
                            {Math.abs(trend)}% vs last {timeRange}
                        </Typography>
                    </Box>
                )}
            </CardContent>
        </Card>
    );

    const handleExport = async () => {
        try {
            const csvContent = generateCSV();
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `insights_${new Date().toISOString()}.csv`;
            link.click();
        } catch (error) {
            console.error('Error exporting data:', error);
            setError('Failed to export data');
        }
    };

    const generateCSV = () => {
        if (!insights || !comparisonData) return '';

        const headers = ['Date', ...selectedMetrics.map(m => m.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '))];
        const rows = comparisonData.dates.map((date, index) => {
            return [
                date,
                ...selectedMetrics.map(metric => comparisonData[metric][index])
            ];
        });

        return [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');
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
                                Real-time metrics and trends analysis
                            </Typography>
                        </Box>
                        <Box display="flex" alignItems="center">
                            <FormControl sx={{ minWidth: 120, mr: 2 }}>
                                <Select
                                    value={timeRange}
                                    onChange={(e) => setTimeRange(e.target.value)}
                                    size="small"
                                >
                                    <MenuItem value="week">Last Week</MenuItem>
                                    <MenuItem value="month">Last Month</MenuItem>
                                    <MenuItem value="quarter">Last Quarter</MenuItem>
                                    <MenuItem value="year">Last Year</MenuItem>
                                </Select>
                            </FormControl>
                            <IconButton onClick={handleExport} sx={{ mr: 1 }}>
                                <Download />
                            </IconButton>
                            <IconButton onClick={(e) => setFilterAnchorEl(e.currentTarget)}>
                                <FilterList />
                            </IconButton>
                        </Box>
                    </Box>

                    {error && (
                        <Alert severity="error" sx={{ mb: 3 }}>
                            {error}
                        </Alert>
                    )}

                    {/* Key Metrics */}
                    <Grid container spacing={3} mb={4}>
                        <Grid item xs={12} sm={6} md={3}>
                            {renderMetricCard(
                                'Revenue Growth',
                                insights?.revenue_growth,
                                <TrendingUp sx={{ color: theme.palette.primary.main }} />,
                                insights?.revenue_trend
                            )}
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            {renderMetricCard(
                                'Market Share',
                                insights?.market_share,
                                <Business sx={{ color: theme.palette.success.main }} />,
                                insights?.market_share_trend
                            )}
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            {renderMetricCard(
                                'Customer Satisfaction',
                                insights?.customer_satisfaction,
                                <Assessment sx={{ color: theme.palette.warning.main }} />,
                                insights?.satisfaction_trend
                            )}
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            {renderMetricCard(
                                'Operational Efficiency',
                                insights?.operational_efficiency,
                                <Speed sx={{ color: theme.palette.info.main }} />,
                                insights?.efficiency_trend
                            )}
                        </Grid>
                    </Grid>

                    {/* Trend Chart */}
                    {getTrendData && (
                        <Paper sx={{ p: 3, mb: 4 }}>
                            <Typography variant="h6" gutterBottom sx={{ fontWeight: 500 }}>
                                Performance Trends
                            </Typography>
                            <Box sx={{ height: 400 }}>
                                <Line 
                                    data={getTrendData}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: {
                                            legend: {
                                                position: 'top',
                                            }
                                        },
                                        scales: {
                                            y: {
                                                beginAtZero: true,
                                                grid: {
                                                    color: 'rgba(0, 0, 0, 0.05)',
                                                }
                                            }
                                        }
                                    }}
                                />
                            </Box>
                        </Paper>
                    )}

                    {/* Analysis Grid */}
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <Paper sx={{ p: 3 }}>
                                <Typography variant="h6" gutterBottom sx={{ fontWeight: 500 }}>
                                    Key Insights
                                </Typography>
                                <Box component="ul" sx={{ pl: 2, mt: 2 }}>
                                    {insights?.key_insights?.map((insight, index) => (
                                        <Typography
                                            component="li"
                                            key={index}
                                            sx={{ mb: 2, color: 'text.secondary' }}
                                        >
                                            {insight}
                                        </Typography>
                                    ))}
                                </Box>
                            </Paper>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Paper sx={{ p: 3 }}>
                                <Typography variant="h6" gutterBottom sx={{ fontWeight: 500 }}>
                                    Action Items
                                </Typography>
                                <Box component="ul" sx={{ pl: 2, mt: 2 }}>
                                    {insights?.action_items?.map((action, index) => (
                                        <Typography
                                            component="li"
                                            key={index}
                                            sx={{ 
                                                mb: 2,
                                                color: theme.palette.primary.main,
                                                fontWeight: 500
                                            }}
                                        >
                                            {action}
                                        </Typography>
                                    ))}
                                </Box>
                            </Paper>
                        </Grid>
                    </Grid>

                    {/* Metrics Selection Menu */}
                    <Menu
                        anchorEl={filterAnchorEl}
                        open={Boolean(filterAnchorEl)}
                        onClose={() => setFilterAnchorEl(null)}
                    >
                        {['revenue', 'market_share', 'satisfaction', 'efficiency'].map((metric) => (
                            <MenuItem 
                                key={metric}
                                onClick={() => {
                                    const newMetrics = selectedMetrics.includes(metric)
                                        ? selectedMetrics.filter(m => m !== metric)
                                        : [...selectedMetrics, metric];
                                    setSelectedMetrics(newMetrics);
                                }}
                            >
                                <Typography 
                                    sx={{ 
                                        color: selectedMetrics.includes(metric) 
                                            ? 'primary.main' 
                                            : 'text.primary'
                                    }}
                                >
                                    {metric.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                </Typography>
                            </MenuItem>
                        ))}
                    </Menu>
                </Box>
            </Box>
        </Box>
    );
}

export default Insights; 