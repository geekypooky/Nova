import glob

for f in glob.glob('nova/orchestrator/agents/*.py'):
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # Update signatures
    content = content.replace(
        'def process(self, chat_history: list, user_message: str, vibe_level: str = "luna") -> dict:',
        'def process(self, chat_history: list, user_message: str, vibe_level: str = "luna", user_profile: dict = None) -> dict:'
    )
    content = content.replace(
        'def process(self, chat_history: list, user_message: str) -> str:',
        'def process(self, chat_history: list, user_message: str, user_profile: dict = None) -> str:'
    )
    
    with open(f, 'w', encoding='utf-8') as file:
        file.write(content)
        
print("Updated all agent process signatures!")
