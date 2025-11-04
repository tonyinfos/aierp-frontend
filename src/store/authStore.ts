// ai-erp-frontend/src/store/authStore.ts
// (V5.2 - 修正了 "companies: any[]" 錯誤)

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import apiClient from '../api/apiClient';
import axios from 'axios';

// --- (新！) V5.0 前端使用者型別 ---

// (已移除) AuthProvider, Channel
// (因為它們只在 "啟用頁面" 被使用，
//  authStore 的核心 User 介面不需要它們)

// (關鍵 1)
// 為了 "User" 介面，我們先定義「公司」的基礎型別
export interface Company {
  id: number;
  name: string;
  // (未來可以加入 tax_id, address 等...)
}

export interface User {
  id: number;
  provider: string;
  provider_id: string;
  email: string | null;
  line_id: string | null;
  display_name: string | null;
  avatar_url: string | null;
  is_active: boolean;

  // (關鍵 2)
  // 將 "any[]" 修正為 "Company[]"
  companies: Company[]; 
}

// --- V5.0 AuthState 介面 (保持不變) ---
interface AuthState {
  token: string | null;
  user: User | null;
  isInitializing: boolean; 

  setToken: (token: string) => Promise<void>;
  fetchCurrentUser: () => Promise<void>;
  logout: () => void;
  _setIsInitializing: (status: boolean) => void;
}

export const useAuthStore = create(
  persist<AuthState>(
    (set, get) => ({
      token: null,
      user: null,
      isInitializing: true,

      _setIsInitializing: (status: boolean) => {
        set({ isInitializing: status });
      },

      setToken: async (token: string) => {
        set({ token: token, isInitializing: true });
        try {
          await get().fetchCurrentUser();
        } catch (error: unknown) {
          let errorMessage = "setToken failed during fetchCurrentUser";
          if (axios.isAxiosError(error)) {
            errorMessage = error.message;
          } else if (error instanceof Error) {
            errorMessage = error.message;
          }
          console.error(errorMessage, error);
        }
      },

      fetchCurrentUser: async () => {
        try {
          const response = await apiClient.get<User>('/users/me');
          set({ user: response.data, isInitializing: false }); 
        } catch (error: unknown) {
          let errorMessage = "fetchCurrentUser 失敗 (Token 可能已過期或無效)";
          if (axios.isAxiosError(error)) {
            errorMessage = error.message;
          } else if (error instanceof Error) {
            errorMessage = error.message;
          }
          console.error(errorMessage, error);

          get().logout(); 
          throw error; 
        }
      },

      logout: () => {
        set({ token: null, user: null, isInitializing: false });
      },
    }),
    {
      name: 'auth-storage', 
      storage: createJSONStorage(() => localStorage),
    }
  )
);