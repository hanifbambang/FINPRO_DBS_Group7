import { Router } from "express";
import { dbQueryOne, dbUpdate, redis, DEFAULT_INVENTORY } from "../db.js";

const router = Router();

// Item shop catalogue
const SHOP_ITEMS: Record<string, { price: number; field: string }> = {
  pokeball:    { price: 50,   field: "pokeballs" },
  greatball:   { price: 150,  field: "greatballs" },
  ultraball:   { price: 400,  field: "ultraballs" },
  razzberry:   { price: 80,   field: "razzberries" },
  goldenrazz:  { price: 500,  field: "goldenrazz" },
  masterball:  { price: 5000, field: "masterballs" },
};

router.get("/:id", async (req, res) => {
  const t = await dbQueryOne("trainers", { userId: req.params.id });
  if (!t) return res.status(404).json({ error: "Trainer not found" });

  if (typeof t.team === "string") {
    try { t.team = JSON.parse(t.team); } catch (e) {}
  }

  // Normalise inventory — fall back to defaults for missing fields
  let inv = t.inventory;
  if (typeof inv === "string") {
    try { inv = JSON.parse(inv); } catch (e) { inv = null; }
  }
  t.inventory = { ...DEFAULT_INVENTORY, ...(inv || {}) };
  t.coins = t.coins ?? 500;

  res.json(t);
});

// Save full inventory (called after each Safari throw/berry use)
router.post("/:id/inventory", async (req, res) => {
  const trainer = await dbQueryOne("trainers", { userId: req.params.id });
  if (!trainer) return res.status(404).json({ error: "Trainer not found" });

  const { inventory } = req.body;
  if (!inventory) return res.status(400).json({ error: "No inventory provided" });

  await dbUpdate("trainers", { userId: req.params.id }, { inventory });
  res.json({ success: true });
});

// Purchase an item from the store
router.post("/:id/buy", async (req, res) => {
  const { item, qty = 1 } = req.body;
  const shopItem = SHOP_ITEMS[item];
  if (!shopItem) return res.status(400).json({ error: "Unknown item" });

  const trainer = await dbQueryOne("trainers", { userId: req.params.id });
  if (!trainer) return res.status(404).json({ error: "Trainer not found" });

  const totalCost = shopItem.price * qty;
  const currentCoins = trainer.coins ?? 500;

  if (currentCoins < totalCost) {
    return res.status(400).json({
      code: "INSUFFICIENT_FUNDS",
      error: `Not enough coins. Need ${totalCost}, have ${currentCoins}.`
    });
  }

  // Parse existing inventory
  let inv = trainer.inventory;
  if (typeof inv === "string") { try { inv = JSON.parse(inv); } catch (e) { inv = null; } }
  const inventory = { ...DEFAULT_INVENTORY, ...(inv || {}) };

  // Apply purchase
  inventory[shopItem.field] = (inventory[shopItem.field] || 0) + qty;
  const newCoins = currentCoins - totalCost;

  await dbUpdate("trainers", { userId: req.params.id }, { inventory, coins: newCoins });
  res.json({ success: true, coins: newCoins, inventory });
});

// Award coins after a battle win
router.post("/:id/earn", async (req, res) => {
  const { amount } = req.body;
  if (!amount || typeof amount !== "number" || amount <= 0) {
    return res.status(400).json({ error: "Invalid amount" });
  }

  const trainer = await dbQueryOne("trainers", { userId: req.params.id });
  if (!trainer) return res.status(404).json({ error: "Trainer not found" });

  const newCoins = (trainer.coins ?? 500) + Math.floor(amount);
  await dbUpdate("trainers", { userId: req.params.id }, { coins: newCoins });
  res.json({ success: true, coins: newCoins, earned: Math.floor(amount) });
});

router.post("/:id/win", async (req, res) => {
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

router.post("/:id/loss", async (req, res) => {
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

export default router;
