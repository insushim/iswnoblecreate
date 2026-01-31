/**
 * 장르 마스터 시스템 (GenreMasterSystem)
 *
 * 장르별 필수 요소, 독자 기대, 시장성 분석을 AI로 구현
 * - 장르별 클리셰 vs 필수 요소 구분
 * - 독자 기대 충족 메커니즘
 * - 시장성 분석
 * - 장르 믹싱 가이드
 */

import { generateJSON } from './gemini';
import { GeminiModel } from '@/types';

// ============================================
// 장르 정의
// ============================================

export type PrimaryGenre =
  | 'fantasy'
  | 'romance'
  | 'thriller'
  | 'mystery'
  | 'horror'
  | 'sci-fi'
  | 'historical'
  | 'martial-arts'  // 무협
  | 'slice-of-life'
  | 'action'
  | 'drama'
  | 'comedy'
  | 'isekai'  // 이세계
  | 'regression'  // 회귀
  | 'academy'  // 아카데미물
  | 'survival'
  | 'game-system';  // 시스템물

export interface GenreBlueprint {
  id: PrimaryGenre;
  name: string;
  nameKr: string;
  description: string;

  // 필수 요소 (없으면 장르 실패)
  essentialElements: {
    element: string;
    description: string;
    examples: string[];
    importance: 'critical' | 'high' | 'medium';
  }[];

  // 기대 충족 요소 (독자가 기대하는 것)
  readerExpectations: {
    expectation: string;
    fulfillmentMethods: string[];
    commonMistakes: string[];
  }[];

  // 장르 관습 (따라야 하는 것)
  conventions: {
    convention: string;
    flexibility: 'strict' | 'flexible' | 'subvertible';
    subversionRisk: string;
  }[];

  // 피해야 할 클리셰 (신선하게 변주해야 하는 것)
  cliches: {
    cliche: string;
    fresherAlternatives: string[];
    whenAcceptable: string;
  }[];

  // 감정 여정 (독자가 경험해야 하는 감정)
  emotionalJourney: {
    phase: string;
    emotions: string[];
    intensityRange: [number, number];
  }[];

  // 페이싱 가이드
  pacingGuide: {
    opening: string;
    midpoint: string;
    climax: string;
    resolution: string;
    chapterLength: string;
    actionToReflectionRatio: string;
  };

  // 캐릭터 아키타입
  characterArchetypes: {
    archetype: string;
    traits: string[];
    variations: string[];
    avoidTraits: string[];
  }[];

  // 세계관 요구사항
  worldBuildingRequirements: {
    requirement: string;
    depth: 'detailed' | 'moderate' | 'light';
    readerFamiliarity: 'high' | 'medium' | 'low';
  }[];

  // 성공 작품 레퍼런스
  successfulExamples: {
    title: string;
    author: string;
    keyStrength: string;
  }[];
}

// ============================================
// 장르 블루프린트 데이터
// ============================================

export const GENRE_BLUEPRINTS: Record<PrimaryGenre, Partial<GenreBlueprint>> = {
  fantasy: {
    id: 'fantasy',
    name: 'Fantasy',
    nameKr: '판타지',
    description: '초자연적 요소와 마법이 있는 세계의 이야기',

    essentialElements: [
      {
        element: '마법/초자연 시스템',
        description: '일관된 규칙이 있는 마법 또는 초자연적 체계',
        examples: ['마나 시스템', '원소 마법', '정령 계약'],
        importance: 'critical',
      },
      {
        element: '세계관',
        description: '현실과 다른 독특한 세계 설정',
        examples: ['중세 유럽풍', '동양 환상', '도시 판타지'],
        importance: 'critical',
      },
      {
        element: '영웅의 여정/성장',
        description: '주인공의 성장과 모험',
        examples: ['평범한 자에서 영웅으로', '능력 각성', '시련 극복'],
        importance: 'high',
      },
      {
        element: '갈등/악역',
        description: '극복해야 할 강력한 대립 세력',
        examples: ['마왕', '어둠의 세력', '부패한 권력'],
        importance: 'high',
      },
    ],

    readerExpectations: [
      {
        expectation: '몰입할 수 있는 새로운 세계',
        fulfillmentMethods: ['독특한 마법 시스템', '상세한 세계관', '일관된 규칙'],
        commonMistakes: ['설정만 나열', '정보 덤프', '규칙 불일치'],
      },
      {
        expectation: '시원한 전투/능력 발휘',
        fulfillmentMethods: ['긴장감 있는 배틀', '능력의 창의적 사용', '성장 가시화'],
        commonMistakes: ['파워 인플레이션', '일방적 승리', '전투 묘사 부족'],
      },
      {
        expectation: '감정적 카타르시스',
        fulfillmentMethods: ['복수 성공', '정의 실현', '사랑하는 이 구출'],
        commonMistakes: ['빌런의 갑작스러운 약화', '데우스 엑스 마키나'],
      },
    ],

    conventions: [
      {
        convention: '선악 구도',
        flexibility: 'flexible',
        subversionRisk: '회색 도덕은 다크 판타지로 분류될 수 있음',
      },
      {
        convention: '성장/강해짐',
        flexibility: 'strict',
        subversionRisk: '성장 없으면 독자 이탈',
      },
      {
        convention: '동료/파티',
        flexibility: 'flexible',
        subversionRisk: '1인 플레이도 가능하지만 관계 묘사 필요',
      },
    ],

    cliches: [
      {
        cliche: '평범한 주인공이 갑자기 최강',
        fresherAlternatives: ['숨겨진 과거가 있는', '대가를 치르는 능력', '점진적 성장'],
        whenAcceptable: '회귀물/시스템물에서는 설정으로 수용',
      },
      {
        cliche: '마왕은 무조건 악',
        fresherAlternatives: ['마왕에게도 사연이', '마왕이 오히려 옳았다', '상대적 악'],
        whenAcceptable: '클래식 판타지에서는 허용',
      },
      {
        cliche: '용사 소환',
        fresherAlternatives: ['소환 거부', '소환자가 악역', '역소환'],
        whenAcceptable: '패러디/메타물에서는 의도적 사용',
      },
    ],

    emotionalJourney: [
      { phase: '도입', emotions: ['호기심', '기대', '약간의 불안'], intensityRange: [3, 5] },
      { phase: '성장기', emotions: ['희망', '좌절', '분노', '각성'], intensityRange: [5, 7] },
      { phase: '시련', emotions: ['절망', '두려움', '결의'], intensityRange: [7, 9] },
      { phase: '클라이맥스', emotions: ['긴장', '흥분', '감동'], intensityRange: [9, 10] },
      { phase: '결말', emotions: ['만족', '여운', '새로운 기대'], intensityRange: [6, 8] },
    ],

    pacingGuide: {
      opening: '후크 씬으로 시작, 초반 3챕터 내 핵심 갈등 제시',
      midpoint: '주인공의 첫 성장 완료, 새로운 위기 등장',
      climax: '모든 복선 회수, 최고 긴장감',
      resolution: '여운을 남기되 핵심 갈등은 해소',
      chapterLength: '3000-5000자',
      actionToReflectionRatio: '7:3',
    },

    characterArchetypes: [
      {
        archetype: '성장형 주인공',
        traits: ['잠재력', '정의감', '성장 의지'],
        variations: ['천재형', '노력형', '각성형'],
        avoidTraits: ['수동적', '변화 거부'],
      },
      {
        archetype: '멘토',
        traits: ['지혜', '과거가 있는', '한계 있는'],
        variations: ['엄격한', '자상한', '미스터리한'],
        avoidTraits: ['만능', '항상 옳은'],
      },
    ],

    worldBuildingRequirements: [
      { requirement: '마법 시스템 일관성', depth: 'detailed', readerFamiliarity: 'medium' },
      { requirement: '지리/국가 설정', depth: 'moderate', readerFamiliarity: 'low' },
      { requirement: '사회 구조/계급', depth: 'moderate', readerFamiliarity: 'medium' },
    ],

    successfulExamples: [
      { title: '나 혼자만 레벨업', author: '추공', keyStrength: '시스템과 성장의 조화' },
      { title: '오버로드', author: '쿠가네 마루야마', keyStrength: '압도적 파워와 전략' },
      { title: '해리 포터', author: 'J.K. 롤링', keyStrength: '세계관 몰입감' },
    ],
  },

  romance: {
    id: 'romance',
    name: 'Romance',
    nameKr: '로맨스',
    description: '사랑 이야기가 중심인 장르',

    essentialElements: [
      {
        element: '중심 로맨스',
        description: '두 인물 사이의 사랑이 주 플롯',
        examples: ['첫사랑', '재회', '운명적 만남'],
        importance: 'critical',
      },
      {
        element: '감정적 여정',
        description: '감정 변화와 관계 발전',
        examples: ['오해와 화해', '거리두기와 다가감', '고백과 수락'],
        importance: 'critical',
      },
      {
        element: '감정적으로 만족스러운 결말',
        description: 'HEA(Happily Ever After) 또는 HFN(Happy For Now)',
        examples: ['결혼', '고백 성공', '재결합'],
        importance: 'critical',
      },
      {
        element: '장애물/갈등',
        description: '사랑을 방해하는 요소',
        examples: ['오해', '신분 차이', '과거의 상처', '라이벌'],
        importance: 'high',
      },
    ],

    readerExpectations: [
      {
        expectation: '설렘과 두근거림',
        fulfillmentMethods: ['밀당', '우연한 접촉', '의미심장한 눈맞춤', '긴장감 있는 대화'],
        commonMistakes: ['급진전', '설렘 없는 고백', '화학 반응 부족'],
      },
      {
        expectation: '캐릭터에 대한 감정 이입',
        fulfillmentMethods: ['결점 있는 캐릭터', '공감 가는 고민', '성장'],
        commonMistakes: ['완벽한 남주', '수동적 여주', '1차원적 캐릭터'],
      },
      {
        expectation: '감정적 카타르시스',
        fulfillmentMethods: ['고백 씬', '오해 해소', '재회'],
        commonMistakes: ['갈등 해소 미흡', '억지 해피엔딩'],
      },
    ],

    conventions: [
      {
        convention: '해피엔딩',
        flexibility: 'strict',
        subversionRisk: '새드엔딩은 독자 분노 유발',
      },
      {
        convention: '양방향 애정',
        flexibility: 'strict',
        subversionRisk: '일방적 사랑만으로는 로맨스 아님',
      },
      {
        convention: '밀당 구조',
        flexibility: 'flexible',
        subversionRisk: '너무 일방적이면 긴장감 없음',
      },
    ],

    cliches: [
      {
        cliche: '재벌 남주',
        fresherAlternatives: ['평범하지만 매력적인', '가난하지만 능력있는', '성공 스토리'],
        whenAcceptable: '로판/현판 장르에서는 설정의 일부',
      },
      {
        cliche: '밀당만 하다 끝',
        fresherAlternatives: ['깊은 대화', '함께 성장', '진정한 이해'],
        whenAcceptable: '라이트 로맨스에서는 허용',
      },
      {
        cliche: '삼각관계',
        fresherAlternatives: ['명확한 주커플', '제3자의 성장 서사', '우정으로 발전'],
        whenAcceptable: '갈등 요소로 적절히 사용시',
      },
    ],

    emotionalJourney: [
      { phase: '만남', emotions: ['호기심', '첫인상', '미묘한 끌림'], intensityRange: [3, 5] },
      { phase: '발전', emotions: ['설렘', '혼란', '부정'], intensityRange: [5, 7] },
      { phase: '위기', emotions: ['상처', '오해', '그리움'], intensityRange: [7, 9] },
      { phase: '해소', emotions: ['깨달음', '용기', '화해'], intensityRange: [8, 10] },
      { phase: '결합', emotions: ['행복', '완성감', '안도'], intensityRange: [9, 10] },
    ],

    pacingGuide: {
      opening: '운명적 만남 또는 재회, 첫 인상 형성',
      midpoint: '감정 인지, 장애물 본격 등장',
      climax: '위기와 극복, 진심 고백',
      resolution: '결합과 해피엔딩',
      chapterLength: '2500-4000자',
      actionToReflectionRatio: '4:6',
    },

    characterArchetypes: [
      {
        archetype: '냉정한 외면 따뜻한 내면',
        traits: ['과거의 상처', '점점 열리는', '진심 숨김'],
        variations: ['얼음 남주', '츤데레', '까칠한 직장인'],
        avoidTraits: ['진심으로 차가운', '변화 없는'],
      },
      {
        archetype: '당차고 매력적인 상대',
        traits: ['자기 주관', '상대를 변화시킴', '매력 포인트'],
        variations: ['밝은 성격', '강인한 의지', '유머러스'],
        avoidTraits: ['수동적', '1차원적'],
      },
    ],

    worldBuildingRequirements: [
      { requirement: '캐릭터 배경', depth: 'detailed', readerFamiliarity: 'high' },
      { requirement: '관계 맥락', depth: 'detailed', readerFamiliarity: 'high' },
      { requirement: '시대/장소 설정', depth: 'moderate', readerFamiliarity: 'high' },
    ],

    successfulExamples: [
      { title: '프로포즈 대작전', author: '', keyStrength: '시간 역행과 로맨스 결합' },
      { title: '그녀는 예뻤다', author: '', keyStrength: '재회 로맨스와 성장' },
    ],
  },

  thriller: {
    id: 'thriller',
    name: 'Thriller',
    nameKr: '스릴러',
    description: '긴장감과 서스펜스가 핵심인 장르',

    essentialElements: [
      {
        element: '지속적 긴장감',
        description: '독자를 계속 긴장하게 만드는 요소',
        examples: ['위협', '시간 제한', '추격'],
        importance: 'critical',
      },
      {
        element: '높은 판돈',
        description: '실패 시 심각한 결과',
        examples: ['생명 위협', '가족 위험', '세계 멸망'],
        importance: 'critical',
      },
      {
        element: '강력한 적대자',
        description: '주인공을 압도하는 위협',
        examples: ['연쇄살인마', '조직', '시스템'],
        importance: 'high',
      },
    ],

    readerExpectations: [
      {
        expectation: '페이지를 넘기게 만드는 긴장감',
        fulfillmentMethods: ['클리프행어', '시간 압박', '예상치 못한 반전'],
        commonMistakes: ['긴장감 해소 후 늘어짐', '예측 가능한 전개'],
      },
      {
        expectation: '반전과 충격',
        fulfillmentMethods: ['믿었던 인물의 배신', '숨겨진 진실', '플롯 트위스트'],
        commonMistakes: ['억지 반전', '복선 없는 충격'],
      },
    ],

    conventions: [
      {
        convention: '주인공 생존',
        flexibility: 'flexible',
        subversionRisk: '시리즈물에서는 엄격, 단편에서는 유연',
      },
      {
        convention: '정의 실현',
        flexibility: 'flexible',
        subversionRisk: '다크 스릴러는 암울한 결말 가능',
      },
    ],

    cliches: [
      {
        cliche: '주인공만 유능',
        fresherAlternatives: ['팀워크', '예상 못한 조력자', '적의 실수'],
        whenAcceptable: '원맨쇼 컨셉일 때',
      },
    ],

    emotionalJourney: [
      { phase: '도입', emotions: ['불안', '호기심'], intensityRange: [4, 6] },
      { phase: '전개', emotions: ['긴장', '공포'], intensityRange: [6, 8] },
      { phase: '위기', emotions: ['절망', '필사적'], intensityRange: [8, 10] },
      { phase: '클라이맥스', emotions: ['극도의 긴장', '카타르시스'], intensityRange: [9, 10] },
      { phase: '결말', emotions: ['안도', '여운'], intensityRange: [5, 7] },
    ],

    pacingGuide: {
      opening: '즉시 긴장감 조성, 첫 페이지부터 후킹',
      midpoint: '상황 악화, 반전',
      climax: '모든 것이 걸린 대결',
      resolution: '짧게, 여운 있게',
      chapterLength: '2000-3500자 (짧고 빠르게)',
      actionToReflectionRatio: '8:2',
    },

    characterArchetypes: [
      {
        archetype: '평범한 사람이 위기에',
        traits: ['공감 가능', '자원 제한', '성장'],
        variations: ['직장인', '가정주부', '학생'],
        avoidTraits: ['너무 유능', '두려움 없는'],
      },
    ],

    worldBuildingRequirements: [
      { requirement: '현실감', depth: 'detailed', readerFamiliarity: 'high' },
      { requirement: '위협의 구체성', depth: 'detailed', readerFamiliarity: 'medium' },
    ],

    successfulExamples: [
      { title: '양들의 침묵', author: '토마스 해리스', keyStrength: '심리전과 서스펜스' },
      { title: '다빈치 코드', author: '댄 브라운', keyStrength: '수수께끼와 추격' },
    ],
  },

  // 나머지 장르들 기본 구조
  mystery: {
    id: 'mystery',
    name: 'Mystery',
    nameKr: '미스터리',
    description: '수수께끼와 해결이 중심인 장르',
    essentialElements: [
      { element: '미스터리/퍼즐', description: '해결해야 할 수수께끼', examples: ['살인', '도난', '실종'], importance: 'critical' },
      { element: '단서와 추리', description: '논리적 추론 과정', examples: ['증거 수집', '용의자 심문', '추리'], importance: 'critical' },
      { element: '해결/진실', description: '미스터리의 해답', examples: ['범인 지목', '진실 밝힘'], importance: 'critical' },
    ],
    readerExpectations: [
      { expectation: '공정한 게임', fulfillmentMethods: ['독자도 추리 가능한 단서 제공', '논리적 해결'], commonMistakes: ['단서 숨김', '억지 해결'] },
    ],
  },

  horror: {
    id: 'horror',
    name: 'Horror',
    nameKr: '호러',
    description: '공포와 두려움을 주는 장르',
    essentialElements: [
      { element: '공포 요소', description: '독자에게 두려움을 주는 것', examples: ['귀신', '괴물', '심리적 공포'], importance: 'critical' },
      { element: '위협', description: '생명/정신에 대한 위협', examples: ['초자연적 위협', '인간적 악'], importance: 'critical' },
    ],
  },

  'sci-fi': {
    id: 'sci-fi',
    name: 'Science Fiction',
    nameKr: 'SF',
    description: '과학 기술과 미래를 다루는 장르',
    essentialElements: [
      { element: '과학적 요소', description: '과학/기술 기반 설정', examples: ['우주 여행', 'AI', '시간 여행'], importance: 'critical' },
      { element: '미래/대체 현실', description: '현재와 다른 시대/세계', examples: ['미래 사회', '대체 역사'], importance: 'high' },
    ],
  },

  historical: {
    id: 'historical',
    name: 'Historical',
    nameKr: '역사',
    description: '역사적 시대를 배경으로 한 장르',
    essentialElements: [
      { element: '시대 고증', description: '정확한 역사적 배경', examples: ['의복', '언어', '사회 구조'], importance: 'critical' },
      { element: '역사적 사건', description: '실제 역사와의 연결', examples: ['전쟁', '정치 변동', '사회 변화'], importance: 'high' },
    ],
  },

  'martial-arts': {
    id: 'martial-arts',
    name: 'Martial Arts',
    nameKr: '무협',
    description: '무술과 협객이 등장하는 장르',
    essentialElements: [
      { element: '무공 시스템', description: '일관된 무술 체계', examples: ['내공', '검술', '암기'], importance: 'critical' },
      { element: '강호/문파', description: '무림 사회 구조', examples: ['문파 대립', '정사대전', '협객'], importance: 'high' },
      { element: '협의 정신', description: '의리, 정의, 복수', examples: ['은원 관계', '사제 관계'], importance: 'high' },
    ],
  },

  'slice-of-life': {
    id: 'slice-of-life',
    name: 'Slice of Life',
    nameKr: '일상물',
    description: '일상의 소소함을 그리는 장르',
    essentialElements: [
      { element: '일상의 디테일', description: '현실적인 일상 묘사', examples: ['학교생활', '직장생활', '가족'], importance: 'critical' },
      { element: '감정적 공감', description: '독자가 공감할 수 있는 상황', examples: ['성장', '우정', '사랑'], importance: 'high' },
    ],
  },

  action: {
    id: 'action',
    name: 'Action',
    nameKr: '액션',
    description: '역동적인 행동이 중심인 장르',
    essentialElements: [
      { element: '액션 시퀀스', description: '역동적인 행동 장면', examples: ['전투', '추격', '탈출'], importance: 'critical' },
      { element: '물리적 위협', description: '신체적 위험', examples: ['싸움', '위기 상황'], importance: 'high' },
    ],
  },

  drama: {
    id: 'drama',
    name: 'Drama',
    nameKr: '드라마',
    description: '인간 관계와 감정이 중심인 장르',
    essentialElements: [
      { element: '감정적 갈등', description: '인물 간 감정적 대립', examples: ['가족 갈등', '사랑과 미움', '배신'], importance: 'critical' },
      { element: '캐릭터 깊이', description: '입체적인 인물', examples: ['내면 갈등', '성장', '변화'], importance: 'critical' },
    ],
  },

  comedy: {
    id: 'comedy',
    name: 'Comedy',
    nameKr: '코미디',
    description: '웃음과 유머가 중심인 장르',
    essentialElements: [
      { element: '유머', description: '웃음을 유발하는 요소', examples: ['상황 코미디', '언어유희', '캐릭터 코미디'], importance: 'critical' },
      { element: '코믹 타이밍', description: '유머의 적절한 배치', examples: ['반전', '지연', '과장'], importance: 'high' },
    ],
  },

  isekai: {
    id: 'isekai',
    name: 'Isekai',
    nameKr: '이세계',
    description: '다른 세계로 전이되는 장르',
    essentialElements: [
      { element: '세계 이동', description: '다른 세계로의 전이', examples: ['소환', '사망 후 전생', '이동'], importance: 'critical' },
      { element: '현대 지식 활용', description: '현대 지식으로 이세계 적응', examples: ['기술 도입', '상식 파괴'], importance: 'high' },
      { element: '치트/특권', description: '이세계에서의 특별한 능력', examples: ['고유 스킬', '시스템', '현대 지식'], importance: 'high' },
    ],
  },

  regression: {
    id: 'regression',
    name: 'Regression',
    nameKr: '회귀',
    description: '과거로 돌아가는 장르',
    essentialElements: [
      { element: '시간 회귀', description: '과거로 돌아감', examples: ['죽음 후 회귀', '특정 시점으로'], importance: 'critical' },
      { element: '미래 지식', description: '앞으로 일어날 일을 앎', examples: ['재앙 예방', '투자', '인연 찾기'], importance: 'critical' },
      { element: '두 번째 기회', description: '실패를 만회', examples: ['복수', '사랑 되찾기', '성공'], importance: 'high' },
    ],
  },

  academy: {
    id: 'academy',
    name: 'Academy',
    nameKr: '아카데미',
    description: '학원을 배경으로 한 장르',
    essentialElements: [
      { element: '학원 배경', description: '학교/아카데미 설정', examples: ['마법 학교', '헌터 아카데미', '군사 학교'], importance: 'critical' },
      { element: '성장/경쟁', description: '학생으로서의 성장', examples: ['시험', '대회', '랭킹'], importance: 'high' },
      { element: '또래 관계', description: '동기/선후배 관계', examples: ['라이벌', '친구', '로맨스'], importance: 'high' },
    ],
  },

  survival: {
    id: 'survival',
    name: 'Survival',
    nameKr: '서바이벌',
    description: '생존이 목표인 장르',
    essentialElements: [
      { element: '생존 위협', description: '생명을 위협하는 상황', examples: ['재난', '게임', '괴물'], importance: 'critical' },
      { element: '제한된 자원', description: '자원 관리 필요', examples: ['식량', '무기', '동료'], importance: 'high' },
      { element: '도태/선택', description: '생존을 위한 선택', examples: ['희생', '배신', '연대'], importance: 'high' },
    ],
  },

  'game-system': {
    id: 'game-system',
    name: 'Game System',
    nameKr: '시스템물',
    description: '게임 같은 시스템이 존재하는 장르',
    essentialElements: [
      { element: '시스템/상태창', description: '게임 같은 인터페이스', examples: ['레벨', '스탯', '스킬'], importance: 'critical' },
      { element: '성장 가시화', description: '수치로 보이는 성장', examples: ['레벨업', '스탯 상승', '스킬 획득'], importance: 'critical' },
      { element: '퀘스트/보상', description: '목표와 대가', examples: ['미션', '보상', '제한'], importance: 'high' },
    ],
  },
};

// ============================================
// 장르 마스터 클래스
// ============================================

export class GenreMasterSystem {
  /**
   * 장르 블루프린트 가져오기
   */
  getBlueprint(genre: PrimaryGenre): Partial<GenreBlueprint> {
    return GENRE_BLUEPRINTS[genre] || {};
  }

  /**
   * 장르 준수 검사
   */
  async checkGenreCompliance(
    apiKey: string,
    text: string,
    genres: PrimaryGenre[],
    model: GeminiModel = 'gemini-2.5-flash'
  ): Promise<{
    overallScore: number;
    genreScores: { genre: PrimaryGenre; score: number; issues: string[] }[];
    missingElements: string[];
    unnecessaryElements: string[];
    recommendations: string[];
  }> {
    const blueprints = genres.map(g => this.getBlueprint(g));

    const prompt = `당신은 장르 소설 전문 편집자입니다.
다음 텍스트가 지정된 장르의 규칙을 얼마나 잘 따르는지 분석하세요.

## 텍스트
${text.slice(0, 10000)}

## 장르: ${genres.join(', ')}

## 각 장르의 필수 요소
${blueprints.map((b, i) => `
### ${genres[i]}
필수 요소: ${b.essentialElements?.map(e => e.element).join(', ')}
독자 기대: ${b.readerExpectations?.map(e => e.expectation).join(', ')}
`).join('\n')}

## 분석 항목
1. 필수 요소가 있는지
2. 독자 기대를 충족하는지
3. 장르 관습을 따르는지
4. 피해야 할 클리셰를 사용했는지

## 응답 형식 (JSON)
{
  "overallScore": 1-100,
  "genreScores": [
    {
      "genre": "장르명",
      "score": 1-100,
      "issues": ["문제점"]
    }
  ],
  "missingElements": ["누락된 필수 요소"],
  "unnecessaryElements": ["불필요한 요소"],
  "recommendations": ["개선 제안"]
}

JSON만 출력하세요.`;

    try {
      return await generateJSON<{
        overallScore: number;
        genreScores: { genre: PrimaryGenre; score: number; issues: string[] }[];
        missingElements: string[];
        unnecessaryElements: string[];
        recommendations: string[];
      }>(apiKey, prompt, {
        model,
        temperature: 0.3,
      });
    } catch (error) {
      console.error('[GenreMasterSystem] 장르 검사 실패:', error);
      throw error;
    }
  }

  /**
   * 시장성 분석
   */
  async analyzeMarketability(
    apiKey: string,
    project: {
      title: string;
      genres: string[];
      synopsis: string;
      targetAudience: string;
    },
    model: GeminiModel = 'gemini-2.5-flash'
  ): Promise<{
    marketScore: number;
    targetDemographic: string[];
    competitiveAdvantages: string[];
    potentialWeaknesses: string[];
    similarSuccessfulWorks: { title: string; similarity: string }[];
    publishingRecommendations: string[];
    platformSuitability: { platform: string; suitability: number; reason: string }[];
  }> {
    const prompt = `당신은 출판 시장 분석 전문가입니다.
다음 작품의 시장성을 분석하세요.

## 작품 정보
- 제목: ${project.title}
- 장르: ${project.genres.join(', ')}
- 타겟 독자: ${project.targetAudience}
- 시놉시스: ${project.synopsis}

## 분석 항목
1. 시장성 점수 (1-100)
2. 타겟 인구통계
3. 경쟁 우위
4. 잠재적 약점
5. 유사 성공작
6. 출판 전략 제안
7. 플랫폼별 적합성 (카카페, 리디, 문피아, 노블피아, 정식 출판)

## 응답 형식 (JSON)
{
  "marketScore": 1-100,
  "targetDemographic": ["타겟층1", "타겟층2"],
  "competitiveAdvantages": ["강점1", "강점2"],
  "potentialWeaknesses": ["약점1"],
  "similarSuccessfulWorks": [
    {"title": "유사 성공작", "similarity": "유사점"}
  ],
  "publishingRecommendations": ["전략1", "전략2"],
  "platformSuitability": [
    {"platform": "카카오페이지", "suitability": 85, "reason": "이유"}
  ]
}

JSON만 출력하세요.`;

    try {
      return await generateJSON<{
        marketScore: number;
        targetDemographic: string[];
        competitiveAdvantages: string[];
        potentialWeaknesses: string[];
        similarSuccessfulWorks: { title: string; similarity: string }[];
        publishingRecommendations: string[];
        platformSuitability: { platform: string; suitability: number; reason: string }[];
      }>(apiKey, prompt, {
        model,
        temperature: 0.4,
      });
    } catch (error) {
      console.error('[GenreMasterSystem] 시장성 분석 실패:', error);
      throw error;
    }
  }

  /**
   * 장르 프롬프트 생성
   */
  generateGenrePrompt(genres: PrimaryGenre[]): string {
    const blueprints = genres.map(g => this.getBlueprint(g));

    let prompt = `\n## 🎭 장르 규칙 (반드시 준수)\n\n`;

    for (let i = 0; i < genres.length; i++) {
      const genre = genres[i];
      const bp = blueprints[i];

      prompt += `### ${bp.nameKr || genre}\n\n`;

      // 필수 요소
      if (bp.essentialElements?.length) {
        prompt += `**필수 요소 (없으면 장르 실패):**\n`;
        for (const elem of bp.essentialElements) {
          if (elem.importance === 'critical') {
            prompt += `- ⚠️ ${elem.element}: ${elem.description}\n`;
          }
        }
        prompt += '\n';
      }

      // 독자 기대
      if (bp.readerExpectations?.length) {
        prompt += `**독자가 기대하는 것:**\n`;
        for (const exp of bp.readerExpectations.slice(0, 3)) {
          prompt += `- ${exp.expectation}\n`;
          prompt += `  ✅ 방법: ${exp.fulfillmentMethods.slice(0, 2).join(', ')}\n`;
          prompt += `  ❌ 피할 것: ${exp.commonMistakes.slice(0, 2).join(', ')}\n`;
        }
        prompt += '\n';
      }

      // 피해야 할 클리셰
      if (bp.cliches?.length) {
        prompt += `**클리셰 → 신선한 대안:**\n`;
        for (const cliche of bp.cliches.slice(0, 3)) {
          prompt += `- "${cliche.cliche}" → ${cliche.fresherAlternatives[0]}\n`;
        }
        prompt += '\n';
      }

      // 페이싱
      if (bp.pacingGuide) {
        prompt += `**페이싱:**\n`;
        prompt += `- 챕터 길이: ${bp.pacingGuide.chapterLength}\n`;
        prompt += `- 액션:성찰 비율: ${bp.pacingGuide.actionToReflectionRatio}\n`;
        prompt += '\n';
      }
    }

    return prompt;
  }

  /**
   * 장르 믹싱 가이드
   */
  async getGenreMixingGuide(
    apiKey: string,
    primaryGenre: PrimaryGenre,
    secondaryGenres: PrimaryGenre[],
    model: GeminiModel = 'gemini-2.5-flash'
  ): Promise<{
    compatibility: number;
    mixingStrategy: string;
    balanceRecommendation: { genre: string; weight: number }[];
    potentialConflicts: string[];
    successfulExamples: string[];
    tips: string[];
  }> {
    const prompt = `장르 믹싱 전문가로서, 다음 장르 조합에 대한 가이드를 제공하세요.

메인 장르: ${primaryGenre}
서브 장르: ${secondaryGenres.join(', ')}

## 응답 형식 (JSON)
{
  "compatibility": 1-100,
  "mixingStrategy": "믹싱 전략",
  "balanceRecommendation": [
    {"genre": "장르", "weight": 60}
  ],
  "potentialConflicts": ["충돌 가능성"],
  "successfulExamples": ["성공 사례"],
  "tips": ["팁"]
}

JSON만 출력하세요.`;

    try {
      return await generateJSON<{
        compatibility: number;
        mixingStrategy: string;
        balanceRecommendation: { genre: string; weight: number }[];
        potentialConflicts: string[];
        successfulExamples: string[];
        tips: string[];
      }>(apiKey, prompt, {
        model,
        temperature: 0.4,
      });
    } catch (error) {
      console.error('[GenreMasterSystem] 장르 믹싱 가이드 실패:', error);
      throw error;
    }
  }
}

// ============================================
// 내보내기
// ============================================

export const genreMasterSystem = new GenreMasterSystem();
export default GenreMasterSystem;
