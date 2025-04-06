"use client";

import { useState } from 'react';
import {
    DocumentTextIcon,
    LightBulbIcon,
    CheckCircleIcon,
    ChatBubbleLeftRightIcon,
    DocumentDuplicateIcon,
    ArrowPathIcon,
    UserGroupIcon,
    ClockIcon
} from '@heroicons/react/24/outline';

interface Solution {
    id: string;
    title: string;
    description: string;
    status: 'draft' | 'review' | 'approved';
    createdBy: string;
    createdAt: string;
    lastModified: string;
    version: number;
    aiSuggestions: string[];
    comments: {
        id: string;
        user: string;
        content: string;
        timestamp: string;
    }[];
}

export default function SolutionDevelopment() {
    const [solutions] = useState<Solution[]>([
        {
            id: '1',
            title: 'Digital Transformation Strategy',
            description: 'Comprehensive strategy for digital transformation including technology stack recommendations and implementation roadmap.',
            status: 'review',
            createdBy: 'John D.',
            createdAt: '2024-03-20',
            lastModified: '2024-03-21',
            version: 2,
            aiSuggestions: [
                'Consider adding cloud migration strategy',
                'Include change management plan',
                'Add ROI projections'
            ],
            comments: [
                {
                    id: '1',
                    user: 'Sarah M.',
                    content: 'The strategy looks solid, but we should add more detail about training programs.',
                    timestamp: '2024-03-21T10:30:00'
                }
            ]
        },
        {
            id: '2',
            title: 'Process Automation Solution',
            description: 'Detailed plan for implementing RPA and workflow automation across key business processes.',
            status: 'draft',
            createdBy: 'Mike R.',
            createdAt: '2024-03-19',
            lastModified: '2024-03-20',
            version: 1,
            aiSuggestions: [
                'Add process flow diagrams',
                'Include cost-benefit analysis',
                'Consider scalability factors'
            ],
            comments: []
        }
    ]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Solution Development</h1>
                    <p className="text-sm text-gray-500">Develop and refine project solutions</p>
                </div>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                    <DocumentTextIcon className="h-5 w-5" />
                    New Solution
                </button>
            </div>

            {/* Solutions List */}
            <div className="space-y-4">
                {solutions.map((solution) => (
                    <div key={solution.id} className="bg-white rounded-lg shadow-sm">
                        <div className="p-6">
                            <div className="flex items-start justify-between">
                                <div className="flex items-start space-x-4">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <LightBulbIcon className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-lg font-medium text-gray-900">{solution.title}</h3>
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                solution.status === 'approved' ? 'bg-green-100 text-green-800' :
                                                solution.status === 'review' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-gray-100 text-gray-800'
                                            }`}>
                                                {solution.status.charAt(0).toUpperCase() + solution.status.slice(1)}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-500">{solution.description}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-500">v{solution.version}</span>
                                    <button className="p-2 text-gray-400 hover:text-gray-600">
                                        <DocumentDuplicateIcon className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>

                            {/* AI Suggestions */}
                            {solution.aiSuggestions.length > 0 && (
                                <div className="mt-4">
                                    <h4 className="text-sm font-medium text-gray-700 mb-2">AI Suggestions</h4>
                                    <div className="space-y-2">
                                        {solution.aiSuggestions.map((suggestion, index) => (
                                            <div key={index} className="flex items-start gap-2 text-sm">
                                                <ArrowPathIcon className="h-4 w-4 text-blue-500 mt-0.5" />
                                                <span className="text-gray-600">{suggestion}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Comments */}
                            {solution.comments.length > 0 && (
                                <div className="mt-4">
                                    <h4 className="text-sm font-medium text-gray-700 mb-2">Comments</h4>
                                    <div className="space-y-3">
                                        {solution.comments.map((comment) => (
                                            <div key={comment.id} className="flex items-start gap-3">
                                                <div className="p-1 bg-gray-100 rounded-full">
                                                    <ChatBubbleLeftRightIcon className="h-4 w-4 text-gray-600" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium text-gray-900">{comment.user}</span>
                                                        <span className="text-xs text-gray-500">
                                                            {new Date(comment.timestamp).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-600 mt-1">{comment.content}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Metadata */}
                            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div className="flex items-center text-gray-500">
                                    <UserGroupIcon className="h-4 w-4 mr-2" />
                                    <span>{solution.createdBy}</span>
                                </div>
                                <div className="flex items-center text-gray-500">
                                    <ClockIcon className="h-4 w-4 mr-2" />
                                    <span>Created {new Date(solution.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center text-gray-500">
                                    <ClockIcon className="h-4 w-4 mr-2" />
                                    <span>Modified {new Date(solution.lastModified).toLocaleDateString()}</span>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="mt-4 flex space-x-2">
                                <button className="flex-1 px-3 py-2 text-sm text-blue-600 hover:text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
                                    Edit Solution
                                </button>
                                <button className="flex-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                    Add Comment
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
} 