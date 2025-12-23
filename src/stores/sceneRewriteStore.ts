import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  ParsedScene,
  SceneIssue,
  ParseResult,
  parseNovelIntoScenes,
  combineScenesToText,
  replaceScene,
  deleteScene,
  insertScene,
  reorderScenes,
} from '@/lib/sceneParser';

export interface SceneRewriteVersion {
  id: string;
  sceneId: string;
  content: string;
  wordCount: number;
  createdAt: Date;
  note?: string;
  type: 'original' | 'rewrite' | 'ai-generated' | 'merged';
}

interface SceneRewriteState {
  currentDocument: {
    id: string;
    title: string;
    originalText: string;
    parseResult: ParseResult | null;
  } | null;
  sceneVersions: Record<string, SceneRewriteVersion[]>;
  selectedSceneId: string | null;
  isLoading: boolean;
  isParsing: boolean;
  error: string | null;
  compareMode: {
    enabled: boolean;
    leftVersionId: string | null;
    rightVersionId: string | null;
  };
  history: {
    action: 'rewrite' | 'delete' | 'insert' | 'merge' | 'split' | 'reorder';
    sceneIds: string[];
    timestamp: Date;
    description: string;
  }[];
  loadDocument: (id: string, title: string, text: string) => void;
  parseDocument: () => void;
  selectScene: (sceneId: string | null) => void;
  rewriteScene: (sceneId: string, newContent: string, note?: string) => void;
  deleteSceneById: (sceneId: string) => void;
  insertSceneAfter: (afterSceneId: string, content: string) => void;
  mergeScenes: (sceneIds: string[]) => void;
  splitScene: (sceneId: string, splitPoints: number[]) => void;
  reorderScene: (sceneId: string, newIndex: number) => void;
  addVersion: (sceneId: string, content: string, type: SceneRewriteVersion['type'], note?: string) => void;
  restoreVersion: (sceneId: string, versionId: string) => void;
  deleteVersion: (sceneId: string, versionId: string) => void;
  setCompareMode: (enabled: boolean, leftId?: string, rightId?: string) => void;
  exportDocument: () => string;
  getSceneById: (sceneId: string) => ParsedScene | null;
  getSceneVersions: (sceneId: string) => SceneRewriteVersion[];
  getCurrentVersion: (sceneId: string) => SceneRewriteVersion | null;
  reset: () => void;
}

const initialState = {
  currentDocument: null,
  sceneVersions: {} as Record<string, SceneRewriteVersion[]>,
  selectedSceneId: null,
  isLoading: false,
  isParsing: false,
  error: null,
  compareMode: {
    enabled: false,
    leftVersionId: null,
    rightVersionId: null,
  },
  history: [] as SceneRewriteState['history'],
};

export const useSceneRewriteStore = create<SceneRewriteState>()(
  persist(
    (set, get) => ({
      ...initialState,

      loadDocument: (id: string, title: string, text: string) => {
        set({
          currentDocument: {
            id,
            title,
            originalText: text,
            parseResult: null,
          },
          sceneVersions: {},
          selectedSceneId: null,
          error: null,
        });
        get().parseDocument();
      },

      parseDocument: () => {
        const { currentDocument } = get();
        if (!currentDocument) return;

        set({ isParsing: true });

        try {
          const result = parseNovelIntoScenes(currentDocument.originalText);
          const versions: Record<string, SceneRewriteVersion[]> = {};

          for (const scene of result.scenes) {
            versions[scene.id] = [{
              id: `version-${scene.id}-original`,
              sceneId: scene.id,
              content: scene.content,
              wordCount: scene.wordCount,
              createdAt: new Date(),
              type: 'original',
              note: '원본',
            }];
          }

          set({
            currentDocument: {
              ...currentDocument,
              parseResult: result,
            },
            sceneVersions: versions,
            isParsing: false,
          });
        } catch (err) {
          set({
            error: `파싱 오류: ${err instanceof Error ? err.message : '알 수 없는 오류'}`,
            isParsing: false,
          });
        }
      },

      selectScene: (sceneId: string | null) => {
        set({ selectedSceneId: sceneId });
      },

      rewriteScene: (sceneId: string, newContent: string, note?: string) => {
        const { currentDocument } = get();
        if (!currentDocument?.parseResult) return;

        get().addVersion(sceneId, newContent, 'rewrite', note);

        const updatedScenes = replaceScene(
          currentDocument.parseResult.scenes,
          sceneId,
          newContent
        );

        const updatedScene = updatedScenes.find(s => s.id === sceneId);

        set({
          currentDocument: {
            ...currentDocument,
            parseResult: {
              ...currentDocument.parseResult,
              scenes: updatedScenes,
            },
          },
          history: [
            ...get().history,
            {
              action: 'rewrite' as const,
              sceneIds: [sceneId],
              timestamp: new Date(),
              description: `씬 ${updatedScene?.number || '?'} 재집필`,
            },
          ],
        });
      },

      deleteSceneById: (sceneId: string) => {
        const { currentDocument } = get();
        if (!currentDocument?.parseResult) return;

        const scene = currentDocument.parseResult.scenes.find(s => s.id === sceneId);
        const sceneNumber = scene?.number;
        const updatedScenes = deleteScene(currentDocument.parseResult.scenes, sceneId);

        set({
          currentDocument: {
            ...currentDocument,
            parseResult: {
              ...currentDocument.parseResult,
              scenes: updatedScenes,
            },
          },
          selectedSceneId: null,
          history: [
            ...get().history,
            {
              action: 'delete' as const,
              sceneIds: [sceneId],
              timestamp: new Date(),
              description: `씬 ${sceneNumber} 삭제`,
            },
          ],
        });
      },

      insertSceneAfter: (afterSceneId: string, content: string) => {
        const { currentDocument } = get();
        if (!currentDocument?.parseResult) return;

        const updatedScenes = insertScene(
          currentDocument.parseResult.scenes,
          afterSceneId,
          content
        );

        const newScene = updatedScenes.find(
          s => !currentDocument.parseResult!.scenes.find(os => os.id === s.id)
        );

        if (newScene) {
          const versions = { ...get().sceneVersions };
          versions[newScene.id] = [{
            id: `version-${newScene.id}-original`,
            sceneId: newScene.id,
            content: content,
            wordCount: newScene.wordCount,
            createdAt: new Date(),
            type: 'original',
            note: '새로 생성됨',
          }];

          set({
            currentDocument: {
              ...currentDocument,
              parseResult: {
                ...currentDocument.parseResult,
                scenes: updatedScenes,
              },
            },
            sceneVersions: versions,
            history: [
              ...get().history,
              {
                action: 'insert' as const,
                sceneIds: [newScene.id],
                timestamp: new Date(),
                description: `씬 ${newScene.number} 삽입`,
              },
            ],
          });
        }
      },

      mergeScenes: (sceneIds: string[]) => {
        const { currentDocument } = get();
        if (!currentDocument?.parseResult || sceneIds.length < 2) return;

        const scenes = currentDocument.parseResult.scenes;
        const scenesToMerge: ParsedScene[] = [];

        for (const id of sceneIds) {
          const scene = scenes.find(s => s.id === id);
          if (scene) scenesToMerge.push(scene);
        }

        if (scenesToMerge.length < 2) return;

        const mergedContent = scenesToMerge.map(s => s.content).join('\n\n');

        let updatedScenes = replaceScene(scenes, sceneIds[0], mergedContent);
        for (let i = 1; i < sceneIds.length; i++) {
          updatedScenes = deleteScene(updatedScenes, sceneIds[i]);
        }

        get().addVersion(sceneIds[0], mergedContent, 'merged', `${sceneIds.length}개 씬 병합`);

        set({
          currentDocument: {
            ...currentDocument,
            parseResult: {
              ...currentDocument.parseResult,
              scenes: updatedScenes,
            },
          },
          selectedSceneId: sceneIds[0],
          history: [
            ...get().history,
            {
              action: 'merge' as const,
              sceneIds,
              timestamp: new Date(),
              description: `${sceneIds.length}개 씬 병합`,
            },
          ],
        });
      },

      splitScene: (sceneId: string, splitPoints: number[]) => {
        const { currentDocument } = get();
        if (!currentDocument?.parseResult) return;

        const scene = currentDocument.parseResult.scenes.find(s => s.id === sceneId);
        if (!scene || splitPoints.length === 0) return;

        const content = scene.content;
        const sortedPoints = [...splitPoints].sort((a, b) => a - b);

        const parts: string[] = [];
        let lastIndex = 0;

        for (const point of sortedPoints) {
          if (point > lastIndex && point < content.length) {
            parts.push(content.slice(lastIndex, point).trim());
            lastIndex = point;
          }
        }
        parts.push(content.slice(lastIndex).trim());

        let updatedScenes = replaceScene(
          currentDocument.parseResult.scenes,
          sceneId,
          parts[0]
        );

        let prevId = sceneId;
        for (let i = 1; i < parts.length; i++) {
          updatedScenes = insertScene(updatedScenes, prevId, parts[i]);
          const newScene = updatedScenes.find(s => s.content === parts[i]);
          if (newScene) {
            prevId = newScene.id;
            const versions = { ...get().sceneVersions };
            versions[newScene.id] = [{
              id: `version-${newScene.id}-original`,
              sceneId: newScene.id,
              content: parts[i],
              wordCount: parts[i].replace(/\s/g, '').length,
              createdAt: new Date(),
              type: 'original',
              note: '분할로 생성됨',
            }];
            set({ sceneVersions: versions });
          }
        }

        set({
          currentDocument: {
            ...currentDocument,
            parseResult: {
              ...currentDocument.parseResult,
              scenes: updatedScenes,
            },
          },
          history: [
            ...get().history,
            {
              action: 'split' as const,
              sceneIds: [sceneId],
              timestamp: new Date(),
              description: `씬 ${scene.number}을 ${parts.length}개로 분할`,
            },
          ],
        });
      },

      reorderScene: (sceneId: string, newIndex: number) => {
        const { currentDocument } = get();
        if (!currentDocument?.parseResult) return;

        const updatedScenes = reorderScenes(
          currentDocument.parseResult.scenes,
          sceneId,
          newIndex
        );

        set({
          currentDocument: {
            ...currentDocument,
            parseResult: {
              ...currentDocument.parseResult,
              scenes: updatedScenes,
            },
          },
          history: [
            ...get().history,
            {
              action: 'reorder' as const,
              sceneIds: [sceneId],
              timestamp: new Date(),
              description: `씬 순서 변경 (→ ${newIndex + 1}번)`,
            },
          ],
        });
      },

      addVersion: (sceneId: string, content: string, type: SceneRewriteVersion['type'], note?: string) => {
        const versions = { ...get().sceneVersions };
        const sceneVersions = versions[sceneId] || [];

        const newVersion: SceneRewriteVersion = {
          id: `version-${sceneId}-${Date.now()}`,
          sceneId,
          content,
          wordCount: content.replace(/\s/g, '').length,
          createdAt: new Date(),
          type,
          note,
        };

        versions[sceneId] = [...sceneVersions, newVersion];
        set({ sceneVersions: versions });
      },

      restoreVersion: (sceneId: string, versionId: string) => {
        const versions = get().sceneVersions[sceneId];
        if (!versions) return;

        const version = versions.find(v => v.id === versionId);
        if (!version) return;

        get().rewriteScene(sceneId, version.content, `버전 복원: ${version.note || versionId}`);
      },

      deleteVersion: (sceneId: string, versionId: string) => {
        const versions = { ...get().sceneVersions };
        const sceneVersions = versions[sceneId];
        if (!sceneVersions) return;

        const version = sceneVersions.find(v => v.id === versionId);
        if (version?.type === 'original') return;

        versions[sceneId] = sceneVersions.filter(v => v.id !== versionId);
        set({ sceneVersions: versions });
      },

      setCompareMode: (enabled: boolean, leftId?: string, rightId?: string) => {
        set({
          compareMode: {
            enabled,
            leftVersionId: leftId || null,
            rightVersionId: rightId || null,
          },
        });
      },

      exportDocument: () => {
        const { currentDocument } = get();
        if (!currentDocument?.parseResult) return '';
        return combineScenesToText(currentDocument.parseResult.scenes);
      },

      getSceneById: (sceneId: string) => {
        const { currentDocument } = get();
        return currentDocument?.parseResult?.scenes.find(s => s.id === sceneId) || null;
      },

      getSceneVersions: (sceneId: string) => {
        return get().sceneVersions[sceneId] || [];
      },

      getCurrentVersion: (sceneId: string) => {
        const versions = get().sceneVersions[sceneId];
        if (!versions || versions.length === 0) return null;
        return versions[versions.length - 1];
      },

      reset: () => {
        set(initialState);
      },
    }),
    {
      name: 'scene-rewrite-storage',
      partialize: (state) => ({
        currentDocument: state.currentDocument,
        sceneVersions: state.sceneVersions,
        history: state.history,
      }),
    }
  )
);
