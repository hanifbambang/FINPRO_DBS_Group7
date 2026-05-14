import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";

import { initPostgres, initRedis } from "./backend/db.js";
import { seedData } from "./backend/seed.js";
import { swaggerDocument } from "./backend/swagger.js";

import authRoutes from "./backend/routes/auth.js";
import pokemonRoutes from "./backend/routes/pokemon.js";
import trainerRoutes from "./backend/routes/trainer.js";
import battleRoutes from "./backend/routes/battle.js";
import movesRoutes from "./backend/routes/moves.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // --- Database Init & Seeding ---
  await initPostgres();
  await initRedis();
  await seedData();

  // --- API Docs (Swagger) ---
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument, { customSiteTitle: "Pokédex API Docs" }));

  // --- API Routes ---
  app.use("/api/auth", authRoutes);
  app.use("/api/pokemon", pokemonRoutes);
  app.use("/api/trainer", trainerRoutes);
  app.use("/api/moves", movesRoutes);

  // Battle routes are directly mapped to /api 
  // (e.g. /api/leaderboard, /api/rival, /api/catch)
  app.use("/api", battleRoutes);

  // --- Vite Middleware (Frontend) ---
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
