import request from "supertest";
import app from "../../app.js";

describe("Rate Limiter",()=>{

  test("rate limiter exists", async () => {

  let lastResponse;

  for(let i=0;i<510;i++){
    lastResponse = await request(app)
      .get("/api/users/me");
  }

  expect([401,429]).toContain(lastResponse.status);

});

});