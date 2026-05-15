
import { useQuery } from "@tanstack/react-query";
import {
  getMyActivities,
  getMyActivitiesByEntity,
  getMyActivitiesByAction,
  getEntityActivities,
  getMyActivitiesInRange,
  getMyActivityStats,
  EntityType,
  ActionType,
} from "../functions/activity.service";

export const useMyActivities = (page = 0, size = 20) => {
  return useQuery({
    queryKey: ['activities', 'me', page, size],
    queryFn: () => getMyActivities(page, size),
  });
};

export const useMyActivitiesByEntity = (entityType: EntityType, page = 0, size = 20) => {
  return useQuery({
    queryKey: ['activities', 'me', 'entity', entityType, page, size],
    queryFn: () => getMyActivitiesByEntity(entityType, page, size),
    enabled: !!entityType,
  });
};

export const useMyActivitiesByAction = (action: ActionType, page = 0, size = 20) => {
  return useQuery({
    queryKey: ['activities', 'me', 'action', action, page, size],
    queryFn: () => getMyActivitiesByAction(action, page, size),
    enabled: !!action,
  });
};

export const useEntityActivities = (entityType: EntityType, entityId: string) => {
  return useQuery({
    queryKey: ['activities', 'entity', entityType, entityId],
    queryFn: () => getEntityActivities(entityType, entityId),
    enabled: !!entityType && !!entityId,
  });
};

export const useMyActivitiesInRange = (from: string, to: string, page = 0, size = 20) => {
  return useQuery({
    queryKey: ['activities', 'me', 'range', from, to, page, size],
    queryFn: () => getMyActivitiesInRange(from, to, page, size),
    enabled: !!from && !!to,
  });
};

export const useMyActivityStats = () => {
  return useQuery({
    queryKey: ['activities', 'me', 'stats'],
    queryFn: getMyActivityStats,
  });
};
