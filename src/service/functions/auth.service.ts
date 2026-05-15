
import axiosClient from '../axios.client';
import { API_ENDPOINTS } from '../endpoints';
import { User } from '@/store/use-store';

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface LoginCredentials {
  emailOrUsername: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  username: string;
  display_name: string;
  avatar_url?: string;
}

export const login = async (data: LoginCredentials): Promise<AuthResponse> => {
  const response = await axiosClient.post(API_ENDPOINTS.AUTH.LOGIN, data);
  return response.data;
};

export const register = async (data: RegisterCredentials): Promise<AuthResponse> => {
  const response = await axiosClient.post(API_ENDPOINTS.AUTH.REGISTER, data);
  return response.data;
};

export const logout = async (refreshToken: string): Promise<void> => {
  await axiosClient.post(API_ENDPOINTS.AUTH.LOGOUT, { refreshToken });
};

export const refresh = async (refreshToken: string): Promise<AuthResponse> => {
  const response = await axiosClient.post(API_ENDPOINTS.AUTH.REFRESH, { refreshToken });
  return response.data;
};

export const googleLogin = async (code: string, redirectUri: string): Promise<AuthResponse> => {
  const response = await axiosClient.post(API_ENDPOINTS.AUTH.GOOGLE_LOGIN, { code, redirectUri });
  return response.data;
};
