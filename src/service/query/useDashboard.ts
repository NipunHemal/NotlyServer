import { useQuery } from "@tanstack/react-query";
import { getDashboardStats, getDashboardRecent } from "../functions/dashboard.service";

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: getDashboardStats,
  });
};

export const useDashboardRecent = () => {
  return useQuery({
    queryKey: ['dashboard', 'recent'],
    queryFn: getDashboardRecent,
  });
};
