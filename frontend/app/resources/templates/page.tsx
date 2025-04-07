"use client";

import { useState } from 'react';
import {
    DocumentDuplicateIcon,
    MagnifyingGlassIcon,
    FolderIcon,
    DocumentTextIcon,
    UserGroupIcon,
    CalendarIcon,
    ArrowUpTrayIcon,
    StarIcon
} from '@heroicons/react/24/outline';

interface Template {
    id: string;
    name: string;
    description: string;
    category: string;
    type: string;
    lastUpdated: string;
    createdBy: string;
    downloads: number;
    isFavorite: boolean;
}

export default function Templates() {
    const [templates] = useState<Template[]>([
        {
            id: '1',
            name: 'Project Charter Template',
            description: 'Standard template for creating new project charters with all required sections.',
            category: 'Project Management',
            type: 'Document',
            lastUpdated: '2024-03-21',
            createdBy: 'Sarah M.',
            downloads: 156,
            isFavorite: true
        },
        {
            id: '2',
            name: 'Client Meeting Agenda',
            description: 'Professional template for structuring client meeting agendas and notes.',
            category: 'Communication',
            type: 'Document',
            lastUpdated: '2024-03-20',
            createdBy: 'John D.',
            downloads: 89,
            isFavorite: false
        }
    ]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Templates</h1>
                    <p className="text-sm text-gray-500">Access and manage document templates</p>
                </div>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                    <ArrowUpTrayIcon className="h-5 w-5" />
                    Upload Template
                </button>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search templates..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
                <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option value="">All Categories</option>
                    <option value="project-management">Project Management</option>
                    <option value="communication">Communication</option>
                    <option value="technical">Technical</option>
                </select>
            </div>

            {/* Templates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((template) => (
                    <div key={template.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                        <div className="p-6">
                            <div className="flex items-start justify-between">
                                <div className="flex items-start space-x-4">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <DocumentDuplicateIcon className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-lg font-medium text-gray-900">{template.name}</h3>
                                            {template.isFavorite && (
                                                <StarIcon className="h-4 w-4 text-yellow-400" />
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-500 mt-1">{template.description}</p>
                                    </div>
                                </div>
                                <button className="p-2 text-gray-400 hover:text-gray-600">
                                    <StarIcon className="h-5 w-5" />
                                </button>
                            </div>

                            {/* Template Details */}
                            <div className="mt-4 space-y-2">
                                <div className="flex items-center text-sm text-gray-500">
                                    <FolderIcon className="h-4 w-4 mr-2" />
                                    <span>{template.category}</span>
                                </div>
                                <div className="flex items-center text-sm text-gray-500">
                                    <DocumentTextIcon className="h-4 w-4 mr-2" />
                                    <span>{template.type}</span>
                                </div>
                                <div className="flex items-center text-sm text-gray-500">
                                    <UserGroupIcon className="h-4 w-4 mr-2" />
                                    <span>{template.createdBy}</span>
                                </div>
                                <div className="flex items-center text-sm text-gray-500">
                                    <CalendarIcon className="h-4 w-4 mr-2" />
                                    <span>Updated {new Date(template.lastUpdated).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center text-sm text-gray-500">
                                    <DocumentDuplicateIcon className="h-4 w-4 mr-2" />
                                    <span>{template.downloads} downloads</span>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="mt-4 flex space-x-2">
                                <button className="flex-1 px-3 py-2 text-sm text-blue-600 hover:text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
                                    Use Template
                                </button>
                                <button className="flex-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                    Preview
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
} 