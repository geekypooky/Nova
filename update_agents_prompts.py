import glob

for f in glob.glob('nova/orchestrator/agents/*.py'):
    # skip intent_router and onboarding_agent
    if 'intent_router' in f or 'onboarding_agent' in f or 'masking_analyzer' in f:
        continue
        
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # 1. Add {profile_context} to base_prompt if not there
    if '{profile_context}' not in content and 'base_prompt = """' in content:
        content = content.replace('{rag_context}', '{profile_context}\n{rag_context}')
        
    # 2. Add profile_context building logic inside process method
    injection_logic = """
        profile_context = ""
        if user_profile:
            diag = user_profile.get('diagnoses', [])
            strug = user_profile.get('core_struggles', [])
            if diag or strug:
                profile_context = f"USER PROFILE:\\n- Diagnoses: {', '.join(diag)}\\n- Core Struggles: {', '.join(strug)}\\nCustomize your advice for this profile."
"""
    if 'profile_context = ""' not in content:
        # Find where rag_context_str is defined and insert before it
        content = content.replace('        rag_context_str = ""', injection_logic + '\n        rag_context_str = ""')
        
    # 3. Update the format() call
    content = content.replace('rag_context=rag_context_str', 'profile_context=profile_context,\n            rag_context=rag_context_str')
    
    with open(f, 'w', encoding='utf-8') as file:
        file.write(content)

print("Injected profile context into agent prompts!")
