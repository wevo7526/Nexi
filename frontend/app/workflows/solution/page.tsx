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
import WorkflowLayout from '@/components/workflows/WorkflowLayout';
import { useWorkflow } from '@/hooks/useWorkflow';
import { SolutionStep } from '@/types/workflow';

export default function SolutionWorkflow() {
    const {
        project,
        steps,
        data,
        isLoading,
        error,
        updateStep,
        addData
    } = useWorkflow({ type: 'solution' });

    const [solutionInput, setSolutionInput] = useState('');
    const [solutionResults, setSolutionResults] = useState<any>(null);

    const handleCreateSolution = async () => {
        if (!project?.id) return;

        try {
            // Save solution as workflow data
            await addData({
                project_id: project.id,
                workflow_type: 'solution',
                content: {
                    input: solutionInput,
                    results: solutionResults
                },
                type: 'solution'
            });

            // Update first step status if it exists
            if (steps.length > 0) {
                await updateStep(steps[0].id, { status: 'completed' });
            }

            // Clear input
            setSolutionInput('');
            setSolutionResults(null);
        } catch (error) {
            console.error('Error creating solution:', error);
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
            title="Solution Development"
            description="Solution design and planning"
            projectName={project?.name}
            clientName={project?.client?.name}
        >
            <div className="space-y-6 p-6">
                {/* Solution Development Panel */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center space-x-4">
                        <div className="p-3 bg-blue-100 rounded-full">
                            <LightBulbIcon className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-medium text-gray-900">Solution Development</h2>
                            <p className="text-sm text-gray-500">Design and plan your solution</p>
                        </div>
                    </div>

                    {/* Solutions List */}
                    <div className="mt-6 space-y-4">
                        {data
                            .filter(item => item.type === 'solution')
                            .map((item, index) => (
                                <div key={index} className="p-4 border border-gray-200 rounded-lg">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-900">
                                                {item.content.results?.title || 'Solution'}
                                            </h3>
                                            <p className="mt-1 text-sm text-gray-600">
                                                {item.content.results?.description || 'No description available'}
                                            </p>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                                Version {(item.content.results?.version || 1)}
                                            </span>
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                item.content.results?.status === 'approved' ? 'bg-green-100 text-green-800' :
                                                item.content.results?.status === 'review' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-gray-100 text-gray-800'
                                            }`}>
                                                {item.content.results?.status || 'draft'}
                                            </span>
                                        </div>
                                    </div>
                                    {item.content.results?.ai_suggestions && (
                                        <div className="mt-4">
                                            <h4 className="text-xs font-medium text-gray-900">AI Suggestions</h4>
                                            <ul className="mt-2 space-y-1">
                                                {item.content.results.ai_suggestions.map((suggestion: string, i: number) => (
                                                    <li key={i} className="text-sm text-gray-600">• {suggestion}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            ))}
                    </div>

                    {/* Input Area */}
                    <div className="mt-6">
                        <textarea
                            value={solutionInput}
                            onChange={(e) => setSolutionInput(e.target.value)}
                            placeholder="Enter your solution details..."
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            rows={4}
                        />
                        <div className="mt-4 flex justify-end">
                            <button
                                onClick={handleCreateSolution}
                                disabled={isLoading || !solutionInput.trim()}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? 'Processing...' : 'Create Solution'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Solution Steps */}
                <div className="bg-white rounded-lg shadow-sm">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-lg font-medium text-gray-900">Solution Steps</h2>
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
                                            {(step as SolutionStep).version && (
                                                <p className="text-xs text-gray-400 mt-1">
                                                    Version {(step as SolutionStep).version}
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
            </div>
        </WorkflowLayout>
    );
} 