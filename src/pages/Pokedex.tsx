import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PokemonCard } from "../components/PokemonCard";
import { Search } from "lucide-react";
import { getTypeColor } from "../constants";

export const Pokedex: React.FC = () => {
  const [pokemon, setPokemon] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>("25");

  useEffect(() => {
    fetch("/api/pokemon")
      .then(res => res.json())
      .then(data => {
        const sorted = [...data].sort((a, b) => parseInt(a.id) - parseInt(b.id));
        setPokemon(sorted);
        setLoading(false);
      });
  }, []);

  const filtered = pokemon.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="font-pixel text-sm animate-pulse">BOOTING ARCHIVE...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row gap-6 h-[600px] overflow-hidden">
      {/* Side Profile Index */}
      <div className="md:w-1/3 flex flex-col gap-4">
        <div className="retro-panel flex-1">
          <div className="screen-panel">
            <div className="uppercase text-[10px] font-bold border-b-2 border-black pb-2 mb-4 flex justify-between">
              <span>Database Index</span>
              <span className="animate-pulse">ONLINE</span>
            </div>

            <div className="space-y-1 overflow-y-auto h-[400px] pr-2">
              {pokemon.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedId(p.id)}
                  className={`w-full p-2 flex justify-between items-center text-xs font-bold uppercase transition-colors border-b border-black/10 ${selectedId === p.id ? 'bg-black text-white' : 'hover:bg-black/5'
                    }`}
                >
                  <span className="flex items-center gap-2">
                    {selectedId === p.id && "▶"} {p.id.padStart(3, '0')} {p.name}
                  </span>
                  <span className="text-[8px] opacity-50"></span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-retro-med border-4 border-black p-4 text-white">
          <div className="text-[8px] uppercase opacity-50 mb-2">Redis Cluster Status</div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 bg-green-500 animate-pulse"></div>
            <div className="text-[10px] uppercase font-mono">Master Node: Active</div>
          </div>
          <Link
            to="/types"
            className="w-full pixel-border-light bg-black/30 hover:bg-black/50 p-2 text-[8px] uppercase font-bold tracking-widest text-center flex items-center justify-center gap-2"
          >
            <span>Type Index Reference</span>
            <span>»</span>
          </Link>
        </div>
      </div>

      {/* Main Preview Container */}
      <div className="md:w-2/3 flex flex-col gap-6">
        <div className="bg-brutalist-white border-4 border-black p-6 flex flex-col shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)] flex-1 overflow-y-auto">
          {pokemon.find(p => p.id === selectedId) && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="w-48 h-48 bg-white border-4 border-black flex items-center justify-center relative p-4 shrink-0">
                  <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]"></div>
                  <img src={pokemon.find(p => p.id === selectedId).sprite} className="w-full h-full object-contain pixelated relative z-10" />
                  <div className="absolute bottom-1 right-1 text-[8px] opacity-30 font-mono">SPRITE_ID: {selectedId}</div>
                </div>

                <div className="flex-1 flex flex-col justify-between">
                  <div className="border-b-4 border-black pb-2 mb-4">
                    <h2 className="text-4xl font-black uppercase tracking-tighter">{pokemon.find(p => p.id === selectedId).name}</h2>
                    <div className="flex gap-2 mt-2">
                      {pokemon.find(p => p.id === selectedId).types.split(",").map((type: string) => (
                        <span
                          key={type}
                          style={{ backgroundColor: getTypeColor(type) }}
                          className="border-2 border-black px-2 py-0.5 text-[10px] font-bold uppercase text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                        >
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>

                  <Link
                    to={`/pokemon/${selectedId}`}
                    className="pixel-button w-fit uppercase"
                  >
                    View Deep File
                  </Link>
                </div>
              </div>


              <div className="grid grid-cols-2 gap-4">
                {pokemon.find(p => p.id === selectedId).moves.split(",").map((move: string) => (
                  <div key={move} className="border-4 border-black bg-white p-3 flex flex-col gap-2 cursor-pointer hover:bg-yellow-50 transition-colors">
                    <div className="flex justify-between text-[10px] font-bold uppercase border-b-2 border-black pb-1">
                      <span>{move}</span>
                      <span className="text-blue-600"></span>
                    </div>
                    <div className="text-[10px] uppercase font-mono leading-none opacity-70">A standard Generation 1 technical move.</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="dialogue-box">
          <div className="dialogue-label">Archive System</div>
          <div className="text-[14px] uppercase font-mono leading-tight">
            Querying Redis cluster for entity #{selectedId?.padStart(3, '0')}...
            Data retrieved successfully. Ready for evaluation.
          </div>
        </div>
      </div>
    </div>
  );
};
