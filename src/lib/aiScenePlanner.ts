/**
 * AI 씬 기획 자동 생성 시스템
 *
 * 권의 기본 정보를 바탕으로 AI가 씬 분할표를 자동 생성
 * - 시작점/종료점 자동 연결
 * - mustInclude 자동 추출
 * - 분량 자동 배분
 */

import { generateScenePlanningPrompt, Volume1SceneTemplate } from './scenePromptGenerator';
import type { Project, SceneStructure } from '@/types';

// AI 응답 파싱 결과 타입 (v3.0 - 더 정교한 씬 기획)
export interface ParsedSceneData {
  sceneNumber: number;
  title: string;
  targetWordCount: number;
  sceneType: 'mini' | 'normal' | 'important' | 'climax'; // 씬 유형
  pov: string;
  povType: 'first' | 'third-limited' | 'omniscient';
  location: string;
  timeframe: string;
  participants: string[];
  mustInclude: string[];
  forbiddenInThisScene: string[]; // 이 씬에서 언급하면 안되는 키워드
  startCondition: string;
  startConditionType: 'dialogue' | 'action' | 'narration' | 'scene';
  endCondition: string;
  endConditionType: 'dialogue' | 'action' | 'narration' | 'scene';
  emotionalGoal: string;
  plotFunction: string;
  connectionToPrevious?: string; // 이전 씬과의 연결
  connectionToNext?: string; // 다음 씬으로의 연결
  notes?: string; // 추가 메모
}

export interface AIScenePlannerResult {
  success: boolean;
  scenes: ParsedSceneData[];
  error?: string;
}

/**
 * Gemini API를 사용하여 씬 분할표 생성
 */
export async function generateScenesWithAI(
  project: Project,
  volumeNumber: number,
  volumeTitle: string,
  volumeStartPoint: string,
  volumeEndPoint: string,
  volumeCoreEvent: string,
  targetSceneCount: number,
  targetWordCount: number,
  previousVolumeSummary?: string,
  apiKey?: string
): Promise<AIScenePlannerResult> {
  if (!apiKey) {
    return {
      success: false,
      scenes: [],
      error: 'API 키가 설정되지 않았습니다.',
    };
  }

  // 프롬프트 생성
  const prompt = generateScenePlanningPrompt(
    project,
    volumeNumber,
    volumeTitle,
    volumeStartPoint,
    volumeEndPoint,
    volumeCoreEvent,
    targetSceneCount,
    targetWordCount,
    previousVolumeSummary
  );

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'API 요청 실패');
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error('AI 응답이 비어있습니다.');
    }

    // JSON 파싱
    const scenes = parseAIResponse(text);

    return {
      success: true,
      scenes,
    };
  } catch (error) {
    console.error('AI 씬 생성 오류:', error);
    return {
      success: false,
      scenes: [],
      error: error instanceof Error ? error.message : '알 수 없는 오류',
    };
  }
}

/**
 * AI 응답에서 JSON 추출 및 파싱
 */
function parseAIResponse(text: string): ParsedSceneData[] {
  // JSON 블록 추출
  const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
  const jsonStr = jsonMatch ? jsonMatch[1] : text;

  // JSON 파싱 시도
  try {
    const parsed = JSON.parse(jsonStr.trim());
    const scenes = parsed.scenes || parsed;

    if (!Array.isArray(scenes)) {
      throw new Error('scenes 배열을 찾을 수 없습니다.');
    }

    // 각 씬 데이터 검증 및 정규화 (v3.0 - 새 필드 추가)
    return scenes.map((scene: Partial<ParsedSceneData>, index: number) => ({
      sceneNumber: scene.sceneNumber || index + 1,
      title: scene.title || `씬 ${index + 1}`,
      targetWordCount: scene.targetWordCount || 2000, // 기본값 2000자로 하향
      sceneType: validateSceneType(scene.sceneType),
      pov: scene.pov || '',
      povType: validatePovType(scene.povType),
      location: scene.location || '',
      timeframe: scene.timeframe || '',
      participants: Array.isArray(scene.participants) ? scene.participants : [],
      mustInclude: Array.isArray(scene.mustInclude) ? scene.mustInclude : [],
      forbiddenInThisScene: Array.isArray(scene.forbiddenInThisScene) ? scene.forbiddenInThisScene : [],
      startCondition: scene.startCondition || '',
      startConditionType: validateConditionType(scene.startConditionType),
      endCondition: scene.endCondition || '',
      endConditionType: validateConditionType(scene.endConditionType),
      emotionalGoal: scene.emotionalGoal || '',
      plotFunction: scene.plotFunction || '',
      connectionToPrevious: scene.connectionToPrevious || '',
      connectionToNext: scene.connectionToNext || '',
      notes: scene.notes || '',
    }));
  } catch (error) {
    console.error('JSON 파싱 오류:', error, 'Raw text:', text);
    throw new Error('AI 응답을 파싱할 수 없습니다.');
  }
}

/**
 * 씬 타입 검증
 */
function validateSceneType(type?: string): 'mini' | 'normal' | 'important' | 'climax' {
  if (type === 'mini' || type === 'normal' || type === 'important' || type === 'climax') {
    return type;
  }
  return 'normal';
}

/**
 * POV 타입 검증
 */
function validatePovType(type?: string): 'first' | 'third-limited' | 'omniscient' {
  if (type === 'first' || type === 'third-limited' || type === 'omniscient') {
    return type;
  }
  return 'third-limited';
}

/**
 * 조건 타입 검증
 */
function validateConditionType(type?: string): 'dialogue' | 'action' | 'narration' | 'scene' {
  if (type === 'dialogue' || type === 'action' || type === 'narration' || type === 'scene') {
    return type;
  }
  return 'dialogue';
}

/**
 * ParsedSceneData를 SceneStructure로 변환 (v3.0 - 새 필드 추가)
 */
export function parsedSceneToStructure(
  data: ParsedSceneData,
  volumeId: string
): SceneStructure {
  return {
    id: crypto.randomUUID(),
    volumeId,
    sceneNumber: data.sceneNumber,
    title: data.title,
    targetWordCount: data.targetWordCount,
    sceneType: data.sceneType, // 씬 유형 추가
    pov: data.pov,
    povType: data.povType,
    location: data.location,
    timeframe: data.timeframe,
    participants: data.participants,
    mustInclude: data.mustInclude,
    forbiddenInThisScene: data.forbiddenInThisScene, // 금지 키워드 추가
    startCondition: data.startCondition,
    endCondition: data.endCondition,
    endConditionType: data.endConditionType,
    emotionalGoal: data.emotionalGoal, // 감정 목표 추가
    plotFunction: data.plotFunction, // 플롯 기능 추가
    connectionToPrevious: data.connectionToPrevious, // 이전 씬 연결 추가
    connectionToNext: data.connectionToNext, // 다음 씬 연결 추가
    notes: data.notes, // 메모 추가
    status: 'pending',
    actualWordCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * 씬 연결 검증 (이전 씬 종료 → 다음 씬 시작) - v3.0 강화
 */
export function validateSceneConnections(scenes: ParsedSceneData[]): {
  isValid: boolean;
  issues: { sceneNumber: number; issue: string }[];
} {
  const issues: { sceneNumber: number; issue: string }[] = [];

  for (let i = 0; i < scenes.length; i++) {
    const currentScene = scenes[i];

    // 시작 조건이 비어있는지 확인
    if (!currentScene.startCondition || currentScene.startCondition.trim().length < 10) {
      issues.push({
        sceneNumber: currentScene.sceneNumber,
        issue: '시작 조건이 너무 짧습니다. (최소 10자 이상)',
      });
    }

    // 종료 조건이 비어있는지 확인 - 더 엄격하게
    if (!currentScene.endCondition || currentScene.endCondition.trim().length < 15) {
      issues.push({
        sceneNumber: currentScene.sceneNumber,
        issue: '종료 조건이 너무 짧습니다. (최소 15자 이상, 구체적으로)',
      });
    }

    // mustInclude가 비어있는지 확인
    if (!currentScene.mustInclude || currentScene.mustInclude.length < 2) {
      issues.push({
        sceneNumber: currentScene.sceneNumber,
        issue: 'mustInclude 항목이 2개 미만입니다.',
      });
    }

    // forbiddenInThisScene이 다음 씬들의 키워드를 포함하는지 확인
    if (i < scenes.length - 1) {
      const nextScene = scenes[i + 1];
      if (!currentScene.forbiddenInThisScene || currentScene.forbiddenInThisScene.length === 0) {
        issues.push({
          sceneNumber: currentScene.sceneNumber,
          issue: 'forbiddenInThisScene이 비어있습니다. 다음 씬의 키워드를 넣어주세요.',
        });
      }
    }

    // 씬 타입에 따른 분량 검증
    const wordCount = currentScene.targetWordCount;
    const sceneType = currentScene.sceneType;

    if (sceneType === 'mini' && wordCount > 1500) {
      issues.push({
        sceneNumber: currentScene.sceneNumber,
        issue: `미니 씬인데 분량이 너무 많습니다. (${wordCount}자 → 800~1500자 권장)`,
      });
    } else if (sceneType === 'normal' && (wordCount < 1200 || wordCount > 2800)) {
      issues.push({
        sceneNumber: currentScene.sceneNumber,
        issue: `일반 씬 분량이 범위를 벗어났습니다. (${wordCount}자 → 1500~2500자 권장)`,
      });
    } else if (sceneType === 'important' && (wordCount < 2000 || wordCount > 4000)) {
      issues.push({
        sceneNumber: currentScene.sceneNumber,
        issue: `중요 씬 분량이 범위를 벗어났습니다. (${wordCount}자 → 2500~3500자 권장)`,
      });
    } else if (sceneType === 'climax' && wordCount < 3000) {
      issues.push({
        sceneNumber: currentScene.sceneNumber,
        issue: `클라이맥스 씬인데 분량이 너무 적습니다. (${wordCount}자 → 3500~4500자 권장)`,
      });
    }
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}

/**
 * 분량 배분 검증
 */
export function validateWordCountDistribution(
  scenes: ParsedSceneData[],
  targetTotalWordCount: number
): {
  isValid: boolean;
  totalWordCount: number;
  difference: number;
  percentageDiff: number;
} {
  const totalWordCount = scenes.reduce((sum, s) => sum + s.targetWordCount, 0);
  const difference = Math.abs(totalWordCount - targetTotalWordCount);
  const percentageDiff = (difference / targetTotalWordCount) * 100;

  return {
    isValid: percentageDiff <= 10, // 10% 이내 허용
    totalWordCount,
    difference,
    percentageDiff,
  };
}
