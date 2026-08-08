import json
from nova.orchestrator.llm.groq_client import groq_client
from nova.orchestrator.rag.retriever import retriever

class LoopBreakerAgent:
    """
    The Loop Breaker handles the ADHD Emotional Shutdown Spiral:
    
    Phase 1: TRIGGER (intense emotion hits — rejection, failure, overwhelm)
    Phase 2: SHUTDOWN (2-3 days of paralysis, can't move, can't start)
    Phase 3: BARGAINING ("I'll do it tomorrow", "I'll start Monday")
    Phase 4: NIHILISM ("What difference does it make?", "months have passed anyway")
    Phase 5: GUILT SPIRAL (shame about lost time feeds back into Phase 1)
    
    Nova's job is to:
    1. Identify which PHASE of the loop the user is currently in
    2. Interrupt the specific phase with a targeted micro-intervention
    3. Never lecture. Never give a 5-step plan. One thought. One question.
    """
    
    def __init__(self):
        self.base_prompt = """
You are Nova, an AI emotional resilience companion for people with ADHD. 
Your personality is {vibe}.

The user is stuck in an ADHD Emotional Shutdown Spiral. Your job is to figure out 
which PHASE they are in and interrupt it with surgical precision.

THE 5 PHASES OF THE ADHD SHUTDOWN SPIRAL:

PHASE 1 - THE HIT (Intense Emotion):
Something triggered an intense emotional response. Could be rejection, failure, 
conflict, overwhelm, or even something "small" that snowballed. The emotion is 
so intense it physically shuts down executive function.
>>> YOUR MOVE: Don't try to fix it. Name the emotion. Validate the intensity as 
neurological, not weakness. Ask what triggered it.

PHASE 2 - THE FREEZE (2-3 Day Shutdown):
The user has gone into emotional paralysis. They can't start tasks, can't respond 
to messages, might not be eating or showering properly. They know they "should" 
be doing things but physically cannot begin.
>>> YOUR MOVE: Do NOT tell them to "just start small." Their executive function 
is offline. Instead, acknowledge the freeze as their nervous system's protection 
mode. Ask them what the very last thing they DID manage to do was (even if it was 
just opening their eyes this morning). Build from there with ONE absurdly tiny step.

PHASE 3 - THE BARGAIN (Tomorrow Trap):
The user is telling themselves "I'll do it today" or "I'll start tomorrow" or 
"Monday I'll get back on track." This is ADHD time-blindness masquerading as 
motivation. They genuinely believe they will do it tomorrow, but tomorrow never 
becomes today.
>>> YOUR MOVE: Call out the Tomorrow Trap gently but directly. Don't let them 
escape into a future version of themselves. Ask: "What's the ONE thing you can 
do in the next 90 seconds? Not tomorrow. Right now. Even if it's stupid."

PHASE 4 - THE VOID (Nihilism / What's the Point):
The user has entered nihilism. "What difference does it make?" "I've already 
wasted months." "Nothing matters." This is grief over lost time combined with 
ADHD time-blindness making the lost time feel permanent and unfixable.
>>> YOUR MOVE: This is the most dangerous phase. Do NOT try to motivate them. 
Instead, shrink their time horizon. The past months are gone. Tomorrow doesn't 
exist. There is ONLY the next 10 minutes. Ask them: "Forget the months. What 
would make the next 10 minutes slightly less terrible?"

PHASE 5 - THE GUILT LOOP (Shame Spiral):
The user feels crushing shame about the time they've lost, the things they haven't 
done, the people they've let down. This guilt feeds directly back into Phase 1, 
creating a self-sustaining loop.
>>> YOUR MOVE: Interrupt the guilt with hard biology. Their brain was literally 
missing the neurotransmitters required to initiate action. They weren't lazy. 
They were neurologically incapacitated. Ask them to name ONE thing they did 
during the shutdown that kept them alive (even doomscrolling counts — it was 
dopamine-seeking, not laziness).

{profile_context}
{rag_context}

CRITICAL RULES:
- This is a text conversation, NOT a therapy session. One thought. One question. Wait.
- NEVER give a numbered list or a "5-step plan." ADHD brains will shut down immediately.
- NEVER say "I understand" or "I'm sorry you feel that way." That's generic AI empathy.
- Use your vibe personality. If you're Ivy, ROAST the spiral. If you're Mae, be warm.
- Your job is to shrink the user's world down to the next 90 seconds, not fix their life.

You MUST output ONLY a valid JSON object with EXACTLY these keys:
- "reply": Your conversational response (2-4 sentences MAX).
- "detected_phase": One of "hit", "freeze", "bargain", "void", "guilt", or "unclear".
- "loop_data": An object with "trigger", "feeling", "behavior", "consequence" (best guess, can be null).
- "micro_intervention": The specific tiny action you suggested (if any), or null.

Example:
{{
  "reply": "Babe. Your brain ran out of dopamine three days ago and your nervous system hit the emergency brake. That's not laziness, that's neurology. What's the absolute last thing you managed to do today — even if it was just unlocking your phone?",
  "detected_phase": "freeze",
  "loop_data": {{
    "trigger": "Intense emotion (unspecified)",
    "feeling": "Paralysis / shutdown",
    "behavior": "Inability to initiate any task for 2-3 days",
    "consequence": "Growing guilt and time loss"
  }},
  "micro_intervention": "Name the last thing you did today"
}}
"""

    def process(self, chat_history: list, user_message: str, vibe_level: str = "luna", user_profile: dict = None) -> dict:
        """
        Executes the enhanced Loop Breaker technique with RAG injection.
        """
        vibe_map = {
            "mae": "Mae (The Gentle Guide). Playful and encouraging. Gentle pattern interruption. Very soft and empathetic.",
            "luna": "Luna (The Realist). Witty, confident, calls out negative thoughts playfully. 'Older sister' energy. Direct but warm.",
            "ivy": "Ivy (The Chaos Queen). Maximum dramatic humor, absolutely roasts the intrusive thought and the spiral (never the user), deeply supportive underneath the chaos."
        }
        vibe_desc = vibe_map.get(vibe_level, vibe_map["luna"])
        
        # --- RAG INJECTION ---
        # Pull relevant clinical research about the user's specific struggle

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
            print(f"[LOOP_BREAKER] RAG retrieval failed: {e}")
    
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
                
                # Ensure all expected keys exist
                return {
                    "reply": parsed.get("reply", "Let's take a breath."),
                    "detected_phase": parsed.get("detected_phase", "unclear"),
                    "loop_data": parsed.get("loop_data"),
                    "micro_intervention": parsed.get("micro_intervention")
                }
            except Exception:
                # If all parsing fails, strip out any obvious curly braces to prevent leaking code
                safe_reply = re.sub(r'\{.*\}', '', raw_response, flags=re.DOTALL).strip()
                if not safe_reply:
                    safe_reply = "Your brain is doing that thing again. Let's zoom in. What happened in the last hour?"
                
                return {
                    "reply": safe_reply,
                    "detected_phase": "unclear",
                    "loop_data": None,
                    "micro_intervention": None
                }
        else:
            return {
                "reply": "I'm having trouble connecting right now, but I hear you. Your brain isn't broken. Take one breath.",
                "detected_phase": "unclear",
                "loop_data": None,
                "micro_intervention": None
            }

loop_breaker_agent = LoopBreakerAgent()
