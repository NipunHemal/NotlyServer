import axiosClient from "../axios.client";
import { API_ENDPOINTS } from "../endpoints";

export interface DashboardStats {
  totalNotes: number;
  totalGroups: number;
  totalWorkspaces: number;
  favoriteNotes: number;
  favoriteGroups: number;
  binItems: number;
  archivedNotes: number;
  lockedNotes: number;
  sharedNotes: number;
  activityBreakdown: Record<string, number>;
  totalActivities: number;
  activitiesToday: number;
  activitiesThisWeek: number;
}

export interface DashboardRecentItem {
  id: string;
  type: "NOTE" | "ACTIVITY" | string;
  title: string;
  subtitle: string;
  timestamp: string;
  icon: string;
}

export const getDashboardStats = async (): Promise<DashboardStats> => {
  const response = await axiosClient.get(API_ENDPOINTS.DASHBOARD.STATS);
  return response.data;
};

export const getDashboardRecent = async (): Promise<DashboardRecentItem[]> => {
  const response = await axiosClient.get(API_ENDPOINTS.DASHBOARD.RECENT);
  return response.data;
};
