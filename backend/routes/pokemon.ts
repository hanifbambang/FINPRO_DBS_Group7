import { Router } from "express";
import { dbQueryMany, dbQueryOne, dbUpdate } from "../db.js";

const router = Router();

router.get("/", async (req, res) => {
  const all = await dbQueryMany("pokemon");
  res.json(all);
});

router.get("/random", async (req, res) => {
  const { trainerId } = req.query;
  let all = await dbQueryMany("pokemon");
  if (all.length === 0) return res.status(404).json({ error: "No pokemon found" });

  // Filter out Pokémon the trainer already owns so they never get ALREADY_CAUGHT
  if (trainerId) {
    const trainer = await dbQueryOne("trainers", { userId: trainerId });
    if (trainer) {
      let caughtIds = trainer.team || [];
      if (typeof caughtIds === "string") {
        try { caughtIds = JSON.parse(caughtIds); } catch (e) { caughtIds = []; }
      }
      if (caughtIds.length > 0) {
        const caughtIdStrings = caughtIds.map(String);
        const filtered = all.filter((p: any) => !caughtIdStrings.includes(String(p.id)));
        if (filtered.length > 0) all = filtered;
      }
    }
  }

  const random = all[Math.floor(Math.random() * all.length)];
  res.json(random);
});

router.get("/:id", async (req, res) => {
  const p = await dbQueryOne("pokemon", { id: req.params.id });
  if (!p) return res.status(404).json({ error: "Pokemon not found" });
  res.json(p);
});

router.post("/:id/moves", async (req, res) => {
  const { moves } = req.body;
  if (!moves || !Array.isArray(moves) || moves.length > 4) {
    return res.status(400).json({ error: "Invalid moveset. (max 4 moves)" });
  }
  await dbUpdate("pokemon", { id: req.params.id }, { moves: moves.join(",") });
  res.json({ success: true, moves: moves.join(",") });
});

export default router;
