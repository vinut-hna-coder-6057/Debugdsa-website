import axiosInstance from "./axiosInstance";

export async function fetchRecommendedBugs(user, client = axiosInstance) {
  if (!user) return { status: "unauthenticated", bugs: [] };

  const response = await client.get("/recommendations/bugs");
  const data = response.data;
  const bugs = Array.isArray(data) ? data : Array.isArray(data?.bugs) ? data.bugs : [];
  return { status: "loaded", bugs };
}
