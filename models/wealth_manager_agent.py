import os
from langchain_anthropic import ChatAnthropic
from data.data_loader import load_data
from config.settings import ANTHROPIC_API_KEY
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
            api_key=ANTHROPIC_API_KEY
        )

        # Load financial data for context
        self.docs = load_data()

        # Define the system prompt
        self.system_prompt = (
            "You are an advanced AI Wealth Manager capable of analyzing financial data, identifying risks, and offering "
            "personalized financial strategies. You specialize in tailoring advice for goals such as portfolio growth, "
            "retirement planning, risk diversification, and tax efficiency. Use the provided data and adapt to the user's "
            "query to deliver actionable insights.\n\n"
            "When providing analysis, structure your response using the following format:\n"
            "1. Start with a natural language response to the user's query\n"
            "2. Include specific data points using these formats:\n"
            "   - Performance data: 'Performance: value1,value2,value3,...'\n"
            "   - Asset allocation: 'Allocation: label1:value1,label2:value2,...'\n"
            "   - Recommendations: 'Recommendation: detailed recommendation text'\n"
            "   - Educational tips: 'Tip: title|content'\n"
            "   - Scenarios: 'Scenario: scenario description|outcome description'\n"
            "3. Ensure all numerical values are realistic and consistent\n"
            "4. Provide at least 2-3 recommendations, 2-3 educational tips, and 2-3 scenarios\n\n"
            "Context:\n{context}"
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
            multi_scenario_analysis = []
            educational_tips = []

            lines = raw_response.split("\n")
            for line in lines:
                # Extract recommendations
                if "Recommendation:" in line:
                    recommendations.append({"type": "Custom", "details": line.replace("Recommendation: ", "").strip()})
                
                # Extract performance data
                elif "Performance:" in line:
                    try:
                        # Expect performance data in format: "Performance: value1%,value2%,value3%,..."
                        performance_str = line.replace("Performance: ", "").strip()
                        # Remove % symbols and convert to float
                        performance_data = [float(x.strip().replace('%', '')) for x in performance_str.split(",") if x.strip()]
                    except ValueError:
                        print(f"Invalid performance data: {line}")
                
                # Extract allocation data
                elif "Allocation:" in line:
                    # Expect allocation data in format: "Allocation: label1:value1%,label2:value2%,..."
                    allocation_str = line.replace("Allocation: ", "").strip()
                    for part in allocation_str.split(","):
                        try:
                            if ":" in part:
                                label, value = part.split(":")
                                # Remove % symbol and convert to float
                                value = float(value.strip().replace('%', ''))
                                allocation_labels.append(label.strip())
                                allocation_values.append(value)
                            else:
                                print(f"Skipping invalid allocation part: {part}")
                        except ValueError:
                            print(f"Invalid allocation data: {part}")

                # Extract multi-scenario analysis
                elif "Scenario:" in line:
                    try:
                        scenario_str = line.replace("Scenario: ", "").strip()
                        if "|" in scenario_str:
                            scenario, outcome = scenario_str.split("|")
                            multi_scenario_analysis.append({
                                "scenario": scenario.strip(),
                                "outcome": outcome.strip()
                            })
                    except ValueError:
                        print(f"Invalid scenario data: {line}")

                # Extract educational tips
                elif "Tip:" in line:
                    try:
                        tip_str = line.replace("Tip: ", "").strip()
                        if "|" in tip_str:
                            title, content = tip_str.split("|")
                            educational_tips.append({
                                "title": title.strip(),
                                "content": content.strip()
                            })
                    except ValueError:
                        print(f"Invalid tip data: {line}")

            # If no performance data was found, generate some sample data
            if not performance_data:
                performance_data = [7.2, 5.8, 6.5, 8.1, 6.9]  # Sample percentage values

            # If no allocation data was found, generate some sample data
            if not allocation_labels:
                allocation_labels = ["US Stocks", "International Stocks", "Bonds", "Real Estate", "Cash"]
                allocation_values = [40, 20, 30, 5, 5]  # Sample allocation percentages

            # If no recommendations were found, generate some sample recommendations
            if not recommendations:
                recommendations = [
                    {"type": "Portfolio", "details": "Consider rebalancing your portfolio to maintain target asset allocation."},
                    {"type": "Risk", "details": "Review and adjust risk management strategies based on current market conditions."},
                    {"type": "Tax", "details": "Explore tax-efficient investment strategies to optimize returns."}
                ]

            # If no educational tips were found, generate some sample tips
            if not educational_tips:
                educational_tips = [
                    {"title": "Diversification", "content": "Diversifying your portfolio across different asset classes can help reduce risk."},
                    {"title": "Regular Review", "content": "Regularly review and rebalance your portfolio to maintain your target allocation."},
                    {"title": "Long-term Focus", "content": "Maintain a long-term investment perspective to weather market volatility."}
                ]

            # If no multi-scenario analysis was found, generate some sample scenarios
            if not multi_scenario_analysis:
                multi_scenario_analysis = [
                    {
                        "scenario": "Bull Market",
                        "outcome": "Portfolio could grow by 15-20% with current allocation"
                    },
                    {
                        "scenario": "Bear Market",
                        "outcome": "Portfolio might decline by 10-15%, but defensive positions should help limit losses"
                    },
                    {
                        "scenario": "Sideways Market",
                        "outcome": "Portfolio expected to remain stable with potential for 2-5% growth"
                    }
                ]

            # Return structured response
            return {
                "raw_response": raw_response,  # Include raw AI response for debugging
                "current_status": {
                    "net_worth": "Dynamic data parsed from AI response",
                    "cash_flow": "Dynamic data parsed from AI response",
                    "risk_level": "Dynamic data parsed from AI response",
                    "retirement_goal_status": "Dynamic data parsed from AI response"
                },
                "recommendations": recommendations,
                "visual_data": {
                    "portfolio_performance": performance_data,
                    "allocations": {
                        "labels": allocation_labels,
                        "values": allocation_values
                    }
                },
                "educational_tips": educational_tips,
                "multi_scenario_analysis": multi_scenario_analysis
            }
        except Exception as e:
            print(f"Error structuring response: {e}")
            return {"error": f"Failed to structure AI response: {e}"}

    def get_answer(self, query, chat_history=None, thread_id="default", context=""):
        """
        Generate a comprehensive answer and return structured output.
        """
        return self.get_advice(query, thread_id)
