"use client";
import React, { useState } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import { useTheme } from '@mui/material/styles';
import {
    CircularProgress, Box, Typography, Card, Grid, Button,
    TextField, useMediaQuery
} from "@mui/material";
import { Send } from "@mui/icons-material";
import { createClient } from '@supabase/supabase-js';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000';
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

function MultiAgentConsultant() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [query, setQuery] = useState("");
    const [clientInfo, setClientInfo] = useState("");
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const generateDocx = async (reportData) => {
        console.log("Report Data:", reportData);

        if (!reportData || !reportData.report_meta) {
            throw new Error("Invalid report data structure");
        }

        const doc = new Document({
            sections: [{
                properties: {
                    page: {
                        margin: {
                            top: 1440,
                            right: 1440,
                            bottom: 1440,
                            left: 1440,
                            header: 720,
                            footer: 720,
                            gutter: 0
                        }
                    }
                },
                children: [
                    // Header
                    new Paragraph({
                        heading: HeadingLevel.HEADING_1,
                        spacing: {
                            after: 400,
                            line: 360
                        },
                        children: [
                            new TextRun({
                                text: "CONSULTING REPORT",
                                size: 32,
                                font: "Calibri"
                            })
                        ]
                    }),
                    
                    // Report Info
                    new Paragraph({
                        spacing: { after: 200 },
                        children: [
                            new TextRun({
                                text: `Generated on: ${new Date(reportData.report_meta.generated_date).toLocaleDateString()}`
                            })
                        ]
                    }),
                    new Paragraph({
                        spacing: { after: 400 },
                        children: [
                            new TextRun({
                                text: `Client: ${reportData.report_meta.client}`
                            })
                        ]
                    }),

                    // Executive Summary
                    new Paragraph({
                        heading: HeadingLevel.HEADING_2,
                        spacing: { before: 400, after: 200 },
                        children: [
                            new TextRun({
                                text: "Executive Summary"
                            })
                        ]
                    }),
                    new Paragraph({
                        spacing: { after: 400 },
                        children: [
                            new TextRun({
                                text: "This report provides a comprehensive analysis and recommendations based on the client's requirements. The findings are organized into strategic analysis, market research, financial analysis, and implementation roadmap sections."
                            })
                        ]
                    }),

                    // Key Findings
                    new Paragraph({
                        heading: HeadingLevel.HEADING_3,
                        spacing: { before: 400, after: 200 },
                        children: [
                            new TextRun({
                                text: "Key Findings"
                            })
                        ]
                    }),
                    ...(reportData.executive_summary?.key_findings || []).map(finding =>
                        new Paragraph({
                            spacing: { after: 100 },
                            children: [
                                new TextRun({
                                    text: `• ${finding}`
                                })
                            ]
                        })
                    ),

                    // Strategic Analysis
                    new Paragraph({
                        heading: HeadingLevel.HEADING_2,
                        spacing: { before: 400, after: 200 },
                        children: [
                            new TextRun({
                                text: "Strategic Analysis"
                            })
                        ]
                    }),
                    ...Object.entries(reportData.strategic_analysis || {}).map(([key, value]) => [
                        new Paragraph({
                            heading: HeadingLevel.HEADING_3,
                            spacing: { before: 300, after: 200 },
                            children: [
                                new TextRun({
                                    text: key.split('_').map(word => 
                                        word.charAt(0).toUpperCase() + word.slice(1)
                                    ).join(' ')
                                })
                            ]
                        }),
                        ...(Array.isArray(value) 
                            ? value.map(item => new Paragraph({
                                spacing: { after: 100 },
                                children: [
                                    new TextRun({
                                        text: `• ${item}`
                                    })
                                ]
                            }))
                            : [new Paragraph({
                                spacing: { after: 200 },
                                children: [
                                    new TextRun({
                                        text: value
                                    })
                                ]
                            })]
                        )
                    ]).flat(),

                    // Market Analysis
                    new Paragraph({
                        heading: HeadingLevel.HEADING_2,
                        spacing: { before: 400, after: 200 },
                        children: [
                            new TextRun({
                                text: "Market Analysis"
                            })
                        ]
                    }),
                    ...Object.entries(reportData.market_analysis || {}).map(([key, value]) => [
                        new Paragraph({
                            heading: HeadingLevel.HEADING_3,
                            spacing: { before: 300, after: 200 },
                            children: [
                                new TextRun({
                                    text: key.split('_').map(word => 
                                        word.charAt(0).toUpperCase() + word.slice(1)
                                    ).join(' ')
                                })
                            ]
                        }),
                        ...(Array.isArray(value) 
                            ? value.map(item => new Paragraph({
                                spacing: { after: 100 },
                                children: [
                                    new TextRun({
                                        text: `• ${item}`
                                    })
                                ]
                            }))
                            : [new Paragraph({
                                spacing: { after: 200 },
                                children: [
                                    new TextRun({
                                        text: value
                                    })
                                ]
                            })]
                        )
                    ]).flat(),

                    // Financial Analysis
                    new Paragraph({
                        heading: HeadingLevel.HEADING_2,
                        spacing: { before: 400, after: 200 },
                        children: [
                            new TextRun({
                                text: "Financial Analysis"
                            })
                        ]
                    }),
                    ...Object.entries(reportData.financial_analysis || {}).map(([key, value]) => [
                        new Paragraph({
                            heading: HeadingLevel.HEADING_3,
                            spacing: { before: 300, after: 200 },
                            children: [
                                new TextRun({
                                    text: key.split('_').map(word => 
                                        word.charAt(0).toUpperCase() + word.slice(1)
                                    ).join(' ')
                                })
                            ]
                        }),
                        ...(Array.isArray(value) 
                            ? value.map(item => new Paragraph({
                                spacing: { after: 100 },
                                children: [
                                    new TextRun({
                                        text: `• ${item}`
                                    })
                                ]
                            }))
                            : [new Paragraph({
                                spacing: { after: 200 },
                                children: [
                                    new TextRun({
                                        text: value
                                    })
                                ]
                            })]
                        )
                    ]).flat(),

                    // Implementation Roadmap
                    new Paragraph({
                        heading: HeadingLevel.HEADING_2,
                        spacing: { before: 400, after: 200 },
                        children: [
                            new TextRun({
                                text: "Implementation Roadmap"
                            })
                        ]
                    }),
                    ...Object.entries(reportData.implementation_roadmap || {}).map(([key, value]) => [
                        new Paragraph({
                            heading: HeadingLevel.HEADING_3,
                            spacing: { before: 300, after: 200 },
                            children: [
                                new TextRun({
                                    text: key.split('_').map(word => 
                                        word.charAt(0).toUpperCase() + word.slice(1)
                                    ).join(' ')
                                })
                            ]
                        }),
                        ...(Array.isArray(value) 
                            ? value.map(item => new Paragraph({
                                spacing: { after: 100 },
                                children: [
                                    new TextRun({
                                        text: `• ${item}`
                                    })
                                ]
                            }))
                            : [new Paragraph({
                                spacing: { after: 200 },
                                children: [
                                    new TextRun({
                                        text: value
                                    })
                                ]
                            })]
                        )
                    ]).flat(),

                    // Appendix
                    new Paragraph({
                        heading: HeadingLevel.HEADING_2,
                        spacing: { before: 400, after: 200 },
                        children: [
                            new TextRun({
                                text: "Appendix"
                            })
                        ]
                    }),
                    new Paragraph({
                        heading: HeadingLevel.HEADING_3,
                        spacing: { before: 300, after: 200 },
                        children: [
                            new TextRun({
                                text: "Methodology"
                            })
                        ]
                    }),
                    ...(reportData.appendix?.methodology || []).map(item =>
                        new Paragraph({
                            spacing: { after: 100 },
                            children: [
                                new TextRun({
                                    text: `• ${item}`
                                })
                            ]
                        })
                    ),
                    new Paragraph({
                        heading: HeadingLevel.HEADING_3,
                        spacing: { before: 300, after: 200 },
                        children: [
                            new TextRun({
                                text: "Data Sources"
                            })
                        ]
                    }),
                    ...(reportData.appendix?.data_sources || []).map(source =>
                        new Paragraph({
                            spacing: { after: 100 },
                            children: [
                                new TextRun({
                                    text: `• ${source}`
                                })
                            ]
                        })
                    ),

                    // Footer
                    new Paragraph({
                        spacing: { before: 800 },
                        children: [
                            new TextRun({
                                text: "Confidential - For Internal Use Only",
                                color: "666666",
                                size: 20
                            })
                        ]
                    })
                ],
            }],
        });

        const blob = await Packer.toBlob(doc);
        return blob;
    };

    const saveReportToSupabase = async (reportData, docxBlob) => {
        const fileName = `report_${Date.now()}.docx`;
        
        try {
            // Upload DOCX file to Supabase Storage
            const { data, error } = await supabase.storage
                .from('reports')
                .upload(fileName, docxBlob, {
                    contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) {
                console.error('Upload error:', error);
                throw new Error(`Failed to upload report: ${error.message}`);
            }

            // Get the public URL
            const { data: { publicUrl } } = supabase.storage
                .from('reports')
                .getPublicUrl(fileName);

            console.log('File uploaded successfully:', publicUrl);
            return fileName;
        } catch (error) {
            console.error('Error in saveReportToSupabase:', error);
            throw error;
        }
    };

    const handleGenerateReport = async (e) => {
        if (e) e.preventDefault();
        if (loading || !query.trim()) return;

        setLoading(true);
        setError(null);
        
        try {
            const response = await axios.post(`${API_BASE_URL}/get_multi_agent_answer`, {
                query: query.trim(),
                client_info: clientInfo.trim(),
                thread_id: `report_${Date.now()}`,
                chat_history: []
            });
            
            if (response.data.error) {
                throw new Error(response.data.error);
            }
            
            if (!response.data.answer) {
                throw new Error("No response received from the server");
            }
            
            const reportData = {
                report_meta: {
                    generated_date: new Date().toISOString(),
                    client: clientInfo || "Confidential",
                    version: "1.0"
                },
                ...response.data.answer
            };

            setReport(reportData);

            // Generate DOCX report
            const docxBlob = await generateDocx(reportData);

            // Save to Supabase Storage
            const fileName = await saveReportToSupabase(reportData, docxBlob);

            // Download report
            const url = window.URL.createObjectURL(docxBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

        } catch (error) {
            console.error("Error:", error);
            setError(error.response?.data?.error || error.message || "Failed to generate report");
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleGenerateReport();
        }
    };

    return (
        <div className="multi-agent-consultant">
            <div className="content">
                <Sidebar />
                <div className="main-content">
                    <Card sx={{ mb: 3, p: 3 }}>
                        <Typography variant="h5" gutterBottom>
                            Generate Comprehensive Consulting Report
                        </Typography>
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={3}
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Enter your business query or challenge..."
                                    variant="outlined"
                                    disabled={loading}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    value={clientInfo}
                                    onChange={(e) => setClientInfo(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Client Information (Optional)"
                                    variant="outlined"
                                    disabled={loading}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Button
                                    variant="contained"
                                    onClick={handleGenerateReport}
                                    disabled={loading || !query.trim()}
                                    startIcon={loading ? <CircularProgress size={20} /> : <Send />}
                                >
                                    {loading ? 'Generating Report...' : 'Generate Report'}
                                </Button>
                            </Grid>
                        </Grid>
                    </Card>

                    {error && (
                        <Card sx={{ mb: 3, p: 2, bgcolor: 'error.light' }}>
                            <Typography color="error">{error}</Typography>
                        </Card>
                    )}

                    {report && (
                        <Card sx={{ mb: 3, p: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                Report Generated Successfully
                            </Typography>
                            <Typography variant="body1" color="textSecondary">
                                Your report has been generated and saved. You can find it in the Reports section.
                            </Typography>
                        </Card>
                    )}
                </div>
            </div>

            <style jsx>{`
                .multi-agent-consultant {
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

export default MultiAgentConsultant;