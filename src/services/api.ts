import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 60000, // 60s default timeout
});

// Attach JWT Bearer token on every request if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pocketcloud_token');
  if (token && config.headers) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Handle authentication expiration or rate limit errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      if (error.response.status === 401) {
        localStorage.removeItem('pocketcloud_token');
        localStorage.removeItem('pocketcloud_user');
        window.dispatchEvent(new Event('auth_expired'));
      }
    }
    return Promise.reject(error);
  }
);

export default api;
