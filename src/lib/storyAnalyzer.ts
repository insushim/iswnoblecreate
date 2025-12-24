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
  model: GeminiModel = 'gemini-3-flash'
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
  model: GeminiModel = 'gemini-3-flash'
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
  model: GeminiModel = 'gemini-3-flash'
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
