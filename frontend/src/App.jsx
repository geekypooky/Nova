import { useState } from 'react';
import DashboardLayout from './components/DashboardLayout';
import AuthView from './components/AuthView';
import ConversationView from './components/ConversationView';
import ReflectionView from './components/ReflectionView';
import ProfileView from './components/ProfileView';
import './index.css';

function App() {
  const [userId, setUserId] = useState(() => localStorage.getItem('nova_user_id'));
  const [username, setUsername] = useState(() => localStorage.getItem('nova_username'));
  
  const [activeTab, setActiveTab] = useState('chat');
  const [selectedPersona, setSelectedPersona] = useState('luna');
  const [chatHistory, setChatHistory] = useState([]);

  const handleLogin = (id, name) => {
    localStorage.setItem('nova_user_id', id);
    localStorage.setItem('nova_username', name);
    setUserId(id);
    setUsername(name);
  };

  const handleLogout = () => {
    localStorage.removeItem('nova_user_id');
    localStorage.removeItem('nova_username');
    setUserId(null);
    setUsername(null);
  };

  if (!userId) {
    return <AuthView onLogin={handleLogin} />;
  }

  return (
    <div className="w-full h-screen overflow-hidden bg-[#F5F7F4]">
      <DashboardLayout 
        userId={userId} 
        username={username} 
        onLogout={handleLogout}
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        selectedPersona={selectedPersona}
        setSelectedPersona={setSelectedPersona}
      >
        {activeTab === 'chat' && (
          <ConversationView 
            userId={userId}
            selectedPersona={selectedPersona} 
            chatHistory={chatHistory} 
            setChatHistory={setChatHistory} 
          />
        )}
        {activeTab === 'reflections' && <ReflectionView userId={userId} />}
        {activeTab === 'profile' && <ProfileView userId={userId} username={username} onLogout={handleLogout} />}
      </DashboardLayout>
    </div>
  );
}

export default App;
