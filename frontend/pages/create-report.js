"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_KEY
);

function CreateReport() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [clients, setClients] = useState([]);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        client_id: '',
        report_type: 'comprehensive', // or 'quick', 'focused'
        focus_areas: [],
        additional_instructions: '',
        attachments: []
    });

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async () => {
        try {
            const { data, error } = await supabase
                .from('clients')
                .select('*');
            if (error) throw error;
            setClients(data || []);
        } catch (err) {
            console.error('Error fetching clients:', err);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFocusAreaChange = (area) => {
        setFormData(prev => ({
            ...prev,
            focus_areas: prev.focus_areas.includes(area)
                ? prev.focus_areas.filter(a => a !== area)
                : [...prev.focus_areas, area]
        }));
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        setFormData(prev => ({
            ...prev,
            attachments: [...prev.attachments, ...files]
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // First, create the report record
            const { data: report, error: reportError } = await supabase
                .from('reports')
                .insert([{
                    title: formData.title,
                    description: formData.description,
                    client_id: formData.client_id,
                    report_type: formData.report_type,
                    focus_areas: formData.focus_areas,
                    status: 'in_progress',
                    additional_instructions: formData.additional_instructions
                }])
                .select()
                .single();

            if (reportError) throw reportError;

            // Upload attachments to Supabase storage
            const attachmentPromises = formData.attachments.map(async (file) => {
                const filename = `${report.id}/${file.name}`;
                const { error: uploadError } = await supabase.storage
                    .from('reports')
                    .upload(filename, file);
                
                if (uploadError) throw uploadError;
                return filename;
            });

            await Promise.all(attachmentPromises);

            // Trigger report generation using Flask backend
            const response = await fetch('http://127.0.0.1:5000/api/reports/generate-report', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    reportId: report.id,
                    ...formData
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to initiate report generation');
            }

            router.push('/reports');
        } catch (err) {
            console.error('Error creating report:', err);
            alert('Failed to create report. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const focusAreas = [
        'Financial Analysis',
        'Market Research',
        'Competitive Analysis',
        'Risk Assessment',
        'Growth Strategy',
        'Cost Optimization',
        'Technology Assessment',
        'Operational Efficiency'
    ];

    return (
        <div className="create-report-page">
            <div className="navbar-container">
                <Navbar />
            </div>
            <div className="content">
                <Sidebar />
                <div className="main-content">
                    <h1>Create New Report</h1>
                    <form onSubmit={handleSubmit} className="report-form">
                        <div className="form-group">
                            <label htmlFor="title">Report Title</label>
                            <input
                                type="text"
                                id="title"
                                name="title"
                                value={formData.title}
                                onChange={handleInputChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="description">Description</label>
                            <textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="client_id">Client</label>
                            <select
                                id="client_id"
                                name="client_id"
                                value={formData.client_id}
                                onChange={handleInputChange}
                                required
                            >
                                <option value="">Select a client</option>
                                {clients.map(client => (
                                    <option key={client.id} value={client.id}>
                                        {client.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="report_type">Report Type</label>
                            <select
                                id="report_type"
                                name="report_type"
                                value={formData.report_type}
                                onChange={handleInputChange}
                                required
                            >
                                <option value="quick">Quick Analysis</option>
                                <option value="focused">Focused Analysis</option>
                                <option value="comprehensive">Comprehensive Analysis</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Focus Areas</label>
                            <div className="focus-areas-grid">
                                {focusAreas.map(area => (
                                    <label key={area} className="focus-area-item">
                                        <input
                                            type="checkbox"
                                            checked={formData.focus_areas.includes(area)}
                                            onChange={() => handleFocusAreaChange(area)}
                                        />
                                        {area}
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="additional_instructions">Additional Instructions</label>
                            <textarea
                                id="additional_instructions"
                                name="additional_instructions"
                                value={formData.additional_instructions}
                                onChange={handleInputChange}
                                placeholder="Any specific requirements or focus points..."
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="attachments">Attachments</label>
                            <input
                                type="file"
                                id="attachments"
                                multiple
                                onChange={handleFileChange}
                                className="file-input"
                            />
                            <div className="selected-files">
                                {formData.attachments.map((file, index) => (
                                    <div key={index} className="file-item">
                                        {file.name}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="form-actions">
                            <button type="button" onClick={() => router.back()} className="cancel-button">
                                Cancel
                            </button>
                            <button type="submit" className="submit-button" disabled={loading}>
                                {loading ? 'Creating Report...' : 'Create Report'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <style jsx>{`
                .create-report-page {
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
                    margin-left: 250px; /* Match sidebar width */
                }

                .content {
                    display: flex;
                    flex-grow: 1;
                    padding-top: 1rem;
                    position: relative;
                }

                .main-content {
                    flex-grow: 1;
                    padding: 2rem 3rem;
                    margin-left: 250px; /* Match your sidebar width */
                    max-width: calc(100vw - 250px);
                    overflow-x: hidden;
                }

                h1 {
                    color: #1a1a1a;
                    font-size: 2rem;
                    font-weight: 600;
                    margin-bottom: 2rem;
                }

                .report-form {
                    max-width: 900px;
                    margin: 0 auto;
                    background: white;
                    padding: 2.5rem;
                    border-radius: 12px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
                }

                .form-group {
                    margin-bottom: 2rem;
                }

                label {
                    display: block;
                    margin-bottom: 0.75rem;
                    font-weight: 500;
                    color: #333;
                    font-size: 0.95rem;
                }

                input[type="text"],
                textarea,
                select {
                    width: 100%;
                    padding: 0.875rem;
                    border: 1.5px solid #e1e1e1;
                    border-radius: 8px;
                    font-size: 1rem;
                    transition: all 0.2s ease;
                    background-color: #ffffff;
                }

                input[type="text"]:focus,
                textarea:focus,
                select:focus {
                    outline: none;
                    border-color: #0070f3;
                    box-shadow: 0 0 0 3px rgba(0, 112, 243, 0.1);
                }

                textarea {
                    min-height: 120px;
                    resize: vertical;
                }

                .focus-areas-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
                    gap: 1.25rem;
                    margin-top: 0.75rem;
                    padding: 0.5rem;
                }

                .focus-area-item {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.75rem;
                    background-color: #f8f9fa;
                    border-radius: 8px;
                    transition: all 0.2s ease;
                }

                .focus-area-item:hover {
                    background-color: #f0f2f5;
                }

                .focus-area-item input[type="checkbox"] {
                    width: 18px;
                    height: 18px;
                    border-radius: 4px;
                    cursor: pointer;
                }

                .file-input {
                    margin-top: 0.75rem;
                    width: 100%;
                    padding: 1rem;
                    border: 2px dashed #e1e1e1;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .file-input:hover {
                    border-color: #0070f3;
                }

                .selected-files {
                    margin-top: 1.25rem;
                    display: grid;
                    gap: 0.75rem;
                }

                .file-item {
                    background: #f8f9fa;
                    padding: 0.75rem 1rem;
                    border-radius: 6px;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.9rem;
                    color: #444;
                }

                .form-actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 1rem;
                    margin-top: 3rem;
                    padding-top: 2rem;
                    border-top: 1px solid #eee;
                }

                .submit-button,
                .cancel-button {
                    padding: 0.875rem 2rem;
                    border-radius: 8px;
                    font-size: 1rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .submit-button {
                    background-color: #0070f3;
                    color: white;
                    border: none;
                }

                .submit-button:hover {
                    background-color: #0051cc;
                    transform: translateY(-1px);
                }

                .submit-button:disabled {
                    background-color: #a3a3a3;
                    cursor: not-allowed;
                    transform: none;
                }

                .cancel-button {
                    background-color: white;
                    border: 1.5px solid #e1e1e1;
                    color: #666;
                }

                .cancel-button:hover {
                    background-color: #f5f5f5;
                    border-color: #d1d1d1;
                }

                @media (max-width: 768px) {
                    .navbar-container {
                        margin-left: 0;
                    }
                    
                    .main-content {
                        margin-left: 0;
                        padding: 1.5rem;
                        max-width: 100vw;
                    }

                    .report-form {
                        padding: 1.5rem;
                    }

                    .focus-areas-grid {
                        grid-template-columns: 1fr;
                    }

                    .form-actions {
                        flex-direction: column-reverse;
                        gap: 0.75rem;
                    }

                    .submit-button,
                    .cancel-button {
                        width: 100%;
                    }
                }
            `}</style>
        </div>
    );
}

export default CreateReport; 