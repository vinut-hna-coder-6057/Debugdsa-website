import request from "supertest";
import app from "../../app.js";
import User from "../../models/User.js";

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
test("cannot access profile without token", async () => {

  const res = await request(app)
    .get("/api/users/me");

  expect(res.status).toBe(401);

});
test("invalid jwt rejected", async () => {

  const res = await request(app)
    .get("/api/users/me")
    .set(
      "Authorization",
      "Bearer invalid-token"
    );

  expect(res.status).toBe(401);

});
test("non-admin cannot access admin users route", async () => {

  await User.create({
    name: "Normal User",
    email: "user@gmail.com",
    password: "Password123"
  });

  const loginRes = await request(app)
    .post("/api/auth/login")
    .send({
      email: "user@gmail.com",
      password: "Password123"
    });

  const cookies =
    loginRes.headers["set-cookie"];

  const res = await request(app)
    .get("/api/users")
    .set("Cookie", cookies);

  expect(res.status).toBe(403);

});
test("invalid battle id returns 400", async () => {

  const res = await request(app)
    .get("/api/battles/abc");

  expect(res.status).toBe(400);

});