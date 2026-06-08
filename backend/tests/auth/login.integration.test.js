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

describe("Login Integration Tests", () => {

  test("successful login", async () => {

    await User.create({
      name: "Test User",
      email: "test@gmail.com",
      password: "Password123"
    });

    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: "test@gmail.com",
        password: "Password123"
      });

    expect(res.status).toBe(200);

    expect(res.body.success).toBe(true);

  });

  test("nonexistent user rejected", async () => {

    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: "unknown@gmail.com",
        password: "Password123"
      });

    expect(res.status).toBe(401);

    expect(res.body.success).toBe(false);

  });

  test("wrong password rejected", async () => {

    await User.create({
      name: "Test User",
      email: "test@gmail.com",
      password: "Password123"
    });

    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: "test@gmail.com",
        password: "WrongPassword"
      });

    expect(res.status).toBe(401);

    expect(res.body.success).toBe(false);

  });

  test("login sets auth cookies", async () => {

    await User.create({
      name: "Cookie User",
      email: "cookie@gmail.com",
      password: "Password123"
    });

    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: "cookie@gmail.com",
        password: "Password123"
      });

    expect(res.status).toBe(200);

    expect(
      res.headers["set-cookie"]
    ).toBeDefined();

  });

});
test("refresh token stored in database after login", async () => {

  const user = await User.create({
    name: "Refresh User",
    email: "refresh@gmail.com",
    password: "Password123"
  });

  await request(app)
    .post("/api/auth/login")
    .send({
      email: "refresh@gmail.com",
      password: "Password123"
    });

  const updatedUser = await User.findById(user._id)
    .select("+refreshToken");

  expect(updatedUser.refreshToken)
    .toBeDefined();

});