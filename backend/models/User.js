import mongoose from "mongoose";
import bcrypt from "bcryptjs";

////////////////////////////////////////////////////////////
// CONSTANTS
////////////////////////////////////////////////////////////

const SALT_ROUNDS = 12;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 2 * 60 * 60 * 1000;

////////////////////////////////////////////////////////////
// USER SCHEMA
////////////////////////////////////////////////////////////

const userSchema = new mongoose.Schema(
{
////////////////////////////////////////////////////////////
// BASIC INFO
////////////////////////////////////////////////////////////

name: {
  type: String,
  required: [true, "Name is required"],
  trim: true,
  minlength: 2,
  maxlength: 50
},

email: {
  type: String,
  required: [true, "Email is required"],
  unique: true,
  lowercase: true,
  trim: true,
  match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
  index: true
},

password: {
  type: String,
  required: [true, "Password is required"],
  minlength: 6,
  select: false
},

////////////////////////////////////////////////////////////
// ACCOUNT CONTROL
////////////////////////////////////////////////////////////

role: {
  type: String,
  enum: ["user", "admin", "donor"],
  default: "user"
},

isActive: {
  type: Boolean,
  default: true,
  select: false
},

////////////////////////////////////////////////////////////
// SECURITY
////////////////////////////////////////////////////////////

refreshToken: {
  type: String,
  select: false
},

passwordChangedAt: Date,

passwordResetToken: String,

passwordResetExpires: Date,

loginAttempts: {
  type: Number,
  default: 0,
  select: false
},

lockUntil: {
  type: Date,
  select: false
},

////////////////////////////////////////////////////////////
// GAMIFICATION
////////////////////////////////////////////////////////////

points: {
  type: Number,
  default: 0,
  index: true
},

bugsSolved: {
  type: Number,
  default: 0
},

////////////////////////////////////////////////////////////
// BATTLE LEADERBOARD
////////////////////////////////////////////////////////////

battlePoints: {
  type: Number,
  default: 0,
  index: true
},

////////////////////////////////////////////////////////////
// CERTIFICATION
////////////////////////////////////////////////////////////

certified: {
  type: Boolean,
  default: false
},

certificationDate: Date,

certificationLevel: {
  type: String,
  default: null
},

////////////////////////////////////////////////////////////
// FOLLOW SYSTEM
////////////////////////////////////////////////////////////

followers: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
],

following: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
],

////////////////////////////////////////////////////////////
// BADGES
////////////////////////////////////////////////////////////

badges: [
  {
    name: {
      type: String,
      required: true
    },
    description: String,
    earnedAt: {
      type: Date,
      default: Date.now
    }
  }
],

////////////////////////////////////////////////////////////
// NOTIFICATIONS
////////////////////////////////////////////////////////////

notifications: [
  {
    message: {
      type: String,
      required: true,
      maxlength: 300
    },
    read: {
      type: Boolean,
      default: false
    },
    bugId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bug"
    },
    solutionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Solution"
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }
]

},
{ timestamps: true }
);

////////////////////////////////////////////////////////////
// INDEXES
////////////////////////////////////////////////////////////

userSchema.index({ createdAt: -1 });
userSchema.index({ points: -1 });
userSchema.index({ battlePoints: -1 });

////////////////////////////////////////////////////////////
// VIRTUALS
////////////////////////////////////////////////////////////

userSchema.virtual("followerCount").get(function () {
  return this.followers?.length || 0;
});

userSchema.virtual("followingCount").get(function () {
  return this.following?.length || 0;
});

userSchema.virtual("badgeCount").get(function () {
  return this.badges?.length || 0;
});

////////////////////////////////////////////////////////////
// PASSWORD HASHING
////////////////////////////////////////////////////////////

userSchema.pre("save", async function () {

  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(SALT_ROUNDS);

  this.password = await bcrypt.hash(this.password, salt);

});

////////////////////////////////////////////////////////////
// PASSWORD CHANGE TIME
////////////////////////////////////////////////////////////

userSchema.pre("save", function () {

  if (!this.isModified("password") || this.isNew) return;

  this.passwordChangedAt = Date.now() - 1000;

});

////////////////////////////////////////////////////////////
// PASSWORD COMPARISON
////////////////////////////////////////////////////////////

userSchema.methods.comparePassword = async function (enteredPassword) {

  if (!this.password) {
    throw new Error("Password not loaded");
  }

  return bcrypt.compare(enteredPassword, this.password);

};

////////////////////////////////////////////////////////////
// PASSWORD CHANGE CHECK
////////////////////////////////////////////////////////////

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {

  if (this.passwordChangedAt) {

    const changedTimestamp =
      parseInt(this.passwordChangedAt.getTime() / 1000, 10);

    return JWTTimestamp < changedTimestamp;

  }

  return false;

};

////////////////////////////////////////////////////////////
// ACCOUNT LOCK
////////////////////////////////////////////////////////////

userSchema.methods.isLocked = function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

userSchema.methods.incrementLoginAttempts = async function () {

  if (this.lockUntil && this.lockUntil < Date.now()) {

    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });

  }

  const updates = { $inc: { loginAttempts: 1 } };

  if (this.loginAttempts + 1 >= MAX_LOGIN_ATTEMPTS) {

    updates.$set = { lockUntil: Date.now() + LOCK_TIME };

  }

  return this.updateOne(updates);

};

////////////////////////////////////////////////////////////
// FOLLOW METHODS
////////////////////////////////////////////////////////////

userSchema.methods.followUser = function (targetUserId) {

  if (!this.following.includes(targetUserId)) {
    this.following.push(targetUserId);
  }

};

userSchema.methods.unfollowUser = function (targetUserId) {

  this.following = this.following.filter(
    id => id.toString() !== targetUserId.toString()
  );

};

////////////////////////////////////////////////////////////
// CLEAN OUTPUT
////////////////////////////////////////////////////////////

userSchema.set("toJSON", {

  virtuals: true,

  transform: function (doc, ret) {

    delete ret.password;
    delete ret.refreshToken;
    delete ret.passwordResetToken;
    delete ret.passwordResetExpires;
    delete ret.__v;

    return ret;

  }

});

////////////////////////////////////////////////////////////
// EXPORT MODEL
////////////////////////////////////////////////////////////

const User = mongoose.model("User", userSchema);

export default User;