import request from "supertest";
import mongoose from "mongoose";

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

describe("Registration Integration Tests", () => {

  test("successful registration", async () => {

    const res = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Vinuthna",
        email: "vinuthna@gmail.com",
        password: "Password123"
      });

    expect(res.status).toBe(201);

    expect(res.body.success).toBe(true);

  });

  test("duplicate email rejected", async () => {

    await User.create({
      name: "User1",
      email: "duplicate@gmail.com",
      password: "Password123"
    });

    const res = await request(app)
      .post("/api/auth/register")
      .send({
        name: "User2",
        email: "duplicate@gmail.com",
        password: "Password123"
      });

    expect(res.status).toBe(400);

    expect(res.body.message)
      .toMatch(/already exists/i);

  });

  test("registration sets auth cookies", async () => {

    const res = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Cookie User",
        email: "cookie@gmail.com",
        password: "Password123"
      });

    expect(res.status).toBe(201);

    expect(
      res.headers["set-cookie"]
    ).toBeDefined();

  });

});
test("password stored hashed", async () => {

  await request(app)
    .post("/api/auth/register")
    .send({
      name: "Hash User",
      email: "hash@gmail.com",
      password: "Password123"
    });

  const user = await User.findOne({
    email: "hash@gmail.com"
  }).select("+password");

  expect(user.password)
    .not.toBe("Password123");

});