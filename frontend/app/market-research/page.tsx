"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

interface ResearchResult {
    id: string;
    query: string;
    result: string;
    created_at: string;
}

interface StreamingData {
    id: string;
    type: 'thought' | 'action' | 'final' | 'error';
    content: string;
    status?: string;
    timestamp: number;
}

export default function MarketResearchPage() {
    const [query, setQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState<ResearchResult[]>([]);
    const [streamingData, setStreamingData] = useState<StreamingData[]>([]);
    const [progress, setProgress] = useState(0);
    const resultsEndRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const messageCounter = useRef(0);

    useEffect(() => {
        checkAuth();
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [results, streamingData]);

    const checkAuth = async () => {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error || !session) {
            router.push('/auth');
        }
    };

    const generateUniqueId = () => {
        messageCounter.current += 1;
        return `${Date.now()}-${messageCounter.current}`;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim() || isLoading) return;

        setIsLoading(true);
        setStreamingData([]);
        setProgress(0);
        messageCounter.current = 0;

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const response = await fetch('http://localhost:5000/api/market-research/research', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    query,
                    user_id: session.user.id
                })
            });

            if (!response.ok) throw new Error('Network response was not ok');

            const reader = response.body?.getReader();
            if (!reader) throw new Error('No reader available');

            let buffer = '';
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += new TextDecoder().decode(value);
                const lines = buffer.split('\n');
                buffer = lines.pop() || ''; // Keep the last incomplete line in the buffer

                for (const line of lines) {
                    if (line.trim() === '') continue;
                    if (!line.startsWith('data: ')) continue;

                    try {
                        const jsonStr = line.slice(6).trim();
                        if (!jsonStr) continue;
                        
                        const data = JSON.parse(jsonStr);
                        
                        if (data.status === 'error') {
                            setStreamingData(prev => [...prev, {
                                id: generateUniqueId(),
                                type: 'error',
                                content: data.message,
                                timestamp: Date.now()
                            }]);
                            break;
                        }

                        if (data.type === 'thought') {
                            setStreamingData(prev => [...prev, {
                                id: generateUniqueId(),
                                type: 'thought',
                                content: data.content,
                                timestamp: Date.now()
                            }]);
                            setProgress(prev => Math.min(prev + 10, 90));
                        } else if (data.type === 'action') {
                            setStreamingData(prev => [...prev, {
                                id: generateUniqueId(),
                                type: 'action',
                                content: data.content,
                                timestamp: Date.now()
                            }]);
                            setProgress(prev => Math.min(prev + 15, 90));
                        } else if (data.type === 'final') {
                            setStreamingData(prev => [...prev, {
                                id: generateUniqueId(),
                                type: 'final',
                                content: data.content,
                                timestamp: Date.now()
                            }]);
                            setProgress(100);
                            setResults(prev => [{
                                id: generateUniqueId(),
                                query: query,
                                result: data.content,
                                created_at: new Date().toISOString()
                            }, ...prev]);
                            setQuery('');
                        }
                    } catch (parseError) {
                        console.error('Error parsing JSON:', parseError);
                        console.log('Raw data:', line);
                        continue;
                    }
                }
            }
        } catch (error) {
            console.error('Error during streaming:', error);
            setStreamingData(prev => [...prev, {
                id: generateUniqueId(),
                type: 'error',
                content: 'An error occurred during research. Please try again.',
                timestamp: Date.now()
            }]);
        } finally {
            setIsLoading(false);
            setProgress(0);
        }
    };

    const scrollToBottom = () => {
        resultsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="market-research-page">
            <div className="research-container">
                <div className="results-section">
                    {streamingData.length > 0 && (
                        <div className="streaming-result">
                            {streamingData.map((data) => (
                                <div key={data.id} className={`streaming-content ${data.type}`}>
                                    {data.type === 'thought' && (
                                        <div className="thought-content">
                                            <span className="thought-icon">💭</span>
                                            <div className="content-wrapper">
                                                <div className="content-header">Analysis</div>
                                                <div className="content-body scrollable-content">{data.content}</div>
                                            </div>
                                        </div>
                                    )}
                                    {data.type === 'action' && (
                                        <div className="action-content">
                                            <span className="action-icon">🔍</span>
                                            <div className="content-wrapper">
                                                <div className="content-header">Research Action</div>
                                                <div className="content-body scrollable-content">{data.content}</div>
                                            </div>
                                        </div>
                                    )}
                                    {data.type === 'final' && (
                                        <div className="final-content">
                                            <span className="final-icon">✅</span>
                                            <div className="content-wrapper">
                                                <div className="content-header">Final Research Report</div>
                                                <div className="content-body scrollable-content">{data.content}</div>
                                            </div>
                                        </div>
                                    )}
                                    {data.type === 'error' && (
                                        <div className="error-content">
                                            <span className="error-icon">❌</span>
                                            <div className="content-wrapper">
                                                <div className="content-header">Error</div>
                                                <div className="content-body scrollable-content">{data.content}</div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                            {isLoading && (
                                <div className="progress-bar">
                                    <div 
                                        className="progress-fill"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                    {results.map((result) => (
                        <div key={result.id} className="research-result">
                            <div className="result-content scrollable-content">
                                {result.result}
                            </div>
                            <div className="result-timestamp">
                                {new Date(result.created_at).toLocaleString()}
                            </div>
                        </div>
                    ))}
                    <div ref={resultsEndRef} />
                </div>

                <form onSubmit={handleSubmit} className="input-form">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Enter your market research query..."
                        disabled={isLoading}
                        className="research-input"
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !query.trim()}
                        className="submit-button"
                    >
                        {isLoading ? 'Researching...' : 'Research'}
                    </button>
                </form>
            </div>

            <style jsx>{`
                .market-research-page {
                    height: 100vh;
                    display: flex;
                    flex-direction: column;
                    background: #ffffff;
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    padding: 2rem;
                }

                .research-container {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    max-width: 800px;
                    margin: 0 auto;
                    width: 100%;
                    position: relative;
                }

                .results-section {
                    flex: 1;
                    overflow-y: auto;
                    padding: 1rem;
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                    scrollbar-width: thin;
                    scrollbar-color: #cbd5e1 #f1f5f9;
                    height: calc(100vh - 180px); /* Account for input form and padding */
                }

                .results-section::-webkit-scrollbar {
                    width: 8px;
                }

                .results-section::-webkit-scrollbar-track {
                    background: #f1f5f9;
                    border-radius: 4px;
                }

                .results-section::-webkit-scrollbar-thumb {
                    background-color: #cbd5e1;
                    border-radius: 4px;
                }

                .research-result, .streaming-result {
                    padding: 1.5rem;
                    border-radius: 12px;
                    background: #f9fafb;
                    border: 1px solid #e5e7eb;
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }

                .streaming-result {
                    background: #f0f9ff;
                    border-color: #bae6fd;
                }

                .streaming-content {
                    margin-bottom: 1rem;
                    padding: 1rem;
                    border-radius: 8px;
                    background: white;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }

                .content-wrapper {
                    flex: 1;
                    margin-left: 0.75rem;
                    display: flex;
                    flex-direction: column;
                    min-height: 0; /* Important for nested flex containers */
                }

                .content-header {
                    font-weight: 600;
                    margin-bottom: 0.5rem;
                    color: #1f2937;
                    flex-shrink: 0;
                }

                .content-body {
                    white-space: pre-wrap;
                    line-height: 1.6;
                    color: #4b5563;
                    flex: 1;
                    min-height: 0; /* Important for nested flex containers */
                }

                .scrollable-content {
                    height: 100%;
                    overflow-y: auto;
                    padding-right: 0.5rem;
                    scrollbar-width: thin;
                    scrollbar-color: #cbd5e1 #f1f5f9;
                    min-height: 100px; /* Minimum height for content */
                }

                .scrollable-content::-webkit-scrollbar {
                    width: 4px;
                }

                .scrollable-content::-webkit-scrollbar-track {
                    background: #f1f5f9;
                    border-radius: 2px;
                }

                .scrollable-content::-webkit-scrollbar-thumb {
                    background-color: #cbd5e1;
                    border-radius: 2px;
                }

                .thought-content, .action-content, .final-content, .error-content {
                    display: flex;
                    align-items: flex-start;
                    gap: 0.5rem;
                    min-height: 0; /* Important for nested flex containers */
                }

                .thought-content {
                    color: #4b5563;
                }

                .action-content {
                    color: #2563eb;
                    background: #eff6ff;
                }

                .final-content {
                    color: #059669;
                    background: #ecfdf5;
                }

                .error-content {
                    color: #dc2626;
                    background: #fef2f2;
                }

                .progress-bar {
                    height: 4px;
                    background: #e5e7eb;
                    border-radius: 2px;
                    margin-top: 1rem;
                    overflow: hidden;
                }

                .progress-fill {
                    height: 100%;
                    background: #3b82f6;
                    transition: width 0.3s ease;
                }

                .result-content {
                    margin-bottom: 0.75rem;
                    white-space: pre-wrap;
                    line-height: 1.6;
                    color: #1f2937;
                }

                .result-timestamp {
                    font-size: 0.875rem;
                    color: #6b7280;
                }

                .input-form {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    padding: 1rem;
                    background: white;
                    border-top: 1px solid #e5e7eb;
                    position: sticky;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    flex-shrink: 0; /* Prevent form from shrinking */
                }

                .research-input {
                    flex: 1;
                    padding: 0.875rem 1rem;
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                    font-size: 1rem;
                    transition: all 0.2s;
                }

                .research-input:focus {
                    outline: none;
                    border-color: #3b82f6;
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
                }

                .submit-button {
                    padding: 0.875rem 1.5rem;
                    background: #3b82f6;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 1rem;
                    font-weight: 500;
                    transition: all 0.2s;
                }

                .submit-button:disabled {
                    background: #9ca3af;
                    cursor: not-allowed;
                }

                .submit-button:hover:not(:disabled) {
                    background: #2563eb;
                }

                @media (max-width: 768px) {
                    .market-research-page {
                        padding: 1rem;
                    }
                }
            `}</style>
        </div>
    );
} 