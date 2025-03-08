import sys
import os

# Add the project directory to the Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from flask import Flask, request, jsonify
from flask_cors import CORS
from models.agent_model import ConsultantAgent
from models.wealth_manager_agent import WealthManagerAgent

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes
consultant_agent = ConsultantAgent()
wealth_manager_agent = WealthManagerAgent()

@app.route('/get_answer', methods=['POST'])
def get_answer():
    data = request.json
    query = data.get('query')
    chat_history = data.get('chat_history')
    thread_id = data.get('thread_id', 'default')
    answer = consultant_agent.get_answer(query, chat_history, thread_id)
    return jsonify({'answer': answer})

@app.route('/get_wealth_answer', methods=['POST'])
def get_wealth_answer():
    data = request.json
    query = data.get('query')
    chat_history = data.get('chat_history')
    thread_id = data.get('thread_id', 'default')
    answer = wealth_manager_agent.get_answer(query, chat_history, thread_id)
    return jsonify({'answer': answer})

if __name__ == '__main__':
    app.run(debug=True)