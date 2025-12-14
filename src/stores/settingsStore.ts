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
        console.log('[SettingsStore] initSettings 호출됨');
        set({ isLoading: true, error: null });
        try {
          const settings = await initializeAppSettings();
          console.log('[SettingsStore] ✅ 설정 로드 완료');
          console.log('[SettingsStore] API 키 존재 여부:', !!settings.geminiApiKey);
          console.log('[SettingsStore] API 키 길이:', settings.geminiApiKey?.length || 0);
          set({ settings, isLoading: false });
        } catch (error) {
          console.error('[SettingsStore] ❌ 설정 로드 실패:', error);
          set({ error: '설정을 불러오는데 실패했습니다.', isLoading: false });
        }
      },

      updateSettings: async (data: Partial<AppSettings>) => {
        console.log('[SettingsStore] updateSettings 호출됨');
        console.log('[SettingsStore] 업데이트할 데이터:', Object.keys(data));
        if (data.geminiApiKey !== undefined) {
          console.log('[SettingsStore] API 키 업데이트, 길이:', data.geminiApiKey?.length || 0);
        }

        set({ isLoading: true, error: null });
        try {
          const currentSettings = get().settings;
          if (!currentSettings) {
            console.error('[SettingsStore] ❌ 현재 설정이 없습니다!');
            throw new Error('설정이 초기화되지 않았습니다.');
          }

          const updatedSettings = { ...currentSettings, ...data };
          console.log('[SettingsStore] DB 업데이트 시작...');
          await db.appSettings.update('default', data);
          console.log('[SettingsStore] ✅ DB 업데이트 완료');

          set({ settings: updatedSettings, isLoading: false });
          console.log('[SettingsStore] ✅ 상태 업데이트 완료');
        } catch (error) {
          console.error('[SettingsStore] ❌ 설정 업데이트 실패:', error);
          set({ error: '설정 업데이트에 실패했습니다.', isLoading: false });
        }
      },

      setGeminiApiKey: async (key: string) => {
        console.log('[SettingsStore] setGeminiApiKey 호출됨, 키 길이:', key?.length || 0);
        await get().updateSettings({ geminiApiKey: key });
      },

      clearError: () => {
        console.log('[SettingsStore] clearError 호출됨');
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
