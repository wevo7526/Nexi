from flask import Blueprint, request, jsonify, make_response
from flask_cors import CORS
import os
from supabase import create_client, Client

class ProfileCreationAgent:
    def __init__(self):
        self.profile_data = {
            'personal_info': {},
            'financial_overview': {},
            'investment_profile': {}
        }
        self.current_step = 'intro'
        
    def chat(self, message):
        # Simple response logic based on current step
        if self.current_step == 'intro':
            self.current_step = 'personal_info'
            return {
                'response': "Welcome! Let's create your wealth management profile. Could you start by telling me your name and age?",
                'profile_data': self.profile_data,
                'is_complete': False
            }
            
        elif self.current_step == 'personal_info':
            self.current_step = 'financial'
            return {
                'response': "Great! Now, could you tell me about your current annual income and any significant assets or investments you have?",
                'profile_data': self.profile_data,
                'is_complete': False
            }
            
        elif self.current_step == 'financial':
            self.current_step = 'goals'
            return {
                'response': "What are your main financial goals? For example, retirement planning, wealth growth, or both?",
                'profile_data': self.profile_data,
                'is_complete': False
            }
            
        elif self.current_step == 'goals':
            self.current_step = 'complete'
            self.profile_data['is_complete'] = True
            return {
                'response': "Thank you for providing all this information. I've created a basic profile for you. Would you like to review it?",
                'profile_data': self.profile_data,
                'is_complete': True
            }
            
        return {
            'response': "I understand. Let me help you with that.",
            'profile_data': self.profile_data,
            'is_complete': False
        }

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