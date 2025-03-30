"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

interface CaseResult {
    id: string;
    case_text: string;
    solution: string;
    created_at: string;
}

export default function BusinessCasePage() {
    const [caseText, setCaseText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState<CaseResult[]>([]);
    const [streamingResult, setStreamingResult] = useState('');
    const resultsEndRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    useEffect(() => {
        checkAuth();
        fetchResults();
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [results, streamingResult]);

    const checkAuth = async () => {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error || !session) {
            router.push('/auth');
        }
    };

    const fetchResults = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const response = await fetch('http://localhost:5000/api/get_case_results', {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            });
            const data = await response.json();
            if (data.success) {
                setResults(data.results);
            }
        } catch (error) {
            console.error('Error fetching results:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!caseText.trim() || isLoading) return;

        setIsLoading(true);
        setStreamingResult('');

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const response = await fetch('http://localhost:5000/api/stream_case_solution', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    case_text: caseText,
                    user_id: session.user.id
                })
            });

            if (!response.ok) throw new Error('Network response was not ok');

            const reader = response.body?.getReader();
            if (!reader) throw new Error('No reader available');

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = new TextDecoder().decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = JSON.parse(line.slice(6));
                        if (data.type === 'stream') {
                            setStreamingResult(prev => prev + data.content);
                        } else if (data.type === 'complete') {
                            setResults(prev => [{
                                id: data.result_id,
                                case_text: caseText,
                                solution: data.result,
                                created_at: new Date().toISOString()
                            }, ...prev]);
                            setStreamingResult('');
                            setCaseText('');
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error during streaming:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const scrollToBottom = () => {
        resultsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="case-solver-page">
            <div className="case-container">
                <div className="results-section">
                    {streamingResult && (
                        <div className="streaming-result">
                            <div className="result-content">
                                {streamingResult}
                            </div>
                            <div className="result-timestamp">
                                Analyzing case...
                            </div>
                        </div>
                    )}
                    {results.map((result) => (
                        <div key={result.id} className="case-result">
                            <div className="case-text">
                                <h3 className="case-title">Case:</h3>
                                <div className="case-content">{result.case_text}</div>
                            </div>
                            <div className="solution-text">
                                <h3 className="solution-title">Solution:</h3>
                                <div className="solution-content">{result.solution}</div>
                            </div>
                            <div className="result-timestamp">
                                {new Date(result.created_at).toLocaleString()}
                            </div>
                        </div>
                    ))}
                    <div ref={resultsEndRef} />
                </div>

                <form onSubmit={handleSubmit} className="input-form">
                    <div className="input-wrapper">
                        <textarea
                            value={caseText}
                            onChange={(e) => setCaseText(e.target.value)}
                            placeholder="Enter your business case here..."
                            disabled={isLoading}
                            className="case-input"
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !caseText.trim()}
                            className="submit-button"
                        >
                            {isLoading ? (
                                <div className="button-content">
                                    <div className="loading-spinner"></div>
                                    <span>Processing</span>
                                </div>
                            ) : (
                                <div className="button-content">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                    <span>Solve</span>
                                </div>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            <style jsx>{`
                .case-solver-page {
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

                .case-container {
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
                }

                .case-result, .streaming-result {
                    padding: 1.5rem;
                    border-radius: 12px;
                    background: #f9fafb;
                    border: 1px solid #e5e7eb;
                }

                .streaming-result {
                    background: #f0f9ff;
                    border-color: #bae6fd;
                }

                .case-text, .solution-text {
                    margin-bottom: 1rem;
                }

                .case-title, .solution-title {
                    font-size: 0.875rem;
                    font-weight: 600;
                    color: #4b5563;
                    margin-bottom: 0.5rem;
                }

                .case-content, .solution-content {
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
                }

                .input-wrapper {
                    display: flex;
                    align-items: center;
                    background: #ffffff;
                    border-radius: 12px;
                    border: 1px solid #e2e8f0;
                    transition: all 0.2s;
                    position: relative;
                    padding: 0.5rem;
                }

                .input-wrapper:focus-within {
                    border-color: #3b82f6;
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
                }

                .case-input {
                    flex: 1;
                    padding: 0.75rem 1rem;
                    border: none;
                    border-radius: 8px;
                    font-size: 1rem;
                    line-height: 1.5;
                    transition: all 0.2s;
                    background: transparent;
                    padding-right: 120px;
                    resize: none;
                    min-height: 48px;
                    max-height: 200px;
                }

                .case-input:focus {
                    outline: none;
                }

                .case-input::placeholder {
                    color: #94a3b8;
                }

                .submit-button {
                    position: absolute;
                    right: 0.5rem;
                    top: 50%;
                    transform: translateY(-50%);
                    padding: 0.5rem 1rem;
                    background: #3b82f6;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 0.875rem;
                    font-weight: 500;
                    transition: all 0.2s;
                    white-space: nowrap;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-width: 90px;
                }

                .submit-button:disabled {
                    background: #94a3b8;
                    cursor: not-allowed;
                }

                .submit-button:hover:not(:disabled) {
                    background: #2563eb;
                    transform: translateY(-50%) scale(1.02);
                }

                @media (max-width: 768px) {
                    .case-solver-page {
                        padding: 1rem;
                    }
                }
            `}</style>
        </div>
    );
} 