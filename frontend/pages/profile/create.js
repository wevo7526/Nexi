"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabaseClient';
import Head from 'next/head';
import Image from 'next/image';
import { 
    Box, 
    Container,
    Typography,
    Paper,
    Alert,
    Button,
    CircularProgress,
    styled
} from '@mui/material';

const GradientTypography = styled(Typography)(({ theme }) => ({
    color: theme.palette.text.primary,
    fontWeight: 700
}));

const FeatureCard = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(3),
    backgroundColor: theme.palette.common.white,
    border: `1px solid ${theme.palette.grey[200]}`,
    borderRadius: theme.shape.borderRadius * 2,
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: theme.shadows[2]
    }
}));

const StyledButton = styled(Button)(({ theme }) => ({
    backgroundColor: theme.palette.common.black,
    color: theme.palette.common.white,
    padding: theme.spacing(1.5, 4),
    borderRadius: theme.shape.borderRadius * 2,
    fontSize: '1rem',
    fontWeight: 600,
    textTransform: 'none',
    '&:hover': {
        backgroundColor: theme.palette.common.black
    }
}));

export default function CreateProfile() {
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ type: '', content: '' });
    const router = useRouter();

    useEffect(() => {
        // Check authentication status
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setLoading(false);
            if (!session) {
                router.push('/auth');
            }
        });

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (!session) {
                router.push('/auth');
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const startOnboarding = async () => {
        if (!session?.user?.id) return;

        setLoading(true);
        setMessage({ type: '', content: '' });
        
        try {
            const response = await fetch('http://localhost:5000/api/onboarding/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Origin': window.location.origin
                },
                body: JSON.stringify({
                    user_id: session.user.id,
                    message: "start"
                }),
                mode: 'cors',
                credentials: 'include'
            });

            // Handle non-JSON responses
            let data;
            try {
                const text = await response.text();
                data = text ? JSON.parse(text) : {};
            } catch (parseError) {
                console.error('Failed to parse response:', parseError);
                throw new Error('Invalid response from server. Please ensure the backend server is running.');
            }
            
            if (!response.ok) {
                throw new Error(data.error || `Server error: ${response.status}`);
            }

            // Redirect to the chat interface - we'll handle profile status updates in the chat interface
            router.push(`/onboarding/chat`);

        } catch (error) {
            console.error('Onboarding error:', error);
            let errorMessage = error.message;
            
            // Handle specific network errors
            if (error instanceof TypeError && error.message.includes('NetworkError')) {
                errorMessage = 'Unable to connect to the server. Please ensure the backend server is running at http://localhost:5000';
            }
            
            setMessage({
                type: 'error',
                content: errorMessage || 'Failed to start onboarding process. Please try again.'
            });
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Box 
                sx={{ 
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'common.white'
                }}
            >
                <CircularProgress size={32} />
            </Box>
        );
    }

    return (
        <>
            <Head>
                <title>Create Your Profile | Nexi</title>
                <meta name="description" content="Set up your wealth management profile" />
            </Head>

            <Box sx={{ 
                minHeight: '100vh',
                bgcolor: 'common.white',
                py: 8
            }}>
                <Container maxWidth="md">
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 6 }}>
                        <Image
                            src="/Nexi.png"
                            alt="Nexi Logo"
                            width={160}
                            height={53}
                            priority
                            style={{ height: 40, width: 'auto' }}
                        />
                    </Box>

                    <Paper sx={{ 
                        backgroundColor: 'common.white',
                        borderRadius: 4,
                        border: '1px solid',
                        borderColor: 'grey.200',
                        overflow: 'hidden'
                    }}>
                        <Box sx={{ p: { xs: 3, sm: 6 } }}>
                            <Box sx={{ textAlign: 'center', mb: 6 }}>
                                <GradientTypography variant="h3" sx={{ 
                                    fontSize: { xs: '1.75rem', sm: '2.5rem' },
                                    mb: 2,
                                    color: 'text.primary'
                                }}>
                                    Welcome to Your Wealth Journey
                                </GradientTypography>
                                <Typography variant="h6" sx={{ 
                                    color: 'text.secondary',
                                    fontWeight: 400
                                }}>
                                    Let's create your personalized wealth management profile with our AI-powered assistant
                                </Typography>
                            </Box>

                            <Box sx={{ 
                                display: 'grid',
                                gap: 3,
                                mb: 6,
                                gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }
                            }}>
                                <FeatureCard>
                                    <Typography variant="h6" sx={{ 
                                        color: 'text.primary',
                                        fontWeight: 600,
                                        mb: 1
                                    }}>
                                        AI-Powered Analysis
                                    </Typography>
                                    <Typography sx={{ color: 'text.secondary' }}>
                                        Our AI will analyze your financial goals and create a personalized strategy tailored to your needs.
                                    </Typography>
                                </FeatureCard>

                                <FeatureCard>
                                    <Typography variant="h6" sx={{ 
                                        color: 'text.primary',
                                        fontWeight: 600,
                                        mb: 1
                                    }}>
                                        Secure & Private
                                    </Typography>
                                    <Typography sx={{ color: 'text.secondary' }}>
                                        Your data is encrypted and protected with enterprise-grade security measures.
                                    </Typography>
                                </FeatureCard>

                                <FeatureCard>
                                    <Typography variant="h6" sx={{ 
                                        color: 'text.primary',
                                        fontWeight: 600,
                                        mb: 1
                                    }}>
                                        Quick Setup
                                    </Typography>
                                    <Typography sx={{ color: 'text.secondary' }}>
                                        Complete your profile in minutes with our streamlined onboarding process.
                                    </Typography>
                                </FeatureCard>
                            </Box>

                            {message.content && (
                                <Alert 
                                    severity={message.type === 'error' ? 'error' : 'success'}
                                    sx={{ 
                                        mb: 4,
                                        borderRadius: 2
                                    }}
                                >
                                    {message.content}
                                </Alert>
                            )}

                            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                                <StyledButton
                                    onClick={startOnboarding}
                                    disabled={loading}
                                    size="large"
                                    variant="outlined"
                                >
                                    {loading ? (
                                        <CircularProgress size={24} />
                                    ) : (
                                        'Begin Profile Setup'
                                    )}
                                </StyledButton>
                            </Box>
                        </Box>
                    </Paper>
                </Container>
            </Box>
        </>
    );
} 