export const TYPES = [
  "Normal", "Fire", "Water", "Electric", "Grass", "Ice", 
  "Fighting", "Poison", "Ground", "Flying", "Psychic", "Bug", "Rock", "Ghost", "Dragon",
  "Dark", "Steel", "Fairy"
];

export const TYPE_CHART: Record<string, Record<string, number>> = {
  Normal: { Rock: 0.5, Ghost: 0 },
  Fire: { Fire: 0.5, Water: 0.5, Grass: 2, Ice: 2, Bug: 2, Rock: 0.5, Dragon: 0.5, Steel: 2 },
  Water: { Fire: 2, Water: 0.5, Grass: 0.5, Ground: 2, Rock: 2, Dragon: 0.5 },
  Electric: { Water: 2, Electric: 0.5, Grass: 0.5, Ground: 0, Flying: 2, Dragon: 0.5 },
  Grass: { Fire: 0.5, Water: 2, Grass: 0.5, Poison: 0.5, Ground: 2, Flying: 0.5, Bug: 0.5, Rock: 2, Dragon: 0.5, Steel: 0.5 },
  Ice: { Water: 0.5, Grass: 2, Ice: 0.5, Ground: 2, Flying: 2, Dragon: 2, Fire: 0.5, Steel: 0.5 },
  Fighting: { Normal: 2, Ice: 2, Poison: 0.5, Flying: 0.5, Psychic: 0.5, Bug: 0.5, Rock: 2, Ghost: 0, Dark: 2, Steel: 2, Fairy: 0.5 },
  Poison: { Grass: 2, Poison: 0.5, Ground: 0.5, Bug: 2, Rock: 0.5, Ghost: 0.5, Steel: 0, Fairy: 2 },
  Ground: { Fire: 2, Electric: 2, Grass: 0.5, Poison: 2, Flying: 0, Bug: 0.5, Rock: 2, Steel: 2 },
  Flying: { Electric: 0.5, Grass: 2, Fighting: 2, Bug: 2, Rock: 0.5, Steel: 0.5 },
  Psychic: { Fighting: 2, Poison: 2, Psychic: 0.5, Dark: 0, Steel: 0.5 },
  Bug: { Fire: 0.5, Grass: 2, Fighting: 0.5, Poison: 0.5, Flying: 0.5, Psychic: 2, Ghost: 0.5, Dark: 2, Steel: 0.5, Fairy: 0.5 },
  Rock: { Fire: 2, Ice: 2, Fighting: 0.5, Ground: 0.5, Flying: 2, Bug: 2, Steel: 0.5 },
  Ghost: { Normal: 0, Psychic: 2, Ghost: 2, Dark: 0.5 }, 
  Dragon: { Dragon: 2, Steel: 0.5, Fairy: 0 },
  Dark: { Fighting: 0.5, Psychic: 2, Ghost: 2, Dark: 0.5, Fairy: 0.5 },
  Steel: { Fire: 0.5, Water: 0.5, Electric: 0.5, Ice: 2, Rock: 2, Steel: 0.5, Fairy: 2 },
  Fairy: { Fire: 0.5, Fighting: 2, Poison: 0.5, Dragon: 2, Dark: 2, Steel: 0.5 }
};

export const MOVES: Record<string, { name: string; type: string; power: number }> = {
  // Normal
  "Body Slam": { name: "Body Slam", type: "Normal", power: 85 },
  "Slash": { name: "Slash", type: "Normal", power: 70 },
  "Hyper Beam": { name: "Hyper Beam", type: "Normal", power: 150 },
  "Quick Attack": { name: "Quick Attack", type: "Normal", power: 40 },
  // Fire
  "Flamethrower": { name: "Flamethrower", type: "Fire", power: 90 },
  "Fire Blast": { name: "Fire Blast", type: "Fire", power: 110 },
  "Ember": { name: "Ember", type: "Fire", power: 40 },
  "Fire Spin": { name: "Fire Spin", type: "Fire", power: 35 },
  "Fire Punch": { name: "Fire Punch", type: "Fire", power: 75 },
  "Tackle": { name: "Tackle", type: "Normal", power: 40 },
  "Scratch": { name: "Scratch", type: "Normal", power: 40 },
  "Pound": { name: "Pound", type: "Normal", power: 40 },
  "Bubble": { name: "Bubble", type: "Water", power: 40 },
  "Water Gun": { name: "Water Gun", type: "Water", power: 40 },
  "Thunder Punch": { name: "Thunder Punch", type: "Electric", power: 75 },
  "Ice Punch": { name: "Ice Punch", type: "Ice", power: 75 },
  "Rock Throw": { name: "Rock Throw", type: "Rock", power: 50 },
  "Confusion": { name: "Confusion", type: "Psychic", power: 50 },
  "Acid": { name: "Acid", type: "Poison", power: 40 },
  "Mega Drain": { name: "Mega Drain", type: "Grass", power: 40 },
  "Bite": { name: "Bite", type: "Normal", power: 60 },
  "Double Kick": { name: "Double Kick", type: "Fighting", power: 30 },
  "Headbutt": { name: "Headbutt", type: "Normal", power: 70 },
  "Take Down": { name: "Take Down", type: "Normal", power: 90 },
  "Shock Wave": { name: "Shock Wave", type: "Electric", power: 60 },
  // Water
  "Surf": { name: "Surf", type: "Water", power: 90 },
  "Hydro Pump": { name: "Hydro Pump", type: "Water", power: 110 },
  // Electric
  "Thunderbolt": { name: "Thunderbolt", type: "Electric", power: 90 },
  "Thunder": { name: "Thunder", type: "Electric", power: 110 },
  "Thunder Shock": { name: "Thunder Shock", type: "Electric", power: 40 },
  // Grass
  "Razor Leaf": { name: "Razor Leaf", type: "Grass", power: 55 },
  "Solar Beam": { name: "Solar Beam", type: "Grass", power: 120 },
  "Vine Whip": { name: "Vine Whip", type: "Grass", power: 45 },
  // Ice
  "Ice Beam": { name: "Ice Beam", type: "Ice", power: 90 },
  "Blizzard": { name: "Blizzard", type: "Ice", power: 110 },
  // Fighting
  "Submission": { name: "Submission", type: "Fighting", power: 80 },
  "Low Kick": { name: "Low Kick", type: "Fighting", power: 50 },
  // Poison
  "Sludge": { name: "Sludge", type: "Poison", power: 65 },
  "Poison Sting": { name: "Poison Sting", type: "Poison", power: 15 },
  // Ground
  "Earthquake": { name: "Earthquake", type: "Ground", power: 100 },
  "Dig": { name: "Dig", type: "Ground", power: 80 },
  // Flying
  "Drill Peck": { name: "Drill Peck", type: "Flying", power: 80 },
  "Sky Attack": { name: "Sky Attack", type: "Flying", power: 140 },
  // Psychic
  "Psychic": { name: "Psychic", type: "Psychic", power: 90 },
  "Psybeam": { name: "Psybeam", type: "Psychic", power: 65 },
  // Bug
  "Twineedle": { name: "Twineedle", type: "Bug", power: 25 },
  "Pin Missile": { name: "Pin Missile", type: "Bug", power: 25 },
  // Rock
  "Rock Slide": { name: "Rock Slide", type: "Rock", power: 75 },
  // Ghost
  "Night Shade": { name: "Night Shade", type: "Ghost", power: 60 },
  // Dragon
  "Dragon Rage": { name: "Dragon Rage", type: "Dragon", power: 40 },
};

export const getMovesForType = (types: string[]) => {
  const possibleMoves: string[] = [];
  const primaryType = types[0];

  // Logic to pick moves based on type
  Object.values(MOVES).forEach(move => {
    if (move.type === primaryType || move.type === "Normal") {
      possibleMoves.push(move.name);
    }
  });

  // Ensure we always have at least 4 moves by shuffling and slicing
  const shuffled = [...possibleMoves].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 4);
};

export const TYPE_COLORS: Record<string, string> = {
  normal: "#A8A878",
  fire: "#F08030",
  water: "#6890F0",
  electric: "#F8D030",
  grass: "#78C850",
  ice: "#98D8D8",
  fighting: "#C03028",
  poison: "#A040A0",
  ground: "#E0C068",
  flying: "#A890F0",
  psychic: "#F85888",
  bug: "#A8B820",
  rock: "#B8A038",
  ghost: "#705898",
  dragon: "#7038F8",
  dark: "#705848",
  steel: "#B8B8D0",
  fairy: "#EE99AC",
};

export const getTypeColor = (type: string) => {
  return TYPE_COLORS[type.toLowerCase()] || "#A8A878";
};
