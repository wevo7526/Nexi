"use client";
import React, { useState, useEffect } from "react";
import {
    CircularProgress, Box, Typography, Grid,
    Paper, Card, CardContent, Alert
} from "@mui/material";
import {
    TrendingUp, TrendingDown
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
    BarElement
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import Sidebar from "../components/Sidebar";

// API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend
);

// Define the stocks we want to track
const TRACKED_STOCKS = ['AAPL', 'GOOGL', 'MSFT', 'AMZN'];

function Insights() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stockData, setStockData] = useState({});
    const [newsData, setNewsData] = useState([]);

    useEffect(() => {
        fetchMarketData();
        const interval = setInterval(fetchMarketData, 5 * 60 * 1000); // Refresh every 5 minutes

        return () => clearInterval(interval);
    }, []);

    const fetchMarketData = async () => {
        try {
            setLoading(true);
            const stockPromises = TRACKED_STOCKS.map(async symbol => {
                try {
                    console.log(`Fetching data for ${symbol}...`);
                    const response = await fetch(`${API_BASE_URL}/api/market-data/stock/${symbol}`);
                    
                    if (!response.ok) {
                        const errorText = await response.text();
                        console.error(`Error response for ${symbol}:`, errorText);
                        throw new Error(`Failed to fetch data for ${symbol}: ${response.status} ${response.statusText}`);
                    }

                    const data = await response.json();
                    
                    if (data.error) {
                        throw new Error(data.message || `Error fetching data for ${symbol}`);
                    }

                    // Check if we have the expected data structure
                    if (!data.data || !data.data['Time Series (Daily)']) {
                        console.error(`Invalid data structure for ${symbol}:`, data);
                        throw new Error(`Invalid data received for ${symbol}`);
                    }

                    return {
                        symbol,
                        latest: {
                            open: parseFloat(data.data['1. open'] || 0),
                            high: parseFloat(data.data['2. high'] || 0),
                            low: parseFloat(data.data['3. low'] || 0),
                            close: parseFloat(data.data['4. close'] || 0),
                            volume: parseInt(data.data['5. volume'] || 0)
                        },
                        prices: Object.entries(data.data['Time Series (Daily)'] || {}).map(([date, values]) => ({
                            date,
                            open: parseFloat(values['1. open']),
                            high: parseFloat(values['2. high']),
                            low: parseFloat(values['3. low']),
                            close: parseFloat(values['4. close']),
                            volume: parseInt(values['5. volume'])
                        })).sort((a, b) => new Date(a.date) - new Date(b.date))
                    };
                } catch (error) {
                    console.error(`Error processing ${symbol}:`, error);
                    return null;
                }
            });

            let newsResult = { articles: [] };
            try {
                const newsResponse = await fetch(`${API_BASE_URL}/api/market-data/news?topics=technology,earnings`);
                if (newsResponse.ok) {
                    const newsData = await newsResponse.json();
                    if (!newsData.error) {
                        newsResult = newsData.data || { articles: [] };
                    }
                }
            } catch (newsError) {
                console.error('News fetch error:', newsError);
            }

            const stockResults = await Promise.all(stockPromises);
            const stockDataMap = {};
            
            stockResults.forEach((result) => {
                if (result) {
                    stockDataMap[result.symbol] = {
                        latest: result.latest,
                        prices: result.prices
                    };
                }
            });

            if (Object.keys(stockDataMap).length === 0) {
                throw new Error('No stock data available. Please ensure the API service is running and properly configured.');
            }

            setStockData(stockDataMap);
            setNewsData(newsResult.articles || []);
            setError(null);
        } catch (error) {
            console.error('Error in fetchMarketData:', error);
            setError(error.message || 'Failed to fetch market data. Please ensure the API service is running.');
            setStockData({});
            setNewsData([]);
        } finally {
            setLoading(false);
        }
    };

    const renderStockCard = (symbol) => {
        const data = stockData[symbol];
        if (!data?.latest) return null;

        const latest = data.latest;
        const priceChange = latest.close - latest.open;
        const percentChange = (priceChange / latest.open) * 100;

        return (
            <Card sx={{ height: '100%' }}>
                <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="h6" fontWeight="bold">
                            {symbol}
                        </Typography>
                        {priceChange >= 0 ? (
                            <TrendingUp sx={{ color: 'success.main' }} />
                        ) : (
                            <TrendingDown sx={{ color: 'error.main' }} />
                        )}
                    </Box>
                    <Typography variant="h4" sx={{ my: 2 }}>
                        ${latest.close.toFixed(2)}
                    </Typography>
                    <Typography
                        variant="body1"
                        sx={{
                            color: priceChange >= 0 ? 'success.main' : 'error.main',
                            fontWeight: 500
                        }}
                    >
                        {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)} ({percentChange.toFixed(2)}%)
                    </Typography>
                    <Box mt={2}>
                        <Grid container spacing={1}>
                            <Grid item xs={6}>
                                <Typography variant="caption" color="text.secondary">
                                    High
                                </Typography>
                                <Typography variant="body2">
                                    ${latest.high.toFixed(2)}
                                </Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="caption" color="text.secondary">
                                    Low
                                </Typography>
                                <Typography variant="body2">
                                    ${latest.low.toFixed(2)}
                                </Typography>
                            </Grid>
                            <Grid item xs={12}>
                                <Typography variant="caption" color="text.secondary">
                                    Volume
                                </Typography>
                                <Typography variant="body2">
                                    {latest.volume.toLocaleString()}
                                </Typography>
                            </Grid>
                        </Grid>
                    </Box>
                </CardContent>
            </Card>
        );
    };

    const renderPriceChart = () => {
        if (!Object.keys(stockData).length) return null;

        const chartData = {
            labels: stockData[TRACKED_STOCKS[0]]?.prices.map(p => new Date(p.date).toLocaleDateString()) || [],
            datasets: TRACKED_STOCKS.map((symbol, index) => ({
                label: symbol,
                data: stockData[symbol]?.prices.map(p => p.close) || [],
                borderColor: [
                    '#2196f3',
                    '#4caf50',
                    '#ff9800',
                    '#f44336'
                ][index],
                tension: 0.4,
                fill: false
            }))
        };

        return (
            <Paper sx={{ p: 3, mb: 4 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 500 }}>
                    Stock Price Trends
                    </Typography>
                <Box sx={{ height: 400 }}>
                    <Line
                        data={chartData}
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
                                    beginAtZero: false,
                                    grid: {
                                        color: 'rgba(0, 0, 0, 0.05)',
                                    }
                                }
                            }
                        }}
                    />
                </Box>
            </Paper>
        );
    };

    const renderVolumeChart = () => {
        if (!Object.keys(stockData).length) return null;

        const chartData = {
            labels: stockData[TRACKED_STOCKS[0]]?.prices.map(p => new Date(p.date).toLocaleDateString()) || [],
            datasets: TRACKED_STOCKS.map((symbol, index) => ({
                label: symbol,
                data: stockData[symbol]?.prices.map(p => p.volume) || [],
                backgroundColor: [
                    'rgba(33, 150, 243, 0.5)',
                    'rgba(76, 175, 80, 0.5)',
                    'rgba(255, 152, 0, 0.5)',
                    'rgba(244, 67, 54, 0.5)'
                ][index]
            }))
        };

        return (
            <Paper sx={{ p: 3, mb: 4 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 500 }}>
                    Trading Volume Analysis
                </Typography>
                <Box sx={{ height: 400 }}>
                    <Bar
                        data={chartData}
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
        );
    };

    const renderNewsSection = () => {
        if (!newsData.length) return null;

        return (
            <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 500 }}>
                    Market News & Analysis
                </Typography>
                <Grid container spacing={2}>
                    {newsData.slice(0, 4).map((article, index) => (
                        <Grid item xs={12} key={index}>
                            <Card>
                                <CardContent>
                                    <Typography variant="subtitle1" gutterBottom>
                                        {article.title}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {article.summary}
                                    </Typography>
                                    <Box display="flex" gap={1} mt={1}>
                                        {article.ticker_sentiment?.map((ticker, idx) => {
                                            // Debug log for ticker sentiment data
                                            console.log('Ticker sentiment data:', ticker);
                                            const score = parseFloat(ticker.ticker_sentiment_score);
                                            return (
                                                <Typography 
                                                    key={idx}
                                                    variant="caption"
                                                    sx={{
                                                        color: !isNaN(score) && score > 0 ? 'success.main' : 'error.main',
                                                        fontWeight: 500
                                                    }}
                                                >
                                                    {ticker.ticker}: {!isNaN(score) ? score.toFixed(2) : 'N/A'}
                                                </Typography>
                                            );
                                        })}
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </Paper>
        );
    };

    if (loading && !Object.keys(stockData).length) {
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
                    <Typography variant="h4" gutterBottom sx={{ fontWeight: 500 }}>
                        Market Insights
                    </Typography>

                    {error && (
                        <Alert severity="error" sx={{ mb: 3 }}>
                            {error}
                        </Alert>
                    )}

                    {/* Stock Cards */}
                    <Grid container spacing={3} mb={4}>
                        {TRACKED_STOCKS.map((symbol) => (
                            <Grid item xs={12} sm={6} md={3} key={symbol}>
                                {renderStockCard(symbol)}
                            </Grid>
                        ))}
                    </Grid>

                    {/* Charts */}
                    {renderPriceChart()}
                    {renderVolumeChart()}

                    {/* News Section */}
                    {renderNewsSection()}
                </Box>
            </Box>
        </Box>
    );
}

export default Insights; 