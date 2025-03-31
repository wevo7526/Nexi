from flask import Blueprint, request, Response, jsonify, send_file
from supabase import create_client, Client
from datetime import datetime
from dotenv import load_dotenv
import os
from models.agent_teams import create_research_team, create_writing_team
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
import matplotlib.pyplot as plt
import seaborn as sns
import io
import json
import logging
import uuid

# Load environment variables
load_dotenv()

# Initialize Blueprint
reports_bp = Blueprint('reports', __name__)
logger = logging.getLogger(__name__)

# Get Supabase credentials
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_KEY')

# Validate Supabase credentials
if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError(
        "Missing Supabase credentials. Please ensure SUPABASE_URL and SUPABASE_SERVICE_KEY "
        "are set in your environment variables."
    )

# Initialize Supabase client
try:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
except Exception as e:
    print(f"Error initializing Supabase client: {str(e)}")
    raise

# Create reports directory if it doesn't exist
REPORTS_DIR = 'reports'
os.makedirs(REPORTS_DIR, exist_ok=True)

def format_sse(data):
    """Format data as SSE."""
    return f"data: {json.dumps(data)}\n\n"

def create_chart(data, chart_type='line', title='', xlabel='', ylabel=''):
    """Create a chart using matplotlib and return it as bytes."""
    plt.figure(figsize=(10, 6))
    
    if chart_type == 'line':
        plt.plot(data['x'], data['y'])
    elif chart_type == 'bar':
        plt.bar(data['x'], data['y'])
    elif chart_type == 'pie':
        plt.pie(data['values'], labels=data['labels'])
    
    plt.title(title)
    plt.xlabel(xlabel)
    plt.ylabel(ylabel)
    
    # Save plot to bytes
    buf = io.BytesIO()
    plt.savefig(buf, format='png', dpi=300, bbox_inches='tight')
    plt.close()
    buf.seek(0)
    return buf

def add_chart_to_doc(doc, chart_data, chart_type='line', title='', xlabel='', ylabel=''):
    """Add a chart to the document."""
    # Create chart
    chart_buf = create_chart(chart_data, chart_type, title, xlabel, ylabel)
    
    # Add chart to document
    doc.add_picture(chart_buf, width=Inches(6))
    doc.add_paragraph()  # Add spacing

def create_docx_report(report_data, report_id):
    """Create a DOCX report with formatting and charts."""
    doc = Document()
    
    # Title
    title = doc.add_heading('Research Report', 0)
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    
    # Metadata
    doc.add_paragraph(f'Generated on: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}')
    doc.add_paragraph(f'Report ID: {report_id}')
    doc.add_paragraph()
    
    # Executive Summary
    doc.add_heading('Executive Summary', 1)
    doc.add_paragraph(report_data['executive_summary'])
    doc.add_paragraph()
    
    # Research Findings
    doc.add_heading('Research Findings', 1)
    for finding in report_data['research_findings']:
        doc.add_paragraph(finding, style='List Bullet')
    doc.add_paragraph()
    
    # Analysis
    doc.add_heading('Analysis', 1)
    for section, content in report_data['analysis'].items():
        doc.add_heading(section, 2)
        doc.add_paragraph(content)
        doc.add_paragraph()
    
    # Charts and Graphs
    if 'charts' in report_data:
        doc.add_heading('Visualizations', 1)
        for chart in report_data['charts']:
            add_chart_to_doc(
                doc,
                chart['data'],
                chart['type'],
                chart['title'],
                chart['xlabel'],
                chart['ylabel']
            )
    
    # Conclusions
    doc.add_heading('Conclusions', 1)
    doc.add_paragraph(report_data['conclusions'])
    doc.add_paragraph()
    
    # Recommendations
    doc.add_heading('Recommendations', 1)
    for rec in report_data['recommendations']:
        doc.add_paragraph(rec, style='List Bullet')
    
    # Save the document
    filename = f'report_{report_id}.docx'
    filepath = os.path.join(REPORTS_DIR, filename)
    doc.save(filepath)
    return filepath

@reports_bp.route('/reports', methods=['GET'])
async def get_reports():
    """Get all reports for the current user."""
    try:
        # Get user ID from token
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({
                'error': 'Invalid authorization header',
                'success': False
            }), 401
            
        token = auth_header.split(' ')[1]
        user_id = await supabase.auth.get_user(token).data.id

        # Fetch reports from Supabase
        response = supabase.table('reports').select('*').eq('user_id', user_id).execute()
        
        if response.error:
            raise Exception(response.error.message)
            
        return jsonify({
            'success': True,
            'reports': response.data
        })
    except Exception as e:
        return jsonify({
            'error': str(e),
            'success': False
        }), 500

@reports_bp.route('/reports/<report_id>', methods=['GET'])
async def get_report(report_id):
    """Get a specific report by ID."""
    try:
        # Get user ID from token
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({
                'error': 'Invalid authorization header',
                'success': False
            }), 401
            
        token = auth_header.split(' ')[1]
        user_id = await supabase.auth.get_user(token).data.id

        # Fetch report from Supabase
        response = supabase.table('reports').select('*').eq('id', report_id).eq('user_id', user_id).single().execute()
        
        if response.error:
            raise Exception(response.error.message)
            
        return jsonify({
            'success': True,
            'report': response.data
        })
    except Exception as e:
        return jsonify({
            'error': str(e),
            'success': False
        }), 500

@reports_bp.route('/reports/<report_id>', methods=['DELETE'])
async def delete_report(report_id):
    """Delete a specific report."""
    try:
        # Get user ID from token
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({
                'error': 'Invalid authorization header',
                'success': False
            }), 401
            
        token = auth_header.split(' ')[1]
        user_id = await supabase.auth.get_user(token).data.id

        # Delete report from Supabase
        response = supabase.table('reports').delete().eq('id', report_id).eq('user_id', user_id).execute()
        
        if response.error:
            raise Exception(response.error.message)
            
        return jsonify({
            'success': True,
            'message': 'Report deleted successfully'
        })
    except Exception as e:
        return jsonify({
            'error': str(e),
            'success': False
        }), 500

@reports_bp.route('/generate', methods=['POST'])
def generate_report():
    """Handle report generation requests."""
    try:
        data = request.get_json()
        query = data.get('query')
        client_info = data.get('client_info', {})
        
        if not query:
            return jsonify({'error': 'No query provided'}), 400
        
        report_id = str(uuid.uuid4())
        
        def generate():
            # Initialize teams
            research_team = create_research_team()
            writing_team = create_writing_team()
            
            # Research phase
            yield format_sse({
                'type': 'status',
                'agent': 'researcher',
                'content': 'Starting research...'
            })
            yield format_sse({
                'type': 'progress',
                'progress': 20
            })
            
            research_results = research_team.gather_information(query)
            yield format_sse({
                'type': 'content',
                'section': 'research',
                'content': research_results
            })
            
            # Analysis phase
            yield format_sse({
                'type': 'status',
                'agent': 'analyst',
                'content': 'Analyzing gathered information...'
            })
            yield format_sse({
                'type': 'progress',
                'progress': 40
            })
            
            analysis_results = research_team.analyze_information(research_results)
            yield format_sse({
                'type': 'content',
                'section': 'analysis',
                'content': analysis_results
            })
            
            # Writing phase
            yield format_sse({
                'type': 'status',
                'agent': 'doc_writer',
                'content': 'Creating report structure...'
            })
            yield format_sse({
                'type': 'progress',
                'progress': 60
            })
            
            report_structure = writing_team.create_structure(analysis_results)
            
            yield format_sse({
                'type': 'status',
                'agent': 'section_writer',
                'content': 'Writing detailed sections...'
            })
            yield format_sse({
                'type': 'progress',
                'progress': 80
            })
            
            detailed_sections = writing_team.write_sections(report_structure, analysis_results)
            
            # Generate charts and graphs
            charts = research_team.generate_visualizations(analysis_results)
            
            # Compile final report
            report_data = {
                'executive_summary': writing_team.write_executive_summary(detailed_sections),
                'research_findings': research_results,
                'analysis': detailed_sections,
                'charts': charts,
                'conclusions': writing_team.write_conclusions(detailed_sections),
                'recommendations': writing_team.write_recommendations(detailed_sections)
            }
            
            # Create DOCX document
            filepath = create_docx_report(report_data, report_id)
            
            yield format_sse({
                'type': 'report',
                'reportId': report_id,
                'content': 'Report generated successfully'
            })
            yield format_sse({
                'type': 'progress',
                'progress': 100
            })
        
        return Response(generate(), mimetype='text/event-stream')
    
    except Exception as e:
        logger.error(f"Error in generate_report: {str(e)}")
        return jsonify({'error': str(e)}), 500

@reports_bp.route('/<report_id>/download', methods=['GET'])
def download_report(report_id):
    """Handle report download requests."""
    try:
        filepath = os.path.join(REPORTS_DIR, f'report_{report_id}.docx')
        if not os.path.exists(filepath):
            return jsonify({'error': 'Report not found'}), 404
        
        return send_file(
            filepath,
            as_attachment=True,
            download_name=f'research_report_{report_id}.docx'
        )
    
    except Exception as e:
        logger.error(f"Error in download_report: {str(e)}")
        return jsonify({'error': str(e)}), 500

@reports_bp.route('/generate', methods=['OPTIONS'])
def generate_report_options():
    """Handle CORS preflight requests."""
    response = Response()
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'POST,OPTIONS')
    return response 