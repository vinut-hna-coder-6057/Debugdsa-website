import axiosInstance from "./axiosInstance";

export async function restoreSessionUser(cachedUser, client = axiosInstance, storage = window.localStorage) {
  try {
    const response = await client.get("/users/me");
    const user = response.data.user;
    if (!user) throw new Error("Session response did not include a user");
    storage.setItem("user", JSON.stringify(user));
    return user;
  } catch (error) {
    if ([401, 403].includes(error.response?.status)) {
      storage.removeItem("token");
      storage.removeItem("user");
      return null;
    }
    return cachedUser;
  }
}
