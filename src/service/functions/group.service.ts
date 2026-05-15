
import axiosClient from '../axios.client';
import { API_ENDPOINTS } from '../endpoints';

export interface Group {
  id: string;
  name: string;
  parent_id: string | null;
  workspace_id: string;
  sort_order: number;
  is_locked: boolean;
  is_secure: boolean;
  is_favorite: boolean;
  is_archived: boolean;
  visibility: string;
  created_at: string;
  updated_at: string;
}

export interface CreateGroupData {
  name: string;
  parent_id?: string | null;
  is_secure?: boolean;
  password?: string | null;
}

export interface GroupChildren {
  groups: Group[];
  notes: any[]; // Notes will be implemented later
}

export interface GroupTreeNode {
  id: string;
  name: string;
  is_locked: boolean;
  is_secure: boolean;
  is_favorite: boolean;
  is_archived: boolean;
  sort_order: number;
  children: GroupTreeNode[];
}

export interface GroupStats {
  direct_note_count: number;
  direct_subgroup_count: number;
  total_note_count: number;
  last_activity_at: string;
}

export interface Collaborator {
  id: string;
  role: 'EDITOR' | 'VIEWER';
  invited_at: string;
  user: {
    id: string;
    username: string;
    email: string;
    displayName: string;
  };
}

export const createGroup = async (data: CreateGroupData): Promise<Group> => {
  const response = await axiosClient.post(API_ENDPOINTS.GROUPS.BASE, data);
  return response.data;
};

export const getGroupById = async (id: string): Promise<Group> => {
  const response = await axiosClient.get(API_ENDPOINTS.GROUPS.BY_ID(id));
  return response.data;
};

export const getGroupChildren = async (id: string, unlockToken?: string): Promise<GroupChildren> => {
  const headers = unlockToken ? { 'X-Unlock-Token': unlockToken } : {};
  const response = await axiosClient.get(API_ENDPOINTS.GROUPS.CHILDREN(id), { headers });
  return response.data;
};

export const getGroupTree = async (workspaceId: string): Promise<GroupTreeNode[]> => {
  const response = await axiosClient.get(`${API_ENDPOINTS.GROUPS.TREE}?workspace_id=${workspaceId}`);
  return response.data;
};

export const getGroupBreadcrumb = async (id: string): Promise<{ id: string; name: string }[]> => {
  const response = await axiosClient.get(API_ENDPOINTS.GROUPS.BREADCRUMB(id));
  return response.data;
};

export const renameGroup = async (id: string, name: string): Promise<Group> => {
  const response = await axiosClient.patch(API_ENDPOINTS.GROUPS.BY_ID(id), { name });
  return response.data;
};

export const getGroupStats = async (id: string): Promise<GroupStats> => {
  const response = await axiosClient.get(API_ENDPOINTS.GROUPS.STATS(id));
  return response.data;
};

export const moveGroup = async (id: string, target_parent_id: string | null, sort_order?: number): Promise<Group> => {
  const response = await axiosClient.post(API_ENDPOINTS.GROUPS.MOVE(id), { target_parent_id, sort_order });
  return response.data;
};

export const reorderGroup = async (id: string, sort_order: number): Promise<Group> => {
  const response = await axiosClient.post(API_ENDPOINTS.GROUPS.REORDER(id), { sort_order });
  return response.data;
};

export const duplicateGroup = async (id: string, target_parent_id: string | null): Promise<Group> => {
  const response = await axiosClient.post(API_ENDPOINTS.GROUPS.DUPLICATE(id), { target_parent_id });
  return response.data;
};

export const archiveGroup = async (id: string): Promise<Group> => {
  const response = await axiosClient.post(API_ENDPOINTS.GROUPS.ARCHIVE(id));
  return response.data;
};

export const unarchiveGroup = async (id: string): Promise<Group> => {
  const response = await axiosClient.post(API_ENDPOINTS.GROUPS.UNARCHIVE(id));
  return response.data;
};

export const deleteGroup = async (id: string): Promise<void> => {
  await axiosClient.delete(API_ENDPOINTS.GROUPS.BY_ID(id));
};

export const createPublicLink = async (id: string): Promise<{ share_token: string; public_url_path: string }> => {
  const response = await axiosClient.post(API_ENDPOINTS.GROUPS.PUBLIC_LINK(id));
  return response.data;
};

export const toggleGroupFavorite = async (id: string): Promise<Group> => {
  const response = await axiosClient.post(API_ENDPOINTS.GROUPS.FAVORITE(id));
  return response.data;
};

export const getCollaborators = async (id: string): Promise<Collaborator[]> => {
  const response = await axiosClient.get(API_ENDPOINTS.GROUPS.COLLABORATORS(id));
  return response.data;
};

export const shareGroup = async (id: string, email: string, role: 'EDITOR' | 'VIEWER'): Promise<Collaborator> => {
  const response = await axiosClient.post(API_ENDPOINTS.GROUPS.COLLABORATORS(id), { email, role });
  return response.data;
};
