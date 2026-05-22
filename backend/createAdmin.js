import mongoose from "mongoose";
import dotenv from "dotenv";

import User from "./models/User.js";

dotenv.config();

async function createAdmin() {
  try {

    await mongoose.connect(
      process.env.MONGO_URI
    );

    console.log("MongoDB connected");

    //////////////////////////////////////////////////
    // CHECK EXISTING ADMIN
    //////////////////////////////////////////////////

    const existingAdmin =
      await User.findOne({
        email: process.env.ADMIN_EMAIL
      });

    if (existingAdmin) {

      console.log(
        "Admin already exists"
      );

      process.exit();

    }

    //////////////////////////////////////////////////
    // CREATE ADMIN
    //////////////////////////////////////////////////

    const admin = new User({
      name: "Super Admin",

      email:
        process.env.ADMIN_EMAIL,

      password:
        process.env.ADMIN_PASSWORD,

      role: "admin",
    });

    await admin.save();

    console.log(
      "✅ Admin Created Successfully"
    );

    process.exit();

  } catch (error) {

    console.log(error);

    process.exit(1);

  }
}

createAdmin();