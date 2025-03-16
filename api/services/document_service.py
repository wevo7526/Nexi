import os
import logging
from typing import List, Dict, Any
import uuid
from datetime import datetime
from langchain_community.document_loaders import UnstructuredFileLoader
from langchain_community.embeddings import CohereEmbeddings
import cohere
from supabase import create_client, Client

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DocumentService:
    def __init__(self):
        self.supabase_url = os.getenv("SUPABASE_URL")
        self.supabase_key = os.getenv("SUPABASE_KEY")
        self.cohere_api_key = os.getenv("COHERE_API_KEY")
        
        if not all([self.supabase_url, self.supabase_key, self.cohere_api_key]):
            raise ValueError("Missing required environment variables")
        
        self.supabase: Client = create_client(self.supabase_url, self.supabase_key)
        self.embeddings = CohereEmbeddings(
            cohere_api_key=self.cohere_api_key,
            model="embed-multilingual-v2.0",
            user_agent="nexi-app"
        )
        self.co = cohere.Client(self.cohere_api_key)

    async def process_document(self, file_path: str, user_id: str, original_name: str) -> Dict[str, Any]:
        """Process and store a document with its embeddings."""
        doc_id = None
        try:
            logger.info(f"Starting document processing for {original_name}")
            
            # Create document metadata entry
            doc_id = str(uuid.uuid4())
            metadata = {
                "id": doc_id,
                "name": original_name,
                "user_id": user_id,
                "status": "processing",
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }
            
            # Insert metadata first
            logger.info(f"Creating metadata entry for document {doc_id}")
            self.supabase.table("document_metadata").insert(metadata).execute()
            
            # Load and process document
            logger.info(f"Loading document from {file_path}")
            loader = UnstructuredFileLoader(file_path)
            documents = loader.load()
            
            # Process chunks and generate embeddings
            logger.info(f"Processing {len(documents)} chunks for document {doc_id}")
            for i, doc in enumerate(documents):
                try:
                    chunk_embedding = self.embeddings.embed_query(doc.page_content)
                    
                    chunk_data = {
                        "document_id": doc_id,
                        "content": doc.page_content,
                        "embedding": chunk_embedding,
                        "metadata": {**doc.metadata, "chunk_index": i}
                    }
                    
                    self.supabase.table("documents").insert(chunk_data).execute()
                    logger.info(f"Processed chunk {i+1}/{len(documents)} for document {doc_id}")
                except Exception as chunk_error:
                    logger.error(f"Error processing chunk {i} of document {doc_id}: {str(chunk_error)}")
                    raise
            
            # Update metadata status to complete
            logger.info(f"Completing document processing for {doc_id}")
            self.supabase.table("document_metadata").update(
                {"status": "complete", "updated_at": datetime.utcnow().isoformat()}
            ).eq("id", doc_id).execute()
            
            return {"id": doc_id, "status": "complete"}
            
        except Exception as e:
            logger.error(f"Error processing document: {str(e)}")
            # Update metadata status to failed if it was created
            if doc_id:
                try:
                    self.supabase.table("document_metadata").update(
                        {
                            "status": "failed",
                            "updated_at": datetime.utcnow().isoformat(),
                            "error": str(e)
                        }
                    ).eq("id", doc_id).execute()
                except Exception as update_error:
                    logger.error(f"Error updating metadata status: {str(update_error)}")
            raise

    async def get_user_documents(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all documents for a user."""
        try:
            logger.info(f"Fetching documents for user {user_id}")
            response = self.supabase.table("document_metadata").select("*").eq("user_id", user_id).execute()
            return response.data
        except Exception as e:
            logger.error(f"Error fetching user documents: {str(e)}")
            raise

    async def delete_document(self, document_id: str, user_id: str) -> bool:
        """Delete a document and its chunks."""
        try:
            logger.info(f"Deleting document {document_id} for user {user_id}")
            # Delete document chunks
            self.supabase.table("documents").delete().eq("document_id", document_id).execute()
            # Delete metadata
            self.supabase.table("document_metadata").delete().eq("id", document_id).eq("user_id", user_id).execute()
            return True
        except Exception as e:
            logger.error(f"Error deleting document: {str(e)}")
            raise

    async def search_documents(self, query: str, user_id: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Search for documents using vector similarity."""
        try:
            logger.info(f"Searching documents for user {user_id}")
            # Get query embedding
            query_embedding = self.embeddings.embed_query(query)
            
            # Get user's documents
            user_docs = self.supabase.table("document_metadata").select("id").eq("user_id", user_id).execute()
            doc_ids = [doc["id"] for doc in user_docs.data]
            
            if not doc_ids:
                logger.info(f"No documents found for user {user_id}")
                return []
            
            # Search for similar chunks
            logger.info(f"Performing similarity search across {len(doc_ids)} documents")
            rpc_response = self.supabase.rpc(
                "match_documents",
                {
                    "query_embedding": query_embedding,
                    "match_count": limit,
                    "document_ids": doc_ids
                }
            ).execute()
            
            return rpc_response.data
        except Exception as e:
            logger.error(f"Error searching documents: {str(e)}")
            raise

    async def get_user_id_from_token(self, token: str) -> str:
        """Get user ID from Supabase token."""
        try:
            user = await self.supabase.auth.get_user(token)
            return user.user.id
        except Exception as e:
            logger.error(f"Error getting user from token: {str(e)}")
            raise ValueError("Invalid authentication token") 