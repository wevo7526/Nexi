"use client";

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Send, CheckCircle, AlertCircle, BookOpen, Users, ClipboardList, BarChart3, Clock, DollarSign, CheckCircle2, ChevronRight, Bot, User } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

interface ResearchSection {
    title: string;
    content: string;
    type: 'research';
}

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
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

const sectionIcons = {
    research_objectives: BookOpen,
    methodology: ClipboardList,
    sample_design: Users,
    timeline: Clock,
    budget_considerations: DollarSign,
    survey_questions: ClipboardList,
    response_scales: BarChart3,
    survey_flow: Clock,
    quality_controls: CheckCircle2,
    analysis_methods: BarChart3,
    key_metrics: BarChart3,
    visualization_plan: BarChart3,
    reporting_template: BookOpen
};

export default function MultiAgentPage() {
    const [query, setQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState('');
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [researchData, setResearchData] = useState<ResearchSection[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [researchData, chatHistory]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setIsLoading(true);
        setError(null);
        setStatus('Initializing research assistant...');

        // Add user message to chat
        const userMessage: ChatMessage = { role: 'user', content: query };
        setChatHistory(prev => [...prev, userMessage]);

        try {
            // Send query to backend
            const response = await fetch(`${BACKEND_URL}/api/multi-agent/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query,
                    chat_history: chatHistory,
                    user_id: 'anonymous'
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Handle streaming response
            const reader = response.body?.getReader();
            if (!reader) {
                throw new Error('No reader available');
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
                        const data = line.slice(6);
                        if (data === '[DONE]') {
                            setIsLoading(false);
                            continue;
                        }

                        try {
                            const parsedData = JSON.parse(data);
                            console.log('Received data:', parsedData);
                            
                            if (parsedData.type === 'status') {
                                setStatus(parsedData.content);
                            } else if (parsedData.type === 'research') {
                                const sectionContent = JSON.parse(parsedData.content);
                                const sectionData: ResearchSection = {
                                    title: sectionContent.title,
                                    content: Array.isArray(sectionContent.content) ? sectionContent.content.join('\n\n') : sectionContent.content,
                                    type: 'research'
                                };

                                setResearchData(prev => [...prev, sectionData]);
                                
                                setChatHistory(prev => [...prev, {
                                    role: 'assistant',
                                    content: `Research section: ${sectionData.title}\n${sectionData.content}`
                                }]);
                            }
                        } catch (e) {
                            console.error('Error parsing SSE data:', e);
                            setError('Error processing response from server');
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error:', error);
            setError(error instanceof Error ? error.message : 'An error occurred');
        } finally {
            setIsLoading(false);
            setStatus('');
        }
    };

    return (
        <div className="container mx-auto p-4 max-w-5xl">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-6"
            >
                <div className="text-center">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent mb-2">
                        Research Assistant
                    </h1>
                    <p className="text-gray-500 max-w-2xl mx-auto">
                        Ask questions about research methodology, study design, or data analysis to get comprehensive research guidance.
                    </p>
                </div>

                <Card className="border-gray-100 shadow-sm overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b border-gray-100">
                        <CardTitle className="text-xl font-semibold">Research Query</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="flex gap-4">
                                <Input
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Enter your research query (e.g., 'How to design a survey for customer satisfaction?')"
                                    className="flex-1"
                                    disabled={isLoading}
                                />
                                <Button type="submit" disabled={isLoading} className="min-w-[120px]">
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Processing
                                        </>
                                    ) : (
                                        <>
                                            <Send className="mr-2 h-4 w-4" />
                                            Send
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {status && (
                    <Alert className="mb-4 border-l-4 border-primary">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        <AlertDescription className="ml-2">{status}</AlertDescription>
                    </Alert>
                )}

                {error && (
                    <Alert variant="destructive" className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="ml-2">{error}</AlertDescription>
                    </Alert>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1">
                        <Card className="border-gray-100 shadow-sm h-full">
                            <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b border-gray-100">
                                <CardTitle className="text-xl font-semibold">Chat History</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div ref={scrollRef} className="h-[600px] overflow-auto p-4">
                                    <div className="space-y-4">
                                        {chatHistory.length === 0 ? (
                                            <div className="text-center text-gray-500 py-8">
                                                <Bot className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                                                <p>Start a conversation by asking a research question</p>
                                            </div>
                                        ) : (
                                            chatHistory.map((message, index) => (
                                                <motion.div
                                                    key={index}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className={cn(
                                                        "p-4 rounded-lg flex gap-3",
                                                        message.role === 'user'
                                                            ? "bg-primary/10 ml-auto"
                                                            : "bg-gray-100"
                                                    )}
                                                >
                                                    <div className="flex-shrink-0">
                                                        {message.role === 'user' ? (
                                                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                                                                <User className="h-4 w-4 text-primary" />
                                                            </div>
                                                        ) : (
                                                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                                                                <Bot className="h-4 w-4 text-gray-600" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                                                    </div>
                                                </motion.div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                    
                    <div className="lg:col-span-2">
                        <Card className="border-gray-100 shadow-sm h-full">
                            <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b border-gray-100">
                                <CardTitle className="text-xl font-semibold">Research Sections</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="h-[600px] overflow-auto p-4">
                                    {researchData.length === 0 ? (
                                        <div className="text-center text-gray-500 py-8">
                                            <BookOpen className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                                            <p>Research sections will appear here as they are generated</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            {researchData.map((section, index) => (
                                                <ContentCard key={index}>
                                                    <SectionHeader 
                                                        icon={sectionIcons[section.title.toLowerCase().replace(/\s+/g, '_') as keyof typeof sectionIcons] || CheckCircle2} 
                                                        title={section.title} 
                                                    />
                                                    <div className="prose prose-sm max-w-none">
                                                        <div className="whitespace-pre-wrap text-gray-700">
                                                            {section.content}
                                                        </div>
                                                    </div>
                                                </ContentCard>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </motion.div>
        </div>
    );
} 