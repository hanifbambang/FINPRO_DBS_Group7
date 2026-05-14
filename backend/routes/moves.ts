import { Router } from "express";
import { dbQueryMany } from "../db.js";

const router = Router();

router.get("/", async (req, res) => {
  const moves = await dbQueryMany("moves");
  res.json(moves);
});

export default router;
