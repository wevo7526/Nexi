"use client";

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Send, CheckCircle, AlertCircle, Lightbulb, Target, TrendingUp, Users, Clock, DollarSign, CheckCircle2, ChevronRight, Search, BarChart3, ClipboardList, BookOpen, PlayCircle, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { supabase } from "../../lib/supabaseClient";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

interface ContentItem {
    type: string;
    title?: string;
    content?: string;
    section?: string;
}

interface ContentSectionProps {
    title: string;
    content: string;
    icon?: React.ElementType;
}

const SectionHeader = ({ title, icon: Icon }: { title: string; icon?: React.ElementType }) => (
    <div className="flex items-center gap-2 mb-2">
        {Icon && <Icon className="w-5 h-5 text-primary" />}
        <h3 className="text-lg font-semibold">{title}</h3>
    </div>
);

const ContentCard = ({ children }: { children: React.ReactNode }) => (
    <Card className="p-4 mb-4">
        {children}
    </Card>
);

const ContentSection = ({ title, content }: ContentSectionProps) => {
    const getIcon = () => {
        switch (title.toLowerCase()) {
            case 'key issue':
                return Target;
            case 'analysis':
                return BarChart3;
            case 'recommendations':
                return Lightbulb;
            case 'implementation':
                return PlayCircle;
            case 'survey objective':
                return Target;
            case 'target audience':
                return Users;
            case 'sample size':
                return BarChart3;
            case 'sampling method':
                return ClipboardList;
            case 'questions':
                return FileText;
            case 'response options':
                return CheckCircle;
            case 'analysis plan':
                return Lightbulb;
            default:
                return FileText;
        }
    };

    const renderContent = () => {
        if (Array.isArray(content)) {
            return (
                <ul className="list-disc list-inside space-y-2">
                    {content.map((item, index) => (
                        <li key={index} className="text-gray-700 dark:text-gray-300">
                            {item}
                        </li>
                    ))}
                </ul>
            );
        }
        return (
            <div className="prose dark:prose-invert max-w-none">
                {content.split('\n').map((line, index) => (
                    <p key={index} className="mb-2 text-gray-700 dark:text-gray-300">
                        {line}
                    </p>
                ))}
            </div>
        );
    };

    return (
        <ContentCard>
            <SectionHeader title={title} icon={getIcon()} />
            {renderContent()}
        </ContentCard>
    );
};

export const ReportContent = ({ content }: { content: any }) => {
    if (!content) return null;

    // Handle string content
    if (typeof content === 'string') {
        return <ContentSection title="Response" content={content} />;
    }

    // Handle array content
    if (Array.isArray(content)) {
        return (
            <div className="space-y-4">
                {content.map((item, index) => (
                    <ContentSection
                        key={index}
                        title={item.title || `Section ${index + 1}`}
                        content={item.content}
                    />
                ))}
            </div>
        );
    }

    // Handle survey data
    if (content.survey_objective || content.target_audience || content.questions) {
        return (
            <div className="space-y-4">
                <ContentSection
                    title="Survey Objective"
                    content={content.survey_objective}
                />
                <ContentSection
                    title="Target Audience"
                    content={content.target_audience}
                />
                {content.sample_size && (
                    <ContentSection
                        title="Sample Size"
                        content={content.sample_size}
                    />
                )}
                {content.sampling_method && (
                    <ContentSection
                        title="Sampling Method"
                        content={content.sampling_method}
                    />
                )}
                <ContentSection
                    title="Questions"
                    content={content.questions}
                />
                {content.response_options && content.response_options.length > 0 && (
                    <ContentSection
                        title="Response Options"
                        content={content.response_options}
                    />
                )}
                {content.analysis_plan && content.analysis_plan.length > 0 && (
                    <ContentSection
                        title="Analysis Plan"
                        content={content.analysis_plan}
                    />
                )}
            </div>
        );
    }

    // Handle object with sections
    if (content.sections && Array.isArray(content.sections)) {
        return (
            <div className="space-y-4">
                {content.sections.map((section: any, index: number) => (
                    <ContentSection
                        key={index}
                        title={section.title}
                        content={section.content}
                    />
                ))}
            </div>
        );
    }

    // Handle plain object
    return (
        <ContentSection
            title="Response"
            content={JSON.stringify(content, null, 2)}
        />
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
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Business Consultant</h1>
                <p className="text-muted-foreground">
                    Get expert business insights and recommendations tailored to your specific needs.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="mb-8">
                <div className="flex gap-4">
                    <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Ask your business question..."
                        className="flex-1"
                        disabled={isLoading}
                    />
                    <Button type="submit" disabled={isLoading}>
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

            {progress > 0 && (
                <Progress value={progress} className="mb-4" />
            )}

            {error && (
                <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <ScrollArea className="h-[600px] rounded-md border p-4">
                <div className="space-y-4">
                    {streamContent.map((item, index) => (
                        <ReportContent key={index} content={item.content} />
                    ))}
                    <div ref={messagesEndRef} />
                </div>
            </ScrollArea>
        </div>
    );
} 