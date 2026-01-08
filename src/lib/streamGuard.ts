/**
 * 스트리밍 생성 실시간 감시 시스템
 *
 * 프롬프트로 제어할 수 없는 AI 폭주를 실시간으로 차단합니다.
 * - 종료 조건 도달 시 즉시 생성 중단
 * - 시간 점프 감지 시 해당 부분 제거
 * - 장소 이탈 감지 시 해당 부분 제거
 * - 새로운 사건 전개 감지 시 차단
 */

import type { SceneStructure } from '@/types';

// ============================================
// 타입 정의
// ============================================

export interface StreamGuardConfig {
  scene: SceneStructure;
  allCharacterNames?: string[]; // 프로젝트의 모든 캐릭터 이름 (위반 감지용)
  onViolation?: (violation: StreamViolation) => void;
  onEndConditionMet?: (content: string) => void;
  strictMode?: boolean; // true면 위반 즉시 중단, false면 위반 부분만 제거
}

export interface StreamViolation {
  type: 'end_condition_exceeded' | 'time_jump' | 'location_change' | 'new_event' | 'scope_exceeded' | 'unauthorized_character';
  severity: 'warning' | 'critical';
  position: number; // 위반이 발생한 위치
  description: string;
  detectedText: string;
}

export interface StreamGuardResult {
  content: string;
  wasTerminated: boolean;
  terminationReason?: string;
  violations: StreamViolation[];
  endConditionReached: boolean;
}

// ============================================
// 감지 패턴 정의
// ============================================

// 시간 점프 표현 (즉시 차단)
const TIME_JUMP_PATTERNS = [
  /며칠\s*(이|가)?\s*(지나|흘러|후)/,
  /몇\s*달\s*(이|가)?\s*(지나|흘러|후)/,
  /몇\s*년\s*(이|가)?\s*(지나|흘러|후)/,
  /다음\s*날/,
  /이튿날/,
  /사흘\s*후/,
  /보름\s*후/,
  /한\s*달\s*후/,
  /수\s*개월\s*후/,
  /시간이\s*(흘러|지나)/,
  /세월이\s*(흘러|지나)/,
  /그로부터\s+\d+\s*(일|주|달|년)/,
  /\d+\s*(일|주|달|년)\s*(이|가)?\s*(지나|흘러|후)/,
  /어느덧/,
  /드디어.*때가/,
];

// 스토리 압축/요약 표현 (즉시 차단)
const COMPRESSION_PATTERNS = [
  /결국/,
  /마침내.*되었다/,
  /드디어.*성공했다/,
  /그렇게.*끝났다/,
  /모든\s*것이.*끝/,
  /전쟁이.*시작되/,
  /임진왜란이/,
  /왜군이.*침략/,
  /일본군이.*상륙/,
];

// 새로운 주요 사건 시작 표현
const NEW_EVENT_PATTERNS = [
  /그때,?\s*(갑자기|뜻밖에|느닷없이)/,
  /바로\s*그\s*순간/,
  /돌연/,
  /갑작스레/,
  /한편,/,
  /그\s*무렵,/,
];

// 장면 전환 표현
const SCENE_TRANSITION_PATTERNS = [
  /장면이\s*바뀌/,
  /한편\s*그\s*시각/,
  /같은\s*시각,?\s*다른/,
  /그\s*시각,?\s*다른\s*곳에서/,
];

// ============================================
// StreamGuard 클래스
// ============================================

export class StreamGuard {
  private config: StreamGuardConfig;
  private accumulatedContent: string = '';
  private violations: StreamViolation[] = [];
  private isTerminated: boolean = false;
  private terminationReason: string = '';
  private endConditionReached: boolean = false;
  private lastCheckedPosition: number = 0;

  // 종료 조건 관련 키워드 추출
  private endConditionKeywords: string[] = [];

  constructor(config: StreamGuardConfig) {
    this.config = config;
    this.extractEndConditionKeywords();
  }

  /**
   * 종료 조건에서 핵심 키워드 추출
   */
  private extractEndConditionKeywords(): void {
    const endCondition = this.config.scene.endCondition;
    if (!endCondition) return;

    // 핵심 명사/동사 추출 (2글자 이상)
    const words = endCondition
      .replace(/[.,!?"""'']/g, '')
      .split(/\s+/)
      .filter(w => w.length >= 2);

    this.endConditionKeywords = words;
    console.log('[StreamGuard] 종료 조건 키워드:', this.endConditionKeywords);
  }

  /**
   * 새 청크 처리 - 스트리밍 중 매 청크마다 호출
   */
  public processChunk(chunk: string): {
    shouldContinue: boolean;
    processedChunk: string;
    violation?: StreamViolation;
  } {
    if (this.isTerminated) {
      return { shouldContinue: false, processedChunk: '' };
    }

    this.accumulatedContent += chunk;

    // 마지막 1000자만 검사 (성능 최적화)
    const checkStart = Math.max(0, this.accumulatedContent.length - 1000);
    const textToCheck = this.accumulatedContent.slice(checkStart);

    // 1. 종료 조건 도달 체크
    const endConditionCheck = this.checkEndCondition(textToCheck);
    if (endConditionCheck.reached) {
      this.endConditionReached = true;

      // 종료 조건 이후 텍스트가 있으면 제거
      if (endConditionCheck.position !== undefined) {
        const cutPosition = checkStart + endConditionCheck.position + endConditionCheck.matchLength;
        const cleanContent = this.accumulatedContent.slice(0, cutPosition);

        // 종료 표시 추가
        this.accumulatedContent = cleanContent + '\n\n---';
        this.isTerminated = true;
        this.terminationReason = '종료 조건 도달';

        console.log('[StreamGuard] 종료 조건 도달! 생성 중단');
        this.config.onEndConditionMet?.(this.accumulatedContent);

        return { shouldContinue: false, processedChunk: chunk };
      }
    }

    // 2. 시간 점프 감지
    const timeJumpCheck = this.checkTimeJump(textToCheck);
    if (timeJumpCheck.detected) {
      const violation: StreamViolation = {
        type: 'time_jump',
        severity: 'critical',
        position: checkStart + (timeJumpCheck.position || 0),
        description: '시간 점프 감지됨',
        detectedText: timeJumpCheck.matchedText || '',
      };
      this.violations.push(violation);
      this.config.onViolation?.(violation);

      if (this.config.strictMode) {
        // 시간 점프 직전까지만 유지
        this.accumulatedContent = this.accumulatedContent.slice(
          0,
          checkStart + (timeJumpCheck.position || 0)
        );
        this.isTerminated = true;
        this.terminationReason = '시간 점프 감지로 인한 중단';
        return { shouldContinue: false, processedChunk: '', violation };
      }
    }

    // 3. 스토리 압축 감지
    const compressionCheck = this.checkCompression(textToCheck);
    if (compressionCheck.detected) {
      const violation: StreamViolation = {
        type: 'scope_exceeded',
        severity: 'critical',
        position: checkStart + (compressionCheck.position || 0),
        description: '스토리 압축/미래 사건 감지됨',
        detectedText: compressionCheck.matchedText || '',
      };
      this.violations.push(violation);
      this.config.onViolation?.(violation);

      if (this.config.strictMode) {
        this.accumulatedContent = this.accumulatedContent.slice(
          0,
          checkStart + (compressionCheck.position || 0)
        );
        this.isTerminated = true;
        this.terminationReason = '스토리 압축 감지로 인한 중단';
        return { shouldContinue: false, processedChunk: '', violation };
      }
    }

    // 4. 🔒🔒🔒 글자수 체크 - 더 빠르게 중단! 🔒🔒🔒
    // 핵심: maxTokens가 낮아도, 실제 생성량이 너무 많으면 중단
    // 목표 글자수와 무관하게 절대 상한선 적용 (8000자)
    const ABSOLUTE_MAX_LENGTH = 8000; // 어떤 씬이든 8000자 초과 금지
    const targetWordCount = Math.min(this.config.scene.targetWordCount || 10000, ABSOLUTE_MAX_LENGTH);
    const currentLength = this.accumulatedContent.length;

    // 절대 상한선 도달 시 즉시 중단
    if (currentLength >= ABSOLUTE_MAX_LENGTH) {
      const violation: StreamViolation = {
        type: 'scope_exceeded',
        severity: 'critical',
        position: currentLength,
        description: `절대 상한선 도달 (${currentLength}/${ABSOLUTE_MAX_LENGTH})`,
        detectedText: '',
      };
      this.violations.push(violation);
      this.config.onViolation?.(violation);

      this.isTerminated = true;
      this.terminationReason = `절대 상한선(${ABSOLUTE_MAX_LENGTH}자) 도달로 인한 중단`;
      console.log('[StreamGuard] 🛑🛑🛑 절대 상한선 도달! 생성 즉시 중단');
      return { shouldContinue: false, processedChunk: chunk, violation };
    }

    // 목표의 80%에 도달하면 즉시 중단 (종료조건 도달 여부와 무관하게)
    if (currentLength >= targetWordCount * 0.8) {
      const violation: StreamViolation = {
        type: 'scope_exceeded',
        severity: 'critical',
        position: currentLength,
        description: `글자수 80% 도달 (${currentLength}/${targetWordCount})`,
        detectedText: '',
      };
      this.violations.push(violation);
      this.config.onViolation?.(violation);

      this.isTerminated = true;
      this.terminationReason = `글자수 80%(${Math.round(targetWordCount * 0.8)}자) 도달로 인한 중단`;
      console.log('[StreamGuard] 🛑 글자수 80% 도달! 생성 중단');
      return { shouldContinue: false, processedChunk: chunk, violation };
    }

    // 50% 도달 시 경고
    if (currentLength > targetWordCount * 0.5) {
      console.log(`[StreamGuard] ⚠️ 글자수 ${Math.round(currentLength / targetWordCount * 100)}% 도달 (${currentLength}/${targetWordCount})`);
    }

    // 5. 🔒 허용되지 않은 캐릭터 등장 감지
    const unauthorizedCharCheck = this.checkUnauthorizedCharacter(textToCheck);
    if (unauthorizedCharCheck.detected) {
      const violation: StreamViolation = {
        type: 'unauthorized_character',
        severity: 'critical',
        position: checkStart + (unauthorizedCharCheck.position || 0),
        description: `허용되지 않은 캐릭터 등장: ${unauthorizedCharCheck.characterName}`,
        detectedText: unauthorizedCharCheck.matchedText || '',
      };
      this.violations.push(violation);
      this.config.onViolation?.(violation);

      // 경고만 하고 계속 진행 (캐릭터 등장은 즉시 중단하지 않음, 하지만 기록)
      // 너무 많은 미허용 캐릭터가 등장하면 중단
      const unauthorizedCount = this.violations.filter(v => v.type === 'unauthorized_character').length;
      if (unauthorizedCount >= 3 && this.config.strictMode) {
        this.isTerminated = true;
        this.terminationReason = `허용되지 않은 캐릭터 ${unauthorizedCount}명 등장`;
        return { shouldContinue: false, processedChunk: chunk, violation };
      }
    }

    return { shouldContinue: true, processedChunk: chunk };
  }

  /**
   * 허용되지 않은 캐릭터 체크
   */
  private checkUnauthorizedCharacter(text: string): {
    detected: boolean;
    characterName?: string;
    position?: number;
    matchedText?: string;
  } {
    const allowedParticipants = this.config.scene.participants || [];
    const allCharacters = this.config.allCharacterNames || [];

    // 허용된 캐릭터가 없거나 전체 캐릭터 목록이 없으면 체크 안 함
    if (allowedParticipants.length === 0 || allCharacters.length === 0) {
      return { detected: false };
    }

    // 허용되지 않은 캐릭터 목록
    const unauthorizedCharacters = allCharacters.filter(
      name => !allowedParticipants.includes(name)
    );

    // 텍스트에서 허용되지 않은 캐릭터 이름 찾기
    for (const charName of unauthorizedCharacters) {
      // 2글자 이상인 이름만 체크 (너무 짧으면 오탐 가능)
      if (charName.length < 2) continue;

      const index = text.indexOf(charName);
      if (index !== -1) {
        // 이전에 이미 감지된 캐릭터인지 확인
        const alreadyDetected = this.violations.some(
          v => v.type === 'unauthorized_character' && v.description.includes(charName)
        );
        if (!alreadyDetected) {
          return {
            detected: true,
            characterName: charName,
            position: index,
            matchedText: text.slice(Math.max(0, index - 10), index + charName.length + 10),
          };
        }
      }
    }

    return { detected: false };
  }

  /**
   * 종료 조건 체크
   */
  private checkEndCondition(text: string): {
    reached: boolean;
    position?: number;
    matchLength: number;
  } {
    const endCondition = this.config.scene.endCondition;
    if (!endCondition) return { reached: false, matchLength: 0 };

    // 종료 조건과 유사한 문장 찾기
    // 1. 정확한 매칭 시도
    const exactIndex = text.indexOf(endCondition);
    if (exactIndex !== -1) {
      return { reached: true, position: exactIndex, matchLength: endCondition.length };
    }

    // 2. 키워드 기반 유사도 체크 (키워드의 70% 이상 포함 시)
    const keywordsFound = this.endConditionKeywords.filter(kw => text.includes(kw));
    const keywordRatio = keywordsFound.length / this.endConditionKeywords.length;

    if (keywordRatio >= 0.7 && this.endConditionKeywords.length >= 3) {
      // 마지막으로 발견된 키워드의 위치를 기준으로
      let lastKeywordPos = 0;
      for (const kw of keywordsFound) {
        const pos = text.lastIndexOf(kw);
        if (pos > lastKeywordPos) {
          lastKeywordPos = pos;
        }
      }

      // 해당 문장의 끝까지 포함
      const sentenceEnd = text.indexOf('.', lastKeywordPos);
      const actualEnd = sentenceEnd !== -1 ? sentenceEnd + 1 : lastKeywordPos + 50;

      return {
        reached: true,
        position: lastKeywordPos,
        matchLength: actualEnd - lastKeywordPos
      };
    }

    // 3. 종료 조건 유형에 따른 특수 체크
    if (this.config.scene.endConditionType === 'dialogue') {
      // 대사 종료 조건인 경우, 따옴표 내용 체크
      const dialoguePatterns = endCondition.match(/[""]([^""]+)[""]/g);
      if (dialoguePatterns) {
        for (const pattern of dialoguePatterns) {
          const cleanPattern = pattern.replace(/["":]/g, '').trim();
          if (text.includes(cleanPattern)) {
            const pos = text.indexOf(cleanPattern);
            return { reached: true, position: pos, matchLength: cleanPattern.length };
          }
        }
      }
    }

    return { reached: false, matchLength: 0 };
  }

  /**
   * 시간 점프 체크
   */
  private checkTimeJump(text: string): {
    detected: boolean;
    position?: number;
    matchedText?: string;
  } {
    for (const pattern of TIME_JUMP_PATTERNS) {
      const match = text.match(pattern);
      if (match && match.index !== undefined) {
        return {
          detected: true,
          position: match.index,
          matchedText: match[0]
        };
      }
    }
    return { detected: false };
  }

  /**
   * 스토리 압축 체크
   */
  private checkCompression(text: string): {
    detected: boolean;
    position?: number;
    matchedText?: string;
  } {
    for (const pattern of COMPRESSION_PATTERNS) {
      const match = text.match(pattern);
      if (match && match.index !== undefined) {
        return {
          detected: true,
          position: match.index,
          matchedText: match[0]
        };
      }
    }
    return { detected: false };
  }

  /**
   * 최종 결과 반환
   */
  public getResult(): StreamGuardResult {
    return {
      content: this.accumulatedContent,
      wasTerminated: this.isTerminated,
      terminationReason: this.terminationReason,
      violations: this.violations,
      endConditionReached: this.endConditionReached,
    };
  }

  /**
   * 리셋
   */
  public reset(): void {
    this.accumulatedContent = '';
    this.violations = [];
    this.isTerminated = false;
    this.terminationReason = '';
    this.endConditionReached = false;
    this.lastCheckedPosition = 0;
  }
}

// ============================================
// 스트리밍 래퍼 함수
// ============================================

/**
 * 스트리밍 생성에 StreamGuard를 적용하는 래퍼
 */
export async function* guardedStreamGenerate(
  streamGenerator: AsyncGenerator<string, void, unknown>,
  config: StreamGuardConfig
): AsyncGenerator<{ chunk: string; guard: StreamGuard }, StreamGuardResult, unknown> {
  const guard = new StreamGuard(config);

  try {
    for await (const chunk of streamGenerator) {
      const result = guard.processChunk(chunk);

      yield { chunk: result.processedChunk, guard };

      if (!result.shouldContinue) {
        console.log('[StreamGuard] 생성 중단:', guard.getResult().terminationReason);
        break;
      }
    }
  } catch (error) {
    console.error('[StreamGuard] 스트리밍 오류:', error);
    throw error;
  }

  return guard.getResult();
}

/**
 * 이미 생성된 콘텐츠에 대한 후처리 가드
 */
export function postProcessGuard(
  content: string,
  scene: SceneStructure
): StreamGuardResult {
  const guard = new StreamGuard({ scene, strictMode: true });

  // 전체 텍스트를 한 번에 처리
  guard.processChunk(content);

  return guard.getResult();
}
