/**
 * 씬 설정 강제 검증 시스템 v1.0
 *
 * AI가 생성한 콘텐츠가 씬 설정을 정확히 지키는지 검증합니다.
 * - 시작 조건 검증
 * - 종료 조건 검증 (가장 중요!)
 * - 필수 포함 내용(mustInclude) 검증
 * - 장소/시간/인물 범위 검증
 * - 시간 점프 감지
 * - 씬 범위 이탈 감지
 *
 * 이 검증을 통과하지 못하면 생성 결과를 거부합니다.
 */

import type { SceneStructure } from '@/types';

// ============================================
// 검증 결과 타입
// ============================================

export interface SceneValidationResult {
  isValid: boolean;
  score: number; // 0-100, 80 이상이면 유효
  violations: SceneViolation[];
  warnings: SceneWarning[];
  suggestions: string[];

  // 세부 검증 결과
  startConditionCheck: ValidationCheck;
  endConditionCheck: ValidationCheck;
  mustIncludeCheck: MustIncludeCheck;
  scopeCheck: ScopeCheck;
  timeJumpCheck: TimeJumpCheck;
}

export interface ValidationCheck {
  passed: boolean;
  found: boolean;
  matchedText?: string;
  similarity?: number;
  reason?: string;
}

export interface MustIncludeCheck {
  passed: boolean;
  totalItems: number;
  foundItems: number;
  missingItems: string[];
  foundDetails: { item: string; foundInText: string }[];
}

export interface ScopeCheck {
  passed: boolean;
  locationValid: boolean;
  timeframeValid: boolean;
  participantsValid: boolean;
  unexpectedLocations: string[];
  unexpectedCharacters: string[];
  unexpectedTimeframes: string[];
}

export interface TimeJumpCheck {
  passed: boolean;
  jumpCount: number;
  jumpExpressions: { expression: string; severity: 'low' | 'medium' | 'high' }[];
}

export interface SceneViolation {
  type: 'end_condition_missing' | 'end_condition_exceeded' | 'must_include_missing' |
        'scope_violation' | 'time_jump' | 'start_condition_missing' |
        'wrong_location' | 'wrong_character' | 'wrong_timeframe';
  severity: 'critical' | 'major' | 'minor';
  description: string;
  suggestion: string;
}

export interface SceneWarning {
  type: 'weak_end_condition' | 'partial_must_include' | 'minor_time_reference' |
        'ambiguous_location' | 'extra_content_after_end';
  description: string;
  suggestion: string;
}

// ============================================
// 메인 검증 함수
// ============================================

export function validateSceneContent(
  content: string,
  sceneConfig: SceneStructure
): SceneValidationResult {
  const violations: SceneViolation[] = [];
  const warnings: SceneWarning[] = [];
  const suggestions: string[] = [];

  // 1. 시작 조건 검증
  const startConditionCheck = checkStartCondition(content, sceneConfig.startCondition);

  // 2. 종료 조건 검증 (가장 중요!)
  const endConditionCheck = checkEndCondition(content, sceneConfig.endCondition, sceneConfig.endConditionType);

  // 3. 필수 포함 내용 검증
  const mustIncludeCheck = checkMustInclude(content, sceneConfig.mustInclude);

  // 4. 범위 검증 (장소, 시간, 인물)
  const scopeCheck = checkScope(content, sceneConfig);

  // 5. 시간 점프 검증
  const timeJumpCheck = checkTimeJump(content);

  // ============================================
  // 위반 사항 수집
  // ============================================

  // 시작 조건 위반
  if (!startConditionCheck.passed && sceneConfig.startCondition) {
    violations.push({
      type: 'start_condition_missing',
      severity: 'major',
      description: `시작 조건이 누락되었습니다: "${sceneConfig.startCondition.slice(0, 50)}..."`,
      suggestion: '씬은 지정된 시작 조건으로 시작해야 합니다.',
    });
  }

  // 종료 조건 위반 (가장 심각!)
  if (!endConditionCheck.passed) {
    if (!endConditionCheck.found) {
      violations.push({
        type: 'end_condition_missing',
        severity: 'critical',
        description: `⛔ 종료 조건이 누락되었습니다! "${sceneConfig.endCondition.slice(0, 50)}..."`,
        suggestion: '씬은 반드시 지정된 종료 조건에서 끝나야 합니다. 다음 씬 내용을 미리 쓰지 마세요!',
      });
    }
  }

  // 종료 조건 이후 추가 내용 검사
  if (endConditionCheck.found) {
    const endIndex = findEndConditionIndex(content, sceneConfig.endCondition);
    if (endIndex !== -1) {
      const afterEnd = content.slice(endIndex + sceneConfig.endCondition.length).trim();
      // '---' 또는 빈 줄 이외의 내용이 있으면 위반
      const cleanAfterEnd = afterEnd.replace(/^-+$/, '').replace(/^\n+$/, '').trim();
      if (cleanAfterEnd.length > 50) {
        violations.push({
          type: 'end_condition_exceeded',
          severity: 'critical',
          description: `⛔ 종료 조건 이후에 ${cleanAfterEnd.length}자의 추가 내용이 있습니다!`,
          suggestion: '종료 조건 도달 시 "---"를 쓰고 즉시 멈춰야 합니다. 이후 내용은 다음 씬입니다.',
        });
      } else if (cleanAfterEnd.length > 0) {
        warnings.push({
          type: 'extra_content_after_end',
          description: `종료 조건 이후에 약간의 추가 내용(${cleanAfterEnd.length}자)이 있습니다.`,
          suggestion: '종료 조건 이후 내용을 확인하고 필요시 제거하세요.',
        });
      }
    }
  }

  // 필수 포함 내용 위반
  if (!mustIncludeCheck.passed) {
    const missingCount = mustIncludeCheck.missingItems.length;
    const severity: 'critical' | 'major' | 'minor' =
      missingCount > mustIncludeCheck.totalItems / 2 ? 'critical' :
      missingCount > 1 ? 'major' : 'minor';

    violations.push({
      type: 'must_include_missing',
      severity,
      description: `필수 포함 내용 ${missingCount}개 누락: ${mustIncludeCheck.missingItems.slice(0, 2).join(', ')}...`,
      suggestion: '씬 설정에서 정의된 모든 필수 내용을 포함해야 합니다.',
    });
  }

  // 범위 위반
  if (!scopeCheck.passed) {
    if (!scopeCheck.locationValid && scopeCheck.unexpectedLocations.length > 0) {
      violations.push({
        type: 'wrong_location',
        severity: 'major',
        description: `설정되지 않은 장소 등장: ${scopeCheck.unexpectedLocations.join(', ')}`,
        suggestion: `이 씬의 장소는 "${sceneConfig.location}"입니다. 다른 장소는 다음 씬에서 다루세요.`,
      });
    }

    if (!scopeCheck.participantsValid && scopeCheck.unexpectedCharacters.length > 0) {
      violations.push({
        type: 'wrong_character',
        severity: 'major',
        description: `설정되지 않은 인물 등장: ${scopeCheck.unexpectedCharacters.join(', ')}`,
        suggestion: `이 씬의 등장인물은 "${sceneConfig.participants.join(', ')}"입니다.`,
      });
    }
  }

  // 시간 점프 위반
  if (!timeJumpCheck.passed) {
    const highSeverityJumps = timeJumpCheck.jumpExpressions.filter(j => j.severity === 'high');
    const mediumSeverityJumps = timeJumpCheck.jumpExpressions.filter(j => j.severity === 'medium');

    if (highSeverityJumps.length > 0) {
      violations.push({
        type: 'time_jump',
        severity: 'critical',
        description: `⛔ 심각한 시간 점프 감지: "${highSeverityJumps.map(j => j.expression).join('", "')}"`,
        suggestion: '씬 내에서 시간을 점프하지 마세요. 한 장면을 디테일하게 쓰세요.',
      });
    }

    if (mediumSeverityJumps.length > 0) {
      warnings.push({
        type: 'minor_time_reference',
        description: `시간 점프 표현 감지: "${mediumSeverityJumps.map(j => j.expression).join('", "')}"`,
        suggestion: '가능하면 시간 점프 표현을 피하고 장면을 자세히 묘사하세요.',
      });
    }
  }

  // ============================================
  // 점수 계산
  // ============================================

  let score = 100;

  // Critical 위반: -30점
  const criticalCount = violations.filter(v => v.severity === 'critical').length;
  score -= criticalCount * 30;

  // Major 위반: -15점
  const majorCount = violations.filter(v => v.severity === 'major').length;
  score -= majorCount * 15;

  // Minor 위반: -5점
  const minorCount = violations.filter(v => v.severity === 'minor').length;
  score -= minorCount * 5;

  // 경고: -2점
  score -= warnings.length * 2;

  // 최소 0점
  score = Math.max(0, score);

  // ============================================
  // 제안 생성
  // ============================================

  if (!endConditionCheck.passed) {
    suggestions.push('🛑 종료 조건을 반드시 포함하세요. 종료 조건 도달 시 "---"를 쓰고 멈추세요.');
  }

  if (mustIncludeCheck.missingItems.length > 0) {
    suggestions.push(`📝 누락된 필수 내용을 추가하세요: ${mustIncludeCheck.missingItems.slice(0, 3).join(', ')}`);
  }

  if (timeJumpCheck.jumpCount > 0) {
    suggestions.push('⏰ 시간 점프 표현을 제거하고 현재 장면을 더 자세히 묘사하세요.');
  }

  if (scopeCheck.unexpectedLocations.length > 0) {
    suggestions.push(`📍 장소를 "${sceneConfig.location}"으로 제한하세요.`);
  }

  // ============================================
  // 결과 반환
  // ============================================

  return {
    isValid: score >= 80 && violations.filter(v => v.severity === 'critical').length === 0,
    score,
    violations,
    warnings,
    suggestions,
    startConditionCheck,
    endConditionCheck,
    mustIncludeCheck,
    scopeCheck,
    timeJumpCheck,
  };
}

// ============================================
// 시작 조건 검증
// ============================================

function checkStartCondition(content: string, startCondition: string): ValidationCheck {
  if (!startCondition || startCondition.trim().length === 0) {
    return { passed: true, found: true, reason: '시작 조건 없음' };
  }

  // 첫 500자 내에서 시작 조건 검색
  const firstPart = content.slice(0, 1000);

  // 정확한 매치
  if (firstPart.includes(startCondition)) {
    return { passed: true, found: true, matchedText: startCondition, similarity: 1.0 };
  }

  // 유사도 매치 (핵심 키워드)
  const keywords = extractKeywords(startCondition);
  const foundKeywords = keywords.filter(kw => firstPart.includes(kw));
  const similarity = foundKeywords.length / keywords.length;

  if (similarity >= 0.6) {
    return {
      passed: true,
      found: true,
      matchedText: foundKeywords.join(', '),
      similarity,
      reason: '유사한 시작 조건 발견',
    };
  }

  return {
    passed: false,
    found: false,
    similarity,
    reason: `시작 조건 불일치 (유사도: ${(similarity * 100).toFixed(0)}%)`,
  };
}

// ============================================
// 종료 조건 검증 (가장 중요!)
// ============================================

function checkEndCondition(
  content: string,
  endCondition: string,
  endConditionType: 'dialogue' | 'action' | 'narration' | 'scene'
): ValidationCheck {
  if (!endCondition || endCondition.trim().length === 0) {
    return { passed: false, found: false, reason: '종료 조건이 설정되지 않았습니다!' };
  }

  // 마지막 1500자 내에서 종료 조건 검색
  const lastPart = content.slice(-2000);

  // 정확한 매치
  if (lastPart.includes(endCondition)) {
    return { passed: true, found: true, matchedText: endCondition, similarity: 1.0 };
  }

  // 대사 타입인 경우 따옴표 안의 텍스트 추출하여 비교
  if (endConditionType === 'dialogue') {
    const dialogueMatch = extractDialogueMatch(lastPart, endCondition);
    if (dialogueMatch.found) {
      return { passed: true, found: true, matchedText: dialogueMatch.text, similarity: dialogueMatch.similarity };
    }
  }

  // 핵심 키워드 기반 유사도 검사
  const keywords = extractKeywords(endCondition);
  const foundKeywords = keywords.filter(kw => lastPart.includes(kw));
  const similarity = foundKeywords.length / keywords.length;

  if (similarity >= 0.7) {
    return {
      passed: true,
      found: true,
      matchedText: foundKeywords.join(', '),
      similarity,
      reason: '유사한 종료 조건 발견',
    };
  }

  // 종료 조건의 핵심 구절만 검사 (대화문의 경우)
  const corePhrase = extractCorePhrase(endCondition);
  if (corePhrase && lastPart.includes(corePhrase)) {
    return {
      passed: true,
      found: true,
      matchedText: corePhrase,
      similarity: 0.8,
      reason: '종료 조건의 핵심 구절 발견',
    };
  }

  return {
    passed: false,
    found: false,
    similarity,
    reason: `종료 조건 불일치 (유사도: ${(similarity * 100).toFixed(0)}%)`,
  };
}

function findEndConditionIndex(content: string, endCondition: string): number {
  const index = content.indexOf(endCondition);
  if (index !== -1) return index;

  // 핵심 구절로 검색
  const corePhrase = extractCorePhrase(endCondition);
  if (corePhrase) {
    return content.indexOf(corePhrase);
  }

  return -1;
}

function extractDialogueMatch(text: string, endCondition: string): { found: boolean; text?: string; similarity: number } {
  // 따옴표 안의 대사 추출
  const dialoguePattern = /"([^"]+)"/g;
  const dialogues: string[] = [];
  let match;

  while ((match = dialoguePattern.exec(text)) !== null) {
    dialogues.push(match[1]);
  }

  // 종료 조건에서 대사 부분 추출
  const endDialogueMatch = /"([^"]+)"/.exec(endCondition);
  if (!endDialogueMatch) return { found: false, similarity: 0 };

  const targetDialogue = endDialogueMatch[1];

  // 각 대사와 비교
  for (const dialogue of dialogues) {
    const similarity = calculateSimilarity(dialogue, targetDialogue);
    if (similarity >= 0.8) {
      return { found: true, text: dialogue, similarity };
    }
  }

  return { found: false, similarity: 0 };
}

// ============================================
// 필수 포함 내용 검증
// ============================================

function checkMustInclude(content: string, mustInclude: string[]): MustIncludeCheck {
  if (!mustInclude || mustInclude.length === 0) {
    return {
      passed: true,
      totalItems: 0,
      foundItems: 0,
      missingItems: [],
      foundDetails: [],
    };
  }

  const foundDetails: { item: string; foundInText: string }[] = [];
  const missingItems: string[] = [];

  for (const item of mustInclude) {
    const found = checkMustIncludeItem(content, item);
    if (found.isFound) {
      foundDetails.push({ item, foundInText: found.matchedText || '' });
    } else {
      missingItems.push(item);
    }
  }

  // 80% 이상 포함 시 통과
  const passThreshold = Math.ceil(mustInclude.length * 0.8);

  return {
    passed: foundDetails.length >= passThreshold,
    totalItems: mustInclude.length,
    foundItems: foundDetails.length,
    missingItems,
    foundDetails,
  };
}

function checkMustIncludeItem(content: string, item: string): { isFound: boolean; matchedText?: string } {
  // 정확한 매치
  if (content.includes(item)) {
    return { isFound: true, matchedText: item };
  }

  // 키워드 기반 매치
  const keywords = extractKeywords(item);
  const foundKeywords = keywords.filter(kw => content.includes(kw));

  // 70% 이상 키워드 매치 시 통과
  if (foundKeywords.length / keywords.length >= 0.7) {
    return { isFound: true, matchedText: foundKeywords.join(', ') };
  }

  return { isFound: false };
}

// ============================================
// 범위 검증 (장소, 시간, 인물)
// ============================================

function checkScope(content: string, sceneConfig: SceneStructure): ScopeCheck {
  const unexpectedLocations: string[] = [];
  const unexpectedCharacters: string[] = [];
  const unexpectedTimeframes: string[] = [];

  // 장소 검증: 다른 장소로 이동하는 패턴 감지
  const locationChangePatterns = [
    /그는 ([가-힣]+)(?:으로|로) (?:향했다|갔다|이동했다|떠났다)/g,
    /([가-힣]+)(?:에 도착했다|에 들어섰다|에 당도했다)/g,
    /장소가 ([가-힣]+)(?:으로|로) 바뀌/g,
    /([가-힣]+)(?:을|를) 떠나/g,
  ];

  for (const pattern of locationChangePatterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const foundLocation = match[1];
      // 설정된 장소와 다르면 추가
      if (!sceneConfig.location.includes(foundLocation) && !foundLocation.includes(sceneConfig.location.split(' ')[0])) {
        if (!unexpectedLocations.includes(foundLocation)) {
          unexpectedLocations.push(foundLocation);
        }
      }
    }
  }

  // 시간 프레임 검증: 설정된 시간대와 다른 시간 언급 감지
  const timeframePatterns = [
    /(다음 날|이튿날|며칠 후|몇 달 후|일주일 후)/g,
    /(그날 밤|다음 아침|저녁이 되자|아침이 밝자)/g,
  ];

  for (const pattern of timeframePatterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      unexpectedTimeframes.push(match[1]);
    }
  }

  const locationValid = unexpectedLocations.length === 0;
  const timeframeValid = unexpectedTimeframes.length === 0;
  const participantsValid = unexpectedCharacters.length === 0;

  return {
    passed: locationValid && timeframeValid && participantsValid,
    locationValid,
    timeframeValid,
    participantsValid,
    unexpectedLocations,
    unexpectedCharacters,
    unexpectedTimeframes,
  };
}

// ============================================
// 시간 점프 검증
// ============================================

function checkTimeJump(content: string): TimeJumpCheck {
  const timeJumpPatterns: { pattern: RegExp; severity: 'low' | 'medium' | 'high' }[] = [
    // 심각한 시간 점프 (high)
    { pattern: /며칠이 지나/g, severity: 'high' },
    { pattern: /몇 달이 흘러/g, severity: 'high' },
    { pattern: /시간이 흘러/g, severity: 'high' },
    { pattern: /세월이 흘러/g, severity: 'high' },
    { pattern: /그로부터 [0-9]+일/g, severity: 'high' },
    { pattern: /일주일이 지나/g, severity: 'high' },
    { pattern: /한 달이 지나/g, severity: 'high' },
    { pattern: /벌써 며칠/g, severity: 'high' },

    // 중간 수준 시간 점프 (medium)
    { pattern: /어느덧/g, severity: 'medium' },
    { pattern: /그 후로/g, severity: 'medium' },
    { pattern: /한참 후/g, severity: 'medium' },
    { pattern: /얼마 후/g, severity: 'medium' },
    { pattern: /시간이 지나/g, severity: 'medium' },
    { pattern: /마침내/g, severity: 'medium' },
    { pattern: /드디어/g, severity: 'medium' },
    { pattern: /이윽고/g, severity: 'medium' },

    // 경미한 시간 참조 (low) - 경고만
    { pattern: /다음 날/g, severity: 'low' },
    { pattern: /이튿날/g, severity: 'low' },
    { pattern: /그날 밤/g, severity: 'low' },
    { pattern: /아침이 되자/g, severity: 'low' },
    { pattern: /저녁이 되자/g, severity: 'low' },
  ];

  const jumpExpressions: { expression: string; severity: 'low' | 'medium' | 'high' }[] = [];

  for (const { pattern, severity } of timeJumpPatterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const expression = match[0];
      if (!jumpExpressions.some(j => j.expression === expression)) {
        jumpExpressions.push({ expression, severity });
      }
    }
  }

  // high 또는 medium이 하나라도 있으면 실패
  const hasSignificantJump = jumpExpressions.some(j => j.severity === 'high' || j.severity === 'medium');

  return {
    passed: !hasSignificantJump,
    jumpCount: jumpExpressions.length,
    jumpExpressions,
  };
}

// ============================================
// 유틸리티 함수
// ============================================

function extractKeywords(text: string): string[] {
  // 조사, 어미 등 제거하고 핵심 단어만 추출
  const cleaned = text
    .replace(/["""'']/g, '')
    .replace(/[,.!?]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const words = cleaned.split(' ').filter(w => w.length >= 2);

  // 불용어 제거
  const stopWords = ['이', '가', '을', '를', '에', '에서', '으로', '로', '의', '와', '과', '도', '는', '은', '다', '라고', '하며', '하고'];
  return words.filter(w => !stopWords.includes(w) && w.length >= 2);
}

function extractCorePhrase(text: string): string | null {
  // 따옴표 안의 대사 추출
  const dialogueMatch = /"([^"]{5,50})"/.exec(text);
  if (dialogueMatch) {
    return dialogueMatch[1];
  }

  // 핵심 구절 추출 (마지막 절)
  const phrases = text.split(/[,.]/).filter(p => p.trim().length > 5);
  if (phrases.length > 0) {
    return phrases[phrases.length - 1].trim();
  }

  return null;
}

function calculateSimilarity(str1: string, str2: string): number {
  const keywords1 = extractKeywords(str1);
  const keywords2 = extractKeywords(str2);

  const words1 = new Set(keywords1);
  const words2 = new Set(keywords2);

  // Array.from()을 사용하여 Set을 배열로 변환 (ES5 호환)
  const words1Array = Array.from(words1);
  const words2Array = Array.from(words2);

  const intersection = words1Array.filter(x => words2.has(x));
  const unionArray = [...words1Array, ...words2Array.filter(x => !words1.has(x))];

  if (unionArray.length === 0) return 0;
  return intersection.length / unionArray.length;
}

// ============================================
// 프롬프트에 삽입할 검증 규칙 생성
// ============================================

export function generateValidationRulesForPrompt(sceneConfig: SceneStructure): string {
  return `
═══════════════════════════════════════════════════════════════
## 🚨🚨🚨 씬 설정 강제 규칙 (위반 시 전체 생성 실패!) 🚨🚨🚨
═══════════════════════════════════════════════════════════════

### ⚠️ 이 씬의 필수 조건 (모두 충족해야 함!)

**📍 장소**: ${sceneConfig.location}
→ 이 장소에서만 이야기가 진행됩니다. 다른 장소로 이동 금지!

**⏰ 시간대**: ${sceneConfig.timeframe}
→ 이 시간대만 다룹니다. "다음 날", "며칠 후" 등 시간 점프 금지!

**👥 등장인물**: ${sceneConfig.participants.join(', ')}
→ 이 인물들만 등장합니다. 다른 인물 등장 금지!

**📏 목표 분량**: ${sceneConfig.targetWordCount.toLocaleString()}자
→ 분량이 부족해도 종료 조건 도달 시 반드시 멈춤!

### ✅ 시작 조건
"${sceneConfig.startCondition}"
→ 이 조건으로 씬을 시작하세요.

### 📝 필수 포함 내용 (mustInclude) - 모두 포함해야 함!
${sceneConfig.mustInclude.map((item, i) => `${i + 1}. ${item}`).join('\n')}
→ 위 내용을 모두 자연스럽게 포함하세요.

### 🛑🛑🛑 종료 조건 (가장 중요!!!) 🛑🛑🛑
╔══════════════════════════════════════════════════════════════╗
║  "${sceneConfig.endCondition}"                              ║
╚══════════════════════════════════════════════════════════════╝
→ 종료 유형: ${sceneConfig.endConditionType === 'dialogue' ? '대사' : sceneConfig.endConditionType === 'action' ? '행동' : '서술'}
→ ⛔ 이 조건에 도달하면 "---" 쓰고 즉시 멈춤!!!
→ ⛔ 종료 조건 이후 단 한 글자도 쓰면 안 됨!!!
→ ⛔ 다음 씬 내용을 미리 쓰면 안 됨!!!

### ❌ 절대 금지 사항
1. ❌ 종료 조건 이후 추가 내용 작성
2. ❌ 설정된 장소(${sceneConfig.location}) 외 다른 장소
3. ❌ 설정된 인물(${sceneConfig.participants.join(', ')}) 외 다른 인물
4. ❌ 시간 점프 표현 ("며칠 후", "다음 날", "시간이 흘러" 등)
5. ❌ 다음 씬에서 다룰 내용 미리 작성
6. ❌ 필수 포함 내용 누락

### 분량이 부족할 때
→ 새 사건/인물/장소 추가 금지!
→ 현재 장면의 감정, 묘사, 디테일을 더 깊게 작성!
→ 캐릭터의 내면 심리, 오감 묘사, 분위기 묘사 확장!

═══════════════════════════════════════════════════════════════
`;
}

// ============================================
// 검증 결과 포맷팅
// ============================================

export function formatValidationResult(result: SceneValidationResult): string {
  const lines: string[] = [];

  lines.push(`═══════════════════════════════════════`);
  lines.push(`📊 씬 검증 결과: ${result.isValid ? '✅ 통과' : '❌ 실패'} (점수: ${result.score}/100)`);
  lines.push(`═══════════════════════════════════════`);

  if (result.violations.length > 0) {
    lines.push('');
    lines.push('⛔ 위반 사항:');
    result.violations.forEach((v, i) => {
      const severityIcon = v.severity === 'critical' ? '🔴' : v.severity === 'major' ? '🟠' : '🟡';
      lines.push(`${i + 1}. ${severityIcon} [${v.severity}] ${v.description}`);
      lines.push(`   💡 ${v.suggestion}`);
    });
  }

  if (result.warnings.length > 0) {
    lines.push('');
    lines.push('⚠️ 경고:');
    result.warnings.forEach((w, i) => {
      lines.push(`${i + 1}. ${w.description}`);
    });
  }

  if (result.suggestions.length > 0) {
    lines.push('');
    lines.push('💡 제안:');
    result.suggestions.forEach((s, i) => {
      lines.push(`${i + 1}. ${s}`);
    });
  }

  // 세부 검증 결과
  lines.push('');
  lines.push('📋 세부 검증:');
  lines.push(`  - 시작 조건: ${result.startConditionCheck.passed ? '✓' : '✗'}`);
  lines.push(`  - 종료 조건: ${result.endConditionCheck.passed ? '✓' : '✗'} (유사도: ${((result.endConditionCheck.similarity || 0) * 100).toFixed(0)}%)`);
  lines.push(`  - 필수 내용: ${result.mustIncludeCheck.foundItems}/${result.mustIncludeCheck.totalItems} 포함`);
  lines.push(`  - 범위 검증: ${result.scopeCheck.passed ? '✓' : '✗'}`);
  lines.push(`  - 시간 점프: ${result.timeJumpCheck.passed ? '✓' : '✗'} (${result.timeJumpCheck.jumpCount}개 감지)`);

  return lines.join('\n');
}
