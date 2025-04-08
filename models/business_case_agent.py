from langchain_anthropic import ChatAnthropic
import os
from dotenv import load_dotenv
import time
import logging
from anthropic._exceptions import OverloadedError, RateLimitError, APIError

# Configure logging
logger = logging.getLogger(__name__)

def retry_with_backoff(func, max_retries=3, base_delay=2, max_delay=10):
    """Execute a function with exponential backoff retry logic."""
    last_error = None
    for attempt in range(max_retries):
        try:
            return func()
        except (OverloadedError, RateLimitError) as e:
            last_error = e
            if attempt < max_retries - 1:
                delay = min(base_delay * (2 ** attempt), max_delay)
                logger.warning(f"Attempt {attempt + 1} failed with {str(e)}. Retrying in {delay} seconds...")
                time.sleep(delay)
            continue
        except APIError as e:
            last_error = e
            if attempt < max_retries - 1:
                delay = min(base_delay * (2 ** attempt), max_delay)
                logger.warning(f"Attempt {attempt + 1} failed with {str(e)}. Retrying in {delay} seconds...")
                time.sleep(delay)
            continue
        except Exception as e:
            raise e

    if last_error:
        if isinstance(last_error, OverloadedError):
            raise Exception("The AI service is currently experiencing high demand. Please try again in a few moments.")
        elif isinstance(last_error, RateLimitError):
            raise Exception("Too many requests. Please wait a moment before trying again.")
        else:
            raise Exception(f"An error occurred: {str(last_error)}")

class BusinessCaseAgent:
    def __init__(self):
        load_dotenv()
        self.llm = ChatAnthropic(
            model="claude-3-5-sonnet-20240620",
            temperature=0.7,
            max_tokens=4096,
            api_key=os.getenv("ANTHROPIC_API_KEY")
        )

    def identify_problem(self, case_description):
        """Identify the core business problem from the case description."""
        def _call():
            prompt = f"""Analyze the following business case and identify the core problem:

Case Description:
{case_description}

Provide a clear, concise problem statement that captures the main issue to be solved.
Focus on the root cause and its impact on the business.
"""
            response = self.llm.invoke(prompt)
            return response.content
        
        return retry_with_backoff(_call)

    def analyze_key_factors(self, case_description):
        """Analyze key factors that influence the business case."""
        def _call():
            prompt = f"""Analyze the following business case and identify key factors that influence the situation:

Case Description:
{case_description}

List the most important factors that need to be considered in solving this case.
Include both internal and external factors.
"""
            response = self.llm.invoke(prompt)
            # Split the response into a list of factors
            factors = [factor.strip() for factor in response.content.split('\n') if factor.strip()]
            return factors
        
        return retry_with_backoff(_call)

    def identify_constraints(self, case_description):
        """Identify constraints and limitations in the business case."""
        def _call():
            prompt = f"""Analyze the following business case and identify constraints and limitations:

Case Description:
{case_description}

List the key constraints that need to be considered, including:
- Resource limitations
- Time constraints
- Budget restrictions
- Technical limitations
- Regulatory requirements
"""
            response = self.llm.invoke(prompt)
            # Split the response into a list of constraints
            constraints = [constraint.strip() for constraint in response.content.split('\n') if constraint.strip()]
            return constraints
        
        return retry_with_backoff(_call)

    def generate_solutions(self, case_description):
        """Generate potential solutions for the business case."""
        def _call():
            prompt = f"""Based on the following business case, generate 3 potential solutions:

Case Description:
{case_description}

For each solution, provide:
1. A detailed description of the solution
2. Pros (advantages and benefits)
3. Cons (disadvantages and risks)
4. Implementation steps
5. Timeline

Format your response as a structured list of solutions, each with clear pros, cons, implementation, and timeline.
"""
            response = self.llm.invoke(prompt)
            # Parse the response into a structured format
            solutions = []
            current_solution = None
            
            for line in response.content.split('\n'):
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
        
        return retry_with_backoff(_call)

    def formulate_recommendation(self, solutions):
        """Formulate a final recommendation based on the generated solutions."""
        def _call():
            prompt = f"""Based on the following solutions, formulate a final recommendation:

Solutions:
{solutions}

Provide a comprehensive recommendation that includes:
1. The recommended solution
2. Rationale for the recommendation
3. Implementation plan
4. Timeline
5. Success metrics

Format your response in a clear, structured manner.
"""
            response = self.llm.invoke(prompt)
            
            # Parse the response into a structured format
            recommendation = {
                'solution': '',
                'rationale': '',
                'implementation': '',
                'timeline': '',
                'successMetrics': []
            }
            
            current_section = None
            for line in response.content.split('\n'):
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
        
        return retry_with_backoff(_call)

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