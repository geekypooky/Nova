import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_KEY")

if not url or not key:
    print("Supabase credentials not found in .env")
    exit(1)

print("Connecting to Supabase...")
supabase: Client = create_client(url, key)

try:
    print("Testing connection by inserting a dummy profile...")
    data, count = supabase.table('profiles').insert({"coaching_style": "gentle"}).execute()
    print("Success! Inserted profile:", data[1][0] if len(data) > 1 and len(data[1]) > 0 else data)
    
    # Clean up the test profile
    if len(data) > 1 and len(data[1]) > 0:
        test_id = data[1][0]['id']
        supabase.table('profiles').delete().eq('id', test_id).execute()
        print("Cleaned up test profile.")
        
except Exception as e:
    print("Error connecting to Supabase or running SQL:", str(e))
