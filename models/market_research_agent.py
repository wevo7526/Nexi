from typing import List, Dict, Any, Generator
from langchain_anthropic import ChatAnthropic
from langchain.agents import AgentExecutor, create_react_agent
from langchain_core.tools import Tool
from langchain_community.utilities import SerpAPIWrapper
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder, PromptTemplate
from langchain_core.messages import AIMessage, HumanMessage
from langchain.callbacks.base import BaseCallbackHandler
import json
import os
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

# Validate required environment variables
required_env_vars = {
    "ANTHROPIC_API_KEY": os.getenv("ANTHROPIC_API_KEY"),
    "SERPAPI_API_KEY": os.getenv("SERPAPI_API_KEY")
}

missing_vars = [var for var, value in required_env_vars.items() if not value]
if missing_vars:
    raise EnvironmentError(f"Missing required environment variables: {', '.join(missing_vars)}")

class StreamingCallbackHandler(BaseCallbackHandler):
    """Callback handler for streaming intermediate steps."""
    
    def __init__(self):
        self.tokens = []
        self.current_content = ""
        print("\n=== Starting new research session ===\n")
        
    def on_llm_start(self, *args, **kwargs):
        """Run when LLM starts running."""
        print("\n🤔 LLM is thinking...\n")

    def on_llm_new_token(self, token: str, **kwargs):
        """Process tokens and emit complete thoughts/actions/observations."""
        self.current_content += token
        
        if '\n' in self.current_content:
            lines = self.current_content.split('\n')
            self.current_content = lines[-1]
            
            for line in lines[:-1]:
                if line.strip():
                    self._process_line(line.strip())
                
    def _process_line(self, line: str):
        """Process a complete line and categorize it appropriately."""
        if not line:
            return
            
        lower_line = line.lower()
        
        # Detect the type of content
        if lower_line.startswith("thought:"):
            self._emit_token("thought", line)
        elif lower_line.startswith("action:"):
            self._emit_token("action", line)
        elif lower_line.startswith("action input:"):
            if self.tokens and self.tokens[-1]["type"] == "action":
                self.tokens[-1]["content"] += f"\n{line}"
            else:
                self._emit_token("action", line)
        elif lower_line.startswith("observation:"):
            self._emit_token("observation", line)
        elif lower_line.startswith("final answer:"):
            self._emit_token("final", line[13:].strip())  # Remove "Final Answer:" prefix
        else:
            # If it's a continuation of previous content
            if self.tokens and self.tokens[-1]["type"] in ["thought", "observation", "action", "final"]:
                self.tokens[-1]["content"] += f"\n{line}"
            else:
                self._emit_token("thought", line)
    
    def _emit_token(self, type_: str, content: str):
        """Emit a token with proper formatting."""
        if not content.strip():
            return
            
        token = {
            "status": "streaming",
            "type": type_,
            "content": content.strip()
        }
        self.tokens.append(token)
        print(f"\n💭 Emitting {type_}: {content.strip()}\n")

    def on_llm_end(self, *args, **kwargs):
        """Process any remaining content."""
        if self.current_content.strip():
            self._process_line(self.current_content.strip())
        self.current_content = ""

    def on_agent_action(self, action, **kwargs):
        """Handle agent actions with proper formatting."""
        action_str = f"Action: {action.tool}\nAction Input: {action.tool_input}"
        self._emit_token("action", action_str)
        
    def on_agent_finish(self, finish, **kwargs):
        """Handle agent completion with proper formatting."""
        if finish.return_values and "output" in finish.return_values:
            output = finish.return_values["output"]
            if not output.lower().startswith("final answer:"):
                output = "Final Answer: " + output
            self._emit_token("final", output)
        print("\n=== Research session completed ===\n")

class MarketResearchAgent:
    def __init__(self):
        print("\n🔄 Initializing Market Research Agent...")
        
        # Initialize the language model
        self.llm = ChatAnthropic(
            model="claude-3-5-sonnet-20240620",
            anthropic_api_key=os.getenv("ANTHROPIC_API_KEY"),
            temperature=0.7,
            streaming=True,
            max_tokens=4000  # Limit token usage
        )
        print("✅ LLM initialized")
        
        # Initialize SerpAPI tool
        self.search = SerpAPIWrapper(
            serpapi_api_key=os.getenv("SERPAPI_API_KEY")
        )
        print("✅ Search tool initialized")
        
        # Define tools
        self.tools = [
            Tool(
                name="Search",
                func=self.search.run,
                description="A powerful search tool for finding recent market information, company data, industry trends, and statistics. Use specific search queries for best results."
            )
        ]
        
        # Simplified prompt template to reduce token usage
        template = """You are an expert market research analyst. Provide detailed market analysis using real-time data.

Guidelines:
- Use specific search queries to gather targeted information
- Always cite sources and dates
- Use concrete numbers and statistics
- Focus on actionable insights

Available Tools:
{tools}

Format (YOU MUST FOLLOW THIS FORMAT EXACTLY):
Question: [input question]
Thought: [reasoning about next steps]
Action: [one of: {tool_names}]
Action Input: [specific search query]
Observation: [search result]
... (repeat if needed)
Thought: [final analysis reasoning]
Final Answer: [structured analysis]

1. Executive Summary
2. Market Overview
3. Competitive Analysis
4. Trends & Opportunities
5. Risks & Challenges
6. Recommendations

Previous conversation (last 3):
{chat_history}

Question: {input}
{agent_scratchpad}"""

        # Create the prompt template with all required variables
        self.prompt = PromptTemplate.from_template(template)
        print("✅ Prompt template created")
        
        # Create the agent using create_react_agent
        self.agent = create_react_agent(
            llm=self.llm,
            tools=self.tools,
            prompt=self.prompt
        )
        print("✅ Agent created")
        
        self.chat_history = []
        print("✅ Market Research Agent initialization complete\n")

    def research_stream(self, query: str) -> Generator[Dict[str, Any], None, None]:
        """
        Stream the research process and results.
        
        Args:
            query (str): The research question or topic to analyze
            
        Yields:
            Dict[str, Any]: Stream of thoughts, actions, and the final analysis
        """
        try:
            print(f"\n📝 Starting research for query: {query}")
            handler = StreamingCallbackHandler()
            
            agent_executor = AgentExecutor.from_agent_and_tools(
                agent=self.agent,
                tools=self.tools,
                handle_parsing_errors=True,
                max_iterations=6,  # Increased from 4
                max_execution_time=300,  # Increased from 240
                callbacks=[handler],
                early_stopping_method="force",
                verbose=True
            )
            
            try:
                # Run the agent
                response = agent_executor.invoke({
                    "input": query,
                    "chat_history": self.chat_history[-3:]
                })
                
                # Update chat history
                self.chat_history.extend([
                    HumanMessage(content=query),
                    AIMessage(content=response["output"])
                ])
                
                # Stream tokens
                for token in handler.tokens:
                    yield token
                
                # Ensure final response is sent
                if response.get("output"):
                    final_content = response["output"]
                    if not final_content.lower().startswith("final answer:"):
                        final_content = "Final Answer: " + final_content
                        
                    yield {
                        "status": "complete",
                        "type": "final",
                        "content": final_content
                    }
                
            except Exception as e:
                error_msg = f"Error during research execution: {str(e)}"
                print(f"\n❌ {error_msg}")
                yield {
                    "status": "error",
                    "type": "error",
                    "content": error_msg
                }
            
        except Exception as e:
            error_msg = f"Critical error in research_stream: {str(e)}"
            print(f"\n❌ {error_msg}")
            yield {
                "status": "error",
                "type": "error",
                "content": error_msg
            }

    def get_chat_history(self) -> List[Dict[str, str]]:
        """
        Get the chat history in a structured format.
        
        Returns:
            List[Dict[str, str]]: List of messages with role and content
        """
        return [
            {
                "role": "human" if isinstance(msg, HumanMessage) else "ai",
                "content": msg.content
            }
            for msg in self.chat_history[-5:]  # Only return last 5 messages
        ]

    def get_market_trends(self) -> Dict[str, Any]:
        """
        Get current market trends and insights.
        
        Returns:
            Dict[str, Any]: Market trends and insights data
        """
        try:
            print("\n📊 Analyzing market trends...")
            
            # Define trend categories and their search queries
            trend_queries = {
                'Overall Market': 'current market trends and economic indicators 2024',
                'Industry Specific': 'industry growth rates and market size 2024',
                'Consumer Behavior': 'consumer spending trends and preferences 2024',
                'Economic Indicators': 'GDP growth, inflation, and interest rates 2024'
            }
            
            trends = []
            insights = []
            
            for category, query in trend_queries.items():
                # Search for trend data
                search_result = self.search.run(query)
                
                # Analyze the search result to determine trend direction and value
                analysis_prompt = f"""Analyze the following market data and provide:
1. The current value or metric
2. The trend direction (up/down/stable)
3. The percentage change
4. A brief description

Data: {search_result}

Format the response as JSON with these fields:
{{
    "value": "string",
    "trend": "up/down/stable",
    "change": "string",
    "description": "string"
}}"""

                analysis = self.llm.invoke(analysis_prompt)
                trend_data = json.loads(analysis)
                trend_data['category'] = category
                trends.append(trend_data)
                
                # Generate insights based on the trend
                insight_prompt = f"""Based on this market trend:
{json.dumps(trend_data, indent=2)}

Generate a key insight with:
1. A clear title
2. A detailed description
3. The impact level (high/medium/low)
4. The category

Format the response as JSON with these fields:
{{
    "title": "string",
    "description": "string",
    "impact": "high/medium/low",
    "category": "string"
}}"""

                insight = self.llm.invoke(insight_prompt)
                insight_data = json.loads(insight)
                insight_data['date'] = datetime.now().isoformat()
                insights.append(insight_data)
            
            return {
                'status': 'success',
                'trends': trends,
                'insights': insights
            }
            
        except Exception as e:
            print(f"Error getting market trends: {str(e)}")
            return {
                'status': 'error',
                'message': str(e)
            } 