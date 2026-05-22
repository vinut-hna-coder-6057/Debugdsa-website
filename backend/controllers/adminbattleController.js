import Battle from "../models/battle.js";
import User from "../models/User.js";

//////////////////////////////////////////////////
// CREATE BATTLE
//////////////////////////////////////////////////

export const createBattle = async (req,res)=>{

try{

const {
title,
language,
topic,
pattern,
description,
buggyCode,
expectedOutput,
duration,
startTime
} = req.body;

const battleStartTime = new Date(startTime);

const endTime = new Date(
battleStartTime.getTime() + duration * 60 * 1000
);

const battle = await Battle.create({

title,
language,
topic,
pattern,
description,
buggyCode,
expectedOutput,
startTime: battleStartTime,
endTime

});

res.status(201).json(battle);

}catch(err){

console.error("CREATE BATTLE ERROR:",err);

res.status(500).json({
message:"Server error creating battle"
});

}

};

//////////////////////////////////////////////////
// GET BATTLES (ADMIN)
//////////////////////////////////////////////////

export const getBattles = async (req,res)=>{

try{

const battles = await Battle.find()
.sort({createdAt:-1});

res.json(battles);

}catch(err){

console.error("GET BATTLES ERROR:",err);

res.status(500).json({
message:"Server error fetching battles"
});

}

};

//////////////////////////////////////////////////
// DELETE BATTLE
//////////////////////////////////////////////////

export const deleteBattle = async (req,res)=>{

try{

const battle = await Battle.findById(req.params.id);

if(!battle){
return res.status(404).json({
message:"Battle not found"
});
}

await Battle.findByIdAndDelete(req.params.id);

res.json({
message:"Battle deleted successfully"
});

}catch(err){

console.error("DELETE BATTLE ERROR:",err);

res.status(500).json({
message:"Server error deleting battle"
});

}

};

//////////////////////////////////////////////////
// GET ALL SUBMISSIONS FOR A BATTLE
//////////////////////////////////////////////////

export const getBattleSubmissions = async (req,res)=>{

try{

const battle = await Battle.findById(req.params.id)
.populate("submissions.user","name email");

if(!battle){
return res.status(404).json({
message:"Battle not found"
});
}

res.json(battle.submissions);

}catch(err){

console.error("GET SUBMISSIONS ERROR:",err);

res.status(500).json({
message:"Server error fetching submissions"
});

}

};

//////////////////////////////////////////////////
// ACCEPT / REJECT SUBMISSION
//////////////////////////////////////////////////

export const reviewSubmission = async (req,res)=>{

try{

const { submissionId, status } = req.body;

const battle = await Battle.findById(req.params.id);

if(!battle){
return res.status(404).json({
message:"Battle not found"
});
}

const submission = battle.submissions.id(submissionId);

if(!submission){
return res.status(404).json({
message:"Submission not found"
});
}

//////////////////////////////////////////////////
// UPDATE STATUS
//////////////////////////////////////////////////

submission.status = status;

//////////////////////////////////////////////////
// GIVE BATTLE POINTS IF ACCEPTED
//////////////////////////////////////////////////

if(status === "accepted" && !submission.late){

const user = await User.findById(submission.user);

if(user){

//////////////////////////////////////////////////
// BATTLE POINTS
//////////////////////////////////////////////////

user.battlePoints += 10;

//////////////////////////////////////////////////
// NORMAL LEADERBOARD POINTS
//////////////////////////////////////////////////

user.points += 5;

await user.save();

}

}

await battle.save();

res.json({
message:"Submission updated"
});

}catch(err){

console.error("REVIEW ERROR:",err);

res.status(500).json({
message:"Server error reviewing submission"
});

}

};