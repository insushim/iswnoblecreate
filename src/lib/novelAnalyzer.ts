/**
 * 기존 소설 분석 및 캐릭터 정보 추출
 * - AI를 활용한 캐릭터 정보 자동 추출
 * - 일관성 문제 자동 감지
 */

import { generateJSON } from './gemini';
import {
  generateCharacterExtractionPrompt,
  convertExtractedToStatus,
  generateRulesFromExtracted,
  createEmptyConsistencyContext,
} from './characterConsistency';
import type {
  ExtractedCharacterInfo,
  CharacterConsistencyContext,
  CharacterStatus,
  CharacterConsistencyRule,
} from '@/types';

// 추출 결과 타입
export interface NovelAnalysisResult {
  characters: ExtractedCharacterInfo[];
  warnings: string[];
  consistencyContext: CharacterConsistencyContext;
}

/**
 * 소설 텍스트에서 캐릭터 정보 추출
 */
export async function analyzeNovelForCharacters(
  apiKey: string,
  novelText: string,
  projectId: string
): Promise<NovelAnalysisResult> {
  const prompt = generateCharacterExtractionPrompt(novelText);

  try {
    const result = await generateJSON<{
      characters: ExtractedCharacterInfo[];
      warnings: string[];
    }>(apiKey, prompt, { temperature: 0.3 });

    // 일관성 컨텍스트 생성
    const statuses = convertExtractedToStatus(result.characters);
    const rules = generateRulesFromExtracted(result.characters);

    const consistencyContext: CharacterConsistencyContext = {
      projectId,
      characters: statuses,
      rules,
      appearances: [],
      knowledge: [],
      lastUpdated: new Date(),
    };

    return {
      characters: result.characters,
      warnings: result.warnings || [],
      consistencyContext,
    };
  } catch (error) {
    console.error('[NovelAnalyzer] 캐릭터 추출 실패:', error);
    throw error;
  }
}

/**
 * 소설 텍스트에서 특정 캐릭터의 상태 변화 감지
 */
export async function detectCharacterStatusChanges(
  apiKey: string,
  novelText: string,
  characterNames: string[]
): Promise<{
  statusChanges: {
    characterName: string;
    oldStatus: string;
    newStatus: string;
    location: string;
    description: string;
  }[];
}> {
  const prompt = `다음 소설 텍스트에서 캐릭터들의 상태 변화(사망, 감금, 부상, 실종 등)를 찾아주세요.

분석할 캐릭터: ${characterNames.join(', ')}

소설 텍스트:
"""
${novelText.slice(0, 30000)}
"""

다음 JSON 형식으로 응답하세요:
{
  "statusChanges": [
    {
      "characterName": "캐릭터 이름",
      "oldStatus": "이전 상태 (alive/dead/imprisoned/injured/missing)",
      "newStatus": "변경된 상태",
      "location": "상태 변화가 일어난 위치/장면",
      "description": "상태 변화 설명"
    }
  ]
}`;

  try {
    const result = await generateJSON<{
      statusChanges: {
        characterName: string;
        oldStatus: string;
        newStatus: string;
        location: string;
        description: string;
      }[];
    }>(apiKey, prompt, { temperature: 0.2 });

    return result;
  } catch (error) {
    console.error('[NovelAnalyzer] 상태 변화 감지 실패:', error);
    throw error;
  }
}

/**
 * 소설에서 동명이인 문제 감지
 */
export async function detectDuplicateNames(
  apiKey: string,
  novelText: string
): Promise<{
  duplicates: {
    name: string;
    occurrences: {
      context: string;
      isLikelySamePerson: boolean;
      description: string;
    }[];
    suggestion: string;
  }[];
}> {
  const prompt = `다음 소설 텍스트에서 같은 이름이 다른 캐릭터를 지칭하는 경우가 있는지 분석하세요.
특히 사망한 캐릭터와 같은 이름의 살아있는 캐릭터가 있는지 확인하세요.

소설 텍스트:
"""
${novelText.slice(0, 30000)}
"""

다음 JSON 형식으로 응답하세요:
{
  "duplicates": [
    {
      "name": "캐릭터 이름",
      "occurrences": [
        {
          "context": "등장 문맥 (50자 내외)",
          "isLikelySamePerson": true/false,
          "description": "설명"
        }
      ],
      "suggestion": "해결 방안 제안"
    }
  ]
}

동명이인이 없으면 빈 배열을 반환하세요.`;

  try {
    const result = await generateJSON<{
      duplicates: {
        name: string;
        occurrences: {
          context: string;
          isLikelySamePerson: boolean;
          description: string;
        }[];
        suggestion: string;
      }[];
    }>(apiKey, prompt, { temperature: 0.2 });

    return result;
  } catch (error) {
    console.error('[NovelAnalyzer] 동명이인 감지 실패:', error);
    throw error;
  }
}

/**
 * 소설 일관성 전체 검사
 */
export async function runFullConsistencyCheck(
  apiKey: string,
  novelText: string,
  existingContext?: CharacterConsistencyContext
): Promise<{
  issues: {
    type: string;
    severity: 'critical' | 'major' | 'minor';
    characterName: string;
    description: string;
    location: string;
    suggestedFix: string;
  }[];
  summary: string;
}> {
  const contextInfo = existingContext
    ? `\n\n기존 캐릭터 상태 정보:\n${existingContext.characters.map(c =>
        `- ${c.characterName}: ${c.status}${c.statusChangedAt ? ` (${c.statusChangedAt}에서 변경)` : ''}`
      ).join('\n')}`
    : '';

  const prompt = `다음 소설 텍스트의 캐릭터 일관성을 검사하세요.
${contextInfo}

검사 항목:
1. 사망한 캐릭터가 다시 등장하는지
2. 감금된 캐릭터가 다른 장소에 나타나는지
3. 캐릭터 성격/말투가 급격히 변하는지
4. 동명이인 혼동이 있는지
5. 시간순서 오류가 있는지

소설 텍스트:
"""
${novelText.slice(0, 40000)}
"""

다음 JSON 형식으로 응답하세요:
{
  "issues": [
    {
      "type": "dead_reappears/wrong_location/personality_change/name_confusion/timeline_error",
      "severity": "critical/major/minor",
      "characterName": "문제 캐릭터",
      "description": "문제 설명",
      "location": "발생 위치 (문장이나 장면)",
      "suggestedFix": "수정 제안"
    }
  ],
  "summary": "전체 검사 요약 (2-3문장)"
}`;

  try {
    const result = await generateJSON<{
      issues: {
        type: string;
        severity: 'critical' | 'major' | 'minor';
        characterName: string;
        description: string;
        location: string;
        suggestedFix: string;
      }[];
      summary: string;
    }>(apiKey, prompt, { temperature: 0.2 });

    return result;
  } catch (error) {
    console.error('[NovelAnalyzer] 일관성 검사 실패:', error);
    throw error;
  }
}

/**
 * 캐릭터 정보를 Character 타입으로 변환
 */
export function convertExtractedToCharacter(
  extracted: ExtractedCharacterInfo,
  projectId: string
): Partial<import('@/types').Character> {
  const roleMap: Record<string, import('@/types').Character['role']> = {
    'protagonist': 'protagonist',
    'antagonist': 'antagonist',
    'supporting': 'supporting',
    'minor': 'minor',
  };

  return {
    id: crypto.randomUUID(),
    projectId,
    name: extracted.name,
    nickname: extracted.aliases,
    role: roleMap[extracted.role] || 'supporting',
    age: '',
    gender: '',
    appearance: '',
    personality: extracted.traits.join(', '),
    background: extracted.keyEvents.join('\n'),
    motivation: '',
    goal: '',
    strengths: [],
    weaknesses: [],
    speechPattern: {
      formalityLevel: 3,
      speechSpeed: 'normal',
      vocabularyLevel: 'average',
      tone: extracted.speechPatterns.join(', '),
    },
    arc: {
      type: 'positive',
      startingState: '',
      endingState: '',
      keyMoments: [],
    },
    relationships: extracted.relationships.map(rel => ({
      targetId: '', // 나중에 매칭 필요
      type: rel.type as import('@/types').Relationship['type'],
      description: rel.description,
      startingRelation: '',
      currentRelation: rel.description,
    })),
    emotionalState: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}
