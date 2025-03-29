from flask import Blueprint, request, jsonify, Response, stream_with_context
from models.multi_agent_model import MultiAgentConsultant
import json
import time
import traceback

multi_agent_bp = Blueprint('multi_agent', __name__)

# Initialize the multi-agent consultant
consultant = MultiAgentConsultant()

def format_sse(data):
    """Format data as SSE."""
    return f"data: {json.dumps(data)}\n\n"

@multi_agent_bp.route('/api/multi-agent/chat', methods=['POST'])
def chat():
    try:
        data = request.get_json()
        message = data.get('message')
        client_info = data.get('client_info')
        
        if not message:
            return jsonify({'error': 'No message provided'}), 400

        def generate():
            try:
                # Send initial status
                yield format_sse({
                    'type': 'status',
                    'content': 'Starting analysis...',
                    'agent': 'system'
                })
                time.sleep(0.5)

                # Strategy Analysis
                yield format_sse({
                    'type': 'status',
                    'content': 'Conducting strategic analysis...',
                    'agent': 'strategy'
                })
                strategy_insights = consultant._get_strategy_insights(message)
                yield format_sse({
                    'type': 'content',
                    'section': 'strategy',
                    'content': strategy_insights
                })
                time.sleep(0.5)

                # Market Research
                yield format_sse({
                    'type': 'status',
                    'content': 'Gathering market research...',
                    'agent': 'research'
                })
                market_research = consultant._get_market_research(message)
                yield format_sse({
                    'type': 'content',
                    'section': 'market',
                    'content': market_research
                })
                time.sleep(0.5)

                # Financial Analysis
                yield format_sse({
                    'type': 'status',
                    'content': 'Performing financial analysis...',
                    'agent': 'financial'
                })
                financial_analysis = consultant._get_financial_analysis(message)
                yield format_sse({
                    'type': 'content',
                    'section': 'financial',
                    'content': financial_analysis
                })
                time.sleep(0.5)

                # Implementation Plan
                yield format_sse({
                    'type': 'status',
                    'content': 'Creating implementation plan...',
                    'agent': 'implementation'
                })
                implementation_plan = consultant._get_implementation_plan(message)
                yield format_sse({
                    'type': 'content',
                    'section': 'implementation',
                    'content': implementation_plan
                })
                time.sleep(0.5)

                # Compile final report
                yield format_sse({
                    'type': 'status',
                    'content': 'Compiling final report...',
                    'agent': 'system'
                })
                report = consultant._compile_detailed_report(
                    strategy_insights,
                    market_research,
                    financial_analysis,
                    implementation_plan,
                    client_info
                )

                # Ensure the report has all required sections
                if not isinstance(report, dict):
                    report = {
                        'executive_summary': {
                            'overview': [],
                            'key_findings': [],
                            'market_highlights': [],
                            'financial_highlights': []
                        },
                        'strategic_analysis': {
                            'strategic_recommendations': []
                        },
                        'market_analysis': {
                            'market_opportunities': []
                        },
                        'implementation_roadmap': {
                            'phases': []
                        }
                    }

                # Send the complete report
                yield format_sse({
                    'type': 'report',
                    'content': report
                })

                # Send completion status
                yield format_sse({
                    'type': 'status',
                    'content': 'Analysis complete!',
                    'agent': 'system'
                })

                # Send done signal
                yield "data: [DONE]\n\n"

            except Exception as e:
                print(f"Error in generate: {str(e)}")
                print(traceback.format_exc())
                yield format_sse({
                    'type': 'error',
                    'content': str(e)
                })
                yield "data: [DONE]\n\n"

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
        print(f"Error in chat endpoint: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500

@multi_agent_bp.route('/api/multi-agent/chat/options', methods=['OPTIONS'])
def chat_options():
    response = Response()
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'POST,OPTIONS')
    return response 