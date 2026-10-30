
import axios from "axios";

const BASE_URL = "http://localhost:5000/api";

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Access token exists only in application memory.
let accessToken = null;
let refreshPromise = null;

export const setAccessToken = (token) => {
  accessToken = token;
};

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      originalRequest.url?.includes("/auth/login") ||
      originalRequest.url?.includes("/auth/register") ||
      originalRequest.url?.includes("/auth/refresh") ||
      originalRequest.url?.includes("/auth/logout")
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      // Share one refresh request between simultaneous failed requests.
      if (!refreshPromise) {
        refreshPromise = axios
          .post(
            `${BASE_URL}/auth/refresh`,
            {},
            { withCredentials: true }
          )
          .then((response) => {
            const newToken = response.data?.token;

            if (!newToken) {
              throw new Error("Refresh response did not contain a token");
            }

            setAccessToken(newToken);
            return newToken;
          })
          .finally(() => {
            refreshPromise = null;
          });
      }

      const newToken = await refreshPromise;

      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${newToken}`;

      return api(originalRequest);
    } catch (refreshError) {
      setAccessToken(null);

      window.dispatchEvent(
        new Event("crm:session-expired")
      );

      return Promise.reject(refreshError);
    }
  }
);

export default api;
