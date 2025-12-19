/**
 * 소설 집필 프롬프트 생성 시스템
 * - 권/씬 단위로 정확한 분량과 종료점을 지키는 AI 프롬프트 생성
 * - 반복 방지, 이어쓰기, 종료점 명시 기능 포함
 */

import type {
  VolumeStructure,
  SceneStructure,
  WritingPromptConfig,
  GeneratedPrompt,
  WritingStyle,
  Project,
  Character,
  WorldSetting,
} from '@/types';

// ============================================
// 시스템 프롬프트 생성
// ============================================

/**
 * 기본 시스템 프롬프트 생성
 */
export function generateSystemPrompt(
  project: Project,
  style: WritingStyle
): string {
  const perspectiveMap = {
    'first': '1인칭 시점',
    'third-limited': '3인칭 제한 시점',
    'omniscient': '전지적 작가 시점',
    'second': '2인칭 시점',
  };

  const tenseMap = {
    'past': '과거형',
    'present': '현재형',
  };

  const pacingMap = {
    'slow': '느리고 묘사가 풍부한',
    'moderate': '적절한 균형의',
    'fast': '빠르고 긴박한',
  };

  return `당신은 전문 소설 작가입니다. 아래 규칙을 철저히 따라 소설을 집필하세요.

## 작품 정보
- 작품명: ${project.title}
- 장르: ${project.genre.join(', ')}
- 컨셉: ${project.concept}
- 로그라인: ${project.logline}

## 문체 설정
- 시점: ${perspectiveMap[style.perspective]}
- 시제: ${tenseMap[style.tense]}
- 대사 비율: ${style.dialogueRatio}%
- 묘사 상세도: ${style.descriptionDetail}/10
- 페이싱: ${pacingMap[style.pacing]}
- 감정 강도: ${style.emotionIntensity}/10
${style.additionalInstructions ? `- 추가 지시: ${style.additionalInstructions}` : ''}

## 절대 규칙 ⚠️
1. 주어진 종료점에 도달하면 반드시 멈춘다
2. 종료점 이후의 내용(다음 권/씬 내용)은 절대 쓰지 않는다
3. 같은 내용을 반복하지 않는다
4. 분량이 남더라도 종료점에 도달하면 멈춘다
5. 종료점에 도달하지 않았는데 글이 끝나면 안 된다
6. 한국어로 작성한다`;
}

// ============================================
// 권(Volume) 단위 프롬프트 생성
// ============================================

/**
 * 권 전체 집필 프롬프트 생성
 */
export function generateVolumePrompt(
  project: Project,
  volume: VolumeStructure,
  style: WritingStyle,
  characters: Character[],
  worldSettings: WorldSetting[],
  previousVolumeSummary?: string
): GeneratedPrompt {
  const systemPrompt = generateSystemPrompt(project, style);

  // 등장인물 정보
  const characterInfo = characters
    .map(c => `- ${c.name}: ${c.role}, ${c.personality.slice(0, 100)}...`)
    .join('\n');

  // 세계관 정보
  const worldInfo = worldSettings
    .slice(0, 5)
    .map(w => `- ${w.title}: ${w.description.slice(0, 100)}...`)
    .join('\n');

  // 씬 목록
  const sceneList = volume.scenes
    .map((s, i) => `${i + 1}. ${s.title} (${s.targetWordCount.toLocaleString()}자) - ${s.mustInclude.join(', ')}`)
    .join('\n');

  const userPrompt = `## 현재 집필: ${volume.volumeNumber}권 "${volume.title}"
목표 글자수: ${volume.targetWordCount.toLocaleString()}자

## 절대 규칙 ⚠️
이 권은 반드시 다음 조건에서 끝나야 합니다:
---
종료점: "${volume.endPoint}"
종료 유형: ${volume.endPointType === 'dialogue' ? '대사' : volume.endPointType === 'action' ? '행동' : '서술'}
정확한 종료: "${volume.endPointExact}"
---
⚠️ 이 종료점에 도달하면 "--- ${volume.volumeNumber}권 끝 ---"을 쓰고 즉시 멈추세요.
⚠️ 종료점 이후 내용은 절대 쓰지 마세요.

${previousVolumeSummary ? `## 이전 권 요약\n${previousVolumeSummary}\n` : ''}

## 이 권의 내용
- 시작: ${volume.startPoint}
- 끝: ${volume.endPoint}
- 핵심 사건: ${volume.coreEvent}

## 씬 구성
${sceneList}

## 등장인물
${characterInfo}

## 세계관
${worldInfo}

${volume.nextVolumePreview ? `## 다음 권 예고 (참고만, 절대 쓰지 말 것)\n${volume.nextVolumePreview}\n` : ''}

---
위 설정에 따라 ${volume.volumeNumber}권을 집필하세요.
첫 번째 씬부터 시작합니다.`;

  return {
    systemPrompt,
    userPrompt,
    metadata: {
      volumeNumber: volume.volumeNumber,
      targetWordCount: volume.targetWordCount,
      endCondition: volume.endPointExact,
      mode: 'volume',
    },
  };
}

// ============================================
// 씬(Scene) 단위 프롬프트 생성
// ============================================

/**
 * 씬 단위 집필 프롬프트 생성
 */
export function generateScenePrompt(
  project: Project,
  volume: VolumeStructure,
  scene: SceneStructure,
  style: WritingStyle,
  characters: Character[],
  previousSceneSummary?: string
): GeneratedPrompt {
  const systemPrompt = generateSystemPrompt(project, style);

  // 해당 씬 등장인물만 필터
  const sceneCharacters = characters
    .filter(c => scene.participants.includes(c.id) || scene.participants.includes(c.name))
    .map(c => `- ${c.name} (${c.role}): ${c.personality.slice(0, 150)}
  말투: ${c.speechPattern?.tone || '일반'}, 습관: ${c.speechPattern?.catchphrase?.join(', ') || '없음'}`)
    .join('\n');

  // 필수 포함 내용
  const mustIncludeList = scene.mustInclude
    .map((item, i) => `${i + 1}. ${item}`)
    .join('\n');

  const userPrompt = `## 현재 집필 정보
- 작품: ${project.title} ${volume.volumeNumber}권
- 현재 씬: ${scene.sceneNumber}번 "${scene.title}"
- 목표 글자수: ${scene.targetWordCount.toLocaleString()}자

## 씬 설정
- 시점(POV): ${scene.pov} (${scene.povType === 'first' ? '1인칭' : scene.povType === 'third-limited' ? '3인칭 제한' : '전지적'})
- 장소: ${scene.location}
- 시간: ${scene.timeframe}

## 등장인물
${sceneCharacters}

## 이 씬에서 반드시 포함할 내용
${mustIncludeList}

## 시작 상황
${scene.startCondition}

## 종료 조건 ⚠️
---
이 씬은 반드시 다음에서 끝나야 합니다:
"${scene.endCondition}"
종료 유형: ${scene.endConditionType === 'dialogue' ? '대사' : scene.endConditionType === 'action' ? '행동' : '서술'}
---
⚠️ 이 조건에 도달하면 "---"를 쓰고 즉시 멈추세요.
⚠️ 다음 씬 내용은 절대 쓰지 마세요.

${previousSceneSummary ? `## 직전 씬 요약\n${previousSceneSummary}\n` : ''}

${scene.nextScenePreview ? `## 다음 씬 예고 (참고만, 절대 쓰지 말 것)\n${scene.nextScenePreview}\n` : ''}

---
위 설정에 따라 이 씬을 집필하세요.`;

  return {
    systemPrompt,
    userPrompt,
    metadata: {
      volumeNumber: volume.volumeNumber,
      sceneNumber: scene.sceneNumber,
      targetWordCount: scene.targetWordCount,
      endCondition: scene.endCondition,
      mode: 'scene',
    },
  };
}

// ============================================
// 이어쓰기 프롬프트 생성
// ============================================

/**
 * 이어쓰기 프롬프트 생성
 */
export function generateContinuePrompt(
  project: Project,
  volume: VolumeStructure,
  scene: SceneStructure,
  style: WritingStyle,
  lastContent: string,
  currentWordCount: number,
  remainingMustInclude: string[]
): GeneratedPrompt {
  const systemPrompt = generateSystemPrompt(project, style);

  const userPrompt = `## 이어쓰기 정보
- 작품: ${project.title} ${volume.volumeNumber}권
- 현재 씬: ${scene.sceneNumber}번 "${scene.title}"
- 현재까지 글자수: ${currentWordCount.toLocaleString()}자 / 목표 ${scene.targetWordCount.toLocaleString()}자

## 마지막으로 쓴 내용 (최근 500자)
"""
${lastContent.slice(-500)}
"""

## 남은 내용
아직 포함하지 않은 내용:
${remainingMustInclude.map((item, i) => `${i + 1}. ${item}`).join('\n')}

## 종료 조건 ⚠️
이 씬은 반드시 다음에서 끝나야 합니다:
"${scene.endCondition}"

## 주의사항
- 위 내용에서 자연스럽게 이어서 쓴다
- 같은 내용을 반복하지 않는다
- 종료 조건에 도달할 때까지 쓴다
- 종료 조건 도달 시 "---"를 쓰고 멈춘다

---
이어서 집필하세요.`;

  return {
    systemPrompt,
    userPrompt,
    metadata: {
      volumeNumber: volume.volumeNumber,
      sceneNumber: scene.sceneNumber,
      targetWordCount: scene.targetWordCount - currentWordCount,
      endCondition: scene.endCondition,
      mode: 'continue',
    },
  };
}

// ============================================
// 유틸리티 함수
// ============================================

/**
 * 권 구조 기본값 생성
 */
export function createDefaultVolumeStructure(
  projectId: string,
  volumeNumber: number
): VolumeStructure {
  return {
    id: crypto.randomUUID(),
    projectId,
    volumeNumber,
    title: `${volumeNumber}권`,
    targetWordCount: 150000, // 기본 15만자
    startPoint: '',
    endPoint: '',
    endPointType: 'scene',
    endPointExact: '',
    coreEvent: '',
    scenes: [],
    status: 'planning',
    actualWordCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * 씬 구조 기본값 생성
 */
export function createDefaultSceneStructure(
  volumeId: string,
  sceneNumber: number
): SceneStructure {
  return {
    id: crypto.randomUUID(),
    volumeId,
    sceneNumber,
    title: `씬 ${sceneNumber}`,
    targetWordCount: 15000, // 기본 1.5만자
    pov: '',
    povType: 'third-limited',
    location: '',
    timeframe: '',
    participants: [],
    mustInclude: [],
    startCondition: '',
    endCondition: '',
    endConditionType: 'scene',
    status: 'pending',
    actualWordCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * 권을 씬으로 자동 분할
 */
export function autoSplitVolumeIntoScenes(
  volume: VolumeStructure,
  sceneCount: number = 10
): SceneStructure[] {
  const targetPerScene = Math.floor(volume.targetWordCount / sceneCount);
  const scenes: SceneStructure[] = [];

  for (let i = 1; i <= sceneCount; i++) {
    scenes.push({
      ...createDefaultSceneStructure(volume.id, i),
      targetWordCount: targetPerScene,
      title: `${volume.volumeNumber}-${i}`,
    });
  }

  return scenes;
}

/**
 * 분량 체크
 */
export function checkWordCount(
  currentCount: number,
  targetCount: number,
  content: string,
  endCondition: string
): {
  percentage: number;
  status: 'under' | 'on_target' | 'over';
  endConditionReached: boolean;
} {
  const percentage = Math.round((currentCount / targetCount) * 100);
  const status = percentage < 90 ? 'under' : percentage > 110 ? 'over' : 'on_target';
  const endConditionReached = content.includes(endCondition) ||
    content.includes('--- ') && content.includes('권 끝 ---');

  return { percentage, status, endConditionReached };
}

/**
 * 프로젝트 진행 상황 계산
 */
export function calculateProjectProgress(
  volumes: VolumeStructure[]
): {
  totalVolumes: number;
  completedVolumes: number;
  totalTargetWordCount: number;
  totalActualWordCount: number;
  overallPercentage: number;
} {
  const totalVolumes = volumes.length;
  const completedVolumes = volumes.filter(v => v.status === 'completed').length;
  const totalTargetWordCount = volumes.reduce((sum, v) => sum + v.targetWordCount, 0);
  const totalActualWordCount = volumes.reduce((sum, v) => sum + v.actualWordCount, 0);
  const overallPercentage = totalTargetWordCount > 0
    ? Math.round((totalActualWordCount / totalTargetWordCount) * 100)
    : 0;

  return {
    totalVolumes,
    completedVolumes,
    totalTargetWordCount,
    totalActualWordCount,
    overallPercentage,
  };
}

/**
 * 종료점 검증
 */
export function validateEndPoint(endPoint: string): {
  isValid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  if (!endPoint || endPoint.trim().length === 0) {
    issues.push('종료점이 비어있습니다');
  }

  if (endPoint.length < 10) {
    issues.push('종료점이 너무 짧습니다. 구체적인 대사나 행동을 명시하세요');
  }

  // 모호한 표현 체크
  const vagueTerms = ['성장한다', '변화한다', '깨닫는다', '결심한다', '시작한다'];
  for (const term of vagueTerms) {
    if (endPoint.includes(term)) {
      issues.push(`"${term}"는 모호합니다. 구체적인 대사나 행동으로 바꾸세요`);
    }
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}

/**
 * 권별 구조 템플릿 생성
 */
export function generateVolumeTemplate(
  projectTitle: string,
  totalVolumes: number,
  volumeSummaries: { title: string; startPoint: string; endPoint: string; coreEvent: string }[]
): string {
  let template = `# ${projectTitle} 권별 구조\n\n`;
  template += `| 권 | 제목 | 시작점 | 종료점 | 핵심 사건 |\n`;
  template += `|----|------|--------|--------|----------|\n`;

  for (let i = 0; i < totalVolumes; i++) {
    const v = volumeSummaries[i] || { title: '', startPoint: '', endPoint: '', coreEvent: '' };
    template += `| ${i + 1}권 | ${v.title} | ${v.startPoint} | ${v.endPoint} | ${v.coreEvent} |\n`;
  }

  return template;
}
