export const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "Pokédex API",
    version: "1.0.0",
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
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  username: { type: "string", example: "Ash" },
                  password: { type: "string", example: "pikachu123" }
                }
              }
            }
          }
        },
        responses: {
          "200": { description: "Successful registration" },
          "400": { description: "Missing fields or User exists" }
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
                }
              }
            }
          }
        },
        responses: {
          "200": { description: "Login successful" },
          "401": { description: "Invalid credentials" }
        }
      }
    },
    "/api/pokemon": {
      get: {
        tags: ["Pokémon"],
        summary: "Get all Pokémon",
        responses: { "200": { description: "Array of all Pokémon" } }
      }
    },
    "/api/pokemon/random": {
      get: {
        tags: ["Pokémon"],
        summary: "Get a random Pokémon",
        responses: { "200": { description: "A random Pokémon" } }
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
        responses: { "200": { description: "List of all moves" } }
      }
    },
    "/api/trainer/{id}": {
      get: {
        tags: ["Trainer"],
        summary: "Get a trainer's profile and team",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" }, description: "Trainer's User UUID" }],
        responses: { "200": { description: "Trainer profile" }, "404": { description: "Not found" } }
      }
    },
    "/api/trainer/{id}/win": {
      post: {
        tags: ["Trainer"],
        summary: "Record a win for a trainer",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Win recorded" } }
      }
    },
    "/api/trainer/{id}/loss": {
      post: {
        tags: ["Trainer"],
        summary: "Record a loss for a trainer",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Loss recorded" } }
      }
    },
    "/api/leaderboard": {
      get: {
        tags: ["Battle"],
        summary: "Get the top 10 trainers ranked by win rate",
        responses: { "200": { description: "Leaderboard data from Redis" } }
      }
    },
    "/api/rival": {
      get: {
        tags: ["Battle"],
        summary: "Generate a random rival trainer with a team",
        responses: { "200": { description: "Rival data" } }
      }
    },
    "/api/catch": {
      post: {
        tags: ["Battle"],
        summary: "Attempt to catch a wild Pokémon",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  trainerId: { type: "string", description: "Trainer UUID" },
                  pokemonId: { type: "string", example: "25" },
                  mood: { type: "string", enum: ["angry", "eating"], example: "eating" },
                  multiplier: { type: "number", example: 1.5 },
                  level: { type: "number", example: 15 }
                },
                required: ["trainerId", "pokemonId"]
              }
            }
          }
        },
        responses: {
          "200": { description: "Caught successfully" },
          "400": { description: "Party full, already caught, escaped, or fled" }
        }
      }
    }
  }
};
