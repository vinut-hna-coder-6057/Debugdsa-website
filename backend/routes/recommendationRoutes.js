import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { getRecommendedBugs } from "../controllers/recommendationController.js";

const router = express.Router();

router.get("/bugs", protect, getRecommendedBugs);

export default router;