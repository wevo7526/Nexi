from langchain.agents import Tool
from langchain_community.utilities import SerpAPIWrapper
from langchain_anthropic import ChatAnthropic
from config.settings import ANTHROPIC_API_KEY
import logging
from datetime import datetime
import re
import json

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
            temperature=0.2,
            max_tokens=2048,
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

        self.focus_group_prompt = """You are an experienced focus group facilitator and moderator.
        Your role is to design focus group discussion guides. You MUST format your response with the following sections:

        Discussion Guide:
        - Welcome and introduction script with exact wording
        - Key discussion topics with specific time allocations
        - Main questions and detailed probing techniques
        - Time management plan with buffer periods
        - Participant engagement strategies
        - Handling sensitive topics and difficult participants
        - Managing group dynamics and power dynamics
        - Ensuring all voices are heard

        Moderator Techniques:
        - Ice-breaker activities with specific instructions
        - Engagement strategies for different personality types
        - Handling difficult participants with specific scenarios
        - Managing group dynamics with intervention techniques
        - Building rapport and trust
        - Managing time effectively
        - Handling sensitive topics
        - Ensuring productive discussion

        Exercises:
        - Group activities with detailed instructions
        - Stimulus materials with specific usage guidelines
        - Interactive elements with setup requirements
        - Time management for each exercise
        - Participant preparation requirements
        - Materials needed for each exercise
        - Success criteria for each activity
        - Debriefing procedures

        Stimuli:
        - Visual materials with specific usage instructions
        - Product samples with handling guidelines
        - Concept boards with discussion prompts
        - Prototypes with testing procedures
        - Digital materials with technical requirements
        - Backup materials and alternatives
        - Accessibility considerations
        - Cultural sensitivity guidelines

        Use clear section headers exactly as shown above, followed by detailed bullet points. Each point should be specific and actionable."""

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
        """Generate research design and methodology."""
        system_message = """You are an expert in marketing research design and methodology.
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

        IMPORTANT: You MUST use these exact section headers, followed by detailed bullet points. Do not add any other sections or modify the headers."""
        
        response = self.research_designer.invoke([
            ("system", system_message),
            ("human", f"Design research plan for: {query}")
        ])
        return self._parse_research_design_response(response.content)

    def _get_focus_group_guide(self, query):
        """Generate focus group discussion guide."""
        system_message = """You are an experienced focus group facilitator and moderator.
        Your role is to design focus group discussion guides. You MUST format your response with the following sections:

        Discussion Guide:
        - Welcome and introduction script with exact wording
        - Key discussion topics with specific time allocations
        - Main questions and detailed probing techniques
        - Time management plan with buffer periods
        - Participant engagement strategies
        - Handling sensitive topics and difficult participants
        - Managing group dynamics and power dynamics
        - Ensuring all voices are heard

        Moderator Techniques:
        - Ice-breaker activities with specific instructions
        - Engagement strategies for different personality types
        - Handling difficult participants with specific scenarios
        - Managing group dynamics with intervention techniques
        - Building rapport and trust
        - Managing time effectively
        - Handling sensitive topics
        - Ensuring productive discussion

        Exercises:
        - Group activities with detailed instructions
        - Stimulus materials with specific usage guidelines
        - Interactive elements with setup requirements
        - Time management for each exercise
        - Participant preparation requirements
        - Materials needed for each exercise
        - Success criteria for each activity
        - Debriefing procedures

        Stimuli:
        - Visual materials with specific usage instructions
        - Product samples with handling guidelines
        - Concept boards with discussion prompts
        - Prototypes with testing procedures
        - Digital materials with technical requirements
        - Backup materials and alternatives
        - Accessibility considerations
        - Cultural sensitivity guidelines

        IMPORTANT: You MUST use these exact section headers, followed by detailed bullet points. Do not add any other sections or modify the headers."""
        
        response = self.focus_group_facilitator.invoke([
            ("system", system_message),
            ("human", f"Create focus group guide for: {query}")
        ])
        return self._parse_focus_group_response(response.content)

    def _get_survey_design(self, query):
        """Generate survey design and questions."""
        system_message = """You are a survey design expert specializing in marketing research.
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

        IMPORTANT: You MUST use these exact section headers, followed by detailed bullet points. Do not add any other sections or modify the headers."""
        
        response = self.survey_designer.invoke([
            ("system", system_message),
            ("human", f"Design survey for: {query}")
        ])
        return self._parse_survey_response(response.content)

    def _get_analysis_plan(self, query):
        """Generate data analysis plan."""
        system_message = """You are a marketing research data analysis specialist.
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

        IMPORTANT: You MUST use these exact section headers, followed by detailed bullet points. Do not add any other sections or modify the headers."""
        
        response = self.data_analyst.invoke([
            ("system", system_message),
            ("human", f"Create analysis plan for: {query}")
        ])
        return self._parse_analysis_response(response.content)

    def _extract_section(self, text, section_name):
        """Extract specific sections from the response text."""
        try:
            logging.info(f"Attempting to extract section: {section_name}")
            logging.debug(f"Input text: {text[:200]}...")  # Log first 200 chars for debugging

            # Try exact match first
            pattern = f"{section_name}:(.*?)(?=\n\n|$)"
            match = re.search(pattern, text, re.DOTALL | re.IGNORECASE)
            
            if not match:
                # Try without colon
                pattern = f"{section_name}(.*?)(?=\n\n|$)"
                match = re.search(pattern, text, re.DOTALL | re.IGNORECASE)
            
            if not match:
                # Try with any whitespace after the header
                pattern = f"{section_name}\s*(.*?)(?=\n\n|$)"
                match = re.search(pattern, text, re.DOTALL | re.IGNORECASE)
            
            if match:
                content = match.group(1).strip()
                logging.info(f"Found section {section_name} with content length: {len(content)}")
                
                # Improved parsing to handle bullet points and numbered lists
                items = []
                for line in content.split('\n'):
                    line = line.strip()
                    # Remove common list markers
                    line = re.sub(r'^[-•*]\s*', '', line)
                    line = re.sub(r'^\d+\.\s*', '', line)
                    # Remove any remaining whitespace
                    line = line.strip()
                    if line:
                        items.append(line)
                
                logging.info(f"Extracted {len(items)} items from section {section_name}")
                return items
            
            # If no match found, try to find content between section headers
            sections = re.split(r'\n(?=[A-Za-z\s]+:)', text)
            for section in sections:
                if section.strip().lower().startswith(section_name.lower()):
                    content = section.split(':', 1)[1].strip() if ':' in section else section
                    items = []
                    for line in content.split('\n'):
                        line = line.strip()
                        line = re.sub(r'^[-•*]\s*', '', line)
                        line = re.sub(r'^\d+\.\s*', '', line)
                        line = line.strip()
                        if line:
                            items.append(line)
                    logging.info(f"Found section {section_name} in split sections with {len(items)} items")
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

    def _parse_survey_response(self, response):
        """Parse and structure survey design with improved error handling."""
        try:
            if not response:
                raise ValueError("Empty response received")

            sections = {
                "survey_questions": [],
                "response_scales": [],
                "survey_flow": [],
                "quality_controls": []
            }

            for section in sections.keys():
                try:
                    sections[section] = self._extract_section(response, section.replace('_', ' ').title())
                except Exception as e:
                    logging.error(f"Error parsing section {section}: {str(e)}")
                    continue

            # Validate required sections
            if not sections["survey_questions"]:
                raise ValueError("Missing critical survey sections")

            return sections

        except Exception as e:
            logging.error(f"Error in survey parsing: {str(e)}")
            return {
                "error": str(e),
                "survey_questions": ["Error: Could not parse survey questions"],
                "response_scales": [],
                "survey_flow": [],
                "quality_controls": []
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

    def _compile_research_plan(self, research_design, focus_group_guide, survey_design, analysis_plan, client_info):
        """Compile all research components into a structured plan."""
        report = {
            "research_overview": {
                "project_scope": research_design.get("research_objectives", []),
                "methodology": research_design.get("methodology", []),
                "timeline": research_design.get("timeline", []),
                "budget": research_design.get("budget_considerations", [])
            },
            "focus_group_research": {
                "discussion_guide": focus_group_guide.get("discussion_guide", []),
                "moderator_techniques": focus_group_guide.get("moderator_techniques", []),
                "group_exercises": focus_group_guide.get("exercises", []),
                "stimuli_materials": focus_group_guide.get("stimuli", [])
            },
            "survey_research": {
                "questions": survey_design.get("survey_questions", []),
                "response_scales": survey_design.get("response_scales", []),
                "survey_flow": survey_design.get("survey_flow", []),
                "quality_controls": survey_design.get("quality_controls", [])
            },
            "analysis_plan": {
                "methods": analysis_plan.get("analysis_methods", []),
                "key_metrics": analysis_plan.get("key_metrics", []),
                "visualization": analysis_plan.get("visualization_plan", []),
                "reporting": analysis_plan.get("reporting_template", [])
            },
            "appendix": {
                "methodology": [
                    "Research Design and Planning",
                    "Focus Group Facilitation",
                    "Survey Design and Implementation",
                    "Data Analysis and Reporting"
                ],
                "resources": [
                    "Sample Size Calculators",
                    "Survey Platforms",
                    "Analysis Software",
                    "Reporting Templates"
                ]
            }
        }

        return report

    def get_answer(self, query: str, user_id: str, chat_history: list = None) -> dict:
        """Process a user query and return a structured response."""
        try:
            logging.info(f"Processing query for user {user_id}: {query}")
            
            # Determine the type of query
            query_type = self._determine_query_type(query.lower())
            logging.info(f"Query type determined: {query_type}")
            
            # Generate research plan
            logging.info("Generating research plan...")
            research_plan = self.generate_research_plan(query)
            if "error" in research_plan:
                logging.error(f"Error generating research plan: {research_plan['error']}")
                return {"error": research_plan["error"]}

            logging.info("Research plan generated successfully")
            
            # Structure the response based on query type
            response = {
                "content": {
                    "sections": []
                },
                "outputs": []
            }

            # Add relevant sections based on query type
            if query_type == "focus_group":
                if research_plan.get("focus_group_research"):
                    focus_group_items = []
                    for section_name, items in research_plan["focus_group_research"].items():
                        if items:
                            focus_group_items.extend([f"• {item}" for item in items])
                    
                    if focus_group_items:
                        response["content"]["sections"].append({
                            "title": "Focus Group Research",
                            "content": "\n".join(focus_group_items)
                        })
                        logging.info("Added focus group section")

                if research_plan.get("focus_group_guide"):
                    response["outputs"].append({
                        "type": "analysis",
                        "title": "Focus Group Guide",
                        "content": research_plan["focus_group_guide"]
                    })
                    logging.info("Added focus group guide output")

            elif query_type == "survey":
                if research_plan.get("survey_research"):
                    survey_items = []
                    for section_name, items in research_plan["survey_research"].items():
                        if items:
                            survey_items.extend([f"• {item}" for item in items])
                    
                    if survey_items:
                        response["content"]["sections"].append({
                            "title": "Survey Research",
                            "content": "\n".join(survey_items)
                        })
                        logging.info("Added survey section")

                if research_plan.get("survey_design"):
                    response["outputs"].append({
                        "type": "analysis",
                        "title": "Survey Design",
                        "content": research_plan["survey_design"]
                    })
                    logging.info("Added survey design output")

            elif query_type == "analysis":
                if research_plan.get("analysis_plan"):
                    analysis_items = []
                    for section_name, items in research_plan["analysis_plan"].items():
                        if items:
                            analysis_items.extend([f"• {item}" for item in items])
                    
                    if analysis_items:
                        response["content"]["sections"].append({
                            "title": "Analysis Plan",
                            "content": "\n".join(analysis_items)
                        })
                        logging.info("Added analysis section")

            else:  # General research query
                if research_plan.get("research_overview"):
                    overview_items = []
                    for section_name, items in research_plan["research_overview"].items():
                        if items:
                            overview_items.extend([f"• {item}" for item in items])
                    
                    if overview_items:
                        response["content"]["sections"].append({
                            "title": "Research Overview",
                            "content": "\n".join(overview_items)
                        })
                        logging.info("Added research overview section")

                if research_plan.get("research_design"):
                    response["outputs"].append({
                        "type": "analysis",
                        "title": "Research Design",
                        "content": research_plan["research_design"]
                    })
                    logging.info("Added research design output")

            logging.info(f"Successfully structured response with {len(response['content']['sections'])} sections and {len(response['outputs'])} outputs")
            return response

        except Exception as e:
            logging.error(f"Error in get_answer: {str(e)}")
            return {"error": str(e)}

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