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
test("cannot follow yourself", async () => {

  const user = await User.create({
    name: "User",
    email: "user@gmail.com",
    password: "Password123"
  });

  const loginRes = await request(app)
    .post("/api/auth/login")
    .send({
      email: "user@gmail.com",
      password: "Password123"
    });

  const cookies = loginRes.headers["set-cookie"];

  const res = await request(app)
    .put(`/api/users/follow/${user._id}`)
    .set("Cookie", cookies);

  expect(res.status).toBe(400);

});
test("user can follow another user", async () => {

  const user1 = await User.create({
    name: "User1",
    email: "user1@gmail.com",
    password: "Password123"
  });

  const user2 = await User.create({
    name: "User2",
    email: "user2@gmail.com",
    password: "Password123"
  });

  const loginRes = await request(app)
    .post("/api/auth/login")
    .send({
      email: "user1@gmail.com",
      password: "Password123"
    });

  const cookies = loginRes.headers["set-cookie"];

  const res = await request(app)
    .put(`/api/users/follow/${user2._id}`)
    .set("Cookie", cookies);

  expect(res.status).toBe(200);

});
test("duplicate follow rejected", async () => {

  const user1 = await User.create({
    name: "User1",
    email: "user1@gmail.com",
    password: "Password123"
  });

  const user2 = await User.create({
    name: "User2",
    email: "user2@gmail.com",
    password: "Password123"
  });

  const loginRes = await request(app)
    .post("/api/auth/login")
    .send({
      email: "user1@gmail.com",
      password: "Password123"
    });

  const cookies = loginRes.headers["set-cookie"];

  await request(app)
    .put(`/api/users/follow/${user2._id}`)
    .set("Cookie", cookies);

  const secondAttempt = await request(app)
    .put(`/api/users/follow/${user2._id}`)
    .set("Cookie", cookies);

  expect(secondAttempt.status).toBe(400);

});
test("followers count updates", async () => {

  const user1 = await User.create({
    name: "User1",
    email: "user1@gmail.com",
    password: "Password123"
  });

  const user2 = await User.create({
    name: "User2",
    email: "user2@gmail.com",
    password: "Password123"
  });

  const loginRes = await request(app)
    .post("/api/auth/login")
    .send({
      email: "user1@gmail.com",
      password: "Password123"
    });

  const cookies = loginRes.headers["set-cookie"];

  await request(app)
    .put(`/api/users/follow/${user2._id}`)
    .set("Cookie", cookies);

  const updatedUser = await User.findById(user2._id);

  expect(updatedUser.followers.length).toBe(1);

});
test("user can unfollow", async () => {

  const user1 = await User.create({
    name: "User1",
    email: "user1@gmail.com",
    password: "Password123"
  });

  const user2 = await User.create({
    name: "User2",
    email: "user2@gmail.com",
    password: "Password123"
  });

  const loginRes = await request(app)
    .post("/api/auth/login")
    .send({
      email: "user1@gmail.com",
      password: "Password123"
    });

  const cookies = loginRes.headers["set-cookie"];

  await request(app)
    .put(`/api/users/follow/${user2._id}`)
    .set("Cookie", cookies);

  const res = await request(app)
    .put(`/api/users/unfollow/${user2._id}`)
    .set("Cookie", cookies);

  expect(res.status).toBe(200);

});