import time
from langchain_anthropic import ChatAnthropic
from data.data_loader import load_data
from config.settings import API_KEY, SERPAPI_API_KEY  # Import the loaded SERP_API_KEY
import requests

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

        # Define the system prompt
        self.system_prompt = (
            "You are a wealth manager seeking to provide financial advice and strategies for any given financial question. "
            "You are an AI Wealth Manager designed to assist clients in achieving their financial goals. Your responsibilities include assessing clients' financial situations, creating and updating comprehensive financial plans, and providing strategic investment advice. You should develop personalized investment strategies, manage diversified portfolios, and make adjustments as needed to align with clients' objectives. Additionally, you must implement tax optimization strategies, coordinate with tax professionals for compliance, and assist with retirement planning by designing savings plans and advising on income distribution. Collaborate in estate and legacy planning by suggesting efficient wealth transfer strategies and helping clients create wills or trusts. Evaluate financial risks and recommend suitable insurance solutions while offering strategies for debt management. Provide educational planning support, guiding clients on saving for future educational expenses. Educate clients about financial concepts and market trends, and regularly monitor and report on their financial progress. Continuously adjust plans to align with evolving needs, adhering to legal, regulatory, and ethical standards at all times. "
            "Use tools like SERP API to gather data as needed. Respond concisely and directly to the user's query.\n\n{context}"
        )

    def query_serp_api(self, query):
        """
        Use SERP API to get more detailed and accurate data.
        """
        try:
            url = "https://serpapi.com/search"
            params = {
                "q": query,
                "api_key": SERPAPI_API_KEY,
                "engine": "google"
            }
            response = requests.get(url, params=params)
            response.raise_for_status()
            data = response.json()

            # Parse the relevant information from the SERP API response
            if "organic_results" in data:
                results = data["organic_results"]
                if results:
                    top_result = results[0]
                    title = top_result.get("title", "No title")
                    snippet = top_result.get("snippet", "No snippet")
                    link = top_result.get("link", "No link")
                    return f"Title: {title}\nSnippet: {snippet}\nLink: {link}"
                else:
                    return "No relevant data found in SERP API response."
            else:
                return "No relevant data found in SERP API response."
        except requests.exceptions.RequestException as e:
            print(f"SERP API Request Error: {e}")
            return "No data retrieved from SERP API due to a request error."
        except Exception as e:
            print(f"SERP API Error: {e}")
            return "No data retrieved from SERP API due to an error."

    def get_answer(self, query, chat_history=None, thread_id="default"):
        """
        Answer user queries, combining data from SERP API.
        """
        try:
            # Prepare the conversation messages
            messages = [("system", self.system_prompt)]
            if chat_history:
                messages.extend(chat_history)

            # Use SERP API for financial queries
            tool_response = ""
            if "stock" in query.lower() or "price" in query.lower() or "market" in query.lower():
                serp_api_result = self.query_serp_api(query)
                tool_response = f"SERP API: {serp_api_result}"
                messages.append(("assistant", tool_response))

            # Add the human query to the messages
            messages.append(("human", query))

            # Invoke ChatAnthropic for response generation
            response = self.llm.invoke(messages)

            # Combine tool results and Anthropic's response
            full_response = (
                f"{tool_response}\n{response.content.strip()}" if tool_response else response.content.strip()
            )
            return full_response
        except Exception as e:
            print(f"Error encountered: {e}. Retrying in 60 seconds...")
            time.sleep(60)
            return self.get_answer(query, chat_history, thread_id)