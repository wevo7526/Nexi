from typing import Dict, List, Any, Generator
from langchain_anthropic import ChatAnthropic
from langchain.agents import AgentExecutor, create_react_agent
from langchain_core.tools import Tool
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder, PromptTemplate
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain.callbacks.base import BaseCallbackHandler
import json
import os
from dotenv import load_dotenv
import time
import logging
from anthropic._exceptions import OverloadedError, RateLimitError, APIError
import requests
from bs4 import BeautifulSoup
import re

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
                    error_data = response.json()
                    error_type = error_data.get('error', {}).get('type', '')
                    error_message = error_data.get('error', {}).get('message', str(e))
                    
                    logger.info(f"API Response Status: {response.status_code}")
                    logger.info(f"Error Type: {error_type}")
                    logger.info(f"Error Message: {error_message}")
                    
                    # Only retry on specific error types
                    if error_type == 'overloaded_error':
                        if attempt < max_retries - 1:
                            delay = min(base_delay * (2 ** attempt), max_delay)
                            logger.warning(f"Attempt {attempt + 1} failed with overload error. Retrying in {delay} seconds...")
                            time.sleep(delay)
                            continue
                        else:
                            raise Exception("The AI service is currently experiencing high demand. Please try again in a few moments.")
                    elif error_type == 'rate_limit_error':
                        if attempt < max_retries - 1:
                            delay = min(base_delay * (2 ** attempt), max_delay)
                            logger.warning(f"Attempt {attempt + 1} failed with rate limit error. Retrying in {delay} seconds...")
                            time.sleep(delay)
                            continue
                        else:
                            raise Exception("Rate limit exceeded. Please try again in a few moments.")
                    else:
                        logger.error(f"API Error: {error_message}")
                        raise Exception(error_message)
                except Exception as parse_error:
                    logger.error(f"Error parsing API response: {str(parse_error)}")
                    logger.error(f"Raw response: {str(e)}")
                    raise Exception(str(e))
            else:
                logger.error(f"Unexpected error: {str(e)}")
                raise
                
    if last_error:
        raise last_error

class BusinessCaseAgent:
    def __init__(self):
        print("\n🔄 Initializing Business Case Agent...")
        
        # Initialize the language model with better error handling
        try:
            self.llm = ChatAnthropic(
                model="claude-3-5-sonnet-20240620",
                anthropic_api_key=os.getenv("ANTHROPIC_API_KEY"),
                temperature=0.7,
                streaming=True,
                max_tokens=4000,
                timeout=60,
                max_retries=3
            )
            print("✅ LLM initialized")
        except Exception as e:
            logger.error(f"Failed to initialize LLM: {str(e)}")
            raise

    def identify_problem(self, case_description):
        """Identify the core business problem from the case description."""
        def _call():
            try:
                messages = [
                    SystemMessage(content="You are an expert business case analyst. Analyze the case and identify the core problem."),
                    HumanMessage(content=case_description)
                ]
                response = self.llm.invoke(messages)
                return response.content
            except Exception as e:
                logger.error(f"Error in identify_problem: {str(e)}")
                raise
        
        return retry_with_backoff(_call)

    def analyze_key_factors(self, case_description):
        """Analyze key factors that influence the business case."""
        def _call():
            try:
                messages = [
                    SystemMessage(content="You are an expert business case analyst. Analyze the key factors influencing this case."),
                    HumanMessage(content=case_description)
                ]
                response = self.llm.invoke(messages)
                return [factor.strip() for factor in response.content.split('\n') if factor.strip()]
            except Exception as e:
                logger.error(f"Error in analyze_key_factors: {str(e)}")
                raise
        
        return retry_with_backoff(_call)

    def identify_constraints(self, case_description):
        """Identify constraints and limitations in the business case."""
        def _call():
            try:
                messages = [
                    SystemMessage(content="You are an expert business case analyst. Identify the key constraints and limitations in this case."),
                    HumanMessage(content=case_description)
                ]
                response = self.llm.invoke(messages)
                return [constraint.strip() for constraint in response.content.split('\n') if constraint.strip()]
            except Exception as e:
                logger.error(f"Error in identify_constraints: {str(e)}")
                raise
        
        return retry_with_backoff(_call)

    def generate_solutions(self, case_description):
        """Generate potential solutions for the business case."""
        def _call():
            try:
                messages = [
                    SystemMessage(content="You are an expert business case analyst. Generate 3 potential solutions for this case."),
                    HumanMessage(content=case_description)
                ]
                response = self.llm.invoke(messages)
                return self._parse_solutions(response.content)
            except Exception as e:
                logger.error(f"Error in generate_solutions: {str(e)}")
                raise
        
        return retry_with_backoff(_call)

    def _parse_solutions(self, content: str) -> List[Dict[str, Any]]:
        """Parse the solutions response into a structured format."""
        solutions = []
        current_solution = None
        
        for line in content.split('\n'):
            line = line.strip()
            if not line:
                continue
                
            if line.startswith('Solution'):
                if current_solution:
                    solutions.append(current_solution)
                current_solution = {
                    'description': '',
                    'pros': [],
                    'cons': [],
                    'implementation': '',
                    'timeline': ''
                }
            elif line.startswith('Pros:'):
                current_solution['pros'] = [p.strip() for p in line.replace('Pros:', '').split(',') if p.strip()]
            elif line.startswith('Cons:'):
                current_solution['cons'] = [c.strip() for c in line.replace('Cons:', '').split(',') if c.strip()]
            elif line.startswith('Implementation:'):
                current_solution['implementation'] = line.replace('Implementation:', '').strip()
            elif line.startswith('Timeline:'):
                current_solution['timeline'] = line.replace('Timeline:', '').strip()
            elif current_solution:
                current_solution['description'] += line + ' '
        
        if current_solution:
            solutions.append(current_solution)
            
        return solutions

    def formulate_recommendation(self, solutions):
        """Formulate a final recommendation based on the generated solutions."""
        def _call():
            try:
                context = f"Based on these solutions:\n{json.dumps(solutions, indent=2)}"
                messages = [
                    SystemMessage(content="You are an expert business case analyst. Formulate a final recommendation based on the solutions provided."),
                    HumanMessage(content=context)
                ]
                response = self.llm.invoke(messages)
                return self._parse_recommendation(response.content)
            except Exception as e:
                logger.error(f"Error in formulate_recommendation: {str(e)}")
                raise
        
        return retry_with_backoff(_call)

    def _parse_recommendation(self, content: str) -> Dict[str, Any]:
        """Parse the recommendation response into a structured format."""
        recommendation = {
            'solution': '',
            'rationale': '',
            'implementation': '',
            'timeline': '',
            'successMetrics': []
        }
        
        current_section = None
        for line in content.split('\n'):
            line = line.strip()
            if not line:
                continue
                
            if line.startswith('Recommended Solution:'):
                current_section = 'solution'
            elif line.startswith('Rationale:'):
                current_section = 'rationale'
            elif line.startswith('Implementation Plan:'):
                current_section = 'implementation'
            elif line.startswith('Timeline:'):
                current_section = 'timeline'
            elif line.startswith('Success Metrics:'):
                current_section = 'successMetrics'
            elif current_section:
                if current_section == 'successMetrics':
                    recommendation[current_section].append(line)
                else:
                    recommendation[current_section] += line + ' '
        
        return recommendation

    def solve_case(self, case_description):
        """Solve the entire business case and return a complete analysis."""
        try:
            # Generate solutions once to avoid duplicate API calls
            solutions = self.generate_solutions(case_description)
            
            return {
                'problem_statement': self.identify_problem(case_description),
                'key_factors': self.analyze_key_factors(case_description),
                'constraints': self.identify_constraints(case_description),
                'solutions': solutions,
                'recommendation': self.formulate_recommendation(solutions)
            }
        except Exception as e:
            logger.error(f"Error in solve_case: {str(e)}")
            return {
                "error": str(e),
                "type": "error",
                "status": "error"
            } 