import mongoose from "mongoose";

const BugSchema = new mongoose.Schema(
{
  //////////////////////////////////////////////////////
  // BASIC INFO
  //////////////////////////////////////////////////////

  title: {
    type: String,
    required: true,
    trim: true,
    minlength: 5,
    maxlength: 150,
  },

  description: {
    type: String,
    required: true,
    trim: true,
    minlength: 10,
    maxlength: 5000,
  },

  code: {
    type: String,
    required: true,
    maxlength: 20000,
  },

  language: {
    type: String,
    required: true,
    enum: [
      "JavaScript",
      "Python",
      "Java",
      "C++",
      "C",
      "Go",
      "TypeScript",
    ],
  },

  topic: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },

  difficulty:{
type:String,
enum:["easy","medium","hard"],
default:"easy"
},

  error: {
    type: String,
    required: true,
    maxlength: 2000,
  },

  expectedOutput: {
    type: String,
    required: true,
    maxlength: 2000,
  },

  //////////////////////////////////////////////////////
  // AI ANALYSIS
  //////////////////////////////////////////////////////

  aiTimeComplexity: {
    type: String,
    default: null,
  },

  aiSpaceComplexity: {
    type: String,
    default: null,
  },

  aiExplanation: {
    type: String,
    default: null,
  },

  //////////////////////////////////////////////////////
  // RELATIONS
  //////////////////////////////////////////////////////

  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },

  //////////////////////////////////////////////////////
  // SOLUTIONS (IMPORTANT FIX)
  //////////////////////////////////////////////////////

  solutions: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Solution",
    },
  ],

  //////////////////////////////////////////////////////
  // STATUS
  //////////////////////////////////////////////////////

  solved: {
    type: Boolean,
    default: false,
    index: true,
  },

  //////////////////////////////////////////////////////
  // NOTIFICATIONS
  //////////////////////////////////////////////////////

  notifications: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },

      message: {
        type: String,
        maxlength: 300,
      },

      read: {
        type: Boolean,
        default: false,
      },

      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],

},
{ timestamps: true }
);

//////////////////////////////////////////////////////
// INDEXES (PERFORMANCE)
//////////////////////////////////////////////////////

BugSchema.index({ language: 1 });
BugSchema.index({ topic: 1 });
BugSchema.index({ createdAt: -1 });

//////////////////////////////////////////////////////
// CLEAN API OUTPUT
//////////////////////////////////////////////////////

BugSchema.set("toJSON", {
  virtuals: true,
  transform: function (doc, ret) {
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model("Bug", BugSchema);