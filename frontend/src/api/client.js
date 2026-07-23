import axios from "axios";
import { fetchAuthSession } from "aws-amplify/auth";

const BASE_URL = import.meta.env.VITE_API_ENDPOINT ?? "";

export const axiosClient = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15_000,
});

axiosClient.interceptors.request.use(async (config) => {
  try {
    const session = await fetchAuthSession();
    const idToken = session.tokens?.idToken?.toString();
    if (idToken) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${idToken}`;
    }
  } catch {
  }
  return config;
});

export async function apiRequest(method, url, body, config) {

  try {
    const res = await axiosClient.request({
      method,
      url,
      data: body,
      ...config,
    });
    return {
      success: true,
      data: res.data,
      message: res.data?.message,
    };
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const data = err.response?.data;
      if (data) return data;
      return {
        success: false,
        message: err.message,
        errorCode: String(err.response?.status ?? "NETWORK_ERROR"),
      };
    }
    return {
      success: false,
      message: "Lỗi không xác định",
      errorCode: "UNKNOWN",
    };
  }
}

export const api = {
  get: (url, config) => apiRequest("GET", url, undefined, config),
  post: (url, body, config) => apiRequest("POST", url, body, config),
  patch: (url, body, config) => apiRequest("PATCH", url, body, config),
  put: (url, body, config) => apiRequest("PUT", url, body, config),
  delete: (url, config) => apiRequest("DELETE", url, undefined, config),
};
