import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'dark' | 'light' | 'sepia';
export type WritingMode = 'normal' | 'focus' | 'brainstorm' | 'flow' | 'edit';

interface UIState {
  // Theme
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;

  // Sidebar
  sidebarOpen: boolean;
  sidebarWidth: number;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSidebarWidth: (width: number) => void;

  // Context Panel (right panel)
  contextPanelOpen: boolean;
  contextPanelTab: string;
  toggleContextPanel: () => void;
  setContextPanelOpen: (open: boolean) => void;
  setContextPanelTab: (tab: string) => void;

  // Writing Mode
  writingMode: WritingMode;
  setWritingMode: (mode: WritingMode) => void;

  // Editor Settings
  editorFontSize: number;
  editorLineHeight: number;
  editorFontFamily: string;
  setEditorFontSize: (size: number) => void;
  setEditorLineHeight: (height: number) => void;
  setEditorFontFamily: (family: string) => void;

  // Modals
  activeModal: string | null;
  modalData: Record<string, unknown> | null;
  openModal: (modalId: string, data?: Record<string, unknown>) => void;
  closeModal: () => void;

  // Loading States
  globalLoading: boolean;
  loadingMessage: string;
  setGlobalLoading: (loading: boolean, message?: string) => void;

  // Notifications
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;

  // AI Generation State
  isAIGenerating: boolean;
  aiGenerationProgress: number;
  setAIGenerating: (generating: boolean, progress?: number) => void;

  // Pomodoro Timer
  pomodoroActive: boolean;
  pomodoroMinutes: number;
  pomodoroSeconds: number;
  pomodoroMode: 'work' | 'break';
  startPomodoro: (workMinutes?: number) => void;
  stopPomodoro: () => void;
  updatePomodoroTime: (minutes: number, seconds: number) => void;
  setPomodoroMode: (mode: 'work' | 'break') => void;
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      // Theme
      theme: 'dark',
      setTheme: (theme) => {
        set({ theme });
        // Apply theme to document
        document.documentElement.classList.remove('dark', 'light', 'sepia');
        document.documentElement.classList.add(theme);
      },

      // Sidebar
      sidebarOpen: true,
      sidebarWidth: 240,
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setSidebarWidth: (width) => set({ sidebarWidth: width }),

      // Context Panel
      contextPanelOpen: false,
      contextPanelTab: 'info',
      toggleContextPanel: () => set((state) => ({ contextPanelOpen: !state.contextPanelOpen })),
      setContextPanelOpen: (open) => set({ contextPanelOpen: open }),
      setContextPanelTab: (tab) => set({ contextPanelTab: tab }),

      // Writing Mode
      writingMode: 'normal',
      setWritingMode: (mode) => set({ writingMode: mode }),

      // Editor Settings
      editorFontSize: 18,
      editorLineHeight: 1.8,
      editorFontFamily: 'Pretendard',
      setEditorFontSize: (size) => set({ editorFontSize: size }),
      setEditorLineHeight: (height) => set({ editorLineHeight: height }),
      setEditorFontFamily: (family) => set({ editorFontFamily: family }),

      // Modals
      activeModal: null,
      modalData: null,
      openModal: (modalId, data) => set({ activeModal: modalId, modalData: data || null }),
      closeModal: () => set({ activeModal: null, modalData: null }),

      // Loading States
      globalLoading: false,
      loadingMessage: '',
      setGlobalLoading: (loading, message = '') => set({ globalLoading: loading, loadingMessage: message }),

      // Notifications
      notifications: [],
      addNotification: (notification) => {
        const id = crypto.randomUUID();
        const newNotification = { ...notification, id };
        set((state) => ({ notifications: [...state.notifications, newNotification] }));

        // Auto remove after duration
        if (notification.duration !== 0) {
          setTimeout(() => {
            get().removeNotification(id);
          }, notification.duration || 5000);
        }
      },
      removeNotification: (id) => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id)
        }));
      },
      clearNotifications: () => set({ notifications: [] }),

      // AI Generation State
      isAIGenerating: false,
      aiGenerationProgress: 0,
      setAIGenerating: (generating, progress = 0) => set({ isAIGenerating: generating, aiGenerationProgress: progress }),

      // Pomodoro Timer
      pomodoroActive: false,
      pomodoroMinutes: 25,
      pomodoroSeconds: 0,
      pomodoroMode: 'work',
      startPomodoro: (workMinutes = 25) => set({
        pomodoroActive: true,
        pomodoroMinutes: workMinutes,
        pomodoroSeconds: 0,
        pomodoroMode: 'work'
      }),
      stopPomodoro: () => set({
        pomodoroActive: false,
        pomodoroMinutes: 25,
        pomodoroSeconds: 0
      }),
      updatePomodoroTime: (minutes, seconds) => set({
        pomodoroMinutes: minutes,
        pomodoroSeconds: seconds
      }),
      setPomodoroMode: (mode) => set({
        pomodoroMode: mode,
        pomodoroMinutes: mode === 'work' ? 25 : 5,
        pomodoroSeconds: 0
      }),
    }),
    {
      name: 'novel-forge-ui',
      partialize: (state) => ({
        theme: state.theme,
        sidebarWidth: state.sidebarWidth,
        editorFontSize: state.editorFontSize,
        editorLineHeight: state.editorLineHeight,
        editorFontFamily: state.editorFontFamily,
      }),
    }
  )
);
