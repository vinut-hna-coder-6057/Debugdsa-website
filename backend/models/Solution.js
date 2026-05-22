import mongoose from "mongoose";

const SolutionSchema = new mongoose.Schema(
  {
    //////////////////////////////////////////////////////
    // RELATIONS
    //////////////////////////////////////////////////////

    bugId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bug", // Must match Bug model
      required: true,
      index: true,
    },

    solvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Must match User model
      required: true,
      index: true,
    },

    //////////////////////////////////////////////////////
    // SOLUTION DATA
    //////////////////////////////////////////////////////

    fixedCode: {
      type: String,
      required: true,
      maxlength: 20000,
    },

    //////////////////////////////////////////////////////
    // AI COMPLEXITY
    //////////////////////////////////////////////////////

    timeComplexity: {
      type: String,
      default: "O(n)",
      trim: true,
    },

    spaceComplexity: {
      type: String,
      default: "O(1)",
      trim: true,
    },

    //////////////////////////////////////////////////////
    // COMMUNITY FEATURES
    //////////////////////////////////////////////////////

    upvotes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // Users who upvoted
      },
    ],

    upvoteCount: {
      type: Number,
      default: 0,
      index: true,
    },

    accepted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

//////////////////////////////////////////////////////
// INDEXES
//////////////////////////////////////////////////////

SolutionSchema.index({ bugId: 1, accepted: -1 });
SolutionSchema.index({ upvoteCount: -1 });
SolutionSchema.index({ createdAt: -1 });

//////////////////////////////////////////////////////
// METHODS
//////////////////////////////////////////////////////

SolutionSchema.methods.addUpvote = function (userId) {
  if (this.upvotes.includes(userId)) return false;
  this.upvotes.push(userId);
  this.upvoteCount = this.upvotes.length;
  return true;
};

SolutionSchema.methods.removeUpvote = function (userId) {
  this.upvotes = this.upvotes.filter((id) => id.toString() !== userId.toString());
  this.upvoteCount = this.upvotes.length;
};

//////////////////////////////////////////////////////
// CLEAN OUTPUT
//////////////////////////////////////////////////////

SolutionSchema.set("toJSON", {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model("Solution", SolutionSchema);