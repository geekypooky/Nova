import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import LineArtBackground from './LineArtBackground';

export default function AuthView({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isLogin ? '/api/v1/auth/login' : '/api/v1/auth/register';

    try {
      const res = await fetch(`http://localhost:8000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (res.ok) {
        onLogin(data.user_id, data.username);
      } else {
        setError(data.detail || 'Authentication failed');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-theme-frost text-text-main font-sans relative overflow-hidden items-center justify-center">
      <LineArtBackground />
      
      <div className="z-10 w-full max-w-md p-8 backdrop-blur-xl bg-white/60 border border-white/50 rounded-3xl shadow-[0_-8px_30px_rgba(0,0,0,0.04)]">
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-theme-peppermint to-theme-delltone rounded-2xl flex items-center justify-center shadow-lg mb-4">
            <Sparkles className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-[#2c3e50] tracking-tight">Nova</h1>
          <p className="text-[#64748b] text-sm mt-2 text-center">Your private space to untangle your mind.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#475f77] mb-1">Username</label>
            <input 
              type="text" 
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-white/80 border border-white rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-peppermint shadow-sm"
              placeholder="Enter your username"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#475f77] mb-1">Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white/80 border border-white rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-peppermint shadow-sm"
              placeholder="Enter your password"
            />
          </div>

          {error && <p className="text-red-500 text-sm text-center font-medium">{error}</p>}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 mt-4 bg-[#2c3e50] hover:bg-[#1a252f] text-white rounded-xl font-medium shadow-md transition-all disabled:opacity-50"
          >
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-[#64748b] hover:text-[#2c3e50] transition-colors"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
