
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
  },
  GROUPS: {
    BASE: "/groups",
    BY_ID: (id: string) => `/groups/${id}`,
    CHILDREN: (id: string) => `/groups/${id}/children`,
    TREE: "/groups/tree",
    BREADCRUMB: (id: string) => `/groups/${id}/breadcrumb`,
    STATS: (id: string) => `/groups/${id}/stats`,
    MOVE: (id: string) => `/groups/${id}/move`,
    REORDER: (id: string) => `/groups/${id}/reorder`,
    DUPLICATE: (id: string) => `/groups/${id}/duplicate`,
    ARCHIVE: (id: string) => `/groups/${id}/archive`,
    UNARCHIVE: (id: string) => `/groups/${id}/unarchive`,
    PUBLIC_LINK: (id: string) => `/groups/${id}/public-link`,
    REGENERATE_LINK: (id: string) => `/groups/${id}/public-link/regenerate`,
    COLLABORATORS: (id: string) => `/groups/${id}/collaborators`,
    COLLABORATOR_BY_ID: (id: string, userId: string) => `/groups/${id}/collaborators/${userId}`,
    FAVORITE: (id: string) => `/groups/${id}/favorite`,
    PUBLIC_GROUP: (token: string) => `/groups/public/${token}`,
  }
};
