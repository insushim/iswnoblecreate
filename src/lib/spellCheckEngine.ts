// ============================================================
// 한국어 맞춤법 검사 엔진
// ============================================================

// ============================================================
// 타입 정의
// ============================================================

export interface SpellCorrection {
  original: string;
  suggestion: string;
  type: 'spelling' | 'spacing' | 'grammar' | 'foreign' | 'punctuation';
  position: number;
  context: string;
  explanation: string;
}

export interface SpellCheckResponse {
  corrections: SpellCorrection[];
  score: number;
}

// ============================================================
// 1. 자주 틀리는 맞춤법 사전
// ============================================================

const COMMON_MISTAKES: ReadonlyArray<readonly [string, string]> = [
  // 되다/돼다 혼동
  ['안됀다', '안 된다'],
  ['안돼요', '안 돼요'],
  ['됬다', '됐다'],
  ['됬는데', '됐는데'],
  ['됬으면', '됐으면'],
  ['됬을', '됐을'],
  ['됬지', '됐지'],
  ['됬습니다', '됐습니다'],
  ['안됩니다', '안 됩니다'],
  ['안되요', '안 돼요'],
  ['되가지고', '돼가지고'],
  ['되서', '돼서'],

  // 왠/웬 혼동
  ['웬지', '왠지'],
  ['왠만하면', '웬만하면'],
  ['왠일', '웬일'],
  ['왠떡', '웬떡'],
  ['왠걸', '웬걸'],

  // 며칠/몇일
  ['몇일', '며칠'],
  ['몇일간', '며칠간'],
  ['몇일째', '며칠째'],

  // 금세/금새
  ['금새', '금세'],

  // 어이/어의
  ['어의없다', '어이없다'],
  ['어의가 없다', '어이가 없다'],
  ['어의없는', '어이없는'],
  ['어의가없다', '어이가 없다'],

  // 기타 자주 틀리는 표현
  ['일부로', '일부러'],
  ['설겆이', '설거지'],
  ['설겂이', '설거지'],
  ['오랫만에', '오랜만에'],
  ['문안하다', '무난하다'],
  ['흐리멍텅', '흐리멍덩'],
  ['어떻해', '어떡해'],
  ['어떻해야', '어떡해야'],
  ['바램', '바람'],
  ['만듬', '만듦'],
  ['깨끗히', '깨끗이'],
  ['곰곰히', '곰곰이'],
  ['가까히', '가까이'],
  ['빈번히', '빈번이'],
  ['간간히', '간간이'],
  ['겸연적다', '겸연쩍다'],
  ['역활', '역할'],
  ['할께', '할게'],
  ['할께요', '할게요'],
  ['해줄께', '해줄게'],
  ['다를께', '다를게'],
  ['갈께', '갈게'],
  ['올께', '올게'],
  ['넣을께', '넣을게'],
  ['볼께', '볼게'],
  ['줄께', '줄게'],
  ['알았겠냐', '알겠냐'],
  ['구지', '굳이'],
  ['어떠케', '어떻게'],
  ['갈켜', '가르쳐'],
  ['가르켜', '가르쳐'],
  ['왜냐면', '왜냐하면'],
  ['요컨데', '요컨대'],
  ['하마트면', '하마터면'],
  ['곤히', '곤이'],
  ['일찍히', '일찍이'],
  ['희안하다', '희한하다'],
  ['의례', '으레'],
  ['삼가해', '삼가'],
  ['삼가하다', '삼가다'],
  ['댓가', '대가'],
  ['갯수', '개수'],
] as const;

// ============================================================
// 2. 외래어 표기법 사전
// ============================================================

const FOREIGN_WORDS: ReadonlyArray<readonly [string, string]> = [
  // 음료/음식
  ['까페', '카페'],
  ['쥬스', '주스'],
  ['쵸콜릿', '초콜릿'],
  ['쵸코', '초코'],
  ['케잌', '케이크'],
  ['케익', '케이크'],
  ['비스켓', '비스킷'],
  ['도넛츠', '도넛'],
  ['도너츠', '도넛'],
  ['도나쓰', '도넛'],
  ['삐자', '피자'],
  ['부페', '뷔페'],
  ['소세지', '소시지'],

  // IT/기술
  ['메세지', '메시지'],
  ['컨텐츠', '콘텐츠'],
  ['데스크탑', '데스크톱'],
  ['데이타', '데이터'],
  ['프린타', '프린터'],
  ['모니타', '모니터'],
  ['네트웍', '네트워크'],
  ['어플', '앱'],
  ['어플리케이션', '애플리케이션'],
  ['블루투쓰', '블루투스'],

  // 생활용품/패션
  ['악세사리', '액세서리'],
  ['억세서리', '액세서리'],
  ['쥬얼리', '주얼리'],
  ['미씽', '미싱'],
  ['자켓', '재킷'],
  ['쟈켓', '재킷'],
  ['져지', '저지'],
  ['가디건', '카디건'],
  ['빤쓰', '팬츠'],
  ['싸이즈', '사이즈'],

  // 문화/엔터테인먼트
  ['콘써트', '콘서트'],
  ['리더쉽', '리더십'],
  ['파트너쉽', '파트너십'],
  ['챔피언쉽', '챔피언십'],
  ['멤버쉽', '멤버십'],
  ['스폰서쉽', '스폰서십'],

  // 인명/지명 관련 일반 표기
  ['빠리', '파리'],
  ['워싱톤', '워싱턴'],

  // 기타
  ['써비스', '서비스'],
  ['싸인', '사인'],
  ['레포트', '리포트'],
  ['프리젠테이션', '프레젠테이션'],
  ['앙케이트', '앙케트'],
  ['발란스', '밸런스'],
  ['밸란스', '밸런스'],
  ['알러지', '알레르기'],
  ['알콜', '알코올'],
  ['카타로그', '카탈로그'],
  ['로보트', '로봇'],
  ['미싸일', '미사일'],
] as const;

// ============================================================
// 3. 띄어쓰기 규칙
// ============================================================

/** 붙여 써야 하는데 떼어 쓴 패턴 (조사 등) */
const SHOULD_BE_JOINED: ReadonlyArray<{
  pattern: RegExp;
  fix: (match: string, ...groups: string[]) => string;
  explanation: string;
}> = [
  {
    pattern: /(\S+)\s+(은|는|이|가|을|를|에|에서|에게|의|와|과|로|으로|도|만|까지|부터|보다|마다|처럼|같이|대로|밖에|조차|마저|이나|나|든지|이든지|이라|라|이며|며|이란|란|이요|요|이야|야)\b/g,
    fix: (_match: string, word: string, josa: string) => `${word}${josa}`,
    explanation: '조사는 앞말에 붙여 씁니다.',
  },
];

/** 떼어 써야 하는데 붙여 쓴 패턴 (의존명사 등) */
const SHOULD_BE_SEPARATED: ReadonlyArray<{
  pattern: RegExp;
  fix: string;
  explanation: string;
}> = [
  // 의존명사 "수"
  {
    pattern: /할수있/g,
    fix: '할 수 있',
    explanation: '의존명사 "수"는 앞말과 띄어 씁니다.',
  },
  {
    pattern: /할수없/g,
    fix: '할 수 없',
    explanation: '의존명사 "수"는 앞말과 띄어 씁니다.',
  },
  {
    pattern: /올수있/g,
    fix: '올 수 있',
    explanation: '의존명사 "수"는 앞말과 띄어 씁니다.',
  },
  {
    pattern: /갈수있/g,
    fix: '갈 수 있',
    explanation: '의존명사 "수"는 앞말과 띄어 씁니다.',
  },
  {
    pattern: /볼수있/g,
    fix: '볼 수 있',
    explanation: '의존명사 "수"는 앞말과 띄어 씁니다.',
  },
  {
    pattern: /될수있/g,
    fix: '될 수 있',
    explanation: '의존명사 "수"는 앞말과 띄어 씁니다.',
  },
  {
    pattern: /([가-힣])수있/g,
    fix: '$1 수 있',
    explanation: '의존명사 "수"는 앞말과 띄어 씁니다.',
  },
  {
    pattern: /([가-힣])수없/g,
    fix: '$1 수 없',
    explanation: '의존명사 "수"는 앞말과 띄어 씁니다.',
  },

  // 의존명사 "때"
  {
    pattern: /할때/g,
    fix: '할 때',
    explanation: '의존명사 "때"는 앞말과 띄어 씁니다.',
  },
  {
    pattern: /올때/g,
    fix: '올 때',
    explanation: '의존명사 "때"는 앞말과 띄어 씁니다.',
  },
  {
    pattern: /갈때/g,
    fix: '갈 때',
    explanation: '의존명사 "때"는 앞말과 띄어 씁니다.',
  },
  {
    pattern: /볼때/g,
    fix: '볼 때',
    explanation: '의존명사 "때"는 앞말과 띄어 씁니다.',
  },
  {
    pattern: /했을때/g,
    fix: '했을 때',
    explanation: '의존명사 "때"는 앞말과 띄어 씁니다.',
  },
  {
    pattern: /([가-힣])(ㄹ|을|를)때/g,
    fix: '$1$2 때',
    explanation: '의존명사 "때"는 앞말과 띄어 씁니다.',
  },

  // 의존명사 "것"
  {
    pattern: /할것이/g,
    fix: '할 것이',
    explanation: '의존명사 "것"은 앞말과 띄어 씁니다.',
  },
  {
    pattern: /한것/g,
    fix: '한 것',
    explanation: '의존명사 "것"은 앞말과 띄어 씁니다.',
  },
  {
    pattern: /할것/g,
    fix: '할 것',
    explanation: '의존명사 "것"은 앞말과 띄어 씁니다.',
  },
  {
    pattern: /된것/g,
    fix: '된 것',
    explanation: '의존명사 "것"은 앞말과 띄어 씁니다.',
  },
  {
    pattern: /는것/g,
    fix: '는 것',
    explanation: '의존명사 "것"은 앞말과 띄어 씁니다.',
  },

  // 의존명사 "데"
  {
    pattern: /하는데도/g,
    fix: '하는 데도',
    explanation: '의존명사 "데"는 앞말과 띄어 씁니다.',
  },
  {
    pattern: /가는데/g,
    fix: '가는 데',
    explanation: '의존명사 "데"는 앞말과 띄어 씁니다.',
  },

  // 의존명사 "만큼"
  {
    pattern: /할만큼/g,
    fix: '할 만큼',
    explanation: '의존명사 "만큼"은 앞말과 띄어 씁니다.',
  },
  {
    pattern: /한만큼/g,
    fix: '한 만큼',
    explanation: '의존명사 "만큼"은 앞말과 띄어 씁니다.',
  },

  // 의존명사 "뿐"
  {
    pattern: /할뿐/g,
    fix: '할 뿐',
    explanation: '의존명사 "뿐"은 앞말과 띄어 씁니다.',
  },
  {
    pattern: /한뿐/g,
    fix: '한 뿐',
    explanation: '의존명사 "뿐"은 앞말과 띄어 씁니다.',
  },

  // 의존명사 "듯"
  {
    pattern: /하는듯/g,
    fix: '하는 듯',
    explanation: '의존명사 "듯"은 앞말과 띄어 씁니다.',
  },
  {
    pattern: /한듯/g,
    fix: '한 듯',
    explanation: '의존명사 "듯"은 앞말과 띄어 씁니다.',
  },

  // 의존명사 "지"
  {
    pattern: /한지/g,
    fix: '한 지',
    explanation: '의존명사 "지"(시간 경과)는 앞말과 띄어 씁니다.',
  },
  {
    pattern: /된지/g,
    fix: '된 지',
    explanation: '의존명사 "지"(시간 경과)는 앞말과 띄어 씁니다.',
  },

  // 접속부사
  {
    pattern: /그러면서/g,
    fix: '그러면서',
    explanation: '',
  },
  {
    pattern: /그러 면서/g,
    fix: '그러면서',
    explanation: '접속부사 "그러면서"는 붙여 씁니다.',
  },
];

// ============================================================
// 4. 문장부호 규칙
// ============================================================

interface PunctuationRule {
  pattern: RegExp;
  fix: string;
  explanation: string;
}

const PUNCTUATION_RULES: ReadonlyArray<PunctuationRule> = [
  // 말줄임표: ASCII "..." -> 한국어 출판 표준 유니코드 "……"
  {
    pattern: /\.{3}(?!\.)/g,
    fix: '\u2026\u2026',
    explanation: '한국어 출판 표준에서 말줄임표는 "\u2026\u2026"(U+2026 두 개)을 사용합니다.',
  },
  // 느낌표/물음표 뒤 띄어쓰기 누락 (문장이 이어지는 경우)
  {
    pattern: /([!?])([가-힣a-zA-Z])/g,
    fix: '$1 $2',
    explanation: '느낌표 또는 물음표 뒤에는 띄어쓰기를 합니다.',
  },
  // 쉼표 뒤 띄어쓰기 누락
  {
    pattern: /,([가-힣a-zA-Z])/g,
    fix: ', $1',
    explanation: '쉼표 뒤에는 띄어쓰기를 합니다.',
  },
];

// ============================================================
// 검사 엔진
// ============================================================

function extractContext(text: string, position: number, length: number): string {
  const contextRadius = 15;
  const start = Math.max(0, position - contextRadius);
  const end = Math.min(text.length, position + length + contextRadius);
  let context = text.slice(start, end);
  if (start > 0) context = '...' + context;
  if (end < text.length) context = context + '...';
  return context;
}

function checkCommonMistakes(text: string): SpellCorrection[] {
  const corrections: SpellCorrection[] = [];

  for (let i = 0; i < COMMON_MISTAKES.length; i++) {
    const wrong = COMMON_MISTAKES[i][0];
    const correct = COMMON_MISTAKES[i][1];

    // wrong === correct 이면 건너뛰기 (사전에 OK 표시로 남겨둔 항목)
    if (wrong === correct) continue;

    let searchFrom = 0;
    while (true) {
      const idx = text.indexOf(wrong, searchFrom);
      if (idx === -1) break;

      corrections.push({
        original: wrong,
        suggestion: correct,
        type: 'spelling',
        position: idx,
        context: extractContext(text, idx, wrong.length),
        explanation: `"${wrong}"은(는) 잘못된 표기입니다. "${correct}"으로 수정하세요.`,
      });

      searchFrom = idx + wrong.length;
    }
  }

  return corrections;
}

function checkForeignWords(text: string): SpellCorrection[] {
  const corrections: SpellCorrection[] = [];

  for (let i = 0; i < FOREIGN_WORDS.length; i++) {
    const wrong = FOREIGN_WORDS[i][0];
    const correct = FOREIGN_WORDS[i][1];

    if (wrong === correct) continue;

    let searchFrom = 0;
    while (true) {
      const idx = text.indexOf(wrong, searchFrom);
      if (idx === -1) break;

      corrections.push({
        original: wrong,
        suggestion: correct,
        type: 'foreign',
        position: idx,
        context: extractContext(text, idx, wrong.length),
        explanation: `외래어 표기법에 따라 "${wrong}"은(는) "${correct}"으로 표기합니다.`,
      });

      searchFrom = idx + wrong.length;
    }
  }

  return corrections;
}

function checkSpacing(text: string): SpellCorrection[] {
  const corrections: SpellCorrection[] = [];

  // 떼어 써야 하는데 붙여 쓴 것 (의존명사 등)
  for (const rule of SHOULD_BE_SEPARATED) {
    if (!rule.explanation) continue; // 빈 explanation = 정상 표기 확인용

    const regex = new RegExp(rule.pattern.source, rule.pattern.flags);
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      const original = match[0];
      const suggestion = original.replace(new RegExp(rule.pattern.source), rule.fix);

      if (original === suggestion) continue;

      corrections.push({
        original,
        suggestion,
        type: 'spacing',
        position: match.index,
        context: extractContext(text, match.index, original.length),
        explanation: rule.explanation,
      });
    }
  }

  // 붙여 써야 하는데 떼어 쓴 것 (조사)
  for (const rule of SHOULD_BE_JOINED) {
    const regex = new RegExp(rule.pattern.source, rule.pattern.flags);
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      const original = match[0];
      const word = match[1];
      const josa = match[2];

      // 단어가 한 글자 미만이거나 조사 앞에 한글이 아닌 것이 있으면 건너뜀
      if (!word || !josa) continue;

      // 단어의 마지막 글자가 한글인지 확인
      const lastChar = word.charCodeAt(word.length - 1);
      if (lastChar < 0xAC00 || lastChar > 0xD7A3) continue;

      // 일부 예외: 실제로 띄어야 하는 경우 (조사가 아닌 단어의 시작인 경우)
      const simpleJosa = ['은', '는', '이', '가', '을', '를', '에', '의', '와', '과', '도', '만', '로', '으로'];
      if (!simpleJosa.includes(josa)) continue;

      const suggestion = rule.fix(original, word, josa);
      if (original === suggestion) continue;

      corrections.push({
        original,
        suggestion,
        type: 'spacing',
        position: match.index,
        context: extractContext(text, match.index, original.length),
        explanation: rule.explanation,
      });
    }
  }

  return corrections;
}

function checkPunctuation(text: string): SpellCorrection[] {
  const corrections: SpellCorrection[] = [];

  for (const rule of PUNCTUATION_RULES) {
    const regex = new RegExp(rule.pattern.source, rule.pattern.flags);
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      const original = match[0];
      const suggestion = original.replace(new RegExp(rule.pattern.source), rule.fix);

      if (original === suggestion) continue;

      corrections.push({
        original,
        suggestion,
        type: 'punctuation',
        position: match.index,
        context: extractContext(text, match.index, original.length),
        explanation: rule.explanation,
      });
    }
  }

  return corrections;
}

/** 중복 제거 (같은 위치 + 같은 원문) */
function deduplicateCorrections(corrections: SpellCorrection[]): SpellCorrection[] {
  const seen = new Set<string>();
  return corrections.filter((c) => {
    const key = `${c.position}:${c.original}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** 점수 계산: 100점에서 오류당 감점 */
function calculateScore(text: string, corrections: SpellCorrection[]): number {
  if (text.length === 0) return 100;

  // 글자 수 대비 오류 비율로 점수 산정
  const charCount = text.replace(/\s/g, '').length;
  if (charCount === 0) return 100;

  // 오류 유형별 감점 가중치
  const weights: Record<SpellCorrection['type'], number> = {
    spelling: 3,
    spacing: 1.5,
    grammar: 2.5,
    foreign: 2,
    punctuation: 1,
  };

  let totalPenalty = 0;
  for (const correction of corrections) {
    totalPenalty += weights[correction.type];
  }

  // 1000자 기준으로 정규화
  const normalizedPenalty = (totalPenalty / charCount) * 1000;
  const score = Math.max(0, Math.min(100, 100 - normalizedPenalty));

  return Math.round(score * 10) / 10;
}

/** 맞춤법 검사 실행 */
export function performSpellCheck(text: string): SpellCheckResponse {
  const allCorrections: SpellCorrection[] = [
    ...checkCommonMistakes(text),
    ...checkForeignWords(text),
    ...checkSpacing(text),
    ...checkPunctuation(text),
  ];

  const corrections = deduplicateCorrections(allCorrections);
  corrections.sort((a, b) => a.position - b.position);

  const score = calculateScore(text, corrections);

  return { corrections, score };
}
