import axios from 'axios';

/**
 * Backend origin from Vite env (no path). Railway: https://your-api.up.railway.app
 * Use API_REST_BASE_URL or the shared `api` client for /api routes.
 */
export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
).replace(/\/$/, '');

/** Full base for ASP.NET Core controllers under [Route("api/...")]. */
export const API_REST_BASE_URL = `${API_BASE_URL}/api`;

/**
 * Shared axios instance for the MOC API (baseURL includes /api).
 */
export const api = axios.create({
  baseURL: API_REST_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    // TODO: Add real auth token when identity is implemented
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status } = error.response;
      if (status === 401) {
        console.error('Unauthorized - redirect to login');
      } else if (status === 403) {
        console.error('Forbidden - insufficient permissions');
      } else if (status === 500) {
        console.error('Server error:', error.response.data);
      }
    }
    return Promise.reject(error);
  }
);
