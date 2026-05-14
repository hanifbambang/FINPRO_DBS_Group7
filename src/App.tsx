import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from "react-router-dom";
import React, { useState } from "react";
import { Pokedex } from "./pages/Pokedex";
import { PokemonDetail } from "./pages/PokemonDetail";
import { BattleArena } from "./pages/BattleArena";
import { Safari } from "./pages/Safari";
import { Store } from "./pages/Store";
import { TypeChart } from "./pages/TypeChart";
import { Leaderboard } from "./pages/Leaderboard";
import { TrainerProfile } from "./pages/TrainerProfile";
import AuthPage from "./pages/AuthPage";
import { BattleProvider } from "./context/BattleContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { TrainerProvider, useTrainer } from "./context/TrainerContext";
import { Home, Swords, Trophy, User, Zap, LogOut, Volume2, VolumeX, ShoppingCart } from "lucide-react";
import { soundManager } from "./lib/sounds";

function AppContent() {
  const { user, logout, isLoading } = useAuth();
  const { coins } = useTrainer();
  const [isAudioEnabled, setIsAudioEnabled] = useState(soundManager.isEnabled());

  const toggleAudio = () => {
    const newState = soundManager.toggle();
    setIsAudioEnabled(newState);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-retro-dark flex items-center justify-center p-4">
        <div className="font-pixel text-white text-xl animate-pulse">LOADING ARCHIVE...</div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <div className="min-h-screen relative flex flex-col bg-brutalist-red p-2 sm:p-4">
      <div className="crt-overlay" />

      {/* Brutalist Header */}
      <header className="bg-retro-med p-4 flex flex-col sm:flex-row justify-between items-center border-b-8 border-black mb-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)]">
        <Link to="/" onClick={() => soundManager.play("click")} className="flex items-center gap-4 mb-4 sm:mb-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-400 rounded-full border-4 border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center">
              <div className="w-4 h-4 bg-white/30 rounded-full" />
            </div>
            <div className="flex gap-2">
              <div className="w-3 h-3 bg-red-600 rounded-full border-2 border-black"></div>
              <div className="w-3 h-3 bg-yellow-400 rounded-full border-2 border-black"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full border-2 border-black"></div>
            </div>
          </div>
          <div>
            <div className="text-white text-xl tracking-tighter font-mono font-bold uppercase sm:text-2xl">
              POKÉDEX ARCHIVE - REDIS V1.0
            </div>
            <div className="text-emerald-400 font-mono text-[8px] uppercase tracking-widest mt-1">
              CONNECTED_USER: {user.username}
            </div>
          </div>
        </Link>

        <nav className="flex gap-4 sm:gap-6 items-center flex-wrap justify-center">
          <Link to="/" onClick={() => soundManager.play("click")} className="text-white hover:text-yellow-400 flex flex-col items-center gap-1">
            <span className="font-mono text-[10px] font-bold uppercase">Index</span>
          </Link>
          <Link to="/safari" onClick={() => soundManager.play("click")} className="text-white hover:text-emerald-400 flex flex-col items-center gap-1">
            <span className="font-mono text-[10px] font-bold uppercase">Safari</span>
          </Link>
          <Link to="/store" onClick={() => soundManager.play("click")} className="text-white hover:text-yellow-400 flex flex-col items-center gap-1">
            <span className="font-mono text-[10px] font-bold uppercase">Store</span>
          </Link>
          <Link to="/battle" onClick={() => soundManager.play("click")} className="text-white hover:text-red-400 flex flex-col items-center gap-1">
            <span className="font-mono text-[10px] font-bold uppercase">Battle</span>
          </Link>
          <Link to="/types" onClick={() => soundManager.play("click")} className="text-white hover:text-purple-400 flex flex-col items-center gap-1">
            <span className="font-mono text-[10px] font-bold uppercase">Type Index</span>
          </Link>
          <Link to="/leaderboard" onClick={() => soundManager.play("click")} className="text-white hover:text-yellow-400 flex flex-col items-center gap-1">
            <span className="font-mono text-[10px] font-bold uppercase">Ranks</span>
          </Link>
          <Link to={`/trainer/${user.id}`} onClick={() => soundManager.play("click")} className="text-white hover:text-blue-400 flex flex-col items-center gap-1">
            <span className="font-mono text-[10px] font-bold uppercase">User</span>
          </Link>

          {/* Coin wallet in nav */}
          <div className="flex items-center gap-1 bg-yellow-400 text-black border-2 border-black px-2 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <span className="text-sm">🪙</span>
            <span className="font-pixel text-[10px]">{coins.toLocaleString()}</span>
          </div>

          <button
            onClick={toggleAudio}
            className="text-white hover:text-yellow-400 flex flex-col items-center gap-1 transition-colors relative group"
            title={isAudioEnabled ? "Mute" : "Unmute"}
          >
            {isAudioEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            <span className="font-mono text-[8px] font-bold uppercase">{isAudioEnabled ? "Audio On" : "Audio Off"}</span>
          </button>
          <button
            onClick={logout}
            className="text-red-400 hover:text-red-300 flex flex-col items-center gap-1 transition-colors"
          >
            <LogOut size={16} />
            <span className="font-mono text-[8px] font-bold uppercase">Eject</span>
          </button>
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-[1200px] mx-auto pb-12">
        <Routes>
          <Route path="/" element={<Pokedex />} />
          <Route path="/pokemon/:id" element={<PokemonDetail />} />
          <Route path="/safari" element={<Safari />} />
          <Route path="/store" element={<Store />} />
          <Route path="/battle" element={<BattleArena />} />
          <Route path="/types" element={<TypeChart />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/trainer/:id" element={<TrainerProfile />} />
        </Routes>
      </main>

      {/* Console Footer */}
      <footer className="mt-8 border-t-8 border-black p-4 bg-retro-med text-white">
        <div className="flex justify-between items-center font-mono text-[8px] uppercase tracking-[0.2em] opacity-70">
          <span>Kernel Status: Optimal</span>
          <span>Archive Integrity: 100%</span>
          <span>Session ID: {user.id}</span>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <TrainerProvider>
          <BattleProvider>
            <AppContent />
          </BattleProvider>
        </TrainerProvider>
      </AuthProvider>
    </Router>
  );
}
