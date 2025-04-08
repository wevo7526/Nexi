"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Send, Search, Brain, Target, CheckCircle, AlertCircle, BarChart, TrendingUp, Users, Globe, BarChart3, Lightbulb, FileText, CheckCircle2, Clock, DollarSign, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

interface ResearchSection {
    id: string;
    title: string;
    content: string;
    icon: any;
    color: string;
    timestamp: number;
    type: 'exploratory' | 'descriptive' | 'predictive' | 'methodology' | 'recommendations';
}

const sectionIcons = {
    exploratory: TrendingUp,
    descriptive: BarChart3,
    predictive: Lightbulb,
    methodology: FileText,
    recommendations: CheckCircle2
};

const sectionColors = {
    exploratory: 'blue',
    descriptive: 'green',
    predictive: 'purple',
    methodology: 'orange',
    recommendations: 'indigo'
};

export default function MarketResearchPage() {
    const [query, setQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [streamContent, setStreamContent] = useState<ResearchSection[]>([]);
    const [progress, setProgress] = useState(0);
    const [currentSection, setCurrentSection] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<string>('all');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const { user } = useAuth();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [streamContent]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setStreamContent([]);
        setProgress(0);
        setCurrentSection(null);

        try {
            const response = await fetch(`${BACKEND_URL}/api/market-research/research`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    query,
                    user_id: user?.id
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to start market research');
            }

            const reader = response.body?.getReader();
            if (!reader) {
                throw new Error('Failed to initialize stream reader');
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
                        try {
                            const data = JSON.parse(line.slice(6));
                            
                            if (data.type === 'thought') {
                                setCurrentSection('analysis');
                                setStreamContent(prev => {
                                    const existingSection = prev.find(s => s.title === 'Research Analysis');
                                    if (existingSection) {
                                        return prev.map(s => 
                                            s.id === existingSection.id 
                                                ? { ...s, content: s.content + '\n' + data.content }
                                                : s
                                        );
                                    }
                                    return [...prev, {
                                        id: `analysis-${Date.now()}`,
                                        title: 'Research Analysis',
                                        content: data.content,
                                        icon: Search,
                                        color: 'blue',
                                        timestamp: Date.now(),
                                        type: 'methodology'
                                    }];
                                });
                                setProgress(prev => Math.min(prev + 10, 80));
                            }
                            else if (data.type === 'action') {
                                setCurrentSection('research');
                                setStreamContent(prev => {
                                    const existingSection = prev.find(s => s.title === 'Research Action');
                                    if (existingSection) {
                                        return prev.map(s => 
                                            s.id === existingSection.id 
                                                ? { ...s, content: s.content + '\n' + data.content }
                                                : s
                                        );
                                    }
                                    return [...prev, {
                                        id: `research-${Date.now()}`,
                                        title: 'Research Action',
                                        content: data.content,
                                        icon: Target,
                                        color: 'green',
                                        timestamp: Date.now(),
                                        type: 'methodology'
                                    }];
                                });
                                setProgress(prev => Math.min(prev + 20, 80));
                            }
                            else if (data.type === 'observation') {
                                setCurrentSection('findings');
                                setStreamContent(prev => {
                                    const existingSection = prev.find(s => s.title === 'Research Findings');
                                    if (existingSection) {
                                        return prev.map(s => 
                                            s.id === existingSection.id 
                                                ? { ...s, content: s.content + '\n' + data.content }
                                                : s
                                        );
                                    }
                                    return [...prev, {
                                        id: `findings-${Date.now()}`,
                                        title: 'Research Findings',
                                        content: data.content,
                                        icon: BarChart3,
                                        color: 'purple',
                                        timestamp: Date.now(),
                                        type: 'descriptive'
                                    }];
                                });
                                setProgress(prev => Math.min(prev + 15, 80));
                            }
                            else if (data.type === 'final') {
                                setCurrentSection('final');
                                setStreamContent(prev => {
                                    const existingSection = prev.find(s => s.title === 'Final Analysis');
                                    if (existingSection) {
                                        return prev.map(s => 
                                            s.id === existingSection.id 
                                                ? { ...s, content: s.content + '\n' + data.content }
                                                : s
                                        );
                                    }
                                    return [...prev, {
                                        id: `final-${Date.now()}`,
                                        title: 'Final Analysis',
                                        content: data.content,
                                        icon: CheckCircle2,
                                        color: 'indigo',
                                        timestamp: Date.now(),
                                        type: 'recommendations'
                                    }];
                                });
                                setProgress(100);
                                setIsLoading(false);
                            }
                        } catch (err) {
                            console.error('Error parsing SSE data:', err);
                        }
                    }
                }
            }
        } catch (err) {
            console.error('Error in handleSubmit:', err);
            setError(err instanceof Error ? err.message : 'Failed to process market research');
            setIsLoading(false);
        }
    };

    const filteredContent = activeTab === 'all' 
        ? streamContent 
        : streamContent.filter(section => section.type === activeTab);

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto px-8 py-8 max-w-[1600px]">
                {/* Header Section */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">
                        Market Research Analysis
                    </h1>
                    <div className="bg-white rounded-xl border border-gray-100 p-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label htmlFor="query" className="block text-lg font-medium text-gray-900 mb-2">
                                    What market would you like to research?
                                </label>
                                <div className="relative">
                                    <textarea
                                        id="query"
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        placeholder="Describe the market, industry, or specific aspect you want to research..."
                                        className="w-full min-h-[120px] p-6 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary/50 focus:border-primary/50 text-base resize-none"
                                        disabled={isLoading}
                                    />
                                    <div className="absolute bottom-6 right-6">
                                        <Button 
                                            type="submit" 
                                            disabled={isLoading || !query.trim()}
                                            className="inline-flex items-center px-6 py-3 rounded-lg text-base font-medium bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md"
                                        >
                                            {isLoading ? (
                                                <>
                                                    <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                                                    <span>Researching...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Send className="w-5 h-5 mr-2" />
                                                    <span>Start Research</span>
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Error Alert */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="mb-6"
                        >
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Loading State */}
                {isLoading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="mb-6"
                    >
                        <div className="bg-white rounded-xl border border-gray-100 p-6">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-700">Research Progress</span>
                                    <span className="text-sm text-gray-500">{progress}%</span>
                                </div>
                                <Progress value={progress} className="h-1 bg-gray-100" />
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Research Results */}
                {streamContent.length > 0 && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-semibold">Research Results</h2>
                            <div className="flex gap-2">
                                <Button 
                                    variant={activeTab === 'all' ? 'default' : 'outline'}
                                    onClick={() => setActiveTab('all')}
                                >
                                    All
                                </Button>
                                <Button 
                                    variant={activeTab === 'exploratory' ? 'default' : 'outline'}
                                    onClick={() => setActiveTab('exploratory')}
                                >
                                    Exploratory
                                </Button>
                                <Button 
                                    variant={activeTab === 'descriptive' ? 'default' : 'outline'}
                                    onClick={() => setActiveTab('descriptive')}
                                >
                                    Descriptive
                                </Button>
                                <Button 
                                    variant={activeTab === 'predictive' ? 'default' : 'outline'}
                                    onClick={() => setActiveTab('predictive')}
                                >
                                    Predictive
                                </Button>
                                <Button 
                                    variant={activeTab === 'recommendations' ? 'default' : 'outline'}
                                    onClick={() => setActiveTab('recommendations')}
                                >
                                    Recommendations
                                </Button>
                                <Button onClick={() => setStreamContent([])}>Start New Research</Button>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {filteredContent.map((section, index) => (
                                <motion.div
                                    key={section.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <Card className="border-l-4 border-l-blue-500">
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                                <section.icon className={`h-5 w-5 text-${section.color}-500`} />
                                                {section.title}
                                            </CardTitle>
                                            <div className="text-sm text-gray-500">
                                                {new Date(section.timestamp).toLocaleTimeString()}
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="prose prose-sm max-w-none">
                                                <div className="space-y-4">
                                                    {section.content.split('\n').map((paragraph, idx) => (
                                                        <motion.p
                                                            key={idx}
                                                            initial={{ opacity: 0, x: -20 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ delay: idx * 0.1 }}
                                                            className="text-gray-600"
                                                        >
                                                            {paragraph}
                                                        </motion.p>
                                                    ))}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
} 