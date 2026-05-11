import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import dotenv from "dotenv";
import Redis from "ioredis";
import pg from "pg";
const { Pool } = pg;
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // --- Postgres Setup ---
  let pool: pg.Pool;
  let useMockDb = false;

  try {
    const DATABASE_URL = process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/pokedex";
    pool = new Pool({ connectionString: DATABASE_URL, connectionTimeoutMillis: 2000 });
    
    // Test connection
    const client = await pool.connect();
    client.release();
    console.log("Connected to PostgreSQL.");

    // Init up tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pokemon (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255),
        hp VARCHAR(255),
        attack VARCHAR(255),
        defense VARCHAR(255),
        "spAtk" VARCHAR(255),
        "spDef" VARCHAR(255),
        speed VARCHAR(255),
        types VARCHAR(255),
        abilities VARCHAR(255),
        moves VARCHAR(255),
        description TEXT,
        sprite VARCHAR(255)
      );
      CREATE TABLE IF NOT EXISTS moves (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255),
        type VARCHAR(255),
        pwr INTEGER,
        acc INTEGER,
        effect TEXT
      );
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        username VARCHAR(255) UNIQUE,
        password VARCHAR(255)
      );
      CREATE TABLE IF NOT EXISTS trainers (
        "userId" VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255),
        wins VARCHAR(255),
        losses VARCHAR(255),
        team JSONB
      );
    `);
  } catch (error) {
    console.warn("PostgreSQL connection failed. Using in-memory fallback for Dev Preview.");
    useMockDb = true;
  }

  // Mock DB Setup
  const mockDb: any = {
    pokemon: [],
    moves: [],
    users: [],
    trainers: []
  };

  // Helper macro for DB queries
  async function dbQueryOne(table: string, conditions: any) {
    if (useMockDb) {
      return mockDb[table].find((row: any) => Object.keys(conditions).every(k => row[k] === conditions[k]));
    } else {
      const keys = Object.keys(conditions);
      const values = keys.map(k => conditions[k]);
      const whereClause = keys.map((k, i) => `"${k}" = $${i + 1}`).join(' AND ');
      const res = await pool.query(`SELECT * FROM ${table} WHERE ${whereClause} LIMIT 1`, values);
      return res.rows[0];
    }
  }

  async function dbQueryMany(table: string, conditions: any = {}) {
    if (useMockDb) {
      if (Object.keys(conditions).length === 0) return [...mockDb[table]];
      return mockDb[table].filter((row: any) => Object.keys(conditions).every(k => row[k] === conditions[k]));
    } else {
      if (Object.keys(conditions).length === 0) {
        const res = await pool.query(`SELECT * FROM ${table}`);
        return res.rows;
      }
      const keys = Object.keys(conditions);
      const values = keys.map(k => conditions[k]);
      const whereClause = keys.map((k, i) => `"${k}" = $${i + 1}`).join(' AND ');
      const res = await pool.query(`SELECT * FROM ${table} WHERE ${whereClause}`, values);
      return res.rows;
    }
  }

  async function dbInsert(table: string, data: any) {
    if (useMockDb) {
      mockDb[table].push(data);
    } else {
      const keys = Object.keys(data);
      const values = keys.map(k => {
        if (typeof data[k] === 'object' && data[k] !== null) return JSON.stringify(data[k]);
        return data[k];
      });
      const columns = keys.map(k => `"${k}"`).join(', ');
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
      await pool.query(`INSERT INTO ${table} (${columns}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`, values);
    }
  }

  async function dbUpdate(table: string, conditions: any, updateData: any) {
    if (useMockDb) {
      const item = mockDb[table].find((row: any) => Object.keys(conditions).every(k => row[k] === conditions[k]));
      if (item) Object.assign(item, updateData);
    } else {
      const conditionKeys = Object.keys(conditions);
      const updateKeys = Object.keys(updateData);
      
      const values = [...updateKeys.map(k => {
        if (typeof updateData[k] === 'object' && updateData[k] !== null) return JSON.stringify(updateData[k]);
        return updateData[k];
      }), ...conditionKeys.map(k => conditions[k])];
      
      const setClause = updateKeys.map((k, i) => `"${k}" = $${i + 1}`).join(', ');
      const whereClause = conditionKeys.map((k, i) => `"${k}" = $${i + 1 + updateKeys.length}`).join(' AND ');
      
      await pool.query(`UPDATE ${table} SET ${setClause} WHERE ${whereClause}`, values);
    }
  }

  // --- Redis Setup ---
  let redis: any;
  if (process.env.REDIS_URL) {
    console.log("Connecting to Redis...");
    const redisOptions: any = { maxRetriesPerRequest: 1 };
    if (process.env.REDIS_PASSWORD) {
      redisOptions.password = process.env.REDIS_PASSWORD;
    }
    redis = new Redis(process.env.REDIS_URL, redisOptions);
    redis.on('error', (err: any) => console.warn('Redis error', err.message));
    
    try {
      await redis.ping();
      console.log("Connected to Redis.");
    } catch (error: any) {
      console.warn("Redis connection/auth failed:", error.message, "- Falling back to Mock Redis");
      redis.disconnect();
      redis = null;
    }
  }

  if (!redis) {
    if (!process.env.REDIS_URL) console.log("No REDIS_URL found. Using in-memory mock Redis.");
    redis = {
      data: new Map(),
      hset: async (key: string, field: string, value: string) => {
        if (!redis.data.has(key)) redis.data.set(key, {});
        redis.data.get(key)[field] = value;
      },
      hget: async (key: string, field: string) => {
        const val = redis.data.get(key);
        return val ? val[field] : null;
      },
      hgetall: async (key: string) => redis.data.get(key) || {},
      set: async (key: string, value: string) => redis.data.set(key, value),
      get: async (key: string) => redis.data.get(key) || null,
      exists: async (key: string) => redis.data.has(key) ? 1 : 0,
      zadd: async (set: string, score: number, member: string) => {
        if (!redis.data.has(set)) redis.data.set(set, []);
        const items = redis.data.get(set);
        const existingIdx = items.findIndex((i: any) => i.member === member);
        if (existingIdx !== -1) items[existingIdx].score = score;
        else items.push({ score, member });
        items.sort((a: any, b: any) => b.score - a.score);
      },
      zrevrange: async (set: string, start: number, end: number, withScores?: string) => {
        const items = redis.data.get(set) || [];
        const result = items.slice(start, end + 1);
        if (withScores) return result.flatMap((i: any) => [i.member, i.score.toString()]);
        return result.map((i: any) => i.member);
      }
    };
  }

  // --- Seed Data (Initial Pokemon & Moves) ---
  const seedData = async () => {
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
      team: ["25"]
    });
    
    await redis.zadd("leaderboard", 83.3, "Red");
  };

  await seedData();

  // --- API Routes ---

  app.post("/api/auth/register", async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: "Missing fields" });

    const exists = await dbQueryOne("users", { username });
    if (exists) return res.status(400).json({ error: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = crypto.randomUUID();

    await dbInsert("users", { id: userId, username, password: hashedPassword });

    const pokemonList = await dbQueryMany("pokemon");
    const starterId = pokemonList.length > 0 ? pokemonList[Math.floor(Math.random() * pokemonList.length)].id : "25";

    await dbInsert("trainers", { 
      userId, 
      name: username, 
      wins: "0", 
      losses: "0", 
      team: [starterId]
    });

    await redis.zadd("leaderboard", 0, username);

    const token = jwt.sign({ userId, username }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user: { id: userId, username } });
  });

  app.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body;
    const userData = await dbQueryOne("users", { username });
    
    if (!userData || !userData.password) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isValid = await bcrypt.compare(password, userData.password);
    if (!isValid) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign({ userId: userData.id, username: userData.username }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user: { id: userData.id, username: userData.username } });
  });

  app.get("/api/pokemon", async (req, res) => {
    const pokemon = await dbQueryMany("pokemon");
    res.json(pokemon);
  });

  app.get("/api/pokemon/random", async (req, res) => {
    const pokemon = await dbQueryMany("pokemon");
    if (pokemon.length === 0) return res.status(404).json({ error: "No pokemon found" });
    const randomId = pokemon[Math.floor(Math.random() * pokemon.length)].id;
    const p = await dbQueryOne("pokemon", { id: randomId });
    res.json(p);
  });

  app.get("/api/pokemon/:id", async (req, res) => {
    const p = await dbQueryOne("pokemon", { id: req.params.id });
    if (!p) return res.status(404).json({ error: "Pokemon not found" });
    res.json(p);
  });

  app.get("/api/moves", async (req, res) => {
    const moves = await dbQueryMany("moves");
    res.json(moves);
  });

  app.get("/api/trainer/:id", async (req, res) => {
    const t = await dbQueryOne("trainers", { userId: req.params.id });
    if (!t) return res.status(404).json({ error: "Trainer not found" });
    
    if (typeof t.team === 'string') {
        try {
            t.team = JSON.parse(t.team);
        } catch(e) {}
    }

    res.json(t);
  });

  app.get("/api/leaderboard", async (req, res) => {
    const raw = await redis.zrevrange("leaderboard", 0, 10, "WITHSCORES");
    const result = [];
    for (let i = 0; i < raw.length; i += 2) {
      result.push({ name: raw[i], winRate: raw[i+1] });
    }
    res.json(result);
  });

  app.post("/api/catch", async (req, res) => {
    const { trainerId, pokemonId, mood, multiplier = 1 } = req.body;
    
    const trainer = await dbQueryOne("trainers", { userId: trainerId });
    if (!trainer) return res.status(404).json({ error: "Trainer not found" });
    
    let teamIds = trainer.team || [];
    if (typeof teamIds === 'string') {
        try { teamIds = JSON.parse(teamIds); } catch(e) { teamIds = []; }
    }

    if (teamIds.length >= 6) {
      return res.status(400).json({ 
        code: "PARTY_FULL",
        error: "COMMUNICATION ERROR: Trainer party at max capacity (6/6)." 
      });
    }

    if (teamIds.includes(pokemonId)) {
      return res.status(400).json({ 
        code: "ALREADY_CAUGHT",
        error: "LOGICAL ERROR: Biological signal already detected in active team." 
      });
    }

    const level = req.body.level || 20;
    const levelPenalty = (100 - level) / 100; 
    let successRate = 0.5 * multiplier * (levelPenalty + 0.1); 
    
    if (mood === "angry") successRate *= 0.5;
    if (mood === "eating") successRate *= 1.2;

    const catchRoll = Math.random();
    if (catchRoll > successRate) {
      const fleeRate = 0.15;
      const fled = Math.random() < fleeRate;

      return res.status(400).json({ 
        success: false, 
        code: fled ? "FLED" : "ESCAPED",
        fled: fled,
        error: fled 
          ? "The Pokémon fled the encounter!" 
          : (mood === "eating" ? "The Pokémon was too distracted by eating and missed the ball!" : "The wild creature broke free!")
      });
    }

    teamIds.push(pokemonId);
    await dbUpdate("trainers", { userId: trainerId }, { team: teamIds });
    
    res.json({ success: true, message: `POKEMON_ID ${pokemonId} successfully serialized to active team.` });
  });

  app.post("/api/pokemon/:id/moves", async (req, res) => {
    const { moves } = req.body;
    if (!Array.isArray(moves) || moves.length > 4) {
      return res.status(400).json({ error: "Invalid moveset." });
    }
    await dbUpdate("pokemon", { id: req.params.id }, { moves: moves.join(",") });
    res.json({ success: true, moves: moves.join(",") });
  });

  app.get("/api/rival", async (req, res) => {
    const pokemonList = await dbQueryMany("pokemon");
    const ids = pokemonList.map((p: any) => p.id);
    
    const rivalTeam = [];
    const shuffled = [...ids].sort(() => 0.5 - Math.random());
    const teamIds = shuffled.slice(0, 6);

    for (const id of teamIds) {
      const p = await dbQueryOne("pokemon", { id });
      const isRare = Math.random() < 0.2;
      const level = isRare 
        ? Math.floor(Math.random() * 20) + 81 
        : Math.floor(Math.random() * 80) + 1;

      rivalTeam.push({
        ...p,
        level
      });
    }

    res.json({
      name: ["Blue", "Silver", "Wally", "Gladion", "Hau"][Math.floor(Math.random() * 5)],
      team: rivalTeam
    });
  });

  app.post("/api/trainer/:id/win", async (req, res) => {
    const trainer = await dbQueryOne("trainers", { userId: req.params.id });
    if (!trainer) return res.status(404).json({ error: "Trainer not found" });

    const newWins = (parseInt(trainer.wins) || 0) + 1;
    await dbUpdate("trainers", { userId: req.params.id }, { wins: newWins.toString() });

    const losses = parseInt(trainer.losses) || 0;
    const total = newWins + losses;
    const winRate = total > 0 ? (newWins / total) * 100 : 0;
    
    await redis.zadd("leaderboard", winRate, trainer.name);

    res.json({ success: true, wins: newWins, winRate });
  });

  app.post("/api/trainer/:id/loss", async (req, res) => {
    const trainer = await dbQueryOne("trainers", { userId: req.params.id });
    if (!trainer) return res.status(404).json({ error: "Trainer not found" });

    const newLosses = (parseInt(trainer.losses) || 0) + 1;
    await dbUpdate("trainers", { userId: req.params.id }, { losses: newLosses.toString() });

    const wins = parseInt(trainer.wins) || 0;
    const total = wins + newLosses;
    const winRate = total > 0 ? (wins / total) * 100 : 0;
    
    await redis.zadd("leaderboard", winRate, trainer.name);

    res.json({ success: true, losses: newLosses, winRate });
  });

  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
