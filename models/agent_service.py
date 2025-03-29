import os
from typing import List, Dict, Any
from langchain_anthropic import ChatAnthropic
from langchain_cohere import CohereEmbeddings
from langchain.vectorstores.supabase import SupabaseVectorStore
from langchain.chains import ConversationalRetrievalChain
from langchain.memory import ConversationBufferMemory
from supabase import create_client, Client

class InitializationError(Exception):
    """Exception raised when the AgentService fails to initialize properly."""
    pass

class AgentService:
    def __init__(self):
        try:
            # Consistent environment variable names
            self.supabase_url = os.getenv("SUPABASE_URL")
            self.supabase_service_key = os.getenv("SUPABASE_SERVICE_KEY")
            self.cohere_api_key = os.getenv("COHERE_API_KEY")
            self.anthropic_api_key = os.getenv("ANTHROPIC_API_KEY")
            
            # Validate all required environment variables
            missing_vars = []
            for var_name, var_value in {
                "SUPABASE_URL": self.supabase_url,
                "SUPABASE_SERVICE_KEY": self.supabase_service_key,
                "COHERE_API_KEY": self.cohere_api_key,
                "ANTHROPIC_API_KEY": self.anthropic_api_key
            }.items():
                if not var_value:
                    missing_vars.append(var_name)
            
            if missing_vars:
                raise ValueError(f"Missing required environment variables: {', '.join(missing_vars)}")
        
            # Initialize Supabase client
            try:
                self.supabase: Client = create_client(self.supabase_url, self.supabase_service_key)
            except Exception as e:
                raise ConnectionError(f"Failed to initialize Supabase client: {str(e)}")
            
            # Initialize embeddings with error handling
            try:
                self.embeddings = CohereEmbeddings(
                    cohere_api_key=self.cohere_api_key,
                    model="embed-multilingual-v3.0"
                )
            except Exception as e:
                raise ConnectionError(f"Failed to initialize Cohere embeddings: {str(e)}")
            
            # Initialize LLM with error handling
            try:
                self.llm = ChatAnthropic(
                    model="claude-3-5-sonnet-20240620",
                    anthropic_api_key=self.anthropic_api_key,
                    temperature=0,
                    max_tokens=4096,
                    anthropic_api_url="https://api.anthropic.com/v1"
                )
            except Exception as e:
                raise ConnectionError(f"Failed to initialize Anthropic LLM: {str(e)}")
            
            # Initialize vector store
            try:
                self.vector_store = SupabaseVectorStore(
                    self.supabase,
                    self.embeddings,
                    table_name="documents",
                    query_name="match_documents"
                )
            except Exception as e:
                raise ConnectionError(f"Failed to initialize vector store: {str(e)}")
            
            # Initialize conversation memory
            self.memory = ConversationBufferMemory(
                memory_key="chat_history",
                return_messages=True
            )
            
        except Exception as e:
            raise InitializationError(f"Failed to initialize AgentService: {str(e)}")

    async def search_documents(self, query: str, user_id: str, chat_history: List = None) -> Dict[str, Any]:
        """Search through documents and generate a response using the LLM."""
        try:
            # Create a retrieval chain with user-specific filter
            qa_chain = ConversationalRetrievalChain.from_llm(
                llm=self.llm,
                retriever=self.vector_store.as_retriever(
                    search_kwargs={
                        "k": 5,
                        "filter_expr": f"metadata->>'user_id'='{user_id}'"
                    }
                ),
                memory=self.memory,
                return_source_documents=True,
                verbose=True
            )

            # Get response from the chain
            result = await qa_chain.acall({
                "question": query,
                "chat_history": chat_history or []
            })

            # Format source documents with more metadata
            sources = []
            for doc in result.get("source_documents", []):
                # Convert document metadata to serializable format
                metadata = {}
                for key, value in doc.metadata.items():
                    if isinstance(value, (str, int, float, bool)):
                        metadata[key] = value
                    else:
                        metadata[key] = str(value)

                sources.append({
                    "content": str(doc.page_content),
                    "metadata": metadata,
                    "document_name": str(doc.metadata.get("source", "Unknown")),
                    "chunk_index": int(doc.metadata.get("chunk_index", 0)),
                    "relevance_score": float(doc.metadata.get("score", 1.0))
                })

            # Sort sources by relevance score
            sources.sort(key=lambda x: x["relevance_score"], reverse=True)

            # Format chat history to be serializable
            formatted_history = []
            if result.get("chat_history"):
                for msg in result["chat_history"]:
                    formatted_history.append({
                        "role": "user" if msg.type == "human" else "assistant",
                        "content": str(msg.content)
                    })

            return {
                "answer": str(result["answer"]),
                "sources": sources,
                "chat_history": formatted_history
            }

        except Exception as e:
            print(f"Error in search_documents: {str(e)}")
            raise 