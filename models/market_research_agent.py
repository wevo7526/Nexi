from typing import List, Dict, Any, Generator
from langchain_anthropic import ChatAnthropic
from langchain.agents import AgentExecutor, create_react_agent
from langchain_core.tools import Tool
from langchain_community.utilities import SerpAPIWrapper
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder, PromptTemplate
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain.callbacks.base import BaseCallbackHandler
import json
import os
from dotenv import load_dotenv
import time
import logging
from anthropic._exceptions import OverloadedError, RateLimitError, APIError

# Configure logging
logger = logging.getLogger(__name__)

def retry_with_backoff(func, max_retries=3, base_delay=2, max_delay=10):
    """Execute a function with exponential backoff retry logic."""
    last_error = None
    for attempt in range(max_retries):
        try:
            return func()
        except Exception as e:
            last_error = e
            # Handle Anthropic API errors
            if hasattr(e, 'response'):
                try:
                    response = e.response
                    if response.status_code == 529:
                        if attempt < max_retries - 1:
                            delay = min(base_delay * (2 ** attempt), max_delay)
                            logger.warning(f"Attempt {attempt + 1} failed with overloaded error. Retrying in {delay} seconds...")
                            time.sleep(delay)
                            continue
                        else:
                            raise Exception("The AI service is currently experiencing high demand. Please try again in a few moments.")
                    elif response.status_code == 429:
                        if attempt < max_retries - 1:
                            delay = min(base_delay * (2 ** attempt), max_delay)
                            logger.warning(f"Attempt {attempt + 1} failed with rate limit error. Retrying in {delay} seconds...")
                            time.sleep(delay)
                            continue
                        else:
                            raise Exception("Rate limit exceeded. Please try again in a few moments.")
                    else:
                        error_data = response.json()
                        error_message = error_data.get('error', {}).get('message', str(e))
                        logger.error(f"API Error: {error_message}")
                        raise Exception(error_message)
                except Exception as parse_error:
                    logger.error(f"Error parsing API response: {str(parse_error)}")
                    raise Exception(str(e))
            else:
                logger.error(f"Unexpected error: {str(e)}")
                raise
                
    if last_error:
        raise last_error

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
        
        # Initialize the language model with better error handling
        try:
            self.llm = ChatAnthropic(
                model="claude-3-5-sonnet-20240620",
                anthropic_api_key=os.getenv("ANTHROPIC_API_KEY"),
                temperature=0.7,
                streaming=True,
                max_tokens=4000,
                timeout=60,
                max_retries=3
            )
            print("✅ LLM initialized")
        except Exception as e:
            logger.error(f"Failed to initialize LLM: {str(e)}")
            raise
        
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
        
        # Enhanced prompt template for comprehensive research
        template = """You are an expert market research analyst specializing in comprehensive market research. Your role is to conduct thorough research using both quantitative and qualitative methods, including exploratory, descriptive, and predictive research approaches.

Research Types to Consider:
1. Exploratory Research
   - Market trends and patterns
   - Consumer behavior insights
   - Emerging opportunities
   - Problem identification
   - Hypothesis generation

2. Descriptive Research
   - Market size and segmentation
   - Competitive landscape
   - Customer demographics
   - Product/service usage patterns
   - Brand perception

3. Predictive Research
   - Market forecasting
   - Trend analysis
   - Consumer behavior prediction
   - Risk assessment
   - Opportunity identification

Research Methods:
1. Quantitative Methods
   - Statistical analysis
   - Surveys and questionnaires
   - Market metrics
   - Data modeling
   - Performance indicators

2. Qualitative Methods
   - Focus groups
   - In-depth interviews
   - Ethnographic research
   - Content analysis
   - Expert opinions

Guidelines:
- Use specific search queries to gather targeted information
- Always cite sources and dates
- Use concrete numbers and statistics
- Focus on actionable insights
- Combine multiple research types and methods
- Provide comprehensive analysis with clear recommendations

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

Research Report Structure:
1. Executive Summary
2. Research Objectives
3. Methodology Overview
   - Research Types Used
   - Methods Applied
   - Data Sources
4. Market Overview
5. Exploratory Findings
6. Descriptive Analysis
7. Predictive Insights
8. Competitive Analysis
9. Consumer Insights
10. Recommendations
    - Short-term Actions
    - Long-term Strategy
    - Risk Mitigation
11. Implementation Plan
12. Success Metrics

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
        """
        try:
            print(f"\n📝 Starting comprehensive research for query: {query}")
            handler = StreamingCallbackHandler()
            
            agent_executor = AgentExecutor.from_agent_and_tools(
                agent=self.agent,
                tools=self.tools,
                handle_parsing_errors=True,
                max_iterations=8,
                max_execution_time=600,
                callbacks=[handler],
                early_stopping_method="force",
                verbose=True
            )
            
            try:
                # Run the agent with enhanced retry logic
                def _execute_research():
                    try:
                        return agent_executor.invoke({
                            "input": query,
                            "chat_history": self.chat_history[-3:]
                        })
                    except Exception as e:
                        if hasattr(e, 'response'):
                            response = e.response
                            if response.status_code == 529:
                                raise Exception("The AI service is currently experiencing high demand. Please try again in a few moments.")
                            elif response.status_code == 429:
                                raise Exception("Rate limit exceeded. Please try again in a few moments.")
                            else:
                                error_data = response.json()
                                error_message = error_data.get('error', {}).get('message', str(e))
                                raise Exception(error_message)
                        raise
                
                response = retry_with_backoff(_execute_research)
                
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
                error_msg = str(e)
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