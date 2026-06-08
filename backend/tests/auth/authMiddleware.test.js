import request from "supertest";
import app from "../../app.js";

describe("Auth Middleware", () => {

  test("GET /api/users/me without token returns 401", async () => {

    const res = await request(app)
      .get("/api/users/me");

    expect(res.status).toBe(401);

  });

  test("GET /api/users/me with invalid token returns 401", async () => {

    const res = await request(app)
      .get("/api/users/me")
      .set("Authorization", "Bearer invalid_token");

    expect(res.status).toBe(401);

  });

});