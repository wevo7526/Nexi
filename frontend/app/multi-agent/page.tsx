"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

interface ResearchSection {
    title: string;
    content: string;
}

interface ResearchOutput {
    type: string;
    title: string;
    content: {
        research_objectives: string[];
        methodology: string[];
        sample_design: string[];
        timeline: string[];
        budget_considerations: string[];
    };
}

interface ResearchResponse {
    content: {
        sections: ResearchSection[];
    };
    outputs: ResearchOutput[];
}

export default function MultiAgentPage() {
    const [query, setQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [researchData, setResearchData] = useState<ResearchResponse | null>(null);
    const [streamContent, setStreamContent] = useState<string>('');
    const router = useRouter();
    const { user } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setStreamContent('');
        setResearchData(null);

        try {
            const response = await fetch(`${BACKEND_URL}/api/multi-agent/chat`, {
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
                throw new Error(errorData.error || 'Failed to start research analysis');
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
                            
                            if (data.type === 'status') {
                                setStreamContent(prev => prev + data.content + '\n');
                            } else if (data.type === 'content') {
                                setStreamContent(prev => prev + `\n${data.section}:\n${data.content}\n`);
                            } else if (data.type === 'final') {
                                // Ensure the data structure matches our interface
                                const formattedData: ResearchResponse = {
                                    content: {
                                        sections: [
                                            {
                                                title: "Project Scope",
                                                content: data.content.research_objectives.join('\n')
                                            },
                                            {
                                                title: "Methodology",
                                                content: data.content.methodology.join('\n')
                                            },
                                            {
                                                title: "Timeline",
                                                content: data.content.timeline.join('\n')
                                            },
                                            {
                                                title: "Budget Considerations",
                                                content: data.content.budget_considerations.join('\n')
                                            }
                                        ]
                                    },
                                    outputs: [
                                        {
                                            type: "analysis",
                                            title: "Research Design",
                                            content: data.content
                                        }
                                    ]
                                };
                                setResearchData(formattedData);
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
            setError(err instanceof Error ? err.message : 'Failed to process research query');
            setIsLoading(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">Research Analysis</h1>
            
            <form onSubmit={handleSubmit} className="mb-8">
                <div className="mb-4">
                    <label htmlFor="query" className="block text-sm font-medium text-gray-700 mb-2">
                        Enter your research query:
                    </label>
                    <textarea
                        id="query"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="w-full h-32 p-4 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Describe your research needs here..."
                        required
                    />
                </div>
                
                <button
                    type="submit"
                    disabled={isLoading}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? 'Analyzing...' : 'Analyze Research'}
                </button>
            </form>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            {streamContent && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-8">
                    <h2 className="text-xl font-semibold mb-2">Analysis Progress:</h2>
                    <pre className="whitespace-pre-wrap">{streamContent}</pre>
                </div>
            )}

            {researchData?.content?.sections && (
                <div className="space-y-8">
                    {researchData.content.sections.map((section, index) => (
                        <div key={index} className="bg-white border border-gray-200 rounded-lg p-6">
                            <h2 className="text-2xl font-semibold mb-4">{section.title}</h2>
                            <div className="prose max-w-none">
                                {section.content.split('\n').map((line, i) => (
                                    <p key={i} className="mb-2">{line}</p>
                                ))}
                            </div>
                        </div>
                    ))}

                    {researchData.outputs?.map((output, index) => (
                        <div key={index} className="bg-white border border-gray-200 rounded-lg p-6">
                            <h2 className="text-2xl font-semibold mb-4">{output.title}</h2>
                            <div className="space-y-4">
                                {Object.entries(output.content).map(([key, value]) => (
                                    <div key={key}>
                                        <h3 className="text-xl font-medium mb-2">
                                            {key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                        </h3>
                                        <ul className="list-disc pl-5 space-y-1">
                                            {Array.isArray(value) && value.map((item, i) => (
                                                <li key={i}>{item}</li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
} 