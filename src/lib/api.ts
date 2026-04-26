import axios from "axios";

const BASE_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:5090") + "/api";

const api = axios.create({
  baseURL: BASE_URL,
});

// Token erişimi için wrapper (CLAUDE.md kuralı: doğrudan localStorage çağrısı yasak)
export const tokenStorage = {
  getAccess: () => localStorage.getItem("accessToken"),
  getRefresh: () => localStorage.getItem("refreshToken"),
  setAccess: (token: string) => localStorage.setItem("accessToken", token),
  setRefresh: (token: string) => localStorage.setItem("refreshToken", token),
  clear: () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  },
};

api.interceptors.request.use((config) => {
  const token = tokenStorage.getAccess();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = tokenStorage.getRefresh();
      if (refreshToken) {
        try {
          const res = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
          const newToken = res.data.data.accessToken;
          tokenStorage.setAccess(newToken);
          error.config.headers.Authorization = `Bearer ${newToken}`;
          return api(error.config);
        } catch {
          tokenStorage.clear();
          window.location.href = "/login";
        }
      } else {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
