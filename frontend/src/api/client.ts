// ============================================================================
// Axios client
// - Tự động gắn Cognito idToken vào header Authorization.
// - Hỗ trợ cờ VITE_USE_MOCK_API để chuyển sang mock router (không cần backend).
// ============================================================================
import axios, { AxiosRequestConfig } from 'axios';
import { fetchAuthSession } from 'aws-amplify/auth';
import { ApiResponse } from '../types';
import { mockApi } from './mockData';

const USE_MOCK = import.meta.env.VITE_USE_MOCK_API === 'true';
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

/** Axios instance dùng chung. */
export const axiosClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
});

// Interceptor: đính idToken (Cognito) vào mọi request thật.
axiosClient.interceptors.request.use(async (config) => {
  try {
    const session = await fetchAuthSession();
    const idToken = session.tokens?.idToken?.toString();
    if (idToken) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${idToken}`;
    }
  } catch {
    // Chưa đăng nhập — cứ để request đi, backend sẽ trả 401 nếu cần.
  }
  return config;
});

/**
 * Wrapper gọi API trả về ApiResponse<T>.
 * Khi USE_MOCK bật, route thẳng vào mockApi thay vì gọi mạng.
 */
export async function apiRequest<T = unknown>(
  method: string,
  url: string,
  body?: unknown,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  if (USE_MOCK) {
    return mockApi<T>(method, url, body);
  }

  try {
    const res = await axiosClient.request<ApiResponse<T>>({
      method,
      url,
      data: body,
      ...config,
    });
    return res.data;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const data = err.response?.data as ApiResponse<T> | undefined;
      if (data) return data;
      return {
        success: false,
        message: err.message,
        errorCode: String(err.response?.status ?? 'NETWORK_ERROR'),
      };
    }
    return { success: false, message: 'Lỗi không xác định', errorCode: 'UNKNOWN' };
  }
}

// Các helper ngắn gọn theo method.
export const api = {
  get: <T = unknown>(url: string, config?: AxiosRequestConfig) =>
    apiRequest<T>('GET', url, undefined, config),
  post: <T = unknown>(url: string, body?: unknown, config?: AxiosRequestConfig) =>
    apiRequest<T>('POST', url, body, config),
  patch: <T = unknown>(url: string, body?: unknown, config?: AxiosRequestConfig) =>
    apiRequest<T>('PATCH', url, body, config),
  put: <T = unknown>(url: string, body?: unknown, config?: AxiosRequestConfig) =>
    apiRequest<T>('PUT', url, body, config),
  delete: <T = unknown>(url: string, config?: AxiosRequestConfig) =>
    apiRequest<T>('DELETE', url, undefined, config),
};
