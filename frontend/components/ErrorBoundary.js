import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { ErrorOutline } from '@mui/icons-material';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({
            error: error,
            errorInfo: errorInfo
        });
        
        // Log error to your error tracking service here
        console.error('Error caught by boundary:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <Box
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                    minHeight="100vh"
                    bgcolor="background.default"
                >
                    <Paper
                        elevation={3}
                        sx={{
                            p: 4,
                            maxWidth: 500,
                            textAlign: 'center',
                            borderRadius: 2
                        }}
                    >
                        <ErrorOutline
                            color="error"
                            sx={{ fontSize: 64, mb: 2 }}
                        />
                        <Typography variant="h5" gutterBottom>
                            Something went wrong
                        </Typography>
                        <Typography color="text.secondary" paragraph>
                            We apologize for the inconvenience. Please try refreshing the page or contact support if the problem persists.
                        </Typography>
                        <Button
                            variant="contained"
                            onClick={() => window.location.reload()}
                            sx={{ mt: 2 }}
                        >
                            Refresh Page
                        </Button>
                        {process.env.NODE_ENV === 'development' && (
                            <Box mt={4} textAlign="left">
                                <Typography variant="body2" color="error" sx={{ whiteSpace: 'pre-wrap' }}>
                                    {this.state.error && this.state.error.toString()}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 2, whiteSpace: 'pre-wrap' }}>
                                    {this.state.errorInfo && this.state.errorInfo.componentStack}
                                </Typography>
                            </Box>
                        )}
                    </Paper>
                </Box>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary; 