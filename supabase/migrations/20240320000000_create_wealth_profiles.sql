-- Create wealth_profiles table
CREATE TABLE wealth_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    first_name TEXT,
    last_name TEXT,
    date_of_birth DATE,
    phone TEXT,
    
    -- Financial Information
    annual_income DECIMAL(15,2),
    total_assets DECIMAL(15,2),
    total_liabilities DECIMAL(15,2),
    monthly_expenses DECIMAL(15,2),
    emergency_fund DECIMAL(15,2),
    additional_income_sources JSONB DEFAULT '[]',
    
    -- Investment Profile
    risk_tolerance TEXT CHECK (risk_tolerance IN ('conservative', 'moderate', 'aggressive')),
    investment_experience TEXT CHECK (investment_experience IN ('none', 'beginner', 'intermediate', 'advanced')),
    investment_goals JSONB DEFAULT '[]',
    target_retirement_age INTEGER,
    
    -- Portfolio Information
    current_investments JSONB DEFAULT '{}',
    preferred_investment_types JSONB DEFAULT '[]',
    
    -- Status and Metadata
    onboarding_status TEXT DEFAULT 'pending',
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT valid_phone CHECK (phone ~* '^\+?[0-9\s-()]{10,}$')
);

-- Create an index for faster queries
CREATE INDEX idx_wealth_profiles_onboarding_status ON wealth_profiles(onboarding_status);

-- Set up Row Level Security (RLS)
ALTER TABLE wealth_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile"
    ON wealth_profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON wealth_profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON wealth_profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Function to update last_updated timestamp
CREATE OR REPLACE FUNCTION update_wealth_profile_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update last_updated
CREATE TRIGGER update_wealth_profile_timestamp
    BEFORE UPDATE ON wealth_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_wealth_profile_timestamp(); 