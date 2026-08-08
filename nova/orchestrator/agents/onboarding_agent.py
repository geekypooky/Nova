import json
from nova.orchestrator.llm.groq_client import groq_client
import os
from supabase import create_client, Client

class OnboardingAgent:
    """
    The Onboarding Agent
    
    Instead of a sterile form, Nova asks the user an open-ended question about their 
    experience (e.g., "Tell me a bit about your brain. What has life been like so far?").
    
    This agent reads the user's narrative and explicitly extracts:
    1. Diagnoses (e.g., ADHD, Autism, Dyslexia, Anxiety)
    2. Core Struggles (e.g., RSD, Burnout, Task Paralysis, Sensory Overload)
    3. Suggested Vibe (Based on how they speak, should Nova be gentle, dry/logical, or chaotic?)
    """
    
    def __init__(self):
        url = os.environ.get("SUPABASE_URL")
        key = os.environ.get("SUPABASE_SERVICE_KEY")
        self.supabase: Client = create_client(url, key) if url and key else None

        self.system_prompt = """
You are Nova, an AI emotional resilience companion. You are conducting an onboarding intake.
The user is telling you about their life, their brain, and their struggles.

YOUR GOAL: Extract the clinical and behavioral data from their narrative so we can customize Nova's brain to match theirs perfectly.

You need to extract:
1. `diagnoses`: An array of strings. Look for explicitly mentioned conditions (ADHD, ASD, Autism, Dyslexia, CPTSD, Depression, Anxiety, PMDD, etc.). If they imply one but don't state it, you can infer it but add a question mark (e.g., "Possible ASD?").
2. `core_struggles`: An array of strings representing their daily friction points. Choose from: ["RSD", "Task Paralysis", "Sensory Overload", "Burnout", "Masking Exhaustion", "Emotional Dysregulation", "Time Blindness", "Imposter Syndrome", "People Pleasing"].
3. `suggested_vibe`: Choose one of ["mae", "luna", "ivy"]. 
   - 'mae': gentle, nurturing, emotionally safe (if the user seems highly fragile, traumatized, or explicitly requests softness).
   - 'luna': logical, grounded, direct (if the user is analytical, frustrated by ambiguity, or wants practical help).
   - 'ivy': chaotic, sarcastic, protective (if the user uses dark humor, is angry at neurotypical standards, or needs a fierce defender).
4. `reply`: A warm, conversational response (2-4 sentences max) validating their experience and confirming you've customized your systems for them.

You MUST output ONLY a valid JSON object with exactly these keys:
- "diagnoses": list of strings
- "core_struggles": list of strings
- "suggested_vibe": string
- "reply": string

Example Output:
{{
  "diagnoses": ["ADHD", "Anxiety"],
  "core_struggles": ["Task Paralysis", "RSD", "Burnout"],
  "suggested_vibe": "luna",
  "reply": "Thank you for sharing that with me. It sounds like you've been white-knuckling it for a long time. I've locked your profile in for ADHD and Anxiety, and I'll make sure to watch out for RSD and paralysis when we work together."
}}
"""

    def process(self, session_id: str, user_message: str) -> dict:
        """
        Parses the narrative, upserts to Supabase, and returns the response.
        """
        if groq_client:
            raw_response = groq_client.generate_reply(self.system_prompt, [], user_message)
            try:
                clean_response = raw_response.strip()
                if clean_response.startswith("```json"):
                    clean_response = clean_response[7:]
                elif clean_response.startswith("```"):
                    clean_response = clean_response[3:]
                if clean_response.endswith("```"):
                    clean_response = clean_response[:-3]
                
                parsed = json.loads(clean_response.strip())
                
                # Save to Supabase Profiles
                if self.supabase:
                    try:
                        # Ensure we don't try to insert undefined columns if the schema isn't fully updated yet,
                        # but ideally Supabase JSONB or specific columns exist.
                        # We will store this as metadata in a 'preferences' JSONB column if specific columns don't exist,
                        # OR if the columns do exist, we just write them. For now, let's write to standard columns.
                        profile_data = {
                            "id": session_id,
                            "diagnoses": parsed.get("diagnoses", []),
                            "core_struggles": parsed.get("core_struggles", []),
                            "preferred_vibe": parsed.get("suggested_vibe", "luna")
                        }
                        
                        # Use upsert to create or update the profile
                        self.supabase.table("profiles").upsert(profile_data).execute()
                        print(f"[ONBOARDING] Saved profile for {session_id}")
                    except Exception as db_err:
                        print(f"[ONBOARDING] DB Error: {db_err}")
                        # Fallback: if columns don't exist, they need to be created.
                
                return parsed
            except json.JSONDecodeError:
                return {
                    "diagnoses": [],
                    "core_struggles": [],
                    "suggested_vibe": "luna",
                    "reply": "Thank you for sharing that. I've noted down your experience."
                }
        else:
            return {
                "reply": "I'm having trouble connecting to my systems, but I hear you.",
                "diagnoses": [], "core_struggles": [], "suggested_vibe": "luna"
            }

onboarding_agent = OnboardingAgent()
