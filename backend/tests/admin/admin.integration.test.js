import request from "supertest";
import app from "../../app.js";

import User from "../../models/User.js";

import {
  connectDB,
  clearDB,
  closeDB
} from "../setup/mongoSetup.js";

//////////////////////////////////////////////////
// SETUP
//////////////////////////////////////////////////

beforeAll(async () => {
  await connectDB();
});

afterEach(async () => {
  await clearDB();
});

afterAll(async () => {
  await closeDB();
});

//////////////////////////////////////////////////
// ADMIN ACCESS TESTS
//////////////////////////////////////////////////

test(
  "unauthenticated user cannot access admin users",
  async () => {

    const res = await request(app)
      .get("/api/admin/users");

    expect(res.status).toBe(401);

  }
);

test(
  "normal user cannot access admin users",
  async () => {

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
      .get("/api/admin/users")
      .set("Cookie", cookies);

    expect(res.status).toBe(403);

  }
);

test(
  "admin can access admin users",
  async () => {

    await User.create({
      name: "Admin User",
      email: "admin@gmail.com",
      password: "Password123",
      role: "admin"
    });

    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({
        email: "admin@gmail.com",
        password: "Password123"
      });

    const cookies =
      loginRes.headers["set-cookie"];

    const res = await request(app)
      .get("/api/admin/users")
      .set("Cookie", cookies);

    expect(res.status).toBe(200);

  }
);