from flask import Blueprint, request, jsonify, Response, stream_with_context
from models.market_research_agent import MarketResearchAgent
import json
import traceback

market_research_bp = Blueprint('market_research', __name__)

# Initialize the agent at module level
try:
    agent = MarketResearchAgent()
except Exception as e:
    print(f"Error initializing MarketResearchAgent: {str(e)}")
    agent = None

@market_research_bp.route('/research', methods=['POST'])
def conduct_research():
    """
    Endpoint to conduct market research based on user query with streaming response
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

        def generate():
            try:
                for chunk in agent.research_stream(query):
                    if chunk.get('status') == 'error':
                        yield f"data: {json.dumps(chunk)}\n\n"
                        return
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
def get_history():
    """
    Endpoint to retrieve chat history
    """
    try:
        history = agent.get_chat_history()
        return jsonify({
            'status': 'success',
            'history': history
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e),
            'traceback': traceback.format_exc()
        }), 500

@market_research_bp.route('/trends', methods=['GET'])
def get_trends():
    """
    Endpoint to get current market trends and insights
    """
    try:
        if agent is None:
            return jsonify({
                'status': 'error',
                'message': 'Market Research Agent not initialized properly'
            }), 500

        trends_data = agent.get_market_trends()
        return jsonify(trends_data)
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e),
            'traceback': traceback.format_exc()
        }), 500

@market_research_bp.route('/trends', methods=['OPTIONS'])
def trends_options():
    """Handle OPTIONS requests for CORS"""
    return Response(
        '',
        headers={
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        }
    ) 