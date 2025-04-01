import sys
import os
from flask import Flask, request, jsonify, Response, stream_with_context, make_response, send_file
from flask_cors import CORS
from dotenv import load_dotenv
from datetime import datetime
import asyncio
import json
import logging
import traceback
from werkzeug.utils import secure_filename
from services.insights_service import InsightsService
from services.document_service import DocumentService
from models.market_research_agent import MarketResearchAgent
from models.business_consultant_agent import BusinessConsultantAgent
from models.multi_agent_system import MultiAgentSystem

# Get the project root directory (one level up from api directory)
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
ENV_FILE = os.path.join(PROJECT_ROOT, '.env')

# Add the project directory to the Python path
sys.path.append(PROJECT_ROOT)

# Now import using absolute imports
from api.routes.documents import documents_bp
from api.routes.chat import chat_bp
from api.routes.market_research import market_research_bp
from api.routes.insights import insights_bp
from models.agent_model import ConsultantAgent
from models.multi_agent_model import PrimaryResearchConsultant
from api.services.supabase_service import SupabaseService
from api.routes.reports import reports_bp
from api.routes.multi_agent import multi_agent_bp
from api.routes.report_generator import report_generator_bp
from api.routes.business_case import business_case_bp

# Print debug information
print(f"Current working directory: {os.getcwd()}")
print(f"Project root directory: {PROJECT_ROOT}")
print(f"Looking for .env file at: {ENV_FILE}")
print(f".env file exists: {os.path.exists(ENV_FILE)}")

# Load environment variables from the correct location
load_dotenv(ENV_FILE)

# Print environment variables for debugging
print(f"SUPABASE_URL: {os.getenv('SUPABASE_URL')}")
print(f"SUPABASE_SERVICE_KEY exists: {'Yes' if os.getenv('SUPABASE_SERVICE_KEY') else 'No'}")
print(f"ANTHROPIC_API_KEY exists: {'Yes' if os.getenv('ANTHROPIC_API_KEY') else 'No'}")

def create_app():
    app = Flask(__name__)
    
    # Configure CORS
    @app.after_request
    def after_request(response):
        origin = request.headers.get('Origin')
        if origin in ["http://localhost:3000", "http://127.0.0.1:3000"]:
            response.headers['Access-Control-Allow-Origin'] = origin
            response.headers['Access-Control-Allow-Credentials'] = 'true'
            response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
            response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
            response.headers['Access-Control-Expose-Headers'] = 'Content-Type, Authorization'
            response.headers['Vary'] = 'Origin'
        return response

    @app.before_request
    def handle_preflight():
        if request.method == "OPTIONS":
            response = make_response()
            origin = request.headers.get('Origin')
            if origin in ["http://localhost:3000", "http://127.0.0.1:3000"]:
                response.headers['Access-Control-Allow-Origin'] = origin
                response.headers['Access-Control-Allow-Credentials'] = 'true'
                response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
                response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
                response.headers['Access-Control-Expose-Headers'] = 'Content-Type, Authorization'
                response.headers['Vary'] = 'Origin'
            return response

    # Register blueprints
    app.register_blueprint(documents_bp, url_prefix='/api/documents')
    app.register_blueprint(chat_bp, url_prefix='/api/chat')
    app.register_blueprint(market_research_bp, url_prefix='/api/market-research')
    app.register_blueprint(insights_bp, url_prefix='/api/insights')
    app.register_blueprint(reports_bp, url_prefix='/api/reports')
    app.register_blueprint(multi_agent_bp, url_prefix='/api/multi-agent')
    app.register_blueprint(report_generator_bp, url_prefix='/api/report-generator')
    app.register_blueprint(business_case_bp, url_prefix='/api/business-case')

    return app

# Create the Flask app
app = create_app()

# Verify environment variables
required_env_vars = ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY', 'ANTHROPIC_API_KEY', 'COHERE_API_KEY']
missing_vars = [var for var in required_env_vars if not os.getenv(var)]
if missing_vars:
    raise ValueError(f"Missing required environment variables: {', '.join(missing_vars)}")

# Initialize services and agents
document_service = DocumentService()
supabase_service = SupabaseService()
consultant_agent = ConsultantAgent()
primary_research_consultant = PrimaryResearchConsultant()
market_research_agent = MarketResearchAgent()
business_consultant_agent = BusinessConsultantAgent()
multi_agent_system = MultiAgentSystem()
insights_service = InsightsService()

# Create a temporary directory for file uploads
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024  # 10MB limit

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
            'documents': documents.get('documents', [])
        })
    except ValueError as e:
        logging.error(f"Authentication error: {str(e)}")
        return jsonify({
            'error': str(e),
            'success': False
        }), 401
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

        filename = secure_filename(file.filename)
        temp_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        
        try:
            file.save(temp_path)
            result = await document_service.process_document(
                temp_path,
                user_id,
                original_name=filename
            )
            
            return jsonify({
                'success': True,
                'document_id': str(result['id']),
                'status': str(result['status'])
            })
            
        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)
                
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
        
        result = await document_service.delete_document(document_id, user_id)
        return jsonify({
            'success': True,
            'message': 'Document deleted successfully'
        })
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

        result = await document_service.get_document_status(document_id, user_id)
        return jsonify({
            'success': True,
            'status': str(result['status']),
            'processing_error': str(result['processing_error']) if result.get('processing_error') else None
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

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint for the API."""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat()
    })

@app.route('/api/insights', methods=['GET'])
async def get_insights():
    try:
        insights = await insights_service.get_unified_insights()
        return jsonify(insights)
    except Exception as e:
        logging.error(f"Error getting insights: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/consultant/analyze', methods=['POST'])
async def analyze_business_case():
    try:
        data = request.get_json()
        case_data = data.get('case_data')
        if not case_data:
            return jsonify({'error': 'Case data is required'}), 400

        response = await business_consultant_agent.analyze_case(case_data)
        return jsonify(response)
    except Exception as e:
        logging.error(f"Error analyzing business case: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/multi-agent/analyze', methods=['POST'])
async def multi_agent_analysis():
    try:
        data = request.get_json()
        query = data.get('query')
        if not query:
            return jsonify({'error': 'Query is required'}), 400

        response = await multi_agent_system.analyze(query)
        return jsonify(response)
    except Exception as e:
        logging.error(f"Error in multi-agent analysis: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("Starting Flask server...")
    print(f"ALPHAVANTAGE_API_KEY exists: {'Yes' if os.getenv('ALPHAVANTAGE_API_KEY') else 'No'}")
    app.run(host='0.0.0.0', port=5000, debug=True)
