import express from "express";

import {
  protect
} from "../middleware/authMiddleware.js";

import {
  runCode
} from "../controllers/runCodeController.js";

const router = express.Router();

//////////////////////////////////////////////////
// RUN CODE
//////////////////////////////////////////////////

router.post(
  "/run",
  protect,
  runCode
);

export default router;