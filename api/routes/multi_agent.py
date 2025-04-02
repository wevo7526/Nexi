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
                yield f"data: {json.dumps({'type': 'status', 'content': 'Starting research analysis...'})}\n\n"

                # Research Design Phase
                yield f"data: {json.dumps({'type': 'status', 'content': 'Designing research plan...'})}\n\n"
                research_design = consultant._get_research_design(query)
                if "error" in research_design:
                    yield f"data: {json.dumps({'type': 'error', 'content': research_design['error']})}\n\n"
                    return
                yield f"data: {json.dumps({'type': 'content', 'section': 'research_design', 'content': research_design})}\n\n"

                # Focus Group Design Phase
                yield f"data: {json.dumps({'type': 'status', 'content': 'Creating focus group guide...'})}\n\n"
                focus_group_guide = consultant._get_focus_group_guide(query)
                if "error" in focus_group_guide:
                    yield f"data: {json.dumps({'type': 'error', 'content': focus_group_guide['error']})}\n\n"
                    return
                yield f"data: {json.dumps({'type': 'content', 'section': 'focus_group', 'content': focus_group_guide})}\n\n"

                # Survey Design Phase
                yield f"data: {json.dumps({'type': 'status', 'content': 'Designing survey...'})}\n\n"
                try:
                    survey_design = consultant._get_survey_design(query)
                    if "error" in survey_design:
                        logger.warning(f"Survey design warning: {survey_design['error']}")
                        survey_design = {
                            "sections": [
                                {
                                    "title": "Basic Information",
                                    "questions": [
                                        "How satisfied were you with your visit?",
                                        "Would you recommend us to others?",
                                        "What aspects did you enjoy most?"
                                    ]
                                }
                            ]
                        }
                    yield f"data: {json.dumps({'type': 'content', 'section': 'survey', 'content': survey_design})}\n\n"
                except Exception as e:
                    logger.error(f"Error in survey design: {str(e)}")
                    yield f"data: {json.dumps({'type': 'error', 'content': 'Error in survey design, continuing with analysis...'})}\n\n"

                # Analysis Plan Phase
                yield f"data: {json.dumps({'type': 'status', 'content': 'Creating analysis plan...'})}\n\n"
                analysis_plan = consultant._get_analysis_plan(query)
                if "error" in analysis_plan:
                    yield f"data: {json.dumps({'type': 'error', 'content': analysis_plan['error']})}\n\n"
                    return
                yield f"data: {json.dumps({'type': 'content', 'section': 'analysis', 'content': analysis_plan})}\n\n"

                # Compile Final Report
                yield f"data: {json.dumps({'type': 'status', 'content': 'Compiling final research plan...'})}\n\n"
                final_plan = consultant._compile_research_plan(
                    research_design,
                    focus_group_guide,
                    survey_design if 'survey_design' in locals() else None,
                    analysis_plan,
                    data.get('client_info', {})
                )

                # Send final structured data
                yield f"data: {json.dumps({'type': 'final', 'content': final_plan})}\n\n"

                # Final complete message
                yield f"data: {json.dumps({'type': 'status', 'content': 'Research analysis completed successfully'})}\n\n"

            except Exception as e:
                logger.error(f"Error in generate: {str(e)}")
                yield f"data: {json.dumps({'type': 'error', 'content': str(e)})}\n\n"

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
        logger.error(f"Error in chat endpoint: {str(e)}")
        return jsonify({
            'error': str(e),
            'type': 'error',
            'status': 'error'
        }), 500

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