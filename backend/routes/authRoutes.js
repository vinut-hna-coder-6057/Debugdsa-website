import express from "express";
import passport from "passport";

import {
  register,
  login,
  refreshAccessToken,
  logout,
  forgotPassword,
  resetPassword,
  googleCallback,
  firebaseLogin
} from "../controllers/authController.js";
const router = express.Router();

//////////////////////////////////////////////////
// GOOGLE AUTHENTICATION
//////////////////////////////////////////////////

router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"]
  })
);

//////////////////////////////////////////////////
// GOOGLE CALLBACK
//////////////////////////////////////////////////

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false
  }),
  googleCallback
);

//////////////////////////////////////////////////
// FIREBASE GOOGLE LOGIN
//////////////////////////////////////////////////

router.post(
  "/firebase-login",
  firebaseLogin
);

//////////////////////////////////////////////////
// PASSWORD RESET
//////////////////////////////////////////////////

router.post(
  "/forgot-password",
  forgotPassword
);

router.put(
  "/reset-password/:token",
  resetPassword
);

//////////////////////////////////////////////////
// NORMAL AUTH
//////////////////////////////////////////////////

router.post(
  "/register",
  register
);

router.post(
  "/login",
  login
);

router.post(
  "/refresh",
  refreshAccessToken
);

router.post(
  "/logout",
  logout
);

export default router;