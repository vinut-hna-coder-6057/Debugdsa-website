export function shouldRefreshSession(error) {
  const requestUrl = error.config?.url || "";
  return error.response?.status === 401 &&
    !error.config?._retry &&
    !requestUrl.includes("/auth/refresh");
}
