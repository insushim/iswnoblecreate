// ============================================================
// 한국어 텍스트 분석 통합 도구
// ============================================================

import { performSpellCheck } from '@/lib/spellCheckEngine';
import type { SpellCorrection } from '@/lib/spellCheckEngine';
import { detectTranslationStyle } from '@/lib/translationStyleDetector';
import type { TranslationIssue, TranslationStyleResult } from '@/lib/translationStyleDetector';

// ============================================================
// 타입 정의
// ============================================================

export interface KoreanTextAnalysis {
  spellcheck: {
    corrections: SpellCorrection[];
    score: number;
  };
  translationStyle: TranslationStyleResult;
  overallScore: number;
  publishingReady: boolean;
}

// re-export for convenience
export type { SpellCorrection, TranslationIssue, TranslationStyleResult };

// ============================================================
// 가중 평균 계산
// ============================================================

/**
 * 맞춤법 점수와 번역투 점수의 가중 평균을 구합니다.
 * 맞춤법(60%)과 번역투(40%) 가중치를 적용합니다.
 * - 맞춤법은 출판 시 반드시 수정해야 하므로 더 높은 가중치
 * - 번역투는 문체 선호에 따라 허용될 수 있으므로 낮은 가중치
 */
function calculateOverallScore(spellScore: number, translationScore: number): number {
  const SPELL_WEIGHT = 0.6;
  const TRANSLATION_WEIGHT = 0.4;

  const weighted = spellScore * SPELL_WEIGHT + translationScore * TRANSLATION_WEIGHT;
  return Math.round(weighted * 10) / 10;
}

// ============================================================
// 메인 분석 함수
// ============================================================

/**
 * 한국어 텍스트를 종합적으로 분석합니다.
 * 맞춤법 검사와 번역투 감지를 모두 수행하고 통합 결과를 반환합니다.
 *
 * @param text - 분석할 한국어 텍스트
 * @returns 종합 분석 결과
 */
export async function analyzeKoreanText(text: string): Promise<KoreanTextAnalysis> {
  if (!text || text.trim().length === 0) {
    return {
      spellcheck: { corrections: [], score: 100 },
      translationStyle: { issues: [], score: 100, summary: '분석할 텍스트가 없습니다.' },
      overallScore: 100,
      publishingReady: true,
    };
  }

  // 맞춤법 검사와 번역투 감지를 동시에 실행
  const [spellResult, translationResult] = await Promise.all([
    Promise.resolve(performSpellCheck(text)),
    Promise.resolve(detectTranslationStyle(text)),
  ]);

  const overallScore = calculateOverallScore(spellResult.score, translationResult.score);

  return {
    spellcheck: {
      corrections: spellResult.corrections,
      score: spellResult.score,
    },
    translationStyle: translationResult,
    overallScore,
    publishingReady: overallScore >= 80,
  };
}

// ============================================================
// 편의 함수들
// ============================================================

/**
 * 맞춤법 검사만 수행합니다.
 */
export function checkSpelling(text: string): { corrections: SpellCorrection[]; score: number } {
  return performSpellCheck(text);
}

/**
 * 번역투 감지만 수행합니다.
 */
export function checkTranslationStyle(text: string): TranslationStyleResult {
  return detectTranslationStyle(text);
}

/**
 * 텍스트가 출판 준비가 되었는지 간단히 확인합니다.
 * overallScore >= 80 이면 출판 준비 완료로 판정합니다.
 */
export async function isPublishingReady(text: string): Promise<boolean> {
  const result = await analyzeKoreanText(text);
  return result.publishingReady;
}

/**
 * 텍스트의 주요 문제점만 빠르게 요약합니다.
 */
export async function getQuickSummary(text: string): Promise<string> {
  const result = await analyzeKoreanText(text);

  const parts: string[] = [];

  parts.push(`종합 점수: ${result.overallScore}점`);
  parts.push(`맞춤법: ${result.spellcheck.score}점 (${result.spellcheck.corrections.length}건)`);
  parts.push(`번역투: ${result.translationStyle.score}점 (${result.translationStyle.issues.length}건)`);
  parts.push(result.publishingReady ? '출판 준비: 완료' : '출판 준비: 수정 필요');

  if (result.spellcheck.corrections.length > 0) {
    const topCorrections = result.spellcheck.corrections.slice(0, 3);
    const correctionTexts = topCorrections
      .map((c) => `"${c.original}" → "${c.suggestion}"`)
      .join(', ');
    parts.push(`주요 맞춤법 수정: ${correctionTexts}`);
  }

  if (result.translationStyle.summary) {
    parts.push(`번역투 요약: ${result.translationStyle.summary}`);
  }

  return parts.join('\n');
}
