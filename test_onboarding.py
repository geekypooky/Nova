import asyncio
import os
from dotenv import load_dotenv

# Load env variables for Supabase/Groq
load_dotenv()

from nova.orchestrator.agents.onboarding_agent import onboarding_agent

async def run_tests():
    print("==================================================")
    print("[RUNNING ONBOARDING AGENT TEST]")
    print("==================================================\n")

    user_narrative = "I don't know, life has just been really exhausting. I got diagnosed with ADHD last year at 28. Before that I just thought I was broken because I can't ever start things on time, and when someone criticizes me even a little bit at work I just want to quit on the spot and cry in the bathroom. I try so hard to be normal and keep up with everyone else but I'm just so burned out. I just want someone to be nice to me for once."
    
    print(f"User: {user_narrative}\n")
    
    # We use a test UUID for session_id to test Supabase
    session_id = "00000000-0000-0000-0000-000000000001" 
    
    try:
        response = onboarding_agent.process(session_id, user_narrative)
        print(f"Nova: {response.get('reply')}\n")
        print("--- EXTRACTED DATA ---")
        print(f"Diagnoses: {response.get('diagnoses')}")
        print(f"Core Struggles: {response.get('core_struggles')}")
        print(f"Suggested Vibe: {response.get('suggested_vibe')}")
        print("----------------------\n")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(run_tests())
