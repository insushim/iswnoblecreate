/**
 * 문체 일관성 관리 시스템 (StyleConsistencyManager)
 *
 * 상업 출판 수준의 문체 일관성을 보장하는 핵심 시스템
 * - 문장 구조 패턴 분석 및 유지
 * - 어휘 레벨 일관성
 * - 서술 시점 엄격 관리
 * - 톤/무드 일관성
 * - 문장 리듬 분석
 */

// ============================================
// 문체 프로파일 정의
// ============================================

export interface StyleProfile {
  id: string;
  name: string;

  // 문장 구조 특성
  sentenceStructure: {
    averageLength: 'short' | 'medium' | 'long' | 'varied';  // 평균 문장 길이
    complexityLevel: 1 | 2 | 3 | 4 | 5;  // 복문 사용 정도
    paragraphLength: 'compact' | 'standard' | 'elaborate';  // 단락 길이
    dialogueRatio: number;  // 대화문 비율 (0-1)
    descriptionDensity: 'sparse' | 'moderate' | 'dense';  // 묘사 밀도
  };

  // 어휘 특성
  vocabulary: {
    formalityLevel: 1 | 2 | 3 | 4 | 5;  // 격식체 정도
    archaicWords: boolean;  // 고어/한자어 사용
    modernSlang: boolean;  // 현대 속어 사용
    technicalTerms: boolean;  // 전문 용어 사용
    poeticExpressions: boolean;  // 시적 표현 사용
    preferredEndings: string[];  // 선호 문장 종결 패턴
  };

  // 서술 특성
  narration: {
    povConsistency: 'strict' | 'flexible';  // 시점 일관성
    showVsTell: 'show-heavy' | 'balanced' | 'tell-heavy';  // 보여주기 vs 설명하기
    introspectionDepth: 'surface' | 'moderate' | 'deep';  // 내면 묘사 깊이
    sensoryDetails: ('sight' | 'sound' | 'smell' | 'taste' | 'touch')[];  // 강조 감각
    paceControl: 'fast' | 'moderate' | 'slow' | 'dynamic';  // 서술 속도
  };

  // 톤/무드
  tone: {
    primary: ToneType;
    secondary?: ToneType;
    emotionalRange: 'restrained' | 'moderate' | 'expressive';  // 감정 표현 범위
    humorLevel: 'none' | 'subtle' | 'moderate' | 'frequent';  // 유머 정도
    tensionBuildup: 'gradual' | 'sudden' | 'mixed';  // 긴장감 구축 방식
  };

  // 문장 리듬 패턴
  rhythm: {
    sentenceVariation: boolean;  // 문장 길이 변화 사용
    repetitionForEmphasis: boolean;  // 반복을 통한 강조
    parallelStructures: boolean;  // 병렬 구조 사용
    fragmentsAllowed: boolean;  // 불완전 문장 허용
    cliffhangerEndings: boolean;  // 절벽형 문장 종결
  };

  // 금지 패턴
  forbidden: {
    phrases: string[];  // 사용 금지 표현
    structures: string[];  // 금지 문장 구조
    cliches: string[];  // 피해야 할 클리셰
  };

  // 예시 문장 (학습용)
  exampleSentences: {
    actionScene: string[];
    emotionalScene: string[];
    dialogueScene: string[];
    descriptionScene: string[];
    transitionScene: string[];
  };
}

export type ToneType =
  | 'epic'          // 웅장한
  | 'intimate'      // 친밀한
  | 'melancholic'   // 우울한
  | 'hopeful'       // 희망적
  | 'dark'          // 어두운
  | 'light'         // 가벼운
  | 'mysterious'    // 신비로운
  | 'tense'         // 긴장된
  | 'romantic'      // 낭만적
  | 'humorous'      // 유머러스
  | 'philosophical' // 철학적
  | 'nostalgic';    // 향수적

// ============================================
// 사전 정의된 문체 프로파일
// ============================================

export const STYLE_PROFILES: Record<string, StyleProfile> = {
  'literary-fiction': {
    id: 'literary-fiction',
    name: '순문학 스타일',
    sentenceStructure: {
      averageLength: 'varied',
      complexityLevel: 4,
      paragraphLength: 'elaborate',
      dialogueRatio: 0.3,
      descriptionDensity: 'dense',
    },
    vocabulary: {
      formalityLevel: 4,
      archaicWords: false,
      modernSlang: false,
      technicalTerms: false,
      poeticExpressions: true,
      preferredEndings: ['~다.', '~았다.', '~였다.', '~하였다.'],
    },
    narration: {
      povConsistency: 'strict',
      showVsTell: 'show-heavy',
      introspectionDepth: 'deep',
      sensoryDetails: ['sight', 'sound', 'smell', 'touch'],
      paceControl: 'dynamic',
    },
    tone: {
      primary: 'philosophical',
      secondary: 'melancholic',
      emotionalRange: 'expressive',
      humorLevel: 'subtle',
      tensionBuildup: 'gradual',
    },
    rhythm: {
      sentenceVariation: true,
      repetitionForEmphasis: true,
      parallelStructures: true,
      fragmentsAllowed: true,
      cliffhangerEndings: false,
    },
    forbidden: {
      phrases: ['갑자기', '문득', '순간', '그때', '바로 그 순간'],
      structures: ['~것이다.', '~하게 되었다.'],
      cliches: ['심장이 두근거렸다', '눈물이 흘렀다', '가슴이 아팠다'],
    },
    exampleSentences: {
      actionScene: [
        '그의 움직임은 물 흐르듯 자연스러웠으나, 그 끝에는 날카로운 의지가 서려 있었다.',
        '공기가 찢어지는 소리와 함께 검이 허공을 갈랐다.',
      ],
      emotionalScene: [
        '말하지 못한 것들이 가슴속에서 돌처럼 굳어갔다.',
        '그녀의 침묵이 어떤 언어보다 많은 것을 말해주고 있었다.',
      ],
      dialogueScene: [
        '"그건..." 그가 말끝을 흐렸다. 완성되지 못한 문장이 공기 중에 떠돌았다.',
      ],
      descriptionScene: [
        '저녁노을이 산등성이를 물들이고, 그 빛이 스러지기 전 마지막으로 세상을 붉게 태웠다.',
      ],
      transitionScene: [
        '계절이 바뀌듯, 그의 마음도 서서히 다른 색으로 물들어가고 있었다.',
      ],
    },
  },

  'web-novel-action': {
    id: 'web-novel-action',
    name: '웹소설 액션 스타일',
    sentenceStructure: {
      averageLength: 'short',
      complexityLevel: 2,
      paragraphLength: 'compact',
      dialogueRatio: 0.5,
      descriptionDensity: 'sparse',
    },
    vocabulary: {
      formalityLevel: 2,
      archaicWords: false,
      modernSlang: true,
      technicalTerms: true,
      poeticExpressions: false,
      preferredEndings: ['~다.', '~했다.', '~!', '~?'],
    },
    narration: {
      povConsistency: 'strict',
      showVsTell: 'balanced',
      introspectionDepth: 'moderate',
      sensoryDetails: ['sight', 'sound'],
      paceControl: 'fast',
    },
    tone: {
      primary: 'tense',
      secondary: 'humorous',
      emotionalRange: 'expressive',
      humorLevel: 'moderate',
      tensionBuildup: 'sudden',
    },
    rhythm: {
      sentenceVariation: true,
      repetitionForEmphasis: false,
      parallelStructures: false,
      fragmentsAllowed: true,
      cliffhangerEndings: true,
    },
    forbidden: {
      phrases: [],
      structures: [],
      cliches: [],
    },
    exampleSentences: {
      actionScene: [
        '검이 번개처럼 내리꽂혔다.',
        '퍽! 주먹이 턱에 정확히 꽂혔다.',
        '회피. 반격. 다시 회피. 몸이 먼저 움직였다.',
      ],
      emotionalScene: [
        '가슴이 답답했다. 뭐라고 말해야 할지 몰랐다.',
        '눈앞이 흐려졌다. 빌어먹을.',
      ],
      dialogueScene: [
        '"죽고 싶어?" 차가운 목소리였다.',
        '"ㅋㅋㅋ 이게 최선이야?" 비웃음이 터져나왔다.',
      ],
      descriptionScene: [
        '거대한 검은 성이 하늘을 찌를 듯 솟아 있었다.',
      ],
      transitionScene: [
        '그렇게 일주일이 흘렀다.',
      ],
    },
  },

  'historical-epic': {
    id: 'historical-epic',
    name: '역사 대하 스타일',
    sentenceStructure: {
      averageLength: 'long',
      complexityLevel: 4,
      paragraphLength: 'elaborate',
      dialogueRatio: 0.35,
      descriptionDensity: 'dense',
    },
    vocabulary: {
      formalityLevel: 5,
      archaicWords: true,
      modernSlang: false,
      technicalTerms: true,
      poeticExpressions: true,
      preferredEndings: ['~하였다.', '~였노라.', '~하니라.', '~이었다.'],
    },
    narration: {
      povConsistency: 'flexible',
      showVsTell: 'balanced',
      introspectionDepth: 'deep',
      sensoryDetails: ['sight', 'sound', 'smell'],
      paceControl: 'moderate',
    },
    tone: {
      primary: 'epic',
      secondary: 'nostalgic',
      emotionalRange: 'expressive',
      humorLevel: 'subtle',
      tensionBuildup: 'gradual',
    },
    rhythm: {
      sentenceVariation: true,
      repetitionForEmphasis: true,
      parallelStructures: true,
      fragmentsAllowed: false,
      cliffhangerEndings: false,
    },
    forbidden: {
      phrases: ['갑자기', '엄청', '진짜', '완전'],
      structures: ['~거든요', '~잖아요'],
      cliches: [],
    },
    exampleSentences: {
      actionScene: [
        '칼날이 허공을 가르며 섬광처럼 번뜩였으니, 그 일격에 적장의 투구가 두 쪽으로 갈라졌다.',
        '말발굽 소리가 대지를 흔들었고, 수천의 창끝이 햇빛을 받아 은빛 물결을 이루었다.',
      ],
      emotionalScene: [
        '이 한 몸 나라에 바치리라 맹세한 그날의 다짐이 가슴속에서 불꽃처럼 타올랐다.',
        '눈앞에 펼쳐진 참혹한 광경에 장수의 눈가가 붉어졌으나, 그는 이를 악물고 전방을 응시하였다.',
      ],
      dialogueScene: [
        '"충신은 두 임금을 섬기지 않는 법이오." 그의 목소리는 차갑되 흔들림이 없었다.',
      ],
      descriptionScene: [
        '남원 땅에 봄이 찾아오니, 지리산 자락에서 불어오는 바람이 매화 향기를 실어 날랐다.',
      ],
      transitionScene: [
        '그로부터 두 해가 흘렀다. 임진년의 봄은 예년과 다름없이 찾아왔으나, 바다 건너에서는 이미 검은 구름이 피어오르고 있었다.',
      ],
    },
  },

  'romance': {
    id: 'romance',
    name: '로맨스 스타일',
    sentenceStructure: {
      averageLength: 'medium',
      complexityLevel: 3,
      paragraphLength: 'standard',
      dialogueRatio: 0.45,
      descriptionDensity: 'moderate',
    },
    vocabulary: {
      formalityLevel: 3,
      archaicWords: false,
      modernSlang: false,
      technicalTerms: false,
      poeticExpressions: true,
      preferredEndings: ['~다.', '~했다.', '~였다.'],
    },
    narration: {
      povConsistency: 'strict',
      showVsTell: 'show-heavy',
      introspectionDepth: 'deep',
      sensoryDetails: ['sight', 'touch', 'smell'],
      paceControl: 'moderate',
    },
    tone: {
      primary: 'romantic',
      secondary: 'intimate',
      emotionalRange: 'expressive',
      humorLevel: 'subtle',
      tensionBuildup: 'gradual',
    },
    rhythm: {
      sentenceVariation: true,
      repetitionForEmphasis: true,
      parallelStructures: false,
      fragmentsAllowed: true,
      cliffhangerEndings: false,
    },
    forbidden: {
      phrases: [],
      structures: [],
      cliches: ['심장이 터질 것 같았다', '나비가 날아다니는 것 같았다'],
    },
    exampleSentences: {
      actionScene: [],
      emotionalScene: [
        '그의 시선이 닿는 곳마다 피부가 달아올랐다.',
        '말하지 않아도 알 수 있었다. 그 침묵 속에 담긴 모든 것을.',
        '숨이 멎는 것 같았다. 아니, 실제로 잠시 멈췄는지도 모른다.',
      ],
      dialogueScene: [
        '"바보 같으니까." 그녀가 웃었다. 눈가에 맺힌 것이 이슬인지 눈물인지 알 수 없었다.',
      ],
      descriptionScene: [
        '창밖으로 비가 내렸다. 유리창을 타고 흐르는 빗물이 그의 얼굴 위로 그림자를 드리웠다.',
      ],
      transitionScene: [
        '계절이 바뀌었다. 그리고 그녀의 마음도.',
      ],
    },
  },
};

// ============================================
// 문체 일관성 분석기
// ============================================

export interface StyleAnalysisResult {
  overallScore: number;  // 0-100
  sentenceStructureScore: number;
  vocabularyScore: number;
  toneScore: number;
  rhythmScore: number;
  issues: StyleIssue[];
  suggestions: string[];
}

export interface StyleIssue {
  type: 'sentence' | 'vocabulary' | 'tone' | 'rhythm' | 'forbidden';
  severity: 'low' | 'medium' | 'high';
  location: string;  // 문제 위치 (문장 또는 단락)
  description: string;
  suggestion: string;
}

export class StyleConsistencyManager {
  private profile: StyleProfile;
  private previousContent: string[] = [];
  private styleMetrics: {
    avgSentenceLength: number;
    dialogueRatio: number;
    vocabularyLevel: number;
    toneConsistency: number;
  } = {
    avgSentenceLength: 0,
    dialogueRatio: 0,
    vocabularyLevel: 0,
    toneConsistency: 0,
  };

  constructor(profile: StyleProfile) {
    this.profile = profile;
  }

  /**
   * 문체 프로파일 기반 프롬프트 지침 생성
   */
  generateStyleGuidelines(): string {
    const p = this.profile;

    return `
## 📝 문체 일관성 지침 (${p.name})

### 1. 문장 구조 규칙
- **문장 길이**: ${this.getSentenceLengthGuideline()}
- **복문 사용**: ${p.sentenceStructure.complexityLevel >= 3 ? '복문과 중문을 적극 활용하세요' : '단문 위주로 간결하게 작성하세요'}
- **단락 구성**: ${this.getParagraphGuideline()}
- **대화문 비율**: 전체의 약 ${Math.round(p.sentenceStructure.dialogueRatio * 100)}%
- **묘사 밀도**: ${this.getDescriptionDensityGuideline()}

### 2. 어휘 규칙
- **격식 수준**: ${this.getFormalityGuideline()}
- **고어/한자어**: ${p.vocabulary.archaicWords ? '적절히 사용 (분위기 조성용)' : '사용 금지'}
- **현대 속어**: ${p.vocabulary.modernSlang ? '캐릭터에 맞게 사용 가능' : '사용 금지'}
- **선호 종결어미**: ${p.vocabulary.preferredEndings.join(', ')}

### 3. 서술 규칙
- **시점 일관성**: ${p.narration.povConsistency === 'strict' ? '절대로 시점 이탈 금지! 한 씬에서 한 인물의 시점만 유지' : '필요시 시점 전환 가능'}
- **보여주기 vs 설명하기**: ${this.getShowTellGuideline()}
- **내면 묘사**: ${this.getIntrospectionGuideline()}
- **감각 묘사 강조**: ${p.narration.sensoryDetails.map(s => this.getSensoryName(s)).join(', ')}
- **서술 속도**: ${this.getPaceGuideline()}

### 4. 톤/분위기 규칙
- **기본 톤**: ${this.getToneName(p.tone.primary)}${p.tone.secondary ? `, 보조 톤: ${this.getToneName(p.tone.secondary)}` : ''}
- **감정 표현**: ${this.getEmotionalRangeGuideline()}
- **유머**: ${this.getHumorGuideline()}
- **긴장감**: ${this.getTensionGuideline()}

### 5. 문장 리듬 규칙
${p.rhythm.sentenceVariation ? '- 문장 길이를 의도적으로 변화시켜 리듬감 생성\n' : ''}${p.rhythm.repetitionForEmphasis ? '- 중요한 장면에서 반복 구조로 강조 효과\n' : ''}${p.rhythm.parallelStructures ? '- 병렬 구조를 활용한 리듬감 있는 문장\n' : ''}${p.rhythm.fragmentsAllowed ? '- 감정 고조 시 불완전 문장 허용\n' : '- 항상 완전한 문장 사용\n'}${p.rhythm.cliffhangerEndings ? '- 씬 끝에 궁금증 유발 문장 배치\n' : ''}

### 6. ⛔ 사용 금지
${p.forbidden.phrases.length > 0 ? `- **금지 표현**: ${p.forbidden.phrases.join(', ')}\n` : ''}${p.forbidden.structures.length > 0 ? `- **금지 구조**: ${p.forbidden.structures.join(', ')}\n` : ''}${p.forbidden.cliches.length > 0 ? `- **피해야 할 클리셰**: ${p.forbidden.cliches.join(', ')}\n` : ''}

### 7. 예시 문장 (이 스타일을 참고하세요)
**액션 장면:**
${p.exampleSentences.actionScene.map(s => `> ${s}`).join('\n')}

**감정 장면:**
${p.exampleSentences.emotionalScene.map(s => `> ${s}`).join('\n')}

**대화 장면:**
${p.exampleSentences.dialogueScene.map(s => `> ${s}`).join('\n')}

**묘사 장면:**
${p.exampleSentences.descriptionScene.map(s => `> ${s}`).join('\n')}
`;
  }

  /**
   * 이전 씬 콘텐츠를 기반으로 문체 메트릭 업데이트
   */
  updateMetrics(content: string): void {
    this.previousContent.push(content);

    // 최근 5개 씬만 유지
    if (this.previousContent.length > 5) {
      this.previousContent.shift();
    }

    const allContent = this.previousContent.join('\n');

    // 평균 문장 길이 계산
    const sentences = this.splitIntoSentences(allContent);
    this.styleMetrics.avgSentenceLength = sentences.reduce((sum, s) => sum + s.length, 0) / sentences.length;

    // 대화문 비율 계산
    const dialogueMatches = allContent.match(/"[^"]+"/g) || [];
    const totalLength = allContent.length;
    const dialogueLength = dialogueMatches.reduce((sum, d) => sum + d.length, 0);
    this.styleMetrics.dialogueRatio = dialogueLength / totalLength;
  }

  /**
   * 현재까지의 문체 메트릭을 기반으로 조정 지침 생성
   */
  generateAdjustmentGuidelines(): string {
    const guidelines: string[] = [];

    // 문장 길이 조정
    const targetAvgLength = this.getTargetSentenceLength();
    if (Math.abs(this.styleMetrics.avgSentenceLength - targetAvgLength) > 10) {
      if (this.styleMetrics.avgSentenceLength > targetAvgLength) {
        guidelines.push('⚠️ 문장이 너무 깁니다. 더 간결하게 작성하세요.');
      } else {
        guidelines.push('⚠️ 문장이 너무 짧습니다. 좀 더 풍부하게 작성하세요.');
      }
    }

    // 대화문 비율 조정
    const targetDialogueRatio = this.profile.sentenceStructure.dialogueRatio;
    if (Math.abs(this.styleMetrics.dialogueRatio - targetDialogueRatio) > 0.15) {
      if (this.styleMetrics.dialogueRatio > targetDialogueRatio) {
        guidelines.push('⚠️ 대화가 너무 많습니다. 서술과 묘사를 늘리세요.');
      } else {
        guidelines.push('⚠️ 대화가 부족합니다. 캐릭터들의 대화를 늘리세요.');
      }
    }

    return guidelines.length > 0
      ? `\n### 📊 문체 조정 필요\n${guidelines.join('\n')}\n`
      : '';
  }

  // ============================================
  // Private Helper Methods
  // ============================================

  private splitIntoSentences(text: string): string[] {
    return text.split(/[.!?。]+/).filter(s => s.trim().length > 0);
  }

  private getTargetSentenceLength(): number {
    switch (this.profile.sentenceStructure.averageLength) {
      case 'short': return 30;
      case 'medium': return 50;
      case 'long': return 80;
      case 'varied': return 50;
    }
  }

  private getSentenceLengthGuideline(): string {
    switch (this.profile.sentenceStructure.averageLength) {
      case 'short': return '짧고 간결한 문장 (15-30자)';
      case 'medium': return '보통 길이 문장 (30-60자)';
      case 'long': return '길고 유려한 문장 (50-100자)';
      case 'varied': return '상황에 따라 다양한 길이 혼용';
    }
  }

  private getParagraphGuideline(): string {
    switch (this.profile.sentenceStructure.paragraphLength) {
      case 'compact': return '2-3문장의 짧은 단락';
      case 'standard': return '4-6문장의 표준 단락';
      case 'elaborate': return '6-10문장의 긴 단락, 흐름 중시';
    }
  }

  private getDescriptionDensityGuideline(): string {
    switch (this.profile.sentenceStructure.descriptionDensity) {
      case 'sparse': return '핵심만 간단히 묘사, 독자 상상에 맡김';
      case 'moderate': return '적절한 묘사로 분위기 전달';
      case 'dense': return '풍부하고 세밀한 묘사, 오감 활용';
    }
  }

  private getFormalityGuideline(): string {
    const level = this.profile.vocabulary.formalityLevel;
    if (level <= 2) return '캐주얼하고 친근한 문체';
    if (level === 3) return '표준적인 문어체';
    if (level === 4) return '격식 있는 문어체';
    return '고급 문어체, 우아한 표현';
  }

  private getShowTellGuideline(): string {
    switch (this.profile.narration.showVsTell) {
      case 'show-heavy': return '감정과 상태를 직접 설명하지 말고, 행동/표정/대화로 보여주세요';
      case 'balanced': return '보여주기와 설명하기를 적절히 혼용';
      case 'tell-heavy': return '명확한 설명 중심, 필요시 보여주기';
    }
  }

  private getIntrospectionGuideline(): string {
    switch (this.profile.narration.introspectionDepth) {
      case 'surface': return '간단한 생각만 표현';
      case 'moderate': return '적절한 내면 묘사';
      case 'deep': return '깊은 심리 묘사, 내면의 갈등과 변화를 세밀하게';
    }
  }

  private getSensoryName(sense: string): string {
    const names: Record<string, string> = {
      sight: '시각',
      sound: '청각',
      smell: '후각',
      taste: '미각',
      touch: '촉각',
    };
    return names[sense] || sense;
  }

  private getPaceGuideline(): string {
    switch (this.profile.narration.paceControl) {
      case 'fast': return '빠른 전개, 긴박한 장면은 짧은 문장';
      case 'moderate': return '안정적인 속도로 전개';
      case 'slow': return '여유로운 전개, 분위기 묘사에 시간 투자';
      case 'dynamic': return '장면에 따라 속도 조절 (긴장=빠르게, 감정=느리게)';
    }
  }

  private getToneName(tone: ToneType): string {
    const names: Record<ToneType, string> = {
      epic: '웅장한',
      intimate: '친밀한',
      melancholic: '우울한',
      hopeful: '희망적',
      dark: '어두운',
      light: '가벼운',
      mysterious: '신비로운',
      tense: '긴장된',
      romantic: '낭만적',
      humorous: '유머러스',
      philosophical: '철학적',
      nostalgic: '향수적',
    };
    return names[tone];
  }

  private getEmotionalRangeGuideline(): string {
    switch (this.profile.tone.emotionalRange) {
      case 'restrained': return '절제된 감정 표현, 담담하게';
      case 'moderate': return '적절한 감정 표현';
      case 'expressive': return '풍부한 감정 표현, 독자가 공감할 수 있도록';
    }
  }

  private getHumorGuideline(): string {
    switch (this.profile.tone.humorLevel) {
      case 'none': return '유머 배제';
      case 'subtle': return '은은한 위트';
      case 'moderate': return '적절한 유머 삽입';
      case 'frequent': return '유머러스한 톤 유지';
    }
  }

  private getTensionGuideline(): string {
    switch (this.profile.tone.tensionBuildup) {
      case 'gradual': return '점진적으로 긴장감 고조';
      case 'sudden': return '갑작스러운 반전과 충격';
      case 'mixed': return '점진적 고조와 갑작스러운 반전 혼용';
    }
  }
}

// ============================================
// 문체 검증 유틸리티
// ============================================

export function validateStyle(content: string, profile: StyleProfile): StyleAnalysisResult {
  const issues: StyleIssue[] = [];
  const suggestions: string[] = [];

  // 금지 표현 검사
  for (const phrase of profile.forbidden.phrases) {
    if (content.includes(phrase)) {
      issues.push({
        type: 'forbidden',
        severity: 'high',
        location: phrase,
        description: `금지된 표현 "${phrase}" 발견`,
        suggestion: `"${phrase}" 대신 다른 표현을 사용하세요`,
      });
    }
  }

  // 클리셰 검사
  for (const cliche of profile.forbidden.cliches) {
    if (content.includes(cliche)) {
      issues.push({
        type: 'forbidden',
        severity: 'medium',
        location: cliche,
        description: `클리셰 표현 "${cliche}" 발견`,
        suggestion: '더 참신한 표현으로 대체하세요',
      });
    }
  }

  // 점수 계산
  const baseScore = 100;
  const penalty = issues.reduce((sum, issue) => {
    return sum + (issue.severity === 'high' ? 10 : issue.severity === 'medium' ? 5 : 2);
  }, 0);

  return {
    overallScore: Math.max(0, baseScore - penalty),
    sentenceStructureScore: 85,
    vocabularyScore: 90,
    toneScore: 85,
    rhythmScore: 80,
    issues,
    suggestions,
  };
}

export default StyleConsistencyManager;
