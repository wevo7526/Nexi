import os
import tempfile
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
from ..services.document_service import DocumentService

documents_bp = Blueprint('documents', __name__)
document_service = DocumentService()

@documents_bp.route('/api/upload_document', methods=['POST'])
async def upload_document():
    """Upload and process a document."""
    try:
        # Get user ID from token
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({
                'success': False,
                'error': 'Invalid authorization header'
            }), 401
            
        token = auth_header.split(' ')[1]
        user_id = await document_service.get_user_id_from_token(token)

        # Check if file was uploaded
        if 'file' not in request.files:
            return jsonify({
                'success': False,
                'error': 'No file provided'
            }), 400

        file = request.files['file']
        if not file.filename:
            return jsonify({
                'success': False,
                'error': 'No file selected'
            }), 400

        filename = secure_filename(file.filename)
        
        # Create a temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(filename)[1]) as tmp:
            file.save(tmp.name)
            tmp_path = tmp.name

        try:
            # Process the document
            result = await document_service.process_document(
                tmp_path,
                user_id,
                original_name=filename
            )

            # Convert any non-serializable objects to strings
            serializable_result = {
                'success': True,
                'document_id': str(result.get('id')),
                'status': str(result.get('status')),
                'total_chunks': int(result.get('total_chunks', 0))
            }

            return jsonify(serializable_result)

        finally:
            # Clean up the temporary file if it still exists
            try:
                if os.path.exists(tmp_path):
                    os.unlink(tmp_path)
            except Exception as cleanup_error:
                print(f"Error cleaning up temporary file: {str(cleanup_error)}")

    except ValueError as ve:
        return jsonify({
            'success': False,
            'error': str(ve)
        }), 400
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@documents_bp.route('/api/get_documents', methods=['GET'])
async def get_documents():
    """Get all documents for the current user."""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({
                'success': False,
                'error': 'Invalid authorization header'
            }), 401
            
        token = auth_header.split(' ')[1]
        user_id = await document_service.get_user_id_from_token(token)

        result = await document_service.get_user_documents(user_id)
        
        # Ensure all document data is serializable
        documents = []
        for doc in result.get('documents', []):
            documents.append({
                'id': str(doc.get('id')),
                'name': str(doc.get('name')),
                'status': str(doc.get('status')),
                'created_at': str(doc.get('created_at')),
                'updated_at': str(doc.get('updated_at')) if doc.get('updated_at') else None,
                'processing_error': str(doc.get('processing_error')) if doc.get('processing_error') else None
            })

        return jsonify({
            'success': True,
            'documents': documents
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@documents_bp.route('/api/delete_document/<document_id>', methods=['DELETE'])
async def delete_document(document_id):
    """Delete a document."""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({
                'success': False,
                'error': 'Invalid authorization header'
            }), 401
            
        token = auth_header.split(' ')[1]
        user_id = await document_service.get_user_id_from_token(token)

        result = await document_service.delete_document(document_id, user_id)
        return jsonify({
            'success': True,
            'message': 'Document deleted successfully'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@documents_bp.route('/api/document_status/<document_id>', methods=['GET'])
async def get_document_status(document_id):
    """Get the processing status of a document."""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({
                'success': False,
                'error': 'Invalid authorization header'
            }), 401
            
        token = auth_header.split(' ')[1]
        user_id = await document_service.get_user_id_from_token(token)

        result = await document_service.get_document_status(document_id, user_id)
        
        # Ensure the response is serializable
        return jsonify({
            'success': True,
            'status': str(result.get('status')),
            'processing_error': str(result.get('processing_error')) if result.get('processing_error') else None
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@documents_bp.route('/api/search_documents', methods=['POST'])
async def search_documents():
    """Search through documents using similarity search."""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({
                'success': False,
                'error': 'Invalid authorization header'
            }), 401
            
        token = auth_header.split(' ')[1]
        user_id = await document_service.get_user_id_from_token(token)

        data = request.get_json()
        if not data or 'query' not in data:
            return jsonify({
                'success': False,
                'error': 'No query provided'
            }), 400

        results = await document_service.search_documents(data['query'], user_id)
        
        # Ensure results are serializable
        serializable_results = []
        for result in results:
            serializable_results.append({
                'content': str(result.get('content')),
                'metadata': {
                    'source': str(result.get('metadata', {}).get('source')),
                    'chunk_index': int(result.get('metadata', {}).get('chunk_index', 0)),
                    'score': float(result.get('metadata', {}).get('score', 0.0))
                }
            })

        return jsonify({
            'success': True,
            'results': serializable_results
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500 