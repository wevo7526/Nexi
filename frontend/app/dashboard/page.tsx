"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, checkAuth } from '../../lib/supabaseClient';
import {
    ChartBarIcon,
    DocumentTextIcon,
    CalendarIcon,
    BuildingOfficeIcon,
    ArrowTrendingUpIcon,
    ArrowTrendingDownIcon,
    ClockIcon,
    CheckCircleIcon,
    XCircleIcon,
    CurrencyDollarIcon,
    UserGroupIcon,
    DocumentCheckIcon,
    ChartPieIcon
} from '@heroicons/react/24/outline';

interface AnalyticsData {
    totalRevenue: number;
    revenueGrowth: number;
    activeClients: number;
    clientGrowth: number;
    documentsGenerated: number;
    documentGrowth: number;
    averageCompletionTime: number;
    timeGrowth: number;
}

export default function Dashboard() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [analytics, setAnalytics] = useState<AnalyticsData>({
        totalRevenue: 0,
        revenueGrowth: 0,
        activeClients: 0,
        clientGrowth: 0,
        documentsGenerated: 0,
        documentGrowth: 0,
        averageCompletionTime: 0,
        timeGrowth: 0
    });

    useEffect(() => {
        const loadDashboard = async () => {
            try {
                // Check authentication
                const { session, error } = await checkAuth();
                
                if (error || !session) {
                    console.error('Auth error:', error);
                    router.push('/auth?redirectTo=/dashboard');
                    return;
                }
                
                // Fetch analytics data directly from Supabase
                const { data, error: dbError } = await supabase
                    .from('analytics')
                    .select('*')
                    .eq('user_id', session.user.id)
                    .single();
                
                if (dbError) {
                    console.error('Database error:', dbError);
                    // Use default values if no data exists
                    setAnalytics({
                        totalRevenue: 0,
                        revenueGrowth: 0,
                        activeClients: 0,
                        clientGrowth: 0,
                        documentsGenerated: 0,
                        documentGrowth: 0,
                        averageCompletionTime: 0,
                        timeGrowth: 0
                    });
                } else {
                    // Set analytics data from database
                    setAnalytics({
                        totalRevenue: data.total_revenue || 0,
                        revenueGrowth: data.revenue_growth || 0,
                        activeClients: data.active_clients || 0,
                        clientGrowth: data.client_growth || 0,
                        documentsGenerated: data.documents_generated || 0,
                        documentGrowth: data.document_growth || 0,
                        averageCompletionTime: data.average_completion_time || 0,
                        timeGrowth: data.time_growth || 0
                    });
                }
            } catch (err) {
                console.error('Error loading dashboard:', err);
                // Use default values on error
                setAnalytics({
                    totalRevenue: 0,
                    revenueGrowth: 0,
                    activeClients: 0,
                    clientGrowth: 0,
                    documentsGenerated: 0,
                    documentGrowth: 0,
                    averageCompletionTime: 0,
                    timeGrowth: 0
                });
            } finally {
                // Always set loading to false after a short delay to ensure UI updates
                setTimeout(() => {
                    setIsLoading(false);
                }, 500);
            }
        };

        loadDashboard();
    }, [router]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const formatPercentage = (value: number) => {
        return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
    };

    const formatTime = (days: number) => {
        return `${days.toFixed(1)} days`;
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex items-center justify-center min-h-[60vh]">
                        <div className="flex flex-col items-center gap-4">
                            <svg className="animate-spin h-8 w-8 text-blue-500" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            <p className="text-gray-500">Loading analytics...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
                    <p className="text-sm text-gray-500 mt-1">Key metrics and insights for your business</p>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Revenue */}
                    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                                <p className="text-3xl font-bold text-gray-900 mt-1">{formatCurrency(analytics.totalRevenue)}</p>
                            </div>
                            <div className="p-3 bg-green-50 rounded-full">
                                <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-sm">
                            <span className={`flex items-center ${analytics.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {analytics.revenueGrowth >= 0 ? (
                                    <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                                ) : (
                                    <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />
                                )}
                                {formatPercentage(analytics.revenueGrowth)} vs last month
                            </span>
                        </div>
                    </div>

                    {/* Active Clients */}
                    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Active Clients</p>
                                <p className="text-3xl font-bold text-gray-900 mt-1">{analytics.activeClients}</p>
                            </div>
                            <div className="p-3 bg-blue-50 rounded-full">
                                <UserGroupIcon className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-sm">
                            <span className={`flex items-center ${analytics.clientGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {analytics.clientGrowth >= 0 ? (
                                    <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                                ) : (
                                    <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />
                                )}
                                {formatPercentage(analytics.clientGrowth)} vs last month
                            </span>
                        </div>
                    </div>

                    {/* Documents Generated */}
                    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Documents Generated</p>
                                <p className="text-3xl font-bold text-gray-900 mt-1">{analytics.documentsGenerated}</p>
                            </div>
                            <div className="p-3 bg-purple-50 rounded-full">
                                <DocumentCheckIcon className="h-6 w-6 text-purple-600" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-sm">
                            <span className={`flex items-center ${analytics.documentGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {analytics.documentGrowth >= 0 ? (
                                    <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                                ) : (
                                    <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />
                                )}
                                {formatPercentage(analytics.documentGrowth)} vs last month
                            </span>
                        </div>
                    </div>

                    {/* Average Completion Time */}
                    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Avg. Completion Time</p>
                                <p className="text-3xl font-bold text-gray-900 mt-1">{formatTime(analytics.averageCompletionTime)}</p>
                            </div>
                            <div className="p-3 bg-yellow-50 rounded-full">
                                <ClockIcon className="h-6 w-6 text-yellow-600" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-sm">
                            <span className={`flex items-center ${analytics.timeGrowth <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {analytics.timeGrowth <= 0 ? (
                                    <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                                ) : (
                                    <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />
                                )}
                                {formatPercentage(-analytics.timeGrowth)} vs last month
                            </span>
                        </div>
                    </div>
                </div>

                {/* Analytics Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Revenue Trend */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">Revenue Trend</h3>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-500">Last 6 months</span>
                                <ChartPieIcon className="h-5 w-5 text-gray-400" />
                            </div>
                        </div>
                        <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                            <p className="text-gray-500">Revenue chart will be implemented here</p>
                        </div>
                    </div>

                    {/* Client Growth */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">Client Growth</h3>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-500">Last 6 months</span>
                                <ChartBarIcon className="h-5 w-5 text-gray-400" />
                            </div>
                        </div>
                        <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                            <p className="text-gray-500">Client growth chart will be implemented here</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 