import axios from "axios";
import { API_BASE_URL } from "../config";
import { shouldRefreshSession } from "./authRetry";

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // 🔥 needed for cookies
  headers: {
    "Content-Type": "application/json"
  }
});

////////////////////////////////////////////////////////////
// RESPONSE INTERCEPTOR (TOKEN REFRESH)
////////////////////////////////////////////////////////////

axiosInstance.interceptors.response.use(
  (response) => response,

  async (error) => {

    const originalRequest = error.config;

    if (shouldRefreshSession(error)) {

      originalRequest._retry = true;

      try {

        // request new access token using refresh cookie
        await axiosInstance.post("/auth/refresh");

        // retry original request
        return axiosInstance(originalRequest);

      } catch (refreshError) {

        window.location.href = "/login";

        return Promise.reject(refreshError);

      }

    }

    return Promise.reject(error);

  }
);

export default axiosInstance;
