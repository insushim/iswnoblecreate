import { create } from 'zustand';
import { db, createDefaultCharacter } from '@/lib/db';
import { Character, Relationship } from '@/types';

interface CharacterState {
  characters: Character[];
  currentCharacter: Character | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchCharacters: (projectId: string) => Promise<void>;
  fetchCharacter: (id: string) => Promise<void>;
  createCharacter: (projectId: string, data: Partial<Character>) => Promise<Character>;
  updateCharacter: (id: string, data: Partial<Character>) => Promise<void>;
  deleteCharacter: (id: string) => Promise<void>;
  addRelationship: (characterId: string, relationship: Relationship) => Promise<void>;
  updateRelationship: (characterId: string, targetId: string, data: Partial<Relationship>) => Promise<void>;
  removeRelationship: (characterId: string, targetId: string) => Promise<void>;
  setCurrentCharacter: (character: Character | null) => void;
  clearError: () => void;
}

export const useCharacterStore = create<CharacterState>((set, get) => ({
  characters: [],
  currentCharacter: null,
  isLoading: false,
  error: null,

  fetchCharacters: async (projectId: string) => {
    set({ isLoading: true, error: null });
    try {
      const characters = await db.characters
        .where('projectId')
        .equals(projectId)
        .toArray();
      set({ characters, isLoading: false });
    } catch (error) {
      set({ error: '캐릭터 목록을 불러오는데 실패했습니다.', isLoading: false });
    }
  },

  fetchCharacter: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const character = await db.characters.get(id);
      if (character) {
        set({ currentCharacter: character, isLoading: false });
      } else {
        set({ error: '캐릭터를 찾을 수 없습니다.', isLoading: false });
      }
    } catch (error) {
      set({ error: '캐릭터를 불러오는데 실패했습니다.', isLoading: false });
    }
  },

  createCharacter: async (projectId: string, data: Partial<Character>) => {
    set({ isLoading: true, error: null });
    try {
      const newCharacter = createDefaultCharacter(projectId, data);
      await db.characters.add(newCharacter);
      const characters = [...get().characters, newCharacter];
      set({ characters, currentCharacter: newCharacter, isLoading: false });
      return newCharacter;
    } catch (error) {
      set({ error: '캐릭터 생성에 실패했습니다.', isLoading: false });
      throw error;
    }
  },

  updateCharacter: async (id: string, data: Partial<Character>) => {
    set({ isLoading: true, error: null });
    try {
      const updatedData = { ...data, updatedAt: new Date() };
      await db.characters.update(id, updatedData);

      const characters = get().characters.map(c =>
        c.id === id ? { ...c, ...updatedData } : c
      );

      const currentCharacter = get().currentCharacter;
      if (currentCharacter?.id === id) {
        set({ currentCharacter: { ...currentCharacter, ...updatedData } });
      }

      set({ characters, isLoading: false });
    } catch (error) {
      set({ error: '캐릭터 업데이트에 실패했습니다.', isLoading: false });
    }
  },

  deleteCharacter: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await db.characters.delete(id);

      // 다른 캐릭터의 관계에서도 제거
      const characters = get().characters;
      for (const char of characters) {
        if (char.relationships.some(r => r.targetId === id)) {
          const updatedRelationships = char.relationships.filter(r => r.targetId !== id);
          await db.characters.update(char.id, { relationships: updatedRelationships });
        }
      }

      const updatedCharacters = characters.filter(c => c.id !== id).map(c => ({
        ...c,
        relationships: c.relationships.filter(r => r.targetId !== id)
      }));

      const currentCharacter = get().currentCharacter;
      set({
        characters: updatedCharacters,
        currentCharacter: currentCharacter?.id === id ? null : currentCharacter,
        isLoading: false
      });
    } catch (error) {
      set({ error: '캐릭터 삭제에 실패했습니다.', isLoading: false });
    }
  },

  addRelationship: async (characterId: string, relationship: Relationship) => {
    set({ isLoading: true, error: null });
    try {
      const character = await db.characters.get(characterId);
      if (!character) throw new Error('캐릭터를 찾을 수 없습니다.');

      const updatedRelationships = [...character.relationships, relationship];
      await db.characters.update(characterId, {
        relationships: updatedRelationships,
        updatedAt: new Date()
      });

      const characters = get().characters.map(c =>
        c.id === characterId ? { ...c, relationships: updatedRelationships, updatedAt: new Date() } : c
      );

      const currentCharacter = get().currentCharacter;
      if (currentCharacter?.id === characterId) {
        set({ currentCharacter: { ...currentCharacter, relationships: updatedRelationships } });
      }

      set({ characters, isLoading: false });
    } catch (error) {
      set({ error: '관계 추가에 실패했습니다.', isLoading: false });
    }
  },

  updateRelationship: async (characterId: string, targetId: string, data: Partial<Relationship>) => {
    set({ isLoading: true, error: null });
    try {
      const character = await db.characters.get(characterId);
      if (!character) throw new Error('캐릭터를 찾을 수 없습니다.');

      const updatedRelationships = character.relationships.map(r =>
        r.targetId === targetId ? { ...r, ...data } : r
      );

      await db.characters.update(characterId, {
        relationships: updatedRelationships,
        updatedAt: new Date()
      });

      const characters = get().characters.map(c =>
        c.id === characterId ? { ...c, relationships: updatedRelationships, updatedAt: new Date() } : c
      );

      const currentCharacter = get().currentCharacter;
      if (currentCharacter?.id === characterId) {
        set({ currentCharacter: { ...currentCharacter, relationships: updatedRelationships } });
      }

      set({ characters, isLoading: false });
    } catch (error) {
      set({ error: '관계 업데이트에 실패했습니다.', isLoading: false });
    }
  },

  removeRelationship: async (characterId: string, targetId: string) => {
    set({ isLoading: true, error: null });
    try {
      const character = await db.characters.get(characterId);
      if (!character) throw new Error('캐릭터를 찾을 수 없습니다.');

      const updatedRelationships = character.relationships.filter(r => r.targetId !== targetId);
      await db.characters.update(characterId, {
        relationships: updatedRelationships,
        updatedAt: new Date()
      });

      const characters = get().characters.map(c =>
        c.id === characterId ? { ...c, relationships: updatedRelationships, updatedAt: new Date() } : c
      );

      const currentCharacter = get().currentCharacter;
      if (currentCharacter?.id === characterId) {
        set({ currentCharacter: { ...currentCharacter, relationships: updatedRelationships } });
      }

      set({ characters, isLoading: false });
    } catch (error) {
      set({ error: '관계 삭제에 실패했습니다.', isLoading: false });
    }
  },

  setCurrentCharacter: (character) => {
    set({ currentCharacter: character });
  },

  clearError: () => {
    set({ error: null });
  },
}));
