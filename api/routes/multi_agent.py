from flask import Blueprint, request, jsonify, Response
from models.multi_agent_model import PrimaryResearchConsultant
from config.settings import ANTHROPIC_API_KEY
import json
import logging
from functools import wraps
from flask_cors import cross_origin
from datetime import datetime
import time

multi_agent_bp = Blueprint('multi_agent', __name__)

# Initialize the consultant with proper error handling
try:
    consultant = PrimaryResearchConsultant()
    logging.info("Successfully initialized PrimaryResearchConsultant")
except Exception as e:
    logging.error(f"Failed to initialize PrimaryResearchConsultant: {str(e)}")
    consultant = None

def handle_errors(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except Exception as e:
            logging.error(f"Error in {f.__name__}: {str(e)}")
            error_response = {
                "error": str(e),
                "type": "error",
                "status": "error",
                "message": "An error occurred while processing your request"
            }
            return jsonify(error_response), 500
    return decorated_function

@multi_agent_bp.route('/get_answer', methods=['POST'])
@cross_origin(origins='*', allow_headers=['Content-Type', 'Authorization'])
@handle_errors
def get_answer():
    """Handle research assistant queries with streaming response."""
    try:
        if not consultant:
            raise Exception("Research consultant not initialized")

        logging.info("Received get_answer request")
        data = request.get_json()
        if not data:
            logging.error("No data provided in request")
            return jsonify({"error": "No data provided"}), 400

        query = data.get('query')
        user_id = data.get('user_id')
        chat_history = data.get('chat_history', [])

        logging.info(f"Processing query: {query}")
        logging.info(f"User ID: {user_id}")
        logging.info(f"Chat history length: {len(chat_history)}")

        if not query:
            logging.error("Query is required")
            return jsonify({"error": "Query is required"}), 400

        if not user_id:
            logging.error("User ID is required")
            return jsonify({"error": "User ID is required"}), 400

        def generate():
            try:
                logging.info("Starting response generation")
                # Initial status
                status_msg = {'type': 'status', 'content': 'Initializing research assistant...'}
                logging.info(f"Sending status: {status_msg}")
                yield f"data: {json.dumps(status_msg)}\n\n"
                
                # Get response from the consultant
                logging.info("Calling consultant.get_answer")
                response = consultant.get_answer(query, user_id, chat_history)
                logging.info(f"Received response from consultant: {response}")
                
                if "error" in response:
                    error_msg = {'type': 'error', 'content': response['error']}
                    logging.error(f"Sending error: {error_msg}")
                    yield f"data: {json.dumps(error_msg)}\n\n"
                    return

                # Stream the main content
                if response.get("content"):
                    logging.info("Processing main content")
                    if isinstance(response["content"], dict) and "sections" in response["content"]:
                        for section in response["content"]["sections"]:
                            content_msg = {'type': 'content', 'content': section.get('content', '')}
                            logging.info(f"Sending content section: {content_msg}")
                            yield f"data: {json.dumps(content_msg)}\n\n"
                            # Add a small delay to simulate thinking time
                            time.sleep(0.5)
                    else:
                        content_msg = {'type': 'content', 'content': response['content']}
                        logging.info(f"Sending content: {content_msg}")
                        yield f"data: {json.dumps(content_msg)}\n\n"

                # Stream structured outputs
                if response.get("outputs"):
                    logging.info("Processing structured outputs")
                    for output in response["outputs"]:
                        if isinstance(output.get("content"), dict) and "sections" in output["content"]:
                            for section in output["content"]["sections"]:
                                output_msg = {
                                    'type': 'output',
                                    'output_type': output.get('type', 'text'),
                                    'title': output.get('title', ''),
                                    'content': section.get('content', '')
                                }
                                logging.info(f"Sending output section: {output_msg}")
                                yield f"data: {json.dumps(output_msg)}\n\n"
                                # Add a small delay to simulate thinking time
                                time.sleep(0.5)
                        else:
                            output_msg = {
                                'type': 'output',
                                'output_type': output.get('type', 'text'),
                                'title': output.get('title', ''),
                                'content': output.get('content', '')
                            }
                            logging.info(f"Sending output: {output_msg}")
                            yield f"data: {json.dumps(output_msg)}\n\n"

                # Final success message
                complete_msg = {'type': 'complete', 'content': 'Analysis complete'}
                logging.info(f"Sending completion message: {complete_msg}")
                yield f"data: {json.dumps(complete_msg)}\n\n"

            except Exception as e:
                logging.error(f"Error in get_answer stream: {str(e)}")
                error_msg = {'type': 'error', 'content': str(e)}
                logging.error(f"Sending error: {error_msg}")
                yield f"data: {json.dumps(error_msg)}\n\n"

        logging.info("Creating SSE response")
        response = Response(generate(), mimetype='text/event-stream')
        response.headers['Cache-Control'] = 'no-cache'
        response.headers['Connection'] = 'keep-alive'
        response.headers['X-Accel-Buffering'] = 'no'
        return response

    except Exception as e:
        logging.error(f"Error in get_answer: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@multi_agent_bp.route('/chat', methods=['POST'])
@cross_origin(origins='*', allow_headers=['Content-Type', 'Authorization'])
@handle_errors
def chat():
    """Handle chat requests for primary research planning."""
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    query = data.get('query')
    client_info = data.get('client_info')

    if not query:
        return jsonify({"error": "Query is required"}), 400

    def generate():
        try:
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
            survey_design = consultant._get_survey_design(query)
            if "error" in survey_design:
                yield f"data: {json.dumps({'type': 'error', 'content': survey_design['error']})}\n\n"
                return
            yield f"data: {json.dumps({'type': 'content', 'section': 'survey', 'content': survey_design})}\n\n"

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
                survey_design,
                analysis_plan,
                client_info
            )
            yield f"data: {json.dumps({'type': 'final', 'content': final_plan})}\n\n"

        except Exception as e:
            logging.error(f"Error in research plan generation: {str(e)}")
            error_message = {
                'type': 'error',
                'content': str(e),
                'details': {
                    'message': 'An error occurred while generating the research plan',
                    'timestamp': datetime.now().isoformat()
                }
            }
            yield f"data: {json.dumps(error_message)}\n\n"

    response = Response(generate(), mimetype='text/event-stream')
    response.headers['Cache-Control'] = 'no-cache'
    response.headers['Connection'] = 'keep-alive'
    response.headers['X-Accel-Buffering'] = 'no'
    return response

@multi_agent_bp.route('/analyze', methods=['POST'])
@cross_origin(origins='*', allow_headers=['Content-Type', 'Authorization'])
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

@multi_agent_bp.route('/api/multi-agent/chat/options', methods=['OPTIONS'])
@cross_origin(origins='*', allow_headers=['Content-Type', 'Authorization'])
def chat_options():
    response = Response()
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization'
    response.headers['Access-Control-Allow-Methods'] = 'POST,OPTIONS'
    return response 