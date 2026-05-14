
import axios from 'axios';
import { useStore } from '@/store/use-store';
import { API_ENDPOINTS } from './endpoints';

const axiosClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api/v1',
  headers: {
    'Content-Type': 'application/json',
    'Accept': '*/*',
  },
});

// Request Interceptor: Add Token
axiosClient.interceptors.request.use(
  (config) => {
    const token = useStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle Token Refresh
axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 error and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = useStore.getState().refreshToken;
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post(
          `${axiosClient.defaults.baseURL}${API_ENDPOINTS.AUTH.REFRESH}`,
          { refresh_token: refreshToken }
        );

        const { accessToken, refreshToken: newRefreshToken, user } = response.data;
        
        // Update store
        useStore.getState().setAuth(user, accessToken, newRefreshToken);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return axiosClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout user
        useStore.getState().clearAuth();
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors (global error handling as per doc)
    const errorData = error.response?.data;
    const message = errorData?.message || 'An unexpected error occurred';
    
    // You can add more complex error handling here (e.g. mapping codes to messages)
    const enhancedError = new Error(message);
    (enhancedError as any).status = error.response?.status;
    (enhancedError as any).code = errorData?.code;
    (enhancedError as any).fieldErrors = errorData?.fieldErrors;

    return Promise.reject(enhancedError);
  }
);

export default axiosClient;
