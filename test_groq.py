import sys
import os
from dotenv import load_dotenv

load_dotenv()

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from nova.orchestrator.llm.groq_client import groq_client

if groq_client is None:
    print("Failed to initialize Groq Client.")
    sys.exit(1)

print("Testing Groq Client for real-time replies...")
system_prompt = "You are Nova, a warm, protective older sister AI emotional resilience companion. Respond in 2 short sentences."
chat_history = [{"role": "user", "content": "I'm just so tired of messing up at work."}]
user_message = "I feel like I can't do anything right today."

try:
    reply = groq_client.generate_reply(system_prompt, chat_history, user_message)
    print("Success! Nova says:")
    print("-" * 20)
    print(reply)
    print("-" * 20)
except Exception as e:
    print(f"Error during API call: {e}")
