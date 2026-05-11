import React from "react";
import { Link } from "react-router-dom";
import { Move } from "lucide-react";
import { getTypeColor } from "../constants";

interface PokemonCardProps {
  id: string;
  name: string;
  types: string[];
  sprite: string;
  level?: number;
}

export const PokemonCard: React.FC<PokemonCardProps> = ({ id, name, types, sprite, level }) => {
  return (
    <Link 
      to={`/pokemon/${id}`}
      className="group block bg-white pixel-border p-4 transition-transform hover:-translate-y-1"
    >
      <div className="aspect-square bg-gray-100 p-2 pixel-border-light overflow-hidden mb-4 relative">
        <img 
          src={sprite} 
          alt={name} 
          className="w-full h-full object-contain pixelated group-hover:scale-110 transition-transform"
        />
        <div className="absolute top-1 left-1 bg-retro-dark text-white text-[10px] px-1 font-pixel flex gap-2 items-center">
          <span>#{id.padStart(3, '0')}</span>
          {level && <span className="opacity-70 text-[8px]">L:{level}</span>}
        </div>
      </div>
      <h3 className="font-pixel text-[12px] truncate mb-2 uppercase tracking-tight">{name}</h3>
      <div className="flex gap-2">
        {types.map(type => (
          <span 
            key={type} 
            style={{ backgroundColor: getTypeColor(type) }}
            className="text-[8px] font-pixel border border-black px-1 py-0.5 text-white uppercase shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
          >
            {type}
          </span>
        ))}
      </div>
    </Link>
  );
};
