import axios from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: false,
});

// Attach token from cookie on every request
api.interceptors.request.use((config) => {
  const token = Cookies.get('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally — redirect to login only on protected pages
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      Cookies.remove('auth_token', { path: '/' });
      Cookies.remove('auth_token');
      if (typeof window !== 'undefined') {
        const path = window.location.pathname;
        const isPublicPath =
          path === '/' ||
          path.startsWith('/catalog') ||
          path.startsWith('/student/catalog') ||
          path.startsWith('/courses') ||
          path.startsWith('/login') ||
          path.startsWith('/register');

        if (!isPublicPath) {
          window.location.replace('/');
        }
      }
    }
    return Promise.reject(error);
  },
);

export default api;
