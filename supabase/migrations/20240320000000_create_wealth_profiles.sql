-- Create wealth_profiles table
CREATE TABLE wealth_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    -- Personal Information
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    date_of_birth DATE NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    zip_code TEXT NOT NULL,
    marital_status TEXT NOT NULL,
    dependents JSONB DEFAULT '[]'::jsonb,
    employment_status TEXT NOT NULL,
    occupation TEXT,
    employer TEXT,
    employment_length INTEGER,
    tax_filing_status TEXT NOT NULL,
    citizenship TEXT NOT NULL,
    residency_status TEXT NOT NULL,
    
    -- Financial Overview
    annual_income DECIMAL(12,2) NOT NULL,
    additional_income_sources JSONB DEFAULT '[]'::jsonb,
    total_assets DECIMAL(12,2) NOT NULL,
    liquid_assets DECIMAL(12,2) NOT NULL,
    retirement_assets DECIMAL(12,2) NOT NULL,
    real_estate_assets DECIMAL(12,2) NOT NULL,
    other_assets DECIMAL(12,2) NOT NULL,
    total_liabilities DECIMAL(12,2) NOT NULL,
    mortgage_balance DECIMAL(12,2),
    car_loans DECIMAL(12,2),
    student_loans DECIMAL(12,2),
    credit_card_debt DECIMAL(12,2),
    other_liabilities DECIMAL(12,2),
    monthly_expenses DECIMAL(12,2) NOT NULL,
    housing_expenses DECIMAL(12,2),
    transportation_expenses DECIMAL(12,2),
    food_expenses DECIMAL(12,2),
    healthcare_expenses DECIMAL(12,2),
    education_expenses DECIMAL(12,2),
    entertainment_expenses DECIMAL(12,2),
    other_expenses DECIMAL(12,2),
    emergency_fund DECIMAL(12,2) NOT NULL,
    monthly_savings DECIMAL(12,2),
    
    -- Insurance Coverage
    life_insurance JSONB DEFAULT '[]'::jsonb,
    health_insurance JSONB DEFAULT '[]'::jsonb,
    disability_insurance JSONB DEFAULT '[]'::jsonb,
    long_term_care_insurance JSONB DEFAULT '[]'::jsonb,
    property_insurance JSONB DEFAULT '[]'::jsonb,
    
    -- Investment Goals
    primary_goal TEXT NOT NULL,
    secondary_goals JSONB DEFAULT '[]'::jsonb,
    investment_timeframe TEXT NOT NULL,
    target_amount DECIMAL(12,2) NOT NULL,
    monthly_investment_amount DECIMAL(12,2),
    retirement_age INTEGER,
    legacy_planning BOOLEAN DEFAULT false,
    charitable_giving_goals JSONB DEFAULT '[]'::jsonb,
    education_funding_goals JSONB DEFAULT '[]'::jsonb,
    
    -- Current Investments
    current_investments JSONB DEFAULT '[]'::jsonb,
    investment_accounts JSONB DEFAULT '[]'::jsonb,
    retirement_accounts JSONB DEFAULT '[]'::jsonb,
    brokerage_accounts JSONB DEFAULT '[]'::jsonb,
    
    -- Risk Assessment
    risk_tolerance TEXT NOT NULL,
    investment_experience TEXT NOT NULL,
    market_volatility_comfort TEXT NOT NULL,
    financial_knowledge TEXT NOT NULL,
    investment_style TEXT NOT NULL,
    tax_sensitivity TEXT NOT NULL,
    liquidity_needs TEXT NOT NULL,
    estate_planning_needs TEXT NOT NULL,
    
    -- Tax Information
    tax_bracket TEXT,
    tax_credits JSONB DEFAULT '[]'::jsonb,
    tax_deductions JSONB DEFAULT '[]'::jsonb,
    
    -- Additional Information
    notes TEXT,
    documents JSONB DEFAULT '[]'::jsonb,
    special_circumstances JSONB DEFAULT '[]'::jsonb,
    financial_concerns JSONB DEFAULT '[]'::jsonb,
    
    -- Metadata
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    last_review_date TIMESTAMP WITH TIME ZONE,
    next_review_date TIMESTAMP WITH TIME ZONE,
    risk_score INTEGER,
    financial_health_score INTEGER
);

-- Create RLS policies
ALTER TABLE wealth_profiles ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own profiles
CREATE POLICY "Users can view their own profiles"
    ON wealth_profiles FOR SELECT
    USING (auth.uid() = user_id);

-- Policy for users to insert their own profiles
CREATE POLICY "Users can insert their own profiles"
    ON wealth_profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy for users to update their own profiles
CREATE POLICY "Users can update their own profiles"
    ON wealth_profiles FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_wealth_profiles_updated_at
    BEFORE UPDATE ON wealth_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better query performance
CREATE INDEX idx_wealth_profiles_user_id ON wealth_profiles(user_id);
CREATE INDEX idx_wealth_profiles_status ON wealth_profiles(status);
CREATE INDEX idx_wealth_profiles_next_review_date ON wealth_profiles(next_review_date); 