"use client";

import { useState } from 'react';
import {
    CheckCircleIcon,
    ClockIcon,
    ExclamationCircleIcon,
    UserGroupIcon,
    DocumentTextIcon,
    ChartBarIcon,
    ChatBubbleLeftRightIcon,
    ArrowPathIcon
} from '@heroicons/react/24/outline';

interface ImplementationTask {
    id: string;
    title: string;
    description: string;
    status: 'not-started' | 'in-progress' | 'completed' | 'blocked';
    priority: 'low' | 'medium' | 'high';
    assignedTo: string[];
    dueDate: string;
    progress: number;
    dependencies: string[];
    comments: {
        id: string;
        user: string;
        content: string;
        timestamp: string;
    }[];
}

export default function Implementation() {
    const [tasks] = useState<ImplementationTask[]>([
        {
            id: '1',
            title: 'System Architecture Setup',
            description: 'Set up the core system architecture and infrastructure components',
            status: 'in-progress',
            priority: 'high',
            assignedTo: ['John D.', 'Sarah M.'],
            dueDate: '2024-04-15',
            progress: 65,
            dependencies: [],
            comments: [
                {
                    id: '1',
                    user: 'John D.',
                    content: 'Infrastructure components are ready for testing',
                    timestamp: '2024-03-21T14:30:00'
                }
            ]
        },
        {
            id: '2',
            title: 'User Interface Development',
            description: 'Develop and implement the new user interface components',
            status: 'not-started',
            priority: 'medium',
            assignedTo: ['Mike R.'],
            dueDate: '2024-04-30',
            progress: 0,
            dependencies: ['1'],
            comments: []
        }
    ]);

    const getStatusColor = (status: ImplementationTask['status']) => {
        switch (status) {
            case 'completed':
                return 'bg-green-100 text-green-800';
            case 'in-progress':
                return 'bg-blue-100 text-blue-800';
            case 'blocked':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getPriorityColor = (priority: ImplementationTask['priority']) => {
        switch (priority) {
            case 'high':
                return 'bg-red-100 text-red-800';
            case 'medium':
                return 'bg-yellow-100 text-yellow-800';
            case 'low':
                return 'bg-green-100 text-green-800';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Implementation</h1>
                    <p className="text-sm text-gray-500">Track and manage solution implementation</p>
                </div>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                    <DocumentTextIcon className="h-5 w-5" />
                    New Task
                </button>
            </div>

            {/* Implementation Tasks */}
            <div className="space-y-4">
                {tasks.map((task) => (
                    <div key={task.id} className="bg-white rounded-lg shadow-sm">
                        <div className="p-6">
                            <div className="flex items-start justify-between">
                                <div className="flex items-start space-x-4">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <CheckCircleIcon className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-lg font-medium text-gray-900">{task.title}</h3>
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
                                                {task.status.replace('-', ' ')}
                                            </span>
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(task.priority)}`}>
                                                {task.priority}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-500">{task.description}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-500">{task.progress}%</span>
                                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-blue-600 transition-all duration-300"
                                            style={{ width: `${task.progress}%` }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Task Details */}
                            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="flex items-center text-sm text-gray-500">
                                    <UserGroupIcon className="h-4 w-4 mr-2" />
                                    <span>{task.assignedTo.join(', ')}</span>
                                </div>
                                <div className="flex items-center text-sm text-gray-500">
                                    <ClockIcon className="h-4 w-4 mr-2" />
                                    <span>Due {new Date(task.dueDate).toLocaleDateString()}</span>
                                </div>
                                {task.dependencies.length > 0 && (
                                    <div className="flex items-center text-sm text-gray-500">
                                        <ArrowPathIcon className="h-4 w-4 mr-2" />
                                        <span>Depends on {task.dependencies.length} tasks</span>
                                    </div>
                                )}
                            </div>

                            {/* Comments */}
                            {task.comments.length > 0 && (
                                <div className="mt-4">
                                    <h4 className="text-sm font-medium text-gray-700 mb-2">Comments</h4>
                                    <div className="space-y-3">
                                        {task.comments.map((comment) => (
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

                            {/* Action Buttons */}
                            <div className="mt-4 flex space-x-2">
                                <button className="flex-1 px-3 py-2 text-sm text-blue-600 hover:text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
                                    Update Progress
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