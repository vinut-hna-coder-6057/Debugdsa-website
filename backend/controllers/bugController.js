import mongoose from "mongoose";

import Bug from "../models/Bug.js";
import Solution from "../models/Solution.js";

import { analyzeComplexity } from "../utils/complexityAnalyzer.js";

////////////////////////////////////////////////////////////
// TEST ROUTE
////////////////////////////////////////////////////////////

export const testBugRoute = (req, res) => {
  res.send("Bug route working ✅");
};

////////////////////////////////////////////////////////////
// CREATE BUG
////////////////////////////////////////////////////////////

export const createBug = async (req, res) => {
  try {
    const {
      title,
      description,
      code,
      language,
      topic,
      error,
      expectedOutput,
    } = req.body;

    ////////////////////////////////////////////////////////////
    // VALIDATION
    ////////////////////////////////////////////////////////////

    if (
      !title ||
      !description ||
      !code ||
      !language ||
      !topic ||
      !error ||
      !expectedOutput
    ) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided",
      });
    }

    ////////////////////////////////////////////////////////////
    // AI COMPLEXITY ANALYSIS
    ////////////////////////////////////////////////////////////

    let analysis = {
      timeComplexity: "O(n)",
      spaceComplexity: "O(1)",
      explanation: "AI analysis unavailable",
    };

    try {
      const aiResult = await analyzeComplexity(code, language);

      if (aiResult) {
        analysis = aiResult;
      }
    } catch (aiError) {
      console.error(
        "AI ANALYSIS FAILED:",
        aiError.message
      );
    }

    ////////////////////////////////////////////////////////////
    // CREATE BUG
    ////////////////////////////////////////////////////////////

    const bug = await Bug.create({
      title,
      description,
      code,
      language,
      topic,
      error,
      expectedOutput,
      postedBy: req.user._id,

      aiTimeComplexity: analysis.timeComplexity,
      aiSpaceComplexity: analysis.spaceComplexity,
      aiExplanation: analysis.explanation,
    });

    res.status(201).json({
      success: true,
      message: "Bug created successfully 🎉",
      bug,
    });

  } catch (err) {
    console.error("BUG CREATE ERROR:", err);

    res.status(500).json({
      success: false,
      message:
        err.message ||
        "Server error while creating bug",
    });
  }
};

////////////////////////////////////////////////////////////
// GET ALL BUGS
////////////////////////////////////////////////////////////

export const getAllBugs = async (req, res) => {
  try {
    const bugs = await Bug.find()
      .populate({
        path: "postedBy",
        select: "name",
        strictPopulate: false,
      })
      .sort({ createdAt: -1 });

    res.status(200).json(bugs);

  } catch (err) {
    console.error("GET BUGS ERROR:", err);

    res.status(500).json({
      message:
        err.message ||
        "Server error while fetching bugs",
    });
  }
};

////////////////////////////////////////////////////////////
// GET MY BUGS
////////////////////////////////////////////////////////////

export const getMyBugs = async (req, res) => {
  try {
    const bugs = await Bug.find({
      postedBy: req.user._id,
    })
      .populate("postedBy", "name")
      .sort({ createdAt: -1 });

    res.status(200).json(bugs);

  } catch (err) {
    console.error("GET MY BUGS ERROR:", err);

    res.status(500).json({
      message:
        "Server error while fetching your bugs",
    });
  }
};

////////////////////////////////////////////////////////////
// GET SINGLE BUG
////////////////////////////////////////////////////////////

export const getSingleBug = async (req, res) => {
  try {
    const { id } = req.params;

    ////////////////////////////////////////////////////////////
    // VALIDATE ID
    ////////////////////////////////////////////////////////////

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid bug ID",
      });
    }

    ////////////////////////////////////////////////////////////
    // FETCH BUG
    ////////////////////////////////////////////////////////////

    const bug = await Bug.findById(id)
      .populate("postedBy", "name");

    if (!bug) {
      return res.status(404).json({
        message: "Bug not found",
      });
    }

    ////////////////////////////////////////////////////////////
    // FETCH SOLUTIONS
    ////////////////////////////////////////////////////////////

    let solutions = await Solution.find({
      bugId: bug._id,
    })
      .populate(
        "solvedBy",
        "name points bugsSolved"
      )
      .lean();

    ////////////////////////////////////////////////////////////
    // COMPLEXITY MAP
    ////////////////////////////////////////////////////////////

    const complexityMap = {
      "O(1)": 1,
      "O(log n)": 2,
      "O(n)": 3,
      "O(n log n)": 4,
      "O(n^2)": 5,
      "O(2^n)": 6,
      "O(n!)": 7,
    };

    ////////////////////////////////////////////////////////////
    // SORT SOLUTIONS
    ////////////////////////////////////////////////////////////

    solutions = solutions
      .map((sol) => ({
        ...sol,
        complexityScore:
          complexityMap[sol.timeComplexity] || 100,
      }))
      .sort((a, b) => {

        if (a.accepted !== b.accepted) {
          return b.accepted - a.accepted;
        }

        if (b.upvoteCount !== a.upvoteCount) {
          return b.upvoteCount - a.upvoteCount;
        }

        return (
          a.complexityScore -
          b.complexityScore
        );
      });

    ////////////////////////////////////////////////////////////
    // RESPONSE
    ////////////////////////////////////////////////////////////

    res.status(200).json({
      bug,
      solutions,
    });

  } catch (err) {
    console.error(
      "GET SINGLE BUG ERROR:",
      err
    );

    res.status(500).json({
      message:
        "Server error while fetching bug",
    });
  }
};

////////////////////////////////////////////////////////////
// DELETE BUG
////////////////////////////////////////////////////////////

export const deleteBug = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid bug ID",
      });
    }

    const bug = await Bug.findById(id);

    if (!bug) {
      return res.status(404).json({
        message: "Bug not found",
      });
    }

    ////////////////////////////////////////////////////////////
    // AUTHORIZATION
    ////////////////////////////////////////////////////////////

    if (
      bug.postedBy.toString() !==
        req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        message:
          "Not authorized to delete this bug",
      });
    }

    ////////////////////////////////////////////////////////////
    // DELETE RELATED SOLUTIONS
    ////////////////////////////////////////////////////////////

    await Solution.deleteMany({
      bugId: bug._id,
    });

    ////////////////////////////////////////////////////////////
    // DELETE BUG
    ////////////////////////////////////////////////////////////

    await bug.deleteOne();

    res.status(200).json({
      message: "Bug deleted successfully",
    });

  } catch (err) {
    console.error("DELETE BUG ERROR:", err);

    res.status(500).json({
      message:
        "Server error while deleting bug",
    });
  }
};