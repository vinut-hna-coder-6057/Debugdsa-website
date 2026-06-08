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

describe("Run Code API", () => {

  test("unauthenticated user cannot execute code", async () => {

    const res = await request(app)
      .post("/api/code/run")
      .send({
        language: "java",
        code: "class Main {}"
      });

    expect(res.status).toBe(401);

  });

  test("missing code rejected", async () => {

    await User.create({
      name: "Code User",
      email: "code@gmail.com",
      password: "Password123"
    });

    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({
        email: "code@gmail.com",
        password: "Password123"
      });

    const cookies = loginRes.headers["set-cookie"];

    const res = await request(app)
      .post("/api/code/run")
      .set("Cookie", cookies)
      .send({
        language: "java"
      });

    expect(res.status).toBe(400);

  });

  test("missing language rejected", async () => {

    await User.create({
      name: "Code User",
      email: "code@gmail.com",
      password: "Password123"
    });

    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({
        email: "code@gmail.com",
        password: "Password123"
      });

    const cookies = loginRes.headers["set-cookie"];

    const res = await request(app)
      .post("/api/code/run")
      .set("Cookie", cookies)
      .send({
        code: 'System.out.println("Hello");'
      });

    expect(res.status).toBe(400);

  });

  test("unsupported language rejected", async () => {

    await User.create({
      name: "Code User",
      email: "code@gmail.com",
      password: "Password123"
    });

    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({
        email: "code@gmail.com",
        password: "Password123"
      });

    const cookies = loginRes.headers["set-cookie"];

    const res = await request(app)
      .post("/api/code/run")
      .set("Cookie", cookies)
      .send({
        code: "print(1)",
        language: "rust"
      });

    expect(res.status).toBe(400);

  });

  test("oversized code rejected", async () => {

    await User.create({
      name: "Code User",
      email: "code@gmail.com",
      password: "Password123"
    });

    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({
        email: "code@gmail.com",
        password: "Password123"
      });

    const cookies = loginRes.headers["set-cookie"];

    const largeCode = "A".repeat(10001);

    const res = await request(app)
      .post("/api/code/run")
      .set("Cookie", cookies)
      .send({
        code: largeCode,
        language: "java"
      });

    expect(res.status).toBe(400);

  });

  test("oversized input rejected", async () => {

    await User.create({
      name: "Code User",
      email: "code@gmail.com",
      password: "Password123"
    });

    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({
        email: "code@gmail.com",
        password: "Password123"
      });

    const cookies = loginRes.headers["set-cookie"];

    const largeInput = "A".repeat(5001);

    const res = await request(app)
      .post("/api/code/run")
      .set("Cookie", cookies)
      .send({
        code: "print('hello')",
        language: "python",
        input: largeInput
      });

    expect(res.status).toBe(400);

  });

});