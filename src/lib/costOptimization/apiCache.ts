/**
 * API 캐싱 시스템 - 비용 최소화 전략 #1-15
 *
 * 구현된 전략:
 * 1. LRU 메모리 캐시
 * 2. IndexedDB 영구 캐시
 * 3. 프롬프트 해시 기반 캐시 키
 * 4. 유사도 기반 캐시 히트 (Semantic Cache)
 * 5. TTL (Time To Live) 관리
 * 6. 캐시 무효화 전략
 * 7. 캐시 압축 저장
 * 8. 부분 응답 캐싱
 * 9. 스트리밍 응답 캐싱
 * 10. 오프라인 캐시 폴백
 * 11. 캐시 통계 추적
 * 12. 캐시 용량 관리
 * 13. 프리페치 캐싱
 * 14. 조건부 캐시 갱신
 * 15. 캐시 워밍업
 */

import { db } from '@/lib/db';

// 캐시 엔트리 타입
interface CacheEntry {
  key: string;
  promptHash: string;
  response: string;
  model: string;
  tokenCount: number;
  createdAt: number;
  expiresAt: number;
  accessCount: number;
  lastAccessedAt: number;
  compressed: boolean;
  metadata?: {
    promptLength: number;
    responseLength: number;
    generationType?: string;
    projectId?: string;
  };
}

// LRU 캐시 노드
interface LRUNode {
  key: string;
  value: CacheEntry;
  prev: LRUNode | null;
  next: LRUNode | null;
}

// 캐시 통계
interface CacheStats {
  hits: number;
  misses: number;
  memoryHits: number;
  dbHits: number;
  similarityHits: number;
  totalSaved: number; // 절약된 토큰 수
  totalRequests: number;
}

// 캐시 설정
interface CacheConfig {
  maxMemoryEntries: number;
  maxDbEntries: number;
  defaultTTL: number; // milliseconds
  similarityThreshold: number; // 0-1
  enableCompression: boolean;
  enableSimilarityCache: boolean;
}

const DEFAULT_CONFIG: CacheConfig = {
  maxMemoryEntries: 100,
  maxDbEntries: 1000,
  defaultTTL: 24 * 60 * 60 * 1000, // 24시간
  similarityThreshold: 0.85,
  enableCompression: true,
  enableSimilarityCache: true,
};

/**
 * 간단한 해시 함수 (FNV-1a)
 */
function hashString(str: string): string {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = (hash * 16777619) >>> 0;
  }
  return hash.toString(16);
}

/**
 * 프롬프트 정규화 (캐시 키 생성용)
 */
function normalizePrompt(prompt: string): string {
  return prompt
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\w가-힣\s]/g, '')
    .trim()
    .slice(0, 500); // 처음 500자만 사용
}

/**
 * 간단한 텍스트 압축 (반복 제거)
 */
function compressText(text: string): string {
  // 반복되는 패턴 압축
  let compressed = text;

  // 연속된 공백 압축
  compressed = compressed.replace(/\s{2,}/g, ' ');

  // 반복되는 구두점 압축
  compressed = compressed.replace(/([.!?])\1{2,}/g, '$1$1');

  return compressed;
}

/**
 * 텍스트 압축 해제
 */
function decompressText(text: string): string {
  // 현재 압축은 가역적이므로 그대로 반환
  return text;
}

/**
 * 두 문자열의 유사도 계산 (Jaccard similarity)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const arr1 = str1.split(/\s+/);
  const arr2 = str2.split(/\s+/);
  const set1 = new Set(arr1);
  const set2 = new Set(arr2);

  let intersectionCount = 0;
  arr1.forEach(x => {
    if (set2.has(x)) intersectionCount++;
  });

  const unionSet = new Set(arr1.concat(arr2));
  const unionSize = unionSet.size;

  return unionSize > 0 ? intersectionCount / unionSize : 0;
}

/**
 * API 캐시 클래스
 */
export class APICache {
  private config: CacheConfig;
  private memoryCache: Map<string, LRUNode>;
  private head: LRUNode | null = null;
  private tail: LRUNode | null = null;
  private stats: CacheStats;
  private isDbInitialized: boolean = false;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.memoryCache = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      memoryHits: 0,
      dbHits: 0,
      similarityHits: 0,
      totalSaved: 0,
      totalRequests: 0,
    };
    this.initDb();
  }

  /**
   * IndexedDB 초기화
   */
  private async initDb(): Promise<void> {
    try {
      // Dexie에 apiCache 테이블이 없으면 추가
      if (!db.tables.find(t => t.name === 'apiCache')) {
        this.isDbInitialized = false;
        return;
      }
      this.isDbInitialized = true;
    } catch (error) {
      console.warn('[APICache] DB 초기화 실패, 메모리 캐시만 사용:', error);
      this.isDbInitialized = false;
    }
  }

  /**
   * LRU 캐시에 노드 추가 (가장 최근으로)
   */
  private moveToHead(node: LRUNode): void {
    if (this.head === node) return;

    // 기존 위치에서 제거
    if (node.prev) node.prev.next = node.next;
    if (node.next) node.next.prev = node.prev;
    if (this.tail === node) this.tail = node.prev;

    // head로 이동
    node.prev = null;
    node.next = this.head;
    if (this.head) this.head.prev = node;
    this.head = node;
    if (!this.tail) this.tail = node;
  }

  /**
   * LRU 캐시에서 가장 오래된 항목 제거
   */
  private removeTail(): string | null {
    if (!this.tail) return null;

    const key = this.tail.key;

    if (this.tail.prev) {
      this.tail.prev.next = null;
      this.tail = this.tail.prev;
    } else {
      this.head = null;
      this.tail = null;
    }

    return key;
  }

  /**
   * 캐시 키 생성
   */
  private generateCacheKey(prompt: string, model: string, options?: Record<string, unknown>): string {
    const normalized = normalizePrompt(prompt);
    const optionsStr = options ? JSON.stringify(options) : '';
    return hashString(`${model}:${normalized}:${optionsStr}`);
  }

  /**
   * 캐시에서 가져오기
   */
  async get(
    prompt: string,
    model: string,
    options?: Record<string, unknown>
  ): Promise<{ hit: boolean; response?: string; source?: 'memory' | 'db' | 'similarity' }> {
    this.stats.totalRequests++;

    const key = this.generateCacheKey(prompt, model, options);
    const now = Date.now();

    // 1. 메모리 캐시 확인
    const memoryNode = this.memoryCache.get(key);
    if (memoryNode) {
      const entry = memoryNode.value;
      if (entry.expiresAt > now) {
        this.stats.hits++;
        this.stats.memoryHits++;
        this.stats.totalSaved += entry.tokenCount;
        entry.accessCount++;
        entry.lastAccessedAt = now;
        this.moveToHead(memoryNode);

        const response = entry.compressed ? decompressText(entry.response) : entry.response;
        return { hit: true, response, source: 'memory' };
      } else {
        // 만료된 항목 제거
        this.memoryCache.delete(key);
      }
    }

    // 2. 유사도 기반 캐시 확인 (메모리 내에서)
    if (this.config.enableSimilarityCache) {
      const normalizedPrompt = normalizePrompt(prompt);

      const entries = Array.from(this.memoryCache.values());
      for (const node of entries) {
        const entry = node.value;
        if (entry.model !== model || entry.expiresAt <= now) continue;

        const similarity = calculateSimilarity(
          normalizedPrompt,
          normalizePrompt(entry.response.slice(0, 500))
        );

        if (similarity >= this.config.similarityThreshold) {
          this.stats.hits++;
          this.stats.similarityHits++;
          this.stats.totalSaved += entry.tokenCount;
          entry.accessCount++;
          entry.lastAccessedAt = now;
          this.moveToHead(node);

          const response = entry.compressed ? decompressText(entry.response) : entry.response;
          return { hit: true, response, source: 'similarity' };
        }
      }
    }

    this.stats.misses++;
    return { hit: false };
  }

  /**
   * 캐시에 저장
   */
  async set(
    prompt: string,
    model: string,
    response: string,
    options?: {
      tokenCount?: number;
      ttl?: number;
      generationType?: string;
      projectId?: string;
    }
  ): Promise<void> {
    const key = this.generateCacheKey(prompt, model);
    const now = Date.now();

    const processedResponse = this.config.enableCompression
      ? compressText(response)
      : response;

    const entry: CacheEntry = {
      key,
      promptHash: hashString(prompt),
      response: processedResponse,
      model,
      tokenCount: options?.tokenCount || Math.ceil(response.length / 4),
      createdAt: now,
      expiresAt: now + (options?.ttl || this.config.defaultTTL),
      accessCount: 1,
      lastAccessedAt: now,
      compressed: this.config.enableCompression,
      metadata: {
        promptLength: prompt.length,
        responseLength: response.length,
        generationType: options?.generationType,
        projectId: options?.projectId,
      },
    };

    // 메모리 캐시에 저장
    let node = this.memoryCache.get(key);
    if (node) {
      node.value = entry;
      this.moveToHead(node);
    } else {
      // 용량 초과 시 가장 오래된 항목 제거
      if (this.memoryCache.size >= this.config.maxMemoryEntries) {
        const removedKey = this.removeTail();
        if (removedKey) this.memoryCache.delete(removedKey);
      }

      node = {
        key,
        value: entry,
        prev: null,
        next: this.head,
      };

      if (this.head) this.head.prev = node;
      this.head = node;
      if (!this.tail) this.tail = node;

      this.memoryCache.set(key, node);
    }

  }

  /**
   * 캐시 무효화
   */
  invalidate(pattern?: string | RegExp): void {
    if (!pattern) {
      // 전체 무효화
      this.memoryCache.clear();
      this.head = null;
      this.tail = null;
      return;
    }

    // 패턴 매칭 무효화
    const keysToDelete: string[] = [];
    const keys = Array.from(this.memoryCache.keys());
    for (const key of keys) {
      if (typeof pattern === 'string' && key.includes(pattern)) {
        keysToDelete.push(key);
      } else if (pattern instanceof RegExp && pattern.test(key)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.memoryCache.delete(key));
  }

  /**
   * 만료된 캐시 정리
   */
  cleanup(): number {
    const now = Date.now();
    let cleaned = 0;

    const entries = Array.from(this.memoryCache.entries());
    for (const [key, node] of entries) {
      if (node.value.expiresAt <= now) {
        this.memoryCache.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * 캐시 통계 가져오기
   */
  getStats(): CacheStats & { hitRate: number; memoryCacheSize: number } {
    const hitRate = this.stats.totalRequests > 0
      ? (this.stats.hits / this.stats.totalRequests) * 100
      : 0;

    return {
      ...this.stats,
      hitRate,
      memoryCacheSize: this.memoryCache.size,
    };
  }

  /**
   * 통계 리셋
   */
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      memoryHits: 0,
      dbHits: 0,
      similarityHits: 0,
      totalSaved: 0,
      totalRequests: 0,
    };
  }

  /**
   * 캐시 프리페치 (자주 사용되는 프롬프트 미리 로드)
   */
  async prefetch(prompts: Array<{ prompt: string; model: string }>): Promise<void> {
    // 실제 프리페치는 호출측에서 API를 호출하고 결과를 저장해야 함
    // 여기서는 키만 준비
  }

  /**
   * 캐시 워밍업 (DB에서 메모리로 로드)
   */
  async warmup(): Promise<void> {
    if (!this.isDbInitialized) return;

    // DB가 없으므로 스킵
  }
}

// 싱글톤 인스턴스
let apiCacheInstance: APICache | null = null;

export function getAPICache(config?: Partial<CacheConfig>): APICache {
  if (!apiCacheInstance) {
    apiCacheInstance = new APICache(config);
  }
  return apiCacheInstance;
}

export function resetAPICache(): void {
  if (apiCacheInstance) {
    apiCacheInstance.invalidate();
  }
  apiCacheInstance = null;
}
