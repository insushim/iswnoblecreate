/**
 * 최적화된 Gemini API 래퍼 - 비용 최소화 전략 통합
 *
 * 50개 이상의 비용 최소화 전략이 적용된 Gemini API 래퍼입니다.
 * 기존 generateText, generateJSON 대신 이 함수들을 사용하면
 * 자동으로 캐싱, 압축, 비용 추적이 적용됩니다.
 *
 * 적용된 전략:
 * - 메모리/DB 캐싱 (유사도 기반 캐시 히트 포함)
 * - 프롬프트 압축 (토큰 최적화)
 * - 요청 중복 제거
 * - 예산 관리 및 경고
 * - 자동 모델 다운그레이드
 * - 비용 추적 및 리포트
 */

import { GeminiModel } from '@/types';
import { generateText, generateJSON, generateTextStream } from '@/lib/gemini';
import { getAPICache } from './apiCache';
import { getPromptCompressor, estimateTokens } from './promptCompressor';
import { getCostTracker } from './costTracker';

// 최적화 설정
interface OptimizationConfig {
  enableCache: boolean;
  enableCompression: boolean;
  enableCostTracking: boolean;
  enableAutoDowngrade: boolean;
  maxPromptTokens: number;
}

const DEFAULT_CONFIG: OptimizationConfig = {
  enableCache: true,
  enableCompression: true,
  enableCostTracking: true,
  enableAutoDowngrade: true,
  maxPromptTokens: 8000,
};

let config = { ...DEFAULT_CONFIG };

/**
 * 최적화 설정 업데이트
 */
export function setOptimizationConfig(newConfig: Partial<OptimizationConfig>): void {
  config = { ...config, ...newConfig };
}

/**
 * 현재 설정 가져오기
 */
export function getOptimizationConfig(): OptimizationConfig {
  return { ...config };
}

/**
 * 최적화된 텍스트 생성
 *
 * 기존 generateText 대신 사용하면 자동으로:
 * - 캐시 확인 (히트 시 API 호출 없이 반환)
 * - 프롬프트 압축 (토큰 절약)
 * - 비용 추적
 * - 예산 초과 시 자동 모델 다운그레이드
 */
export async function optimizedGenerateText(
  apiKey: string,
  prompt: string,
  options?: {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    topK?: number;
    model?: GeminiModel;
    skipCache?: boolean;
    taskType?: 'planning' | 'writing' | 'analysis' | 'other';
    projectId?: string;
  }
): Promise<{
  text: string;
  cached: boolean;
  cost: number;
  savedTokens: number;
}> {
  const cache = getAPICache();
  const compressor = getPromptCompressor();
  const tracker = getCostTracker();

  const model = options?.model || 'gemini-2.0-flash';
  const taskType = options?.taskType || 'other';

  // 1. 프롬프트 압축
  let finalPrompt = prompt;
  let savedTokens = 0;

  if (config.enableCompression) {
    const compressed = compressor.compress(prompt, {
      maxTokens: config.maxPromptTokens,
    });
    finalPrompt = compressed.compressed;
    savedTokens = compressed.originalTokens - compressed.compressedTokens;

    if (savedTokens > 0) {
      // 토큰 절약됨
    }
  }

  // 2. 캐시 확인
  if (config.enableCache && !options?.skipCache) {
    const cacheResult = await cache.get(finalPrompt, model);

    if (cacheResult.hit && cacheResult.response) {
      // 캐시 히트 비용 기록 (0원)
      if (config.enableCostTracking) {
        const outputTokens = estimateTokens(cacheResult.response);
        tracker.recordUsage(model, estimateTokens(finalPrompt), outputTokens, {
          type: taskType,
          projectId: options?.projectId,
          cached: true,
        });
      }

      return {
        text: cacheResult.response,
        cached: true,
        cost: 0,
        savedTokens,
      };
    }
  }

  // 3. 예산 확인 및 모델 다운그레이드
  let actualModel = model;

  if (config.enableCostTracking && config.enableAutoDowngrade) {
    const budgetStatus = tracker.checkBudget();

    if (budgetStatus === 'exceeded' && tracker.isApiDisabled()) {
      throw new Error('일일 또는 월간 API 예산을 초과했습니다. 설정에서 예산을 늘리거나 내일 다시 시도하세요.');
    }

    if (budgetStatus === 'warning') {
      // 예산 경고 시 저비용 모델로 자동 다운그레이드
      actualModel = tracker.getRecommendedModel(taskType, 'low');

      // 예산 경고로 다운그레이드 적용됨
    }
  }

  // 4. 실제 API 호출
  const text = await generateText(apiKey, finalPrompt, {
    ...options,
    model: actualModel,
  });

  // 5. 캐시에 저장
  if (config.enableCache) {
    const outputTokens = estimateTokens(text);
    await cache.set(finalPrompt, actualModel, text, {
      tokenCount: outputTokens,
      generationType: taskType,
      projectId: options?.projectId,
    });
  }

  // 6. 비용 기록
  let cost = 0;
  if (config.enableCostTracking) {
    const inputTokens = estimateTokens(finalPrompt);
    const outputTokens = estimateTokens(text);
    const result = tracker.recordUsage(actualModel, inputTokens, outputTokens, {
      type: taskType,
      projectId: options?.projectId,
      cached: false,
    });
    cost = result.cost;
  }

  return {
    text,
    cached: false,
    cost,
    savedTokens,
  };
}

/**
 * 최적화된 JSON 생성
 */
export async function optimizedGenerateJSON<T>(
  apiKey: string,
  prompt: string,
  options?: {
    temperature?: number;
    maxTokens?: number;
    model?: GeminiModel;
    skipCache?: boolean;
    taskType?: 'planning' | 'writing' | 'analysis' | 'other';
    projectId?: string;
  }
): Promise<{
  data: T;
  cached: boolean;
  cost: number;
  savedTokens: number;
}> {
  const cache = getAPICache();
  const compressor = getPromptCompressor();
  const tracker = getCostTracker();

  const model = options?.model || 'gemini-3-flash-preview';
  const taskType = options?.taskType || 'planning';

  // 1. 프롬프트 압축 (JSON은 덜 공격적으로)
  let finalPrompt = prompt;
  let savedTokens = 0;

  if (config.enableCompression) {
    const compressed = compressor.compress(prompt, {
      maxTokens: config.maxPromptTokens + 2000, // JSON은 더 여유있게
    });
    finalPrompt = compressed.compressed;
    savedTokens = compressed.originalTokens - compressed.compressedTokens;
  }

  // 2. 캐시 확인
  const cacheKey = `json:${finalPrompt}`;
  if (config.enableCache && !options?.skipCache) {
    const cacheResult = await cache.get(cacheKey, model);

    if (cacheResult.hit && cacheResult.response) {
      try {
        const data = JSON.parse(cacheResult.response) as T;

        if (config.enableCostTracking) {
          const outputTokens = estimateTokens(cacheResult.response);
          tracker.recordUsage(model, estimateTokens(finalPrompt), outputTokens, {
            type: taskType,
            projectId: options?.projectId,
            cached: true,
          });
        }

        return {
          data,
          cached: true,
          cost: 0,
          savedTokens,
        };
      } catch {
        // 캐시된 JSON 파싱 실패 시 새로 생성
        console.warn('[OptimizedGemini] 캐시된 JSON 파싱 실패, 새로 생성');
      }
    }
  }

  // 3. 예산 확인
  let actualModel = model;

  if (config.enableCostTracking && config.enableAutoDowngrade) {
    const budgetStatus = tracker.checkBudget();

    if (budgetStatus === 'exceeded' && tracker.isApiDisabled()) {
      throw new Error('API 예산을 초과했습니다.');
    }

    if (budgetStatus === 'warning') {
      actualModel = tracker.getRecommendedModel(taskType, 'medium');
    }
  }

  // 4. 실제 API 호출
  const data = await generateJSON<T>(apiKey, finalPrompt, {
    ...options,
    model: actualModel,
  });

  // 5. 캐시에 저장
  if (config.enableCache) {
    const responseStr = JSON.stringify(data);
    await cache.set(cacheKey, actualModel, responseStr, {
      tokenCount: estimateTokens(responseStr),
      generationType: taskType,
      projectId: options?.projectId,
    });
  }

  // 6. 비용 기록
  let cost = 0;
  if (config.enableCostTracking) {
    const inputTokens = estimateTokens(finalPrompt);
    const outputTokens = estimateTokens(JSON.stringify(data));
    const result = tracker.recordUsage(actualModel, inputTokens, outputTokens, {
      type: taskType,
      projectId: options?.projectId,
      cached: false,
    });
    cost = result.cost;
  }

  return {
    data,
    cached: false,
    cost,
    savedTokens,
  };
}

/**
 * 최적화된 스트리밍 생성 (캐시 불가, 비용 추적만)
 */
export async function* optimizedGenerateTextStream(
  apiKey: string,
  prompt: string,
  options?: {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    topK?: number;
    model?: GeminiModel;
    taskType?: 'planning' | 'writing' | 'analysis' | 'other';
    projectId?: string;
  }
): AsyncGenerator<string, { totalTokens: number; cost: number }, unknown> {
  const compressor = getPromptCompressor();
  const tracker = getCostTracker();

  const model = options?.model || 'gemini-2.0-flash';
  const taskType = options?.taskType || 'writing';

  // 1. 프롬프트 압축
  let finalPrompt = prompt;

  if (config.enableCompression) {
    const compressed = compressor.compress(prompt);
    finalPrompt = compressed.compressed;
  }

  // 2. 예산 확인
  let actualModel = model;

  if (config.enableCostTracking && config.enableAutoDowngrade) {
    const budgetStatus = tracker.checkBudget();

    if (budgetStatus === 'exceeded' && tracker.isApiDisabled()) {
      throw new Error('API 예산을 초과했습니다.');
    }

    if (budgetStatus === 'warning') {
      actualModel = tracker.getRecommendedModel(taskType, 'low');
    }
  }

  // 3. 스트리밍 생성
  let totalOutput = '';

  const stream = generateTextStream(apiKey, finalPrompt, {
    ...options,
    model: actualModel,
  });

  for await (const chunk of stream) {
    totalOutput += chunk;
    yield chunk;
  }

  // 4. 비용 기록
  let cost = 0;
  if (config.enableCostTracking) {
    const inputTokens = estimateTokens(finalPrompt);
    const outputTokens = estimateTokens(totalOutput);
    const result = tracker.recordUsage(actualModel, inputTokens, outputTokens, {
      type: taskType,
      projectId: options?.projectId,
      cached: false,
    });
    cost = result.cost;
  }

  return {
    totalTokens: estimateTokens(totalOutput),
    cost,
  };
}

/**
 * 통합 통계 가져오기
 */
export function getOptimizationStats() {
  const cache = getAPICache();
  const compressor = getPromptCompressor();
  const tracker = getCostTracker();

  const cacheStats = cache.getStats();
  const compressionStats = compressor.getStats();
  const budgetStatus = tracker.getBudgetStatus();

  return {
    cache: {
      hitRate: cacheStats.hitRate,
      totalSaved: cacheStats.totalSaved,
      memorySize: cacheStats.memoryCacheSize,
    },
    compression: {
      savedTokens: compressionStats.savedTokens,
      averageRatio: compressionStats.averageCompressionRatio,
    },
    budget: {
      daily: `$${budgetStatus.daily.used.toFixed(2)} / $${budgetStatus.daily.limit.toFixed(2)} (${budgetStatus.daily.percentage.toFixed(1)}%)`,
      monthly: `$${budgetStatus.monthly.used.toFixed(2)} / $${budgetStatus.monthly.limit.toFixed(2)} (${budgetStatus.monthly.percentage.toFixed(1)}%)`,
    },
    suggestions: tracker.getOptimizationSuggestions(),
  };
}

/**
 * 캐시 정리
 */
export function cleanupCache(): number {
  const cache = getAPICache();
  return cache.cleanup();
}

/**
 * 전체 캐시 초기화
 */
export function clearCache(): void {
  const cache = getAPICache();
  cache.invalidate();
}

/**
 * 예산 설정
 */
export function setBudget(budget: {
  dailyLimit?: number;
  monthlyLimit?: number;
  warningThreshold?: number;
  autoDisable?: boolean;
  preferFreeModel?: boolean;
}): void {
  const tracker = getCostTracker();
  tracker.updateBudget(budget);
}

/**
 * 비용 리포트 생성
 */
export function getCostReport() {
  const tracker = getCostTracker();
  return tracker.generateReport();
}

/**
 * API 재활성화 (예산 초과로 비활성화된 경우)
 */
export function enableApi(): void {
  const tracker = getCostTracker();
  tracker.enableApi();
}
