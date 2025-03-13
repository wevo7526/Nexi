"use client";

import React, { useState } from "react";

function UserInputForm({ onSubmit }) {
    const [userInput, setUserInput] = useState({
        age: "",
        employment_status: "",
        dependents: "",
        financial_goals: [{ goal: "", target_amount: "", time_horizon: "" }],
        risk_tolerance: "",
        volatility_comfort: "",
        asset_classes: "",
        allocations: "",
        performance_metrics: "",
        liabilities: "",
        net_worth: "",
        cash_flow: "",
        emergency_fund: "",
        investment_preferences: "",
        tax_sensitivities: "",
        liquidity_needs: ""
    });

    // Handles changes for general inputs
    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setUserInput((prevInput) => ({
            ...prevInput,
            [name]: value,
        }));
    };

    // Handles changes for financial goals
    const handleFinancialGoalChange = (index, field, value) => {
        const updatedGoals = [...userInput.financial_goals];
        updatedGoals[index][field] = value;
        setUserInput((prevInput) => ({
            ...prevInput,
            financial_goals: updatedGoals,
        }));
    };

    // Adds a new financial goal input set
    const addFinancialGoal = () => {
        setUserInput((prevInput) => ({
            ...prevInput,
            financial_goals: [
                ...prevInput.financial_goals,
                { goal: "", target_amount: "", time_horizon: "" }
            ]
        }));
    };

    // Submits the user input
    const handleFormSubmit = (event) => {
        event.preventDefault();
        onSubmit(userInput); // Passes data back to the parent component
    };

    return (
        <form className="user-input-form" onSubmit={handleFormSubmit}>
            <h2>Client Information</h2>
            <div className="input-group">
                <label>Age</label>
                <input
                    type="number"
                    name="age"
                    value={userInput.age}
                    onChange={handleInputChange}
                    className="query-input"
                    placeholder="Enter client's age"
                />
            </div>
            <div className="input-group">
                <label>Employment Status</label>
                <input
                    type="text"
                    name="employment_status"
                    value={userInput.employment_status}
                    onChange={handleInputChange}
                    className="query-input"
                    placeholder="Employment status (e.g., Employed)"
                />
            </div>
            <div className="input-group">
                <label>Dependents</label>
                <input
                    type="number"
                    name="dependents"
                    value={userInput.dependents}
                    onChange={handleInputChange}
                    className="query-input"
                    placeholder="Number of dependents"
                />
            </div>

            <h2>Financial Goals</h2>
            {userInput.financial_goals.map((goal, index) => (
                <div key={index} className="financial-goal">
                    <div className="input-group">
                        <label>Goal</label>
                        <input
                            type="text"
                            placeholder="Goal (e.g., Retirement)"
                            value={goal.goal}
                            onChange={(e) =>
                                handleFinancialGoalChange(index, "goal", e.target.value)
                            }
                            className="query-input"
                        />
                    </div>
                    <div className="input-group">
                        <label>Target Amount</label>
                        <input
                            type="number"
                            placeholder="Target amount (e.g., $1,000,000)"
                            value={goal.target_amount}
                            onChange={(e) =>
                                handleFinancialGoalChange(index, "target_amount", e.target.value)
                            }
                            className="query-input"
                        />
                    </div>
                    <div className="input-group">
                        <label>Time Horizon</label>
                        <input
                            type="number"
                            placeholder="Time horizon (in years)"
                            value={goal.time_horizon}
                            onChange={(e) =>
                                handleFinancialGoalChange(index, "time_horizon", e.target.value)
                            }
                            className="query-input"
                        />
                    </div>
                </div>
            ))}
            <button type="button" onClick={addFinancialGoal} className="add-goal-button">
                + Add Goal
            </button>

            <h2>Risk Profile</h2>
            <div className="input-group">
                <label>Risk Tolerance</label>
                <input
                    type="text"
                    name="risk_tolerance"
                    value={userInput.risk_tolerance}
                    onChange={handleInputChange}
                    className="query-input"
                    placeholder="Low, Medium, or High"
                />
            </div>
            <div className="input-group">
                <label>Volatility Comfort</label>
                <input
                    type="text"
                    name="volatility_comfort"
                    value={userInput.volatility_comfort}
                    onChange={handleInputChange}
                    className="query-input"
                    placeholder="Comfort with volatility"
                />
            </div>

            <h2>Existing Portfolio</h2>
            <div className="input-group">
                <label>Asset Classes</label>
                <textarea
                    name="asset_classes"
                    value={userInput.asset_classes}
                    onChange={handleInputChange}
                    className="query-textarea"
                    placeholder="Enter asset classes (e.g., Equities, Bonds)"
                ></textarea>
            </div>
            <div className="input-group">
                <label>Allocations</label>
                <textarea
                    name="allocations"
                    value={userInput.allocations}
                    onChange={handleInputChange}
                    className="query-textarea"
                    placeholder="Enter allocations (e.g., 50%, 30%, 20%)"
                ></textarea>
            </div>

            <h2>Financial Health</h2>
            <div className="input-group">
                <label>Net Worth</label>
                <input
                    type="number"
                    name="net_worth"
                    value={userInput.net_worth}
                    onChange={handleInputChange}
                    className="query-input"
                    placeholder="Enter net worth"
                />
            </div>
            <div className="input-group">
                <label>Cash Flow</label>
                <input
                    type="number"
                    name="cash_flow"
                    value={userInput.cash_flow}
                    onChange={handleInputChange}
                    className="query-input"
                    placeholder="Enter cash flow"
                />
            </div>
            <div className="input-group">
                <label>Emergency Fund</label>
                <input
                    type="number"
                    name="emergency_fund"
                    value={userInput.emergency_fund}
                    onChange={handleInputChange}
                    className="query-input"
                    placeholder="Enter emergency fund size"
                />
            </div>

            <h2>Preferences & Constraints</h2>
            <div className="input-group">
                <label>Investment Preferences</label>
                <input
                    type="text"
                    name="investment_preferences"
                    value={userInput.investment_preferences}
                    onChange={handleInputChange}
                    className="query-input"
                    placeholder="e.g., Socially Responsible"
                />
            </div>
            <div className="input-group">
                <label>Tax Sensitivities</label>
                <input
                    type="text"
                    name="tax_sensitivities"
                    value={userInput.tax_sensitivities}
                    onChange={handleInputChange}
                    className="query-input"
                    placeholder="Low, Medium, or High"
                />
            </div>
            <div className="input-group">
                <label>Liquidity Needs</label>
                <input
                    type="text"
                    name="liquidity_needs"
                    value={userInput.liquidity_needs}
                    onChange={handleInputChange}
                    className="query-input"
                    placeholder="Enter liquidity needs"
                />
            </div>

            <button type="submit" className="submit-button">
                Submit
            </button>
        </form>
    );
}

export default UserInputForm;
