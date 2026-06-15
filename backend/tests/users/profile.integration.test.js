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
// PROFILE TESTS
//////////////////////////////////////////////////

test(
  "unauthenticated user cannot access profile",
  async () => {

    const res = await request(app)
      .get("/api/users/me");

    expect(res.status).toBe(401);

  }
);

test(
  "authenticated user can access own profile",
  async () => {

    await User.create({
      name: "Profile User",
      email: "profile@gmail.com",
      password: "Password123"
    });

    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({
        email: "profile@gmail.com",
        password: "Password123"
      });

    const cookies =
      loginRes.headers["set-cookie"];

    const res = await request(app)
      .get("/api/users/me")
      .set("Cookie", cookies);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("user");

    expect(res.body.user.email)
  .toBe("profile@gmail.com");

  }
);
test(
  "invalid jwt cannot access profile",
  async () => {

    const res = await request(app)
      .get("/api/users/me")
      .set(
        "Cookie",
        "accessToken=invalid_token"
      );

    expect(res.status).toBe(401);

  }
);
test(
  "normal user cannot access admin route",
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
      .get("/api/admin/users") // use your actual admin route
      .set("Cookie", cookies);

    expect(res.status).toBe(403);

  }
);