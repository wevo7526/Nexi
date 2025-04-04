import time
import os
import json
from langchain_anthropic import ChatAnthropic
from config.settings import ANTHROPIC_API_KEY
from config.supabase_client import supabase
from langchain_community.document_loaders import (
    UnstructuredWordDocumentLoader,
    UnstructuredExcelLoader,
    UnstructuredPDFLoader,
    UnstructuredPowerPointLoader
)

class ConsultantAgent:
    def __init__(self):
        # Initialize the ChatAnthropic model and pass API key explicitly
        self.llm = ChatAnthropic(
            model="claude-3-5-sonnet-20240620",
            temperature=0,
            max_tokens=4096,  # Increased for better context handling
            api_key=ANTHROPIC_API_KEY
        )
        self.docs = []  # Initialize empty docs list

        # Enhanced system prompt to handle chat history
        self.system_prompt = """You are an expert business consultant with deep expertise in various business domains. Your role is to provide focused, actionable insights based on the specific needs of your client.

        When responding:
        1. Analyze the user's query carefully to understand their specific business challenge or question
        2. Consider the chat history to maintain context and build upon previous discussions
        3. Provide a response that directly addresses the user's needs with:
           - Clear understanding of the problem
           - Relevant analysis based on the specific context
           - Actionable recommendations
           - Implementation guidance where appropriate
        
        Format your response in a clear, structured manner with:
        - A brief summary of the key issue or question
        - Detailed analysis relevant to the specific query
        - Concrete recommendations with clear rationale
        - Implementation steps or next actions where applicable
        
        Use the following pieces of retrieved context to answer the question:
        {context}
        
        Previous conversation context:
        {chat_history}
        """

    def preprocess_input(self, user_input):
        """
        Method to preprocess user input data of all kinds.
        """
        if isinstance(user_input, str):
            return user_input
        elif isinstance(user_input, dict):
            return " ".join(f"{key}: {value}" for key, value in user_input.items())
        elif isinstance(user_input, list):
            return " ".join(str(item) for item in user_input)
        else:
            return str(user_input)

    def load_document(self, file_path):
        """
        Method to load a document based on its file type.
        """
        file_extension = os.path.splitext(file_path)[1].lower()
        if file_extension == '.docx':
            loader = UnstructuredWordDocumentLoader(file_path, mode="elements")
        elif file_extension == '.pdf':
            loader = UnstructuredPDFLoader(file_path, mode="elements")
        elif file_extension in ['.xls', '.xlsx']:
            loader = UnstructuredExcelLoader(file_path, mode="elements")
        elif file_extension in ['.ppt', '.pptx']:
            loader = UnstructuredPowerPointLoader(file_path, mode="elements")
        else:
            raise ValueError(f"Unsupported file type: {file_extension}")
        
        self.docs = loader.load()
        return self.docs

    def save_chat_history(self, user_id, message, role):
        """
        Method to save chat history to Supabase.
        """
        try:
            data = {
                "user_id": user_id if user_id else "00000000-0000-0000-0000-000000000000",  # Anonymous user ID
                "message": message,
                "role": role
            }
            
            supabase.table("chat_history").insert(data).execute()
        except Exception as e:
            print(f"Error saving chat history: {e}")
            # Continue execution even if saving fails
            pass

    def format_chat_history(self, chat_history):
        """Format chat history for the prompt."""
        if not chat_history:
            return "No previous conversation."
            
        formatted_history = []
        for msg in chat_history:
            role = "User" if msg["role"] == "user" else "Assistant"
            formatted_history.append(f"{role}: {msg['content']}")
        
        return "\n".join(formatted_history)

    def get_answer(self, query, user_id=None, chat_history=None, thread_id="default", context=""):
        """
        Enhanced method to answer user queries with chat history context.
        """
        try:
            # Preprocess input and validate
            if not query or not isinstance(query, str):
                raise ValueError("Query must be a non-empty string")
            
            query = self.preprocess_input(query)
            
            # Parse chat history if it's a string
            if isinstance(chat_history, str):
                try:
                    chat_history = json.loads(chat_history)
                except json.JSONDecodeError:
                    chat_history = []
            elif chat_history is None:
                chat_history = []
            
            if not isinstance(chat_history, list):
                raise ValueError("Chat history must be a list")
            
            # Format the chat history
            formatted_history = self.format_chat_history(chat_history)
            
            # Prepare the full context
            full_context = context if context else "\n".join([doc.page_content for doc in self.docs])
            
            # Create the complete prompt with chat history
            messages = [
                ("system", self.system_prompt.format(
                    context=full_context,
                    chat_history=formatted_history
                )),
                ("human", query)
            ]

            # Get response from the model with retry logic
            max_retries = 3
            retry_count = 0
            last_error = None
            
            while retry_count < max_retries:
                try:
                    response = self.llm.invoke(messages)
                    response_content = response.content.strip()
                    
                    if not response_content:
                        raise ValueError("Empty response from model")
                    
                    # Save chat history
                    self.save_chat_history(user_id, query, "human")
                    self.save_chat_history(user_id, response_content, "agent")
                    
                    # Structure the response to match frontend expectations
                    structured_response = {
                        "type": "analysis",
                        "title": "Business Analysis",
                        "content": {
                            "sections": [
                                {
                                    "title": "Key Issue",
                                    "content": response_content.split('\n')[0]  # First line as summary
                                },
                                {
                                    "title": "Analysis",
                                    "content": '\n'.join(response_content.split('\n')[1:])  # Rest as analysis
                                }
                            ]
                        }
                    }
                    
                    return {
                        "content": response_content,
                        "type": "analysis",
                        "outputs": [structured_response]
                    }
                    
                except Exception as e:
                    last_error = e
                    retry_count += 1
                    if retry_count < max_retries:
                        print(f"Error encountered: {e}. Retrying in {retry_count * 30} seconds...")
                        time.sleep(retry_count * 30)
                    else:
                        break
                    
            # If we've exhausted retries, raise the last error
            raise last_error or Exception("Failed to get answer after multiple retries")
            
        except Exception as e:
            print(f"Error in get_answer: {str(e)}")
            raise

    def get_advice(self, query, user_id=None, thread_id="default"):
        """
        Method to get advice based on the user's query.
        """
        try:
            query = self.preprocess_input(query)
            context = "\n".join([doc.page_content for doc in self.docs])
            messages = [
                ("system", self.system_prompt.format(context=context)),
                ("human", query)
            ]
            response = self.llm.invoke(messages)
            
            # Save chat history with user_id (which might be None)
            self.save_chat_history(user_id, query, "human")
            self.save_chat_history(user_id, response.content.strip(), "agent")
            
            return response.content.strip()
        except Exception as e:
            print(f"Error in get_advice: {str(e)}")
            raise