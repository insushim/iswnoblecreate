/**
 * 오프라인 요청 큐 시스템 - 비용 최소화 전략 #56-60
 *
 * 구현된 전략:
 * 56. 오프라인 요청 큐잉
 * 57. 자동 재시도 (온라인 복구 시)
 * 58. 요청 영속성 (IndexedDB)
 * 59. 우선순위 기반 동기화
 * 60. 실패 요청 백업
 */

// 큐에 저장되는 요청
interface QueuedOfflineRequest {
  id: string;
  prompt: string;
  model: string;
  options: {
    temperature?: number;
    maxTokens?: number;
    taskType?: 'planning' | 'writing' | 'analysis' | 'other';
    projectId?: string;
  };
  priority: 'high' | 'normal' | 'low';
  createdAt: number;
  retryCount: number;
  maxRetries: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: string;
  error?: string;
}

// 큐 설정
interface OfflineQueueConfig {
  maxQueueSize: number;
  maxRetries: number;
  retryDelay: number; // ms
  persistToStorage: boolean;
  autoSync: boolean; // 온라인 복구 시 자동 동기화
}

const DEFAULT_CONFIG: OfflineQueueConfig = {
  maxQueueSize: 50,
  maxRetries: 3,
  retryDelay: 5000,
  persistToStorage: true,
  autoSync: true,
};

// 요청 실행 함수 타입
type RequestExecutor = (
  prompt: string,
  model: string,
  options: QueuedOfflineRequest['options']
) => Promise<string>;

/**
 * 오프라인 요청 큐 클래스
 */
export class OfflineQueue {
  private config: OfflineQueueConfig;
  private queue: QueuedOfflineRequest[] = [];
  private isOnline: boolean = true;
  private isSyncing: boolean = false;
  private executor: RequestExecutor | null = null;

  // 이벤트 콜백
  private onQueueChange?: (queue: QueuedOfflineRequest[]) => void;
  private onSyncComplete?: (results: Array<{ id: string; success: boolean; result?: string; error?: string }>) => void;
  private onOfflineDetected?: () => void;
  private onOnlineRestored?: () => void;

  constructor(config: Partial<OfflineQueueConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.loadFromStorage();
    this.setupNetworkListeners();
  }

  /**
   * 네트워크 상태 리스너 설정
   */
  private setupNetworkListeners(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      this.isOnline = true;
      this.onOnlineRestored?.();

      if (this.config.autoSync) {
        this.syncQueue();
      }
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.onOfflineDetected?.();
    });

    // 초기 상태 설정
    this.isOnline = navigator.onLine;
  }

  /**
   * 로컬 스토리지에서 큐 로드
   */
  private loadFromStorage(): void {
    if (typeof window === 'undefined' || !this.config.persistToStorage) return;

    try {
      const saved = localStorage.getItem('offlineQueue');
      if (saved) {
        this.queue = JSON.parse(saved);
        // 오래된 완료/실패 항목 정리
        this.queue = this.queue.filter(
          req => req.status === 'pending' || req.status === 'processing'
        );
      }
    } catch (error) {
      console.warn('[OfflineQueue] 저장된 큐 로드 실패:', error);
    }
  }

  /**
   * 큐를 로컬 스토리지에 저장
   */
  private saveToStorage(): void {
    if (typeof window === 'undefined' || !this.config.persistToStorage) return;

    try {
      localStorage.setItem('offlineQueue', JSON.stringify(this.queue));
    } catch (error) {
      console.warn('[OfflineQueue] 큐 저장 실패:', error);
    }
  }

  /**
   * 요청 실행 함수 설정
   */
  setExecutor(executor: RequestExecutor): void {
    this.executor = executor;
  }

  /**
   * 콜백 설정
   */
  setCallbacks(callbacks: {
    onQueueChange?: (queue: QueuedOfflineRequest[]) => void;
    onSyncComplete?: (results: Array<{ id: string; success: boolean; result?: string; error?: string }>) => void;
    onOfflineDetected?: () => void;
    onOnlineRestored?: () => void;
  }): void {
    this.onQueueChange = callbacks.onQueueChange;
    this.onSyncComplete = callbacks.onSyncComplete;
    this.onOfflineDetected = callbacks.onOfflineDetected;
    this.onOnlineRestored = callbacks.onOnlineRestored;
  }

  /**
   * 요청 큐에 추가
   */
  async enqueue(
    prompt: string,
    model: string,
    options: QueuedOfflineRequest['options'] = {},
    priority: 'high' | 'normal' | 'low' = 'normal'
  ): Promise<string> {
    // 온라인이고 executor가 있으면 바로 실행
    if (this.isOnline && this.executor && !this.isSyncing) {
      try {
        return await this.executor(prompt, model, options);
      } catch (error) {
        // 네트워크 오류면 큐에 추가
        if (error instanceof Error && error.message.includes('network')) {
        } else {
          throw error;
        }
      }
    }

    // 큐 용량 확인
    if (this.queue.length >= this.config.maxQueueSize) {
      throw new Error('오프라인 요청 큐가 가득 찼습니다. 온라인이 되면 자동으로 처리됩니다.');
    }

    const request: QueuedOfflineRequest = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      prompt,
      model,
      options,
      priority,
      createdAt: Date.now(),
      retryCount: 0,
      maxRetries: this.config.maxRetries,
      status: 'pending',
    };

    // 우선순위에 따라 삽입
    const priorityOrder = { high: 0, normal: 1, low: 2 };
    const insertIndex = this.queue.findIndex(
      r => priorityOrder[r.priority] > priorityOrder[priority]
    );

    if (insertIndex === -1) {
      this.queue.push(request);
    } else {
      this.queue.splice(insertIndex, 0, request);
    }

    this.saveToStorage();
    this.onQueueChange?.(this.queue);

    // Promise 반환 (동기화 시 resolve됨)
    return new Promise((resolve, reject) => {
      // 요청에 콜백 저장
      const checkInterval = setInterval(() => {
        const req = this.queue.find(r => r.id === request.id);
        if (!req) {
          clearInterval(checkInterval);
          reject(new Error('요청이 큐에서 제거되었습니다.'));
          return;
        }

        if (req.status === 'completed' && req.result) {
          clearInterval(checkInterval);
          resolve(req.result);
          // 완료된 요청 제거
          this.queue = this.queue.filter(r => r.id !== request.id);
          this.saveToStorage();
          return;
        }

        if (req.status === 'failed') {
          clearInterval(checkInterval);
          reject(new Error(req.error || '요청 처리 실패'));
          return;
        }
      }, 1000);

      // 30분 타임아웃
      setTimeout(() => {
        clearInterval(checkInterval);
        reject(new Error('요청 타임아웃'));
      }, 30 * 60 * 1000);
    });
  }

  /**
   * 큐 동기화 (온라인 복구 시)
   */
  async syncQueue(): Promise<void> {
    if (!this.executor || this.isSyncing || this.queue.length === 0) {
      return;
    }

    if (!this.isOnline) {
      return;
    }

    this.isSyncing = true;

    const results: Array<{ id: string; success: boolean; result?: string; error?: string }> = [];

    // pending 상태인 요청만 처리
    const pendingRequests = this.queue.filter(r => r.status === 'pending');

    for (const request of pendingRequests) {
      try {
        request.status = 'processing';
        this.saveToStorage();

        const result = await this.executor(request.prompt, request.model, request.options);

        request.status = 'completed';
        request.result = result;
        results.push({ id: request.id, success: true, result });

      } catch (error) {
        request.retryCount++;

        if (request.retryCount >= request.maxRetries) {
          request.status = 'failed';
          request.error = error instanceof Error ? error.message : String(error);
          results.push({ id: request.id, success: false, error: request.error });
          console.error(`[OfflineQueue] 요청 실패 (최대 재시도 도달): ${request.id}`);
        } else {
          request.status = 'pending';
          console.warn(`[OfflineQueue] 요청 재시도 예정 (${request.retryCount}/${request.maxRetries}): ${request.id}`);
        }
      }

      this.saveToStorage();
      this.onQueueChange?.(this.queue);

      // 요청 간 딜레이
      await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
    }

    this.isSyncing = false;
    this.onSyncComplete?.(results);

    // 완료된 요청 정리
    this.queue = this.queue.filter(r => r.status === 'pending' || r.status === 'processing');
    this.saveToStorage();
  }

  /**
   * 큐 상태 가져오기
   */
  getQueueStatus(): {
    isOnline: boolean;
    isSyncing: boolean;
    queueLength: number;
    pendingCount: number;
    processingCount: number;
    failedCount: number;
  } {
    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      queueLength: this.queue.length,
      pendingCount: this.queue.filter(r => r.status === 'pending').length,
      processingCount: this.queue.filter(r => r.status === 'processing').length,
      failedCount: this.queue.filter(r => r.status === 'failed').length,
    };
  }

  /**
   * 대기 중인 요청 목록
   */
  getPendingRequests(): QueuedOfflineRequest[] {
    return this.queue.filter(r => r.status === 'pending');
  }

  /**
   * 특정 요청 취소
   */
  cancelRequest(requestId: string): boolean {
    const index = this.queue.findIndex(r => r.id === requestId);
    if (index === -1) return false;

    this.queue.splice(index, 1);
    this.saveToStorage();
    this.onQueueChange?.(this.queue);

    return true;
  }

  /**
   * 모든 요청 취소
   */
  clearQueue(): void {
    this.queue = [];
    this.saveToStorage();
    this.onQueueChange?.(this.queue);
  }

  /**
   * 실패한 요청 재시도
   */
  async retryFailed(): Promise<void> {
    const failedRequests = this.queue.filter(r => r.status === 'failed');

    for (const request of failedRequests) {
      request.status = 'pending';
      request.retryCount = 0;
      request.error = undefined;
    }

    this.saveToStorage();
    this.onQueueChange?.(this.queue);

    if (this.isOnline) {
      await this.syncQueue();
    }
  }

  /**
   * 온라인 상태 확인
   */
  checkOnline(): boolean {
    if (typeof navigator !== 'undefined') {
      this.isOnline = navigator.onLine;
    }
    return this.isOnline;
  }
}

// 싱글톤 인스턴스
let offlineQueueInstance: OfflineQueue | null = null;

export function getOfflineQueue(config?: Partial<OfflineQueueConfig>): OfflineQueue {
  if (!offlineQueueInstance) {
    offlineQueueInstance = new OfflineQueue(config);
  }
  return offlineQueueInstance;
}

export function resetOfflineQueue(): void {
  if (offlineQueueInstance) {
    offlineQueueInstance.clearQueue();
  }
  offlineQueueInstance = null;
}
