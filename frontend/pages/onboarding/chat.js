"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabaseClient';
import Head from 'next/head';
import Image from 'next/image';
import { 
    Box, 
    Container, 
    AppBar,
    Toolbar,
    Typography,
    TextField,
    IconButton,
    Paper,
    Avatar,
    Alert,
    CircularProgress,
    styled,
    useTheme
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';

const StyledMessageContainer = styled(Box)(({ theme }) => ({
    display: 'flex',
    gap: theme.spacing(2),
    padding: theme.spacing(3),
    marginBottom: theme.spacing(2),
    borderRadius: theme.shape.borderRadius,
    transition: 'background-color 0.2s ease',
    '&.assistant': {
        borderLeft: `4px solid ${theme.palette.primary.main}`,
        backgroundColor: theme.palette.grey[50],
    },
    '&.user': {
        backgroundColor: '#fff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        border: `1px solid ${theme.palette.grey[200]}`
    }
}));

const StyledAvatar = styled(Avatar)(({ theme, role }) => ({
    width: 38,
    height: 38,
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    backgroundColor: role === 'assistant' ? theme.palette.primary.main : theme.palette.grey[100],
    color: role === 'assistant' ? '#fff' : theme.palette.grey[700],
    fontSize: '0.9rem',
    fontWeight: 600
}));

const StyledSystemMessage = styled(Paper)(({ theme }) => ({
    backgroundColor: theme.palette.primary[50],
    color: theme.palette.primary[700],
    padding: theme.spacing(1.5, 3),
    display: 'inline-flex',
    alignItems: 'center',
    margin: theme.spacing(2, 0),
    border: `1px solid ${theme.palette.primary[100]}`,
    borderRadius: 20,
    boxShadow: 'none',
    fontSize: '0.9rem'
}));

const MessageContent = styled(Typography)(({ theme }) => ({
    fontSize: '0.95rem',
    lineHeight: 1.6,
    color: theme.palette.text.primary,
    '& p': {
        margin: theme.spacing(1, 0)
    }
}));

const InputContainer = styled(Paper)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    padding: theme.spacing(1, 2),
    border: `1px solid ${theme.palette.grey[200]}`,
    borderRadius: theme.shape.borderRadius * 2,
    boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
    backgroundColor: '#fff',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
    '&:hover': {
        borderColor: theme.palette.primary.main,
    },
    '&:focus-within': {
        borderColor: theme.palette.primary.main,
        boxShadow: `0 0 0 2px ${theme.palette.primary[100]}`
    }
}));

export default function OnboardingChat() {
    const [session, setSession] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const messagesEndRef = useRef(null);
    const router = useRouter();

    useEffect(() => {
        // Check authentication and load conversation
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (!session) {
                router.push('/auth');
            } else {
                loadConversation();
            }
        });

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

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const loadConversation = async () => {
        setMessages([{
            role: 'assistant',
            content: "Hello! I'm your AI wealth management assistant. I'll help you create your personalized financial profile. Let's start with your financial goals. What are your main financial objectives?"
        }]);
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const messageText = input.trim();
        setInput('');
        setLoading(true);
        setError(null);

        const userMessage = { role: 'user', content: messageText };
        setMessages(prev => [...prev, userMessage]);

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
                    message: messageText
                }),
                mode: 'cors',
                credentials: 'include'
            });

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

            setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);

            if (data.is_complete) {
                setMessages(prev => [...prev, {
                    role: 'system',
                    content: 'Profile creation complete! Redirecting to your dashboard...'
                }]);
                setTimeout(() => {
                    router.push('/dashboard');
                }, 3000);
            }

        } catch (error) {
            console.error('Chat error:', error);
            let errorMessage = error.message;
            
            if (error instanceof TypeError && error.message.includes('NetworkError')) {
                errorMessage = 'Unable to connect to the server. Please ensure the backend server is running at http://localhost:5000';
            }
            
            setError(errorMessage || 'Failed to send message. Please try again.');
            setMessages(prev => prev.slice(0, -1));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ 
            height: '100vh', 
            display: 'flex', 
            flexDirection: 'column',
            bgcolor: 'grey.50'
        }}>
            <Head>
                <title>Profile Setup | Nexi</title>
                <meta name="description" content="Complete your profile setup with our AI assistant" />
            </Head>

            <AppBar position="sticky" color="inherit" elevation={0} sx={{ 
                borderBottom: 1, 
                borderColor: 'grey.200',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(8px)'
            }}>
                <Toolbar sx={{ height: 64 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Image
                            src="/Nexi.png"
                            alt="Nexi Logo"
                            width={90}
                            height={30}
                            priority
                            style={{ height: 28, width: 'auto' }}
                        />
                        <Box sx={{ 
                            borderLeft: 1, 
                            borderColor: 'grey.200',
                            pl: 3,
                            display: { xs: 'none', sm: 'block' }
                        }}>
                            <Typography variant="h6" color="text.primary" sx={{ fontSize: '1rem', fontWeight: 600 }}>
                                Profile Setup
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                                AI-Guided Onboarding
                            </Typography>
                        </Box>
                    </Box>
                </Toolbar>
            </AppBar>

            <Box sx={{ 
                flex: 1, 
                position: 'relative',
                overflow: 'hidden',
                bgcolor: 'grey.50',
                display: 'flex',
                flexDirection: 'column'
            }}>
                <Box sx={{ 
                    flexGrow: 1,
                    overflowY: 'auto',
                    position: 'relative',
                    height: 'calc(100vh - 180px)',
                    '&::-webkit-scrollbar': {
                        width: '8px',
                    },
                    '&::-webkit-scrollbar-track': {
                        backgroundColor: 'transparent',
                    },
                    '&::-webkit-scrollbar-thumb': {
                        backgroundColor: 'rgba(0,0,0,0.1)',
                        borderRadius: '4px',
                        '&:hover': {
                            backgroundColor: 'rgba(0,0,0,0.2)',
                        }
                    }
                }}>
                    <Container maxWidth="md" sx={{ py: 4 }}>
                        {messages.map((message, index) => (
                            message.role === 'system' ? (
                                <Box key={index} sx={{ display: 'flex', justifyContent: 'center' }}>
                                    <StyledSystemMessage>
                                        <Typography variant="body2">{message.content}</Typography>
                                    </StyledSystemMessage>
                                </Box>
                            ) : (
                                <StyledMessageContainer key={index} className={message.role}>
                                    <StyledAvatar role={message.role}>
                                        {message.role === 'assistant' ? 'AI' : 'Y'}
                                    </StyledAvatar>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography 
                                            variant="subtitle2" 
                                            sx={{ 
                                                fontWeight: 600,
                                                color: 'text.primary',
                                                mb: 0.5
                                            }}
                                        >
                                            {message.role === 'assistant' ? 'AI Assistant' : 'You'}
                                        </Typography>
                                        <MessageContent>
                                            {message.content}
                                        </MessageContent>
                                    </Box>
                                </StyledMessageContainer>
                            )
                        ))}
                        <div ref={messagesEndRef} />
                    </Container>
                </Box>

                <Box sx={{
                    position: 'sticky',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    bgcolor: 'grey.50',
                    borderTop: '1px solid',
                    borderColor: 'grey.200',
                    pt: 3,
                    pb: 4,
                    zIndex: 1
                }}>
                    <Container maxWidth="md">
                        {error && (
                            <Alert 
                                severity="error" 
                                sx={{ 
                                    mb: 2,
                                    borderRadius: 2,
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                                }}
                            >
                                {error}
                            </Alert>
                        )}
                        <InputContainer
                            component="form"
                            onSubmit={handleSendMessage}
                            elevation={0}
                        >
                            <TextField
                                fullWidth
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Type your message..."
                                disabled={loading}
                                variant="standard"
                                sx={{ 
                                    mx: 1,
                                    '& .MuiInput-root': {
                                        fontSize: '1rem',
                                        padding: '8px'
                                    }
                                }}
                                InputProps={{
                                    disableUnderline: true,
                                }}
                            />
                            <IconButton 
                                type="submit" 
                                disabled={loading || !input.trim()}
                                color="primary"
                                sx={{ 
                                    p: '10px',
                                    '&:hover': {
                                        backgroundColor: 'primary.50'
                                    }
                                }}
                            >
                                {loading ? (
                                    <CircularProgress size={24} />
                                ) : (
                                    <SendIcon />
                                )}
                            </IconButton>
                        </InputContainer>
                        <Typography 
                            variant="caption" 
                            color="text.secondary" 
                            align="center" 
                            display="block"
                            sx={{ 
                                mt: 1.5,
                                opacity: 0.8,
                                fontWeight: 500
                            }}
                        >
                            Your responses help us create a personalized wealth management strategy
                        </Typography>
                    </Container>
                </Box>
            </Box>
        </Box>
    );
} 