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

# Initialize Flask app and enable CORS
app = Flask(__name__)
CORS(app)

# Verify environment variables
required_env_vars = ['ALPHAVANTAGE_API_KEY']
missing_vars = [var for var in required_env_vars if not os.getenv(var)]
if missing_vars:
    raise ValueError(f"Missing required environment variables: {', '.join(missing_vars)}")

# Register blueprints
app.register_blueprint(market_research_bp, url_prefix='/api/market-research')
app.register_blueprint(market_data_bp, url_prefix='/api/market-data')

# Initialize agents
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

@app.route('/get_answer', methods=['POST'])
def get_answer():
    """
    Endpoint for ConsultantAgent with chat history support.
    """
    try:
        data = request.form
        query = data.get('query')
        if not query:
            return jsonify({'error': 'Query is required'}), 400

        chat_history = data.get('chat_history')
        thread_id = data.get('thread_id', 'default')
        user_id = data.get('user_id')

        # Handle file upload if present
        context = ""
        if 'file' in request.files:
            file = request.files['file']
            if file.filename:
                file_path = os.path.join(UPLOAD_FOLDER, file.filename)
                file.save(file_path)
                docs = consultant_agent.load_document(file_path)
                context = "\n".join([doc.page_content for doc in docs])

        # Get answer with chat history context
        answer = consultant_agent.get_answer(
            query=query,
            user_id=user_id,
            chat_history=chat_history,
            thread_id=thread_id,
            context=context
        )

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

if __name__ == '__main__':
    print("Starting Flask server...")
    print(f"ALPHAVANTAGE_API_KEY exists: {'Yes' if os.getenv('ALPHAVANTAGE_API_KEY') else 'No'}")
    app.run(host='0.0.0.0', port=5000, debug=True)
