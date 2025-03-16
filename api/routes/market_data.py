from flask import Blueprint, request, jsonify, current_app
from ..services.alpha_vantage_service import AlphaVantageService
from functools import wraps
from ..utils import run_async
import traceback
import logging
import os

market_data_bp = Blueprint('market_data', __name__)
alpha_vantage_service = AlphaVantageService()

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

@market_data_bp.route('/stock/<symbol>', methods=['GET'])
@handle_api_error
def get_stock_data(symbol):
    """Get stock data for a given symbol."""
    try:
        logger.info(f"Fetching stock data for symbol: {symbol}")
        data = run_async(alpha_vantage_service.get_stock_data(symbol.upper()))
        response = {
            'error': False,
            'data': data
        }
        logger.info(f"Successfully fetched stock data for {symbol}")
        return jsonify(response)
    except Exception as e:
        logger.error(f"Error fetching stock data for {symbol}: {str(e)}")
        return jsonify({
            'error': True,
            'message': f"Error fetching stock data for {symbol}: {str(e)}"
        }), 500

@market_data_bp.route('/company/<symbol>', methods=['GET'])
@handle_api_error
def get_company_overview(symbol):
    """Get company overview for a given symbol."""
    try:
        logger.info(f"Fetching company overview for symbol: {symbol}")
        data = run_async(alpha_vantage_service.get_company_overview(symbol.upper()))
        response = {
            'error': False,
            'data': data
        }
        logger.info(f"Successfully fetched company overview for {symbol}")
        return jsonify(response)
    except Exception as e:
        logger.error(f"Error fetching company overview for {symbol}: {str(e)}")
        return jsonify({
            'error': True,
            'message': f"Error fetching company overview for {symbol}: {str(e)}"
        }), 500

@market_data_bp.route('/news', methods=['GET'])
@handle_api_error
def get_news():
    """Get news and sentiment analysis."""
    try:
        symbol = request.args.get('symbol')
        topics = request.args.get('topics')
        
        logger.info(f"Fetching news with symbol: {symbol}, topics: {topics}")
        
        if not symbol and not topics:
            return jsonify({
                'error': True,
                'message': 'Either symbol or topics parameter is required'
            }), 400
            
        data = run_async(alpha_vantage_service.get_news_sentiment(symbol, topics))
        response = {
            'error': False,
            'data': data
        }
        logger.info("Successfully fetched news data")
        return jsonify(response)
    except Exception as e:
        logger.error(f"Error fetching news: {str(e)}")
        return jsonify({
            'error': True,
            'message': f"Error fetching news: {str(e)}"
        }), 500

@market_data_bp.route('/search', methods=['GET'])
@handle_api_error
def search_symbols():
    """Search for symbols using keywords."""
    try:
        keywords = request.args.get('keywords')
        logger.info(f"Searching symbols with keywords: {keywords}")
        
        if not keywords:
            return jsonify({
                'error': True,
                'message': 'Keywords parameter is required'
            }), 400
            
        data = run_async(alpha_vantage_service.search_symbols(keywords))
        response = {
            'error': False,
            'data': data
        }
        logger.info("Successfully completed symbol search")
        return jsonify(response)
    except Exception as e:
        logger.error(f"Error searching symbols: {str(e)}")
        return jsonify({
            'error': True,
            'message': f"Error searching symbols: {str(e)}"
        }), 500

@market_data_bp.route('/technical/<symbol>', methods=['GET'])
@handle_api_error
def get_technical_indicators(symbol):
    """Get technical indicators for a given symbol."""
    try:
        logger.info(f"Fetching technical indicators for symbol: {symbol}")
        data = run_async(alpha_vantage_service.get_technical_indicators(symbol.upper()))
        response = {
            'error': False,
            'data': data
        }
        logger.info(f"Successfully fetched technical indicators for {symbol}")
        return jsonify(response)
    except Exception as e:
        logger.error(f"Error fetching technical indicators for {symbol}: {str(e)}")
        return jsonify({
            'error': True,
            'message': f"Error fetching technical indicators for {symbol}: {str(e)}"
        }), 500

@market_data_bp.route('/earnings/<symbol>', methods=['GET'])
@handle_api_error
def get_earnings(symbol):
    """Get earnings data for a given symbol."""
    try:
        logger.info(f"Fetching earnings data for symbol: {symbol}")
        data = run_async(alpha_vantage_service.get_earnings(symbol.upper()))
        response = {
            'error': False,
            'data': data
        }
        logger.info(f"Successfully fetched earnings data for {symbol}")
        return jsonify(response)
    except Exception as e:
        logger.error(f"Error fetching earnings data for {symbol}: {str(e)}")
        return jsonify({
            'error': True,
            'message': f"Error fetching earnings data for {symbol}: {str(e)}"
        }), 500

@market_data_bp.route('/test-env', methods=['GET'])
@handle_api_error
def test_env():
    """Test if environment variables are loaded correctly."""
    api_key = os.getenv('ALPHAVANTAGE_API_KEY')
    return jsonify({
        'api_key_exists': bool(api_key),
        'api_key_length': len(api_key) if api_key else 0
    }) 