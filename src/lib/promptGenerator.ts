/**
 * 소설 집필 프롬프트 생성 시스템
 * - 권/씬 단위로 정확한 분량과 종료점을 지키는 AI 프롬프트 생성
 * - 모든 기획 데이터(캐릭터, 세계관, 플롯, 복선, 갈등) 포함
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
} from '@/types';

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

  return `당신은 한국의 베스트셀러 소설가입니다. 아래 규칙을 철저히 따라 소설을 집필하세요.

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
${style.additionalInstructions ? `- 추가 지시: ${style.additionalInstructions}` : ''}

## 절대 규칙 ⚠️
1. 주어진 종료점에 도달하면 반드시 멈춘다
2. 종료점 이후의 내용(다음 권/씬 내용)은 절대 쓰지 않는다
3. 같은 내용을 반복하지 않는다
4. 분량이 남더라도 종료점에 도달하면 멈춘다
5. 종료점에 도달하지 않았는데 글이 끝나면 안 된다
6. 한국어로 작성한다
7. 캐릭터의 말투와 성격을 일관되게 유지한다
8. 복선은 자연스럽게 심는다 (노골적으로 드러내지 않는다)
9. 갈등의 강도를 적절히 조절한다`;
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
  previousVolumeSummary?: string
): GeneratedPrompt {
  const systemPrompt = generateSystemPrompt(project, style);

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

  const userPrompt = `## 현재 집필: ${volume.volumeNumber}권 "${volume.title}"
목표 글자수: ${volume.targetWordCount.toLocaleString()}자

## ⚠️ 절대 규칙 - 종료점
이 권은 반드시 다음 조건에서 끝나야 합니다:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
종료점: "${volume.endPoint}"
종료 유형: ${volume.endPointType === 'dialogue' ? '대사' : volume.endPointType === 'action' ? '행동' : '서술'}
정확한 종료: "${volume.endPointExact}"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ 이 종료점에 도달하면 "--- ${volume.volumeNumber}권 끝 ---"을 쓰고 즉시 멈추세요.
⚠️ 종료점 이후 내용은 절대 쓰지 마세요.

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

---

## 세계관 설정
${worldInfo}

---

${plotInfo}

---

${foreshadowingInfo}

---

${conflictInfo}

---

${volume.nextVolumePreview ? `## 다음 권 예고 (참고만, 절대 쓰지 말 것!)\n${volume.nextVolumePreview}\n` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
위 모든 설정을 바탕으로 ${volume.volumeNumber}권을 집필하세요.
첫 번째 씬부터 시작합니다.
종료점에 도달하면 즉시 멈추세요.
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
  previousSceneSummary?: string
): GeneratedPrompt {
  const systemPrompt = generateSystemPrompt(project, style);

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

  const userPrompt = `## 현재 집필 정보
- 작품: ${project.title} ${volume.volumeNumber}권
- 현재 씬: ${scene.sceneNumber}번 "${scene.title}"
- 목표 글자수: ${scene.targetWordCount.toLocaleString()}자

## 씬 설정
- 시점(POV): ${scene.pov} (${povTypeMap[scene.povType] || '3인칭 제한'})
- 장소: ${scene.location || '미정'}
- 시간: ${scene.timeframe || '미정'}

## ⚠️ 종료 조건
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
이 씬은 반드시 다음에서 끝나야 합니다:
"${scene.endCondition}"
종료 유형: ${scene.endConditionType === 'dialogue' ? '대사' : scene.endConditionType === 'action' ? '행동' : '서술'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ 이 조건에 도달하면 "---"를 쓰고 즉시 멈추세요.
⚠️ 다음 씬 내용은 절대 쓰지 마세요.

## 시작 상황
${scene.startCondition || '이전 씬에서 자연스럽게 이어짐'}

## 이 씬에서 반드시 포함할 내용
${mustIncludeList || '특별한 필수 내용 없음'}

${previousSceneSummary ? `## 직전 씬 요약\n${previousSceneSummary}\n` : ''}

---

## 등장인물
${characterInfo}

---

## 세계관 (참고)
${worldInfo}

---

${foreshadowingInfo ? foreshadowingInfo + '\n---\n' : ''}

${conflictInfo ? conflictInfo + '\n---\n' : ''}

${scene.nextScenePreview ? `## 다음 씬 예고 (참고만, 절대 쓰지 말 것!)\n${scene.nextScenePreview}\n` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
위 설정에 따라 이 씬을 집필하세요.
종료 조건에 도달하면 즉시 멈추세요.
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

## ⚠️ 종료 조건
이 씬은 반드시 다음에서 끝나야 합니다:
"${scene.endCondition}"

## 주의사항
- 위 내용에서 자연스럽게 이어서 쓴다
- 같은 내용을 반복하지 않는다
- 캐릭터 말투와 성격 유지
- 종료 조건에 도달할 때까지 쓴다
- 종료 조건 도달 시 "---"를 쓰고 멈춘다

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
이어서 집필하세요.
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

## 세계관
${worldInfo}
${conflictHint}

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
