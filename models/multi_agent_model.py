from langchain.agents import Tool
from langchain_community.utilities import SerpAPIWrapper
from langchain_anthropic import ChatAnthropic
from config.settings import ANTHROPIC_API_KEY
import logging
from datetime import datetime
import re

class MultiAgentConsultant:
    def __init__(self):
        # Initialize specialized agents
        self.strategy_agent = ChatAnthropic(
            model="claude-3-5-sonnet-20240620",
            temperature=0,
            max_tokens=1024,
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

        # Define specialized prompts
        self.strategy_prompt = """You are a senior strategy consultant from a top consulting firm.
        Focus on high-level strategic insights, market positioning, and competitive advantage.
        Structure your analysis using frameworks like Porter's Five Forces, Value Chain Analysis, and Blue Ocean Strategy.
        Provide clear, actionable recommendations with expected impact and timeline."""

        self.research_prompt = """You are a research specialist with expertise in market research and data analysis.
        Focus on gathering and analyzing market data, industry trends, and competitive intelligence.
        Use data to support all findings and identify key market opportunities.
        Provide detailed market sizing, growth projections, and trend analysis."""

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

    async def generate_comprehensive_report(self, query, client_info=None):
        """
        Generate a comprehensive consulting report using all specialized agents.
        """
        try:
            # 1. Strategic Analysis
            strategy_insights = await self._get_strategy_insights(query)

            # 2. Market Research
            market_research = await self._get_market_research(query)

            # 3. Financial Analysis
            financial_analysis = await self._get_financial_analysis(query)

            # 4. Implementation Plan
            implementation_plan = await self._get_implementation_plan(query)

            # Compile complete report
            report = self._compile_report(
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

    async def _get_strategy_insights(self, query):
        """Generate strategic insights and recommendations."""
        response = self.strategy_agent.invoke([
            ("system", self.strategy_prompt),
            ("human", f"Provide strategic analysis for: {query}")
        ])
        return self._parse_strategy_response(response.content)

    async def _get_market_research(self, query):
        """Generate detailed market research and analysis."""
        response = self.research_agent.invoke([
            ("system", self.research_prompt),
            ("human", f"Provide market research for: {query}")
        ])
        return self._parse_research_response(response.content)

    async def _get_financial_analysis(self, query):
        """Generate financial analysis and projections."""
        response = self.financial_agent.invoke([
            ("system", self.financial_prompt),
            ("human", f"Provide financial analysis for: {query}")
        ])
        return self._parse_financial_response(response.content)

    async def _get_implementation_plan(self, query):
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

    def _compile_report(self, strategy, research, financial, implementation, client_info):
        """Compile all analyses into a structured consulting report."""
        return {
            "report_meta": {
                "generated_date": datetime.now().isoformat(),
                "client": client_info or "Confidential",
                "version": "1.0"
            },
            "executive_summary": {
                "key_findings": strategy.get("strategic_recommendations", [])[:3],
                "market_opportunity": research.get("key_opportunities", [])[:2],
                "financial_highlights": financial.get("roi_analysis", [])[:2]
            },
            "strategic_analysis": strategy,
            "market_analysis": research,
            "financial_analysis": financial,
            "implementation_roadmap": implementation,
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