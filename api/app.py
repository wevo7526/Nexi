import sys
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from datetime import datetime
import asyncio

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
from reports import reports_bp
from onboarding import onboarding

# Initialize Flask app and enable CORS
app = Flask(__name__)
CORS(app)

# Verify environment variables
required_env_vars = ['SUPABASE_URL', 'SUPABASE_KEY', 'ANTHROPIC_API_KEY']
missing_vars = [var for var in required_env_vars if not os.getenv(var)]
if missing_vars:
    raise ValueError(f"Missing required environment variables: {', '.join(missing_vars)}")

# Register the reports blueprint
app.register_blueprint(reports_bp)

# Register the onboarding blueprint
app.register_blueprint(onboarding, url_prefix='/api/onboarding')

# Initialize agents
consultant_agent = ConsultantAgent()
wealth_manager_agent = WealthManagerAgent()
multi_agent_consultant = MultiAgentConsultant()

# Create a temporary directory for file uploads
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

@app.route('/get_answer', methods=['POST'])
def get_answer():
    """
    Endpoint for ConsultantAgent.
    """
    data = request.form
    query = data.get('query')
    chat_history = data.get('chat_history')
    thread_id = data.get('thread_id', 'default')
    user_id = data.get('user_id')  # Get user_id from request

    # Handle file upload if present
    if 'file' in request.files:
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400
        file_path = os.path.join(UPLOAD_FOLDER, file.filename)
        file.save(file_path)
        docs = consultant_agent.load_document(file_path)
        context = "\n".join([doc.page_content for doc in docs])
    else:
        context = ""

    answer = consultant_agent.get_answer(query, user_id, chat_history, thread_id, context)
    return jsonify({'answer': answer})

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
    Endpoint for MultiAgentConsultant.
    """
    try:
        # Get JSON data from request
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No JSON data received'}), 400
            
        query = data.get('query')
        if not query:
            return jsonify({'error': 'Query is required'}), 400
            
        client_info = data.get('client_info', '')
        thread_id = data.get('thread_id', f'thread_{datetime.now().timestamp()}')
        chat_history = data.get('chat_history', [])

        # Create an event loop and run the async function
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            # Generate the report
            report = loop.run_until_complete(
                multi_agent_consultant.generate_comprehensive_report(query, client_info)
            )
        finally:
            loop.close()
        
        if not report:
            return jsonify({'error': 'Failed to generate report'}), 500
            
        return jsonify({'answer': report})
        
    except Exception as e:
        print(f"Error in get_multi_agent_answer: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
