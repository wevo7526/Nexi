"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    created_at: string;
}

interface StructuredOutput {
    type: 'text' | 'table' | 'chart' | 'analysis' | 'recommendation' | 'metric';
    content: any;
    title?: string;
    description?: string;
}

export default function ConsultantPage() {
    const [query, setQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [streamingMessage, setStreamingMessage] = useState('');
    const [structuredOutputs, setStructuredOutputs] = useState<StructuredOutput[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    useEffect(() => {
        checkAuth();
        fetchMessages();
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, streamingMessage]);

    const checkAuth = async () => {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error || !session) {
            router.push('/auth');
        }
    };

    const fetchMessages = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const response = await fetch('http://localhost:5000/api/get_answer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    query: "get_history",
                    user_id: session.user.id
                })
            });
            const data = await response.json();
            if (data.success) {
                setMessages(data.messages || []);
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim() || isLoading) return;

        setIsLoading(true);
        setStreamingMessage('');
        setStructuredOutputs([]);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const response = await fetch('http://localhost:5000/api/get_answer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    query: query,
                    user_id: session.user.id,
                    chat_history: messages.map(msg => ({
                        role: msg.role,
                        content: msg.content
                    }))
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.success) {
                // Add user message
                setMessages(prev => [{
                    id: Date.now().toString(),
                    role: 'user',
                    content: query,
                    created_at: new Date().toISOString()
                }, ...prev]);

                // Add assistant message with structured output
                if (data.answer) {
                    setMessages(prev => [{
                        id: (Date.now() + 1).toString(),
                        role: 'assistant',
                        content: data.answer.content?.sections?.[0]?.content || 'Analysis complete.',
                        created_at: new Date().toISOString()
                    }, ...prev]);
                    
                    // Add structured output if available
                    if (data.answer.type) {
                        setStructuredOutputs(prev => [data.answer, ...prev]);
                    }
                }
                
                setQuery('');
            } else {
                throw new Error(data.error || 'Failed to get response');
            }
        } catch (error) {
            console.error('Error during chat:', error);
            // Add error message to chat
            setMessages(prev => [{
                id: Date.now().toString(),
                role: 'assistant',
                content: 'Sorry, I encountered an error while processing your request. Please try again.',
                created_at: new Date().toISOString()
            }, ...prev]);
        } finally {
            setIsLoading(false);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const renderStructuredOutput = (output: StructuredOutput) => {
        switch (output.type) {
            case 'analysis':
                return (
                    <div className="analysis-container">
                        <h3 className="analysis-title">{output.title}</h3>
                        <div className="analysis-content">
                            {output.content.sections.map((section: any, index: number) => (
                                <div key={index} className="analysis-section">
                                    <h4 className="section-title">{section.title}</h4>
                                    <div className="section-content">
                                        {section.content}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'recommendation':
                return (
                    <div className="recommendation-container">
                        <h3 className="recommendation-title">{output.title}</h3>
                        <div className="recommendation-content">
                            {output.content.recommendations.map((rec: any, index: number) => (
                                <div key={index} className="recommendation-item">
                                    <div className="recommendation-header">
                                        <span className="priority-badge">{rec.priority}</span>
                                        <h4>{rec.title}</h4>
                                    </div>
                                    <p className="recommendation-description">{rec.description}</p>
                                    {rec.impact && (
                                        <div className="impact-section">
                                            <span className="impact-label">Expected Impact:</span>
                                            <span className={`impact-value ${rec.impact.toLowerCase()}`}>
                                                {rec.impact}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'metric':
                return (
                    <div className="metric-container">
                        <h3 className="metric-title">{output.title}</h3>
                        <div className="metric-grid">
                            {output.content.metrics.map((metric: any, index: number) => (
                                <div key={index} className="metric-card">
                                    <div className="metric-value">{metric.value}</div>
                                    <div className="metric-label">{metric.label}</div>
                                    {metric.trend && (
                                        <div className={`metric-trend ${metric.trend > 0 ? 'positive' : 'negative'}`}>
                                            {metric.trend > 0 ? '↑' : '↓'} {Math.abs(metric.trend)}%
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'table':
                return (
                    <div className="table-container">
                        <h3 className="table-title">{output.title}</h3>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    {output.content.headers.map((header: string, index: number) => (
                                        <th key={index}>{header}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {output.content.rows.map((row: any[], rowIndex: number) => (
                                    <tr key={rowIndex}>
                                        {row.map((cell: any, cellIndex: number) => (
                                            <td key={cellIndex}>{cell}</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );
            case 'chart':
                return (
                    <div className="chart-container">
                        <h3 className="chart-title">{output.title}</h3>
                        <div className="chart-content">
                            {/* Add chart rendering logic here based on chart type */}
                            <div className="chart-placeholder">
                                Chart visualization would go here
                            </div>
                        </div>
                    </div>
                );
            default:
                return <div className="text-content">{output.content}</div>;
        }
    };

    return (
        <div className="consultant-page">
            <div className="query-section">
                <div className="query-container">
                    <h1 className="page-title">Business Consultant</h1>
                    <form onSubmit={handleSubmit} className="query-form">
                        <div className="input-wrapper">
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Ask your business question..."
                                disabled={isLoading}
                                className="query-input"
                            />
                            <button
                                type="submit"
                                disabled={isLoading || !query.trim()}
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
                                        <span>Ask</span>
                                    </div>
                                )}
                            </button>
                        </div>
                        {isLoading && (
                            <div className="progress-bar">
                                <div className="progress-indicator"></div>
                            </div>
                        )}
                    </form>
                </div>
            </div>

            <div className="content-section">
                <div className="messages-container">
                    {streamingMessage && (
                        <div className="message streaming">
                            <div className="message-content">
                                {streamingMessage}
                            </div>
                            {structuredOutputs.map((output, index) => (
                                <div key={index} className="structured-output">
                                    {renderStructuredOutput(output)}
                                </div>
                            ))}
                        </div>
                    )}
                    {messages.map((message) => (
                        <div key={message.id} className={`message ${message.role}`}>
                            <div className="message-content">
                                {message.content}
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            <style jsx>{`
                .consultant-page {
                    height: 100vh;
                    display: flex;
                    flex-direction: column;
                    background: #ffffff;
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                }

                .query-section {
                    position: sticky;
                    top: 0;
                    left: 0;
                    right: 0;
                    background: #ffffff;
                    z-index: 100;
                    border-bottom: 1px solid #e2e8f0;
                }

                .query-container {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 1.5rem 2rem;
                }

                .page-title {
                    font-size: 1.5rem;
                    font-weight: 600;
                    color: #1e293b;
                    margin-bottom: 1.5rem;
                }

                .query-form {
                    max-width: 800px;
                    margin: 0 auto;
                }

                .input-wrapper {
                    display: flex;
                    align-items: center;
                    background: #ffffff;
                    border-radius: 12px;
                    border: 1px solid #e2e8f0;
                    transition: all 0.2s;
                    position: relative;
                }

                .input-wrapper:focus-within {
                    border-color: #3b82f6;
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
                }

                .query-input {
                    flex: 1;
                    padding: 1rem 1.5rem;
                    border: none;
                    border-radius: 12px;
                    font-size: 1rem;
                    transition: all 0.2s;
                    background: transparent;
                    padding-right: 140px; /* Make space for the button */
                }

                .query-input:focus {
                    outline: none;
                }

                .query-input::placeholder {
                    color: #94a3b8;
                }

                .submit-button {
                    position: absolute;
                    right: 0.5rem;
                    top: 50%;
                    transform: translateY(-50%);
                    padding: 0.75rem 1.25rem;
                    background: #3b82f6;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 0.875rem;
                    font-weight: 500;
                    transition: all 0.2s;
                    white-space: nowrap;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-width: 100px;
                }

                .button-content {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .loading-spinner {
                    width: 16px;
                    height: 16px;
                    border: 2px solid #ffffff;
                    border-top-color: transparent;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    to {
                        transform: rotate(360deg);
                    }
                }

                .submit-button:disabled {
                    background: #94a3b8;
                    cursor: not-allowed;
                }

                .submit-button:hover:not(:disabled) {
                    background: #2563eb;
                    transform: translateY(-50%) scale(1.02);
                }

                .progress-bar {
                    height: 2px;
                    background: #e2e8f0;
                    margin-top: 0.5rem;
                    border-radius: 1px;
                    overflow: hidden;
                }

                .progress-indicator {
                    height: 100%;
                    background: #3b82f6;
                    width: 0%;
                    animation: progress 2s ease-in-out infinite;
                }

                @keyframes progress {
                    0% { width: 0%; }
                    50% { width: 70%; }
                    100% { width: 100%; }
                }

                .content-section {
                    flex: 1;
                    overflow: hidden;
                    background: #ffffff;
                    position: relative;
                }

                .messages-container {
                    height: 100%;
                    overflow-y: auto;
                    padding: 2rem;
                    display: flex;
                    flex-direction: column;
                    gap: 2rem;
                    max-width: 1200px;
                    margin: 0 auto;
                }

                .message {
                    max-width: 800px;
                    margin: 0 auto;
                    width: 100%;
                }

                .message.user {
                    align-self: flex-end;
                }

                .message.assistant {
                    align-self: flex-start;
                }

                .message-content {
                    padding: 1.5rem;
                    border-radius: 16px;
                    background: #ffffff;
                    white-space: pre-wrap;
                    line-height: 1.6;
                    border: 1px solid #e2e8f0;
                }

                .message.user .message-content {
                    background: #3b82f6;
                    color: white;
                    border: none;
                }

                .message.streaming .message-content {
                    background: #ffffff;
                    border: 1px solid #e2e8f0;
                }

                .structured-output {
                    margin-top: 1.5rem;
                    padding: 1.5rem;
                    background: #ffffff;
                    border-radius: 16px;
                    border: 1px solid #e2e8f0;
                }

                .table-container {
                    overflow-x: auto;
                    margin: 1rem 0;
                    border-radius: 8px;
                    background: #ffffff;
                }

                .data-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 0.875rem;
                }

                .data-table th,
                .data-table td {
                    padding: 1rem;
                    text-align: left;
                    border-bottom: 1px solid #e2e8f0;
                }

                .data-table th {
                    background: #f8fafc;
                    font-weight: 600;
                    color: #1e293b;
                }

                .data-table tr:hover {
                    background: #f8fafc;
                }

                .chart-container {
                    padding: 1.5rem;
                    background: #ffffff;
                    border-radius: 16px;
                    margin: 1rem 0;
                    border: 1px solid #e2e8f0;
                }

                .chart-placeholder {
                    height: 300px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #f8fafc;
                    border-radius: 8px;
                    color: #64748b;
                }

                .text-content {
                    white-space: pre-wrap;
                    line-height: 1.6;
                    color: #1e293b;
                }

                .analysis-container {
                    background: #ffffff;
                    border-radius: 16px;
                    padding: 1.5rem;
                    margin: 1rem 0;
                    border: 1px solid #e2e8f0;
                }

                .analysis-title {
                    font-size: 1.25rem;
                    font-weight: 600;
                    color: #1e293b;
                    margin-bottom: 1.5rem;
                }

                .analysis-section {
                    margin-bottom: 1.5rem;
                }

                .section-title {
                    font-size: 1.1rem;
                    font-weight: 500;
                    color: #3b82f6;
                    margin-bottom: 0.75rem;
                }

                .section-content {
                    color: #1e293b;
                    line-height: 1.6;
                }

                .recommendation-container {
                    background: #ffffff;
                    border-radius: 16px;
                    padding: 1.5rem;
                    margin: 1rem 0;
                    border: 1px solid #e2e8f0;
                }

                .recommendation-title {
                    font-size: 1.25rem;
                    font-weight: 600;
                    color: #1e293b;
                    margin-bottom: 1.5rem;
                }

                .recommendation-item {
                    padding: 1rem;
                    border-radius: 8px;
                    background: #f8fafc;
                    margin-bottom: 1rem;
                }

                .recommendation-header {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    margin-bottom: 0.5rem;
                }

                .priority-badge {
                    padding: 0.25rem 0.5rem;
                    border-radius: 4px;
                    font-size: 0.875rem;
                    font-weight: 500;
                    background: #e2e8f0;
                    color: #1e293b;
                }

                .recommendation-description {
                    color: #1e293b;
                    line-height: 1.6;
                    margin-bottom: 0.75rem;
                }

                .impact-section {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .impact-label {
                    color: #64748b;
                    font-size: 0.875rem;
                }

                .impact-value {
                    font-weight: 500;
                    font-size: 0.875rem;
                }

                .impact-value.high {
                    color: #22c55e;
                }

                .impact-value.medium {
                    color: #f59e0b;
                }

                .impact-value.low {
                    color: #ef4444;
                }

                .metric-container {
                    background: #ffffff;
                    border-radius: 16px;
                    padding: 1.5rem;
                    margin: 1rem 0;
                    border: 1px solid #e2e8f0;
                }

                .metric-title {
                    font-size: 1.25rem;
                    font-weight: 600;
                    color: #1e293b;
                    margin-bottom: 1.5rem;
                }

                .metric-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 1rem;
                }

                .metric-card {
                    background: #f8fafc;
                    border-radius: 8px;
                    padding: 1rem;
                    text-align: center;
                }

                .metric-value {
                    font-size: 1.5rem;
                    font-weight: 600;
                    color: #1e293b;
                    margin-bottom: 0.5rem;
                }

                .metric-label {
                    color: #64748b;
                    font-size: 0.875rem;
                }

                .metric-trend {
                    margin-top: 0.5rem;
                    font-size: 0.875rem;
                }

                .metric-trend.positive {
                    color: #22c55e;
                }

                .metric-trend.negative {
                    color: #ef4444;
                }

                .table-title,
                .chart-title {
                    font-size: 1.25rem;
                    font-weight: 600;
                    color: #1e293b;
                    margin-bottom: 1rem;
                }

                @media (max-width: 768px) {
                    .query-container {
                        padding: 1rem;
                    }

                    .messages-container {
                        padding: 1rem;
                    }

                    .message-content {
                        padding: 1rem;
                    }

                    .structured-output {
                        padding: 1rem;
                    }
                }
            `}</style>
        </div>
    );
} 