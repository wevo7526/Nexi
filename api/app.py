import sys
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# Print current working directory and .env file location
print(f"Current working directory: {os.getcwd()}")
print(f".env file exists: {os.path.exists(os.path.join(os.getcwd(), '.env'))}")

# Load environment variables
load_dotenv()

# Print environment variables for debugging
print(f"SUPABASE_URL: {os.getenv('SUPABASE_URL')}")
print(f"SUPABASE_KEY exists: {'Yes' if os.getenv('SUPABASE_KEY') else 'No'}")
print(f"ANTHROPIC_API_KEY exists: {'Yes' if os.getenv('ANTHROPIC_API_KEY') else 'No'}")

# Add the project directory to the Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from models.agent_model import ConsultantAgent
from models.wealth_manager_agent import WealthManagerAgent
from models.multi_agent_model import MultiAgentConsultant
from reports import reports_bp

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
    data = request.json
    query = data.get('query')
    chat_history = data.get('chat_history')
    thread_id = data.get('thread_id', 'default')
    answer = multi_agent_consultant.get_advice(query, thread_id)
    return jsonify({'answer': answer})

if __name__ == '__main__':
    app.run(debug=True)
