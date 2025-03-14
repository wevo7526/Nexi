import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

class WealthProfileAgent {
    constructor() {
        this.context = {
            currentStep: 0,
            formData: {},
            previousGuidance: []
        };
    }

    async generateGuidance(step, formData) {
        this.context.currentStep = step;
        this.context.formData = formData;

        let guidance = '';
        let recommendations = [];

        switch (step) {
            case 0: // Personal Information
                guidance = this.generatePersonalInfoGuidance(formData);
                break;
            case 1: // Financial Overview
                guidance = this.generateFinancialGuidance(formData);
                break;
            case 2: // Investment Goals
                guidance = this.generateInvestmentGoalsGuidance(formData);
                break;
            case 3: // Risk Assessment
                guidance = this.generateRiskAssessmentGuidance(formData);
                break;
            case 4: // Review & Complete
                guidance = this.generateFinalGuidance(formData);
                break;
        }

        // Store guidance in context
        this.context.previousGuidance.push({
            step,
            guidance,
            timestamp: new Date().toISOString()
        });

        return {
            guidance,
            recommendations
        };
    }

    generatePersonalInfoGuidance(formData) {
        return `Welcome to the wealth management profile creation process. 
        I'll help guide you through each step to create a comprehensive profile.
        Please provide your personal information accurately as this will help us
        create a tailored financial strategy for you.`;
    }

    generateFinancialGuidance(formData) {
        const { annualIncome, totalAssets, totalLiabilities, monthlyExpenses, emergencyFund } = formData;
        
        let guidance = 'Based on your financial information, here are some key insights:\n\n';
        
        // Calculate debt-to-income ratio
        const monthlyIncome = annualIncome / 12;
        const debtToIncome = (monthlyExpenses / monthlyIncome) * 100;
        
        if (debtToIncome > 43) {
            guidance += '⚠️ Your debt-to-income ratio is above the recommended 43%. Consider reviewing your expenses.\n';
        }

        // Emergency fund analysis
        const emergencyFundMonths = emergencyFund / monthlyExpenses;
        if (emergencyFundMonths < 3) {
            guidance += '⚠️ Your emergency fund covers less than 3 months of expenses. Building this up should be a priority.\n';
        } else if (emergencyFundMonths > 6) {
            guidance += '✅ You have a strong emergency fund. Consider investing excess funds.\n';
        }

        // Net worth analysis
        const netWorth = totalAssets - totalLiabilities;
        if (netWorth < 0) {
            guidance += '⚠️ Your net worth is negative. Focus on debt reduction and asset building.\n';
        }

        return guidance;
    }

    generateInvestmentGoalsGuidance(formData) {
        const { primaryGoal, investmentTimeframe, targetAmount } = formData;
        
        let guidance = 'Based on your investment goals:\n\n';
        
        // Timeframe analysis
        if (investmentTimeframe === 'short') {
            guidance += 'For short-term goals, focus on capital preservation and low-risk investments.\n';
        } else if (investmentTimeframe === 'medium') {
            guidance += 'Medium-term goals allow for a balanced portfolio with moderate risk.\n';
        } else {
            guidance += 'Long-term goals can include higher-risk investments for potential growth.\n';
        }

        // Goal-specific guidance
        switch (primaryGoal) {
            case 'retirement':
                guidance += 'For retirement planning, consider tax-advantaged accounts and long-term growth strategies.\n';
                break;
            case 'wealth_growth':
                guidance += 'Wealth growth strategies should focus on diversified investments and compound interest.\n';
                break;
            case 'income_generation':
                guidance += 'Income generation strategies should prioritize dividend-paying stocks and bonds.\n';
                break;
            case 'preservation':
                guidance += 'Capital preservation strategies should focus on low-risk investments and inflation protection.\n';
                break;
        }

        return guidance;
    }

    generateRiskAssessmentGuidance(formData) {
        const { riskTolerance, investmentExperience, marketVolatilityComfort } = formData;
        
        let guidance = 'Based on your risk assessment:\n\n';
        
        // Risk tolerance analysis
        switch (riskTolerance) {
            case 'conservative':
                guidance += 'Your conservative risk tolerance suggests a focus on bonds and stable dividend stocks.\n';
                break;
            case 'moderate':
                guidance += 'A moderate risk tolerance allows for a balanced portfolio of stocks and bonds.\n';
                break;
            case 'aggressive':
                guidance += 'Your aggressive risk tolerance suggests a higher allocation to growth stocks.\n';
                break;
            case 'very_aggressive':
                guidance += 'Very aggressive risk tolerance allows for alternative investments and emerging markets.\n';
                break;
        }

        // Experience-based guidance
        if (investmentExperience === 'beginner') {
            guidance += 'As a beginner, consider starting with index funds and gradually expanding your portfolio.\n';
        }

        return guidance;
    }

    generateFinalGuidance(formData) {
        return `Thank you for completing your wealth management profile! 
        Based on all your information, here's a summary of key recommendations:

        1. Focus on building your emergency fund if it's below 3 months of expenses
        2. Consider tax-advantaged accounts for retirement planning
        3. Maintain a diversified portfolio aligned with your risk tolerance
        4. Review and rebalance your portfolio regularly
        5. Stay informed about market trends and economic conditions

        Your profile will be reviewed by our wealth management team, and they will contact you to discuss your personalized strategy.`;
    }

    async saveProfile(formData) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            
            if (!user) {
                throw new Error('User not authenticated');
            }

            const { data, error } = await supabase
                .from('wealth_profiles')
                .insert([{
                    ...formData,
                    user_id: user.id,
                    status: 'pending'
                }]);

            if (error) throw error;

            return data;
        } catch (error) {
            console.error('Error saving profile:', error);
            throw error;
        }
    }
}

export default WealthProfileAgent; 