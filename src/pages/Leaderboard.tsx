import React, { useEffect, useState } from "react";
import { LeaderboardEntry } from "../types";
import { Trophy, Star, Medal } from "lucide-react";

export const Leaderboard: React.FC = () => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    fetch("/api/leaderboard")
      .then(res => res.json())
      .then(setEntries);
  }, []);

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <h2 className="font-pixel text-2xl uppercase tracking-tighter">Hall of Fame</h2>
        <p className="font-retro text-xl text-retro-med uppercase tracking-widest">Global Ranking Board</p>
      </div>

      <div className="pixel-border bg-white overflow-hidden">
        <table className="w-full">
            <thead className="bg-retro-dark text-white font-pixel text-[10px] uppercase">
                <tr>
                    <th className="p-4 text-left">Rank</th>
                    <th className="p-4 text-left">Trainer</th>
                    <th className="p-4 text-right">Win Rate</th>
                </tr>
            </thead>
            <tbody className="divide-y-4 divide-retro-dark/5">
                {entries.map((entry, i) => (
                    <tr key={entry.name} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4 font-pixel text-[12px]">
                            {i === 0 ? <Trophy className="text-yellow-400" size={20} /> : 
                             i === 1 ? <Medal className="text-gray-400" size={20} /> :
                             i === 2 ? <Medal className="text-amber-600" size={20} /> : i + 1}
                        </td>
                        <td className="p-4 font-pixel text-[14px] uppercase tracking-tight">{entry.name}</td>
                        <td className="p-4 font-pixel text-[14px] text-right text-retro-med">{entry.winRate}%</td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
            { icon: <Star className="text-poke-blue" />, label: "Master" },
            { icon: <Star className="text-poke-red" />, label: "Ace" },
            { icon: <Star className="text-poke-yellow" />, label: "Novice" }
        ].map((badge) => (
            <div key={badge.label} className="pixel-border bg-white p-4 flex flex-col items-center gap-2">
                {badge.icon}
                <span className="font-pixel text-[8px] uppercase">{badge.label}</span>
            </div>
        ))}
      </div>

      <div className="bg-white pixel-border p-6 border-dotted">
        <p className="font-pixel text-[10px] text-center opacity-50 uppercase">
          Compete in ranked battles to climb the ladder.
        </p>
      </div>
    </div>
  );
};
