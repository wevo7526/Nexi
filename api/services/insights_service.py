from typing import Dict, List, Any
import asyncio
from datetime import datetime, timedelta
from api.services.document_service import DocumentService
from models.market_research_agent import MarketResearchAgent
from models.business_consultant_agent import BusinessConsultantAgent
from models.multi_agent_system import MultiAgentSystem
import logging

logger = logging.getLogger(__name__)

class InsightsService:
    def __init__(self):
        self.document_service = DocumentService()
        self.market_research_agent = MarketResearchAgent()
        self.business_consultant_agent = BusinessConsultantAgent()
        self.multi_agent_system = MultiAgentSystem()

    async def get_unified_insights(self) -> Dict[str, Any]:
        """Get unified insights from all agents."""
        try:
            # Fetch data from all sources concurrently
            business_data, document_insights, ai_insights = await asyncio.gather(
                self._get_business_data(),
                self._get_document_insights(),
                self._get_ai_insights()
            )

            return {
                'business_data': business_data,
                'document_insights': document_insights,
                'ai_insights': ai_insights
            }
        except Exception as e:
            print(f"Error getting unified insights: {str(e)}")
            return {
                'error': str(e),
                'business_data': {},
                'document_insights': [],
                'ai_insights': {}
            }

    async def _get_business_data(self) -> Dict[str, Any]:
        """Get business-related data and metrics."""
        try:
            return {
                'business_overview': await self._get_business_overview(),
                'key_metrics': await self._get_key_metrics(),
                'business_sentiment': await self._get_business_sentiment(),
                'industry_performance': await self._get_industry_performance()
            }
        except Exception as e:
            print(f"Error getting business data: {str(e)}")
            return {}

    async def _get_document_insights(self) -> List[Dict[str, Any]]:
        """Get insights from documents."""
        try:
            return await self.multi_agent_system.analyze_documents()
        except Exception as e:
            print(f"Error getting document insights: {str(e)}")
            return []

    async def _get_ai_insights(self) -> Dict[str, Any]:
        """Get AI-generated insights."""
        try:
            market_research = await self.market_research_agent.get_market_insights()
            business_insights = await self.business_consultant_agent.get_business_insights()
            
            return {
                'market_research': market_research,
                'business_insights': business_insights,
                'recommendations': await self._generate_recommendations(market_research, business_insights)
            }
        except Exception as e:
            print(f"Error getting AI insights: {str(e)}")
            return {}

    async def _get_business_overview(self) -> Dict[str, Any]:
        """Get business overview data."""
        try:
            return await self.business_consultant_agent.get_business_overview()
        except Exception as e:
            print(f"Error getting business overview: {str(e)}")
            return {}

    async def _get_key_metrics(self) -> Dict[str, Any]:
        """Get key business metrics."""
        try:
            return await self.business_consultant_agent.get_key_metrics()
        except Exception as e:
            print(f"Error getting key metrics: {str(e)}")
            return {}

    async def _get_business_sentiment(self) -> Dict[str, Any]:
        """Get business sentiment analysis."""
        try:
            return await self.business_consultant_agent.get_business_sentiment()
        except Exception as e:
            print(f"Error getting business sentiment: {str(e)}")
            return {}

    async def _get_industry_performance(self) -> Dict[str, Any]:
        """Get industry performance metrics."""
        try:
            return await self.business_consultant_agent.get_industry_performance()
        except Exception as e:
            print(f"Error getting industry performance: {str(e)}")
            return {}

    async def _generate_recommendations(
        self,
        market_research: Dict[str, Any],
        business_insights: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Generate recommendations based on market research and business insights."""
        try:
            recommendations = []
            
            # Market-based recommendations
            if market_research.get('market_trends'):
                recommendations.append({
                    'type': 'market_opportunity',
                    'title': 'Market Opportunity',
                    'description': market_research['market_trends'].get('opportunity', ''),
                    'priority': 'high',
                    'supporting_data': market_research
                })

            # Business-based recommendations
            if business_insights.get('performance_metrics'):
                recommendations.append({
                    'type': 'business_improvement',
                    'title': 'Business Improvement',
                    'description': business_insights['performance_metrics'].get('recommendation', ''),
                    'priority': 'medium',
                    'supporting_data': business_insights
                })

            return recommendations
        except Exception as e:
            print(f"Error generating recommendations: {str(e)}")
            return [] 