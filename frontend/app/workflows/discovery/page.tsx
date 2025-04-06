"use client";

import { useState } from 'react';
import {
    MagnifyingGlassIcon,
    UserGroupIcon,
    DocumentTextIcon,
    LightBulbIcon,
    ChartBarIcon
} from '@heroicons/react/24/outline';

interface DiscoveryStep {
    id: string;
    title: string;
    description: string;
    status: 'pending' | 'in_progress' | 'completed';
    aiAssistance: boolean;
}

export default function DiscoveryWorkflow() {
    const [steps] = useState<DiscoveryStep[]>([
        {
            id: '1',
            title: 'Client Assessment',
            description: 'Gather initial information about the client and their needs',
            status: 'in_progress',
            aiAssistance: true
        },
        {
            id: '2',
            title: 'Stakeholder Analysis',
            description: 'Identify and analyze key stakeholders and their interests',
            status: 'pending',
            aiAssistance: true
        },
        {
            id: '3',
            title: 'Problem Definition',
            description: 'Clearly define the core problems and challenges',
            status: 'pending',
            aiAssistance: true
        },
        {
            id: '4',
            title: 'Scope Definition',
            description: 'Define project scope, objectives, and deliverables',
            status: 'pending',
            aiAssistance: true
        },
        {
            id: '5',
            title: 'Resource Planning',
            description: 'Identify required resources and create initial timeline',
            status: 'pending',
            aiAssistance: true
        }
    ]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Discovery Phase</h1>
                    <p className="text-sm text-gray-500">Initial project assessment and planning</p>
                </div>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Start AI Assistant
                </button>
            </div>

            {/* AI Assistant Panel */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center space-x-4">
                    <div className="p-3 bg-blue-100 rounded-full">
                        <MagnifyingGlassIcon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                        <h2 className="text-lg font-medium text-gray-900">AI Discovery Assistant</h2>
                        <p className="text-sm text-gray-500">Let AI help guide you through the discovery process</p>
                    </div>
                </div>
                <div className="mt-4">
                    <textarea
                        className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={4}
                        placeholder="Describe your project or ask for guidance..."
                    />
                </div>
                <div className="mt-4 flex justify-end">
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        Get AI Guidance
                    </button>
                </div>
            </div>

            {/* Workflow Steps */}
            <div className="bg-white rounded-lg shadow-sm">
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-lg font-medium text-gray-900">Discovery Steps</h2>
                </div>
                <div className="divide-y divide-gray-200">
                    {steps.map((step) => (
                        <div key={step.id} className="p-6">
                            <div className="flex items-start justify-between">
                                <div className="flex items-start space-x-4">
                                    <div className={`p-2 rounded-full ${
                                        step.status === 'completed' ? 'bg-green-100' :
                                        step.status === 'in_progress' ? 'bg-blue-100' :
                                        'bg-gray-100'
                                    }`}>
                                        <DocumentTextIcon className={`h-5 w-5 ${
                                            step.status === 'completed' ? 'text-green-600' :
                                            step.status === 'in_progress' ? 'text-blue-600' :
                                            'text-gray-400'
                                        }`} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-900">{step.title}</h3>
                                        <p className="text-sm text-gray-500">{step.description}</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                    {step.aiAssistance && (
                                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                                            AI Assisted
                                        </span>
                                    )}
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                        step.status === 'completed' ? 'bg-green-100 text-green-800' :
                                        step.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                        'bg-gray-100 text-gray-800'
                                    }`}>
                                        {step.status.replace('_', ' ')}
                                    </span>
                                </div>
                            </div>
                            {step.status === 'in_progress' && (
                                <div className="mt-4">
                                    <button className="text-sm text-blue-600 hover:text-blue-700">
                                        Start AI-Guided Assessment →
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Resources Panel */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center space-x-4">
                    <div className="p-3 bg-green-100 rounded-full">
                        <LightBulbIcon className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                        <h2 className="text-lg font-medium text-gray-900">Discovery Resources</h2>
                        <p className="text-sm text-gray-500">Helpful templates and guides</p>
                    </div>
                </div>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 cursor-pointer">
                        <h3 className="text-sm font-medium text-gray-900">Client Assessment Template</h3>
                        <p className="text-sm text-gray-500">Standard template for client interviews</p>
                    </div>
                    <div className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 cursor-pointer">
                        <h3 className="text-sm font-medium text-gray-900">Stakeholder Analysis Guide</h3>
                        <p className="text-sm text-gray-500">Guide for identifying key stakeholders</p>
                    </div>
                    <div className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 cursor-pointer">
                        <h3 className="text-sm font-medium text-gray-900">Problem Definition Framework</h3>
                        <p className="text-sm text-gray-500">Framework for defining core problems</p>
                    </div>
                    <div className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 cursor-pointer">
                        <h3 className="text-sm font-medium text-gray-900">Scope Definition Checklist</h3>
                        <p className="text-sm text-gray-500">Checklist for project scope definition</p>
                    </div>
                </div>
            </div>
        </div>
    );
} 