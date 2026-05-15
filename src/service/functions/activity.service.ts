
import axiosClient from "../axios.client";
import { API_ENDPOINTS } from "../endpoints";

export type EntityType = 'NOTE' | 'GROUP' | 'VERSION' | 'COLLABORATOR' | 'WORKSPACE';
export type ActionType = 'CREATED' | 'UPDATED' | 'DELETED' | 'RESTORED' | 'SHARED' | 'UNSHARED' | 'LOCKED' | 'UNLOCKED' | 'VERSION_CREATED' | 'VERSION_RESTORED' | 'ARCHIVED' | 'FAVORITED' | 'VIEWED';

export interface ActivityItem {
  id: string;
  entityType: EntityType;
  entityId: string;
  action: ActionType;
  metadata: Record<string, any>;
  createdAt: string;
}

export interface ActivityPage {
  content: ActivityItem[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface ActivityStats {
  totalActivities: number;
  actionCounts: Record<string, number>;
  topAction: string;
  todayCount: number;
  weekCount: number;
}

export const getMyActivities = async (page = 0, size = 20): Promise<ActivityPage> => {
  const response = await axiosClient.get(API_ENDPOINTS.ACTIVITIES.ME, {
    params: { page, size, sort: 'createdAt,desc' }
  });
  return response.data;
};

export const getMyActivitiesByEntity = async (entityType: EntityType, page = 0, size = 20): Promise<ActivityPage> => {
  const response = await axiosClient.get(API_ENDPOINTS.ACTIVITIES.ME_BY_ENTITY(entityType), {
    params: { page, size }
  });
  return response.data;
};

export const getMyActivitiesByAction = async (action: ActionType, page = 0, size = 20): Promise<ActivityPage> => {
  const response = await axiosClient.get(API_ENDPOINTS.ACTIVITIES.ME_BY_ACTION(action), {
    params: { page, size }
  });
  return response.data;
};

export const getEntityActivities = async (entityType: EntityType, entityId: string): Promise<ActivityItem[]> => {
  const response = await axiosClient.get(API_ENDPOINTS.ACTIVITIES.ENTITY(entityType, entityId));
  return response.data;
};

export const getMyActivitiesInRange = async (from: string, to: string, page = 0, size = 20): Promise<ActivityPage> => {
  const response = await axiosClient.get(API_ENDPOINTS.ACTIVITIES.ME_RANGE, {
    params: { from, to, page, size }
  });
  return response.data;
};

export const getMyActivityStats = async (): Promise<ActivityStats> => {
  const response = await axiosClient.get(API_ENDPOINTS.ACTIVITIES.ME_STATS);
  return response.data;
};
