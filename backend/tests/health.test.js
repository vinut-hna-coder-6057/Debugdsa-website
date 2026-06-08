import request from "supertest";
import app from "../app.js";

describe("Health Check",()=>{

  it("returns 200",async()=>{

    const res = await request(app)
      .get("/health");

    expect(res.statusCode).toBe(200);

    expect(res.body.status).toBe("ok");

  });

});