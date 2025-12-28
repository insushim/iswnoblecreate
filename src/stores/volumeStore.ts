/**
 * 권(Volume) 구조 관리 Store
 * - 권/씬 단위 소설 구조 관리
 * - 종료점 기반 집필 시스템
 * - 씬별 프롬프트 자동 생성
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  VolumeStructure,
  SceneStructure,
  VolumeProgress,
  ProjectWritingProgress,
  Project,
  Character,
  WorldSetting,
  WritingStyle,
} from '@/types';
import {
  createDefaultVolumeStructure,
  createDefaultSceneStructure,
  autoSplitVolumeIntoScenes,
  calculateProjectProgress,
} from '@/lib/promptGenerator';
import {
  ScenePromptData,
  generateScenePrompt,
  generateAllScenePrompts,
  HWANGJIN_VOLUME_1_SCENES,
  templateToSceneStructure,
} from '@/lib/scenePromptGenerator';

interface VolumeStore {
  // 상태
  volumes: VolumeStructure[];
  currentVolume: VolumeStructure | null;
  currentScene: SceneStructure | null;
  scenePrompts: Map<string, ScenePromptData>; // 씬별 프롬프트 캐시
  isLoading: boolean;
  error: string | null;

  // 권 관리
  fetchVolumes: (projectId: string) => Promise<void>;
  createVolume: (projectId: string, data?: Partial<VolumeStructure>) => Promise<VolumeStructure>;
  updateVolume: (volumeId: string, data: Partial<VolumeStructure>) => Promise<void>;
  deleteVolume: (volumeId: string) => Promise<void>;
  setCurrentVolume: (volume: VolumeStructure | null) => void;

  // 씬 관리
  createScene: (volumeId: string, data?: Partial<SceneStructure>) => Promise<SceneStructure>;
  updateScene: (sceneId: string, data: Partial<SceneStructure>) => Promise<void>;
  deleteScene: (sceneId: string) => Promise<void>;
  setCurrentScene: (scene: SceneStructure | null) => void;
  reorderScenes: (volumeId: string, sceneIds: string[]) => Promise<void>;

  // 자동 분할
  autoSplitVolume: (volumeId: string, sceneCount: number) => Promise<void>;

  // 진행 상황
  getVolumeProgress: (volumeId: string) => VolumeProgress | null;
  getProjectProgress: (projectId: string) => ProjectWritingProgress;

  // 종료점 검증
  validateVolumeEndPoints: (volumeId: string) => { isValid: boolean; issues: string[] };

  // 글자수 업데이트
  updateWordCount: (sceneId: string, wordCount: number) => Promise<void>;
  markSceneComplete: (sceneId: string) => Promise<void>;
  markVolumeComplete: (volumeId: string) => Promise<void>;

  // 🆕 씬 프롬프트 생성 기능
  generateScenePrompt: (
    sceneId: string,
    project: Project,
    characters: Character[],
    worldSettings: WorldSetting[],
    style: WritingStyle,
    previousContent?: string
  ) => ScenePromptData | null;

  generateAllScenePrompts: (
    volumeId: string,
    project: Project,
    characters: Character[],
    worldSettings: WorldSetting[],
    style: WritingStyle
  ) => ScenePromptData[];

  getScenePrompt: (sceneId: string) => ScenePromptData | null;

  // 🆕 황진 템플릿 적용
  applyHwangjinTemplate: (volumeId: string) => Promise<void>;

  // 🆕 씬 일괄 생성 (템플릿에서)
  bulkCreateScenes: (volumeId: string, scenes: Partial<SceneStructure>[]) => Promise<void>;
}

export const useVolumeStore = create<VolumeStore>()(
  persist(
    (set, get) => ({
      volumes: [],
      currentVolume: null,
      currentScene: null,
      scenePrompts: new Map<string, ScenePromptData>(),
      isLoading: false,
      error: null,

      // 권 목록 조회 - 현재 프로젝트 권만 currentVolume/currentScene 초기화
      fetchVolumes: async (projectId: string) => {
        set({ isLoading: true, error: null, currentVolume: null, currentScene: null });
        try {
          // localStorage에서 조회 - 모든 volumes는 유지하되 현재 프로젝트 권만 사용
          set({ isLoading: false });
        } catch (error) {
          set({ error: '권 목록 조회 실패', isLoading: false });
        }
      },

      // 권 생성
      createVolume: async (projectId: string, data?: Partial<VolumeStructure>) => {
        const volumes = get().volumes.filter(v => v.projectId === projectId);
        const nextNumber = volumes.length + 1;

        const newVolume: VolumeStructure = {
          ...createDefaultVolumeStructure(projectId, nextNumber),
          ...data,
        };

        set(state => ({
          volumes: [...state.volumes, newVolume],
        }));

        return newVolume;
      },

      // 권 수정
      updateVolume: async (volumeId: string, data: Partial<VolumeStructure>) => {
        set(state => ({
          volumes: state.volumes.map(v =>
            v.id === volumeId
              ? { ...v, ...data, updatedAt: new Date() }
              : v
          ),
          currentVolume: state.currentVolume?.id === volumeId
            ? { ...state.currentVolume, ...data, updatedAt: new Date() }
            : state.currentVolume,
        }));
      },

      // 권 삭제
      deleteVolume: async (volumeId: string) => {
        set(state => ({
          volumes: state.volumes.filter(v => v.id !== volumeId),
          currentVolume: state.currentVolume?.id === volumeId ? null : state.currentVolume,
        }));
      },

      // 현재 권 설정
      setCurrentVolume: (volume: VolumeStructure | null) => {
        set({ currentVolume: volume, currentScene: null });
      },

      // 씬 생성
      createScene: async (volumeId: string, data?: Partial<SceneStructure>) => {
        const volume = get().volumes.find(v => v.id === volumeId);
        if (!volume) throw new Error('권을 찾을 수 없습니다');

        const nextNumber = volume.scenes.length + 1;
        const newScene: SceneStructure = {
          ...createDefaultSceneStructure(volumeId, nextNumber),
          ...data,
        };

        set(state => ({
          volumes: state.volumes.map(v =>
            v.id === volumeId
              ? { ...v, scenes: [...v.scenes, newScene], updatedAt: new Date() }
              : v
          ),
          currentVolume: state.currentVolume?.id === volumeId
            ? { ...state.currentVolume, scenes: [...state.currentVolume.scenes, newScene], updatedAt: new Date() }
            : state.currentVolume,
        }));

        return newScene;
      },

      // 씬 수정
      updateScene: async (sceneId: string, data: Partial<SceneStructure>) => {
        set(state => ({
          volumes: state.volumes.map(v => ({
            ...v,
            scenes: v.scenes.map(s =>
              s.id === sceneId
                ? { ...s, ...data, updatedAt: new Date() }
                : s
            ),
            updatedAt: new Date(),
          })),
          currentVolume: state.currentVolume
            ? {
                ...state.currentVolume,
                scenes: state.currentVolume.scenes.map(s =>
                  s.id === sceneId
                    ? { ...s, ...data, updatedAt: new Date() }
                    : s
                ),
                updatedAt: new Date(),
              }
            : null,
          currentScene: state.currentScene?.id === sceneId
            ? { ...state.currentScene, ...data, updatedAt: new Date() }
            : state.currentScene,
        }));
      },

      // 씬 삭제
      deleteScene: async (sceneId: string) => {
        set(state => ({
          volumes: state.volumes.map(v => ({
            ...v,
            scenes: v.scenes.filter(s => s.id !== sceneId),
            updatedAt: new Date(),
          })),
          currentVolume: state.currentVolume
            ? {
                ...state.currentVolume,
                scenes: state.currentVolume.scenes.filter(s => s.id !== sceneId),
                updatedAt: new Date(),
              }
            : null,
          currentScene: state.currentScene?.id === sceneId ? null : state.currentScene,
        }));
      },

      // 현재 씬 설정
      setCurrentScene: (scene: SceneStructure | null) => {
        set({ currentScene: scene });
      },

      // 씬 순서 변경
      reorderScenes: async (volumeId: string, sceneIds: string[]) => {
        set(state => ({
          volumes: state.volumes.map(v => {
            if (v.id !== volumeId) return v;

            const reorderedScenes = sceneIds.map((id, index) => {
              const scene = v.scenes.find(s => s.id === id);
              return scene ? { ...scene, sceneNumber: index + 1 } : null;
            }).filter((s): s is SceneStructure => s !== null);

            return { ...v, scenes: reorderedScenes, updatedAt: new Date() };
          }),
        }));
      },

      // 권 자동 분할
      autoSplitVolume: async (volumeId: string, sceneCount: number) => {
        const volume = get().volumes.find(v => v.id === volumeId);
        if (!volume) throw new Error('권을 찾을 수 없습니다');

        const scenes = autoSplitVolumeIntoScenes(volume, sceneCount);

        set(state => ({
          volumes: state.volumes.map(v =>
            v.id === volumeId
              ? { ...v, scenes, updatedAt: new Date() }
              : v
          ),
          currentVolume: state.currentVolume?.id === volumeId
            ? { ...state.currentVolume, scenes, updatedAt: new Date() }
            : state.currentVolume,
        }));
      },

      // 권 진행 상황
      getVolumeProgress: (volumeId: string): VolumeProgress | null => {
        const volume = get().volumes.find(v => v.id === volumeId);
        if (!volume) return null;

        const completedScenes = volume.scenes.filter(s => s.status === 'completed').length;
        const progressPercentage = volume.targetWordCount > 0
          ? Math.round((volume.actualWordCount / volume.targetWordCount) * 100)
          : 0;

        return {
          volumeId: volume.id,
          volumeNumber: volume.volumeNumber,
          title: volume.title,
          totalScenes: volume.scenes.length,
          completedScenes,
          targetWordCount: volume.targetWordCount,
          actualWordCount: volume.actualWordCount,
          progressPercentage,
          status: volume.status,
        };
      },

      // 프로젝트 전체 진행 상황
      getProjectProgress: (projectId: string): ProjectWritingProgress => {
        const projectVolumes = get().volumes.filter(v => v.projectId === projectId);
        const progress = calculateProjectProgress(projectVolumes);

        return {
          projectId,
          ...progress,
          volumes: projectVolumes.map(v => get().getVolumeProgress(v.id)!).filter(Boolean),
        };
      },

      // 종료점 검증
      validateVolumeEndPoints: (volumeId: string) => {
        const volume = get().volumes.find(v => v.id === volumeId);
        if (!volume) return { isValid: false, issues: ['권을 찾을 수 없습니다'] };

        const issues: string[] = [];

        // 권 종료점 검증
        if (!volume.endPoint || volume.endPoint.trim().length < 10) {
          issues.push('권의 종료점이 너무 짧습니다. 구체적인 장면을 명시하세요.');
        }

        if (!volume.endPointExact || volume.endPointExact.trim().length < 5) {
          issues.push('정확한 종료 대사/행동이 지정되지 않았습니다.');
        }

        // 씬 종료점 검증
        volume.scenes.forEach((scene, index) => {
          if (!scene.endCondition || scene.endCondition.trim().length < 10) {
            issues.push(`씬 ${index + 1}의 종료 조건이 너무 짧습니다.`);
          }
        });

        // 모호한 표현 체크
        const vagueTerms = ['성장한다', '변화한다', '깨닫는다', '결심한다', '시작한다', '알게 된다'];
        const allEndPoints = [volume.endPoint, volume.endPointExact, ...volume.scenes.map(s => s.endCondition)];

        for (const term of vagueTerms) {
          for (const endpoint of allEndPoints) {
            if (endpoint?.includes(term)) {
              issues.push(`"${term}"는 모호합니다. 구체적인 대사나 행동으로 바꾸세요.`);
              break;
            }
          }
        }

        return {
          isValid: issues.length === 0,
          issues,
        };
      },

      // 글자수 업데이트
      updateWordCount: async (sceneId: string, wordCount: number) => {
        const state = get();
        let volumeId: string | null = null;

        // 씬이 속한 권 찾기
        for (const volume of state.volumes) {
          const scene = volume.scenes.find(s => s.id === sceneId);
          if (scene) {
            volumeId = volume.id;
            break;
          }
        }

        if (!volumeId) return;

        // 씬 글자수 업데이트
        await get().updateScene(sceneId, { actualWordCount: wordCount });

        // 권 전체 글자수 재계산
        const volume = get().volumes.find(v => v.id === volumeId);
        if (volume) {
          const totalWordCount = volume.scenes.reduce((sum, s) => sum + s.actualWordCount, 0);
          await get().updateVolume(volumeId, { actualWordCount: totalWordCount });
        }
      },

      // 씬 완료 처리
      markSceneComplete: async (sceneId: string) => {
        await get().updateScene(sceneId, { status: 'completed' });
      },

      // 권 완료 처리
      markVolumeComplete: async (volumeId: string) => {
        const volume = get().volumes.find(v => v.id === volumeId);
        if (!volume) return;

        // 모든 씬이 완료되었는지 확인
        const allScenesCompleted = volume.scenes.every(s => s.status === 'completed');

        if (allScenesCompleted) {
          await get().updateVolume(volumeId, { status: 'completed' });
        }
      },

      // 🆕 씬 프롬프트 생성
      generateScenePrompt: (
        sceneId: string,
        project: Project,
        characters: Character[],
        worldSettings: WorldSetting[],
        style: WritingStyle,
        previousContent?: string
      ): ScenePromptData | null => {
        const state = get();
        let targetVolume: VolumeStructure | null = null;
        let targetScene: SceneStructure | null = null;

        // 씬이 속한 권 찾기
        for (const volume of state.volumes) {
          const scene = volume.scenes.find(s => s.id === sceneId);
          if (scene) {
            targetVolume = volume;
            targetScene = scene;
            break;
          }
        }

        if (!targetVolume || !targetScene) return null;

        // 프롬프트 생성
        const promptData = generateScenePrompt(
          project,
          targetVolume,
          targetScene,
          style,
          characters,
          worldSettings,
          targetVolume.scenes,
          previousContent
        );

        // 캐시에 저장
        const newPrompts = new Map(state.scenePrompts);
        newPrompts.set(sceneId, promptData);
        set({ scenePrompts: newPrompts });

        return promptData;
      },

      // 🆕 권의 모든 씬 프롬프트 일괄 생성
      generateAllScenePrompts: (
        volumeId: string,
        project: Project,
        characters: Character[],
        worldSettings: WorldSetting[],
        style: WritingStyle
      ): ScenePromptData[] => {
        const volume = get().volumes.find(v => v.id === volumeId);
        if (!volume) return [];

        const prompts = generateAllScenePrompts(
          project,
          volume,
          style,
          characters,
          worldSettings
        );

        // 캐시에 저장
        const newPrompts = new Map(get().scenePrompts);
        prompts.forEach(p => {
          newPrompts.set(p.sceneId, p);
        });
        set({ scenePrompts: newPrompts });

        return prompts;
      },

      // 🆕 캐시된 씬 프롬프트 조회
      getScenePrompt: (sceneId: string): ScenePromptData | null => {
        return get().scenePrompts.get(sceneId) || null;
      },

      // 🆕 황진 1권 템플릿 적용
      applyHwangjinTemplate: async (volumeId: string) => {
        const volume = get().volumes.find(v => v.id === volumeId);
        if (!volume) throw new Error('권을 찾을 수 없습니다');

        // 템플릿에서 씬 생성
        const scenes = HWANGJIN_VOLUME_1_SCENES.map(template =>
          templateToSceneStructure(template, volumeId)
        );

        // 권 업데이트 (씬 추가 + 메타데이터)
        const totalWordCount = scenes.reduce((sum, s) => sum + s.targetWordCount, 0);

        set(state => ({
          volumes: state.volumes.map(v =>
            v.id === volumeId
              ? {
                  ...v,
                  title: '빙의, 그리고 시작',
                  targetWordCount: totalWordCount,
                  startPoint: '강민우가 유튜브 스튜디오에서 황진 장군 강의를 진행한다',
                  endPoint: '강민우(황진)가 달빛 아래 정체성 통합을 선언한다',
                  endPointType: 'dialogue' as const,
                  endPointExact: '강민우도, 황진도... 이제 하나다. 이 세계에서 내가 할 수 있는 모든 것을 하겠다',
                  coreEvent: '현대 역사 강사 강민우가 조선시대 황진 장군의 몸에 빙의하여 새로운 삶을 시작한다',
                  scenes,
                  updatedAt: new Date(),
                }
              : v
          ),
          currentVolume: state.currentVolume?.id === volumeId
            ? {
                ...state.currentVolume,
                title: '빙의, 그리고 시작',
                targetWordCount: totalWordCount,
                startPoint: '강민우가 유튜브 스튜디오에서 황진 장군 강의를 진행한다',
                endPoint: '강민우(황진)가 달빛 아래 정체성 통합을 선언한다',
                endPointType: 'dialogue' as const,
                endPointExact: '강민우도, 황진도... 이제 하나다. 이 세계에서 내가 할 수 있는 모든 것을 하겠다',
                coreEvent: '현대 역사 강사 강민우가 조선시대 황진 장군의 몸에 빙의하여 새로운 삶을 시작한다',
                scenes,
                updatedAt: new Date(),
              }
            : state.currentVolume,
        }));
      },

      // 🆕 씬 일괄 생성
      bulkCreateScenes: async (volumeId: string, scenesData: Partial<SceneStructure>[]) => {
        const volume = get().volumes.find(v => v.id === volumeId);
        if (!volume) throw new Error('권을 찾을 수 없습니다');

        const newScenes: SceneStructure[] = scenesData.map((data, index) => ({
          id: crypto.randomUUID(),
          volumeId,
          sceneNumber: index + 1,
          title: data.title || `씬 ${index + 1}`,
          targetWordCount: data.targetWordCount || 10000,
          pov: data.pov || '',
          povType: data.povType || 'third-limited',
          location: data.location || '',
          timeframe: data.timeframe || '',
          participants: data.participants || [],
          mustInclude: data.mustInclude || [],
          startCondition: data.startCondition || '',
          endCondition: data.endCondition || '',
          endConditionType: data.endConditionType || 'dialogue',
          status: 'pending',
          actualWordCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        }));

        const totalWordCount = newScenes.reduce((sum, s) => sum + s.targetWordCount, 0);

        set(state => ({
          volumes: state.volumes.map(v =>
            v.id === volumeId
              ? { ...v, scenes: newScenes, targetWordCount: totalWordCount, updatedAt: new Date() }
              : v
          ),
          currentVolume: state.currentVolume?.id === volumeId
            ? { ...state.currentVolume, scenes: newScenes, targetWordCount: totalWordCount, updatedAt: new Date() }
            : state.currentVolume,
        }));
      },
    }),
    {
      name: 'novel-forge-volumes',
      partialize: (state) => ({
        volumes: state.volumes,
      }),
    }
  )
);
