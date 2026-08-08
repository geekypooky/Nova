class RoleplayRetriever:
    def __init__(self):
        # A simple in-memory mock for the separate RAG pipeline requested by the user
        self.knowledge_base = {
            "kn_disclose_001": [
                "When an employee discloses ADHD, managers often worry about performance reliability.",
                "The key is to frame the disclosure around 'how my brain works best' rather than 'what I can't do'.",
                "A manager wants actionable requests, e.g., 'Can we do written instructions instead of verbal passing-by instructions?'"
            ],
            "kn_dj_006": [
                "When someone ghosts a friend, the friend usually assumes they did something wrong or the friendship is over.",
                "RSD makes the ghoster feel immense shame, which prolongs the silence.",
                "A gentle, no-excuse apology ('I got overwhelmed and disappeared, I am sorry, it wasn't about you') is the best re-entry strategy."
            ],
            "kn_dj_001": [
                "People-pleasers often over-explain their 'No', giving the other person loopholes to argue with.",
                "A boundary should be stated clearly and neutrally without excessive apologies.",
                "Friends might push back out of disappointment, but that doesn't mean the boundary was wrong."
            ],
            "kn_dj_003": [
                "Partners often internalize sudden emotional withdrawals or irritability as relationship dissatisfaction.",
                "ADHD overwhelm can cause sudden shutdowns that look like anger.",
                "Explicitly stating 'I am overwhelmed right now, I love you, but I need 20 minutes of quiet' prevents relationship damage."
            ]
        }

    def retrieve_context(self, knowledge_unit_id: str) -> list:
        """
        Fetches context specific to a roleplay scenario, keeping it completely 
        separate from the clinical RAG pipeline used by the main orchestrator.
        """
        if not knowledge_unit_id:
            return []
        return self.knowledge_base.get(knowledge_unit_id, [])

roleplay_retriever = RoleplayRetriever()
