import axios from 'axios';

const baseURL = (import.meta.env.VITE_API_URL || '') + '/api';

export const api = axios.create({ baseURL });

const TOKEN_KEY = 'pointage_token';

export function setToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

// Injecte le jeton JWT dans chaque requête.
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Déconnexion automatique en cas de 401.
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      setToken(null);
      if (!location.pathname.startsWith('/login')) {
        location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);
