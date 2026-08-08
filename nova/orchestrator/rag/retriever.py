import os
from dotenv import load_dotenv
from supabase import create_client, Client
from nova.orchestrator.rag.embedder import embedder

load_dotenv()

class Retriever:
    def __init__(self):
        url: str = os.environ.get("SUPABASE_URL")
        key: str = os.environ.get("SUPABASE_SERVICE_KEY")
        self.supabase: Client = create_client(url, key)

    def retrieve_context(self, profile_id: str, query: str, match_count: int = 3, match_threshold: float = 0.5) -> list[str]:
        """
        Retrieves the most relevant memories for a given query.
        """
        if embedder is None:
            return []
            
        # 1. Embed the user's query
        query_embedding = embedder.embed_text(query)
        
        # 2. Call the Supabase RPC function for similarity search
        try:
            response = self.supabase.rpc(
                'match_memory_vectors',
                {
                    'query_embedding': query_embedding,
                    'match_threshold': match_threshold,
                    'match_count': match_count,
                    'p_profile_id': profile_id
                }
            ).execute()
            
            # Extract content from the matches
            results = []
            for item in response.data:
                results.append(item['content'])
                
            return results
        except Exception as e:
            print(f"Error during RAG retrieval: {e}")
            return []

# Initialize singleton
retriever = Retriever()
