import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { db, initializeAppSettings } from '@/lib/db';
import { AppSettings } from '@/types';

interface SettingsState {
  settings: AppSettings | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  initSettings: () => Promise<void>;
  updateSettings: (data: Partial<AppSettings>) => Promise<void>;
  setGeminiApiKey: (key: string) => Promise<void>;
  clearError: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      settings: null,
      isLoading: false,
      error: null,

      initSettings: async () => {
        set({ isLoading: true, error: null });
        try {
          const settings = await initializeAppSettings();
          set({ settings, isLoading: false });
        } catch (error) {
          set({ error: '설정을 불러오는데 실패했습니다.', isLoading: false });
        }
      },

      updateSettings: async (data: Partial<AppSettings>) => {
        set({ isLoading: true, error: null });
        try {
          const currentSettings = get().settings;
          if (!currentSettings) {
            throw new Error('설정이 초기화되지 않았습니다.');
          }

          const updatedSettings = { ...currentSettings, ...data };
          await db.appSettings.update('default', data);
          set({ settings: updatedSettings, isLoading: false });
        } catch (error) {
          set({ error: '설정 업데이트에 실패했습니다.', isLoading: false });
        }
      },

      setGeminiApiKey: async (key: string) => {
        await get().updateSettings({ geminiApiKey: key });
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'novel-forge-settings',
      partialize: (state) => ({
        // API 키는 로컬 스토리지에도 저장 (IndexedDB 백업)
        geminiApiKey: state.settings?.geminiApiKey,
      }),
    }
  )
);
