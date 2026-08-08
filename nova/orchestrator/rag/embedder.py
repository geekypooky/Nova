from sentence_transformers import SentenceTransformer

class Embedder:
    def __init__(self, model_name: str = "thenlper/gte-base"):
        self.model = SentenceTransformer(model_name)
    
    def embed_text(self, text: str) -> list[float]:
        """
        Generate embeddings for a single string of text.
        """
        # Returns a numpy array, convert to list of floats for pgvector
        embedding = self.model.encode(text)
        return embedding.tolist()

# Initialize a singleton instance
try:
    embedder = Embedder()
except Exception as e:
    embedder = None
    print(f"Warning: Embedder could not be initialized: {e}")
