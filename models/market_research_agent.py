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
        self.current_thought = ""
        print("\n=== Starting new research session ===\n")
        
    def on_llm_start(self, *args, **kwargs):
        """Run when LLM starts running."""
        print("\n🤔 LLM is thinking...\n")

    def on_llm_new_token(self, token: str, **kwargs):
        """Run on new token. Accumulate thought tokens."""
        if token.strip().startswith("Thought:"):
            if self.current_thought:
                self.tokens.append({
                    "type": "thought",
                    "content": self.current_thought.strip()
                })
                print(f"\n💭 Thought: {self.current_thought.strip()}\n")
            self.current_thought = token
        elif token.strip().startswith("Observation:"):
            if self.current_thought:
                self.tokens.append({
                    "type": "thought",
                    "content": self.current_thought.strip()
                })
                print(f"\n💭 Thought: {self.current_thought.strip()}\n")
            self.current_thought = ""
            self.tokens.append({
                "type": "observation",
                "content": token.strip()
            })
            print(f"\n🔍 {token.strip()}\n")
        elif self.current_thought:
            self.current_thought += token
        
    def on_llm_end(self, *args, **kwargs):
        """Run when LLM ends running."""
        if self.current_thought:
            self.tokens.append({
                "type": "thought",
                "content": self.current_thought.strip()
            })
            print(f"\n💭 Final Thought: {self.current_thought.strip()}\n")
            self.current_thought = ""
        
    def on_agent_action(self, action, **kwargs):
        """Run on agent action."""
        if self.current_thought:
            self.tokens.append({
                "type": "thought",
                "content": self.current_thought.strip()
            })
            print(f"\n💭 Thought: {self.current_thought.strip()}\n")
            self.current_thought = ""
            
        action_content = f"Action: {action.tool}\nAction Input: {action.tool_input}"
        self.tokens.append({
            "type": "action",
            "content": action_content
        })
        print(f"\n🔧 {action_content}\n")
        
    def on_agent_finish(self, finish, **kwargs):
        """Run on agent end."""
        if self.current_thought:
            self.tokens.append({
                "type": "thought",
                "content": self.current_thought.strip()
            })
            print(f"\n💭 Final Thought: {self.current_thought.strip()}\n")
            self.current_thought = ""
            
        final_content = finish.return_values["output"] if finish.return_values else ""
        self.tokens.append({
            "type": "final",
            "content": final_content
        })
        print(f"\n✨ Final Answer:\n{final_content}\n")
        print("\n=== Research session completed ===\n")

class MarketResearchAgent:
    def __init__(self):
        print("\n🔄 Initializing Market Research Agent...")
        
        # Initialize the language model
        self.llm = ChatAnthropic(
            model="claude-3-opus-20240229",
            anthropic_api_key=os.getenv("ANTHROPIC_API_KEY"),
            temperature=0.7,
            streaming=True
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
                description="Useful for searching the internet for recent information about markets, companies, industries, and trends. Input should be a search query."
            )
        ]
        
        # Create the agent prompt
        template = """You are an expert market research analyst with access to real-time market data. 
Your goal is to provide comprehensive, data-driven market research analysis.

Guidelines:
- Always cite your sources and provide recent data when available
- Structure your analysis with clear sections
- Include market size, growth rates, key players, and trends when relevant
- Consider both opportunities and challenges in the market
- Provide actionable insights for business decision-makers

You have access to the following tools:

{tools}

Use the following format STRICTLY:

Question: the input question you must answer
Thought: you should always think about what to do next
Action: the action to take, should be one of [{tool_names}]
Action Input: the input to the action
Observation: the result of the action
... (this Thought/Action/Action Input/Observation can repeat N times)
Thought: I now know enough to provide a comprehensive analysis
Final Answer: provide a well-structured analysis with the following sections:
1. Market Overview
2. Key Players and Competition
3. Growth Trends and Opportunities
4. Risks and Challenges
5. Actionable Recommendations

Begin! Remember to ALWAYS follow the format above, starting with "Thought:" before any action.

Previous conversation:
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
            
            # Create callback handler for streaming
            handler = StreamingCallbackHandler()
            
            # Create agent executor with streaming
            agent_executor = AgentExecutor.from_agent_and_tools(
                agent=self.agent,
                tools=self.tools,
                handle_parsing_errors=True,
                max_iterations=5,  # Increased from 3 to 5
                max_execution_time=300,  # 5 minutes timeout
                callbacks=[handler]
            )
            print("✅ Agent executor created")
            
            # Run the agent
            print("\n🚀 Running agent...\n")
            response = agent_executor.invoke({
                "input": query,
                "chat_history": self.chat_history
            })
            
            # Update chat history
            self.chat_history.extend([
                HumanMessage(content=query),
                AIMessage(content=response["output"])
            ])
            print("\n✅ Chat history updated")
            
            # Stream each step
            for token in handler.tokens:
                print(f"\n📤 Streaming: {token['type']}")
                yield {
                    "status": "streaming",
                    "type": token["type"],
                    "content": token["content"]
                }
            
            # Send final response
            print("\n📤 Streaming final response")
            yield {
                "status": "complete",
                "type": "final",
                "content": response["output"]
            }
            
        except Exception as e:
            print(f"\n❌ Error during research: {str(e)}")
            yield {
                "status": "error",
                "type": "error",
                "content": str(e)
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
            for msg in self.chat_history
        ] 