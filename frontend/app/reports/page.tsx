"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { DocumentArrowDownIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

interface Report {
    id: string;
    title: string;
    createdAt: string;
    status: 'generating' | 'completed' | 'failed';
    downloadUrl?: string;
}

export default function ReportsPage() {
    const [query, setQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [streamContent, setStreamContent] = useState<string>('');
    const [reports, setReports] = useState<Report[]>([]);
    const [progress, setProgress] = useState(0);
    const { user } = useAuth();

    // Fetch report history on component mount
    useEffect(() => {
        const fetchReports = async () => {
            try {
                const response = await fetch(`${BACKEND_URL}/api/reports`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    setReports(data.reports || []);
                }
            } catch (err) {
                console.error('Error fetching reports:', err);
            }
        };
        fetchReports();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setStreamContent('');
        setProgress(0);

        try {
            const response = await fetch(`${BACKEND_URL}/api/reports/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    query,
                    client_info: {
                        user_id: user?.id,
                        timestamp: new Date().toISOString()
                    }
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to start report generation');
            }

            const reader = response.body?.getReader();
            if (!reader) {
                throw new Error('Failed to initialize stream reader');
            }

            const decoder = new TextDecoder();
            let buffer = '';
            let currentReportId: string | undefined;

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6));
                            
                            if (data.type === 'status') {
                                setStreamContent(prev => prev + `\n${data.agent}: ${data.content}`);
                            } else if (data.type === 'progress') {
                                setProgress(data.progress);
                            } else if (data.type === 'report') {
                                currentReportId = data.reportId;
                                setStreamContent(prev => prev + '\nReport generation completed!');
                                setIsLoading(false);
                            }
                        } catch (err) {
                            console.error('Error parsing SSE data:', err);
                            setError('Failed to parse server response');
                            setIsLoading(false);
                        }
                    }
                }
            }
        } catch (err) {
            console.error('Error in handleSubmit:', err);
            setError(err instanceof Error ? err.message : 'Failed to process report generation');
            setIsLoading(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <h1 className="text-3xl font-bold mb-8">Consulting Reports</h1>

            {/* Report Generation Form */}
            <div className="bg-white rounded-lg shadow p-6 mb-8">
                <h2 className="text-xl font-semibold mb-4">Generate New Report</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="query" className="block text-sm font-medium text-gray-700 mb-1">
                            Report Topic
                        </label>
                        <textarea
                            id="query"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Enter the topic or scope for your report..."
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            rows={4}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        {isLoading ? (
                            <>
                                <DocumentTextIcon className="h-5 w-5 mr-2 animate-spin" />
                                Generating Report...
                            </>
                        ) : (
                            <>
                                <DocumentTextIcon className="h-5 w-5 mr-2" />
                                Generate Report
                            </>
                        )}
                    </button>
                </form>

                {error && (
                    <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                        {error}
                    </div>
                )}

                {streamContent && (
                    <div className="mt-6 border-t pt-6">
                        <h3 className="text-lg font-medium mb-3">Generation Progress</h3>
                        <div className="bg-gray-50 rounded-lg p-4">
                            <pre className="whitespace-pre-wrap font-sans text-sm">{streamContent}</pre>
                        </div>
                    </div>
                )}
            </div>

            {/* Report History */}
            <div>
                <h2 className="text-xl font-semibold mb-4">Report History</h2>
                <div className="space-y-4">
                    {reports.length > 0 ? (
                        reports.map((report) => (
                            <div key={report.id} className="bg-white rounded-lg shadow p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-medium">{report.title}</h3>
                                    <span className={`px-2 py-1 rounded text-xs ${
                                        report.status === 'completed' ? 'bg-green-100 text-green-800' :
                                        report.status === 'generating' ? 'bg-blue-100 text-blue-800' :
                                        'bg-red-100 text-red-800'
                                    }`}>
                                        {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500 mb-4">
                                    {new Date(report.createdAt).toLocaleString()}
                                </p>
                                {report.status === 'completed' && report.downloadUrl && (
                                    <a
                                        href={report.downloadUrl}
                                        className="flex items-center text-blue-600 hover:text-blue-800"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <DocumentArrowDownIcon className="h-5 w-5 mr-1" />
                                        Download Report
                                    </a>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="bg-white rounded-lg shadow p-4 text-center text-gray-500">
                            No reports generated yet. Start by creating a new report above.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
} 