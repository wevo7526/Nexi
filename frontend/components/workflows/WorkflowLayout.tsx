"use client";

import { ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

interface WorkflowLayoutProps {
    children: ReactNode;
    title: string;
    description: string;
    projectName?: string;
    clientName?: string;
}

export default function WorkflowLayout({
    children,
    title,
    description,
    projectName,
    clientName
}: WorkflowLayoutProps) {
    const searchParams = useSearchParams();
    const projectId = searchParams.get('projectId');

    if (!projectId) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <h2 className="text-xl font-semibold text-gray-900">No Project Selected</h2>
                    <p className="mt-2 text-gray-600">Please select a project to view its workflow.</p>
                    <Link 
                        href="/projects"
                        className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Go to Projects
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4">
                    <Link
                        href={`/projects/${projectId}`}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
                        <p className="text-sm text-gray-500">{description}</p>
                        {projectName && clientName && (
                            <p className="text-sm text-gray-500 mt-1">
                                Project: {projectName} - Client: {clientName}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="bg-white rounded-lg shadow-sm">
                {children}
            </div>
        </div>
    );
} 