"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client (you'll need to add your env variables)
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_KEY
);

function Reports() {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const router = useRouter();

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            const { data, error } = await supabase
                .from('reports')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setReports(data || []);
        } catch (err) {
            console.error('Error fetching reports:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateReport = () => {
        router.push('/create-report');
    };

    const handleViewReport = (reportId) => {
        router.push(`/reports/${reportId}`);
    };

    return (
        <div className="reports-page">
            <div className="navbar-container">
                <Navbar />
            </div>
            <div className="content">
                <Sidebar />
                <div className="main-content">
                    <div className="header">
                        <h1>Reports</h1>
                        <button onClick={handleCreateReport} className="create-button">
                            Create New Report
                        </button>
                    </div>

                    {loading ? (
                        <p>Loading reports...</p>
                    ) : error ? (
                        <p className="error-message">{error}</p>
                    ) : (
                        <div className="reports-grid">
                            {reports.map((report) => (
                                <div key={report.id} className="report-card" onClick={() => handleViewReport(report.id)}>
                                    <h3>{report.title}</h3>
                                    <p className="report-description">{report.description}</p>
                                    <div className="report-meta">
                                        <span>Client: {report.client_name}</span>
                                        <span>Created: {new Date(report.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <div className="report-status" data-status={report.status}>
                                        {report.status}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
                .reports-page {
                    display: flex;
                    flex-direction: column;
                    min-height: 100vh;
                }

                .content {
                    display: flex;
                    flex-grow: 1;
                }

                .main-content {
                    flex-grow: 1;
                    padding: 2rem;
                }

                .header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 2rem;
                }

                .create-button {
                    padding: 0.75rem 1.5rem;
                    background-color: #0070f3;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 1rem;
                    transition: background-color 0.2s;
                }

                .create-button:hover {
                    background-color: #0051cc;
                }

                .reports-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    gap: 1.5rem;
                }

                .report-card {
                    background: white;
                    border-radius: 8px;
                    padding: 1.5rem;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                    cursor: pointer;
                    transition: transform 0.2s, box-shadow 0.2s;
                }

                .report-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                }

                .report-description {
                    color: #666;
                    margin: 0.5rem 0;
                    font-size: 0.9rem;
                }

                .report-meta {
                    display: flex;
                    justify-content: space-between;
                    font-size: 0.8rem;
                    color: #888;
                    margin-top: 1rem;
                }

                .report-status {
                    display: inline-block;
                    padding: 0.25rem 0.5rem;
                    border-radius: 4px;
                    font-size: 0.8rem;
                    margin-top: 0.5rem;
                }

                .report-status[data-status="draft"] {
                    background-color: #f0f0f0;
                    color: #666;
                }

                .report-status[data-status="in_progress"] {
                    background-color: #fff8e6;
                    color: #b58a0e;
                }

                .report-status[data-status="completed"] {
                    background-color: #e6ffe6;
                    color: #0e8a0e;
                }

                .error-message {
                    color: #dc3545;
                    padding: 1rem;
                    background-color: #ffe6e6;
                    border-radius: 4px;
                }
            `}</style>
        </div>
    );
}

export default Reports; 