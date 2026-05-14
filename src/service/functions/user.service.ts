
import axiosClient from '../axios.client';
import { API_ENDPOINTS } from '../endpoints';
import { User } from '@/store/use-store';

export interface UpdateProfileData {
  username?: string;
  displayName?: string;
  avatarUrl?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export const getMe = async (): Promise<User> => {
  const response = await axiosClient.get(API_ENDPOINTS.USERS.ME);
  return response.data;
};

export const updateProfile = async (data: UpdateProfileData): Promise<User> => {
  const response = await axiosClient.put(API_ENDPOINTS.USERS.ME, data);
  return response.data;
};

export const getUserById = async (id: string): Promise<User> => {
  const response = await axiosClient.get(API_ENDPOINTS.USERS.BY_ID(id));
  return response.data;
};

export const changePassword = async (data: ChangePasswordData): Promise<{ success: boolean; message: string }> => {
  const response = await axiosClient.put(API_ENDPOINTS.USERS.PASSWORD, data);
  return response.data;
};

export const deleteAccount = async (): Promise<{ success: boolean; message: string }> => {
  const response = await axiosClient.delete(API_ENDPOINTS.USERS.ME);
  return response.data;
};
