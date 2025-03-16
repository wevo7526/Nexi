from typing import Dict, Any, List
import os
from datetime import datetime
from langchain_community.utilities.alpha_vantage import AlphaVantageAPIWrapper
import aiohttp
import asyncio
import logging
import traceback

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

class AlphaVantageService:
    def __init__(self):
        self.api_key = os.getenv('ALPHAVANTAGE_API_KEY')
        logger.debug(f"Initializing AlphaVantageService with API key: {'[REDACTED]' if self.api_key else 'None'}")
        if not self.api_key:
            raise ValueError("ALPHAVANTAGE_API_KEY environment variable is required")
        
        self.wrapper = AlphaVantageAPIWrapper(alphavantage_api_key=self.api_key)
        self.base_url = "https://www.alphavantage.co/query"

    async def get_stock_data(self, symbol: str) -> Dict[str, Any]:
        """
        Get real-time and historical stock data for a given symbol.
        """
        try:
            logger.debug(f"Fetching stock data for symbol: {symbol}")
            params = {
                "function": "TIME_SERIES_DAILY",
                "symbol": symbol,
                "apikey": self.api_key,
                "outputsize": "compact"
            }
            
            logger.debug(f"Making request to Alpha Vantage with params: {params}")
            async with aiohttp.ClientSession() as session:
                async with session.get(self.base_url, params=params) as response:
                    logger.debug(f"Response status: {response.status}")
                    data = await response.json()
                    logger.debug(f"Raw response data: {data}")
                    
                    if "Error Message" in data:
                        raise ValueError(data["Error Message"])
                    
                    return self._process_stock_data(data)
        except Exception as e:
            logger.error(f"Error fetching stock data: {str(e)}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            raise Exception(f"Failed to fetch stock data: {str(e)}")

    async def get_company_overview(self, symbol: str) -> Dict[str, Any]:
        """
        Get company overview including fundamentals and key metrics.
        """
        try:
            params = {
                "function": "OVERVIEW",
                "symbol": symbol,
                "apikey": self.api_key
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(self.base_url, params=params) as response:
                    data = await response.json()
                    
                    if "Error Message" in data:
                        raise ValueError(data["Error Message"])
                    
                    return data
        except Exception as e:
            raise Exception(f"Failed to fetch company overview: {str(e)}")

    async def get_news_sentiment(self, symbol: str = None, topics: str = None) -> Dict[str, Any]:
        """
        Get news and sentiment analysis for a symbol or topics.
        """
        try:
            params = {
                "function": "NEWS_SENTIMENT",
                "apikey": self.api_key,
                "sort": "RELEVANCE"
            }
            
            if symbol:
                params["tickers"] = symbol
            if topics:
                params["topics"] = topics
            
            async with aiohttp.ClientSession() as session:
                async with session.get(self.base_url, params=params) as response:
                    data = await response.json()
                    
                    if "Error Message" in data:
                        raise ValueError(data["Error Message"])
                    
                    return self._process_news_data(data)
        except Exception as e:
            raise Exception(f"Failed to fetch news sentiment: {str(e)}")

    async def search_symbols(self, keywords: str) -> List[Dict[str, Any]]:
        """
        Search for symbols using keywords.
        """
        try:
            result = self.wrapper.search_symbols(keywords)
            return result.get("bestMatches", [])
        except Exception as e:
            raise Exception(f"Failed to search symbols: {str(e)}")

    async def get_technical_indicators(self, symbol: str) -> Dict[str, Any]:
        """
        Get technical indicators for a symbol including RSI, MACD, and SMA.
        """
        try:
            indicators = {}
            
            # Get RSI
            params_rsi = {
                "function": "RSI",
                "symbol": symbol,
                "interval": "daily",
                "time_period": "14",
                "series_type": "close",
                "apikey": self.api_key
            }
            
            # Get MACD
            params_macd = {
                "function": "MACD",
                "symbol": symbol,
                "interval": "daily",
                "series_type": "close",
                "apikey": self.api_key
            }
            
            # Get SMA
            params_sma = {
                "function": "SMA",
                "symbol": symbol,
                "interval": "daily",
                "time_period": "20",
                "series_type": "close",
                "apikey": self.api_key
            }
            
            async with aiohttp.ClientSession() as session:
                # Fetch RSI
                async with session.get(self.base_url, params=params_rsi) as response:
                    rsi_data = await response.json()
                    indicators['rsi'] = self._process_indicator_data(rsi_data, 'RSI')
                
                # Fetch MACD
                async with session.get(self.base_url, params=params_macd) as response:
                    macd_data = await response.json()
                    indicators['macd'] = self._process_indicator_data(macd_data, 'MACD')
                
                # Fetch SMA
                async with session.get(self.base_url, params=params_sma) as response:
                    sma_data = await response.json()
                    indicators['sma'] = self._process_indicator_data(sma_data, 'SMA')
            
            return indicators
        except Exception as e:
            raise Exception(f"Failed to fetch technical indicators: {str(e)}")

    async def get_earnings(self, symbol: str) -> Dict[str, Any]:
        """
        Get company earnings data.
        """
        try:
            params = {
                "function": "EARNINGS",
                "symbol": symbol,
                "apikey": self.api_key
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(self.base_url, params=params) as response:
                    data = await response.json()
                    
                    if "Error Message" in data:
                        raise ValueError(data["Error Message"])
                    
                    return self._process_earnings_data(data)
        except Exception as e:
            raise Exception(f"Failed to fetch earnings data: {str(e)}")

    def _process_stock_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process and format stock data response.
        """
        time_series = data.get("Time Series (Daily)", {})
        processed_data = {
            "metadata": data.get("Meta Data", {}),
            "prices": [],
            "latest": None
        }
        
        for date, values in time_series.items():
            price_data = {
                "date": date,
                "open": float(values["1. open"]),
                "high": float(values["2. high"]),
                "low": float(values["3. low"]),
                "close": float(values["4. close"]),
                "volume": int(values["5. volume"])
            }
            processed_data["prices"].append(price_data)
            
            if not processed_data["latest"]:
                processed_data["latest"] = price_data
        
        processed_data["prices"].sort(key=lambda x: x["date"])
        return processed_data

    def _process_news_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process and format news sentiment data.
        """
        feed = data.get("feed", [])
        processed_data = {
            "articles": [],
            "sentiment_summary": {
                "positive": 0,
                "negative": 0,
                "neutral": 0
            }
        }
        
        for article in feed:
            sentiment_score = float(article.get("overall_sentiment_score", 0))
            sentiment = "neutral"
            if sentiment_score > 0.2:
                sentiment = "positive"
                processed_data["sentiment_summary"]["positive"] += 1
            elif sentiment_score < -0.2:
                sentiment = "negative"
                processed_data["sentiment_summary"]["negative"] += 1
            else:
                processed_data["sentiment_summary"]["neutral"] += 1
            
            processed_article = {
                "title": article.get("title"),
                "url": article.get("url"),
                "time_published": article.get("time_published"),
                "summary": article.get("summary"),
                "sentiment": sentiment,
                "sentiment_score": sentiment_score,
                "topics": article.get("topics", []),
                "ticker_sentiment": article.get("ticker_sentiment", [])
            }
            processed_data["articles"].append(processed_article)
        
        return processed_data

    def _process_indicator_data(self, data: Dict[str, Any], indicator_type: str) -> Dict[str, Any]:
        """
        Process technical indicator data.
        """
        if "Technical Analysis" not in data:
            return {"error": "No indicator data available"}
            
        time_series = data[f"Technical Analysis: {indicator_type}"]
        processed_data = {
            "values": [],
            "latest": None
        }
        
        for date, values in time_series.items():
            indicator_data = {
                "date": date,
                "value": float(next(iter(values.values())))
            }
            processed_data["values"].append(indicator_data)
            
            if not processed_data["latest"]:
                processed_data["latest"] = indicator_data
        
        processed_data["values"].sort(key=lambda x: x["date"])
        return processed_data

    def _process_earnings_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process earnings data response.
        """
        annual_earnings = data.get("annualEarnings", [])
        quarterly_earnings = data.get("quarterlyEarnings", [])
        
        processed_data = {
            "annual": [],
            "quarterly": [],
            "latest": None
        }
        
        for earning in annual_earnings:
            processed_data["annual"].append({
                "fiscalYear": earning.get("fiscalDateEnding"),
                "reportedEPS": float(earning.get("reportedEPS", 0))
            })
            
        for earning in quarterly_earnings:
            quarterly_data = {
                "date": earning.get("fiscalDateEnding"),
                "reportedEPS": float(earning.get("reportedEPS", 0)),
                "estimatedEPS": float(earning.get("estimatedEPS", 0)),
                "surprise": float(earning.get("surprise", 0)),
                "surprisePercentage": float(earning.get("surprisePercentage", 0))
            }
            processed_data["quarterly"].append(quarterly_data)
            
            if not processed_data["latest"]:
                processed_data["latest"] = quarterly_data
        
        return processed_data 