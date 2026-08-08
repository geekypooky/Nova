import os
import base64
from elevenlabs.client import ElevenLabs

# ElevenLabs API Key provided by user
API_KEY = "c343a9ae4516278867676737bcb34482e06c14f4ff5f49973429898d4c1d7f1e"
client = ElevenLabs(api_key=API_KEY)

VOICE_MAP = {
    "mae": "21m00Tcm4TlvDq8ikWAM",   # Rachel (warm, calm)
    "luna": "EXAVITQu4vr4xnSDxMaL",  # Bella (confident, clear)
    "ivy": "ErXwobaYiN019PkySvjV"    # Antoni (sassy, expressive)
}

def generate_voice_reply(text: str, vibe_level: str) -> str:
    """
    Generates audio from text using ElevenLabs API and returns a base64 encoded string.
    """
    voice_id = VOICE_MAP.get(vibe_level, VOICE_MAP["mae"])
    
    try:
        audio_generator = client.text_to_speech.convert(
            voice_id=voice_id,
            output_format="mp3_44100_128",
            text=text,
            model_id="eleven_turbo_v2_5" # Turbo model for fastest latency
        )
        
        # Audio generator yields bytes, we need to collect them
        audio_bytes = b"".join([chunk for chunk in audio_generator])
        
        # Convert to base64 so we can easily send it in the JSON response
        audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
        return audio_base64
        
    except Exception as e:
        print(f"ElevenLabs TTS Error: {e}")
        return ""
