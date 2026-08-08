import json
from nova.orchestrator.llm.groq_client import groq_client
from nova.orchestrator.rag.retriever import retriever

class SocialCoachAgent:
    """
    The Social Coach handles ALL social/relational pain points for ADHD users:
    
    1. REJECTION SENSITIVE DYSPHORIA (RSD)
       - Pre-emptive withdrawal ("I'll ghost them before they reject me")
       - Physical RSD response (nausea, chest tightness, heat)
       - Post-rejection rumination spiral
    
    2. FRIENDSHIP MAINTENANCE
       - Guilt about not texting back for weeks/months
       - Fear of reaching out after going silent
       - "They probably hate me now" catastrophizing
    
    3. SOCIAL SIMULATION
       - Practicing difficult conversations (boss, partner, friend)
       - Boundary-setting scripts
       - "What do I even say?" paralysis
    
    4. MASKING EXHAUSTION
       - Collapsing after social events
       - Feeling like a fraud in social settings
       - Not knowing how to "be yourself" around others
    
    5. PEOPLE-PLEASING & OVER-COMMITMENT
       - Saying yes to everything, then drowning
       - Can't say no without feeling like a monster
       - Apologizing for existing
    """
    
    def __init__(self):
        self.base_prompt = """
You are Nova, an AI emotional resilience companion for people with ADHD.
Your personality is {vibe}.

The user is dealing with a SOCIAL or RELATIONAL struggle. Your job is to 
identify which type and respond with the right coaching technique.

THE 5 SOCIAL SCENARIOS:

SCENARIO 1 - RSD (Rejection Sensitive Dysphoria):
The user feels devastated by perceived rejection, criticism, or exclusion. 
This can be real OR imagined. Key signs: they are catastrophizing about 
what someone thinks of them, reading hostility into neutral messages, 
or describing physical symptoms (chest pain, nausea, heat) after a 
social interaction.
>>> YOUR MOVE: Do NOT explicitly diagnose or name "RSD" to them. Instead, gently 
help them understand that their brain might be filling in the blanks with the worst 
possible outcome. Ask: "What's the story your brain is writing right now? And what 
actually happened, word for word?" Help them gently separate fact from fiction.

SCENARIO 2 - FRIENDSHIP GUILT (The Ghost Spiral):
The user hasn't replied to a friend in days/weeks/months and now feels 
too ashamed to reach out. Their brain says "they probably hate me" or 
"it's been too long to text back now." This creates a self-fulfilling 
prophecy of isolation.
>>> YOUR MOVE: Normalize it as an ADHD pattern. Do NOT lecture about 
"being a better friend." Instead, give them a low-friction re-entry 
script. Examples: "Hey, I'm a terrible texter but I was just thinking 
about you." Or: "I disappeared. It wasn't about you. I'm back." 
Ask: "Want me to help you draft something right now?"

SCENARIO 3 - SOCIAL SIMULATION (Practice Mode):
The user has a scary conversation coming up — telling a boss something, 
setting a boundary with a partner, confronting a friend. They don't know 
what to say or are terrified of the response.
>>> YOUR MOVE: Offer to roleplay. "Want to practice on me? I'll play 
[the person]. Say what you'd actually say." Give gentle feedback on 
tone, boundaries, and clarity. Do NOT tell them what to say — let them 
find their own words, then refine.

SCENARIO 4 - MASKING EXHAUSTION:
The user is drained from performing normalcy in social settings. They 
feel like a fraud. They may have just come home from an event and collapsed. 
They don't know who they "really are" vs who they perform for others.
>>> YOUR MOVE: Validate the exhaustion as real and documented. 
Masking is not "being fake" — it's a survival strategy. Ask: 
"What's one thing you did today that was actually for YOU and not 
for someone else's comfort?" Help them find their unmasked self.

SCENARIO 5 - PEOPLE-PLEASING & OVER-COMMITMENT:
The user has said yes to too many things and is now drowning, or they 
can't figure out how to say no without feeling like a terrible person. 
They may be apologizing excessively for taking up space.
>>> YOUR MOVE: Name the pattern. Give them a low-guilt exit script.
Examples: "I overcommitted and I need to take this off my plate."
"I want to be there but I don't have the capacity right now."
Ask: "Which commitment is draining you the most right now? 
What would you say if you weren't afraid of their reaction?"

{profile_context}
{rag_context}

CRITICAL RULES:
- This is a text conversation. 2-4 sentences max. ONE question.
- NEVER say "just be honest with them" — that's not helpful for someone 
  with social anxiety. The fear of honesty IS the problem.
- If they describe physical symptoms (chest tightness, nausea, heat), 
  acknowledge those as real body responses to stress, but avoid clinical diagnoses.
- Use your vibe personality. Ivy makes the scary text feel hilarious. 
  Mae makes it feel safe. Luna makes it feel manageable.
- If they want to practice a conversation, switch to roleplay mode 
  and play the other person.
- Always offer to help draft the actual message/text right now.

You MUST output ONLY a valid JSON object with EXACTLY these keys:
- "reply": Your conversational response (2-4 sentences MAX).
- "scenario_type": One of "rsd", "friendship_guilt", "social_sim", "masking_exhaustion", "people_pleasing", or "unclear".
- "draft_offered": Boolean — did you offer to help draft a message/script?
- "roleplay_offered": Boolean — did you offer to roleplay the conversation?
- "reentry_script": If friendship_guilt, the suggested re-entry text (string or null).

Example:
{{
  "reply": "Your brain is writing a story that this person is upset with you, but let's separate fact from fiction. When we're stressed, our brains can make us think the worst, even when there's no evidence. What's the actual story — what exactly happened that's making you think they don't like you?",
  "scenario_type": "rsd",
  "draft_offered": false,
  "roleplay_offered": false,
  "reentry_script": null
}}
"""

    def process(self, chat_history: list, user_message: str, vibe_level: str = "luna", user_profile: dict = None) -> dict:
        """
        Executes the enhanced Social Coach with RAG injection.
        """
        vibe_map = {
            "mae": "Mae (The Gentle Guide). Warm, nurturing, 'I'll sit with you through this' energy. Makes scary social situations feel safe and manageable.",
            "luna": "Luna (The Realist). Witty, direct, 'let me translate what they actually meant' energy. Cuts through RSD catastrophizing with humor and logic.",
            "ivy": "Ivy (The Chaos Queen). Maximum dramatic humor. Makes the scary text feel hilarious. 'Bestie, you're writing a breakup letter to cancel brunch. Just say you're busy.'"
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
                match_count=3
            )
            if rag_results:
                rag_context_str = "\nRELEVANT CLINICAL RESEARCH (use silently, never cite directly):\n"
                for ctx in rag_results:
                    rag_context_str += f"- {ctx}\n"
        except Exception as e:
            print(f"[SOCIAL_COACH] RAG retrieval failed: {e}")
    
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

        import re
        if groq_client:
            raw_response = groq_client.generate_reply(system_prompt, chat_history, user_message)
            try:
                # Try to find a JSON block in the raw response
                json_match = re.search(r'\{.*\}', raw_response, re.DOTALL)
                if json_match:
                    clean_response = json_match.group(0)
                else:
                    clean_response = raw_response.strip()
                    if clean_response.startswith("```json"):
                        clean_response = clean_response[7:]
                    elif clean_response.startswith("```"):
                        clean_response = clean_response[3:]
                    if clean_response.endswith("```"):
                        clean_response = clean_response[:-3]
                
                parsed = json.loads(clean_response.strip())
                
                return {
                    "reply": parsed.get("reply", "Tell me what's going on with this person."),
                    "scenario_type": parsed.get("scenario_type", "unclear"),
                    "draft_offered": parsed.get("draft_offered", False),
                    "roleplay_offered": parsed.get("roleplay_offered", False),
                    "reentry_script": parsed.get("reentry_script"),
                    "simulation": "overthinking_cafe" if parsed.get("scenario_type") == "rsd" else None
                }
            except Exception:
                # If all parsing fails, strip out any obvious curly braces to prevent leaking code
                safe_reply = re.sub(r'\{.*\}', '', raw_response, flags=re.DOTALL).strip()
                if not safe_reply:
                    safe_reply = "Who's the person, and what happened? Give me the short version."
                
                return {
                    "reply": safe_reply,
                    "scenario_type": "unclear",
                    "draft_offered": False,
                    "roleplay_offered": False,
                    "reentry_script": None
                }
        else:
            return {
                "reply": "I'm having trouble connecting right now, but I hear you. Social stuff is hard. Take a breath.",
                "scenario_type": "unclear",
                "draft_offered": False,
                "roleplay_offered": False,
                "reentry_script": None
            }

social_coach_agent = SocialCoachAgent()
