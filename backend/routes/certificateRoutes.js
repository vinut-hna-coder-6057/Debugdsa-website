import express from "express";

import { protect } from "../middleware/authMiddleware.js";

import {
  downloadCertificate
} from "../controllers/certificateController.js";

const router = express.Router();

//////////////////////////////////////////////////
// DOWNLOAD CERTIFICATE
//////////////////////////////////////////////////

router.get(
  "/download",
  protect,
  downloadCertificate
);

export default router;