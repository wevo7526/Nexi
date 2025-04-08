from flask import Blueprint, request, jsonify, Response, stream_with_context
from models.market_research_agent import MarketResearchAgent
import json
import traceback
import logging
from functools import wraps
from typing import Dict, Any

# Configure logging
logger = logging.getLogger(__name__)

market_research_bp = Blueprint('market_research', __name__)

def handle_api_error(f):
    """Decorator to handle API errors consistently."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except Exception as e:
            logger.error(f"Error in {f.__name__}: {str(e)}")
            logger.error(traceback.format_exc())
            return jsonify({
                'status': 'error',
                'message': str(e),
                'traceback': traceback.format_exc()
            }), 500
    return decorated_function

# Initialize the agent at module level
try:
    agent = MarketResearchAgent()
except Exception as e:
    logger.error(f"Error initializing MarketResearchAgent: {str(e)}")
    agent = None

@market_research_bp.route('/research', methods=['POST'])
@handle_api_error
def conduct_research():
    """
    Endpoint to conduct market research based on user query with streaming response.
    Handles comprehensive research including exploratory, descriptive, and predictive analysis.
    """
    try:
        if agent is None:
            return jsonify({
                'status': 'error',
                'message': 'Market Research Agent not initialized properly'
            }), 500

        data = request.get_json()
        
        if not data or 'query' not in data:
            return jsonify({
                'status': 'error',
                'message': 'Query is required'
            }), 400
            
        query = data['query']
        user_id = data.get('user_id')

        def generate():
            try:
                for chunk in agent.research_stream(query):
                    if chunk.get('status') == 'error':
                        yield f"data: {json.dumps(chunk)}\n\n"
                        return
                    
                    # Add metadata to each chunk
                    chunk['metadata'] = {
                        'timestamp': chunk.get('timestamp'),
                        'user_id': user_id,
                        'query': query
                    }
                    
                    yield f"data: {json.dumps(chunk)}\n\n"
            except Exception as e:
                error_data = {
                    'status': 'error',
                    'type': 'error',
                    'message': str(e),
                    'traceback': traceback.format_exc()
                }
                yield f"data: {json.dumps(error_data)}\n\n"

        return Response(
            stream_with_context(generate()),
            mimetype='text/event-stream',
            headers={
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'X-Accel-Buffering': 'no',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            }
        )
    except Exception as e:
        logger.error(f"Error in conduct_research: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({
            'status': 'error',
            'message': str(e),
            'traceback': traceback.format_exc()
        }), 500

@market_research_bp.route('/research', methods=['OPTIONS'])
def research_options():
    """Handle OPTIONS requests for CORS"""
    return Response(
        '',
        headers={
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        }
    )

@market_research_bp.route('/history', methods=['GET'])
@handle_api_error
def get_history():
    """
    Endpoint to retrieve chat history with enhanced metadata
    """
    try:
        history = agent.get_chat_history()
        return jsonify({
            'status': 'success',
            'history': history,
            'metadata': {
                'total_messages': len(history),
                'last_updated': history[-1]['timestamp'] if history else None
            }
        })
    except Exception as e:
        logger.error(f"Error in get_history: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({
            'status': 'error',
            'message': str(e),
            'traceback': traceback.format_exc()
        }), 500 