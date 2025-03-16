from flask import Blueprint, request, jsonify
from ..services.document_service import DocumentService
from models.agent_model import ConsultantAgent

chat_bp = Blueprint('chat', __name__)
document_service = DocumentService()
consultant_agent = ConsultantAgent()

@chat_bp.route('/api/chat', methods=['POST'])
async def chat():
    """Handle chat messages and document-based queries."""
    try:
        # Validate authorization
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({
                'success': False,
                'error': 'Invalid authorization header'
            }), 401
            
        token = auth_header.split(' ')[1]
        user_id = await document_service.get_user_id_from_token(token)

        # Get request data
        data = request.get_json()
        if not data or 'message' not in data:
            return jsonify({
                'success': False,
                'error': 'No message provided'
            }), 400

        message = data['message']
        chat_history = data.get('chat_history', [])

        # Search documents and get response
        result = await document_service.search_documents(message, user_id, chat_history)

        return jsonify({
            'success': True,
            'answer': result['answer'],
            'sources': result.get('sources', []),
            'chat_history': result.get('chat_history', [])
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500 