import React, { useState, useEffect } from 'react';
import {
    Box, Paper, Typography, Grid, Card, CardContent,
    TextField, IconButton, Chip, CircularProgress,
    List, ListItem, ListItemText, Divider, Button,
    Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import {
    TrendingUp, Search, Article, Refresh,
    OpenInNew, ArrowUpward, ArrowDownward
} from '@mui/icons-material';

const MarketDataSection = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSymbol, setSelectedSymbol] = useState(null);
    const [stockData, setStockData] = useState(null);
    const [companyData, setCompanyData] = useState(null);
    const [newsData, setNewsData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchResults, setSearchResults] = useState([]);
    const [showNewsDialog, setShowNewsDialog] = useState(false);
    const [selectedArticle, setSelectedArticle] = useState(null);

    const handleSearch = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await fetch(`/api/market-data/search?keywords=${encodeURIComponent(searchQuery)}`);
            const data = await response.json();
            
            if (response.ok) {
                setSearchResults(data);
            } else {
                setError(data.error);
            }
        } catch (error) {
            setError('Failed to search symbols');
        } finally {
            setLoading(false);
        }
    };

    const fetchMarketData = async (symbol) => {
        try {
            setLoading(true);
            setError(null);
            
            // Fetch stock data
            const stockResponse = await fetch(`/api/market-data/stock/${symbol}`);
            const stockData = await stockResponse.json();
            
            if (!stockResponse.ok) throw new Error(stockData.error);
            setStockData(stockData);
            
            // Fetch company overview
            const companyResponse = await fetch(`/api/market-data/company/${symbol}`);
            const companyData = await companyResponse.json();
            
            if (!companyResponse.ok) throw new Error(companyData.error);
            setCompanyData(companyData);
            
            // Fetch news
            const newsResponse = await fetch(`/api/market-data/news?symbol=${symbol}`);
            const newsData = await newsResponse.json();
            
            if (!newsResponse.ok) throw new Error(newsData.error);
            setNewsData(newsData);
            
            setSelectedSymbol(symbol);
            
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const renderStockInfo = () => {
        if (!stockData?.latest) return null;
        
        const latest = stockData.latest;
        const priceChange = latest.close - latest.open;
        const percentChange = (priceChange / latest.open) * 100;
        
        return (
            <Card sx={{ mb: 2 }}>
                <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="h6">
                            {selectedSymbol}
                        </Typography>
                        <IconButton onClick={() => fetchMarketData(selectedSymbol)}>
                            <Refresh />
                        </IconButton>
                    </Box>
                    <Typography variant="h4" component="div" sx={{ mt: 2 }}>
                        ${latest.close.toFixed(2)}
                    </Typography>
                    <Box display="flex" alignItems="center" mt={1}>
                        {priceChange >= 0 ? (
                            <ArrowUpward sx={{ color: 'success.main' }} />
                        ) : (
                            <ArrowDownward sx={{ color: 'error.main' }} />
                        )}
                        <Typography
                            variant="body1"
                            sx={{
                                color: priceChange >= 0 ? 'success.main' : 'error.main',
                                ml: 1
                            }}
                        >
                            {Math.abs(priceChange).toFixed(2)} ({Math.abs(percentChange).toFixed(2)}%)
                        </Typography>
                    </Box>
                    <Grid container spacing={2} sx={{ mt: 2 }}>
                        <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">
                                Open
                            </Typography>
                            <Typography variant="body1">
                                ${latest.open.toFixed(2)}
                            </Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">
                                High
                            </Typography>
                            <Typography variant="body1">
                                ${latest.high.toFixed(2)}
                            </Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">
                                Low
                            </Typography>
                            <Typography variant="body1">
                                ${latest.low.toFixed(2)}
                            </Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">
                                Volume
                            </Typography>
                            <Typography variant="body1">
                                {latest.volume.toLocaleString()}
                            </Typography>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>
        );
    };

    const renderCompanyInfo = () => {
        if (!companyData) return null;
        
        return (
            <Card sx={{ mb: 2 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Company Overview
                    </Typography>
                    <Typography variant="body1" paragraph>
                        {companyData.Description}
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={6} md={4}>
                            <Typography variant="body2" color="text.secondary">
                                Sector
                            </Typography>
                            <Typography variant="body1">
                                {companyData.Sector}
                            </Typography>
                        </Grid>
                        <Grid item xs={6} md={4}>
                            <Typography variant="body2" color="text.secondary">
                                Industry
                            </Typography>
                            <Typography variant="body1">
                                {companyData.Industry}
                            </Typography>
                        </Grid>
                        <Grid item xs={6} md={4}>
                            <Typography variant="body2" color="text.secondary">
                                Market Cap
                            </Typography>
                            <Typography variant="body1">
                                ${parseFloat(companyData.MarketCapitalization).toLocaleString()}
                            </Typography>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>
        );
    };

    const renderNews = () => {
        if (!newsData?.articles?.length) return null;
        
        return (
            <Card>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Latest News
                    </Typography>
                    <Box display="flex" gap={1} mb={2}>
                        <Chip
                            label={`Positive: ${newsData.sentiment_summary.positive}`}
                            color="success"
                            size="small"
                        />
                        <Chip
                            label={`Neutral: ${newsData.sentiment_summary.neutral}`}
                            color="default"
                            size="small"
                        />
                        <Chip
                            label={`Negative: ${newsData.sentiment_summary.negative}`}
                            color="error"
                            size="small"
                        />
                    </Box>
                    <List>
                        {newsData.articles.map((article, index) => (
                            <React.Fragment key={index}>
                                <ListItem
                                    button
                                    onClick={() => {
                                        setSelectedArticle(article);
                                        setShowNewsDialog(true);
                                    }}
                                >
                                    <ListItemText
                                        primary={article.title}
                                        secondary={
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <Chip
                                                    label={article.sentiment}
                                                    color={
                                                        article.sentiment === 'positive' ? 'success' :
                                                        article.sentiment === 'negative' ? 'error' :
                                                        'default'
                                                    }
                                                    size="small"
                                                />
                                                <Typography variant="caption">
                                                    {new Date(article.time_published).toLocaleString()}
                                                </Typography>
                                            </Box>
                                        }
                                    />
                                </ListItem>
                                {index < newsData.articles.length - 1 && <Divider />}
                            </React.Fragment>
                        ))}
                    </List>
                </CardContent>
            </Card>
        );
    };

    return (
        <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 500 }}>
                Market Data & News
            </Typography>
            
            {/* Search Bar */}
            <Box display="flex" gap={2} mb={3}>
                <TextField
                    fullWidth
                    size="small"
                    placeholder="Search for stocks (e.g., AAPL, MSFT, GOOGL)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button
                    variant="contained"
                    startIcon={<Search />}
                    onClick={handleSearch}
                    disabled={loading}
                >
                    Search
                </Button>
            </Box>

            {/* Search Results */}
            {searchResults.length > 0 && (
                <Box mb={3}>
                    <Typography variant="subtitle2" gutterBottom>
                        Search Results
                    </Typography>
                    <Grid container spacing={1}>
                        {searchResults.map((result) => (
                            <Grid item key={result["1. symbol"]}>
                                <Chip
                                    label={`${result["1. symbol"]} - ${result["2. name"]}`}
                                    onClick={() => fetchMarketData(result["1. symbol"])}
                                    clickable
                                />
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            )}

            {/* Error Message */}
            {error && (
                <Typography color="error" sx={{ mb: 2 }}>
                    {error}
                </Typography>
            )}

            {/* Loading Indicator */}
            {loading && (
                <Box display="flex" justifyContent="center" my={4}>
                    <CircularProgress />
                </Box>
            )}

            {/* Market Data Display */}
            {selectedSymbol && (
                <Grid container spacing={3}>
                    <Grid item xs={12} md={4}>
                        {renderStockInfo()}
                    </Grid>
                    <Grid item xs={12} md={8}>
                        {renderCompanyInfo()}
                        {renderNews()}
                    </Grid>
                </Grid>
            )}

            {/* News Article Dialog */}
            <Dialog
                open={showNewsDialog}
                onClose={() => setShowNewsDialog(false)}
                maxWidth="md"
                fullWidth
            >
                {selectedArticle && (
                    <>
                        <DialogTitle>
                            {selectedArticle.title}
                        </DialogTitle>
                        <DialogContent>
                            <Typography variant="body1" paragraph>
                                {selectedArticle.summary}
                            </Typography>
                            <Box display="flex" gap={1} mb={2}>
                                {selectedArticle.topics.map((topic, index) => (
                                    <Chip
                                        key={index}
                                        label={topic}
                                        size="small"
                                    />
                                ))}
                            </Box>
                            {selectedArticle.ticker_sentiment.length > 0 && (
                                <Box mt={2}>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Mentioned Tickers
                                    </Typography>
                                    <Box display="flex" gap={1}>
                                        {selectedArticle.ticker_sentiment.map((ticker, index) => (
                                            <Chip
                                                key={index}
                                                label={`${ticker.ticker}: ${ticker.sentiment_score.toFixed(2)}`}
                                                color={
                                                    ticker.sentiment_score > 0.2 ? 'success' :
                                                    ticker.sentiment_score < -0.2 ? 'error' :
                                                    'default'
                                                }
                                                size="small"
                                            />
                                        ))}
                                    </Box>
                                </Box>
                            )}
                        </DialogContent>
                        <DialogActions>
                            <Button
                                startIcon={<OpenInNew />}
                                href={selectedArticle.url}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Read Full Article
                            </Button>
                            <Button onClick={() => setShowNewsDialog(false)}>
                                Close
                            </Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>
        </Paper>
    );
};

export default MarketDataSection; 