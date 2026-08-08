import { useState, useEffect } from 'react';
import { Check, Settings, Shield, User as UserIcon, Save } from 'lucide-react';

const PERSONAS = [
  {
    id: 'mae',
    name: 'Mae 🌸',
    title: 'The Gentle Guide',
    description: 'Playful and encouraging. A soft landing when you are overwhelmed.',
    avatar: '/avatar_mae.jpg',
    color: 'bg-[#d1b06b]/20',
    borderColor: 'border-[#d1b06b]'
  },
  {
    id: 'luna',
    name: 'Luna 🌙',
    title: 'The Realist',
    description: 'Witty, confident, and calls out negative thoughts playfully.',
    avatar: '/avatar_luna.jpg',
    color: 'bg-[#95b8a2]/20',
    borderColor: 'border-[#95b8a2]'
  },
  {
    id: 'ivy',
    name: 'Ivy 🌿',
    title: 'The Chaos Queen',
    description: 'Maximum dramatic humor. Absolutely roasts the intrusive thought.',
    avatar: '/avatar_ivy.jpg',
    color: 'bg-[#D97757]/20',
    borderColor: 'border-[#D97757]'
  }
];

export default function ProfileView({ userId, username, onLogout, selectedPersona, onPersonaChange }) {
  const [contactName, setContactName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [accountSid, setAccountSid] = useState('');
  const [authToken, setAuthToken] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/v1/profile/${userId}`);
        if (res.ok) {
          const data = await res.json();
          setContactName(data.emergency_contact_name || '');
          setContactNumber(data.emergency_contact_number || '');
          setAccountSid(data.twilio_sid || '');
          setAuthToken(data.twilio_token || '');
        }
      } catch (e) {
        console.error("Failed to load profile:", e);
      }
    };
    if (userId) fetchProfile();
  }, [userId]);

  const handleSaveSos = async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/v1/profile/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emergency_contact_name: contactName,
          emergency_contact_number: contactNumber,
          twilio_sid: accountSid,
          twilio_token: authToken
        })
      });
      if (res.ok) {
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
      }
    } catch (e) {
      console.error("Failed to save profile:", e);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background text-text-main font-sans overflow-y-auto">
      {/* Header */}
      <div className="pt-12 px-6 pb-6 bg-surface/50 border-b border-border sticky top-0 backdrop-blur-md z-10 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-light tracking-tight">{username}'s Profile</h1>
          <p className="text-text-muted mt-1 text-sm">Customize how Nova supports you.</p>
        </div>
        <button 
          onClick={onLogout}
          className="text-sm font-medium bg-red-500/10 hover:bg-red-500/20 text-red-500 px-4 py-2 rounded-xl transition-colors"
        >
          Log Out
        </button>
      </div>

      <div className="p-6 space-y-8 pb-24">
        
        {/* Persona Selector section */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <UserIcon size={20} className="text-primary" />
            <h2 className="text-lg font-medium">Companion Persona</h2>
          </div>
          <p className="text-sm text-text-muted mb-6">
            Choose the vibe that works best for your brain right now. You can change this anytime.
          </p>

          <div className="flex flex-col gap-4">
            {PERSONAS.map((persona) => (
              <button
                key={persona.id}
                onClick={() => onPersonaChange(persona.id)}
                className={`relative flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${
                  selectedPersona === persona.id 
                    ? `${persona.color} ${persona.borderColor} shadow-sm` 
                    : 'bg-surface/30 border-border hover:bg-surface/60'
                }`}
              >
                {/* Avatar Image */}
                <div className="w-16 h-16 rounded-full overflow-hidden shrink-0 border border-white/10 shadow-inner">
                  <img src={persona.avatar} alt={persona.name} className="w-full h-full object-cover" />
                </div>
                
                {/* Content */}
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="font-semibold text-lg">{persona.name}</h3>
                    {selectedPersona === persona.id && (
                      <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <Check size={12} className="text-background" strokeWidth={3} />
                      </div>
                    )}
                  </div>
                  <p className="text-xs font-medium text-text-muted/80 uppercase tracking-wider mb-1">{persona.title}</p>
                  <p className="text-sm leading-snug">{persona.description}</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Cognitive Boundaries */}
        <section className="pt-4 border-t border-border/50">
          <div className="flex items-center gap-2 mb-4">
            <Shield size={20} className="text-primary" />
            <h2 className="text-lg font-medium">Cognitive Boundaries</h2>
          </div>
          <div className="bg-surface/30 rounded-2xl p-4 border border-border">
            <p className="text-sm text-text-muted mb-4">You told Nova not to use:</p>
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs px-3 py-1.5 rounded-full font-medium">
                Toxic Positivity
                <button className="hover:text-primary/70 ml-1">&times;</button>
              </span>
              <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs px-3 py-1.5 rounded-full font-medium">
                Weight/Diet Talk
                <button className="hover:text-primary/70 ml-1">&times;</button>
              </span>
            </div>
            <div className="flex gap-2">
              <input type="text" placeholder="Add a boundary..." className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-text-main focus:outline-none focus:border-primary/50" />
              <button className="bg-primary/20 text-primary hover:bg-primary/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors">Add</button>
            </div>
          </div>
        </section>

        {/* Emergency SOS Contact */}
        <section className="pt-4 border-t border-border/50">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-400">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            </div>
            <h2 className="text-lg font-medium">Emergency SOS Contact (WhatsApp)</h2>
          </div>
          <p className="text-sm text-text-muted mb-4">
            If Nova detects a severe panic attack or shutdown, she can offer to automatically WhatsApp your safe person for you via Twilio.
          </p>
          <div className="bg-surface/30 rounded-2xl p-5 border border-red-500/20 space-y-4 shadow-sm">
            
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold tracking-wider uppercase text-text-muted">Safe Person's Name</label>
              <input type="text" value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="E.g., Alex" className="bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-text-main focus:outline-none focus:border-red-400/50" />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold tracking-wider uppercase text-text-muted">WhatsApp Number (with country code)</label>
              <input type="text" value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} placeholder="+1234567890" className="bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-text-main focus:outline-none focus:border-red-400/50" />
            </div>

            <div className="flex flex-col gap-1.5 mt-2">
              <label className="text-[10px] font-semibold tracking-wider uppercase text-text-muted/60">Twilio Account SID (Sandbox)</label>
              <input type="password" value={accountSid} onChange={(e) => setAccountSid(e.target.value)} placeholder="AC..." className="bg-background/50 border border-border/50 rounded-lg px-3 py-2 text-xs text-text-muted focus:outline-none" />
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-semibold tracking-wider uppercase text-text-muted/60">Twilio Auth Token</label>
              <input type="password" value={authToken} onChange={(e) => setAuthToken(e.target.value)} placeholder="••••••••••••••••" className="bg-background/50 border border-border/50 rounded-lg px-3 py-2 text-xs text-text-muted focus:outline-none" />
            </div>

            <button 
              onClick={handleSaveSos}
              className={`w-full mt-2 border py-2.5 rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2 ${
                isSaved 
                  ? 'bg-green-500/10 text-green-500 border-green-500/30'
                  : 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/30'
              }`}
            >
              {isSaved ? <><Save size={16} /> Saved!</> : 'Save SOS Settings'}
            </button>
          </div>
        </section>
        
      </div>
    </div>
  );
}
