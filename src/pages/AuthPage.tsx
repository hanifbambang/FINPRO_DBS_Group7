import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "motion/react";
import { LogIn, UserPlus, ShieldAlert, Loader2 } from "lucide-react";

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
    
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      let data;
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
      } else {
        const text = await res.text();
        throw new Error(text || "Server error occurred.");
      }

      if (!res.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      login(data.token, data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-retro-dark flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md bg-retro-med border-8 border-black p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] text-white"
      >
        <div className="flex justify-center mb-8">
          <div className="bg-red-600 border-4 border-black p-4 inline-block shadow-[4px_4px_0px_0px_white]">
            <h1 className="font-pixel text-2xl uppercase tracking-tighter">Pokedex Login</h1>
          </div>
        </div>

        <div className="flex gap-4 mb-8 border-b-4 border-black pb-4">
          <button 
            onClick={() => { setIsLogin(true); setError(null); }}
            className={`flex-1 font-pixel text-xs py-2 transition-all ${isLogin ? 'bg-white text-black' : 'bg-black text-white hover:bg-gray-800'}`}
          >
            LOGIN
          </button>
          <button 
            onClick={() => { setIsLogin(false); setError(null); }}
            className={`flex-1 font-pixel text-xs py-2 transition-all ${!isLogin ? 'bg-white text-black' : 'bg-black text-white hover:bg-gray-800'}`}
          >
            REGISTER
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="font-pixel text-[10px] uppercase block">Username</label>
            <input 
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-black border-4 border-white p-3 text-white font-mono focus:outline-none focus:border-red-500 transition-colors"
              placeholder="Username"
            />
          </div>

          <div className="space-y-2">
            <label className="font-pixel text-[10px] uppercase block">Password</label>
            <input 
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black border-4 border-white p-3 text-white font-mono focus:outline-none focus:border-red-500 transition-colors"
              placeholder="••••••••"
            />
          </div>

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                className="bg-red-500/20 border-2 border-red-500 p-3 flex items-center gap-3 text-red-400 font-mono text-xs"
              >
                <ShieldAlert size={16} className="shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white border-4 border-black p-4 font-pixel uppercase transition-all shadow-[4px_4px_0px_0px_black] active:translate-x-1 active:translate-y-1 active:shadow-none flex items-center justify-center gap-3"
          >
            {loading ? <Loader2 className="animate-spin" /> : (isLogin ? <LogIn size={18} /> : <UserPlus size={18} />)}
            {loading ? "PROCESSING..." : (isLogin ? "INITIALIZE" : "REGISTER UNIT")}
          </button>
        </form>

        <div className="mt-8 text-center opacity-50 font-mono text-[10px] uppercase tracking-widest">
          Authorized Personnel Only // Access Level 1 Required
        </div>
      </motion.div>
    </div>
  );
};

export default AuthPage;
