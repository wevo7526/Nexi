import React from "react";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    ArcElement,
    Tooltip,
    Legend,
} from "chart.js";
import { Line, Pie } from "react-chartjs-2";

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend);

function VisualDashboard({ data }) {
    // Ensure input data is valid
    const portfolioPerformance = data?.portfolio_performance || [];
    const allocationLabels = data?.allocations?.labels || [];
    const allocationValues = data?.allocations?.values || [];

    // Line chart configuration (Portfolio Performance)
    const performanceData = {
        labels: portfolioPerformance.map((_, index) => `Month ${index + 1}`), // Generates labels dynamically
        datasets: [
            {
                label: "Portfolio Performance ($)",
                data: portfolioPerformance,
                borderColor: "rgba(75, 192, 192, 1)",
                backgroundColor: "rgba(75, 192, 192, 0.2)",
                borderWidth: 2,
                tension: 0.4, // Smooth curve
            },
        ],
    };

    // Pie chart configuration (Asset Allocation)
    const allocationData = {
        labels: allocationLabels,
        datasets: [
            {
                data: allocationValues,
                backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF"],
                hoverBackgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF"],
            },
        ],
    };

    return (
        <div className="visual-dashboard">
            {/* Line Chart Section */}
            <div className="chart-section">
                <h3>Portfolio Performance</h3>
                {portfolioPerformance.length > 0 ? (
                    <Line data={performanceData} />
                ) : (
                    <p>No performance data available.</p>
                )}
            </div>

            {/* Pie Chart Section */}
            <div className="chart-section pie-chart">
                <h3>Asset Allocation</h3>
                {allocationLabels.length > 0 && allocationValues.length > 0 ? (
                    <div className="pie-container">
                        <Pie data={allocationData} />
                    </div>
                ) : (
                    <p>No allocation data available.</p>
                )}
            </div>

            <style jsx>{`
                .visual-dashboard {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }
                .chart-section {
                    background: #f9f9f9;
                    padding: 20px;
                    border-radius: 8px;
                    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
                }
                .chart-section.pie-chart {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }
                .pie-container {
                    width: 300px; /* Adjusts the size of the pie chart */
                    height: 300px;
                }
                h3 {
                    text-align: center;
                    margin-bottom: 20px;
                }
                p {
                    text-align: center;
                    color: #888;
                    font-size: 14px;
                }
            `}</style>
        </div>
    );
}

export default VisualDashboard;
