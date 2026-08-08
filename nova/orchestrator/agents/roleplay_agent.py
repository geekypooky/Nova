from nova.orchestrator.llm.nvidia_client import nvidia_client
from nova.orchestrator.rag.roleplay_retriever import roleplay_retriever
from nova.orchestrator.agents.scenario_library import get_scenario

class RoleplayAgent:
    def process(self, chat_history: list, user_message: str, scenario_id: str) -> str:
        """
        Handles the actual back-and-forth roleplay using the dedicated NVIDIA LLM
        and the isolated Roleplay RAG pipeline.
        """
        scenario = get_scenario(scenario_id)
        if not scenario:
            return "Error: Scenario not found."

        # Fetch isolated RAG context for this specific scenario
        rag_context = roleplay_retriever.retrieve_context(scenario.get("knowledge_unit_id"))
        
        rag_str = ""
        if rag_context:
            rag_str = "\nBACKGROUND CONTEXT (Keep this in mind for how to react):\n" + "\n".join(f"- {c}" for c in rag_context)

        system_prompt = f"""
You are acting in a roleplay simulation to help a user practice a difficult conversation.
You are playing the role of: {scenario['counterpart']}

Your goal is to be realistic. Do NOT be overly accommodating if your persona wouldn't be.
React naturally to what the user says.

{rag_str}

Keep your responses short (1-3 sentences) as if texting or talking in a quick meeting.
Do not break character. Do not say "I am an AI." Just respond as the counterpart.
"""
        
        reply = nvidia_client.generate_reply(system_prompt, chat_history, user_message)
        return reply

roleplay_agent = RoleplayAgent()
