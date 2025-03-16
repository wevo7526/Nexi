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
import cohere
from supabase import create_client, Client

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DocumentService:
    def __init__(self):
        self.supabase_url = os.getenv("SUPABASE_URL")
        self.supabase_key = os.getenv("SUPABASE_KEY")
        self.cohere_api_key = os.getenv("COHERE_API_KEY")
        self.anthropic_api_key = os.getenv("ANTHROPIC_API_KEY")
        
        if not all([self.supabase_url, self.supabase_key, self.cohere_api_key, self.anthropic_api_key]):
            raise ValueError("Missing required environment variables")
        
        self.supabase: Client = create_client(self.supabase_url, self.supabase_key)
        
        # Initialize embeddings
        self.embeddings = CohereEmbeddings(
            cohere_api_key=self.cohere_api_key,
            model="embed-multilingual-v3.0"
        )
        
        # Initialize LLM for insights
        self.llm = ChatAnthropic(
            model="claude-3-sonnet-20240229",
            anthropic_api_key=self.anthropic_api_key,
            temperature=0,
            max_tokens=4096,
            anthropic_api_url="https://api.anthropic.com/v1"
        )
        
        # Initialize text splitter
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=2000,
            chunk_overlap=200,
            length_function=len
        )
        
        # Constants
        self.SUPPORTED_EXTENSIONS = {'.txt', '.pdf', '.doc', '.docx'}
        self.BATCH_SIZE = 10

    async def process_document(self, file_path: str, user_id: str, original_name: str) -> Dict[str, Any]:
        """Process and store a document with its embeddings."""
        doc_id = None
        try:
            # Validate file extension
            file_ext = os.path.splitext(original_name)[1].lower()
            if file_ext not in self.SUPPORTED_EXTENSIONS:
                raise ValueError(f"Unsupported file type: {file_ext}")

            logger.info(f"Starting document processing for {original_name}")
            
            # Create document metadata entry
            doc_id = str(uuid.uuid4())
            metadata = {
                "id": doc_id,
                "name": original_name,
                "user_id": user_id,
                "status": "processing",
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat(),
                "file_type": file_ext,
                "processing_error": None
            }
            
            # Insert metadata first
            logger.info(f"Creating metadata entry for document {doc_id}")
            self.supabase.table("document_metadata").insert(metadata).execute()
            
            # Load and process document
            logger.info(f"Loading document from {file_path}")
            loader = UnstructuredFileLoader(file_path)
            raw_documents = loader.load()
            
            # Split documents into chunks
            documents = []
            for doc in raw_documents:
                chunks = self.text_splitter.split_text(doc.page_content)
                for chunk in chunks:
                    documents.append({"content": chunk, "metadata": doc.metadata})
            
            # Process chunks and generate embeddings
            logger.info(f"Processing {len(documents)} chunks for document {doc_id}")
            chunks_processed = 0
            total_chunks = len(documents)
            
            for i in range(0, total_chunks, self.BATCH_SIZE):
                batch = documents[i:i + self.BATCH_SIZE]
                batch_data = []
                
                for j, doc in enumerate(batch):
                    try:
                        chunk_embedding = self.embeddings.embed_query(doc["content"])
                        
                        chunk_data = {
                            "content": doc["content"],
                            "embedding": chunk_embedding,
                            "metadata": {
                                **doc["metadata"],
                                "chunk_index": i + j,
                                "total_chunks": total_chunks,
                                "user_id": user_id,
                                "file_type": file_ext,
                                "document_name": original_name
                            },
                            "document_id": doc_id,
                            "user_id": user_id
                        }
                        batch_data.append(chunk_data)
                        chunks_processed += 1
                        
                        # Update progress periodically
                        if chunks_processed % 10 == 0:
                            progress = (chunks_processed / total_chunks) * 100
                            self.supabase.table("document_metadata").update(
                                {"processing_progress": progress}
                            ).eq("id", doc_id).execute()
                            
                    except Exception as chunk_error:
                        logger.error(f"Error processing chunk {i + j} of document {doc_id}: {str(chunk_error)}")
                        continue
                
                # Insert batch
                if batch_data:
                    self.supabase.table("documents").insert(batch_data).execute()
                    logger.info(f"Processed batch {i//self.BATCH_SIZE + 1}, total chunks processed: {chunks_processed}")
            
            # Generate initial insights
            insights = await self.generate_document_insights(doc_id, user_id)
            
            # Update metadata status to complete
            logger.info(f"Completing document processing for {doc_id}")
            self.supabase.table("document_metadata").update(
                {
                    "status": "complete",
                    "updated_at": datetime.utcnow().isoformat(),
                    "processing_progress": 100,
                    "total_chunks": total_chunks,
                    "chunks_processed": chunks_processed,
                    "initial_insights": insights
                }
            ).eq("id", doc_id).execute()
            
            # Clean up temporary file
            try:
                os.remove(file_path)
                logger.info(f"Cleaned up temporary file: {file_path}")
            except Exception as cleanup_error:
                logger.warning(f"Error cleaning up temporary file: {str(cleanup_error)}")
            
            return {
                "id": doc_id,
                "status": "complete",
                "total_chunks": total_chunks,
                "chunks_processed": chunks_processed,
                "insights": insights
            }
            
        except Exception as e:
            logger.error(f"Error processing document: {str(e)}")
            if doc_id:
                try:
                    self.supabase.table("document_metadata").update(
                        {
                            "status": "failed",
                            "updated_at": datetime.utcnow().isoformat(),
                            "processing_error": str(e)
                        }
                    ).eq("id", doc_id).execute()
                except Exception as update_error:
                    logger.error(f"Error updating metadata status: {str(update_error)}")
            raise

    async def generate_document_insights(self, document_id: str, user_id: str) -> Dict[str, Any]:
        """Generate insights from a processed document."""
        try:
            # Get all chunks for the document
            response = self.supabase.table("documents").select("content").eq("document_id", document_id).eq("user_id", user_id).execute()
            
            if not response.data:
                raise ValueError("No document content found")
            
            # Combine all chunks
            full_text = "\n\n".join([chunk["content"] for chunk in response.data])
            
            # Create prompt for insights generation
            prompt = ChatPromptTemplate.from_messages([
                ("system", """You are an expert document analyst. Analyze the provided document content and generate key insights. 
                Focus on:
                1. Main themes and topics
                2. Key findings or arguments
                3. Important data points or statistics
                4. Potential implications or recommendations
                5. Areas that might need further investigation
                
                Format your response as a structured JSON with these sections."""),
                ("user", "{text}")
            ])
            
            # Generate insights
            chain = prompt | self.llm
            result = await chain.ainvoke({"text": full_text})
            
            return result.content
            
        except Exception as e:
            logger.error(f"Error generating insights: {str(e)}")
            return {"error": str(e)}

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
            self.supabase.table("documents").delete().eq("document_id", document_id).eq("user_id", user_id).execute()
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

    async def get_user_id_from_token(self, token):
        """
        Get user ID from Supabase token with improved validation and error handling
        """
        try:
            if not token:
                raise ValueError("No token provided")

            # Create Supabase client with admin key for token verification
            supabase_client = create_client(
                self.supabase_url,
                self.supabase_key
            )

            try:
                # Get user data from token - note that get_user is not async
                response = supabase_client.auth.get_user(token)
                
                if not response or not response.user:
                    raise ValueError("Invalid token: User not found")
                
                user_id = response.user.id
                if not user_id:
                    raise ValueError("Invalid token: No user ID found")
                    
                return user_id
                
            except Exception as e:
                logger.error(f"Token verification error: {str(e)}")
                if "JWT" in str(e):
                    raise ValueError("Invalid or expired token")
                raise ValueError(f"Authentication failed: {str(e)}")
                
        except Exception as e:
            logger.error(f"Error in get_user_id_from_token: {str(e)}")
            raise ValueError(str(e)) 