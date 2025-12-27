/**
 * 스토리 분석 시스템
 *
 * 이전에 작성된 모든 글을 분석하여:
 * 1. 스토리 일관성 검증
 * 2. 캐릭터 상태 추적
 * 3. 복선/갈등 진행 상황
 * 4. 중복 내용 방지
 * 5. 타임라인 검증
 */

import { generateJSON, generateText } from './gemini';
import { GeminiModel, Character, VolumeStructure, SceneStructure } from '@/types';
import {
  CharacterStatus,
  CharacterConsistencyContext,
  CharacterConsistencyRule,
} from '@/types';

// 스토리 분석 결과
export interface StoryAnalysisResult {
  // 캐릭터 상태
  characterStates: CharacterStateSnapshot[];

  // 플롯 진행
  plotProgress: PlotProgressItem[];

  // 복선 상태
  foreshadowingStatus: ForeshadowingStatusItem[];

  // 갈등 상태
  conflictStatus: ConflictStatusItem[];

  // 중복 감지
  duplicatePatterns: DuplicatePattern[];

  // 타임라인
  timeline: TimelineEvent[];

  // 경고
  warnings: StoryWarning[];

  // 요약
  summary: StorySummary;
}

// 캐릭터 상태 스냅샷
export interface CharacterStateSnapshot {
  characterId: string;
  characterName: string;
  status: 'alive' | 'dead' | 'missing' | 'imprisoned' | 'injured' | 'transformed';
  lastSeenLocation: string;
  lastSeenVolume: number;
  lastSeenScene: number;
  currentEmotionalState: string;
  currentGoal: string;
  relationshipChanges: {
    targetName: string;
    previousRelation: string;
    currentRelation: string;
  }[];
  knowledgeGained: string[];
  secretsRevealed: string[];
}

// 플롯 진행 항목
export interface PlotProgressItem {
  plotPointId?: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'abandoned';
  completedAt?: { volume: number; scene: number };
  remainingSteps?: string[];
}

// 복선 상태
export interface ForeshadowingStatusItem {
  foreshadowingId?: string;
  description: string;
  planted: boolean;
  plantedAt?: { volume: number; scene: number; method: string };
  reinforced: { volume: number; scene: number; method: string }[];
  resolved: boolean;
  resolvedAt?: { volume: number; scene: number };
  readyToResolve: boolean;
}

// 갈등 상태
export interface ConflictStatusItem {
  conflictId?: string;
  description: string;
  intensity: number; // 1-10
  phase: 'brewing' | 'active' | 'escalating' | 'climax' | 'resolved';
  lastEscalation?: { volume: number; scene: number };
  involvedCharacters: string[];
}

// 중복 패턴
export interface DuplicatePattern {
  type: 'scene' | 'dialogue' | 'description' | 'event';
  description: string;
  occurrences: { volume: number; scene: number; excerpt: string }[];
  severity: 'low' | 'medium' | 'high';
  suggestion: string;
}

// 타임라인 이벤트
export interface TimelineEvent {
  description: string;
  volume: number;
  scene: number;
  timeIndicator?: string; // "다음 날", "3일 후" 등
  characters: string[];
  location: string;
}

// 스토리 경고
export interface StoryWarning {
  type:
    | 'dead_character_active'
    | 'timeline_inconsistency'
    | 'character_teleport'
    | 'knowledge_leak'
    | 'personality_break'
    | 'duplicate_content'
    | 'plot_hole'
    | 'unresolved_foreshadowing'
    | 'abandoned_conflict';
  severity: 'critical' | 'major' | 'minor';
  description: string;
  location: { volume: number; scene: number };
  affectedCharacters?: string[];
  suggestion: string;
}

// 스토리 요약
export interface StorySummary {
  totalVolumes: number;
  totalScenes: number;
  totalWordCount: number;
  mainEvents: string[];
  characterArcs: { name: string; arc: string }[];
  unresolvedPlots: string[];
  readyToResolveForeshadowings: string[];
  activeConflicts: string[];
}

/**
 * 전체 스토리를 분석합니다.
 */
export async function analyzeFullStory(
  apiKey: string,
  volumes: VolumeStructure[],
  characters: Character[],
  model: GeminiModel = 'gemini-3-flash-preview'
): Promise<StoryAnalysisResult> {
  // 모든 씬의 내용을 수집
  const allContent = collectAllContent(volumes);

  if (allContent.length === 0) {
    return createEmptyAnalysisResult();
  }

  // 분석 프롬프트
  const prompt = `당신은 소설 분석 전문가입니다.
다음 소설의 전체 내용을 분석하여 일관성을 검증하고 요약해주세요.

## 등장인물 목록
${characters.map(c => `- ${c.name} (${c.role}): ${c.personality?.slice(0, 100) || '성격 미정'}`).join('\n')}

## 소설 내용
${allContent.map(c => `[${c.volume}권 ${c.scene}씬]\n${c.content.slice(0, 3000)}`).join('\n\n---\n\n')}

## 분석 항목

### 1. 캐릭터 상태 추적
각 캐릭터의 현재 상태를 파악해주세요:
- 생존/사망/실종/감금/부상/변신 상태
- 마지막 등장 위치
- 현재 감정 상태
- 현재 목표
- 관계 변화
- 새로 알게 된 정보
- 드러난 비밀

### 2. 플롯 진행 상황
- 시작된 플롯
- 진행 중인 플롯
- 완료된 플롯
- 방치된 플롯

### 3. 복선 상태
- 심어진 복선과 위치
- 강화된 복선
- 해소된 복선
- 해소할 준비가 된 복선

### 4. 갈등 상태
- 현재 활성화된 갈등
- 갈등의 강도 (1-10)
- 갈등 단계

### 5. 중복 감지
- 비슷한 장면/대사/묘사가 반복되는 경우
- 같은 사건이 중복 서술된 경우

### 6. 타임라인
- 시간 순서대로 주요 이벤트 정리
- 시간 표현의 일관성

### 7. 경고 사항
- 죽은 캐릭터가 활동하는 경우 (critical)
- 시간선 모순 (major)
- 캐릭터 순간이동 (장소 일관성 위반)
- 캐릭터가 알 수 없는 정보를 아는 경우
- 성격 일관성 위반
- 중복 내용
- 플롯 홀
- 미해소 복선
- 방치된 갈등

## 응답 형식 (JSON)
{
  "characterStates": [
    {
      "characterId": "캐릭터 이름",
      "characterName": "캐릭터 이름",
      "status": "alive/dead/missing/imprisoned/injured/transformed",
      "lastSeenLocation": "마지막 등장 장소",
      "lastSeenVolume": 권 번호,
      "lastSeenScene": 씬 번호,
      "currentEmotionalState": "현재 감정",
      "currentGoal": "현재 목표",
      "relationshipChanges": [
        {
          "targetName": "대상",
          "previousRelation": "이전 관계",
          "currentRelation": "현재 관계"
        }
      ],
      "knowledgeGained": ["새로 알게 된 정보"],
      "secretsRevealed": ["드러난 비밀"]
    }
  ],
  "plotProgress": [
    {
      "description": "플롯 설명",
      "status": "pending/in_progress/completed/abandoned",
      "completedAt": { "volume": 1, "scene": 3 },
      "remainingSteps": ["남은 단계"]
    }
  ],
  "foreshadowingStatus": [
    {
      "description": "복선 설명",
      "planted": true,
      "plantedAt": { "volume": 1, "scene": 2, "method": "암시 방법" },
      "reinforced": [{ "volume": 2, "scene": 1, "method": "강화 방법" }],
      "resolved": false,
      "readyToResolve": true
    }
  ],
  "conflictStatus": [
    {
      "description": "갈등 설명",
      "intensity": 7,
      "phase": "escalating",
      "involvedCharacters": ["캐릭터1", "캐릭터2"]
    }
  ],
  "duplicatePatterns": [
    {
      "type": "scene/dialogue/description/event",
      "description": "중복 설명",
      "occurrences": [
        { "volume": 1, "scene": 2, "excerpt": "중복 내용 발췌" }
      ],
      "severity": "low/medium/high",
      "suggestion": "개선 제안"
    }
  ],
  "timeline": [
    {
      "description": "이벤트 설명",
      "volume": 1,
      "scene": 1,
      "timeIndicator": "시간 표현",
      "characters": ["관련 캐릭터"],
      "location": "장소"
    }
  ],
  "warnings": [
    {
      "type": "경고 유형",
      "severity": "critical/major/minor",
      "description": "상세 설명",
      "location": { "volume": 1, "scene": 2 },
      "affectedCharacters": ["관련 캐릭터"],
      "suggestion": "해결 방안"
    }
  ],
  "summary": {
    "totalVolumes": 권 수,
    "totalScenes": 씬 수,
    "totalWordCount": 총 글자수,
    "mainEvents": ["주요 이벤트"],
    "characterArcs": [{ "name": "캐릭터", "arc": "아크 진행" }],
    "unresolvedPlots": ["미해결 플롯"],
    "readyToResolveForeshadowings": ["해소 준비된 복선"],
    "activeConflicts": ["활성 갈등"]
  }
}

특히 다음 사항을 엄격히 검사해주세요:
1. 사망한 캐릭터가 이후에 활동하는지
2. 감금된 캐릭터가 다른 장소에 나타나는지
3. 같은 이야기가 반복되는지
4. 시간선이 맞는지

JSON만 출력하세요.`;

  try {
    const result = await generateJSON<StoryAnalysisResult>(apiKey, prompt, {
      model,
      temperature: 0.3,
      maxTokens: 16000,
    });

    return result;
  } catch (error) {
    console.error('[StoryAnalyzer] 분석 실패:', error);
    return createEmptyAnalysisResult();
  }
}

/**
 * 새로 작성할 씬에 대한 컨텍스트를 생성합니다.
 */
export async function generateWritingContext(
  apiKey: string,
  volumes: VolumeStructure[],
  targetVolume: number,
  targetScene: number,
  characters: Character[],
  model: GeminiModel = 'gemini-3-flash-preview'
): Promise<{
  previousSummary: string;
  characterStates: string;
  activeConflicts: string;
  pendingForeshadowings: string;
  avoidPatterns: string;
  mustRemember: string[];
  warnings: string[];
}> {
  // 이전 씬들의 내용 수집
  const previousContent = collectContentBefore(volumes, targetVolume, targetScene);

  if (previousContent.length === 0) {
    return {
      previousSummary: '첫 번째 씬입니다.',
      characterStates: characters.map(c => `${c.name}: 초기 상태`).join('\n'),
      activeConflicts: '아직 갈등이 없습니다.',
      pendingForeshadowings: '아직 복선이 없습니다.',
      avoidPatterns: '',
      mustRemember: [],
      warnings: [],
    };
  }

  const prompt = `당신은 소설 집필 보조 전문가입니다.
다음은 지금까지 작성된 소설 내용입니다. ${targetVolume}권 ${targetScene}씬을 작성하기 위한 컨텍스트를 생성해주세요.

## 등장인물
${characters.map(c => `- ${c.name} (${c.role}): ${c.personality?.slice(0, 100) || ''}`).join('\n')}

## 이전 내용
${previousContent.map(c => `[${c.volume}권 ${c.scene}씬]\n${c.content.slice(0, 2000)}`).join('\n\n---\n\n')}

## 생성할 컨텍스트

### 1. 이전 내용 요약
- 지금까지의 스토리 흐름
- 마지막 씬에서 무슨 일이 있었는지

### 2. 캐릭터 현재 상태
각 캐릭터의:
- 생존/사망/감금 등 상태
- 현재 위치
- 현재 감정
- 현재 목표
- 알고 있는 정보 / 모르는 정보

### 3. 활성 갈등
- 현재 진행 중인 갈등들
- 각 갈등의 강도

### 4. 대기 중인 복선
- 심어졌지만 해소되지 않은 복선
- 곧 해소해야 할 복선

### 5. 피해야 할 패턴
- 이미 사용된 표현/장면
- 반복되면 안 되는 내용

### 6. 반드시 기억할 사항
- 절대 잊으면 안 되는 설정
- 이미 밝혀진 비밀
- 이미 죽은 캐릭터
- 캐릭터 간 관계 변화

## 응답 형식 (JSON)
{
  "previousSummary": "이전 내용 요약 (500자 내외)",
  "characterStates": "각 캐릭터의 현재 상태 (마크다운 형식)",
  "activeConflicts": "활성 갈등 목록",
  "pendingForeshadowings": "대기 중인 복선 목록",
  "avoidPatterns": "피해야 할 패턴들",
  "mustRemember": [
    "반드시 기억할 사항 1",
    "반드시 기억할 사항 2"
  ],
  "warnings": [
    "이번 씬에서 주의할 경고"
  ]
}

JSON만 출력하세요.`;

  try {
    return await generateJSON<{
      previousSummary: string;
      characterStates: string;
      activeConflicts: string;
      pendingForeshadowings: string;
      avoidPatterns: string;
      mustRemember: string[];
      warnings: string[];
    }>(apiKey, prompt, {
      model,
      temperature: 0.3,
      maxTokens: 8000,
    });
  } catch (error) {
    console.error('[StoryAnalyzer] 컨텍스트 생성 실패:', error);
    return {
      previousSummary: '컨텍스트 생성 실패',
      characterStates: '',
      activeConflicts: '',
      pendingForeshadowings: '',
      avoidPatterns: '',
      mustRemember: [],
      warnings: ['자동 컨텍스트 생성 실패'],
    };
  }
}

/**
 * 새로 작성된 내용의 일관성을 검사합니다.
 */
export async function validateNewContent(
  apiKey: string,
  newContent: string,
  previousContent: { volume: number; scene: number; content: string }[],
  characters: Character[],
  model: GeminiModel = 'gemini-3-flash-preview'
): Promise<{
  isValid: boolean;
  violations: {
    type: string;
    severity: 'critical' | 'major' | 'minor';
    description: string;
    suggestion: string;
  }[];
  suggestions: string[];
}> {
  const prompt = `당신은 소설 일관성 검증 전문가입니다.
새로 작성된 내용이 이전 내용과 일관성이 있는지 검사해주세요.

## 등장인물
${characters.map(c => `- ${c.name} (${c.role})`).join('\n')}

## 이전 내용 (최근 3씬)
${previousContent.slice(-3).map(c => `[${c.volume}권 ${c.scene}씬]\n${c.content.slice(0, 2000)}`).join('\n\n')}

## 새로 작성된 내용
${newContent}

## 검사 항목

### 1. 사망 캐릭터 검사 (CRITICAL)
- 이전에 사망한 캐릭터가 활동하고 있는지
- 회상/과거 언급이 아닌 현재 행동인지

### 2. 장소 일관성 (MAJOR)
- 캐릭터가 순간이동하지 않았는지
- 이동 경로가 합리적인지

### 3. 시간 일관성 (MAJOR)
- 시간 표현이 일관적인지
- 밤에 해가 떠있다거나 하는 오류

### 4. 지식 일관성 (MAJOR)
- 캐릭터가 알 수 없는 정보를 아는지
- 비밀이 누설된 적 없는데 알고 있는지

### 5. 성격 일관성 (MINOR)
- 캐릭터 성격이 급변하지 않았는지
- 말투가 일관적인지

### 6. 중복 검사 (MINOR)
- 이전과 비슷한 장면/대사가 있는지

## 응답 형식 (JSON)
{
  "isValid": true/false,
  "violations": [
    {
      "type": "dead_character/location/time/knowledge/personality/duplicate",
      "severity": "critical/major/minor",
      "description": "문제 설명",
      "suggestion": "수정 제안"
    }
  ],
  "suggestions": [
    "전체적인 개선 제안"
  ]
}

특히 사망 캐릭터의 등장은 가장 심각한 오류입니다!
JSON만 출력하세요.`;

  try {
    return await generateJSON<{
      isValid: boolean;
      violations: {
        type: string;
        severity: 'critical' | 'major' | 'minor';
        description: string;
        suggestion: string;
      }[];
      suggestions: string[];
    }>(apiKey, prompt, {
      model,
      temperature: 0.2,
    });
  } catch (error) {
    console.error('[StoryAnalyzer] 검증 실패:', error);
    return {
      isValid: true,
      violations: [],
      suggestions: ['자동 검증 실패 - 수동 확인 필요'],
    };
  }
}

/**
 * 중복 내용을 감지합니다.
 */
export function detectDuplicateContent(
  newContent: string,
  previousContents: string[],
  threshold: number = 0.3
): {
  hasDuplicate: boolean;
  duplicates: { excerpt: string; similarity: number }[];
} {
  const duplicates: { excerpt: string; similarity: number }[] = [];

  // 문장 단위로 분리
  const newSentences = newContent.split(/[.!?。！？]/g).filter(s => s.trim().length > 20);

  for (const sentence of newSentences) {
    for (const prevContent of previousContents) {
      // 간단한 유사도 검사 (정확한 부분 일치)
      if (prevContent.includes(sentence.trim())) {
        duplicates.push({
          excerpt: sentence.trim(),
          similarity: 1.0,
        });
      } else {
        // 부분 일치 검사
        const words = sentence.split(/\s+/);
        const matchingWords = words.filter(word => prevContent.includes(word));
        const similarity = matchingWords.length / words.length;

        if (similarity > threshold && sentence.trim().length > 30) {
          duplicates.push({
            excerpt: sentence.trim(),
            similarity,
          });
        }
      }
    }
  }

  return {
    hasDuplicate: duplicates.length > 0,
    duplicates: duplicates.slice(0, 5), // 최대 5개만
  };
}

/**
 * 스토리 분석 결과를 프롬프트에 포함할 형식으로 변환합니다.
 */
export function generateAnalysisSummaryForPrompt(
  analysis: StoryAnalysisResult,
  targetVolume: number,
  targetScene: number
): string {
  let summary = `\n## 📖 이전 스토리 분석 결과\n\n`;

  // 캐릭터 상태
  summary += `### 👥 캐릭터 현재 상태\n`;
  for (const char of analysis.characterStates) {
    const statusEmoji = char.status === 'dead' ? '💀' :
                        char.status === 'imprisoned' ? '🔒' :
                        char.status === 'injured' ? '🤕' :
                        char.status === 'missing' ? '❓' : '✅';
    summary += `${statusEmoji} **${char.characterName}**: ${char.status}`;
    if (char.status === 'dead') {
      summary += ` (⚠️ 등장 불가!)`;
    }
    summary += `\n   - 위치: ${char.lastSeenLocation}`;
    summary += `\n   - 감정: ${char.currentEmotionalState}`;
    summary += `\n   - 목표: ${char.currentGoal}\n`;
  }

  // 경고 사항
  const criticalWarnings = analysis.warnings.filter(w => w.severity === 'critical');
  if (criticalWarnings.length > 0) {
    summary += `\n### 🚨 치명적 경고\n`;
    for (const warning of criticalWarnings) {
      summary += `- ${warning.description}\n`;
      summary += `  해결: ${warning.suggestion}\n`;
    }
  }

  // 활성 갈등
  const activeConflicts = analysis.conflictStatus.filter(c => c.phase !== 'resolved');
  if (activeConflicts.length > 0) {
    summary += `\n### ⚔️ 활성 갈등\n`;
    for (const conflict of activeConflicts) {
      summary += `- ${conflict.description} (강도: ${conflict.intensity}/10, 단계: ${conflict.phase})\n`;
    }
  }

  // 해소 준비된 복선
  const readyForeshadowings = analysis.foreshadowingStatus.filter(f => f.readyToResolve && !f.resolved);
  if (readyForeshadowings.length > 0) {
    summary += `\n### 🎯 해소할 복선\n`;
    for (const foreshadowing of readyForeshadowings) {
      summary += `- ${foreshadowing.description}\n`;
    }
  }

  // 중복 패턴 경고
  const highDuplicates = analysis.duplicatePatterns.filter(d => d.severity === 'high');
  if (highDuplicates.length > 0) {
    summary += `\n### 🔄 피해야 할 패턴\n`;
    for (const dup of highDuplicates) {
      summary += `- ${dup.description}: ${dup.suggestion}\n`;
    }
  }

  // 반드시 지킬 규칙
  summary += `\n### ⚠️ 절대 규칙\n`;
  const deadChars = analysis.characterStates.filter(c => c.status === 'dead');
  if (deadChars.length > 0) {
    summary += `- 다음 캐릭터는 사망했으므로 현재 시점에서 절대 행동/대화할 수 없음: ${deadChars.map(c => c.characterName).join(', ')}\n`;
  }
  const imprisonedChars = analysis.characterStates.filter(c => c.status === 'imprisoned');
  if (imprisonedChars.length > 0) {
    summary += `- 다음 캐릭터는 감금 중이므로 해당 장소 외에 나타날 수 없음: ${imprisonedChars.map(c => `${c.characterName}(${c.lastSeenLocation})`).join(', ')}\n`;
  }

  return summary;
}

// 헬퍼 함수들

function collectAllContent(volumes: VolumeStructure[]): { volume: number; scene: number; content: string }[] {
  const result: { volume: number; scene: number; content: string }[] = [];

  for (const volume of volumes) {
    for (const scene of volume.scenes || []) {
      if (scene.content && scene.content.trim().length > 0) {
        result.push({
          volume: volume.volumeNumber,
          scene: scene.sceneNumber,
          content: scene.content,
        });
      }
    }
  }

  return result.sort((a, b) =>
    a.volume !== b.volume ? a.volume - b.volume : a.scene - b.scene
  );
}

function collectContentBefore(
  volumes: VolumeStructure[],
  targetVolume: number,
  targetScene: number
): { volume: number; scene: number; content: string }[] {
  const all = collectAllContent(volumes);

  return all.filter(item =>
    item.volume < targetVolume ||
    (item.volume === targetVolume && item.scene < targetScene)
  );
}

function createEmptyAnalysisResult(): StoryAnalysisResult {
  return {
    characterStates: [],
    plotProgress: [],
    foreshadowingStatus: [],
    conflictStatus: [],
    duplicatePatterns: [],
    timeline: [],
    warnings: [],
    summary: {
      totalVolumes: 0,
      totalScenes: 0,
      totalWordCount: 0,
      mainEvents: [],
      characterArcs: [],
      unresolvedPlots: [],
      readyToResolveForeshadowings: [],
      activeConflicts: [],
    },
  };
}

// ============================================
// 강화된 검증 함수들 (v2.0)
// ============================================

/**
 * 시간 점프 표현을 감지합니다.
 */
export function detectTimeJump(content: string): {
  hasTimeJump: boolean;
  violations: { expression: string; position: number; suggestion: string }[];
} {
  const timeJumpPatterns = [
    // 기본 시간 점프 표현
    { pattern: /며칠이\s*(지나|흘러|흐른)/g, suggestion: '현재 순간만 묘사하세요' },
    { pattern: /몇\s*(달|개월)이\s*(지나|흘러)/g, suggestion: '현재 순간만 묘사하세요' },
    { pattern: /시간이\s*(지나|흘러)/g, suggestion: '현재 순간만 묘사하세요' },
    { pattern: /세월이\s*(지나|흘러)/g, suggestion: '현재 순간만 묘사하세요' },
    { pattern: /어느덧/g, suggestion: '시간 점프 표현 대신 현재 상황 묘사' },
    { pattern: /그\s*후로/g, suggestion: '시간 점프 표현 대신 현재 상황 묘사' },
    { pattern: /한참\s*(후|뒤)/g, suggestion: '연속된 시간으로 묘사하세요' },
    { pattern: /다음\s*날/g, suggestion: '이 표현은 다음 씬에서 사용하세요' },
    { pattern: /이튿날/g, suggestion: '이 표현은 다음 씬에서 사용하세요' },
    { pattern: /일주일\s*(후|뒤|이\s*지나)/g, suggestion: '현재 순간만 묘사하세요' },
    { pattern: /한\s*달\s*(후|뒤|이\s*지나)/g, suggestion: '현재 순간만 묘사하세요' },
    { pattern: /몇\s*년\s*(후|뒤|이\s*지나)/g, suggestion: '현재 순간만 묘사하세요' },
    { pattern: /결국/g, suggestion: '요약하지 말고 상세히 묘사하세요' },
    { pattern: /마침내/g, suggestion: '요약하지 말고 상세히 묘사하세요' },
    { pattern: /드디어/g, suggestion: '요약하지 말고 상세히 묘사하세요' },
    { pattern: /그렇게\s*해서/g, suggestion: '요약하지 말고 과정을 상세히 묘사하세요' },
    { pattern: /그리하여/g, suggestion: '요약하지 말고 과정을 상세히 묘사하세요' },
    { pattern: /그렇게/g, suggestion: '요약하지 말고 상세히 묘사하세요' },
    { pattern: /한편/g, suggestion: '시점 전환 금지, 현재 장면만 묘사하세요' },
    { pattern: /그\s*시각/g, suggestion: '시점 전환 금지, 현재 장면만 묘사하세요' },
    { pattern: /다른\s*곳에서/g, suggestion: '장소 전환 금지, 현재 장소만 묘사하세요' },
    { pattern: /그\s*때/g, suggestion: '시점 전환 금지, 현재 장면만 묘사하세요' },
    { pattern: /한\s*(시간|시간이)\s*(후|뒤|지나)/g, suggestion: '현재 순간만 묘사하세요' },
    { pattern: /얼마\s*(후|뒤)/g, suggestion: '현재 순간만 묘사하세요' },
    { pattern: /시간이\s*흐르/g, suggestion: '현재 순간만 묘사하세요' },
    { pattern: /세월이\s*흐르/g, suggestion: '현재 순간만 묘사하세요' },
    { pattern: /그\s*사이/g, suggestion: '시간 경과 표현 금지' },
    { pattern: /그\s*동안/g, suggestion: '시간 경과 표현 금지' },
    // 추가 시간 점프 표현 (더 강화)
    { pattern: /그\s*이후/g, suggestion: '시간 점프 금지, 현재 순간만 묘사' },
    { pattern: /나중에/g, suggestion: '시간 점프 금지, 현재 순간만 묘사' },
    { pattern: /이후로/g, suggestion: '시간 점프 금지, 현재 순간만 묘사' },
    { pattern: /그로부터/g, suggestion: '시간 점프 금지, 현재 순간만 묘사' },
    { pattern: /그날\s*이후/g, suggestion: '시간 점프 금지, 현재 순간만 묘사' },
    { pattern: /그\s*밤/g, suggestion: '다음 씬에서 사용하세요' },
    { pattern: /밤이\s*깊어/g, suggestion: '시간 점프 금지' },
    { pattern: /날이\s*밝아/g, suggestion: '다음 씬에서 사용하세요' },
    { pattern: /동이\s*트/g, suggestion: '다음 씬에서 사용하세요' },
    { pattern: /해가\s*지고/g, suggestion: '시간 점프 금지' },
    { pattern: /다음\s*날\s*아침/g, suggestion: '다음 씬에서 사용하세요' },
    { pattern: /아침이\s*되/g, suggestion: '다음 씬에서 사용하세요' },
    { pattern: /저녁이\s*되/g, suggestion: '시간 점프 금지' },
    { pattern: /어느새/g, suggestion: '시간 점프 금지, 현재 순간만 묘사' },
    { pattern: /문득/g, suggestion: '시간 점프 금지' },
    { pattern: /그러던\s*어느\s*날/g, suggestion: '시간 점프 금지' },
    { pattern: /며칠\s*뒤/g, suggestion: '다음 씬에서 사용하세요' },
    { pattern: /얼마\s*지나지\s*않아/g, suggestion: '시간 점프 금지' },
    { pattern: /그\s*다음/g, suggestion: '시간 점프 금지' },
    { pattern: /잠시\s*후/g, suggestion: '시간 점프 표현 최소화' },
    { pattern: /곧이어/g, suggestion: '시간 점프 표현 최소화' },
    // 장소 전환 감지 (강화)
    { pattern: /그\s*무렵/g, suggestion: '시점/장소 전환 금지' },
    { pattern: /이곳에서\s*멀리/g, suggestion: '장소 전환 금지' },
    { pattern: /저\s*멀리/g, suggestion: '장소 전환 금지' },
    { pattern: /한편으로/g, suggestion: '시점 전환 금지' },
    { pattern: /다른\s*한편/g, suggestion: '시점 전환 금지' },
    { pattern: /그때\s*그곳/g, suggestion: '시점/장소 전환 금지' },
    { pattern: /같은\s*시각/g, suggestion: '시점 전환 금지' },
    { pattern: /바로\s*그\s*시각/g, suggestion: '시점 전환 금지' },
    // 요약/압축 표현 감지
    { pattern: /그래서/g, suggestion: '요약하지 말고 과정을 묘사하세요' },
    { pattern: /따라서/g, suggestion: '요약하지 말고 과정을 묘사하세요' },
    { pattern: /그러므로/g, suggestion: '요약하지 말고 과정을 묘사하세요' },
    { pattern: /요컨대/g, suggestion: '요약 금지, 상세히 묘사하세요' },
    { pattern: /간단히\s*말해/g, suggestion: '요약 금지, 상세히 묘사하세요' },
    { pattern: /정리하면/g, suggestion: '요약 금지, 상세히 묘사하세요' },
    { pattern: /결론적으로/g, suggestion: '요약 금지, 상세히 묘사하세요' },
  ];

  const violations: { expression: string; position: number; suggestion: string }[] = [];

  for (const { pattern, suggestion } of timeJumpPatterns) {
    let match;
    const regex = new RegExp(pattern.source, pattern.flags);
    while ((match = regex.exec(content)) !== null) {
      violations.push({
        expression: match[0],
        position: match.index,
        suggestion,
      });
    }
  }

  return {
    hasTimeJump: violations.length > 0,
    violations,
  };
}

/**
 * 반복되는 장면/표현을 감지합니다.
 */
export function detectRepetition(
  newContent: string,
  previousContents: string[]
): {
  hasRepetition: boolean;
  repetitions: {
    type: 'awakening' | 'powerup' | 'resolution' | 'cliche' | 'dialogue' | 'scene' | 'reconciliation' | 'confession';
    description: string;
    excerpt: string;
    severity: 'high' | 'medium' | 'low';
  }[];
} {
  const repetitions: {
    type: 'awakening' | 'powerup' | 'resolution' | 'cliche' | 'dialogue' | 'scene' | 'reconciliation' | 'confession';
    description: string;
    excerpt: string;
    severity: 'high' | 'medium' | 'low';
  }[] = [];

  // 각성/깨달음 장면 패턴
  const awakeningPatterns = [
    /깨달았다/g,
    /각성했다/g,
    /눈을\s*떴다/g,
    /알게\s*되었다/g,
    /이해했다/g,
    /마침내\s*알았다/g,
    /진정한\s*의미를/g,
    /비로소\s*깨달/g,
    /그제서야\s*알았다/g,
    /눈이\s*뜨였다/g,
    /정신이\s*번쩍/g,
  ];

  // 힘 획득 패턴
  const powerupPatterns = [
    /힘이\s*솟아났다/g,
    /새로운\s*힘이/g,
    /능력이\s*생겼다/g,
    /강해졌다/g,
    /힘을\s*얻었다/g,
    /각성한\s*힘/g,
    /숨겨진\s*힘이/g,
    /진정한\s*힘을/g,
    /파워업/g,
    /레벨업/g,
    /능력\s*각성/g,
    /잠재력이\s*깨어/g,
  ];

  // 결심/다짐 패턴
  const resolutionPatterns = [
    /결심했다/g,
    /다짐했다/g,
    /맹세했다/g,
    /반드시\s*해내겠다/g,
    /꼭\s*이루겠다/g,
    /절대로\s*포기하지/g,
    /이번에는\s*반드시/g,
    /굳은\s*결의/g,
    /결연한\s*의지/g,
    /마음을\s*굳혔다/g,
    /굳게\s*결심/g,
  ];

  // 화해/용서 장면 패턴
  const reconciliationPatterns = [
    /용서해\s*줘/g,
    /용서했다/g,
    /화해했다/g,
    /오해가\s*풀렸다/g,
    /관계가\s*회복/g,
    /다시\s*친해/g,
    /미안해\s*했다/g,
    /사과했다/g,
    /용서를\s*구했다/g,
  ];

  // 고백/감정 표현 장면 패턴
  const confessionPatterns = [
    /좋아한다/g,
    /사랑한다/g,
    /감정을\s*고백/g,
    /마음을\s*전했다/g,
    /고백했다/g,
    /감정을\s*표현/g,
    /사랑을\s*고백/g,
    /감정이\s*전해졌다/g,
  ];

  // 클리셰 표현 패턴 (강화)
  const clichePatterns = [
    { pattern: /주먹을\s*불끈/g, desc: '주먹을 불끈' },
    { pattern: /눈빛이\s*변하/g, desc: '눈빛이 변하다' },
    { pattern: /전율이\s*(느껴|흘렀)/g, desc: '전율이' },
    { pattern: /심장이\s*뛰었다/g, desc: '심장이 뛰었다' },
    { pattern: /온몸에\s*전율/g, desc: '온몸에 전율' },
    { pattern: /이를\s*악물/g, desc: '이를 악물다' },
    { pattern: /두\s*눈을\s*부릅/g, desc: '두 눈을 부릅뜨다' },
    { pattern: /피가\s*끓/g, desc: '피가 끓다' },
    { pattern: /심장이\s*두근/g, desc: '심장이 두근거리다' },
    { pattern: /눈에\s*불꽃/g, desc: '눈에 불꽃' },
    { pattern: /눈에서\s*불/g, desc: '눈에서 불' },
    { pattern: /기운이\s*솟/g, desc: '기운이 솟다' },
    { pattern: /온몸이\s*떨/g, desc: '온몸이 떨리다' },
    { pattern: /가슴이\s*벅차/g, desc: '가슴이 벅차다' },
    { pattern: /눈가가\s*촉촉/g, desc: '눈가가 촉촉해지다' },
    { pattern: /눈물이\s*핑/g, desc: '눈물이 핑 돌다' },
    // 추가 클리셰 패턴 (더 강화)
    { pattern: /주먹을\s*쥐/g, desc: '주먹을 쥐다' },
    { pattern: /입술을\s*깨물/g, desc: '입술을 깨물다' },
    { pattern: /눈을\s*감았다/g, desc: '눈을 감다' },
    { pattern: /숨을\s*죽/g, desc: '숨을 죽이다' },
    { pattern: /눈이\s*마주치/g, desc: '눈이 마주치다' },
    { pattern: /심장이\s*멎/g, desc: '심장이 멎다' },
    { pattern: /숨이\s*멎/g, desc: '숨이 멎다' },
    { pattern: /온몸에\s*소름/g, desc: '온몸에 소름' },
    { pattern: /등골이\s*서늘/g, desc: '등골이 서늘하다' },
    { pattern: /가슴이\s*철렁/g, desc: '가슴이 철렁하다' },
    { pattern: /눈앞이\s*캄캄/g, desc: '눈앞이 캄캄하다' },
    { pattern: /머리가\s*하얘/g, desc: '머리가 하얘지다' },
    { pattern: /손에\s*땀/g, desc: '손에 땀을 쥐다' },
    { pattern: /가슴이\s*뜨거워/g, desc: '가슴이 뜨거워지다' },
    { pattern: /목이\s*메/g, desc: '목이 메다' },
    { pattern: /코끝이\s*찡/g, desc: '코끝이 찡하다' },
    { pattern: /눈시울이\s*붉어/g, desc: '눈시울이 붉어지다' },
    { pattern: /가슴이\s*미어/g, desc: '가슴이 미어지다' },
    { pattern: /온몸이\s*굳/g, desc: '온몸이 굳다' },
    { pattern: /몸이\s*얼어붙/g, desc: '몸이 얼어붙다' },
    { pattern: /눈빛이\s*흔들/g, desc: '눈빛이 흔들리다' },
    { pattern: /손이\s*떨/g, desc: '손이 떨리다' },
    { pattern: /다리에\s*힘이\s*풀/g, desc: '다리에 힘이 풀리다' },
  ];

  // 새로운 사건 생성 패턴 (씬 범위 이탈 감지)
  const newEventPatterns = [
    { pattern: /갑자기\s*나타났다/g, desc: '갑작스러운 인물 등장' },
    { pattern: /그때\s*누군가/g, desc: '새로운 인물 등장' },
    { pattern: /느닷없이/g, desc: '갑작스러운 전개' },
    { pattern: /뜻밖에도/g, desc: '예상치 못한 전개' },
    { pattern: /예상치\s*못한/g, desc: '예상치 못한 전개' },
    { pattern: /갑작스럽게/g, desc: '갑작스러운 전개' },
    { pattern: /돌연/g, desc: '갑작스러운 전개' },
    { pattern: /불현듯/g, desc: '갑작스러운 전개' },
    { pattern: /그\s*순간/g, desc: '급격한 전환' },
    { pattern: /바로\s*그때/g, desc: '급격한 전환' },
  ];

  // 이전 내용과 비교하여 패턴 반복 검사
  const allPrevious = previousContents.join('\n');

  // 각성 장면 반복 검사
  for (const pattern of awakeningPatterns) {
    if (pattern.test(newContent) && pattern.test(allPrevious)) {
      const match = newContent.match(pattern);
      if (match) {
        repetitions.push({
          type: 'awakening',
          description: '각성/깨달음 장면이 이전에도 있었습니다',
          excerpt: match[0],
          severity: 'high',
        });
      }
    }
  }

  // 힘 획득 반복 검사
  for (const pattern of powerupPatterns) {
    if (pattern.test(newContent) && pattern.test(allPrevious)) {
      const match = newContent.match(pattern);
      if (match) {
        repetitions.push({
          type: 'powerup',
          description: '힘 획득/강화 장면이 이전에도 있었습니다',
          excerpt: match[0],
          severity: 'high',
        });
      }
    }
  }

  // 결심 반복 검사
  for (const pattern of resolutionPatterns) {
    if (pattern.test(newContent) && pattern.test(allPrevious)) {
      const match = newContent.match(pattern);
      if (match) {
        repetitions.push({
          type: 'resolution',
          description: '결심/다짐 장면이 이전에도 있었습니다',
          excerpt: match[0],
          severity: 'high',
        });
      }
    }
  }

  // 화해/용서 반복 검사
  for (const pattern of reconciliationPatterns) {
    if (pattern.test(newContent) && pattern.test(allPrevious)) {
      const match = newContent.match(pattern);
      if (match) {
        repetitions.push({
          type: 'reconciliation',
          description: '화해/용서 장면이 이전에도 있었습니다',
          excerpt: match[0],
          severity: 'high',
        });
      }
    }
  }

  // 고백/감정 표현 반복 검사
  for (const pattern of confessionPatterns) {
    if (pattern.test(newContent) && pattern.test(allPrevious)) {
      const match = newContent.match(pattern);
      if (match) {
        repetitions.push({
          type: 'confession',
          description: '고백/감정 표현 장면이 이전에도 있었습니다',
          excerpt: match[0],
          severity: 'high',
        });
      }
    }
  }

  // 클리셰 반복 검사
  for (const { pattern, desc } of clichePatterns) {
    let count = 0;
    let match;
    const regex = new RegExp(pattern.source, pattern.flags);
    while ((match = regex.exec(newContent)) !== null) {
      count++;
    }
    if (count > 1) {
      repetitions.push({
        type: 'cliche',
        description: `"${desc}" 표현이 같은 내용에서 ${count}번 반복됩니다`,
        excerpt: desc,
        severity: 'medium',
      });
    }
    if (pattern.test(newContent) && pattern.test(allPrevious)) {
      repetitions.push({
        type: 'cliche',
        description: `"${desc}" 표현이 이전에도 사용되었습니다`,
        excerpt: desc,
        severity: 'low',
      });
    }
  }

  return {
    hasRepetition: repetitions.some(r => r.severity === 'high'),
    repetitions,
  };
}

/**
 * 씬 범위 위반을 감지합니다.
 */
export function detectSceneBoundaryViolation(
  content: string,
  sceneConfig: {
    location: string;
    participants: string[];
    startCondition: string;
    endCondition: string;
  }
): {
  hasViolation: boolean;
  violations: {
    type: 'location_change' | 'new_character' | 'time_skip' | 'scope_overflow';
    description: string;
    severity: 'critical' | 'major';
  }[];
} {
  const violations: {
    type: 'location_change' | 'new_character' | 'time_skip' | 'scope_overflow';
    description: string;
    severity: 'critical' | 'major';
  }[] = [];

  // 장소 변경 감지 패턴
  const locationChangePatterns = [
    /다른\s*곳으로\s*(이동|향했다|갔다)/g,
    /그곳을\s*떠나/g,
    /장소를\s*옮겨/g,
    /다음\s*장소로/g,
    /그리고\s*[가-힣]+에\s*도착/g,
    /한편\s*[가-힣]+에서는/g,
  ];

  for (const pattern of locationChangePatterns) {
    if (pattern.test(content)) {
      violations.push({
        type: 'location_change',
        description: `씬 내에서 장소가 변경되었습니다. 현재 씬은 "${sceneConfig.location}"에서만 진행되어야 합니다.`,
        severity: 'critical',
      });
      break;
    }
  }

  // 시간 점프 감지
  const timeJumpResult = detectTimeJump(content);
  if (timeJumpResult.hasTimeJump) {
    for (const v of timeJumpResult.violations) {
      violations.push({
        type: 'time_skip',
        description: `시간 점프 표현 "${v.expression}" 사용됨. ${v.suggestion}`,
        severity: 'critical',
      });
    }
  }

  return {
    hasViolation: violations.length > 0,
    violations,
  };
}

/**
 * 생성된 내용을 실시간으로 검증합니다.
 */
export function validateGeneratedContent(
  newContent: string,
  previousContents: string[],
  sceneConfig?: {
    location: string;
    participants: string[];
    startCondition: string;
    endCondition: string;
  }
): {
  isValid: boolean;
  score: number; // 0-100
  issues: {
    type: string;
    description: string;
    severity: 'critical' | 'major' | 'minor';
    suggestion: string;
  }[];
} {
  const issues: {
    type: string;
    description: string;
    severity: 'critical' | 'major' | 'minor';
    suggestion: string;
  }[] = [];

  let score = 100;

  // 1. 시간 점프 검사
  const timeJumpResult = detectTimeJump(newContent);
  if (timeJumpResult.hasTimeJump) {
    for (const v of timeJumpResult.violations) {
      issues.push({
        type: 'time_jump',
        description: `시간 점프 표현: "${v.expression}"`,
        severity: 'critical',
        suggestion: v.suggestion,
      });
      score -= 20;
    }
  }

  // 2. 반복 검사
  const repetitionResult = detectRepetition(newContent, previousContents);
  if (repetitionResult.hasRepetition) {
    for (const r of repetitionResult.repetitions) {
      issues.push({
        type: `repetition_${r.type}`,
        description: r.description,
        severity: r.severity === 'high' ? 'critical' : r.severity === 'medium' ? 'major' : 'minor',
        suggestion: '새로운 표현과 상황으로 대체하세요',
      });
      score -= r.severity === 'high' ? 15 : r.severity === 'medium' ? 10 : 5;
    }
  }

  // 3. 씬 범위 검사
  if (sceneConfig) {
    const boundaryResult = detectSceneBoundaryViolation(newContent, sceneConfig);
    if (boundaryResult.hasViolation) {
      for (const v of boundaryResult.violations) {
        issues.push({
          type: v.type,
          description: v.description,
          severity: v.severity,
          suggestion: '씬에 정의된 범위 내에서만 작성하세요',
        });
        score -= 25;
      }
    }
  }

  // 4. 중복 내용 검사
  const duplicateResult = detectDuplicateContent(newContent, previousContents);
  if (duplicateResult.hasDuplicate) {
    for (const d of duplicateResult.duplicates) {
      if (d.similarity > 0.8) {
        issues.push({
          type: 'duplicate_content',
          description: `중복 내용 감지: "${d.excerpt.slice(0, 50)}..."`,
          severity: 'major',
          suggestion: '새로운 내용으로 대체하세요',
        });
        score -= 15;
      }
    }
  }

  return {
    isValid: score >= 60 && !issues.some(i => i.severity === 'critical'),
    score: Math.max(0, score),
    issues,
  };
}

/**
 * 스토리 압축을 감지합니다.
 * 1씬에 너무 많은 사건이 압축되어 있는지 감지합니다.
 */
export function detectStoryCompression(
  content: string,
  sceneConfig?: {
    startCondition?: string;
    endCondition?: string;
    mustInclude?: string[];
  }
): {
  isCompressed: boolean;
  compressionScore: number; // 0-100, 높을수록 압축됨
  violations: {
    type: 'multiple_events' | 'time_skip' | 'story_arc_complete' | 'major_event';
    description: string;
    severity: 'critical' | 'major';
  }[];
} {
  const violations: {
    type: 'multiple_events' | 'time_skip' | 'story_arc_complete' | 'major_event';
    description: string;
    severity: 'critical' | 'major';
  }[] = [];

  let compressionScore = 0;

  // 1. 주요 사건 키워드 감지 (한 씬에 여러 개 있으면 문제)
  const majorEventPatterns = [
    { pattern: /임진왜란/g, event: '임진왜란' },
    { pattern: /전쟁\s*(시작|발발|개전)/g, event: '전쟁 시작' },
    { pattern: /전쟁에서\s*(승리|패배)/g, event: '전쟁 종결' },
    { pattern: /진주성\s*전투/g, event: '진주성 전투' },
    { pattern: /한산도\s*대첩/g, event: '한산도 대첩' },
    { pattern: /노량해전/g, event: '노량해전' },
    { pattern: /명나라\s*원군/g, event: '명나라 참전' },
    { pattern: /왜군\s*(침략|상륙)/g, event: '왜군 침략' },
    { pattern: /과거\s*(시험|급제|합격)/g, event: '과거 급제' },
    { pattern: /회빙\s*됐다|회빙\s*했다|환생|빙의|영혼\s*이동/g, event: '회빙/환생' },
    { pattern: /각성\s*(했다|하다|하고)/g, event: '능력 각성' },
    { pattern: /수련\s*(시작|완료)|무공\s*익히|내공\s*쌓/g, event: '수련' },
    { pattern: /선천진기|후천진기|단전|기해혈/g, event: '무공 관련' },
    { pattern: /결혼|혼인|장가|시집/g, event: '결혼' },
    { pattern: /죽음|사망|전사|순국/g, event: '사망' },
    { pattern: /왕|임금|선조|광해군/g, event: '왕 관련' },
    { pattern: /장군|의병장|병마절도사/g, event: '직위 관련' },
  ];

  const detectedEvents: string[] = [];
  for (const { pattern, event } of majorEventPatterns) {
    if (pattern.test(content)) {
      if (!detectedEvents.includes(event)) {
        detectedEvents.push(event);
      }
    }
  }

  // 한 씬에 3개 이상의 주요 사건이 있으면 압축된 것으로 판단
  if (detectedEvents.length >= 3) {
    violations.push({
      type: 'multiple_events',
      description: `1씬에 너무 많은 사건이 포함됨: ${detectedEvents.join(', ')}`,
      severity: 'critical',
    });
    compressionScore += 40;
  } else if (detectedEvents.length >= 2) {
    violations.push({
      type: 'multiple_events',
      description: `1씬에 여러 사건이 포함됨: ${detectedEvents.join(', ')}`,
      severity: 'major',
    });
    compressionScore += 20;
  }

  // 2. 시간 경과 표현 감지 (시간이 많이 흐르면 압축된 것)
  const timeProgressPatterns = [
    { pattern: /며칠이\s*(지나|흘러)/g, weight: 30 },
    { pattern: /몇\s*(달|개월)이\s*(지나|흘러)/g, weight: 40 },
    { pattern: /몇\s*년이\s*(지나|흘러)/g, weight: 50 },
    { pattern: /세월이\s*(흘러|지나)/g, weight: 40 },
    { pattern: /시간이\s*(지나|흘러)/g, weight: 20 },
    { pattern: /그\s*후로/g, weight: 15 },
    { pattern: /그렇게\s*해서/g, weight: 15 },
    { pattern: /마침내/g, weight: 10 },
    { pattern: /드디어/g, weight: 10 },
    { pattern: /결국/g, weight: 15 },
  ];

  for (const { pattern, weight } of timeProgressPatterns) {
    let match;
    const regex = new RegExp(pattern.source, pattern.flags);
    while ((match = regex.exec(content)) !== null) {
      violations.push({
        type: 'time_skip',
        description: `시간 점프 표현: "${match[0]}"`,
        severity: 'critical',
      });
      compressionScore += weight;
    }
  }

  // 3. 스토리 아크 완료 감지 (한 씬에 시작과 끝이 다 있으면 압축)
  const storyArcPatterns = [
    { start: /시작했다|시작되었다|시작하/g, end: /끝났다|완료했다|마쳤다|성공했다/g },
    { start: /출발했다|떠났다/g, end: /도착했다|도달했다/g },
    { start: /수련을\s*시작/g, end: /수련을\s*(마치|완료|끝)/g },
    { start: /전쟁이\s*시작/g, end: /전쟁이\s*(끝|종료)/g },
    { start: /여행을\s*시작/g, end: /여행을\s*(마치|끝)/g },
  ];

  for (const { start, end } of storyArcPatterns) {
    if (start.test(content) && end.test(content)) {
      violations.push({
        type: 'story_arc_complete',
        description: '한 씬에 이야기의 시작과 끝이 모두 포함됨',
        severity: 'critical',
      });
      compressionScore += 35;
    }
  }

  // 4. 장 전환 표현 감지 (다른 시간대/장소로 급격히 전환)
  const chapterTransitionPatterns = [
    /그로부터\s*\d+\s*(일|달|년|개월)/g,
    /\d+\s*(일|달|년|개월)\s*(후|뒤)/g,
    /한편/g,
    /그\s*무렵/g,
    /같은\s*시각/g,
    /다른\s*곳에서/g,
  ];

  for (const pattern of chapterTransitionPatterns) {
    let match;
    const regex = new RegExp(pattern.source, pattern.flags);
    while ((match = regex.exec(content)) !== null) {
      violations.push({
        type: 'time_skip',
        description: `장/시간 전환 표현: "${match[0]}"`,
        severity: 'major',
      });
      compressionScore += 15;
    }
  }

  // 5. 글자 수 대비 사건 밀도 확인
  const contentLength = content.length;
  const eventDensity = (detectedEvents.length * 1000) / Math.max(contentLength, 1);

  // 1000자당 1개 이상의 주요 사건이 있으면 너무 밀집
  if (eventDensity > 1) {
    compressionScore += 20;
  }

  // 점수 상한
  compressionScore = Math.min(compressionScore, 100);

  return {
    isCompressed: compressionScore >= 40 || violations.some(v => v.severity === 'critical'),
    compressionScore,
    violations,
  };
}

/**
 * 씬 종료 조건 이후의 내용이 포함되어 있는지 감지합니다.
 */
export function detectBeyondEndCondition(
  content: string,
  endCondition: string,
  futureEvents?: string[]
): {
  hasBeyondEnd: boolean;
  violations: string[];
} {
  const violations: string[] = [];

  // 종료 조건에서 키워드 추출
  const endKeywords = endCondition.split(/[,\s]+/).filter(k => k.length >= 2);

  // 종료 조건 이후의 일반적인 미래 사건들
  const commonFuturePatterns = [
    /그\s*후로/g,
    /그\s*이후/g,
    /나중에/g,
    /훗날/g,
    /미래에/g,
    /결국/g,
    /마침내\s*그/g,
  ];

  // 미래 사건 키워드 확인
  const allFutureEvents = futureEvents || [];

  // 임진왜란 관련 미래 사건 (1592-1598)
  const warFuturePatterns = [
    /임진왜란\s*(발발|시작)/g,
    /왜군\s*(침입|상륙)/g,
    /진주성\s*전투/g,
    /한산도\s*대첩/g,
    /노량해전/g,
    /이순신\s*장군/g,
    /의병\s*(봉기|활동)/g,
  ];

  for (const pattern of [...commonFuturePatterns, ...warFuturePatterns]) {
    if (pattern.test(content)) {
      const match = content.match(pattern);
      if (match) {
        violations.push(`종료 조건 이후 내용 포함: "${match[0]}"`);
      }
    }
  }

  for (const futureEvent of allFutureEvents) {
    if (content.includes(futureEvent)) {
      violations.push(`미래 사건 포함: "${futureEvent}"`);
    }
  }

  return {
    hasBeyondEnd: violations.length > 0,
    violations,
  };
}

/**
 * 프롬프트에 추가할 반복 방지 경고를 생성합니다.
 */
export function generateRepetitionWarnings(previousContents: string[]): string {
  const allContent = previousContents.join('\n');

  const warnings: string[] = [];

  // 각성 장면이 있었는지
  const awakeningPatterns = [/깨달았다/g, /각성했다/g, /마침내\s*알았다/g];
  for (const pattern of awakeningPatterns) {
    if (pattern.test(allContent)) {
      warnings.push('이미 각성/깨달음 장면이 있었으므로 반복하지 마세요');
      break;
    }
  }

  // 힘 획득 장면이 있었는지
  const powerupPatterns = [/힘이\s*솟아났다/g, /새로운\s*힘이/g, /강해졌다/g];
  for (const pattern of powerupPatterns) {
    if (pattern.test(allContent)) {
      warnings.push('이미 힘 획득/강화 장면이 있었으므로 반복하지 마세요');
      break;
    }
  }

  // 결심 장면이 있었는지
  const resolutionPatterns = [/결심했다/g, /다짐했다/g, /맹세했다/g];
  for (const pattern of resolutionPatterns) {
    if (pattern.test(allContent)) {
      warnings.push('이미 결심/다짐 장면이 있었으므로 반복하지 마세요');
      break;
    }
  }

  if (warnings.length === 0) {
    return '';
  }

  return `\n### 🔄 반복 방지 경고 (이전 내용 분석 결과)\n${warnings.map(w => `- ⚠️ ${w}`).join('\n')}\n`;
}
