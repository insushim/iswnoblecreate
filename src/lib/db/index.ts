import Dexie, { Table } from 'dexie';
import {
  Project,
  Character,
  Chapter,
  Scene,
  WorldSetting,
  DictionaryEntry,
  Location,
  PlotStructure,
  Foreshadowing,
  Conflict,
  Analysis,
  Expression,
  Series,
  ResearchNote,
  WritingSession,
  AppSettings,
} from '@/types';
import type { EditMark, EditSession } from '@/types/editor';

// NovelForge 데이터베이스 클래스
export class NovelForgeDB extends Dexie {
  projects!: Table<Project>;
  characters!: Table<Character>;
  chapters!: Table<Chapter>;
  scenes!: Table<Scene>;
  worldSettings!: Table<WorldSetting>;
  dictionary!: Table<DictionaryEntry>;
  locations!: Table<Location>;
  plotStructures!: Table<PlotStructure>;
  foreshadowings!: Table<Foreshadowing>;
  conflicts!: Table<Conflict>;
  analyses!: Table<Analysis>;
  expressions!: Table<Expression>;
  series!: Table<Series>;
  researchNotes!: Table<ResearchNote>;
  writingSessions!: Table<WritingSession>;
  appSettings!: Table<AppSettings>;
  editMarks!: Table<EditMark>;
  editSessions!: Table<EditSession>;

  constructor() {
    super('NovelForgeDB');

    this.version(1).stores({
      projects: 'id, title, status, seriesId, createdAt, updatedAt',
      characters: 'id, projectId, name, role, createdAt',
      chapters: 'id, projectId, number, status, createdAt',
      scenes: 'id, chapterId, order, status, createdAt',
      worldSettings: 'id, projectId, category, importance, createdAt',
      dictionary: 'id, projectId, term, category, createdAt',
      locations: 'id, projectId, name, type, parentLocationId, createdAt',
      plotStructures: 'id, projectId, template',
      foreshadowings: 'id, projectId, status, priority, createdAt',
      conflicts: 'id, projectId, type, status, createdAt',
      analyses: 'id, targetType, targetId, createdAt',
      expressions: 'id, projectId, category, subcategory, isFavorite, createdAt',
      series: 'id, title, status, createdAt',
      researchNotes: 'id, projectId, category, createdAt',
      writingSessions: 'id, projectId, startTime',
      appSettings: 'id',
    });

    this.version(2).stores({
      projects: 'id, title, status, seriesId, createdAt, updatedAt',
      characters: 'id, projectId, name, role, createdAt',
      chapters: 'id, projectId, number, status, createdAt',
      scenes: 'id, chapterId, order, status, createdAt',
      worldSettings: 'id, projectId, category, importance, createdAt',
      dictionary: 'id, projectId, term, category, createdAt',
      locations: 'id, projectId, name, type, parentLocationId, createdAt',
      plotStructures: 'id, projectId, template',
      foreshadowings: 'id, projectId, status, priority, createdAt',
      conflicts: 'id, projectId, type, status, createdAt',
      analyses: 'id, targetType, targetId, createdAt',
      expressions: 'id, projectId, category, subcategory, isFavorite, createdAt',
      series: 'id, title, status, createdAt',
      researchNotes: 'id, projectId, category, createdAt',
      writingSessions: 'id, projectId, startTime',
      appSettings: 'id',
      editMarks: 'id, sceneId, chapterId, type, status, author, category, createdAt',
      editSessions: 'id, projectId, chapterId, status, currentPhase, createdAt',
    });
  }
}

// 데이터베이스 인스턴스 싱글톤
export const db = new NovelForgeDB();

// 기본 앱 설정 초기화
export async function initializeAppSettings(): Promise<AppSettings> {

  const envApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';

  try {
    const existingSettings = await db.appSettings.get('default');

    if (existingSettings) {

      // 환경 변수에 API 키가 있으면 항상 사용 (서버 설정 우선)
      if (envApiKey) {
        existingSettings.geminiApiKey = envApiKey;
        await db.appSettings.update('default', { geminiApiKey: envApiKey });
      }

      // 모델 설정이 없으면 기본값 추가 (기존 사용자 마이그레이션)
      if (!existingSettings.planningModel || !existingSettings.writingModel) {
        existingSettings.planningModel = existingSettings.planningModel || 'gemini-3-flash-preview';
        existingSettings.writingModel = existingSettings.writingModel || 'gemini-2.0-flash';
        await db.appSettings.update('default', {
          planningModel: existingSettings.planningModel,
          writingModel: existingSettings.writingModel,
        });
      }

      // gemini-3-flash -> gemini-3-flash-preview 마이그레이션 (DB에 구버전 모델명이 저장된 경우)
      let needsUpdate = false;
      if ((existingSettings.planningModel as string) === 'gemini-3-flash') {
        existingSettings.planningModel = 'gemini-3-flash-preview';
        needsUpdate = true;
      }
      if ((existingSettings.writingModel as string) === 'gemini-3-flash') {
        existingSettings.writingModel = 'gemini-3-flash-preview';
        needsUpdate = true;
      }
      if (needsUpdate) {
        await db.appSettings.update('default', {
          planningModel: existingSettings.planningModel,
          writingModel: existingSettings.writingModel,
        });
      }

      return existingSettings;
    }

    const defaultSettings: AppSettings = {
      id: 'default',
      theme: 'dark',
      fontSize: 18,
      fontFamily: 'Pretendard',
      autoSave: true,
      autoSaveInterval: 30,
      soundEffects: false,
      notifications: true,
      geminiApiKey: envApiKey,
      planningModel: 'gemini-3-flash-preview',  // 기획용: 빠르고 저렴한 모델
      writingModel: 'gemini-2.5-flash', // 집필용: 품질 좋은 모델
    };

    await db.appSettings.add(defaultSettings);
    return defaultSettings;
  } catch (error) {
    throw error;
  }
}

// 프로젝트 기본값 생성 헬퍼
export function createDefaultProject(partial: Partial<Project>): Project {
  const now = new Date();
  return {
    id: crypto.randomUUID(),
    title: '',
    concept: '',
    logline: '',
    synopsis: '',
    genre: [],
    targetAudience: '',
    ageRating: 'all',
    keywords: [],
    status: 'idea',
    createdAt: now,
    updatedAt: now,
    settings: {
      writingStyle: 'calm',
      perspective: 'third-limited',
      tense: 'past',
      dialogueRatio: 40,
      descriptionDetail: 3,
      pacingPreference: 'moderate',
      emotionIntensity: 3,
      targetChapterLength: 5000,
      language: 'ko',
      autoSaveInterval: 30,
    },
    stats: {
      totalWords: 0,
      totalCharacters: 0,
      chaptersCompleted: 0,
      chaptersTotal: 0,
      averageWordsPerChapter: 0,
      writingDays: 0,
      totalWritingTime: 0,
      averageWordsPerDay: 0,
      longestStreak: 0,
      currentStreak: 0,
    },
    goals: {
      dailyWordCount: 1000,
      milestones: [],
    },
    ...partial,
  };
}

// 캐릭터 기본값 생성 헬퍼
export function createDefaultCharacter(projectId: string, partial: Partial<Character>): Character {
  const now = new Date();
  return {
    id: crypto.randomUUID(),
    projectId,
    name: '',
    role: 'supporting',
    age: '',
    gender: '',
    appearance: '',
    personality: '',
    background: '',
    motivation: '',
    goal: '',
    strengths: [],
    weaknesses: [],
    speechPattern: {
      formalityLevel: 3,
      speechSpeed: 'normal',
      vocabularyLevel: 'average',
      tone: '',
    },
    arc: {
      type: 'positive',
      startingState: '',
      endingState: '',
      keyMoments: [],
    },
    relationships: [],
    emotionalState: [],
    createdAt: now,
    updatedAt: now,
    ...partial,
  };
}

// 챕터 기본값 생성 헬퍼
export function createDefaultChapter(projectId: string, number: number, partial: Partial<Chapter>): Chapter {
  const now = new Date();
  return {
    id: crypto.randomUUID(),
    projectId,
    number,
    title: `제 ${number}장`,
    purpose: '',
    keyEvents: [],
    scenes: [],
    status: 'outline',
    wordCount: 0,
    createdAt: now,
    updatedAt: now,
    ...partial,
  };
}

// 씬 기본값 생성 헬퍼
export function createDefaultScene(chapterId: string, order: number, partial: Partial<Scene>): Scene {
  const now = new Date();
  return {
    id: crypto.randomUUID(),
    chapterId,
    order,
    title: `씬 ${order}`,
    type: 'action',
    summary: '',
    goal: '',
    content: '',
    participants: [],
    status: 'outline',
    wordCount: 0,
    versions: [],
    createdAt: now,
    updatedAt: now,
    ...partial,
  };
}

// 세계관 설정 기본값 생성 헬퍼
export function createDefaultWorldSetting(projectId: string, partial: Partial<WorldSetting>): WorldSetting {
  const now = new Date();
  return {
    id: crypto.randomUUID(),
    projectId,
    category: 'custom',
    title: '',
    description: '',
    details: {},
    importance: 'minor',
    createdAt: now,
    updatedAt: now,
    ...partial,
  };
}

// 플롯 구조 생성 헬퍼
export function createPlotStructure(projectId: string, partial: Partial<PlotStructure> = {}): PlotStructure {
  return {
    id: crypto.randomUUID(),
    projectId,
    template: 'three-act',
    plotPoints: [],
    subplots: [],
    updatedAt: new Date(),
    ...partial,
  };
}

// 복선 기본값 생성 헬퍼
export function createForeshadowing(projectId: string, partial: Partial<Foreshadowing> = {}): Foreshadowing {
  const now = new Date();
  return {
    id: crypto.randomUUID(),
    projectId,
    title: '',
    description: '',
    type: 'hint',
    subtlety: 3,
    plantedIn: '',
    plantedMethod: '',
    status: 'planted',
    priority: 'minor',
    createdAt: now,
    ...partial,
  };
}

// 갈등 기본값 생성 헬퍼
export function createConflict(projectId: string, partial: Partial<Conflict> = {}): Conflict {
  const now = new Date();
  return {
    id: crypto.randomUUID(),
    projectId,
    type: 'interpersonal',
    title: '',
    description: '',
    stakes: '',
    involvedCharacters: [],
    introducedIn: '',
    status: 'brewing',
    intensity: 5,
    createdAt: now,
    ...partial,
  };
}

// 플롯 구조 기본값 생성 헬퍼
export function createDefaultPlotStructure(projectId: string, partial: Partial<PlotStructure>): PlotStructure {
  return {
    id: crypto.randomUUID(),
    projectId,
    template: 'three-act',
    stages: [],
    plotPoints: [],
    subplots: [],
    updatedAt: new Date(),
    ...partial,
  };
}
