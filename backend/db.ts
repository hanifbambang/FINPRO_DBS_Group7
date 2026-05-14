import pg from "pg";
const { Pool } = pg;
import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

let pool: pg.Pool;
let useMockDb = false;

// Postgres Initialization
export const initPostgres = async () => {
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
        team JSONB,
        inventory JSONB,
        coins INTEGER DEFAULT 500
      );
      ALTER TABLE trainers ADD COLUMN IF NOT EXISTS inventory JSONB;
      ALTER TABLE trainers ADD COLUMN IF NOT EXISTS coins INTEGER DEFAULT 500;
    `);
  } catch (error) {
    console.warn("PostgreSQL connection failed. Using in-memory fallback for Dev Preview.");
    useMockDb = true;
  }
};

// Default inventory for new / existing trainers
export const DEFAULT_INVENTORY = {
  pokeballs: 20,
  greatballs: 10,
  ultraballs: 5,
  razzberries: 10,
  goldenrazz: 2,
  masterballs: 0
};

// Mock DB Setup
const mockDb: any = {
  pokemon: [],
  moves: [],
  users: [],
  trainers: []
};

export async function dbQueryOne(table: string, conditions: any) {
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

export async function dbQueryMany(table: string, conditions: any = {}) {
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

export async function dbInsert(table: string, data: any) {
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

export async function dbUpdate(table: string, conditions: any, updateData: any) {
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
export let redis: any;

export const initRedis = async () => {
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
};
