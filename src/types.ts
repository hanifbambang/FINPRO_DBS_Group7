export interface Pokemon {
  id: string;
  name: string;
  hp: number;
  attack: number;
  defense: number;
  spAtk: number;
  spDef: number;
  speed: number;
  types: string[];
  abilities: string[];
  moves: string[];
  sprite: string;
}

export interface Move {
  id: string;
  name: string;
  type: string;
  power: number;
  accuracy: number;
  effect: string;
}

export interface Trainer {
  id: string;
  name: string;
  wins: number;
  losses: number;
  team: string[];
}

export interface LeaderboardEntry {
  name: string;
  winRate: string;
}

export interface BattleResult {
  log: string[];
  winner: string;
}
