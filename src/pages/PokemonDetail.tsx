import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { StatBar } from "../components/StatBar";
import { ChevronLeft } from "lucide-react";
import { getTypeColor, MOVES } from "../constants";

export const PokemonDetail: React.FC = () => {
  const { id } = useParams();
  const [pokemon, setPokemon] = useState<any>(null);
  const [level, setLevel] = useState(50);
  const [selectedMoves, setSelectedMoves] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/pokemon/${id}`)
      .then(res => res.json())
      .then(data => {
        setPokemon(data);
        if (data.moves) {
          setSelectedMoves(data.moves.split(","));
        }
      });
  }, [id]);

  const toggleMove = (moveName: string) => {
    if (selectedMoves.includes(moveName)) {
      setSelectedMoves(prev => prev.filter(m => m !== moveName));
    } else {
      if (selectedMoves.length < 4) {
        setSelectedMoves(prev => [...prev, moveName]);
      }
    }
  };

  const saveMoves = async () => {
    setIsSaving(true);
    try {
      await fetch(`/api/pokemon/${id}/moves`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moves: selectedMoves })
      });
      alert("Moveset serialized successfully!");
    } catch (e) {
      alert("Critical error: Moveset synchronization failed.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!pokemon) return null;

  const types = pokemon.types.split(",");
  const availableMoves = Object.values(MOVES).filter(m => 
    types.includes(m.type) || m.type === "Normal"
  );

  // Classic Stat Calculation
  const calcStat = (base: number, lvl: number, isHP = false) => {
    if (isHP) return Math.floor(((base * 2) * lvl) / 100) + lvl + 10;
    return Math.floor(((base * 2) * lvl) / 100) + 5;
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <Link to="/" className="inline-flex items-center gap-2 font-mono text-[12px] uppercase font-bold hover:text-white transition-colors">
        <ChevronLeft size={16} /> Back to Archive Index
      </Link>

      <div className="grid md:grid-cols-2 gap-8 items-start">
        {/* Visuals */}
        <div className="retro-panel p-8 space-y-6">
          <div className="aspect-square bg-white border-4 border-black flex items-center justify-center p-8 relative">
            <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#000_2px,transparent_2px)] [background-size:20px_20px]"></div>
            <img 
              src={pokemon.sprite} 
              alt={pokemon.name} 
              className="w-full h-full object-contain pixelated scale-125 relative z-10"
            />
          </div>
          <div className="flex justify-center gap-4">
            {pokemon.types.split(",").map((t: string) => (
              <span 
                key={t} 
                style={{ backgroundColor: getTypeColor(t) }}
                className="font-pixel text-[8px] px-3 py-1 border-2 border-black uppercase text-white font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                {t}
              </span>
            ))}
          </div>
          <div className="text-center border-t-4 border-black pt-4">
            <h2 className="text-4xl font-black uppercase tracking-tighter">{pokemon.name}</h2>
            <p className="font-mono text-[12px] text-black/50 mt-2 font-bold tracking-widest">FILE_ID: {pokemon.id.padStart(3, '0')}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="space-y-6">
          <div className="bg-brutalist-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)]">
            <div className="flex justify-between items-center border-b-2 border-black pb-4 mb-6">
              <h3 className="font-pixel text-[12px] uppercase">Level Up Stats</h3>
              <div className="flex items-center gap-4">
                <span className="font-mono text-xs font-bold">LV.</span>
                <input 
                  type="range" min="1" max="100" value={level} 
                  onChange={(e) => setLevel(parseInt(e.target.value))}
                  className="w-24 accent-black" 
                />
                <span className="font-pixel text-xs border-2 border-black px-2 bg-white">{level}</span>
              </div>
            </div>
            
            <div className="space-y-4">
              <StatBar label="HP" value={calcStat(parseInt(pokemon.hp), level, true)} color="bg-green-500" />
              <StatBar label="Attack" value={calcStat(parseInt(pokemon.attack), level)} color="bg-red-500" />
              <StatBar label="Defense" value={calcStat(parseInt(pokemon.defense), level)} color="bg-blue-500" />
              <StatBar label="Sp. Atk" value={calcStat(parseInt(pokemon.spAtk), level)} color="bg-purple-500" />
              <StatBar label="Sp. Def" value={calcStat(parseInt(pokemon.spDef), level)} color="bg-purple-600" />
              <StatBar label="Speed" value={calcStat(parseInt(pokemon.speed), level)} color="bg-yellow-500" />
            </div>

            <div className="mt-6 pt-4 border-t-2 border-black/10">
              <p className="font-mono text-[10px] uppercase font-bold opacity-50">Note: Calculated values exclude IVs and Nature effects.</p>
            </div>
          </div>

          <div className="pixel-border bg-white p-6">
            <div className="flex justify-between items-center border-b-2 border-retro-dark/10 pb-4 mb-4">
              <h3 className="font-pixel text-[14px] uppercase">Configure Moveset</h3>
              <button 
                onClick={saveMoves}
                disabled={isSaving || selectedMoves.length === 0}
                className="pixel-button scale-75 uppercase"
              >
                {isSaving ? "Syncing..." : "Save Config"}
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {selectedMoves.map(m => (
                  <div key={m} className="px-2 py-1 bg-black text-white font-pixel text-[8px] uppercase flex items-center gap-2">
                    {m}
                    <button onClick={() => toggleMove(m)} className="text-red-400 font-bold hover:text-red-300">X</button>
                  </div>
                ))}
                {selectedMoves.length === 0 && <span className="font-pixel text-[8px] opacity-30 uppercase italic">No moves prioritized...</span>}
              </div>

              <div className="grid grid-cols-2 gap-2 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
                {availableMoves.map(move => (
                  <button 
                    key={move.name}
                    onClick={() => toggleMove(move.name)}
                    className={`text-left p-2 border-2 border-black font-pixel text-[8px] uppercase transition-all ${
                      selectedMoves.includes(move.name) 
                        ? 'bg-black text-white' 
                        : 'bg-gray-50 hover:bg-gray-100 opacity-60'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span>{move.name}</span>
                      <span className="font-mono opacity-50">-{move.power}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Evolution / Extra info placeholder */}
      <div className="dialogue-box">
        <p className="font-pixel text-[12px] leading-relaxed">
          {pokemon.description}
        </p>
      </div>
    </div>
  );
};
