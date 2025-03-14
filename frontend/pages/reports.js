"use client";
import React, { useState, useEffect } from "react";
import {
    CircularProgress, Box, Typography, Card, Grid, Button,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, IconButton, Dialog, DialogTitle, DialogContent,
    DialogActions, useMediaQuery
} from "@mui/material";
import { useTheme } from '@mui/material/styles';
import { Visibility, Delete, Download } from "@mui/icons-material";
import Sidebar from "../components/Sidebar";
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

function Reports() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedReport, setSelectedReport] = useState(null);
    const [previewOpen, setPreviewOpen] = useState(false);

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            // First, get the list of files from the bucket
            const { data, error } = await supabase.storage
                .from('reports')
                .list();

            if (error) {
                console.error('Error listing reports:', error);
                throw new Error(`Failed to list reports: ${error.message}`);
            }

            // Transform the data to include metadata
            const reportsList = (data || []).map(file => {
                const timestampMatch = file.name.match(/\d+/);
                const timestamp = timestampMatch ? parseInt(timestampMatch[0]) : Date.now();
                
                return {
                    id: file.name,
                    title: file.name.replace(/^report_(\d+)\.docx$/, 'Report $1'),
                    client: "Confidential",
                    generated_date: new Date(timestamp).toISOString(),
                    file_path: file.name,
                    public_url: supabase.storage
                        .from('reports')
                        .getPublicUrl(file.name)
                        .data.publicUrl
                };
            });

            setReports(reportsList);
        } catch (error) {
            console.error('Error fetching reports:', error);
            setError(error.message || 'Failed to load reports');
            setReports([]); // Set empty array on error
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (report) => {
        if (!confirm('Are you sure you want to delete this report?')) return;

        try {
            const { error } = await supabase.storage
                .from('reports')
                .remove([report.file_path]);

            if (error) {
                console.error('Error deleting report:', error);
                throw new Error(`Failed to delete report: ${error.message}`);
            }

            // Update local state
            setReports(reports.filter(r => r.id !== report.id));
        } catch (error) {
            console.error('Error deleting report:', error);
            setError(error.message || 'Failed to delete report');
        }
    };

    const handlePreview = async (report) => {
        try {
            // For DOCX files, we'll just show metadata since we can't preview DOCX directly
            setSelectedReport(report);
            setPreviewOpen(true);
        } catch (error) {
            console.error('Error loading report preview:', error);
            setError('Failed to load report preview');
        }
    };

    const handleDownload = async (report) => {
        try {
            const { data, error } = await supabase.storage
                .from('reports')
                .download(report.file_path);

            if (error) {
                console.error('Download error:', error);
                throw new Error(`Failed to download report: ${error.message}`);
            }

            const url = window.URL.createObjectURL(data);
            const a = document.createElement('a');
            a.href = url;
            a.download = report.file_path;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Error downloading report:', error);
            setError(error.message || 'Failed to download report');
        }
    };

    if (loading) {
        return (
            <div className="reports">
                <div className="content">
                    <Sidebar />
                    <div className="main-content">
                        <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                            <CircularProgress />
                        </Box>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="reports">
            <div className="content">
                <Sidebar />
                <div className="main-content">
                    <Card sx={{ mb: 3, p: 3 }}>
                        <Typography variant="h5" gutterBottom>
                            Saved Reports
                        </Typography>
                        {error && (
                            <Typography color="error" gutterBottom>
                                {error}
                            </Typography>
                        )}
                        {reports.length === 0 ? (
                            <Typography color="textSecondary">
                                No reports found. Generate a report in the Multi-Agent Consultant page.
                            </Typography>
                        ) : (
                            <TableContainer component={Paper}>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Title</TableCell>
                                            <TableCell>Client</TableCell>
                                            <TableCell>Generated Date</TableCell>
                                            <TableCell align="right">Actions</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {reports.map((report) => (
                                            <TableRow key={report.id}>
                                                <TableCell>{report.title}</TableCell>
                                                <TableCell>{report.client}</TableCell>
                                                <TableCell>
                                                    {new Date(report.generated_date).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell align="right">
                                                    <IconButton
                                                        onClick={() => handlePreview(report)}
                                                        color="primary"
                                                    >
                                                        <Visibility />
                                                    </IconButton>
                                                    <IconButton
                                                        onClick={() => handleDownload(report)}
                                                        color="primary"
                                                    >
                                                        <Download />
                                                    </IconButton>
                                                    <IconButton
                                                        onClick={() => handleDelete(report)}
                                                        color="error"
                                                    >
                                                        <Delete />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </Card>
                </div>
            </div>

            <Dialog
                open={previewOpen}
                onClose={() => setPreviewOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    Report Preview
                </DialogTitle>
                <DialogContent>
                    {selectedReport && (
                        <div>
                            <Typography variant="h6" gutterBottom>
                                {selectedReport.title}
                            </Typography>
                            <Typography color="textSecondary" gutterBottom>
                                Client: {selectedReport.client}
                            </Typography>
                            <Typography color="textSecondary" gutterBottom>
                                Generated: {new Date(selectedReport.generated_date).toLocaleDateString()}
                            </Typography>
                            <Box mt={2}>
                                <Typography>
                                    This is a DOCX file. Please download it to view the full content.
                                </Typography>
                            </Box>
                        </div>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setPreviewOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>

            <style jsx>{`
                .reports {
                    display: flex;
                    flex-direction: column;
                    min-height: 100vh;
                    background-color: var(--background);
                }
                .content {
                    display: flex;
                    flex-direction: row;
                    flex-grow: 1;
                }
                .main-content {
                    flex-grow: 1;
                    padding: ${theme.spacing(3)};
                    background-color: ${theme.palette.background.default};
                }
            `}</style>
        </div>
    );
}

export default Reports; 