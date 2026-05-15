
import axiosClient from "../axios.client";
import { API_ENDPOINTS } from "../endpoints";

export interface BinItem {
  id: string;
  entity_type: 'NOTE' | 'GROUP';
  entity_id: string;
  title: string;
  deleted_at: string;
  restore_deadline: string;
  days_left: number;
  original_group_id: string | null;
}

export const getBinItems = async (): Promise<BinItem[]> => {
  const response = await axiosClient.get(API_ENDPOINTS.BIN.BASE);
  return response.data;
};

export const restoreBinItem = async (id: string) => {
  const response = await axiosClient.post(API_ENDPOINTS.BIN.RESTORE(id));
  return response.data;
};

export const deleteBinItemPermanently = async (id: string) => {
  await axiosClient.delete(API_ENDPOINTS.BIN.BY_ID(id));
};

export const emptyBin = async () => {
  await axiosClient.delete(API_ENDPOINTS.BIN.BASE);
};
