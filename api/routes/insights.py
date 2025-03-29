from flask import Blueprint, request, jsonify, current_app
from ..services.insights_service import InsightsService
from ..utils import run_async
import traceback
import logging
from functools import wraps

insights_bp = Blueprint('insights', __name__)
insights_service = InsightsService()

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

def handle_api_error(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        try:
            logger.info(f"Starting request to {func.__name__}")
            response = func(*args, **kwargs)
            logger.info(f"Completed request to {func.__name__}")
            return response
        except Exception as e:
            logger.error(f"Error in {func.__name__}: {str(e)}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            error_response = {
                'error': True,
                'message': str(e),
                'traceback': traceback.format_exc()
            }
            return jsonify(error_response), 500
    return wrapper

@insights_bp.route('/unified', methods=['GET'])
@handle_api_error
def get_unified_insights():
    """Get unified insights combining market data, documents, and AI analysis"""
    try:
        # Get user_id from session or request
        user_id = request.args.get('user_id')
        if not user_id:
            return jsonify({
                'error': True,
                'message': 'User ID is required'
            }), 400

        # Get unified insights
        insights = run_async(insights_service.get_unified_insights(user_id))
        
        return jsonify({
            'error': False,
            'data': insights
        })
    except Exception as e:
        logger.error(f"Error getting unified insights: {str(e)}")
        return jsonify({
            'error': True,
            'message': str(e)
        }), 500

@insights_bp.route('/market-overview', methods=['GET'])
@handle_api_error
def get_market_overview():
    """Get market overview data"""
    try:
        market_data = run_async(insights_service._get_market_overview())
        return jsonify({
            'error': False,
            'data': market_data
        })
    except Exception as e:
        logger.error(f"Error getting market overview: {str(e)}")
        return jsonify({
            'error': True,
            'message': str(e)
        }), 500

@insights_bp.route('/document-insights', methods=['GET'])
@handle_api_error
def get_document_insights():
    """Get insights from user's documents"""
    try:
        user_id = request.args.get('user_id')
        if not user_id:
            return jsonify({
                'error': True,
                'message': 'User ID is required'
            }), 400

        doc_insights = run_async(insights_service._get_document_insights(user_id))
        return jsonify({
            'error': False,
            'data': doc_insights
        })
    except Exception as e:
        logger.error(f"Error getting document insights: {str(e)}")
        return jsonify({
            'error': True,
            'message': str(e)
        }), 500

@insights_bp.route('/ai-insights', methods=['GET'])
@handle_api_error
def get_ai_insights():
    """Get AI-generated insights"""
    try:
        user_id = request.args.get('user_id')
        if not user_id:
            return jsonify({
                'error': True,
                'message': 'User ID is required'
            }), 400

        ai_insights = run_async(insights_service._get_ai_insights(user_id))
        return jsonify({
            'error': False,
            'data': ai_insights
        })
    except Exception as e:
        logger.error(f"Error getting AI insights: {str(e)}")
        return jsonify({
            'error': True,
            'message': str(e)
        }), 500 