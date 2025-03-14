import React from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

const VisualDashboard = ({ data = {} }) => {
    console.log('VisualDashboard received data:', data);
    
    // Safely extract data with defaults
    const {
        visual_data = {
            portfolio_performance: [],
            allocations: { labels: [], values: [] }
        },
        recommendations = [],
        educational_tips = [],
        multi_scenario_analysis = []
    } = data;

    console.log('Extracted visual_data:', visual_data);
    console.log('Portfolio performance:', visual_data.portfolio_performance);
    console.log('Allocations:', visual_data.allocations);

    // Extract performance and allocation data
    const portfolio_performance = visual_data.portfolio_performance || [];
    const allocations = visual_data.allocations || { labels: [], values: [] };

    // Check if we have valid data to display charts
    const hasPerformanceData = Array.isArray(portfolio_performance) && portfolio_performance.length > 0;
    const hasAllocationData = allocations && 
                            Array.isArray(allocations.labels) && 
                            Array.isArray(allocations.values) && 
                            allocations.labels.length > 0 && 
                            allocations.values.length === allocations.labels.length;

    console.log('Has performance data:', hasPerformanceData);
    console.log('Has allocation data:', hasAllocationData);

    // Portfolio Performance Chart Options
    const performanceOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Portfolio Performance Over Time'
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Return (%)'
                },
                ticks: {
                    callback: function(value) {
                        return value + '%';
                    }
                }
            },
            x: {
                title: {
                    display: true,
                    text: 'Time Period'
                }
            }
        }
    };

    // Portfolio Allocation Chart Options
    const allocationOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'right',
            },
            title: {
                display: true,
                text: 'Portfolio Allocation'
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        const label = context.label || '';
                        const value = context.raw || 0;
                        return `${label}: ${value}%`;
                    }
                }
            }
        }
    };

    // Prepare data for the performance line chart
    const performanceData = {
        labels: Array.from({ length: portfolio_performance.length }, (_, i) => `Period ${i + 1}`),
        datasets: [
            {
                label: 'Portfolio Return',
                data: portfolio_performance,
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                tension: 0.1,
                fill: true
            }
        ]
    };

    // Prepare data for the allocation doughnut chart
    const allocationData = {
        labels: allocations.labels,
        datasets: [
            {
                data: allocations.values,
                backgroundColor: [
                    'rgb(255, 99, 132)',
                    'rgb(54, 162, 235)',
                    'rgb(255, 205, 86)',
                    'rgb(75, 192, 192)',
                    'rgb(153, 102, 255)',
                    'rgb(255, 159, 64)',
                    'rgb(201, 203, 207)',
                    'rgb(255, 99, 71)'
                ]
            }
        ]
    };

    if (!data) {
        return <div>No data available</div>;
    }

    return (
        <div className="visual-dashboard">
            <div className="charts-section">
                {hasPerformanceData && (
                    <div className="chart-container">
                        <div className="chart-wrapper">
                            <Line options={performanceOptions} data={performanceData} />
                        </div>
                    </div>
                )}
                {hasAllocationData && (
                    <div className="chart-container">
                        <div className="chart-wrapper">
                            <Doughnut options={allocationOptions} data={allocationData} />
                        </div>
                    </div>
                )}
            </div>

            <div className="insights-section">
                {/* Recommendations Section */}
                {recommendations && recommendations.length > 0 && (
                    <div className="insight-container">
                        <h3>Recommendations</h3>
                        <ul className="insight-list">
                            {recommendations.map((rec, index) => (
                                <li key={index} className="insight-item">
                                    <span className="insight-type">{rec.type}</span>
                                    <p className="insight-content">{rec.details}</p>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Educational Tips Section */}
                {educational_tips && educational_tips.length > 0 && (
                    <div className="insight-container">
                        <h3>Educational Tips</h3>
                        <ul className="insight-list">
                            {educational_tips.map((tip, index) => (
                                <li key={index} className="insight-item">
                                    <span className="insight-title">{tip.title}</span>
                                    <p className="insight-content">{tip.content}</p>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Multi-Scenario Analysis Section */}
                {multi_scenario_analysis && multi_scenario_analysis.length > 0 && (
                    <div className="insight-container">
                        <h3>Multi-Scenario Analysis</h3>
                        <div className="scenario-grid">
                            {multi_scenario_analysis.map((scenario, index) => (
                                <div key={index} className="scenario-card">
                                    <h4>{scenario.scenario}</h4>
                                    <p>{scenario.outcome}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <style jsx>{`
                .visual-dashboard {
                    display: flex;
                    flex-direction: column;
                    gap: 2rem;
                    padding: 1rem;
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                }

                .charts-section {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 2rem;
                }

                .chart-container {
                    padding: 1rem;
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
                    height: 400px;
                }

                .chart-wrapper {
                    position: relative;
                    height: 100%;
                    width: 100%;
                }

                .insights-section {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 2rem;
                }

                .insight-container {
                    padding: 1.5rem;
                    background: #f8f9fa;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
                }

                .insight-container h3 {
                    margin: 0 0 1rem 0;
                    color: #2c3e50;
                    font-size: 1.2rem;
                }

                .insight-list {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }

                .insight-item {
                    margin-bottom: 1rem;
                    padding: 0.75rem;
                    background: white;
                    border-radius: 6px;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                }

                .insight-type, .insight-title {
                    display: block;
                    font-weight: 600;
                    color: #2c3e50;
                    margin-bottom: 0.5rem;
                }

                .insight-content {
                    margin: 0;
                    color: #4a5568;
                    font-size: 0.95rem;
                    line-height: 1.5;
                }

                .scenario-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 1rem;
                }

                .scenario-card {
                    padding: 1rem;
                    background: white;
                    border-radius: 6px;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                }

                .scenario-card h4 {
                    margin: 0 0 0.5rem 0;
                    color: #2c3e50;
                }

                .scenario-card p {
                    margin: 0;
                    color: #4a5568;
                    font-size: 0.95rem;
                }

                @media (max-width: 768px) {
                    .charts-section {
                        grid-template-columns: 1fr;
                    }

                    .chart-container {
                        height: 300px;
                    }
                }
            `}</style>
        </div>
    );
};

export default VisualDashboard;
