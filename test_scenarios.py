import asyncio
import os
from dotenv import load_dotenv

# Load env variables for Supabase/Groq
load_dotenv()

from nova.orchestrator.router import chat_with_nova, ChatRequest

async def run_tests():
    scenarios = [
        {
            "name": "1. Emotional Shutdown (Loop Breaker)",
            "message": "I've been staring at the wall for 3 days. What's the point of anything anymore. I've wasted so much time.",
            "vibe": "mae"
        },
        {
            "name": "2. Executive Dysfunction (Task Paralysis)",
            "message": "I need to write this email to my professor but I literally can't make my hands open the laptop. It's too overwhelming.",
            "vibe": "luna"
        },
        {
            "name": "3. RSD / Social Coaching",
            "message": "I texted my friend 5 hours ago and they read it but didn't reply. They definitely hate me and think I'm annoying.",
            "vibe": "ivy"
        },
        {
            "name": "4. Inner Critic Roaster",
            "message": "I forgot my keys again. I'm so incredibly stupid. I ruin everything I touch.",
            "vibe": "ivy"
        },
        {
            "name": "5. Body Check-In",
            "message": "I feel so nauseous and dizzy. Everything is too loud and I'm just so exhausted even though I didn't do anything today.",
            "vibe": "luna"
        },
        {
            "name": "6. Identity & Unmasking",
            "message": "I'm so angry I wasn't diagnosed until I was 30. I don't even know what parts of me are real and what parts are just trauma responses.",
            "vibe": "mae"
        }
    ]

    print("==================================================")
    print("[RUNNING NOVA SCENARIO TESTS]")
    print("==================================================\n")

    for idx, scenario in enumerate(scenarios):
        print(f"[{scenario['name']}]")
        print(f"User ({scenario['vibe']}): {scenario['message']}")
        
        req = ChatRequest(
            session_id="test_session_123",
            message=scenario["message"],
            vibe_level=scenario["vibe"]
        )
        
        try:
            response = await chat_with_nova(req)
            print(f"Nova: {response.reply}")
        except Exception as e:
            print(f"Error: {e}")
        
        print("-" * 50 + "\n")

if __name__ == "__main__":
    asyncio.run(run_tests())
