import mongoose from "mongoose";

import User from "../models/User.js";
import Bug from "../models/Bug.js";
import Solution from "../models/Solution.js";

////////////////////////////////////////////////////////////
// TEST ROUTE
////////////////////////////////////////////////////////////

export const testUserRoute = (req, res) => {
  res.send("User route working");
};

////////////////////////////////////////////////////////////
// GET ALL USERS (ADMIN)
////////////////////////////////////////////////////////////

export const getAllUsers = async (req, res) => {
  try {

    const users = await User.find()
      .select("-password -refreshToken");

    res.json(users);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: "Server error"
    });

  }
};

////////////////////////////////////////////////////////////
// LEADERBOARD
////////////////////////////////////////////////////////////

export const getLeaderboard = async (req, res) => {
  try {

    const users = await User.find().select(
      "name points bugsSolved badges certified certificationLevel"
    );

    const leaderboard = await Promise.all(

      users.map(async (user) => {

        const upvotes =
          await Solution.aggregate([
            {
              $match: {
                solvedBy: user._id
              }
            },
            {
              $group: {
                _id: null,
                total: {
                  $sum: "$upvoteCount"
                }
              }
            }
          ]);

        return {
          ...user.toObject(),
          totalUpvotes:
            upvotes[0]?.total || 0,
        };

      })

    );

    leaderboard.sort((a, b) => {

      if (b.points !== a.points) {
        return b.points - a.points;
      }

      if (
        b.bugsSolved !== a.bugsSolved
      ) {
        return (
          b.bugsSolved - a.bugsSolved
        );
      }

      return (
        b.totalUpvotes -
        a.totalUpvotes
      );

    });

    res.json(
      leaderboard.slice(0, 50)
    );

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: "Server error"
    });

  }
};

////////////////////////////////////////////////////////////
// MY PROFILE
////////////////////////////////////////////////////////////

export const getMyProfile = async (req, res) => {
  try {

    const user = await User.findById(
      req.user._id
    ).select(
      "-password -refreshToken"
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    const bugsPosted =
      await Bug.find({
        postedBy: user._id
      });

    const solutions =
      await Solution.find({
        solvedBy: user._id
      });

    const totalUpvotes =
      solutions.reduce(
        (sum, s) =>
          sum + (s.upvoteCount || 0),
        0
      );

    res.json({
      user,
      stats: {
        followers:
          user.followers.length,

        following:
          user.following.length,

        points: user.points,

        bugsSolved:
          user.bugsSolved,

        totalUpvotes,
      },
      bugsPosted,
      solutions,
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: "Server error"
    });

  }
};

////////////////////////////////////////////////////////////
// GET PROFILE BY ID
////////////////////////////////////////////////////////////

export const getUserProfile = async (req, res) => {
  try {

    if (
      !mongoose.Types.ObjectId.isValid(
        req.params.id
      )
    ) {
      return res.status(400).json({
        message: "Invalid user ID"
      });
    }

    const user = await User.findById(
      req.params.id
    ).select(
      "name points bugsSolved followers following badges"
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    const upvotes =
      await Solution.aggregate([
        {
          $match: {
            solvedBy: user._id
          }
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: "$upvoteCount"
            }
          }
        }
      ]);

    res.json({
      ...user.toObject(),
      totalUpvotes:
        upvotes[0]?.total || 0
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: "Server error"
    });

  }
};

////////////////////////////////////////////////////////////
// EDIT PROFILE
////////////////////////////////////////////////////////////

export const editProfile = async (req, res) => {
  try {

    const { name } = req.body;

    if (
      !name ||
      name.trim().length < 2
    ) {
      return res.status(400).json({
        message:
          "Valid name required"
      });
    }

    const user =
      await User.findByIdAndUpdate(
        req.user._id,
        {
          name: name.trim()
        },
       { returnDocument: "after" }
      ).select(
        "-password -refreshToken"
      );

    res.json(user);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: "Server error"
    });

  }
};

////////////////////////////////////////////////////////////
// FOLLOW USER
////////////////////////////////////////////////////////////

export const followUser = async (req, res) => {
  try {

    const targetId =
      req.params.id;

    const currentUserId =
      req.user._id;

    if (
      !mongoose.Types.ObjectId.isValid(
        targetId
      )
    ) {
      return res.status(400).json({
        message: "Invalid user ID"
      });
    }

    if (
      targetId ===
      currentUserId.toString()
    ) {
      return res.status(400).json({
        message:
          "Cannot follow yourself"
      });
    }

    const userToFollow =
      await User.findById(targetId);

    const currentUser =
      await User.findById(
        currentUserId
      );

    if (
      !userToFollow ||
      !currentUser
    ) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    if (
      currentUser.following.includes(
        targetId
      )
    ) {
      return res.status(400).json({
        message:
          "Already following"
      });
    }

    currentUser.following.push(
      targetId
    );

    userToFollow.followers.push(
      currentUserId
    );

    await currentUser.save();

    await userToFollow.save();

    res.json({
      message:
        "Followed successfully",

      followers:
        userToFollow.followers.length
    });

  } catch (err) {

    console.error(
      "FOLLOW ERROR:",
      err
    );

    res.status(500).json({
      message: "Server error"
    });

  }
};

////////////////////////////////////////////////////////////
// UNFOLLOW USER
////////////////////////////////////////////////////////////

export const unfollowUser = async (req, res) => {
  try {

    const targetId =
      req.params.id;

    const currentUserId =
      req.user._id;

    const userToUnfollow =
      await User.findById(targetId);

    const currentUser =
      await User.findById(
        currentUserId
      );

    if (
      !userToUnfollow ||
      !currentUser
    ) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    currentUser.following =
      currentUser.following.filter(
        id =>
          id.toString() !==
          targetId
      );

    userToUnfollow.followers =
      userToUnfollow.followers.filter(
        id =>
          id.toString() !==
          currentUserId.toString()
      );

    await currentUser.save();

    await userToUnfollow.save();

    res.json({
      message:
        "Unfollowed successfully",

      followers:
        userToUnfollow.followers.length
    });

  } catch (err) {

    console.error(
      "UNFOLLOW ERROR:",
      err
    );

    res.status(500).json({
      message: "Server error"
    });

  }
};

////////////////////////////////////////////////////////////
// BUGS SOLVED LIST
////////////////////////////////////////////////////////////

export const getSolvedBugs = async (req, res) => {
  try {

    const solutions =
      await Solution.find({
        solvedBy: req.user._id
      })
        .populate({
          path: "bugId",
          select:
            "title topic difficulty points",
        })
        .sort({
          createdAt: -1
        });

    const bugs = solutions
      .filter(s => s.bugId)
      .map(s => ({
        _id: s.bugId._id,

        title: s.bugId.title,

        topic: s.bugId.topic,

        difficulty:
          s.bugId.difficulty,

        points:
          s.pointsAwarded ||
          s.bugId.points ||
          10,

        solvedAt:
          s.createdAt
      }));

    res.json(bugs);

  } catch (err) {

    console.error(
      "BUGS ERROR:",
      err
    );

    res.status(500).json({
      message: "Server error"
    });

  }
};

////////////////////////////////////////////////////////////
// POINTS BREAKDOWN
////////////////////////////////////////////////////////////

export const getPointsBreakdown = async (req, res) => {
  try {

    const solutions =
      await Solution.find({
        solvedBy: req.user._id
      })
        .populate({
          path: "bugId",
          select:
            "title topic difficulty",
        })
        .sort({
          createdAt: -1
        });

    const data = solutions.map(
      (s) => ({
        bugTitle:
          s.bugId?.title ||
          "Unknown Bug",

        topic:
          s.bugId?.topic || "-",

        difficulty:
          s.bugId?.difficulty ||
          "-",

        points:
          s.pointsAwarded ||
          s.bugId?.points ||
          10,

        createdAt:
          s.createdAt,
      })
    );

    res.json(data);

  } catch (err) {

    console.error(
      "POINTS ERROR:",
      err
    );

    res.status(500).json({
      message: "Server error"
    });

  }
};

////////////////////////////////////////////////////////////
// UPVOTES BREAKDOWN
////////////////////////////////////////////////////////////

export const getUpvotesBreakdown = async (req, res) => {
  try {

    const solutions =
      await Solution.find({
        solvedBy: req.user._id
      }).populate({
        path: "bugId",
        select: "title"
      });

    const data = solutions.map(
      (s) => ({
        bugTitle:
          s.bugId?.title ||
          "Unknown Bug",

        upvotes:
          s.upvoteCount || 0,
      })
    );

    res.json(data);

  } catch (err) {

    console.error(
      "UPVOTES ERROR:",
      err
    );

    res.status(500).json({
      message: "Server error"
    });

  }
};

////////////////////////////////////////////////////////////
// FOLLOWERS
////////////////////////////////////////////////////////////

export const getFollowers = async (req, res) => {
  try {

    const user =
      await User.findById(
        req.user._id
      ).populate(
        "followers",
        "name points bugsSolved"
      );

    res.json(user.followers);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: "Server error"
    });

  }
};

////////////////////////////////////////////////////////////
// FOLLOWING
////////////////////////////////////////////////////////////

export const getFollowing = async (req, res) => {
  try {

    const user =
      await User.findById(
        req.user._id
      ).populate(
        "following",
        "name points bugsSolved"
      );

    res.json(user.following);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: "Server error"
    });

  }
};

////////////////////////////////////////////////////////////
// GET CURRENT USER SOLUTION FOR BUG
////////////////////////////////////////////////////////////

export const getMyBugSolution = async (req, res) => {
  try {

    const { bugId } =
      req.params;

    if (
      !mongoose.Types.ObjectId.isValid(
        bugId
      )
    ) {
      return res.status(400).json({
        message: "Invalid bug ID"
      });
    }

    const solution =
      await Solution.findOne({
        bugId,
        solvedBy: req.user._id
      });

    if (!solution) {
      return res.status(404).json({
        message:
          "Solution not found"
      });
    }

    res.json(solution);

  } catch (err) {

    console.error(
      "GET SOLUTION ERROR:",
      err
    );

    res.status(500).json({
      message: "Server error"
    });

  }
};