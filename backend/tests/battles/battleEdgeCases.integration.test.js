import mongoose from "mongoose";
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
test("duplicate join does not create duplicate participants", async () => {

  const user = await User.create({
    name: "Battle User",
    email: "battle@gmail.com",
    password: "Password123"
  });

  const battle = await Battle.create({
    title: "Duplicate Join Battle",
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

  await request(app)
    .post(`/api/battles/join/${battle._id}`)
    .set("Cookie", cookies);

  const updatedBattle =
    await Battle.findById(battle._id);

  expect(
    updatedBattle.participants.length
  ).toBe(1);

});
test("invalid battle id returns 400", async () => {

  const res = await request(app)
    .get("/api/battles/abc");

  expect(res.status).toBe(400);

});

test("battle not found returns 404", async () => {

  const fakeId =
    new mongoose.Types.ObjectId();

  const res = await request(app)
    .get(`/api/battles/${fakeId}`);

  expect(res.status).toBe(404);

});
test("late submission marked correctly", async () => {

  const user = await User.create({
    name: "Late User",
    email: "late@gmail.com",
    password: "Password123"
  });

  const battle = await Battle.create({
    title: "Ended Battle",
    startTime: new Date(Date.now() - 7200000), // 2 hours ago
    endTime: new Date(Date.now() - 3600000)    // 1 hour ago
  });

  const loginRes = await request(app)
    .post("/api/auth/login")
    .send({
      email: "late@gmail.com",
      password: "Password123"
    });

  const cookies = loginRes.headers["set-cookie"];

  const res = await request(app)
    .post(`/api/battles/submit/${battle._id}`)
    .set("Cookie", cookies)
    .send({
      code: "console.log('late submission')"
    });

  expect(res.status).toBe(200);

  expect(res.body.message)
    .toBe("Solution submitted (late submission)");

  const updatedBattle =
    await Battle.findById(battle._id);

  expect(
    updatedBattle.submissions.length
  ).toBe(1);

  expect(
    updatedBattle.submissions[0].late
  ).toBe(true);

});