import time
from langchain_anthropic import ChatAnthropic
from langchain_community.tools.google_finance import GoogleFinanceQueryRun
from langchain_community.utilities.google_finance import GoogleFinanceAPIWrapper
from data.data_loader import load_data
from config.settings import API_KEY, SERPAPI_API_KEY  # Import the loaded SERP_API_KEY


class WealthManagerAgent:
    def __init__(self):
        # Ensure the SERP API Key is explicitly passed to the wrapper
        if not SERPAPI_API_KEY:
            raise ValueError("SERPAPI_API_KEY is not set. Please check your .env file.")

        # Initialize the ChatAnthropic model
        self.llm = ChatAnthropic(
            model="claude-3-5-sonnet-20240620",
            temperature=0,
            max_tokens=1024,
            api_key=API_KEY
        )
        
        # Load financial data
        self.docs = load_data()

        # Initialize the Google Finance tool with SERP API Key
        self.google_finance_tool = GoogleFinanceQueryRun(
            api_wrapper=GoogleFinanceAPIWrapper(serp_api_key=SERPAPI_API_KEY)  # Pass the key directly
        )

        # Define the system prompt
        self.system_prompt = (
            "You are a wealth manager seeking to provide financial advice and strategies for any given financial question. "
            "You are an AI Wealth Manager designed to assist clients in achieving their financial goals. Your responsibilities include assessing clients' financial situations, creating and updating comprehensive financial plans, and providing strategic investment advice. You should develop personalized investment strategies, manage diversified portfolios, and make adjustments as needed to align with clients' objectives. Additionally, you must implement tax optimization strategies, coordinate with tax professionals for compliance, and assist with retirement planning by designing savings plans and advising on income distribution. Collaborate in estate and legacy planning by suggesting efficient wealth transfer strategies and helping clients create wills or trusts. Evaluate financial risks and recommend suitable insurance solutions while offering strategies for debt management. Provide educational planning support, guiding clients on saving for future educational expenses. Educate clients about financial concepts and market trends, and regularly monitor and report on their financial progress. Continuously adjust plans to align with evolving needs, adhering to legal, regulatory, and ethical standards at all times. "
            "Use tools like Google Finance to gather data as needed. Respond concisely and directly to the user's query.\n\n{context}"
        )

    def get_answer(self, query, chat_history=None, thread_id="default"):
        """
        Answer user queries, including financial data from tools.
        """
        try:
            # Prepare the conversation messages
            messages = [("system", self.system_prompt)]
            if chat_history:
                messages.extend(chat_history)

            # Use Google Finance tool for financial queries
            tool_response = ""
            if "stock" in query.lower() or "price" in query.lower():
                tool_response = self.google_finance_tool.run(query)
                tool_message = (
                    f"The following information was retrieved using the Google Finance tool: {tool_response}.\n"
                )
                # Add the tool result to the assistant's response
                messages.append(("assistant", tool_message))

            # Add the human query to the messages
            messages.append(("human", query))

            # Invoke ChatAnthropic for response generation
            response = self.llm.invoke(messages)
            # Combine tool results and Anthropic's response
            full_response = (
                f"{tool_message}\n{response.content.strip()}" if tool_response else response.content.strip()
            )
            return full_response
        except Exception as e:
            print(f"Error encountered: {e}. Retrying in 60 seconds...")
            time.sleep(60)
            return self.get_answer(query, chat_history, thread_id)
