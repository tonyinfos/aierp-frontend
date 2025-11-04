import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// 1. 定義主題模式的型別
type ThemeMode = 'light' | 'dark';

// 2. 定義 "主題大腦" 裡要存放的東西
interface ThemeState {
  themeMode: ThemeMode; // 目前的主題模式
  toggleTheme: () => void; // 切換主題的函式
}

// 3. 建立我們的 "主題大腦" (Store)
//    使用 persist 將使用者的選擇儲存在 localStorage
export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      // 預設主題模式 (可以是 'light' 或 'dark')
      themeMode: 'dark', // 我們之前設定了暗色，這裡保持一致

      // 切換主題的函式
      toggleTheme: () =>
        set((state) => ({
          // 如果目前是 'dark' 就切換到 'light'，反之亦然
          themeMode: state.themeMode === 'dark' ? 'light' : 'dark',
        })),
    }),
    {
      name: 'theme-storage', // 在 localStorage 中的儲存名稱
      storage: createJSONStorage(() => localStorage), // 指定使用 localStorage
    }
  )
);