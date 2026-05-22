import mongoose from "mongoose";

const battleSolutionSchema = new mongoose.Schema(
{
  battleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Battle",
  },

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  fixedCode: String,
  explanation: String,

  submittedAt: Date,
},
{ timestamps: true }
);

export default mongoose.model("BattleSolution", battleSolutionSchema);