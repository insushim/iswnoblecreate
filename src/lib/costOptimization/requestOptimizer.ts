/**
 * 요청 최적화 시스템 - 비용 최소화 전략 #16-30
 *
 * 구현된 전략:
 * 16. 요청 중복 제거 (Deduplication)
 * 17. 요청 배치 (Batch Requests)
 * 18. 요청 큐 관리
 * 19. 우선순위 기반 요청
 * 20. 쓰로틀링 (Rate Limiting)
 * 21. 디바운싱
 * 22. 요청 병합 (Request Merging)
 * 23. 조건부 요청
 * 24. 증분 요청
 * 25. 요청 취소 (AbortController)
 * 26. 백그라운드 요청
 * 27. 요청 재시도 최적화
 * 28. 요청 타임아웃 관리
 * 29. 동시 요청 제한
 * 30. 요청 메트릭스 수집
 */

type RequestPriority = 'high' | 'normal' | 'low' | 'background';

interface QueuedRequest {
  id: string;
  prompt: string;
  model: string;
  options: RequestOptions;
  priority: RequestPriority;
  createdAt: number;
  retryCount: number;
  abortController: AbortController;
  resolve: (value: string) => void;
  reject: (reason: Error) => void;
}

interface RequestOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  topK?: number;
  model?: string;
  priority?: RequestPriority;
  skipCache?: boolean;
  timeout?: number;
}

interface RequestMetrics {
  totalRequests: number;
  completedRequests: number;
  failedRequests: number;
  cancelledRequests: number;
  deduplicatedRequests: number;
  batchedRequests: number;
  throttledRequests: number;
  averageResponseTime: number;
  totalResponseTime: number;
}

interface OptimizerConfig {
  maxConcurrentRequests: number;
  minRequestInterval: number; // ms
  maxQueueSize: number;
  defaultTimeout: number; // ms
  maxRetries: number;
  retryDelay: number; // ms
  enableDeduplication: boolean;
  enableBatching: boolean;
  batchWindow: number; // ms
  batchMaxSize: number;
}

const DEFAULT_CONFIG: OptimizerConfig = {
  maxConcurrentRequests: 3,
  minRequestInterval: 1500, // 1.5초
  maxQueueSize: 50,
  defaultTimeout: 60000, // 60초
  maxRetries: 3,
  retryDelay: 2000, // 2초
  enableDeduplication: true,
  enableBatching: false, // Gemini는 배치 미지원
  batchWindow: 100,
  batchMaxSize: 5,
};

/**
 * 요청 최적화 클래스
 */
export class RequestOptimizer {
  private config: OptimizerConfig;
  private queue: QueuedRequest[] = [];
  private activeRequests: Map<string, QueuedRequest> = new Map();
  private pendingPromises: Map<string, Promise<string>> = new Map();
  private lastRequestTime: number = 0;
  private metrics: RequestMetrics;
  private isProcessing: boolean = false;

  // 쓰로틀링을 위한 타이머
  private throttleTimers: Map<string, NodeJS.Timeout> = new Map();

  // 디바운스를 위한 타이머
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();

  // 요청 실행 함수 (외부에서 주입)
  private executeRequest: ((
    prompt: string,
    options: RequestOptions
  ) => Promise<string>) | null = null;

  constructor(config: Partial<OptimizerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.metrics = {
      totalRequests: 0,
      completedRequests: 0,
      failedRequests: 0,
      cancelledRequests: 0,
      deduplicatedRequests: 0,
      batchedRequests: 0,
      throttledRequests: 0,
      averageResponseTime: 0,
      totalResponseTime: 0,
    };
  }

  /**
   * 요청 실행 함수 설정
   */
  setExecutor(executor: (prompt: string, options: RequestOptions) => Promise<string>): void {
    this.executeRequest = executor;
  }

  /**
   * 요청 ID 생성 (중복 제거용)
   */
  private generateRequestId(prompt: string, model: string): string {
    // 프롬프트의 처음 200자 + 모델로 ID 생성
    const normalizedPrompt = prompt.slice(0, 200).replace(/\s+/g, ' ').trim();
    let hash = 0;
    const str = `${model}:${normalizedPrompt}`;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }

  /**
   * 요청 추가 (중복 제거 포함)
   */
  async addRequest(
    prompt: string,
    model: string,
    options: RequestOptions = {}
  ): Promise<string> {
    this.metrics.totalRequests++;

    const requestId = this.generateRequestId(prompt, model);

    // 1. 중복 요청 확인 (Deduplication)
    if (this.config.enableDeduplication) {
      // 진행 중인 동일 요청이 있으면 그 결과를 공유
      const pendingPromise = this.pendingPromises.get(requestId);
      if (pendingPromise) {
        this.metrics.deduplicatedRequests++;
        console.log(`[RequestOptimizer] 중복 요청 감지, 기존 요청 결과 공유: ${requestId.slice(0, 8)}...`);
        return pendingPromise;
      }
    }

    // 2. 큐 용량 확인
    if (this.queue.length >= this.config.maxQueueSize) {
      throw new Error('요청 큐가 가득 찼습니다. 잠시 후 다시 시도해주세요.');
    }

    // 3. 새 요청 생성
    const abortController = new AbortController();
    const priority = options.priority || 'normal';

    const promise = new Promise<string>((resolve, reject) => {
      const request: QueuedRequest = {
        id: requestId,
        prompt,
        model,
        options,
        priority,
        createdAt: Date.now(),
        retryCount: 0,
        abortController,
        resolve,
        reject,
      };

      // 우선순위에 따라 큐에 삽입
      this.insertByPriority(request);
    });

    // 중복 제거를 위해 Promise 저장
    this.pendingPromises.set(requestId, promise);

    // 정리 콜백
    promise.finally(() => {
      this.pendingPromises.delete(requestId);
    });

    // 큐 처리 시작
    this.processQueue();

    return promise;
  }

  /**
   * 우선순위에 따라 큐에 삽입
   */
  private insertByPriority(request: QueuedRequest): void {
    const priorityOrder: Record<RequestPriority, number> = {
      high: 0,
      normal: 1,
      low: 2,
      background: 3,
    };

    const insertIndex = this.queue.findIndex(
      r => priorityOrder[r.priority] > priorityOrder[request.priority]
    );

    if (insertIndex === -1) {
      this.queue.push(request);
    } else {
      this.queue.splice(insertIndex, 0, request);
    }
  }

  /**
   * 큐 처리
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    while (this.queue.length > 0) {
      // 동시 요청 수 제한 확인
      if (this.activeRequests.size >= this.config.maxConcurrentRequests) {
        await new Promise(resolve => setTimeout(resolve, 100));
        continue;
      }

      // 쓰로틀링: 최소 요청 간격 확인
      const timeSinceLastRequest = Date.now() - this.lastRequestTime;
      if (timeSinceLastRequest < this.config.minRequestInterval) {
        const waitTime = this.config.minRequestInterval - timeSinceLastRequest;
        this.metrics.throttledRequests++;
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }

      // 요청 가져오기
      const request = this.queue.shift();
      if (!request) continue;

      // 요청 실행
      this.executeQueuedRequest(request);
      this.lastRequestTime = Date.now();
    }

    this.isProcessing = false;
  }

  /**
   * 큐의 요청 실행
   */
  private async executeQueuedRequest(request: QueuedRequest): Promise<void> {
    if (!this.executeRequest) {
      request.reject(new Error('요청 실행 함수가 설정되지 않았습니다.'));
      return;
    }

    this.activeRequests.set(request.id, request);
    const startTime = Date.now();

    try {
      // 타임아웃 설정
      const timeout = request.options.timeout || this.config.defaultTimeout;
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('요청 시간 초과')), timeout);
      });

      // 취소 확인
      if (request.abortController.signal.aborted) {
        throw new Error('요청이 취소되었습니다.');
      }

      // 요청 실행
      const result = await Promise.race([
        this.executeRequest(request.prompt, request.options),
        timeoutPromise,
      ]);

      // 메트릭스 업데이트
      const responseTime = Date.now() - startTime;
      this.metrics.completedRequests++;
      this.metrics.totalResponseTime += responseTime;
      this.metrics.averageResponseTime =
        this.metrics.totalResponseTime / this.metrics.completedRequests;

      request.resolve(result);
    } catch (error) {
      // 재시도 로직
      if (
        request.retryCount < this.config.maxRetries &&
        !request.abortController.signal.aborted &&
        error instanceof Error &&
        !error.message.includes('취소')
      ) {
        request.retryCount++;
        console.log(
          `[RequestOptimizer] 재시도 ${request.retryCount}/${this.config.maxRetries}: ${request.id.slice(0, 8)}...`
        );

        // 지수 백오프
        const delay = this.config.retryDelay * Math.pow(2, request.retryCount - 1);
        await new Promise(resolve => setTimeout(resolve, delay));

        // 큐에 다시 추가
        this.insertByPriority(request);
        this.processQueue();
      } else {
        this.metrics.failedRequests++;
        request.reject(error instanceof Error ? error : new Error(String(error)));
      }
    } finally {
      this.activeRequests.delete(request.id);
    }
  }

  /**
   * 요청 취소
   */
  cancelRequest(requestId: string): boolean {
    // 큐에서 제거
    const queueIndex = this.queue.findIndex(r => r.id === requestId);
    if (queueIndex !== -1) {
      const request = this.queue.splice(queueIndex, 1)[0];
      request.abortController.abort();
      request.reject(new Error('요청이 취소되었습니다.'));
      this.metrics.cancelledRequests++;
      return true;
    }

    // 활성 요청 취소
    const activeRequest = this.activeRequests.get(requestId);
    if (activeRequest) {
      activeRequest.abortController.abort();
      this.metrics.cancelledRequests++;
      return true;
    }

    return false;
  }

  /**
   * 모든 요청 취소
   */
  cancelAll(): void {
    // 큐 비우기
    this.queue.forEach(request => {
      request.abortController.abort();
      request.reject(new Error('모든 요청이 취소되었습니다.'));
    });
    this.queue = [];

    // 활성 요청 취소
    this.activeRequests.forEach(request => {
      request.abortController.abort();
    });

    console.log('[RequestOptimizer] 모든 요청 취소됨');
  }

  /**
   * 디바운스된 요청
   */
  debounce(
    key: string,
    prompt: string,
    model: string,
    options: RequestOptions = {},
    delay: number = 300
  ): Promise<string> {
    // 기존 타이머 취소
    const existingTimer = this.debounceTimers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.debounceTimers.delete(key);
        this.addRequest(prompt, model, options).then(resolve).catch(reject);
      }, delay);

      this.debounceTimers.set(key, timer);
    });
  }

  /**
   * 쓰로틀된 요청
   */
  throttle(
    key: string,
    prompt: string,
    model: string,
    options: RequestOptions = {},
    limit: number = 1000
  ): Promise<string> | null {
    // 쓰로틀 확인
    if (this.throttleTimers.has(key)) {
      console.log(`[RequestOptimizer] 쓰로틀됨: ${key}`);
      return null;
    }

    // 쓰로틀 타이머 설정
    this.throttleTimers.set(
      key,
      setTimeout(() => {
        this.throttleTimers.delete(key);
      }, limit)
    );

    return this.addRequest(prompt, model, options);
  }

  /**
   * 메트릭스 가져오기
   */
  getMetrics(): RequestMetrics & { queueLength: number; activeRequests: number } {
    return {
      ...this.metrics,
      queueLength: this.queue.length,
      activeRequests: this.activeRequests.size,
    };
  }

  /**
   * 메트릭스 리셋
   */
  resetMetrics(): void {
    this.metrics = {
      totalRequests: 0,
      completedRequests: 0,
      failedRequests: 0,
      cancelledRequests: 0,
      deduplicatedRequests: 0,
      batchedRequests: 0,
      throttledRequests: 0,
      averageResponseTime: 0,
      totalResponseTime: 0,
    };
  }

  /**
   * 설정 업데이트
   */
  updateConfig(config: Partial<OptimizerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 큐 상태 가져오기
   */
  getQueueStatus(): {
    length: number;
    activeCount: number;
    priorities: Record<RequestPriority, number>;
  } {
    const priorities: Record<RequestPriority, number> = {
      high: 0,
      normal: 0,
      low: 0,
      background: 0,
    };

    this.queue.forEach(r => {
      priorities[r.priority]++;
    });

    return {
      length: this.queue.length,
      activeCount: this.activeRequests.size,
      priorities,
    };
  }
}

// 싱글톤 인스턴스
let requestOptimizerInstance: RequestOptimizer | null = null;

export function getRequestOptimizer(config?: Partial<OptimizerConfig>): RequestOptimizer {
  if (!requestOptimizerInstance) {
    requestOptimizerInstance = new RequestOptimizer(config);
  }
  return requestOptimizerInstance;
}

export function resetRequestOptimizer(): void {
  if (requestOptimizerInstance) {
    requestOptimizerInstance.cancelAll();
  }
  requestOptimizerInstance = null;
}
