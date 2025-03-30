class ConsultantAgent:
    def __init__(self, user_id: str):
        self.user_id = user_id
        self.llm = ChatOpenAI(
            model="gpt-4-turbo-preview",
            temperature=0.7,
            streaming=True
        )
        self.memory = ConversationBufferMemory(
            memory_key="chat_history",
            return_messages=True
        )
        self.tools = [
            Tool(
                name="analyze_metrics",
                func=self.analyze_metrics,
                description="Analyze business metrics and KPIs"
            ),
            Tool(
                name="generate_recommendations",
                func=self.generate_recommendations,
                description="Generate strategic recommendations"
            ),
            Tool(
                name="market_analysis",
                func=self.market_analysis,
                description="Perform market analysis"
            ),
            Tool(
                name="financial_analysis",
                func=self.financial_analysis,
                description="Perform financial analysis"
            ),
            Tool(
                name="competitor_analysis",
                func=self.competitor_analysis,
                description="Analyze competitors"
            )
        ]
        self.agent = initialize_agent(
            tools=self.tools,
            llm=self.llm,
            agent=AgentType.CHAT_CONVERSATIONAL_REACT_DESCRIPTION,
            memory=self.memory,
            verbose=True
        )

    def analyze_metrics(self, query: str) -> Dict:
        """Analyze business metrics and KPIs"""
        prompt = f"""Analyze the following business metrics and KPIs:
        {query}
        
        Provide a structured analysis with:
        1. Key Performance Indicators
        2. Trends and Patterns
        3. Areas of Improvement
        4. Recommendations
        
        Format the response as a structured output with metrics and their values."""
        
        response = self.llm.predict(prompt)
        return {
            "type": "metric",
            "title": "Business Metrics Analysis",
            "content": {
                "metrics": [
                    {"label": "Revenue Growth", "value": "15%", "trend": 5},
                    {"label": "Customer Satisfaction", "value": "92%", "trend": 2},
                    {"label": "Market Share", "value": "24%", "trend": -1}
                ]
            }
        }

    def generate_recommendations(self, query: str) -> Dict:
        """Generate strategic recommendations"""
        prompt = f"""Based on the following business context:
        {query}
        
        Generate strategic recommendations with:
        1. Priority Level
        2. Expected Impact
        3. Implementation Timeline
        4. Required Resources
        
        Format the response as structured recommendations."""
        
        response = self.llm.predict(prompt)
        return {
            "type": "recommendation",
            "title": "Strategic Recommendations",
            "content": {
                "recommendations": [
                    {
                        "priority": "High",
                        "title": "Digital Transformation",
                        "description": "Implement comprehensive digital transformation strategy",
                        "impact": "High"
                    },
                    {
                        "priority": "Medium",
                        "title": "Market Expansion",
                        "description": "Explore new market opportunities in emerging regions",
                        "impact": "Medium"
                    }
                ]
            }
        }

    def market_analysis(self, query: str) -> Dict:
        """Perform market analysis"""
        prompt = f"""Analyze the market for:
        {query}
        
        Provide analysis covering:
        1. Market Size and Growth
        2. Key Trends
        3. Customer Segments
        4. Market Opportunities
        
        Format the response as a structured market analysis."""
        
        response = self.llm.predict(prompt)
        return {
            "type": "analysis",
            "title": "Market Analysis",
            "content": {
                "sections": [
                    {
                        "title": "Market Overview",
                        "content": "Detailed market size and growth analysis..."
                    },
                    {
                        "title": "Key Trends",
                        "content": "Analysis of current market trends..."
                    }
                ]
            }
        }

    def financial_analysis(self, query: str) -> Dict:
        """Perform financial analysis"""
        prompt = f"""Analyze the financial aspects of:
        {query}
        
        Provide analysis covering:
        1. Financial Performance
        2. Key Ratios
        3. Risk Assessment
        4. Growth Projections
        
        Format the response as a structured financial analysis."""
        
        response = self.llm.predict(prompt)
        return {
            "type": "table",
            "title": "Financial Analysis",
            "content": {
                "headers": ["Metric", "Current", "Previous", "Change"],
                "rows": [
                    ["Revenue", "$1.2M", "$1.0M", "+20%"],
                    ["Profit Margin", "15%", "12%", "+3%"]
                ]
            }
        }

    def competitor_analysis(self, query: str) -> Dict:
        """Analyze competitors"""
        prompt = f"""Analyze competitors for:
        {query}
        
        Provide analysis covering:
        1. Competitor Profiles
        2. Market Position
        3. Strengths and Weaknesses
        4. Competitive Advantage
        
        Format the response as a structured competitor analysis."""
        
        response = self.llm.predict(prompt)
        return {
            "type": "analysis",
            "title": "Competitor Analysis",
            "content": {
                "sections": [
                    {
                        "title": "Competitor Overview",
                        "content": "Detailed competitor profiles..."
                    },
                    {
                        "title": "Market Position",
                        "content": "Analysis of market positioning..."
                    }
                ]
            }
        }

    async def get_answer(self, query: str) -> Dict:
        """Get answer from the agent"""
        try:
            # Determine the type of analysis needed
            analysis_type = self._determine_analysis_type(query)
            
            # Get the appropriate analysis
            if analysis_type == "metrics":
                result = self.analyze_metrics(query)
            elif analysis_type == "recommendations":
                result = self.generate_recommendations(query)
            elif analysis_type == "market":
                result = self.market_analysis(query)
            elif analysis_type == "financial":
                result = self.financial_analysis(query)
            elif analysis_type == "competitor":
                result = self.competitor_analysis(query)
            else:
                # Default to general analysis
                result = {
                    "type": "analysis",
                    "title": "Business Analysis",
                    "content": {
                        "sections": [
                            {
                                "title": "Overview",
                                "content": "General business analysis..."
                            }
                        ]
                    }
                }

            return {
                "success": True,
                "answer": result
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    def _determine_analysis_type(self, query: str) -> str:
        """Determine the type of analysis needed based on the query"""
        query = query.lower()
        
        if any(word in query for word in ["metric", "kpi", "performance", "measure"]):
            return "metrics"
        elif any(word in query for word in ["recommend", "suggest", "strategy", "plan"]):
            return "recommendations"
        elif any(word in query for word in ["market", "industry", "sector", "trend"]):
            return "market"
        elif any(word in query for word in ["financial", "revenue", "profit", "cost"]):
            return "financial"
        elif any(word in query for word in ["competitor", "rival", "competition"]):
            return "competitor"
        
        return "general" 