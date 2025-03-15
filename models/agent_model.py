import time
import os
import json
from langchain_anthropic import ChatAnthropic
from data.data_loader import load_data
from config.settings import ANTHROPIC_API_KEY
from config.supabase_client import supabase  # Import Supabase client
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
        self.docs = load_data()

        # Enhanced system prompt to handle chat history
        self.system_prompt = """You are a management consultant for a Big Three firm seeking to provide analysis for any given business question or case. 
        You will identify the business issue, research for relevant information pertaining to that issue, strategize using that information, and then finally solve the business case using found information and developed strategies.
        
        When responding:
        1. Consider the chat history to maintain context and build upon previous discussions
        2. Reference previous analyses when relevant
        3. Choose the most appropriate analysis types for the specific query. Available analysis types include:
           - "SWOT Analysis:" (for general business strategy questions)
           - "PESTEL Analysis:" (for macro-environmental analysis)
           - "Porter's Five Forces:" (for industry competition analysis)
           - "BCG Matrix:" (for portfolio analysis)
           - "Recommendations:" (always include if providing strategic advice)
           - "Implementation Plan:" (always include with recommendations)
        
        Format your response based on the analysis types that are most relevant to the query.
        Do NOT include all analysis types in every response.
        
        When using specific formats:
        
        For PESTEL Analysis:
        Political:
        • [Political point 1]
        • [Political point 2]
        [Continue for each PESTEL factor]
        
        For Porter's Five Forces:
        Threat of New Entrants:
        • [Point 1]
        • [Point 2]
        
        Bargaining Power of Suppliers:
        • [Point 1]
        • [Point 2]
        
        Bargaining Power of Buyers:
        • [Point 1]
        • [Point 2]
        
        Threat of Substitutes:
        • [Point 1]
        • [Point 2]
        
        Competitive Rivalry:
        • [Point 1]
        • [Point 2]
        
        For BCG Matrix:
        Stars:
        • [Product/Unit 1]
        • [Product/Unit 2]
        
        Question Marks:
        • [Product/Unit 1]
        • [Product/Unit 2]
        
        Cash Cows:
        • [Product/Unit 1]
        • [Product/Unit 2]
        
        Dogs:
        • [Product/Unit 1]
        • [Product/Unit 2]
        
        4. Include specific data points and metrics when available
        5. Provide actionable insights based on the cumulative context
        
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
            query = self.preprocess_input(query)
            
            # Parse chat history if it's a string
            if isinstance(chat_history, str):
                try:
                    chat_history = json.loads(chat_history)
                except:
                    chat_history = []
            
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

            # Get response from the model
            response = self.llm.invoke(messages)
            response_content = response.content.strip()
            
            # Save chat history
            self.save_chat_history(user_id, query, "human")
            self.save_chat_history(user_id, response_content, "agent")
            
            return response_content
            
        except Exception as e:
            print(f"Error encountered: {e}. Retrying in 60 seconds...")
            time.sleep(60)
            return self.get_answer(query, user_id, chat_history, thread_id, context)

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
            print(f"Error encountered: {e}. Retrying in 60 seconds...")
            time.sleep(60)
            return self.get_advice(query, user_id, thread_id)