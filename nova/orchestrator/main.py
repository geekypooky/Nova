from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

from nova.orchestrator.router import router as core_router
from nova.orchestrator.auth_router import router as auth_router

app = FastAPI(
    title="Nova API",
    description="Backend orchestrator for Nova: AI emotional resilience companion.",
    version="1.0.0"
)

app.include_router(core_router)
app.include_router(auth_router)

# Allow CORS for the Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Nova Orchestrator is running."}

@app.get("/health")
def health_check():
    return {"status": "healthy"}
