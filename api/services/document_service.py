import os
import logging
from typing import List, Dict, Any
import uuid
from datetime import datetime
from langchain_community.document_loaders import UnstructuredFileLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_cohere import CohereEmbeddings
from langchain_anthropic import ChatAnthropic
from langchain.prompts import ChatPromptTemplate
from supabase import create_client, Client

# Custom exceptions
class InitializationError(Exception):
    """Raised when service initialization fails"""
    pass

class DatabaseError(Exception):
    """Raised when database operations fail"""
    pass

class DocumentProcessingError(Exception):
    """Raised when document processing fails"""
    pass

class AuthenticationError(Exception):
    """Raised when authentication or authorization fails"""
    pass

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DocumentService:
    def __init__(self):
        # Initialize environment variables
        self.supabase_url = os.getenv("SUPABASE_URL")
        self.supabase_service_key = os.getenv("SUPABASE_SERVICE_KEY")
        self.cohere_api_key = os.getenv("COHERE_API_KEY")
        self.anthropic_api_key = os.getenv("ANTHROPIC_API_KEY")
        
        # Validate environment variables
        if not all([self.supabase_url, self.supabase_service_key, self.cohere_api_key, self.anthropic_api_key]):
            raise ValueError("Missing required environment variables")
        
        # Initialize Supabase client with service role
        self.supabase = create_client(
            self.supabase_url,
            self.supabase_service_key
        )
        
        # Set auth header explicitly for all requests
        self.supabase.postgrest.auth(self.supabase_service_key)
        
        self.embeddings = CohereEmbeddings(
            cohere_api_key=self.cohere_api_key,
            model="embed-multilingual-v3.0"
        )
        
        # Initialize text splitter
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len
        )
        
        # Constants
        self.SUPPORTED_EXTENSIONS = {'.txt', '.pdf', '.doc', '.docx'}

    async def get_user_id_from_token(self, token: str) -> str:
        """Get user ID from Supabase token."""
        if not token:
            raise ValueError("No token provided")

        try:
            # Get user data from token using the auth.get_user method
            response = self.supabase.auth.get_user(token)
            
            if not response or not response.user or not response.user.id:
                raise ValueError("Invalid token: User not found")
                
            return response.user.id
            
        except Exception as e:
            logger.error(f"Token verification error: {str(e)}")
            raise ValueError(f"Authentication failed: {str(e)}")

    async def process_document(self, file_path: str, user_id: str, original_name: str) -> Dict[str, Any]:
        """Process and store a document with its embeddings."""
        doc_id = str(uuid.uuid4())
        try:
            # Validate file extension
            file_ext = os.path.splitext(original_name)[1].lower()
            if file_ext not in self.SUPPORTED_EXTENSIONS:
                raise ValueError(f"Unsupported file type: {file_ext}")

            logger.info(f"Processing document: {original_name}")
            
            # Load and process document
            loader = UnstructuredFileLoader(file_path)
            raw_documents = loader.load()
            
            # Split into chunks
            all_chunks = []
            for doc in raw_documents:
                chunks = self.text_splitter.split_text(doc.page_content)
                for i, chunk in enumerate(chunks):
                    # Generate embedding
                    embedding = self.embeddings.embed_query(chunk)
                    
                    # Prepare chunk data with all necessary metadata
                    chunk_data = {
                        "id": str(uuid.uuid4()),
                        "content": chunk,
                        "metadata": {
                            "source": original_name,
                            "chunk_index": i,
                            "user_id": user_id,
                            "file_type": file_ext,
                            "total_chunks": len(chunks)
                        },
                        "embedding": embedding,
                        "document_id": doc_id,
                        "user_id": user_id,
                        "created_at": datetime.utcnow().isoformat()
                    }
                    all_chunks.append(chunk_data)
            
            # Insert chunks using service role
            if all_chunks:
                try:
                    self.supabase.table("documents").insert(all_chunks).execute()
                except Exception as e:
                    logger.error(f"Error inserting chunks: {str(e)}")
                    raise DatabaseError(f"Failed to insert document chunks: {str(e)}")
            
            return {
                "id": doc_id,
                "status": "complete",  # Return status in response but don't store it
                "total_chunks": len(all_chunks)
            }
            
        except Exception as e:
            logger.error(f"Error processing document: {str(e)}")
            raise DocumentProcessingError(f"Failed to process document: {str(e)}")

    async def get_user_documents(self, user_id: str) -> Dict[str, Any]:
        """Get all documents for a user."""
        try:
            # Get distinct document_ids and their first chunks for metadata
            response = self.supabase.table("documents")\
                .select("document_id, metadata, created_at")\
                .eq("user_id", user_id)\
                .execute()
            
            # Group by document_id to get unique documents
            documents = {}
            for row in response.data:
                doc_id = row.get("document_id")
                if doc_id not in documents:
                    documents[doc_id] = {
                        "id": doc_id,
                        "name": row.get("metadata", {}).get("source"),
                        "status": "complete",  # Always complete since we only store processed documents
                        "created_at": row.get("created_at"),
                        "file_type": row.get("metadata", {}).get("file_type")
                    }
            
            return {
                "documents": list(documents.values())
            }
        except Exception as e:
            logger.error(f"Error fetching documents: {str(e)}")
            raise

    async def delete_document(self, document_id: str, user_id: str) -> Dict[str, Any]:
        """Delete a document's chunks."""
        try:
            # Delete all chunks for this document
            self.supabase.table("documents")\
                .delete()\
                .eq("document_id", document_id)\
                .eq("user_id", user_id)\
                .execute()
            return {
                "success": True,
                "message": "Document deleted successfully"
            }
        except Exception as e:
            logger.error(f"Error deleting document: {str(e)}")
            raise

    async def get_document_status(self, document_id: str, user_id: str) -> Dict[str, Any]:
        """Get the document status from its chunks."""
        try:
            response = self.supabase.table("documents")\
                .select("document_id")\
                .eq("document_id", document_id)\
                .eq("user_id", user_id)\
                .limit(1)\
                .single()\
                .execute()
                
            if not response.data:
                raise ValueError("Document not found")
            
            return {
                "status": "complete",  # Always complete since we only store processed documents
                "processing_error": None
            }
        except Exception as e:
            logger.error(f"Error getting document status: {str(e)}")
            raise

    async def search_documents(self, query: str, user_id: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Search for documents using vector similarity."""
        try:
            # Generate query embedding
            query_embedding = self.embeddings.embed_query(query)
            
            # Search for similar chunks
            response = await self.supabase.rpc(
                "match_documents",
                {
                    "query_embedding": query_embedding,
                    "match_count": limit,
                    "filter": {"user_id": user_id}
                }
            ).execute()
            
            # Convert response to serializable format
            results = []
            for item in response.data:
                results.append({
                    "content": str(item.get("content")),
                    "metadata": {
                        "source": str(item.get("metadata", {}).get("source")),
                        "chunk_index": int(item.get("metadata", {}).get("chunk_index", 0)),
                        "score": float(item.get("metadata", {}).get("score", 0.0))
                    }
                })
            
            return results
        except Exception as e:
            logger.error(f"Error searching documents: {str(e)}")
            raise 