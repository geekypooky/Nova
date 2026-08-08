import os
from google import genai
from google.genai import types

class GeminiClient:
    def __init__(self):
        # The client will automatically pick up GEMINI_API_KEY from the environment
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key or api_key == "your_gemini_api_key_here":
            raise ValueError("GEMINI_API_KEY is not set correctly in the environment.")
        self.client = genai.Client(api_key=api_key)
        self.model = "gemini-2.0-flash" # Defaulting to the latest flash model for summarization

    def generate_summary(self, transcript: str) -> str:
        """
        Generates a summary of the session transcript.
        """
        prompt = f"""
        You are an AI assistant helping to summarize an emotional resilience session.
        Please provide a concise summary of the key insights from the following conversation:
        
        {transcript}
        """
        
        response = self.client.models.generate_content(
            model=self.model,
            contents=prompt,
        )
        return response.text

# Initialize a singleton instance
try:
    gemini_client = GeminiClient()
except Exception as e:
    gemini_client = None
    print(f"Warning: GeminiClient could not be initialized: {e}")
