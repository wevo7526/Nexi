import os
from typing import List, Dict, Any
from langchain.chat_models import ChatAnthropic
from langchain.embeddings import CohereEmbeddings
from langchain.vectorstores.supabase import SupabaseVectorStore
from langchain.chains import ConversationalRetrievalChain
from langchain.memory import ConversationBufferMemory
from supabase import create_client, Client

class AgentService:
    def __init__(self):
        self.supabase_url = os.getenv("SUPABASE_URL")
        self.supabase_key = os.getenv("SUPABASE_SERVICE_KEY")
        self.anthropic_api_key = os.getenv("ANTHROPIC_API_KEY")
        self.cohere_api_key = os.getenv("COHERE_API_KEY")
        
        if not all([self.supabase_url, self.supabase_key, self.anthropic_api_key, self.cohere_api_key]):
            raise ValueError("Missing required environment variables")
        
        self.supabase: Client = create_client(self.supabase_url, self.supabase_key)
        self.embeddings = CohereEmbeddings(
            cohere_api_key=self.cohere_api_key,
            model="embed-multilingual-v2.0"
        )
        
        self.llm = ChatAnthropic(
            temperature=0,
            model="claude-3-sonnet-20240229",
            anthropic_api_key=self.anthropic_api_key,
            max_tokens=4096
        )

    async def search_documents(self, query: str, user_id: str, chat_history: List = None) -> Dict[str, Any]:
        """Search through documents and generate a response using the LLM."""
        try:
            # Initialize vector store
            vector_store = SupabaseVectorStore(
                self.supabase,
                self.embeddings,
                table_name="documents",
                query_name="match_documents"
            )

            # Create a retrieval chain
            memory = ConversationBufferMemory(
                memory_key="chat_history",
                return_messages=True
            )

            qa_chain = ConversationalRetrievalChain.from_llm(
                llm=self.llm,
                retriever=vector_store.as_retriever(
                    search_kwargs={
                        "k": 5,
                        "filter_expr": f"metadata->>'user_id'='{user_id}'"
                    }
                ),
                memory=memory,
                return_source_documents=True,
                verbose=True
            )

            # Get response from the chain
            result = await qa_chain.acall({
                "question": query,
                "chat_history": chat_history or []
            })

            # Format source documents
            sources = []
            for doc in result.get("source_documents", []):
                sources.append({
                    "content": doc.page_content,
                    "metadata": doc.metadata,
                    "document_name": doc.metadata.get("source", "Unknown"),
                })

            return {
                "answer": result["answer"],
                "sources": sources,
                "chat_history": result.get("chat_history", [])
            }

        except Exception as e:
            print(f"Error in search_documents: {str(e)}")
            raise 