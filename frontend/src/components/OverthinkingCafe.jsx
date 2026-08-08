import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, RefreshCcw } from 'lucide-react';

const SCENARIOS = [
  {
    id: 'text',
    title: "The Unanswered Text",
    fact: "You sent a message at 10:14 AM.",
    brainStory: "They haven't replied for 6 hours. They must be annoyed with you.",
    thoughts: [
      { id: "t1", text: "I sent the message.", category: "know" },
      { id: "t2", text: "They're ignoring me.", category: "guess" },
      { id: "t3", text: "Why they haven't replied.", category: "unknown" },
      { id: "t4", text: "Maybe they're busy.", category: "guess" }
    ],
    neutral: [
      "They could be busy.",
      "They could have seen the message and forgotten to reply.",
      "They could be dealing with something unrelated to you.",
      "They could also be annoyed. You don't currently have enough information to know."
    ]
  },
  {
    id: 'awkward',
    title: "The Awkward Conversation",
    fact: "You were talking to someone and accidentally interrupted them.",
    brainStory: "Everyone noticed I interrupted. I talked way too much. I'm so annoying.",
    thoughts: [
      { id: "a1", text: "I interrupted them.", category: "know" },
      { id: "a2", text: "Everyone thinks I'm annoying.", category: "guess" },
      { id: "a3", text: "What they actually thought of it.", category: "unknown" },
      { id: "a4", text: "They hate talking to me.", category: "guess" }
    ],
    neutral: [
      "Conversations overlap sometimes.",
      "They might not have even noticed.",
      "They might have forgotten it immediately."
    ]
  },
  {
    id: 'group',
    title: "The Group Chat",
    fact: "Everyone reacted to a message, but nobody reacted to yours.",
    brainStory: "They're probably talking about me in a separate chat without me.",
    thoughts: [
      { id: "g1", text: "Nobody reacted to my message.", category: "know" },
      { id: "g2", text: "They have a secret chat without me.", category: "guess" },
      { id: "g3", text: "Why nobody reacted.", category: "unknown" },
      { id: "g4", text: "They think I'm weird.", category: "guess" }
    ],
    neutral: [
      "Group chats move fast and messages get buried.",
      "People don't always react to every single message.",
      "They might have laughed in real life without tapping a button."
    ]
  }
];

// Floating Animated Thought Bubble
const DraggableThought = ({ thought, onDrop }) => {
  return (
    <motion.div
      drag
      dragSnapToOrigin
      onDragEnd={(event, info) => {
        // Simple hit detection for the 3 cups based on screen position
        const y = info.point.y;
        const x = info.point.x;
        const windowWidth = window.innerWidth;
        
        let targetCategory = null;
        if (y > window.innerHeight - 250) {
          if (x < windowWidth * 0.33) targetCategory = 'know';
          else if (x < windowWidth * 0.66) targetCategory = 'guess';
          else targetCategory = 'unknown';
        }
        
        if (targetCategory) {
          onDrop(thought, targetCategory);
        }
      }}
      className="cursor-grab active:cursor-grabbing p-4 bg-white/95 text-[#2d3436] font-bold rounded-2xl shadow-[0_10px_20px_rgba(0,0,0,0.3)] border-2 border-white mb-4 z-50 text-center"
      whileHover={{ scale: 1.05 }}
      whileDrag={{ scale: 1.15, zIndex: 100, rotate: (Math.random() - 0.5) * 15 }}
      animate={{ 
        y: [0, -10, 0],
        rotate: [0, 2, -2, 0]
      }}
      transition={{ 
        duration: 3 + Math.random() * 2, 
        repeat: Infinity, 
        ease: "easeInOut" 
      }}
    >
      {thought.text}
    </motion.div>
  );
};

export default function OverthinkingCafe({ onClose }) {
  const [phase, setPhase] = useState('selecting'); // 'selecting', 'brain_story', 'sorting', 'resolved', 'reflection'
  const [activeScenario, setActiveScenario] = useState(null);
  
  // Sorting state
  const [unsorted, setUnsorted] = useState([]);
  const [sorted, setSorted] = useState({ know: [], guess: [], unknown: [] });
  const [feedback, setFeedback] = useState("");
  const [volume, setVolume] = useState(5);

  const startScenario = (scenario) => {
    setActiveScenario(scenario);
    setUnsorted(scenario.thoughts);
    setSorted({ know: [], guess: [], unknown: [] });
    setVolume(5);
    setPhase('brain_story');
    setFeedback("");
  };

  const handleDrop = (thought, category) => {
    if (thought.category === category) {
      setUnsorted(prev => prev.filter(t => t.id !== thought.id));
      setSorted(prev => ({ ...prev, [category]: [...prev[category], thought] }));
      setFeedback("Exactly.");
      setVolume(prev => Math.max(1, prev - 1));
      
      if (unsorted.length === 1) { // Check if it's the last one
        setTimeout(() => setPhase('resolved'), 1000);
      }
    } else {
      setFeedback("Hmm. Let's look at that one again.");
    }
  };

  const isAnxious = phase === 'brain_story' || phase === 'sorting';

  return (
    <div className="absolute inset-0 z-50 overflow-hidden font-sans">
      
      {/* 1. The Pixel Art Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-transform duration-[10s] ease-in-out scale-105"
        style={{ 
          backgroundImage: "url('/cafe_bg.png')",
          transform: isAnxious ? 'scale(1.1)' : 'scale(1.05)'
        }}
      />

      {/* 2. Animated Rain Overlay */}
      <div className="absolute inset-0 opacity-40 pointer-events-none mix-blend-screen" style={{
        backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")',
        animation: 'snow 1s linear infinite' // Simple noise animation mimicking rain
      }}></div>

      {/* 3. The Dynamic Lighting / Anxiety Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none transition-all duration-1000 ease-in-out"
        style={{
          background: isAnxious 
            ? 'radial-gradient(circle at center, rgba(255, 71, 87, 0.15) 0%, rgba(0, 0, 0, 0.8) 100%)' 
            : 'radial-gradient(circle at center, rgba(255, 234, 167, 0.0) 0%, rgba(0, 0, 0, 0.3) 100%)',
          backdropFilter: isAnxious ? 'blur(4px)' : 'blur(0px)'
        }}
      />

      {/* 2D UI Overlay */}
      <div className="absolute inset-0 flex flex-col z-10 pointer-events-none">
        
        {/* Top Bar: Volume Indicator */}
        <AnimatePresence>
          {(phase === 'sorting' || phase === 'brain_story' || phase === 'resolved') && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="p-6 flex justify-between items-center pointer-events-auto"
            >
              <div className="bg-black/50 backdrop-blur-md px-6 py-3 rounded-full flex items-center gap-3 border border-white/10 shadow-lg text-white">
                <span className="font-bold tracking-widest text-xs opacity-70">BRAIN VOLUME</span>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <motion.div 
                      key={i} 
                      animate={i < volume ? { scale: [1, 1.2, 1], opacity: 1 } : { scale: 1, opacity: 0.3 }}
                      transition={{ duration: 0.5, repeat: i < volume ? Infinity : 0, repeatDelay: Math.random() * 2 }}
                      className={`w-3 h-3 rounded-full transition-colors duration-500 ${i < volume ? 'bg-[#ff6b81] shadow-[0_0_15px_#ff6b81]' : 'bg-white/20'}`} 
                    />
                  ))}
                </div>
              </div>
              {phase === 'resolved' && (
                <button onClick={() => setPhase('reflection')} className="px-6 py-3 bg-white text-[#2d3436] rounded-full font-bold shadow-[0_0_20px_rgba(255,255,255,0.5)] hover:bg-gray-100 transition flex items-center gap-2 animate-pulse">
                  Continue <ArrowRight size={18} />
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Phase: SELECTING */}
        <AnimatePresence mode="wait">
          {phase === 'selecting' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="flex-1 flex flex-col items-center justify-center p-8 pointer-events-auto"
            >
              <div className="bg-white/95 backdrop-blur-xl p-10 rounded-3xl max-w-4xl w-full shadow-2xl border-4 border-[#2d3436]">
                <div className="text-center mb-10">
                  <h1 className="text-4xl font-black text-[#2d3436] mb-4 uppercase tracking-widest">The Overthinking Café</h1>
                  <p className="text-lg text-gray-600 font-medium">Choose a table to sit at. Which situation feels familiar?</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {SCENARIOS.map(s => (
                    <button 
                      key={s.id}
                      onClick={() => startScenario(s)}
                      className="p-6 bg-[#f5f6fa] border-2 border-gray-200 rounded-2xl hover:border-[#ff9f43] hover:bg-white hover:shadow-xl transition-all text-left flex flex-col gap-3 group relative overflow-hidden"
                    >
                      <h3 className="font-bold text-xl text-[#2d3436] group-hover:text-[#ff9f43] transition-colors relative z-10">{s.title}</h3>
                      <p className="text-sm text-gray-500 line-clamp-3 leading-relaxed font-medium relative z-10">"{s.fact}"</p>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Phase: BRAIN STORY */}
          {phase === 'brain_story' && (
            <motion.div 
              key="brain_story"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className="absolute inset-0 flex items-center justify-center p-6 pointer-events-auto"
            >
              <div className="bg-black/80 backdrop-blur-xl border border-[#ff4757]/50 p-10 rounded-3xl max-w-2xl text-center shadow-[0_0_80px_rgba(255,71,87,0.4)]">
                <p className="text-[#ff4757] font-bold mb-4 text-sm tracking-widest uppercase animate-pulse">The Brain Story</p>
                <h2 className="text-3xl font-bold text-white mb-10 leading-relaxed italic">"{activeScenario.brainStory}"</h2>
                <button 
                  onClick={() => setPhase('sorting')}
                  className="px-8 py-4 bg-[#ff4757] text-white rounded-full font-bold shadow-[0_0_20px_#ff4757] hover:bg-[#ff6b81] hover:scale-105 transition-all text-lg"
                >
                  Examine Thoughts
                </button>
              </div>
            </motion.div>
          )}

          {/* Phase: SORTING */}
          {phase === 'sorting' && (
            <motion.div key="sorting" className="flex-1 flex flex-col pointer-events-none p-6">
              
              {/* Feedback Toast */}
              <div className="absolute top-32 left-1/2 -translate-x-1/2 pointer-events-none z-50">
                <AnimatePresence>
                  {feedback && (
                    <motion.div 
                      initial={{ opacity: 0, y: -20, scale: 0.8 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="bg-[#2d3436] px-8 py-4 rounded-full text-white font-bold shadow-2xl border-2 border-white/20 text-lg"
                    >
                      {feedback}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Unsorted Thoughts Pile */}
              <div className="flex-1 flex items-center justify-center pointer-events-auto relative">
                <div className="relative w-full max-w-md h-64">
                  {unsorted.map((thought, index) => (
                    <div key={thought.id} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ marginLeft: (index - 1) * 20, marginTop: (index - 1) * -30 }}>
                      <DraggableThought thought={thought} onDrop={handleDrop} />
                    </div>
                  ))}
                </div>
              </div>

              {/* The 3 Cups */}
              <div className="h-48 grid grid-cols-3 gap-6 pointer-events-auto mt-auto shrink-0 pb-6 px-10">
                {['know', 'guess', 'unknown'].map(cat => (
                  <div key={cat} className="flex flex-col items-center justify-end h-full relative group">
                    {/* Items inside cup */}
                    <div className="absolute bottom-20 flex flex-col gap-2 w-full px-2 items-center z-10">
                      <AnimatePresence>
                        {sorted[cat].map(t => (
                          <motion.div 
                            key={t.id} 
                            initial={{ scale: 0 }} animate={{ scale: 1 }}
                            className="bg-white/95 text-xs px-3 py-2 rounded-xl shadow-lg border-2 border-gray-100 text-center w-full truncate font-bold text-[#2d3436]"
                          >
                            {t.text}
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                    {/* The Cup Visual */}
                    <div className={`w-full max-w-[250px] h-32 rounded-t-3xl rounded-b-xl backdrop-blur-xl border-t-4 border-l-2 border-r-2 flex items-end justify-center pb-4 shadow-[0_20px_40px_rgba(0,0,0,0.5)] transition-colors duration-500 ${
                      cat === 'know' ? 'bg-[#10ac84]/30 border-[#10ac84]' : 
                      cat === 'guess' ? 'bg-[#ff9f43]/30 border-[#ff9f43]' : 
                      'bg-[#5f27cd]/30 border-[#5f27cd]'
                    }`}>
                      <span className="font-black text-white text-sm tracking-wider uppercase text-center px-4 drop-shadow-md">
                        {cat === 'know' ? 'What I Know' : 
                         cat === 'guess' ? "What I'm Guessing" : 
                         "What I Don't Know"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Phase: RESOLVED (Neutral Replay) */}
          {phase === 'resolved' && (
            <motion.div 
              key="resolved"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 flex items-center justify-center p-6 pointer-events-none"
            >
              <div className="bg-white/95 backdrop-blur-2xl border-4 border-[#2d3436] p-10 rounded-3xl max-w-3xl text-center shadow-[0_20px_50px_rgba(0,0,0,0.5)] pointer-events-auto">
                <p className="text-gray-400 font-bold mb-4 text-xs tracking-widest uppercase">The Neutral Reality</p>
                <h2 className="text-3xl font-black text-[#2d3436] mb-8 leading-relaxed">
                  "{activeScenario.fact}"
                </h2>
                <div className="space-y-4 mb-10 text-left bg-[#f5f6fa] p-8 rounded-2xl border-2 border-gray-100">
                  <p className="text-sm font-black text-[#ff9f43] uppercase tracking-widest mb-4">Possibilities:</p>
                  {activeScenario.neutral.map((n, i) => (
                    <motion.p 
                      key={i} 
                      initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.2 }}
                      className="text-gray-700 font-medium flex gap-3 text-lg"
                    >
                      <span className="text-[#10ac84] font-bold">→</span> {n}
                    </motion.p>
                  ))}
                </div>
                <p className="font-bold text-[#ff4757] text-xl px-10">
                  You don't know yet. And you don't have to solve the uncertainty right now.
                </p>
              </div>
            </motion.div>
          )}

          {/* Phase: REFLECTION */}
          {phase === 'reflection' && (
            <motion.div 
              key="reflection"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute inset-0 flex items-center justify-center p-6 pointer-events-auto"
            >
              <div className="bg-white p-12 rounded-3xl max-w-3xl w-full text-center shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-4 border-[#2d3436]">
                <h2 className="text-4xl font-black text-[#2d3436] mb-4">You don't need certainty to move forward.</h2>
                <p className="text-xl text-gray-500 mb-12 font-medium">You survived the uncertainty. You don't need to solve every social interaction.</p>
                
                <div className="flex gap-4 justify-center">
                  <button 
                    onClick={() => setPhase('selecting')}
                    className="px-8 py-4 bg-gray-100 hover:bg-gray-200 text-[#2d3436] rounded-full font-bold transition flex items-center gap-2 text-lg"
                  >
                    <RefreshCcw size={20} /> Another Table
                  </button>
                  <button 
                    onClick={onClose}
                    className="px-8 py-4 bg-[#ff9f43] hover:bg-[#ffa502] text-white rounded-full font-bold shadow-lg hover:shadow-xl transition text-lg"
                  >
                    Return to Chat
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <style>{`
        @keyframes snow {
          0% { background-position: 0 0; }
          100% { background-position: 100px 100px; }
        }
      `}</style>
    </div>
  );
}
