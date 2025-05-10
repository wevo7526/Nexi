"use client";

import { useState } from 'react';
import {
    ClipboardDocumentCheckIcon,
    DocumentTextIcon,
    CheckCircleIcon,
    ClockIcon,
    UserGroupIcon,
    ArrowPathIcon
} from '@heroicons/react/24/outline';
import WorkflowLayout from '@/components/workflows/WorkflowLayout';
import { useWorkflow } from '@/hooks/useWorkflow';

export default function ImplementationWorkflow() {
    const {
        project,
        steps,
        data,
        isLoading,
        error,
        updateStep,
        addData
    } = useWorkflow({ type: 'implementation' });

    const [implementationInput, setImplementationInput] = useState('');
    const [implementationResults, setImplementationResults] = useState<any>(null);

    const handleCreateImplementation = async () => {
        if (!project?.id) return;

        try {
            // Save implementation as workflow data
            await addData({
                project_id: project.id,
                workflow_type: 'implementation',
                content: {
                    input: implementationInput,
                    results: implementationResults
                },
                type: 'implementation'
            });

            // Update first step status if it exists
            if (steps.length > 0) {
                await updateStep(steps[0].id, { status: 'completed' });
            }

            // Clear input
            setImplementationInput('');
            setImplementationResults(null);
        } catch (error) {
            console.error('Error creating implementation:', error);
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
            title="Implementation Phase"
            description="Execution and delivery"
            projectName={project?.name}
            clientName={project?.client?.name}
        >
            <div className="space-y-6 p-6">
                {/* Implementation Panel */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center space-x-4">
                        <div className="p-3 bg-blue-100 rounded-full">
                            <ClipboardDocumentCheckIcon className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-medium text-gray-900">Implementation Tracking</h2>
                            <p className="text-sm text-gray-500">Track and manage implementation progress</p>
                        </div>
                    </div>

                    {/* Implementation List */}
                    <div className="mt-6 space-y-4">
                        {data
                            .filter(item => item.type === 'implementation')
                            .map((item, index) => (
                                <div key={index} className="p-4 border border-gray-200 rounded-lg">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-900">
                                                {item.content.results?.title || 'Implementation Task'}
                                            </h3>
                                            <p className="mt-1 text-sm text-gray-600">
                                                {item.content.results?.description || 'No description available'}
                                            </p>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                item.content.results?.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                item.content.results?.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                                'bg-gray-100 text-gray-800'
                                            }`}>
                                                {item.content.results?.status || 'pending'}
                                            </span>
                                        </div>
                                    </div>
                                    {item.content.results?.progress && (
                                        <div className="mt-4">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-600">Progress</span>
                                                <span className="text-gray-900">{item.content.results.progress}%</span>
                                            </div>
                                            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="bg-blue-600 h-2 rounded-full"
                                                    style={{ width: `${item.content.results.progress}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                    </div>

                    {/* Input Area */}
                    <div className="mt-6">
                        <textarea
                            value={implementationInput}
                            onChange={(e) => setImplementationInput(e.target.value)}
                            placeholder="Enter implementation details..."
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            rows={4}
                        />
                        <div className="mt-4 flex justify-end">
                            <button
                                onClick={handleCreateImplementation}
                                disabled={isLoading || !implementationInput.trim()}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? 'Processing...' : 'Create Implementation Task'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Implementation Steps */}
                <div className="bg-white rounded-lg shadow-sm">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-lg font-medium text-gray-900">Implementation Steps</h2>
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