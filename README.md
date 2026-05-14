# Pokédex & Battle Arena

> A retro-styled web application built with React, Express, PostgreSQL, and Redis.

## 1. Project Description

This project is a web-based interactive Pokédex and Battle Arena application. It features a Safari Zone for catching Pokémon, an interactive battle arena with rank progression, and a real-time leaderboard.

**Motivation:** By combining PostgreSQL and Redis, we achieve efficient structured relational storage for data (such as Trainer Profiles and Pokémon Data) while maintaining ultra-fast, real-time read/write performance for high-throughput operations like matchmaking, caching, and our competitive global leaderboard.

---

## 2. Architecture & Data Flow

```text
[ React Frontend ] <--> [ Node/Express API ] <--> [ Redis Cache & Leaderboard ]
                                             <--> [ PostgreSQL Primary Store ]
```

**Data Flow:**

1. **Primary Database (PostgreSQL):** Used as a Relational Store to persistently hold structured data.
   - `trainers` Table: Stores player profiles, team compositions, current level, and inventory items.
   - `pokemon` Table: Stores the master dictionary of Pokémon base stats and movesets.
   - `moves` Table: Stores move definitions (power, accuracy, type, effect).
   - `users` Table: Stores authentication credentials.

2. **Secondary Database (Redis):** Used as a Key-Value store for transient, high-velocity data.
   - `Leaderboard`: Uses Redis Sorted Sets (`ZADD`, `ZREVRANGE`) to instantly query player global ranks.
   - `Sessions/Caching`: Caching API responses from PokeAPI to reduce external requests.

**Justification for DB Choice:**
- **PostgreSQL:** Highly suited for structured relational data like player profiles, party line-ups, and Pokémon attributes enforcing a rigid and robust relational table structure.
- **Redis:** Relational databases are inefficient at calculating real-time ranks for millions of users. Redis sorted sets handle global leaderboards in exponential `O(log(N))` time and serve cached images/metadata at sub-millisecond latencies.

---

## 3. Setup & How to Run

### Prerequisites
- [Docker](https://www.docker.com/) and Docker Compose
- [Node.js](https://nodejs.org/) (v18+)

### Step 1 — Configure Environment Variables
Copy `.env.example` to `.env` and fill in your values:
```bash
cp .env.example .env
```

Default values (works with the provided `docker-compose.yml`):
```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/pokedex
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_secret_key_here
```

### Step 2 — Launch the Databases
Run the following command to spin up PostgreSQL and Redis:
```bash
docker-compose up -d
```

### Step 3 — Install Dependencies
```bash
npm install
```

### Step 4 — Start the Development Server
```bash
npm run dev
```

The app will be accessible at `http://localhost:3000`.
The live API docs will be accessible at `http://localhost:3000/api/docs`.

> **Note:** On first startup, the server automatically creates all database tables and seeds the full Generation 1 Pokédex (151 Pokémon) from PokeAPI.

---

## 4. API Reference

Base URL: `http://localhost:3000`

Interactive docs are also available at: [`/api/docs`](http://localhost:3000/api/docs)

---

### Authentication

#### `POST /api/auth/register`
Register a new trainer account.

**Request Body:**
```json
{
  "username": "Ash",
  "password": "pikachu123"
}
```

**Response `200`:**
```json
{
  "token": "<JWT_TOKEN>",
  "user": {
    "id": "uuid-...",
    "username": "Ash"
  }
}
```

**Error Responses:**
| Status | Error |
|--------|-------|
| `400` | `Missing fields` |
| `400` | `User already exists` |

---

#### `POST /api/auth/login`
Login with existing credentials and receive a JWT token.

**Request Body:**
```json
{
  "username": "Ash",
  "password": "pikachu123"
}
```

**Response `200`:**
```json
{
  "token": "<JWT_TOKEN>",
  "user": {
    "id": "uuid-...",
    "username": "Ash"
  }
}
```

**Error Responses:**
| Status | Error |
|--------|-------|
| `401` | `Invalid credentials` |

---

### Pokémon

#### `GET /api/pokemon`
Get a list of all Pokémon in the database.

**Response `200`:** Array of Pokémon objects.
```json
[
  {
    "id": "25",
    "name": "Pikachu",
    "hp": "35",
    "attack": "55",
    "defense": "40",
    "spAtk": "50",
    "spDef": "50",
    "speed": "90",
    "types": "Electric",
    "abilities": "static,lightning-rod",
    "moves": "Thunderbolt,Quick Attack,Slam,Tail Whip",
    "description": "When several of these Pokémon gather...",
    "sprite": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png"
  }
]
```

---

#### `GET /api/pokemon/random`
Get a single random Pokémon.

**Response `200`:** A single Pokémon object (same schema as above).

**Error Responses:**
| Status | Error |
|--------|-------|
| `404` | `No pokemon found` |

---

#### `GET /api/pokemon/:id`
Get a specific Pokémon by its ID.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `string` | The Pokémon's National Pokédex number (e.g. `25` for Pikachu) |

**Response `200`:** A single Pokémon object.

**Error Responses:**
| Status | Error |
|--------|-------|
| `404` | `Pokemon not found` |

---

#### `POST /api/pokemon/:id/moves`
Update the moveset of a specific Pokémon.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `string` | The Pokémon's ID |

**Request Body:**
```json
{
  "moves": ["Thunderbolt", "Quick Attack", "Slam", "Iron Tail"]
}
```

**Response `200`:**
```json
{
  "success": true,
  "moves": "Thunderbolt,Quick Attack,Slam,Iron Tail"
}
```

**Error Responses:**
| Status | Error |
|--------|-------|
| `400` | `Invalid moveset.` (must be an array of max 4) |

---

### Moves

#### `GET /api/moves`
Get all available battle moves.

**Response `200`:**
```json
[
  {
    "id": "1",
    "name": "Thunderbolt",
    "type": "Electric",
    "pwr": 90,
    "acc": 100,
    "effect": "A strong electric blast crashes down on the target."
  }
]
```

---

### Trainers

#### `GET /api/trainer/:id`
Get a trainer's profile and team.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `string` | The trainer's user UUID |

**Response `200`:**
```json
{
  "userId": "uuid-...",
  "name": "Ash",
  "wins": "10",
  "losses": "2",
  "team": ["25", "1", "4"]
}
```

**Error Responses:**
| Status | Error |
|--------|-------|
| `404` | `Trainer not found` |

---

#### `POST /api/trainer/:id/win`
Record a battle win for a trainer and update their leaderboard score.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `string` | The trainer's user UUID |

**Response `200`:**
```json
{
  "success": true,
  "wins": 11,
  "winRate": 84.6
}
```

---

#### `POST /api/trainer/:id/loss`
Record a battle loss for a trainer and update their leaderboard score.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `string` | The trainer's user UUID |

**Response `200`:**
```json
{
  "success": true,
  "losses": 3,
  "winRate": 78.5
}
```

---

### Leaderboard

#### `GET /api/leaderboard`
Get the top 10 trainers ranked by win rate (powered by Redis Sorted Set).

**Response `200`:**
```json
[
  { "name": "Red", "winRate": "83.3" },
  { "name": "Ash", "winRate": "75.0" }
]
```

---

### Battle

#### `GET /api/rival`
Generate a random rival trainer with a team of up to 6 Pokémon at randomized levels.

**Response `200`:**
```json
{
  "name": "Blue",
  "team": [
    {
      "id": "6",
      "name": "Charizard",
      "hp": "78",
      "attack": "84",
      "level": 65
    }
  ]
}
```

---

#### `POST /api/catch`
Attempt to catch a wild Pokémon and add it to a trainer's team.

**Request Body:**
```json
{
  "trainerId": "uuid-...",
  "pokemonId": "25",
  "mood": "eating",
  "multiplier": 1.5,
  "level": 15
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `trainerId` | `string` | ✅ | The trainer's user UUID |
| `pokemonId` | `string` | ✅ | The Pokémon's ID to catch |
| `mood` | `string` | ❌ | `"angry"` (harder) or `"eating"` (easier) |
| `multiplier` | `number` | ❌ | Ball multiplier, default `1` |
| `level` | `number` | ❌ | Wild Pokémon level, default `20` |

**Response `200` (success):**
```json
{
  "success": true,
  "message": "POKEMON_ID 25 successfully serialized to active team."
}
```

**Error Responses:**
| Status | Code | Description |
|--------|------|-------------|
| `400` | `PARTY_FULL` | Trainer already has 6 Pokémon |
| `400` | `ALREADY_CAUGHT` | Pokémon already in team |
| `400` | `ESCAPED` | Catch attempt failed, Pokémon broke free |
| `400` | `FLED` | Pokémon ran away |
| `404` | — | Trainer not found |

---

## 5. Benchmarking

Our benchmarks validate the decision to separate the Leaderboard into Redis.

Run the benchmark script:
```bash
node benchmarks/benchmark.js
```

Results are output to `/benchmarks/results.json`, illustrating the performance disparity for ranking queries between PostgreSQL `ORDER BY` operations versus Redis `ZREVRANGE`.

---

## 6. Team Members

- Hanif Mulia Nugroho 2406369066 - Team Leader/Database
- Muhammad Arfassya Setyadi - 2406368914 - Frontend
- Derryl Liandryo Putra - 2406368920 - Backend
- Benintya Farrel Armaya - 2406450346 - FE/BE Integration
---