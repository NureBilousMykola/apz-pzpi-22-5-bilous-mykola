import { create } from "zustand";
import type { User, LoginRequest, RegisterRequest } from "@/types";
import { apiClient } from "@/lib/api";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  loadUser: () => Promise<void>;
  isAdmin: () => boolean;
  isClient: () => boolean;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (credentials: LoginRequest) => {
    set({ isLoading: true, error: null });
    try {
      console.log("Attempting login with:", credentials.email);
      const response = await apiClient.login(credentials);
      const { access_token, user } = response;

      console.log(
        "Login successful for user:",
        user.email,
        "with roles:",
        user.roles.map((r) => r.role)
      );

      localStorage.setItem("auth_token", access_token);
      set({
        user,
        token: access_token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error: unknown) {
      console.error("Login error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Login failed";
      set({
        error: errorMessage,
        isLoading: false,
      });
      throw error;
    }
  },

  register: async (userData: RegisterRequest) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.register(userData);
      set({ isLoading: false, error: null });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Registration failed";
      set({
        error: errorMessage,
        isLoading: false,
      });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem("auth_token");
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null,
    });
  },

  clearError: () => {
    set({ error: null });
  },

  loadUser: async () => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      return;
    }

    set({ isLoading: true });
    try {
      const response = await apiClient.getProfile();
      set({
        user: response.data,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      localStorage.removeItem("auth_token");
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  isAdmin: () => {
    const { user } = get();
    return user?.roles?.some((role) => role.role === "admin") || false;
  },

  isClient: () => {
    const { user } = get();
    return user?.roles?.some((role) => role.role === "client") || false;
  },
}));
