import requests
import json
import os

class NvidiaClient:
    def __init__(self):
        self.invoke_url = "https://integrate.api.nvidia.com/v1/chat/completions"
        self.api_key = "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"
        self.model = "nvidia/nemotron-nano-12b-v2-vl"

    def generate_reply(self, system_prompt: str, chat_history: list, user_message: str) -> str:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Accept": "application/json",
            "Content-Type": "application/json"
        }

        messages = [{"role": "system", "content": system_prompt}]
        for msg in chat_history:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            if role == "system": 
                continue # Nemotron only wants one system prompt usually
            messages.append({"role": "user" if role == "user" else "assistant", "content": content})
            
        messages.append({"role": "user", "content": user_message})

        payload = {
            "messages": messages,
            "model": self.model,
            "frequency_penalty": 0,
            "max_tokens": 1024,
            "presence_penalty": 0,
            "stream": False,
            "temperature": 0.7,
            "top_p": 1
        }

        try:
            response = requests.post(self.invoke_url, headers=headers, json=payload, timeout=15)
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"].strip()
        except Exception as e:
            print(f"[NVIDIA_CLIENT] Failed to generate reply: {e}")
            if hasattr(e, 'response') and e.response:
                print(e.response.text)
            return "I'm having trouble processing that right now."

nvidia_client = NvidiaClient()
