import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Send, Sparkles, Volume2, VolumeX, Mic, Square } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import MindRoom from './MindRoom';
import TaskMountain from './TaskMountain';
import MirrorRoom from './MirrorRoom';
import OverthinkingCafe from './OverthinkingCafe';
import PracticeView from './PracticeView';
import LoopBreaker3D from './LoopBreaker3D';
import LineArtBackground from './LineArtBackground';

export default function ConversationView({ userId, selectedPersona, chatHistory, setChatHistory }) {
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [novaState, setNovaState] = useState('idle'); // idle, listening, thinking, speaking
  const [transcriptOpen, setTranscriptOpen] = useState(true);
  
  const [showMindRoom, setShowMindRoom] = useState(false);
  const [showTaskMountain, setShowTaskMountain] = useState(false);
  const [showMirrorRoom, setShowMirrorRoom] = useState(false);
  const [showOverthinkingCafe, setShowOverthinkingCafe] = useState(false);
  const [showPracticeView, setShowPracticeView] = useState(false);
  const [showLoopBreaker, setShowLoopBreaker] = useState(false);
  
  const [taskName, setTaskName] = useState("");
  const [rsdThought, setRsdThought] = useState("");
  const [practiceScenario, setPracticeScenario] = useState("");
  const [loopData, setLoopData] = useState(null);
  
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  const scrollRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory, transcriptOpen, novaState]);

  useEffect(() => {
    const firstMsg = selectedPersona === 'luna' 
      ? "Hey. Sit down, take a breath. What's actually going on in that head of yours?"
      : selectedPersona === 'mae'
      ? "Hi there, sweetheart. I've got you. What's feeling too heavy right now?"
      : "Alright, let's get into it. What disaster are we currently hyperfixating on?";
      
    if (chatHistory.length === 0) {
      setChatHistory([{ role: 'nova', content: firstMsg }]);
    }
  }, [selectedPersona, chatHistory.length]);

  const playAudio = (base64String) => {
    if (!base64String) return;
    try {
      const audio = new Audio("data:audio/mp3;base64," + base64String);
      audio.play();
    } catch (e) {
      console.error("Audio playback failed:", e);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        
        await sendAudioForTranscription(audioBlob);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Microphone access denied or error:", err);
      alert("Could not access microphone.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const sendAudioForTranscription = async (blob) => {
    setIsSending(true);
    setNovaState('listening');
    
    const formData = new FormData();
    formData.append('file', blob, 'recording.webm');
    
    try {
      const res = await fetch('http://localhost:8000/api/v1/transcribe', {
        method: 'POST',
        body: formData
      });
      
      if (res.ok) {
        const data = await res.json();
        const transcribedText = data.text.trim();
        if (transcribedText) {
           sendMessage(transcribedText);
        } else {
           setIsSending(false);
           setNovaState('idle');
        }
      } else {
        setIsSending(false);
        setNovaState('idle');
        console.error("Transcription failed", res.status);
      }
    } catch (err) {
      setIsSending(false);
      setNovaState('idle');
      console.error("Fetch error:", err);
    }
  };

  const sendMessage = async (forcedText = null) => {
    const textToSend = typeof forcedText === 'string' ? forcedText : inputText;
    if (!textToSend.trim() || isSending) return;

    const userMessage = textToSend.trim();
    setInputText('');
    setChatHistory(prev => [...prev, { role: 'user', content: userMessage }]);
    setNovaState('thinking');
    setIsSending(true);
    setTranscriptOpen(true); // Auto-open transcript when texting

    try {
      const response = await fetch('http://localhost:8000/api/v1/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          session_id: userId,
          message: userMessage,
          vibe_level: selectedPersona,
          voice_enabled: voiceEnabled
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.audio_base64 && voiceEnabled) {
          playAudio(data.audio_base64);
        }

        if (data.agent_state?.simulation === 'mind_room') {
          setShowMindRoom(true);
        } else if (data.agent_state?.simulation === 'task_mountain') {
          setTaskName(data.agent_state?.task_identified || null);
          setShowTaskMountain(true);
        } else if (data.agent_state?.simulation === 'mirror_room') {
          setRsdThought(userMessage); // pass the real RSD thought into mirrors
          setShowMirrorRoom(true);
        } else if (data.agent_state?.simulation === 'overthinking_cafe') {
          setShowOverthinkingCafe(true);
        } else if (data.agent_state?.navigate === 'practice') {
          setPracticeScenario(data.agent_state.prefill_scenario);
          setShowPracticeView(true);
        }
        
        setChatHistory(prev => [...prev, { 
            role: 'nova', 
            content: data.reply, 
            agent_state: data.agent_state, 
            active_agent: data.active_agent 
        }]);
        setNovaState('speaking');
        // Reset to idle after 3 seconds
        setTimeout(() => setNovaState('idle'), 3000);
      } else {
        console.error("Backend error", response.status);
        setNovaState('idle');
      }
    } catch (error) {
      console.error("Fetch error:", error);
      setNovaState('idle');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  const getStateColor = () => {
    switch(novaState) {
      case 'listening': return 'bg-[#95b8a2] shadow-[#95b8a2]/40'; // soft sage green
      case 'thinking': return 'bg-[#d1b06b] shadow-[#d1b06b]/40'; // soft mustard/gold
      case 'speaking': return 'bg-[#D97757] shadow-[#D97757]/40'; // primary warm terracotta
      case 'idle':
      default: return 'bg-[#e2ddd9] shadow-[#e2ddd9]/40'; // warm grey
    }
  };

  const getStateLabel = () => {
    switch(novaState) {
      case 'listening': return 'Nova is listening...';
      case 'thinking': return 'Nova is thinking...';
      case 'speaking': return 'Nova is speaking...';
      case 'idle':
      default: return 'Tap to talk to Nova';
    }
  };

  const handleEndSession = async () => {
    if (chatHistory.length < 2) return;
    setIsSummarizing(true);
    try {
      await fetch('http://localhost:8000/api/v1/sessions/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: userId,
          chat_history: chatHistory
        })
      });
      // Navigate to reflections page (Assuming user can click the bottom tab)
      alert("Session summarized! Check the Reflections tab for new Masking Insights.");
    } catch (err) {
      console.error("Failed to summarize:", err);
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleDynamicAction = async (actionType, payload) => {
    if (actionType === 'micro_step_done') {
        sendMessage("I did it!");
    } else if (actionType === 'start_roleplay') {
        sendMessage("Yes, let's practice this.");
    } else if (actionType === 'next_turn') {
        sendMessage("Okay, next.");
    } else if (actionType === 'trigger_sos') {
        try {
            const saved = localStorage.getItem('nova_sos_settings');
            if (!saved) {
                alert("Please configure your Emergency Contacts in the Profile tab first.");
                return;
            }
            const data = JSON.parse(saved);
            if (!data.contactName || !data.contactNumber || !data.accountSid || !data.authToken) {
                alert("Please fully configure your Emergency Contacts in the Profile tab.");
                return;
            }
            
            const response = await fetch('http://localhost:8000/api/v1/sos/trigger', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contact_name: data.contactName,
                    contact_number: data.contactNumber,
                    account_sid: data.accountSid,
                    auth_token: data.authToken
                })
            });
            const resData = await response.json();
            if (response.ok) {
                sendMessage(`I've sent an SOS to ${data.contactName}. They should be reaching out soon.`);
            } else {
                alert("Failed to send SOS: " + resData.detail);
            }
        } catch (e) {
            alert("Error sending SOS: " + e.message);
        }
    }
  };

  const renderDynamicButtons = (msg) => {
    if (msg.role !== 'nova' || !msg.agent_state) return null;

    const { active_agent, agent_state } = msg;

    // SOS Emergency Button Override (takes priority over anything else)
    if (agent_state.sos_offered) {
        return (
            <div className="mt-4 flex gap-2">
                <button 
                    onClick={() => handleDynamicAction('trigger_sos')}
                    className="px-5 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-all duration-200 shadow-md border border-red-500/30 font-medium text-sm flex items-center gap-2 animate-pulse"
                >
                    🚨 Text my emergency contact
                </button>
            </div>
        );
    }

    if (active_agent === 'exec_dysfunction' && agent_state.micro_step) {
        return (
            <div className="mt-4 flex gap-2">
                <button 
                    onClick={() => handleDynamicAction('micro_step_done')}
                    className="px-5 py-2.5 bg-theme-jujube hover:bg-[#86A814] text-white rounded-xl transition-all duration-200 shadow-md border border-[#86A814] font-medium text-sm flex items-center gap-2"
                >
                    ✓ I did it!
                </button>
            </div>
        );
    }

    if (active_agent === 'social_coach' && agent_state.roleplay_offered) {
        return (
            <div className="mt-4 flex gap-2">
                <button 
                    onClick={() => handleDynamicAction('start_roleplay')}
                    className="px-5 py-2.5 bg-theme-delltone hover:bg-[#72A680] text-white rounded-xl transition-all duration-200 shadow-md border border-[#72A680] font-medium text-sm flex items-center gap-2"
                >
                    🎭 Start Roleplay
                </button>
            </div>
        );
    }

    if (active_agent === 'inner_critic' && agent_state.current_turn && agent_state.current_turn < 4) {
        return (
            <div className="mt-4 flex gap-2">
                <button 
                    onClick={() => handleDynamicAction('next_turn')}
                    className="px-5 py-2.5 bg-theme-peppermint hover:bg-[#97C5B0] text-[#2c3e50] rounded-xl transition-all duration-200 shadow-md border border-[#97C5B0] font-medium text-sm flex items-center gap-2"
                >
                    Continue →
                </button>
            </div>
        );
    }

    return null;
  };

  return (
    <div className="flex flex-col h-full bg-theme-frost text-text-main font-sans relative overflow-hidden">
      {showMindRoom && <MindRoom onClose={() => setShowMindRoom(false)} />}
      {showTaskMountain && <TaskMountain onClose={() => setShowTaskMountain(false)} taskName={taskName} />}
      {showMirrorRoom && <MirrorRoom onClose={() => setShowMirrorRoom(false)} userThought={rsdThought} />}
      {showOverthinkingCafe && <OverthinkingCafe onClose={() => setShowOverthinkingCafe(false)} />}
      {showPracticeView && <PracticeView scenario={practiceScenario} onClose={() => setShowPracticeView(false)} />}
      
      <LineArtBackground />

      {/* Header */}
      <div className="flex items-center justify-between p-6 z-10">
        <div>
          <h1 className="text-2xl font-bold text-[#2c3e50] tracking-tight">Nova</h1>
          <p className="text-sm text-[#475f77] font-medium mt-1">
            {novaState === 'listening' ? 'Nova is listening...' :
             novaState === 'thinking' ? 'Nova is thinking...' :
             novaState === 'speaking' ? 'Nova is speaking...' : 'Tap to talk to Nova'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className={`flex items-center justify-center w-10 h-10 rounded-full transition-all border ${
              voiceEnabled 
                ? 'bg-theme-peppermint text-[#1e293b] border-[#97C5B0] shadow-sm' 
                : 'bg-white/60 text-[#64748b] border-white/40 hover:bg-white backdrop-blur-sm'
            }`}
            title={voiceEnabled ? "Voice Mode ON" : "Voice Mode OFF"}
          >
            {voiceEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
          
          <button 
            onClick={handleEndSession}
            disabled={isSummarizing}
            className="text-sm font-medium bg-white/60 text-[#2c3e50] px-5 py-2 h-10 rounded-full hover:bg-white shadow-sm transition-all border border-white/40 backdrop-blur-sm disabled:opacity-50"
          >
            {isSummarizing ? "Analyzing..." : "End Session"}
          </button>
        </div>
      </div>

      {/* Transcript Container - Glassmorphism */}
      <div 
        className={`w-full max-w-3xl mx-auto transition-all duration-500 ease-in-out flex flex-col backdrop-blur-xl bg-white/60 border border-white/50 rounded-t-3xl shadow-[0_-8px_30px_rgba(0,0,0,0.04)] flex-1 min-h-0 mt-4 ${
          transcriptOpen ? 'opacity-100' : 'h-0 opacity-0'
        }`}
      >
        <div className="flex items-center justify-between p-5 border-b border-white/50 bg-white/40 rounded-t-3xl">
          <h2 className="text-xs font-bold tracking-widest text-[#64748b] uppercase">Conversation Log</h2>
          <button 
            onClick={() => setTranscriptOpen(false)}
            className="text-[#64748b] hover:text-[#2c3e50] transition-colors p-1 bg-white/50 rounded-full hover:bg-white"
          >
            <ChevronDown size={18} />
          </button>
        </div>

        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth"
        >
          {chatHistory.map((msg, idx) => (
            <div 
              key={idx} 
              className={`flex flex-col max-w-[85%] ${
                msg.role === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
              } animate-in fade-in slide-in-from-bottom-2 duration-300`}
            >
              <div 
                className={`p-4 rounded-3xl shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-theme-peppermint text-[#1e293b] rounded-br-sm border border-theme-delltone/30' 
                    : 'bg-white text-[#334155] border border-white/50 rounded-bl-sm leading-relaxed'
                }`}
              >
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
              {renderDynamicButtons(msg)}
            </div>
          ))}
          {isSending && (
            <div className="flex max-w-[85%] mr-auto">
              <div className="p-4 rounded-3xl bg-white text-[#64748b] border border-white/50 rounded-bl-sm flex space-x-2 shadow-sm">
                <div className="w-2 h-2 rounded-full bg-theme-peppermint animate-bounce"></div>
                <div className="w-2 h-2 rounded-full bg-theme-peppermint animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 rounded-full bg-theme-peppermint animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input Area (Texting) */}
      <div className="p-5 bg-white/70 backdrop-blur-xl border-t border-white/50 pb-8 z-10 relative shrink-0">
        <div className="max-w-3xl mx-auto mb-3 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button onClick={() => setInputText("Roast me")} className="whitespace-nowrap px-4 py-1.5 rounded-full bg-white/60 border border-white/80 text-xs font-semibold text-[#64748b] hover:bg-white hover:text-theme-jujube transition-colors flex items-center gap-1 shadow-sm"><Sparkles size={12}/> Roast me</button>
          <button onClick={() => setInputText("I can't start my work")} className="whitespace-nowrap px-4 py-1.5 rounded-full bg-white/60 border border-white/80 text-xs font-semibold text-[#64748b] hover:bg-white hover:text-theme-jujube transition-colors flex items-center gap-1 shadow-sm"><Sparkles size={12}/> I can't start my work</button>
          <button onClick={() => setInputText("I need a distraction")} className="whitespace-nowrap px-4 py-1.5 rounded-full bg-white/60 border border-white/80 text-xs font-semibold text-[#64748b] hover:bg-white hover:text-theme-jujube transition-colors flex items-center gap-1 shadow-sm"><Sparkles size={12}/> I need a distraction</button>
        </div>
        {/* Input Area */}
        <div className="p-4 bg-white/40 border-t border-white/50 backdrop-blur-md rounded-b-3xl">
          <div className="flex items-center gap-2">
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isSending || isRecording}
              placeholder={isRecording ? "Listening..." : "Type your message..."}
              className={`flex-1 bg-white/80 border border-white rounded-full px-5 py-3 text-[#2c3e50] focus:outline-none focus:ring-2 focus:ring-[#97C5B0] shadow-sm transition-all ${isRecording ? 'animate-pulse text-theme-delltone' : ''}`}
            />
            
            {isRecording ? (
              <button 
                onClick={stopRecording}
                className="bg-red-500 hover:bg-red-600 text-white p-3 rounded-full shadow-md transition-all animate-pulse"
                title="Stop Recording"
              >
                <Square size={20} className="fill-current" />
              </button>
            ) : (
              <button 
                onClick={startRecording}
                disabled={isSending}
                className="bg-white/80 hover:bg-white text-[#475f77] p-3 rounded-full shadow-sm transition-all disabled:opacity-50 border border-white"
                title="Tap to Record"
              >
                <Mic size={20} />
              </button>
            )}

            <button 
              onClick={() => sendMessage()}
              disabled={!inputText.trim() || isSending || isRecording}
              className="bg-[#2c3e50] hover:bg-[#1a252f] text-white p-3 rounded-full shadow-md transition-all disabled:opacity-50 disabled:bg-[#8d9fb1]"
            >
              <Send size={20} className="ml-0.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
