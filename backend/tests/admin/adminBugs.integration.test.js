import request from "supertest";
import mongoose from "mongoose";

import app from "../../app.js";

import User from "../../models/User.js";
import Bug from "../../models/Bug.js";

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
// HELPERS
//////////////////////////////////////////////////

async function createAdminAndLogin() {

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

  return loginRes.headers["set-cookie"];
}

//////////////////////////////////////////////////
// GET BUGS
//////////////////////////////////////////////////

test(
  "unauthenticated user cannot access bugs list",
  async () => {

    const res = await request(app)
      .get("/api/admin/bugs");

    expect(res.status).toBe(401);

  }
);

test(
  "normal user cannot access bugs list",
  async () => {

    await User.create({
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

    const cookies =
      loginRes.headers["set-cookie"];

    const res = await request(app)
      .get("/api/admin/bugs")
      .set("Cookie", cookies);

    expect(res.status).toBe(403);

  }
);

test(
  "admin can get bugs list",
  async () => {

    const admin = await User.create({
      name: "Admin",
      email: "admin@gmail.com",
      password: "Password123",
      role: "admin"
    });

    await Bug.create({
      title: "Array Index Bug",
      description:
        "This bug causes array index errors",
      code: "arr[10]",
      language: "Java",
      topic: "Arrays",
      error:
        "ArrayIndexOutOfBoundsException",
      expectedOutput: "5",
      postedBy: admin._id
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
      .get("/api/admin/bugs")
      .set("Cookie", cookies);

    expect(res.status).toBe(200);

    expect(
      Array.isArray(res.body)
    ).toBe(true);

    expect(res.body.users.length)
      .toBeGreaterThan(0);

  }
);

//////////////////////////////////////////////////
// DELETE BUG
//////////////////////////////////////////////////

test(
  "admin can delete bug",
  async () => {

    const admin = await User.create({
      name: "Admin",
      email: "admin@gmail.com",
      password: "Password123",
      role: "admin"
    });

    const bug = await Bug.create({
      title: "Delete Bug Test",
      description:
        "Testing delete functionality",
      code: "console.log('bug')",
      language: "JavaScript",
      topic: "Basics",
      error: "Wrong output",
      expectedOutput: "Correct output",
      postedBy: admin._id
    });

    const cookies =
      await createAdminAndLogin();

    const res = await request(app)
      .delete(
        `/api/admin/bugs/${bug._id}`
      )
      .set("Cookie", cookies);

    expect(res.status).toBe(200);

    const deletedBug =
      await Bug.findById(bug._id);

    expect(deletedBug)
      .toBeNull();

  }
);

test(
  "normal user cannot delete bug",
  async () => {

    const user = await User.create({
      name: "User",
      email: "user@gmail.com",
      password: "Password123"
    });

    const bug = await Bug.create({
      title: "Protected Bug",
      description:
        "Should not be deleted",
      code: "test",
      language: "Java",
      topic: "Arrays",
      error: "Error",
      expectedOutput: "Output",
      postedBy: user._id
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
      .delete(
        `/api/admin/bugs/${bug._id}`
      )
      .set("Cookie", cookies);

    expect(res.status).toBe(403);

  }
);

test(
  "delete nonexistent bug returns success response",
  async () => {

    const cookies =
      await createAdminAndLogin();

    const fakeId =
      new mongoose.Types.ObjectId();

    const res = await request(app)
      .delete(
        `/api/admin/bugs/${fakeId}`
      )
      .set("Cookie", cookies);

    expect(res.status).toBe(200);

  }
);
test(
  "invalid bug id returns 400",
  async () => {

    const cookies =
      await createAdminAndLogin();

    const res = await request(app)
      .delete("/api/admin/bugs/invalid-id")
      .set("Cookie", cookies);

    expect(res.status).toBe(400);

    expect(res.body.message)
      .toBe("Invalid bug ID");

  }
);
test(
  "nonexistent bug returns 404",
  async () => {

    const cookies =
      await createAdminAndLogin();

    const fakeId =
      new mongoose.Types.ObjectId();

    const res = await request(app)
      .delete(
        `/api/admin/bugs/${fakeId}`
      )
      .set("Cookie", cookies);

    expect(res.status).toBe(404);

    expect(res.body.message)
      .toBe("Bug not found");

  }
);

export const deleteBug = async (req, res) => {
  try {

    if (
      !mongoose.Types.ObjectId.isValid(
        req.params.id
      )
    ) {
      return res.status(400).json({
        message: "Invalid bug ID",
      });
    }

    const bug =
      await Bug.findByIdAndDelete(
        req.params.id
      );

    if (!bug) {
      return res.status(404).json({
        message: "Bug not found",
      });
    }

    res.json({
      message: "Bug deleted successfully",
    });

  } catch (err) {

    console.error(
      "DELETE BUG ERROR:",
      err
    );

    res.status(500).json({
      message:
        "Server error deleting bug",
    });

  }
};
test(
  "invalid user id returns 400",
  async () => {

    const cookies =
      await createAdminAndLogin();

    const res = await request(app)
      .delete("/api/admin/user/invalid-id")
      .set("Cookie", cookies);

    expect(res.status).toBe(400);

    expect(res.body.message)
      .toBe("Invalid user ID");

  }
);
test(
  "nonexistent user returns 404",
  async () => {

    const cookies =
      await createAdminAndLogin();

    const fakeId =
      new mongoose.Types.ObjectId();

    const res = await request(app)
      .delete(
        `/api/admin/user/${fakeId}`
      )
      .set("Cookie", cookies);

    expect(res.status).toBe(404);

    expect(res.body.message)
      .toBe("User not found");

  }
);
test(
  "invalid submission id returns 400",
  async () => {

    const cookies =
      await createAdminAndLogin();

    const res = await request(app)
      .delete(
        "/api/admin/submissions/invalid-id"
      )
      .set("Cookie", cookies);

    expect(res.status).toBe(400);

    expect(res.body.message)
      .toBe("Invalid submission ID");

  }
);
test(
  "nonexistent submission returns 404",
  async () => {

    const cookies =
      await createAdminAndLogin();

    const fakeId =
      new mongoose.Types.ObjectId();

    const res = await request(app)
      .delete(
        `/api/admin/submissions/${fakeId}`
      )
      .set("Cookie", cookies);

    expect(res.status).toBe(404);

    expect(res.body.message)
      .toBe("Submission not found");

  }
);
test(
  "normal user cannot delete user",
  async () => {

    await User.create({
      name: "User",
      email: "user@gmail.com",
      password: "Password123"
    });

    const loginRes =
      await request(app)
        .post("/api/auth/login")
        .send({
          email: "user@gmail.com",
          password: "Password123"
        });

    const cookies =
      loginRes.headers["set-cookie"];

    const target =
      await User.create({
        name: "Target",
        email: "target@gmail.com",
        password: "Password123"
      });

    const res =
      await request(app)
        .delete(
          `/api/admin/user/${target._id}`
        )
        .set("Cookie", cookies);

    expect(res.status).toBe(403);

  }
);
test(
  "normal user cannot delete submission",
  async () => {

    await User.create({
      name: "User",
      email: "user@gmail.com",
      password: "Password123"
    });

    const loginRes =
      await request(app)
        .post("/api/auth/login")
        .send({
          email: "user@gmail.com",
          password: "Password123"
        });

    const cookies =
      loginRes.headers["set-cookie"];

    const fakeId =
      new mongoose.Types.ObjectId();

    const res =
      await request(app)
        .delete(
          `/api/admin/submissions/${fakeId}`
        )
        .set("Cookie", cookies);

    expect(res.status).toBe(403);

  }
);