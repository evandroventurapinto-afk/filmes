import { create } from 'zustand';
import { createMMKV } from 'react-native-mmkv';
import axios from 'axios';
import Constants from 'expo-constants';

const storage = createMMKV();

const BACKEND_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface User {
  id: string;
  email: string;
  name: string;
  picture: string;
}

interface AuthState {
  user: User | null;
  sessionToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setSessionToken: (token: string | null) => void;
  login: (sessionId: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  sessionToken: storage.getString('session_token') || null,
  isLoading: false,
  isAuthenticated: false,
  
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  
  setSessionToken: (token) => {
    if (token) {
      storage.set('session_token', token);
    } else {
      storage.delete('session_token');
    }
    set({ sessionToken: token });
  },
  
  login: async (sessionId: string) => {
    try {
      set({ isLoading: true });
      const response = await axios.post(
        `${BACKEND_URL}/api/auth/session`,
        {},
        {
          headers: {
            'X-Session-ID': sessionId,
          },
        }
      );
      
      const { user, session_token } = response.data;
      get().setSessionToken(session_token);
      get().setUser(user);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
  
  logout: async () => {
    try {
      const token = get().sessionToken;
      if (token) {
        await axios.post(
          `${BACKEND_URL}/api/auth/logout`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      get().setSessionToken(null);
      get().setUser(null);
    }
  },
  
  checkAuth: async () => {
    const token = get().sessionToken;
    if (!token) {
      set({ isAuthenticated: false, user: null });
      return;
    }
    
    try {
      set({ isLoading: true });
      const response = await axios.get(`${BACKEND_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      get().setUser(response.data);
    } catch (error) {
      console.error('Auth check error:', error);
      get().setSessionToken(null);
      get().setUser(null);
    } finally {
      set({ isLoading: false });
    }
  },
}));