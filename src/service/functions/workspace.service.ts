
import axiosClient from "../axios.client";
import { API_ENDPOINTS } from "../endpoints";

export interface Workspace {
  id: string;
  name: string;
  createdAt: string;
  public: boolean;
}

export const getWorkspaces = async (): Promise<Workspace[]> => {
  const response = await axiosClient.get(API_ENDPOINTS.WORKSPACES.LIST);
  return response.data;
};
