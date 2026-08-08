from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
import datetime
from bson import ObjectId

from nova.orchestrator.db import (
    users_collection, 
    chat_history_collection, 
    cognitive_loops_collection,
    masking_insights_collection
)

router = APIRouter(prefix="/api/v1", tags=["Conversation"])

class ChatRequest(BaseModel):
    session_id: str
    message: str
    vibe_level: str = "luna"
    chat_history: Optional[List[Dict[str, str]]] = []
    voice_enabled: bool = False

class ChatResponse(BaseModel):
    reply: str
    nova_state: str
    active_agent: str = "general"
    agent_state: Optional[Dict[str, Any]] = None

class SummarizeRequest(BaseModel):
    session_id: str
    chat_history: List[Dict[str, str]]

from nova.orchestrator.agents.mirror_reframe import mirror_reframe_agent
from nova.orchestrator.agents.loop_breaker import loop_breaker_agent
from nova.orchestrator.agents.story_mode import story_mode_agent
from nova.orchestrator.agents.grounding_agent import grounding_agent
from nova.orchestrator.agents.social_coach import social_coach_agent
from nova.orchestrator.agents.exec_dysfunction import exec_dysfunction_agent
from nova.orchestrator.agents.body_checkin import body_checkin_agent
from nova.orchestrator.agents.identity_unmasking import identity_unmasking_agent
from nova.orchestrator.agents.intent_router import intent_router
from nova.orchestrator.agents.masking_analyzer import masking_analyzer

def get_user_profile(user_id: str):
    if not user_id:
        return None
    try:
        user = users_collection.find_one({"_id": ObjectId(user_id)})
        return user
    except Exception:
        return None

@router.post("/chat")
async def process_chat(request: ChatRequest):
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    user_profile = get_user_profile(request.session_id)

    chat_history = []
    try:
        if request.session_id:
            cursor = chat_history_collection.find({"user_id": request.session_id}).sort("created_at", -1).limit(5)
            db_history = list(cursor)
            for row in reversed(db_history):
                chat_history.append({"role": row['role'], "content": row['message']})
    except Exception as e:
        print(f"Failed to fetch history from MongoDB: {e}")

    if not chat_history and request.chat_history:
        chat_history = request.chat_history

    intent = intent_router.classify(request.message, chat_history)
    agent_name = intent.get("agent", "general")
    reason = intent.get("reason", "unknown")
    
    print(f"\n[ROUTER] Intent classified as: '{agent_name}' | Reason: {reason}")
    
    reply = ""
    agent_state = {}
    
    if request.message.lower().strip() == "clear":
        return JSONResponse(
            content={
                "reply": "Memory cleared.",
                "active_agent": "system",
                "agent_state": {"simulation": "none"}
            }
        )

    if agent_name == "mirror_reframe":
        reply = mirror_reframe_agent.process(chat_history, request.message, vibe_level=request.vibe_level, user_profile=user_profile)
        agent_state["simulation"] = "mirror_room"
    elif agent_name == "loop_breaker":
        reply = loop_breaker_agent.process(chat_history, request.message, vibe_level=request.vibe_level, user_profile=user_profile)
        agent_state["simulation"] = "loop_breaker_3d"
    elif agent_name == "story_mode":
        reply = story_mode_agent.process(chat_history, request.message, vibe_level=request.vibe_level, user_profile=user_profile)
    elif agent_name == "grounding":
        result = grounding_agent.process(chat_history, request.message, user_profile=user_profile)
        if isinstance(result, dict):
            reply = result.get("reply", "I am here with you. Just breathe.")
            if result.get("sos_offered"):
                agent_state["sos_offered"] = True
        else:
            reply = result
        agent_state["simulation"] = "mind_room"
    elif agent_name == "social_coach":
        result = social_coach_agent.process(chat_history, request.message, vibe_level=request.vibe_level, user_profile=user_profile)
        if isinstance(result, dict):
            reply = result.get("reply", "")
            if result.get("practice_mode_offered"):
                agent_state["navigate"] = "practice"
                agent_state["prefill_scenario"] = result.get("scenario", "")
            elif result.get("roleplay_offered"):
                agent_state["roleplay_offered"] = True
        else:
            reply = result
    elif agent_name == "exec_dysfunction":
        result = exec_dysfunction_agent.process(chat_history, request.message, vibe_level=request.vibe_level, user_profile=user_profile)
        if isinstance(result, dict):
            reply = result.get("reply", "")
            if result.get("task_identified"):
                agent_state["simulation"] = "task_mountain"
                agent_state["task_identified"] = result.get("task_identified")
            elif result.get("micro_step"):
                agent_state["micro_step"] = result.get("micro_step")
        else:
            reply = result
    elif agent_name == "body_checkin":
        reply = body_checkin_agent.process(chat_history, request.message, vibe_level=request.vibe_level, user_profile=user_profile)
    elif agent_name == "identity_unmasking":
        reply = identity_unmasking_agent.process(chat_history, request.message, vibe_level=request.vibe_level, user_profile=user_profile)
    else:
        from nova.orchestrator.llm.groq_client import groq_client
        system_prompt = f"You are Nova, in {request.vibe_level} mode. Be a witty, supportive emotional companion."
        reply = groq_client.generate_reply(system_prompt, chat_history, request.message)
    
    if request.session_id:
        try:
            now = datetime.datetime.utcnow()
            chat_history_collection.insert_one({"user_id": request.session_id, "role": "user", "message": request.message, "created_at": now})
            chat_history_collection.insert_one({"user_id": request.session_id, "role": "nova", "message": reply, "created_at": now})
        except Exception as e:
            print(f"Failed to save to MongoDB: {e}")

    audio_base64 = None
    if request.voice_enabled:
        from nova.orchestrator.services.audio_service import generate_voice_reply
        audio_base64 = generate_voice_reply(reply, request.vibe_level)

    return JSONResponse(
        content={
            "reply": reply,
            "active_agent": agent_name,
            "agent_state": agent_state,
            "audio_base64": audio_base64
        }
    )

from fastapi import UploadFile, File

@router.post("/transcribe")
async def transcribe_audio_endpoint(file: UploadFile = File(...)):
    """
    Accepts an audio file upload, transcribes it using Groq Whisper, and returns the text.
    """
    if not groq_client:
        raise HTTPException(status_code=500, detail="GroqClient not initialized")
        
    try:
        content = await file.read()
        filename = file.filename if file.filename else "audio.webm"
        text = groq_client.transcribe_audio(content, filename)
        return {"text": text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/sessions/summarize")
async def summarize_session(request: SummarizeRequest):
    if not request.chat_history:
        return {"status": "skipped", "reason": "No history provided"}

    results = masking_analyzer.analyze_session(request.chat_history)
    
    saved_loops = 0
    saved_insights = 0
    
    if request.session_id:
        now = datetime.datetime.utcnow()
        for loop in results.get("cognitive_loops", []):
            loop_doc = {
                "user_id": request.session_id,
                "trigger": loop.get("trigger", ""),
                "feeling": loop.get("feeling", ""),
                "behavior": loop.get("behavior", ""),
                "consequence": loop.get("consequence", ""),
                "created_at": now
            }
            cognitive_loops_collection.insert_one(loop_doc)
            saved_loops += 1
            
        for insight in results.get("masking_insights", []):
            insight_doc = {
                "user_id": request.session_id,
                "title": insight.get("title", ""),
                "insight_text": insight.get("description", ""),
                "created_at": now
            }
            masking_insights_collection.insert_one(insight_doc)
            saved_insights += 1
            
    return {
        "status": "success",
        "saved_loops": saved_loops,
        "saved_insights": saved_insights,
        "raw_analysis": results
    }

class SOSTriggerRequest(BaseModel):
    contact_name: str
    contact_number: str
    account_sid: str
    auth_token: str
    from_number: str = ""

@router.post("/sos/trigger")
async def trigger_sos(request: SOSTriggerRequest):
    from nova.orchestrator.services.twilio_service import send_whatsapp_sos
    from_num = request.from_number if request.from_number else "+14155238886"
    success, detail = send_whatsapp_sos(
        request.contact_name,
        request.contact_number,
        request.account_sid,
        request.auth_token,
        from_num
    )
    if success:
        return {"status": "success", "message_sid": detail}
    else:
        raise HTTPException(status_code=500, detail=f"Failed to send SOS: {detail}")

@router.get("/profile/{profile_id}")
async def get_profile(profile_id: str):
    try:
        user = users_collection.find_one({"_id": ObjectId(profile_id)})
        if not user:
            raise HTTPException(status_code=404, detail="Profile not found")
            
        return {
            "id": str(user["_id"]),
            "username": user.get("username", ""),
            "emergency_contact_name": user.get("emergency_contact_name", ""),
            "emergency_contact_number": user.get("emergency_contact_number", ""),
            "twilio_sid": user.get("twilio_sid", ""),
            "twilio_token": user.get("twilio_token", "")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class ProfileUpdateRequest(BaseModel):
    emergency_contact_name: str
    emergency_contact_number: str
    twilio_sid: str
    twilio_token: str

@router.put("/profile/{profile_id}")
async def update_profile(profile_id: str, request: ProfileUpdateRequest):
    try:
        users_collection.update_one(
            {"_id": ObjectId(profile_id)},
            {"$set": {
                "emergency_contact_name": request.emergency_contact_name,
                "emergency_contact_number": request.emergency_contact_number,
                "twilio_sid": request.twilio_sid,
                "twilio_token": request.twilio_token
            }}
        )
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/reflections/{profile_id}")
async def get_reflections(profile_id: str):
    try:
        loops = list(cognitive_loops_collection.find({"user_id": profile_id}).sort("created_at", -1))
        insights = list(masking_insights_collection.find({"user_id": profile_id}).sort("created_at", -1))
        
        for l in loops:
            l["id"] = str(l.pop("_id"))
            l["created_at"] = l["created_at"].isoformat()
        
        for i in insights:
            i["id"] = str(i.pop("_id"))
            i["created_at"] = i["created_at"].isoformat()
            
        return {
            "loops": loops,
            "masking_insights": insights,
            "sessions": []
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
