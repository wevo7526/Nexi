import sys
import os
from flask import Flask, request, jsonify, Response, stream_with_context
from flask_cors import CORS
from dotenv import load_dotenv
from datetime import datetime
import asyncio
import json
import logging
import traceback
from werkzeug.utils import secure_filename

# Get the project root directory (one level up from api directory)
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
ENV_FILE = os.path.join(PROJECT_ROOT, '.env')

# Print current working directory and .env file location
print(f"Current working directory: {os.getcwd()}")
print(f"Project root directory: {PROJECT_ROOT}")
print(f"Looking for .env file at: {ENV_FILE}")
print(f".env file exists: {os.path.exists(ENV_FILE)}")

# Load environment variables from the correct location
load_dotenv(ENV_FILE)

# Print environment variables for debugging
print(f"SUPABASE_URL: {os.getenv('SUPABASE_URL')}")
print(f"SUPABASE_KEY exists: {'Yes' if os.getenv('SUPABASE_KEY') else 'No'}")
print(f"ANTHROPIC_API_KEY exists: {'Yes' if os.getenv('ANTHROPIC_API_KEY') else 'No'}")

# Add the project directory to the Python path
sys.path.append(PROJECT_ROOT)

from models.agent_model import ConsultantAgent
from models.wealth_manager_agent import WealthManagerAgent
from models.multi_agent_model import MultiAgentConsultant
from models.market_research_agent import MarketResearchAgent
from api.routes.market_research import market_research_bp
from api.routes.market_data import market_data_bp
from api.services.document_service import DocumentService

# Initialize Flask app and enable CORS
app = Flask(__name__)

# Enable CORS for all routes
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:3000", "http://127.0.0.1:3000"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# Verify environment variables
required_env_vars = ['SUPABASE_URL', 'SUPABASE_KEY', 'ANTHROPIC_API_KEY', 'COHERE_API_KEY']
missing_vars = [var for var in required_env_vars if not os.getenv(var)]
if missing_vars:
    raise ValueError(f"Missing required environment variables: {', '.join(missing_vars)}")

# Register blueprints
app.register_blueprint(market_research_bp, url_prefix='/api/market-research')
app.register_blueprint(market_data_bp, url_prefix='/api/market-data')

# Initialize services and agents
document_service = DocumentService()
consultant_agent = ConsultantAgent()
wealth_manager_agent = WealthManagerAgent()
multi_agent_consultant = MultiAgentConsultant()
market_research_agent = MarketResearchAgent()

# Create a temporary directory for file uploads
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Market Research Endpoints
@app.route('/api/market-research/research', methods=['POST'])
def conduct_research():
    """
    Endpoint to conduct market research based on user query with streaming response
    """
    try:
        data = request.get_json()
        
        if not data or 'query' not in data:
            return jsonify({
                'status': 'error',
                'message': 'Query is required'
            }), 400
            
        query = data['query']

        def generate():
            try:
                for chunk in market_research_agent.research_stream(query):
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

@app.route('/api/market-research/research', methods=['OPTIONS'])
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

@app.route('/api/market-research/history', methods=['GET'])
def get_research_history():
    """
    Endpoint to retrieve market research chat history
    """
    try:
        history = market_research_agent.get_chat_history()
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

@app.route('/api/get_documents', methods=['GET'])
async def get_documents():
    """Get all documents for the current user."""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({
                'error': 'Invalid authorization header',
                'success': False
            }), 401
            
        token = auth_header.split(' ')[1]
        user_id = await document_service.get_user_id_from_token(token)
        
        documents = await document_service.get_user_documents(user_id)
        return jsonify({
            'success': True,
            'documents': documents
        })
    except Exception as e:
        logging.error(f"Error in get_documents: {str(e)}")
        return jsonify({
            'error': str(e),
            'success': False
        }), 500

@app.route('/api/upload_document', methods=['POST'])
async def upload_document():
    """Upload and process a document."""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({
                'error': 'Invalid authorization header',
                'success': False
            }), 401
            
        token = auth_header.split(' ')[1]
        user_id = await document_service.get_user_id_from_token(token)
        
        if 'file' not in request.files:
            return jsonify({
                'error': 'No file provided',
                'success': False
            }), 400
            
        file = request.files['file']
        if not file.filename:
            return jsonify({
                'error': 'No file selected',
                'success': False
            }), 400

        # Validate file size (10MB limit)
        if len(file.read()) > 10 * 1024 * 1024:
            return jsonify({
                'error': 'File too large. Maximum size is 10MB.',
                'success': False
            }), 400
        file.seek(0)  # Reset file pointer after reading

        # Validate file type
        filename = file.filename
        file_ext = os.path.splitext(filename)[1].lower()
        if file_ext not in document_service.SUPPORTED_EXTENSIONS:
            return jsonify({
                'error': f'Unsupported file type: {file_ext}. Supported types: {", ".join(document_service.SUPPORTED_EXTENSIONS)}',
                'success': False
            }), 400
            
        # Save file temporarily
        temp_path = os.path.join(app.config['UPLOAD_FOLDER'], secure_filename(filename))
        file.save(temp_path)
        
        try:
            # Process document
            result = await document_service.process_document(
                temp_path,
                user_id,
                original_name=filename
            )
            
            return jsonify({
                'success': True,
                'message': 'Document uploaded successfully',
                'id': result['id'],
                'status': result['status']
            })
        finally:
            # Clean up temporary file
            try:
                if os.path.exists(temp_path):
                    os.remove(temp_path)
            except Exception as cleanup_error:
                logging.warning(f"Error cleaning up temporary file: {str(cleanup_error)}")
                
    except ValueError as ve:
        logging.error(f"Validation error in upload_document: {str(ve)}")
        return jsonify({
            'error': str(ve),
            'success': False
        }), 400
    except Exception as e:
        logging.error(f"Error in upload_document: {str(e)}")
        return jsonify({
            'error': str(e),
            'success': False
        }), 500

@app.route('/api/delete_document/<document_id>', methods=['DELETE'])
async def delete_document(document_id):
    """Delete a document."""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({
                'error': 'Invalid authorization header',
                'success': False
            }), 401
            
        token = auth_header.split(' ')[1]
        user_id = await document_service.get_user_id_from_token(token)
        
        success = await document_service.delete_document(document_id, user_id)
        if success:
            return jsonify({
                'success': True,
                'message': 'Document deleted successfully'
            })
        return jsonify({
            'error': 'Document not found',
            'success': False
        }), 404
    except Exception as e:
        logging.error(f"Error in delete_document: {str(e)}")
        return jsonify({
            'error': str(e),
            'success': False
        }), 500

@app.route('/api/search_documents', methods=['POST'])
async def search_documents():
    """Search through documents using similarity search."""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({
                'error': 'Invalid authorization header',
                'success': False
            }), 401
            
        token = auth_header.split(' ')[1]
        user_id = await document_service.get_user_id_from_token(token)
        
        data = request.get_json()
        if not data or 'query' not in data:
            return jsonify({
                'error': 'No query provided',
                'success': False
            }), 400
            
        results = await document_service.search_documents(data['query'], user_id)
        return jsonify({
            'success': True,
            'results': results
        })
    except Exception as e:
        logging.error(f"Error in search_documents: {str(e)}")
        return jsonify({
            'error': str(e),
            'success': False
        }), 500

@app.route('/api/document_status/<document_id>', methods=['GET'])
async def get_document_status(document_id):
    """Get the processing status of a document."""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({
                'error': 'Invalid authorization header',
                'success': False
            }), 401
            
        token = auth_header.split(' ')[1]
        user_id = await document_service.get_user_id_from_token(token)

        # Get document metadata
        response = await document_service.supabase.table("document_metadata").select("*").eq("id", document_id).eq("user_id", user_id).execute()
        
        if not response.data:
            return jsonify({
                'error': 'Document not found',
                'success': False
            }), 404

        document = response.data[0]
        return jsonify({
            'success': True,
            'status': document['status'],
            'processing_progress': document.get('processing_progress', 0),
            'processing_error': document.get('processing_error')
        })
    except Exception as e:
        logging.error(f"Error in get_document_status: {str(e)}")
        return jsonify({
            'error': str(e),
            'success': False
        }), 500

@app.route('/api/get_answer', methods=['POST'])
async def get_answer():
    try:
        # Validate authorization
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({
                'error': 'Invalid authorization header',
                'success': False
            }), 401
            
        token = auth_header.split(' ')[1]
        user_id = await document_service.get_user_id_from_token(token)
        
        # Validate request data
        data = request.get_json()
        if not data:
            return jsonify({
                'error': 'No JSON data received',
                'success': False
            }), 400
            
        query = data.get('query')
        if not query or not query.strip():
            return jsonify({
                'error': 'Query is required and cannot be empty',
                'success': False
            }), 400
            
        chat_history = data.get('chat_history', [])
        if not isinstance(chat_history, list):
            return jsonify({
                'error': 'Chat history must be a list',
                'success': False
            }), 400
        
        # Get answer using the ConsultantAgent
        answer = consultant_agent.get_answer(
            query=query,
            user_id=user_id,
            chat_history=chat_history
        )
        
        if not answer:
            return jsonify({
                'error': 'Failed to generate answer',
                'success': False
            }), 500
        
        return jsonify({
            'answer': answer,
            'success': True
        })
    except Exception as e:
        logging.error(f"Error in get_answer: {str(e)}")
        return jsonify({
            'error': str(e),
            'success': False
        }), 500

@app.route('/get_wealth_answer', methods=['POST'])
def get_wealth_answer():
    """
    Endpoint for WealthManagerAgent with structured output.
    """
    data = request.form
    query = data.get('query')
    chat_history = data.get('chat_history')
    thread_id = data.get('thread_id', 'default')

    # Handle file upload if present
    if 'file' in request.files:
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400
        file_path = os.path.join(UPLOAD_FOLDER, file.filename)
        file.save(file_path)
        docs = wealth_manager_agent.load_document(file_path)
        context = "\n".join([doc.page_content for doc in docs])
    else:
        context = ""

    # Call wealth_manager_agent to get a structured response
    structured_answer = wealth_manager_agent.get_answer(query, chat_history, thread_id, context)
    return jsonify({'answer': structured_answer})

@app.route('/get_multi_agent_answer', methods=['POST'])
def get_multi_agent_answer():
    """
    Endpoint for MultiAgentConsultant with enhanced report generation.
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No JSON data received'}), 400
            
        query = data.get('query')
        if not query:
            return jsonify({'error': 'Query is required'}), 400
            
        client_info = data.get('client_info', '')
        thread_id = data.get('thread_id', f'thread_{datetime.now().timestamp()}')

        # Generate the comprehensive report
        report = multi_agent_consultant.generate_comprehensive_report(query, client_info)
        
        if not report:
            return jsonify({'error': 'Failed to generate report'}), 500

        # Save the report to a file
        report_filename = f"report_{int(datetime.now().timestamp())}.json"
        report_path = os.path.join(app.config['UPLOAD_FOLDER'], report_filename)
        
        with open(report_path, 'w') as f:
            json.dump(report, f, indent=2)

        # Return the formatted report
        return jsonify({
            'answer': report,
            'report_path': report_path
        })
        
    except Exception as e:
        logging.error(f"Error in get_multi_agent_answer: {str(e)}")
        return jsonify({'error': str(e)}), 500

# Health check endpoint
@app.route('/api/health', methods=['GET'])
def health_check():
    """
    Endpoint to check API health status
    """
    try:
        # Check if required services are available
        required_services = {
            'anthropic': bool(os.getenv('ANTHROPIC_API_KEY')),
            'supabase': bool(os.getenv('SUPABASE_URL') and os.getenv('SUPABASE_KEY')),
            'cohere': bool(os.getenv('COHERE_API_KEY'))
        }
        
        all_services_available = all(required_services.values())
        
        return jsonify({
            'status': 'ok' if all_services_available else 'degraded',
            'timestamp': datetime.now().isoformat(),
            'services': required_services
        })
    except Exception as e:
        logging.error(f"Health check failed: {str(e)}")
        return jsonify({
            'status': 'error',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

if __name__ == '__main__':
    print("Starting Flask server...")
    print(f"ALPHAVANTAGE_API_KEY exists: {'Yes' if os.getenv('ALPHAVANTAGE_API_KEY') else 'No'}")
    app.run(host='0.0.0.0', port=5000, debug=True)
