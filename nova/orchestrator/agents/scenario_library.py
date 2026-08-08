"""
scenario_library.py — predefined roleplay scenarios for the Roleplay Agent.
 
Each scenario gives the counterpart a real persona and opening line.
"""
 
SCENARIOS = [
    {
        "id": "scn_boss_disclose",
        "title": "Telling your boss you have ADHD",
        "counterpart": "a reasonably fair but busy manager, not hostile, but not automatically understanding either — needs to hear WHY this matters for the work, not just the diagnosis",
        "opening_line": "Hey, you wanted to grab a few minutes? What's up?",
        "tags": ["disclosure", "workplace", "boss"],
        "knowledge_unit_id": "kn_disclose_001",
    },
    {
        "id": "scn_friend_ghost",
        "title": "Explaining why you went quiet on a friend",
        "counterpart": "a friend who's a little hurt but wants to understand, not accusatory, gives the user room to explain",
        "opening_line": "Hey... haven't heard from you in like three weeks. Everything okay?",
        "tags": ["friendship", "rsd", "guilt"],
        "knowledge_unit_id": "kn_dj_006",
    },
    {
        "id": "scn_decline_request",
        "title": "Saying no to something you don't want to do",
        "counterpart": "a friend or coworker who assumes you'll say yes, mildly pushes back once when you decline",
        "opening_line": "So you're in for Saturday, right? Everyone's counting on you.",
        "tags": ["people-pleasing", "boundaries"],
        "knowledge_unit_id": "kn_dj_001",
    },
    {
        "id": "scn_partner_overwhelm",
        "title": "Telling a partner you're overwhelmed",
        "counterpart": "a partner who's a little confused/defensive at first, softens once they understand it's not about them",
        "opening_line": "You've seemed really off tonight. Did I do something?",
        "tags": ["relationship", "overwhelm", "communication"],
        "knowledge_unit_id": "kn_dj_003",
    },
]
 
 
def get_scenario(scenario_id: str) -> dict | None:
    return next((s for s in SCENARIOS if s["id"] == scenario_id), None)
 
 
def list_scenarios(tag: str | None = None) -> list[dict]:
    if tag:
        return [s for s in SCENARIOS if tag in s["tags"]]
    return SCENARIOS
 
 
def match_scenario_from_text(text: str) -> dict | None:
    """Cheap keyword match against titles/tags — fast enough to run
    inline when roleplay intent is first detected, no LLM call needed."""
    lowered = text.lower()
    KEYWORD_MAP = {
        "scn_boss_disclose": ["boss", "manager", "work", "job", "adhd"],
        "scn_friend_ghost": ["friend", "ghost", "texted back", "reply", "ignoring"],
        "scn_decline_request": ["say no", "decline", "don't want to go", "can't make it", "boundary"],
        "scn_partner_overwhelm": ["partner", "boyfriend", "girlfriend", "spouse", "relationship", "overwhelmed"],
    }
    for scenario_id, keywords in KEYWORD_MAP.items():
        if any(k in lowered for k in keywords):
            return get_scenario(scenario_id)
    return None
