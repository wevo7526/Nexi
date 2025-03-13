import os
from langchain_anthropic import ChatAnthropic
from data.data_loader import load_data
from config.settings import API_KEY
from langchain_community.document_loaders import (
    UnstructuredWordDocumentLoader,
    UnstructuredExcelLoader,
    UnstructuredPDFLoader,
    UnstructuredPowerPointLoader,
)

class WealthManagerAgent:
    def __init__(self):
        """
        Initialize the WealthManagerAgent with an Anthropic-based language model.
        """
        # Initialize the ChatAnthropic model
        self.llm = ChatAnthropic(
            model="claude-3-5-sonnet-20240620",
            temperature=0.7,
            max_tokens=2048,
            api_key=API_KEY
        )

        # Load financial data for context
        self.docs = load_data()

        # Define the system prompt
        self.system_prompt = (
            "You are an advanced AI Wealth Manager capable of analyzing financial data, identifying risks, and offering "
            "personalized financial strategies. You specialize in tailoring advice for goals such as portfolio growth, "
            "retirement planning, risk diversification, and tax efficiency. Use the provided data and adapt to the user's "
            "query to deliver actionable insights. Ensure your responses are structured and formatted correctly.\n\n{context}"
        )

    def preprocess_input(self, user_input):
        """
        Preprocess user input into a format usable by the AI model.
        """
        if isinstance(user_input, str):
            return user_input
        elif isinstance(user_input, dict):
            return " ".join(f"{key}: {value}" for key, value in user_input.items())
        elif isinstance(user_input, list):
            return " ".join(str(item) for item in user_input)
        else:
            return str(user_input)

    def load_document(self, file_path):
        """
        Load a document and extract content based on its file type.
        """
        try:
            file_extension = os.path.splitext(file_path)[1].lower()
            if file_extension == '.docx':
                loader = UnstructuredWordDocumentLoader(file_path, mode="elements")
            elif file_extension == '.pdf':
                loader = UnstructuredPDFLoader(file_path, mode="elements")
            elif file_extension in ['.xls', '.xlsx']:
                loader = UnstructuredExcelLoader(file_path, mode="elements")
            elif file_extension in ['.ppt', '.pptx']:
                loader = UnstructuredPowerPointLoader(file_path, mode="elements")
            else:
                raise ValueError(f"Unsupported file type: {file_extension}")

            self.docs = loader.load()
            return self.docs
        except Exception as e:
            print(f"Error loading document: {e}")
            return []

    def get_advice(self, query, thread_id="default"):
        """
        Process the user's query and generate structured output dynamically.
        """
        try:
            # Preprocess query
            query = self.preprocess_input(query)

            # Load context from documents
            context = "\n".join([doc.page_content for doc in self.docs]) if self.docs else "No document context available."

            # Send query to AI model
            messages = [
                ("system", self.system_prompt.format(context=context)),
                ("human", query)
            ]

            response = self.llm.invoke(messages)
            raw_response = response.content.strip()

            # Log raw AI response for debugging
            print(f"Raw AI Response:\n{raw_response}")

            # Parse and structure response
            return self._generate_structured_output(raw_response)
        except Exception as e:
            print(f"Error generating advice: {e}")
            return {"error": f"Failed to process query: {e}"}

    def _generate_structured_output(self, raw_response):
        """
        Convert the AI's raw response into structured data for the frontend.
        """
        try:
            if not raw_response:
                raise ValueError("Empty response from AI model.")

            # Initialize placeholders
            recommendations = []
            performance_data = []
            allocation_labels = []
            allocation_values = []

            lines = raw_response.split("\n")
            for line in lines:
                # Extract recommendations
                if "Recommendation:" in line:
                    recommendations.append({"type": "Custom", "details": line.replace("Recommendation: ", "").strip()})
                
                # Extract performance data
                elif "Performance:" in line:
                    try:
                        performance_data = [float(x) for x in line.replace("Performance: ", "").split(",") if x.strip()]
                    except ValueError:
                        print(f"Invalid performance data: {line}")
                
                # Extract allocation data
                elif "Allocation:" in line:
                    parts = line.replace("Allocation: ", "").split(",")
                    for part in parts:
                        try:
                            if ":" in part:
                                label, value = part.split(":")
                                allocation_labels.append(label.strip())
                                allocation_values.append(float(value.strip()))
                            else:
                                print(f"Skipping invalid allocation part: {part}")
                        except ValueError:
                            print(f"Invalid allocation data: {part}")

            # Return structured response
            return {
                "raw_response": raw_response,  # Include raw AI response for debugging
                "current_status": {
                    "net_worth": "Dynamic data parsed from AI response",
                    "cash_flow": "Dynamic data parsed from AI response",
                    "risk_level": "Dynamic data parsed from AI response",
                    "retirement_goal_status": "Dynamic data parsed from AI response"
                },
                "recommendations": recommendations or [{"type": "None", "details": "No recommendations available."}],
                "visual_data": {
                    "portfolio_performance": performance_data or [0],  # Ensure default value if empty
                    "allocations": {
                        "labels": allocation_labels or ["No data"],
                        "values": allocation_values or [0]
                    }
                },
                "educational_tips": [
                    {"title": "Sample Tip", "content": "Dynamic educational tips parsed from AI."}
                ]
            }
        except Exception as e:
            print(f"Error structuring response: {e}")
            return {"error": f"Failed to structure AI response: {e}"}

    def get_answer(self, query, chat_history=None, thread_id="default", context=""):
        """
        Generate a comprehensive answer and return structured output.
        """
        return self.get_advice(query, thread_id)
