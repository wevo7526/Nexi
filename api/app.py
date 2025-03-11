import sys
import os
from flask import Flask, request, jsonify
from flask_cors import CORS

# Add the project directory to the Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from models.agent_model import ConsultantAgent
from models.wealth_manager_agent import WealthManagerAgent
from models.multi_agent_model import MultiAgentConsultant

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Initialize agents
consultant_agent = ConsultantAgent()
wealth_manager_agent = WealthManagerAgent()
multi_agent_consultant = MultiAgentConsultant()  # New MultiAgentConsultant instance

# Create a temporary directory for file uploads
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route('/get_answer', methods=['POST'])
def get_answer():
    """
    Endpoint for ConsultantAgent.
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
        docs = consultant_agent.load_document(file_path)
        context = "\n".join([doc.page_content for doc in docs])
    else:
        context = ""

    answer = consultant_agent.get_answer(query, chat_history, thread_id, context)
    return jsonify({'answer': answer})

@app.route('/get_wealth_answer', methods=['POST'])
def get_wealth_answer():
    """
    Endpoint for WealthManagerAgent.
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

    answer = wealth_manager_agent.get_answer(query, chat_history, thread_id, context)
    return jsonify({'answer': answer})

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