import sys
import os
from dotenv import load_dotenv

load_dotenv()

# Add the root directory to PYTHONPATH so we can import from nova
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from nova.orchestrator.llm.nvidia_client import nvidia_client

if nvidia_client is None:
    print("Failed to initialize Nvidia Client.")
    sys.exit(1)

print("Testing Nvidia Client...")
transcript = "User: I've been feeling really overwhelmed with work lately. It's just too much.\nNova: I hear you. It's completely valid to feel that way when things pile up. Let's take a deep breath."

try:
    summary = nvidia_client.generate_summary(transcript)
    print("Success! Here is the summary:")
    print("-" * 20)
    print(summary)
    print("-" * 20)
except Exception as e:
    print(f"Error during API call: {e}")
