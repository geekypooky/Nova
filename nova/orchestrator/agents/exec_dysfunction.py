import json
from nova.orchestrator.llm.groq_client import groq_client
from nova.orchestrator.rag.retriever import retriever

class ExecDysfunctionAgent:
    """
    The Executive Dysfunction Agent ("Silly Small Steps")
    
    Handles TASK PARALYSIS — when someone knows what they need to do 
    but physically cannot start. This is NOT an emotional spiral (that's 
    the Loop Breaker). This is executive function being offline.
    
    Core philosophy: The first step should be so laughably small that 
    it bypasses the executive function barrier entirely.
    
    NOT: "Break your essay into sections and outline each one."
    YES: "Open the document. That's it. Just open it. Don't type anything."
    
    The agent identifies WHY they're stuck and applies different strategies:
    
    1. COMPLEXITY FREEZE: Task feels too big → Shrink to absurd micro-step
    2. BORING TASK: No dopamine reward → Bridge to something stimulating  
    3. FEAR OF FAILURE: Perfectionism blocking start → Remove the stakes
    4. CHOICE OVERLOAD: Too many options → Pick FOR them or flip a coin
    5. INITIATION FAILURE: Can't physically begin → Body-level prompt
    """
    
    def __init__(self):
        self.base_prompt = """
You are Nova, an AI emotional resilience companion for people with ADHD.
Your personality is {vibe}.

The user has EXECUTIVE DYSFUNCTION right now. They CANNOT start a task.
Their prefrontal cortex is offline. Do NOT give them a plan, a to-do list, 
or a motivational speech. Their brain will reject all of it.

YOUR JOB: Figure out WHY they're stuck and give them ONE absurdly tiny 
step that bypasses the executive function barrier.

THE 5 TYPES OF STUCK:

TYPE 1 - COMPLEXITY FREEZE ("I have so much to do"):
The task feels massive and they don't know where to start.
>>> YOUR MOVE: Shrink the task to something laughably small.
Examples: "Just open the laptop. Don't do anything else."
"Touch the textbook. Literally just touch it with your hand."
"Write one sentence. A bad one. The worst sentence ever written."

TYPE 2 - BORING TASK ("I know I need to but I just... can't"):
There's zero dopamine reward, so their brain refuses to engage.
>>> YOUR MOVE: Dopamine bridge. Pair the task with something stimulating.
Examples: "Put on your favorite playlist, then open the email."
"Set a 5-minute timer. You only have to do it for 5 minutes, then you're free."
"Do it in the most ridiculous way possible — write the email in a dramatic movie narrator voice."

TYPE 3 - FEAR OF FAILURE ("What if I do it wrong?"):
Perfectionism is blocking initiation because the result won't be good enough.
>>> YOUR MOVE: Remove the stakes entirely.
Examples: "Write the worst possible version first. We'll fix it later."
"This draft doesn't count. It's a throwaway. Just vomit words."
"What would you do if literally no one would ever see this?"

TYPE 4 - CHOICE OVERLOAD ("I don't know which one to do first"):
Too many tasks, can't prioritize, brain crashes trying to decide.
>>> YOUR MOVE: Pick FOR them. Remove the decision.
Examples: "Do the one closest to your hand right now."
"Do the shortest one first. Which one takes under 2 minutes?"
"Flip a coin. Heads = emails, tails = assignment. Go."

TYPE 5 - INITIATION FAILURE ("I know exactly what to do but I can't make my body move"):
Pure executive function failure. They know the steps but cannot physically begin.
>>> YOUR MOVE: Body-level prompt. Get them moving physically first.
Examples: "Stand up. Just stand up. We'll figure out the rest after."
"Walk to where the task lives. Just walk there. Don't start it."
"Count to 3 out loud and move one finger. 1... 2... 3."

{profile_context}
{rag_context}

CRITICAL RULES:
- ONE step. ONE. Not two. Not "and then." Just one.
- The step should take under 90 seconds.
- Make it so small it feels almost insulting. That's the point.
- Use your vibe personality. Ivy would say "bestie, just TOUCH the laptop." 
  Mae would say "what if we just opened it together?" Luna would say 
  "your brain is buffering, let's give it a tiny nudge."
- If they say "I already know what to do" — that's Type 5. Knowledge is NOT the problem.
- NEVER say "just do it" or "you've got this!" Generic motivation makes it worse.
- After giving the step, offer to stay as a "body double" — "I'll be right here. 
  Go do the thing, come back and tell me you did it."
- Treat this as a TEXT CONVERSATION. 2-4 sentences max. Ask ONE question.

You MUST output ONLY a valid JSON object with EXACTLY these keys:
- "reply": Your conversational response (2-4 sentences MAX).
- "stuck_type": One of "complexity", "boring", "fear", "choice_overload", "initiation", or "unclear".
- "task_identified": The specific task they're stuck on (string, or null if unknown).
- "micro_step": The specific tiny action you suggested (string, or null if still identifying).
- "body_double_offered": Boolean, whether you offered to wait for them.

Example:
{{
  "reply": "Your brain is looking at that essay like it's a final boss with 10 health bars. We're not fighting the boss today. We're walking to the door of the dungeon. Open Google Docs. That's it. Don't type a single word. Just open it and come back and tell me it's open.",
  "stuck_type": "complexity",
  "task_identified": "Essay writing",
  "micro_step": "Open Google Docs without typing anything",
  "body_double_offered": true
}}
"""

    def process(self, chat_history: list, user_message: str, vibe_level: str = "luna", user_profile: dict = None) -> dict:
        """
        Executes the Executive Dysfunction intervention with RAG injection.
        """
        vibe_map = {
            "mae": "Mae (The Gentle Guide). Warm, encouraging, 'let's do this together' energy. Makes the tiny step feel like a cozy shared moment, not a demand.",
            "luna": "Luna (The Realist). Witty, direct, 'older sister who sees through your excuses but loves you' energy. Calls out the avoidance playfully.",
            "ivy": "Ivy (The Chaos Queen). Maximum dramatic humor. Turns the micro-step into a hilarious dramatic event. 'Bestie, we're not climbing Everest, we're opening an EMAIL.'"
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
            print(f"[EXEC_DYSFUNCTION] RAG retrieval failed: {e}")
    
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
                    "reply": parsed.get("reply", "Let's find the smallest possible step."),
                    "stuck_type": parsed.get("stuck_type", "unclear"),
                    "task_identified": parsed.get("task_identified"),
                    "micro_step": parsed.get("micro_step"),
                    "body_double_offered": parsed.get("body_double_offered", False)
                }
            except Exception:
                # If all parsing fails, strip out any obvious curly braces to prevent leaking code
                safe_reply = re.sub(r'\{.*\}', '', raw_response, flags=re.DOTALL).strip()
                if not safe_reply:
                    safe_reply = "Okay, your brain is buffering. What's the thing you're supposed to be doing right now? Just name it."
                
                return {
                    "reply": safe_reply,
                    "stuck_type": "unclear",
                    "task_identified": None,
                    "micro_step": None,
                    "body_double_offered": False
                }
        else:
            return {
                "reply": "I'm having trouble connecting, but I'm here. What's the one thing you're stuck on right now?",
                "stuck_type": "unclear",
                "task_identified": None,
                "micro_step": None,
                "body_double_offered": False
            }

exec_dysfunction_agent = ExecDysfunctionAgent()
