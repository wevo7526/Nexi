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
        try:
            logging.info(f"Generating focus group guide for query: {query}")
            
            # Create a more specific prompt for the focus group
            prompt = f"""Create a comprehensive focus group discussion guide for researching Colonial Williamsburg's brand effectiveness. 
            The guide should include specific questions about brand perception, historical significance, visitor experiences, and brand alignment.
            
            Query: {query}
            
            IMPORTANT: Format your response with the following exact section headers, followed by bullet points. Each section should be separated by a blank line:
            
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
            
            Moderator Techniques:
            - Ice-breaker activities with specific instructions and timing
            - Engagement strategies for different personality types (quiet, dominant, etc.)
            - Handling difficult participants with specific scenarios and responses
            - Managing group dynamics with intervention techniques and timing
            - Building rapport and trust through specific facilitation methods
            
            Exercises:
            - Group activities with detailed instructions and timing
            - Stimulus materials with specific usage guidelines and setup
            - Interactive elements with setup requirements and materials
            - Time management for each exercise with buffer time
            - Participant preparation requirements and materials
            
            Stimuli:
            - Visual materials with specific usage instructions and timing
            - Product samples with handling guidelines and setup
            - Concept boards with discussion prompts and flow
            - Prototypes with testing procedures and feedback forms
            - Digital materials with technical requirements
            
            Please provide detailed content for each section, including specific timing, questions, and materials. Each section should be clearly separated by a blank line."""
            
            response = self.focus_group_facilitator.invoke([
                ("system", self.focus_group_prompt),
                ("human", prompt)
            ])
            
            if not response or not response.content:
                logging.error("Empty response received from focus group facilitator")
                return {
                    "discussion_guide": ["Error: No response generated"],
                    "moderator_techniques": [],
                    "exercises": [],
                    "stimuli": []
                }
            
            logging.info(f"Received focus group response with length: {len(response.content)}")
            return self._parse_focus_group_response(response.content)
            
        except Exception as e:
            logging.error(f"Error generating focus group guide: {str(e)}")
            return {
                "discussion_guide": [f"Error: {str(e)}"],
                "moderator_techniques": [],
                "exercises": [],
                "stimuli": []
            }

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

        Use clear section headers exactly as shown above, followed by detailed bullet points. Each point should be specific and actionable."""
        
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

        Use clear section headers exactly as shown above, followed by detailed bullet points. Each point should be specific and actionable."""
        
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
                    # Add Discussion Guide section
                    if research_plan["focus_group_research"].get("discussion_guide"):
                        response["content"]["sections"].append({
                            "title": "Discussion Guide",
                            "content": "\n".join([f"• {item}" for item in research_plan["focus_group_research"]["discussion_guide"]])
                        })
                        logging.info("Added discussion guide section")

                    # Add Moderator Techniques section
                    if research_plan["focus_group_research"].get("moderator_techniques"):
                        response["content"]["sections"].append({
                            "title": "Moderator Techniques",
                            "content": "\n".join([f"• {item}" for item in research_plan["focus_group_research"]["moderator_techniques"]])
                        })
                        logging.info("Added moderator techniques section")

                    # Add Group Exercises section
                    if research_plan["focus_group_research"].get("group_exercises"):
                        response["content"]["sections"].append({
                            "title": "Group Exercises",
                            "content": "\n".join([f"• {item}" for item in research_plan["focus_group_research"]["group_exercises"]])
                        })
                        logging.info("Added group exercises section")

                    # Add Stimuli Materials section
                    if research_plan["focus_group_research"].get("stimuli_materials"):
                        response["content"]["sections"].append({
                            "title": "Stimuli Materials",
                            "content": "\n".join([f"• {item}" for item in research_plan["focus_group_research"]["stimuli_materials"]])
                        })
                        logging.info("Added stimuli materials section")

                # Add focus group guide as a structured output
                if research_plan.get("focus_group_research"):
                    response["outputs"].append({
                        "type": "analysis",
                        "title": "Focus Group Guide",
                        "content": research_plan["focus_group_research"]
                    })
                    logging.info("Added focus group guide output")

            elif query_type == "survey":
                if research_plan.get("survey_research"):
                    # Add Survey Questions section
                    if research_plan["survey_research"].get("questions"):
                        response["content"]["sections"].append({
                            "title": "Survey Questions",
                            "content": "\n".join([f"• {item}" for item in research_plan["survey_research"]["questions"]])
                        })
                        logging.info("Added survey questions section")

                    # Add Response Scales section
                    if research_plan["survey_research"].get("response_scales"):
                        response["content"]["sections"].append({
                            "title": "Response Scales",
                            "content": "\n".join([f"• {item}" for item in research_plan["survey_research"]["response_scales"]])
                        })
                        logging.info("Added response scales section")

                    # Add Survey Flow section
                    if research_plan["survey_research"].get("survey_flow"):
                        response["content"]["sections"].append({
                            "title": "Survey Flow",
                            "content": "\n".join([f"• {item}" for item in research_plan["survey_research"]["survey_flow"]])
                        })
                        logging.info("Added survey flow section")

                    # Add Quality Controls section
                    if research_plan["survey_research"].get("quality_controls"):
                        response["content"]["sections"].append({
                            "title": "Quality Controls",
                            "content": "\n".join([f"• {item}" for item in research_plan["survey_research"]["quality_controls"]])
                        })
                        logging.info("Added quality controls section")

                # Add survey design as a structured output
                if research_plan.get("survey_research"):
                    response["outputs"].append({
                        "type": "analysis",
                        "title": "Survey Design",
                        "content": research_plan["survey_research"]
                    })
                    logging.info("Added survey design output")

            elif query_type == "analysis":
                if research_plan.get("analysis_plan"):
                    # Add Analysis Methods section
                    if research_plan["analysis_plan"].get("methods"):
                        response["content"]["sections"].append({
                            "title": "Analysis Methods",
                            "content": "\n".join([f"• {item}" for item in research_plan["analysis_plan"]["methods"]])
                        })
                        logging.info("Added analysis methods section")

                    # Add Key Metrics section
                    if research_plan["analysis_plan"].get("key_metrics"):
                        response["content"]["sections"].append({
                            "title": "Key Metrics",
                            "content": "\n".join([f"• {item}" for item in research_plan["analysis_plan"]["key_metrics"]])
                        })
                        logging.info("Added key metrics section")

                    # Add Visualization Plan section
                    if research_plan["analysis_plan"].get("visualization"):
                        response["content"]["sections"].append({
                            "title": "Visualization Plan",
                            "content": "\n".join([f"• {item}" for item in research_plan["analysis_plan"]["visualization"]])
                        })
                        logging.info("Added visualization plan section")

                    # Add Reporting Template section
                    if research_plan["analysis_plan"].get("reporting"):
                        response["content"]["sections"].append({
                            "title": "Reporting Template",
                            "content": "\n".join([f"• {item}" for item in research_plan["analysis_plan"]["reporting"]])
                        })
                        logging.info("Added reporting template section")

                # Add analysis plan as a structured output
                if research_plan.get("analysis_plan"):
                    response["outputs"].append({
                        "type": "analysis",
                        "title": "Analysis Plan",
                        "content": research_plan["analysis_plan"]
                    })
                    logging.info("Added analysis plan output")

            else:  # General research query
                if research_plan.get("research_overview"):
                    # Add Project Scope section
                    if research_plan["research_overview"].get("project_scope"):
                        response["content"]["sections"].append({
                            "title": "Project Scope",
                            "content": "\n".join([f"• {item}" for item in research_plan["research_overview"]["project_scope"]])
                        })
                        logging.info("Added project scope section")

                    # Add Methodology section
                    if research_plan["research_overview"].get("methodology"):
                        response["content"]["sections"].append({
                            "title": "Methodology",
                            "content": "\n".join([f"• {item}" for item in research_plan["research_overview"]["methodology"]])
                        })
                        logging.info("Added methodology section")

                    # Add Timeline section
                    if research_plan["research_overview"].get("timeline"):
                        response["content"]["sections"].append({
                            "title": "Timeline",
                            "content": "\n".join([f"• {item}" for item in research_plan["research_overview"]["timeline"]])
                        })
                        logging.info("Added timeline section")

                    # Add Budget section
                    if research_plan["research_overview"].get("budget"):
                        response["content"]["sections"].append({
                            "title": "Budget Considerations",
                            "content": "\n".join([f"• {item}" for item in research_plan["research_overview"]["budget"]])
                        })
                        logging.info("Added budget section")

                # Add research design as a structured output
                if research_plan.get("research_overview"):
                    response["outputs"].append({
                        "type": "analysis",
                        "title": "Research Design",
                        "content": research_plan["research_overview"]
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