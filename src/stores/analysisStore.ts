import { create } from 'zustand';
import { db } from '@/lib/db';
import { Analysis, QualityScore, TensionAnalysis, EmotionAnalysis, PacingAnalysis, StyleAnalysis, Suggestion, ConsistencyIssue } from '@/types';

interface AnalysisState {
  currentAnalysis: Analysis | null;
  analyses: Analysis[];
  isLoading: boolean;

  fetchAnalyses: (targetType: Analysis['targetType'], targetId: string) => Promise<void>;
  getLatestAnalysis: (targetType: Analysis['targetType'], targetId: string) => Promise<Analysis | null>;
  saveAnalysis: (analysis: Omit<Analysis, 'id' | 'createdAt'>) => Promise<Analysis>;
  deleteAnalysis: (id: string) => Promise<void>;
  setCurrentAnalysis: (analysis: Analysis | null) => void;
}

function createDefaultAnalysis(targetType: Analysis['targetType'], targetId: string): Omit<Analysis, 'id' | 'createdAt'> {
  return {
    targetType,
    targetId,
    qualityScore: {
      overall: 0,
      readability: 0,
      grammar: 0,
      style: 0,
      engagement: 0,
      originality: 0,
      details: [],
    },
    tensionAnalysis: {
      averageLevel: 0,
      peakMoments: [],
      lowPoints: [],
      curve: [],
    },
    emotionAnalysis: {
      dominantEmotions: [],
      emotionFlow: [],
      toneConsistency: 0,
      emotionalImpact: '',
    },
    pacingAnalysis: {
      overallPacing: 'balanced',
      variationScore: 0,
      slowSections: [],
      fastSections: [],
    },
    styleAnalysis: {
      showVsTell: { show: 0, tell: 0 },
      activeVsPassive: { active: 0, passive: 0 },
      dialogueRatio: 0,
      averageSentenceLength: 0,
      vocabularyRichness: 0,
      repetitiveWords: [],
      cliches: [],
    },
    suggestions: [],
    consistencyIssues: [],
  };
}

export const useAnalysisStore = create<AnalysisState>((set, get) => ({
  currentAnalysis: null,
  analyses: [],
  isLoading: false,

  fetchAnalyses: async (targetType: Analysis['targetType'], targetId: string) => {
    set({ isLoading: true });
    try {
      const analyses = await db.analyses
        .where({ targetType, targetId })
        .reverse()
        .sortBy('createdAt');
      set({ analyses });
    } catch (error) {
      console.error('분석 로딩 실패:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  getLatestAnalysis: async (targetType: Analysis['targetType'], targetId: string) => {
    try {
      const analyses = await db.analyses
        .where({ targetType, targetId })
        .reverse()
        .limit(1)
        .toArray();

      if (analyses.length > 0) {
        set({ currentAnalysis: analyses[0] });
        return analyses[0];
      }
      return null;
    } catch (error) {
      console.error('분석 조회 실패:', error);
      return null;
    }
  },

  saveAnalysis: async (analysisData: Omit<Analysis, 'id' | 'createdAt'>) => {
    const analysis: Analysis = {
      ...analysisData,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    };

    await db.analyses.add(analysis);
    set((state) => ({
      analyses: [analysis, ...state.analyses],
      currentAnalysis: analysis,
    }));
    return analysis;
  },

  deleteAnalysis: async (id: string) => {
    await db.analyses.delete(id);
    set((state) => ({
      analyses: state.analyses.filter((a) => a.id !== id),
      currentAnalysis: state.currentAnalysis?.id === id ? null : state.currentAnalysis,
    }));
  },

  setCurrentAnalysis: (analysis: Analysis | null) => {
    set({ currentAnalysis: analysis });
  },
}));
