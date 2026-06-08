import request from "supertest";
import app from "../../app.js";
import User from "../../models/User.js";
import Battle from "../../models/battle.js";

import {
  connectDB,
  closeDB,
  clearDB
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
test("unauthenticated user cannot join battle", async () => {

  const battle = await Battle.create({
    title: "Test Battle",
    startTime: new Date(Date.now() - 1000),
    endTime: new Date(Date.now() + 3600000)
  });

  const res = await request(app)
    .post(`/api/battles/join/${battle._id}`);

  expect(res.status).toBe(401);

});
test("user can join battle", async () => {

  const user = await User.create({
    name: "Battle User",
    email: "battle@gmail.com",
    password: "Password123"
  });

  const battle = await Battle.create({
    title: "Battle",
    startTime: new Date(Date.now() - 1000),
    endTime: new Date(Date.now() + 3600000)
  });

  const loginRes = await request(app)
    .post("/api/auth/login")
    .send({
      email: "battle@gmail.com",
      password: "Password123"
    });

  const cookies = loginRes.headers["set-cookie"];

  const res = await request(app)
    .post(`/api/battles/join/${battle._id}`)
    .set("Cookie", cookies);

  expect(res.status).toBe(200);

});
import mongoose from "mongoose";

test("join nonexistent battle returns 404", async () => {

  const user = await User.create({
    name: "User",
    email: "user@gmail.com",
    password: "Password123"
  });

  const loginRes = await request(app)
    .post("/api/auth/login")
    .send({
      email: "user@gmail.com",
      password: "Password123"
    });

  const cookies = loginRes.headers["set-cookie"];

  const fakeId = new mongoose.Types.ObjectId();

  const res = await request(app)
    .post(`/api/battles/join/${fakeId}`)
    .set("Cookie", cookies);

  expect(res.status).toBe(404);

});
test("participant added after join", async () => {

  const user = await User.create({
    name: "Battle User",
    email: "battle@gmail.com",
    password: "Password123"
  });

  const battle = await Battle.create({
    title: "Battle",
    startTime: new Date(Date.now() - 1000),
    endTime: new Date(Date.now() + 3600000)
  });

  const loginRes = await request(app)
    .post("/api/auth/login")
    .send({
      email: "battle@gmail.com",
      password: "Password123"
    });

  const cookies = loginRes.headers["set-cookie"];

  await request(app)
    .post(`/api/battles/join/${battle._id}`)
    .set("Cookie", cookies);

  const updatedBattle =
    await Battle.findById(battle._id);

  expect(
    updatedBattle.participants.length
  ).toBe(1);

});
test("submission before battle start rejected", async () => {

  const user = await User.create({
    name: "Future User",
    email: "future@gmail.com",
    password: "Password123"
  });

  const battle = await Battle.create({
    title: "Future Battle",
    startTime: new Date(Date.now() + 60 * 60 * 1000),
    endTime: new Date(Date.now() + 2 * 60 * 60 * 1000)
  });

  const loginRes = await request(app)
    .post("/api/auth/login")
    .send({
      email: "future@gmail.com",
      password: "Password123"
    });

  const cookies = loginRes.headers["set-cookie"];

  const res = await request(app)
    .post(`/api/battles/submit/${battle._id}`)
    .set("Cookie", cookies)
    .send({
      code: "console.log('hello')"
    });

  expect(res.status).toBe(403);

  expect(res.body.message)
    .toBe("Battle has not started yet");

});