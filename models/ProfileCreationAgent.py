from langchain.chat_models import ChatAnthropic
from langchain.memory import ConversationBufferMemory
from langchain.chains import ConversationChain
from langchain.prompts import PromptTemplate
import json
import os
from typing import Dict, Any

class ProfileCreationAgent:
    def __init__(self):
        self.llm = ChatAnthropic(
            anthropic_api_key=os.getenv("ANTHROPIC_API_KEY"),
            model="claude-3-5-sonnet-20240620",
            temperature=0.7
        )
        
        self.memory = ConversationBufferMemory(
            return_messages=True,
            memory_key="chat_history"
        )
        
        self.required_fields = {
            "personal_info": [
                "first_name",
                "last_name",
                "email",
                "phone",
                "date_of_birth"
            ],
            "financial_overview": [
                "annual_income",
                "total_assets",
                "total_liabilities",
                "monthly_expenses",
                "emergency_fund"
            ],
            "investment_profile": [
                "risk_tolerance",
                "investment_experience",
                "investment_goals",
                "target_retirement_age",
                "preferred_investment_types"
            ]
        }
        
        self.profile_data = {
            "personal_info": {},
            "financial_overview": {},
            "investment_profile": {}
        }
        
        template = """You are a professional wealth management advisor helping to create a client profile through conversation.
        Your goal is to gather all required information naturally and provide guidance.
        
        Required fields to collect:
        {required_fields}
        
        Current profile data:
        {profile_data}
        
        Missing fields:
        {missing_fields}
        
        Guidelines:
        1. Ask questions naturally to collect missing information
        2. Validate responses and ask for clarification if needed
        3. Provide context for why each piece of information is important
        4. Give insights based on provided information
        5. Focus on one topic at a time
        6. Format numbers appropriately (e.g., currency with 2 decimal places)
        7. Store dates in YYYY-MM-DD format
        
        Previous conversation:
        {chat_history}
        
        Human: {input}
        Assistant: Let me help you create your wealth management profile. I'll ask questions to understand your financial situation better."""

        self.prompt = PromptTemplate(
            input_variables=["chat_history", "input", "required_fields", "profile_data", "missing_fields"],
            template=template
        )
        
        self.chain = ConversationChain(
            llm=self.llm,
            memory=self.memory,
            prompt=self.prompt,
            verbose=True
        )

    def get_missing_fields(self) -> Dict[str, list]:
        missing = {}
        for category, fields in self.required_fields.items():
            missing_in_category = [
                field for field in fields 
                if field not in self.profile_data[category] 
                or not self.profile_data[category][field]
            ]
            if missing_in_category:
                missing[category] = missing_in_category
        return missing

    def extract_profile_data(self, response: str) -> Dict[str, Any]:
        """Extract structured data from the conversation using Claude's capabilities"""
        extraction_prompt = f"""Based on this conversation response, extract any profile information into a structured format.
        Only extract information that was explicitly provided in the response.
        Format the output as a JSON object with categories: personal_info, financial_overview, and investment_profile.
        
        Response to analyze: {response}
        
        Output the JSON only, no other text."""
        
        try:
            extraction_result = self.llm.predict(extraction_prompt)
            # Clean up the response to ensure it's valid JSON
            json_str = extraction_result.strip().strip('`').strip()
            if json_str:
                extracted_data = json.loads(json_str)
                return extracted_data
            return {}
        except Exception as e:
            print(f"Error extracting profile data: {e}")
            return {}

    def update_profile(self, extracted_data: Dict[str, Any]):
        """Update the profile with extracted data"""
        for category in self.profile_data:
            if category in extracted_data:
                self.profile_data[category].update(extracted_data[category])

    def chat(self, user_input: str) -> Dict[str, Any]:
        """Process user input and return agent response with updated profile"""
        missing_fields = self.get_missing_fields()
        
        response = self.chain.run(
            input=user_input,
            required_fields=json.dumps(self.required_fields, indent=2),
            profile_data=json.dumps(self.profile_data, indent=2),
            missing_fields=json.dumps(missing_fields, indent=2)
        )
        
        # Extract and update profile data
        extracted_data = self.extract_profile_data(response)
        self.update_profile(extracted_data)
        
        # Check if profile is complete
        new_missing_fields = self.get_missing_fields()
        is_complete = len(new_missing_fields) == 0
        
        return {
            "response": response,
            "profile_data": self.profile_data,
            "missing_fields": new_missing_fields,
            "is_complete": is_complete
        } 