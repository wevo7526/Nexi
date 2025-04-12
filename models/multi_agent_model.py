from langchain.agents import Tool
from langchain_community.utilities import SerpAPIWrapper
from langchain_anthropic import ChatAnthropic
from config.settings import ANTHROPIC_API_KEY
import logging
from datetime import datetime
import re
import json
from langchain.schema import SystemMessage, HumanMessage
from typing import Dict, List, Any, Generator
import time
from anthropic._exceptions import OverloadedError, RateLimitError, APIError
from langchain.agents import AgentExecutor, create_react_agent
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder, PromptTemplate
from langchain_core.messages import AIMessage
from dotenv import load_dotenv
import os
from models.agent_teams import create_report_generator, create_research_team, create_writing_team
from models.market_research_agent import MarketResearchAgent

# Configure logging
logger = logging.getLogger(__name__)

class ResearchAssistantSystem:
    """A comprehensive research assistant system with multiple specialized agents."""
    
    def __init__(self):
        """Initialize the research assistant system with multiple specialized agents."""
        # Initialize the primary language model
        self.llm = ChatAnthropic(
            model="claude-3-opus-20240229",
            anthropic_api_key=os.getenv("ANTHROPIC_API_KEY"),
            temperature=0.7,
            max_tokens=4000
        )
        
        # Initialize the market research agent
        self.market_research_agent = MarketResearchAgent()
        
        # Initialize the report generator
        self.report_generator = create_report_generator(self.llm)
        
        # Initialize the research team
        self.research_team = create_research_team(self.llm)
        
        # Initialize the writing team
        self.writing_team = create_writing_team(self.llm)
        
        # Initialize chat history
        self.chat_history = []
        
        # Enhanced prompt for research design with more detailed instructions
        self.research_prompt = """You are an expert research consultant specializing in designing comprehensive research studies. Your role is to create detailed research proposals and study designs based on the client's query.

When designing a research study, provide a comprehensive research proposal with the following sections:

1. EXECUTIVE SUMMARY
   - Brief overview of the research objectives (2-3 paragraphs)
   - Key methodology highlights with justification
   - Expected outcomes and deliverables with measurable impact
   - Timeline and budget overview with key milestones
   - Strategic value and business impact

2. RESEARCH OBJECTIVES
   - Primary research question(s) with clear formulation
   - Secondary research questions (3-5 specific questions)
   - Specific hypotheses to be tested with null and alternative forms
   - Key variables to be measured with operational definitions
   - Expected impact of the research on business decisions
   - Success criteria and evaluation metrics

3. RESEARCH METHODOLOGY
   - Detailed description of the research approach (qualitative, quantitative, or mixed methods)
   - Justification for the chosen methodology with academic references
   - Theoretical framework or conceptual model with diagram description
   - Research design type (experimental, quasi-experimental, descriptive, etc.)
   - Sampling strategy with sample size calculation
   - Data collection methods with specific procedures
   - Limitations and potential biases with mitigation strategies
   - Ethical considerations and IRB requirements
   - Quality assurance measures

4. RESEARCH INSTRUMENTS
   - Detailed focus group discussion guide with:
     * Introduction and ground rules (verbatim script)
     * Icebreaker questions (3-5 specific questions)
     * Main discussion topics with specific questions (5-7 topics)
     * Probing questions for each topic (2-3 per topic)
     * Closing questions and next steps
     * Moderator notes and facilitation tips
     * Participant screening criteria with specific demographics
     * Recruitment strategy with channels and incentives
     * Ideal group composition and size with rationale
     * Venue and setup recommendations with layout
     * Recording and note-taking procedures
     * Timeline for each section of the discussion
   
   - Comprehensive survey questionnaire with:
     * Screening questions with skip logic
     * Demographics section with specific options
     * Main survey sections with detailed questions (5-7 sections)
     * Response scales and options with justification
     * Skip logic and branching with flow diagram
     * Validation rules and error messages
     * Survey flow and progression with estimated completion time
     * Mobile vs. desktop considerations
     * Survey length optimization techniques
     * Pre-testing recommendations with specific procedures
     * Distribution method with platform selection
     * Incentive strategy for higher response rates

5. ANALYSIS PLAN
   - Data preparation procedures with cleaning steps
   - Statistical methods for quantitative data with specific tests
   - Coding framework for qualitative data with codebook
   - Software tools to be used with version information
   - Key metrics and KPIs with calculation methods
   - Visualization plan with specific chart types
   - Reporting templates with section outlines
   - Advanced analytics techniques (if applicable)
   - Data quality assessment procedures

6. IMPLEMENTATION PLAN
   - Detailed timeline with milestones and dependencies
   - Resource requirements with specific roles
   - Team roles and responsibilities with RACI matrix
   - Quality assurance measures with checkpoints
   - Risk mitigation strategies with contingency plans
   - Communication plan with stakeholder mapping
   - Budget breakdown with line items
   - Training requirements for research team

7. DELIVERABLES
   - Research report structure with section details
   - Presentation materials with slide outlines
   - Data visualizations with specific types
   - Executive summary format and length
   - Recommendations document with action items
   - Raw data and analysis files with naming conventions
   - Executive briefing with key findings
   - Implementation roadmap with timelines

For each section, provide specific, actionable details that can be directly implemented. Use bullet points, numbered lists, and clear formatting to organize information. Include examples, templates, and specific language where appropriate.

Remember to tailor your response to the specific research query provided. Focus on creating a research design that will yield valuable insights for the client's specific needs. Be thorough, precise, and professional in your recommendations."""

    def generate_research_plan(self, query, client_info=None):
        """Generate a comprehensive research proposal with a single API call."""
        try:
            # Create a comprehensive prompt that combines all aspects
            combined_prompt = f"""
            {self.research_prompt}
            
            Query: {query}
            
            Client Information: {json.dumps(client_info) if client_info else "Not provided"}
            
            Please design a comprehensive research study addressing the query above.
            Your response should be a detailed research proposal that includes all the required sections.
            Remember, you are DESIGNING the research, not conducting it.
            
            Format your response with clear section headers in ALL CAPS followed by a colon, like this:
            
            EXECUTIVE SUMMARY:
            [Your content here]
            
            RESEARCH OBJECTIVES:
            [Your content here]
            
            And so on for each section. This formatting is crucial for proper extraction.
            """
            
            # Make a single API call
            messages = [
                SystemMessage(content=combined_prompt),
                HumanMessage(content=query)
            ]
            
            response = self.llm.invoke(messages)
            
            # Parse the response into sections
            content = response.content
            
            # Extract sections using regex
            sections = {
                "executive_summary": self._extract_section(content, "Executive Summary"),
                "research_objectives": self._extract_section(content, "Research Objectives"),
                "research_methodology": self._extract_section(content, "Research Methodology"),
                "research_instruments": self._extract_section(content, "Research Instruments"),
                "analysis_plan": self._extract_section(content, "Analysis Plan"),
                "implementation_plan": self._extract_section(content, "Implementation Plan"),
                "deliverables": self._extract_section(content, "Deliverables")
            }
            
            # Add client info if provided
            if client_info:
                sections["client_info"] = client_info
                
            return sections
            
        except Exception as e:
            logger.error(f"Error generating research plan: {str(e)}")
            return {"error": str(e)}

    def _extract_section(self, text, section_name):
        """Extract specific sections from the response text."""
        try:
            # Log the section we're trying to extract
            logger.info(f"Attempting to extract section: {section_name}")
            
            # Try to find the section with a colon
            pattern = f"{section_name}:(.*?)(?=\n\n[A-Z][A-Z\s]+:|$)"
            match = re.search(pattern, text, re.DOTALL | re.IGNORECASE)
            
            if not match:
                # Try without colon but with newline
                pattern = f"{section_name}\n(.*?)(?=\n\n[A-Z][A-Z\s]+:|$)"
                match = re.search(pattern, text, re.DOTALL | re.IGNORECASE)
            
            if not match:
                # Try with any whitespace after the header
                pattern = f"{section_name}\s*(.*?)(?=\n\n[A-Z][A-Z\s]+:|$)"
                match = re.search(pattern, text, re.DOTALL | re.IGNORECASE)
            
            if match:
                content = match.group(1).strip()
                logger.info(f"Successfully extracted {section_name} with length {len(content)}")
                return content
            else:
                # If section not found, return empty string
                logger.warning(f"Section {section_name} not found in text")
                return ""
                
        except Exception as e:
            logger.error(f"Error extracting section {section_name}: {str(e)}")
            return ""

    def get_answer(self, query: str, user_id: str, chat_history: list = None) -> dict:
        """Get answer with a single API call."""
        try:
            # Determine query type
            query_type = self._determine_query_type(query)
            
            # Generate research plan with a single API call
            research_plan = self.generate_research_plan(
                query, 
                {"user_id": user_id, "query_type": query_type}
            )
            
            return research_plan
            
        except Exception as e:
            logger.error(f"Error in get_answer: {str(e)}")
            return {
                "error": str(e),
                "type": "error",
                "status": "error"
            }

    def _determine_query_type(self, query: str) -> str:
        """Determine the type of research query based on keywords."""
        focus_group_keywords = ["focus group", "focus groups", "group discussion", "group interview"]
        survey_keywords = ["survey", "questionnaire", "poll", "interview"]
        analysis_keywords = ["analysis", "analyze", "analyzing", "interpret", "interpretation"]

        if any(keyword in query.lower() for keyword in focus_group_keywords):
            return "focus_group"
        elif any(keyword in query.lower() for keyword in survey_keywords):
            return "survey"
        elif any(keyword in query.lower() for keyword in analysis_keywords):
            return "analysis"
        else:
            return "general"

    def research_stream(self, query: str, chat_history: list = None) -> Generator[Dict[str, Any], None, None]:
        """Stream research design results with a multi-agent approach."""
        try:
            # First yield a status message
            yield {
                "type": "status",
                "content": "Analyzing research requirements and designing comprehensive study..."
            }
            
            # Use the market research agent to gather initial insights
            yield {
                "type": "status",
                "content": "Gathering market insights and research context..."
            }
            
            # Stream market research insights
            market_insights = ""
            try:
                for chunk in self.market_research_agent.research_stream(query):
                    if chunk.get("type") == "final":
                        # Extract key insights from market research
                        market_insights = chunk.get("content", "")
                        yield {
                            "type": "status",
                            "content": "Market research complete. Designing research methodology..."
                        }
                        break
            except Exception as e:
                logger.warning(f"Error in market research: {str(e)}")
                market_insights = "Market research data unavailable."
            
            # Create a comprehensive prompt with market insights
            combined_prompt = f"""
            {self.research_prompt}
            
            Query: {query}
            
            Market Research Insights:
            {market_insights}
            
            Please design a comprehensive research study addressing the query above.
            Your response should be a detailed research proposal that includes all the required sections.
            Remember, you are DESIGNING the research, not conducting it.
            
            IMPORTANT: Make sure to include a detailed focus group discussion guide in the RESEARCH INSTRUMENTS section.
            The focus group guide should include:
            - Introduction and ground rules (verbatim script)
            - Icebreaker questions (3-5 specific questions)
            - Main discussion topics with specific questions (5-7 topics)
            - Probing questions for each topic (2-3 per topic)
            - Closing questions and next steps
            - Moderator notes and facilitation tips
            
            Format your response with clear section headers in ALL CAPS followed by a colon, like this:
            
            EXECUTIVE SUMMARY:
            [Your content here]
            
            RESEARCH OBJECTIVES:
            [Your content here]
            
            And so on for each section. This formatting is crucial for proper extraction.
            """
            
            # Make a single API call
            messages = [
                SystemMessage(content=combined_prompt),
                HumanMessage(content=query)
            ]
            
            # Add chat history if provided
            if chat_history and isinstance(chat_history, list):
                for msg in chat_history:
                    if msg.get('role') == 'user':
                        messages.append(HumanMessage(content=msg.get('content', '')))
                    elif msg.get('role') == 'assistant':
                        messages.append(AIMessage(content=msg.get('content', '')))
            
            # Stream the response
            try:
                response = self.llm.invoke(messages)
                
                # Yield the response in chunks
                content = response.content
                
                # Then yield the content in sections
                sections = [
                    ("Executive Summary", self._extract_section(content, "Executive Summary")),
                    ("Research Objectives", self._extract_section(content, "Research Objectives")),
                    ("Research Methodology", self._extract_section(content, "Research Methodology")),
                    ("Research Instruments", self._extract_section(content, "Research Instruments")),
                    ("Analysis Plan", self._extract_section(content, "Analysis Plan")),
                    ("Implementation Plan", self._extract_section(content, "Implementation Plan")),
                    ("Deliverables", self._extract_section(content, "Deliverables"))
                ]
                
                # Yield status updates between sections
                yield {
                    "type": "status",
                    "content": "Research design completed. Extracting detailed sections..."
                }
                
                for section_name, section_content in sections:
                    if section_content:
                        # Create section data with proper formatting for frontend
                        section_data = {
                            "title": section_name,
                            "content": section_content,
                            "type": "research"
                        }
                        
                        # Log the section data for debugging
                        logger.info(f"Extracted section: {section_name}")
                        logger.info(f"Section content length: {len(section_content)}")
                        
                        # Yield the section with proper formatting for frontend
                        yield {
                            "type": "research",
                            "section": section_name.lower().replace(" ", "_"),
                            "content": json.dumps(section_data)
                        }
                
                # Final status
                yield {
                    "type": "status",
                    "content": "Research design complete. All sections have been generated."
                }
                
                # Final content with all sections
                yield {
                    "type": "final",
                    "content": {
                        "sections": [
                            {"title": name, "content": content} 
                            for name, content in sections if content
                        ],
                        "metadata": {
                            "query": query,
                            "timestamp": datetime.now().isoformat()
                        }
                    }
                }
                
                # Log completion
                logger.info("Research stream completed successfully")
            except Exception as e:
                logger.error(f"Error in LLM response: {str(e)}")
                yield {
                    "type": "error",
                    "content": f"Error generating research design: {str(e)}"
                }
        except Exception as e:
            logger.error(f"Error in research_stream: {str(e)}")
            yield {
                "type": "error",
                "content": f"Error in research stream: {str(e)}"
            }