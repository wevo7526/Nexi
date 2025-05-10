"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    ChartBarIcon,
    UserGroupIcon,
    CalendarIcon,
    DocumentTextIcon,
    ArrowPathIcon,
    PencilSquareIcon,
    TrashIcon
} from '@heroicons/react/24/outline';

interface Project {
    id: string;
    name: string;
    description: string;
    client: string;
    team: string[];
    startDate: string;
    endDate: string;
    progress: number;
    status: 'planning' | 'in-progress' | 'on-hold' | 'completed';
    documents: number;
    tasks: {
        total: number;
        completed: number;
    };
}

export default function ProjectDetail({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [project, setProject] = useState<Project | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchProject();
    }, [params.id]);

    const fetchProject = async () => {
        try {
            const response = await fetch(`/api/projects/${params.id}`);
            if (!response.ok) throw new Error('Failed to fetch project');
            const data = await response.json();
            setProject(data);
        } catch (error) {
            console.error('Error fetching project:', error);
            setError('Failed to load project details');
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusColor = (status: Project['status']) => {
        switch (status) {
            case 'completed':
                return 'bg-green-100 text-green-800';
            case 'in-progress':
                return 'bg-blue-100 text-blue-800';
            case 'on-hold':
                return 'bg-yellow-100 text-yellow-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error || !project) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <h2 className="text-xl font-semibold text-gray-900">Error</h2>
                    <p className="text-gray-500">{error || 'Project not found'}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-semibold text-gray-900">{project.name}</h1>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(project.status)}`}>
                            {project.status.replace('-', ' ')}
                        </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{project.description}</p>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => router.push(`/projects/${project.id}/edit`)}
                        className="p-2 text-gray-400 hover:text-gray-600"
                    >
                        <PencilSquareIcon className="h-5 w-5" />
                    </button>
                    <button 
                        onClick={() => {
                            // Handle delete
                        }}
                        className="p-2 text-gray-400 hover:text-red-600"
                    >
                        <TrashIcon className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* Project Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="flex items-center text-sm text-gray-500 mb-2">
                        <UserGroupIcon className="h-4 w-4 mr-2" />
                        <span>Team</span>
                    </div>
                    <p className="text-gray-900">{project.team.join(', ')}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="flex items-center text-sm text-gray-500 mb-2">
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        <span>Timeline</span>
                    </div>
                    <p className="text-gray-900">
                        {new Date(project.startDate).toLocaleDateString()} - {new Date(project.endDate).toLocaleDateString()}
                    </p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="flex items-center text-sm text-gray-500 mb-2">
                        <DocumentTextIcon className="h-4 w-4 mr-2" />
                        <span>Documents</span>
                    </div>
                    <p className="text-gray-900">{project.documents} documents</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="flex items-center text-sm text-gray-500 mb-2">
                        <ArrowPathIcon className="h-4 w-4 mr-2" />
                        <span>Progress</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                            className="bg-blue-600 h-2.5 rounded-full" 
                            style={{ width: `${project.progress}%` }}
                        ></div>
                    </div>
                    <p className="text-gray-900 mt-1">{project.tasks.completed}/{project.tasks.total} tasks completed</p>
                </div>
            </div>

            {/* Workflow Steps */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <button 
                    onClick={() => router.push(`/workflows/discovery?projectId=${project.id}`)}
                    className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                >
                    <h3 className="font-medium text-gray-900">Discovery</h3>
                    <p className="text-sm text-gray-500">Initial research and requirements gathering</p>
                </button>
                <button 
                    onClick={() => router.push(`/workflows/analysis?projectId=${project.id}`)}
                    className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                >
                    <h3 className="font-medium text-gray-900">Analysis</h3>
                    <p className="text-sm text-gray-500">Data analysis and insights</p>
                </button>
                <button 
                    onClick={() => router.push(`/workflows/solution?projectId=${project.id}`)}
                    className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                >
                    <h3 className="font-medium text-gray-900">Solution</h3>
                    <p className="text-sm text-gray-500">Solution design and planning</p>
                </button>
                <button 
                    onClick={() => router.push(`/workflows/implementation?projectId=${project.id}`)}
                    className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                >
                    <h3 className="font-medium text-gray-900">Implementation</h3>
                    <p className="text-sm text-gray-500">Execution and delivery</p>
                </button>
            </div>
        </div>
    );
} 