from flask import Blueprint, request, jsonify
from supabase import create_client, Client
from datetime import datetime
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Initialize Blueprint
reports_bp = Blueprint('reports', __name__)

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