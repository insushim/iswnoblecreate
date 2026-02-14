import { create } from 'zustand';
import { db, createDefaultWorldSetting } from '@/lib/db';
import { WorldSetting, DictionaryEntry, Location } from '@/types';

interface WorldState {
  worldSettings: WorldSetting[];
  dictionary: DictionaryEntry[];
  locations: Location[];
  currentSetting: WorldSetting | null;
  isLoading: boolean;
  error: string | null;

  // World Settings Actions
  fetchWorldSettings: (projectId: string) => Promise<void>;
  createWorldSetting: (projectId: string, data: Partial<WorldSetting>) => Promise<WorldSetting>;
  updateWorldSetting: (id: string, data: Partial<WorldSetting>) => Promise<void>;
  deleteWorldSetting: (id: string) => Promise<void>;
  setCurrentSetting: (setting: WorldSetting | null) => void;

  // Dictionary Actions
  fetchDictionary: (projectId: string) => Promise<void>;
  addDictionaryEntry: (projectId: string, entry: Partial<DictionaryEntry>) => Promise<DictionaryEntry>;
  updateDictionaryEntry: (id: string, data: Partial<DictionaryEntry>) => Promise<void>;
  deleteDictionaryEntry: (id: string) => Promise<void>;

  // Location Actions
  fetchLocations: (projectId: string) => Promise<void>;
  createLocation: (projectId: string, data: Partial<Location>) => Promise<Location>;
  updateLocation: (id: string, data: Partial<Location>) => Promise<void>;
  deleteLocation: (id: string) => Promise<void>;

  clearError: () => void;
}

export const useWorldStore = create<WorldState>((set, get) => ({
  worldSettings: [],
  dictionary: [],
  locations: [],
  currentSetting: null,
  isLoading: false,
  error: null,

  fetchWorldSettings: async (projectId: string) => {
    set({ isLoading: true, error: null, currentSetting: null });
    try {
      const worldSettings = await db.worldSettings
        .where('projectId')
        .equals(projectId)
        .toArray();
      set({ worldSettings, isLoading: false });
    } catch (error) {
      set({ error: '세계관 설정을 불러오는데 실패했습니다.', isLoading: false });
    }
  },

  createWorldSetting: async (projectId: string, data: Partial<WorldSetting>) => {
    set({ isLoading: true, error: null });
    try {
      const newSetting = createDefaultWorldSetting(projectId, data);
      await db.worldSettings.add(newSetting);
      const worldSettings = [...get().worldSettings, newSetting];
      set({ worldSettings, currentSetting: newSetting, isLoading: false });
      return newSetting;
    } catch (error) {
      set({ error: '세계관 설정 생성에 실패했습니다.', isLoading: false });
      throw error;
    }
  },

  updateWorldSetting: async (id: string, data: Partial<WorldSetting>) => {
    set({ isLoading: true, error: null });
    try {
      const updatedData = { ...data, updatedAt: new Date() };
      await db.worldSettings.update(id, updatedData);

      const worldSettings = get().worldSettings.map(s =>
        s.id === id ? { ...s, ...updatedData } : s
      );

      const currentSetting = get().currentSetting;
      if (currentSetting?.id === id) {
        set({ currentSetting: { ...currentSetting, ...updatedData } });
      }

      set({ worldSettings, isLoading: false });
    } catch (error) {
      set({ error: '세계관 설정 업데이트에 실패했습니다.', isLoading: false });
    }
  },

  deleteWorldSetting: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await db.worldSettings.delete(id);
      const worldSettings = get().worldSettings.filter(s => s.id !== id);
      const currentSetting = get().currentSetting;
      set({
        worldSettings,
        currentSetting: currentSetting?.id === id ? null : currentSetting,
        isLoading: false
      });
    } catch (error) {
      set({ error: '세계관 설정 삭제에 실패했습니다.', isLoading: false });
    }
  },

  setCurrentSetting: (setting) => {
    set({ currentSetting: setting });
  },

  fetchDictionary: async (projectId: string) => {
    set({ isLoading: true, error: null });
    try {
      const dictionary = await db.dictionary
        .where('projectId')
        .equals(projectId)
        .toArray();
      set({ dictionary, isLoading: false });
    } catch (error) {
      set({ error: '용어 사전을 불러오는데 실패했습니다.', isLoading: false });
    }
  },

  addDictionaryEntry: async (projectId: string, entry: Partial<DictionaryEntry>) => {
    set({ isLoading: true, error: null });
    try {
      const newEntry: DictionaryEntry = {
        id: crypto.randomUUID(),
        projectId,
        term: '',
        definition: '',
        category: '일반',
        createdAt: new Date(),
        ...entry,
      };
      await db.dictionary.add(newEntry);
      const dictionary = [...get().dictionary, newEntry];
      set({ dictionary, isLoading: false });
      return newEntry;
    } catch (error) {
      set({ error: '용어 추가에 실패했습니다.', isLoading: false });
      throw error;
    }
  },

  updateDictionaryEntry: async (id: string, data: Partial<DictionaryEntry>) => {
    set({ isLoading: true, error: null });
    try {
      await db.dictionary.update(id, data);
      const dictionary = get().dictionary.map(d =>
        d.id === id ? { ...d, ...data } : d
      );
      set({ dictionary, isLoading: false });
    } catch (error) {
      set({ error: '용어 업데이트에 실패했습니다.', isLoading: false });
    }
  },

  deleteDictionaryEntry: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await db.dictionary.delete(id);
      const dictionary = get().dictionary.filter(d => d.id !== id);
      set({ dictionary, isLoading: false });
    } catch (error) {
      set({ error: '용어 삭제에 실패했습니다.', isLoading: false });
    }
  },

  fetchLocations: async (projectId: string) => {
    set({ isLoading: true, error: null });
    try {
      const locations = await db.locations
        .where('projectId')
        .equals(projectId)
        .toArray();
      set({ locations, isLoading: false });
    } catch (error) {
      set({ error: '장소 목록을 불러오는데 실패했습니다.', isLoading: false });
    }
  },

  createLocation: async (projectId: string, data: Partial<Location>) => {
    set({ isLoading: true, error: null });
    try {
      const newLocation: Location = {
        id: crypto.randomUUID(),
        projectId,
        name: '',
        type: 'other',
        description: '',
        atmosphere: '',
        significance: '',
        createdAt: new Date(),
        ...data,
      };
      await db.locations.add(newLocation);
      const locations = [...get().locations, newLocation];
      set({ locations, isLoading: false });
      return newLocation;
    } catch (error) {
      set({ error: '장소 생성에 실패했습니다.', isLoading: false });
      throw error;
    }
  },

  updateLocation: async (id: string, data: Partial<Location>) => {
    set({ isLoading: true, error: null });
    try {
      await db.locations.update(id, data);
      const locations = get().locations.map(l =>
        l.id === id ? { ...l, ...data } : l
      );
      set({ locations, isLoading: false });
    } catch (error) {
      set({ error: '장소 업데이트에 실패했습니다.', isLoading: false });
    }
  },

  deleteLocation: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      // 하위 장소도 함께 처리 (부모 ID 제거)
      const childLocations = get().locations.filter(l => l.parentLocationId === id);
      for (const child of childLocations) {
        await db.locations.update(child.id, { parentLocationId: undefined });
      }

      await db.locations.delete(id);
      const locations = get().locations
        .filter(l => l.id !== id)
        .map(l => l.parentLocationId === id ? { ...l, parentLocationId: undefined } : l);
      set({ locations, isLoading: false });
    } catch (error) {
      set({ error: '장소 삭제에 실패했습니다.', isLoading: false });
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
