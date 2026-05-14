import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { dbQueryOne, dbInsert } from "../db.js";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');

router.post("/register", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: "Missing fields" });

  const existing = await dbQueryOne("users", { username });
  if (existing) return res.status(400).json({ error: "User exists" });

  const userId = crypto.randomUUID();
  const hashed = await bcrypt.hash(password, 10);

  await dbInsert("users", { id: userId, username, password: hashed });

  // Create trainer profile with default inventory and starting coins
  await dbInsert("trainers", {
    userId,
    name: username,
    wins: "0",
    losses: "0",
    team: [],
    coins: 500,
    inventory: { pokeballs: 20, greatballs: 10, ultraballs: 5, razzberries: 10, goldenrazz: 2 }
  });

  const token = jwt.sign({ id: userId, username }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token, user: { id: userId, username } });
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const userData = await dbQueryOne("users", { username });

  if (!userData || !userData.password) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  const valid = await bcrypt.compare(password, userData.password);
  if (!valid) return res.status(401).json({ error: "Invalid credentials" });

  const token = jwt.sign({ id: userData.id, username }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token, user: { id: userData.id, username } });
});

export default router;
