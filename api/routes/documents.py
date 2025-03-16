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
                'error': 'Invalid authorization header',
                'success': False
            }), 401
            
        token = auth_header.split(' ')[1]
        user_id = await document_service.get_user_id_from_token(token)

        # Check if file was uploaded
        if 'file' not in request.files:
            return jsonify({
                'error': 'No file provided',
                'success': False
            }), 400

        file = request.files['file']
        if not file.filename:
            return jsonify({
                'error': 'No file selected',
                'success': False
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

            return jsonify({
                'success': True,
                'message': 'Document uploaded successfully',
                'id': result['id']
            })

        finally:
            # Clean up the temporary file if it still exists
            try:
                if os.path.exists(tmp_path):
                    os.unlink(tmp_path)
            except Exception as cleanup_error:
                print(f"Error cleaning up temporary file: {str(cleanup_error)}")

    except ValueError as ve:
        return jsonify({
            'error': str(ve),
            'success': False
        }), 400
    except Exception as e:
        return jsonify({
            'error': str(e),
            'success': False
        }), 500

@documents_bp.route('/api/get_documents', methods=['GET'])
async def get_documents():
    """Get all documents for the current user."""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({
                'error': 'Invalid authorization header',
                'success': False
            }), 401
            
        token = auth_header.split(' ')[1]
        user_id = await document_service.get_user_id_from_token(token)

        documents = await document_service.get_user_documents(user_id)
        return jsonify({
            'success': True,
            'documents': documents
        })
    except Exception as e:
        return jsonify({
            'error': str(e),
            'success': False
        }), 500

@documents_bp.route('/api/delete_document/<document_id>', methods=['DELETE'])
async def delete_document(document_id):
    """Delete a document."""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({
                'error': 'Invalid authorization header',
                'success': False
            }), 401
            
        token = auth_header.split(' ')[1]
        user_id = await document_service.get_user_id_from_token(token)

        success = await document_service.delete_document(document_id, user_id)
        if success:
            return jsonify({
                'success': True,
                'message': 'Document deleted successfully'
            })
        return jsonify({
            'error': 'Document not found',
            'success': False
        }), 404
    except Exception as e:
        return jsonify({
            'error': str(e),
            'success': False
        }), 500

@documents_bp.route('/api/search_documents', methods=['POST'])
async def search_documents():
    """Search through documents using similarity search."""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({
                'error': 'Invalid authorization header',
                'success': False
            }), 401
            
        token = auth_header.split(' ')[1]
        user_id = await document_service.get_user_id_from_token(token)

        data = request.get_json()
        if not data or 'query' not in data:
            return jsonify({
                'error': 'No query provided',
                'success': False
            }), 400

        results = await document_service.search_documents(data['query'], user_id)
        return jsonify({
            'success': True,
            'results': results
        })
    except Exception as e:
        return jsonify({
            'error': str(e),
            'success': False
        }), 500

@documents_bp.route('/api/document_status/<document_id>', methods=['GET'])
async def get_document_status(document_id):
    """Get the processing status of a document."""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({
                'error': 'Invalid authorization header',
                'success': False
            }), 401
            
        token = auth_header.split(' ')[1]
        user_id = await document_service.get_user_id_from_token(token)

        # Get document metadata
        response = await document_service.supabase.table("document_metadata").select("*").eq("id", document_id).eq("user_id", user_id).execute()
        
        if not response.data:
            return jsonify({
                'error': 'Document not found',
                'success': False
            }), 404

        document = response.data[0]
        return jsonify({
            'success': True,
            'status': document['status'],
            'processing_progress': document.get('processing_progress', 0),
            'processing_error': document.get('processing_error')
        })
    except Exception as e:
        return jsonify({
            'error': str(e),
            'success': False
        }), 500 