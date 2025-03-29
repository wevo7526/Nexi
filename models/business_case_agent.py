from langchain_anthropic import ChatAnthropic
import os
from dotenv import load_dotenv

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
        prompt = f"""Analyze the following business case and identify the core problem:

Case Description:
{case_description}

Provide a clear, concise problem statement that captures the main issue to be solved.
Focus on the root cause and its impact on the business.
"""
        response = self.llm.invoke(prompt)
        return response.content

    def analyze_key_factors(self, case_description):
        """Analyze key factors that influence the business case."""
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

    def identify_constraints(self, case_description):
        """Identify constraints and limitations in the business case."""
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

    def generate_solutions(self, case_description):
        """Generate potential solutions for the business case."""
        prompt = f"""Based on the following business case, generate 3 potential solutions:

Case Description:
{case_description}

For each solution, provide:
1. A detailed description of the solution
2. Pros (advantages and benefits)
3. Cons (disadvantages and risks)

Format your response as a structured list of solutions, each with clear pros and cons.
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
                    'cons': []
                }
            elif line.startswith('Pros:'):
                current_solution['pros'] = [p.strip() for p in line.replace('Pros:', '').split(',') if p.strip()]
            elif line.startswith('Cons:'):
                current_solution['cons'] = [c.strip() for c in line.replace('Cons:', '').split(',') if c.strip()]
            elif current_solution:
                current_solution['description'] += line + ' '
        
        if current_solution:
            solutions.append(current_solution)
            
        return solutions

    def formulate_recommendation(self, solutions):
        """Formulate a final recommendation based on the generated solutions."""
        prompt = f"""Based on the following solutions, formulate a final recommendation:

Solutions:
{solutions}

Provide a comprehensive recommendation that includes:
1. The recommended solution
2. Rationale for the recommendation
3. Implementation timeline
4. Success metrics

Format your response in a clear, structured manner.
"""
        response = self.llm.invoke(prompt)
        
        # Parse the response into a structured format
        recommendation = {
            'solution': '',
            'rationale': '',
            'implementation_timeline': '',
            'success_metrics': []
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
            elif line.startswith('Implementation Timeline:'):
                current_section = 'implementation_timeline'
            elif line.startswith('Success Metrics:'):
                current_section = 'success_metrics'
            elif current_section:
                if current_section == 'success_metrics':
                    recommendation[current_section].append(line)
                else:
                    recommendation[current_section] += line + ' '
        
        return recommendation

    def solve_case(self, case_description):
        """Solve the entire business case and return a complete analysis."""
        return {
            'problem_statement': self.identify_problem(case_description),
            'key_factors': self.analyze_key_factors(case_description),
            'constraints': self.identify_constraints(case_description),
            'solutions': self.generate_solutions(case_description),
            'recommendation': self.formulate_recommendation(self.generate_solutions(case_description))
        } 