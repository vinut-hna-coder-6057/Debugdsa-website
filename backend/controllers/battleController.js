import Battle from "../models/battle.js";
import User from "../models/User.js";



//////////////////////////////////////////////////
// SOCKET.IO INSTANCE
//////////////////////////////////////////////////

let io;

export const setSocketInstance = (socketIo) => {
  io = socketIo;
};

//////////////////////////////////////////////////
// GET ALL BATTLES
//////////////////////////////////////////////////

export const getLiveBattles = async (req, res) => {

  try {

    const now = new Date();

    const battles = await Battle.find()
      .sort({ startTime: 1 });

    const result = battles.map(b => {

      let status = "UPCOMING";

      if (now >= b.startTime && now <= b.endTime) {
        status = "LIVE";
      }

      if (now > b.endTime) {
        status = "FINISHED";
      }

      return {
        ...b.toObject(),
        status
      };

    });

    res.json(result);

  } catch (err) {

    console.error("LIVE BATTLES ERROR:", err);

    res.status(500).json({
      message: "Server error fetching battles"
    });

  }

};

//////////////////////////////////////////////////
// GET SINGLE BATTLE
//////////////////////////////////////////////////

export const getBattleById = async (req, res) => {

  try {

    const battle = await Battle.findById(req.params.id)
      .populate("participants", "name");

    if (!battle) {
      return res.status(404).json({
        message: "Battle not found"
      });
    }

    res.json(battle);

  } catch (err) {

    console.error("GET BATTLE ERROR:", err);

    res.status(500).json({
      message: "Server error fetching battle"
    });

  }

};

//////////////////////////////////////////////////
// JOIN BATTLE
//////////////////////////////////////////////////

export const joinBattle = async (req, res) => {

  try {

    const battle = await Battle.findById(req.params.id);

    if (!battle) {
      return res.status(404).json({
        message: "Battle not found"
      });
    }

    const joined = battle.participants.find(
      p => p.toString() === req.user._id.toString()
    );

    if (!joined) {

      battle.participants.push(req.user._id);

      await battle.save();

      //////////////////////////////////////////////////
      // SOCKET EVENT: PLAYER JOINED
      //////////////////////////////////////////////////

      if (io) {

        io.to(battle._id.toString()).emit("playerJoined", {
          playerId: req.user._id
        });

      }

    }

    res.json({
      message: "Joined battle successfully"
    });

  } catch (err) {

    console.error("JOIN BATTLE ERROR:", err);

    res.status(500).json({
      message: "Server error joining battle"
    });

  }

};

//////////////////////////////////////////////////
// SUBMIT SOLUTION
//////////////////////////////////////////////////

export const submitBattleSolution = async (req, res) => {

  try {

    const { code } = req.body;

    const battle = await Battle.findById(req.params.id);

    if (!battle) {
      return res.status(404).json({
        message: "Battle not found"
      });
    }

    const now = new Date();

    //////////////////////////////////////////////////
    // BLOCK IF BATTLE NOT STARTED
    //////////////////////////////////////////////////

    if (now < battle.startTime) {
      return res.status(403).json({
        message: "Battle has not started yet"
      });
    }

    //////////////////////////////////////////////////
    // AUTO JOIN USER
    //////////////////////////////////////////////////

    const joined = battle.participants.find(
      p => p.toString() === req.user._id.toString()
    );

    if (!joined) {
      battle.participants.push(req.user._id);
    }

    //////////////////////////////////////////////////
    // CHECK LATE SUBMISSION
    //////////////////////////////////////////////////

    const late = now > battle.endTime;

    battle.submissions.push({
      user: req.user._id,
      code,
      status: "pending",
      submittedAt: new Date(),
      late
    });

    await battle.save();

    //////////////////////////////////////////////////
    // SOCKET EVENT: SOLUTION SUBMITTED
    //////////////////////////////////////////////////

    if (io) {

      io.to(battle._id.toString()).emit("solutionSubmitted", {
        user: req.user._id,
        submittedAt: new Date()
      });

    }

    res.json({
      message: late
        ? "Solution submitted (late submission)"
        : "Solution submitted successfully"
    });

  } catch (err) {

    console.error("SUBMIT SOLUTION ERROR:", err);

    res.status(500).json({
      message: "Server error submitting solution"
    });

  }

};

//////////////////////////////////////////////////
// GET BATTLE SUBMISSIONS (FOR USERS)
//////////////////////////////////////////////////

export const getBattleSubmissions = async (req, res) => {

  try {

    const battle = await Battle.findById(req.params.id)
      .populate("submissions.user", "name");

    if (!battle) {
      return res.status(404).json({
        message: "Battle not found"
      });
    }

    res.json(battle.submissions);

  } catch (err) {

    console.error("GET SUBMISSIONS ERROR:", err);

    res.status(500).json({
      message: "Server error fetching submissions"
    });

  }

};

//////////////////////////////////////////////////
// LEADERBOARD (PER BATTLE)
//////////////////////////////////////////////////

export const getBattleLeaderboard = async (req, res) => {

  try {

    const battle = await Battle.findById(req.params.id)
      .populate("submissions.user", "name");

    if (!battle) {
      return res.status(404).json({
        message: "Battle not found"
      });
    }

    const leaderboard = battle.submissions
      .filter(s => s.status === "accepted" && !s.late)
      .sort(
        (a, b) => new Date(a.submittedAt) - new Date(b.submittedAt)
      )
      .map((entry, index) => ({
        rank: index + 1,
        user: entry.user.name,
        time: entry.submittedAt
      }));

    //////////////////////////////////////////////////
    // SOCKET EVENT: LEADERBOARD UPDATED
    //////////////////////////////////////////////////

    if (io) {
      io.to(battle._id.toString()).emit(
        "leaderboardUpdated",
        leaderboard
      );
    }

    res.json(leaderboard);

  } catch (err) {

    console.error("LEADERBOARD ERROR:", err);

    res.status(500).json({
      message: "Server error fetching leaderboard"
    });

  }

};

//////////////////////////////////////////////////
// GLOBAL BATTLE LEADERBOARD
//////////////////////////////////////////////////

export const getGlobalBattleLeaderboard = async (req, res) => {

  try {

    const users = await User.find()
      .select("name battlePoints")
      .sort({ battlePoints: -1 })
      .limit(50);

    res.json(users);

  } catch (err) {

    console.error("GLOBAL BATTLE LEADERBOARD ERROR:", err);

    res.status(500).json({
      message: "Server error fetching leaderboard"
    });

  }

};

//////////////////////////////////////////////////
// START BATTLE TIMER (REAL TIME)
//////////////////////////////////////////////////

export const startBattleTimer = async (battleId) => {

  try {

    const battle = await Battle.findById(battleId);

    if (!battle) return;

    const start = new Date(battle.startTime).getTime();
    const end = new Date(battle.endTime).getTime();

    if (io) {

      io.to(battleId).emit("battleTimerStart", {
        startTime: start,
        endTime: end
      });

    }

  } catch (err) {

    console.error("START TIMER ERROR:", err);

  }

};