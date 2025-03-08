import time
import os
from langchain_anthropic import ChatAnthropic
from data.data_loader import load_data
from config.settings import API_KEY

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

    def get_advice(self, query, thread_id="default"):
        """
        Method to get advice based on the user's query.
        """
        try:
            messages = [
                ("system", self.system_prompt),
                ("human", query)
            ]
            response = self.llm.invoke(messages)
            return response.content.strip()  # AIMessage ensures content is a string
        except Exception as e:
            print(f"Error encountered: {e}. Retrying in 60 seconds...")
            time.sleep(60)
            return self.get_advice(query, thread_id)

    def get_answer(self, query, chat_history=None, thread_id="default"):
        """
        Method to answer user queries, including chat history if provided.
        """
        try:
            messages = [("system", self.system_prompt)]
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
            return self.get_answer(query, chat_history, thread_id)
