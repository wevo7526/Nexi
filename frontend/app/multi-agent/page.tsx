"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

interface StreamingData {
    type: 'status' | 'content' | 'report' | 'error';
    content: string;
    agent?: string;
    section?: string;
}

export default function MultiAgentPage() {
    const [query, setQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [streamContent, setStreamContent] = useState<string>('');
    const router = useRouter();
    const { user } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setStreamContent('');

        try {
            const response = await fetch(`${BACKEND_URL}/api/multi-agent/research`, {
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
                throw new Error(errorData.error || 'Failed to start research');
            }

            const reader = response.body?.getReader();
            if (!reader) {
                throw new Error('Failed to initialize stream reader');
            }

            const decoder = new TextDecoder();
            let buffer = '';

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
                                const agentEmoji = data.agent === 'researcher' ? '🔍' :
                                                 data.agent === 'web_scraper' ? '🌐' :
                                                 data.agent === 'analyst' ? '📊' :
                                                 data.agent === 'doc_writer' ? '📝' :
                                                 data.agent === 'section_writer' ? '✍️' :
                                                 data.agent === 'executive_summary_writer' ? '📋' : '🤖';
                                setStreamContent(prev => prev + `${agentEmoji} ${data.agent?.replace('_', ' ').toUpperCase()}: ${data.content}\n\n`);
                            } else if (data.type === 'content') {
                                const sectionEmoji = data.section === 'research' ? '🔬' :
                                                   data.section === 'analysis' ? '📈' :
                                                   data.section === 'writing' ? '✍️' : '📝';
                                setStreamContent(prev => prev + `${sectionEmoji} ${data.section.toUpperCase()}:\n${data.content}\n\n`);
                            } else if (data.type === 'report') {
                                const report = data.content;
                                let reportContent = '📊 FINAL REPORT\n\n';
                                
                                // Executive Summary
                                reportContent += '📝 EXECUTIVE SUMMARY\n';
                                reportContent += report.executive_summary + '\n\n';
                                
                                // Main Content
                                reportContent += '📚 MAIN CONTENT\n';
                                reportContent += report.main_content + '\n\n';
                                
                                // Conclusions
                                reportContent += '🎯 CONCLUSIONS\n';
                                reportContent += report.conclusions + '\n\n';
                                
                                // Recommendations
                                reportContent += '💡 RECOMMENDATIONS\n';
                                reportContent += report.recommendations + '\n\n';
                                
                                setStreamContent(prev => prev + reportContent + '\n');
                                setIsLoading(false);
                            } else if (data.type === 'error') {
                                setError(data.content);
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
            setError(err instanceof Error ? err.message : 'Failed to process research request');
            setIsLoading(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">Deep Research & Analysis</h1>
            
            <form onSubmit={handleSubmit} className="mb-8">
                <div className="mb-4">
                    <label htmlFor="query" className="block text-sm font-medium text-gray-700 mb-2">
                        Enter your research query:
                    </label>
                    <textarea
                        id="query"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="w-full h-32 p-4 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Describe what you want to research and analyze..."
                        required
                    />
                </div>
                
                <button
                    type="submit"
                    disabled={isLoading}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? 'Researching...' : 'Start Research'}
                </button>
            </form>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            {streamContent && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-8">
                    <h2 className="text-xl font-semibold mb-2">Research Progress:</h2>
                    <div className="max-h-[600px] overflow-y-auto">
                        <pre className="whitespace-pre-wrap font-sans">{streamContent}</pre>
                    </div>
                </div>
            )}
        </div>
    );
} 