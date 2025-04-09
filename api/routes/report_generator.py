from flask import Blueprint, request, jsonify, Response, stream_with_context
from models.agent_teams import create_report_generator
from langchain_anthropic import ChatAnthropic
import json
import traceback
from supabase import create_client
import os
from datetime import datetime

report_generator_bp = Blueprint('report_generator', __name__)

# Initialize the LLM and report generator
llm = ChatAnthropic(
    model="claude-3-sonnet-20240229",
    anthropic_api_key=os.getenv("ANTHROPIC_API_KEY"),
    temperature=0.7,
    max_tokens=4000
)
report_generator = create_report_generator(llm)

# Initialize Supabase client
supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_KEY')
)

@report_generator_bp.route('/generate', methods=['POST'])
def generate_report():
    try:
        data = request.get_json()
        query = data.get('query')
        
        if not query:
            return jsonify({'error': 'No query provided'}), 400

        # Create report record in Supabase with structured format
        report_data = {
            'title': query,
            'description': f'Consulting report for: {query}',
            'report_type': 'consulting',
            'status': 'in_progress',
            'sections': {
                'executive_summary': '',
                'introduction': '',
                'analysis': '',
                'findings': '',
                'recommendations': '',
                'conclusion': ''
            },
            'created_at': datetime.utcnow().isoformat()
        }
        
        result = supabase.table('reports').insert(report_data).execute()
        if not result.data:
            raise ValueError("Failed to create report record")
        report_id = result.data[0]['id']

        def generate():
            try:
                # Stream the report generation process with better recursion handling
                for state in report_generator.stream(
                    {"messages": [("user", query)]},
                    {
                        "recursion_limit": 100,
                        "max_iterations": 10,
                        "timeout": 300,
                        "stop_conditions": [
                            lambda x: "completed" in x.get("messages", [{}])[-1].get("content", "").lower(),
                            lambda x: "final answer" in x.get("messages", [{}])[-1].get("content", "").lower(),
                            lambda x: len(x.get("messages", [])) > 20
                        ]
                    }
                ):
                    if "messages" in state and state["messages"]:
                        last_message = state["messages"][-1].content
                        status = state.get("status", "in_progress")
                        
                        # Create a status message based on the current state
                        status_message = {
                            "type": "status",
                            "content": f"Current status: {status.replace('_', ' ').title()}",
                            "timestamp": datetime.utcnow().isoformat()
                        }
                        
                        # Send both the content and status message
                        yield f"data: {json.dumps({'content': last_message, 'status': status_message, 'report_id': report_id})}\n\n"
                        
                        # Update report status in Supabase
                        try:
                            # Check for completion indicators
                            is_completed = any([
                                "completed" in last_message.lower(),
                                "final answer" in last_message.lower(),
                                "report is ready" in last_message.lower()
                            ])
                            
                            # Update the appropriate section based on the current status
                            section_updates = {}
                            if "executive_summary_completed" in status:
                                section_updates['sections.executive_summary'] = last_message
                            elif "section_completed" in status:
                                # Determine which section to update based on content
                                if "introduction" in last_message.lower():
                                    section_updates['sections.introduction'] = last_message
                                elif "analysis" in last_message.lower():
                                    section_updates['sections.analysis'] = last_message
                                elif "findings" in last_message.lower():
                                    section_updates['sections.findings'] = last_message
                                elif "recommendations" in last_message.lower():
                                    section_updates['sections.recommendations'] = last_message
                                elif "conclusion" in last_message.lower():
                                    section_updates['sections.conclusion'] = last_message
                            
                            update_data = {
                                'status': 'completed' if is_completed else 'in_progress',
                                'current_status': status,
                                **section_updates
                            }
                            
                            supabase.table('reports').update(update_data).eq('id', report_id).execute()
                        except Exception as e:
                            print(f"Error updating report status: {str(e)}")
                        
            except Exception as e:
                error_message = f"Error during report generation: {str(e)}"
                print(error_message)
                print(traceback.format_exc())
                yield f"data: {json.dumps({'error': error_message, 'report_id': report_id})}\n\n"
                
                # Update report status to error
                try:
                    supabase.table('reports').update({
                        'status': 'error',
                        'error_message': error_message
                    }).eq('id', report_id).execute()
                except Exception as update_error:
                    print(f"Error updating report error status: {str(update_error)}")

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
        error_message = f"Error initiating report generation: {str(e)}"
        print(error_message)
        print(traceback.format_exc())
        return jsonify({'error': error_message}), 500

@report_generator_bp.route('/generate/options', methods=['OPTIONS'])
def report_generator_options():
    response = Response()
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'POST,OPTIONS')
    return response 