import request from "supertest";
import app from "../../app.js";

import User from "../../models/User.js";
import Battle from "../../models/battle.js";

import {
  connectDB,
  clearDB,
  closeDB
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

test(
  "admin can create battle",
  async () => {

    await User.create({
      name: "Admin",
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
      .post("/api/admin/battles")
      .set("Cookie", cookies)
      .send({
        title: "Battle Test",
        startTime: new Date(
          Date.now() + 60000
        ),
        endTime: new Date(
          Date.now() + 120000
        )
      });

    expect(res.status).toBe(201);

    const battle =
      await Battle.findOne({
        title: "Battle Test"
      });

    expect(battle).not.toBeNull();

  }
);
test(
  "admin can delete battle",
  async () => {

    await User.create({
      name: "Admin",
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

    const battle = await Battle.create({
      title: "Delete Me",
      startTime: new Date(),
      endTime: new Date(Date.now() + 60000)
    });

    const res = await request(app)
      .delete(`/api/admin/battles/${battle._id}`)
      .set("Cookie", cookies);

    expect(res.status).toBe(200);

    const deletedBattle =
      await Battle.findById(battle._id);

    expect(deletedBattle).toBeNull();

  }
);
test(
  "admin can delete user",
  async () => {

    await User.create({
      name: "Admin",
      email: "admin@gmail.com",
      password: "Password123",
      role: "admin"
    });

    const targetUser = await User.create({
      name: "Target",
      email: "target@gmail.com",
      password: "Password123"
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
      .delete(
        `/api/admin/user/${targetUser._id}`
      )
      .set("Cookie", cookies);

    expect(res.status).toBe(200);

    const deletedUser =
      await User.findById(targetUser._id);

    expect(deletedUser).toBeNull();

  }
);
test(
  "admin can get users list",
  async () => {

    await User.create({
      name: "Admin",
      email: "admin@gmail.com",
      password: "Password123",
      role: "admin"
    });

    await User.create({
      name: "User1",
      email: "user1@gmail.com",
      password: "Password123"
    });

    await User.create({
      name: "User2",
      email: "user2@gmail.com",
      password: "Password123"
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
    expect(Array.isArray(res.body.users))
  .toBe(true);
    expect(res.body.users.length)
      .toBeGreaterThanOrEqual(3);

  }
);
