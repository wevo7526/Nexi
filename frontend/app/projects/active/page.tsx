"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    PlusIcon,
    MagnifyingGlassIcon,
    FunnelIcon,
    TrashIcon,
    PencilSquareIcon,
    EyeIcon,
    ChartBarIcon,
    UserGroupIcon,
    CalendarIcon,
    DocumentTextIcon,
    ArrowPathIcon
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

export default function ActiveProjects() {
    const router = useRouter();
    const [projects, setProjects] = useState<Project[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

    // Fetch projects from Supabase
    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const response = await fetch('/api/projects');
            if (!response.ok) throw new Error('Failed to fetch projects');
            const data = await response.json();
            setProjects(data);
        } catch (error) {
            console.error('Error fetching projects:', error);
        }
    };

    const handleDelete = async (projectId: string) => {
        try {
            const response = await fetch(`/api/projects/${projectId}`, {
                method: 'DELETE',
            });
            if (!response.ok) throw new Error('Failed to delete project');
            
            // Update local state
            setProjects(projects.filter(project => project.id !== projectId));
            setIsDeleteModalOpen(false);
            setProjectToDelete(null);
        } catch (error) {
            console.error('Error deleting project:', error);
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

    const filteredProjects = projects.filter(project => {
        const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            project.client.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = !statusFilter || project.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Active Projects</h1>
                    <p className="text-sm text-gray-500">Manage and track your ongoing projects</p>
                </div>
                <button 
                    onClick={() => router.push('/projects/new')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                    <PlusIcon className="h-5 w-5" />
                    New Project
                </button>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search projects..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
                <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                    <option value="">All Statuses</option>
                    <option value="planning">Planning</option>
                    <option value="in-progress">In Progress</option>
                    <option value="on-hold">On Hold</option>
                    <option value="completed">Completed</option>
                </select>
            </div>

            {/* Projects List */}
            <div className="space-y-4">
                {filteredProjects.map((project) => (
                    <div key={project.id} className="bg-white rounded-lg shadow-sm">
                        <div className="p-6">
                            <div className="flex items-start justify-between">
                                <div className="flex items-start space-x-4">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <ChartBarIcon className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-lg font-medium text-gray-900">{project.name}</h3>
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(project.status)}`}>
                                                {project.status.replace('-', ' ')}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-500 mt-1">{project.description}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => router.push(`/projects/${project.id}`)}
                                        className="p-2 text-gray-400 hover:text-gray-600"
                                    >
                                        <EyeIcon className="h-5 w-5" />
                                    </button>
                                    <button 
                                        onClick={() => router.push(`/projects/${project.id}/edit`)}
                                        className="p-2 text-gray-400 hover:text-gray-600"
                                    >
                                        <PencilSquareIcon className="h-5 w-5" />
                                    </button>
                                    <button 
                                        onClick={() => {
                                            setProjectToDelete(project.id);
                                            setIsDeleteModalOpen(true);
                                        }}
                                        className="p-2 text-gray-400 hover:text-red-600"
                                    >
                                        <TrashIcon className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Project Details */}
                            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="flex items-center text-sm text-gray-500">
                                    <UserGroupIcon className="h-4 w-4 mr-2" />
                                    <span>{project.team.join(', ')}</span>
                                </div>
                                <div className="flex items-center text-sm text-gray-500">
                                    <CalendarIcon className="h-4 w-4 mr-2" />
                                    <span>{new Date(project.startDate).toLocaleDateString()} - {new Date(project.endDate).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center text-sm text-gray-500">
                                    <DocumentTextIcon className="h-4 w-4 mr-2" />
                                    <span>{project.documents} documents</span>
                                </div>
                                <div className="flex items-center text-sm text-gray-500">
                                    <ArrowPathIcon className="h-4 w-4 mr-2" />
                                    <span>{project.tasks.completed}/{project.tasks.total} tasks</span>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="mt-4">
                                <div className="flex items-center justify-between text-sm text-gray-500 mb-1">
                                    <span>Progress</span>
                                    <span>{project.progress}%</span>
                                </div>
                                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-blue-600 transition-all duration-300"
                                        style={{ width: `${project.progress}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Delete Project</h3>
                        <p className="text-sm text-gray-500 mb-6">
                            Are you sure you want to delete this project? This action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setIsDeleteModalOpen(false);
                                    setProjectToDelete(null);
                                }}
                                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => projectToDelete && handleDelete(projectToDelete)}
                                className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
} 