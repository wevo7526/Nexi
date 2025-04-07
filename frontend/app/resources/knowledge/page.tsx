"use client";

import { useState } from 'react';
import {
    BookOpenIcon,
    MagnifyingGlassIcon,
    DocumentTextIcon,
    TagIcon,
    UserGroupIcon,
    CalendarIcon,
    ArrowUpTrayIcon,
    ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';

interface KnowledgeArticle {
    id: string;
    title: string;
    description: string;
    category: string;
    tags: string[];
    author: string;
    lastUpdated: string;
    views: number;
    comments: number;
    isPinned: boolean;
}

export default function KnowledgeBase() {
    const [articles] = useState<KnowledgeArticle[]>([
        {
            id: '1',
            title: 'Project Management Best Practices',
            description: 'Comprehensive guide to effective project management methodologies and techniques.',
            category: 'Project Management',
            tags: ['methodology', 'best-practices', 'planning'],
            author: 'Sarah M.',
            lastUpdated: '2024-03-21',
            views: 245,
            comments: 12,
            isPinned: true
        },
        {
            id: '2',
            title: 'Client Communication Guidelines',
            description: 'Standard procedures and templates for maintaining effective client communication.',
            category: 'Communication',
            tags: ['client-relations', 'communication', 'templates'],
            author: 'John D.',
            lastUpdated: '2024-03-20',
            views: 189,
            comments: 8,
            isPinned: false
        }
    ]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Knowledge Base</h1>
                    <p className="text-sm text-gray-500">Access and contribute to our knowledge resources</p>
                </div>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                    <ArrowUpTrayIcon className="h-5 w-5" />
                    Add Article
                </button>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search knowledge base..."
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

            {/* Articles List */}
            <div className="space-y-4">
                {articles.map((article) => (
                    <div key={article.id} className="bg-white rounded-lg shadow-sm">
                        <div className="p-6">
                            <div className="flex items-start justify-between">
                                <div className="flex items-start space-x-4">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <BookOpenIcon className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-lg font-medium text-gray-900">{article.title}</h3>
                                            {article.isPinned && (
                                                <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                                                    Pinned
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-500 mt-1">{article.description}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                    <div className="flex items-center gap-1">
                                        <DocumentTextIcon className="h-4 w-4" />
                                        <span>{article.views}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <ChatBubbleLeftRightIcon className="h-4 w-4" />
                                        <span>{article.comments}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Tags and Metadata */}
                            <div className="mt-4 flex flex-wrap gap-2">
                                {article.tags.map((tag) => (
                                    <span
                                        key={tag}
                                        className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full flex items-center gap-1"
                                    >
                                        <TagIcon className="h-3 w-3" />
                                        {tag}
                                    </span>
                                ))}
                            </div>
                            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div className="flex items-center text-gray-500">
                                    <UserGroupIcon className="h-4 w-4 mr-2" />
                                    <span>{article.author}</span>
                                </div>
                                <div className="flex items-center text-gray-500">
                                    <CalendarIcon className="h-4 w-4 mr-2" />
                                    <span>Updated {new Date(article.lastUpdated).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center text-gray-500">
                                    <DocumentTextIcon className="h-4 w-4 mr-2" />
                                    <span>{article.category}</span>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="mt-4 flex space-x-2">
                                <button className="flex-1 px-3 py-2 text-sm text-blue-600 hover:text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
                                    Edit Article
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