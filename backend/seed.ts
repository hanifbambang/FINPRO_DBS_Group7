import { dbInsert, dbQueryMany, redis } from "./db.js";

export const seedData = async () => {
  console.log("Initializing Retro Archive Seeding...");

  const existing = await dbQueryMany("pokemon");
  if (existing.length > 0) {
    console.log("Database already seeded.");
    return;
  }

  const moves = [
    { id: "1", name: "Thunderbolt", type: "Electric", pwr: 90, acc: 100, effect: "A strong electric blast crashes down on the target." },
    { id: "2", name: "Quick Attack", type: "Normal", pwr: 40, acc: 100, effect: "An extremely fast attack that always strikes first." },
    { id: "3", name: "Razor Leaf", type: "Grass", pwr: 55, acc: 95, effect: "Sharp-edged leaves are launched to slash at the foe." },
    { id: "4", name: "Flamethrower", type: "Fire", pwr: 90, acc: 100, effect: "The target is scorched with an intense blast of fire." },
    { id: "5", name: "Hydro Pump", type: "Water", pwr: 110, acc: 80, effect: "The target is blasted by a huge volume of water." },
    { id: "6", name: "Psychic", type: "Psychic", pwr: 90, acc: 100, effect: "The foe is hit by a strong telekinetic force." },
    { id: "7", name: "Earthquake", type: "Ground", pwr: 100, acc: 100, effect: "A powerful earthquake that strikes all Pokemon." },
    { id: "8", name: "Slash", type: "Normal", pwr: 70, acc: 100, effect: "The target is slashed with claws or scythes." }
  ];

  for (const m of moves) {
    await dbInsert("moves", m);
  }

  try {
    console.log("Fetching National Pokedex (Gen 1) from PokeAPI...");
    const response = await fetch("https://pokeapi.co/api/v2/pokemon?limit=151");
    const { results } = await response.json();

    const CHUNK_SIZE = 20;
    for (let i = 0; i < results.length; i += CHUNK_SIZE) {
      const chunk = results.slice(i, i + CHUNK_SIZE);
      await Promise.all(chunk.map(async (p: any) => {
        const id = p.url.split("/").filter(Boolean).pop();

        const detRes = await fetch(p.url);
        const details = await detRes.json();

        let flavorText = "No description available.";
        try {
          const speciesRes = await fetch(details.species.url);
          const speciesData = await speciesRes.json();
          flavorText = speciesData.flavor_text_entries.find((entry: any) => entry.language.name === "en")?.flavor_text.replace(/\f/g, " ") || "No description available.";
        } catch (e) {
          // Ignoring flavor text fetch failure
        }

        const stats: any = {};
        details.stats.forEach((s: any) => {
          const name = s.stat.name === "special-attack" ? "spAtk" :
            s.stat.name === "special-defense" ? "spDef" : s.stat.name;
          stats[name] = s.base_stat;
        });

        const pData = {
          id,
          name: details.name.charAt(0).toUpperCase() + details.name.slice(1),
          hp: stats.hp.toString(),
          attack: stats.attack.toString(),
          defense: stats.defense.toString(),
          spAtk: (stats.spAtk || stats.special || 50).toString(),
          spDef: (stats.spDef || stats.special || 50).toString(),
          speed: stats.speed.toString(),
          types: details.types.map((t: any) => t.type.name.charAt(0).toUpperCase() + t.type.name.slice(1)).join(","),
          abilities: details.abilities.map((a: any) => a.ability.name).join(","),
          moves: details.moves.slice(0, 4).map((m: any) => m.move.name.split("-").map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")).join(","),
          description: flavorText,
          sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`
        };

        await dbInsert("pokemon", pData);
      }));
      console.log(`Seeded ${Math.min(i + CHUNK_SIZE, 151)} / 151 Pokemon...`);
    }

    console.log("Pokedex Seeding Complete.");
  } catch (error) {
    console.error("Failed to seed from PokeAPI, using robust fallback:", error);
    const fallbackPokemon = [
      { id: "25", name: "Pikachu", hp: "35", attack: "55", defense: "40", spAtk: "50", spDef: "50", speed: "90", types: "Electric", sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png", moves: "Thunderbolt,Quick Attack" },
      { id: "1", name: "Bulbasaur", hp: "45", attack: "49", defense: "49", spAtk: "65", spDef: "65", speed: "45", types: "Grass,Poison", sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png", moves: "Razor Leaf,Tackle" },
      { id: "4", name: "Charmander", hp: "39", attack: "52", defense: "43", spAtk: "60", spDef: "50", speed: "65", types: "Fire", sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/4.png", moves: "Flamethrower,Scratch" },
      { id: "7", name: "Squirtle", hp: "44", attack: "48", defense: "65", spAtk: "50", spDef: "64", speed: "43", types: "Water", sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/7.png", moves: "Hydro Pump,Tackle" },
      { id: "129", name: "Magikarp", hp: "20", attack: "10", defense: "55", spAtk: "15", spDef: "20", speed: "80", types: "Water", sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/129.png", moves: "Splash,Tackle" }
    ];

    for (const p of fallbackPokemon) {
      await dbInsert("pokemon", p);
    }
  }

  await dbInsert("trainers", {
    userId: "1",
    name: "Red",
    wins: "10",
    losses: "2",
    team: ["25"],
    coins: 500,
    inventory: { pokeballs: 20, greatballs: 10, ultraballs: 5, razzberries: 10, goldenrazz: 2 }
  });

  await redis.zadd("leaderboard", 83.3, "Red");
};
