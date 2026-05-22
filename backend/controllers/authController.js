import jwt from "jsonwebtoken";
import User from "../models/User.js";
import admin from "../config/firebase.js";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import sendEmail from "../utils/sendEmail.js";
import { OAuth2Client } from "google-auth-library";
////////////////////////////////////////////////////////////
// ENV VALIDATION
////////////////////////////////////////////////////////////

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET missing in .env");
}

if (!process.env.JWT_REFRESH_SECRET) {
  throw new Error("JWT_REFRESH_SECRET missing in .env");
}
const client = new OAuth2Client(
process.env.GOOGLE_CLIENT_ID
);
////////////////////////////////////////////////////////////
// TOKEN GENERATION
////////////////////////////////////////////////////////////

const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );
};

////////////////////////////////////////////////////////////
// COOKIE OPTIONS
////////////////////////////////////////////////////////////

const isProd = process.env.NODE_ENV === "production";

const accessCookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? "none" : "lax",
  maxAge: 15 * 60 * 1000
};

const refreshCookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000
};

////////////////////////////////////////////////////////////
// FIREBASE LOGIN
////////////////////////////////////////////////////////////

export const firebaseLogin = async (req, res) => {
  try {

    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Firebase token required"
      });
    }

    const decoded = await admin.auth().verifyIdToken(token);

    const email = decoded.email;
    const name = decoded.name || "User";

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Invalid Firebase token"
      });
    }

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name,
        email,
        password: Math.random().toString(36)
      });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    user.password = undefined;
    user.refreshToken = undefined;

    res
      .cookie("accessToken", accessToken, accessCookieOptions)
      .cookie("refreshToken", refreshToken, refreshCookieOptions)
      .status(200)
      .json({
        success: true,
        message: "Firebase login successful",
        user
      });

  } catch (error) {

    console.error("FIREBASE LOGIN ERROR:", error);

    res.status(401).json({
      success: false,
      message: "Firebase authentication failed"
    });

  }
};
export const googleCallback = async (req, res) => {
  try {
    if (!req.user) {
      return res.redirect(
        `${process.env.FRONTEND_URL}/login`
      );
    }

    const token = jwt.sign(
      { id: req.user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.redirect(
      `${process.env.FRONTEND_URL}/oauth-success?token=${token}`
    );

  } catch (error) {

    console.error(
      "GOOGLE CALLBACK ERROR:",
      error
    );

    res.redirect(
      `${process.env.FRONTEND_URL}/login`
    );
  }
};
////////////////////////////////////////////////////////////
// REGISTER
////////////////////////////////////////////////////////////

export const register = async (req, res) => {
  try {

    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required"
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists"
      });
    }

    const user = await User.create({
      name,
      email,
      password
    });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    user.password = undefined;
    user.refreshToken = undefined;

    res
      .cookie("accessToken", accessToken, accessCookieOptions)
      .cookie("refreshToken", refreshToken, refreshCookieOptions)
      .status(201)
      .json({
        success: true,
        message: "User registered successfully",
        user
      });

  } catch (error) {

    console.error("REGISTER ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Server error during registration"
    });

  }
};

export const forgotPassword = async (req, res) => {

try {

const { email } = req.body;

const user = await User.findOne({ email });

if (!user) {

return res.status(404).json({

success:false,
message:"User not found"

});

}

const resetToken = crypto
.randomBytes(32)
.toString("hex");

const hashedToken = crypto
.createHash("sha256")
.update(resetToken)
.digest("hex");

user.passwordResetToken = hashedToken;

user.passwordResetExpires =
Date.now() + 15 * 60 * 1000;

await user.save();

const resetUrl =
`http://192.168.0.9:3000/reset-password/${resetToken}`;

const message = `
<h2>Password Reset</h2>

<p>Click below:</p>

<a href="${resetUrl}">
${resetUrl}
</a>
`;

await sendEmail({

email:user.email,
subject:"Reset Password",
message

});

res.json({

success:true,
message:"Reset email sent"

});

} catch (error) {

console.log(error);

res.status(500).json({

success:false,
message:"Server Error"

});

}

};


export const resetPassword = async (req, res) => {

try {

const hashedToken = crypto
.createHash("sha256")
.update(req.params.token)
.digest("hex");

const user = await User.findOne({

passwordResetToken: hashedToken,

passwordResetExpires: {
$gt: Date.now()
}

}).select("+password");

if (!user) {

return res.status(400).json({

success:false,
message:"Token expired"

});

}

user.password = req.body.password;

user.passwordResetToken = undefined;

user.passwordResetExpires = undefined;

await user.save({ validateBeforeSave: false });

res.json({

success:true,
message:"Password reset successful"

});

} catch (error) {

console.log(error);

res.status(500).json({

success:false,
message:"Server Error"

});

}

};

////////////////////////////////////////////////////////////
// LOGIN
////////////////////////////////////////////////////////////

export const login = async (req, res) => {
  try {

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    const user = await User.findOne({ email })
      .select("+password +refreshToken");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    user.password = undefined;
    user.refreshToken = undefined;

    res
      .cookie("accessToken", accessToken, accessCookieOptions)
      .cookie("refreshToken", refreshToken, refreshCookieOptions)
      .status(200)
      .json({
        success: true,
        message: "Login successful",
        user
      });

  } catch (error) {

    console.error("LOGIN ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Server error during login"
    });

  }
};

////////////////////////////////////////////////////////////
// REFRESH TOKEN
////////////////////////////////////////////////////////////

export const refreshAccessToken = async (req, res) => {
  try {

    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token required"
      });
    }

    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET
    );

    const user = await User.findById(decoded.id)
      .select("+refreshToken");

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({
        success: false,
        message: "Invalid refresh token"
      });
    }

    const newAccessToken = generateAccessToken(user);

    res
      .cookie("accessToken", newAccessToken, accessCookieOptions)
      .status(200)
      .json({
        success: true,
        message: "Access token refreshed"
      });

  } catch (error) {

    console.error("REFRESH ERROR:", error);

    res.status(403).json({
      success: false,
      message: "Refresh token expired or invalid"
    });

  }
};

////////////////////////////////////////////////////////////
// LOGOUT
////////////////////////////////////////////////////////////

export const logout = async (req, res) => {
  try {

    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {

      try {

        const decoded = jwt.verify(
          refreshToken,
          process.env.JWT_REFRESH_SECRET
        );

        await User.findByIdAndUpdate(decoded.id, {
          refreshToken: null
        });

      } catch {
        console.log("Refresh token already expired");
      }

    }

    res
      .clearCookie("accessToken", accessCookieOptions)
      .clearCookie("refreshToken", refreshCookieOptions)
      .status(200)
      .json({
        success: true,
        message: "Logged out successfully"
      });

  } catch (error) {

    console.error("LOGOUT ERROR:", error);

    res.status(200).json({
      success: true,
      message: "Logged out"
    });

  }
};