# Nova

Nova is an AI-powered emotional resilience companion designed specifically to support adult women with ADHD. It offers an empathetic, interactive, and safe space for users to manage cognitive loops, practice difficult conversations, and receive personalized coaching.

---

## 🚀 Features

- **Practice Mode (Roleplay):** Simulates real-life scenarios (e.g., setting boundaries) using NVIDIA Nemotron AI models to help users safely practice difficult conversations.
- **Cognitive Loop Breaking:** Specialized agents that detect rumination and gently guide the user back to a grounded state.
- **Grounding Exercises:** Built-in tools and prompts to help alleviate acute executive dysfunction or emotional overwhelm.
- **Social Coaching:** Interactive conversational agents that help rehearse social interactions with personalized, low-pressure feedback.
- **Dynamic Personas:** Chat with different Nova "vibes" (e.g., Luna the Realist, Mae the Gentle Guide, Ivy the Chaos Queen).

---

## 🏗️ Architecture

Nova is built using a modern, decoupled architecture designed for real-time responsiveness and seamless AI integration.

### Frontend
- **Framework:** React + Vite
- **Styling:** Tailwind CSS & Framer Motion (for smooth micro-animations)
- **State Management:** React Hooks
- **Communication:** RESTful API calls to the Python backend

### Backend (Orchestrator)
- **Framework:** FastAPI (Python)
- **Routing:** Intent-based routing (`intent_router`) that dynamically dispatches user messages to specialized conversational agents based on context.
- **Database:** MongoDB (for storing user profiles, chat history, and cognitive insights). Supabase integration available for advanced auth/data needs.
- **AI / LLM Integration:**
  - **NVIDIA API (Nemotron):** Powers complex roleplay scenarios and realistic counterpart generation.
  - **Groq (Llama 3 / Whisper):** Used for low-latency conversational generation and high-speed audio transcription.
  - **Sentence Transformers:** Local Hugging Face models used for semantic intent routing and masking analysis.

---

## 🛠️ Local Setup and Development

### Prerequisites
- Node.js (v18+)
- Python (3.10+)
- MongoDB (running locally or accessible via URI)

### 1. Backend Setup

1. **Navigate to the root directory:**
   ```bash
   cd Nova
   ```
2. **Activate the virtual environment** (or create one):
   ```bash
   # Windows
   .\.venv\Scripts\Activate.ps1
   # macOS/Linux
   source .venv/bin/activate
   ```
3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```
4. **Environment Variables:**
   Ensure a `.env` file exists in the root directory with the necessary API keys:
   ```env
   GROQ_API_KEY=your_groq_key
   NVIDIA_API_KEY=your_nvidia_key
   MONGO_URI=mongodb://127.0.0.1:27017/Novadata
   # Add other required keys (e.g., Gemini, Supabase, Twilio)
   ```
5. **Run the FastAPI server:**
   ```bash
   uvicorn nova.orchestrator.main:app --reload
   ```
   *Note: On the very first run, the backend may take a couple of minutes to download the local Sentence Transformer weights from Hugging Face.*

### 2. Frontend Setup

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Run the development server:**
   ```bash
   npm run dev
   ```

### 3. Usage
Once both servers are running, access the application in your browser at `http://localhost:5173`.

---

## 🔒 Privacy & Data
Nova prioritizes user privacy. Chat histories and cognitive loops are securely stored to generate insights but are strictly isolated per user profile.
