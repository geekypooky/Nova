import asyncio
import os
from dotenv import load_dotenv

# Load env variables for Supabase/Groq
load_dotenv()

from nova.orchestrator.router import chat_with_nova, ChatRequest

async def run_tests():
    print("==================================================")
    print("[RUNNING CHARACTER MIRROR TEST]")
    print("==================================================\n")

    chat_history = []
    
    # Turn 1
    msg1 = "I think I'm too much."
    print(f"User: {msg1}")
    req1 = ChatRequest(session_id="mirror_test_1", message=msg1, vibe_level="luna", chat_history=chat_history)
    resp1 = await chat_with_nova(req1)
    print(f"Nova (Turn 1): {resp1.reply}\n")
    chat_history.append({"role": "user", "content": msg1})
    chat_history.append({"role": "assistant", "content": resp1.reply})
    
    # Turn 2
    msg2 = "I told my manager her plan wouldn't work, with three reasons, in front of everyone."
    print(f"User: {msg2}")
    req2 = ChatRequest(session_id="mirror_test_1", message=msg2, vibe_level="luna", chat_history=chat_history)
    resp2 = await chat_with_nova(req2)
    print(f"Nova (Turn 2): {resp2.reply}\n")
    chat_history.append({"role": "user", "content": msg2})
    chat_history.append({"role": "assistant", "content": resp2.reply})
    
    # Turn 3
    msg3 = "kind of annoying honestly, but also... she knew what she wanted"
    print(f"User: {msg3}")
    req3 = ChatRequest(session_id="mirror_test_1", message=msg3, vibe_level="luna", chat_history=chat_history)
    resp3 = await chat_with_nova(req3)
    print(f"Nova (Turn 3): {resp3.reply}\n")
    chat_history.append({"role": "user", "content": msg3})
    chat_history.append({"role": "assistant", "content": resp3.reply})
    
    # Turn 4
    msg4 = "particular. maybe even respectable"
    print(f"User: {msg4}")
    req4 = ChatRequest(session_id="mirror_test_1", message=msg4, vibe_level="luna", chat_history=chat_history)
    resp4 = await chat_with_nova(req4)
    print(f"Nova (Turn 4): {resp4.reply}\n")


if __name__ == "__main__":
    asyncio.run(run_tests())
