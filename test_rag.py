import os
from dotenv import load_dotenv
from supabase import create_client, Client
from nova.orchestrator.rag.ingest import ingest_document
from nova.orchestrator.rag.retriever import retriever

load_dotenv()

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_KEY")
supabase: Client = create_client(url, key)

print("1. Creating dummy profile...")
profile_res, _ = supabase.table('profiles').insert({"coaching_style": "gentle"}).execute()
profile_id = profile_res[1][0]['id']

try:
    print(f"2. Ingesting test document for profile {profile_id}...")
    sample_text = "Nova is an AI emotional resilience companion. Nova loves helping people break out of shame spirals."
    ingest_document(profile_id, sample_text, source="test_script")
    
    print("3. Testing retrieval...")
    results = retriever.retrieve_context(profile_id, "Who is Nova?", match_count=1)
    
    print("Results found:")
    for r in results:
        print(f" - {r}")
        
finally:
    print("4. Cleaning up test profile (this cascades to vectors)...")
    supabase.table('profiles').delete().eq('id', profile_id).execute()
    print("Cleanup complete.")
