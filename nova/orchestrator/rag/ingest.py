import os
from dotenv import load_dotenv
from supabase import create_client, Client
from nova.orchestrator.rag.embedder import embedder

load_dotenv()

def ingest_document(profile_id: str, content: str, source: str = "knowledge_base"):
    """
    Chunks a document, generates embeddings, and inserts them into Supabase.
    """
    url: str = os.environ.get("SUPABASE_URL")
    key: str = os.environ.get("SUPABASE_SERVICE_KEY")
    supabase: Client = create_client(url, key)
    
    if embedder is None:
        print("Embedder is not initialized. Cannot ingest document.")
        return

    # Very basic chunking strategy (by double newline/paragraphs)
    # In production, use Langchain's RecursiveCharacterTextSplitter or similar
    chunks = [c.strip() for c in content.split("\n\n") if len(c.strip()) > 10]
    
    records = []
    for chunk in chunks:
        embedding = embedder.embed_text(chunk)
        records.append({
            "profile_id": profile_id,
            "content": chunk,
            "metadata": {"source": source},
            "embedding": embedding
        })
        
    if records:
        supabase.table('memory_vectors').insert(records).execute()
        print(f"Successfully ingested {len(records)} chunks from {source}.")
    else:
        print("No valid chunks found to ingest.")
