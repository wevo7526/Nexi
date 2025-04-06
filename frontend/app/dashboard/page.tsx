"use client";

import { useState } from 'react';
import {
    ChartBarIcon,
    DocumentTextIcon,
    ClockIcon,
    UserGroupIcon
} from '@heroicons/react/24/outline';

interface Project {
    id: string;
    name: string;
    status: string;
    progress: number;
    team: string[];
    lastUpdated: string;
}

export default function Dashboard() {
    const [activeProjects] = useState<Project[]>([
        {
            id: '1',
            name: 'Market Analysis for Tech Corp',
            status: 'In Progress',
            progress: 65,
            team: ['John D.', 'Sarah M.'],
            lastUpdated: '2 hours ago'
        },
        {
            id: '2',
            name: 'Business Process Optimization',
            status: 'Planning',
            progress: 30,
            team: ['Mike R.', 'Lisa K.'],
            lastUpdated: '1 day ago'
        }
    ]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    New Project
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm">
                    <div className="flex items-center">
                        <div className="p-3 bg-blue-100 rounded-full">
                            <ChartBarIcon className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Active Projects</p>
                            <p className="text-2xl font-semibold text-gray-900">12</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm">
                    <div className="flex items-center">
                        <div className="p-3 bg-green-100 rounded-full">
                            <DocumentTextIcon className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Completed Reports</p>
                            <p className="text-2xl font-semibold text-gray-900">28</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm">
                    <div className="flex items-center">
                        <div className="p-3 bg-yellow-100 rounded-full">
                            <ClockIcon className="h-6 w-6 text-yellow-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Pending Tasks</p>
                            <p className="text-2xl font-semibold text-gray-900">8</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm">
                    <div className="flex items-center">
                        <div className="p-3 bg-purple-100 rounded-full">
                            <UserGroupIcon className="h-6 w-6 text-purple-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Team Members</p>
                            <p className="text-2xl font-semibold text-gray-900">24</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Active Projects */}
            <div className="bg-white rounded-lg shadow-sm">
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-lg font-medium text-gray-900">Active Projects</h2>
                </div>
                <div className="divide-y divide-gray-200">
                    {activeProjects.map((project) => (
                        <div key={project.id} className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-900">{project.name}</h3>
                                    <p className="text-sm text-gray-500">{project.team.join(', ')}</p>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <span className="text-sm text-gray-500">{project.lastUpdated}</span>
                                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                        {project.status}
                                    </span>
                                </div>
                            </div>
                            <div className="mt-4">
                                <div className="relative pt-1">
                                    <div className="flex mb-2 items-center justify-between">
                                        <div>
                                            <span className="text-xs font-semibold inline-block text-blue-600">
                                                {project.progress}%
                                            </span>
                                        </div>
                                    </div>
                                    <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-100">
                                        <div
                                            style={{ width: `${project.progress}%` }}
                                            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-600"
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
} 