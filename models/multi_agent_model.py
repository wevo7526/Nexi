from langchain.agents import Tool
from langchain_community.utilities import SerpAPIWrapper
from langchain_anthropic import ChatAnthropic
from config.settings import API_KEY

class MultiAgentConsultant:
    def __init__(self):
        # Initialize ChatAnthropic for both agents
        self.primary_agent = ChatAnthropic(
            model="claude-3-5-sonnet-20240620",
            temperature=0,
            max_tokens=1024,
            api_key=API_KEY
        )
        self.secondary_agent = ChatAnthropic(
            model="claude-3-5-sonnet-20240620",
            temperature=0,
            max_tokens=1024,
            api_key=API_KEY
        )

        # Define the system prompts
        self.primary_prompt = (
            "You are the primary management consultant, focusing on strategic insights "
            "for complex business problems. Provide high-level, actionable strategies."
        )
        self.secondary_prompt = (
            "You are the secondary consultant specializing in detailed research. Use tools and available data to deliver in-depth analysis."
        )

        # Define tools (e.g., SERP API for external search)
        serp_tool = SerpAPIWrapper()  # Ensure SERP API key is configured
        self.tools = [
            Tool(
                name="SearchTool",
                func=serp_tool.run,
                description="Search the web for information related to the query."
            )
        ]

    def get_advice(self, query, thread_id="default"):
        """
        Combine insights from the primary and secondary agents.
        """
        try:
            # Generate strategy insights (Primary Agent)
            primary_response = self.primary_agent.invoke([
                ("system", self.primary_prompt),
                ("human", f"Strategy required: {query}")
            ]).content.strip()

            # Generate research insights (Secondary Agent)
            secondary_response = self.secondary_agent.invoke([
                ("system", self.secondary_prompt),
                ("human", f"Research needed: {query}")
            ]).content.strip()

            # Combine results
            return (
                f"**Strategic Insights (Primary Agent):**\n{primary_response}\n\n"
                f"**Detailed Research (Secondary Agent):**\n{secondary_response}"
            )
        except Exception as e:
            return f"Error occurred while generating advice: {e}"
