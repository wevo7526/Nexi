import os
from supabase import create_client, Client
from typing import Optional, Dict, Any

class SupabaseService:
    def __init__(self):
        self.supabase_url = os.getenv("SUPABASE_URL")
        self.supabase_service_key = os.getenv("SUPABASE_SERVICE_KEY")
        
        if not self.supabase_url or not self.supabase_service_key:
            raise ValueError("Missing required Supabase environment variables")
            
        self.client: Client = create_client(self.supabase_url, self.supabase_service_key)
        
    def get_documents(self, user_id: str) -> list:
        """Get all documents for a user."""
        try:
            response = self.client.table("document_metadata").select("*").eq("user_id", user_id).execute()
            return response.data
        except Exception as e:
            raise Exception(f"Failed to get documents: {str(e)}")
            
    def insert_document(self, metadata: dict) -> Dict[str, Any]:
        """Insert document metadata."""
        try:
            response = self.client.table("document_metadata").insert(metadata).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            raise Exception(f"Failed to insert document: {str(e)}")
            
    def update_document(self, document_id: str, updates: dict) -> Dict[str, Any]:
        """Update document metadata."""
        try:
            response = self.client.table("document_metadata").update(updates).eq("id", document_id).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            raise Exception(f"Failed to update document: {str(e)}")
            
    def delete_document(self, document_id: str, user_id: str) -> None:
        """Delete document and its chunks."""
        try:
            # Delete document chunks first
            self.client.table("documents").delete().eq("document_id", document_id).eq("user_id", user_id).execute()
            # Then delete metadata
            self.client.table("document_metadata").delete().eq("id", document_id).eq("user_id", user_id).execute()
        except Exception as e:
            raise Exception(f"Failed to delete document: {str(e)}")
            
    def insert_document_chunks(self, chunks: list) -> list:
        """Insert document chunks."""
        try:
            if chunks:
                response = self.client.table("documents").insert(chunks).execute()
                return response.data
            return []
        except Exception as e:
            raise Exception(f"Failed to insert document chunks: {str(e)}")
            
    def search_documents(self, query_embedding: list, user_id: str, limit: int = 5) -> list:
        """Search documents using vector similarity."""
        try:
            response = self.client.rpc(
                "match_documents",
                {
                    "query_embedding": query_embedding,
                    "match_count": limit,
                    "filter": {"user_id": user_id}
                }
            ).execute()
            return response.data
        except Exception as e:
            raise Exception(f"Failed to search documents: {str(e)}")
            
    def get_document_status(self, document_id: str, user_id: str) -> Dict[str, Any]:
        """Get document processing status."""
        try:
            response = self.client.table("document_metadata").select("*").eq("id", document_id).eq("user_id", user_id).single().execute()
            return response.data
        except Exception as e:
            raise Exception(f"Failed to get document status: {str(e)}") 