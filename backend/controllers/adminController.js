import User from "../models/User.js";
import Bug from "../models/Bug.js";
import Solution from "../models/Solution.js";

//////////////////////////////////////////////////
// USERS
//////////////////////////////////////////////////

export const getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password -refreshToken");

    res.json({ users });
  } catch (err) {
    console.error("GET USERS ERROR:", err);

    res.status(500).json({
      message: "Server error fetching users",
    });
  }
};

export const deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);

    res.json({
      message: "User deleted successfully",
    });
  } catch (err) {
    console.error("DELETE USER ERROR:", err);

    res.status(500).json({
      message: "Server error deleting user",
    });
  }
};

//////////////////////////////////////////////////
// BUGS
//////////////////////////////////////////////////

export const getBugs = async (req, res) => {
  try {
    const bugs = await Bug.find()
      .populate("postedBy", "name email")
      .sort({ createdAt: -1 });

    res.json(bugs);
  } catch (err) {
    console.error("GET BUGS ERROR:", err);

    res.status(500).json({
      message: "Server error fetching bugs",
    });
  }
};

export const deleteBug = async (req, res) => {
  try {
    await Bug.findByIdAndDelete(req.params.id);

    res.json({
      message: "Bug deleted successfully",
    });
  } catch (err) {
    console.error("DELETE BUG ERROR:", err);

    res.status(500).json({
      message: "Server error deleting bug",
    });
  }
};

//////////////////////////////////////////////////
// SUBMISSIONS
//////////////////////////////////////////////////

export const getSubmissions = async (req, res) => {
  try {
    const subs = await Solution.find()
      .populate("solvedBy", "name email")
      .populate("bugId", "title");

    res.json(subs);
  } catch (err) {
    console.error("GET SUBMISSIONS ERROR:", err);

    res.status(500).json({
      message: "Server error fetching submissions",
    });
  }
};

export const deleteSubmission = async (req, res) => {
  try {
    await Solution.findByIdAndDelete(req.params.id);

    res.json({
      message: "Submission deleted successfully",
    });
  } catch (err) {
    console.error("DELETE SUBMISSION ERROR:", err);

    res.status(500).json({
      message: "Server error deleting submission",
    });
  }
};