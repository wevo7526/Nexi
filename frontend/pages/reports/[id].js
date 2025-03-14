"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import { createClient } from '@supabase/supabase-js';
import { getStatusColor, formatDate } from '../../utils/reportUtils';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_KEY) {
    throw new Error('Missing Supabase environment variables');
}

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
            
            // Set up real-time subscription
            const subscription = supabase
                .channel('report_updates')
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'reports',
                        filter: `id=eq.${id}`
                    },
                    (payload) => {
                        console.log('Report updated:', payload);
                        setReport(prevReport => ({
                            ...prevReport,
                            ...payload.new
                        }));
                    }
                )
                .subscribe();

            // Cleanup subscription on unmount
            return () => {
                subscription.unsubscribe();
            };
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
            if (!data) throw new Error('Report not found');
            
            setReport(data);
        } catch (err) {
            console.error('Error fetching report:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRetry = () => {
        setLoading(true);
        setError(null);
        fetchReport();
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
            return;
        }

        try {
            const { error } = await supabase
                .from('reports')
                .delete()
                .eq('id', id);

            if (error) throw error;
            router.push('/reports');
        } catch (err) {
            console.error('Error deleting report:', err);
            alert('Failed to delete report. Please try again.');
        }
    };

    const renderContent = (content) => {
        if (!content) return null;

        return Object.entries(content).map(([section, data]) => {
            const sectionTitle = section.replace(/_/g, ' ');
            
            if (Array.isArray(data)) {
                return (
                    <div key={section} className="report-section">
                        <h3>{sectionTitle}</h3>
                        <ul className="section-list">
                            {data.map((item, index) => (
                                <li key={index}>{item}</li>
                            ))}
                        </ul>
                    </div>
                );
            }

            if (typeof data === 'object') {
                return (
                    <div key={section} className="report-section">
                        <h3>{sectionTitle}</h3>
                        <pre className="section-json">
                            {JSON.stringify(data, null, 2)}
                        </pre>
                    </div>
                );
            }

            return (
                <div key={section} className="report-section">
                    <h3>{sectionTitle}</h3>
                    <div className="section-content">{data}</div>
                </div>
            );
        });
    };

    if (loading) {
        return (
            <div className="report-view-page">
                <div className="navbar-container">
                    <Navbar />
                </div>
                <div className="content">
                    <Sidebar />
                    <div className="main-content">
                        <div className="loading">
                            <div className="loading-spinner"></div>
                            <p>Loading report...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="report-view-page">
                <div className="navbar-container">
                    <Navbar />
                </div>
                <div className="content">
                    <Sidebar />
                    <div className="main-content">
                        <div className="error-message">
                            <h2>Error</h2>
                            <p>{error}</p>
                            <button onClick={handleRetry} className="retry-button">
                                Retry
                            </button>
                            <button onClick={() => router.back()} className="back-button">
                                Back to Reports
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

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
                                <div className="header-actions">
                                    <button onClick={() => router.back()} className="back-button">
                                        Back to Reports
                                    </button>
                                    <button onClick={handleDelete} className="delete-button">
                                        Delete Report
                                    </button>
                                </div>
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
                                            <span>{formatDate(report.created_at)}</span>
                                        </div>
                                        {report.completed_at && (
                                            <div className="detail-item">
                                                <label>Completed</label>
                                                <span>{formatDate(report.completed_at)}</span>
                                            </div>
                                        )}
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
                                            {renderContent(report.content)}
                                        </div>
                                    </div>
                                )}

                                {report.error_message && (
                                    <div className="info-card error-card">
                                        <h2>Error Details</h2>
                                        <p className="error-message">{report.error_message}</p>
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

                .header-actions {
                    display: flex;
                    gap: 1rem;
                }

                .delete-button {
                    padding: 0.75rem 1.5rem;
                    background-color: #dc3545;
                    border: none;
                    border-radius: 8px;
                    color: white;
                    cursor: pointer;
                    font-size: 0.875rem;
                    font-weight: 500;
                    transition: background-color 0.2s ease;
                }

                .delete-button:hover {
                    background-color: #c82333;
                }

                .loading {
                    text-align: center;
                    padding: 4rem 2rem;
                    color: #666;
                }

                .loading-spinner {
                    border: 3px solid #f3f3f3;
                    border-top: 3px solid #0070f3;
                    border-radius: 50%;
                    width: 24px;
                    height: 24px;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 1rem;
                }

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                .section-list {
                    list-style-type: none;
                    padding: 0;
                    margin: 0;
                }

                .section-list li {
                    padding: 0.5rem 0;
                    border-bottom: 1px solid #f0f0f0;
                }

                .section-list li:last-child {
                    border-bottom: none;
                }

                .section-json {
                    background-color: #f8f9fa;
                    padding: 1rem;
                    border-radius: 8px;
                    font-family: monospace;
                    white-space: pre-wrap;
                    overflow-x: auto;
                }

                .error-card {
                    border: 1px solid #dc3545;
                }

                .error-card h2 {
                    color: #dc3545;
                }

                .retry-button {
                    padding: 0.75rem 1.5rem;
                    background-color: #0070f3;
                    border: none;
                    border-radius: 8px;
                    color: white;
                    cursor: pointer;
                    font-size: 0.875rem;
                    font-weight: 500;
                    transition: background-color 0.2s ease;
                    margin-right: 1rem;
                }

                .retry-button:hover {
                    background-color: #0060df;
                }

                @media (max-width: 768px) {
                    .header-actions {
                        flex-direction: column;
                        width: 100%;
                    }

                    .header-actions button {
                        width: 100%;
                    }

                    .section-json {
                        font-size: 0.875rem;
                    }
                }
            `}</style>
        </div>
    );
}

export default ReportView; 