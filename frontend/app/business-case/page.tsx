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
import { Loader2, Send, CheckCircle, AlertCircle, Search, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

interface Solution {
    description: string;
    pros: string[];
    cons: string[];
    implementation: string;
    timeline: string;
}

interface CaseAnalysis {
    problemStatement: string;
    keyFactors: string[];
    constraints: string[];
    solutions: Solution[];
    recommendation: {
        solution: string;
        implementation: string;
        timeline: string;
        successMetrics: string[];
    };
}

interface StreamResponse {
    type: 'stream' | 'complete' | 'error';
    content: any;
}

interface ContentItem {
    type: 'status' | 'analysis';
    content: string;
}

interface InteractiveCaseAnalysisProps {
    analysis: CaseAnalysis;
    activeTab: string;
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

function InteractiveCaseAnalysis({ analysis, activeTab }: InteractiveCaseAnalysisProps) {
    const [selectedSolution, setSelectedSolution] = useState<number | null>(null);

    return (
        <div className="space-y-8">
            {/* Problem Statement */}
            {activeTab === 'problem' && (
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <Search className="w-5 h-5 text-primary" />
                        <h2 className="text-xl font-medium">Problem Statement</h2>
                    </div>
                    <div className="bg-white rounded-lg p-6 border border-gray-100">
                        <p className="text-gray-700 text-base leading-relaxed">{analysis.problemStatement}</p>
                    </div>
                </div>
            )}

            {/* Key Factors */}
            {activeTab === 'factors' && (
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-primary" />
                        <h2 className="text-xl font-medium">Key Factors</h2>
                    </div>
                    <div className="space-y-3">
                        {analysis.keyFactors.map((factor: string, index: number) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-white rounded-lg p-4 border border-gray-100"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                                    <span className="text-gray-700 text-base">{factor}</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {/* Constraints */}
            {activeTab === 'constraints' && (
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                        <h2 className="text-xl font-medium">Constraints</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {analysis.constraints.map((constraint: string, index: number) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-white rounded-lg p-4 border border-red-100 hover:border-red-200 transition-colors"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="mt-1">
                                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                    </div>
                                    <span className="text-gray-700 text-base leading-relaxed">{constraint}</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {/* Solutions */}
            {activeTab === 'solutions' && (
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-primary" />
                        <h2 className="text-xl font-medium">Proposed Solutions</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {analysis.solutions.map((solution: Solution, index: number) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className={cn(
                                    "bg-white rounded-lg border transition-all cursor-pointer hover:shadow-md",
                                    selectedSolution === index
                                        ? "border-primary shadow-sm"
                                        : "border-gray-100"
                                )}
                                onClick={() => setSelectedSolution(selectedSolution === index ? null : index)}
                            >
                                <div className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                <span className="text-base font-medium text-primary">{index + 1}</span>
                                            </div>
                                            <h3 className="text-lg font-medium">Solution {index + 1}</h3>
                                        </div>
                                        <ChevronRight className={cn(
                                            "w-5 h-5 text-gray-400 transition-transform duration-200",
                                            selectedSolution === index ? "rotate-90" : "rotate-0"
                                        )} />
                                    </div>
                                    
                                    <div className="space-y-4">
                                        <p className="text-gray-600 text-base leading-relaxed">{solution.description}</p>
                                        
                                        {selectedSolution === index && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: "auto" }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="pt-4 border-t border-gray-100"
                                            >
                                                <div className="space-y-4">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                                                            <h4 className="text-sm font-medium text-green-600 mb-2">Pros</h4>
                                                            <ul className="space-y-2">
                                                                {solution.pros.map((pro: string, idx: number) => (
                                                                    <li key={idx} className="flex items-start gap-2 text-sm">
                                                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5"></div>
                                                                        <span className="text-gray-600">{pro}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                        <div className="bg-red-50 rounded-lg p-4 border border-red-100">
                                                            <h4 className="text-sm font-medium text-red-600 mb-2">Cons</h4>
                                                            <ul className="space-y-2">
                                                                {solution.cons.map((con: string, idx: number) => (
                                                                    <li key={idx} className="flex items-start gap-2 text-sm">
                                                                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5"></div>
                                                                        <span className="text-gray-600">{con}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                                                            <h4 className="text-sm font-medium text-gray-700 mb-2">Implementation</h4>
                                                            <p className="text-sm text-gray-600">{solution.implementation}</p>
                                                        </div>
                                                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                                                            <h4 className="text-sm font-medium text-gray-700 mb-2">Timeline</h4>
                                                            <p className="text-sm text-gray-600">{solution.timeline}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {/* Recommendation */}
            {activeTab === 'recommendation' && (
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-primary" />
                        <h2 className="text-xl font-medium">Final Recommendation</h2>
                    </div>
                    <div className="space-y-6">
                        <div className="bg-primary/5 rounded-lg p-6 border border-primary/10">
                            <h3 className="text-lg font-medium mb-3">Recommended Solution</h3>
                            <p className="text-gray-700 text-base leading-relaxed">{analysis.recommendation.solution}</p>
                        </div>

                        <div className="bg-white rounded-lg p-6 border border-gray-100">
                            <h3 className="text-lg font-medium mb-3">Implementation Plan</h3>
                            <p className="text-gray-600 text-base leading-relaxed">{analysis.recommendation.implementation}</p>
                        </div>

                        <div className="bg-white rounded-lg p-6 border border-gray-100">
                            <h3 className="text-lg font-medium mb-3">Timeline</h3>
                            <p className="text-gray-600 text-base leading-relaxed">{analysis.recommendation.timeline}</p>
                        </div>

                        <div className="bg-white rounded-lg p-6 border border-gray-100">
                            <h3 className="text-lg font-medium mb-4">Success Metrics</h3>
                            <div className="space-y-3">
                                {analysis.recommendation.successMetrics.map((metric: string, index: number) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="flex items-center gap-3 text-base"
                                    >
                                        <div className="w-2 h-2 rounded-full bg-primary"></div>
                                        <span className="text-gray-600">{metric}</span>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function BusinessCasePage() {
    const [query, setQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);
    const [streamContent, setStreamContent] = useState<ContentItem[]>([]);
    const [analysis, setAnalysis] = useState<CaseAnalysis | null>(null);
    const [activeTab, setActiveTab] = useState('problem');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const { user } = useAuth();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [streamContent, analysis]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setIsLoading(true);
        setError(null);
        setStreamContent([]);
        setProgress(0);
        setAnalysis(null);

        try {
            const response = await fetch(`${BACKEND_URL}/api/business-case/stream_case_solution`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    case_text: query,
                    user_id: user?.id
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to start case analysis');
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
                            const data: StreamResponse = JSON.parse(line.slice(6));
                            
                            if (data.type === 'stream') {
                                setStreamContent(prev => [
                                    ...prev,
                                    {
                                        type: 'status',
                                        content: data.content
                                    }
                                ]);
                                setProgress(prev => Math.min(prev + 20, 90));
                            } else if (data.type === 'complete') {
                                if (data.content && data.content.analysis) {
                                    setAnalysis(data.content.analysis);
                                }
                                setProgress(100);
                                setStreamContent([]);
                                setIsLoading(false);
                            } else if (data.type === 'error') {
                                setError(data.content);
                                setIsLoading(false);
                            }
                        } catch (err) {
                            console.error('Error parsing SSE data:', err);
                            setError('Failed to parse server response');
                            setIsLoading(false);
                        }
                    }
                }
            }
        } catch (err) {
            console.error('Error in handleSubmit:', err);
            setError(err instanceof Error ? err.message : 'Failed to process business case');
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto px-8 py-8 max-w-[1200px]">
                {/* Header Section */}
                <div className="mb-8">
                    <h1 className="text-2xl font-semibold text-center text-gray-800 mb-6">
                        Business Case Analysis
                    </h1>
                    <div className="bg-white rounded-lg border border-gray-100 p-6">
                        <form onSubmit={handleSubmit}>
                            <div className="relative">
                                <textarea
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Enter your business case..."
                                    className="w-full min-h-[120px] p-6 rounded-lg border border-gray-200 focus:border-primary/50 focus:ring-primary/50 text-base resize-none"
                                    disabled={isLoading}
                                />
                                <div className="absolute bottom-6 right-6">
                                    <Button 
                                        type="submit" 
                                        disabled={isLoading}
                                        className="bg-primary hover:bg-primary/90 px-6 h-10"
                                    >
                                        {isLoading ? (
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                        ) : (
                                            <Send className="h-5 w-5" />
                                        )}
                                    </Button>
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
                        <div className="bg-white rounded-lg border border-gray-100 p-6">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-700">Analysis Progress</span>
                                    <span className="text-sm text-gray-500">{progress}%</span>
                                </div>
                                <Progress value={progress} className="h-1 bg-gray-100" />
                                {streamContent.map((item, index) => (
                                    item.type === 'status' && (
                                        <div key={index} className="flex items-center gap-2 text-sm text-gray-500">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            <span>{item.content}</span>
                                        </div>
                                    )
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Main Content Area */}
                {analysis && (
                    <div className="space-y-8">
                        {/* Navigation Sidebar */}
                        <div className="bg-white rounded-lg border border-gray-100 p-4">
                            <div className="flex gap-4 overflow-x-auto pb-2">
                                {['problem', 'factors', 'constraints', 'solutions', 'recommendation'].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={cn(
                                            "px-6 py-2.5 text-sm font-medium transition-colors rounded-md whitespace-nowrap",
                                            activeTab === tab
                                                ? "bg-primary/10 text-primary"
                                                : "text-gray-600 hover:bg-gray-50"
                                        )}
                                    >
                                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Analysis Content */}
                        <div className="bg-white rounded-lg border border-gray-100 p-8">
                            <InteractiveCaseAnalysis analysis={analysis} activeTab={activeTab} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
} 