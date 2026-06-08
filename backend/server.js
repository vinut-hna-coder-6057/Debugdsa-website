import "./config/env.js";

import mongoose from "mongoose";
import { createServer } from "http";
import { Server } from "socket.io";

import app from "./app.js";

import { setSocketInstance } from "./controllers/battleController.js";

//////////////////////////////////////////////////
// HTTP SERVER
//////////////////////////////////////////////////

const server = createServer(app);

//////////////////////////////////////////////////
// SOCKET CONFIG
//////////////////////////////////////////////////

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : ["http://localhost:3000"];

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

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
// DATABASE
//////////////////////////////////////////////////

const PORT = process.env.PORT || 5000;
export { server, io };

const startServer = async () => {
  try {

    await mongoose.connect(process.env.MONGO_URI);

    console.log("✅ MongoDB Connected Successfully");

    server.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

  } catch (err) {

    console.error(
      "❌ MongoDB connection failed:",
      err.message
    );

  }
};

if (process.env.NODE_ENV !== "test") {
  startServer();
}