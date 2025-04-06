"use client";

import { useState } from 'react';
import {
    FolderIcon,
    UserGroupIcon,
    CalendarIcon,
    ChartBarIcon,
    DocumentTextIcon,
    PlusIcon,
    MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

interface Project {
    id: string;
    name: string;
    description: string;
    status: 'planning' | 'active' | 'completed' | 'archived';
    client: string;
    team: string[];
    startDate: string;
    progress: number;
    phase: 'discovery' | 'analysis' | 'solution' | 'implementation';
}

export default function ActiveProjects() {
    const [projects] = useState<Project[]>([
        {
            id: '1',
            name: 'Market Analysis for Tech Corp',
            description: 'Comprehensive market analysis and competitor research',
            status: 'active',
            client: 'Tech Corp Inc.',
            team: ['John D.', 'Sarah M.', 'Mike R.'],
            startDate: '2024-03-15',
            progress: 65,
            phase: 'analysis'
        },
        {
            id: '2',
            name: 'Business Process Optimization',
            description: 'Streamline operations and improve efficiency',
            status: 'planning',
            client: 'Global Industries Ltd.',
            team: ['Lisa K.', 'David W.'],
            startDate: '2024-04-01',
            progress: 30,
            phase: 'discovery'
        }
    ]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Active Projects</h1>
                    <p className="text-sm text-gray-500">Manage and track your ongoing projects</p>
                </div>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                    <PlusIcon className="h-5 w-5" />
                    New Project
                </button>
            </div>

            {/* Search and Filters */}
            <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center gap-4">
                    <div className="flex-1 relative">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search projects..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <option value="">All Phases</option>
                        <option value="discovery">Discovery</option>
                        <option value="analysis">Analysis</option>
                        <option value="solution">Solution</option>
                        <option value="implementation">Implementation</option>
                    </select>
                    <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <option value="">All Status</option>
                        <option value="planning">Planning</option>
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                        <option value="archived">Archived</option>
                    </select>
                </div>
            </div>

            {/* Projects Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                    <div key={project.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                        <div className="p-6">
                            <div className="flex items-start justify-between">
                                <div className="flex items-start space-x-3">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <FolderIcon className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900">{project.name}</h3>
                                        <p className="text-sm text-gray-500">{project.client}</p>
                                    </div>
                                </div>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                    project.status === 'active' ? 'bg-green-100 text-green-800' :
                                    project.status === 'planning' ? 'bg-blue-100 text-blue-800' :
                                    project.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                                    'bg-yellow-100 text-yellow-800'
                                }`}>
                                    {project.status}
                                </span>
                            </div>
                            <p className="mt-2 text-sm text-gray-600">{project.description}</p>
                            
                            {/* Progress Bar */}
                            <div className="mt-4">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm font-medium text-gray-700">Progress</span>
                                    <span className="text-sm text-gray-500">{project.progress}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-blue-600 h-2 rounded-full"
                                        style={{ width: `${project.progress}%` }}
                                    ></div>
                                </div>
                            </div>

                            {/* Project Details */}
                            <div className="mt-4 grid grid-cols-2 gap-4">
                                <div className="flex items-center text-sm text-gray-500">
                                    <UserGroupIcon className="h-4 w-4 mr-2" />
                                    <span>{project.team.length} members</span>
                                </div>
                                <div className="flex items-center text-sm text-gray-500">
                                    <CalendarIcon className="h-4 w-4 mr-2" />
                                    <span>Started {new Date(project.startDate).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center text-sm text-gray-500">
                                    <ChartBarIcon className="h-4 w-4 mr-2" />
                                    <span className="capitalize">{project.phase}</span>
                                </div>
                                <div className="flex items-center text-sm text-gray-500">
                                    <DocumentTextIcon className="h-4 w-4 mr-2" />
                                    <span>3 documents</span>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="mt-4 flex space-x-2">
                                <button className="flex-1 px-3 py-2 text-sm text-blue-600 hover:text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
                                    View Details
                                </button>
                                <button className="flex-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                    Team
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
} 