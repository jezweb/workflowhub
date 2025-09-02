import { create } from 'zustand';
import { authApi } from '@/lib/api';

interface User {
  id: string;
  username: string;
  email: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<any>;
  logout: () => void;
  verifyToken: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
  const storedToken = localStorage.getItem('token');
  
  return {
    user: null,
    token: storedToken,
    isLoading: !!storedToken, // Set loading to true if token exists
    error: null,
    
    login: async (username: string, password: string) => {
      set({ isLoading: true, error: null });
      try {
        const response = await authApi.login(username, password);
        localStorage.setItem('token', response.token);
        set({
          user: response.user,
          token: response.token,
          isLoading: false,
        });
      } catch (error: any) {
        set({
          error: error.message || 'Login failed',
          isLoading: false,
        });
        throw error;
      }
    },
    
    register: async (username: string, email: string, password: string) => {
      set({ isLoading: true, error: null });
      try {
        const response = await authApi.register(username, email, password);
        // Don't store token or log in user - they need to verify email first
        if (response.requiresVerification) {
          set({
            isLoading: false,
            error: null, // Registration successful, no error
          });
          return response; // Return response so caller knows verification is required
        }
        // This shouldn't happen with current backend, but handle it just in case
        set({
          isLoading: false,
          error: 'Unexpected response from server',
        });
      } catch (error: any) {
        set({
          error: error.message || 'Registration failed',
          isLoading: false,
        });
        throw error;
      }
    },
    
    logout: () => {
      localStorage.removeItem('token');
      set({ user: null, token: null, error: null });
    },
    
    verifyToken: async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        set({ user: null, token: null, isLoading: false });
        return;
      }
      
      set({ isLoading: true });
      try {
        const response = await authApi.verify();
        set({
          user: response.user,
          token,
          isLoading: false,
        });
      } catch {
        localStorage.removeItem('token');
        set({
          user: null,
          token: null,
          isLoading: false,
        });
      }
    },
  
    clearError: () => set({ error: null }),
  };
});