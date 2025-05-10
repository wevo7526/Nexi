"use client";

import { useState } from 'react';
import {
    MagnifyingGlassIcon,
    UserGroupIcon,
    DocumentTextIcon,
    ArrowPathIcon,
    CheckCircleIcon,
    XCircleIcon
} from '@heroicons/react/24/outline';
import WorkflowLayout from '@/components/workflows/WorkflowLayout';
import { useWorkflow } from '@/hooks/useWorkflow';
import { DiscoveryStep } from '@/types/workflow';

export default function DiscoveryWorkflow() {
    const {
        project,
        steps,
        data,
        isLoading,
        error,
        updateStep,
        addData
    } = useWorkflow({ type: 'discovery' });

    const [userInput, setUserInput] = useState('');
    const [agentResponse, setAgentResponse] = useState('');

    const handleAgentResponse = async () => {
        if (!project?.id) return;

        try {
            // Save agent response as workflow data
            await addData({
                project_id: project.id,
                workflow_type: 'discovery',
                content: {
                    userInput,
                    response: agentResponse
                },
                type: 'agent_response'
            });

            // Update first step status if it exists
            if (steps.length > 0) {
                await updateStep(steps[0].id, { status: 'completed' });
            }

            // Clear input
            setUserInput('');
            setAgentResponse('');
        } catch (error) {
            console.error('Error handling agent response:', error);
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
            title="Discovery Workflow"
            description="Initial research and requirements gathering"
            projectName={project?.name}
            clientName={project?.client?.name}
        >
            <div className="space-y-6 p-6">
                {/* AI Assistant Panel */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-start space-x-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <MagnifyingGlassIcon className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-lg font-medium text-gray-900">AI Assistant</h2>
                            <p className="mt-1 text-sm text-gray-600">
                                I'll help you gather information and insights about the client's needs and requirements.
                            </p>
                        </div>
                    </div>

                    {/* Chat Messages */}
                    <div className="mt-6 space-y-4">
                        {data
                            .filter(item => item.type === 'agent_response')
                            .map((item, index) => (
                                <div key={index} className="space-y-2">
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <p className="text-sm text-gray-600">{item.content.userInput}</p>
                                    </div>
                                    <div className="bg-blue-50 p-4 rounded-lg">
                                        <p className="text-sm text-gray-900">{item.content.response}</p>
                                    </div>
                                </div>
                            ))}
                    </div>

                    {/* Input Area */}
                    <div className="mt-6">
                        <textarea
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            placeholder="Ask the AI assistant about the client's needs..."
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            rows={4}
                        />
                        <div className="mt-4 flex justify-end">
                            <button
                                onClick={handleAgentResponse}
                                disabled={isLoading || !userInput.trim()}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? 'Processing...' : 'Get AI Response'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Discovery Steps */}
                <div className="bg-white rounded-lg shadow-sm">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-lg font-medium text-gray-900">Discovery Steps</h2>
                    </div>
                    <div className="divide-y divide-gray-200">
                        {steps.map((step) => (
                            <div key={step.id} className="p-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start space-x-4">
                                        <div className="p-2 bg-gray-100 rounded-lg">
                                            <DocumentTextIcon className="h-5 w-5 text-gray-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-medium text-gray-900">{step.title}</h3>
                                            <p className="mt-1 text-sm text-gray-600">{step.description}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleNextStep(step.id)}
                                        disabled={step.status === 'completed' || isLoading}
                                        className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {step.status === 'completed' ? 'Completed' : 'Mark Complete'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </WorkflowLayout>
    );
} 