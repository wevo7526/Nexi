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
        Combine insights from the primary and secondary agents and return structured output.
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

            # Structure the output into segments
            structured_response = {
                "agent1": {
                    "keyFindings": self._extract_key_findings(primary_response),
                    "recommendations": self._extract_recommendations(primary_response)
                },
                "agent2": {
                    "analysis": self._generate_analysis(secondary_response)
                }
            }

            return structured_response
        except Exception as e:
            return {"error": f"Error occurred while generating advice: {str(e)}"}

    def _extract_key_findings(self, response):
        """
        Extract key findings from the response.
        For simplicity, this splits lines starting with `1.`, `2.`, etc.
        """
        findings = []
        for line in response.split('\n'):
            if line.strip().startswith(("1.", "2.", "3.")):
                findings.append(line.strip())
        return findings

    def _extract_recommendations(self, response):
        """
        Extract recommendations from the response.
        Use custom logic or predefined formats (e.g., lines starting with `-`).
        """
        recommendations = []
        for line in response.split('\n'):
            if line.strip().startswith("- "):  # Recommendations start with a dash
                recommendations.append(line.strip())
        return recommendations

    def _generate_analysis(self, response):
        """
        Generate graphs, tables, or other supporting analysis dynamically based on response.
        For simplicity, this function mocks graph and table generation.
        """
        if "graph" in response.lower():
            graph_url = "https://example.com/generated-graph.png"  # Replace with actual graph generation logic
        else:
            graph_url = None

        if "table" in response.lower():
            table_data = {
                "headers": ["Metric", "Value"],
                "rows": [
                    ["Example 1", "Value 1"],
                    ["Example 2", "Value 2"]
                ]
            }
        else:
            table_data = None

        return {
            "graph": graph_url,
            "table": table_data
        }
        