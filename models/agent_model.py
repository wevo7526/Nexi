import time
import os
from langchain_anthropic import ChatAnthropic
from data.data_loader import load_data
from config.settings import API_KEY
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
            max_tokens=1024,
            api_key=API_KEY  # Pass the API key here
        )
        self.docs = load_data()

        # Define the system prompt
        self.system_prompt = (
            "You are a management consultant for a Big Three firm seeking to provide analysis for any given business question or case. You will identify the business issue, research for relevant information pertaining to that issue, strategize using that information, and then finally solve the business case using found information and developed strategies. "
            "Use the following pieces of retrieved context to answer "
            "the question. You need to solve consulting cases, use tools to solve the business case.\n\n{context}"
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