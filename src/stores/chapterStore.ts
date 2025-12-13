import { create } from 'zustand';
import { db, createDefaultChapter, createDefaultScene } from '@/lib/db';
import { Chapter, Scene, SceneVersion } from '@/types';

interface ChapterState {
  chapters: Chapter[];
  currentChapter: Chapter | null;
  currentScene: Scene | null;
  isLoading: boolean;
  error: string | null;

  // Chapter Actions
  fetchChapters: (projectId: string) => Promise<void>;
  fetchChapter: (id: string) => Promise<void>;
  createChapter: (projectId: string, data: Partial<Chapter>) => Promise<Chapter>;
  updateChapter: (id: string, data: Partial<Chapter>) => Promise<void>;
  deleteChapter: (id: string) => Promise<void>;
  reorderChapters: (projectId: string, chapterIds: string[]) => Promise<void>;
  setCurrentChapter: (chapter: Chapter | null) => void;

  // Scene Actions
  fetchScenes: (chapterId: string) => Promise<Scene[]>;
  createScene: (chapterId: string, data: Partial<Scene>) => Promise<Scene>;
  updateScene: (id: string, data: Partial<Scene>) => Promise<void>;
  deleteScene: (id: string) => Promise<void>;
  reorderScenes: (chapterId: string, sceneIds: string[]) => Promise<void>;
  setCurrentScene: (scene: Scene | null) => void;

  // Version Actions
  saveSceneVersion: (sceneId: string, content: string, type: SceneVersion['type'], note?: string) => Promise<void>;
  restoreSceneVersion: (sceneId: string, versionId: string) => Promise<void>;

  clearError: () => void;
}

export const useChapterStore = create<ChapterState>((set, get) => ({
  chapters: [],
  currentChapter: null,
  currentScene: null,
  isLoading: false,
  error: null,

  fetchChapters: async (projectId: string) => {
    set({ isLoading: true, error: null });
    try {
      const chapters = await db.chapters
        .where('projectId')
        .equals(projectId)
        .sortBy('number');
      set({ chapters, isLoading: false });
    } catch (error) {
      set({ error: '챕터 목록을 불러오는데 실패했습니다.', isLoading: false });
    }
  },

  fetchChapter: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const chapter = await db.chapters.get(id);
      if (chapter) {
        // 씬도 함께 로드
        const scenes = await db.scenes
          .where('chapterId')
          .equals(id)
          .sortBy('order');
        const chapterWithScenes = { ...chapter, scenes };
        set({ currentChapter: chapterWithScenes, isLoading: false });
      } else {
        set({ error: '챕터를 찾을 수 없습니다.', isLoading: false });
      }
    } catch (error) {
      set({ error: '챕터를 불러오는데 실패했습니다.', isLoading: false });
    }
  },

  createChapter: async (projectId: string, data: Partial<Chapter>) => {
    set({ isLoading: true, error: null });
    try {
      const chapters = await db.chapters
        .where('projectId')
        .equals(projectId)
        .toArray();
      const nextNumber = chapters.length + 1;

      const newChapter = createDefaultChapter(projectId, nextNumber, data);
      await db.chapters.add(newChapter);

      const updatedChapters = [...get().chapters, newChapter].sort((a, b) => a.number - b.number);
      set({ chapters: updatedChapters, currentChapter: newChapter, isLoading: false });
      return newChapter;
    } catch (error) {
      set({ error: '챕터 생성에 실패했습니다.', isLoading: false });
      throw error;
    }
  },

  updateChapter: async (id: string, data: Partial<Chapter>) => {
    set({ isLoading: true, error: null });
    try {
      const updatedData = { ...data, updatedAt: new Date() };
      await db.chapters.update(id, updatedData);

      const chapters = get().chapters.map(c =>
        c.id === id ? { ...c, ...updatedData } : c
      );

      const currentChapter = get().currentChapter;
      if (currentChapter?.id === id) {
        set({ currentChapter: { ...currentChapter, ...updatedData } });
      }

      set({ chapters, isLoading: false });
    } catch (error) {
      set({ error: '챕터 업데이트에 실패했습니다.', isLoading: false });
    }
  },

  deleteChapter: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const chapter = await db.chapters.get(id);
      if (!chapter) throw new Error('챕터를 찾을 수 없습니다.');

      // 관련 씬들도 삭제
      await db.scenes.where('chapterId').equals(id).delete();
      await db.chapters.delete(id);

      // 남은 챕터들의 번호 재정렬
      const remainingChapters = get().chapters
        .filter(c => c.id !== id)
        .sort((a, b) => a.number - b.number)
        .map((c, index) => ({ ...c, number: index + 1 }));

      for (const c of remainingChapters) {
        await db.chapters.update(c.id, { number: c.number });
      }

      const currentChapter = get().currentChapter;
      set({
        chapters: remainingChapters,
        currentChapter: currentChapter?.id === id ? null : currentChapter,
        isLoading: false
      });
    } catch (error) {
      set({ error: '챕터 삭제에 실패했습니다.', isLoading: false });
    }
  },

  reorderChapters: async (projectId: string, chapterIds: string[]) => {
    set({ isLoading: true, error: null });
    try {
      const chapters = get().chapters;
      const reorderedChapters = chapterIds.map((id, index) => {
        const chapter = chapters.find(c => c.id === id);
        return chapter ? { ...chapter, number: index + 1 } : null;
      }).filter((c): c is Chapter => c !== null);

      for (const c of reorderedChapters) {
        await db.chapters.update(c.id, { number: c.number, updatedAt: new Date() });
      }

      set({ chapters: reorderedChapters, isLoading: false });
    } catch (error) {
      set({ error: '챕터 순서 변경에 실패했습니다.', isLoading: false });
    }
  },

  setCurrentChapter: (chapter) => {
    set({ currentChapter: chapter });
  },

  fetchScenes: async (chapterId: string) => {
    try {
      const scenes = await db.scenes
        .where('chapterId')
        .equals(chapterId)
        .sortBy('order');
      return scenes;
    } catch (error) {
      set({ error: '씬 목록을 불러오는데 실패했습니다.' });
      return [];
    }
  },

  createScene: async (chapterId: string, data: Partial<Scene>) => {
    set({ isLoading: true, error: null });
    try {
      const scenes = await db.scenes
        .where('chapterId')
        .equals(chapterId)
        .toArray();
      const nextOrder = scenes.length + 1;

      const newScene = createDefaultScene(chapterId, nextOrder, data);
      await db.scenes.add(newScene);

      // 현재 챕터의 씬 목록 업데이트
      const currentChapter = get().currentChapter;
      if (currentChapter?.id === chapterId) {
        const updatedScenes = [...currentChapter.scenes, newScene].sort((a, b) => a.order - b.order);
        set({ currentChapter: { ...currentChapter, scenes: updatedScenes }, currentScene: newScene, isLoading: false });
      } else {
        set({ currentScene: newScene, isLoading: false });
      }

      return newScene;
    } catch (error) {
      set({ error: '씬 생성에 실패했습니다.', isLoading: false });
      throw error;
    }
  },

  updateScene: async (id: string, data: Partial<Scene>) => {
    set({ isLoading: true, error: null });
    try {
      // 글자 수 계산
      if (data.content !== undefined) {
        data.wordCount = data.content.replace(/\s/g, '').length;
      }

      const updatedData = { ...data, updatedAt: new Date() };
      await db.scenes.update(id, updatedData);

      const currentChapter = get().currentChapter;
      if (currentChapter) {
        const updatedScenes = currentChapter.scenes.map(s =>
          s.id === id ? { ...s, ...updatedData } : s
        );

        // 챕터의 총 글자 수 업데이트
        const totalWordCount = updatedScenes.reduce((sum, s) => sum + s.wordCount, 0);
        await db.chapters.update(currentChapter.id, { wordCount: totalWordCount, updatedAt: new Date() });

        set({
          currentChapter: { ...currentChapter, scenes: updatedScenes, wordCount: totalWordCount },
          isLoading: false
        });
      }

      const currentScene = get().currentScene;
      if (currentScene?.id === id) {
        set({ currentScene: { ...currentScene, ...updatedData } });
      }

      set({ isLoading: false });
    } catch (error) {
      set({ error: '씬 업데이트에 실패했습니다.', isLoading: false });
    }
  },

  deleteScene: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const scene = await db.scenes.get(id);
      if (!scene) throw new Error('씬을 찾을 수 없습니다.');

      await db.scenes.delete(id);

      // 남은 씬들의 순서 재정렬
      const remainingScenes = await db.scenes
        .where('chapterId')
        .equals(scene.chapterId)
        .sortBy('order');

      for (let i = 0; i < remainingScenes.length; i++) {
        await db.scenes.update(remainingScenes[i].id, { order: i + 1 });
        remainingScenes[i].order = i + 1;
      }

      const currentChapter = get().currentChapter;
      if (currentChapter?.id === scene.chapterId) {
        const totalWordCount = remainingScenes.reduce((sum, s) => sum + s.wordCount, 0);
        set({ currentChapter: { ...currentChapter, scenes: remainingScenes, wordCount: totalWordCount } });
      }

      const currentScene = get().currentScene;
      set({
        currentScene: currentScene?.id === id ? null : currentScene,
        isLoading: false
      });
    } catch (error) {
      set({ error: '씬 삭제에 실패했습니다.', isLoading: false });
    }
  },

  reorderScenes: async (chapterId: string, sceneIds: string[]) => {
    set({ isLoading: true, error: null });
    try {
      const currentChapter = get().currentChapter;
      if (!currentChapter || currentChapter.id !== chapterId) {
        throw new Error('챕터가 로드되지 않았습니다.');
      }

      const reorderedScenes = sceneIds.map((id, index) => {
        const scene = currentChapter.scenes.find(s => s.id === id);
        return scene ? { ...scene, order: index + 1 } : null;
      }).filter((s): s is Scene => s !== null);

      for (const s of reorderedScenes) {
        await db.scenes.update(s.id, { order: s.order, updatedAt: new Date() });
      }

      set({ currentChapter: { ...currentChapter, scenes: reorderedScenes }, isLoading: false });
    } catch (error) {
      set({ error: '씬 순서 변경에 실패했습니다.', isLoading: false });
    }
  },

  setCurrentScene: (scene) => {
    set({ currentScene: scene });
  },

  saveSceneVersion: async (sceneId: string, content: string, type: SceneVersion['type'], note?: string) => {
    try {
      const scene = await db.scenes.get(sceneId);
      if (!scene) throw new Error('씬을 찾을 수 없습니다.');

      const newVersion: SceneVersion = {
        id: crypto.randomUUID(),
        content,
        wordCount: content.replace(/\s/g, '').length,
        createdAt: new Date(),
        type,
        note,
      };

      const updatedVersions = [...scene.versions, newVersion];
      await db.scenes.update(sceneId, { versions: updatedVersions });

      const currentScene = get().currentScene;
      if (currentScene?.id === sceneId) {
        set({ currentScene: { ...currentScene, versions: updatedVersions } });
      }

      const currentChapter = get().currentChapter;
      if (currentChapter) {
        const updatedScenes = currentChapter.scenes.map(s =>
          s.id === sceneId ? { ...s, versions: updatedVersions } : s
        );
        set({ currentChapter: { ...currentChapter, scenes: updatedScenes } });
      }
    } catch (error) {
      set({ error: '버전 저장에 실패했습니다.' });
    }
  },

  restoreSceneVersion: async (sceneId: string, versionId: string) => {
    set({ isLoading: true, error: null });
    try {
      const scene = await db.scenes.get(sceneId);
      if (!scene) throw new Error('씬을 찾을 수 없습니다.');

      const version = scene.versions.find(v => v.id === versionId);
      if (!version) throw new Error('버전을 찾을 수 없습니다.');

      // 현재 상태를 버전으로 저장
      const currentVersion: SceneVersion = {
        id: crypto.randomUUID(),
        content: scene.content,
        wordCount: scene.wordCount,
        createdAt: new Date(),
        type: 'manual',
        note: '버전 복원 전 자동 저장',
      };

      const updatedVersions = [...scene.versions, currentVersion];
      await db.scenes.update(sceneId, {
        content: version.content,
        wordCount: version.wordCount,
        versions: updatedVersions,
        updatedAt: new Date(),
      });

      const currentScene = get().currentScene;
      if (currentScene?.id === sceneId) {
        set({
          currentScene: {
            ...currentScene,
            content: version.content,
            wordCount: version.wordCount,
            versions: updatedVersions,
          },
          isLoading: false
        });
      }
    } catch (error) {
      set({ error: '버전 복원에 실패했습니다.', isLoading: false });
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
