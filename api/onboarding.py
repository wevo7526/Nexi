from flask import Blueprint, request, jsonify, make_response
from flask_cors import CORS
import os
from supabase import create_client, Client
from datetime import datetime
import re

class ProfileCreationAgent:
    def __init__(self):
        self.profile_data = {
            'personal_info': {
                'first_name': None,
                'last_name': None,
                'date_of_birth': None,
                'phone': None,
            },
            'financial_overview': {
                'annual_income': None,
                'total_assets': None,
                'total_liabilities': None,
                'monthly_expenses': None,
                'emergency_fund': None,
                'additional_income_sources': []
            },
            'investment_profile': {
                'risk_tolerance': None,
                'investment_experience': None,
                'investment_goals': [],
                'target_retirement_age': None,
                'current_investments': {},
                'preferred_investment_types': []
            }
        }
        self.current_step = 'intro'
        self.conversation_steps = [
            'intro',
            'personal_info_name',
            'personal_info_dob',
            'personal_info_phone',
            'financial_income',
            'financial_assets',
            'financial_liabilities',
            'financial_expenses',
            'financial_emergency',
            'financial_additional_income',
            'investment_experience',
            'investment_risk',
            'investment_goals',
            'investment_retirement',
            'investment_current',
            'investment_preferences',
            'review'
        ]
        
    def _validate_phone(self, phone):
        # Basic phone validation - accepts formats like: +1-234-567-8900, (123) 456-7890, 1234567890
        return bool(re.match(r'^\+?[\d\s()-]{10,}$', phone))
        
    def _validate_date(self, date_str):
        try:
            return bool(datetime.strptime(date_str, '%Y-%m-%d'))
        except ValueError:
            return False
            
    def _extract_number(self, text):
        # Extract numerical values from text
        numbers = re.findall(r'\$?([0-9,]+(?:\.[0-9]{2})?)', text)
        if numbers:
            return float(numbers[0].replace(',', ''))
        return None

    def _get_next_step(self):
        current_index = self.conversation_steps.index(self.current_step)
        if current_index + 1 < len(self.conversation_steps):
            return self.conversation_steps[current_index + 1]
        return 'complete'

    def chat(self, message):
        response = ""
        is_complete = False

        # Process user input based on current step
        if self.current_step != 'intro':
            self._process_user_input(message)

        # Move to next step and generate response
        self.current_step = self._get_next_step()
        response = self._generate_response()
        
        # Check if we've completed all steps
        is_complete = self.current_step == 'complete'

        return {
            'response': response,
            'profile_data': self.profile_data,
            'is_complete': is_complete
        }

    def _process_user_input(self, message):
        if self.current_step == 'personal_info_name':
            names = message.strip().split()
            if len(names) >= 2:
                self.profile_data['personal_info']['first_name'] = names[0]
                self.profile_data['personal_info']['last_name'] = ' '.join(names[1:])
                
        elif self.current_step == 'personal_info_dob':
            if self._validate_date(message.strip()):
                self.profile_data['personal_info']['date_of_birth'] = message.strip()
                
        elif self.current_step == 'personal_info_phone':
            if self._validate_phone(message.strip()):
                self.profile_data['personal_info']['phone'] = message.strip()
                
        elif self.current_step == 'financial_income':
            amount = self._extract_number(message)
            if amount:
                self.profile_data['financial_overview']['annual_income'] = amount
                
        elif self.current_step == 'financial_assets':
            amount = self._extract_number(message)
            if amount:
                self.profile_data['financial_overview']['total_assets'] = amount
                
        elif self.current_step == 'financial_liabilities':
            amount = self._extract_number(message)
            if amount:
                self.profile_data['financial_overview']['total_liabilities'] = amount
                
        elif self.current_step == 'financial_expenses':
            amount = self._extract_number(message)
            if amount:
                self.profile_data['financial_overview']['monthly_expenses'] = amount
                
        elif self.current_step == 'financial_emergency':
            amount = self._extract_number(message)
            if amount:
                self.profile_data['financial_overview']['emergency_fund'] = amount
                
        elif self.current_step == 'financial_additional_income':
            sources = [source.strip() for source in message.split(',')]
            self.profile_data['financial_overview']['additional_income_sources'] = sources
                
        elif self.current_step == 'investment_experience':
            exp = message.lower().strip()
            if exp in ['none', 'beginner', 'intermediate', 'advanced']:
                self.profile_data['investment_profile']['investment_experience'] = exp
                
        elif self.current_step == 'investment_risk':
            risk = message.lower().strip()
            if risk in ['conservative', 'moderate', 'aggressive']:
                self.profile_data['investment_profile']['risk_tolerance'] = risk
                
        elif self.current_step == 'investment_goals':
            goals = [goal.strip() for goal in message.split(',')]
            self.profile_data['investment_profile']['investment_goals'] = goals
                
        elif self.current_step == 'investment_retirement':
            age = self._extract_number(message)
            if age:
                self.profile_data['investment_profile']['target_retirement_age'] = int(age)
                
        elif self.current_step == 'investment_current':
            investments = {}
            for item in message.split(','):
                parts = item.split(':')
                if len(parts) == 2:
                    investments[parts[0].strip()] = parts[1].strip()
            self.profile_data['investment_profile']['current_investments'] = investments
                
        elif self.current_step == 'investment_preferences':
            preferences = [pref.strip() for pref in message.split(',')]
            self.profile_data['investment_profile']['preferred_investment_types'] = preferences

    def _generate_response(self):
        if self.current_step == 'personal_info_name':
            return "What is your full name? (First and Last name)"
            
        elif self.current_step == 'personal_info_dob':
            return "What is your date of birth? (YYYY-MM-DD format)"
            
        elif self.current_step == 'personal_info_phone':
            return "What is your phone number? (Include country code if international)"
            
        elif self.current_step == 'financial_income':
            return "What is your annual income? (Please provide a number)"
            
        elif self.current_step == 'financial_assets':
            return "What is the total value of your assets? (Include savings, investments, property, etc.)"
            
        elif self.current_step == 'financial_liabilities':
            return "What is the total value of your liabilities? (Include loans, mortgages, credit card debt, etc.)"
            
        elif self.current_step == 'financial_expenses':
            return "What are your average monthly expenses?"
            
        elif self.current_step == 'financial_emergency':
            return "How much do you have in your emergency fund?"
            
        elif self.current_step == 'financial_additional_income':
            return "Do you have any additional sources of income? (List them separated by commas, or type 'none')"
            
        elif self.current_step == 'investment_experience':
            return "How would you rate your investment experience? (none, beginner, intermediate, or advanced)"
            
        elif self.current_step == 'investment_risk':
            return "What is your risk tolerance? (conservative, moderate, or aggressive)"
            
        elif self.current_step == 'investment_goals':
            return "What are your investment goals? (List them separated by commas, e.g., retirement, house purchase, children's education)"
            
        elif self.current_step == 'investment_retirement':
            return "At what age do you plan to retire?"
            
        elif self.current_step == 'investment_current':
            return "What are your current investments? (List them in format: type:amount, separated by commas, or type 'none')"
            
        elif self.current_step == 'investment_preferences':
            return "What types of investments are you interested in? (List them separated by commas, e.g., stocks, bonds, real estate)"
            
        elif self.current_step == 'review':
            return self._generate_review_message()
            
        elif self.current_step == 'complete':
            return "Thank you for providing all this information. Your wealth profile has been created successfully! I'll now redirect you to your dashboard."

    def _generate_review_message(self):
        # Create a summary of the collected information
        summary = "Here's a summary of your profile:\n\n"
        
        # Personal Information
        summary += "Personal Information:\n"
        summary += f"- Name: {self.profile_data['personal_info']['first_name']} {self.profile_data['personal_info']['last_name']}\n"
        summary += f"- Date of Birth: {self.profile_data['personal_info']['date_of_birth']}\n"
        summary += f"- Phone: {self.profile_data['personal_info']['phone']}\n\n"
        
        # Financial Overview
        summary += "Financial Overview:\n"
        summary += f"- Annual Income: ${self.profile_data['financial_overview']['annual_income']:,.2f}\n"
        summary += f"- Total Assets: ${self.profile_data['financial_overview']['total_assets']:,.2f}\n"
        summary += f"- Total Liabilities: ${self.profile_data['financial_overview']['total_liabilities']:,.2f}\n"
        summary += f"- Monthly Expenses: ${self.profile_data['financial_overview']['monthly_expenses']:,.2f}\n"
        summary += f"- Emergency Fund: ${self.profile_data['financial_overview']['emergency_fund']:,.2f}\n"
        
        # Investment Profile
        summary += "\nInvestment Profile:\n"
        summary += f"- Risk Tolerance: {self.profile_data['investment_profile']['risk_tolerance']}\n"
        summary += f"- Investment Experience: {self.profile_data['investment_profile']['investment_experience']}\n"
        summary += f"- Target Retirement Age: {self.profile_data['investment_profile']['target_retirement_age']}\n"
        summary += f"- Investment Goals: {', '.join(self.profile_data['investment_profile']['investment_goals'])}\n"
        
        summary += "\nIs this information correct? (Type 'yes' to confirm or 'no' to restart)"
        return summary

onboarding = Blueprint('onboarding', __name__)

# Configure CORS with simpler setup
CORS(onboarding, 
     origins=["http://localhost:3000", "http://127.0.0.1:3000"],
     supports_credentials=True,
     allow_headers=["Content-Type", "Accept"],
     methods=["GET", "POST", "OPTIONS"])

# Initialize Supabase client
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")

if not supabase_url or not supabase_key:
    raise ValueError("SUPABASE_URL and SUPABASE_KEY environment variables are required")

supabase = create_client(supabase_url, supabase_key)

# Store agent instances for each user session
agents = {}

@onboarding.route('/chat', methods=['POST', 'OPTIONS'])
def chat():
    if request.method == 'OPTIONS':
        response = make_response()
        response.headers.add('Access-Control-Allow-Origin', request.headers.get('Origin'))
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Accept')
        response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response
        
    data = request.json
    user_id = data.get('user_id')
    message = data.get('message')
    
    if not user_id or not message:
        response = make_response(jsonify({"error": "Missing user_id or message"}), 400)
        return response
    
    try:
        # Create or get agent for this user
        if user_id not in agents:
            agents[user_id] = ProfileCreationAgent()
        
        agent = agents[user_id]
        result = agent.chat(message)
        
        # If profile is complete, save to Supabase
        if result['is_complete']:
            try:
                profile_data = result['profile_data']
                # Flatten the nested structure for Supabase
                flat_profile = {
                    'id': user_id,
                    **profile_data['personal_info'],
                    **profile_data['financial_overview'],
                    **profile_data['investment_profile']
                }
                
                # Save to Supabase
                supabase.table('wealth_profiles').upsert(flat_profile).execute()
                
                # Clean up agent
                del agents[user_id]
                
            except Exception as e:
                print(f"Error saving to Supabase: {e}")
                response = make_response(jsonify({"error": "Failed to save profile"}), 500)
                return response
        
        response = make_response(jsonify(result))
        response.headers.add('Access-Control-Allow-Origin', request.headers.get('Origin'))
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response
        
    except Exception as e:
        print(f"Error in chat endpoint: {e}")
        response = make_response(jsonify({"error": str(e)}), 500)
        response.headers.add('Access-Control-Allow-Origin', request.headers.get('Origin'))
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response

@onboarding.route('/reset', methods=['POST', 'OPTIONS'])
def reset():
    if request.method == 'OPTIONS':
        response = make_response()
        response.headers.add('Access-Control-Allow-Origin', request.headers.get('Origin'))
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Accept')
        response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response
        
    data = request.json
    user_id = data.get('user_id')
    
    if not user_id:
        response = make_response(jsonify({"error": "Missing user_id"}), 400)
        return response
    
    if user_id in agents:
        del agents[user_id]
    
    response = make_response(jsonify({"message": "Profile reset successfully"}))
    response.headers.add('Access-Control-Allow-Origin', request.headers.get('Origin'))
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response 