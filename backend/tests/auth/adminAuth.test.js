import request from "supertest";
import app from "../../app.js";

describe("Admin Authorization", () => {

  test("GET /api/users without token returns 401", async () => {

    const res = await request(app)
      .get("/api/users");

    expect(res.status).toBe(401);

  });

});