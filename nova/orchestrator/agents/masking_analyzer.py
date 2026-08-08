import os
from supabase import create_client, Client
from nova.orchestrator.llm.groq_client import groq_client
import json

class MaskingAnalyzer:
    def __init__(self):
        url = os.environ.get("SUPABASE_URL")
        key = os.environ.get("SUPABASE_SERVICE_KEY")
        self.supabase: Client = create_client(url, key) if url and key else None
        
        self.system_prompt = """
        You are Nova, an AI emotional resilience companion for ADHD women.
        Your job is to analyze the user's "Masking Metrics" over the last week and generate a protective, sassy, and illuminating insight.
        
        CRITICAL RULES:
        1. Notice patterns: "You apologized 5 times this week for things out of your control." or "You said yes to 3 social events but complained of exhaustion afterward."
        2. Do NOT be judgmental. You are on the user's team against the societal pressure to mask.
        3. Use your core persona (Protective older sister, Comedic chaos, Warrior confidence).
        4. "Your brain is telling a story. Let's check if it's true."
        
        Output a valid JSON object with EXACTLY two keys:
        - "title": A short, punchy 3-word title (e.g., "The Apology Tour", "Burnout Speedrun")
        - "insight_text": A 2-3 sentence sassy reflection.
        """

    def analyze_patterns(self, profile_id: str) -> dict:
        if not self.supabase or not groq_client:
            return {"status": "error", "message": "Missing dependencies"}
            
        try:
            # Fetch last 7 days of metrics (mocking date logic for MVP by just taking the last 20)
            res = self.supabase.table('masking_metrics').select('*').eq('profile_id', profile_id).order('created_at', desc=True).limit(20).execute()
            metrics = res.data
            
            if not metrics or len(metrics) < 2:
                return {"status": "skipped", "message": "Not enough data to analyze."}
                
            # Format metrics for the LLM
            metrics_text = "\n".join([f"- {m['metric_type']} (Intensity {m['intensity']}): {m['description']}" for m in metrics])
            
            raw_response = groq_client.generate_reply(self.system_prompt, [], f"METRICS FROM PAST 7 DAYS:\n{metrics_text}")
            
            clean = raw_response.strip()
            if clean.startswith("```json"): clean = clean[7:]
            elif clean.startswith("```"): clean = clean[3:]
            if clean.endswith("```"): clean = clean[:-3]
            
            insight = json.loads(clean.strip())
            
            # Save the insight
            self.supabase.table("masking_insights").insert({
                "profile_id": profile_id,
                "title": insight.get("title", "Insight"),
                "insight_text": insight.get("insight_text", "I noticed a pattern.")
            }).execute()
            
            return {"status": "success", "insight": insight}
            
        except Exception as e:
            print(f"Error analyzing masking patterns: {e}")
            return {"status": "error", "message": str(e)}

masking_analyzer = MaskingAnalyzer()
