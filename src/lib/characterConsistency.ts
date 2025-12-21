/**
 * 캐릭터 일관성 관리 시스템
 * - 캐릭터 상태 추적 (생존/사망/감금 등)
 * - 일관성 위반 감지
 * - 집필 시 캐릭터 컨텍스트 제공
 */

import type {
  Character,
  CharacterStatus,
  CharacterAppearance,
  CharacterConsistencyRule,
  CharacterConsistencyCheck,
  CharacterConsistencyViolation,
  CharacterConsistencyWarning,
  CharacterKnowledge,
  CharacterConsistencyContext,
  ExtractedCharacterInfo,
} from '@/types';

// ============================================
// 캐릭터 상태 관리
// ============================================

/**
 * 캐릭터 상태 맵 생성
 */
export function createCharacterStatusMap(
  characters: Character[],
  existingStatuses?: CharacterStatus[]
): Map<string, CharacterStatus> {
  const statusMap = new Map<string, CharacterStatus>();

  // 기존 상태가 있으면 먼저 적용
  if (existingStatuses) {
    existingStatuses.forEach(status => {
      statusMap.set(status.characterId, status);
    });
  }

  // 캐릭터 목록에서 없는 캐릭터는 기본 상태로 추가
  characters.forEach(char => {
    if (!statusMap.has(char.id)) {
      statusMap.set(char.id, {
        characterId: char.id,
        characterName: char.name,
        status: 'alive',
        currentLocation: undefined,
        notes: undefined,
      });
    }
  });

  return statusMap;
}

/**
 * 캐릭터 상태 업데이트
 */
export function updateCharacterStatus(
  statusMap: Map<string, CharacterStatus>,
  characterId: string,
  newStatus: Partial<CharacterStatus>
): CharacterStatus | null {
  const currentStatus = statusMap.get(characterId);
  if (!currentStatus) return null;

  const updated: CharacterStatus = {
    ...currentStatus,
    ...newStatus,
  };

  statusMap.set(characterId, updated);
  return updated;
}

// ============================================
// 일관성 규칙 관리
// ============================================

/**
 * 사망 캐릭터 규칙 자동 생성
 */
export function createDeathRule(
  characterId: string,
  characterName: string,
  deathLocation: string,
  description?: string
): CharacterConsistencyRule {
  return {
    id: crypto.randomUUID(),
    characterId,
    characterName,
    ruleType: 'status',
    rule: `${characterName}은(는) "${deathLocation}"에서 사망함. 이후 장면에서 살아있는 모습으로 등장 불가 (회상/언급 제외)`,
    effectiveFrom: deathLocation,
    priority: 'critical',
    isActive: true,
    createdAt: new Date(),
  };
}

/**
 * 감금 캐릭터 규칙 자동 생성
 */
export function createImprisonmentRule(
  characterId: string,
  characterName: string,
  imprisonmentLocation: string,
  releaseLocation?: string
): CharacterConsistencyRule {
  return {
    id: crypto.randomUUID(),
    characterId,
    characterName,
    ruleType: 'location',
    rule: `${characterName}은(는) "${imprisonmentLocation}"에서 감금됨. ${releaseLocation ? `"${releaseLocation}"까지 다른 장소 등장 불가` : '풀려날 때까지 다른 장소 등장 불가'}`,
    effectiveFrom: imprisonmentLocation,
    effectiveUntil: releaseLocation,
    priority: 'critical',
    isActive: true,
    createdAt: new Date(),
  };
}

/**
 * 커스텀 일관성 규칙 생성
 */
export function createCustomRule(
  characterId: string,
  characterName: string,
  ruleType: CharacterConsistencyRule['ruleType'],
  rule: string,
  priority: 'critical' | 'major' | 'minor' = 'major',
  effectiveFrom?: string,
  effectiveUntil?: string
): CharacterConsistencyRule {
  return {
    id: crypto.randomUUID(),
    characterId,
    characterName,
    ruleType,
    rule,
    effectiveFrom,
    effectiveUntil,
    priority,
    isActive: true,
    createdAt: new Date(),
  };
}

// ============================================
// 일관성 검증
// ============================================

/**
 * 텍스트에서 캐릭터 등장 감지
 */
export function detectCharacterMentions(
  text: string,
  characters: Character[]
): { characterId: string; characterName: string; mentions: number; contexts: string[] }[] {
  const results: { characterId: string; characterName: string; mentions: number; contexts: string[] }[] = [];

  characters.forEach(char => {
    // 이름과 별명으로 검색
    const searchTerms = [char.name];
    if (char.fullName && char.fullName !== char.name) {
      searchTerms.push(char.fullName);
    }
    if (char.nickname) {
      searchTerms.push(...char.nickname);
    }

    let totalMentions = 0;
    const contexts: string[] = [];

    searchTerms.forEach(term => {
      const regex = new RegExp(term, 'g');
      const matches = text.match(regex);
      if (matches) {
        totalMentions += matches.length;

        // 문맥 추출 (전후 50자)
        let match;
        const termRegex = new RegExp(term, 'g');
        while ((match = termRegex.exec(text)) !== null && contexts.length < 3) {
          const start = Math.max(0, match.index - 50);
          const end = Math.min(text.length, match.index + term.length + 50);
          contexts.push(text.slice(start, end).replace(/\n/g, ' ').trim());
        }
      }
    });

    if (totalMentions > 0) {
      results.push({
        characterId: char.id,
        characterName: char.name,
        mentions: totalMentions,
        contexts,
      });
    }
  });

  return results;
}

/**
 * 사망 캐릭터 등장 검증
 */
export function checkDeadCharacterAppearance(
  text: string,
  deadCharacters: CharacterStatus[],
  characters: Character[]
): CharacterConsistencyViolation[] {
  const violations: CharacterConsistencyViolation[] = [];

  // 사망한 캐릭터 필터
  const dead = deadCharacters.filter(s => s.status === 'dead');

  dead.forEach(deadChar => {
    const char = characters.find(c => c.id === deadChar.characterId);
    if (!char) return;

    // 이름으로 검색
    const searchTerms = [char.name];
    if (char.nickname) searchTerms.push(...char.nickname);

    searchTerms.forEach(term => {
      // 대화나 행동으로 등장하는지 확인 (단순 언급/회상 제외)
      // 패턴: "이름이/가/은/는 + 동사" 또는 "이름" + 대화
      const actionPattern = new RegExp(`${term}(이|가|은|는|의)\\s*(말했|했|갔|왔|보았|들었|느꼈|생각했|웃|울|소리쳤)`, 'g');
      const dialoguePattern = new RegExp(`${term}(이|가)?\\s*["']`, 'g');

      const actionMatches = text.match(actionPattern);
      const dialogueMatches = text.match(dialoguePattern);

      if (actionMatches || dialogueMatches) {
        // 회상/과거 문맥인지 확인
        const isFlashback = checkIfFlashback(text, term);

        if (!isFlashback) {
          violations.push({
            id: crypto.randomUUID(),
            characterId: deadChar.characterId,
            characterName: char.name,
            violationType: 'dead_character_appears',
            description: `사망한 캐릭터 "${char.name}"이(가) 현재 시점에서 행동/대화하는 것으로 묘사됨`,
            severity: 'critical',
            location: {},
            suggestedFix: `"${char.name}"의 등장을 회상이나 언급으로 변경하거나, 다른 캐릭터로 대체하세요`,
            relatedRule: `${char.name}은(는) ${deadChar.statusChangedAt || '이전 장면'}에서 사망함`,
          });
        }
      }
    });
  });

  return violations;
}

/**
 * 회상/과거 문맥인지 확인
 */
function checkIfFlashback(text: string, characterName: string): boolean {
  const flashbackIndicators = [
    '회상',
    '그때',
    '예전에',
    '과거에',
    '기억 속',
    '떠올리며',
    '생각하며',
    '추억',
    '그리워하며',
    '였었다',
    '였던',
    '했었',
    '그랬었',
  ];

  // 캐릭터 이름 주변 200자에서 회상 지시어 검색
  const regex = new RegExp(characterName, 'g');
  let match;
  while ((match = regex.exec(text)) !== null) {
    const start = Math.max(0, match.index - 100);
    const end = Math.min(text.length, match.index + characterName.length + 100);
    const context = text.slice(start, end);

    for (const indicator of flashbackIndicators) {
      if (context.includes(indicator)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * 감금 캐릭터 위치 검증
 */
export function checkImprisonedCharacterLocation(
  text: string,
  imprisonedCharacters: CharacterStatus[],
  characters: Character[],
  currentLocation?: string
): CharacterConsistencyViolation[] {
  const violations: CharacterConsistencyViolation[] = [];

  const imprisoned = imprisonedCharacters.filter(s => s.status === 'imprisoned');

  imprisoned.forEach(char => {
    const character = characters.find(c => c.id === char.characterId);
    if (!character) return;

    const mentions = detectCharacterMentions(text, [character]);

    if (mentions.length > 0 && currentLocation && char.currentLocation) {
      // 감금 장소가 아닌 곳에서 활동하는지 확인
      if (currentLocation !== char.currentLocation) {
        violations.push({
          id: crypto.randomUUID(),
          characterId: char.characterId,
          characterName: character.name,
          violationType: 'wrong_location',
          description: `감금된 캐릭터 "${character.name}"이(가) 감금 장소(${char.currentLocation})가 아닌 "${currentLocation}"에서 등장함`,
          severity: 'critical',
          location: {},
          suggestedFix: `"${character.name}"을(를) 제거하거나, 장면을 감금 장소로 변경하거나, 탈출 장면을 먼저 추가하세요`,
        });
      }
    }
  });

  return violations;
}

/**
 * 종합 일관성 검증
 */
export function validateCharacterConsistency(
  text: string,
  context: CharacterConsistencyContext,
  characters: Character[],
  currentLocation?: string,
  currentVolumeNumber?: number
): CharacterConsistencyCheck {
  const violations: CharacterConsistencyViolation[] = [];
  const warnings: CharacterConsistencyWarning[] = [];
  const suggestions: string[] = [];

  // 1. 사망 캐릭터 검증
  const deadViolations = checkDeadCharacterAppearance(text, context.characters, characters);
  violations.push(...deadViolations);

  // 2. 감금 캐릭터 위치 검증
  const imprisonedViolations = checkImprisonedCharacterLocation(
    text,
    context.characters,
    characters,
    currentLocation
  );
  violations.push(...imprisonedViolations);

  // 3. 활성 규칙 검증
  context.rules
    .filter(rule => rule.isActive)
    .forEach(rule => {
      const char = characters.find(c => c.id === rule.characterId);
      if (!char) return;

      const mentions = detectCharacterMentions(text, [char]);
      if (mentions.length === 0) return;

      // 규칙 유형별 검증
      switch (rule.ruleType) {
        case 'speech':
          // 말투 일관성은 AI에게 위임 (경고만 생성)
          warnings.push({
            characterId: rule.characterId,
            characterName: char.name,
            warningType: 'potential_inconsistency',
            description: `"${char.name}"의 말투 규칙: ${rule.rule}`,
            suggestion: '대사가 캐릭터의 말투 패턴과 일치하는지 확인하세요',
          });
          break;

        case 'knowledge':
          warnings.push({
            characterId: rule.characterId,
            characterName: char.name,
            warningType: 'potential_inconsistency',
            description: `"${char.name}"의 지식 규칙: ${rule.rule}`,
            suggestion: '캐릭터가 알지 못해야 할 정보를 언급하지 않는지 확인하세요',
          });
          break;
      }
    });

  // 4. 오랜 부재 캐릭터 경고
  const mentionedCharacters = detectCharacterMentions(text, characters);
  const mentionedIds = new Set(mentionedCharacters.map(m => m.characterId));

  // 주요 캐릭터가 등장하지 않으면 경고
  characters
    .filter(c => c.role === 'protagonist' || c.role === 'deuteragonist')
    .forEach(char => {
      if (!mentionedIds.has(char.id)) {
        const lastAppearance = context.appearances
          .filter(a => a.characterId === char.id)
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];

        if (lastAppearance) {
          warnings.push({
            characterId: char.id,
            characterName: char.name,
            warningType: 'long_absence',
            description: `주요 캐릭터 "${char.name}"이(가) 현재 장면에 등장하지 않음`,
            suggestion: '의도적인 부재인지 확인하세요',
          });
        }
      }
    });

  // 제안 생성
  if (violations.length > 0) {
    suggestions.push('일관성 위반을 수정한 후 다시 검증하세요');
  }

  if (warnings.length > 0) {
    suggestions.push('경고 사항을 확인하고 필요시 수정하세요');
  }

  return {
    isConsistent: violations.length === 0,
    violations,
    warnings,
    suggestions,
  };
}

// ============================================
// 집필용 컨텍스트 생성
// ============================================

/**
 * 집필 프롬프트용 캐릭터 상태 요약 생성
 */
export function generateCharacterStatusSummary(
  context: CharacterConsistencyContext,
  characters: Character[]
): string {
  let summary = '## 캐릭터 상태 요약 (⚠️ 일관성 유지 필수)\n\n';

  // 사망 캐릭터
  const dead = context.characters.filter(s => s.status === 'dead');
  if (dead.length > 0) {
    summary += '### ❌ 사망 캐릭터 (등장 불가)\n';
    dead.forEach(d => {
      summary += `- ${d.characterName}: ${d.statusChangedAt || '이전'}에서 사망${d.statusChangeDescription ? ` (${d.statusChangeDescription})` : ''}\n`;
    });
    summary += '\n';
  }

  // 감금 캐릭터
  const imprisoned = context.characters.filter(s => s.status === 'imprisoned');
  if (imprisoned.length > 0) {
    summary += '### 🔒 감금 캐릭터 (해당 장소에서만 등장 가능)\n';
    imprisoned.forEach(i => {
      summary += `- ${i.characterName}: ${i.currentLocation || '감옥'}에 감금 중\n`;
    });
    summary += '\n';
  }

  // 부상 캐릭터
  const injured = context.characters.filter(s => s.status === 'injured');
  if (injured.length > 0) {
    summary += '### 🩹 부상 캐릭터 (활동 제한)\n';
    injured.forEach(i => {
      summary += `- ${i.characterName}: ${i.notes || '부상 상태'}\n`;
    });
    summary += '\n';
  }

  // 활성 규칙
  const activeRules = context.rules.filter(r => r.isActive && r.priority === 'critical');
  if (activeRules.length > 0) {
    summary += '### ⚠️ 핵심 규칙\n';
    activeRules.forEach(r => {
      summary += `- ${r.rule}\n`;
    });
    summary += '\n';
  }

  return summary;
}

/**
 * 프롬프트에 포함할 일관성 지시문 생성
 */
export function generateConsistencyInstructions(
  context: CharacterConsistencyContext
): string {
  const dead = context.characters.filter(s => s.status === 'dead');
  const imprisoned = context.characters.filter(s => s.status === 'imprisoned');

  let instructions = '\n## ⚠️ 캐릭터 일관성 규칙 (절대 위반 금지)\n';

  if (dead.length > 0) {
    instructions += '\n### 사망 캐릭터 (현재 시점 등장 불가)\n';
    dead.forEach(d => {
      instructions += `- "${d.characterName}": 사망함. 회상이나 언급만 가능\n`;
    });
  }

  if (imprisoned.length > 0) {
    instructions += '\n### 감금 캐릭터 (위치 고정)\n';
    imprisoned.forEach(i => {
      instructions += `- "${i.characterName}": ${i.currentLocation}에서만 등장 가능\n`;
    });
  }

  const criticalRules = context.rules.filter(r => r.isActive && r.priority === 'critical');
  if (criticalRules.length > 0) {
    instructions += '\n### 핵심 규칙\n';
    criticalRules.forEach(r => {
      instructions += `- ${r.rule}\n`;
    });
  }

  return instructions;
}

// ============================================
// 기존 소설에서 캐릭터 정보 추출
// ============================================

/**
 * 소설 텍스트에서 캐릭터 정보 추출 프롬프트 생성
 */
export function generateCharacterExtractionPrompt(novelText: string): string {
  // 텍스트가 너무 길면 처음과 끝 부분만 사용
  const maxLength = 30000;
  let textToAnalyze = novelText;

  if (novelText.length > maxLength) {
    const halfLength = Math.floor(maxLength / 2);
    textToAnalyze = novelText.slice(0, halfLength) + '\n\n[중략]\n\n' + novelText.slice(-halfLength);
  }

  return `다음 소설 텍스트를 분석하여 등장인물 정보를 JSON 형식으로 추출하세요.

소설 텍스트:
"""
${textToAnalyze}
"""

다음 형식으로 응답하세요 (JSON만, 다른 텍스트 없이):
{
  "characters": [
    {
      "name": "캐릭터 이름",
      "aliases": ["별명1", "별명2"],
      "role": "protagonist/antagonist/supporting/minor",
      "status": "alive/dead/unknown",
      "statusChangeLocation": "사망/상태변화가 일어난 부분 (있는 경우)",
      "appearances": [
        {"location": "등장 장소", "context": "등장 맥락"}
      ],
      "relationships": [
        {"targetName": "관계 대상", "type": "관계 유형", "description": "관계 설명"}
      ],
      "traits": ["특성1", "특성2"],
      "speechPatterns": ["말투 특징1", "말투 특징2"],
      "keyEvents": ["주요 사건1", "주요 사건2"]
    }
  ],
  "warnings": ["발견된 일관성 문제1", "발견된 일관성 문제2"]
}

특히 다음 사항에 주의하세요:
1. 사망한 캐릭터와 그 사망 시점
2. 감금되거나 특정 장소에 묶인 캐릭터
3. 같은 이름의 다른 캐릭터가 있는지 여부
4. 캐릭터 상태의 일관성 문제`;
}

/**
 * 추출된 캐릭터 정보를 CharacterStatus로 변환
 */
export function convertExtractedToStatus(
  extracted: ExtractedCharacterInfo[]
): CharacterStatus[] {
  return extracted.map(char => ({
    characterId: crypto.randomUUID(),
    characterName: char.name,
    status: char.status === 'dead' ? 'dead' : char.status === 'unknown' ? 'alive' : 'alive',
    statusChangedAt: char.statusChangeLocation,
    notes: char.keyEvents.join(', '),
  }));
}

/**
 * 추출된 정보로 일관성 규칙 자동 생성
 */
export function generateRulesFromExtracted(
  extracted: ExtractedCharacterInfo[]
): CharacterConsistencyRule[] {
  const rules: CharacterConsistencyRule[] = [];

  extracted.forEach(char => {
    // 사망 캐릭터 규칙
    if (char.status === 'dead' && char.statusChangeLocation) {
      rules.push(createDeathRule(
        crypto.randomUUID(),
        char.name,
        char.statusChangeLocation
      ));
    }

    // 말투 규칙 (speechPatterns가 있는 경우)
    if (char.speechPatterns && char.speechPatterns.length > 0) {
      rules.push(createCustomRule(
        crypto.randomUUID(),
        char.name,
        'speech',
        `${char.name}의 말투: ${char.speechPatterns.join(', ')}`,
        'major'
      ));
    }
  });

  return rules;
}

// ============================================
// 빈 컨텍스트 생성
// ============================================

export function createEmptyConsistencyContext(projectId: string): CharacterConsistencyContext {
  return {
    projectId,
    characters: [],
    rules: [],
    appearances: [],
    knowledge: [],
    lastUpdated: new Date(),
  };
}
