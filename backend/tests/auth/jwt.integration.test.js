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
test("valid token accesses protected route", async () => {

  await User.create({
    name: "JWT User",
    email: "jwt@gmail.com",
    password: "Password123"
  });

  const loginRes = await request(app)
    .post("/api/auth/login")
    .send({
      email: "jwt@gmail.com",
      password: "Password123"
    });

  const cookies = loginRes.headers["set-cookie"];

  const res = await request(app)
    .get("/api/users/me")
    .set("Cookie", cookies);

  expect(res.status).toBe(200);

});
test("missing token rejected", async () => {

  const res = await request(app)
    .get("/api/users/me");

  expect(res.status).toBe(401);

});
test("tampered token rejected", async () => {

  const res = await request(app)
    .get("/api/users/me")
    .set(
      "Authorization",
      "Bearer invalid.jwt.token"
    );

  expect(res.status).toBe(401);

});
test("deleted user token rejected", async () => {

  const user = await User.create({
    name: "Delete User",
    email: "delete@gmail.com",
    password: "Password123"
  });

  const loginRes = await request(app)
    .post("/api/auth/login")
    .send({
      email: "delete@gmail.com",
      password: "Password123"
    });

  const cookies = loginRes.headers["set-cookie"];

  await User.findByIdAndDelete(user._id);

  const res = await request(app)
    .get("/api/users/me")
    .set("Cookie", cookies);

  expect(res.status).toBe(401);

});