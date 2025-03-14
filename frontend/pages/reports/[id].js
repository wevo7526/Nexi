"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_KEY
);

function ReportView() {
    const router = useRouter();
    const { id } = router.query;
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (id) {
            fetchReport();
        }
    }, [id]);

    const fetchReport = async () => {
        try {
            const { data, error } = await supabase
                .from('reports')
                .select(`
                    *,
                    clients (
                        name,
                        industry
                    )
                `)
                .eq('id', id)
                .single();

            if (error) throw error;
            setReport(data);
        } catch (err) {
            console.error('Error fetching report:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed':
                return '#0e8a0e';
            case 'in_progress':
                return '#b58a0e';
            case 'failed':
                return '#dc3545';
            default:
                return '#666';
        }
    };

    if (loading) return (
        <div className="report-view-page">
            <div className="navbar-container">
                <Navbar />
            </div>
            <div className="content">
                <Sidebar />
                <div className="main-content">
                    <div className="loading">Loading report...</div>
                </div>
            </div>
        </div>
    );

    if (error) return (
        <div className="report-view-page">
            <div className="navbar-container">
                <Navbar />
            </div>
            <div className="content">
                <Sidebar />
                <div className="main-content">
                    <div className="error-message">{error}</div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="report-view-page">
            <div className="navbar-container">
                <Navbar />
            </div>
            <div className="content">
                <Sidebar />
                <div className="main-content">
                    {report && (
                        <>
                            <div className="header">
                                <div className="title-section">
                                    <h1>{report.title}</h1>
                                    <div 
                                        className="status-badge"
                                        style={{ backgroundColor: getStatusColor(report.status) }}
                                    >
                                        {report.status}
                                    </div>
                                </div>
                                <button onClick={() => router.back()} className="back-button">
                                    Back to Reports
                                </button>
                            </div>

                            <div className="report-content">
                                <div className="info-card">
                                    <h2>Report Details</h2>
                                    <div className="details-grid">
                                        <div className="detail-item">
                                            <label>Client</label>
                                            <span>{report.clients?.name}</span>
                                        </div>
                                        <div className="detail-item">
                                            <label>Industry</label>
                                            <span>{report.clients?.industry}</span>
                                        </div>
                                        <div className="detail-item">
                                            <label>Report Type</label>
                                            <span>{report.report_type}</span>
                                        </div>
                                        <div className="detail-item">
                                            <label>Created</label>
                                            <span>{new Date(report.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="info-card">
                                    <h2>Description</h2>
                                    <p>{report.description}</p>
                                </div>

                                {report.focus_areas && report.focus_areas.length > 0 && (
                                    <div className="info-card">
                                        <h2>Focus Areas</h2>
                                        <div className="focus-areas">
                                            {report.focus_areas.map((area, index) => (
                                                <span key={index} className="focus-area-tag">
                                                    {area}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {report.content && (
                                    <div className="info-card">
                                        <h2>Report Content</h2>
                                        <div className="report-sections">
                                            {Object.entries(report.content).map(([section, content]) => (
                                                <div key={section} className="report-section">
                                                    <h3>{section.replace(/_/g, ' ')}</h3>
                                                    <div className="section-content">
                                                        {typeof content === 'string' 
                                                            ? content
                                                            : JSON.stringify(content, null, 2)}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

            <style jsx>{`
                .report-view-page {
                    display: flex;
                    flex-direction: column;
                    min-height: 100vh;
                    background-color: #f5f7fb;
                }

                .navbar-container {
                    position: sticky;
                    top: 0;
                    left: 0;
                    right: 0;
                    z-index: 100;
                    background-color: white;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
                    margin-left: 250px;
                }

                .content {
                    display: flex;
                    flex-grow: 1;
                    padding-top: 1rem;
                }

                .main-content {
                    flex-grow: 1;
                    padding: 2rem 3rem;
                    margin-left: 250px;
                    max-width: calc(100vw - 250px);
                    overflow-x: hidden;
                }

                .header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 2rem;
                }

                .title-section {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }

                h1 {
                    color: #1a1a1a;
                    font-size: 2rem;
                    font-weight: 600;
                    margin: 0;
                }

                .status-badge {
                    padding: 0.5rem 1rem;
                    border-radius: 20px;
                    color: white;
                    font-size: 0.875rem;
                    font-weight: 500;
                    text-transform: capitalize;
                }

                .back-button {
                    padding: 0.75rem 1.5rem;
                    background-color: white;
                    border: 1.5px solid #e1e1e1;
                    border-radius: 8px;
                    color: #666;
                    cursor: pointer;
                    font-size: 0.875rem;
                    font-weight: 500;
                    transition: all 0.2s ease;
                }

                .back-button:hover {
                    background-color: #f5f5f5;
                    border-color: #d1d1d1;
                }

                .report-content {
                    display: grid;
                    gap: 1.5rem;
                }

                .info-card {
                    background: white;
                    border-radius: 12px;
                    padding: 1.5rem;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
                }

                .info-card h2 {
                    color: #1a1a1a;
                    font-size: 1.25rem;
                    font-weight: 600;
                    margin: 0 0 1rem 0;
                }

                .details-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 1.5rem;
                }

                .detail-item {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }

                .detail-item label {
                    color: #666;
                    font-size: 0.875rem;
                }

                .detail-item span {
                    color: #1a1a1a;
                    font-size: 1rem;
                    font-weight: 500;
                }

                .focus-areas {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.5rem;
                }

                .focus-area-tag {
                    background-color: #f0f2f5;
                    padding: 0.5rem 1rem;
                    border-radius: 20px;
                    color: #1a1a1a;
                    font-size: 0.875rem;
                }

                .report-sections {
                    display: grid;
                    gap: 2rem;
                }

                .report-section h3 {
                    color: #1a1a1a;
                    font-size: 1.125rem;
                    font-weight: 600;
                    margin: 0 0 1rem 0;
                    text-transform: capitalize;
                }

                .section-content {
                    color: #444;
                    line-height: 1.6;
                    white-space: pre-wrap;
                }

                .loading {
                    text-align: center;
                    padding: 2rem;
                    color: #666;
                }

                .error-message {
                    background-color: #ffe6e6;
                    color: #dc3545;
                    padding: 1rem;
                    border-radius: 8px;
                    margin: 1rem 0;
                }

                @media (max-width: 768px) {
                    .navbar-container,
                    .main-content {
                        margin-left: 0;
                    }

                    .main-content {
                        padding: 1.5rem;
                        max-width: 100vw;
                    }

                    .header {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 1rem;
                    }

                    .back-button {
                        width: 100%;
                    }

                    .details-grid {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
        </div>
    );
}

export default ReportView; 