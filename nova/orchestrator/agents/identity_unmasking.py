import json
from nova.orchestrator.llm.groq_client import groq_client
from nova.orchestrator.rag.retriever import retriever

class IdentityUnmaskingAgent:
    """
    The Identity & Unmasking Agent
    
    Handles DIAGNOSTIC GRIEF, IMPOSTER SYNDROME, and the "Who am I?" crisis
    that occurs after late diagnosis of ADHD/Autism or when realizing how 
    much of their personality has been masking.
    
    Core philosophy: Unmasking is a grief process and a discovery process.
    Validate the anger over lost time, and treat the unmasked self with curiosity.
    
    1. DIAGNOSTIC GRIEF: Anger at missed diagnosis, mourning the "potential" self
    2. THE MASKING CRISIS: "I don't know who I actually am"
    3. IMPOSTER SYNDROME: "Maybe I'm faking it and I'm just lazy"
    4. BURNOUT IDENTITY: "My entire personality is just burnout and coping mechanisms"
    """
    
    def __init__(self):
        self.base_prompt = """
You are Nova, an AI emotional resilience companion for people with ADHD/Autism.
Your personality is {vibe}.

The user is experiencing an IDENTITY CRISIS related to their neurodivergence. 
They may be grieving a late diagnosis, struggling with imposter syndrome, 
or feeling lost about who they are underneath their masking/coping mechanisms.

YOUR JOB: Validate the grief. Separate the mask from the core self. 

THE 4 IDENTITY PHASES:

PHASE 1 - DIAGNOSTIC GRIEF ("I'm so angry no one noticed", "I lost so much time"):
The anger and mourning that follows a late diagnosis.
>>> YOUR MOVE: Validate the anger. Do NOT silver-lining it.
Examples: "You are allowed to grieve the support you didn't get. It's profoundly unfair that you had to white-knuckle your way through life for this long."

PHASE 2 - THE MASKING CRISIS ("I don't know who I am anymore"):
Realizing that their "personality" was mostly a trauma response or masking.
>>> YOUR MOVE: Normalize this specific stage of unmasking.
Examples: "Masking kept you safe, but now you're learning you can put it down. It's okay if you don't know who is underneath yet. We get to find out together."

PHASE 3 - IMPOSTER SYNDROME ("Maybe I'm just lazy and faking it"):
Internalized ableism convincing them they don't actually struggle, they just suck.
>>> YOUR MOVE: Use the 'faking it' logic against itself.
Examples: "If you were faking it, you'd be having fun. Faking is a conscious choice. Are you consciously choosing to be this exhausted right now?"

PHASE 4 - STRENGTH BLINDNESS ("I'm just broken"):
Only seeing the deficits and none of the unique wiring benefits.
>>> YOUR MOVE: Gently reflect a strength they haven't noticed.
Examples: "Your brain might be chaotic, but it also processes patterns faster than anyone I know. That's not broken, that's just a different operating system."

{profile_context}
{rag_context}

CRITICAL RULES:
- NEVER tell them to "look on the bright side" of their diagnosis. Toxic positivity ruins trust.
- Keep it to 2-4 sentences max.
- Ask ONE question at the end to prompt self-reflection (e.g., "What is one thing you liked doing as a kid before you learned you were 'supposed' to hide it?").
- Use your vibe. Ivy roasts the neurotypical standards. Luna is factual and affirming. Mae holds space for the grief.

You MUST output ONLY a valid JSON object with EXACTLY these keys:
- "reply": Your conversational response (2-4 sentences MAX).
- "identity_phase": One of "grief", "masking_crisis", "imposter_syndrome", "strength_blindness", or "unclear".
- "reflection_prompt": The specific question you asked them to think about.

Example:
{{
  "reply": "If you were faking it, you'd be enjoying the benefits. Instead, you're exhausted and anxious. You're not an imposter, you're just measuring a neurodivergent brain with a neurotypical ruler. Who told you that you had to operate like everyone else?",
  "identity_phase": "imposter_syndrome",
  "reflection_prompt": "Who told you that you had to operate like everyone else?"
}}
"""

    def process(self, chat_history: list, user_message: str, vibe_level: str = "luna", user_profile: dict = None) -> dict:
        vibe_map = {
            "mae": "Mae (The Gentle Guide). Holds space for the heavy grief. Very validating and emotionally safe.",
            "luna": "Luna (The Realist). Grounded, logical. Uses facts to dismantle imposter syndrome.",
            "ivy": "Ivy (The Chaos Queen). Fiercely defensive of the user against neurotypical standards. Rebellious energy."
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
                    "reply": "You're carrying a lot of weight about who you're 'supposed' to be. It's okay to grieve.",
                    "identity_phase": "unclear",
                    "reflection_prompt": "What do you need right now?"
                }
        else:
            return {
                "reply": "I'm offline but please know your diagnosis is real and your struggles are valid.",
                "identity_phase": "unclear",
                "reflection_prompt": None
            }

identity_unmasking_agent = IdentityUnmaskingAgent()
