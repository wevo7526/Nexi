"use client";

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Send, CheckCircle, AlertCircle, BookOpen, Users, ClipboardList, BarChart3, Clock, DollarSign, CheckCircle2, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

interface ResearchSection {
    title: string;
    content: string | string[];
}

interface ResearchResponse {
    content: {
        sections: ResearchSection[];
    };
    outputs: Array<{
        type: string;
        title: string;
        content: Record<string, any>;
    }>;
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

function StreamContent({ content, type }: { content: any; type: string }) {
    if (typeof content !== 'object' || content === null) return null;

    const sections = type === 'focus_group' ? content.sections : Object.entries(content);
    
    return (
        <div className="space-y-8">
            {sections.map((section: any, index: number) => {
                const [key, value] = type === 'focus_group' ? [section.title, section.content] : section;
                const Icon = sectionIcons[key as keyof typeof sectionIcons] || CheckCircle2;
                const sectionType = key.includes('timeline') ? 'timeline' : 
                                  key.includes('budget') ? 'budget' : 
                                  Array.isArray(value) ? 'list' : 'default';

                return (
                    <ContentSection
                        key={index}
                        title={key.split('_').map((word: string) => 
                            word.charAt(0).toUpperCase() + word.slice(1)
                        ).join(' ')}
                        content={value}
                        icon={Icon}
                        type={sectionType}
                    />
                );
            })}
        </div>
    );
}

export default function MultiAgentPage() {
    const [query, setQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [researchData, setResearchData] = useState<ResearchResponse | null>(null);
    const [streamContent, setStreamContent] = useState<Record<string, any>>({});
    const [progress, setProgress] = useState(0);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [streamContent, researchData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setIsLoading(true);
        setError(null);
        setStreamContent({});
        setProgress(0);

        try {
            const response = await fetch(`${BACKEND_URL}/api/multi-agent/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    query,
                })
            });

            if (!response.ok) throw new Error('Failed to fetch response');

            const reader = response.body?.getReader();
            if (!reader) throw new Error('No reader available');

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
                            
                            switch (data.type) {
                                case 'status':
                                    setStreamContent(prev => ({
                                        ...prev,
                                        status: data.content
                                    }));
                                    setProgress(prev => Math.min(prev + 20, 100));
                                    break;
                                case 'content':
                                    setStreamContent(prev => ({
                                        ...prev,
                                        [data.section]: data.content
                                    }));
                                    break;
                                case 'final':
                                    setResearchData(data.content);
                                    setProgress(100);
                                    break;
                                case 'error':
                                    setError(data.content);
                                    break;
                            }
                        } catch (e) {
                            console.error('Failed to parse server response:', e);
                            setError('Failed to parse server response');
                        }
                    }
                }
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-4 max-w-4xl">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <Card className="mb-6 border-gray-100 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold text-center bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                            Research Analysis Assistant
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="flex gap-2">
                                <Input
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Enter your research query..."
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
                                {streamContent.status && (
                                    <p className="text-sm text-muted-foreground">{streamContent.status}</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            <ScrollArea className="h-[600px] rounded-xl border border-gray-100 p-4">
                <div className="space-y-8">
                    {researchData?.content?.sections && (
                        <div className="space-y-8">
                            {researchData.content.sections.map((section, index) => (
                                <ContentSection
                                    key={index}
                                    title={section.title}
                                    content={section.content}
                                    icon={Users}
                                />
                            ))}
                        </div>
                    )}

                    {researchData?.outputs?.map((output, index) => (
                        <div key={index} className="space-y-6">
                            <h2 className="text-xl font-semibold text-primary">{output.title}</h2>
                            <StreamContent content={output.content} type={output.type} />
                        </div>
                    ))}

                    {Object.entries(streamContent).map(([key, value]) => (
                        key !== 'status' && (
                            <div key={key} className="space-y-4">
                                <h2 className="text-xl font-semibold text-primary capitalize">
                                    {key.replace('_', ' ')}
                                </h2>
                                <StreamContent 
                                    content={typeof value === 'string' ? JSON.parse(value) : value} 
                                    type={key}
                                />
                            </div>
                        )
                    ))}
                </div>
                <div ref={messagesEndRef} />
            </ScrollArea>
        </div>
    );
} 