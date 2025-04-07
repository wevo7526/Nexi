"use client";

import { useState } from 'react';
import {
    DocumentTextIcon,
    MagnifyingGlassIcon,
    ChartBarIcon,
    CalendarIcon,
    UserGroupIcon,
    ArrowUpTrayIcon,
    DocumentArrowDownIcon,
    EyeIcon
} from '@heroicons/react/24/outline';

interface Report {
    id: string;
    title: string;
    description: string;
    type: string;
    status: 'draft' | 'published' | 'archived';
    createdBy: string;
    createdAt: string;
    lastViewed: string;
    views: number;
    downloads: number;
}

export default function Reports() {
    const [reports] = useState<Report[]>([
        {
            id: '1',
            title: 'Q1 2024 Project Performance Report',
            description: 'Comprehensive analysis of project performance metrics and KPIs for Q1 2024.',
            type: 'Performance',
            status: 'published',
            createdBy: 'Sarah M.',
            createdAt: '2024-03-21',
            lastViewed: '2024-03-22',
            views: 45,
            downloads: 12
        },
        {
            id: '2',
            title: 'Client Satisfaction Survey Results',
            description: 'Analysis of client feedback and satisfaction metrics from recent surveys.',
            type: 'Client',
            status: 'draft',
            createdBy: 'John D.',
            createdAt: '2024-03-20',
            lastViewed: '2024-03-21',
            views: 28,
            downloads: 8
        }
    ]);

    const getStatusColor = (status: Report['status']) => {
        switch (status) {
            case 'published':
                return 'bg-green-100 text-green-800';
            case 'draft':
                return 'bg-yellow-100 text-yellow-800';
            case 'archived':
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Reports</h1>
                    <p className="text-sm text-gray-500">Access and manage project reports</p>
                </div>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                    <ArrowUpTrayIcon className="h-5 w-5" />
                    Generate Report
                </button>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search reports..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
                <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option value="">All Types</option>
                    <option value="performance">Performance</option>
                    <option value="client">Client</option>
                    <option value="financial">Financial</option>
                </select>
            </div>

            {/* Reports List */}
            <div className="space-y-4">
                {reports.map((report) => (
                    <div key={report.id} className="bg-white rounded-lg shadow-sm">
                        <div className="p-6">
                            <div className="flex items-start justify-between">
                                <div className="flex items-start space-x-4">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <ChartBarIcon className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-lg font-medium text-gray-900">{report.title}</h3>
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(report.status)}`}>
                                                {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-500 mt-1">{report.description}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                    <div className="flex items-center gap-1">
                                        <EyeIcon className="h-4 w-4" />
                                        <span>{report.views}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <DocumentArrowDownIcon className="h-4 w-4" />
                                        <span>{report.downloads}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Report Details */}
                            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div className="flex items-center text-gray-500">
                                    <DocumentTextIcon className="h-4 w-4 mr-2" />
                                    <span>{report.type}</span>
                                </div>
                                <div className="flex items-center text-gray-500">
                                    <UserGroupIcon className="h-4 w-4 mr-2" />
                                    <span>{report.createdBy}</span>
                                </div>
                                <div className="flex items-center text-gray-500">
                                    <CalendarIcon className="h-4 w-4 mr-2" />
                                    <span>Created {new Date(report.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center text-gray-500">
                                    <CalendarIcon className="h-4 w-4 mr-2" />
                                    <span>Last viewed {new Date(report.lastViewed).toLocaleDateString()}</span>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="mt-4 flex space-x-2">
                                <button className="flex-1 px-3 py-2 text-sm text-blue-600 hover:text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
                                    View Report
                                </button>
                                <button className="flex-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                    Download
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
} 