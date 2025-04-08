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
                    if response.status_code == 429:  # Rate limit
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

class PrimaryResearchConsultant:
    def __init__(self):
        # Initialize specialized agents with research-focused prompts
        self.research_designer = ChatAnthropic(
            model="claude-3-5-sonnet-20240620",
            temperature=0.3,
            max_tokens=4096,
            api_key=ANTHROPIC_API_KEY
        )
        self.focus_group_facilitator = ChatAnthropic(
            model="claude-3-5-sonnet-20240620",
            temperature=0.7,  # Increased for more creative responses
            max_tokens=4096,  # Increased to allow for more detailed responses
            api_key=ANTHROPIC_API_KEY
        )
        self.survey_designer = ChatAnthropic(
            model="claude-3-5-sonnet-20240620",
            temperature=0.1,
            max_tokens=2048,
            api_key=ANTHROPIC_API_KEY
        )
        self.data_analyst = ChatAnthropic(
            model="claude-3-5-sonnet-20240620",
            temperature=0,
            max_tokens=2048,
            api_key=ANTHROPIC_API_KEY
        )

        # Enhanced prompts for research-focused analysis
        self.research_designer_prompt = """You are an expert in marketing research design and methodology.
        Your role is to design comprehensive research plans. You MUST format your response with the following sections:

        Research Objectives:
        - List 3-5 key research objectives with specific, measurable outcomes
        - Include detailed research questions that address each objective
        - Define specific success metrics with target values
        - Explain how each objective aligns with business goals

        Methodology:
        - Specify detailed research approach with rationale
        - Detail data collection methods with specific tools and techniques
        - Outline analysis techniques with statistical methods
        - Include sampling strategy and justification
        - Describe data quality assurance measures

        Sample Design:
        - Define target audience with specific demographics and psychographics
        - Specify sample size with statistical justification
        - Detail recruitment criteria and screening process
        - Include sampling frame and selection method
        - Address potential sampling biases and mitigation strategies

        Timeline:
        - List major project phases with specific dates
        - Include key milestones and deliverables
        - Specify duration estimates with buffer time
        - Detail resource allocation per phase
        - Include contingency planning

        Budget Considerations:
        - List major cost components with detailed breakdowns
        - Include resource requirements with specific roles
        - Note potential constraints and risk factors
        - Provide cost optimization strategies
        - Include ROI projections

        Use clear section headers exactly as shown above, followed by detailed bullet points. Each point should be specific and actionable."""

        self.focus_group_prompt = """You are an experienced focus group facilitator and moderator specializing in brand research.
        Your role is to design comprehensive focus group discussion guides. You MUST format your response with the following sections:

        Discussion Guide:
        - Welcome and introduction script with exact wording and timing
        - Detailed session overview with specific time allocations
        - Key discussion topics with specific time allocations and probing questions
        - Main questions with detailed probing techniques and follow-up prompts
        - Time management plan with buffer periods and contingency plans
        - Participant engagement strategies for different personality types
        - Handling sensitive topics and difficult participants with specific scenarios
        - Managing group dynamics and power dynamics with intervention techniques
        - Ensuring all voices are heard with specific facilitation methods
        - Closing remarks and next steps
        - Detailed discussion flow with timing for each section
        - Specific questions to explore brand perceptions and experiences
        - Techniques for uncovering emotional connections to the brand
        - Methods for gathering specific examples and stories
        - Strategies for handling group consensus and dissent

        Moderator Techniques:
        - Ice-breaker activities with specific instructions and timing
        - Engagement strategies for different personality types (quiet, dominant, etc.)
        - Handling difficult participants with specific scenarios and responses
        - Managing group dynamics with intervention techniques and timing
        - Building rapport and trust through specific facilitation methods
        - Managing time effectively with specific checkpoints
        - Handling sensitive topics with appropriate framing
        - Ensuring productive discussion with specific redirection techniques
        - Managing group energy levels with specific techniques
        - Handling technical difficulties and interruptions
        - Managing recording equipment and note-taking
        - Ensuring participant comfort and engagement
        - Handling late arrivals and early departures
        - Managing group size variations
        - Ensuring confidentiality and ethical conduct

        Exercises:
        - Group activities with detailed instructions and timing
        - Stimulus materials with specific usage guidelines and setup
        - Interactive elements with setup requirements and materials
        - Time management for each exercise with buffer time
        - Participant preparation requirements and materials
        - Materials needed for each exercise with specifications
        - Success criteria for each activity with metrics
        - Debriefing procedures with specific questions
        - Brand association exercises with specific prompts
        - Visual brand mapping activities
        - Storytelling exercises for brand experiences
        - Competitive brand comparison activities
        - Future brand vision exercises
        - Brand personality assessment activities
        - Brand touchpoint evaluation exercises

        Stimuli:
        - Visual materials with specific usage instructions and timing
        - Product samples with handling guidelines and setup
        - Concept boards with discussion prompts and flow
        - Prototypes with testing procedures and feedback forms
        - Digital materials with technical requirements
        - Backup materials and alternatives
        - Accessibility considerations for all materials
        - Cultural sensitivity guidelines
        - Brand materials (logos, ads, packaging)
        - Competitor materials for comparison
        - Historical brand materials
        - Future brand concepts
        - Brand touchpoint examples
        - Brand personality visuals
        - Brand value proposition materials

        IMPORTANT: You MUST use these exact section headers, followed by detailed bullet points. Each point should be specific, actionable, and include timing where applicable. Do not add any other sections or modify the headers."""

        self.survey_designer_prompt = """You are a survey design expert specializing in marketing research.
        Your role is to design comprehensive surveys. You MUST format your response with the following sections:

        Survey Questions:
        - Main questions with specific wording
        - Response options with detailed instructions
        - Skip patterns with logic flow
        - Validation rules with error messages
        - Question dependencies and relationships
        - Question randomization rules
        - Question grouping and order
        - Question testing procedures

        Response Scales:
        - Scale types with specific applications
        - Rating options with detailed descriptions
        - Labeling with exact wording
        - Formatting with visual examples
        - Scale reliability measures
        - Scale validation procedures
        - Scale testing requirements
        - Scale adaptation guidelines

        Survey Flow:
        - Question order with specific logic
        - Branching logic with detailed paths
        - Progress indicators with specific points
        - Mobile optimization requirements
        - Screen size considerations
        - Loading time optimization
        - Navigation controls
        - Save and resume functionality

        Quality Controls:
        - Attention checks with specific questions
        - Consistency measures with validation rules
        - Speed checks with time thresholds
        - Data validation with specific rules
        - Response quality indicators
        - Survey completion criteria
        - Data cleaning procedures
        - Quality reporting metrics

        Use clear section headers exactly as shown above, followed by detailed bullet points. Each point should be specific and actionable."""

        self.data_analyst_prompt = """You are a marketing research data analysis specialist.
        Your role is to design analysis plans. You MUST format your response with the following sections:

        Analysis Methods:
        - Statistical techniques with specific applications
        - Data cleaning steps with detailed procedures
        - Variable coding with specific rules
        - Cross-tabulations with key relationships
        - Advanced statistical methods
        - Data transformation procedures
        - Missing data handling
        - Outlier detection and treatment

        Key Metrics:
        - Performance indicators with specific calculations
        - Success criteria with target values
        - Benchmark comparisons with data sources
        - Trend analysis with time periods
        - Statistical significance levels
        - Effect size calculations
        - Confidence intervals
        - Margin of error calculations

        Visualization Plan:
        - Chart types with specific use cases
        - Data presentation with formatting rules
        - Interactive elements with functionality
        - Reporting format with templates
        - Color schemes and accessibility
        - Data hierarchy visualization
        - Dynamic filtering options
        - Export capabilities

        Reporting Template:
        - Executive summary with key metrics
        - Key findings with supporting data
        - Recommendations with implementation steps
        - Action items with timelines
        - Data visualization guidelines
        - Narrative structure
        - Technical appendix
        - Presentation guidelines

        Use clear section headers exactly as shown above, followed by detailed bullet points. Each point should be specific and actionable."""

        # Initialize research tools
        serp_tool = SerpAPIWrapper()
        self.tools = [
            Tool(
                name="MarketResearchTool",
                func=serp_tool.run,
                description="Search for market research data, industry trends, and demographic information."
            )
        ]

    def generate_research_plan(self, query, client_info=None):
        """Generate a comprehensive research plan with all necessary components."""
        try:
            # Gather all research components
            research_design = self._get_research_design(query)
            focus_group_guide = self._get_focus_group_guide(query)
            survey_design = self._get_survey_design(query)
            analysis_plan = self._get_analysis_plan(query)

            # Compile and format the complete research plan
            plan = self._compile_research_plan(
                research_design,
                focus_group_guide,
                survey_design,
                analysis_plan,
                client_info
            )

            return plan

        except Exception as e:
            logging.error(f"Error generating research plan: {str(e)}")
            return {"error": str(e)}

    def _get_research_design(self, query):
        """Get research design with retry logic."""
        def _call():
            messages = [
                SystemMessage(content=self.research_designer_prompt),
                HumanMessage(content=query)
            ]
            response = self.research_designer.invoke(messages)
            return self._parse_research_design_response(response.content)
        
        return retry_with_backoff(_call)

    def _get_focus_group_guide(self, research_plan: str) -> str:
        """Get focus group guide with retry logic."""
        def _call():
            messages = [
                SystemMessage(content=self.focus_group_prompt),
                HumanMessage(content=research_plan)
            ]
            response = self.focus_group_facilitator.invoke(messages)
            return self._parse_focus_group_response(response.content)
        
        return retry_with_backoff(_call)

    def _get_survey_design(self, query):
        """Get survey design with retry logic."""
        def _call():
            messages = [
                SystemMessage(content=self.survey_designer_prompt),
                HumanMessage(content=query)
            ]
            response = self.survey_designer.invoke(messages)
            return self._parse_survey_response(response.content)
        
        return retry_with_backoff(_call)

    def _get_analysis_plan(self, query):
        """Get analysis plan with retry logic."""
        def _call():
            messages = [
                SystemMessage(content=self.data_analyst_prompt),
                HumanMessage(content=query)
            ]
            response = self.data_analyst.invoke(messages)
            return self._parse_analysis_response(response.content)
        
        return retry_with_backoff(_call)

    def _extract_section(self, text, section_name):
        """Extract specific sections from the response text."""
        try:
            logging.info(f"Attempting to extract section: {section_name}")
            logging.debug(f"Input text: {text[:200]}...")  # Log first 200 chars for debugging

            # First try to find the section with a colon
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
            
            if not match:
                # Try to find content between section headers
                sections = re.split(r'\n(?=[A-Za-z\s]+:)', text)
                for section in sections:
                    if section.strip().lower().startswith(section_name.lower()):
                        content = section.split(':', 1)[1].strip() if ':' in section else section
                        match = re.match(r'.*?(.*?)(?=\n\n|$)', content, re.DOTALL)
                        if match:
                            content = match.group(1).strip()
                            break
            
            if not match:
                # Try to find content between section headers without colon
                sections = re.split(r'\n(?=[A-Za-z\s]+(?:\n|$))', text)
                for section in sections:
                    if section.strip().lower().startswith(section_name.lower()):
                        content = section[len(section_name):].strip()
                        match = re.match(r'.*?(.*?)(?=\n\n|$)', content, re.DOTALL)
                        if match:
                            content = match.group(1).strip()
                            break
            
            if match:
                content = match.group(1).strip()
                logging.info(f"Found section {section_name} with content length: {len(content)}")
                
                # Improved parsing to handle bullet points and numbered lists
                items = []
                current_item = []
                
                for line in content.split('\n'):
                    line = line.strip()
                    if not line:
                        if current_item:
                            items.append(' '.join(current_item))
                            current_item = []
                        continue
                    
                    # Handle bullet points and numbered lists
                    if line.startswith(('-', '•', '*', '1.', '2.', '3.')):
                        if current_item:
                            items.append(' '.join(current_item))
                            current_item = []
                        line = re.sub(r'^[-•*]\s*', '', line)
                        line = re.sub(r'^\d+\.\s*', '', line)
                        line = line.strip()
                    
                    # Handle indented content
                    if line.startswith('  ') or line.startswith('\t'):
                        current_item.append(line.strip())
                    else:
                        if current_item:
                            items.append(' '.join(current_item))
                            current_item = []
                        current_item.append(line)
                
                # Add any remaining item
                if current_item:
                    items.append(' '.join(current_item))
                
                # Clean up items
                items = [item.strip() for item in items if item.strip()]
                logging.info(f"Extracted {len(items)} items from section {section_name}")
                return items
            
            logging.warning(f"Section '{section_name}' not found in response")
            return []
            
        except Exception as e:
            logging.error(f"Error extracting section {section_name}: {str(e)}")
            return []

    def _parse_research_design_response(self, response):
        """Parse and structure research design with improved error handling."""
        try:
            if not response:
                raise ValueError("Empty response received")

            sections = {
                "research_objectives": [],
                "methodology": [],
                "sample_design": [],
                "timeline": [],
                "budget_considerations": []
            }

            for section in sections.keys():
                try:
                    sections[section] = self._extract_section(response, section.replace('_', ' ').title())
                except Exception as e:
                    logging.error(f"Error parsing section {section}: {str(e)}")
                    continue

            # Validate required sections
            if not sections["research_objectives"] and not sections["methodology"]:
                raise ValueError("Missing critical research design sections")

            return sections

        except Exception as e:
            logging.error(f"Error in research design parsing: {str(e)}")
            return {
                "error": str(e),
                "research_objectives": ["Error: Could not parse research objectives"],
                "methodology": ["Error: Could not parse methodology"],
                "sample_design": [],
                "timeline": [],
                "budget_considerations": []
            }

    def _parse_focus_group_response(self, response):
        """Parse and structure focus group guide with improved error handling."""
        try:
            if not response:
                raise ValueError("Empty response received")

            sections = {
                "discussion_guide": [],
                "moderator_techniques": [],
                "exercises": [],
                "stimuli": []
            }

            for section in sections.keys():
                try:
                    sections[section] = self._extract_section(response, section.replace('_', ' ').title())
                except Exception as e:
                    logging.error(f"Error parsing section {section}: {str(e)}")
                    continue

            # Validate required sections
            if not sections["discussion_guide"]:
                raise ValueError("Missing critical focus group sections")

            return sections

        except Exception as e:
            logging.error(f"Error in focus group parsing: {str(e)}")
            return {
                "error": str(e),
                "discussion_guide": ["Error: Could not parse discussion guide"],
                "moderator_techniques": [],
                "exercises": [],
                "stimuli": []
            }

    def _parse_survey_response(self, response: str) -> Dict:
        """Parse the survey design response into structured format."""
        try:
            # Split response into sections
            sections = response.split('\n\n')
            survey_data = {
                "survey_objective": "",
                "target_audience": "",
                "sample_size": "",
                "sampling_method": "",
                "questions": [],
                "response_options": [],
                "analysis_plan": []
            }

            current_section = None
            for section in sections:
                section = section.strip()
                if not section:
                    continue

                # Check for section headers
                if section.startswith("Survey Objective:"):
                    current_section = "survey_objective"
                    survey_data[current_section] = section.replace("Survey Objective:", "").strip()
                elif section.startswith("Target Audience:"):
                    current_section = "target_audience"
                    survey_data[current_section] = section.replace("Target Audience:", "").strip()
                elif section.startswith("Sample Size:"):
                    current_section = "sample_size"
                    survey_data[current_section] = section.replace("Sample Size:", "").strip()
                elif section.startswith("Sampling Method:"):
                    current_section = "sampling_method"
                    survey_data[current_section] = section.replace("Sampling Method:", "").strip()
                elif section.startswith("Questions:"):
                    current_section = "questions"
                elif section.startswith("Response Options:"):
                    current_section = "response_options"
                elif section.startswith("Analysis Plan:"):
                    current_section = "analysis_plan"
                elif current_section in ["questions", "response_options", "analysis_plan"]:
                    # Handle bullet points
                    if section.startswith("•"):
                        items = [item.strip().lstrip("•").strip() for item in section.split("\n") if item.strip()]
                        survey_data[current_section].extend(items)
                    else:
                        survey_data[current_section].append(section.strip())

            # Validate required sections
            required_sections = ["survey_objective", "target_audience", "questions"]
            missing_sections = [section for section in required_sections if not survey_data[section]]
            if missing_sections:
                raise ValueError(f"Missing required survey sections: {', '.join(missing_sections)}")

            return survey_data

        except Exception as e:
            logger.error(f"Error in survey parsing: {str(e)}")
            # Return a structured error response
            return {
                "error": str(e),
                "survey_objective": "Error parsing survey objective",
                "target_audience": "Error parsing target audience",
                "sample_size": "Not specified",
                "sampling_method": "Not specified",
                "questions": ["Error parsing questions"],
                "response_options": ["Error parsing response options"],
                "analysis_plan": ["Error parsing analysis plan"]
            }

    def _parse_analysis_response(self, response):
        """Parse and structure analysis plan with improved error handling."""
        try:
            if not response:
                raise ValueError("Empty response received")

            sections = {
                "analysis_methods": [],
                "key_metrics": [],
                "visualization_plan": [],
                "reporting_template": []
            }

            for section in sections.keys():
                try:
                    sections[section] = self._extract_section(response, section.replace('_', ' ').title())
                except Exception as e:
                    logging.error(f"Error parsing section {section}: {str(e)}")
                    continue

            # Validate required sections
            if not sections["analysis_methods"] and not sections["key_metrics"]:
                raise ValueError("Missing critical analysis sections")

            return sections

        except Exception as e:
            logging.error(f"Error in analysis parsing: {str(e)}")
            return {
                "error": str(e),
                "analysis_methods": ["Error: Could not parse analysis methods"],
                "key_metrics": ["Error: Could not parse key metrics"],
                "visualization_plan": [],
                "reporting_template": []
            }

    def _compile_research_plan(self, research_design: str, focus_group_guide: str, 
                             survey_design: str, analysis_plan: str, client_info: dict = None) -> dict:
        """Compile all research components into a final plan."""
        try:
            # Parse the responses if they're strings
            research_design_dict = self._parse_research_design_response(research_design) if isinstance(research_design, str) else research_design
            focus_group_dict = self._parse_focus_group_response(focus_group_guide) if isinstance(focus_group_guide, str) else focus_group_guide
            survey_dict = self._parse_survey_response(survey_design) if isinstance(survey_design, str) else survey_design
            analysis_dict = self._parse_analysis_response(analysis_plan) if isinstance(analysis_plan, str) else analysis_plan

            # Create the final plan structure
            final_plan = {
                "research_design": research_design_dict,
                "focus_group_guide": focus_group_dict,
                "survey_design": survey_dict,
                "analysis_plan": analysis_dict,
                "client_info": client_info or {},
                "timestamp": datetime.now().isoformat()
            }

            return final_plan

        except Exception as e:
            logger.error(f"Error compiling research plan: {str(e)}")
            return {
                "error": str(e),
                "research_design": {},
                "focus_group_guide": {},
                "survey_design": {},
                "analysis_plan": {},
                "client_info": client_info or {},
                "timestamp": datetime.now().isoformat()
            }

    def get_answer(self, query: str, user_id: str, chat_history: list = None) -> dict:
        """Get answer with retry logic."""
        try:
            # Determine query type
            query_type = self._determine_query_type(query)
            
            # Generate research plan
            research_plan = self.generate_research_plan(query)
            
            # Get focus group guide
            focus_group_guide = self._get_focus_group_guide(research_plan)
            
            # Get survey design
            survey_design = self._get_survey_design(query)
            
            # Get analysis plan
            analysis_plan = self._get_analysis_plan(query)
            
            # Compile final plan
            final_plan = self._compile_research_plan(
                research_plan,
                focus_group_guide,
                survey_design,
                analysis_plan,
                {"user_id": user_id, "query_type": query_type}
            )
            
            return final_plan
            
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

        if any(keyword in query for keyword in focus_group_keywords):
            return "focus_group"
        elif any(keyword in query for keyword in survey_keywords):
            return "survey"
        elif any(keyword in query for keyword in analysis_keywords):
            return "analysis"
        else:
            return "general"