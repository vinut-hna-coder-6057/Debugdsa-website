import Bug from "../models/Bug.js";
import Solution from "../models/Solution.js";

//////////////////////////////////////////////////
// GET RECOMMENDED BUGS
//////////////////////////////////////////////////

export const getRecommendedBugs = async (req,res)=>{

try{

const userId = req.user._id;

//////////////////////////////////////////////////
// GET USER SOLUTIONS
//////////////////////////////////////////////////

const solvedSolutions = await Solution
.find({ solvedBy:userId })
.populate("bugId");

//////////////////////////////////////////////////
// GET SOLVED BUG IDS
//////////////////////////////////////////////////

const solvedBugIds = solvedSolutions
.filter(s => s.bugId)
.map(s => s.bugId._id);

//////////////////////////////////////////////////
// GET TOPICS FROM HISTORY
//////////////////////////////////////////////////

const solvedTopics = [
...new Set(
solvedSolutions
.filter(s => s.bugId && s.bugId.topic)
.map(s => s.bugId.topic)
)
];

//////////////////////////////////////////////////
// IF USER HAS NO HISTORY
//////////////////////////////////////////////////

if(solvedTopics.length === 0){

return res.json([]);

}

//////////////////////////////////////////////////
// FIND UNSOLVED BUGS FROM SAME TOPICS
//////////////////////////////////////////////////

const recommended = await Bug.find({

topic: { $in: solvedTopics },

_id: { $nin: solvedBugIds }

})
.sort({createdAt:-1})
.limit(6);

res.json(recommended);

}catch(err){

console.error("Recommendation error:",err);

res.status(500).json({
message:"Failed to fetch recommendations"
});

}

};