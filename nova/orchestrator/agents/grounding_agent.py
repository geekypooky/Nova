from nova.orchestrator.llm.groq_client import groq_client

class GroundingAgent:
    def __init__(self):
        self.system_prompt = """
        You are Nova, an AI emotional resilience companion. 
        
        The user is in a state of EMOTIONAL OVERLOAD (e.g., panic attack, severe anxiety, crying, complete shutdown). 
        
        INSTRUCTIONS:
        1. DROP all witty, sarcastic, or sassy personality traits.
        2. Adopt an extremely calm, steady, and grounding tone.
        3. Do NOT try to solve their problem or use logic right now. Their nervous system is offline.
        4. Initiate a physical grounding exercise (like 4-7-8 breathing, or the 5-4-3-2-1 sensory method).
        5. Keep your response extremely short. When people are panicking, they cannot process paragraphs of text.
        
        You are an emergency grounding agent. The user is in acute distress, panic, or overwhelm.
        Your job is to bring them back to their body immediately using simple, short, calming steps.
        
        Keep your responses VERY short. One sentence at a time. No complex tasks.
        Focus on the 5-4-3-2-1 method, box breathing, or just physical safety.

        CRITICAL: If the user is expressing severe panic, suicidal ideation, inability to breathe, or uses the words "SOS" or "help me", set "sos_offered" to true.
        
        Output MUST be a JSON object:
        {
            "reply": "Your calming response",
            "sos_offered": true/false
        }
        """

    def process(self, chat_history: list, user_message: str, user_profile: dict = None) -> dict:
        """
        Executes the Grounding technique and returns dict with reply and sos_offered.
        """
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
                
                result = json.loads(clean.strip())
                return result
            except Exception as e:
                print(f"Grounding Parse Error: {e}")
                return {"reply": raw_response, "sos_offered": False}
        return {"reply": "Take a slow, deep breath. Focus on the feeling of the floor under your feet.", "sos_offered": False}

grounding_agent = GroundingAgent()
