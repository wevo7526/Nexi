"use client";

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Send, CheckCircle, AlertCircle, Lightbulb, Target, TrendingUp, Users, Clock, DollarSign, CheckCircle2, ChevronRight, Search, BarChart3, ClipboardList, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { supabase } from "../../lib/supabaseClient";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

interface ContentItem {
    type: string;
    title?: string;
    content?: any;
    section?: string;
}

interface ContentSectionProps {
    title: string;
    content: any;
    icon?: any;
    type?: 'timeline' | 'budget' | 'list' | 'default';
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

function ContentSection({ 
    title, 
    content, 
    icon: Icon = CheckCircle2,
    type = 'default'
}: ContentSectionProps) {
    return (
        <ContentCard>
            <SectionHeader icon={Icon} title={title} />
            {Array.isArray(content) ? (
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
    problem_analysis: Lightbulb,
    market_research: Search,
    competitive_analysis: Target,
    growth_strategy: TrendingUp,
    team_structure: Users,
    timeline: Clock,
    budget: DollarSign,
    metrics: BarChart3,
    implementation: ClipboardList,
    recommendations: CheckCircle2,
    next_steps: BookOpen
};

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

export default function ConsultantPage() {
    const [query, setQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [streamContent, setStreamContent] = useState<ContentItem[]>([]);
    const [progress, setProgress] = useState(0);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [streamContent]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setIsLoading(true);
        setError(null);
        setStreamContent([]);
        setProgress(0);

        try {
            // Get the current session
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            
            if (sessionError || !session) {
                setError('Please log in to continue');
                return;
            }

            const response = await fetch(`${BACKEND_URL}/api/get_answer`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    query,
                    user_id: session.user.id,
                    chat_history: []
                })
            });

            if (response.status === 401) {
                setError('Session expired. Please log in again.');
                // Optionally redirect to login page
                return;
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to fetch response');
            }

            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'Failed to get answer');
            }

            // Structure the response for display
            const answer = data.answer;
            if (answer && answer.outputs) {
                answer.outputs.forEach((output: any) => {
                    if (output.type === 'analysis' && output.content) {
                        setStreamContent(prev => [
                            ...prev,
                            {
                                type: 'content',
                                title: output.title,
                                content: output.content
                            }
                        ]);
                    }
                });
            }

            setProgress(100);
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
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-center bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent mb-4">
                        Business Strategy Consultant
                    </h1>
                    <Card className="border-gray-100 shadow-sm">
                        <CardContent className="pt-6">
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="flex gap-2">
                                    <Input
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        placeholder="Describe your business challenge..."
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
                                {streamContent.find(item => item.type === 'status')?.content && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span>{streamContent.find(item => item.type === 'status')?.content}</span>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            <ScrollArea className="h-[600px] rounded-xl border border-gray-100 p-4">
                <div className="space-y-8">
                    {streamContent.filter(item => item.type === 'content').map((item, index) => (
                        <div key={index} className="space-y-4">
                            <h2 className="text-xl font-semibold text-primary capitalize">
                                {item.title?.replace('_', ' ')}
                            </h2>
                            <ReportContent content={item.content} />
                        </div>
                    ))}
                </div>
                <div ref={messagesEndRef} />
            </ScrollArea>
        </div>
    );
} 