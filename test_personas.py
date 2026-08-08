import asyncio
from nova.orchestrator.router import chat_with_nova, ChatRequest

async def test_personas():
    print("Testing Backend Persona Routing...\n")
    
    test_message = "I always mess everything up. Everyone hates me."
    print(f"User Message: '{test_message}'\n")

    # Test Mae
    req_mae = ChatRequest(session_id="test1", message=test_message, vibe_level="mae")
    res_mae = await chat_with_nova(req_mae)
    print("🌸 MAE (The Gentle Guide) Response:")
    print(res_mae.reply)
    print("-" * 50)

    # Test Luna
    req_luna = ChatRequest(session_id="test2", message=test_message, vibe_level="luna")
    res_luna = await chat_with_nova(req_luna)
    print("🌙 LUNA (The Realist) Response:")
    print(res_luna.reply)
    print("-" * 50)

    # Test Ivy
    req_ivy = ChatRequest(session_id="test3", message=test_message, vibe_level="ivy")
    res_ivy = await chat_with_nova(req_ivy)
    print("🌿 IVY (The Chaos Queen) Response:")
    print(res_ivy.reply)
    print("-" * 50)

if __name__ == "__main__":
    asyncio.run(test_personas())
