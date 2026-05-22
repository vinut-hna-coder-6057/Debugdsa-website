import "./config/env.js";

import express from "express";
import mongoose from "mongoose";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import cors from "cors";
import passport from "./config/passport.js";
import session from "express-session";

//////////////////////////////////////////////////
// ROUTES
//////////////////////////////////////////////////

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import bugRoutes from "./routes/bugRoutes.js";
import solutionRoutes from "./routes/solutionRoutes.js";
import battleRoutes from "./routes/battleRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import runCodeRoutes from "./routes/runCode.js";
import certificateRoutes from "./routes/certificateRoutes.js";
import recommendationRoutes from "./routes/recommendationRoutes.js";

//////////////////////////////////////////////////
// SOCKET.IO
//////////////////////////////////////////////////

import { createServer } from "http";
import { Server } from "socket.io";
import { setSocketInstance } from "./controllers/battleController.js";

const app = express();

//////////////////////////////////////////////////
// CREATE HTTP SERVER
//////////////////////////////////////////////////

const server = createServer(app);

//////////////////////////////////////////////////
// SOCKET.IO SETUP
//////////////////////////////////////////////////

const io = new Server(server, {
  cors: {
    origin: true,
    credentials: true
  }
});
//////////////////////////////////////////////////
// MAKE SOCKET AVAILABLE TO CONTROLLERS
//////////////////////////////////////////////////

setSocketInstance(io);

//////////////////////////////////////////////////
// SOCKET EVENTS
//////////////////////////////////////////////////

io.on("connection", (socket) => {

  console.log("⚡ User connected:", socket.id);

  socket.on("joinBattleRoom", (battleId) => {
    socket.join(battleId);
    console.log(`User joined battle room ${battleId}`);
  });

  socket.on("leaveBattleRoom", (battleId) => {
    socket.leave(battleId);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });

});

//////////////////////////////////////////////////
// SECURITY
//////////////////////////////////////////////////

app.use(
  helmet({
    crossOriginOpenerPolicy: false,
    crossOriginEmbedderPolicy: false
  })
);

//////////////////////////////////////////////////
// RATE LIMIT
//////////////////////////////////////////////////

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: "Too many requests, please try again later."
});

app.use("/api", limiter);

//////////////////////////////////////////////////
// CORS
//////////////////////////////////////////////////
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);
//////////////////////////////////////////////////
// BODY PARSER
//////////////////////////////////////////////////

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//////////////////////////////////////////////////
// COOKIE PARSER
//////////////////////////////////////////////////

app.use(cookieParser());

//////////////////////////////////////////////////
// SESSION (for Passport OAuth)
//////////////////////////////////////////////////

app.use(
  session({
    secret: process.env.SESSION_SECRET ,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax"
    }
  })
);

//////////////////////////////////////////////////
// PASSPORT
//////////////////////////////////////////////////

app.use(passport.initialize());
app.use(passport.session());

//////////////////////////////////////////////////
// LOGGER
//////////////////////////////////////////////////

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

//////////////////////////////////////////////////
// ROUTES
//////////////////////////////////////////////////

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/bugs", bugRoutes);
app.use("/api/solutions", solutionRoutes);
app.use("/api/battles", battleRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/code", runCodeRoutes);
app.use("/api/certificate", certificateRoutes);
app.use("/api/recommendations", recommendationRoutes);

//////////////////////////////////////////////////
// TEST ROUTE
//////////////////////////////////////////////////

app.get("/", (req, res) => {
  res.send("Backend working 🚀");
});

//////////////////////////////////////////////////
// 404 HANDLER
//////////////////////////////////////////////////

app.use((req, res) => {
  res.status(404).json({
    message: "Route not found"
  });
});

//////////////////////////////////////////////////
// GLOBAL ERROR HANDLER
//////////////////////////////////////////////////

app.use((err, req, res, next) => {

  console.error("GLOBAL ERROR:", err);

  res.status(err.statusCode || 500).json({
    message: err.message || "Internal server error"
  });

});

//////////////////////////////////////////////////
// DATABASE CONNECTION
//////////////////////////////////////////////////

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {

    console.log("✅ MongoDB Connected Successfully");

    server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

  })
  .catch((err) => {

    console.error("❌ MongoDB connection failed:", err.message);

  });