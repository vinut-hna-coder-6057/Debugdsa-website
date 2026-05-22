import jwt from "jsonwebtoken";
import User from "../models/User.js";

////////////////////////////////////////////////////////////
//////////////////// PROTECT ROUTES ////////////////////////
////////////////////////////////////////////////////////////

export const protect = async (req, res, next) => {

  try {

    let token;

    ////////////////////////////////////////////////////////
    // 1️⃣ CHECK COOKIE
    ////////////////////////////////////////////////////////

    if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    ////////////////////////////////////////////////////////
    // 2️⃣ CHECK AUTH HEADER (fallback)
    ////////////////////////////////////////////////////////

    if (!token && req.headers.authorization) {

      if (req.headers.authorization.startsWith("Bearer")) {

        token = req.headers.authorization.split(" ")[1];

      }

    }

    ////////////////////////////////////////////////////////
    // 3️⃣ TOKEN MISSING
    ////////////////////////////////////////////////////////

    if (!token) {

      return res.status(401).json({
        message: "Not authorized. No token provided."
      });

    }

    ////////////////////////////////////////////////////////
    // 4️⃣ VERIFY TOKEN
    ////////////////////////////////////////////////////////

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id)
      .select("-password -refreshToken");

    if (!user) {

      return res.status(401).json({
        message: "User no longer exists."
      });

    }

    req.user = user;

    next();

  } catch (error) {

    console.error("AUTH ERROR:", error);

    return res.status(401).json({
      message: "Invalid or expired token."
    });

  }

};

////////////////////////////////////////////////////////////
//////////////////// ROLE BASED ACCESS /////////////////////
////////////////////////////////////////////////////////////

export const authorize = (...roles) => {

  return (req, res, next) => {

    if (!roles.includes(req.user.role)) {

      return res.status(403).json({
        message: "You do not have permission to perform this action."
      });

    }

    next();

  };

};