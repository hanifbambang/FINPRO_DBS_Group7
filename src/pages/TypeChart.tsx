import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronsUp, ChevronsDown, ShieldCheck, Zap } from "lucide-react";
import { getTypeColor, TYPES, TYPE_CHART } from "../constants";

export const TypeChart: React.FC = () => {
  const [selectedType, setSelectedType] = useState<string>("Fire");

  // Logic to find relationships
  const getStrengths = (type: string) => {
    const list: string[] = [];
    Object.entries(TYPE_CHART[type] || {}).forEach(([def, val]) => {
      if (val === 2) list.push(def);
    });
    return list;
  };

  const getWeaknesses = (type: string) => {
    const list: string[] = [];
    TYPES.forEach(atk => {
      if (TYPE_CHART[atk]?.[type] === 2) list.push(atk);
    });
    return list;
  };

  const getResistances = (type: string) => {
    const list: string[] = [];
    TYPES.forEach(atk => {
      const val = TYPE_CHART[atk]?.[type];
      if (val === 0.5 || val === 0) list.push(atk);
    });
    return list;
  };

  const strengths = getStrengths(selectedType);
  const weaknesses = getWeaknesses(selectedType);
  const resistances = getResistances(selectedType);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/" className="p-2 border-2 border-black bg-white hover:bg-black hover:text-white transition-colors">
          <ChevronLeft size={20} />
        </Link>
        <h2 className="text-3xl font-black uppercase tracking-tighter">Type Index System v1.0</h2>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Left: Type Selection Grid */}
        <div className="lg:col-span-7 bg-[#d9d9c3] border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center justify-between border-b-2 border-black/20 pb-4 mb-6">
            <h3 className="font-mono font-bold uppercase text-lg">Select Base Type</h3>
            <div className="w-24 h-4 bg-black/10 flex gap-1 p-1">
              {[...Array(8)].map((_, i) => <div key={i} className="flex-1 bg-black/20" />)}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {TYPES.map(type => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`relative group p-3 border-4 border-black transition-all ${
                  selectedType === type 
                  ? "bg-white -translate-y-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" 
                  : "bg-gray-100/50 hover:bg-white hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-none"
                }`}
              >
                 <div 
                    className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity" 
                    style={{ backgroundColor: getTypeColor(type) }}
                 />
                 <div className="flex items-center justify-center gap-2 relative z-10">
                    <div 
                      className="w-3 h-3 border-2 border-black" 
                      style={{ backgroundColor: getTypeColor(type) }}
                    />
                    <span className="font-mono font-black uppercase text-[12px] tracking-widest">
                      {type}
                    </span>
                 </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Analysis Panel */}
        <div className="lg:col-span-5 flex flex-col gap-6">
           <div className="bg-[#f2f2e6] border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] min-h-[500px]">
              <div className="flex items-start gap-6 mb-8 border-b-4 border-black pb-6">
                <div className="w-16 h-16 border-4 border-black bg-white flex items-center justify-center p-2">
                   <Zap size={32} style={{ color: getTypeColor(selectedType) }} />
                </div>
                <div>
                  <h4 className="text-5xl font-black uppercase tracking-tighter">{selectedType}</h4>
                  <p className="font-mono text-[10px] font-bold opacity-50 uppercase tracking-widest mt-1">SYS_ID: #0{TYPES.indexOf(selectedType) + 1}</p>
                </div>
              </div>

              <div className="space-y-8">
                {/* Strengths */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-emerald-600">
                    <ChevronsUp size={16} />
                    <span className="font-mono text-[10px] font-black uppercase tracking-widest border-b-2 border-emerald-600/20 flex-1">
                      Super Effective Against (2x)
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {strengths.length > 0 ? strengths.map(t => (
                      <span key={t} style={{ backgroundColor: getTypeColor(t) }} className="px-3 py-1 border-2 border-black font-mono text-[10px] font-bold text-white uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]">
                        {t}
                      </span>
                    )) : <span className="font-mono text-[10px] opacity-30 italic">NO DATA_AVAILABLE</span>}
                  </div>
                </div>

                {/* Weaknesses */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-red-600">
                    <ChevronsDown size={16} />
                    <span className="font-mono text-[10px] font-black uppercase tracking-widest border-b-2 border-red-600/20 flex-1">
                      Vulnerable To (2x)
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {weaknesses.length > 0 ? weaknesses.map(t => (
                      <span key={t} style={{ backgroundColor: getTypeColor(t) }} className="px-3 py-1 border-2 border-black font-mono text-[10px] font-bold text-white uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]">
                        {t}
                      </span>
                    )) : <span className="font-mono text-[10px] opacity-30 italic">NO DATA_AVAILABLE</span>}
                  </div>
                </div>

                {/* Resistances */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-blue-600">
                    <ShieldCheck size={16} />
                    <span className="font-mono text-[10px] font-black uppercase tracking-widest border-b-2 border-blue-600/20 flex-1">
                      Resists / Immune (0.5x - 0x)
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {resistances.length > 0 ? resistances.map(t => (
                      <span key={t} style={{ backgroundColor: getTypeColor(t) }} className="px-3 py-1 border-2 border-black font-mono text-[10px] font-bold text-white uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]">
                        {t}
                      </span>
                    )) : <span className="font-mono text-[10px] opacity-30 italic">NO DATA_AVAILABLE</span>}
                  </div>
                </div>
              </div>
           </div>

           <div className="bg-black p-4 border-4 border-black text-emerald-500 font-mono text-[10px] uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
              <div className="flex justify-between border-b border-emerald-500/20 pb-2 mb-2">
                <span>Kernel Status</span>
                <span className="animate-pulse">Active</span>
              </div>
              <p className="leading-tight">Selected biological signature cross-referenced. effectiveness parameters loaded into combat buffer.</p>
           </div>
        </div>
      </div>
    </div>
  );
};
