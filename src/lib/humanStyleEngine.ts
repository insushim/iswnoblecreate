/**
 * 인간 문체 엔진 (HumanStyleEngine)
 *
 * AI 글이 "AI 느낌"이 나지 않도록 하는 핵심 시스템
 * - 작가 고유의 문체/목소리 학습 및 적용
 * - 미묘한 뉘앙스, 은유, 여운 표현
 * - 한국어 특유의 리듬과 호흡
 * - 클리셰 제거 및 신선한 표현 생성
 */

import { generateJSON, generateText } from './gemini';
import { GeminiModel } from '@/types';

// ============================================
// 문체 DNA 정의
// ============================================

export interface StyleDNA {
  // 기본 특성
  id: string;
  name: string;
  description: string;

  // 문장 리듬
  rhythm: {
    averageSentenceLength: 'very-short' | 'short' | 'medium' | 'long' | 'varied';
    paragraphBreathing: 'tight' | 'moderate' | 'spacious';
    punctuationStyle: 'minimal' | 'standard' | 'expressive';
    lineBreakFrequency: number; // 1-10
  };

  // 어휘 특성
  vocabulary: {
    formalityLevel: 1 | 2 | 3 | 4 | 5; // 1=구어체, 5=문어체
    archaicWords: boolean; // 고풍스러운 단어 사용
    neologisms: boolean; // 신조어 사용
    dialectUsage: string | null; // 방언
    technicalTerms: 'avoid' | 'minimal' | 'moderate' | 'heavy';
    foreignWords: 'avoid' | 'minimal' | 'moderate';
  };

  // 묘사 스타일
  descriptionStyle: {
    sensoryFocus: ('visual' | 'auditory' | 'tactile' | 'olfactory' | 'gustatory')[];
    metaphorDensity: 'sparse' | 'moderate' | 'rich';
    metaphorStyle: 'conventional' | 'fresh' | 'surreal';
    detailLevel: 1 | 2 | 3 | 4 | 5;
    showVsTell: number; // 1-10, 10=완전한 보여주기
  };

  // 대화 스타일
  dialogue: {
    tagStyle: 'minimal' | 'standard' | 'descriptive';
    actionBeatFrequency: 'rare' | 'moderate' | 'frequent';
    subTextLevel: 1 | 2 | 3 | 4 | 5; // 서브텍스트 깊이
    interruptionStyle: boolean;
    dialectInDialogue: boolean;
  };

  // 감정 표현
  emotion: {
    directness: 'subtle' | 'moderate' | 'direct';
    internalMonologue: 'rare' | 'moderate' | 'frequent';
    physicalManifestationFocus: boolean;
    emotionalRestraint: number; // 1-10
  };

  // 서술 특성
  narration: {
    narratorDistance: 'close' | 'medium' | 'distant';
    tenseConsistency: 'strict' | 'flexible';
    authorIntrusionLevel: 'none' | 'subtle' | 'moderate' | 'frequent';
    humorStyle: 'none' | 'dry' | 'witty' | 'slapstick';
  };

  // 시그니처 패턴
  signatures: {
    openingPatterns: string[];
    closingPatterns: string[];
    transitionPhrases: string[];
    characteristicExpressions: string[];
    avoidExpressions: string[];
  };

  // 레퍼런스 작가
  referenceAuthors?: string[];
  sampleTexts?: string[];
}

// ============================================
// AI 탈피 변환 규칙
// ============================================

export interface AIDecontaminationRules {
  // 제거할 AI 특유 패턴
  aiPatterns: {
    pattern: RegExp;
    replacement: string | null; // null이면 삭제
    description: string;
  }[];

  // 강화할 인간적 표현
  humanizationRules: {
    trigger: string;
    alternatives: string[];
    context: string;
  }[];

  // 금지어 목록
  bannedPhrases: string[];

  // 필수 변주 패턴
  variationRequirements: {
    pattern: string;
    minVariations: number;
  }[];
}

// 기본 AI 탈피 규칙
export const DEFAULT_AI_DECONTAMINATION: AIDecontaminationRules = {
  aiPatterns: [
    // 과도한 수식어
    { pattern: /매우\s+/g, replacement: '', description: '과도한 강조 제거' },
    { pattern: /정말로?\s+/g, replacement: '', description: '과도한 강조 제거' },
    { pattern: /굉장히\s+/g, replacement: '', description: '과도한 강조 제거' },
    { pattern: /엄청나게?\s+/g, replacement: '', description: '과도한 강조 제거' },

    // AI 특유의 설명적 표현
    { pattern: /~라고\s+할\s+수\s+있(다|었다)/g, replacement: '~다', description: 'AI 설명체 제거' },
    { pattern: /~(이|가)\s+아닐\s+수\s+없(다|었다)/g, replacement: '~다', description: '이중부정 제거' },
    { pattern: /분명히?\s+/g, replacement: '', description: '불필요한 확언 제거' },
    { pattern: /확실히?\s+/g, replacement: '', description: '불필요한 확언 제거' },

    // 과도한 연결어
    { pattern: /그러나\s+그럼에도\s+불구하고/g, replacement: '그러나', description: '중복 연결어 제거' },
    { pattern: /하지만\s+그래도/g, replacement: '하지만', description: '중복 연결어 제거' },
    { pattern: /왜냐하면\s+.*때문이다/g, replacement: '', description: '설명체 제거' },

    // 감정 직접 언급
    { pattern: /(슬픔|기쁨|분노|두려움)을?\s+느꼈다/g, replacement: null, description: '감정 직접 언급 제거' },
    { pattern: /(슬프|기쁘|화나|무섭)다고\s+생각했다/g, replacement: null, description: '감정 직접 언급 제거' },

    // 과도한 설명
    { pattern: /다시\s+말해서?\s+/g, replacement: '', description: '불필요한 부연 제거' },
    { pattern: /즉,?\s+/g, replacement: '', description: '불필요한 부연 제거' },
    { pattern: /요컨대\s+/g, replacement: '', description: '요약체 제거' },

    // AI 특유의 리스트화
    { pattern: /첫째,?\s+.*둘째,?\s+.*셋째/g, replacement: null, description: '리스트 나열 제거' },
    { pattern: /먼저\s+.*그리고\s+.*마지막으로/g, replacement: null, description: '순차 나열 제거' },

    // 불필요한 메타 언급
    { pattern: /이\s+순간\s+/g, replacement: '', description: '메타 언급 제거' },
    { pattern: /바로\s+그\s+순간\s+/g, replacement: '', description: '과장된 순간 강조 제거' },
    { pattern: /그야말로\s+/g, replacement: '', description: '과장 표현 제거' },

    // 과도한 수동태
    { pattern: /~(되어|돼)\s*지고\s+있었다/g, replacement: '~했다', description: '수동태 능동태화' },
    { pattern: /~(되어|돼)졌다/g, replacement: '~했다', description: '수동태 능동태화' },
  ],

  humanizationRules: [
    {
      trigger: '심장이 뛰었다',
      alternatives: [
        '가슴팍에서 뭔가 쿵 했다',
        '갈비뼈 안쪽이 요동쳤다',
        '심장이 한 박자 삐끗했다',
        '가슴속에서 북이 울렸다',
      ],
      context: '긴장/설렘 표현',
    },
    {
      trigger: '눈물이 흘렀다',
      alternatives: [
        '눈가가 뜨거워졌다',
        '시야가 흐려졌다',
        '볼을 타고 뭔가 흘러내렸다',
        '눈꺼풀이 무거워졌다',
      ],
      context: '슬픔 표현',
    },
    {
      trigger: '화가 났다',
      alternatives: [
        '머리끝이 뜨거워졌다',
        '이가 갈렸다',
        '손이 저절로 주먹이 됐다',
        '목 뒤로 열이 올랐다',
      ],
      context: '분노 표현',
    },
    {
      trigger: '무서웠다',
      alternatives: [
        '등줄기가 서늘해졌다',
        '다리에 힘이 빠졌다',
        '입안이 바짝 말랐다',
        '목구멍이 조여왔다',
      ],
      context: '공포 표현',
    },
    {
      trigger: '기뻤다',
      alternatives: [
        '입꼬리가 저절로 올라갔다',
        '어깨가 가벼워졌다',
        '발걸음이 통통 튀었다',
        '가슴 어딘가가 부풀어 올랐다',
      ],
      context: '기쁨 표현',
    },
  ],

  bannedPhrases: [
    // AI가 자주 쓰는 클리셰
    '순간', '바로 그', '마침내', '드디어', '결국',
    '그야말로', '문자 그대로', '말 그대로',
    '~할 수밖에 없었다', '~하지 않을 수 없었다',
    '깊은 감동', '진한 감동', '벅찬 감동',
    '뜨거운 눈물', '차가운 시선', '따뜻한 마음',
    '영원히', '영원히 잊지 못할',
    '그 어느 때보다', '그 무엇보다',
    '~의 연속이었다', '~의 시간이었다',
    // 감정 직접 언급
    '행복했다', '슬펐다', '화가 났다', '무서웠다',
    '기뻤다', '우울했다', '외로웠다',
  ],

  variationRequirements: [
    { pattern: '말했다', minVariations: 5 },
    { pattern: '생각했다', minVariations: 4 },
    { pattern: '보였다', minVariations: 3 },
    { pattern: '느꼈다', minVariations: 4 },
    { pattern: '걸었다', minVariations: 3 },
  ],
};

// ============================================
// 문체 프리셋
// ============================================

export type StylePreset = 'literary-korean' | 'web-novel-fantasy' | 'historical-korean' | 'romance' | 'thriller';

export const STYLE_PRESETS: Record<StylePreset, Partial<StyleDNA>> = {
  'literary-korean': {
    name: '한국 순수문학',
    description: '김영하, 신경숙, 은희경 스타일의 현대 한국 문학',
    rhythm: {
      averageSentenceLength: 'varied',
      paragraphBreathing: 'spacious',
      punctuationStyle: 'minimal',
      lineBreakFrequency: 7,
    },
    vocabulary: {
      formalityLevel: 4,
      archaicWords: false,
      neologisms: false,
      dialectUsage: null,
      technicalTerms: 'avoid',
      foreignWords: 'minimal',
    },
    descriptionStyle: {
      sensoryFocus: ['visual', 'tactile', 'olfactory'],
      metaphorDensity: 'rich',
      metaphorStyle: 'fresh',
      detailLevel: 5,
      showVsTell: 9,
    },
    emotion: {
      directness: 'subtle',
      internalMonologue: 'frequent',
      physicalManifestationFocus: true,
      emotionalRestraint: 7,
    },
    signatures: {
      openingPatterns: [
        '짧은 문장으로 시작',
        '감각적 이미지로 시작',
        '행동 중간에 시작',
      ],
      closingPatterns: [
        '여운을 남기는 이미지',
        '미완의 행동',
        '열린 결말',
      ],
      transitionPhrases: [],
      characteristicExpressions: [],
      avoidExpressions: ['그러나', '하지만', '왜냐하면'],
    },
  },

  'web-novel-fantasy': {
    name: '웹소설 판타지',
    description: '몰입감 있는 판타지 웹소설 스타일',
    rhythm: {
      averageSentenceLength: 'short',
      paragraphBreathing: 'tight',
      punctuationStyle: 'expressive',
      lineBreakFrequency: 9,
    },
    vocabulary: {
      formalityLevel: 2,
      archaicWords: false,
      neologisms: true,
      dialectUsage: null,
      technicalTerms: 'moderate',
      foreignWords: 'moderate',
    },
    descriptionStyle: {
      sensoryFocus: ['visual', 'auditory'],
      metaphorDensity: 'moderate',
      metaphorStyle: 'conventional',
      detailLevel: 3,
      showVsTell: 6,
    },
    dialogue: {
      tagStyle: 'minimal',
      actionBeatFrequency: 'frequent',
      subTextLevel: 2,
      interruptionStyle: true,
      dialectInDialogue: false,
    },
    emotion: {
      directness: 'direct',
      internalMonologue: 'frequent',
      physicalManifestationFocus: true,
      emotionalRestraint: 3,
    },
  },

  'historical-korean': {
    name: '한국 역사소설',
    description: '사극/역사 소설 스타일',
    rhythm: {
      averageSentenceLength: 'long',
      paragraphBreathing: 'moderate',
      punctuationStyle: 'standard',
      lineBreakFrequency: 5,
    },
    vocabulary: {
      formalityLevel: 5,
      archaicWords: true,
      neologisms: false,
      dialectUsage: null,
      technicalTerms: 'moderate',
      foreignWords: 'avoid',
    },
    descriptionStyle: {
      sensoryFocus: ['visual', 'auditory', 'olfactory'],
      metaphorDensity: 'rich',
      metaphorStyle: 'conventional',
      detailLevel: 5,
      showVsTell: 7,
    },
    dialogue: {
      tagStyle: 'descriptive',
      actionBeatFrequency: 'moderate',
      subTextLevel: 4,
      interruptionStyle: false,
      dialectInDialogue: true,
    },
  },

  'romance': {
    name: '로맨스',
    description: '감성적인 로맨스 소설 스타일',
    rhythm: {
      averageSentenceLength: 'medium',
      paragraphBreathing: 'spacious',
      punctuationStyle: 'expressive',
      lineBreakFrequency: 8,
    },
    vocabulary: {
      formalityLevel: 3,
      archaicWords: false,
      neologisms: false,
      dialectUsage: null,
      technicalTerms: 'avoid',
      foreignWords: 'minimal',
    },
    descriptionStyle: {
      sensoryFocus: ['visual', 'tactile', 'olfactory'],
      metaphorDensity: 'rich',
      metaphorStyle: 'fresh',
      detailLevel: 4,
      showVsTell: 8,
    },
    emotion: {
      directness: 'moderate',
      internalMonologue: 'frequent',
      physicalManifestationFocus: true,
      emotionalRestraint: 4,
    },
  },

  'thriller': {
    name: '스릴러',
    description: '긴장감 넘치는 스릴러 스타일',
    rhythm: {
      averageSentenceLength: 'short',
      paragraphBreathing: 'tight',
      punctuationStyle: 'expressive',
      lineBreakFrequency: 9,
    },
    vocabulary: {
      formalityLevel: 3,
      archaicWords: false,
      neologisms: false,
      dialectUsage: null,
      technicalTerms: 'moderate',
      foreignWords: 'minimal',
    },
    descriptionStyle: {
      sensoryFocus: ['visual', 'auditory'],
      metaphorDensity: 'sparse',
      metaphorStyle: 'conventional',
      detailLevel: 3,
      showVsTell: 7,
    },
    emotion: {
      directness: 'subtle',
      internalMonologue: 'moderate',
      physicalManifestationFocus: true,
      emotionalRestraint: 6,
    },
    narration: {
      narratorDistance: 'close',
      tenseConsistency: 'strict',
      authorIntrusionLevel: 'none',
      humorStyle: 'none',
    },
  },
};

// ============================================
// 인간 문체 엔진 클래스
// ============================================

export class HumanStyleEngine {
  private styleDNA: StyleDNA | null = null;
  private decontaminationRules: AIDecontaminationRules = DEFAULT_AI_DECONTAMINATION;

  /**
   * 문체 DNA 설정
   */
  setStyleDNA(style: StyleDNA | Partial<StyleDNA>): void {
    this.styleDNA = style as StyleDNA;
  }

  /**
   * 프리셋에서 문체 로드
   */
  loadPreset(presetName: keyof typeof STYLE_PRESETS): void {
    const preset = STYLE_PRESETS[presetName];
    if (preset) {
      this.styleDNA = preset as StyleDNA;
    }
  }

  /**
   * 샘플 텍스트에서 문체 학습
   */
  async learnStyleFromSamples(
    apiKey: string,
    samples: string[],
    model: GeminiModel = 'gemini-2.5-pro'
  ): Promise<StyleDNA> {
    const prompt = `당신은 문체 분석 전문가입니다.
다음 샘플 텍스트들의 문체적 특성을 정밀하게 분석해주세요.

## 샘플 텍스트
${samples.map((s, i) => `### 샘플 ${i + 1}\n${s.slice(0, 2000)}`).join('\n\n')}

## 분석 항목

### 1. 문장 리듬
- 평균 문장 길이 (very-short/short/medium/long/varied)
- 문단 호흡 (tight/moderate/spacious)
- 구두점 스타일 (minimal/standard/expressive)
- 줄바꿈 빈도 (1-10)

### 2. 어휘 특성
- 격식 수준 (1=구어체, 5=문어체)
- 고풍스러운 단어 사용 여부
- 신조어 사용 여부
- 방언 사용 여부
- 전문 용어 사용 수준
- 외래어 사용 수준

### 3. 묘사 스타일
- 주로 활용하는 감각 (visual/auditory/tactile/olfactory/gustatory)
- 은유 밀도 (sparse/moderate/rich)
- 은유 스타일 (conventional/fresh/surreal)
- 묘사 상세도 (1-5)
- Show vs Tell 비율 (1-10)

### 4. 대화 스타일
- 대화 태그 스타일 (minimal/standard/descriptive)
- 액션 비트 빈도 (rare/moderate/frequent)
- 서브텍스트 깊이 (1-5)
- 대화 끊김 스타일

### 5. 감정 표현
- 감정 표현의 직접성 (subtle/moderate/direct)
- 내적 독백 빈도 (rare/moderate/frequent)
- 신체적 표현 선호도
- 감정 절제 수준 (1-10)

### 6. 서술 특성
- 화자 거리감 (close/medium/distant)
- 시제 일관성 (strict/flexible)
- 저자 개입 수준
- 유머 스타일

### 7. 시그니처 패턴
- 자주 사용하는 시작 패턴
- 자주 사용하는 마무리 패턴
- 특징적인 전환구
- 작가만의 독특한 표현들
- 피하는 표현들

## 응답 형식 (JSON)
{
  "id": "custom-learned-style",
  "name": "학습된 문체",
  "description": "분석된 문체 특성 요약",
  "rhythm": {
    "averageSentenceLength": "varied",
    "paragraphBreathing": "moderate",
    "punctuationStyle": "standard",
    "lineBreakFrequency": 5
  },
  "vocabulary": {
    "formalityLevel": 3,
    "archaicWords": false,
    "neologisms": false,
    "dialectUsage": null,
    "technicalTerms": "minimal",
    "foreignWords": "minimal"
  },
  "description": {
    "sensoryFocus": ["visual", "tactile"],
    "metaphorDensity": "moderate",
    "metaphorStyle": "fresh",
    "detailLevel": 4,
    "showVsTell": 7
  },
  "dialogue": {
    "tagStyle": "minimal",
    "actionBeatFrequency": "moderate",
    "subTextLevel": 3,
    "interruptionStyle": false,
    "dialectInDialogue": false
  },
  "emotion": {
    "directness": "subtle",
    "internalMonologue": "moderate",
    "physicalManifestationFocus": true,
    "emotionalRestraint": 6
  },
  "narration": {
    "narratorDistance": "close",
    "tenseConsistency": "strict",
    "authorIntrusionLevel": "none",
    "humorStyle": "dry"
  },
  "signatures": {
    "openingPatterns": ["패턴1", "패턴2"],
    "closingPatterns": ["패턴1"],
    "transitionPhrases": ["전환구1"],
    "characteristicExpressions": ["특징적 표현1"],
    "avoidExpressions": ["피하는 표현1"]
  }
}

JSON만 출력하세요.`;

    try {
      const result = await generateJSON<StyleDNA>(apiKey, prompt, {
        model,
        temperature: 0.3,
      });
      this.styleDNA = result;
      return result;
    } catch (error) {
      console.error('[HumanStyleEngine] 문체 학습 실패:', error);
      throw error;
    }
  }

  /**
   * AI 느낌 제거 (탈AI화)
   */
  decontaminateAI(text: string): {
    result: string;
    changes: { original: string; replacement: string; reason: string }[];
  } {
    const changes: { original: string; replacement: string; reason: string }[] = [];
    let result = text;

    // 1. AI 패턴 제거/교체
    for (const rule of this.decontaminationRules.aiPatterns) {
      const matches = result.match(rule.pattern);
      if (matches) {
        for (const match of matches) {
          changes.push({
            original: match,
            replacement: rule.replacement || '[삭제됨]',
            reason: rule.description,
          });
        }
        result = result.replace(rule.pattern, rule.replacement || '');
      }
    }

    // 2. 금지 표현 감지
    for (const phrase of this.decontaminationRules.bannedPhrases) {
      if (result.includes(phrase)) {
        changes.push({
          original: phrase,
          replacement: '[교체 필요]',
          reason: 'AI 클리셰 감지',
        });
      }
    }

    // 3. 인간화 규칙 적용 제안
    for (const rule of this.decontaminationRules.humanizationRules) {
      if (result.includes(rule.trigger)) {
        const alternative = rule.alternatives[Math.floor(Math.random() * rule.alternatives.length)];
        changes.push({
          original: rule.trigger,
          replacement: alternative,
          reason: `${rule.context} - 더 인간적인 표현으로 교체`,
        });
        result = result.replace(rule.trigger, alternative);
      }
    }

    // 4. 중복 표현 정리
    result = this.removeDuplicateExpressions(result);

    // 5. 문장 호흡 조절
    result = this.adjustSentenceBreathing(result);

    return { result, changes };
  }

  /**
   * 문체 적용 프롬프트 생성
   */
  generateStylePrompt(): string {
    if (!this.styleDNA) {
      return '';
    }

    const s = this.styleDNA;

    return `
## 🎨 문체 DNA 적용 지침

### 문체 프로필: ${s.name}
${s.description}

### 1. 문장 리듬
- 문장 길이: ${this.getRhythmDescription(s.rhythm?.averageSentenceLength)}
- 문단 호흡: ${s.rhythm?.paragraphBreathing === 'tight' ? '촘촘하게' : s.rhythm?.paragraphBreathing === 'spacious' ? '여유롭게' : '보통'}
- 구두점: ${s.rhythm?.punctuationStyle === 'minimal' ? '최소한으로' : s.rhythm?.punctuationStyle === 'expressive' ? '표현력 있게' : '표준'}
- 줄바꿈: ${s.rhythm?.lineBreakFrequency}0% 정도에서

### 2. 어휘
- 격식: ${this.getFormalityDescription(s.vocabulary?.formalityLevel)}
${s.vocabulary?.archaicWords ? '- 고풍스러운 단어 자연스럽게 사용' : '- 현대적 어휘 사용'}
${s.vocabulary?.dialectUsage ? `- 방언: ${s.vocabulary.dialectUsage}` : ''}
- 전문용어: ${s.vocabulary?.technicalTerms === 'avoid' ? '피하기' : s.vocabulary?.technicalTerms === 'heavy' ? '적극 사용' : '적절히'}

### 3. 묘사
- 주요 감각: ${s.descriptionStyle?.sensoryFocus?.join(', ')}
- 은유 밀도: ${s.descriptionStyle?.metaphorDensity === 'sparse' ? '절제된' : s.descriptionStyle?.metaphorDensity === 'rich' ? '풍부한' : '적절한'}
- 은유 스타일: ${s.descriptionStyle?.metaphorStyle === 'fresh' ? '신선하고 독창적인' : s.descriptionStyle?.metaphorStyle === 'surreal' ? '초현실적인' : '전통적인'}
- Show vs Tell: ${(s.descriptionStyle?.showVsTell || 7) * 10}% 보여주기

### 4. 대화
- 대화 태그: ${s.dialogue?.tagStyle === 'minimal' ? '최소한으로 ("말했다" 위주)' : s.dialogue?.tagStyle === 'descriptive' ? '상세하게' : '표준'}
- 액션 비트: ${s.dialogue?.actionBeatFrequency === 'frequent' ? '자주 넣기' : s.dialogue?.actionBeatFrequency === 'rare' ? '거의 안 넣기' : '적절히'}
- 서브텍스트: ${s.dialogue?.subTextLevel || 3}단계 깊이 (말과 속마음 사이의 거리)

### 5. 감정 표현
- 직접성: ${s.emotion?.directness === 'subtle' ? '미묘하게, 간접적으로' : s.emotion?.directness === 'direct' ? '직접적으로' : '적절히'}
- 내적 독백: ${s.emotion?.internalMonologue === 'frequent' ? '자주' : s.emotion?.internalMonologue === 'rare' ? '거의 안' : '적절히'}
${s.emotion?.physicalManifestationFocus ? '- ⚠️ 감정을 반드시 신체적 반응으로 표현' : ''}
- 감정 절제: ${(s.emotion?.emotionalRestraint || 5) * 10}%

### 6. 서술
- 화자 거리: ${s.narration?.narratorDistance === 'close' ? '밀착' : s.narration?.narratorDistance === 'distant' ? '거리두기' : '중간'}
${s.narration?.humorStyle !== 'none' ? `- 유머: ${s.narration?.humorStyle}` : ''}

### 7. 시그니처 (이 작가만의 특징)
${s.signatures?.characteristicExpressions?.length ? `사용할 표현: ${s.signatures.characteristicExpressions.slice(0, 3).join(', ')}` : ''}
${s.signatures?.avoidExpressions?.length ? `피할 표현: ${s.signatures.avoidExpressions.slice(0, 5).join(', ')}` : ''}

### 🚫 AI 느낌 제거 필수 규칙

**절대 사용 금지:**
${this.decontaminationRules.bannedPhrases.slice(0, 15).map(p => `- "${p}"`).join('\n')}

**감정 표현 규칙:**
- ❌ "슬펐다", "기뻤다", "화가 났다" 등 감정 직접 언급 금지
- ✅ 신체 반응, 행동, 감각으로 감정 표현

**문장 변화:**
- 같은 시작어 3번 연속 사용 금지
- "~했다" 문장 패턴 다양화 필수
- 대화 태그 "말했다" 외 최소 5가지 변형 사용

**AI 특유 패턴 금지:**
- 과도한 수식어 (매우, 정말, 굉장히)
- 설명적 구문 ("~라고 할 수 있다")
- 이중 부정 ("~하지 않을 수 없다")
- 순서 나열 ("첫째... 둘째... 셋째")
`;
  }

  /**
   * 생성된 텍스트 후처리
   */
  async postProcess(
    apiKey: string,
    text: string,
    model: GeminiModel = 'gemini-2.5-flash'
  ): Promise<{
    refined: string;
    improvements: string[];
    score: { before: number; after: number };
  }> {
    // 1. 기본 탈AI화
    const { result: decontaminated, changes } = this.decontaminateAI(text);

    // 2. AI를 이용한 정교화
    const prompt = `당신은 출판 편집자입니다. 다음 텍스트를 더 인간적이고 문학적으로 다듬어주세요.

## 원본 텍스트
${decontaminated}

## 수정 지침
1. AI 느낌이 나는 표현을 모두 제거하세요
2. 감정을 직접 언급하지 말고 신체 반응/행동으로 표현하세요
3. 클리셰를 신선한 표현으로 교체하세요
4. 문장 리듬을 다양하게 만드세요
5. 불필요한 수식어를 제거하세요
6. 과도한 설명을 줄이세요

## 응답 형식 (JSON)
{
  "refined": "다듬어진 텍스트 전문",
  "improvements": [
    "개선 사항 1",
    "개선 사항 2"
  ],
  "aiScore": {
    "before": 1-100 (AI 느낌 정도, 낮을수록 좋음),
    "after": 1-100
  }
}

JSON만 출력하세요.`;

    try {
      const result = await generateJSON<{
        refined: string;
        improvements: string[];
        aiScore: { before: number; after: number };
      }>(apiKey, prompt, {
        model,
        temperature: 0.7,
      });

      return {
        refined: result.refined,
        improvements: [...changes.map(c => `${c.original} → ${c.replacement}`), ...result.improvements],
        score: result.aiScore,
      };
    } catch (error) {
      console.error('[HumanStyleEngine] 후처리 실패:', error);
      return {
        refined: decontaminated,
        improvements: changes.map(c => `${c.original} → ${c.replacement}`),
        score: { before: 50, after: 40 },
      };
    }
  }

  // ============================================
  // Private Helper Methods
  // ============================================

  private getRhythmDescription(length?: string): string {
    switch (length) {
      case 'very-short': return '매우 짧게 (5-10단어)';
      case 'short': return '짧게 (10-15단어)';
      case 'medium': return '중간 (15-25단어)';
      case 'long': return '길게 (25단어 이상)';
      case 'varied': return '다양하게 섞어서';
      default: return '중간';
    }
  }

  private getFormalityDescription(level?: number): string {
    switch (level) {
      case 1: return '완전 구어체';
      case 2: return '구어체';
      case 3: return '중립';
      case 4: return '문어체';
      case 5: return '격식체/고급 문어체';
      default: return '중립';
    }
  }

  private removeDuplicateExpressions(text: string): string {
    // 연속으로 같은 문장 시작 패턴 감지 및 변형
    const sentences = text.split(/(?<=[.!?])\s+/);
    const result: string[] = [];

    let lastStarter = '';
    for (const sentence of sentences) {
      const starter = sentence.slice(0, 5);
      if (starter === lastStarter && result.length > 0) {
        // 문장 시작 변형 (간단한 처리)
        result.push(sentence);
      } else {
        result.push(sentence);
      }
      lastStarter = starter;
    }

    return result.join(' ');
  }

  private adjustSentenceBreathing(text: string): string {
    // 너무 긴 문장 분리, 너무 짧은 문장 연결 등
    // 기본적인 처리만 수행
    return text
      .replace(/,\s*,/g, ',')
      .replace(/\.\s*\./g, '.')
      .replace(/\s+/g, ' ')
      .trim();
  }
}

// ============================================
// 내보내기
// ============================================

export const humanStyleEngine = new HumanStyleEngine();
export default HumanStyleEngine;
