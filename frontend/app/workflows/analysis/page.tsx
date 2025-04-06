"use client";

import { useState } from 'react';
import {
    ChartBarIcon,
    DocumentTextIcon,
    LightBulbIcon,
    MagnifyingGlassIcon,
    ArrowTrendingUpIcon,
    DocumentChartBarIcon
} from '@heroicons/react/24/outline';

interface AnalysisStep {
    id: string;
    title: string;
    description: string;
    status: 'pending' | 'in_progress' | 'completed';
    aiAssistance: boolean;
    dataPoints?: number;
}

export default function AnalysisWorkflow() {
    const [steps] = useState<AnalysisStep[]>([
        {
            id: '1',
            title: 'Data Collection',
            description: 'Gather and organize relevant data for analysis',
            status: 'in_progress',
            aiAssistance: true,
            dataPoints: 150
        },
        {
            id: '2',
            title: 'Data Analysis',
            description: 'Analyze collected data using AI-powered tools',
            status: 'pending',
            aiAssistance: true
        },
        {
            id: '3',
            title: 'Pattern Recognition',
            description: 'Identify patterns and trends in the data',
            status: 'pending',
            aiAssistance: true
        },
        {
            id: '4',
            title: 'Insight Generation',
            description: 'Generate actionable insights from analysis',
            status: 'pending',
            aiAssistance: true
        },
        {
            id: '5',
            title: 'Recommendation Development',
            description: 'Develop data-driven recommendations',
            status: 'pending',
            aiAssistance: true
        }
    ]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Analysis Phase</h1>
                    <p className="text-sm text-gray-500">Data analysis and insight generation</p>
                </div>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Start AI Analysis
                </button>
            </div>

            {/* AI Analysis Panel */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center space-x-4">
                    <div className="p-3 bg-blue-100 rounded-full">
                        <ChartBarIcon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                        <h2 className="text-lg font-medium text-gray-900">AI Analysis Assistant</h2>
                        <p className="text-sm text-gray-500">Let AI help analyze your data and generate insights</p>
                    </div>
                </div>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border border-gray-200 rounded-lg">
                        <h3 className="text-sm font-medium text-gray-900">Data Sources</h3>
                        <div className="mt-2 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500">Internal Data</span>
                                <span className="text-sm font-medium text-gray-900">75 points</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500">Market Data</span>
                                <span className="text-sm font-medium text-gray-900">50 points</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500">Customer Feedback</span>
                                <span className="text-sm font-medium text-gray-900">25 points</span>
                            </div>
                        </div>
                    </div>
                    <div className="p-4 border border-gray-200 rounded-lg">
                        <h3 className="text-sm font-medium text-gray-900">Analysis Progress</h3>
                        <div className="mt-2">
                            <div className="relative pt-1">
                                <div className="flex mb-2 items-center justify-between">
                                    <div>
                                        <span className="text-xs font-semibold inline-block text-blue-600">
                                            30%
                                        </span>
                                    </div>
                                </div>
                                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-100">
                                    <div
                                        style={{ width: '30%' }}
                                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-600"
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="mt-4">
                    <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        Run AI Analysis
                    </button>
                </div>
            </div>

            {/* Analysis Steps */}
            <div className="bg-white rounded-lg shadow-sm">
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-lg font-medium text-gray-900">Analysis Steps</h2>
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
                                        <DocumentChartBarIcon className={`h-5 w-5 ${
                                            step.status === 'completed' ? 'text-green-600' :
                                            step.status === 'in_progress' ? 'text-blue-600' :
                                            'text-gray-400'
                                        }`} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-900">{step.title}</h3>
                                        <p className="text-sm text-gray-500">{step.description}</p>
                                        {step.dataPoints && (
                                            <p className="text-xs text-gray-400 mt-1">
                                                {step.dataPoints} data points collected
                                            </p>
                                        )}
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
                                <div className="mt-4 flex space-x-4">
                                    <button className="text-sm text-blue-600 hover:text-blue-700">
                                        View Data →
                                    </button>
                                    <button className="text-sm text-blue-600 hover:text-blue-700">
                                        Run Analysis →
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Visualization Panel */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center space-x-4">
                    <div className="p-3 bg-green-100 rounded-full">
                        <ArrowTrendingUpIcon className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                        <h2 className="text-lg font-medium text-gray-900">Data Visualizations</h2>
                        <p className="text-sm text-gray-500">Interactive charts and graphs</p>
                    </div>
                </div>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border border-gray-200 rounded-lg">
                        <h3 className="text-sm font-medium text-gray-900">Trend Analysis</h3>
                        <div className="mt-2 h-32 bg-gray-50 rounded flex items-center justify-center">
                            <span className="text-sm text-gray-500">Chart will be displayed here</span>
                        </div>
                    </div>
                    <div className="p-4 border border-gray-200 rounded-lg">
                        <h3 className="text-sm font-medium text-gray-900">Pattern Recognition</h3>
                        <div className="mt-2 h-32 bg-gray-50 rounded flex items-center justify-center">
                            <span className="text-sm text-gray-500">Pattern visualization will be displayed here</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 