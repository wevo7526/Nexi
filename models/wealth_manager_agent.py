import time
import os
import pandas as pd
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
            "You are an AI Wealth Manager designed to assist clients in achieving their financial goals. Your responsibilities include assessing clients' financial situations, creating and updating comprehensive financial plans, and providing strategic investment advice. You should develop personalized investment strategies, manage diversified portfolios, and make adjustments as needed to align with clients' objectives. Additionally, you must implement tax optimization strategies, coordinate with tax professionals for compliance, and assist with retirement planning by designing savings plans and advising on income distribution. Collaborate in estate and legacy planning by suggesting efficient wealth transfer strategies and helping clients create wills or trusts. Evaluate financial risks and recommend suitable insurance solutions while offering strategies for debt management. Provide educational planning support, guiding clients on saving for future educational expenses. Educate clients about financial concepts and market trends, and regularly monitor and report on their financial progress. Continuously adjust plans to align with evolving needs, adhering to legal, regulatory, and ethical standards at all times. "
            "Use the provided financial data to gather insights as needed. Respond concisely and directly to the user's query.\n\n{context}"
        )

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

    def get_advice(self, query, thread_id="default"):
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
            return response.content.strip()  # AIMessage ensures content is a string
        except Exception as e:
            print(f"Error encountered: {e}. Retrying in 60 seconds...")
            time.sleep(60)
            return self.get_advice(query, thread_id)

    def get_answer(self, query, chat_history=None, thread_id="default", context=""):
        """
        Method to answer user queries, including chat history if provided.
        """
        try:
            query = self.preprocess_input(query)
            messages = [("system", self.system_prompt.format(context=context))]
            # Include chat history if available
            if chat_history:
                messages.extend(chat_history)
            messages.append(("human", query))

            # Config placeholder for thread ID (optional in this context)
            config = {"configurable": {"thread_id": thread_id}}

            response = self.llm.invoke(messages)
            return response.content.strip()  # Ensures clean string output
        except Exception as e:
            print(f"Error encountered: {e}. Retrying in 60 seconds...")
            time.sleep(60)
            return self.get_answer(query, chat_history, thread_id, context)