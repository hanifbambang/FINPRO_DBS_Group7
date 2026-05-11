import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { PokemonCard } from "../components/PokemonCard";

export const TrainerProfile: React.FC = () => {
  const { id } = useParams();
  const [trainer, setTrainer] = useState<any>(null);
  const [team, setTeam] = useState<any[]>([]);

  useEffect(() => {
    fetch(`/api/trainer/${id}`)
      .then(res => res.json())
      .then(data => {
        setTrainer(data);
        if (data && data.team) {
          Promise.all(data.team.map((pid: string) => fetch(`/api/pokemon/${pid}`).then(r => r.json())))
            .then(setTeam);
        } else {
          setTeam([]);
        }
      });
  }, [id]);

  if (!trainer) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      {/* Header Info */}
      <div className="grid md:grid-cols-3 gap-8 items-center bg-brutalist-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-32 h-32 border-4 border-black bg-white flex items-center justify-center relative group shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="w-20 h-20 bg-retro-med relative overflow-hidden">
                <div className="absolute top-2 left-4 w-4 h-4 bg-white" />
                <div className="absolute top-2 right-4 w-4 h-4 bg-white" />
                <div className="absolute bottom-4 left-4 right-4 h-2 bg-white" />
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:8px_8px]" />
            </div>
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tighter">{trainer.name}</h2>
        </div>

        <div className="md:col-span-2 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="border-4 border-black p-4 bg-emerald-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="font-mono text-[10px] font-bold uppercase mb-1">Wins</div>
              <div className="text-3xl font-black">{trainer.wins}</div>
            </div>
            <div className="border-4 border-black p-4 bg-red-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="font-mono text-[10px] font-bold uppercase mb-1">Losses</div>
              <div className="text-3xl font-black">{trainer.losses}</div>
            </div>
          </div>
          <div className="border-4 border-black p-4 bg-white flex items-center justify-between">
              <div>
                <div className="font-mono text-[10px] font-bold uppercase mb-1 opacity-50">Authorized Trainer ID</div>
                <div className="font-mono text-lg font-bold">TR-{id?.padStart(6, '0')}</div>
              </div>
              <div className="w-10 h-10 bg-retro-dark border-2 border-black rounded-full flex items-center justify-center text-white">
                  <span className="font-mono text-xs font-bold font-mono">C</span>
              </div>
          </div>
        </div>
      </div>

      {/* Active Team */}
      <div className="space-y-6">
        <div className="flex items-center gap-4">
            <h3 className="text-xl font-black uppercase tracking-tighter">Active Party Status</h3>
            <div className="h-1 flex-1 bg-black" />
            <span className="font-mono text-[12px] font-bold uppercase bg-black text-white px-2 py-1">{team.length} / 06</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {team.map(p => (
            <PokemonCard 
              key={p.id}
              id={p.id}
              name={p.name}
              types={p.types.split(",")}
              sprite={p.sprite}
              level={Math.floor(Math.random() * 20) + 40} // Simulating levels
            />
          ))}
          {/* Fill slots */}
          {[...Array(Math.max(0, 6 - team.length))].map((_, i) => (
            <div key={i} className="border-4 border-black border-dashed bg-black/5 flex flex-col items-center justify-center p-8 h-full min-h-[320px]">
                <div className="w-16 h-16 border-4 border-dashed border-black/10 rounded-full mb-6 flex items-center justify-center">
                   <div className="w-8 h-8 bg-black/5 rounded-full" />
                </div>
                <div className="text-center space-y-2">
                  <span className="font-mono text-[10px] font-bold text-black/40 uppercase block tracking-widest leading-tight">Unit Slot {team.length + i + 1}</span>
                  <span className="font-mono text-[12px] font-bold text-black/20 uppercase block italic">EMPTY_PARTITION</span>
                </div>
            </div>
          ))}
        </div>
      </div>

      <div className="dialogue-box">
          <div className="dialogue-label">System Diagnostic</div>
          <p className="font-mono text-[14px] font-bold uppercase leading-tight">
            Unit validation protocol complete. Party integrity: {((team.length / 6) * 100).toFixed(0)}%. 
            All stored biological entities are currently synchronized with the Redis cluster.
          </p>
      </div>
    </div>
  );
};
