import React, { useEffect } from "react";
import { DialogueBox } from "../components/DialogueBox";
import { motion, AnimatePresence } from "motion/react";
import { Swords, RotateCcw, Shield, Zap, Sparkles } from "lucide-react";
import { useBattle } from "../context/BattleContext";
import { MOVES, getTypeColor } from "../constants";

export const BattleArena: React.FC = () => {
  const {
    playerPokemon,
    rival,
    rivalActiveIndex,
    playerHp,
    rivalHp,
    playerMaxHp,
    rivalMaxHp,
    playerTeam,
    playerActiveIndex,
    playerLevel,
    setPlayerLevel,
    playerTeamHps,
    playerTeamMaxHps,
    isBattleActive,
    messages,
    isAnimating,
    fetchRival,
    handleMove,
    handleSwitch
  } = useBattle();

  const [showSwitchMenu, setShowSwitchMenu] = React.useState(false);

  useEffect(() => {
    // Auto-open switch menu if active Pokemon fainted and battle is still active
    if (playerHp <= 0 && isBattleActive && !isAnimating) {
      const hasUsable = playerTeamHps.some(h => h > 0);
      if (hasUsable) {
        setShowSwitchMenu(true);
      }
    }
  }, [playerHp, isBattleActive, isAnimating, playerTeamHps]);

  useEffect(() => {
    if (!isBattleActive && !rival) {
      fetchRival();
    }
  }, [isBattleActive, rival, fetchRival]);

  const currentRivalPokemon = rival?.team[rivalActiveIndex];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-center bg-retro-med p-6 border-4 border-black text-white shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)] gap-4">
        <div>
          <h2 className="font-pixel text-lg uppercase">Combat Division</h2>
          <p className="font-mono text-[10px] opacity-70 italic tracking-widest uppercase">
            {rival ? `Target: RIVAL_${rival.name.toUpperCase()}` : "Scanning for signals..."}
          </p>
        </div>
        
        <div className="flex items-center gap-6">
          {/* Level Adjustment */}
          <div className="flex flex-col items-end">
            <span className="font-pixel text-[8px] uppercase mb-1 opacity-70">Override Power Level</span>
            <div className="flex items-center gap-3">
              <input 
                type="range" 
                min="1" 
                max="100" 
                value={playerLevel} 
                onChange={(e) => setPlayerLevel(parseInt(e.target.value))}
                disabled={isBattleActive && playerHp > 0}
                className="w-24 h-1 bg-black/30 appearance-none cursor-pointer accent-white"
              />
              <span className="font-mono text-sm font-bold w-6">{playerLevel}</span>
            </div>
          </div>

          <button 
            onClick={fetchRival}
            disabled={isAnimating}
            className="flex items-center gap-2 bg-black hover:bg-white hover:text-black border-2 border-white px-4 py-2 transition-all font-pixel text-[10px] uppercase shadow-[2px_2px_0px_0px_white]"
          >
            <RotateCcw size={14} /> New Match
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8 items-start">
        {/* Battle Stage */}
        <div className="retro-panel flex-1 bg-emerald-50 relative overflow-hidden flex flex-col justify-between p-8 h-[450px]">
          <AnimatePresence>
            {showSwitchMenu && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute inset-4 z-50 bg-white/95 border-4 border-black p-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col"
              >
                <div className="flex justify-between items-center mb-4 border-b-2 border-black pb-2">
                  <h3 className="font-pixel text-[10px] uppercase">Roster Selection</h3>
                  <button 
                    onClick={() => setShowSwitchMenu(false)} 
                    className="font-bold disabled:opacity-0"
                    disabled={playerHp <= 0}
                  >X</button>
                </div>
                <div className="grid grid-cols-2 gap-3 overflow-y-auto">
                   {playerTeam.map((p, i) => (
                     <button 
                      key={p.id}
                      onClick={() => {
                        handleSwitch(i);
                        setShowSwitchMenu(false);
                      }}
                      disabled={i === playerActiveIndex || isAnimating}
                      className={`flex items-center gap-2 border-2 border-black p-2 text-left hover:bg-gray-100 disabled:opacity-40 transition-all ${i === playerActiveIndex ? 'bg-emerald-100 border-4 animate-pulse' : ''}`}
                     >
                       <img src={p.sprite} className="w-8 h-8 pixelated" alt={p.name} />
                       <div className="overflow-hidden flex-1">
                          <p className="font-pixel text-[8px] uppercase truncate">{p.name}</p>
                          <div className="flex items-center gap-1">
                            <span className="font-mono text-[6px] opacity-70">HP</span>
                            <div className="flex-1 h-1 bg-black/10 border border-black/20">
                               <div 
                                className={`h-full ${playerTeamHps[i] <= 0 ? 'bg-red-500' : 'bg-emerald-400'}`} 
                                style={{ width: `${Math.max(0, (playerTeamHps[i] / playerTeamMaxHps[i]) * 100)}%` }} 
                               />
                            </div>
                          </div>
                          <p className="font-mono text-[7px] text-right">{Math.ceil(playerTeamHps[i])} HP</p>
                       </div>
                     </button>
                   ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {/* Opponent Info */}
          <div className="flex justify-start">
            <div className="bg-white border-4 border-black p-3 w-56 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex justify-between items-end mb-1">
                <span className="font-pixel text-[10px] uppercase">{currentRivalPokemon?.name}</span>
                <span className="font-pixel text-[8px] opacity-50">Lvl {currentRivalPokemon?.level || 50}</span>
              </div>
              <div className="h-4 bg-gray-200 border-2 border-black p-0.5 relative">
                <motion.div 
                  className="h-full bg-emerald-500" 
                  initial={{ width: "100%" }}
                  animate={{ width: `${(rivalHp / rivalMaxHp) * 100}%` }}
                />
              </div>
              <div className="flex gap-1 mt-2">
                 {[...Array(6)].map((_, i) => (
                    <div key={i} className={`w-2 h-2 rounded-full border border-black ${i < rivalActiveIndex ? "bg-gray-400" : i === rivalActiveIndex ? "bg-red-500 animate-pulse" : "bg-white"}`} />
                 ))}
              </div>
            </div>
          </div>

          {/* Opponent Sprite */}
          <div className="absolute top-16 right-12">
            <AnimatePresence mode="wait">
              {currentRivalPokemon && (
                <motion.img 
                  key={currentRivalPokemon.id}
                  initial={{ x: 300, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -300, opacity: 0 }}
                  src={currentRivalPokemon.sprite} 
                  className="w-32 h-32 pixelated scale-125"
                />
              )}
            </AnimatePresence>
          </div>

          {/* Player Sprite */}
          <div className="absolute bottom-24 left-12">
            {playerPokemon && (
              <motion.img 
                animate={isAnimating ? { x: [0, 20, 0] } : {}}
                src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/${playerPokemon.id}.png`} 
                className="w-48 h-48 pixelated scale-125"
              />
            )}
          </div>

          {/* Player Info */}
          <div className="flex justify-end mt-auto">
            <div className="bg-white border-4 border-black p-3 w-56 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex justify-between items-end mb-1">
                <span className="font-pixel text-[10px] uppercase">{playerPokemon?.name}</span>
                <span className="font-pixel text-[8px] opacity-50">Lvl {playerPokemon?.level || 50}</span>
              </div>
              <div className="h-4 bg-gray-200 border-2 border-black p-0.5 relative">
                <motion.div 
                  className="h-full bg-yellow-400" 
                  initial={{ width: "100%" }}
                  animate={{ width: `${(playerHp / playerMaxHp) * 100}%` }}
                />
              </div>
              <div className="text-right font-pixel text-[8px] mt-1">{Math.max(0, Math.ceil(playerHp))} / {playerMaxHp} HP</div>
            </div>
          </div>
        </div>

        {/* Command Menu */}
        <div className="space-y-4">
          <div className="retro-panel bg-white p-4 border-4 border-black h-full min-h-[300px] flex flex-col">
            <div className="font-mono text-[10px] font-bold uppercase border-b-2 border-black pb-2 mb-4 tracking-widest flex items-center gap-2">
              <Zap size={14} className="text-yellow-500" /> Executive Command
            </div>
            
            <div className="grid grid-cols-2 gap-4 flex-1">
               {playerPokemon?.moves ? playerPokemon.moves.map((moveName) => {
                 const move = MOVES[moveName] || { type: "Normal", power: 40 };
                 const typeColor = getTypeColor(move.type);
                 
                 return (
                   <button 
                    key={moveName}
                    onClick={() => handleMove(moveName)}
                    disabled={isAnimating || playerHp <= 0 || rivalHp <= 0}
                    className="group relative border-4 border-black p-4 flex flex-col items-center justify-center gap-2 hover:bg-opacity-80 transition-all active:translate-y-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 overflow-hidden"
                    style={{ backgroundColor: `${typeColor}22` }}
                   >
                     <div 
                        className="absolute top-0 right-0 w-8 h-8 opacity-10 -rotate-12 translate-x-2 -translate-y-2"
                        style={{ color: typeColor }}
                      >
                        <Sparkles size={32} />
                      </div>
                     <span className="font-pixel text-[10px] uppercase text-black z-10">{moveName}</span>
                     <div className="flex items-center gap-2 z-10">
                        <div className="px-1 py-0.5 border border-black text-[6px] font-pixel uppercase" style={{ backgroundColor: typeColor, color: "white" }}>
                          {move.type}
                        </div>
                        <span className="font-mono text-[8px] font-bold opacity-50">PWR:{move.power}</span>
                     </div>
                   </button>
                 );
               }) : (
                 <div className="col-span-2 flex items-center justify-center font-pixel text-[10px] opacity-30">
                    Loading Moveset...
                 </div>
               )}

               <button 
                onClick={() => setShowSwitchMenu(true)}
                disabled={isAnimating || playerHp <= 0 || rivalHp <= 0}
                className="group col-span-2 border-4 border-black p-4 flex items-center justify-center gap-3 bg-retro-dark text-white hover:bg-black transition-all active:translate-y-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50"
               >
                 <Shield size={16} />
                 <span className="font-pixel text-[12px] uppercase">Switch Unit</span>
               </button>
            </div>

            <div className="mt-4 bg-black p-3 text-emerald-400 font-mono text-[10px] border-2 border-black h-20 overflow-hidden">
               <p className="opacity-50"># SUB_PROCESS_ACTIVE</p>
               <p className="animate-pulse">Awaiting input from Trainer:001...</p>
            </div>
          </div>
        </div>
      </div>

      <DialogueBox messages={messages} />
    </div>
  );
};

