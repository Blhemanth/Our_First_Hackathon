import axios from 'axios';

/**
 * Shared Axios instance for all Dayflow API calls.
 *
 * Usage:
 *   import api from '../services/api';
 *   const { data } = await api.get('/users');
 *
 * The Authorization header is injected per-request via the interceptor below.
 * Call `setAuthToken(session.access_token)` after login, and
 * `setAuthToken(null)` after logout.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

let _token = null;

/**
 * Store the current session token so the interceptor can attach it.
 * Call this from AuthContext when the session changes.
 */
export const setAuthToken = (token) => {
  _token = token;
};

// Request interceptor — attaches the JWT to every outgoing request
api.interceptors.request.use(
  (config) => {
    if (_token) {
      config.headers['Authorization'] = `Bearer ${_token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — unwrap errors for cleaner catch blocks
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error?.response?.data?.error || error?.message || 'Something went wrong.';
    return Promise.reject(new Error(message));
  }
);

export default api;
