from flask import Blueprint, request, jsonify, Response, stream_with_context
from models.multi_agent_model import ResearchAssistantSystem
from config.settings import ANTHROPIC_API_KEY
import json
import logging
from functools import wraps
from flask_cors import cross_origin
from datetime import datetime
import time

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

multi_agent_bp = Blueprint('multi_agent', __name__)

# Initialize the research assistant system with proper error handling
try:
    research_system = ResearchAssistantSystem()
    logger.info("Successfully initialized ResearchAssistantSystem")
except Exception as e:
    logger.error(f"Failed to initialize ResearchAssistantSystem: {str(e)}")
    research_system = None

def handle_errors(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except Exception as e:
            logger.error(f"Error in {f.__name__}: {str(e)}")
            error_response = {
                "error": str(e),
                "type": "error",
                "status": "error",
                "message": "An error occurred while processing your request"
            }
            return jsonify(error_response), 500
    return decorated_function

def format_content(content):
    """Format content for SSE transmission."""
    if isinstance(content, (dict, list)):
        return json.dumps(content)
    return str(content)

@multi_agent_bp.route('/get_answer', methods=['POST'])
@cross_origin(
    origins=['http://localhost:3000'],  # Replace with your frontend URL
    allow_headers=['Content-Type', 'Authorization'],
    supports_credentials=True,
    max_age=3600,
    expose_headers=['Content-Type', 'Authorization'],
    allow_credentials=True,
    methods=['POST', 'OPTIONS']
)
@handle_errors
def get_answer():
    """Handle research queries and return structured responses."""
    try:
        data = request.get_json()
        if not data or 'query' not in data:
            return jsonify({"error": "No query provided"}), 400

        query = data['query']
        user_id = data.get('user_id', 'anonymous')
        chat_history = data.get('chat_history', [])

        if not research_system:
            return jsonify({"error": "Research assistant system not initialized"}), 500

        def generate():
            try:
                # Get the response from the research system
                response = research_system.get_answer(query, user_id, chat_history)
                
                # Send the response as a JSON string with proper SSE format
                yield f"data: {json.dumps({'type': 'response', 'content': response})}\n\n"
                
            except Exception as e:
                logger.error(f"Error generating response: {str(e)}")
                error_response = {"type": "error", "content": str(e)}
                yield f"data: {json.dumps(error_response)}\n\n"
            
            # Send end message
            yield "data: [DONE]\n\n"

        return Response(stream_with_context(generate()), mimetype='text/event-stream')

    except Exception as e:
        logger.error(f"Error in get_answer route: {str(e)}")
        return jsonify({"error": str(e)}), 500

@multi_agent_bp.route('/chat', methods=['POST'])
@cross_origin(
    origins=['http://localhost:3000'],
    allow_headers=['Content-Type', 'Authorization'],
    expose_headers=['Content-Type', 'Authorization'],
    allow_credentials=True,
    methods=['POST', 'OPTIONS']
)
@handle_errors
def chat():
    """Handle research queries and return structured responses."""
    try:
        data = request.get_json()
        if not data or 'query' not in data:
            return jsonify({"error": "No query provided"}), 400

        query = data['query']
        chat_history = data.get('chat_history', [])
        user_id = data.get('user_id', 'anonymous')

        logger.info(f"Received query: {query}")
        logger.info(f"Chat history length: {len(chat_history) if chat_history else 0}")

        if not research_system:
            return jsonify({"error": "Research assistant system not initialized"}), 500

        def generate():
            try:
                # Initial status
                yield f"data: {json.dumps({'type': 'status', 'content': 'Starting research design...'})}\n\n"

                # Use the research_stream method to get a comprehensive research design
                for chunk in research_system.research_stream(query, chat_history):
                    if chunk:
                        # Log the chunk type for debugging
                        logger.info(f"Processing chunk type: {chunk.get('type')}")
                        
                        # Convert 'content' type to 'research' type for frontend compatibility
                        if chunk.get('type') == 'content':
                            chunk['type'] = 'research'
                            
                            # Ensure content is properly formatted as JSON string if it's not already
                            if isinstance(chunk.get('content'), (dict, list)):
                                chunk['content'] = json.dumps(chunk['content'])
                                logger.info(f"Converted content to JSON string: {chunk['content'][:100]}...")
                        
                        # Ensure each chunk is properly formatted as SSE
                        sse_data = f"data: {json.dumps(chunk)}\n\n"
                        logger.info(f"Sending SSE data: {sse_data[:100]}...")
                        yield sse_data
                
                # Send final status
                yield f"data: {json.dumps({'type': 'status', 'content': 'Research design complete'})}\n\n"
                
                # Send final content message
                yield f"data: {json.dumps({'type': 'final', 'content': 'Research design process completed successfully'})}\n\n"
                
                # Send end message
                logger.info("Sending [DONE] message")
                yield "data: [DONE]\n\n"
                
            except Exception as e:
                logger.error(f"Error generating response: {str(e)}")
                error_response = {"type": "error", "content": str(e)}
                yield f"data: {json.dumps(error_response)}\n\n"
                yield "data: [DONE]\n\n"

        return Response(
            stream_with_context(generate()),
            mimetype='text/event-stream',
            headers={
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'X-Accel-Buffering': 'no'
            }
        )
    except Exception as e:
        logger.error(f"Error in chat route: {str(e)}")
        return jsonify({"error": str(e)}), 500

@multi_agent_bp.route('/analyze', methods=['POST'])
@cross_origin(
    origins=['http://localhost:3000'],  # Replace with your frontend URL
    allow_headers=['Content-Type', 'Authorization'],
    supports_credentials=True,
    max_age=3600,
    expose_headers=['Content-Type', 'Authorization'],
    allow_credentials=True,
    methods=['POST', 'OPTIONS']
)
@handle_errors
def analyze():
    """Handle direct research plan generation requests."""
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    query = data.get('query')
    client_info = data.get('client_info')

    if not query:
        return jsonify({"error": "Query is required"}), 400

    # Generate complete research plan
    plan = research_system.generate_research_plan(query, client_info)
    if "error" in plan:
        return jsonify({
            "error": plan["error"],
            "status": "error",
            "message": "Failed to generate research plan"
        }), 500

    return jsonify(plan)

@multi_agent_bp.route('/options', methods=['OPTIONS'])
@cross_origin(
    origins=['http://localhost:3000'],
    allow_headers=['Content-Type', 'Authorization'],
    supports_credentials=True,
    max_age=3600,
    expose_headers=['Content-Type', 'Authorization'],
    allow_credentials=True,
    methods=['POST', 'OPTIONS']
)
def chat_options():
    response = Response()
    response.headers['Access-Control-Allow-Origin'] = 'http://localhost:3000'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization'
    response.headers['Access-Control-Allow-Methods'] = 'POST,OPTIONS'
    response.headers['Access-Control-Allow-Credentials'] = 'true'
    response.headers['Access-Control-Max-Age'] = '3600'
    return response

@multi_agent_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint to verify the backend is running."""
    return jsonify({
        'status': 'ok',
        'message': 'Backend service is running'
    }), 200 