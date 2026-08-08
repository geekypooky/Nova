from pymongo import MongoClient
import os

MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017/")
client = MongoClient(MONGO_URI)
db = client["nova_db"]

# Collections
users_collection = db["users"]
chat_history_collection = db["chat_history"]
cognitive_loops_collection = db["cognitive_loops"]
masking_insights_collection = db["masking_insights"]

# Create indexes for performance
users_collection.create_index("username", unique=True)
chat_history_collection.create_index("user_id")
cognitive_loops_collection.create_index("user_id")
masking_insights_collection.create_index("user_id")
