"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import dynamic from 'next/dynamic';
import { ChartData, ChartOptions, ChartType } from 'chart.js';
import { PaperAirplaneIcon } from '@heroicons/react/24/outline';

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
                    <div className="bg-white rounded-lg shadow p-4 mb-4">
                        <h3 className="text-lg font-semibold mb-3">{output.title}</h3>
                        <div className="space-y-4">
                            {output.content.sections.map((section: any, index: number) => (
                                <div key={index} className="border-t pt-4 first:border-t-0 first:pt-0">
                                    <h4 className="font-medium mb-2">{section.title}</h4>
                                    <div className="text-gray-600">
                                        {section.content}
                                    </div>
                                    {section.chart && (
                                        <div className="mt-4">
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
                    <div className="bg-white rounded-lg shadow p-4 mb-4">
                        <h3 className="text-lg font-semibold mb-3">{output.title}</h3>
                        <div className="space-y-4">
                            {output.content.recommendations.map((rec: any, index: number) => (
                                <div key={index} className="border-t pt-4 first:border-t-0 first:pt-0">
                                    <div className="flex items-start gap-2">
                                        <span className={`px-2 py-1 rounded text-xs ${
                                            rec.priority === 'High' ? 'bg-red-100 text-red-800' :
                                            rec.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-green-100 text-green-800'
                                        }`}>
                                            {rec.priority}
                                        </span>
                                        <h4 className="font-medium">{rec.title}</h4>
                                    </div>
                                    <p className="text-gray-600 mt-2">{rec.description}</p>
                                    {rec.impact && (
                                        <div className="mt-2 flex items-center gap-2">
                                            <span className="text-sm text-gray-500">Expected Impact:</span>
                                            <span className={`text-sm font-medium ${
                                                rec.impact === 'High' ? 'text-red-600' :
                                                rec.impact === 'Medium' ? 'text-yellow-600' :
                                                'text-green-600'
                                            }`}>
                                                {rec.impact}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">AI Business Consultant</h1>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="mb-8">
                <div className="mb-4">
                    <label htmlFor="query" className="block text-sm font-medium text-gray-700 mb-2">
                        Ask your business question:
                    </label>
                    <textarea
                        id="query"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="w-full h-64 p-4 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter your business question here..."
                        required
                        disabled={isLoading}
                    />
                </div>
                
                <button
                    type="submit"
                    disabled={isLoading || !query.trim()}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? 'Processing...' : 'Send Question'}
                </button>
            </form>

            {/* Chat Messages */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-8">
                <h2 className="text-xl font-semibold mb-4">Conversation History:</h2>
                <div className="space-y-4">
                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex ${
                                message.role === 'user' ? 'justify-end' : 'justify-start'
                            }`}
                        >
                            <div
                                className={`max-w-[80%] rounded-lg p-4 ${
                                    message.role === 'user'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-white text-gray-800 border border-gray-200'
                                }`}
                            >
                                <p className="whitespace-pre-wrap">{message.content}</p>
                                <p className="text-xs mt-2 opacity-70">
                                    {new Date(message.created_at).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    ))}
                    {streamingMessage && (
                        <div className="flex justify-start">
                            <div className="bg-white rounded-lg p-4 border border-gray-200">
                                <p className="whitespace-pre-wrap">{streamingMessage}</p>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Structured Outputs */}
            {structuredOutputs.length > 0 && (
                <div className="space-y-4">
                    {structuredOutputs.map((output, index) => (
                        <div key={index}>
                            {renderStructuredOutput(output)}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
} 