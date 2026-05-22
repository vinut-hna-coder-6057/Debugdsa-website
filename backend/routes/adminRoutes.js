import express from "express";

import { protect, authorize } from "../middleware/authMiddleware.js";

import {
  getUsers,
  deleteUser,
  getBugs,
  deleteBug,
  getSubmissions,
  deleteSubmission,
} from "../controllers/adminController.js";

import {
  createBattle,
  getBattles,
  deleteBattle,
  getBattleSubmissions,
  reviewSubmission,
} from "../controllers/adminbattleController.js";

const router = express.Router();

////////////////////////////////////////////////////////
// USERS
////////////////////////////////////////////////////////

router.get("/users", protect, authorize("admin"), getUsers);

router.delete("/user/:id", protect, authorize("admin"), deleteUser);

////////////////////////////////////////////////////////
// BUGS
////////////////////////////////////////////////////////

router.get("/bugs", protect, authorize("admin"), getBugs);

router.delete("/bugs/:id", protect, authorize("admin"), deleteBug);

////////////////////////////////////////////////////////
// SUBMISSIONS
////////////////////////////////////////////////////////

router.get("/submissions", protect, authorize("admin"), getSubmissions);

router.delete(
  "/submissions/:id",
  protect,
  authorize("admin"),
  deleteSubmission
);

////////////////////////////////////////////////////////
// BATTLES
////////////////////////////////////////////////////////

router.get("/battles", protect, authorize("admin"), getBattles);

router.post("/battles", protect, authorize("admin"), createBattle);

router.delete("/battles/:id", protect, authorize("admin"), deleteBattle);

////////////////////////////////////////////////////////
// BATTLE SUBMISSIONS
////////////////////////////////////////////////////////

router.get(
  "/battles/:id/submissions",
  protect,
  authorize("admin"),
  getBattleSubmissions
);

router.post(
  "/battles/:id/review",
  protect,
  authorize("admin"),
  reviewSubmission
);

export default router;