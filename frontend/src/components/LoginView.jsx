import { useState } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function LoginView({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setIsLoading(true);
    // Mock authentication delay
    setTimeout(() => {
      setIsLoading(false);
      onLogin();
    }, 1000);
  };

  return (
    <div className="flex flex-col h-screen bg-background text-text-main font-sans relative overflow-hidden">
      {/* Decorative blurred background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-[#d1b06b]/20 rounded-full blur-3xl pointer-events-none" />

      <div className="flex-1 flex flex-col justify-center px-8 z-10">
        
        <div className="mb-12">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-surface border border-border shadow-sm mb-6">
            <Sparkles className="text-primary" size={24} />
          </div>
          <h1 className="text-4xl font-light tracking-tight mb-3">Welcome to Nova</h1>
          <p className="text-text-muted text-lg font-light leading-relaxed">
            Your resilient companion for untangling the chaos.
          </p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold tracking-wider uppercase text-text-muted ml-1">Email</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-surface/50 border border-border text-text-main placeholder:text-text-muted/50 rounded-xl px-4 py-3.5 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all shadow-sm backdrop-blur-sm"
              placeholder="you@example.com"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold tracking-wider uppercase text-text-muted ml-1">Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-surface/50 border border-border text-text-main placeholder:text-text-muted/50 rounded-xl px-4 py-3.5 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all shadow-sm backdrop-blur-sm"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="mt-4 flex items-center justify-center gap-2 w-full bg-text-main text-background hover:bg-text-main/90 font-medium py-4 rounded-xl transition-all shadow-md group disabled:opacity-70"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-background/30 border-t-background rounded-full animate-spin" />
            ) : (
              <>
                Sign In
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>
        
        <p className="mt-8 text-center text-sm text-text-muted">
          Don't have an account? <button className="text-primary hover:underline font-medium">Sign up</button>
        </p>
      </div>
    </div>
  );
}
