import { MessageSquare, BrainCircuit, User, Sparkles } from 'lucide-react';

export default function DashboardLayout({ 
  children, 
  activeTab, 
  setActiveTab, 
  selectedPersona, 
  setSelectedPersona 
}) {
  const tabs = [
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'reflections', label: 'Reflections', icon: BrainCircuit },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  const personas = [
    { id: 'luna', name: 'Luna', desc: 'The Realist' },
    { id: 'mae', name: 'Mae', desc: 'The Gentle Guide' },
    { id: 'ivy', name: 'Ivy', desc: 'The Chaos Queen' },
  ];

  return (
    <div className="flex h-screen bg-[#F5F7F4] text-[#2c3e50] font-sans">
      
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white/60 backdrop-blur-xl border-r border-[#dbe4dd] flex flex-col justify-between shadow-sm z-20">
        <div>
          {/* Logo / Brand */}
          <div className="p-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#72A680] to-[#517a5b] flex items-center justify-center shadow-md">
              <Sparkles className="text-white" size={20} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#2c3e50]">Nova</h1>
          </div>

          {/* Navigation Links */}
          <nav className="px-4 mt-6 flex flex-col gap-2">
            {tabs.map(tab => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 font-medium ${
                    isActive 
                      ? 'bg-white shadow-sm text-[#72A680] border border-[#dbe4dd]/50' 
                      : 'text-[#6c7f93] hover:bg-white/50 hover:text-[#2c3e50]'
                  }`}
                >
                  <Icon size={20} className={isActive ? 'text-[#72A680]' : 'text-[#8d9fb1]'} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Persona Selector */}
        <div className="p-4 mb-4">
          <div className="bg-white/50 backdrop-blur-md rounded-2xl p-4 border border-[#dbe4dd] shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#8d9fb1] mb-3 ml-1">Persona</h3>
            <div className="flex flex-col gap-2">
              {personas.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPersona(p.id)}
                  className={`flex flex-col items-start px-4 py-2.5 rounded-xl transition-all duration-200 border ${
                    selectedPersona === p.id 
                      ? 'bg-[#72A680] text-white border-[#72A680] shadow-md scale-[1.02]' 
                      : 'bg-white text-[#475f77] border-[#dbe4dd] hover:border-[#72A680]/50 hover:bg-[#F5F7F4]'
                  }`}
                >
                  <span className="font-semibold text-sm">{p.name}</span>
                  <span className={`text-[10px] ${selectedPersona === p.id ? 'text-white/80' : 'text-[#8d9fb1]'}`}>
                    {p.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-hidden flex flex-col">
        {children}
      </main>
      
    </div>
  );
}
