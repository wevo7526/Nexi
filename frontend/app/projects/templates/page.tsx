"use client";

import { useState } from 'react';
import {
    DocumentDuplicateIcon,
    PlusIcon,
    MagnifyingGlassIcon,
    ChartBarIcon,
    UserGroupIcon,
    DocumentTextIcon,
    ArrowPathIcon
} from '@heroicons/react/24/outline';

interface ProjectTemplate {
    id: string;
    name: string;
    description: string;
    category: 'consulting' | 'market-research' | 'business-analysis';
    phases: {
        type: 'discovery' | 'analysis' | 'solution' | 'implementation';
        tasks: number;
    }[];
    createdBy: string;
    lastUsed: string;
    usageCount: number;
}

export default function ProjectTemplates() {
    const [templates] = useState<ProjectTemplate[]>([
        {
            id: '1',
            name: 'Market Research Template',
            description: 'Standard template for market research projects',
            category: 'market-research',
            phases: [
                { type: 'discovery', tasks: 5 },
                { type: 'analysis', tasks: 8 },
                { type: 'solution', tasks: 6 },
                { type: 'implementation', tasks: 4 }
            ],
            createdBy: 'John D.',
            lastUsed: '2024-03-20',
            usageCount: 12
        },
        {
            id: '2',
            name: 'Business Process Optimization',
            description: 'Template for business process improvement projects',
            category: 'consulting',
            phases: [
                { type: 'discovery', tasks: 4 },
                { type: 'analysis', tasks: 6 },
                { type: 'solution', tasks: 5 },
                { type: 'implementation', tasks: 7 }
            ],
            createdBy: 'Sarah M.',
            lastUsed: '2024-03-18',
            usageCount: 8
        }
    ]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Project Templates</h1>
                    <p className="text-sm text-gray-500">Create and manage project templates</p>
                </div>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                    <PlusIcon className="h-5 w-5" />
                    New Template
                </button>
            </div>

            {/* Search and Filters */}
            <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center gap-4">
                    <div className="flex-1 relative">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search templates..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <option value="">All Categories</option>
                        <option value="consulting">Consulting</option>
                        <option value="market-research">Market Research</option>
                        <option value="business-analysis">Business Analysis</option>
                    </select>
                </div>
            </div>

            {/* Templates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.map((template) => (
                    <div key={template.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                        <div className="p-6">
                            <div className="flex items-start justify-between">
                                <div className="flex items-start space-x-3">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <DocumentDuplicateIcon className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900">{template.name}</h3>
                                        <p className="text-sm text-gray-500">{template.description}</p>
                                    </div>
                                </div>
                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                                    {template.category.replace('-', ' ')}
                                </span>
                            </div>

                            {/* Phases */}
                            <div className="mt-4">
                                <h4 className="text-sm font-medium text-gray-700 mb-2">Phases</h4>
                                <div className="space-y-2">
                                    {template.phases.map((phase) => (
                                        <div key={phase.type} className="flex items-center justify-between text-sm">
                                            <span className="text-gray-600 capitalize">{phase.type}</span>
                                            <span className="text-gray-500">{phase.tasks} tasks</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Usage Stats */}
                            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                                <div className="flex items-center text-gray-500">
                                    <ArrowPathIcon className="h-4 w-4 mr-2" />
                                    <span>Used {template.usageCount} times</span>
                                </div>
                                <div className="flex items-center text-gray-500">
                                    <DocumentTextIcon className="h-4 w-4 mr-2" />
                                    <span>Last used {new Date(template.lastUsed).toLocaleDateString()}</span>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="mt-4 flex space-x-2">
                                <button className="flex-1 px-3 py-2 text-sm text-blue-600 hover:text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
                                    Edit Template
                                </button>
                                <button className="flex-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                    Use Template
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
} 