import { create } from 'zustand';
import api from '../lib/api';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => void;
  fetchMe: () => Promise<void>;
  updateUser: (username: string, avatarURL: string, language?: string) => Promise<void>;
  setTokens: (accessToken: string, refreshToken: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true, // Start true while we check token

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const res = await api.post('/auth/login', { email, password });
      const { user, access_token, refresh_token } = res.data;
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  register: async (email, username, password) => {
    set({ isLoading: true });
    try {
      const res = await api.post('/auth/register', { email, username, password });
      const { user, access_token, refresh_token } = res.data;
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    set({ user: null, isAuthenticated: false, isLoading: false });
    window.location.href = '/login';
  },

  fetchMe: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get('/auth/me');
      set({ user: res.data, isAuthenticated: true, isLoading: false });
    } catch (err) {
      set({ user: null, isAuthenticated: false, isLoading: false });
      // Interceptor will handle the redirect if it's a 401
    }
  },

  updateUser: async (username, avatarURL, language) => {
    try {
      const res = await api.put('/auth/profile', { 
        username, 
        avatar_url: avatarURL,
        language
      });
      set({ user: res.data });
    } catch (err) {
      throw err;
    }
  },

  setTokens: async (accessToken, refreshToken) => {
    set({ isLoading: true });
    try {
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);
      
      // Fetch user profile
      const res = await api.get('/auth/me');
      set({ user: res.data, isAuthenticated: true, isLoading: false });
    } catch (err) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      set({ user: null, isAuthenticated: false, isLoading: false });
      throw err;
    }
  },
}));

// Initialize store on load
if (localStorage.getItem('access_token')) {
  useAuthStore.getState().fetchMe();
} else {
  useAuthStore.setState({ isLoading: false });
}
