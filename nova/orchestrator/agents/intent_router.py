from nova.orchestrator.llm.groq_client import groq_client
import json

class IntentRouter:
    def __init__(self):
        self.system_prompt = """
        You are an intelligent intent classifier for an ADHD emotional resilience app.
        Your job is to read the user's message and determine which psychological tool they need.
        
        AGENTS AVAILABLE:
        1. "grounding": User is in acute emotional overload, panic, crying, or physical anxiety (e.g., "heart beating fast", "can't breathe").
        2. "social_coach": User is dealing with ANY social or relational pain (RSD, friendship guilt, setting boundaries, masking exhaustion, people-pleasing).
        3. "loop_breaker": User is describing ANY phase of the ADHD shutdown spiral (emotional shutdown, tomorrow trap, time-blindness nihilism, avoidance cycles).
        4. "exec_dysfunction": User is stuck on a SPECIFIC TASK and cannot start it. Key difference from loop_breaker: this is about a concrete task (e.g. email, chores), not an emotional spiral.
        5. "body_checkin": User is explicitly hungry, extremely tired, visibly overwhelmed by physical needs, or physically crashing. Do NOT use this for casual boredom.
        6. "identity_unmasking": User is explicitly questioning who they are, feeling fake, or deeply struggling with their sense of self.
        7. "story_mode": User is stuck in a perspective and needs a third-party story or metaphor to gain psychological distance (e.g., "I can't decide", "I need a new perspective").
        8. "inner_critic": User is actively insulting themselves (e.g. "I'm so stupid", "I'm a failure", "I'm pathetic").
        9. "general": Default. The user is just chatting, bored, saying hello, or making casual conversation. WHEN IN DOUBT, USE GENERAL.
        
        You MUST output ONLY a valid JSON object with EXACTLY two keys:
        - "agent": The exact string name of the agent chosen from the list above.
        - "reason": A brief 1-sentence reason why.
        
        CRITICAL CONTEXT RULE:
        Read the provided chat history. If the assistant (Nova) just asked a question belonging to a specific agent's flow (for example, the 'inner_critic' Character Mirror flow), and the user is answering that question, you MUST route them back to that same agent so the flow can continue. Do not switch agents in the middle of an active exercise.
        
        Example Output:
        {
            "agent": "inner_critic",
            "reason": "The user called themselves pathetic, indicating intense self-criticism."
        }
        """

    def classify(self, user_message: str, chat_history: list = None) -> dict:
        """
        Takes the user message and history, returns the chosen agent and reason.
        """
        if chat_history is None:
            chat_history = []
            
        if groq_client:
            raw_response = groq_client.generate_reply(self.system_prompt, chat_history, user_message)
            try:
                # Basic JSON extraction
                clean = raw_response.strip()
                if clean.startswith("```json"):
                    clean = clean[7:]
                elif clean.startswith("```"):
                    clean = clean[3:]
                if clean.endswith("```"):
                    clean = clean[:-3]
                
                return json.loads(clean.strip())
            except Exception as e:
                print(f"Intent Router JSON Parse Error: {e}, Raw: {raw_response}")
                return {"agent": "general", "reason": "fallback due to parse error"}
        else:
            return {"agent": "general", "reason": "no llm client"}

intent_router = IntentRouter()
