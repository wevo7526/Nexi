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

# Configure logging
logger = logging.getLogger(__name__)

class PrimaryResearchConsultant:
    """A primary research consultant that designs comprehensive research studies."""
    
    def __init__(self):
        """Initialize the research consultant with a single LLM instance."""
        self.llm = ChatAnthropic(
            model="claude-3-opus-20240229",
            anthropic_api_key=os.getenv("ANTHROPIC_API_KEY"),
            temperature=0.7,
            max_tokens=4000
        )
        self.chat_history = []

        # Enhanced prompt for research design
        self.research_prompt = """You are an expert research consultant specializing in designing comprehensive research studies. Your role is to create detailed research proposals and study designs based on the client's query.

When designing a research study, provide a comprehensive research proposal with the following sections:

1. EXECUTIVE SUMMARY
   - Brief overview of the research objectives
   - Key methodology highlights
   - Expected outcomes and deliverables
   - Timeline and budget overview

2. RESEARCH OBJECTIVES
   - Primary research question(s)
   - Secondary research questions
   - Specific hypotheses to be tested
   - Key variables to be measured
   - Expected impact of the research

3. RESEARCH METHODOLOGY
   - Detailed description of the research approach (qualitative, quantitative, or mixed methods)
   - Justification for the chosen methodology
   - Theoretical framework or conceptual model
   - Research design type (experimental, quasi-experimental, descriptive, etc.)
   - Limitations and potential biases
   - Ethical considerations

4. RESEARCH INSTRUMENTS
   - Detailed focus group discussion guide with:
     * Introduction and ground rules
     * Icebreaker questions
     * Main discussion topics with specific questions
     * Probing questions for each topic
     * Closing questions
     * Moderator notes and facilitation tips
     * Participant screening criteria
     * Recruitment strategy
     * Ideal group composition and size
     * Venue and setup recommendations
     * Recording and note-taking procedures
   
   - Comprehensive survey questionnaire with:
     * Screening questions
     * Demographics section
     * Main survey sections with detailed questions
     * Response scales and options
     * Skip logic and branching
     * Validation rules
     * Survey flow and progression
     * Mobile vs. desktop considerations
     * Survey length optimization
     * Pre-testing recommendations
     * Distribution method

5. ANALYSIS PLAN
   - Data preparation procedures
   - Statistical methods for quantitative data
   - Coding framework for qualitative data
   - Software tools to be used
   - Key metrics and KPIs
   - Visualization plan
   - Reporting templates

6. IMPLEMENTATION PLAN
   - Detailed timeline with milestones
   - Resource requirements
   - Team roles and responsibilities
   - Quality assurance measures
   - Risk mitigation strategies
   - Communication plan

7. DELIVERABLES
   - Research report structure
   - Presentation materials
   - Data visualizations
   - Executive summary
   - Recommendations document
   - Raw data and analysis files

For each section, provide specific, actionable details that can be directly implemented. Use bullet points, numbered lists, and clear formatting to organize information. Include examples where appropriate.

Remember to tailor your response to the specific research query provided. Focus on creating a research design that will yield valuable insights for the client's specific needs."""

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
            
            # Add metadata
            sections["timestamp"] = datetime.now().isoformat()
            if client_info:
                sections["client_info"] = client_info
                
            return sections
            
        except Exception as e:
            logger.error(f"Error generating research plan: {str(e)}")
            return {"error": str(e)}

    def _extract_section(self, text, section_name):
        """Extract specific sections from the response text."""
        try:
            # Try to find the section with a colon
            pattern = f"{section_name}:(.*?)(?=\n\n|$)"
            match = re.search(pattern, text, re.DOTALL | re.IGNORECASE)
            
            if not match:
                # Try without colon but with newline
                pattern = f"{section_name}\n(.*?)(?=\n\n|$)"
                match = re.search(pattern, text, re.DOTALL | re.IGNORECASE)
            
            if not match:
                # Try with any whitespace after the header
                pattern = f"{section_name}\s*(.*?)(?=\n\n|$)"
                match = re.search(pattern, text, re.DOTALL | re.IGNORECASE)
            
            if match:
                return match.group(1).strip()
            else:
                # If section not found, return empty string
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
            
    def research_stream(self, query: str) -> Generator[Dict[str, Any], None, None]:
        """Stream research design results with a single API call."""
        try:
            # Create a comprehensive prompt
            combined_prompt = f"""
            {self.research_prompt}
            
            Query: {query}
            
            Please design a comprehensive research study addressing the query above.
            Your response should be a detailed research proposal that includes all the required sections.
            Remember, you are DESIGNING the research, not conducting it.
            """
            
            # Make a single API call
            messages = [
                SystemMessage(content=combined_prompt),
                HumanMessage(content=query)
            ]
            
            # Stream the response
            response = self.llm.invoke(messages)
            
            # Yield the response in chunks
            content = response.content
            
            # First yield a status message
            yield {
                "type": "status",
                "content": "Research design completed successfully"
            }
            
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
            
            for section_name, section_content in sections:
                if section_content:
                    yield {
                        "type": "content",
                        "section": section_name.lower().replace(" ", "_"),
                        "content": section_content
                    }
            
            # Final status
            yield {
                "type": "status",
                "content": "Research design complete"
            }
            
        except Exception as e:
            logger.error(f"Error in research_stream: {str(e)}")
            yield {
                "type": "error",
                "content": f"Error: {str(e)}"
            }