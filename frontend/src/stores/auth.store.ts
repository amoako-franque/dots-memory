import { create } from 'zustand';
import api from '../lib/api';

interface User {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role: string;
}

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (accessToken: string, user: User) => void;
    logout: () => void;
    checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isAuthenticated: false,
    isLoading: true,

    login: (accessToken, user) => {
        localStorage.setItem('accessToken', accessToken);
        set({ user, isAuthenticated: true });
    },

    logout: () => {
        localStorage.removeItem('accessToken');
        set({ user: null, isAuthenticated: false });
    },

    checkAuth: async () => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            set({ isLoading: false, isAuthenticated: false, user: null });
            return;
        }

        try {
            const response = await api.get('/users/me');
            set({ user: response.data.data.user, isAuthenticated: true });
        } catch (error) {
            set({ isAuthenticated: false, user: null });
        } finally {
            set({ isLoading: false });
        }
    },
}));
