
import axiosClient from "../axios.client";
import { API_ENDPOINTS } from "../endpoints";

export interface NoteVersion {
  id: string;
  version_number: number;
  title: string;
  content_json: any;
  content_hash: string;
  created_by: {
    id: string;
    username: string;
    display_name: string;
  };
  change_summary: string;
  created_at: string;
}

export interface NoteVersionResponse {
  content: NoteVersion[];
  total_elements: number;
  total_pages: number;
  size: number;
  number: number;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  content_json: any; 
  version_number: number;
  group_id: string | null;
  owner_id: string;
  owner_name: string;
  is_favorite: boolean;
  is_locked: boolean;
  status: 'ACTIVE' | 'ARCHIVED' | 'DELETED';
  visibility: 'PRIVATE' | 'PUBLIC';
  sort_order: number;
  lock_version: number;
  created_at: string;
  updated_at: string;
  last_autosave_at?: string;
}

export interface CreateNoteRequest {
  title?: string;
  group_id?: string | null;
  content?: string;
}

export interface UpdateNoteRequest {
  title?: string;
  content?: string;
  contentJson?: any;
  clientVersion?: number;
}

export const getNoteById = async (id: string, unlockToken?: string): Promise<Note> => {
  const headers = unlockToken ? { 'X-Unlock-Token': unlockToken } : {};
  const response = await axiosClient.get(API_ENDPOINTS.NOTES.BY_ID(id), { headers });
  return response.data;
};

export const listNotes = async (params: { group_id?: string; status?: string; favorite?: boolean }): Promise<Note[]> => {
  const response = await axiosClient.get(API_ENDPOINTS.NOTES.BASE, { params });
  return response.data;
};

export const createNote = async (data: CreateNoteRequest): Promise<Note> => {
  const response = await axiosClient.post(API_ENDPOINTS.NOTES.BASE, data);
  return response.data;
};

export const updateNote = async (id: string, data: UpdateNoteRequest): Promise<Note> => {
  const response = await axiosClient.patch(API_ENDPOINTS.NOTES.BY_ID(id), data);
  return response.data;
};

export const autosaveNote = async (id: string, data: UpdateNoteRequest): Promise<Note> => {
  const response = await axiosClient.patch(API_ENDPOINTS.NOTES.AUTOSAVE(id), data);
  return response.data;
};

export const deleteNote = async (id: string): Promise<void> => {
  await axiosClient.delete(API_ENDPOINTS.NOTES.BY_ID(id));
};

export const getNoteVersions = async (id: string, page = 0, size = 20): Promise<NoteVersionResponse> => {
  const response = await axiosClient.get(API_ENDPOINTS.NOTES.VERSIONS(id), {
    params: { page, size }
  });
  return response.data;
};

export const restoreNoteVersion = async (id: string, versionId: string): Promise<Note> => {
  const response = await axiosClient.post(API_ENDPOINTS.NOTES.RESTORE_VERSION(id, versionId));
  return response.data;
};

export const toggleNoteFavorite = async (id: string): Promise<Note> => {
  const response = await axiosClient.post(API_ENDPOINTS.NOTES.FAVORITE(id));
  return response.data;
};

export const moveNote = async (id: string, targetGroupId: string): Promise<Note> => {
  const response = await axiosClient.post(API_ENDPOINTS.NOTES.MOVE(id), { target_group_id: targetGroupId });
  return response.data;
};

export const duplicateNote = async (id: string): Promise<Note> => {
  const response = await axiosClient.post(API_ENDPOINTS.NOTES.DUPLICATE(id));
  return response.data;
};

export const archiveNote = async (id: string): Promise<Note> => {
  const response = await axiosClient.post(API_ENDPOINTS.NOTES.ARCHIVE(id));
  return response.data;
};

export const unarchiveNote = async (id: string): Promise<Note> => {
  const response = await axiosClient.post(API_ENDPOINTS.NOTES.UNARCHIVE(id));
  return response.data;
};

export interface PublicLinkResponse {
  share_token: string;
  public_url_path: string;
}

export const createPublicLink = async (id: string): Promise<PublicLinkResponse> => {
  const response = await axiosClient.post(API_ENDPOINTS.NOTES.PUBLIC_LINK(id));
  return response.data;
};

export const revokePublicLink = async (id: string): Promise<void> => {
  await axiosClient.delete(API_ENDPOINTS.NOTES.REVOKE_LINK(id));
};

export const getPublicNote = async (token: string): Promise<any> => {
  const response = await axiosClient.get(API_ENDPOINTS.NOTES.PUBLIC_NOTE(token));
  return response.data;
};
