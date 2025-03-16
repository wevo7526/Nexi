"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import { useToast } from "../components/ToastProvider";
import {
    CircularProgress, Typography, Box, Card, Grid,
    IconButton, TextField, Paper, Chip, Stack,
    LinearProgress, Button
} from "@mui/material";
import {
    Upload as UploadIcon, Delete, Search as SearchIcon,
    Article
} from "@mui/icons-material";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/router";

function Documents() {
    const [documents, setDocuments] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState(null);
    const [user, setUser] = useState(null);
    const router = useRouter();
    const { showToast } = useToast();

    useEffect(() => {
        const checkSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) {
                    router.push(`/auth?redirectTo=/documents`);
                } else {
                    setUser(session.user);
                    fetchDocuments();
                }
            } catch (error) {
                showToast('Error checking session', 'error');
            }
        };
        checkSession();
    }, [router]);

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        try {
            setUploading(true);
            setUploadProgress(0);
            const { data: { session } } = await supabase.auth.getSession();
            const formData = new FormData();
            formData.append('file', file);

            await axios.post('/api/upload_document', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${session.access_token}`
                },
                onUploadProgress: (progressEvent) => {
                    const progress = (progressEvent.loaded / progressEvent.total) * 100;
                    setUploadProgress(progress);
                }
            });

            showToast('Document uploaded successfully', 'success');
            fetchDocuments();
        } catch (error) {
            showToast('Error uploading document', 'error');
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    };

    const fetchDocuments = async () => {
        try {
            setLoading(true);
            const { data: { session } } = await supabase.auth.getSession();
            const response = await axios.get('/api/get_documents', {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            });
            setDocuments(response.data.documents);
        } catch (error) {
            showToast('Error fetching documents', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (documentId) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            await axios.delete(`/api/delete_document/${documentId}`, {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            });
            showToast('Document deleted successfully', 'success');
            fetchDocuments();
        } catch (error) {
            showToast('Error deleting document', 'error');
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;

        try {
            setLoading(true);
            const { data: { session } } = await supabase.auth.getSession();
            const response = await axios.post('/api/search_documents', 
                { query: searchQuery },
                {
                    headers: {
                        'Authorization': `Bearer ${session.access_token}`
                    }
                }
            );
            setSearchResults(response.data.results);
            setSearchQuery("");
        } catch (error) {
            showToast('Error searching documents', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSearch();
        }
    };

    return (
        <div className="documents">
            <div className="content">
                <Sidebar />
                <div className="main-content">
                    <Card sx={{ mb: 3, p: 2 }}>
                        <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} md={8}>
                                <TextField
                                    fullWidth
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Search through your documents..."
                                    variant="outlined"
                                    InputProps={{
                                        endAdornment: (
                                            <IconButton
                                                onClick={handleSearch}
                                                disabled={loading || !searchQuery.trim()}
                                            >
                                                <SearchIcon />
                                            </IconButton>
                                        )
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Paper sx={{ p: 2, textAlign: 'center' }}>
                                    <input
                                        type="file"
                                        id="document-upload"
                                        style={{ display: 'none' }}
                                        onChange={handleFileUpload}
                                        accept=".pdf,.doc,.docx,.txt"
                                    />
                                    <label htmlFor="document-upload">
                                        <Button
                                            variant="contained"
                                            component="span"
                                            startIcon={<UploadIcon />}
                                            disabled={uploading}
                                            fullWidth
                                        >
                                            Upload Document
                                        </Button>
                                    </label>
                                    {uploading && (
                                        <Box sx={{ width: '100%', mt: 1 }}>
                                            <LinearProgress 
                                                variant="determinate" 
                                                value={uploadProgress} 
                                            />
                                            <Typography variant="caption">
                                                {Math.round(uploadProgress)}%
                                            </Typography>
                                        </Box>
                                    )}
                                </Paper>
                            </Grid>
                        </Grid>
                    </Card>

                    {loading && (
                        <Box sx={{ width: '100%', mb: 3 }}>
                            <LinearProgress />
                        </Box>
                    )}

                    <Grid container spacing={2}>
                        {documents.map((doc) => (
                            <Grid item xs={12} sm={6} md={4} lg={3} key={doc.id}>
                                <Card 
                                    sx={{ 
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        position: 'relative',
                                        '&:hover': {
                                            boxShadow: 6
                                        }
                                    }}
                                >
                                    <Box 
                                        sx={{ 
                                            p: 2,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            flexGrow: 1
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                            <Article color="primary" />
                                            <IconButton
                                                size="small"
                                                onClick={() => handleDelete(doc.id)}
                                                sx={{
                                                    position: 'absolute',
                                                    top: 8,
                                                    right: 8
                                                }}
                                            >
                                                <Delete />
                                            </IconButton>
                                        </Box>
                                        <Typography 
                                            variant="subtitle1" 
                                            sx={{ 
                                                mb: 1,
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                display: '-webkit-box',
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: 'vertical'
                                            }}
                                        >
                                            {doc.name}
                                        </Typography>
                                        <Box sx={{ mt: 'auto' }}>
                                            <Chip
                                                size="small"
                                                label={doc.status}
                                                color={
                                                    doc.status === 'complete' ? 'success' : 
                                                    doc.status === 'processing' ? 'warning' : 
                                                    'error'
                                                }
                                                sx={{ mr: 1 }}
                                            />
                                            <Typography variant="caption" color="text.secondary">
                                                {new Date(doc.created_at).toLocaleDateString()}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>

                    {error && (
                        <Card sx={{ p: 2, bgcolor: 'error.light', mt: 2 }}>
                            <Typography color="error">{error}</Typography>
                        </Card>
                    )}
                </div>
            </div>

            <style jsx>{`
                .documents {
                    display: flex;
                    flex-direction: column;
                    min-height: 100vh;
                    background-color: #f5f5f5;
                }
                .content {
                    display: flex;
                    flex-direction: row;
                    flex-grow: 1;
                }
                .main-content {
                    flex-grow: 1;
                    padding: 20px;
                    background-color: #f5f5f5;
                }
            `}</style>
        </div>
    );
}

export default Documents; 