"use client";
import React, { useState, useEffect } from "react";
import {
    Box,
    Stepper,
    Step,
    StepLabel,
    Button,
    Typography,
    Paper,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Grid,
    CircularProgress,
    Alert
} from "@mui/material";
import { createClient } from '@supabase/supabase-js';
import Sidebar from "../../components/Sidebar";
import WealthProfileAgent from '../../lib/ai/wealthProfileAgent';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const steps = [
    'Personal Information',
    'Employment & Income',
    'Financial Overview',
    'Insurance Coverage',
    'Investment Goals',
    'Current Investments',
    'Risk Assessment',
    'Tax Information',
    'Review & Complete'
];

const initialFormData = {
    // Personal Information
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    maritalStatus: '',
    dependents: [],
    citizenship: '',
    residencyStatus: '',
    taxFilingStatus: '',
    
    // Employment & Income
    employmentStatus: '',
    occupation: '',
    employer: '',
    employmentLength: '',
    annualIncome: '',
    additionalIncomeSources: [],
    
    // Financial Overview
    totalAssets: '',
    liquidAssets: '',
    retirementAssets: '',
    realEstateAssets: '',
    otherAssets: '',
    totalLiabilities: '',
    mortgageBalance: '',
    carLoans: '',
    studentLoans: '',
    creditCardDebt: '',
    otherLiabilities: '',
    monthlyExpenses: '',
    housingExpenses: '',
    transportationExpenses: '',
    foodExpenses: '',
    healthcareExpenses: '',
    educationExpenses: '',
    entertainmentExpenses: '',
    otherExpenses: '',
    emergencyFund: '',
    monthlySavings: '',
    
    // Insurance Coverage
    lifeInsurance: [],
    healthInsurance: [],
    disabilityInsurance: [],
    longTermCareInsurance: [],
    propertyInsurance: [],
    
    // Investment Goals
    primaryGoal: '',
    secondaryGoals: [],
    investmentTimeframe: '',
    targetAmount: '',
    monthlyInvestmentAmount: '',
    retirementAge: '',
    legacyPlanning: false,
    charitableGivingGoals: [],
    educationFundingGoals: [],
    
    // Current Investments
    currentInvestments: [],
    investmentAccounts: [],
    retirementAccounts: [],
    brokerageAccounts: [],
    
    // Risk Assessment
    riskTolerance: '',
    investmentExperience: '',
    marketVolatilityComfort: '',
    financialKnowledge: '',
    investmentStyle: '',
    taxSensitivity: '',
    liquidityNeeds: '',
    estatePlanningNeeds: '',
    
    // Tax Information
    taxBracket: '',
    taxCredits: [],
    taxDeductions: [],
    
    // Additional Information
    notes: '',
    documents: [],
    specialCircumstances: [],
    financialConcerns: []
};

function ProfileCreation() {
    const [activeStep, setActiveStep] = useState(0);
    const [formData, setFormData] = useState(initialFormData);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [aiGuidance, setAiGuidance] = useState('');
    const [isGeneratingGuidance, setIsGeneratingGuidance] = useState(false);
    const [aiAgent] = useState(() => new WealthProfileAgent());

    useEffect(() => {
        generateGuidance();
    }, [activeStep, formData]);

    const handleNext = () => {
        setActiveStep((prevStep) => prevStep + 1);
    };

    const handleBack = () => {
        setActiveStep((prevStep) => prevStep - 1);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const generateGuidance = async () => {
        setIsGeneratingGuidance(true);
        try {
            const { guidance } = await aiAgent.generateGuidance(activeStep, formData);
            setAiGuidance(guidance);
        } catch (error) {
            console.error('Error generating AI guidance:', error);
            setError('Failed to generate AI guidance');
        } finally {
            setIsGeneratingGuidance(false);
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            await aiAgent.saveProfile(formData);
            // Handle successful submission
            console.log('Profile created successfully');
        } catch (error) {
            console.error('Error creating profile:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const renderStepContent = (step) => {
        switch (step) {
            case 0:
                return (
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="First Name"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleInputChange}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Last Name"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleInputChange}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Phone"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Date of Birth"
                                name="dateOfBirth"
                                type="date"
                                value={formData.dateOfBirth}
                                onChange={handleInputChange}
                                required
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth required>
                                <InputLabel>Marital Status</InputLabel>
                                <Select
                                    name="maritalStatus"
                                    value={formData.maritalStatus}
                                    onChange={handleInputChange}
                                    label="Marital Status"
                                >
                                    <MenuItem value="single">Single</MenuItem>
                                    <MenuItem value="married">Married</MenuItem>
                                    <MenuItem value="divorced">Divorced</MenuItem>
                                    <MenuItem value="widowed">Widowed</MenuItem>
                                    <MenuItem value="domestic_partnership">Domestic Partnership</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth required>
                                <InputLabel>Tax Filing Status</InputLabel>
                                <Select
                                    name="taxFilingStatus"
                                    value={formData.taxFilingStatus}
                                    onChange={handleInputChange}
                                    label="Tax Filing Status"
                                >
                                    <MenuItem value="single">Single</MenuItem>
                                    <MenuItem value="married_filing_jointly">Married Filing Jointly</MenuItem>
                                    <MenuItem value="married_filing_separately">Married Filing Separately</MenuItem>
                                    <MenuItem value="head_of_household">Head of Household</MenuItem>
                                    <MenuItem value="qualifying_widow">Qualifying Widow(er)</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth required>
                                <InputLabel>Citizenship</InputLabel>
                                <Select
                                    name="citizenship"
                                    value={formData.citizenship}
                                    onChange={handleInputChange}
                                    label="Citizenship"
                                >
                                    <MenuItem value="us_citizen">U.S. Citizen</MenuItem>
                                    <MenuItem value="permanent_resident">Permanent Resident</MenuItem>
                                    <MenuItem value="non_resident">Non-Resident Alien</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth required>
                                <InputLabel>Residency Status</InputLabel>
                                <Select
                                    name="residencyStatus"
                                    value={formData.residencyStatus}
                                    onChange={handleInputChange}
                                    label="Residency Status"
                                >
                                    <MenuItem value="resident">Resident</MenuItem>
                                    <MenuItem value="non_resident">Non-Resident</MenuItem>
                                    <MenuItem value="dual_status">Dual Status</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Address"
                                name="address"
                                value={formData.address}
                                onChange={handleInputChange}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                label="City"
                                name="city"
                                value={formData.city}
                                onChange={handleInputChange}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                label="State"
                                name="state"
                                value={formData.state}
                                onChange={handleInputChange}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                label="ZIP Code"
                                name="zipCode"
                                value={formData.zipCode}
                                onChange={handleInputChange}
                                required
                            />
                        </Grid>
                    </Grid>
                );
            case 1:
                return (
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth required>
                                <InputLabel>Employment Status</InputLabel>
                                <Select
                                    name="employmentStatus"
                                    value={formData.employmentStatus}
                                    onChange={handleInputChange}
                                    label="Employment Status"
                                >
                                    <MenuItem value="employed">Employed</MenuItem>
                                    <MenuItem value="self_employed">Self-Employed</MenuItem>
                                    <MenuItem value="retired">Retired</MenuItem>
                                    <MenuItem value="unemployed">Unemployed</MenuItem>
                                    <MenuItem value="disabled">Disabled</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Occupation"
                                name="occupation"
                                value={formData.occupation}
                                onChange={handleInputChange}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Employer"
                                name="employer"
                                value={formData.employer}
                                onChange={handleInputChange}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Years of Employment"
                                name="employmentLength"
                                type="number"
                                value={formData.employmentLength}
                                onChange={handleInputChange}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Annual Income"
                                name="annualIncome"
                                type="number"
                                value={formData.annualIncome}
                                onChange={handleInputChange}
                                required
                                InputProps={{
                                    startAdornment: '$'
                                }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Typography variant="subtitle1" gutterBottom>
                                Additional Income Sources
                            </Typography>
                            {/* Add dynamic form for additional income sources */}
                        </Grid>
                    </Grid>
                );
            case 2:
                return (
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Total Assets"
                                name="totalAssets"
                                type="number"
                                value={formData.totalAssets}
                                onChange={handleInputChange}
                                required
                                InputProps={{
                                    startAdornment: '$'
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Liquid Assets"
                                name="liquidAssets"
                                type="number"
                                value={formData.liquidAssets}
                                onChange={handleInputChange}
                                required
                                InputProps={{
                                    startAdornment: '$'
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Retirement Assets"
                                name="retirementAssets"
                                type="number"
                                value={formData.retirementAssets}
                                onChange={handleInputChange}
                                required
                                InputProps={{
                                    startAdornment: '$'
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Real Estate Assets"
                                name="realEstateAssets"
                                type="number"
                                value={formData.realEstateAssets}
                                onChange={handleInputChange}
                                required
                                InputProps={{
                                    startAdornment: '$'
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Other Assets"
                                name="otherAssets"
                                type="number"
                                value={formData.otherAssets}
                                onChange={handleInputChange}
                                required
                                InputProps={{
                                    startAdornment: '$'
                                }}
                            />
                        </Grid>
                    </Grid>
                );
            case 3:
                return (
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Total Liabilities"
                                name="totalLiabilities"
                                type="number"
                                value={formData.totalLiabilities}
                                onChange={handleInputChange}
                                required
                                InputProps={{
                                    startAdornment: '$'
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Mortgage Balance"
                                name="mortgageBalance"
                                type="number"
                                value={formData.mortgageBalance}
                                onChange={handleInputChange}
                                required
                                InputProps={{
                                    startAdornment: '$'
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Car Loans"
                                name="carLoans"
                                type="number"
                                value={formData.carLoans}
                                onChange={handleInputChange}
                                required
                                InputProps={{
                                    startAdornment: '$'
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Student Loans"
                                name="studentLoans"
                                type="number"
                                value={formData.studentLoans}
                                onChange={handleInputChange}
                                required
                                InputProps={{
                                    startAdornment: '$'
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Credit Card Debt"
                                name="creditCardDebt"
                                type="number"
                                value={formData.creditCardDebt}
                                onChange={handleInputChange}
                                required
                                InputProps={{
                                    startAdornment: '$'
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Other Liabilities"
                                name="otherLiabilities"
                                type="number"
                                value={formData.otherLiabilities}
                                onChange={handleInputChange}
                                required
                                InputProps={{
                                    startAdornment: '$'
                                }}
                            />
                        </Grid>
                    </Grid>
                );
            case 4:
                return (
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Monthly Expenses"
                                name="monthlyExpenses"
                                type="number"
                                value={formData.monthlyExpenses}
                                onChange={handleInputChange}
                                required
                                InputProps={{
                                    startAdornment: '$'
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Housing Expenses"
                                name="housingExpenses"
                                type="number"
                                value={formData.housingExpenses}
                                onChange={handleInputChange}
                                required
                                InputProps={{
                                    startAdornment: '$'
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Transportation Expenses"
                                name="transportationExpenses"
                                type="number"
                                value={formData.transportationExpenses}
                                onChange={handleInputChange}
                                required
                                InputProps={{
                                    startAdornment: '$'
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Food Expenses"
                                name="foodExpenses"
                                type="number"
                                value={formData.foodExpenses}
                                onChange={handleInputChange}
                                required
                                InputProps={{
                                    startAdornment: '$'
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Healthcare Expenses"
                                name="healthcareExpenses"
                                type="number"
                                value={formData.healthcareExpenses}
                                onChange={handleInputChange}
                                required
                                InputProps={{
                                    startAdornment: '$'
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Education Expenses"
                                name="educationExpenses"
                                type="number"
                                value={formData.educationExpenses}
                                onChange={handleInputChange}
                                required
                                InputProps={{
                                    startAdornment: '$'
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Entertainment Expenses"
                                name="entertainmentExpenses"
                                type="number"
                                value={formData.entertainmentExpenses}
                                onChange={handleInputChange}
                                required
                                InputProps={{
                                    startAdornment: '$'
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Other Expenses"
                                name="otherExpenses"
                                type="number"
                                value={formData.otherExpenses}
                                onChange={handleInputChange}
                                required
                                InputProps={{
                                    startAdornment: '$'
                                }}
                            />
                        </Grid>
                    </Grid>
                );
            case 5:
                return (
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <Typography variant="h6" gutterBottom>Life Insurance</Typography>
                            <FormControl fullWidth>
                                <InputLabel>Coverage Type</InputLabel>
                                <Select
                                    name="lifeInsuranceType"
                                    value={formData.lifeInsuranceType || ''}
                                    onChange={handleInputChange}
                                    label="Coverage Type"
                                >
                                    <MenuItem value="term">Term Life</MenuItem>
                                    <MenuItem value="whole">Whole Life</MenuItem>
                                    <MenuItem value="universal">Universal Life</MenuItem>
                                    <MenuItem value="none">No Coverage</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <Typography variant="h6" gutterBottom>Health Insurance</Typography>
                            <FormControl fullWidth>
                                <InputLabel>Coverage Type</InputLabel>
                                <Select
                                    name="healthInsuranceType"
                                    value={formData.healthInsuranceType || ''}
                                    onChange={handleInputChange}
                                    label="Coverage Type"
                                >
                                    <MenuItem value="employer">Employer Provided</MenuItem>
                                    <MenuItem value="private">Private Insurance</MenuItem>
                                    <MenuItem value="marketplace">Healthcare Marketplace</MenuItem>
                                    <MenuItem value="medicare">Medicare</MenuItem>
                                    <MenuItem value="medicaid">Medicaid</MenuItem>
                                    <MenuItem value="none">No Coverage</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <Typography variant="h6" gutterBottom>Disability Insurance</Typography>
                            <FormControl fullWidth>
                                <InputLabel>Coverage Type</InputLabel>
                                <Select
                                    name="disabilityInsuranceType"
                                    value={formData.disabilityInsuranceType || ''}
                                    onChange={handleInputChange}
                                    label="Coverage Type"
                                >
                                    <MenuItem value="short_term">Short-term Disability</MenuItem>
                                    <MenuItem value="long_term">Long-term Disability</MenuItem>
                                    <MenuItem value="both">Both</MenuItem>
                                    <MenuItem value="none">No Coverage</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                );
            case 6:
                return (
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <FormControl fullWidth required>
                                <InputLabel>Primary Investment Goal</InputLabel>
                                <Select
                                    name="primaryGoal"
                                    value={formData.primaryGoal}
                                    onChange={handleInputChange}
                                    label="Primary Investment Goal"
                                >
                                    <MenuItem value="retirement">Retirement Planning</MenuItem>
                                    <MenuItem value="wealth_growth">Wealth Growth</MenuItem>
                                    <MenuItem value="income_generation">Income Generation</MenuItem>
                                    <MenuItem value="capital_preservation">Capital Preservation</MenuItem>
                                    <MenuItem value="education">Education Funding</MenuItem>
                                    <MenuItem value="legacy">Legacy Planning</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Target Amount"
                                name="targetAmount"
                                type="number"
                                value={formData.targetAmount}
                                onChange={handleInputChange}
                                required
                                InputProps={{
                                    startAdornment: '$'
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Monthly Investment Amount"
                                name="monthlyInvestmentAmount"
                                type="number"
                                value={formData.monthlyInvestmentAmount}
                                onChange={handleInputChange}
                                required
                                InputProps={{
                                    startAdornment: '$'
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Target Retirement Age"
                                name="retirementAge"
                                type="number"
                                value={formData.retirementAge}
                                onChange={handleInputChange}
                                InputProps={{
                                    inputProps: { min: 0, max: 100 }
                                }}
                            />
                        </Grid>
                    </Grid>
                );
            case 7:
                return (
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <FormControl fullWidth required>
                                <InputLabel>Risk Tolerance</InputLabel>
                                <Select
                                    name="riskTolerance"
                                    value={formData.riskTolerance}
                                    onChange={handleInputChange}
                                    label="Risk Tolerance"
                                >
                                    <MenuItem value="conservative">Conservative</MenuItem>
                                    <MenuItem value="moderate">Moderate</MenuItem>
                                    <MenuItem value="aggressive">Aggressive</MenuItem>
                                    <MenuItem value="very_aggressive">Very Aggressive</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <FormControl fullWidth required>
                                <InputLabel>Investment Experience</InputLabel>
                                <Select
                                    name="investmentExperience"
                                    value={formData.investmentExperience}
                                    onChange={handleInputChange}
                                    label="Investment Experience"
                                >
                                    <MenuItem value="none">No Experience</MenuItem>
                                    <MenuItem value="beginner">Beginner</MenuItem>
                                    <MenuItem value="intermediate">Intermediate</MenuItem>
                                    <MenuItem value="advanced">Advanced</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <FormControl fullWidth required>
                                <InputLabel>Investment Style</InputLabel>
                                <Select
                                    name="investmentStyle"
                                    value={formData.investmentStyle}
                                    onChange={handleInputChange}
                                    label="Investment Style"
                                >
                                    <MenuItem value="passive">Passive</MenuItem>
                                    <MenuItem value="active">Active</MenuItem>
                                    <MenuItem value="mixed">Mixed</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <FormControl fullWidth required>
                                <InputLabel>Liquidity Needs</InputLabel>
                                <Select
                                    name="liquidityNeeds"
                                    value={formData.liquidityNeeds}
                                    onChange={handleInputChange}
                                    label="Liquidity Needs"
                                >
                                    <MenuItem value="low">Low - Rarely need to access investments</MenuItem>
                                    <MenuItem value="medium">Medium - May need occasional access</MenuItem>
                                    <MenuItem value="high">High - Need frequent access</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                );
            case 8:
                return (
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <Typography variant="h6" gutterBottom>Profile Summary</Typography>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Paper sx={{ p: 2 }}>
                                <Typography variant="subtitle1" gutterBottom>Personal Information</Typography>
                                <Typography>{formData.firstName} {formData.lastName}</Typography>
                                <Typography>{formData.email}</Typography>
                                <Typography>{formData.phone}</Typography>
                                <Typography>{formData.address}</Typography>
                                <Typography>{formData.city}, {formData.state} {formData.zipCode}</Typography>
                            </Paper>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Paper sx={{ p: 2 }}>
                                <Typography variant="subtitle1" gutterBottom>Financial Overview</Typography>
                                <Typography>Annual Income: ${formData.annualIncome}</Typography>
                                <Typography>Total Assets: ${formData.totalAssets}</Typography>
                                <Typography>Total Liabilities: ${formData.totalLiabilities}</Typography>
                                <Typography>Monthly Expenses: ${formData.monthlyExpenses}</Typography>
                            </Paper>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Paper sx={{ p: 2 }}>
                                <Typography variant="subtitle1" gutterBottom>Investment Profile</Typography>
                                <Typography>Primary Goal: {formData.primaryGoal}</Typography>
                                <Typography>Risk Tolerance: {formData.riskTolerance}</Typography>
                                <Typography>Investment Experience: {formData.investmentExperience}</Typography>
                                <Typography>Target Amount: ${formData.targetAmount}</Typography>
                            </Paper>
                        </Grid>
                    </Grid>
                );
            default:
                return null;
        }
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Box sx={{ display: 'flex', flexDirection: 'row', flexGrow: 1 }}>
                <Sidebar />
                <Box sx={{ flexGrow: 1, p: 3 }}>
                    <Typography variant="h4" gutterBottom sx={{ fontWeight: 500 }}>
                        Create Wealth Management Profile
                    </Typography>
                    
                    <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                        {steps.map((label) => (
                            <Step key={label}>
                                <StepLabel>{label}</StepLabel>
                            </Step>
                        ))}
                    </Stepper>

                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <Paper 
                        sx={{ 
                            p: 3,
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 1
                        }}
                    >
                        {renderStepContent(activeStep)}

                        {isGeneratingGuidance ? (
                            <Box sx={{ mt: 3, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                                <Typography variant="subtitle2" gutterBottom>
                                    AI Guidance
                                </Typography>
                                <Box display="flex" alignItems="center">
                                    <CircularProgress size={20} sx={{ mr: 1 }} />
                                    <Typography variant="body2">
                                        Generating personalized guidance...
                                    </Typography>
                                </Box>
                            </Box>
                        ) : aiGuidance && (
                            <Box sx={{ mt: 3, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                                <Typography variant="subtitle2" gutterBottom>
                                    AI Guidance
                                </Typography>
                                <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                                    {aiGuidance}
                                </Typography>
                            </Box>
                        )}

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                            <Button
                                disabled={activeStep === 0}
                                onClick={handleBack}
                            >
                                Back
                            </Button>
                            <Box>
                                {activeStep === steps.length - 1 ? (
                                    <Button
                                        variant="contained"
                                        onClick={handleSubmit}
                                        disabled={loading}
                                    >
                                        {loading ? <CircularProgress size={24} /> : 'Complete Profile'}
                                    </Button>
                                ) : (
                                    <Button
                                        variant="contained"
                                        onClick={handleNext}
                                    >
                                        Next
                                    </Button>
                                )}
                            </Box>
                        </Box>
                    </Paper>
                </Box>
            </Box>
        </Box>
    );
}

export default ProfileCreation; 