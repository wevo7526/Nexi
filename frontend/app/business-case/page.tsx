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
            <div className="bg-white rounded-xl p-6 border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Search className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="text-lg font-semibold">Problem Statement</h2>
                </div>
                <p className="text-gray-600 leading-relaxed max-w-[1200px]">{analysis.problemStatement}</p>
            </div>

            {/* Key Factors */}
            <div className="bg-white rounded-xl p-6 border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="text-lg font-semibold">Key Factors</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {analysis.keyFactors.map((factor, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2"></div>
                            <span className="text-gray-600 text-sm">{factor}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Solutions */}
            <div className="bg-white rounded-xl p-6 border border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="text-lg font-semibold">Proposed Solutions</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {analysis.solutions.map((solution, idx) => (
                        <div
                            key={idx}
                            className={cn(
                                "group relative rounded-lg border transition-all duration-200",
                                selectedSolution === idx
                                    ? "border-primary bg-primary/5"
                                    : "border-gray-200 hover:border-primary/50 hover:bg-gray-50"
                            )}
                        >
                            <div className="p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className={cn(
                                            "w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                                            selectedSolution === idx
                                                ? "bg-primary text-white"
                                                : "bg-gray-100 text-gray-600 group-hover:bg-primary/10"
                                        )}>
                                            {idx + 1}
                                        </div>
                                        <h3 className="font-medium text-gray-900">Solution {idx + 1}</h3>
                                    </div>
                                    <button
                                        onClick={() => setSelectedSolution(selectedSolution === idx ? null : idx)}
                                        className="text-sm text-primary hover:text-primary/80"
                                    >
                                        {selectedSolution === idx ? 'Hide Details' : 'Show Details'}
                                    </button>
                                </div>
                                
                                <div className="space-y-3">
                                    <p className="text-sm text-gray-600 line-clamp-2">{solution.description}</p>
                                    
                                    <div className="flex gap-2">
                                        <div className="flex-1 text-center p-2 bg-green-50 rounded-md">
                                            <div className="text-sm font-medium text-green-600">{solution.pros.length}</div>
                                            <div className="text-xs text-green-500">Pros</div>
                                        </div>
                                        <div className="flex-1 text-center p-2 bg-red-50 rounded-md">
                                            <div className="text-sm font-medium text-red-600">{solution.cons.length}</div>
                                            <div className="text-xs text-red-500">Cons</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {selectedSolution === idx && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="border-t border-gray-100"
                                >
                                    <div className="p-4 space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                                                <h4 className="text-sm font-medium text-green-600 mb-2">Pros</h4>
                                                <ul className="space-y-1.5">
                                                    {solution.pros.map((pro, idx) => (
                                                        <li key={idx} className="flex items-start gap-2 text-sm">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5"></div>
                                                            <span className="text-gray-600">{pro}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                            <div className="bg-red-50 rounded-lg p-3 border border-red-100">
                                                <h4 className="text-sm font-medium text-red-600 mb-2">Cons</h4>
                                                <ul className="space-y-1.5">
                                                    {solution.cons.map((con, idx) => (
                                                        <li key={idx} className="flex items-start gap-2 text-sm">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5"></div>
                                                            <span className="text-gray-600">{con}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-gray-50 rounded-lg p-3">
                                                <h4 className="text-sm font-medium text-gray-700 mb-1">Implementation</h4>
                                                <p className="text-sm text-gray-600">{solution.implementation}</p>
                                            </div>
                                            <div className="bg-gray-50 rounded-lg p-3">
                                                <h4 className="text-sm font-medium text-gray-700 mb-1">Timeline</h4>
                                                <p className="text-sm text-gray-600">{solution.timeline}</p>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Constraints */}
            <div className="bg-white rounded-xl p-6 border border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-red-50 rounded-lg">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                    </div>
                    <h2 className="text-lg font-semibold">Constraints</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {analysis.constraints.map((constraint, index) => (
                        <div 
                            key={index}
                            className="group flex items-start gap-3 p-4 bg-red-50 rounded-lg border border-red-100 hover:border-red-200 transition-colors"
                        >
                            <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                                <AlertCircle className="w-4 h-4 text-red-500" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-gray-600">{constraint}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Recommendation */}
            <div className="bg-white rounded-xl p-6 border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="text-lg font-semibold">Final Recommendation</h2>
                </div>
                <div className="space-y-4">
                    <div className="p-4 bg-primary/5 rounded-lg">
                        <p className="text-gray-600 max-w-[1200px]">{analysis.recommendation.solution}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-3 bg-gray-50 rounded-lg">
                            <h4 className="text-sm font-medium text-gray-700 mb-1">Implementation</h4>
                            <p className="text-sm text-gray-600">{analysis.recommendation.implementation}</p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                            <h4 className="text-sm font-medium text-gray-700 mb-1">Timeline</h4>
                            <p className="text-sm text-gray-600">{analysis.recommendation.timeline}</p>
                        </div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Success Metrics</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {analysis.recommendation.successMetrics.map((metric, index) => (
                                <div key={index} className="flex items-center gap-2 text-sm">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                                    <span className="text-gray-600">{metric}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
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
    const [selectedSolution, setSelectedSolution] = useState<number | null>(null);
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
            <div className="container mx-auto px-8 py-8 max-w-[1600px]">
                {/* Header Section */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">
                        Business Case Analysis
                    </h1>
                    <div className="bg-white rounded-xl border border-gray-100 p-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label htmlFor="query" className="block text-lg font-medium text-gray-900 mb-2">
                                    What business case would you like to analyze?
                                </label>
                                <div className="relative">
                                    <textarea
                                        id="query"
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        placeholder="Describe your business case in detail..."
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
                                                    <span>Analyzing Case...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Send className="w-5 h-5 mr-2" />
                                                    <span>Analyze Case</span>
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
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-semibold">Case Analysis Results</h2>
                            <Button onClick={() => setAnalysis(null)}>Analyze Another Case</Button>
                        </div>

                        <div className="prose max-w-none">
                            {/* Problem Statement */}
                            <Card className="mb-6">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-3">
                                        <div className="p-2 bg-primary/10 rounded-lg">
                                            <Search className="w-5 h-5 text-primary" />
                                        </div>
                                        <span>Problem Statement</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-gray-600 leading-relaxed">{analysis.problemStatement}</p>
                                </CardContent>
                            </Card>

                            {/* Key Factors */}
                            <Card className="mb-6">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-3">
                                        <div className="p-2 bg-primary/10 rounded-lg">
                                            <CheckCircle className="w-5 h-5 text-primary" />
                                        </div>
                                        <span>Key Factors</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {analysis.keyFactors.map((factor, index) => (
                                            <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2"></div>
                                                <span className="text-gray-600 text-sm">{factor}</span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Solutions */}
                            <Card className="mb-6">
                                <CardHeader>
                                    <CardTitle className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-primary/10 rounded-lg">
                                                <CheckCircle className="w-5 h-5 text-primary" />
                                            </div>
                                            <span>Proposed Solutions</span>
                                        </div>
                                        <div className="flex gap-2">
                                            {analysis.solutions.map((_, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => setSelectedSolution(idx)}
                                                    className={cn(
                                                        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                                                        selectedSolution === idx
                                                            ? "bg-primary text-white"
                                                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                                    )}
                                                >
                                                    {idx + 1}
                                                </button>
                                            ))}
                                        </div>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {selectedSolution !== null && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="space-y-6"
                                        >
                                            <div className="p-4 bg-gray-50 rounded-lg">
                                                <p className="text-gray-600">{analysis.solutions[selectedSolution].description}</p>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                                                    <h4 className="text-sm font-medium text-green-600 mb-3">Pros</h4>
                                                    <ul className="space-y-2">
                                                        {analysis.solutions[selectedSolution].pros.map((pro, idx) => (
                                                            <li key={idx} className="flex items-start gap-2 text-sm">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5"></div>
                                                                <span className="text-gray-600">{pro}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                                <div className="bg-red-50 rounded-lg p-4 border border-red-100">
                                                    <h4 className="text-sm font-medium text-red-600 mb-3">Cons</h4>
                                                    <ul className="space-y-2">
                                                        {analysis.solutions[selectedSolution].cons.map((con, idx) => (
                                                            <li key={idx} className="flex items-start gap-2 text-sm">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5"></div>
                                                                <span className="text-gray-600">{con}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="bg-gray-50 rounded-lg p-4">
                                                    <h4 className="text-sm font-medium text-gray-700 mb-2">Implementation</h4>
                                                    <p className="text-sm text-gray-600">{analysis.solutions[selectedSolution].implementation}</p>
                                                </div>
                                                <div className="bg-gray-50 rounded-lg p-4">
                                                    <h4 className="text-sm font-medium text-gray-700 mb-2">Timeline</h4>
                                                    <p className="text-sm text-gray-600">{analysis.solutions[selectedSolution].timeline}</p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Constraints */}
                            <Card className="mb-6">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-3">
                                        <div className="p-2 bg-red-50 rounded-lg">
                                            <AlertCircle className="w-5 h-5 text-red-500" />
                                        </div>
                                        <span>Constraints</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {analysis.constraints.map((constraint, index) => (
                                            <div key={index} className="flex items-start gap-2 p-3 bg-red-50 rounded-lg">
                                                <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5"></div>
                                                <span className="text-sm text-gray-600">{constraint}</span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Recommendation */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-3">
                                        <div className="p-2 bg-primary/10 rounded-lg">
                                            <CheckCircle className="w-5 h-5 text-primary" />
                                        </div>
                                        <span>Final Recommendation</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="p-4 bg-primary/5 rounded-lg">
                                            <p className="text-gray-600">{analysis.recommendation.solution}</p>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="p-3 bg-gray-50 rounded-lg">
                                                <h4 className="text-sm font-medium text-gray-700 mb-1">Implementation</h4>
                                                <p className="text-sm text-gray-600">{analysis.recommendation.implementation}</p>
                                            </div>
                                            <div className="p-3 bg-gray-50 rounded-lg">
                                                <h4 className="text-sm font-medium text-gray-700 mb-1">Timeline</h4>
                                                <p className="text-sm text-gray-600">{analysis.recommendation.timeline}</p>
                                            </div>
                                        </div>
                                        <div className="p-3 bg-gray-50 rounded-lg">
                                            <h4 className="text-sm font-medium text-gray-700 mb-2">Success Metrics</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                                {analysis.recommendation.successMetrics.map((metric, index) => (
                                                    <div key={index} className="flex items-center gap-2 text-sm">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                                                        <span className="text-gray-600">{metric}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
} 