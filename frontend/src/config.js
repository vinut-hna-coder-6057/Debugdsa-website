const rawApiOrigin = (process.env.REACT_APP_API || "").trim();
const browserHost = typeof window === "undefined" ? "" : window.location.hostname;
const isLocalHost = (host) => ["localhost", "127.0.0.1", "::1", "[::1]"].includes(host);
const browserIsLocal = isLocalHost(browserHost);

let API_ORIGIN = "";
let API_CONFIG_ERROR = "";

if (!rawApiOrigin) {
  if (browserIsLocal) {
    API_ORIGIN = "http://localhost:5000";
  } else {
    API_CONFIG_ERROR = "REACT_APP_API is missing. Set it to the deployed backend origin in the frontend hosting build environment, then rebuild the frontend.";
  }
} else {
  try {
    const url = new URL(rawApiOrigin);
    const validPath = ["", "/", "/api"].includes(url.pathname);
    const validProtocol = ["http:", "https:"].includes(url.protocol);
    const localApiHost = isLocalHost(url.hostname);

    if (!validProtocol || !validPath || url.username || url.password || url.search || url.hash) {
      throw new Error("Use a backend origin such as https://debugdsa-backend.onrender.com, without credentials, query strings, or a route path.");
    }
    if (!browserIsLocal && !localApiHost && url.protocol !== "https:") {
      throw new Error("Production backend origins must use HTTPS.");
    }
    if (localApiHost && !browserIsLocal) {
      throw new Error("The production frontend is configured with a localhost API. Set REACT_APP_API to the deployed backend origin and rebuild.");
    }

    API_ORIGIN = url.origin;
  } catch (error) {
    API_CONFIG_ERROR = `Invalid REACT_APP_API configuration. ${error.message}`;
  }
}

const API_BASE_URL = API_ORIGIN ? `${API_ORIGIN}/api` : "";

export { API_ORIGIN, API_BASE_URL, API_CONFIG_ERROR };
export default API_ORIGIN;
