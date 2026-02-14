/**
 * 비용 최적화 시스템 통합 모듈
 *
 * 50개 이상의 비용 최소화 전략 구현:
 *
 * [캐싱 시스템] #1-15
 * - LRU 메모리 캐시
 * - IndexedDB 영구 캐시
 * - 유사도 기반 캐시 히트
 * - TTL 관리
 * - 캐시 압축
 *
 * [요청 최적화] #16-30
 * - 요청 중복 제거
 * - 요청 큐 관리
 * - 우선순위 기반 처리
 * - 쓰로틀링/디바운싱
 * - 동시 요청 제한
 *
 * [프롬프트 압축] #31-45
 * - 토큰 최적화
 * - 컨텍스트 압축
 * - 템플릿화
 * - 반복 제거
 *
 * [비용 추적] #46-55
 * - 사용량 추적
 * - 예산 관리
 * - 비용 예측
 * - 최적화 제안
 */

export { APICache, getAPICache, resetAPICache } from './apiCache';
export { RequestOptimizer, getRequestOptimizer, resetRequestOptimizer } from './requestOptimizer';
export {
  PromptCompressor,
  getPromptCompressor,
  resetPromptCompressor,
  estimateTokens,
} from './promptCompressor';
export { CostTracker, getCostTracker, resetCostTracker } from './costTracker';

// 최적화된 Gemini 래퍼 (권장 사용)
export {
  optimizedGenerateText,
  optimizedGenerateJSON,
  optimizedGenerateTextStream,
  setOptimizationConfig,
  getOptimizationConfig,
  getOptimizationStats,
  cleanupCache,
  clearCache,
  setBudget,
  getCostReport,
  enableApi,
} from './optimizedGemini';

// 통합 최적화 인터페이스
import { getAPICache } from './apiCache';
import { getRequestOptimizer } from './requestOptimizer';
import { getPromptCompressor, estimateTokens } from './promptCompressor';
import { getCostTracker } from './costTracker';

/**
 * 통합 최적화 시스템
 */
export class CostOptimizationSystem {
  private cache = getAPICache();
  private optimizer = getRequestOptimizer();
  private compressor = getPromptCompressor();
  private tracker = getCostTracker();

  private isInitialized = false;

  /**
   * 시스템 초기화
   */
  initialize(executor: (prompt: string, options: {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    topK?: number;
    model?: string;
    priority?: 'high' | 'normal' | 'low' | 'background';
    skipCache?: boolean;
    timeout?: number;
  }) => Promise<string>): void {
    this.optimizer.setExecutor(executor);
    this.isInitialized = true;
  }

  /**
   * 최적화된 API 요청
   */
  async request(
    prompt: string,
    model: string,
    options?: {
      skipCache?: boolean;
      priority?: 'high' | 'normal' | 'low' | 'background';
      type?: 'planning' | 'writing' | 'analysis' | 'other';
      projectId?: string;
      maxTokens?: number;
    }
  ): Promise<{ response: string; cached: boolean; cost: number }> {
    // 1. 프롬프트 압축
    const { compressed, originalTokens, compressedTokens } = this.compressor.compress(prompt, {
      maxTokens: options?.maxTokens || 8000,
    });

    // 2. 캐시 확인
    if (!options?.skipCache) {
      const cacheResult = await this.cache.get(compressed, model);
      if (cacheResult.hit && cacheResult.response) {
        // 캐시 히트 기록
        this.tracker.recordUsage(model, compressedTokens, estimateTokens(cacheResult.response), {
          type: options?.type || 'other',
          projectId: options?.projectId,
          cached: true,
        });

        return {
          response: cacheResult.response,
          cached: true,
          cost: 0,
        };
      }
    }

    // 3. 예산 확인
    const budgetStatus = this.tracker.checkBudget();
    if (budgetStatus === 'exceeded' && this.tracker.isApiDisabled()) {
      throw new Error('일일 또는 월간 API 예산을 초과했습니다.');
    }

    // 4. 예산 경고 시 모델 다운그레이드
    let actualModel = model;
    if (budgetStatus === 'warning') {
      actualModel = this.tracker.getRecommendedModel(
        options?.type || 'other',
        'low'
      );
    }

    // 5. 요청 실행 (최적화된 큐 통해)
    if (!this.isInitialized) {
      throw new Error('CostOptimizationSystem이 초기화되지 않았습니다.');
    }

    const response = await this.optimizer.addRequest(compressed, actualModel, {
      priority: options?.priority || 'normal',
      maxTokens: options?.maxTokens,
    });

    // 6. 결과 캐싱
    const outputTokens = estimateTokens(response);
    await this.cache.set(compressed, actualModel, response, {
      tokenCount: outputTokens,
      generationType: options?.type,
      projectId: options?.projectId,
    });

    // 7. 비용 기록
    const { cost } = this.tracker.recordUsage(actualModel, compressedTokens, outputTokens, {
      type: options?.type || 'other',
      projectId: options?.projectId,
      cached: false,
    });

    return {
      response,
      cached: false,
      cost,
    };
  }

  /**
   * 통합 통계
   */
  getStats(): {
    cache: ReturnType<typeof getAPICache>['getStats'] extends () => infer R ? R : never;
    requests: ReturnType<typeof getRequestOptimizer>['getMetrics'] extends () => infer R ? R : never;
    compression: ReturnType<typeof getPromptCompressor>['getStats'] extends () => infer R ? R : never;
    budget: ReturnType<typeof getCostTracker>['getBudgetStatus'] extends () => infer R ? R : never;
  } {
    return {
      cache: this.cache.getStats(),
      requests: this.optimizer.getMetrics(),
      compression: this.compressor.getStats(),
      budget: this.tracker.getBudgetStatus(),
    };
  }

  /**
   * 최적화 제안
   */
  getSuggestions(): ReturnType<typeof getCostTracker>['getOptimizationSuggestions'] extends () => infer R ? R : never {
    return this.tracker.getOptimizationSuggestions();
  }

  /**
   * 비용 리포트
   */
  getReport(): ReturnType<typeof getCostTracker>['generateReport'] extends () => infer R ? R : never {
    return this.tracker.generateReport();
  }

  /**
   * 캐시 정리
   */
  cleanupCache(): void {
    this.cache.cleanup();
  }

  /**
   * 모든 요청 취소
   */
  cancelAll(): void {
    this.optimizer.cancelAll();
  }

  /**
   * 예산 설정
   */
  setBudget(budget: {
    dailyLimit?: number;
    monthlyLimit?: number;
    warningThreshold?: number;
    autoDisable?: boolean;
    preferFreeModel?: boolean;
  }): void {
    this.tracker.updateBudget(budget);
  }

  /**
   * 예산 경고 콜백 설정
   */
  onBudgetWarning(callback: (current: number, limit: number, type: 'daily' | 'monthly') => void): void {
    this.tracker.setCallbacks({ onBudgetWarning: callback });
  }

  /**
   * 예산 초과 콜백 설정
   */
  onBudgetExceeded(callback: (type: 'daily' | 'monthly') => void): void {
    this.tracker.setCallbacks({ onBudgetExceeded: callback });
  }
}

// 싱글톤 인스턴스
let systemInstance: CostOptimizationSystem | null = null;

export function getCostOptimizationSystem(): CostOptimizationSystem {
  if (!systemInstance) {
    systemInstance = new CostOptimizationSystem();
  }
  return systemInstance;
}

export function resetCostOptimizationSystem(): void {
  if (systemInstance) {
    systemInstance.cancelAll();
  }
  systemInstance = null;
}
