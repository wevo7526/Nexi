from langchain_anthropic import ChatAnthropic
from langchain_core.language_models import BaseChatModel
import os
from dotenv import load_dotenv
import time
from anthropic import Anthropic
from anthropic._exceptions import OverloadedError

# Load environment variables
load_dotenv()

def get_llm() -> BaseChatModel:
    """Initialize and return the LLM with retry logic."""
    max_retries = 3
    retry_delay = 2  # seconds
    
    for attempt in range(max_retries):
        try:
            # Initialize Anthropic client with retry settings
            anthropic = Anthropic(
                api_key=os.getenv("ANTHROPIC_API_KEY"),
                max_retries=3,
                timeout=30.0
            )
            
            # Create ChatAnthropic model with retry settings
            llm = ChatAnthropic(
                anthropic=anthropic,
                model="claude-3-sonnet-20240229",
                temperature=0.7,
                max_tokens=4096,
                max_retries=3,
                timeout=30.0
            )
            
            return llm
            
        except OverloadedError as e:
            if attempt < max_retries - 1:
                print(f"API overloaded, retrying in {retry_delay} seconds... (Attempt {attempt + 1}/{max_retries})")
                time.sleep(retry_delay)
                retry_delay *= 2  # Exponential backoff
            else:
                raise Exception("API is currently overloaded. Please try again in a few minutes.")
        except Exception as e:
            raise Exception(f"Error initializing LLM: {str(e)}") 