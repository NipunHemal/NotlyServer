
export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: "/auth/register",
    LOGIN: "/auth/login",
    REFRESH: "/auth/refresh",
    LOGOUT: "/auth/logout",
  },
  USERS: {
    ME: "/users/me",
    BY_ID: (id: string) => `/users/${id}`,
    PASSWORD: "/users/me/password",
  }
};
