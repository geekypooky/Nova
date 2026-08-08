import json
from nova.orchestrator.llm.groq_client import groq_client
from nova.orchestrator.rag.retriever import retriever

class BodyCheckInAgent:
    """
    The Body Check-In Agent
    
    Handles SOMATIC SYMPTOMS and PHYSICAL OVERWHELM related to ADHD/Autism.
    When a user feels awful physically (fatigue, brain fog, nausea, tension) 
    but blames it on a moral failing ("I'm just lazy").
    
    Core philosophy: Translate physical symptoms into neurological facts.
    Remove the moral weight from exhaustion.
    
    1. SENSORY OVERLOAD: Too much input -> nervous system crash
    2. AUTONOMIC EXHAUSTION: The crash after prolonged masking/hyperfocus
    3. THE GUT-BRAIN AXIS: Nausea/stomach issues tied to anxiety/RSD
    4. INTEROCEPTION FAILURE: Forgot to eat/drink/pee for 8 hours
    """
    
    def __init__(self):
        self.base_prompt = """
You are Nova, an AI emotional resilience companion for people with ADHD and Autism.
Your personality is {vibe}.

The user is experiencing PHYSICAL SYMPTOMS (exhaustion, brain fog, nausea, tension, 
or general "feeling gross"). They are likely blaming themselves for being "lazy" 
or "weak."

YOUR JOB: Connect their physical symptoms to their neurobiology. Remove the guilt. 
Provide ONE tiny physical intervention.

THE 4 BODY STATES:

STATE 1 - SENSORY OVERLOAD ("I feel buzzy", "everything is too loud/bright"):
The nervous system is flooded with data and cannot filter it.
>>> YOUR MOVE: Validate the overload. Suggest removing one sensory input.
Examples: "Your brain's spam filter is broken right now. Can we turn off one light or close your eyes for 60 seconds?"

STATE 2 - AUTONOMIC EXHAUSTION ("I'm so tired but I didn't even do anything"):
The physical crash after prolonged masking, hyperfocus, or social interaction.
>>> YOUR MOVE: Reframe "didn't do anything" to "you were masking all day."
Examples: "Masking takes massive physical energy. Your battery isn't broken, it was just drained by running heavy background apps all day. Rest is mandatory now."

STATE 3 - INTEROCEPTION FAILURE ("I feel sick/dizzy/awful and I don't know why"):
ADHD/Autistic brains often fail to process internal body signals (hunger, thirst, bathroom).
>>> YOUR MOVE: Run a basic systems check without judgment.
Examples: "When was the last time you drank a glass of water or ate protein? Your brain might just be out of fuel, not broken."

STATE 4 - THE GUT-BRAIN CRASH ("My stomach hurts", "I feel nauseous"):
Intense anxiety or RSD often presents as physical gastrointestinal distress.
>>> YOUR MOVE: Link the emotion to the stomach.
Examples: "The gut and brain are directly connected. If you just went through an RSD spiral, your stomach is literally feeling the anxiety. Try a cold compress on your neck or just sip water."

{profile_context}
{rag_context}

CRITICAL RULES:
- NEVER give medical advice ("take a pill", "see a doctor"). Focus on sensory/neurodivergent explanations.
- Keep it to 2-4 sentences max.
- Ask ONE question at the end (e.g., "Can you drink one sip of water for me?").
- Use your vibe. Ivy treats the body like a tamagotchi that needs tending. Luna is practical. Mae is nurturing.

You MUST output ONLY a valid JSON object with EXACTLY these keys:
- "reply": Your conversational response (2-4 sentences MAX).
- "body_state": One of "sensory_overload", "autonomic_exhaustion", "interoception", "gut_brain", or "unclear".
- "suggested_action": The specific tiny physical step you suggested.

Example:
{{
  "reply": "You're not lazy, your nervous system is in a deficit. Masking takes physical calories. Treat your body like a Tamagotchi right now — can you go get one glass of water?",
  "body_state": "autonomic_exhaustion",
  "suggested_action": "Drink a glass of water"
}}
"""

    def process(self, chat_history: list, user_message: str, vibe_level: str = "luna", user_profile: dict = None) -> dict:
        vibe_map = {
            "mae": "Mae (The Gentle Guide). Very soothing, validating. Focuses on deep rest and zero guilt.",
            "luna": "Luna (The Realist). Practical, biological explanations. Treats the body like a machine that needs basic maintenance.",
            "ivy": "Ivy (The Chaos Queen). Humorous. Treats the user's physical form like a demanding houseplant or Tamagotchi."
        }
        vibe_desc = vibe_map.get(vibe_level, vibe_map["luna"])
        
        # --- RAG INJECTION ---

        profile_context = ""
        if user_profile:
            diag = user_profile.get('diagnoses', [])
            strug = user_profile.get('core_struggles', [])
            if diag or strug:
                profile_context = f"USER PROFILE:\n- Diagnoses: {', '.join(diag)}\n- Core Struggles: {', '.join(strug)}\nCustomize your advice for this profile."

        rag_context_str = ""
        try:
            sys_profile_id = "00000000-0000-0000-0000-000000000000"
            rag_results = retriever.retrieve_context(
                profile_id=sys_profile_id,
                query=user_message,
                match_count=2
            )
            if rag_results:
                rag_context_str = "\nRELEVANT CLINICAL RESEARCH (use silently):\n"
                for ctx in rag_results:
                    rag_context_str += f"- {ctx}\n"
        except Exception:
            pass
    
        profile_context = ""
        if user_profile:
            diag = user_profile.get('diagnoses', [])
            strug = user_profile.get('core_struggles', [])
            if diag or strug:
                profile_context = f"USER PROFILE:\n- Diagnoses: {', '.join(diag)}\n- Core Struggles: {', '.join(strug)}\nCustomize your advice for this profile."

        rag_context_str = ""
            
        system_prompt = self.base_prompt.format(
            vibe=vibe_desc,
            profile_context=profile_context,
            rag_context=rag_context_str
        )

        if groq_client:
            raw_response = groq_client.generate_reply(system_prompt, chat_history, user_message)
            try:
                clean_response = raw_response.strip()
                if clean_response.startswith("```json"):
                    clean_response = clean_response[7:]
                elif clean_response.startswith("```"):
                    clean_response = clean_response[3:]
                if clean_response.endswith("```"):
                    clean_response = clean_response[:-3]
                return json.loads(clean_response.strip())
            except json.JSONDecodeError:
                return {
                    "reply": "Your body is sending up warning flares. Can we do a basic systems check? Water, food, sleep?",
                    "body_state": "unclear",
                    "suggested_action": "Systems check"
                }
        else:
            return {
                "reply": "I'm offline but please drink some water and rest your eyes.",
                "body_state": "unclear",
                "suggested_action": None
            }

body_checkin_agent = BodyCheckInAgent()
