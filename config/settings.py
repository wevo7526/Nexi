from dotenv import load_dotenv
import os

# Load .env file
load_dotenv()

# Configuration settings
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
SERPAPI_API_KEY = os.getenv("SERPAPI_API_KEY")

# Ensure the keys are loaded properly
if not ANTHROPIC_API_KEY:
    raise ValueError("ANTHROPIC_API_KEY is not set. Please check your .env file.")
if not SERPAPI_API_KEY:
    raise ValueError("SERPAPI_API_KEY is not set. Please check your .env file.")

LOG_FILE_PATH = os.path.join(os.path.dirname(__file__), "../logs/agent.log")
