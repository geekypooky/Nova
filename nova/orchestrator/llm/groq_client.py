import os
from groq import Groq

class GroqClient:
    def __init__(self):
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key or api_key == "your_groq_api_key_here":
            raise ValueError("GROQ_API_KEY is not set correctly in the environment.")
        
        self.client = Groq(api_key=api_key)
        self.model = "llama-3.3-70b-versatile" # 70B for high quality real-time replies

    def generate_reply(self, system_prompt: str, chat_history: list, user_message: str) -> str:
        """
        Generates a real-time reply from Nova.
        """
        messages = [{"role": "system", "content": system_prompt}]
        messages.extend(chat_history)
        messages.append({"role": "user", "content": user_message})

        completion = self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=0.7,
            max_tokens=512,
            stream=False
        )
        
        return completion.choices[0].message.content

    def transcribe_audio(self, file_content: bytes, filename: str) -> str:
        """
        Transcribes audio bytes using Groq's whisper-large-v3 model.
        """
        try:
            transcription = self.client.audio.transcriptions.create(
                file=(filename, file_content),
                model="whisper-large-v3",
                response_format="text"
            )
            return transcription
        except Exception as e:
            print(f"Transcription failed: {e}")
            return ""

try:
    groq_client = GroqClient()
except Exception as e:
    groq_client = None
    print(f"Warning: GroqClient could not be initialized: {e}")
