import mongoose from "mongoose";

import Solution from "../models/Solution.js";
import Bug from "../models/Bug.js";
import User from "../models/User.js";

import { analyzeComplexity } from "../utils/complexityAnalyzer.js";
import { checkCertification } from "../utils/certificationChecker.js";

////////////////////////////////////////////////////////////
// CREATE SOLUTION
////////////////////////////////////////////////////////////

export const createSolution = async (req, res) => {
  try {

    const { code } = req.body;

    ////////////////////////////////////////////////////////////
    // FIND BUG
    ////////////////////////////////////////////////////////////

    const bug = await Bug.findById(
      req.params.bugId
    ).populate("postedBy");

    if (!bug) {
      return res.status(404).json({
        message: "Bug not found"
      });
    }

    ////////////////////////////////////////////////////////////
    // AI ANALYSIS
    ////////////////////////////////////////////////////////////

    let analysis = {
      timeComplexity: "O(n)",
      spaceComplexity: "O(1)"
    };

    try {

      analysis = await analyzeComplexity(
        code,
        bug.language
      );

    } catch (err) {

      console.log("AI analysis failed");

    }

    ////////////////////////////////////////////////////////////
    // CREATE SOLUTION
    ////////////////////////////////////////////////////////////

    const solution = await Solution.create({

      bugId: bug._id,

      solvedBy: req.user._id,

      fixedCode: code,

      timeComplexity:
        analysis.timeComplexity,

      spaceComplexity:
        analysis.spaceComplexity,

      postedByOwner:
        bug.postedBy?._id
          ? bug.postedBy._id.toString() ===
            req.user._id.toString()
          : bug.postedBy.toString() ===
            req.user._id.toString()

    });

    ////////////////////////////////////////////////////////////
    // PUSH INTO BUG
    ////////////////////////////////////////////////////////////

    bug.solutions.push(solution._id);

    await bug.save();

    ////////////////////////////////////////////////////////////
    // RESPONSE
    ////////////////////////////////////////////////////////////

    res.status(201).json(solution);

  } catch (err) {

    console.error(
      "CREATE SOLUTION ERROR:",
      err
    );

    res.status(500).json({
      message: "Server error"
    });

  }
};

////////////////////////////////////////////////////////////
// ACCEPT SOLUTION
////////////////////////////////////////////////////////////

export const acceptSolution = async (req, res) => {
  try {

    const solution = await Solution.findById(
      req.params.solutionId
    ).populate("bugId");

    if (!solution) {
      return res.status(404).json({
        message: "Solution not found"
      });
    }

    ////////////////////////////////////////////////////////////
    // FIND BUG
    ////////////////////////////////////////////////////////////

    const bug = await Bug.findById(
      solution.bugId
    );

    if (!bug) {
      return res.status(404).json({
        message: "Bug not found"
      });
    }

    ////////////////////////////////////////////////////////////
    // DYNAMIC REWARD
    ////////////////////////////////////////////////////////////

    let reward = 5;

    if (
      solution.bugId?.difficulty === "medium"
    ) {
      reward = 10;
    }

    if (
      solution.bugId?.difficulty === "hard"
    ) {
      reward = 20;
    }

    ////////////////////////////////////////////////////////////
    // AUTHORIZATION
    ////////////////////////////////////////////////////////////

    if (
      bug.postedBy.toString() !==
      req.user._id.toString()
    ) {
      return res.status(403).json({
        message:
          "Only bug owner can accept solutions"
      });
    }

    ////////////////////////////////////////////////////////////
    // REMOVE PREVIOUS ACCEPTED
    ////////////////////////////////////////////////////////////

    const previousAccepted =
      await Solution.findOne({
        bugId: bug._id,
        accepted: true
      });

    if (previousAccepted) {

      previousAccepted.accepted = false;

      await previousAccepted.save();

      await User.findByIdAndUpdate(
        previousAccepted.solvedBy,
        {
          $inc: {
            points: -reward,
            bugsSolved: -1
          }
        }
      );

    }

    ////////////////////////////////////////////////////////////
    // ACCEPT NEW
    ////////////////////////////////////////////////////////////

    solution.accepted = true;

    await solution.save();

    ////////////////////////////////////////////////////////////
    // MARK BUG SOLVED
    ////////////////////////////////////////////////////////////

    bug.solved = true;

    await bug.save();

    ////////////////////////////////////////////////////////////
    // UPDATE USER STATS
    ////////////////////////////////////////////////////////////

    const solver =
      await User.findByIdAndUpdate(
        solution.solvedBy,
        {
          $inc: {
            points: reward,
            bugsSolved: 1
          }
        },
        { returnDocument: "after" }
      );

    ////////////////////////////////////////////////////////////
    // CERTIFICATION CHECK
    ////////////////////////////////////////////////////////////

    if (solver) {
      await checkCertification(solver);
    }

    ////////////////////////////////////////////////////////////
    // RESPONSE
    ////////////////////////////////////////////////////////////

    res.json({
      message:
        "Solution accepted successfully"
    });

  } catch (err) {

    console.error(
      "ACCEPT ERROR:",
      err
    );

    res.status(500).json({
      message: "Server error"
    });

  }
};

////////////////////////////////////////////////////////////
// TOGGLE UPVOTE
////////////////////////////////////////////////////////////

export const toggleUpvote = async (req, res) => {
  try {

    const solution =
      await Solution.findById(req.params.id);

    if (!solution) {
      return res.status(404).json({
        message: "Solution not found"
      });
    }

    ////////////////////////////////////////////////////////////
    // PREVENT SELF UPVOTE
    ////////////////////////////////////////////////////////////

    if (
      solution.solvedBy.toString() ===
      req.user._id.toString()
    ) {
      return res.status(403).json({
        message:
          "You cannot upvote your own solution"
      });
    }

    ////////////////////////////////////////////////////////////
    // CHECK ALREADY UPVOTED
    ////////////////////////////////////////////////////////////

    const alreadyUpvoted =
      solution.upvotes.some(
        id =>
          id.toString() ===
          req.user._id.toString()
      );

    ////////////////////////////////////////////////////////////
    // REMOVE UPVOTE
    ////////////////////////////////////////////////////////////

    if (alreadyUpvoted) {

      solution.upvotes =
        solution.upvotes.filter(
          id =>
            id.toString() !==
            req.user._id.toString()
        );

      solution.upvoteCount = Math.max(
        solution.upvotes.length,
        0
      );

      await User.findByIdAndUpdate(
        solution.solvedBy,
        {
          $inc: { points: -2 }
        }
      );

    } else {

      //////////////////////////////////////////////////////////
      // ADD UPVOTE
      //////////////////////////////////////////////////////////

      solution.upvotes.push(
        req.user._id
      );

      solution.upvoteCount =
        solution.upvotes.length;

      await User.findByIdAndUpdate(
        solution.solvedBy,
        {
          $inc: { points: 2 }
        }
      );

    }

    ////////////////////////////////////////////////////////////
    // SAVE
    ////////////////////////////////////////////////////////////

    await solution.save();

    ////////////////////////////////////////////////////////////
    // RESPONSE
    ////////////////////////////////////////////////////////////

    res.json({
      upvoteCount:
        solution.upvoteCount,

      upvoted:
        !alreadyUpvoted
    });

  } catch (err) {

    console.error(
      "UPVOTE ERROR:",
      err
    );

    res.status(500).json({
      message: "Server error"
    });

  }
};

////////////////////////////////////////////////////////////
// DELETE SOLUTION
////////////////////////////////////////////////////////////

export const deleteSolution = async (req, res) => {
  try {

    const solution =
      await Solution.findById(req.params.id);

    if (!solution) {
      return res.status(404).json({
        message: "Solution not found"
      });
    }

    ////////////////////////////////////////////////////////////
    // AUTHORIZATION
    ////////////////////////////////////////////////////////////

    if (
      solution.solvedBy.toString() !==
      req.user._id.toString()
    ) {
      return res.status(403).json({
        message: "Not authorized"
      });
    }

    ////////////////////////////////////////////////////////////
    // REMOVE FROM BUG
    ////////////////////////////////////////////////////////////

    await Bug.findByIdAndUpdate(
      solution.bugId,
      {
        $pull: {
          solutions: solution._id
        }
      }
    );

    ////////////////////////////////////////////////////////////
    // DELETE SOLUTION
    ////////////////////////////////////////////////////////////

    await Solution.findByIdAndDelete(
      req.params.id
    );

    ////////////////////////////////////////////////////////////
    // RESPONSE
    ////////////////////////////////////////////////////////////

    res.json({
      message:
        "Solution deleted successfully"
    });

  } catch (err) {

    console.error(
      "DELETE ERROR:",
      err
    );

    res.status(500).json({
      message: "Server error"
    });

  }
};

////////////////////////////////////////////////////////////
// GET BUG SOLUTIONS
////////////////////////////////////////////////////////////

export const getBugSolutions = async (req, res) => {
  try {

    const solutions =
      await Solution.find({
        bugId: req.params.bugId
      })
        .populate(
          "solvedBy",
          "name email"
        )
        .sort({

          postedByOwner: -1,

          accepted: -1,

          upvoteCount: -1

        });

    res.json(solutions);

  } catch (err) {

    console.error(
      "GET SOLUTIONS ERROR:",
      err
    );

    res.status(500).json({
      message: "Server error"
    });

  }
};

////////////////////////////////////////////////////////////
// GET MY SOLUTIONS
////////////////////////////////////////////////////////////

export const getMySolutions = async (req, res) => {
  try {

    const solutions =
      await Solution.find({
        solvedBy: req.user._id
      })
        .populate(
          "bugId",
          "title language topic"
        )
        .sort({
          createdAt: -1
        });

    res.json(solutions);

  } catch (err) {

    console.error(
      "GET MY SOLUTIONS ERROR:",
      err
    );

    res.status(500).json({
      message: "Server error"
    });

  }
};