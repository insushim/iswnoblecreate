/**
 * 걸작 스타일 가이드 (Masterwork Style Guide)
 *
 * 노벨 문학상 수상작들의 문체적 특징을 분석하고
 * 글쓰기에 적용할 수 있는 가이드라인 제공
 *
 * 분석 대상: 한강, 카뮈, 도스토예프스키, 마르케스, 카프카 등
 */

// ============================================
// 작가별 스타일 프로필
// ============================================

export interface AuthorStyleProfile {
  name: string;
  nobelYear?: number;
  signature: string[];
  proseCharacteristics: string[];
  thematicFocus: string[];
  techniques: StyleTechnique[];
  exampleSentences: {
    korean: string;
    analysis: string;
  }[];
  warnings: string[]; // 흉내낼 때 피해야 할 것
}

export interface StyleTechnique {
  name: string;
  description: string;
  howToApply: string;
  example: string;
}

export const AUTHOR_STYLES: Record<string, AuthorStyleProfile> = {
  hanKang: {
    name: '한강',
    nobelYear: 2024,
    signature: [
      '시적 산문',
      '폭력의 미학적 처리',
      '신체와 정신의 경계 탐구',
      '침묵의 힘',
      '이미지의 반복과 변주',
    ],
    proseCharacteristics: [
      '짧고 단절된 문장',
      '현재형 사용',
      '감각적이면서 절제된 묘사',
      '공백과 여백의 활용',
      '시적 리듬',
    ],
    thematicFocus: [
      '국가 폭력과 트라우마',
      '몸의 정치학',
      '거부와 저항',
      '인간성의 상실과 회복',
      '죽음과 생존자의 죄책감',
    ],
    techniques: [
      {
        name: '신체적 메타포',
        description: '추상적 개념을 신체 경험으로 표현',
        howToApply: '정치적/사회적 폭력을 신체적 고통으로 전환',
        example: '"피가 검붉게 굳어 있었다. 아직 덜 마른 핏자국 위로 새 피가 흘러내렸다."',
      },
      {
        name: '현재형 서술',
        description: '과거 사건을 현재형으로 서술하여 즉시성 부여',
        howToApply: '트라우마적 순간을 현재형으로 기술',
        example: '"그녀가 눈을 뜬다. 천장이 보인다. 아직 살아 있다."',
      },
      {
        name: '반복과 변주',
        description: '같은 이미지나 문장을 반복하되 의미를 변화',
        howToApply: '핵심 이미지를 다른 맥락에서 재등장',
        example: '잎: 처음에는 생명 → 나중에는 시체를 덮는 것',
      },
    ],
    exampleSentences: [
      {
        korean: '그 애의 얼굴에서 눈을 뗄 수 없었다. 눈을 떼면 그 애가 사라질 것 같았다.',
        analysis: '반복("눈을 떼다")과 감정의 절제된 표현. 직접적 감정 서술 없이 행동으로 내면 전달.',
      },
      {
        korean: '시간이 느려졌다. 아니, 멈췄다. 그 순간이 영원처럼 느껴졌다.',
        analysis: '짧은 문장의 연속. 교정-보완 구조. 주관적 시간 경험.',
      },
    ],
    warnings: [
      '단순한 잔혹 묘사로 전락하지 않도록',
      '형식적 모방보다 내면의 진정성을',
      '트라우마의 소비가 아닌 이해를 위해',
    ],
  },

  camus: {
    name: '알베르 카뮈',
    nobelYear: 1957,
    signature: [
      '냉담한 서술자',
      '부조리의 인식',
      '감정적 거리두기',
      '햇빛과 바다의 이미지',
      '존재론적 질문',
    ],
    proseCharacteristics: [
      '건조하고 담담한 문체',
      '1인칭 현재 관찰',
      '감정 설명의 거부',
      '외부 묘사를 통한 내면 암시',
      '철학적 문장과 일상의 병치',
    ],
    thematicFocus: [
      '삶의 부조리',
      '죽음과 무의미',
      '자유와 선택',
      '소외와 이방인 의식',
      '반항과 연대',
    ],
    techniques: [
      {
        name: '감정적 공백',
        description: '감정을 설명하지 않고 행동만 기술',
        howToApply: '"슬펐다" 대신 물리적 행동만 기술',
        example: '"어머니가 돌아가셨다. 아니 어쩌면 어제였을지도 모른다."',
      },
      {
        name: '부조리 병치',
        description: '중요한 것과 사소한 것을 동등하게 취급',
        howToApply: '삶과 죽음 옆에 날씨나 식사 묘사',
        example: '"장례식 후 나는 해변에 갔다. 태양이 뜨거웠다."',
      },
      {
        name: '관찰자 시점',
        description: '자신을 타인처럼 관찰하는 거리두기',
        howToApply: '내면 묘사 대신 외부에서 본 자신 기술',
        example: '"나는 내가 웃고 있다는 것을 알았다."',
      },
    ],
    exampleSentences: [
      {
        korean: '태양이 뜨거웠다. 그것이 전부였다.',
        analysis: '감각적 사실 + 단정. 의미 부여 거부. 독자가 의미를 찾도록.',
      },
      {
        korean: '나는 그를 쏘았다. 한 번, 그리고 네 번 더.',
        analysis: '극도의 간결함. 감정 배제. 행위만 나열.',
      },
    ],
    warnings: [
      '냉담함이 무감각으로 보이지 않도록',
      '철학적 메시지의 과도한 직설화 피하기',
      '부조리가 허무주의로 읽히지 않도록',
    ],
  },

  dostoevsky: {
    name: '표도르 도스토예프스키',
    signature: [
      '심리적 격렬함',
      '도덕적 딜레마',
      '대화를 통한 사상 대립',
      '고백적 서술',
      '극단적 인물들',
    ],
    proseCharacteristics: [
      '길고 열정적인 문장',
      '내면 독백의 격류',
      '철학적 대화',
      '광기와 이성의 경계',
      '반복적 강조',
    ],
    thematicFocus: [
      '죄와 벌, 구원',
      '신의 존재와 부재',
      '이성과 광기',
      '자유의지와 결정론',
      '사랑과 증오의 양면성',
    ],
    techniques: [
      {
        name: '내면 고백',
        description: '캐릭터의 가장 어두운 생각을 직접 노출',
        howToApply: '독자에게 직접 말하듯 내면을 쏟아냄',
        example: '"나는 비열했다! 비열했다! 하지만 그게 나다!"',
      },
      {
        name: '이중 인격',
        description: '선과 악이 공존하는 인물 창조',
        howToApply: '같은 인물 안에서 모순되는 행동과 사상',
        example: '구원을 갈망하면서 범죄를 저지르는 라스콜니코프',
      },
      {
        name: '사상 대결',
        description: '대화를 통해 서로 다른 세계관 충돌',
        howToApply: '캐릭터들이 철학적 논쟁을 벌이게 함',
        example: '이반 카라마조프의 "대심문관" 이야기',
      },
    ],
    exampleSentences: [
      {
        korean: '나는 왜 이렇게 비참한가! 왜 나는 다른 모든 사람들보다 더 비참한가!',
        analysis: '반복과 강조. 과장된 감정. 자기 연민과 자기 혐오의 공존.',
      },
    ],
    warnings: [
      '히스테리컬해 보이지 않도록 균형',
      '철학적 논의가 설교로 변하지 않도록',
      '극단적 감정의 진정성 확보',
    ],
  },

  marquez: {
    name: '가브리엘 가르시아 마르케스',
    nobelYear: 1982,
    signature: [
      '마술적 사실주의',
      '순환적 시간',
      '가족 사가',
      '정치와 역사의 우화화',
      '과장된 현실',
    ],
    proseCharacteristics: [
      '길고 유려한 문장',
      '과거-현재-미래 자유로운 이동',
      '일상과 초현실의 자연스러운 공존',
      '세부 묘사의 과잉',
      '서사적 흐름',
    ],
    thematicFocus: [
      '고독과 연대',
      '시간과 기억',
      '사랑과 집착',
      '권력과 부패',
      '죽음과 영속',
    ],
    techniques: [
      {
        name: '마술적 사실주의',
        description: '초현실적 사건을 일상적으로 서술',
        howToApply: '기이한 일을 아무렇지 않게 기술',
        example: '"그녀는 너무 아름다워서 공중으로 떠올랐다."',
      },
      {
        name: '시간 압축',
        description: '수십 년을 한 문장으로',
        howToApply: '긴 시간을 담담하게 요약',
        example: '"많은 해가 흐른 뒤 총살형 집행대 앞에서..."',
      },
      {
        name: '예언적 서술',
        description: '미래 사건을 현재형으로 미리 언급',
        howToApply: '결말을 암시하며 시작',
        example: '"훗날 그가 기억하게 될 그날 아침..."',
      },
    ],
    exampleSentences: [
      {
        korean: '세상은 너무 새로워서 많은 것들에 이름이 없었다. 이름을 부르려면 손가락으로 가리켜야 했다.',
        analysis: '창세기적 시작. 언어 이전의 세계. 시적 원초성.',
      },
    ],
    warnings: [
      '마술적 요소의 남용 주의',
      '가계도 복잡성의 과잉',
      '스타일 모방에서 그치지 않도록',
    ],
  },

  kafka: {
    name: '프란츠 카프카',
    signature: [
      '악몽 같은 논리',
      '관료제의 부조리',
      '변신 모티프',
      '끝없는 대기',
      '아버지와의 갈등',
    ],
    proseCharacteristics: [
      '명료하지만 불안한 문장',
      '세부의 정밀한 묘사',
      '논리적으로 보이는 비논리',
      '감정 없는 공포',
      '행정적 언어',
    ],
    thematicFocus: [
      '소외와 이방인 의식',
      '권력과 무력감',
      '정체성의 상실',
      '죄책감과 심판',
      '가족 관계의 속박',
    ],
    techniques: [
      {
        name: '일상적 악몽',
        description: '기이한 상황을 평범하게 서술',
        howToApply: '가장 이상한 일을 담담하게 묘사',
        example: '"어느 날 아침 그레고르 잠자가 눈을 떴을 때, 그는 자신이 벌레로 변해 있음을 알았다."',
      },
      {
        name: '논리의 가면',
        description: '불합리한 상황에 논리적 외피',
        howToApply: '부조리를 관료적 용어로 설명',
        example: '"이 절차는 규정에 따른 것입니다."',
      },
    ],
    exampleSentences: [
      {
        korean: '어느 날 아침 잠에서 깨어나니, 나는 거대한 벌레로 변해 있었다.',
        analysis: '충격적 시작. 담담한 어조. 설명 없음. 독자를 즉시 악몽 속으로.',
      },
    ],
    warnings: [
      '기이함이 의미 없는 충격으로 전락하지 않도록',
      '논리적 정합성 유지',
      '진정한 공포는 일상에서',
    ],
  },
};

// ============================================
// 스타일 적용 가이드
// ============================================

export interface StyleApplication {
  situation: string;
  recommendedStyles: string[];
  techniques: string[];
  warnings: string[];
}

export const STYLE_APPLICATIONS: StyleApplication[] = [
  {
    situation: '트라우마/폭력 묘사',
    recommendedStyles: ['hanKang', 'camus'],
    techniques: [
      '직접적 묘사 대신 신체 반응',
      '여백과 침묵 활용',
      '현재형으로 즉시성',
      '감정 설명 배제',
    ],
    warnings: [
      '선정성 주의',
      '피해자 입장 존중',
      '독자의 트라우마 고려',
    ],
  },
  {
    situation: '도덕적 딜레마',
    recommendedStyles: ['dostoevsky'],
    techniques: [
      '내면 독백 격화',
      '양심과 욕망의 대화',
      '자기 합리화와 자기 혐오',
      '극단적 선택의 순간 포착',
    ],
    warnings: [
      '선악 이분법 피하기',
      '설교조 경계',
      '독자 스스로 판단하게',
    ],
  },
  {
    situation: '시간/역사 서사',
    recommendedStyles: ['marquez'],
    techniques: [
      '시간 압축과 팽창',
      '예언적 서술',
      '순환 구조',
      '가족을 통한 역사',
    ],
    warnings: [
      '복잡성 관리',
      '독자 혼란 방지',
      '핵심 사건 강조',
    ],
  },
  {
    situation: '소외/이방인',
    recommendedStyles: ['camus', 'kafka'],
    techniques: [
      '감정적 거리두기',
      '일상의 낯설게 하기',
      '논리적 부조리',
      '관찰자 시점',
    ],
    warnings: [
      '냉담함이 무관심으로 보이지 않도록',
      '독자 공감 유지',
    ],
  },
];

// ============================================
// 스타일 프롬프트 생성
// ============================================

/**
 * 특정 작가 스타일을 적용한 글쓰기 프롬프트 생성
 */
export function generateStylePrompt(
  authorKey: keyof typeof AUTHOR_STYLES,
  situation?: string
): string {
  const style = AUTHOR_STYLES[authorKey];

  let prompt = `
## ${style.name} 스타일 글쓰기 가이드
${style.nobelYear ? `(${style.nobelYear}년 노벨 문학상 수상)` : ''}

### 핵심 특징
${style.signature.map(s => `- ${s}`).join('\n')}

### 문체적 특징
${style.proseCharacteristics.map(c => `- ${c}`).join('\n')}

### 주제적 관심사
${style.thematicFocus.map(t => `- ${t}`).join('\n')}

### 기법
${style.techniques.map(t => `
**${t.name}**
- 설명: ${t.description}
- 적용법: ${t.howToApply}
- 예시: ${t.example}
`).join('\n')}

### 예시 문장 분석
${style.exampleSentences.map(e => `
> "${e.korean}"
분석: ${e.analysis}
`).join('\n')}

### 주의사항
${style.warnings.map(w => `⚠️ ${w}`).join('\n')}

`;

  if (situation) {
    const app = STYLE_APPLICATIONS.find(a =>
      a.situation.includes(situation) || situation.includes(a.situation)
    );
    if (app) {
      prompt += `
### 현재 상황(${situation})에서의 적용
${app.techniques.map(t => `- ${t}`).join('\n')}

주의:
${app.warnings.map(w => `- ${w}`).join('\n')}
`;
    }
  }

  return prompt;
}

/**
 * 여러 작가의 스타일을 혼합한 프롬프트 생성
 */
export function generateHybridStylePrompt(
  authors: (keyof typeof AUTHOR_STYLES)[],
  primaryAuthor?: keyof typeof AUTHOR_STYLES
): string {
  const primary = primaryAuthor ? AUTHOR_STYLES[primaryAuthor] : null;

  let prompt = `
## 문학적 스타일 가이드 (복합)

`;

  if (primary) {
    prompt += `### 주요 스타일: ${primary.name}
${primary.signature.map(s => `- ${s}`).join('\n')}

`;
  }

  prompt += `### 참고 스타일
`;

  for (const key of authors) {
    if (key === primaryAuthor) continue;
    const style = AUTHOR_STYLES[key];
    prompt += `
**${style.name}** - 차용할 요소:
- ${style.signature.slice(0, 2).join(', ')}
`;
  }

  prompt += `
### 혼합 시 주의
- 스타일의 조화 유지
- 한 장면 내에서 일관성
- 작가 모방이 아닌 자기 목소리 발견
`;

  return prompt;
}

// ============================================
// 안티 클리셰 가이드
// ============================================

export interface ClicheAlternative {
  cliche: string;
  whyBad: string;
  alternatives: {
    level: 'adequate' | 'good' | 'excellent';
    text: string;
    technique: string;
  }[];
}

export const CLICHE_ALTERNATIVES: ClicheAlternative[] = [
  {
    cliche: '심장이 두근거렸다',
    whyBad: '너무 흔해서 감정 전달력이 없음',
    alternatives: [
      {
        level: 'adequate',
        text: '가슴 안에서 무언가 두드리는 것 같았다',
        technique: '간접화',
      },
      {
        level: 'good',
        text: '숨을 쉬는 것조차 소리가 나는 것 같았다',
        technique: '감각 전환',
      },
      {
        level: 'excellent',
        text: '그녀의 이름을 부르자 방 안의 공기가 달라졌다',
        technique: '외부화 + 여백',
      },
    ],
  },
  {
    cliche: '눈물이 흘렀다',
    whyBad: '직접 설명, 감정 강요',
    alternatives: [
      {
        level: 'adequate',
        text: '시야가 흐려졌다',
        technique: '감각적 변환',
      },
      {
        level: 'good',
        text: '얼굴에 무언가 차가운 것이 닿았다',
        technique: '객관화',
      },
      {
        level: 'excellent',
        text: '그녀는 아무 말도 하지 않았다. 창밖으로 비가 내렸다',
        technique: '전이 + 여백 (한강 스타일)',
      },
    ],
  },
  {
    cliche: '주먹을 불끈 쥐었다',
    whyBad: '분노 표현의 상투적 기호',
    alternatives: [
      {
        level: 'adequate',
        text: '손톱이 손바닥을 파고들었다',
        technique: '구체화',
      },
      {
        level: 'good',
        text: '이빨 사이로 숨이 새어나갔다',
        technique: '다른 신체 부위',
      },
      {
        level: 'excellent',
        text: '그의 그림자가 한 뼘은 더 커진 것 같았다',
        technique: '외부 투영',
      },
    ],
  },
  {
    cliche: '그녀는 슬펐다',
    whyBad: 'Tell, Don\'t Show의 전형',
    alternatives: [
      {
        level: 'adequate',
        text: '그녀의 어깨가 축 처졌다',
        technique: '신체 언어',
      },
      {
        level: 'good',
        text: '그녀는 오래도록 창밖을 바라보았다',
        technique: '행동으로 암시',
      },
      {
        level: 'excellent',
        text: '방 안이 갑자기 너무 컸다',
        technique: '공간 감각 변화',
      },
    ],
  },
  {
    cliche: '시간이 멈춘 것 같았다',
    whyBad: '충격 표현의 상투어',
    alternatives: [
      {
        level: 'adequate',
        text: '세상의 소리가 멀어졌다',
        technique: '청각 변화',
      },
      {
        level: 'good',
        text: '숨을 내쉬는 것을 잊었다',
        technique: '신체 반응',
      },
      {
        level: 'excellent',
        text: '그 순간은 끝나지 않았다. 지금도 끝나지 않았다',
        technique: '시제 조작',
      },
    ],
  },
];

/**
 * 클리셰 대안 찾기
 */
export function findClicheAlternative(text: string): {
  found: boolean;
  cliche?: string;
  alternatives?: ClicheAlternative['alternatives'];
  suggestion?: string;
} {
  for (const ca of CLICHE_ALTERNATIVES) {
    if (text.includes(ca.cliche)) {
      return {
        found: true,
        cliche: ca.cliche,
        alternatives: ca.alternatives,
        suggestion: `"${ca.cliche}"는 ${ca.whyBad}. 아래 대안을 참고하세요.`,
      };
    }
  }
  return { found: false };
}

export default {
  AUTHOR_STYLES,
  STYLE_APPLICATIONS,
  CLICHE_ALTERNATIVES,
  generateStylePrompt,
  generateHybridStylePrompt,
  findClicheAlternative,
};
