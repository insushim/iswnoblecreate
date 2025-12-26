/**
 * 소설 집필 프롬프트 생성 시스템 v2.0
 *
 * 모든 기획 데이터를 집필에 반드시 반영하는 강화된 시스템:
 * - 권/씬 단위로 정확한 분량과 종료점
 * - 모든 기획 데이터(캐릭터, 세계관, 플롯, 복선, 갈등) 필수 포함
 * - 스토리 분석 기반 일관성 검증
 * - 역사 교차검증 결과 반영
 * - 캐릭터 상태 추적 (사망/감금 등)
 * - 중복 내용 방지
 * - 베스트셀러 작가 워크플로우 통합
 */

import type {
  VolumeStructure,
  SceneStructure,
  GeneratedPrompt,
  WritingStyle,
  Project,
  Character,
  WorldSetting,
  PlotStructure,
  PlotPoint,
  Subplot,
  Foreshadowing,
  Conflict,
  CharacterConsistencyContext,
} from '@/types';

import {
  generateCharacterStatusSummary,
  generateConsistencyInstructions,
  validateCharacterConsistency,
} from './characterConsistency';

import {
  StoryAnalysisResult,
  generateAnalysisSummaryForPrompt,
} from './storyAnalyzer';

import {
  ResearchSummary,
  generateResearchSummaryForPrompt,
} from './researchValidator';

import {
  DeepCharacterProfile,
  SceneDesign,
  SetupPayoff,
  EmotionalArc,
  WritingGuidelines,
} from './professionalWorkflow';

// ============================================
// 컨텍스트 데이터 타입 정의
// ============================================

export interface FullContext {
  project: Project;
  characters: Character[];
  worldSettings: WorldSetting[];
  plotStructure: PlotStructure | null;
  foreshadowings: Foreshadowing[];
  conflicts: Conflict[];
  consistencyContext?: CharacterConsistencyContext;

  // 강화된 컨텍스트 (v2.0)
  storyAnalysis?: StoryAnalysisResult;
  researchSummary?: ResearchSummary;
  deepCharacterProfiles?: DeepCharacterProfile[];
  sceneDesign?: SceneDesign;
  setupPayoffs?: SetupPayoff[];
  emotionalArcs?: EmotionalArc[];
  writingGuidelines?: WritingGuidelines;
}

// ============================================
// 캐릭터 정보 생성 (심화)
// ============================================

function generateCharacterInfo(characters: Character[], detailed: boolean = false): string {
  if (characters.length === 0) return '등장인물 정보 없음';

  return characters.map(c => {
    const roleMap: Record<string, string> = {
      'protagonist': '주인공',
      'antagonist': '적대자',
      'deuteragonist': '조연주인공',
      'supporting': '조연',
      'minor': '단역',
      'mentioned': '언급만',
    };

    let info = `### ${c.name} (${roleMap[c.role] || c.role})`;

    if (c.fullName && c.fullName !== c.name) {
      info += `\n- 본명: ${c.fullName}`;
    }
    if (c.nickname && c.nickname.length > 0) {
      info += `\n- 별명: ${c.nickname.join(', ')}`;
    }

    info += `\n- 나이: ${c.age}${c.gender ? `, ${c.gender}` : ''}`;

    if (c.occupation) {
      info += `\n- 직업: ${c.occupation}`;
    }

    // 성격 정보
    info += `\n- 성격: ${c.personality}`;

    if (detailed) {
      if (c.mbti) info += `\n- MBTI: ${c.mbti}`;
      if (c.enneagram) info += `\n- 에니어그램: ${c.enneagram}`;
    }

    // 외모
    if (c.appearance) {
      info += `\n- 외모: ${c.appearance.slice(0, 150)}`;
    }

    // 배경 (핵심!)
    if (c.background) {
      info += `\n- 배경: ${c.background.slice(0, 200)}`;
    }

    // 동기와 목표 (핵심!)
    if (c.motivation) {
      info += `\n- 동기: ${c.motivation}`;
    }
    if (c.goal) {
      info += `\n- 목표: ${c.goal}`;
    }
    if (c.internalGoal) {
      info += `\n- 내적 목표: ${c.internalGoal}`;
    }

    // 두려움, 비밀, 거짓말 (핵심!)
    if (c.fear) {
      info += `\n- 두려움: ${c.fear}`;
    }
    if (c.secret) {
      info += `\n- 비밀: ${c.secret}`;
    }
    if (c.lie) {
      info += `\n- 믿는 거짓말: ${c.lie}`;
    }

    // 강점/약점
    if (c.strengths && c.strengths.length > 0) {
      info += `\n- 강점: ${c.strengths.join(', ')}`;
    }
    if (c.weaknesses && c.weaknesses.length > 0) {
      info += `\n- 약점: ${c.weaknesses.join(', ')}`;
    }

    // 말투 패턴 (대화 생성에 중요!)
    if (c.speechPattern) {
      const sp = c.speechPattern;
      info += `\n- 말투: `;
      if (sp.tone) info += `${sp.tone}, `;
      if (sp.formalityLevel) info += `경어 ${sp.formalityLevel}/5, `;
      if (sp.speechSpeed) info += `${sp.speechSpeed}, `;
      if (sp.vocabularyLevel) info += `어휘 ${sp.vocabularyLevel}`;
      if (sp.catchphrase && sp.catchphrase.length > 0) {
        info += `\n- 입버릇: "${sp.catchphrase.join('", "')}"`;
      }
      if (sp.avoidWords && sp.avoidWords.length > 0) {
        info += `\n- 안 쓰는 말: ${sp.avoidWords.join(', ')}`;
      }
    }

    // 캐릭터 아크
    if (c.arc) {
      const arcTypeMap: Record<string, string> = {
        'positive': '긍정적 변화',
        'negative': '부정적 변화',
        'flat': '변화 없음',
        'corruption': '타락',
        'disillusionment': '환멸',
      };
      info += `\n- 캐릭터 아크: ${arcTypeMap[c.arc.type] || c.arc.type}`;
      info += `\n  - 시작 상태: ${c.arc.startingState}`;
      info += `\n  - 종료 상태: ${c.arc.endingState}`;
      if (c.arc.transformationTrigger) {
        info += `\n  - 변화 계기: ${c.arc.transformationTrigger}`;
      }
    }

    // 관계 정보
    if (c.relationships && c.relationships.length > 0) {
      info += `\n- 관계:`;
      c.relationships.slice(0, 5).forEach(rel => {
        const relTypeMap: Record<string, string> = {
          'family': '가족',
          'friend': '친구',
          'rival': '라이벌',
          'love': '연인',
          'enemy': '적',
          'colleague': '동료',
          'mentor': '스승',
          'student': '제자',
        };
        info += `\n  - ${rel.targetId}: ${relTypeMap[rel.type] || rel.type}${rel.description ? ` (${rel.description.slice(0, 50)})` : ''}`;
      });
    }

    return info;
  }).join('\n\n');
}

// ============================================
// 세계관 정보 생성 (중요도 기반)
// ============================================

function generateWorldInfo(worldSettings: WorldSetting[]): string {
  if (worldSettings.length === 0) return '세계관 설정 없음';

  // 중요도별 정렬: core > major > minor
  const importanceOrder = { 'core': 0, 'major': 1, 'minor': 2 };
  const sorted = [...worldSettings].sort((a, b) =>
    (importanceOrder[a.importance] || 2) - (importanceOrder[b.importance] || 2)
  );

  const categoryMap: Record<string, string> = {
    'time': '시대/시간',
    'space': '공간/지리',
    'society': '사회 구조',
    'culture': '문화/풍습',
    'economy': '경제 체계',
    'politics': '정치 체제',
    'religion': '종교/신앙',
    'technology': '기술 수준',
    'magic': '마법/초자연',
    'nature': '자연환경',
    'history': '역사',
    'language': '언어',
    'custom': '기타',
  };

  const importanceMap: Record<string, string> = {
    'core': '★핵심',
    'major': '●주요',
    'minor': '○부가',
  };

  return sorted.map(w => {
    let info = `### [${categoryMap[w.category] || w.category}] ${w.title} (${importanceMap[w.importance] || '○'})`;
    info += `\n${w.description}`;

    // 상세 정보가 있으면 추가 (Record<string, string> 형태)
    if (w.details && Object.keys(w.details).length > 0) {
      const detailEntries = Object.entries(w.details)
        .filter(([_, v]) => v && v.length > 0)
        .slice(0, 3);
      if (detailEntries.length > 0) {
        info += `\n상세:`;
        detailEntries.forEach(([key, value]) => {
          info += `\n  - ${key}: ${value.slice(0, 80)}`;
        });
      }
    }

    return info;
  }).join('\n\n');
}

// ============================================
// 플롯 정보 생성
// ============================================

function generatePlotInfo(plotStructure: PlotStructure | null): string {
  if (!plotStructure) return '플롯 구조 없음';

  let info = `## 플롯 구조 (${plotStructure.template})\n`;

  // 플롯 포인트
  if (plotStructure.plotPoints && plotStructure.plotPoints.length > 0) {
    info += '\n### 주요 플롯 포인트\n';
    const sorted = [...plotStructure.plotPoints].sort((a, b) => a.order - b.order);

    const typeMap: Record<string, string> = {
      'opening': '오프닝',
      'inciting-incident': '사건 발단',
      'first-plot-point': '첫 번째 전환점',
      'rising-action': '상승 행동',
      'midpoint': '중간점',
      'second-plot-point': '두 번째 전환점',
      'climax': '클라이맥스',
      'resolution': '결말',
      'custom': '사용자 정의',
    };

    sorted.forEach((p, i) => {
      info += `${i + 1}. [${typeMap[p.type] || p.type}] ${p.title}${p.completed ? ' ✓' : ''}\n`;
      info += `   ${p.description}\n`;
    });
  }

  // 서브플롯
  if (plotStructure.subplots && plotStructure.subplots.length > 0) {
    info += '\n### 서브플롯\n';

    const typeMap: Record<string, string> = {
      'romance': '로맨스',
      'mystery': '미스터리',
      'character-growth': '캐릭터 성장',
      'theme': '주제',
      'comic-relief': '코믹 릴리프',
      'other': '기타',
    };

    plotStructure.subplots.forEach((sp, i) => {
      info += `${i + 1}. [${typeMap[sp.type] || sp.type}] ${sp.title} (${sp.status})\n`;
      info += `   ${sp.description}\n`;
      info += `   메인 플롯과의 연결: ${sp.connectionToMain}\n`;
      if (sp.mainCharacters && sp.mainCharacters.length > 0) {
        info += `   관련 캐릭터: ${sp.mainCharacters.join(', ')}\n`;
      }
    });
  }

  return info;
}

// ============================================
// 복선 정보 생성
// ============================================

function generateForeshadowingInfo(foreshadowings: Foreshadowing[]): string {
  if (foreshadowings.length === 0) return '';

  // 중요도별 정렬
  const priorityOrder = { 'critical': 0, 'major': 1, 'minor': 2 };
  const sorted = [...foreshadowings].sort((a, b) =>
    (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2)
  );

  let info = '## 복선 (⚠️ 자연스럽게 심어야 함)\n';

  const typeMap: Record<string, string> = {
    'hint': '힌트',
    'symbol': '상징',
    'prophecy': '예언',
    'setup': '설정',
    'red-herring': '페이크',
  };

  const priorityMap: Record<string, string> = {
    'critical': '★필수',
    'major': '●중요',
    'minor': '○선택',
  };

  sorted.forEach((f, i) => {
    info += `\n${i + 1}. [${typeMap[f.type] || f.type}] ${f.title} (${priorityMap[f.priority]})\n`;
    info += `   ${f.description}\n`;
    info += `   심는 방법: ${f.plantedMethod}\n`;
    if (f.status === 'planted' || f.status === 'reinforced') {
      info += `   상태: 아직 회수 안 됨\n`;
    }
    if (f.relatedCharacters && f.relatedCharacters.length > 0) {
      info += `   관련 캐릭터: ${f.relatedCharacters.join(', ')}\n`;
    }
  });

  return info;
}

// ============================================
// 갈등 정보 생성
// ============================================

function generateConflictInfo(conflicts: Conflict[]): string {
  if (conflicts.length === 0) return '';

  // 강도별 정렬
  const sorted = [...conflicts].sort((a, b) => b.intensity - a.intensity);

  let info = '## 갈등 구조\n';

  const typeMap: Record<string, string> = {
    'internal': '내적 갈등',
    'interpersonal': '대인 갈등',
    'societal': '사회적 갈등',
    'environmental': '환경적 갈등',
    'supernatural': '초자연적 갈등',
    'technological': '기술적 갈등',
  };

  const statusMap: Record<string, string> = {
    'brewing': '잠복',
    'active': '진행 중',
    'escalating': '격화 중',
    'climax': '절정',
    'resolved': '해결됨',
    'abandoned': '포기됨',
  };

  sorted.forEach((c, i) => {
    info += `\n${i + 1}. [${typeMap[c.type] || c.type}] ${c.title} (강도: ${c.intensity}/10, ${statusMap[c.status]})\n`;
    info += `   ${c.description}\n`;
    info += `   위험 요소: ${c.stakes}\n`;
    if (c.involvedCharacters && c.involvedCharacters.length > 0) {
      info += `   관련 캐릭터: ${c.involvedCharacters.join(', ')}\n`;
    }
    if (c.escalations && c.escalations.length > 0) {
      info += `   에스컬레이션 단계: ${c.escalations.length}단계\n`;
    }
  });

  return info;
}

// ============================================
// 시스템 프롬프트 생성
// ============================================

export function generateSystemPrompt(
  project: Project,
  style: WritingStyle,
  options?: {
    storyAnalysis?: StoryAnalysisResult;
    researchSummary?: ResearchSummary;
    writingGuidelines?: WritingGuidelines;
    emotionalArc?: EmotionalArc;
  }
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

  let systemPrompt = `당신은 한국의 베스트셀러 소설가입니다. 아래 규칙을 철저히 따라 소설을 집필하세요.

## 작품 정보
- 작품명: ${project.title}
- 장르: ${project.genre.join(', ')}
- 컨셉: ${project.concept}
- 로그라인: ${project.logline}
${project.synopsis ? `- 시놉시스: ${project.synopsis}` : ''}

## 문체 설정
- 시점: ${perspectiveMap[style.perspective]}
- 시제: ${tenseMap[style.tense]}
- 대사 비율: ${style.dialogueRatio}%
- 묘사 상세도: ${style.descriptionDetail}/10
- 페이싱: ${pacingMap[style.pacing]}
- 감정 강도: ${style.emotionIntensity}/10
${style.additionalInstructions ? `- 추가 지시: ${style.additionalInstructions}` : ''}`;

  // 집필 가이드라인 추가 (v2.0)
  if (options?.writingGuidelines) {
    const wg = options.writingGuidelines;
    systemPrompt += `

## 📝 집필 가이드라인 (기획 반영)
### 문체
${wg.style.toneDescriptions.map(t => `- ${t}`).join('\n')}
- 문장 길이: ${wg.style.sentenceLength}
- 대화 스타일: ${wg.style.dialogueStyle}
- 묘사 깊이: ${wg.style.descriptionDepth}
- 페이싱: ${wg.style.pacingGuidelines}

### 씬 작성 규칙
- 오프닝 훅: ${wg.sceneGuidelines.openingHook}
- 긴장감 구축: ${wg.sceneGuidelines.tensionBuilding}
- 대화 비율: ${wg.sceneGuidelines.dialogueBalance}
- 클로징 훅: ${wg.sceneGuidelines.closingHook}

### 금지 사항
${wg.avoidList.map(a => `- ❌ ${a}`).join('\n')}

### 필수 사항
${wg.mustIncludeList.map(m => `- ✅ ${m}`).join('\n')}`;
  }

  // 감정선 가이드 추가
  if (options?.emotionalArc) {
    const ea = options.emotionalArc;
    systemPrompt += `

## 🎭 이 권의 감정선
- 테마: ${ea.emotionalTheme}
- 시작 분위기: ${ea.startingMood}
- 종료 분위기: ${ea.endingMood}
- 독자 경험 목표: ${ea.readerExperience}`;
  }

  // 역사 자료 검증 결과 추가
  if (options?.researchSummary) {
    systemPrompt += `

## 📚 역사적 사실 (교차검증 완료)
${generateResearchSummaryForPrompt(options.researchSummary)}`;
  }

  // 스토리 분석 결과 추가
  if (options?.storyAnalysis) {
    // 사망/감금 캐릭터 명시
    const deadChars = options.storyAnalysis.characterStates.filter(c => c.status === 'dead');
    const imprisonedChars = options.storyAnalysis.characterStates.filter(c => c.status === 'imprisoned');

    if (deadChars.length > 0 || imprisonedChars.length > 0) {
      systemPrompt += `

## 🚨 캐릭터 상태 경고
`;
      if (deadChars.length > 0) {
        systemPrompt += `### 💀 사망한 캐릭터 (절대 현재 시점에서 활동 불가!)
${deadChars.map(c => `- ${c.characterName}: 사망 (${c.lastSeenVolume}권 ${c.lastSeenScene}씬) - 회상/언급만 가능`).join('\n')}
`;
      }
      if (imprisonedChars.length > 0) {
        systemPrompt += `### 🔒 감금/제한된 캐릭터
${imprisonedChars.map(c => `- ${c.characterName}: ${c.lastSeenLocation}에서만 등장 가능`).join('\n')}
`;
      }
    }
  }

  systemPrompt += `

## ⚠️ 절대 규칙 (최우선 순위)

### 🚫 절대 금지 - 위반 시 생성 실패
1. 🛑 **종료 조건 도달 시 즉시 중단**: 종료 조건에 해당하는 장면/대사가 나오면 "---"를 쓰고 멈춤
2. 🛑 **다음 씬/권 내용 작성 금지**: 현재 씬/권의 종료점 이후 내용은 절대 쓰지 않음
3. 🛑 **스토리 점프 금지**: 갑자기 며칠/몇 달이 지나거나, 주요 사건을 건너뛰는 것 금지
4. 🛑 **결말 암시 금지**: 현재 씬에서 작품 전체의 결말이나 해결을 암시하지 않음

### ⏱️ 페이싱 규칙 (매우 중요!)
5. **하나의 씬 = 하나의 상황**: 씬 안에서 시간이 크게 점프하거나 장소가 바뀌면 안 됨
6. **디테일하게 천천히**: 각 행동, 대화, 감정을 상세히 묘사 (요약하지 말 것!)
7. **현재 순간에 집중**: "그 후로 며칠이 지나..." 같은 표현 금지
8. **씬 목표만 달성**: 씬에 주어진 endCondition 외의 다른 목표를 달성하려 하지 않음

### 🔄 반복 방지 규칙
9. **동일 패턴 금지**: 각성-힘획득-결심의 반복 패턴 금지
10. **유사 대사 금지**: 이전에 나온 대사와 비슷한 대사 금지
11. **유사 묘사 금지**: 이전에 나온 장면과 비슷한 장면 금지

### 📝 기타 규칙
12. 한국어로 작성
13. 캐릭터의 말투와 성격 일관되게 유지
14. 복선은 자연스럽게 심기 (노골적 금지)
15. 갈등 강도 적절히 조절
16. 💀 사망한 캐릭터는 현재 시점에서 행동/대화 불가 (회상/언급만)
17. 🔒 감금된 캐릭터는 해당 장소에서만 등장
18. ⚠️ 캐릭터 상태 변화는 명확히 표시
19. 📚 역사물은 검증된 역사적 사실만 사용

### 📏 분량 체크
- 목표 분량의 90%까지는 종료 조건에 도달하지 않음
- 분량이 남아도 종료 조건 도달 시 멈춤
- 분량이 모자라면 디테일을 추가 (새로운 사건 추가 금지)`;

  return systemPrompt;
}

// ============================================
// 권(Volume) 단위 프롬프트 생성 (완전 개선)
// ============================================

export function generateVolumePrompt(
  project: Project,
  volume: VolumeStructure,
  style: WritingStyle,
  characters: Character[],
  worldSettings: WorldSetting[],
  plotStructure: PlotStructure | null,
  foreshadowings: Foreshadowing[],
  conflicts: Conflict[],
  previousVolumeSummary?: string,
  consistencyContext?: CharacterConsistencyContext,
  // 강화된 옵션 (v2.0)
  enhancedOptions?: {
    storyAnalysis?: StoryAnalysisResult;
    researchSummary?: ResearchSummary;
    deepCharacterProfiles?: DeepCharacterProfile[];
    setupPayoffs?: SetupPayoff[];
    emotionalArc?: EmotionalArc;
    writingGuidelines?: WritingGuidelines;
  }
): GeneratedPrompt {
  const systemPrompt = generateSystemPrompt(project, style, {
    storyAnalysis: enhancedOptions?.storyAnalysis,
    researchSummary: enhancedOptions?.researchSummary,
    writingGuidelines: enhancedOptions?.writingGuidelines,
    emotionalArc: enhancedOptions?.emotionalArc,
  });

  // 캐릭터 정보 (심화)
  const characterInfo = generateCharacterInfo(characters, true);

  // 세계관 정보 (중요도 기반)
  const worldInfo = generateWorldInfo(worldSettings);

  // 플롯 정보
  const plotInfo = generatePlotInfo(plotStructure);

  // 복선 정보
  const foreshadowingInfo = generateForeshadowingInfo(foreshadowings);

  // 갈등 정보
  const conflictInfo = generateConflictInfo(conflicts);

  // 씬 목록
  const sceneList = volume.scenes
    .map((s, i) => {
      let sceneInfo = `${i + 1}. ${s.title} (${s.targetWordCount.toLocaleString()}자)`;
      if (s.pov) sceneInfo += ` [POV: ${s.pov}]`;
      if (s.location) sceneInfo += ` @ ${s.location}`;
      if (s.mustInclude && s.mustInclude.length > 0) {
        sceneInfo += `\n   필수: ${s.mustInclude.join(', ')}`;
      }
      if (s.endCondition) {
        sceneInfo += `\n   종료: ${s.endCondition}`;
      }
      return sceneInfo;
    })
    .join('\n');

  // 캐릭터 일관성 정보 생성
  const consistencyInfo = consistencyContext
    ? generateCharacterStatusSummary(consistencyContext, characters) +
      generateConsistencyInstructions(consistencyContext)
    : '';

  // 스토리 분석 결과 추가 (v2.0)
  const storyAnalysisInfo = enhancedOptions?.storyAnalysis
    ? generateAnalysisSummaryForPrompt(
        enhancedOptions.storyAnalysis,
        volume.volumeNumber,
        1
      )
    : '';

  // 심층 캐릭터 프로필 정보 추가 (v2.0)
  let deepProfileInfo = '';
  if (enhancedOptions?.deepCharacterProfiles && enhancedOptions.deepCharacterProfiles.length > 0) {
    deepProfileInfo = `\n## 🎭 캐릭터 심층 프로필\n`;
    for (const profile of enhancedOptions.deepCharacterProfiles.slice(0, 5)) {
      deepProfileInfo += `### ${profile.name} (${profile.role})
- 핵심 상처: ${profile.psychology.coreWound}
- 믿는 거짓: ${profile.psychology.lie}
- 깨달을 진실: ${profile.psychology.truth}
- 외적 목표(want): ${profile.psychology.want}
- 내적 필요(need): ${profile.psychology.need}
- 가장 큰 두려움: ${profile.psychology.fear}
- 말투: ${profile.voice.speechPatterns.slice(0, 3).join(', ')}
- 입버릇: ${profile.voice.catchPhrases.slice(0, 2).join(', ')}

`;
    }
  }

  // 복선/페이백 추적 정보 (v2.0)
  let setupPayoffInfo = '';
  if (enhancedOptions?.setupPayoffs && enhancedOptions.setupPayoffs.length > 0) {
    const relevantPayoffs = enhancedOptions.setupPayoffs.filter(
      sp => sp.setup.volume <= volume.volumeNumber &&
            (!sp.payoff.completed || sp.payoff.plannedVolume === volume.volumeNumber)
    );
    if (relevantPayoffs.length > 0) {
      setupPayoffInfo = `\n## 🎯 복선/페이백 관리\n`;
      setupPayoffInfo += `### 이번 권에서 심어야 할 복선\n`;
      const toPlant = relevantPayoffs.filter(sp => sp.setup.volume === volume.volumeNumber);
      for (const sp of toPlant) {
        setupPayoffInfo += `- ${sp.setup.description} (방법: ${sp.setup.method}, 미묘함: ${sp.setup.subtlety}/10)\n`;
      }
      setupPayoffInfo += `\n### 이번 권에서 해소할 복선\n`;
      const toResolve = relevantPayoffs.filter(sp => sp.payoff.plannedVolume === volume.volumeNumber && !sp.payoff.completed);
      for (const sp of toResolve) {
        setupPayoffInfo += `- ${sp.payoff.description} (감정적 임팩트: ${sp.payoff.emotionalImpact})\n`;
      }
    }
  }

  const userPrompt = `## 현재 집필: ${volume.volumeNumber}권 "${volume.title}"
목표 글자수: ${volume.targetWordCount.toLocaleString()}자

${consistencyInfo}
${storyAnalysisInfo}

## 🚨🚨🚨 종료점 (최우선 준수!) 🚨🚨🚨
이 권은 반드시 다음 조건에서 끝나야 합니다:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🛑 종료점: "${volume.endPoint}"
🛑 종료 유형: ${volume.endPointType === 'dialogue' ? '대사' : volume.endPointType === 'action' ? '행동' : '서술'}
🛑 정확한 종료: "${volume.endPointExact}"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### 🚫 절대 금지:
1. 종료점 이후 내용 작성 금지
2. 다음 권 내용 작성 금지
3. 임진왜란 등 주요 사건 급하게 마무리 금지
4. 시간 점프로 사건 건너뛰기 금지

### ✅ 종료점 도달 시:
1. 위 종료점에 해당하는 장면/대사 작성
2. "--- ${volume.volumeNumber}권 끝 ---" 작성
3. 즉시 멈춤 (이후 아무것도 쓰지 않음)

### ⏱️ 페이싱 주의:
- 각 씬별 목표 분량을 지키세요
- 급하게 진행하지 마세요 (디테일하게!)
- 하나의 씬 = 하나의 상황

${previousVolumeSummary ? `## 이전 권 요약\n${previousVolumeSummary}\n` : ''}

## 이 권의 스토리
- 시작: ${volume.startPoint}
- 핵심 사건: ${volume.coreEvent}
- 종료: ${volume.endPoint}

## 씬 구성 (순서대로 집필)
${sceneList}

---

## 등장인물 정보
${characterInfo}
${deepProfileInfo}

---

## 세계관 설정
${worldInfo}

---

${plotInfo}

---

${foreshadowingInfo}
${setupPayoffInfo}

---

${conflictInfo}

---

${volume.nextVolumePreview ? `## 다음 권 예고 (참고만, 절대 쓰지 말 것!)\n${volume.nextVolumePreview}\n` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 🎯 필수 체크리스트 (집필 전 확인!)

### 페이싱 (가장 중요!)
- [ ] 이 권은 "${volume.endPoint}"에서 끝나야 함
- [ ] 각 씬은 하나의 상황만 다루기
- [ ] 시간 점프 금지 (며칠 후, 몇 달 후 등)
- [ ] 급하게 진행하지 않기 (디테일하게!)

### 내용
- [ ] 위 모든 설정(캐릭터 프로필, 복선, 갈등) 반영
- [ ] 사망/감금된 캐릭터 상태 준수
- [ ] 이전 씬과 중복되는 내용 금지
- [ ] 역사물인 경우 검증된 사실만 사용
- [ ] 캐릭터별 말투와 입버릇 유지

### 반복 방지
- [ ] 각성/깨달음 장면 반복 금지
- [ ] 힘을 얻는 장면 반복 금지
- [ ] 결심하는 장면 반복 금지
- [ ] 유사한 대화/묘사 반복 금지
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚨 핵심 지시:
1. 씬별 목표 분량 준수 (급하게 진행 금지!)
2. 종료점: "${volume.endPointExact}" 도달 시 즉시 멈춤
3. 디테일하게 천천히 진행 (요약하지 말 것!)

${volume.volumeNumber}권을 집필하세요.
첫 번째 씬부터 시작합니다.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

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
// 씬(Scene) 단위 프롬프트 생성 (완전 개선)
// ============================================

export function generateScenePrompt(
  project: Project,
  volume: VolumeStructure,
  scene: SceneStructure,
  style: WritingStyle,
  characters: Character[],
  worldSettings: WorldSetting[],
  plotStructure: PlotStructure | null,
  foreshadowings: Foreshadowing[],
  conflicts: Conflict[],
  previousSceneSummary?: string,
  consistencyContext?: CharacterConsistencyContext,
  // 강화된 옵션 (v2.0)
  enhancedOptions?: {
    storyAnalysis?: StoryAnalysisResult;
    researchSummary?: ResearchSummary;
    deepCharacterProfiles?: DeepCharacterProfile[];
    sceneDesign?: SceneDesign;
    setupPayoffs?: SetupPayoff[];
    emotionalArc?: EmotionalArc;
    writingGuidelines?: WritingGuidelines;
  }
): GeneratedPrompt {
  const systemPrompt = generateSystemPrompt(project, style, {
    storyAnalysis: enhancedOptions?.storyAnalysis,
    researchSummary: enhancedOptions?.researchSummary,
    writingGuidelines: enhancedOptions?.writingGuidelines,
    emotionalArc: enhancedOptions?.emotionalArc,
  });

  // 해당 씬 등장인물만 필터 (심화 정보 포함)
  const sceneCharacters = characters.filter(c =>
    scene.participants.includes(c.id) || scene.participants.includes(c.name)
  );
  const characterInfo = generateCharacterInfo(
    sceneCharacters.length > 0 ? sceneCharacters : characters.slice(0, 5),
    true
  );

  // 세계관 정보 (핵심만)
  const coreWorldSettings = worldSettings.filter(w => w.importance === 'core' || w.importance === 'major');
  const worldInfo = generateWorldInfo(coreWorldSettings.length > 0 ? coreWorldSettings : worldSettings.slice(0, 5));

  // 이 씬에 관련된 복선 필터
  const relatedForeshadowings = foreshadowings.filter(f =>
    f.status === 'planted' || f.status === 'reinforced'
  );
  const foreshadowingInfo = generateForeshadowingInfo(relatedForeshadowings);

  // 활성 갈등만
  const activeConflicts = conflicts.filter(c =>
    c.status === 'active' || c.status === 'escalating' || c.status === 'climax'
  );
  const conflictInfo = generateConflictInfo(activeConflicts);

  // 필수 포함 내용
  const mustIncludeList = scene.mustInclude
    .map((item, i) => `${i + 1}. ${item}`)
    .join('\n');

  const povTypeMap = {
    'first': '1인칭',
    'third-limited': '3인칭 제한',
    'omniscient': '전지적',
  };

  // 캐릭터 일관성 정보 생성
  const consistencyInfo = consistencyContext
    ? generateConsistencyInstructions(consistencyContext)
    : '';

  // 스토리 분석 결과 추가 (v2.0)
  const storyAnalysisInfo = enhancedOptions?.storyAnalysis
    ? generateAnalysisSummaryForPrompt(
        enhancedOptions.storyAnalysis,
        volume.volumeNumber,
        scene.sceneNumber
      )
    : '';

  // 씬 비트 설계 정보 추가 (v2.0)
  let sceneDesignInfo = '';
  if (enhancedOptions?.sceneDesign) {
    const sd = enhancedOptions.sceneDesign;
    sceneDesignInfo = `\n## 🎬 씬 비트 설계
- 목적: ${sd.purpose}
- 감정 목표: ${sd.emotionalGoal}
- 긴장 곡선: ${sd.tensionCurve.join(' → ')}

### 비트 구성
${sd.beats.slice(0, 10).map(b => `${b.beatNumber}. [${b.type}] ${b.description} (긴장: ${b.tension}/10)
   ${b.dialogueSample ? `   대사 예시: "${b.dialogueSample}"` : ''}`).join('\n')}

### 필수 대사
${sd.mustInclude.dialogues.map(d => `- ${d.speaker}: "${d.essence}"`).join('\n')}

### 필수 행동
${sd.mustInclude.actions.map(a => `- ${a}`).join('\n')}

### 이번 씬의 복선
${sd.mustInclude.foreshadowings.map(f => `- ${f}`).join('\n')}

### 금지 사항
${sd.avoid.map(a => `- ❌ ${a}`).join('\n')}

### 훅
- 이전 씬에서 넘어오는 훅: ${sd.hookFromPrevious}
- 다음 씬으로 이어지는 훅: ${sd.hookToNext}
`;
  }

  // 심층 캐릭터 프로필 정보 (이 씬 등장인물만)
  let deepProfileInfo = '';
  if (enhancedOptions?.deepCharacterProfiles && enhancedOptions.deepCharacterProfiles.length > 0) {
    const sceneProfiles = enhancedOptions.deepCharacterProfiles.filter(
      p => scene.participants.includes(p.name) || sceneCharacters.some(c => c.name === p.name)
    );
    if (sceneProfiles.length > 0) {
      deepProfileInfo = `\n### 🎭 등장인물 심층 프로필\n`;
      for (const profile of sceneProfiles) {
        deepProfileInfo += `**${profile.name}**
- 이 씬에서의 내면: ${profile.psychology.lie} → ${profile.psychology.truth}로 향하는 여정 중
- 말투: ${profile.voice.speechPatterns.slice(0, 2).join(', ')}
- 입버릇: "${profile.voice.catchPhrases[0] || ''}"
- 주의: ${profile.voice.avoidWords.slice(0, 2).join(', ')} 표현 금지

`;
      }
    }
  }

  const userPrompt = `## 현재 집필 정보
- 작품: ${project.title} ${volume.volumeNumber}권
- 현재 씬: ${scene.sceneNumber}번 "${scene.title}"
- 목표 글자수: ${scene.targetWordCount.toLocaleString()}자

${consistencyInfo}
${storyAnalysisInfo}
${sceneDesignInfo}

## 씬 설정
- 시점(POV): ${scene.pov} (${povTypeMap[scene.povType] || '3인칭 제한'})
- 장소: ${scene.location || '미정'}
- 시간: ${scene.timeframe || '미정'}

## 🚨🚨🚨 종료 조건 (최우선!) 🚨🚨🚨
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🛑 이 씬은 다음 조건에서 반드시 끝납니다:
"${scene.endCondition}"
종료 유형: ${scene.endConditionType === 'dialogue' ? '대사' : scene.endConditionType === 'action' ? '행동' : '서술'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### 🛑 절대 금지 사항:
1. 이 종료 조건 이후의 내용을 작성하지 마세요
2. 다음 씬의 내용을 미리 작성하지 마세요
3. 갑자기 시간이 점프하거나 장소가 바뀌지 마세요
4. 이 씬에서 전체 스토리가 해결되는 것처럼 쓰지 마세요

### ✅ 종료 조건 도달 시:
1. 위 종료 조건에 해당하는 장면/대사를 작성
2. 그 직후 "---"를 쓰고 즉시 멈춤
3. 이후 아무것도 쓰지 않음

## 시작 상황
${scene.startCondition || '이전 씬에서 자연스럽게 이어짐'}

## 이 씬에서 반드시 포함할 내용
${mustIncludeList || '특별한 필수 내용 없음'}

${previousSceneSummary ? `## 직전 씬 요약\n${previousSceneSummary}\n` : ''}

---

## 등장인물
${characterInfo}
${deepProfileInfo}

---

## 세계관 (참고)
${worldInfo}

---

${foreshadowingInfo ? foreshadowingInfo + '\n---\n' : ''}

${conflictInfo ? conflictInfo + '\n---\n' : ''}

${scene.nextScenePreview ? `## 다음 씬 예고 (참고만, 절대 쓰지 말 것!)\n${scene.nextScenePreview}\n` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 🎯 필수 체크리스트 (집필 전 확인!)

### 페이싱 (가장 중요!)
- [ ] 이 씬은 "${scene.endCondition}"에서 끝나야 함
- [ ] 이 씬 안에서 시간 점프 없음 (며칠 후, 몇 달 후 등 금지)
- [ ] 이 씬 안에서 장소 변경 없음
- [ ] 하나의 상황만 다루기 (여러 사건 금지)

### 내용
- [ ] 위 씬 비트 설계를 따라 집필
- [ ] 캐릭터별 말투와 입버릇 반드시 반영
- [ ] 사망/감금된 캐릭터 등장 금지
- [ ] 이전 씬과 중복되는 장면/대사 금지
- [ ] 복선은 자연스럽게 배치

### 반복 방지
- [ ] 각성/깨달음 장면 반복 금지
- [ ] 힘을 얻는 장면 반복 금지
- [ ] 결심하는 장면 반복 금지
- [ ] 이전에 한 대화와 비슷한 대화 금지
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚨 핵심 지시:
1. 이 씬은 "${scene.endCondition}"까지만 작성
2. 디테일하게 천천히 (요약하지 말고 상세히!)
3. 종료 조건 도달 시 "---" 쓰고 즉시 멈춤
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

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
// 이어쓰기 프롬프트 생성 (개선)
// ============================================

export function generateContinuePrompt(
  project: Project,
  volume: VolumeStructure,
  scene: SceneStructure,
  style: WritingStyle,
  characters: Character[],
  lastContent: string,
  currentWordCount: number,
  remainingMustInclude: string[],
  foreshadowings?: Foreshadowing[],
  conflicts?: Conflict[]
): GeneratedPrompt {
  const systemPrompt = generateSystemPrompt(project, style);

  // 씬 등장인물 (간략)
  const sceneCharacters = characters.filter(c =>
    scene.participants.includes(c.id) || scene.participants.includes(c.name)
  );
  const characterInfo = sceneCharacters
    .map(c => `- ${c.name}: ${c.personality.slice(0, 100)}${c.speechPattern?.tone ? `, 말투: ${c.speechPattern.tone}` : ''}`)
    .join('\n');

  // 활성 복선
  const activeForeshadowings = foreshadowings?.filter(f => f.status === 'planted' || f.status === 'reinforced') || [];
  const foreshadowingHints = activeForeshadowings.length > 0
    ? '\n## 심어야 할 복선\n' + activeForeshadowings.slice(0, 3).map(f => `- ${f.title}: ${f.plantedMethod}`).join('\n')
    : '';

  // 활성 갈등
  const activeConflicts = conflicts?.filter(c => c.status === 'active' || c.status === 'escalating') || [];
  const conflictHints = activeConflicts.length > 0
    ? '\n## 진행 중인 갈등\n' + activeConflicts.slice(0, 3).map(c => `- ${c.title} (강도 ${c.intensity}/10)`).join('\n')
    : '';

  const userPrompt = `## 이어쓰기 정보
- 작품: ${project.title} ${volume.volumeNumber}권
- 현재 씬: ${scene.sceneNumber}번 "${scene.title}"
- 진행: ${currentWordCount.toLocaleString()}자 / 목표 ${scene.targetWordCount.toLocaleString()}자 (${Math.round(currentWordCount / scene.targetWordCount * 100)}%)

## 등장인물
${characterInfo || '정보 없음'}

## 마지막으로 쓴 내용 (최근 500자)
"""
${lastContent.slice(-500)}
"""

## 아직 포함하지 않은 필수 내용
${remainingMustInclude.length > 0 ? remainingMustInclude.map((item, i) => `${i + 1}. ${item}`).join('\n') : '모두 포함됨'}
${foreshadowingHints}
${conflictHints}

## 🚨🚨🚨 종료 조건 (최우선!) 🚨🚨🚨
이 씬은 반드시 다음에서 끝나야 합니다:
"${scene.endCondition}"

### 🛑 절대 금지:
1. 종료 조건 이후 내용 작성 금지
2. 다음 씬 내용 작성 금지
3. 시간 점프 금지 (며칠 후, 몇 달 후 등)
4. 급하게 마무리 짓기 금지

### 🔄 반복 금지:
- 각성/깨달음 장면 반복 X
- 힘 획득 장면 반복 X
- 결심/다짐 장면 반복 X
- 유사 대사/묘사 반복 X

### ✅ 종료 조건 도달 시:
1. 종료 조건에 해당하는 장면/대사 작성
2. "---"를 쓰고 즉시 멈춤
3. 이후 아무것도 쓰지 않음

## 주의사항
- 위 내용에서 자연스럽게 이어서 쓴다
- 디테일하게 천천히 (요약하지 말 것!)
- 캐릭터 말투와 성격 유지
- 하나의 상황만 다루기

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
이어서 집필하세요.
종료 조건: "${scene.endCondition}" 도달 시 즉시 멈춤
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

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
// 빠른 생성용 프롬프트 (Quick Mode)
// ============================================

export function generateQuickPrompt(
  project: Project,
  characters: Character[],
  worldSettings: WorldSetting[],
  plotStructure: PlotStructure | null,
  foreshadowings: Foreshadowing[],
  conflicts: Conflict[],
  options: {
    generationType: 'continue' | 'dialogue' | 'description' | 'action' | 'rewrite' | 'expand';
    tone: string;
    targetLength: number;
    currentContent: string;
    customPrompt?: string;
    selectedCharacterIds?: string[];
    sceneSetting?: { title: string; location: string; timeframe: string };
  },
  // 강화된 옵션 (v2.0)
  enhancedOptions?: {
    storyAnalysis?: StoryAnalysisResult;
    deepCharacterProfiles?: DeepCharacterProfile[];
    writingGuidelines?: WritingGuidelines;
  }
): string {
  // 선택된 캐릭터 또는 주요 캐릭터
  const selectedCharacters = options.selectedCharacterIds
    ? characters.filter(c => options.selectedCharacterIds!.includes(c.id))
    : characters.filter(c => c.role === 'protagonist' || c.role === 'antagonist').slice(0, 3);

  const characterInfo = generateCharacterInfo(selectedCharacters, false);

  // 핵심 세계관만
  const coreWorld = worldSettings.filter(w => w.importance === 'core').slice(0, 3);
  const worldInfo = coreWorld.length > 0
    ? coreWorld.map(w => `- ${w.title}: ${w.description.slice(0, 80)}`).join('\n')
    : '세계관 정보 없음';

  // 현재 컨텍스트에서 마지막 부분 추출
  const lastContent = options.currentContent
    .replace(/<[^>]*>/g, '')
    .trim()
    .split('\n')
    .slice(-5)
    .join('\n');

  // 활성 갈등 힌트
  const activeConflicts = conflicts.filter(c => c.status === 'active' || c.status === 'escalating');
  const conflictHint = activeConflicts.length > 0
    ? `\n[진행 중인 갈등]\n${activeConflicts.slice(0, 2).map(c => `- ${c.title}`).join('\n')}`
    : '';

  // 생성 유형별 지시
  const typeInstructions: Record<string, string> = {
    continue: '위 내용에서 자연스럽게 이어서 작성하세요.',
    dialogue: '캐릭터들의 대화를 생성하세요. 각 캐릭터의 말투와 성격을 반영하세요.',
    description: '장면이나 분위기에 대한 묘사를 작성하세요.',
    action: '행동과 움직임 중심의 장면을 작성하세요.',
    rewrite: '위 내용을 더 나은 문체로 다시 작성하세요.',
    expand: '위 내용을 더 자세하게 확장하세요.',
  };

  // 스토리 분석 기반 경고 (v2.0)
  let storyWarnings = '';
  if (enhancedOptions?.storyAnalysis) {
    const deadChars = enhancedOptions.storyAnalysis.characterStates.filter(c => c.status === 'dead');
    const imprisonedChars = enhancedOptions.storyAnalysis.characterStates.filter(c => c.status === 'imprisoned');

    if (deadChars.length > 0) {
      storyWarnings += `\n### 💀 사망한 캐릭터 (절대 등장 금지!)
${deadChars.map(c => `- ${c.characterName}`).join('\n')}
`;
    }
    if (imprisonedChars.length > 0) {
      storyWarnings += `\n### 🔒 감금/제한된 캐릭터
${imprisonedChars.map(c => `- ${c.characterName}: ${c.lastSeenLocation}에서만`).join('\n')}
`;
    }
  }

  // 심층 캐릭터 정보 (v2.0)
  let deepCharInfo = '';
  if (enhancedOptions?.deepCharacterProfiles) {
    const relevantProfiles = enhancedOptions.deepCharacterProfiles.filter(
      p => selectedCharacters.some(c => c.name === p.name)
    );
    if (relevantProfiles.length > 0) {
      deepCharInfo = `\n### 캐릭터 심층 정보
${relevantProfiles.map(p => `**${p.name}**
- 말투: ${p.voice.speechPatterns.slice(0, 2).join(', ')}
- 입버릇: "${p.voice.catchPhrases[0] || ''}"
- 주의: ${p.voice.avoidWords.slice(0, 2).join(', ')} 표현 금지`).join('\n\n')}
`;
    }
  }

  // 집필 가이드라인 힌트 (v2.0)
  let guidelinesHint = '';
  if (enhancedOptions?.writingGuidelines) {
    const wg = enhancedOptions.writingGuidelines;
    guidelinesHint = `\n### 문체 가이드
- ${wg.style.toneDescriptions[0] || ''}
- 대화: ${wg.style.dialogueStyle}
- 금지: ${wg.avoidList.slice(0, 2).join(', ')}
`;
  }

  return `당신은 한국의 베스트셀러 소설가입니다.

## 작품 정보
- 제목: ${project.title}
- 장르: ${project.genre.join(', ')}
- 컨셉: ${project.concept}
${options.sceneSetting ? `
## 현재 씬
- 제목: ${options.sceneSetting.title}
- 장소: ${options.sceneSetting.location}
- 시간: ${options.sceneSetting.timeframe}
` : ''}

## 등장인물
${characterInfo}
${deepCharInfo}

## 세계관
${worldInfo}
${conflictHint}
${storyWarnings}
${guidelinesHint}

## 현재 내용
"""
${lastContent || '(시작 부분)'}
"""

## 요청
- 유형: ${options.generationType}
- 분위기: ${options.tone}
- 분량: ${options.targetLength}자 이상
${options.customPrompt ? `- 추가 지시: ${options.customPrompt}` : ''}

## 지시사항
${typeInstructions[options.generationType]}

## ⚠️ 절대 규칙 (최우선!)

### 🛑 페이싱 (가장 중요!)
1. **현재 순간만 다루기**: "며칠 후", "그 후로 시간이 흘러" 등 시간 점프 금지
2. **하나의 상황만**: 이 생성에서 여러 사건을 다루지 않음
3. **디테일하게**: 행동/감정/대화를 상세히 묘사 (요약하지 말 것!)
4. **급하게 진행 금지**: 스토리가 빠르게 해결되는 것처럼 쓰지 않음

### 🔄 반복 금지 (매우 중요!)
5. **각성 장면 반복 금지**: 주인공이 깨달음을 얻거나 각성하는 장면 반복 X
6. **힘 획득 반복 금지**: 새로운 힘/능력을 얻는 장면 반복 X
7. **결심 반복 금지**: 결심하거나 다짐하는 장면 반복 X
8. **유사 대사 금지**: 이전에 나온 대사와 비슷한 대사 X
9. **유사 묘사 금지**: 이전에 나온 장면과 비슷한 묘사 X

### 📝 캐릭터
10. 💀 사망한 캐릭터는 현재 시점에서 절대 등장 불가 (회상/언급만)
11. 캐릭터별 고유 말투 반드시 유지

## 한국 소설책 형식 - 필수
- 문단 첫 줄 들여쓰기 (전각 공백)
- 대화는 따옴표(" ") 사용
- 마침표로 문장 마무리
- 장면 전환 시 빈 줄 하나
- 과도한 부연 설명 금지`;
}

// ============================================
// 유틸리티 함수
// ============================================

export function createDefaultVolumeStructure(
  projectId: string,
  volumeNumber: number
): VolumeStructure {
  return {
    id: crypto.randomUUID(),
    projectId,
    volumeNumber,
    title: `${volumeNumber}권`,
    targetWordCount: 150000,
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

export function createDefaultSceneStructure(
  volumeId: string,
  sceneNumber: number
): SceneStructure {
  return {
    id: crypto.randomUUID(),
    volumeId,
    sceneNumber,
    title: `씬 ${sceneNumber}`,
    targetWordCount: 15000,
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
