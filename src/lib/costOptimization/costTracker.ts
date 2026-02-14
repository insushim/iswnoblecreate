/**
 * 비용 추적 시스템 - 비용 최소화 전략 #46-55
 *
 * 구현된 전략:
 * 46. 토큰 사용량 추적
 * 47. 비용 계산 (모델별)
 * 48. 일일/월간 예산 제한
 * 49. 예산 경고 알림
 * 50. 비용 최적화 제안
 * 51. 사용량 분석
 * 52. 비용 예측
 * 53. 모델 선택 최적화
 * 54. 사용 패턴 분석
 * 55. 비용 리포트 생성
 */

import { GeminiModel } from '@/types';

// 모델별 가격 (1M 토큰 기준, USD)
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'gemini-3-pro-preview': { input: 1.25, output: 10.00 },
  'gemini-3-flash-preview': { input: 0.10, output: 0.40 },
  'gemini-2.5-pro': { input: 1.25, output: 5.00 },
  'gemini-2.5-flash': { input: 0.15, output: 0.60 },
  'gemini-2.5-flash-lite': { input: 0.075, output: 0.30 },
  'gemini-2.0-flash': { input: 0, output: 0 }, // 무료
  'gemini-1.5-pro': { input: 1.25, output: 5.00 },
  'gemini-1.5-flash': { input: 0.075, output: 0.30 },
};

// 사용량 기록
interface UsageRecord {
  id: string;
  timestamp: number;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  type: 'planning' | 'writing' | 'analysis' | 'other';
  projectId?: string;
  cached: boolean;
}

// 일간/월간 통계
interface UsageStats {
  date: string; // YYYY-MM-DD 또는 YYYY-MM
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCost: number;
  requestCount: number;
  cachedRequests: number;
  byModel: Record<string, { input: number; output: number; cost: number; count: number }>;
  byType: Record<string, { input: number; output: number; cost: number; count: number }>;
}

// 예산 설정
interface BudgetConfig {
  dailyLimit: number; // USD
  monthlyLimit: number; // USD
  warningThreshold: number; // 0-1 (경고 발생 비율)
  autoDisable: boolean; // 예산 초과 시 자동 비활성화
  preferFreeModel: boolean; // 예산 근접 시 무료 모델 우선
}

// 비용 최적화 제안
interface OptimizationSuggestion {
  type: 'model' | 'cache' | 'compression' | 'batch';
  description: string;
  estimatedSavings: number; // USD
  priority: 'high' | 'medium' | 'low';
}

const DEFAULT_BUDGET: BudgetConfig = {
  dailyLimit: 5.00,
  monthlyLimit: 50.00,
  warningThreshold: 0.8,
  autoDisable: false,
  preferFreeModel: true,
};

/**
 * 비용 추적 클래스
 */
export class CostTracker {
  private records: UsageRecord[] = [];
  private dailyStats: Map<string, UsageStats> = new Map();
  private monthlyStats: Map<string, UsageStats> = new Map();
  private budget: BudgetConfig;
  private isDisabled: boolean = false;

  // 콜백
  private onBudgetWarning?: (current: number, limit: number, type: 'daily' | 'monthly') => void;
  private onBudgetExceeded?: (type: 'daily' | 'monthly') => void;

  constructor(budget: Partial<BudgetConfig> = {}) {
    this.budget = { ...DEFAULT_BUDGET, ...budget };
    this.loadFromStorage();
  }

  /**
   * 로컬 스토리지에서 로드
   */
  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const savedRecords = localStorage.getItem('costTracker_records');
      if (savedRecords) {
        const parsed = JSON.parse(savedRecords);
        // 최근 30일 기록만 유지
        const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        this.records = parsed.filter((r: UsageRecord) => r.timestamp > thirtyDaysAgo);
      }

      const savedBudget = localStorage.getItem('costTracker_budget');
      if (savedBudget) {
        this.budget = { ...this.budget, ...JSON.parse(savedBudget) };
      }
    } catch (error) {
      console.warn('[CostTracker] 저장된 데이터 로드 실패:', error);
    }

    this.recalculateStats();
  }

  /**
   * 로컬 스토리지에 저장
   */
  private saveToStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      // 최근 100개 기록만 저장
      const recentRecords = this.records.slice(-100);
      localStorage.setItem('costTracker_records', JSON.stringify(recentRecords));
      localStorage.setItem('costTracker_budget', JSON.stringify(this.budget));
    } catch (error) {
      console.warn('[CostTracker] 저장 실패:', error);
    }
  }

  /**
   * 통계 재계산
   */
  private recalculateStats(): void {
    this.dailyStats.clear();
    this.monthlyStats.clear();

    for (const record of this.records) {
      const date = new Date(record.timestamp);
      const dayKey = date.toISOString().split('T')[0];
      const monthKey = dayKey.slice(0, 7);

      this.addToStats(this.dailyStats, dayKey, record);
      this.addToStats(this.monthlyStats, monthKey, record);
    }
  }

  /**
   * 통계에 추가
   */
  private addToStats(
    statsMap: Map<string, UsageStats>,
    key: string,
    record: UsageRecord
  ): void {
    let stats = statsMap.get(key);

    if (!stats) {
      stats = {
        date: key,
        totalInputTokens: 0,
        totalOutputTokens: 0,
        totalCost: 0,
        requestCount: 0,
        cachedRequests: 0,
        byModel: {},
        byType: {},
      };
      statsMap.set(key, stats);
    }

    stats.totalInputTokens += record.inputTokens;
    stats.totalOutputTokens += record.outputTokens;
    stats.totalCost += record.cost;
    stats.requestCount++;
    if (record.cached) stats.cachedRequests++;

    // 모델별
    if (!stats.byModel[record.model]) {
      stats.byModel[record.model] = { input: 0, output: 0, cost: 0, count: 0 };
    }
    stats.byModel[record.model].input += record.inputTokens;
    stats.byModel[record.model].output += record.outputTokens;
    stats.byModel[record.model].cost += record.cost;
    stats.byModel[record.model].count++;

    // 유형별
    if (!stats.byType[record.type]) {
      stats.byType[record.type] = { input: 0, output: 0, cost: 0, count: 0 };
    }
    stats.byType[record.type].input += record.inputTokens;
    stats.byType[record.type].output += record.outputTokens;
    stats.byType[record.type].cost += record.cost;
    stats.byType[record.type].count++;
  }

  /**
   * 비용 계산
   */
  calculateCost(model: string, inputTokens: number, outputTokens: number): number {
    const pricing = MODEL_PRICING[model] || MODEL_PRICING['gemini-2.0-flash'];
    const inputCost = (inputTokens / 1000000) * pricing.input;
    const outputCost = (outputTokens / 1000000) * pricing.output;
    return inputCost + outputCost;
  }

  /**
   * 사용량 기록
   */
  recordUsage(
    model: string,
    inputTokens: number,
    outputTokens: number,
    options?: {
      type?: 'planning' | 'writing' | 'analysis' | 'other';
      projectId?: string;
      cached?: boolean;
    }
  ): { cost: number; budgetStatus: 'ok' | 'warning' | 'exceeded' } {
    const cost = options?.cached ? 0 : this.calculateCost(model, inputTokens, outputTokens);

    const record: UsageRecord = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
      model,
      inputTokens,
      outputTokens,
      cost,
      type: options?.type || 'other',
      projectId: options?.projectId,
      cached: options?.cached || false,
    };

    this.records.push(record);

    // 통계 업데이트
    const today = new Date().toISOString().split('T')[0];
    const thisMonth = today.slice(0, 7);
    this.addToStats(this.dailyStats, today, record);
    this.addToStats(this.monthlyStats, thisMonth, record);

    this.saveToStorage();

    // 예산 확인
    const budgetStatus = this.checkBudget();

    return { cost, budgetStatus };
  }

  /**
   * 예산 확인
   */
  checkBudget(): 'ok' | 'warning' | 'exceeded' {
    const today = new Date().toISOString().split('T')[0];
    const thisMonth = today.slice(0, 7);

    const dailyStats = this.dailyStats.get(today);
    const monthlyStats = this.monthlyStats.get(thisMonth);

    const dailyCost = dailyStats?.totalCost || 0;
    const monthlyCost = monthlyStats?.totalCost || 0;

    // 일일 예산 확인
    if (dailyCost >= this.budget.dailyLimit) {
      if (this.budget.autoDisable) this.isDisabled = true;
      this.onBudgetExceeded?.('daily');
      return 'exceeded';
    }

    // 월간 예산 확인
    if (monthlyCost >= this.budget.monthlyLimit) {
      if (this.budget.autoDisable) this.isDisabled = true;
      this.onBudgetExceeded?.('monthly');
      return 'exceeded';
    }

    // 경고 확인
    if (dailyCost >= this.budget.dailyLimit * this.budget.warningThreshold) {
      this.onBudgetWarning?.(dailyCost, this.budget.dailyLimit, 'daily');
      return 'warning';
    }

    if (monthlyCost >= this.budget.monthlyLimit * this.budget.warningThreshold) {
      this.onBudgetWarning?.(monthlyCost, this.budget.monthlyLimit, 'monthly');
      return 'warning';
    }

    return 'ok';
  }

  /**
   * 추천 모델 가져오기 (비용 최적화)
   */
  getRecommendedModel(
    taskType: 'planning' | 'writing' | 'analysis' | 'other',
    quality: 'high' | 'medium' | 'low' = 'medium'
  ): GeminiModel {
    const today = new Date().toISOString().split('T')[0];
    const dailyStats = this.dailyStats.get(today);
    const dailyCost = dailyStats?.totalCost || 0;

    // 예산의 80% 이상 사용했으면 무료 모델 추천
    if (this.budget.preferFreeModel && dailyCost >= this.budget.dailyLimit * 0.8) {
      return 'gemini-2.0-flash';
    }

    // 작업 유형과 품질에 따른 추천
    if (quality === 'high') {
      if (taskType === 'writing') return 'gemini-2.5-pro';
      return 'gemini-3-flash-preview';
    }

    if (quality === 'medium') {
      if (taskType === 'writing') return 'gemini-2.5-flash';
      return 'gemini-3-flash-preview';
    }

    // 저품질 또는 비용 우선
    return 'gemini-2.0-flash';
  }

  /**
   * 최적화 제안 생성
   */
  getOptimizationSuggestions(): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];
    const today = new Date().toISOString().split('T')[0];
    const thisMonth = today.slice(0, 7);

    const dailyStats = this.dailyStats.get(today);
    const monthlyStats = this.monthlyStats.get(thisMonth);

    if (!monthlyStats) return suggestions;

    // 1. 캐시 활용 제안
    const cacheRate = monthlyStats.cachedRequests / monthlyStats.requestCount;
    if (cacheRate < 0.2) {
      suggestions.push({
        type: 'cache',
        description: '캐시 히트율이 낮습니다. 유사한 요청이 반복되고 있을 수 있습니다.',
        estimatedSavings: monthlyStats.totalCost * 0.3,
        priority: 'high',
      });
    }

    // 2. 모델 최적화 제안
    const expensiveModels = ['gemini-3-pro-preview', 'gemini-2.5-pro'];
    let expensiveCost = 0;
    for (const model of expensiveModels) {
      if (monthlyStats.byModel[model]) {
        expensiveCost += monthlyStats.byModel[model].cost;
      }
    }

    if (expensiveCost > monthlyStats.totalCost * 0.5) {
      suggestions.push({
        type: 'model',
        description: '고비용 모델 사용이 많습니다. Flash 모델로 대체를 고려하세요.',
        estimatedSavings: expensiveCost * 0.6,
        priority: 'high',
      });
    }

    // 3. 압축 제안
    if (monthlyStats.totalInputTokens > 500000) {
      suggestions.push({
        type: 'compression',
        description: '입력 토큰이 많습니다. 프롬프트 압축을 활성화하세요.',
        estimatedSavings: monthlyStats.totalCost * 0.2,
        priority: 'medium',
      });
    }

    // 4. 무료 모델 활용 제안
    const freeModelUsage = monthlyStats.byModel['gemini-2.0-flash'];
    if (!freeModelUsage || freeModelUsage.count < monthlyStats.requestCount * 0.3) {
      suggestions.push({
        type: 'model',
        description: '무료 모델(gemini-2.0-flash)을 더 활용하세요. 기획/분석에 충분합니다.',
        estimatedSavings: monthlyStats.totalCost * 0.4,
        priority: 'medium',
      });
    }

    return suggestions.sort((a, b) =>
      b.estimatedSavings - a.estimatedSavings
    );
  }

  /**
   * 비용 예측
   */
  predictCost(days: number = 30): {
    predicted: number;
    confidence: 'high' | 'medium' | 'low';
    trend: 'increasing' | 'stable' | 'decreasing';
  } {
    const recentDays = 7;
    const recentRecords = this.records.filter(
      r => r.timestamp > Date.now() - recentDays * 24 * 60 * 60 * 1000
    );

    if (recentRecords.length < 10) {
      return { predicted: 0, confidence: 'low', trend: 'stable' };
    }

    const dailyCost = recentRecords.reduce((sum, r) => sum + r.cost, 0) / recentDays;
    const predicted = dailyCost * days;

    // 트렌드 계산
    const halfPoint = Math.floor(recentRecords.length / 2);
    const firstHalf = recentRecords.slice(0, halfPoint);
    const secondHalf = recentRecords.slice(halfPoint);

    const firstHalfCost = firstHalf.reduce((sum, r) => sum + r.cost, 0);
    const secondHalfCost = secondHalf.reduce((sum, r) => sum + r.cost, 0);

    let trend: 'increasing' | 'stable' | 'decreasing' = 'stable';
    if (secondHalfCost > firstHalfCost * 1.2) trend = 'increasing';
    else if (secondHalfCost < firstHalfCost * 0.8) trend = 'decreasing';

    return {
      predicted,
      confidence: recentRecords.length >= 50 ? 'high' : 'medium',
      trend,
    };
  }

  /**
   * 일간 통계 가져오기
   */
  getDailyStats(date?: string): UsageStats | null {
    const key = date || new Date().toISOString().split('T')[0];
    return this.dailyStats.get(key) || null;
  }

  /**
   * 월간 통계 가져오기
   */
  getMonthlyStats(month?: string): UsageStats | null {
    const key = month || new Date().toISOString().slice(0, 7);
    return this.monthlyStats.get(key) || null;
  }

  /**
   * 예산 상태 가져오기
   */
  getBudgetStatus(): {
    daily: { used: number; limit: number; percentage: number };
    monthly: { used: number; limit: number; percentage: number };
    isDisabled: boolean;
  } {
    const today = new Date().toISOString().split('T')[0];
    const thisMonth = today.slice(0, 7);

    const dailyStats = this.dailyStats.get(today);
    const monthlyStats = this.monthlyStats.get(thisMonth);

    return {
      daily: {
        used: dailyStats?.totalCost || 0,
        limit: this.budget.dailyLimit,
        percentage: ((dailyStats?.totalCost || 0) / this.budget.dailyLimit) * 100,
      },
      monthly: {
        used: monthlyStats?.totalCost || 0,
        limit: this.budget.monthlyLimit,
        percentage: ((monthlyStats?.totalCost || 0) / this.budget.monthlyLimit) * 100,
      },
      isDisabled: this.isDisabled,
    };
  }

  /**
   * 예산 설정 업데이트
   */
  updateBudget(budget: Partial<BudgetConfig>): void {
    this.budget = { ...this.budget, ...budget };
    this.saveToStorage();
    this.isDisabled = false; // 예산 업데이트 시 활성화
  }

  /**
   * 콜백 설정
   */
  setCallbacks(callbacks: {
    onBudgetWarning?: (current: number, limit: number, type: 'daily' | 'monthly') => void;
    onBudgetExceeded?: (type: 'daily' | 'monthly') => void;
  }): void {
    this.onBudgetWarning = callbacks.onBudgetWarning;
    this.onBudgetExceeded = callbacks.onBudgetExceeded;
  }

  /**
   * 비활성화 상태 확인
   */
  isApiDisabled(): boolean {
    return this.isDisabled;
  }

  /**
   * 수동으로 활성화
   */
  enableApi(): void {
    this.isDisabled = false;
  }

  /**
   * 데이터 초기화
   */
  clearHistory(): void {
    this.records = [];
    this.dailyStats.clear();
    this.monthlyStats.clear();
    this.saveToStorage();
  }

  /**
   * 리포트 생성
   */
  generateReport(): {
    summary: string;
    details: string;
    suggestions: OptimizationSuggestion[];
  } {
    const thisMonth = new Date().toISOString().slice(0, 7);
    const monthlyStats = this.monthlyStats.get(thisMonth);
    const suggestions = this.getOptimizationSuggestions();
    const prediction = this.predictCost(30);

    if (!monthlyStats) {
      return {
        summary: '이번 달 사용 내역이 없습니다.',
        details: '',
        suggestions: [],
      };
    }

    const summary = `
이번 달 API 비용 리포트
━━━━━━━━━━━━━━━━━━━━━━━━
총 비용: $${monthlyStats.totalCost.toFixed(2)}
요청 수: ${monthlyStats.requestCount}회
캐시 히트: ${monthlyStats.cachedRequests}회 (${((monthlyStats.cachedRequests / monthlyStats.requestCount) * 100).toFixed(1)}%)
입력 토큰: ${(monthlyStats.totalInputTokens / 1000).toFixed(1)}K
출력 토큰: ${(monthlyStats.totalOutputTokens / 1000).toFixed(1)}K
30일 예측: $${prediction.predicted.toFixed(2)} (${prediction.trend})
`.trim();

    const modelDetails = Object.entries(monthlyStats.byModel)
      .sort((a, b) => b[1].cost - a[1].cost)
      .map(([model, data]) =>
        `  ${model}: $${data.cost.toFixed(2)} (${data.count}회)`
      )
      .join('\n');

    const details = `
모델별 사용량:
${modelDetails}

절약 가능 금액: $${suggestions.reduce((sum, s) => sum + s.estimatedSavings, 0).toFixed(2)}
`.trim();

    return { summary, details, suggestions };
  }
}

// 싱글톤 인스턴스
let costTrackerInstance: CostTracker | null = null;

export function getCostTracker(budget?: Partial<BudgetConfig>): CostTracker {
  if (!costTrackerInstance) {
    costTrackerInstance = new CostTracker(budget);
  }
  return costTrackerInstance;
}

export function resetCostTracker(): void {
  costTrackerInstance = null;
}
