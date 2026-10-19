import express from "express";
import rateLimit from "express-rate-limit";
import { protect } from "../middleware/authMiddleware.js";
import { debugCoach } from "../controllers/aiController.js";

const router = express.Router();
const configuredLimit = Number(process.env.AI_RATE_LIMIT_MAX);
const coachLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number.isInteger(configuredLimit) ? Math.max(1, Math.min(60, configuredLimit)) : 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { success: false, error: { code: "RATE_LIMITED", message: "Too many AI requests. Please try again later." } },
});

router.post("/debug", protect, coachLimiter, debugCoach);

export default router;
