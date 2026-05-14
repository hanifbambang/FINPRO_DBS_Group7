import { Router } from "express";
import { dbQueryOne, dbQueryMany, dbUpdate, redis } from "../db.js";

const router = Router();

router.get("/leaderboard", async (req, res) => {
  const raw = await redis.zrevrange("leaderboard", 0, 10, "WITHSCORES");
  const result = [];
  for (let i = 0; i < raw.length; i += 2) {
    result.push({ name: raw[i], winRate: raw[i + 1] });
  }
  res.json(result);
});

router.get("/rival", async (req, res) => {
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
      level,
      hp: Math.floor((parseInt(p.hp) * level) / 50) + 10,
      attack: Math.floor((parseInt(p.attack) * level) / 50) + 5,
      defense: Math.floor((parseInt(p.defense) * level) / 50) + 5,
      speed: Math.floor((parseInt(p.speed) * level) / 50) + 5,
    });
  }

  const rivalNames = ["Blue", "Silver", "Gary", "Paul", "Gladion", "Bede"];
  res.json({
    name: rivalNames[Math.floor(Math.random() * rivalNames.length)],
    team: rivalTeam
  });
});

router.post("/catch", async (req, res) => {
  const { trainerId, pokemonId, mood, multiplier = 1, level = 20, guaranteed = false } = req.body;

  // Debug: log exactly what the server receives
  console.log(`[CATCH] trainer=${trainerId} pokemon=${pokemonId} level=${level} multiplier=${multiplier} mood=${mood} guaranteed=${guaranteed}`);

  const trainer = await dbQueryOne("trainers", { userId: trainerId });
  if (!trainer) return res.status(404).json({ error: "Trainer not found" });

  let teamIds = trainer.team || [];
  if (typeof teamIds === "string") {
    try { teamIds = JSON.parse(teamIds); } catch (e) { teamIds = []; }
  }

  if (teamIds.length >= 6) {
    return res.status(400).json({
      code: "PARTY_FULL",
      error: "COMMUNICATION ERROR: Trainer party at max capacity (6/6)."
    });
  }

  // Compare as strings to handle JSONB integer vs string type mismatch
  const teamIdStrings = teamIds.map(String);
  if (teamIdStrings.includes(String(pokemonId))) {
    return res.status(400).json({
      code: "ALREADY_CAUGHT",
      error: "LOGICAL ERROR: Biological signal already detected in active team."
    });
  }

  // Master Ball: guaranteed catch — skip the RNG roll entirely
  if (guaranteed) {
    teamIds.push(pokemonId);
    await dbUpdate("trainers", { userId: trainerId }, { team: teamIds });
    return res.json({ success: true, message: `POKEMON_ID ${pokemonId} successfully serialized to active team.` });
  }

  // Base catch rate: 85% at level 10, scales down to 45% at level 100
  const baseRate = Math.max(0.45, 0.90 - level / 200);
  let successRate = baseRate * multiplier;

  if (mood === "angry") successRate *= 0.6;
  if (mood === "eating") successRate *= 1.15;

  // Cap at 95% — always a small chance to fail (Master Ball bypasses this above)
  successRate = Math.min(0.95, successRate);

  console.log(`[CATCH] baseRate=${baseRate.toFixed(2)} successRate=${successRate.toFixed(2)}`);

  if (Math.random() > successRate) {
    const fleeRate = 0.05;
    const fled = Math.random() < fleeRate;

    return res.status(400).json({
      success: false,
      code: fled ? "FLED" : "ESCAPED",
      fled: fled,
      error: fled
        ? "The Pokémon fled the encounter!"
        : "The wild creature broke free!"
    });
  }

  teamIds.push(pokemonId);
  await dbUpdate("trainers", { userId: trainerId }, { team: teamIds });

  res.json({ success: true, message: `POKEMON_ID ${pokemonId} successfully serialized to active team.` });
});

export default router;
