"use client";

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Send, CheckCircle, AlertCircle, BookOpen, Users, ClipboardList, BarChart3, Clock, DollarSign, CheckCircle2, ChevronRight, Search, Bot, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

interface ResearchSection {
    title: string;
    content: string | string[];
    type: string;
}

interface ResearchResponse {
    type: string;
    content: string | ResearchSection[];
}

interface ContentItem {
    type: string;
    title?: string;
    content?: string;
    section?: string;
}

interface ContentSectionProps {
    title: string;
    content: string;
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

function TimelineItem({ title, content }: { title: string; content: string }) {
    return (
        <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex gap-4 mb-4"
        >
            <div className="flex flex-col items-center">
                <div className="w-2.5 h-2.5 bg-primary rounded-full ring-2 ring-primary/20" />
                <div className="w-px h-full bg-gradient-to-b from-primary/20 to-transparent" />
            </div>
            <div className="flex-1 pb-4">
                <h3 className="font-medium text-gray-800 mb-1.5">{title}</h3>
                <p className="text-gray-600 leading-relaxed">{content}</p>
            </div>
        </motion.div>
    );
}

function BudgetItem({ title, amount, description }: { title: string; amount: string; description?: string }) {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl mb-2 border border-gray-100 hover:border-primary/20 transition-colors"
        >
            <div>
                <h3 className="font-medium text-gray-800">{title}</h3>
                {description && <p className="text-sm text-gray-600 mt-1">{description}</p>}
            </div>
            <span className="font-semibold text-primary bg-primary/10 px-3 py-1 rounded-lg">{amount}</span>
        </motion.div>
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

function ContentSection({ 
    title, 
    content, 
    icon: Icon = CheckCircle2,
    type = 'default'
}: { 
    title: string; 
    content: any; 
    icon?: any;
    type?: 'timeline' | 'budget' | 'list' | 'default';
}) {
    return (
        <ContentCard>
            <SectionHeader icon={Icon} title={title} />
            {type === 'timeline' && Array.isArray(content) ? (
                <div className="space-y-2">
                    {content.map((item, index) => (
                        <TimelineItem 
                            key={index}
                            title={item.split(':')[0]}
                            content={item.split(':')[1]}
                        />
                    ))}
                </div>
            ) : type === 'budget' && Array.isArray(content) ? (
                <div className="space-y-2">
                    {content.map((item, index) => {
                        const [title, amount] = item.split(':');
                        return (
                            <BudgetItem 
                                key={index}
                                title={title}
                                amount={amount}
                            />
                        );
                    })}
                </div>
            ) : Array.isArray(content) ? (
                <ul className="space-y-3">
                    {content.map((item, index) => (
                        <motion.li 
                            key={index} 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-start gap-2 group"
                        >
                            <ChevronRight className="w-4 h-4 text-primary mt-1 flex-shrink-0 transition-transform group-hover:translate-x-0.5" />
                            <span className="text-gray-700 leading-relaxed">{item}</span>
                        </motion.li>
                    ))}
                </ul>
            ) : (
                <div className="prose prose-sm max-w-none">
                    <div className="whitespace-pre-wrap text-gray-700">
                        {String(content)}
                    </div>
                </div>
            )}
        </ContentCard>
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

export const ReportSection = ({ title, content }: ContentSectionProps) => (
    <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">{title}</h2>
        <div className="prose max-w-none">
            {content}
        </div>
    </div>
);

export const ReportContent = ({ content }: { content: any }) => {
    // Handle the case where content is a string
    if (typeof content === 'string') {
        return (
            <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-gray-700">
                    {content}
                </div>
            </div>
        );
    }

    // Handle the case where content is an array
    if (Array.isArray(content)) {
        return (
            <ul className="space-y-3">
                {content.map((item, index) => (
                    <motion.li 
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-start gap-2 group"
                    >
                        <ChevronRight className="w-4 h-4 text-primary mt-1 flex-shrink-0 transition-transform group-hover:translate-x-0.5" />
                        <span className="text-gray-700 leading-relaxed">{String(item)}</span>
                    </motion.li>
                ))}
            </ul>
        );
    }

    // Handle the case where content is an object with sections
    if (content && typeof content === 'object' && 'sections' in content) {
        return (
            <div className="space-y-6">
                {content.sections.map((section: any, index: number) => (
                    <ContentCard key={index}>
                        <SectionHeader 
                            icon={sectionIcons[section.title?.toLowerCase().replace(/\s+/g, '_') as keyof typeof sectionIcons] || CheckCircle2} 
                            title={section.title || 'Section'} 
                        />
                        {Array.isArray(section.content) ? (
                            <ul className="space-y-3">
                                {section.content.map((item: string, listIndex: number) => (
                                    <motion.li 
                                        key={listIndex}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: listIndex * 0.1 }}
                                        className="flex items-start gap-2 group"
                                    >
                                        <ChevronRight className="w-4 h-4 text-primary mt-1 flex-shrink-0 transition-transform group-hover:translate-x-0.5" />
                                        <span className="text-gray-700 leading-relaxed">{item}</span>
                                    </motion.li>
                                ))}
                            </ul>
                        ) : (
                            <div className="prose prose-sm max-w-none">
                                <div className="whitespace-pre-wrap text-gray-700">
                                    {String(section.content)}
                                </div>
                            </div>
                        )}
                    </ContentCard>
                ))}
            </div>
        );
    }

    // Handle the case where content is a plain object
    if (content && typeof content === 'object') {
        return (
            <div className="space-y-4">
                {Object.entries(content).map(([key, value], index) => (
                    <div key={index} className="space-y-2">
                        <h3 className="font-medium text-gray-800">
                            {key.split('_').map(word => 
                                word.charAt(0).toUpperCase() + word.slice(1)
                            ).join(' ')}
                        </h3>
                        <div className="text-gray-600">
                            {Array.isArray(value) ? (
                                <ul className="list-disc list-inside space-y-1">
                                    {value.map((item: string, listIndex: number) => (
                                        <li key={listIndex}>{String(item)}</li>
                                    ))}
                                </ul>
                            ) : (
                                <p>{String(value)}</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    // Fallback for any other type of content
    return (
        <div className="prose prose-sm max-w-none">
            <div className="whitespace-pre-wrap text-gray-700">
                {String(content)}
            </div>
        </div>
    );
};

export default function ResearchAssistant() {
    const [query, setQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [researchData, setResearchData] = useState<ResearchSection[]>([]);
    const [status, setStatus] = useState<string>('');
    const scrollRef = useRef<HTMLDivElement>(null);
    const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [researchData, chatHistory]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim() || isLoading) return;

        setIsLoading(true);
        setError(null);
        setResearchData([]);
        setStatus('');

        // Add user message to chat history
        setChatHistory(prev => [...prev, { role: 'user', content: query }]);

        try {
            // Check if backend is running
            try {
                const healthCheck = await fetch('/api/health', { method: 'GET' });
                if (!healthCheck.ok) {
                    throw new Error('Backend service is not available');
                }
            } catch (e) {
                console.error('Backend health check failed:', e);
                setError('Backend service is not available. Please try again later.');
                setIsLoading(false);
                return;
            }

            const response = await fetch('/api/multi-agent/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query,
                    chat_history: chatHistory,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('API error:', errorData);
                throw new Error(`Failed to get response: ${response.status} ${response.statusText}`);
            }

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
                            console.log('Received [DONE] message, completing stream');
                            setIsLoading(false);
                            continue;
                        }

                        try {
                            const parsed = JSON.parse(data);
                            
                            if (parsed.type === 'status') {
                                setStatus(parsed.content);
                            } else if (parsed.type === 'research') {
                                try {
                                    // Log the raw content for debugging
                                    console.log('Raw research content:', parsed.content);
                                    
                                    // Parse the content if it's a string
                                    let content;
                                    if (typeof parsed.content === 'string') {
                                        try {
                                            content = JSON.parse(parsed.content);
                                            console.log('Parsed research content:', content);
                                        } catch (parseError) {
                                            console.error('Error parsing research content as JSON:', parseError);
                                            // If parsing fails, use the string content directly
                                            content = {
                                                title: parsed.section || 'Section',
                                                content: parsed.content
                                            };
                                        }
                                    } else {
                                        content = parsed.content;
                                    }
                                    
                                    // Create a ResearchSection object
                                    const section: ResearchSection = {
                                        title: content.title || parsed.section || 'Section',
                                        content: content.content || '',
                                        type: 'research'
                                    };
                                    
                                    console.log('Adding research section:', section);
                                    setResearchData(prev => [...prev, section]);
                                } catch (e) {
                                    console.error('Error processing research content:', e);
                                    setError('Error processing research content: ' + (e instanceof Error ? e.message : String(e)));
                                }
                            } else if (parsed.type === 'error') {
                                console.error('Received error from server:', parsed.content);
                                setError(parsed.content);
                                setIsLoading(false);
                            } else if (parsed.type === 'final') {
                                console.log('Received final message:', parsed.content);
                                // Process final content if needed
                                setIsLoading(false);
                            }
                        } catch (e) {
                            console.error('Error parsing SSE data:', e);
                        }
                    }
                }
            }

            // If we've reached here and isLoading is still true, set it to false
            if (isLoading) {
                console.log('Stream completed but isLoading is still true, setting to false');
                setIsLoading(false);
            }

            // Add assistant response to chat history
            if (researchData.length > 0) {
                console.log('Updating chat history with research data');
                setChatHistory(prev => [...prev, { 
                    role: 'assistant', 
                    content: researchData.map(section => `${section.title}\n${section.content}`).join('\n\n')
                }]);
            } else {
                console.log('No research data to add to chat history');
            }

        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-4 max-w-4xl">
            <div className="flex flex-col h-[calc(100vh-2rem)]">
                <div className="mb-4">
                    <h1 className="text-2xl font-bold text-center mb-4">Research Assistant</h1>
                    <form onSubmit={handleSubmit} className="flex gap-2">
                        <Input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Ask about research design, methodology, or analysis..."
                            disabled={isLoading}
                            className="flex-1"
                        />
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Send className="w-4 h-4" />
                            )}
                        </Button>
                    </form>
                </div>
                
                <div className="flex-1 overflow-hidden">
                    <div ref={scrollRef} className="h-full overflow-auto">
                        <div className="space-y-4 p-4">
                            <AnimatePresence>
                                {chatHistory.map((message, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        className={cn(
                                            "flex items-start gap-3 p-4 rounded-lg",
                                            message.role === 'user' ? "bg-primary/10" : "bg-secondary/10"
                                        )}
                                    >
                                        {message.role === 'user' ? (
                                            <User className="w-6 h-6 text-primary" />
                                        ) : (
                                            <Bot className="w-6 h-6 text-secondary" />
                                        )}
                                        <div className="flex-1 space-y-2">
                                            <p className="text-sm text-muted-foreground">
                                                {message.role === 'user' ? 'You' : 'Research Assistant'}
                                            </p>
                                            <div className="prose prose-sm max-w-none">
                                                {message.content}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            {isLoading && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex items-center justify-center p-4"
                                >
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                    <span className="ml-2">{status || 'Processing...'}</span>
                                </motion.div>
                            )}

                            {error && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="p-4 bg-destructive/10 text-destructive rounded-lg"
                                >
                                    {error}
                                </motion.div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 