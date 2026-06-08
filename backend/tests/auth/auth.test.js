import request from "supertest";
import app from "../../app.js";

describe("Auth API", () => {

  test("register rejects missing fields", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({});

    expect(res.status).toBe(400);
  });

  

});