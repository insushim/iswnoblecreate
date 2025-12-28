/**
 * 씬 자동 분할 시스템 v1.0
 *
 * 긴 씬을 여러 개의 작은 "비트(Beat)"로 자동 분할하여
 * AI가 스토리를 압축하지 않고 디테일하게 작성하도록 유도합니다.
 *
 * 핵심 원리:
 * - 하나의 씬 = 여러 개의 비트
 * - 각 비트 = 1500-3000자 (약 1-2분 읽기)
 * - 비트별로 명확한 시작/종료 조건
 * - 시간 점프 완전 차단
 */

import { SceneStructure, Character } from '@/types';
import { generateText } from './gemini';

// ============================================
// 타입 정의
// ============================================

export interface SceneBeat {
  id: string;
  beatNumber: number;
  title: string;
  targetWordCount: number;
  description: string;

  // 비트 범위 (매우 구체적)
  startMoment: string;    // 이 비트가 시작되는 정확한 순간
  endMoment: string;      // 이 비트가 끝나는 정확한 순간
  duration: string;       // 실제 시간 (예: "약 30초", "1-2분")

  // 필수 포함 요소
  mustInclude: string[];  // 반드시 포함할 내용 (1-2개)
  focusOn: string;        // 이 비트의 핵심 포커스

  // 금지 사항
  forbidden: string[];    // 이 비트에서 절대 쓰면 안 되는 것

  // 상태
  status: 'pending' | 'completed';
  actualWordCount: number;
  content?: string;
}

export interface SplitSceneResult {
  originalScene: SceneStructure;
  beats: SceneBeat[];
  totalTargetWordCount: number;
  splitReason: string;
  recommendations: string[];
}

// ============================================
// 씬 분할 분석
// ============================================

/**
 * 씬이 분할이 필요한지 분석합니다.
 */
export function analyzeSceneForSplit(scene: SceneStructure): {
  needsSplit: boolean;
  reason: string;
  recommendedBeatCount: number;
  suggestedBeats: string[];
} {
  const targetWords = scene.targetWordCount || 15000;

  // 분할 기준: 3000자 이상이면 분할 권장
  if (targetWords <= 3000) {
    return {
      needsSplit: false,
      reason: '씬 분량이 적절합니다.',
      recommendedBeatCount: 1,
      suggestedBeats: [],
    };
  }

  // 권장 비트 수 계산 (비트당 2000-3000자)
  const recommendedBeatCount = Math.ceil(targetWords / 2500);

  // 분할 필요 이유 분석
  const reasons: string[] = [];
  if (targetWords > 10000) {
    reasons.push('분량이 매우 많습니다 (10,000자 초과)');
  }
  if (scene.mustInclude.length > 5) {
    reasons.push('포함해야 할 내용이 많습니다');
  }
  if (scene.participants.length > 3) {
    reasons.push('등장인물이 많습니다');
  }

  // 자연스러운 분할 지점 제안
  const suggestedBeats: string[] = [];

  // 기본 분할 패턴: 도입 → 전개 → 전환 → 클라이맥스
  if (recommendedBeatCount >= 4) {
    suggestedBeats.push('도입: 상황 설정, 인물 등장');
    suggestedBeats.push('전개: 대화/행동 시작');
    suggestedBeats.push('고조: 갈등/긴장 상승');
    suggestedBeats.push('클라이맥스: 핵심 순간');
    if (recommendedBeatCount > 4) {
      suggestedBeats.push('여운: 반응, 마무리');
    }
  } else if (recommendedBeatCount === 3) {
    suggestedBeats.push('도입: 상황 설정');
    suggestedBeats.push('전개: 핵심 내용');
    suggestedBeats.push('마무리: 결과/반응');
  } else if (recommendedBeatCount === 2) {
    suggestedBeats.push('전반: 상황과 시작');
    suggestedBeats.push('후반: 전개와 마무리');
  }

  return {
    needsSplit: true,
    reason: reasons.join('. ') || '분량이 많아 분할을 권장합니다.',
    recommendedBeatCount,
    suggestedBeats,
  };
}

// ============================================
// AI 기반 씬 자동 분할
// ============================================

/**
 * AI를 사용하여 씬을 자동으로 비트로 분할합니다.
 */
export async function autoSplitScene(
  apiKey: string,
  scene: SceneStructure,
  characters: Character[],
  previousContext?: string,
  model: string = 'gemini-2.5-pro'
): Promise<SplitSceneResult> {
  const analysis = analyzeSceneForSplit(scene);

  if (!analysis.needsSplit) {
    // 분할 불필요 - 단일 비트로 반환
    return {
      originalScene: scene,
      beats: [{
        id: crypto.randomUUID(),
        beatNumber: 1,
        title: scene.title,
        targetWordCount: scene.targetWordCount,
        description: scene.mustInclude.join(', '),
        startMoment: scene.startCondition,
        endMoment: scene.endCondition,
        duration: '전체',
        mustInclude: scene.mustInclude,
        focusOn: '씬 전체',
        forbidden: ['시간 점프', '장소 이동', '다음 씬 내용'],
        status: 'pending',
        actualWordCount: 0,
      }],
      totalTargetWordCount: scene.targetWordCount,
      splitReason: '분할 불필요',
      recommendations: [],
    };
  }

  // 등장인물 정보 추출
  const characterInfo = characters
    .filter(c => scene.participants.includes(c.id) || scene.participants.includes(c.name))
    .map(c => `${c.name}: ${c.personality.slice(0, 50)}`)
    .join('\n');

  const prompt = `당신은 소설 기획 전문가입니다.

## 씬 정보
- 제목: ${scene.title}
- 장소: ${scene.location}
- 시간대: ${scene.timeframe}
- 시작 상황: ${scene.startCondition}
- 종료 상황: ${scene.endCondition}
- 목표 글자수: ${scene.targetWordCount.toLocaleString()}자
- 등장인물: ${scene.participants.join(', ')}
- 필수 포함: ${scene.mustInclude.join(' / ')}

## 등장인물 성격
${characterInfo || '정보 없음'}

## 이전 맥락
${previousContext || '(첫 씬)'}

## 요청
이 씬을 ${analysis.recommendedBeatCount}개의 "비트"로 분할해주세요.

각 비트는 다음 조건을 만족해야 합니다:
1. 2000-3000자 분량
2. 하나의 연속된 시간/장소에서 진행
3. 명확한 시작/종료 순간
4. 시간 점프 없음 (비트 간 연결은 자연스러운 흐름)

## 응답 형식 (JSON)
{
  "beats": [
    {
      "beatNumber": 1,
      "title": "비트 제목 (간단하게)",
      "targetWordCount": 2500,
      "description": "이 비트에서 일어나는 일 (1-2문장)",
      "startMoment": "정확한 시작 순간 (예: 문이 열리는 순간)",
      "endMoment": "정확한 종료 순간 (예: A가 대답하기 직전)",
      "duration": "실제 경과 시간 (예: 약 1분)",
      "mustInclude": ["필수 포함 1", "필수 포함 2"],
      "focusOn": "이 비트의 핵심 포커스",
      "forbidden": ["금지1", "금지2"]
    }
  ],
  "splitReason": "왜 이렇게 분할했는지 설명",
  "recommendations": ["집필 시 주의사항"]
}

중요:
- 비트 간 시간 점프 금지
- 각 비트의 종료 순간 = 다음 비트의 시작 순간
- mustInclude는 원본 씬의 내용을 적절히 분배
- forbidden에는 "시간 점프", "장소 이동", "다음 비트 내용" 반드시 포함`;

  try {
    const response = await generateText(apiKey, prompt, {
      temperature: 0.7,
      maxTokens: 4096,
      model: model as any,
    });

    // JSON 파싱
    let parsed;
    try {
      let cleanedResponse = response.trim();
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.slice(7);
      }
      if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.slice(3);
      }
      if (cleanedResponse.endsWith('```')) {
        cleanedResponse = cleanedResponse.slice(0, -3);
      }
      parsed = JSON.parse(cleanedResponse.trim());
    } catch {
      console.error('[SceneAutoSplitter] JSON 파싱 실패, 기본 분할 사용');
      return createDefaultSplit(scene, analysis.recommendedBeatCount);
    }

    // 비트 생성
    const beats: SceneBeat[] = parsed.beats.map((b: any, idx: number) => ({
      id: crypto.randomUUID(),
      beatNumber: b.beatNumber || idx + 1,
      title: b.title || `비트 ${idx + 1}`,
      targetWordCount: b.targetWordCount || Math.floor(scene.targetWordCount / analysis.recommendedBeatCount),
      description: b.description || '',
      startMoment: b.startMoment || (idx === 0 ? scene.startCondition : `비트 ${idx} 종료 직후`),
      endMoment: b.endMoment || (idx === parsed.beats.length - 1 ? scene.endCondition : `비트 ${idx + 2} 시작 직전`),
      duration: b.duration || '약 1-2분',
      mustInclude: b.mustInclude || [],
      focusOn: b.focusOn || '',
      forbidden: ['시간 점프', '장소 이동', '다음 비트 내용', ...(b.forbidden || [])],
      status: 'pending' as const,
      actualWordCount: 0,
    }));

    return {
      originalScene: scene,
      beats,
      totalTargetWordCount: beats.reduce((sum, b) => sum + b.targetWordCount, 0),
      splitReason: parsed.splitReason || analysis.reason,
      recommendations: parsed.recommendations || [],
    };
  } catch (error) {
    console.error('[SceneAutoSplitter] AI 분할 실패:', error);
    return createDefaultSplit(scene, analysis.recommendedBeatCount);
  }
}

/**
 * 기본 분할 (AI 실패 시 폴백)
 */
function createDefaultSplit(scene: SceneStructure, beatCount: number): SplitSceneResult {
  const wordPerBeat = Math.floor(scene.targetWordCount / beatCount);
  const beats: SceneBeat[] = [];

  const defaultTitles = ['도입', '전개', '고조', '클라이맥스', '여운'];
  const defaultFocus = ['상황 설정', '핵심 전개', '긴장 고조', '결정적 순간', '반응/마무리'];

  for (let i = 0; i < beatCount; i++) {
    beats.push({
      id: crypto.randomUUID(),
      beatNumber: i + 1,
      title: defaultTitles[i] || `비트 ${i + 1}`,
      targetWordCount: wordPerBeat,
      description: `씬의 ${i + 1}/${beatCount} 부분`,
      startMoment: i === 0 ? scene.startCondition : `비트 ${i} 종료 직후`,
      endMoment: i === beatCount - 1 ? scene.endCondition : `비트 ${i + 2} 시작 직전`,
      duration: `약 ${Math.round(wordPerBeat / 500)}분`,
      mustInclude: scene.mustInclude.slice(
        Math.floor(i * scene.mustInclude.length / beatCount),
        Math.floor((i + 1) * scene.mustInclude.length / beatCount)
      ),
      focusOn: defaultFocus[i] || '내용 전개',
      forbidden: ['시간 점프', '장소 이동', '다음 비트 내용', '요약', '생략'],
      status: 'pending',
      actualWordCount: 0,
    });
  }

  return {
    originalScene: scene,
    beats,
    totalTargetWordCount: wordPerBeat * beatCount,
    splitReason: '기본 분할 적용 (균등 분배)',
    recommendations: [
      '각 비트별로 순서대로 작성하세요',
      '이전 비트 내용을 참조하여 연결하세요',
      '시간 점프 없이 연속적으로 진행하세요',
    ],
  };
}

// ============================================
// 비트별 프롬프트 생성
// ============================================

/**
 * 특정 비트를 위한 집필 프롬프트를 생성합니다.
 */
export function generateBeatPrompt(
  beat: SceneBeat,
  scene: SceneStructure,
  characters: Character[],
  previousBeatContent?: string,
  projectInfo?: { title: string; genre: string[] }
): string {
  const characterInfo = characters
    .filter(c => scene.participants.includes(c.id) || scene.participants.includes(c.name))
    .map(c => {
      let info = `[${c.name}]`;
      info += ` ${c.personality}`;
      if (c.speechPattern?.tone) info += ` / 말투: ${c.speechPattern.tone}`;
      if (c.speechPattern?.catchphrase?.length) info += ` / 입버릇: "${c.speechPattern.catchphrase[0]}"`;
      return info;
    })
    .join('\n');

  return `당신은 한국의 베스트셀러 소설가입니다.

═══════════════════════════════════════════════════════════
🎯 비트 ${beat.beatNumber}: ${beat.title}
═══════════════════════════════════════════════════════════

${projectInfo ? `## 작품: ${projectInfo.title} (${projectInfo.genre.join(', ')})` : ''}

## 씬 정보
- 장소: ${scene.location}
- 시간대: ${scene.timeframe}
- 등장인물: ${scene.participants.join(', ')}

## 등장인물
${characterInfo || '정보 없음'}

## 이 비트의 범위 (매우 중요!!!)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🟢 시작: "${beat.startMoment}"
🔴 종료: "${beat.endMoment}"
⏱️ 실제 경과 시간: ${beat.duration}
📏 목표 글자수: ${beat.targetWordCount.toLocaleString()}자
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 이 비트에서 해야 할 것
- 핵심 포커스: ${beat.focusOn}
${beat.mustInclude.length > 0 ? `- 필수 포함:\n${beat.mustInclude.map(m => `  ✓ ${m}`).join('\n')}` : ''}

## 🚨🚨🚨 절대 금지 (위반 시 재생성!) 🚨🚨🚨
${beat.forbidden.map(f => `❌ ${f}`).join('\n')}
❌ "${beat.endMoment}" 이후 내용 작성 금지
❌ 다음 비트 내용 미리 쓰기 금지
❌ "며칠 후", "시간이 지나" 등 시간 점프 금지
❌ "결국", "마침내" 등 요약 표현 금지
❌ 장소 이동 금지 (${scene.location}에서만)

${previousBeatContent ? `## 이전 비트 마지막 부분 (여기서 이어서!)
"""
${previousBeatContent.slice(-500)}
"""
` : ''}

## 집필 지시
1. "${beat.startMoment}"에서 시작하여
2. "${beat.endMoment}"에서 멈춤
3. 디테일하게, 천천히, 묘사 풍부하게
4. 하나의 연속된 순간만 묘사
5. 캐릭터별 말투 철저히 유지

## 형식
- 문단 들여쓰기 (전각 공백)
- 대화: "대사"
- 마침표로 문장 종료

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
종료 조건: "${beat.endMoment}" 도달 시 즉시 멈춤!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

본문만 출력하세요.`;
}

// ============================================
// 비트 검증
// ============================================

/**
 * 생성된 비트 내용을 검증합니다.
 */
export function validateBeatContent(
  content: string,
  beat: SceneBeat
): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. 글자수 체크
  const wordCount = content.length;
  if (wordCount < beat.targetWordCount * 0.5) {
    errors.push(`글자수 부족: ${wordCount.toLocaleString()}자 (목표: ${beat.targetWordCount.toLocaleString()}자)`);
  } else if (wordCount < beat.targetWordCount * 0.8) {
    warnings.push(`글자수 다소 부족: ${wordCount.toLocaleString()}자`);
  }

  // 2. 시간 점프 감지
  const timeJumpPatterns = [
    '며칠이 지나', '며칠 후', '몇 달이 흘러', '시간이 흘러',
    '다음 날', '이튿날', '일주일 후', '한 달 후',
    '어느덧', '벌써', '세월이', '그로부터',
  ];
  for (const pattern of timeJumpPatterns) {
    if (content.includes(pattern)) {
      errors.push(`시간 점프 감지: "${pattern}"`);
    }
  }

  // 3. 요약 표현 감지
  const summaryPatterns = [
    '결국', '마침내', '드디어', '그래서', '따라서',
    '모든 것이', '문제가 해결', '이렇게 해서',
  ];
  for (const pattern of summaryPatterns) {
    if (content.includes(pattern)) {
      warnings.push(`요약 표현 감지: "${pattern}"`);
    }
  }

  // 4. 반복 패턴 감지 (멀티라인 지원)
  const repetitionPatterns = [
    { pattern: /주먹을 불끈[\s\S]*주먹을 불끈/, msg: '"주먹을 불끈" 반복' },
    { pattern: /눈빛이[\s\S]*변[\s\S]*눈빛이[\s\S]*변/, msg: '"눈빛이 변하다" 반복' },
    { pattern: /각성[\s\S]*각성/, msg: '"각성" 반복' },
    { pattern: /결심[\s\S]*결심/, msg: '"결심" 반복' },
  ];
  for (const { pattern, msg } of repetitionPatterns) {
    if (pattern.test(content)) {
      warnings.push(`반복 감지: ${msg}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// ============================================
// 유틸리티
// ============================================

/**
 * 비트들을 하나의 씬 내용으로 합칩니다.
 */
export function mergeBeatsToScene(beats: SceneBeat[]): string {
  return beats
    .filter(b => b.content)
    .sort((a, b) => a.beatNumber - b.beatNumber)
    .map(b => b.content)
    .join('\n\n');
}

/**
 * 씬의 총 진행률을 계산합니다.
 */
export function calculateSceneProgress(beats: SceneBeat[]): {
  totalWordCount: number;
  completedBeats: number;
  totalBeats: number;
  percentage: number;
} {
  const totalWordCount = beats.reduce((sum, b) => sum + b.actualWordCount, 0);
  const completedBeats = beats.filter(b => b.status === 'completed').length;
  const totalBeats = beats.length;
  const percentage = totalBeats > 0 ? Math.round((completedBeats / totalBeats) * 100) : 0;

  return {
    totalWordCount,
    completedBeats,
    totalBeats,
    percentage,
  };
}
