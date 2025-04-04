"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Send, CheckCircle, AlertCircle, Search, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string | MessageContent;
    created_at: string;
}

interface StructuredOutput {
    type: 'text' | 'table' | 'chart' | 'analysis' | 'recommendation' | 'metric';
    content: any;
    title?: string;
    description?: string;
}

interface MessageContent {
    content: string;
    metrics?: Array<{
        label: string;
        value: string;
        trend: number;
    }>;
    description?: string;
    pros?: string[];
    cons?: string[];
}

function formatContent(content: any): string {
    if (Array.isArray(content)) {
        return content.map(item => `• ${item}`).join('\n');
    }
    if (typeof content === 'object') {
        return Object.entries(content)
            .map(([key, value]) => {
                const formattedKey = key.split('_').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ');
                return `### ${formattedKey}\n${formatContent(value)}`;
            })
            .join('\n\n');
    }
    return String(content);
}

function SectionHeader({ icon: Icon, title }: { icon: any; title: string }) {
    return (
        <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-primary/10 rounded-xl">
                <Icon className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
        </div>
    );
}

function ContentCard({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "bg-white rounded-xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow",
                className
            )}
        >
            {children}
        </motion.div>
    );
}

function AnalysisCard({ title, content, type, icon }: { title: string; content: any; type: string; icon: string }) {
    return (
        <ContentCard>
            <SectionHeader icon={icon} title={title} />
            <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-gray-700">
                    {formatContent(content)}
                </div>
            </div>
        </ContentCard>
    );
}

function SolutionCard({ solution, index }: { solution: MessageContent; index: number }) {
    return (
        <ContentCard>
            <SectionHeader icon={CheckCircle} title={`Solution ${index + 1}`} />
            <div className="space-y-6">
                <div>
                    <h3 className="font-medium text-gray-800 mb-2">Description</h3>
                    <p className="text-gray-600">{solution.description || solution.content}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h3 className="font-medium text-green-600 mb-2 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            Pros
                        </h3>
                        <ul className="space-y-2">
                            {solution.pros?.map((pro, idx) => (
                                <motion.li 
                                    key={idx}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="flex items-start gap-2 group"
                                >
                                    <ChevronRight className="w-4 h-4 text-green-600 mt-1 flex-shrink-0 transition-transform group-hover:translate-x-0.5" />
                                    <span className="text-gray-700">{pro}</span>
                                </motion.li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-medium text-red-600 mb-2 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            Cons
                        </h3>
                        <ul className="space-y-2">
                            {solution.cons?.map((con, idx) => (
                                <motion.li 
                                    key={idx}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="flex items-start gap-2 group"
                                >
                                    <ChevronRight className="w-4 h-4 text-red-600 mt-1 flex-shrink-0 transition-transform group-hover:translate-x-0.5" />
                                    <span className="text-gray-700">{con}</span>
                                </motion.li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </ContentCard>
    );
}

function MetricsCard({ metrics }: { metrics: any }) {
    return (
        <ContentCard>
            <SectionHeader icon={Search} title="Key Metrics" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {metrics.map((metric: any, index: number) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <div className="text-2xl font-bold text-primary mb-1">{metric.value}</div>
                        <div className="text-sm text-gray-600 mb-2">{metric.label}</div>
                        <div className={`text-lg ${metric.trend > 0 ? 'text-green-600' : metric.trend < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                            {metric.trend > 0 ? '↑' : metric.trend < 0 ? '↓' : '→'}
                        </div>
                    </motion.div>
                ))}
            </div>
        </ContentCard>
    );
}

export default function CaseSolverPage() {
    const [query, setQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [streamingMessage, setStreamingMessage] = useState('');
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
            setError('Failed to fetch message history');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim() || isLoading) return;

        setIsLoading(true);
        setError(null);
        setStreamingMessage('');
        setProgress(0);

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
                setMessages(prev => [{
                    id: Date.now().toString(),
                    role: 'user',
                    content: query,
                    created_at: new Date().toISOString()
                }, ...prev]);

                if (data.answer) {
                    let formattedContent = '';
                    
                    if (typeof data.answer === 'string') {
                        formattedContent = formatContent(data.answer);
                    } else if (data.answer.content) {
                        if (Array.isArray(data.answer.content)) {
                            formattedContent = data.answer.content.map((item: any) => formatContent(item)).join('\n\n');
                        } else if (data.answer.content.sections) {
                            formattedContent = data.answer.content.sections.map((section: any) => formatContent(section.content)).join('\n\n');
                        } else {
                            formattedContent = formatContent(data.answer.content);
                        }
                    } else {
                        formattedContent = formatContent(data.answer);
                    }
                    
                    setMessages(prev => [{
                        id: (Date.now() + 1).toString(),
                        role: 'assistant',
                        content: formattedContent,
                        created_at: new Date().toISOString()
                    }, ...prev]);
                }
                
                setQuery('');
                setProgress(100);
            } else {
                throw new Error(data.error || 'Failed to get response');
            }
        } catch (error) {
            console.error('Error during chat:', error);
            setError('An error occurred while processing your request');
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
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    return (
        <div className="container mx-auto p-4 max-w-4xl">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-center bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent mb-4">
                        Case Solver
                    </h1>
                    <Card className="border-gray-100 shadow-sm">
                        <CardContent className="pt-6">
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="flex gap-2">
                                    <Input
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        placeholder="Enter your case study or business problem..."
                                        className="flex-1 border-gray-200 focus:border-primary/50 focus:ring-primary/50"
                                        disabled={isLoading}
                                    />
                                    <Button 
                                        type="submit" 
                                        disabled={isLoading}
                                        className="bg-primary hover:bg-primary/90"
                                    >
                                        {isLoading ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Send className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </motion.div>

            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        <Alert variant="destructive" className="mb-6">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    </motion.div>
                )}
            </AnimatePresence>

            {isLoading && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <Card className="mb-6 border-gray-100 shadow-sm">
                        <CardContent className="pt-6">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-700">Analysis Progress</span>
                                    <span className="text-sm text-muted-foreground">{progress}%</span>
                                </div>
                                <Progress value={progress} className="h-2 bg-gray-100" />
                                {streamingMessage && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span>{streamingMessage}</span>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            <ScrollArea className="h-[600px] rounded-xl border border-gray-100 p-4">
                <div className="space-y-8">
                    {messages.map((message) => (
                        <motion.div
                            key={message.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`message ${message.role}`}
                        >
                            {message.role === 'assistant' ? (
                                <div className="space-y-6">
                                    {typeof message.content === 'string' && (
                                        <>
                                            {message.content.includes('Problem Statement') && (
                                                <AnalysisCard 
                                                    title="Problem Analysis" 
                                                    content={message.content} 
                                                    type="analysis"
                                                    icon="🔍"
                                                />
                                            )}
                                            {message.content.includes('Based on the case description') && (
                                                <AnalysisCard 
                                                    title="Key Factors Analysis" 
                                                    content={message.content} 
                                                    type="factors"
                                                    icon="⚖️"
                                                />
                                            )}
                                            {message.content.includes('Based on the business case provided') && (
                                                <AnalysisCard 
                                                    title="Constraints Analysis" 
                                                    content={message.content} 
                                                    type="constraints"
                                                    icon="⚠️"
                                                />
                                            )}
                                            {message.content.includes('Solution 1:') && (
                                                <div className="space-y-6">
                                                    <div className="flex items-center gap-3 mb-4">
                                                        <h2 className="text-xl font-semibold text-gray-800">Proposed Solutions</h2>
                                                        <p className="text-sm text-gray-500">Detailed analysis of potential approaches</p>
                                                    </div>
                                                    {message.content.split(/(?=Solution \d+:)/).map((solution, index) => (
                                                        <SolutionCard 
                                                            key={index} 
                                                            solution={{ content: solution, description: solution.split('Description:')[1]?.split('1.')[0]?.trim() || '' }} 
                                                            index={index}
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </>
                                    )}
                                    {typeof message.content !== 'string' && message.content.metrics && (
                                        <MetricsCard 
                                            metrics={message.content.metrics} 
                                        />
                                    )}
                                </div>
                            ) : (
                                <ContentCard>
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                            <span className="text-primary">👤</span>
                                        </div>
                                        <span className="text-sm font-medium text-gray-600">Your Input</span>
                                    </div>
                                    <div className="text-gray-700">
                                        {typeof message.content === 'string' ? message.content : message.content.content}
                                    </div>
                                </ContentCard>
                            )}
                        </motion.div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
            </ScrollArea>
        </div>
    );
} 