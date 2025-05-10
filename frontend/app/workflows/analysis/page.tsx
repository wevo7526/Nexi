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
import WorkflowLayout from '@/components/workflows/WorkflowLayout';
import { useWorkflow } from '@/hooks/useWorkflow';
import { AnalysisStep } from '@/types/workflow';

export default function AnalysisWorkflow() {
    const {
        project,
        steps,
        data,
        isLoading,
        error,
        updateStep,
        addData
    } = useWorkflow({ type: 'analysis' });

    const [analysisInput, setAnalysisInput] = useState('');
    const [analysisResults, setAnalysisResults] = useState<any>(null);

    const handleRunAnalysis = async () => {
        if (!project?.id) return;

        try {
            // Save analysis results as workflow data
            await addData({
                project_id: project.id,
                workflow_type: 'analysis',
                content: {
                    input: analysisInput,
                    results: analysisResults
                },
                type: 'analysis'
            });

            // Update first step status if it exists
            if (steps.length > 0) {
                await updateStep(steps[0].id, { status: 'completed' });
            }

            // Clear input
            setAnalysisInput('');
            setAnalysisResults(null);
        } catch (error) {
            console.error('Error running analysis:', error);
        }
    };

    const handleNextStep = async (stepId: string) => {
        await updateStep(stepId, { status: 'completed' });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <h2 className="text-xl font-semibold text-red-600">Error</h2>
                    <p className="mt-2 text-gray-600">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <WorkflowLayout
            title="Analysis Phase"
            description="Data analysis and insight generation"
            projectName={project?.name}
            clientName={project?.client?.name}
        >
            <div className="space-y-6 p-6">
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

                    {/* Data Sources */}
                    <div className="mt-6">
                        <div className="p-4 border border-gray-200 rounded-lg">
                            <h3 className="text-sm font-medium text-gray-900">Data Sources</h3>
                            <div className="mt-2 space-y-2">
                                {data
                                    .filter(item => item.type === 'analysis')
                                    .map((item, index) => (
                                        <div key={index} className="flex items-center justify-between">
                                            <span className="text-sm text-gray-500">{item.content.input}</span>
                                            <span className="text-sm font-medium text-gray-900">
                                                {item.content.results?.dataPoints || 0} points
                                            </span>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </div>

                    {/* Analysis Progress */}
                    <div className="mt-6">
                        <h3 className="text-sm font-medium text-gray-900">Analysis Progress</h3>
                        <div className="mt-2">
                            <div className="relative pt-1">
                                <div className="flex mb-2 items-center justify-between">
                                    <div>
                                        <span className="text-xs font-semibold inline-block text-blue-600">
                                            {Math.round((steps.filter(s => s.status === 'completed').length / steps.length) * 100)}%
                                        </span>
                                    </div>
                                </div>
                                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-100">
                                    <div
                                        style={{ width: `${(steps.filter(s => s.status === 'completed').length / steps.length) * 100}%` }}
                                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-600"
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Input Area */}
                    <div className="mt-6">
                        <textarea
                            value={analysisInput}
                            onChange={(e) => setAnalysisInput(e.target.value)}
                            placeholder="Enter data to analyze..."
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            rows={4}
                        />
                        <div className="mt-4 flex justify-end">
                            <button
                                onClick={handleRunAnalysis}
                                disabled={isLoading || !analysisInput.trim()}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? 'Processing...' : 'Run Analysis'}
                            </button>
                        </div>
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
                                            {(step as AnalysisStep).data_points && (
                                                <p className="text-xs text-gray-400 mt-1">
                                                    {(step as AnalysisStep).data_points} data points collected
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        {step.ai_assistance && (
                                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                                                AI Assisted
                                            </span>
                                        )}
                                        <button
                                            onClick={() => handleNextStep(step.id)}
                                            disabled={step.status === 'completed' || isLoading}
                                            className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {step.status === 'completed' ? 'Completed' : 'Mark Complete'}
                                        </button>
                                    </div>
                                </div>
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
                        {data
                            .filter(item => item.type === 'analysis')
                            .map((item, index) => (
                                <div key={index} className="p-4 border border-gray-200 rounded-lg">
                                    <h3 className="text-sm font-medium text-gray-900">{item.content.results?.title || 'Analysis Result'}</h3>
                                    <div className="mt-2 h-32 bg-gray-50 rounded flex items-center justify-center">
                                        <span className="text-sm text-gray-500">
                                            {item.content.results?.description || 'No visualization available'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            </div>
        </WorkflowLayout>
    );
} 