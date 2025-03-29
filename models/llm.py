from langchain_anthropic import ChatAnthropic
import os

def get_llm():
    """Get a configured chat model instance."""
    anthropic_api_key = os.getenv('ANTHROPIC_API_KEY')
    if not anthropic_api_key:
        raise ValueError("ANTHROPIC_API_KEY environment variable is not set")
    
    return ChatAnthropic(
        model="claude-3-5-sonnet-20240620",
        anthropic_api_key=anthropic_api_key,
        temperature=0.7,
        max_tokens=4096
    ) 