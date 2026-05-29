import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ThemeMode } from '../utils/theme';

interface AppState {
  theme: ThemeMode;
  language: string;
  setTheme: (theme: ThemeMode) => void;
  setLanguage: (language: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: 'system',
      language: 'zh-CN',
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
    }),
    {
      name: 'app-storage',
    },
  ),
);
