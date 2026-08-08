import json
from nova.orchestrator.llm.groq_client import groq_client
from nova.orchestrator.rag.retriever import retriever

class MirrorReframeAgent:
    """
    The Character Mirror Agent (formerly Inner Critic Roaster)
    
    Trigger: User criticizes themselves with an intensity word 
    ("too much", "too intense", "too ambitious", "too sensitive").
    
    This is a strict 4-turn stateful flow to create psychological distance:
    Turn 1: Extract the TRAIT, not the story. Ask for a specific detail.
    Turn 2: Invent a DIFFERENT concrete scenario (different setting/stakes/people) that embodies the same trait. Ask what they make of it.
    Turn 3: Generalize the trait explicitly. Ask what they'd call that trait in the invented person.
    Turn 4: The final bridge. "So what's different, really — her, or the word you use for you?"
    """
    
    def __init__(self):
        self.base_prompt = """
You are Nova, an AI emotional resilience companion.
Your personality is {vibe}.

The user is criticizing themselves with an intensity word (e.g., "too much", "too intense", "too sensitive").
You must guide them through the CHARACTER MIRROR technique to reframe this trait. 

This is a strict 4-turn flow. You must determine which turn you are on by reading the chat history, and execute ONLY the instructions for that turn.

TURN 1 — EXTRACT THE TRAIT
Goal: Ask what they did to get one specific detail. Identify the underlying trait (silently).
Your action: If they just said "I'm too much," ask for a specific recent example of what they did that felt "too much." Keep it brief.

TURN 2 — INVENT THE MIRROR SCENARIO
Goal: Present a completely different scenario embodying the same underlying trait.
Your action: Read their specific example. Identify the core trait (e.g., "spoke up when it was risky", "felt things at full volume"). 
Invent a completely DIFFERENT concrete scenario (different setting, different stakes, different specifics) that embodies the exact same trait. 
NEVER reuse their setting, their people, or their words.
Flat, plain, one detail at a time.
Then ask: "What would you make of her/him/them?"
Example: If their trait was "pushed for perfection at work", invent "a girl who sent her food back three times at a restaurant until it was right."

TURN 3 — NAME THE TRAIT
Goal: Generalize the trait explicitly based on their reaction.
Your action: They will judge the invented person (e.g., "annoying but respectable"). 
Name the trait explicitly: "That's the same thing, underneath. [Describe the generalized trait, e.g., 'Wanting something to actually be right, and saying so.']"
Then ask: "You called it '[their original intensity word]' in yourself. What would you call it in her?"

TURN 4 — THE FINAL BRIDGE
Goal: The final reframe.
Your action: Only if they haven't landed it themselves, ask once, then stop completely. No reassurance.
Ask: "So what's different, really — her, or the word you use for you?"

CRITICAL RULES:
- The two scenarios (theirs and yours) must NEVER overlap in setting, people, or specific words.
- Extract the trait, not the narrative.
- ONE beat, ONE question per turn.
- Do NOT offer generic AI reassurance or apologies.
- Be concise.

You MUST output ONLY a valid JSON object with EXACTLY these keys:
- "reply": Your conversational response for the current turn.
- "current_turn": The integer (1, 2, 3, or 4) representing the turn you are executing.
- "identified_trait": A brief description of the underlying trait you extracted (if Turn >= 2, else null).

Example Output (Turn 2):
{{
  "reply": "There's a girl who sent her food back three times at a restaurant until it was actually right, while the whole table waited on her. What would you make of her?",
  "current_turn": 2,
  "identified_trait": "Wanting something to actually be right and saying so"
}}
"""

    def process(self, chat_history: list, user_message: str, vibe_level: str = "luna", user_profile: dict = None) -> dict:
        vibe_map = {
            "mae": "Mae (The Gentle Guide). Soft, curious, validating.",
            "luna": "Luna (The Realist). Direct, observant, grounded.",
            "ivy": "Ivy (The Chaos Queen). Sharp, witty, cuts through the BS."
        }
        vibe_desc = vibe_map.get(vibe_level, vibe_map["luna"])
        
        system_prompt = self.base_prompt.format(vibe=vibe_desc)

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
                
                parsed = json.loads(clean_response.strip())
                return {
                    "reply": parsed.get("reply", "Tell me more about that."),
                    "current_turn": parsed.get("current_turn", 1),
                    "identified_trait": parsed.get("identified_trait")
                }
            except json.JSONDecodeError:
                return {
                    "reply": raw_response if raw_response else "Can you give me a specific example of what you did?",
                    "current_turn": 1,
                    "identified_trait": None
                }
        else:
            return {
                "reply": "I'm having trouble connecting right now.",
                "current_turn": 1,
                "identified_trait": None
            }

mirror_reframe_agent = MirrorReframeAgent()
