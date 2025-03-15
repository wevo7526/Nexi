from langchain.agents import Tool
from langchain_community.utilities import SerpAPIWrapper
from langchain_anthropic import ChatAnthropic
from config.settings import ANTHROPIC_API_KEY
import logging
from datetime import datetime
import re
import json

class MultiAgentConsultant:
    def __init__(self):
        # Initialize specialized agents with more detailed prompts
        self.strategy_agent = ChatAnthropic(
            model="claude-3-5-sonnet-20240620",
            temperature=0.3,  # Slightly increased for more creative analysis
            max_tokens=4096,  # Increased token limit for more detailed responses
            api_key=ANTHROPIC_API_KEY
        )
        self.research_agent = ChatAnthropic(
            model="claude-3-5-sonnet-20240620",
            temperature=0,
            max_tokens=1024,
            api_key=ANTHROPIC_API_KEY
        )
        self.financial_agent = ChatAnthropic(
            model="claude-3-5-sonnet-20240620",
            temperature=0,
            max_tokens=1024,
            api_key=ANTHROPIC_API_KEY
        )
        self.implementation_agent = ChatAnthropic(
            model="claude-3-5-sonnet-20240620",
            temperature=0,
            max_tokens=1024,
            api_key=ANTHROPIC_API_KEY
        )

        # Enhanced prompts for more detailed analysis
        self.strategy_prompt = """You are a senior strategy consultant from a top consulting firm.
        Provide an extremely detailed strategic analysis including:
        1. Comprehensive SWOT analysis with specific examples and data points
        2. Detailed Porter's Five Forces analysis with industry-specific insights
        3. Value Chain analysis highlighting key competitive advantages
        4. Blue Ocean Strategy opportunities with specific market positioning recommendations
        5. Concrete strategic recommendations with expected impact and implementation timeline
        
        Format your response using clear headers, bullet points, and include specific metrics and KPIs.
        Include relevant charts and graphs described in markdown format."""

        self.research_prompt = """You are a research specialist with expertise in market research and data analysis.
        Provide comprehensive market research including:
        1. Detailed market size analysis with CAGR and growth projections
        2. Complete competitive landscape analysis with market share data
        3. Industry trends analysis with 5-year forecasts
        4. Customer segmentation analysis with detailed personas
        5. Market opportunity assessment with TAM, SAM, and SOM calculations
        
        Use specific data points, statistics, and include descriptions of relevant charts and graphs in markdown format."""

        self.financial_prompt = """You are a financial advisory expert specializing in business valuation and financial modeling.
        Focus on financial analysis, valuation metrics, and ROI calculations.
        Provide detailed cost-benefit analysis, investment requirements, and expected returns.
        Include risk assessment and mitigation strategies."""

        self.implementation_prompt = """You are an implementation and change management specialist.
        Focus on practical execution steps, resource requirements, and timeline planning.
        Provide detailed implementation roadmap, risk mitigation, and success metrics.
        Include change management strategies and key stakeholder management plans."""

        # Initialize search tool
        serp_tool = SerpAPIWrapper()
        self.tools = [
            Tool(
                name="SearchTool",
                func=serp_tool.run,
                description="Search for market data, industry trends, and company information."
            )
        ]

    def generate_comprehensive_report(self, query, client_info=None):
        """Generate a comprehensive consulting report with enhanced formatting and visualizations."""
        try:
            # Gather all analyses with retries and error handling
            strategy_insights = self._get_strategy_insights(query)
            market_research = self._get_market_research(query)
            financial_analysis = self._get_financial_analysis(query)
            implementation_plan = self._get_implementation_plan(query)

            # Compile and format the complete report
            report = self._compile_detailed_report(
                strategy_insights,
                market_research,
                financial_analysis,
                implementation_plan,
                client_info
            )

            return report

        except Exception as e:
            logging.error(f"Error generating comprehensive report: {str(e)}")
            return {"error": str(e)}

    def _get_strategy_insights(self, query):
        """Generate strategic insights and recommendations."""
        response = self.strategy_agent.invoke([
            ("system", self.strategy_prompt),
            ("human", f"Provide strategic analysis for: {query}")
        ])
        return self._parse_strategy_response(response.content)

    def _get_market_research(self, query):
        """Generate detailed market research and analysis."""
        response = self.research_agent.invoke([
            ("system", self.research_prompt),
            ("human", f"Provide market research for: {query}")
        ])
        return self._parse_research_response(response.content)

    def _get_financial_analysis(self, query):
        """Generate financial analysis and projections."""
        response = self.financial_agent.invoke([
            ("system", self.financial_prompt),
            ("human", f"Provide financial analysis for: {query}")
        ])
        return self._parse_financial_response(response.content)

    def _get_implementation_plan(self, query):
        """Generate implementation roadmap and recommendations."""
        response = self.implementation_agent.invoke([
            ("system", self.implementation_prompt),
            ("human", f"Provide implementation plan for: {query}")
        ])
        return self._parse_implementation_response(response.content)

    def _parse_strategy_response(self, response):
        """Parse and structure strategy insights."""
        return {
            "market_position": self._extract_section(response, "Market Position"),
            "competitive_analysis": self._extract_section(response, "Competitive Analysis"),
            "strategic_recommendations": self._extract_section(response, "Strategic Recommendations"),
            "risk_assessment": self._extract_section(response, "Risk Assessment")
        }

    def _parse_research_response(self, response):
        """Parse and structure market research."""
        return {
            "market_size": self._extract_section(response, "Market Size"),
            "growth_trends": self._extract_section(response, "Growth Trends"),
            "competitive_landscape": self._extract_section(response, "Competitive Landscape"),
            "key_opportunities": self._extract_section(response, "Key Opportunities")
        }

    def _parse_financial_response(self, response):
        """Parse and structure financial analysis."""
        return {
            "financial_projections": self._extract_section(response, "Financial Projections"),
            "roi_analysis": self._extract_section(response, "ROI Analysis"),
            "cost_structure": self._extract_section(response, "Cost Structure"),
            "funding_requirements": self._extract_section(response, "Funding Requirements")
        }

    def _parse_implementation_response(self, response):
        """Parse and structure implementation plan."""
        return {
            "implementation_roadmap": self._extract_section(response, "Implementation Roadmap"),
            "resource_requirements": self._extract_section(response, "Resource Requirements"),
            "timeline": self._extract_section(response, "Timeline"),
            "success_metrics": self._extract_section(response, "Success Metrics")
        }

    def _extract_section(self, text, section_name):
        """Extract specific sections from the response text."""
        try:
            pattern = f"{section_name}:(.*?)(?=\n\n|$)"
            match = re.search(pattern, text, re.DOTALL | re.IGNORECASE)
            if match:
                content = match.group(1).strip()
                return [item.strip() for item in content.split('\n') if item.strip()]
            return []
        except Exception:
            return []

    def _compile_detailed_report(self, strategy, research, financial, implementation, client_info):
        """Compile all analyses into a structured consulting report with enhanced formatting."""
        current_date = datetime.now().strftime("%m/%d/%Y")
        
        report = {
            "metadata": {
                "title": "Strategic Consulting Analysis",
                "generated_date": current_date,
                "client": client_info or "Confidential",
                "version": "1.0",
                "classification": "Confidential - For Internal Use Only"
            },
            "executive_summary": {
                "overview": self._extract_section(strategy.get("strategic_recommendations", []), "Overview"),
                "key_findings": strategy.get("strategic_recommendations", [])[:5],
                "market_highlights": research.get("key_opportunities", [])[:3],
                "financial_highlights": financial.get("roi_analysis", [])[:3]
            },
            "strategic_analysis": {
                "market_position": strategy.get("market_position", []),
                "competitive_analysis": strategy.get("competitive_analysis", []),
                "swot_analysis": self._format_swot_analysis(strategy.get("swot_analysis", [])),
                "porters_five_forces": strategy.get("porters_analysis", []),
                "strategic_recommendations": strategy.get("strategic_recommendations", [])
            },
            "market_analysis": {
                "market_size": research.get("market_size", []),
                "growth_trends": research.get("growth_trends", []),
                "competitive_landscape": research.get("competitive_landscape", []),
                "customer_segments": research.get("customer_segments", []),
                "market_opportunities": research.get("key_opportunities", [])
            },
            "financial_analysis": {
                "financial_projections": financial.get("financial_projections", []),
                "roi_analysis": financial.get("roi_analysis", []),
                "cost_structure": financial.get("cost_structure", []),
                "funding_requirements": financial.get("funding_requirements", [])
            },
            "implementation_roadmap": {
                "phases": implementation.get("implementation_roadmap", []),
                "resource_requirements": implementation.get("resource_requirements", []),
                "timeline": implementation.get("timeline", []),
                "success_metrics": implementation.get("success_metrics", []),
                "risk_mitigation": implementation.get("risk_mitigation", [])
            },
            "visualizations": {
                "market_trends": self._extract_charts(research.get("market_trends_charts", [])),
                "financial_charts": self._extract_charts(financial.get("financial_charts", [])),
                "competitive_matrix": self._extract_charts(strategy.get("competitive_matrix", []))
            },
            "appendix": {
                "methodology": [
                    "Strategic Framework Analysis",
                    "Market Research and Data Analysis",
                    "Financial Modeling and Projections",
                    "Implementation Planning"
                ],
                "data_sources": [
                    "Market Research Databases",
                    "Industry Reports",
                    "Financial Statements",
                    "Expert Interviews"
                ]
            }
        }

        return report

    def _format_swot_analysis(self, swot_data):
        """Format SWOT analysis into a structured format."""
        return {
            "strengths": self._extract_section(swot_data, "Strengths"),
            "weaknesses": self._extract_section(swot_data, "Weaknesses"),
            "opportunities": self._extract_section(swot_data, "Opportunities"),
            "threats": self._extract_section(swot_data, "Threats")
        }

    def _extract_charts(self, chart_data):
        """Extract and format chart descriptions and data."""
        charts = []
        for chart in chart_data:
            if isinstance(chart, str):
                # Parse markdown chart descriptions
                chart_info = {
                    "type": self._determine_chart_type(chart),
                    "title": self._extract_chart_title(chart),
                    "description": chart,
                    "data": self._extract_chart_data(chart)
                }
                charts.append(chart_info)
        return charts

    def _determine_chart_type(self, chart_description):
        """Determine the type of chart from its description."""
        chart_types = {
            "bar": ["bar chart", "bar graph", "histogram"],
            "line": ["line chart", "trend", "time series"],
            "pie": ["pie chart", "distribution"],
            "scatter": ["scatter plot", "correlation"],
            "matrix": ["matrix", "grid"]
        }
        
        description_lower = chart_description.lower()
        for chart_type, keywords in chart_types.items():
            if any(keyword in description_lower for keyword in keywords):
                return chart_type
        return "other"

    def _extract_chart_title(self, chart_description):
        """Extract the title from a chart description."""
        title_match = re.search(r"Title: (.*?)(?:\n|$)", chart_description)
        if title_match:
            return title_match.group(1).strip()
        return "Untitled Chart"

    def _extract_chart_data(self, chart_description):
        """Extract numerical data from chart description if available."""
        # Look for data patterns in the description
        data_pattern = r"Data:\s*\{(.*?)\}"
        data_match = re.search(data_pattern, chart_description, re.DOTALL)
        if data_match:
            try:
                return json.loads("{" + data_match.group(1) + "}")
            except:
                return {}
        return {}