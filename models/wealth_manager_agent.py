import os
import time
from langchain_anthropic import ChatAnthropic
from data.data_loader import load_data
from config.settings import API_KEY
from langchain_community.document_loaders import (
    UnstructuredWordDocumentLoader,
    UnstructuredExcelLoader,
    UnstructuredPDFLoader,
    UnstructuredPowerPointLoader
)

class WealthManagerAgent:
    def __init__(self):
        """
        Initialize the WealthManagerAgent with an Anthropic-based language model.
        """
        # Initialize the ChatAnthropic model
        self.llm = ChatAnthropic(
            model="claude-3-5-sonnet-20240620",
            temperature=0,
            max_tokens=1024,
            api_key=API_KEY
        )

        # Load financial data
        self.docs = load_data()

        # Define the system prompt
        self.system_prompt = (
            "You are a wealth manager seeking to provide financial advice and strategies for any given financial question. "
            "You are an AI Wealth Manager designed to assist clients in achieving their financial goals. Your responsibilities include assessing clients' financial situations, creating and updating comprehensive financial plans, and providing strategic investment advice. "
            "Use the provided financial data to gather insights as needed. Respond concisely and directly to the user's query.\n\n{context}"
        )

    def preprocess_input(self, user_input):
        """
        Preprocess user input into a format usable by the AI model.
        Supports strings, dictionaries, and lists.
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
        Load a document and extract content based on its file type.
        Supported formats: .docx, .pdf, .xls/.xlsx, .ppt/.pptx.
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

    def get_advice(self, query, thread_id="default"):
        """
        Generate financial advice based on the user's query.
        Provides a structured response with categories of financial guidance.
        """
        try:
            query = self.preprocess_input(query)
            context = "\n".join([doc.page_content for doc in self.docs])
            messages = [
                ("system", self.system_prompt.format(context=context)),
                ("human", query)
            ]
            response = self.llm.invoke(messages)

            # Return structured response
            structured_response = {
                "categories": [
                    {"name": "Investment Advice", "details": response.content.strip()},
                    {"name": "Risk Assessment", "details": "Your portfolio risk level is moderate."},
                    {"name": "Savings Plan", "details": "Increase your monthly savings by 5%."}
                ]
            }
            return structured_response
        except Exception as e:
            print(f"Error encountered: {e}")
            return {"error": str(e)}

    def get_answer(self, query, chat_history=None, thread_id="default", context=""):
        """
        Generate a comprehensive answer to user queries, incorporating context and chat history.
        Provides a structured response with multiple categories of advice.
        """
        try:
            query = self.preprocess_input(query)
            messages = [("system", self.system_prompt.format(context=context))]
            
            # Include chat history if provided
            if chat_history:
                messages.extend(chat_history)
            
            messages.append(("human", query))

            response = self.llm.invoke(messages)

            # Return structured response
            structured_response = {
                "categories": [
                    {"name": "Investment Advice", "details": response.content.strip()},
                    {"name": "Risk Assessment", "details": "Your portfolio risk level is moderate."},
                    {"name": "Retirement Planning", "details": "Save an additional 10% annually to reach your goals."}
                ]
            }
            return structured_response
        except Exception as e:
            print(f"Error encountered: {e}")
            return {"error": str(e)}
