"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { createClient } from '@supabase/supabase-js';
import { getStatusColor, formatDate, REPORT_STATUSES } from '../utils/reportUtils';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_KEY) {
    throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_KEY
);

function Reports() {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        status: 'all',
        type: 'all',
        client: 'all'
    });
    const [clients, setClients] = useState([]);
    const [reportTypes, setReportTypes] = useState([]);
    const router = useRouter();

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                await Promise.all([fetchReports(), fetchClients()]);
            } catch (err) {
                console.error('Error loading initial data:', err);
                setError('Failed to load reports data. Please try refreshing the page.');
            }
        };

        loadInitialData();

        // Set up real-time subscription for report updates
        const subscription = supabase
            .channel('report_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'reports'
                },
                (payload) => {
                    console.log('Report change detected:', payload);
                    fetchReports(); // Refresh reports when changes occur
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const fetchClients = async () => {
        try {
            const { data, error } = await supabase
                .from('clients')
                .select('id, name')
                .order('name');
            
            if (error) throw error;
            setClients(data || []);
        } catch (err) {
            console.error('Error fetching clients:', err);
            throw err;
        }
    };

    const fetchReports = async () => {
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
                .order('created_at', { ascending: false });

            if (error) throw error;
            setReports(data || []);
            
            // Extract unique report types
            const types = [...new Set(data?.map(report => report.report_type).filter(Boolean))];
            setReportTypes(types);
        } catch (err) {
            console.error('Error fetching reports:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const filteredReports = reports
        .filter(report => {
            if (!report) return false;

            const matchesSearch = searchTerm === '' || [
                report.title,
                report.description,
                report.clients?.name
            ].some(field => 
                field?.toLowerCase().includes(searchTerm.toLowerCase())
            );

            const matchesStatus = filters.status === 'all' || report.status === filters.status;
            const matchesType = filters.type === 'all' || report.report_type === filters.type;
            const matchesClient = filters.client === 'all' || report.client_id === filters.client;

            return matchesSearch && matchesStatus && matchesType && matchesClient;
        });

    const handleCreateReport = () => {
        router.push('/create-report');
    };

    const handleViewReport = (reportId) => {
        router.push(`/reports/${reportId}`);
    };

    if (error) {
        return (
            <div className="reports-page">
                <div className="navbar-container">
                    <Navbar />
                </div>
                <div className="content">
                    <Sidebar />
                    <div className="main-content">
                        <div className="error-message">
                            <h2>Error</h2>
                            <p>{error}</p>
                            <button 
                                onClick={() => window.location.reload()} 
                                className="retry-button"
                            >
                                Retry
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

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

                    <div className="filters-section">
                        <div className="search-box">
                            <input
                                type="text"
                                placeholder="Search reports..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="search-input"
                            />
                        </div>

                        <div className="filters">
                            <select
                                value={filters.status}
                                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                                className="filter-select"
                            >
                                <option value="all">All Status</option>
                                <option value={REPORT_STATUSES.COMPLETED}>Completed</option>
                                <option value={REPORT_STATUSES.IN_PROGRESS}>In Progress</option>
                                <option value={REPORT_STATUSES.FAILED}>Failed</option>
                            </select>

                            <select
                                value={filters.type}
                                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                                className="filter-select"
                            >
                                <option value="all">All Types</option>
                                {reportTypes.map(type => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>

                            <select
                                value={filters.client}
                                onChange={(e) => setFilters(prev => ({ ...prev, client: e.target.value }))}
                                className="filter-select"
                            >
                                <option value="all">All Clients</option>
                                {clients.map(client => (
                                    <option key={client.id} value={client.id}>{client.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {loading ? (
                        <div className="loading">
                            <div className="loading-spinner"></div>
                            <p>Loading reports...</p>
                        </div>
                    ) : filteredReports.length === 0 ? (
                        <div className="empty-state">
                            <p>No reports found matching your criteria.</p>
                            {searchTerm || filters.status !== 'all' || filters.type !== 'all' || filters.client !== 'all' ? (
                                <button 
                                    onClick={() => {
                                        setSearchTerm('');
                                        setFilters({
                                            status: 'all',
                                            type: 'all',
                                            client: 'all'
                                        });
                                    }}
                                    className="clear-filters-button"
                                >
                                    Clear Filters
                                </button>
                            ) : (
                                <button onClick={handleCreateReport} className="create-button">
                                    Create Your First Report
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="reports-grid">
                            {filteredReports.map(report => (
                                <div 
                                    key={report.id} 
                                    className="report-card"
                                    onClick={() => handleViewReport(report.id)}
                                >
                                    <div className="report-header">
                                        <h3>{report.title}</h3>
                                        <div 
                                            className="status-badge"
                                            style={{ backgroundColor: getStatusColor(report.status) }}
                                        >
                                            {report.status}
                                        </div>
                                    </div>
                                    <p className="client-name">{report.clients?.name}</p>
                                    <p className="description">{report.description}</p>
                                    <div className="report-footer">
                                        <span className="report-type">{report.report_type}</span>
                                        <span className="created-at">
                                            {formatDate(report.created_at)}
                                        </span>
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

                h1 {
                    color: #1a1a1a;
                    font-size: 2rem;
                    font-weight: 600;
                    margin: 0;
                }

                .create-button {
                    padding: 0.75rem 1.5rem;
                    background-color: #0070f3;
                    border: none;
                    border-radius: 8px;
                    color: white;
                    cursor: pointer;
                    font-size: 0.875rem;
                    font-weight: 500;
                    transition: background-color 0.2s ease;
                }

                .create-button:hover {
                    background-color: #0060df;
                }

                .filters-section {
                    background: white;
                    border-radius: 12px;
                    padding: 1.5rem;
                    margin-bottom: 2rem;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
                }

                .search-box {
                    margin-bottom: 1rem;
                }

                .search-input {
                    width: 100%;
                    padding: 0.75rem 1rem;
                    border: 1.5px solid #e1e1e1;
                    border-radius: 8px;
                    font-size: 0.875rem;
                    transition: border-color 0.2s ease;
                }

                .search-input:focus {
                    outline: none;
                    border-color: #0070f3;
                }

                .filters {
                    display: flex;
                    gap: 1rem;
                }

                .filter-select {
                    padding: 0.75rem 1rem;
                    border: 1.5px solid #e1e1e1;
                    border-radius: 8px;
                    font-size: 0.875rem;
                    background-color: white;
                    cursor: pointer;
                    min-width: 150px;
                }

                .filter-select:focus {
                    outline: none;
                    border-color: #0070f3;
                }

                .reports-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    gap: 1.5rem;
                }

                .report-card {
                    background: white;
                    border-radius: 12px;
                    padding: 1.5rem;
                    cursor: pointer;
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
                }

                .report-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                }

                .report-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    gap: 1rem;
                    margin-bottom: 0.5rem;
                }

                .report-header h3 {
                    color: #1a1a1a;
                    font-size: 1.125rem;
                    font-weight: 600;
                    margin: 0;
                }

                .status-badge {
                    padding: 0.25rem 0.75rem;
                    border-radius: 20px;
                    color: white;
                    font-size: 0.75rem;
                    font-weight: 500;
                    text-transform: capitalize;
                }

                .client-name {
                    color: #666;
                    font-size: 0.875rem;
                    margin: 0 0 0.5rem 0;
                }

                .description {
                    color: #444;
                    font-size: 0.875rem;
                    margin: 0 0 1rem 0;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }

                .report-footer {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-size: 0.75rem;
                    color: #666;
                }

                .report-type {
                    background-color: #f0f2f5;
                    padding: 0.25rem 0.75rem;
                    border-radius: 20px;
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

                .empty-state {
                    text-align: center;
                    padding: 4rem 2rem;
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
                }

                .empty-state p {
                    color: #666;
                    margin-bottom: 1.5rem;
                }

                .clear-filters-button {
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

                .clear-filters-button:hover {
                    background-color: #f5f5f5;
                    border-color: #d1d1d1;
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
                    margin-top: 1rem;
                }

                .retry-button:hover {
                    background-color: #0060df;
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

                    .filters {
                        flex-direction: column;
                    }

                    .filter-select {
                        width: 100%;
                    }
                }
            `}</style>
        </div>
    );
}

export default Reports; 