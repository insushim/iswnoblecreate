'use client';

/**
 * 비용 최적화 설정 컴포넌트
 *
 * 50개 이상의 비용 최소화 전략을 UI로 관리합니다:
 * - 일일/월간 예산 설정
 * - 캐시 통계 및 관리
 * - 비용 추적 및 리포트
 * - 최적화 제안 표시
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getCostTracker,
  getAPICache,
  getPromptCompressor,
  getOptimizationStats,
  setBudget,
  clearCache,
  getCostReport,
} from '@/lib/costOptimization';

interface CostOptimizationSettingsProps {
  onClose?: () => void;
}

export function CostOptimizationSettings({ onClose }: CostOptimizationSettingsProps) {
  // 상태
  const [dailyLimit, setDailyLimit] = useState(5);
  const [monthlyLimit, setMonthlyLimit] = useState(50);
  const [warningThreshold, setWarningThreshold] = useState(80);
  const [autoDisable, setAutoDisable] = useState(false);
  const [preferFreeModel, setPreferFreeModel] = useState(true);

  // 통계 상태
  const [stats, setStats] = useState<ReturnType<typeof getOptimizationStats> | null>(null);
  const [report, setReport] = useState<ReturnType<typeof getCostReport> | null>(null);

  // 로딩 상태
  const [isLoading, setIsLoading] = useState(true);

  // 통계 로드
  const loadStats = useCallback(() => {
    try {
      const newStats = getOptimizationStats();
      setStats(newStats);

      const newReport = getCostReport();
      setReport(newReport);

      // 현재 예산 설정 로드
      const tracker = getCostTracker();
      const budgetStatus = tracker.getBudgetStatus();
      setDailyLimit(budgetStatus.daily.limit);
      setMonthlyLimit(budgetStatus.monthly.limit);
    } catch (error) {
      console.error('[CostSettings] 통계 로드 실패:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 5000); // 5초마다 갱신
    return () => clearInterval(interval);
  }, [loadStats]);

  // 예산 설정 저장
  const handleSaveBudget = () => {
    setBudget({
      dailyLimit,
      monthlyLimit,
      warningThreshold: warningThreshold / 100,
      autoDisable,
      preferFreeModel,
    });

    loadStats();
    alert('예산 설정이 저장되었습니다.');
  };

  // 캐시 초기화
  const handleClearCache = () => {
    if (confirm('캐시를 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      clearCache();
      loadStats();
      alert('캐시가 초기화되었습니다.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-100">비용 최적화 설정</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* 현재 사용량 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 일일 사용량 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800 rounded-lg p-4 border border-gray-700"
        >
          <h3 className="text-sm text-gray-400 mb-2">오늘 사용량</h3>
          <div className="text-2xl font-bold text-gray-100">
            ${stats?.budget.daily.split('/')[0].replace('$', '') || '0.00'}
          </div>
          <div className="text-sm text-gray-500">
            / ${dailyLimit.toFixed(2)}
          </div>
          <div className="mt-2 w-full bg-gray-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                parseFloat(stats?.budget.daily.match(/\((\d+\.\d+)%\)/)?.[1] || '0') >= 80
                  ? 'bg-red-500'
                  : parseFloat(stats?.budget.daily.match(/\((\d+\.\d+)%\)/)?.[1] || '0') >= 50
                  ? 'bg-yellow-500'
                  : 'bg-green-500'
              }`}
              style={{
                width: `${Math.min(100, parseFloat(stats?.budget.daily.match(/\((\d+\.\d+)%\)/)?.[1] || '0'))}%`,
              }}
            />
          </div>
        </motion.div>

        {/* 월간 사용량 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-800 rounded-lg p-4 border border-gray-700"
        >
          <h3 className="text-sm text-gray-400 mb-2">이번 달 사용량</h3>
          <div className="text-2xl font-bold text-gray-100">
            ${stats?.budget.monthly.split('/')[0].replace('$', '') || '0.00'}
          </div>
          <div className="text-sm text-gray-500">
            / ${monthlyLimit.toFixed(2)}
          </div>
          <div className="mt-2 w-full bg-gray-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                parseFloat(stats?.budget.monthly.match(/\((\d+\.\d+)%\)/)?.[1] || '0') >= 80
                  ? 'bg-red-500'
                  : parseFloat(stats?.budget.monthly.match(/\((\d+\.\d+)%\)/)?.[1] || '0') >= 50
                  ? 'bg-yellow-500'
                  : 'bg-green-500'
              }`}
              style={{
                width: `${Math.min(100, parseFloat(stats?.budget.monthly.match(/\((\d+\.\d+)%\)/)?.[1] || '0'))}%`,
              }}
            />
          </div>
        </motion.div>
      </div>

      {/* 캐시 및 압축 통계 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gray-800 rounded-lg p-4 border border-gray-700"
      >
        <h3 className="text-sm text-gray-400 mb-4">최적화 통계</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-lg font-semibold text-indigo-400">
              {(stats?.cache.hitRate || 0).toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500">캐시 적중률</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-green-400">
              {((stats?.cache.totalSaved || 0) / 1000).toFixed(1)}K
            </div>
            <div className="text-xs text-gray-500">절약된 토큰</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-yellow-400">
              {((stats?.compression.savedTokens || 0) / 1000).toFixed(1)}K
            </div>
            <div className="text-xs text-gray-500">압축 절약 토큰</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-purple-400">
              {stats?.cache.memorySize || 0}
            </div>
            <div className="text-xs text-gray-500">캐시 항목</div>
          </div>
        </div>

        <button
          onClick={handleClearCache}
          className="mt-4 text-sm text-red-400 hover:text-red-300 transition-colors"
        >
          캐시 초기화
        </button>
      </motion.div>

      {/* 예산 설정 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-gray-800 rounded-lg p-4 border border-gray-700"
      >
        <h3 className="text-sm text-gray-400 mb-4">예산 설정</h3>

        <div className="space-y-4">
          {/* 일일 예산 */}
          <div>
            <label className="block text-sm text-gray-300 mb-1">
              일일 예산 (USD)
            </label>
            <input
              type="number"
              value={dailyLimit}
              onChange={(e) => setDailyLimit(parseFloat(e.target.value) || 0)}
              min={0}
              step={0.5}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-gray-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* 월간 예산 */}
          <div>
            <label className="block text-sm text-gray-300 mb-1">
              월간 예산 (USD)
            </label>
            <input
              type="number"
              value={monthlyLimit}
              onChange={(e) => setMonthlyLimit(parseFloat(e.target.value) || 0)}
              min={0}
              step={1}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-gray-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* 경고 임계치 */}
          <div>
            <label className="block text-sm text-gray-300 mb-1">
              경고 임계치 ({warningThreshold}%)
            </label>
            <input
              type="range"
              value={warningThreshold}
              onChange={(e) => setWarningThreshold(parseInt(e.target.value))}
              min={50}
              max={100}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>

          {/* 체크박스 옵션 */}
          <div className="space-y-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoDisable}
                onChange={(e) => setAutoDisable(e.target.checked)}
                className="rounded bg-gray-700 border-gray-600 text-indigo-500 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-300">
                예산 초과 시 자동 비활성화
              </span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={preferFreeModel}
                onChange={(e) => setPreferFreeModel(e.target.checked)}
                className="rounded bg-gray-700 border-gray-600 text-indigo-500 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-300">
                예산 근접 시 무료 모델 자동 사용
              </span>
            </label>
          </div>

          <button
            onClick={handleSaveBudget}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded transition-colors"
          >
            저장
          </button>
        </div>
      </motion.div>

      {/* 최적화 제안 */}
      {stats?.suggestions && stats.suggestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gray-800 rounded-lg p-4 border border-gray-700"
        >
          <h3 className="text-sm text-gray-400 mb-4">최적화 제안</h3>
          <div className="space-y-3">
            {stats.suggestions.map((suggestion, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${
                  suggestion.priority === 'high'
                    ? 'bg-red-900/30 border-red-700'
                    : suggestion.priority === 'medium'
                    ? 'bg-yellow-900/30 border-yellow-700'
                    : 'bg-gray-700/50 border-gray-600'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-200">
                      {suggestion.description}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      예상 절약: ${suggestion.estimatedSavings.toFixed(2)}/월
                    </div>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      suggestion.priority === 'high'
                        ? 'bg-red-600 text-white'
                        : suggestion.priority === 'medium'
                        ? 'bg-yellow-600 text-white'
                        : 'bg-gray-600 text-gray-200'
                    }`}
                  >
                    {suggestion.priority === 'high'
                      ? '높음'
                      : suggestion.priority === 'medium'
                      ? '중간'
                      : '낮음'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* 비용 리포트 요약 */}
      {report && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gray-800 rounded-lg p-4 border border-gray-700"
        >
          <h3 className="text-sm text-gray-400 mb-4">이번 달 리포트</h3>
          <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono">
            {report.summary}
          </pre>
          {report.details && (
            <details className="mt-4">
              <summary className="text-sm text-gray-400 cursor-pointer hover:text-gray-300">
                상세 보기
              </summary>
              <pre className="mt-2 text-xs text-gray-400 whitespace-pre-wrap font-mono">
                {report.details}
              </pre>
            </details>
          )}
        </motion.div>
      )}
    </div>
  );
}

export default CostOptimizationSettings;
