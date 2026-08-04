import redisClient from "../config/redis.js";

export const clearLeaderboardCache = async () => {
  await redisClient.del("leaderboard");
};

export const clearUserCache = async (userId) => {
  await redisClient.del(`user:${userId}`);
};