import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Send, Sparkles, User, UserCheck } from 'lucide-react';

export default function PracticeView({ scenario, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [phase, setPhase] = useState('setup'); // setup, active, debrief

  useEffect(() => {
    if (scenario) {
      setMessages([
        { role: 'system', content: `Scenario: ${scenario.title}` },
        { role: 'system', content: `You are talking to: ${scenario.counterpart}` }
      ]);
    }
  }, [scenario]);

  const startRoleplay = () => {
    setPhase('active');
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'counterpart', content: scenario?.opening_line || "Hey, what's on your mind?" }]);
    }, 1000);
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const newMsg = { role: 'user', content: input };
    const updatedMessages = [...messages, newMsg];
    setMessages(updatedMessages);
    setInput('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/v1/roleplay/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: 'local-session',
          scenario_id: scenario?.id || 'custom',
          message: input,
          chat_history: messages.filter(m => m.role !== 'system')
        })
      });

      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();

      setMessages(prev => [...prev, { 
        role: 'counterpart', 
        content: data.reply 
      }]);
    } catch (error) {
      console.error("Failed to fetch roleplay response:", error);
      setMessages(prev => [...prev, { 
        role: 'counterpart', 
        content: "I'm sorry, I couldn't process that right now. (Connection Error)" 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className="absolute inset-0 z-[100] bg-gray-50 flex flex-col font-sans"
    >
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition text-gray-500">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h2 className="font-bold text-gray-800 text-lg flex items-center gap-2">
              <Sparkles className="text-purple-500" size={18} /> Practice Mode
            </h2>
            <p className="text-xs text-gray-500 font-medium">Safe space to mess up</p>
          </div>
        </div>
        {phase === 'active' && (
          <button onClick={() => setPhase('debrief')} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-full text-sm font-bold hover:bg-gray-200 transition">
            End Practice
          </button>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 max-w-3xl w-full mx-auto">
        
        {phase === 'setup' && (
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="m-auto text-center bg-white p-10 rounded-3xl shadow-xl border border-gray-100 max-w-lg">
            <div className="w-16 h-16 bg-purple-100 text-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <UserCheck size={32} />
            </div>
            <h1 className="text-2xl font-black text-gray-800 mb-2">{scenario?.title || "Custom Scenario"}</h1>
            <p className="text-gray-600 mb-8 leading-relaxed">
              You are talking to: <strong>{scenario?.counterpart || "Someone"}</strong>
            </p>
            <p className="text-sm text-gray-400 mb-8">
              Nova is running the simulation. She will jump in to coach you if you get stuck.
            </p>
            <button onClick={startRoleplay} className="w-full py-4 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition shadow-lg shadow-purple-200">
              Start Simulation
            </button>
          </motion.div>
        )}

        {phase === 'active' && (
          <div className="flex flex-col gap-4 mt-auto">
            <AnimatePresence>
              {messages.map((msg, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : msg.role === 'system' ? 'justify-center' : 'justify-start'}`}
                >
                  {msg.role === 'system' ? (
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-widest my-4">
                      {msg.content}
                    </div>
                  ) : (
                    <div className={`max-w-[80%] rounded-2xl p-4 shadow-sm ${
                      msg.role === 'user' 
                        ? 'bg-purple-600 text-white rounded-br-sm' 
                        : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm'
                    }`}>
                      {msg.role === 'counterpart' && (
                        <div className="text-xs font-bold text-gray-400 mb-1 flex items-center gap-1">
                          <User size={12} /> Counterpart
                        </div>
                      )}
                      <p className="leading-relaxed">{msg.content}</p>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            
            {isTyping && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm p-4 shadow-sm flex gap-1 items-center">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                </div>
              </motion.div>
            )}
          </div>
        )}

        {phase === 'debrief' && (
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="m-auto text-center bg-white p-10 rounded-3xl shadow-xl border border-gray-100 max-w-lg">
            <Sparkles className="text-yellow-500 mx-auto mb-6" size={48} />
            <h2 className="text-2xl font-black text-gray-800 mb-4">Practice Complete!</h2>
            <p className="text-gray-600 mb-8">
              Great job facing that anxiety head-on. You set boundaries clearly and kept your cool.
            </p>
            <button onClick={onClose} className="w-full py-4 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition">
              Return to Chat
            </button>
          </motion.div>
        )}
      </div>

      {/* Input Area */}
      {phase === 'active' && (
        <div className="bg-white border-t border-gray-200 p-4 shrink-0">
          <div className="max-w-3xl mx-auto relative flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type your response..."
              className="flex-1 bg-gray-100 border-none rounded-full py-3 px-6 text-gray-700 focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
            <button 
              onClick={handleSend}
              disabled={!input.trim()}
              className="p-3 bg-purple-600 text-white rounded-full hover:bg-purple-700 disabled:opacity-50 transition shadow-md"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
