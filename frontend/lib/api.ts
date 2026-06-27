/**
 * MeetMind API Client
 * Centralized axios instance with error handling and auth headers.
 * Replace DEFAULT_USER_ID with JWT authentication in production.
 */
import axios, { AxiosError } from "axios";

const DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000001";

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1",
  headers: {
    "Content-Type": "application/json",
    // NOTE: Replace with JWT token from auth provider in production
    "X-User-Id": DEFAULT_USER_ID,
  },
  timeout: 30000,
});

// Response interceptor — unwrap data field
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const message =
      (error.response?.data as { error?: string })?.error ||
      error.message ||
      "An unexpected error occurred";
    return Promise.reject(new Error(message));
  }
);

// Helper to set userId dynamically (for future auth integration)
export function setAuthUser(userId: string) {
  apiClient.defaults.headers.common["X-User-Id"] = userId;
}

export default apiClient;
