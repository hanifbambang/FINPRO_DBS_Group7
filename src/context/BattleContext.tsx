import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

import { TYPE_CHART, MOVES, getMovesForType } from "../constants";
import { useAuth } from "./AuthContext";
import { useTrainer } from "./TrainerContext";
import { soundManager } from "../lib/sounds";

export interface Pokemon {
  id: string;
  name: string;
  level?: number;
  hp: string;
  attack: string;
  defense: string;
  spAtk: string;
  spDef: string;
  speed: string;
  types: string;
  sprite: string;
  moves?: string[];
}

export interface Rival {
  name: string;
  team: Pokemon[];
}

interface BattleContextType {
  playerPokemon: Pokemon | null;
  playerTeam: Pokemon[];
  playerActiveIndex: number;
  playerLevel: number;
  setPlayerLevel: (level: number) => void;
  rival: Rival | null;
  rivalActiveIndex: number;
  playerHp: number;
  rivalHp: number;
  playerMaxHp: number;
  rivalMaxHp: number;
  isBattleActive: boolean;
  messages: string[];
  isAnimating: boolean;
  fetchRival: () => Promise<void>;
  handleMove: (moveName: string) => Promise<void>;
  handleSwitch: (index: number) => Promise<void>;
  playerTeamHps: number[];
  playerTeamMaxHps: number[];
}

const BattleContext = createContext<BattleContextType | undefined>(undefined);

export const BattleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { addCoins } = useTrainer();
  const [playerTeam, setPlayerTeam] = useState<Pokemon[]>([]);
  const [playerActiveIndex, setPlayerActiveIndex] = useState(0);
  const [playerLevel, setPlayerLevel] = useState(50);
  const [playerPokemon, setPlayerPokemon] = useState<Pokemon | null>(null);
  const [rival, setRival] = useState<Rival | null>(null);
  const [rivalActiveIndex, setRivalActiveIndex] = useState(0);
  const [playerMaxHp, setPlayerMaxHp] = useState(100);
  const [rivalMaxHp, setRivalMaxHp] = useState(100);
  const [playerHp, setPlayerHp] = useState(100);
  const [rivalHp, setRivalHp] = useState(100);
  const [isBattleActive, setIsBattleActive] = useState(false);
  const [messages, setMessages] = useState<string[]>(["Challenge a rival trainer!"]);
  const [isAnimating, setIsAnimating] = useState(false);

  // Store HPs for each team member
  const [playerTeamHps, setPlayerTeamHps] = useState<number[]>([]);
  const [playerTeamMaxHps, setPlayerTeamMaxHps] = useState<number[]>([]);

  const calculateMaxHp = (base: number, level: number) => {
    return Math.floor(((base * 2) * level) / 100) + level + 10;
  };

  const calculateStat = (base: number, level: number) => {
    return Math.floor(((base * 2) * level) / 100) + 5;
  };

  const fetchRival = useCallback(async () => {
    if (!user) return;
    
    setIsBattleActive(false);
    setIsAnimating(false);
    setMessages(["Searching for worthy opponents..."]);
    try {
      const res = await fetch("/api/rival");
      const data = await res.json();
      
      if (!data.team || data.team.length === 0) {
        throw new Error("No rival team found");
      }

      const rivalWithMoves = data.team.map((p: any) => ({
        ...p,
        moves: p.moves ? p.moves.split(",") : getMovesForType(p.types.split(","))
      }));

      const firstRival = rivalWithMoves[0];
      const rMaxHp = calculateMaxHp(parseInt(firstRival.hp), firstRival.level || 50);

      setRival({ ...data, team: rivalWithMoves });
      setRivalActiveIndex(0);
      setRivalMaxHp(rMaxHp);
      setRivalHp(rMaxHp);
      
      // Fetch user party dynamically
      const tRes = await fetch(`/api/trainer/${user.id}`);
      const tData = await tRes.json();
      const userTeamIds = tData.team && tData.team.length > 0 ? tData.team : ["25"]; // Default to Pikachu if empty
      
      const teamData = await Promise.all(userTeamIds.map((id: string) => 
        fetch(`/api/pokemon/${id}`)
          .then(r => r.ok ? r.json() : null)
          .catch(() => null)
      ));
      
      const pTeam = teamData.filter(p => p !== null).map(p => ({
        ...p,
        level: playerLevel,
        moves: p.moves ? p.moves.split(",") : getMovesForType(p.types.split(","))
      }));

      if (pTeam.length === 0) {
        throw new Error("Could not load player team data");
      }

      const activeP = pTeam[0];
      const pMaxHp = calculateMaxHp(parseInt(activeP.hp), playerLevel);
      
      setPlayerTeam(pTeam);
      setPlayerActiveIndex(0);
      setPlayerPokemon(activeP);
      setPlayerMaxHp(pMaxHp);
      setPlayerHp(pMaxHp);
      const maxHps = pTeam.map(p => calculateMaxHp(parseInt(p.hp), playerLevel));
      setPlayerTeamMaxHps(maxHps);
      setPlayerTeamHps(maxHps);

      setMessages([`Rival Trainer ${data.name} wants to battle!`, `They sent out ${data.team[0].name}!`]);
      setIsBattleActive(true);
    } catch (e) {
      console.error("Battle initialization error:", e);
      setMessages(["Error: Communication with Matchmaking server failed. Check your network or try again."]);
    }
  }, [playerLevel, user]);

  const handleSwitch = async (index: number) => {
    if (!rival || isAnimating || index === playerActiveIndex || playerTeamHps[index] <= 0) return;

    setIsAnimating(true);
    soundManager.play("hit");
    const oldP = playerTeam[playerActiveIndex];
    const newP = playerTeam[index];
    const newMaxHp = calculateMaxHp(parseInt(newP.hp), playerLevel);
    const oldHp = playerHp;

    // Save current HP of the old Pokemon
    const updatedHps = [...playerTeamHps];
    updatedHps[playerActiveIndex] = playerHp;
    
    if (oldHp > 0) {
      setMessages([`Come back, ${oldP.name}!`, `Go, ${newP.name}!`]);
    } else {
      setMessages([`Go, ${newP.name}!`]);
    }
    
    await new Promise(resolve => setTimeout(resolve, 800));

    setPlayerActiveIndex(index);
    setPlayerPokemon(newP);
    setPlayerMaxHp(newMaxHp);
    setPlayerHp(updatedHps[index]);
    setPlayerTeamHps(updatedHps);

    // Opponent gets a turn ONLY if it wasn't a forced switch due to fainting
    if (oldHp > 0) {
      await rivalTurn(newP, updatedHps[index], updatedHps, index);
    } else {
      setIsAnimating(false);
    }
  };

  const rivalTurn = async (currentP: Pokemon, currentHp: number, teamHps: number[], pIdx: number) => {
    const rivalPokemon = rival!.team[rivalActiveIndex];
    const rMoves = rivalPokemon.moves || ["Body Slam"];
    const rMoveName = rMoves[Math.floor(Math.random() * rMoves.length)];
    const rMoveData = MOVES[rMoveName] || { name: rMoveName, type: "Normal", power: 45 };
    
    setMessages(prev => [...prev, `${rivalPokemon.name} used ${rMoveName.toUpperCase()}!`]);
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const rm = calculateMultiplier(rMoveData.type, currentP.types);
    const rStab = rivalPokemon.types.includes(rMoveData.type) ? 1.5 : 1;
    
    const rLevel = rivalPokemon.level || 50;
    // Calculate actual attack/defense
    const rAtk = calculateStat(parseInt(rivalPokemon.attack), rLevel);
    const pDef = calculateStat(parseInt(currentP.defense), playerLevel);
    
    const rBaseDamage = Math.floor(((2 * rLevel / 5 + 2) * rMoveData.power * (rAtk / pDef)) / 50) + 2;
    const rd = Math.floor(rBaseDamage * rm * rStab * (Math.random() * 0.15 + 0.85));
    
    if (rm > 1) setMessages(prev => [...prev, "It's super effective!"]);
    if (rm < 1 && rm > 0) setMessages(prev => [...prev, "It's not very effective..."]);
    if (rm === 0) setMessages(prev => [...prev, `It doesn't affect ${currentP.name}...`]);

    const newPlayerHp = Math.max(0, currentHp - rd);
    setPlayerHp(newPlayerHp);
    
    const nextHps = [...teamHps];
    nextHps[pIdx] = newPlayerHp;
    setPlayerTeamHps(nextHps);

    if (newPlayerHp <= 0) {
      soundManager.play("faint");
      setMessages(prev => [...prev, `${currentP.name} fainted!`]);
      const hasUsable = nextHps.some(h => h > 0);
      if (!hasUsable) {
        setMessages(prev => [...prev, "You have no more usable Pokémon!"]);
        setIsBattleActive(false);
        if (user && user.id) {
          fetch(`/api/trainer/${user.id}/loss`, { method: 'POST' }).catch(console.error);
        }
      } else {
        setMessages(prev => [...prev, "Choose another Pokémon to battle!"]);
      }
    }
    
    setIsAnimating(false);
  };

  const calculateMultiplier = (moveType: string, targetTypesStr: string) => {
    const targetTypes = targetTypesStr.split(",");
    let multiplier = 1;
    targetTypes.forEach(t => {
      const m = TYPE_CHART[t.trim()] ? TYPE_CHART[moveType]?.[t.trim()] ?? 1 : 1;
      multiplier *= m;
    });
    return multiplier;
  };

  const handleMove = async (moveName: string) => {
    if (!playerPokemon || !rival || isAnimating || playerHp <= 0 || rivalHp <= 0) return;

    setIsAnimating(true);
    soundManager.play("hit");
    const rivalPokemon = rival.team[rivalActiveIndex];
    const moveData = MOVES[moveName] || { name: moveName, type: "Normal", power: 40 };
    
    setMessages([`${playerPokemon.name} used ${moveName.toUpperCase()}!`]);
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const multiplier = calculateMultiplier(moveData.type, rivalPokemon.types);
    const stab = playerPokemon.types.includes(moveData.type) ? 1.5 : 1;
    
    const level = playerLevel;
    const atk = calculateStat(parseInt(playerPokemon.attack), level);
    const def = calculateStat(parseInt(rivalPokemon.defense), rivalPokemon.level || 50);
    
    const baseDamage = Math.floor(((2 * level / 5 + 2) * moveData.power * (atk / def)) / 50) + 2;
    const damageToRival = Math.floor(baseDamage * multiplier * stab * (Math.random() * 0.15 + 0.85));
    
    if (multiplier > 1) setMessages(prev => [...prev, "It's super effective!"]);
    if (multiplier < 1 && multiplier > 0) setMessages(prev => [...prev, "It's not very effective..."]);
    if (multiplier === 0) setMessages(prev => [...prev, `It doesn't affect ${rivalPokemon.name}...`]);

    const newRivalHp = Math.max(0, rivalHp - damageToRival);
    setRivalHp(newRivalHp);
    
    if (newRivalHp <= 0) {
      soundManager.play("faint");
      setMessages([`The enemy ${rivalPokemon.name} fainted!`]);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (rivalActiveIndex < 5) {
        const nextIdx = rivalActiveIndex + 1;
        const nextPokemon = rival.team[nextIdx];
        const nextMaxHp = calculateMaxHp(parseInt(nextPokemon.hp), nextPokemon.level || 50);
        
        setRivalActiveIndex(nextIdx);
        setRivalMaxHp(nextMaxHp);
        setRivalHp(nextMaxHp);
        setMessages([`${rival.name} sent out ${nextPokemon.name}!`]);
        setIsAnimating(false);
      } else {
        soundManager.play("victory");
        setMessages([`You defeated Rival ${rival.name}!`, "Victory achieved. RANK +25"]);
        setIsBattleActive(false);
        setIsAnimating(false);
        if (user && user.id) {
          fetch(`/api/trainer/${user.id}/win`, { method: 'POST' }).catch(console.error);
          // Award coins based on rival difficulty (average level)
          const avgLevel = rival.team.reduce((sum, p) => sum + (p.level || 50), 0) / rival.team.length;
          const earned = Math.floor(avgLevel * 10 + Math.random() * 50);
          fetch(`/api/trainer/${user.id}/earn`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: earned })
          }).then(r => r.json()).then(data => {
            if (data.success) {
              addCoins(earned);
              setMessages(prev => [...prev, `You earned ${earned} coins! 💰`]);
            }
          }).catch(console.error);
        }
      }
      return;
    }

    // Rival Turn
    await rivalTurn(playerPokemon, playerHp, playerTeamHps, playerActiveIndex);
  };

  return (
    <BattleContext.Provider value={{
      playerPokemon, playerTeam, playerActiveIndex, playerLevel, setPlayerLevel,
      rival, rivalActiveIndex, playerHp, rivalHp,
      playerMaxHp, rivalMaxHp,
      isBattleActive, messages, isAnimating, fetchRival, handleMove, handleSwitch,
      playerTeamHps, playerTeamMaxHps
    }}>
      {children}
    </BattleContext.Provider>
  );
};

export const useBattle = () => {
  const context = useContext(BattleContext);
  if (!context) throw new Error("useBattle must be used within a BattleProvider");
  return context;
};
