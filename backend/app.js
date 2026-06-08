// backend/app.js
import "./config/env.js";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import cors from "cors";
import passport from "./config/passport.js";
import session from "express-session";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import bugRoutes from "./routes/bugRoutes.js";
import solutionRoutes from "./routes/solutionRoutes.js";
import battleRoutes from "./routes/battleRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import runCodeRoutes from "./routes/runCode.js";
import certificateRoutes from "./routes/certificateRoutes.js";
import recommendationRoutes from "./routes/recommendationRoutes.js";

const app = express();

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : ["http://localhost:3000"];

//////////////////////////////////////////////////
// SECURITY
//////////////////////////////////////////////////

app.use(
  helmet({
    crossOriginOpenerPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

//////////////////////////////////////////////////
// RATE LIMIT
//////////////////////////////////////////////////

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: "Too many requests, please try again later.",
});

app.use("/api", limiter);

//////////////////////////////////////////////////
// CORS
//////////////////////////////////////////////////

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked: ${origin} is not allowed`));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
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
// SESSION
//////////////////////////////////////////////////

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    },
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
// HEALTH CHECK
//////////////////////////////////////////////////

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
  });
});

//////////////////////////////////////////////////
// ROOT
//////////////////////////////////////////////////

app.get("/", (req, res) => {
  res.send("Backend working 🚀");
});

//////////////////////////////////////////////////
// 404
//////////////////////////////////////////////////

app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
  });
});

//////////////////////////////////////////////////
// GLOBAL ERROR
//////////////////////////////////////////////////

app.use((err, req, res, next) => {
  console.error("GLOBAL ERROR:", err);

  res.status(err.statusCode || 500).json({
    message: err.message || "Internal server error",
  });
});

export default app;