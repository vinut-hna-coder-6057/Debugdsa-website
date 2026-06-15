import request from "supertest";
import app from "../../app.js";

import User from "../../models/User.js";
import Battle from "../../models/battle.js";

import {
  connectDB,
  clearDB,
  closeDB
} from "../setup/mongoSetup.js";
beforeAll(async () => {
  await connectDB();
});

afterEach(async () => {
  await clearDB();
});

afterAll(async () => {
  await closeDB();
});
test(
  "accepted submission appears in leaderboard",
  async () => {

    const user = await User.create({
      name: "Leader",
      email: "leader@gmail.com",
      password: "Password123"
    });

    const battle = await Battle.create({
      title: "Leaderboard Battle",
      startTime: new Date(Date.now() - 10000),
      endTime: new Date(Date.now() + 10000),
      submissions: [
        {
          user: user._id,
          code: "solution",
          status: "accepted",
          submittedAt: new Date(),
          late: false
        }
      ]
    });

    const res = await request(app)
      .get(
        `/api/battles/leaderboard/${battle._id}`
      );

    expect(res.status).toBe(200);

    expect(res.body.users.length).toBe(1);

  }
);
test(
  "late submissions excluded from leaderboard",
  async () => {

    const user = await User.create({
      name: "Late User",
      email: "late@gmail.com",
      password: "Password123"
    });

    const battle = await Battle.create({
      title: "Late Battle",
      startTime: new Date(Date.now() - 10000),
      endTime: new Date(Date.now() + 10000),
      submissions: [
        {
          user: user._id,
          code: "solution",
          status: "accepted",
          submittedAt: new Date(),
          late: true
        }
      ]
    });

    const res = await request(app)
      .get(
        `/api/battles/leaderboard/${battle._id}`
      );

    expect(res.status).toBe(200);

    expect(res.body.users.length).toBe(0);

  }
);
test(
  "pending submissions excluded from leaderboard",
  async () => {

    const user = await User.create({
      name: "Pending User",
      email: "pending@gmail.com",
      password: "Password123"
    });

    const battle = await Battle.create({
      title: "Pending Battle",
      startTime: new Date(Date.now() - 10000),
      endTime: new Date(Date.now() + 10000),
      submissions: [
        {
          user: user._id,
          code: "solution",
          status: "pending",
          submittedAt: new Date(),
          late: false
        }
      ]
    });

    const res = await request(app)
      .get(
        `/api/battles/leaderboard/${battle._id}`
      );

    expect(res.status).toBe(200);

    expect(res.body.users.length).toBe(0);

  }
);
test(
  "earliest accepted submission gets rank 1",
  async () => {

    const user1 = await User.create({
      name: "User1",
      email: "rank1@gmail.com",
      password: "Password123"
    });

    const user2 = await User.create({
      name: "User2",
      email: "rank2@gmail.com",
      password: "Password123"
    });

    const earlier =
      new Date(Date.now() - 10000);

    const later =
      new Date(Date.now() - 5000);

    const battle = await Battle.create({
      title: "Ranking Battle",
      startTime: new Date(Date.now() - 60000),
      endTime: new Date(Date.now() + 60000),

      submissions: [
        {
          user: user2._id,
          code: "solution2",
          status: "accepted",
          submittedAt: later,
          late: false
        },
        {
          user: user1._id,
          code: "solution1",
          status: "accepted",
          submittedAt: earlier,
          late: false
        }
      ]
    });

    const res = await request(app)
      .get(
        `/api/battles/leaderboard/${battle._id}`
      );

    expect(res.status).toBe(200);

    expect(res.body.users.length).toBe(2);

    expect(res.body[0].rank)
      .toBe(1);

    expect(res.body[0].user)
      .toBe("User1");

  }
);
import mongoose from "mongoose";

test(
  "nonexistent battle returns 404",
  async () => {

    const fakeBattleId =
      new mongoose.Types.ObjectId();

    const res = await request(app)
      .get(
        `/api/battles/leaderboard/${fakeBattleId}`
      );

    expect(res.status).toBe(404);

    expect(res.body.message)
      .toBe("Battle not found");

  }
);