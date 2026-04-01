"""
Google Gemini LLM Integration for Chatbot
"""
import os
import logging
from langchain_google_genai import ChatGoogleGenerativeAI

logger = logging.getLogger(__name__)


def get_gemini_llm():
    """
    Initialize and return Google Gemini LLM instance
    
    Returns:
        ChatGoogleGenerativeAI: Configured Gemini LLM instance
        
    Raises:
        ValueError: If GOOGLE_GENERATIVE_AI_API_KEY is not set
    """
    api_key = os.getenv("GOOGLE_GENERATIVE_AI_API_KEY", "").strip()
    
    if not api_key:
        logger.error("GOOGLE_GENERATIVE_AI_API_KEY not configured in .env")
        raise ValueError(
            "GOOGLE_GENERATIVE_AI_API_KEY is not set. "
            "Get your API key from https://aistudio.google.com/app/apikey"
        )
    
    try:
        llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            google_api_key=api_key,
            temperature=0.3,  # Balanced creativity and consistency
            max_output_tokens=500,  # Keep responses concise
            convert_system_message_to_human=True,  # Gemini compatibility
        )
        logger.info("Google Gemini LLM initialized successfully")
        return llm
    except Exception as e:
        logger.error(f"Failed to initialize Gemini LLM: {str(e)}")
        raise


def get_gemini_llm_safe():
    """
    Get Gemini LLM with error handling - returns None if initialization fails
    
    Returns:
        ChatGoogleGenerativeAI or None: Configured LLM instance or None
    """
    try:
        return get_gemini_llm()
    except Exception as e:
        logger.warning(f"Gemini LLM not available: {str(e)}")
        return None
