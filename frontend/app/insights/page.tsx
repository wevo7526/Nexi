"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import dynamic from 'next/dynamic';
import { ChartData, ChartOptions, ChartType } from 'chart.js';
import { 
    ArrowUpIcon, 
    ArrowDownIcon, 
    ChartBarIcon, 
    CurrencyDollarIcon, 
    UserGroupIcon, 
    ShoppingCartIcon 
} from '@heroicons/react/24/outline';

// Dynamically import chart components
const Chart = dynamic(() => import('react-chartjs-2').then(mod => mod.Line), { ssr: false });
const BarChart = dynamic(() => import('react-chartjs-2').then(mod => mod.Bar), { ssr: false });
const PieChart = dynamic(() => import('react-chartjs-2').then(mod => mod.Pie), { ssr: false });

// Register Chart.js components
if (typeof window !== 'undefined') {
    const {
        Chart: ChartJS,
        CategoryScale,
        LinearScale,
        PointElement,
        LineElement,
        BarElement,
        ArcElement,
        Title,
        Tooltip,
        Legend
    } = require('chart.js');
    
    ChartJS.register(
        CategoryScale,
        LinearScale,
        PointElement,
        LineElement,
        BarElement,
        ArcElement,
        Title,
        Tooltip,
        Legend
    );
}

interface MetricCard {
    title: string;
    value: string;
    change: number;
    icon: React.ReactNode;
    color: string;
}

interface ChartDataProps {
    type: 'line' | 'bar' | 'pie';
    data: ChartData<ChartType>;
    options: ChartOptions<ChartType>;
}

export default function InsightsPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [metrics, setMetrics] = useState<MetricCard[]>([]);
    const [revenueChart, setRevenueChart] = useState<ChartDataProps | null>(null);
    const [customerChart, setCustomerChart] = useState<ChartDataProps | null>(null);
    const [productChart, setProductChart] = useState<ChartDataProps | null>(null);
    const router = useRouter();

    useEffect(() => {
        checkAuth();
        fetchInsights();
    }, []);

    const checkAuth = async () => {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error || !session) {
            router.push('/auth');
        }
    };

    const fetchInsights = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const response = await fetch('http://localhost:5000/api/insights', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch insights');
            }

            const data = await response.json();
            
            // Set metrics
            setMetrics([
                {
                    title: 'Total Revenue',
                    value: '$124,500',
                    change: 12.5,
                    icon: <CurrencyDollarIcon className="h-6 w-6" />,
                    color: 'bg-green-100 text-green-800'
                },
                {
                    title: 'Active Customers',
                    value: '2,450',
                    change: 8.2,
                    icon: <UserGroupIcon className="h-6 w-6" />,
                    color: 'bg-blue-100 text-blue-800'
                },
                {
                    title: 'Orders',
                    value: '1,280',
                    change: -3.1,
                    icon: <ShoppingCartIcon className="h-6 w-6" />,
                    color: 'bg-yellow-100 text-yellow-800'
                },
                {
                    title: 'Conversion Rate',
                    value: '3.2%',
                    change: 1.8,
                    icon: <ChartBarIcon className="h-6 w-6" />,
                    color: 'bg-purple-100 text-purple-800'
                }
            ]);

            // Set revenue chart
            setRevenueChart({
                type: 'line',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    datasets: [{
                        label: 'Revenue',
                        data: [65000, 59000, 80000, 81000, 96000, 124500],
                        borderColor: 'rgb(59, 130, 246)',
                        tension: 0.1
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Revenue Trend'
                        }
                    }
                }
            });

            // Set customer chart
            setCustomerChart({
                type: 'bar',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    datasets: [{
                        label: 'New Customers',
                        data: [150, 180, 220, 280, 320, 350],
                        backgroundColor: 'rgba(59, 130, 246, 0.5)'
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        title: {
                            display: true,
                            text: 'New Customer Acquisition'
                        }
                    }
                }
            });

            // Set product chart
            setProductChart({
                type: 'pie',
                data: {
                    labels: ['Product A', 'Product B', 'Product C', 'Product D'],
                    datasets: [{
                        data: [300, 250, 200, 150],
                        backgroundColor: [
                            'rgba(59, 130, 246, 0.5)',
                            'rgba(16, 185, 129, 0.5)',
                            'rgba(245, 158, 11, 0.5)',
                            'rgba(239, 68, 68, 0.5)'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Product Distribution'
                        }
                    }
                }
            });

            setIsLoading(false);
        } catch (error) {
            console.error('Error fetching insights:', error);
            setError('Failed to load insights data');
            setIsLoading(false);
        }
    };

    const renderChart = (chartData: ChartDataProps) => {
        const { type, data, options } = chartData;
        
        switch (type) {
            case 'line':
                return <Chart data={data as ChartData<'line'>} options={options as ChartOptions<'line'>} />;
            case 'bar':
                return <BarChart data={data as ChartData<'bar'>} options={options as ChartOptions<'bar'>} />;
            case 'pie':
                return <PieChart data={data as ChartData<'pie'>} options={options as ChartOptions<'pie'>} />;
            default:
                return <div>Unsupported chart type</div>;
        }
    };

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">Business Insights</h1>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {metrics.map((metric, index) => (
                    <div key={index} className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 rounded-full ${metric.color}`}>
                                {metric.icon}
                            </div>
                            <div className="flex items-center">
                                {metric.change >= 0 ? (
                                    <ArrowUpIcon className="h-5 w-5 text-green-500" />
                                ) : (
                                    <ArrowDownIcon className="h-5 w-5 text-red-500" />
                                )}
                                <span className={`ml-1 text-sm font-medium ${
                                    metric.change >= 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                    {Math.abs(metric.change)}%
                                </span>
                            </div>
                        </div>
                        <h3 className="text-sm font-medium text-gray-500">{metric.title}</h3>
                        <p className="text-2xl font-semibold mt-2">{metric.value}</p>
                    </div>
                ))}
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Chart */}
                <div className="bg-white rounded-lg shadow p-6">
                    {revenueChart && renderChart(revenueChart)}
                </div>

                {/* Customer Chart */}
                <div className="bg-white rounded-lg shadow p-6">
                    {customerChart && renderChart(customerChart)}
                </div>

                {/* Product Chart */}
                <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
                    {productChart && renderChart(productChart)}
                </div>
            </div>
        </div>
    );
} 