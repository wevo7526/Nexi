"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import dynamic from 'next/dynamic';
import { ChartData, ChartOptions, ChartType } from 'chart.js';

// Dynamically import chart components
const Chart = dynamic(() => import('react-chartjs-2').then(mod => mod.Line), { ssr: false });
const BarChart = dynamic(() => import('react-chartjs-2').then(mod => mod.Bar), { ssr: false });
const PieChart = dynamic(() => import('react-chartjs-2').then(mod => mod.Pie), { ssr: false });

// Register Chart.js components
if (typeof window !== 'undefined') {
    const {
        Chart: ChartJS,
        CategoryScale,
        LinearScale,
        PointElement,
        LineElement,
        BarElement,
        ArcElement,
        Title,
        Tooltip,
        Legend
    } = require('chart.js');
    
    ChartJS.register(
        CategoryScale,
        LinearScale,
        PointElement,
        LineElement,
        BarElement,
        ArcElement,
        Title,
        Tooltip,
        Legend
    );
}

interface ChartDataProps {
    type: 'line' | 'bar' | 'pie';
    data: ChartData<ChartType>;
    options: ChartOptions<ChartType>;
}

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
    const [progress, setProgress] = useState(0);
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
                    // Create a message with the main content
                    setMessages(prev => [{
                        id: (Date.now() + 1).toString(),
                        role: 'assistant',
                        content: data.answer.content || 'Analysis complete.',
                        created_at: new Date().toISOString()
                    }, ...prev]);
                    
                    // Handle structured output
                    if (data.answer.outputs && Array.isArray(data.answer.outputs)) {
                        setStructuredOutputs(prev => [...data.answer.outputs, ...prev]);
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

    const renderChart = (chartData: ChartDataProps) => {
        const { type, data, options } = chartData;
        
        switch (type) {
            case 'line':
                return <Chart data={data as ChartData<'line'>} options={options as ChartOptions<'line'>} />;
            case 'bar':
                return <BarChart data={data as ChartData<'bar'>} options={options as ChartOptions<'bar'>} />;
            case 'pie':
                return <PieChart data={data as ChartData<'pie'>} options={options as ChartOptions<'pie'>} />;
            default:
                return <div>Unsupported chart type</div>;
        }
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
                                    {section.chart && (
                                        <div className="section-chart">
                                            {renderChart(section.chart)}
                                        </div>
                                    )}
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
                            {renderChart(output.content)}
                        </div>
                    </div>
                );
            default:
                return <div className="text-content">{output.content}</div>;
        }
    };

    return (
        <div className="consultant-page">
            <div className="consultant-container">
                <div className="query-section">
                    <h1 className="page-title">Business Consultant</h1>
                    <form onSubmit={handleSubmit} className="query-form">
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
                            {isLoading ? 'Analyzing...' : 'Analyze'}
                        </button>
                    </form>
                </div>

                <div className="messages-container">
                    {messages.map((message) => (
                        <div key={message.id} className={`message ${message.role}`}>
                            <div className="message-content">
                                {message.content}
                                {message.role === 'assistant' && structuredOutputs.length > 0 && (
                                    <div className="structured-outputs">
                                        {structuredOutputs.map((output: StructuredOutput, index: number) => (
                                            <div key={index} className="structured-output">
                                                {renderStructuredOutput(output)}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="message-timestamp">
                                {new Date(message.created_at).toLocaleString()}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="loading-indicator">
                            <div className="progress-bar">
                                <div 
                                    className="progress-fill"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                    )}
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
                    padding: 2rem;
                    overflow: hidden; /* Prevent page-level scrolling */
                }

                .consultant-container {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    max-width: 800px;
                    margin: 0 auto;
                    width: 100%;
                    position: relative;
                    overflow: hidden; /* Contain the scrolling area */
                }

                .query-section {
                    padding: 1.5rem;
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                    margin-bottom: 2rem;
                    position: sticky;
                    top: 0;
                    z-index: 10;
                }

                .page-title {
                    font-size: 1.5rem;
                    font-weight: 600;
                    color: #1f2937;
                    margin-bottom: 1.5rem;
                    text-align: center;
                }

                .query-form {
                    display: flex;
                    gap: 1rem;
                    align-items: center;
                }

                .query-input {
                    flex: 1;
                    padding: 0.875rem 1rem;
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                    font-size: 1rem;
                    transition: all 0.2s;
                }

                .query-input:focus {
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
                    white-space: nowrap;
                }

                .submit-button:disabled {
                    background: #9ca3af;
                    cursor: not-allowed;
                }

                .submit-button:hover:not(:disabled) {
                    background: #2563eb;
                }

                .messages-container {
                    flex: 1;
                    overflow-y: auto;
                    padding: 1rem;
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                    scrollbar-width: thin;
                    scrollbar-color: #cbd5e1 #f1f5f9;
                    height: calc(100vh - 200px);
                    position: relative;
                }

                .messages-container::-webkit-scrollbar {
                    width: 8px;
                }

                .messages-container::-webkit-scrollbar-track {
                    background: #f1f5f9;
                    border-radius: 4px;
                }

                .messages-container::-webkit-scrollbar-thumb {
                    background-color: #cbd5e1;
                    border-radius: 4px;
                }

                .message {
                    padding: 1.5rem;
                    border-radius: 12px;
                    max-width: 85%;
                    background: white;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                }

                .message.user {
                    background: #f3f4f6;
                    margin-left: auto;
                }

                .message.assistant {
                    background: #f0f9ff;
                    margin-right: auto;
                }

                .message-content {
                    white-space: pre-wrap;
                    line-height: 1.6;
                    color: #1f2937;
                }

                .message-timestamp {
                    font-size: 0.875rem;
                    color: #6b7280;
                    margin-top: 0.5rem;
                }

                .loading-indicator {
                    padding: 1rem;
                }

                .progress-bar {
                    height: 4px;
                    background: #e5e7eb;
                    border-radius: 2px;
                    overflow: hidden;
                }

                .progress-fill {
                    height: 100%;
                    background: #3b82f6;
                    transition: width 0.3s ease;
                }

                .structured-outputs {
                    margin-top: 1rem;
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    width: 100%;
                }

                .structured-output {
                    background: white;
                    border-radius: 8px;
                    padding: 1rem;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                    width: 100%;
                }

                .analysis-container,
                .recommendation-container,
                .metric-container,
                .table-container,
                .chart-container {
                    background: white;
                    border-radius: 8px;
                    padding: 1rem;
                    margin-bottom: 1rem;
                }

                .analysis-title,
                .recommendation-title,
                .metric-title,
                .table-title,
                .chart-title {
                    font-size: 1.1rem;
                    font-weight: 600;
                    color: #1f2937;
                    margin-bottom: 0.75rem;
                }

                .analysis-section {
                    margin-bottom: 1rem;
                }

                .section-title {
                    font-weight: 500;
                    color: #3b82f6;
                    margin-bottom: 0.5rem;
                }

                .section-content {
                    color: #4b5563;
                    line-height: 1.6;
                }

                .recommendation-item {
                    padding: 0.75rem;
                    border-radius: 6px;
                    background: #f9fafb;
                    margin-bottom: 0.75rem;
                }

                .recommendation-header {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    margin-bottom: 0.5rem;
                }

                .priority-badge {
                    padding: 0.25rem 0.5rem;
                    border-radius: 4px;
                    font-size: 0.875rem;
                    font-weight: 500;
                    background: #e5e7eb;
                    color: #1f2937;
                }

                .metric-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                    gap: 1rem;
                }

                .metric-card {
                    background: #f9fafb;
                    border-radius: 6px;
                    padding: 1rem;
                    text-align: center;
                }

                .metric-value {
                    font-size: 1.25rem;
                    font-weight: 600;
                    color: #1f2937;
                    margin-bottom: 0.25rem;
                }

                .metric-label {
                    color: #6b7280;
                    font-size: 0.875rem;
                }

                .metric-trend {
                    margin-top: 0.5rem;
                    font-size: 0.875rem;
                }

                .metric-trend.positive {
                    color: #059669;
                }

                .metric-trend.negative {
                    color: #dc2626;
                }

                .data-table {
                    width: 100%;
                    border-collapse: collapse;
                }

                .data-table th,
                .data-table td {
                    padding: 0.75rem;
                    text-align: left;
                    border-bottom: 1px solid #e5e7eb;
                }

                .data-table th {
                    background: #f9fafb;
                    font-weight: 600;
                    color: #1f2937;
                }

                .data-table tr:hover {
                    background: #f9fafb;
                }

                .section-chart {
                    margin-top: 1rem;
                    padding: 1rem;
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                }

                .chart-content {
                    position: relative;
                    height: 300px;
                    width: 100%;
                }

                .chart-container {
                    background: white;
                    border-radius: 8px;
                    padding: 1rem;
                    margin-bottom: 1rem;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                }

                @media (max-width: 768px) {
                    .consultant-page {
                        padding: 1rem;
                    }

                    .query-section {
                        padding: 1rem;
                    }

                    .query-form {
                        flex-direction: column;
                    }

                    .submit-button {
                        width: 100%;
                    }

                    .messages-container {
                        height: calc(100vh - 250px);
                    }

                    .message {
                        max-width: 95%;
                    }

                    .chart-content {
                        height: 250px;
                    }
                }
            `}</style>
        </div>
    );
} 