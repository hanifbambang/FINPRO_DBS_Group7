import React from "react";

interface StatBarProps {
  label: string;
  value: number;
  max?: number;
  color?: string;
}

export const StatBar: React.FC<StatBarProps> = ({ label, value, max = 255, color = "bg-green-500" }) => {
  const percentage = Math.min((value / max) * 100, 100);
  const segments = Math.floor(percentage / 10);

  return (
    <div className="flex items-center gap-4">
      <span className="w-24 text-[10px] font-bold uppercase font-mono">{label}</span>
      <div className="flex-1 flex gap-1">
        {[...Array(10)].map((_, i) => (
          <div 
            key={i} 
            className={`stat-box ${i < segments ? color : 'bg-gray-300'}`}
          />
        ))}
      </div>
      <span className="text-xs font-bold font-mono">{value}</span>
    </div>
  );
};
