import sys
import os
from flask import Blueprint, request, jsonify
from supabase import create_client, Client
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add the project directory to the Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from models.multi_agent_model import MultiAgentConsultant

# Initialize Blueprint
reports_bp = Blueprint('reports', __name__)

# Get Supabase credentials
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')  # This should match your existing env variable name

# Validate Supabase credentials
if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError(
        "Missing Supabase credentials. Please ensure SUPABASE_URL and SUPABASE_KEY "
        "are set in your environment variables."
    )

# Initialize Supabase client
try:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
except Exception as e:
    print(f"Error initializing Supabase client: {str(e)}")
    raise

# Initialize MultiAgentConsultant
multi_agent = MultiAgentConsultant()

# Define report sections based on type
REPORT_SECTIONS = {
    "quick": ["Executive Summary", "Key Findings", "Recommendations"],
    "focused": ["Executive Summary", "Detailed Analysis", "Key Findings", "Recommendations", "Implementation Plan"],
    "comprehensive": [
        "Executive Summary",
        "Background",
        "Methodology",
        "Market Analysis",
        "Competitive Analysis",
        "Financial Analysis",
        "Risk Assessment",
        "Detailed Findings",
        "Strategic Recommendations",
        "Implementation Roadmap",
        "Appendices"
    ]
}

@reports_bp.route("/generate-report", methods=["POST"])
def generate_report():
    try:
        data = request.json
        report_id = data.get("reportId")
        title = data.get("title")
        description = data.get("description")
        client_id = data.get("client_id")
        report_type = data.get("report_type")
        focus_areas = data.get("focus_areas", [])
        additional_instructions = data.get("additional_instructions")

        # Fetch client data
        client_response = supabase.table("clients").select("*").eq("id", client_id).execute()
        if not client_response.data:
            raise ValueError("Client not found")
        client_data = client_response.data[0]

        # Fetch attachments
        files_response = supabase.storage.from_("reports").list(str(report_id))
        files = files_response if files_response else []

        # Prepare the context for the multi-agent system
        report_context = {
            "report_type": report_type,
            "focus_areas": focus_areas,
            "client_data": client_data,
            "additional_instructions": additional_instructions,
            "attachments": [f.get('name', '') for f in files],
            "sections": REPORT_SECTIONS[report_type]
        }

        # Generate report content using multi-agent system
        report_content = {}
        for section in REPORT_SECTIONS[report_type]:
            # Create a specific query for each section
            query = f"""Generate the {section} section for a {report_type} business report.
Focus areas: {', '.join(focus_areas)}
Client: {client_data.get('name')}
Industry: {client_data.get('industry')}
Additional context: {additional_instructions}

Requirements:
1. Provide detailed, actionable insights
2. Use data-driven analysis
3. Include specific recommendations
4. Consider industry best practices
5. Address potential risks and mitigation strategies"""

            # Get response from multi-agent system
            response = multi_agent.get_advice(query, thread_id=f"report_{report_id}_{section}")
            
            # Extract the relevant content from the multi-agent response
            if isinstance(response, dict):
                # Assuming the multi-agent returns a structured response
                section_content = response.get('analysis', '') + '\n\n' + response.get('recommendations', '')
            else:
                section_content = response

            report_content[section] = section_content

        # Update report in database
        update_response = supabase.table("reports").update({
            "content": report_content,
            "status": "completed",
            "completed_at": datetime.utcnow().isoformat()
        }).eq("id", report_id).execute()

        if not update_response.data:
            raise ValueError("Failed to update report")

        return jsonify({"success": True, "reportId": report_id})

    except Exception as e:
        print(f"Error generating report: {str(e)}")
        
        # Update report status to failed
        try:
            supabase.table("reports").update({
                "status": "failed",
                "error_message": str(e)
            }).eq("id", report_id).execute()
        except:
            pass

        return jsonify({"error": "Failed to generate report"}), 500

# Register the blueprint in your main app
def init_app(app):
    app.register_blueprint(reports_bp, url_prefix='/api/reports') 