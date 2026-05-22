import express from "express";

import {
  runCode
} from "../controllers/runCodeController.js";

const router = express.Router();

//////////////////////////////////////////////////
// RUN CODE
//////////////////////////////////////////////////

router.post(
  "/run",
  runCode
);

export default router;