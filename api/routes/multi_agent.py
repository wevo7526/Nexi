from flask import Blueprint, request, jsonify, Response, stream_with_context
from models.multi_agent_model import PrimaryResearchConsultant
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

# Initialize the consultant with proper error handling
try:
    consultant = PrimaryResearchConsultant()
    logger.info("Successfully initialized PrimaryResearchConsultant")
except Exception as e:
    logger.error(f"Failed to initialize PrimaryResearchConsultant: {str(e)}")
    consultant = None

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

        if not consultant:
            return jsonify({"error": "Research consultant not initialized"}), 500

        def generate():
            try:
                # Get the response from the consultant
                response = consultant.get_answer(query, user_id, chat_history)
                
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
    supports_credentials=True,
    max_age=3600,
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
        user_id = data.get('user_id', 'anonymous')

        if not consultant:
            return jsonify({"error": "Research consultant not initialized"}), 500

        def generate():
            try:
                # Initial status
                yield f"data: {json.dumps({'type': 'status', 'content': 'Starting research design...'})}\n\n"

                # Use the research_stream method to get a comprehensive research design
                for chunk in consultant.research_stream(query):
                    if chunk:
                        # Ensure content is properly formatted as JSON string if it's not already
                        if isinstance(chunk.get('content'), (dict, list)):
                            chunk['content'] = json.dumps(chunk['content'])
                        # Ensure each chunk is properly formatted as SSE
                        yield f"data: {json.dumps(chunk)}\n\n"
                
                # Send final status
                yield f"data: {json.dumps({'type': 'status', 'content': 'Research design complete'})}\n\n"
                
                # Send end message
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
    plan = consultant.generate_research_plan(query, client_info)
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