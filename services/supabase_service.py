import os
from supabase import create_client, Client

class SupabaseService:
    def __init__(self):
        self.supabase_url = os.getenv("SUPABASE_URL")
        self.supabase_service_key = os.getenv("SUPABASE_SERVICE_KEY")
        
        if not self.supabase_url or not self.supabase_service_key:
            raise ValueError("Missing required Supabase environment variables")
            
        self.client: Client = create_client(self.supabase_url, self.supabase_service_key)
        
    async def get_user(self, token: str):
        """Get user data from token."""
        try:
            user = await self.client.auth.get_user(token)
            return user
        except Exception as e:
            raise ValueError(f"Failed to get user from token: {str(e)}")
            
    async def verify_token(self, token: str) -> str:
        """Verify JWT token and return user ID."""
        try:
            user = await self.get_user(token)
            if not user or not user.user or not user.user.id:
                raise ValueError("Invalid token")
            return user.user.id
        except Exception as e:
            raise ValueError(f"Token verification failed: {str(e)}")
            
    async def get_documents(self, user_id: str):
        """Get all documents for a user."""
        try:
            response = await self.client.table("document_metadata").select("*").eq("user_id", user_id).execute()
            return response.data
        except Exception as e:
            raise Exception(f"Failed to get documents: {str(e)}")
            
    async def insert_document(self, metadata: dict):
        """Insert document metadata."""
        try:
            response = await self.client.table("document_metadata").insert(metadata).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            raise Exception(f"Failed to insert document: {str(e)}")
            
    async def update_document(self, document_id: str, updates: dict):
        """Update document metadata."""
        try:
            response = await self.client.table("document_metadata").update(updates).eq("id", document_id).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            raise Exception(f"Failed to update document: {str(e)}")
            
    async def delete_document(self, document_id: str, user_id: str):
        """Delete document and its chunks."""
        try:
            # Delete document chunks first
            await self.client.table("documents").delete().eq("document_id", document_id).eq("user_id", user_id).execute()
            # Then delete metadata
            await self.client.table("document_metadata").delete().eq("id", document_id).eq("user_id", user_id).execute()
        except Exception as e:
            raise Exception(f"Failed to delete document: {str(e)}")
            
    async def insert_document_chunks(self, chunks: list):
        """Insert document chunks."""
        try:
            if chunks:
                response = await self.client.table("documents").insert(chunks).execute()
                return response.data
        except Exception as e:
            raise Exception(f"Failed to insert document chunks: {str(e)}")
            
    async def search_documents(self, query_embedding: list, user_id: str, limit: int = 5):
        """Search documents using vector similarity."""
        try:
            response = await self.client.rpc(
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
            
    async def get_document_status(self, document_id: str, user_id: str):
        """Get document processing status."""
        try:
            response = await self.client.table("document_metadata").select("*").eq("id", document_id).eq("user_id", user_id).single().execute()
            return response.data
        except Exception as e:
            raise Exception(f"Failed to get document status: {str(e)}") 