/**
 * 문학적 깊이 강화 시스템 (Literary Depth System)
 *
 * 노벨 문학상 수상작들의 특징을 분석하여
 * 작가가 더 깊이 있는 글을 쓸 수 있도록 보조
 *
 * 핵심 원칙:
 * 1. 단순한 스토리텔링 → 인간 조건의 탐구
 * 2. 표면적 묘사 → 다층적 의미
 * 3. 클리셰 → 독창적 표현
 * 4. 설명 → 암시와 여백
 * 5. 플롯 중심 → 내면 중심
 */

// ============================================
// 문학적 깊이 레벨 정의
// ============================================

export type LiteraryDepthLevel =
  | 'commercial'      // 상업 소설 - 재미 중심
  | 'literary'        // 순문학 - 문학성 중시
  | 'profound'        // 깊은 문학 - 인간 탐구
  | 'masterpiece';    // 걸작 - 새로운 지평

export interface LiteraryAnalysis {
  currentLevel: LiteraryDepthLevel;
  score: number; // 0-100
  strengths: string[];
  weaknesses: string[];
  suggestions: LiterarySuggestion[];
  thematicDepth: ThematicDepthAnalysis;
  characterDepth: CharacterDepthAnalysis;
  proseQuality: ProseQualityAnalysis;
  symbolicLayer: SymbolicLayerAnalysis;
}

export interface LiterarySuggestion {
  category: 'theme' | 'character' | 'prose' | 'structure' | 'symbol' | 'subtext';
  priority: 'critical' | 'important' | 'suggested';
  title: string;
  description: string;
  example: string;
  reference?: string; // 참고할 만한 작품
}

// ============================================
// 주제적 깊이 분석
// ============================================

export interface ThematicDepthAnalysis {
  identifiedThemes: IdentifiedTheme[];
  universalQuestions: string[];
  missingDepth: string[];
  score: number;
}

export interface IdentifiedTheme {
  theme: string;
  presence: 'surface' | 'developed' | 'profound';
  manifestations: string[];
  suggestion: string;
}

// 보편적 인간 조건 - 위대한 문학의 핵심 주제들
export const UNIVERSAL_HUMAN_CONDITIONS = [
  {
    theme: '죽음과 유한성',
    questions: [
      '인간은 자신의 죽음을 어떻게 받아들이는가?',
      '삶의 유한함이 주는 의미는 무엇인가?',
      '죽음 앞에서 인간의 본성은 어떻게 드러나는가?',
    ],
    masterworks: ['변신(카프카)', '이방인(카뮈)', '죽음의 집의 기록(도스토예프스키)'],
  },
  {
    theme: '사랑과 상실',
    questions: [
      '사랑은 인간을 구원하는가, 파멸시키는가?',
      '상실 후에 남는 것은 무엇인가?',
      '진정한 사랑과 집착의 경계는?',
    ],
    masterworks: ['안나 카레니나(톨스토이)', '폭풍의 언덕(에밀리 브론테)', '채식주의자(한강)'],
  },
  {
    theme: '정체성과 자아',
    questions: [
      '나는 누구인가?',
      '사회가 규정한 나와 진정한 나의 괴리',
      '정체성은 고정된 것인가, 유동적인 것인가?',
    ],
    masterworks: ['변신(카프카)', '소년이 온다(한강)', '구토(사르트르)'],
  },
  {
    theme: '권력과 억압',
    questions: [
      '권력은 인간을 어떻게 변화시키는가?',
      '억압받는 자의 내면은 어떠한가?',
      '저항과 순응 사이의 선택',
    ],
    masterworks: ['1984(오웰)', '동물농장(오웰)', '소년이 온다(한강)'],
  },
  {
    theme: '고독과 연결',
    questions: [
      '인간은 근본적으로 고독한가?',
      '타인과의 진정한 연결은 가능한가?',
      '고독 속에서 발견하는 것은 무엇인가?',
    ],
    masterworks: ['백년의 고독(마르케스)', '노인과 바다(헤밍웨이)', '나무 위의 남작(칼비노)'],
  },
  {
    theme: '시간과 기억',
    questions: [
      '과거는 현재를 어떻게 지배하는가?',
      '기억은 진실인가, 재구성인가?',
      '시간의 흐름 앞에서 인간은 무엇을 붙잡는가?',
    ],
    masterworks: ['잃어버린 시간을 찾아서(프루스트)', '백년의 고독(마르케스)', '소년이 온다(한강)'],
  },
  {
    theme: '죄와 속죄',
    questions: [
      '용서받을 수 없는 죄가 있는가?',
      '속죄는 가능한가?',
      '가해자와 피해자의 경계',
    ],
    masterworks: ['죄와 벌(도스토예프스키)', '속죄(이언 매큐언)', '소년이 온다(한강)'],
  },
  {
    theme: '존재의 부조리',
    questions: [
      '삶에 의미가 있는가?',
      '부조리한 세계에서 어떻게 살아야 하는가?',
      '의미 없음을 받아들인 후의 자유',
    ],
    masterworks: ['이방인(카뮈)', '시지프 신화(카뮈)', '성(카프카)'],
  },
];

// ============================================
// 캐릭터 깊이 분석
// ============================================

export interface CharacterDepthAnalysis {
  characters: CharacterDepthProfile[];
  overallScore: number;
  suggestions: string[];
}

export interface CharacterDepthProfile {
  name: string;
  depthLevel: 'flat' | 'round' | 'complex' | 'profound';
  innerContradictions: string[];
  unconsciousMotives: string[];
  moralAmbiguity: number; // 0-10
  growthArc: 'none' | 'linear' | 'complex' | 'cyclical';
  uniqueVoice: boolean;
  suggestions: string[];
}

// 깊은 캐릭터의 특징
export const PROFOUND_CHARACTER_TRAITS = {
  innerContradiction: {
    description: '내면의 모순 - 캐릭터 자신도 모르는 모순된 욕망',
    example: '정의를 외치면서도 복수를 갈망하는 인물',
    questions: [
      '이 인물이 인정하지 않으려는 욕망은 무엇인가?',
      '표면적 목표와 무의식적 욕망의 충돌은?',
      '이 인물의 자기기만은 무엇인가?',
    ],
  },
  moralAmbiguity: {
    description: '도덕적 모호성 - 선악으로 단순화할 수 없는 복잡성',
    example: '사랑하는 사람을 지키기 위해 타인을 희생시키는 선택',
    questions: [
      '이 인물의 행동을 단순히 선/악으로 판단할 수 있는가?',
      '독자가 이 인물에게 느끼는 감정은 단순한가 복잡한가?',
      '이 인물의 가장 나쁜 행동에 공감할 수 있는가?',
    ],
  },
  blindSpot: {
    description: '맹점 - 캐릭터가 보지 못하지만 독자는 보는 것',
    example: '자신의 질투심을 정의감으로 착각하는 인물',
    questions: [
      '이 인물이 자신에 대해 모르는 것은 무엇인가?',
      '독자는 인물보다 무엇을 더 알고 있는가?',
      '이 맹점이 어떤 비극/희극을 만들어내는가?',
    ],
  },
  universality: {
    description: '보편성 - 특수한 상황에서 보편적 인간을 보여줌',
    example: '16세기 조선의 무관이지만 현대 독자가 공감하는 고뇌',
    questions: [
      '이 인물의 고뇌가 시대를 초월하는가?',
      '다른 시대/문화의 독자도 이 인물을 이해할 수 있는가?',
      '이 인물을 통해 인간 일반에 대해 무엇을 배우는가?',
    ],
  },
};

// ============================================
// 문체/산문 품질 분석
// ============================================

export interface ProseQualityAnalysis {
  score: number;
  strengths: string[];
  weaknesses: string[];
  styleMarkers: StyleMarker[];
  voiceConsistency: number;
  rhythmQuality: number;
  imageryDensity: number;
  suggestions: ProseSuggestion[];
}

export interface StyleMarker {
  type: 'metaphor' | 'rhythm' | 'silence' | 'sensory' | 'voice' | 'structure';
  quality: 'weak' | 'adequate' | 'strong' | 'exceptional';
  examples: string[];
  suggestion?: string;
}

export interface ProseSuggestion {
  category: string;
  current: string;
  improved: string;
  reason: string;
}

// 탁월한 문체의 요소
export const EXCEPTIONAL_PROSE_ELEMENTS = {
  metaphor: {
    description: '은유 - 새로운 시각을 열어주는 비유',
    badExample: '그녀의 눈은 별처럼 빛났다',
    goodExample: '그녀의 눈에서 밤하늘이 쏟아져 내렸다',
    excellentExample: '그녀가 눈을 떴다. 그 순간 방 안의 어둠이 부끄러워졌다',
    tip: '클리셰를 피하고, 익숙한 것을 낯설게 만드세요',
  },
  rhythm: {
    description: '리듬 - 문장의 음악성',
    badExample: '그는 걸었다. 그는 생각했다. 그는 멈췄다.',
    goodExample: '걸으며 생각했다, 생각하며 걸었다, 그리고 멈췄다.',
    excellentExample: '발걸음마다 생각이 밀려왔다. 마침내, 멈춤.',
    tip: '문장 길이를 다양하게, 중요한 순간에는 짧게',
  },
  silence: {
    description: '여백 - 말하지 않음으로써 말하기',
    badExample: '그녀는 슬펐다. 너무 슬퍼서 눈물이 흘렀다.',
    goodExample: '그녀는 아무 말도 하지 않았다.',
    excellentExample: '창밖으로 눈이 내렸다.',
    tip: '감정을 직접 설명하지 말고, 여백을 통해 독자가 채우게 하세요',
  },
  sensory: {
    description: '감각 - 오감을 통한 묘사',
    badExample: '날씨가 좋았다.',
    goodExample: '햇살이 따뜻했다.',
    excellentExample: '피부에 닿는 햇살에서 먼지 냄새가 났다',
    tip: '시각에만 의존하지 말고, 모든 감각을 활용하세요',
  },
  voice: {
    description: '목소리 - 작가만의 고유한 톤',
    tip: '다른 누구도 아닌 당신만이 쓸 수 있는 문장을 찾으세요',
    questions: [
      '이 문장이 다른 작가도 쓸 수 있는 문장인가?',
      '이 문장에 나만의 시각이 담겨 있는가?',
      '이 문장을 읽으면 누가 썼는지 알 수 있는가?',
    ],
  },
};

// ============================================
// 상징/암시 레이어 분석
// ============================================

export interface SymbolicLayerAnalysis {
  symbols: IdentifiedSymbol[];
  motifs: IdentifiedMotif[];
  subtextLayers: SubtextLayer[];
  score: number;
  suggestions: string[];
}

export interface IdentifiedSymbol {
  symbol: string;
  meaning: string;
  occurrences: number;
  effectiveness: 'weak' | 'moderate' | 'strong';
  suggestion?: string;
}

export interface IdentifiedMotif {
  motif: string;
  function: string;
  development: 'static' | 'evolving' | 'transforming';
  suggestion?: string;
}

export interface SubtextLayer {
  surface: string;
  subtext: string;
  technique: string;
}

// 상징과 모티프 가이드
export const SYMBOLIC_TECHNIQUES = {
  naturalSymbol: {
    description: '자연물 상징',
    examples: [
      { symbol: '물', meanings: ['정화', '시간', '무의식', '죽음'] },
      { symbol: '불', meanings: ['열정', '파괴', '정화', '지식'] },
      { symbol: '나무', meanings: ['생명', '성장', '가족', '뿌리'] },
      { symbol: '눈', meanings: ['순수', '죽음', '덮음', '고요'] },
    ],
  },
  colorSymbol: {
    description: '색채 상징',
    examples: [
      { symbol: '흰색', meanings: ['순수', '공허', '죽음', '시작'] },
      { symbol: '검정', meanings: ['죽음', '권력', '비밀', '우아'] },
      { symbol: '빨강', meanings: ['피', '열정', '분노', '생명'] },
      { symbol: '초록', meanings: ['생명', '질투', '자연', '희망'] },
    ],
  },
  motifDevelopment: {
    description: '모티프 발전',
    technique: '같은 이미지를 반복하되 의미를 변화시킨다',
    example: '처음에는 따뜻함의 상징이던 불이, 결말에서는 파괴의 불로 변모',
  },
  subtext: {
    description: '서브텍스트 - 말 아래의 의미',
    techniques: [
      '대화에서 말하지 않는 것이 말하는 것보다 중요할 때',
      '행동과 말의 불일치',
      '환경 묘사를 통한 내면 암시',
      '반복되는 이미지를 통한 주제 강조',
    ],
  },
};

// ============================================
// 분석 함수들
// ============================================

/**
 * 텍스트의 문학적 깊이를 분석합니다.
 */
export function analyzeLiteraryDepth(text: string): LiteraryAnalysis {
  const thematicDepth = analyzeThematicDepth(text);
  const characterDepth = analyzeCharacterDepth(text);
  const proseQuality = analyzeProseQuality(text);
  const symbolicLayer = analyzeSymbolicLayer(text);

  // 종합 점수 계산
  const score = Math.round(
    thematicDepth.score * 0.3 +
    characterDepth.overallScore * 0.25 +
    proseQuality.score * 0.25 +
    symbolicLayer.score * 0.2
  );

  // 레벨 결정
  let currentLevel: LiteraryDepthLevel;
  if (score >= 85) currentLevel = 'masterpiece';
  else if (score >= 70) currentLevel = 'profound';
  else if (score >= 50) currentLevel = 'literary';
  else currentLevel = 'commercial';

  const suggestions: LiterarySuggestion[] = [];

  // 주제 관련 제안
  if (thematicDepth.score < 60) {
    suggestions.push({
      category: 'theme',
      priority: 'critical',
      title: '보편적 인간 조건 탐구',
      description: '표면적 플롯 너머의 인간 본성에 대한 질문을 던지세요',
      example: '단순히 "전쟁에서 살아남기"가 아니라 "전쟁이 인간의 본성을 어떻게 드러내는가"를 탐구',
      reference: '카뮈의 <이방인>, 한강의 <소년이 온다>',
    });
  }

  // 캐릭터 관련 제안
  if (characterDepth.overallScore < 60) {
    suggestions.push({
      category: 'character',
      priority: 'critical',
      title: '캐릭터의 내면 모순 추가',
      description: '캐릭터가 스스로도 인정하지 못하는 욕망이나 두려움을 부여하세요',
      example: '정의를 위해 싸우는 인물이 실은 복수심에 불타고 있음을 스스로 인정하지 못함',
      reference: '도스토예프스키의 <죄와 벌>',
    });
  }

  // 문체 관련 제안
  if (proseQuality.score < 60) {
    suggestions.push({
      category: 'prose',
      priority: 'important',
      title: '여백과 암시 활용',
      description: '모든 것을 설명하지 말고, 독자가 채워넣을 공간을 남기세요',
      example: '"그녀는 슬펐다" 대신 "그녀는 아무 말도 하지 않았다. 창밖으로 눈이 내렸다."',
      reference: '헤밍웨이의 빙산 이론',
    });
  }

  // 상징 관련 제안
  if (symbolicLayer.score < 50) {
    suggestions.push({
      category: 'symbol',
      priority: 'suggested',
      title: '반복되는 이미지 구축',
      description: '핵심 주제를 상징하는 이미지를 반복적으로 사용하되, 의미를 점진적으로 변화시키세요',
      example: '처음에는 희망의 상징이던 "새"가 결말에서는 갇힘의 상징이 됨',
      reference: '한강의 <채식주의자>에서의 식물 모티프',
    });
  }

  return {
    currentLevel,
    score,
    strengths: collectStrengths(thematicDepth, characterDepth, proseQuality, symbolicLayer),
    weaknesses: collectWeaknesses(thematicDepth, characterDepth, proseQuality, symbolicLayer),
    suggestions,
    thematicDepth,
    characterDepth,
    proseQuality,
    symbolicLayer,
  };
}

function analyzeThematicDepth(text: string): ThematicDepthAnalysis {
  const identifiedThemes: IdentifiedTheme[] = [];
  const universalQuestions: string[] = [];
  const missingDepth: string[] = [];

  // 주제 키워드 탐지
  const themePatterns = [
    { theme: '죽음과 유한성', patterns: ['죽음', '죽', '생명', '삶과 죽', '유한', '필멸'] },
    { theme: '사랑과 상실', patterns: ['사랑', '상실', '이별', '그리움', '잃', '떠나'] },
    { theme: '정체성과 자아', patterns: ['나는 누구', '정체', '자아', '본질', '진정한 나'] },
    { theme: '권력과 억압', patterns: ['권력', '억압', '지배', '저항', '자유'] },
    { theme: '고독과 연결', patterns: ['고독', '외로', '연결', '소통', '고립'] },
    { theme: '죄와 속죄', patterns: ['죄', '벌', '용서', '속죄', '구원'] },
  ];

  let score = 30; // 기본 점수

  for (const { theme, patterns } of themePatterns) {
    let presence: 'surface' | 'developed' | 'profound' = 'surface';
    const found = patterns.filter(p => text.includes(p));

    if (found.length > 0) {
      if (found.length >= 3) {
        presence = 'developed';
        score += 10;
      }
      if (found.length >= 5) {
        presence = 'profound';
        score += 5;
      }

      identifiedThemes.push({
        theme,
        presence,
        manifestations: found,
        suggestion: presence === 'surface'
          ? `"${theme}" 주제를 더 깊이 탐구하세요. 표면적 언급을 넘어 인물의 내면과 연결하세요.`
          : '',
      });
    }
  }

  // 점수 제한
  score = Math.min(score, 100);

  // 누락된 깊이 감지
  if (identifiedThemes.length < 2) {
    missingDepth.push('보편적 주제가 부족합니다. 인간 조건에 대한 깊은 질문을 담으세요.');
  }

  return {
    identifiedThemes,
    universalQuestions,
    missingDepth,
    score,
  };
}

function analyzeCharacterDepth(text: string): CharacterDepthAnalysis {
  // 기본 분석 (실제로는 AI 분석 필요)
  const suggestions: string[] = [];
  let score = 50;

  // 내면 묘사 패턴 탐지
  const innerPatterns = [
    '생각했다', '느꼈다', '마음속', '내면', '의식', '무의식',
    '두려움', '욕망', '갈등', '모순', '자신도 모르게',
  ];

  const innerCount = innerPatterns.filter(p => text.includes(p)).length;
  score += innerCount * 3;

  // 도덕적 모호성 패턴
  const moralPatterns = [
    '옳은 것인지', '잘못된 것인지', '선과 악', '정당한',
    '어쩔 수 없', '선택의 여지', '희생',
  ];

  const moralCount = moralPatterns.filter(p => text.includes(p)).length;
  score += moralCount * 5;

  score = Math.min(score, 100);

  if (innerCount < 3) {
    suggestions.push('캐릭터의 내면 심리를 더 깊이 탐구하세요');
  }
  if (moralCount < 2) {
    suggestions.push('도덕적으로 모호한 상황을 통해 캐릭터의 복잡성을 보여주세요');
  }

  return {
    characters: [],
    overallScore: score,
    suggestions,
  };
}

function analyzeProseQuality(text: string): ProseQualityAnalysis {
  const styleMarkers: StyleMarker[] = [];
  const suggestions: ProseSuggestion[] = [];
  let score = 50;

  // 클리셰 감지
  const cliches = [
    '심장이 두근', '눈물이 흘', '주먹을 불끈', '이를 악물',
    '온몸에 전율', '눈빛이 변', '가슴이 벅차', '피가 끓',
  ];

  const clicheCount = cliches.filter(c => text.includes(c)).length;
  score -= clicheCount * 5;

  if (clicheCount > 0) {
    styleMarkers.push({
      type: 'metaphor',
      quality: 'weak',
      examples: cliches.filter(c => text.includes(c)),
      suggestion: '클리셰를 피하고 독창적인 표현을 사용하세요',
    });
  }

  // 감각적 묘사 탐지
  const sensoryPatterns = [
    '냄새', '향', '소리', '맛', '질감', '온기', '차가움',
    '촉감', '울림', '바스락', '축축', '끈적',
  ];

  const sensoryCount = sensoryPatterns.filter(p => text.includes(p)).length;
  score += sensoryCount * 3;

  if (sensoryCount >= 3) {
    styleMarkers.push({
      type: 'sensory',
      quality: 'strong',
      examples: sensoryPatterns.filter(p => text.includes(p)),
    });
  }

  // 문장 다양성 (간단한 분석)
  const sentences = text.split(/[.!?]/g).filter(s => s.trim().length > 0);
  const avgLength = sentences.reduce((a, s) => a + s.length, 0) / sentences.length;
  const lengthVariance = sentences.reduce((a, s) => a + Math.abs(s.length - avgLength), 0) / sentences.length;

  if (lengthVariance > 20) {
    score += 10;
    styleMarkers.push({
      type: 'rhythm',
      quality: 'strong',
      examples: ['문장 길이 변화가 좋습니다'],
    });
  }

  score = Math.max(0, Math.min(score, 100));

  return {
    score,
    strengths: [],
    weaknesses: [],
    styleMarkers,
    voiceConsistency: 70,
    rhythmQuality: lengthVariance > 20 ? 80 : 50,
    imageryDensity: sensoryCount * 10,
    suggestions,
  };
}

function analyzeSymbolicLayer(text: string): SymbolicLayerAnalysis {
  const symbols: IdentifiedSymbol[] = [];
  const motifs: IdentifiedMotif[] = [];
  let score = 40;

  // 자연 상징 탐지
  const naturalSymbols = [
    { symbol: '물', patterns: ['물', '강', '바다', '비', '눈물'] },
    { symbol: '불', patterns: ['불', '화염', '횃불', '타오르'] },
    { symbol: '나무', patterns: ['나무', '숲', '가지', '뿌리'] },
    { symbol: '눈', patterns: ['눈(雪)', '하얗', '눈발', '눈보라'] },
    { symbol: '달', patterns: ['달', '달빛', '월광'] },
    { symbol: '태양', patterns: ['태양', '해', '햇살', '햇빛'] },
  ];

  for (const { symbol, patterns } of naturalSymbols) {
    const count = patterns.filter(p => text.includes(p)).length;
    if (count >= 2) {
      symbols.push({
        symbol,
        meaning: '(분석 필요)',
        occurrences: count,
        effectiveness: count >= 4 ? 'strong' : 'moderate',
      });
      score += 5;
    }
  }

  // 반복 이미지(모티프) 탐지
  const words = text.split(/\s+/);
  const wordCount: Record<string, number> = {};
  for (const word of words) {
    if (word.length >= 2) {
      wordCount[word] = (wordCount[word] || 0) + 1;
    }
  }

  const repeatedWords = Object.entries(wordCount)
    .filter(([_, count]) => count >= 3)
    .map(([word]) => word);

  if (repeatedWords.length > 0) {
    score += 10;
  }

  score = Math.min(score, 100);

  return {
    symbols,
    motifs,
    subtextLayers: [],
    score,
    suggestions: symbols.length < 2
      ? ['상징적 이미지를 활용하여 주제를 강화하세요']
      : [],
  };
}

function collectStrengths(
  thematic: ThematicDepthAnalysis,
  character: CharacterDepthAnalysis,
  prose: ProseQualityAnalysis,
  symbolic: SymbolicLayerAnalysis
): string[] {
  const strengths: string[] = [];

  if (thematic.score >= 60) {
    strengths.push('보편적 주제 의식');
  }
  if (character.overallScore >= 60) {
    strengths.push('캐릭터 내면 탐구');
  }
  if (prose.score >= 60) {
    strengths.push('문체의 개성');
  }
  if (symbolic.score >= 60) {
    strengths.push('상징적 깊이');
  }

  return strengths;
}

function collectWeaknesses(
  thematic: ThematicDepthAnalysis,
  character: CharacterDepthAnalysis,
  prose: ProseQualityAnalysis,
  symbolic: SymbolicLayerAnalysis
): string[] {
  const weaknesses: string[] = [];

  if (thematic.score < 50) {
    weaknesses.push('주제의 깊이 부족');
  }
  if (character.overallScore < 50) {
    weaknesses.push('캐릭터 복잡성 부족');
  }
  if (prose.score < 50) {
    weaknesses.push('문체 개선 필요');
  }
  if (symbolic.score < 40) {
    weaknesses.push('상징/모티프 부재');
  }

  return weaknesses;
}

// ============================================
// 프롬프트 생성용 가이드라인
// ============================================

/**
 * AI 글쓰기를 위한 문학적 깊이 가이드라인 생성
 */
export function generateLiteraryDepthPrompt(
  targetLevel: LiteraryDepthLevel = 'profound',
  focusAreas?: ('theme' | 'character' | 'prose' | 'symbol')[]
): string {
  const areas = focusAreas || ['theme', 'character', 'prose', 'symbol'];

  let prompt = `
## 문학적 깊이 강화 가이드라인

목표 수준: ${
  targetLevel === 'masterpiece' ? '걸작 수준 (노벨 문학상 참고)' :
  targetLevel === 'profound' ? '깊은 문학 (순문학 상위)' :
  targetLevel === 'literary' ? '순문학 수준' : '상업 문학 수준'
}

### 핵심 원칙
1. **말하지 말고 보여주세요** (Show, Don't Tell)
2. **여백을 남기세요** - 독자가 채워넣을 공간
3. **클리셰를 피하세요** - 익숙한 것을 낯설게
4. **인간 조건을 탐구하세요** - 플롯 너머의 질문

`;

  if (areas.includes('theme')) {
    prompt += `
### 주제적 깊이
- 표면적 스토리 아래에 보편적 인간 조건을 담으세요
- "이 이야기가 인간에 대해 무엇을 말하는가?" 질문하세요
- 참고 주제: 죽음과 유한성, 사랑과 상실, 정체성, 권력과 억압, 고독

`;
  }

  if (areas.includes('character')) {
    prompt += `
### 캐릭터 깊이
- 캐릭터에게 스스로도 인정하지 못하는 모순을 부여하세요
- 도덕적으로 모호한 선택 상황을 만드세요
- 표면적 목표와 무의식적 욕망의 충돌을 보여주세요
- 맹점: 캐릭터가 모르지만 독자는 아는 것

`;
  }

  if (areas.includes('prose')) {
    prompt += `
### 문체
❌ 피할 것: 클리셰 표현 (심장이 두근, 눈물이 흘러, 주먹을 불끈 등)
✅ 추구할 것:
- 독창적 은유: 익숙한 것을 낯설게
- 리듬: 문장 길이 변화, 중요한 순간 짧게
- 여백: 설명 대신 암시
- 감각: 시각 외의 감각 활용

`;
  }

  if (areas.includes('symbol')) {
    prompt += `
### 상징과 모티프
- 핵심 주제를 상징하는 이미지를 반복 사용
- 반복되는 이미지의 의미를 점진적으로 변화
- 서브텍스트: 말과 행동 사이의 불일치
- 환경 묘사를 통한 내면 암시

`;
  }

  prompt += `
### 참고 작가/작품 (노벨 문학상 수상자)
- 한강: <소년이 온다>, <채식주의자> - 폭력과 트라우마의 시적 탐구
- 카뮈: <이방인> - 부조리와 인간 조건
- 도스토예프스키: <죄와 벌> - 도덕적 고뇌와 구원
- 가브리엘 마르케스: <백년의 고독> - 시간과 역사의 순환
- 카즈오 이시구로: <나를 보내지 마> - 기억과 상실

`;

  return prompt;
}

export const literaryDepthSystem = {
  analyzeLiteraryDepth,
  generateLiteraryDepthPrompt,
  UNIVERSAL_HUMAN_CONDITIONS,
  PROFOUND_CHARACTER_TRAITS,
  EXCEPTIONAL_PROSE_ELEMENTS,
  SYMBOLIC_TECHNIQUES,
};

export default literaryDepthSystem;
