"use client";

import { useState } from 'react';
import {
    FolderIcon,
    UserGroupIcon,
    CalendarIcon,
    ChartBarIcon,
    DocumentTextIcon,
    MagnifyingGlassIcon,
    ArchiveBoxIcon,
    ArrowPathIcon
} from '@heroicons/react/24/outline';

interface ArchivedProject {
    id: string;
    name: string;
    description: string;
    client: string;
    team: string[];
    startDate: string;
    endDate: string;
    duration: string;
    finalPhase: 'discovery' | 'analysis' | 'solution' | 'implementation';
    documents: number;
    archivedAt: string;
}

export default function ProjectArchive() {
    const [projects] = useState<ArchivedProject[]>([
        {
            id: '1',
            name: 'Competitor Analysis 2024',
            description: 'Comprehensive analysis of market competitors',
            client: 'Tech Solutions Inc.',
            team: ['John D.', 'Sarah M.'],
            startDate: '2024-01-15',
            endDate: '2024-03-01',
            duration: '1.5 months',
            finalPhase: 'implementation',
            documents: 8,
            archivedAt: '2024-03-15'
        },
        {
            id: '2',
            name: 'Process Optimization Study',
            description: 'Business process improvement analysis',
            client: 'Global Industries Ltd.',
            team: ['Mike R.', 'Lisa K.'],
            startDate: '2023-11-01',
            endDate: '2024-02-15',
            duration: '3.5 months',
            finalPhase: 'implementation',
            documents: 12,
            archivedAt: '2024-02-20'
        }
    ]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Project Archive</h1>
                    <p className="text-sm text-gray-500">View and manage completed projects</p>
                </div>
                <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2">
                    <ArchiveBoxIcon className="h-5 w-5" />
                    Archive Projects
                </button>
            </div>

            {/* Search and Filters */}
            <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center gap-4">
                    <div className="flex-1 relative">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search archived projects..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <option value="">All Clients</option>
                        <option value="tech-solutions">Tech Solutions Inc.</option>
                        <option value="global-industries">Global Industries Ltd.</option>
                    </select>
                    <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <option value="">All Phases</option>
                        <option value="discovery">Discovery</option>
                        <option value="analysis">Analysis</option>
                        <option value="solution">Solution</option>
                        <option value="implementation">Implementation</option>
                    </select>
                </div>
            </div>

            {/* Archived Projects List */}
            <div className="bg-white rounded-lg shadow-sm">
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-lg font-medium text-gray-900">Archived Projects</h2>
                </div>
                <div className="divide-y divide-gray-200">
                    {projects.map((project) => (
                        <div key={project.id} className="p-6">
                            <div className="flex items-start justify-between">
                                <div className="flex items-start space-x-4">
                                    <div className="p-2 bg-gray-100 rounded-lg">
                                        <FolderIcon className="h-5 w-5 text-gray-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900">{project.name}</h3>
                                        <p className="text-sm text-gray-500">{project.client}</p>
                                        <p className="mt-1 text-sm text-gray-600">{project.description}</p>
                                    </div>
                                </div>
                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                                    Archived {new Date(project.archivedAt).toLocaleDateString()}
                                </span>
                            </div>

                            {/* Project Details */}
                            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="flex items-center text-sm text-gray-500">
                                    <UserGroupIcon className="h-4 w-4 mr-2" />
                                    <span>{project.team.length} members</span>
                                </div>
                                <div className="flex items-center text-sm text-gray-500">
                                    <CalendarIcon className="h-4 w-4 mr-2" />
                                    <span>{project.duration}</span>
                                </div>
                                <div className="flex items-center text-sm text-gray-500">
                                    <ChartBarIcon className="h-4 w-4 mr-2" />
                                    <span className="capitalize">{project.finalPhase}</span>
                                </div>
                                <div className="flex items-center text-sm text-gray-500">
                                    <DocumentTextIcon className="h-4 w-4 mr-2" />
                                    <span>{project.documents} documents</span>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="mt-4 flex space-x-2">
                                <button className="flex-1 px-3 py-2 text-sm text-blue-600 hover:text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
                                    View Details
                                </button>
                                <button className="flex-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                    Restore Project
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
} 