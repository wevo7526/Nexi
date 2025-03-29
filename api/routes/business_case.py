from flask import Blueprint, request, jsonify, Response, stream_with_context
from models.business_case_agent import BusinessCaseAgent
import json

business_case_bp = Blueprint('business_case', __name__)

# Initialize the business case agent
agent = BusinessCaseAgent()

def format_sse(data):
    """Format data as SSE."""
    return f"data: {json.dumps(data)}\n\n"

@business_case_bp.route('/solve', methods=['POST'])
def solve_case():
    try:
        data = request.get_json()
        case_description = data.get('case_description')
        
        if not case_description:
            return jsonify({'error': 'No case description provided'}), 400

        def generate():
            # Initial status
            yield format_sse({
                'status': 'started',
                'message': 'Starting business case analysis...'
            })

            # Problem identification
            yield format_sse({
                'status': 'analyzing',
                'message': 'Identifying core business problem...'
            })
            problem_statement = agent.identify_problem(case_description)
            yield format_sse({
                'status': 'analyzing',
                'message': 'Problem identified',
                'data': {'problem_statement': problem_statement}
            })

            # Key factors analysis
            yield format_sse({
                'status': 'analyzing',
                'message': 'Analyzing key factors...'
            })
            key_factors = agent.analyze_key_factors(case_description)
            yield format_sse({
                'status': 'analyzing',
                'message': 'Key factors analyzed',
                'data': {'key_factors': key_factors}
            })

            # Constraints analysis
            yield format_sse({
                'status': 'analyzing',
                'message': 'Identifying constraints...'
            })
            constraints = agent.identify_constraints(case_description)
            yield format_sse({
                'status': 'analyzing',
                'message': 'Constraints identified',
                'data': {'constraints': constraints}
            })

            # Solution generation
            yield format_sse({
                'status': 'solving',
                'message': 'Generating potential solutions...'
            })
            solutions = agent.generate_solutions(case_description)
            yield format_sse({
                'status': 'solving',
                'message': 'Solutions generated',
                'data': {'solutions': solutions}
            })

            # Recommendation
            yield format_sse({
                'status': 'recommending',
                'message': 'Formulating final recommendation...'
            })
            recommendation = agent.formulate_recommendation(solutions)
            yield format_sse({
                'status': 'complete',
                'message': 'Analysis complete',
                'data': {'recommendation': recommendation}
            })

            # Final complete message
            yield format_sse({
                'status': 'done',
                'message': 'Business case analysis completed successfully'
            })

        return Response(stream_with_context(generate()), mimetype='text/event-stream')

    except Exception as e:
        print(f"Error in solve_case endpoint: {str(e)}")
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500

@business_case_bp.route('/options', methods=['OPTIONS'])
def case_options():
    response = Response()
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'POST,OPTIONS')
    return response 