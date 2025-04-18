from flask import Blueprint, request, jsonify, Response, stream_with_context
from models.business_case_agent import BusinessCaseAgent
import json
import traceback
import time

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

@business_case_bp.route('/api/get_case_results', methods=['GET'])
def get_case_results():
    """Get all case results for the current user."""
    try:
        # Get user_id from auth token
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({
                'error': 'Invalid authorization header',
                'success': False
            }), 401
            
        token = auth_header.split(' ')[1]
        # TODO: Get user_id from token
        
        # For now, return empty results
        return jsonify({
            'success': True,
            'results': []
        })
    except Exception as e:
        print(f"Error in get_case_results: {str(e)}")
        return jsonify({
            'error': str(e),
            'success': False
        }), 500

@business_case_bp.route('/stream_case_solution', methods=['POST'])
def stream_case_solution():
    """Stream the solution for a business case."""
    try:
        # Validate request data
        data = request.get_json()
        if not data or 'case_text' not in data:
            return jsonify({
                'error': 'Case text is required',
                'success': False
            }), 400
            
        case_text = data['case_text']

        def generate():
            try:
                # Initial status
                yield format_sse({
                    'type': 'stream',
                    'content': 'Starting business case analysis...'
                })

                # Problem identification
                yield format_sse({
                    'type': 'stream',
                    'content': 'Identifying core business problem...'
                })
                problem_statement = agent.identify_problem(case_text)
                yield format_sse({
                    'type': 'stream',
                    'content': f'Problem identified: {problem_statement}'
                })

                # Key factors analysis
                yield format_sse({
                    'type': 'stream',
                    'content': 'Analyzing key factors...'
                })
                key_factors = agent.analyze_key_factors(case_text)
                yield format_sse({
                    'type': 'stream',
                    'content': f'Key factors analyzed: {", ".join(key_factors)}'
                })

                # Constraints analysis
                yield format_sse({
                    'type': 'stream',
                    'content': 'Identifying constraints...'
                })
                constraints = agent.identify_constraints(case_text)
                yield format_sse({
                    'type': 'stream',
                    'content': f'Constraints identified: {", ".join(constraints)}'
                })

                # Solution generation
                yield format_sse({
                    'type': 'stream',
                    'content': 'Generating potential solutions...'
                })
                solutions = agent.generate_solutions(case_text)
                yield format_sse({
                    'type': 'stream',
                    'content': f'Generated {len(solutions)} potential solutions'
                })

                # Recommendation
                yield format_sse({
                    'type': 'stream',
                    'content': 'Formulating final recommendation...'
                })
                recommendation = agent.formulate_recommendation(solutions)

                # Final structured response
                structured_response = {
                    'type': 'analysis',
                    'analysis': {
                        'problemStatement': problem_statement,
                        'keyFactors': key_factors,
                        'constraints': constraints,
                        'solutions': [
                            {
                                'description': solution.get('description', ''),
                                'pros': solution.get('pros', []),
                                'cons': solution.get('cons', []),
                                'implementation': solution.get('implementation', ''),
                                'timeline': solution.get('timeline', '')
                            }
                            for solution in solutions
                        ],
                        'recommendation': {
                            'solution': recommendation.get('solution', ''),
                            'rationale': recommendation.get('rationale', ''),
                            'implementation': recommendation.get('implementation', ''),
                            'timeline': recommendation.get('implementation_timeline', ''),
                            'successMetrics': recommendation.get('success_metrics', [])
                        }
                    }
                }

                yield format_sse({
                    'type': 'complete',
                    'content': structured_response
                })

            except Exception as e:
                print(f"Error in generate: {str(e)}")
                print(traceback.format_exc())
                yield format_sse({
                    'type': 'error',
                    'content': str(e)
                })

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
        print(f"Error in stream_case_solution endpoint: {str(e)}")
        return jsonify({
            'error': str(e),
            'success': False
        }), 500

@business_case_bp.route('/chat', methods=['POST'])
def chat():
    """Handle chat-like interactions for business case analysis."""
    try:
        data = request.get_json()
        query = data.get('query')
        
        if not query:
            return jsonify({'error': 'No query provided'}), 400

        def generate():
            try:
                # Initial status
                yield format_sse({
                    'type': 'status',
                    'content': 'Starting business case analysis...'
                })

                # Problem identification
                yield format_sse({
                    'type': 'status',
                    'content': 'Identifying core business problem...'
                })
                problem_statement = agent.identify_problem(query)
                yield format_sse({
                    'type': 'content',
                    'section': 'problem_statement',
                    'content': json.dumps(problem_statement)
                })

                # Key factors analysis
                yield format_sse({
                    'type': 'status',
                    'content': 'Analyzing key factors...'
                })
                key_factors = agent.analyze_key_factors(query)
                yield format_sse({
                    'type': 'content',
                    'section': 'key_factors',
                    'content': json.dumps(key_factors)
                })

                # Constraints analysis
                yield format_sse({
                    'type': 'status',
                    'content': 'Identifying constraints...'
                })
                constraints = agent.identify_constraints(query)
                yield format_sse({
                    'type': 'content',
                    'section': 'constraints',
                    'content': json.dumps(constraints)
                })

                # Solution generation
                yield format_sse({
                    'type': 'status',
                    'content': 'Generating potential solutions...'
                })
                solutions = agent.generate_solutions(query)
                yield format_sse({
                    'type': 'content',
                    'section': 'solutions',
                    'content': json.dumps(solutions)
                })

                # Recommendation
                yield format_sse({
                    'type': 'status',
                    'content': 'Formulating final recommendation...'
                })
                recommendation = agent.formulate_recommendation(solutions)
                yield format_sse({
                    'type': 'content',
                    'section': 'recommendation',
                    'content': json.dumps(recommendation)
                })

                # Final complete message
                yield format_sse({
                    'type': 'final',
                    'content': {
                        'content': {
                            'sections': [
                                {'title': 'Problem Statement', 'content': problem_statement},
                                {'title': 'Key Factors', 'content': key_factors},
                                {'title': 'Constraints', 'content': constraints},
                                {'title': 'Solutions', 'content': solutions},
                                {'title': 'Recommendation', 'content': recommendation}
                            ]
                        },
                        'outputs': [
                            {
                                'type': 'summary',
                                'title': 'Executive Summary',
                                'content': {
                                    'problem': problem_statement,
                                    'key_factors': key_factors,
                                    'recommendation': recommendation
                                }
                            }
                        ]
                    }
                })

            except Exception as e:
                print(f"Error in chat stream: {str(e)}")
                yield format_sse({
                    'type': 'error',
                    'content': str(e)
                })

        return Response(stream_with_context(generate()), mimetype='text/event-stream')

    except Exception as e:
        print(f"Error in chat endpoint: {str(e)}")
        return jsonify({
            'error': str(e)
        }), 500 