import os
import json
from dotenv import load_dotenv
from supabase import create_client, Client
from nova.orchestrator.rag.ingest import ingest_document

def seed_vibe_knowledge():
    load_dotenv()
    
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_KEY")
    if not url or not key:
        print("Error: Supabase credentials not found in .env")
        return
        
    supabase: Client = create_client(url, key)
    
    # We will insert these as "global" knowledge for now, so they apply to all users.
    # In a real app, you might have a generic system profile ID.
    # For now, let's create a "system" profile to hold core architecture knowledge.
    print("1. Ensuring system profile exists...")
    # Attempt to insert, ignore if exists (upsert)
    sys_profile_id = "00000000-0000-0000-0000-000000000000"
    try:
        supabase.table('profiles').insert({"id": sys_profile_id, "coaching_style": "system"}).execute()
    except Exception as e:
        print(f"System profile likely exists or error: {e}")

    print("2. Loading vibe_examples.json...")
    with open("knowledge_base/vibe_examples.json", "r", encoding="utf-8") as f:
        vibe_data = json.load(f)
        
    print("3. Ingesting vibe examples into Supabase Memory Vectors...")
    for item in vibe_data:
        # Format the content so the embedder captures the context and the strategy
        combined_text = f"Topic: {item['topic']}\nContent: {item['content']}\nStrategy: {item['nova_strategy']}"
        ingest_document(sys_profile_id, combined_text, source=item['source'])
        print(f"  - Ingested Vibe: {item['topic']}")
        
    print("\n4. Loading adhd_research.json...")
    with open("knowledge_base/adhd_research.json", "r", encoding="utf-8") as f:
        research_data = json.load(f)
        
    print(f"5. Ingesting {len(research_data)} clinical research items into Supabase Memory Vectors...")
    for item in research_data:
        combined_text = f"Clinical Topic: {item['topic']}\nResearch Data: {item['content']}\nNova Strategy: {item['nova_strategy']}"
        ingest_document(sys_profile_id, combined_text, source="PubMed_ADHD_Women_Review")
        print(f"  - Ingested Research: {item['topic']}")
        
    print("\n[SUCCESS] Vibe and Clinical architectures successfully seeded to RAG database!")

if __name__ == "__main__":
    seed_vibe_knowledge()
