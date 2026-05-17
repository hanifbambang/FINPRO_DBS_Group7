export const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "Pokédex API",
    version: "2.0.0",
    description: "Interactive API Reference for the Pokédex & Battle Arena. You can test endpoints here directly."
  },
  servers: [{ url: "http://localhost:3000" }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT"
      }
    }
  },
  paths: {
    "/api/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register a new trainer",
        description: "Creates a new user account and an associated trainer profile with default inventory and 500 starting coins.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  username: { type: "string", example: "Ash" },
                  password: { type: "string", example: "pikachu123" }
                },
                required: ["username", "password"]
              }
            }
          }
        },
        responses: {
          "200": { description: "Successful registration — returns JWT token and user object" },
          "400": { description: "Missing fields or username already exists" }
        }
      }
    },
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login and get JWT token",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  username: { type: "string", example: "Ash" },
                  password: { type: "string", example: "pikachu123" }
                },
                required: ["username", "password"]
              }
            }
          }
        },
        responses: {
          "200": { description: "Login successful — returns JWT token and user object" },
          "401": { description: "Invalid credentials" }
        }
      }
    },
    "/api/pokemon": {
      get: {
        tags: ["Pokémon"],
        summary: "Get all Pokémon",
        description: "Returns the full list of seeded Gen 1 Pokémon with stats and sprites.",
        responses: { "200": { description: "Array of all Pokémon" } }
      }
    },
    "/api/pokemon/random": {
      get: {
        tags: ["Pokémon"],
        summary: "Get a random wild Pokémon for Safari encounters",
        description: "Returns a random Pokémon. If trainerId is provided, already-caught Pokémon are filtered out.",
        parameters: [{
          name: "trainerId",
          in: "query",
          required: false,
          schema: { type: "string" },
          description: "Trainer's User UUID — filters out Pokémon already in the trainer's team"
        }],
        responses: {
          "200": { description: "A random Pokémon object" },
          "404": { description: "No Pokémon found in the database" }
        }
      }
    },
    "/api/pokemon/{id}": {
      get: {
        tags: ["Pokémon"],
        summary: "Get a specific Pokémon by ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" }, example: "25" }],
        responses: {
          "200": { description: "Pokémon data" },
          "404": { description: "Not found" }
        }
      }
    },
    "/api/pokemon/{id}/moves": {
      post: {
        tags: ["Pokémon"],
        summary: "Update the moveset of a specific Pokémon",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" }, example: "25" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: { moves: { type: "array", items: { type: "string" }, example: ["Thunderbolt", "Quick Attack", "Slam", "Iron Tail"] } }
              }
            }
          }
        },
        responses: {
          "200": { description: "Moveset updated" },
          "400": { description: "Invalid moveset (max 4)" }
        }
      }
    },
    "/api/moves": {
      get: {
        tags: ["Moves"],
        summary: "Get all battle moves",
        description: "Returns the full list of available battle moves with type, power, and accuracy.",
        responses: { "200": { description: "List of all moves" } }
      }
    },
    "/api/trainer/{id}": {
      get: {
        tags: ["Trainer"],
        summary: "Get a trainer's profile, team, inventory, and coins",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" }, description: "Trainer's User UUID" }],
        responses: {
          "200": { description: "Trainer profile with team, inventory, coins, wins, and losses" },
          "404": { description: "Trainer not found" }
        }
      }
    },
    "/api/trainer/{id}/inventory": {
      post: {
        tags: ["Trainer"],
        summary: "Save the trainer's full inventory",
        description: "Called after each Safari throw or berry use to persist inventory changes.",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  inventory: {
                    type: "object",
                    properties: {
                      pokeballs: { type: "number", example: 18 },
                      greatballs: { type: "number", example: 9 },
                      ultraballs: { type: "number", example: 5 },
                      razzberries: { type: "number", example: 8 },
                      goldenrazz: { type: "number", example: 2 },
                      masterballs: { type: "number", example: 0 }
                    }
                  }
                },
                required: ["inventory"]
              }
            }
          }
        },
        responses: {
          "200": { description: "Inventory saved" },
          "400": { description: "No inventory provided" },
          "404": { description: "Trainer not found" }
        }
      }
    },
    "/api/trainer/{id}/buy": {
      post: {
        tags: ["Trainer"],
        summary: "Purchase an item from the PokéMart store",
        description: "Deducts coins and adds the purchased item to the trainer's inventory.",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  item: { type: "string", enum: ["pokeball", "greatball", "ultraball", "razzberry", "goldenrazz", "masterball"], example: "ultraball" },
                  qty: { type: "number", example: 3, default: 1 }
                },
                required: ["item"]
              }
            }
          }
        },
        responses: {
          "200": { description: "Purchase successful — returns updated coins and inventory" },
          "400": { description: "Unknown item or insufficient funds (code: INSUFFICIENT_FUNDS)" },
          "404": { description: "Trainer not found" }
        }
      }
    },
    "/api/trainer/{id}/earn": {
      post: {
        tags: ["Trainer"],
        summary: "Award coins to a trainer (after battle wins)",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  amount: { type: "number", example: 250 }
                },
                required: ["amount"]
              }
            }
          }
        },
        responses: {
          "200": { description: "Coins awarded — returns new total and earned amount" },
          "400": { description: "Invalid amount" },
          "404": { description: "Trainer not found" }
        }
      }
    },
    "/api/trainer/{id}/win": {
      post: {
        tags: ["Trainer"],
        summary: "Record a battle win for a trainer",
        description: "Increments the trainer's win count and updates the Redis leaderboard with new win rate.",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Win recorded — returns new win count and win rate" },
          "404": { description: "Trainer not found" }
        }
      }
    },
    "/api/trainer/{id}/loss": {
      post: {
        tags: ["Trainer"],
        summary: "Record a battle loss for a trainer",
        description: "Increments the trainer's loss count and updates the Redis leaderboard with new win rate.",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Loss recorded — returns new loss count and win rate" },
          "404": { description: "Trainer not found" }
        }
      }
    },
    "/api/leaderboard": {
      get: {
        tags: ["Battle"],
        summary: "Get the top 10 trainers ranked by win rate",
        description: "Reads from the Redis sorted set 'leaderboard' and returns trainer names with their win rates.",
        responses: { "200": { description: "Leaderboard array of { name, winRate } objects" } }
      }
    },
    "/api/rival": {
      get: {
        tags: ["Battle"],
        summary: "Generate a random rival trainer with a team of 6",
        description: "Picks 6 random Pokémon, assigns random levels (with 20% chance of rare high-level), and scales stats accordingly.",
        responses: { "200": { description: "Rival object with name and team array" } }
      }
    },
    "/api/catch": {
      post: {
        tags: ["Battle"],
        summary: "Attempt to catch a wild Pokémon",
        description: "Calculates catch success based on level, multiplier (ball + berry), mood, and RNG. Master Ball guarantees a catch.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  trainerId: { type: "string", description: "Trainer UUID" },
                  pokemonId: { type: "string", example: "25" },
                  mood: { type: "string", enum: ["neutral", "angry", "eating"], example: "eating", description: "Pokémon mood — eating boosts catch rate, angry reduces it" },
                  multiplier: { type: "number", example: 5.0, description: "Combined ball × berry multiplier" },
                  level: { type: "number", example: 15, description: "Wild Pokémon level (10–100)" },
                  guaranteed: { type: "boolean", example: false, description: "Set to true for Master Ball (100% catch)" }
                },
                required: ["trainerId", "pokemonId"]
              }
            }
          }
        },
        responses: {
          "200": { description: "Caught successfully" },
          "400": { description: "Party full (PARTY_FULL), already caught (ALREADY_CAUGHT), escaped (ESCAPED), or fled (FLED)" },
          "404": { description: "Trainer not found" }
        }
      }
    }
  }
};
