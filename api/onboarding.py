from flask import Blueprint, request, jsonify
from services.supabase_service import SupabaseService
from models.agent_model import ConsultantAgent
import logging

onboarding_bp = Blueprint('onboarding', __name__)
supabase = SupabaseService()
consultant_agent = ConsultantAgent()

@onboarding_bp.route('/api/onboarding/chat', methods=['POST'])
async def chat():
    try:
        data = request.get_json()
        message = data.get('message')
        session_id = data.get('session_id')
        
        if not message:
            return jsonify({'error': 'Message is required'}), 400

        # Get chat history from Supabase
        chat_history = await supabase.get_chat_history(session_id) if session_id else []
        
        # Get response from consultant agent
        response = await consultant_agent.get_response(message, chat_history)
        
        # Save to chat history
        if session_id:
            await supabase.save_chat_message(session_id, 'user', message)
            await supabase.save_chat_message(session_id, 'assistant', response)
        
        return jsonify({
            'response': response,
            'session_id': session_id
        })
    except Exception as e:
        logging.error(f"Error in onboarding chat: {str(e)}")
        return jsonify({'error': str(e)}), 500

@onboarding_bp.route('/api/onboarding/complete', methods=['POST'])
async def complete_onboarding():
    try:
        data = request.get_json()
        session_id = data.get('session_id')
        
        if not session_id:
            return jsonify({'error': 'Session ID is required'}), 400

        # Get chat history
        chat_history = await supabase.get_chat_history(session_id)
        
        # Generate profile from chat history
        profile = await consultant_agent.generate_profile(chat_history)
        
        # Save profile to Supabase
        await supabase.save_profile(profile)
        
        return jsonify({
            'message': 'Profile created successfully',
            'profile': profile
        })
    except Exception as e:
        logging.error(f"Error completing onboarding: {str(e)}")
        return jsonify({'error': str(e)}), 500 