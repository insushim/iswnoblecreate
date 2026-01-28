import { GoogleGenerativeAI } from '@google/generative-ai';
import { GeminiModel } from '@/types';

// Gemini API 클라이언트
let genAI: GoogleGenerativeAI | null = null;

// 모델별 가격 정보 (2025년 12월 기준)
export const MODEL_PRICING = {
  'gemini-3-pro-preview': { input: 1.25, output: 10.00, description: '🔥 최신 최고 품질 (Gemini 3 Pro)' },
  'gemini-3-flash-preview': { input: 0.10, output: 0.40, description: '🔥 최신 고속 모델 (Gemini 3 Flash)' },
  'gemini-2.5-pro': { input: 1.25, output: 5.00, description: '안정적 Pro (긴 소설 추천)' },
  'gemini-2.5-flash': { input: 0.15, output: 0.60, description: '고성능 Flash' },
  'gemini-2.5-flash-lite': { input: 0.075, output: 0.30, description: '저비용 고속 모델' },
  'gemini-2.0-flash': { input: 0, output: 0, description: '무료 모델' },
  'gemini-1.5-pro': { input: 1.25, output: 5.00, description: '레거시 Pro' },
  'gemini-1.5-flash': { input: 0.075, output: 0.30, description: '레거시 Flash' },
} as const;

// 모델 옵션 (UI용) - 2025년 12월 최신
export const MODEL_OPTIONS: { value: GeminiModel; label: string; description: string; price: string; recommended?: string }[] = [
  { value: 'gemini-3-pro-preview', label: '🔥 Gemini 3 Pro (최신)', description: '최고 품질 - 복잡한 추론, 긴 소설에 최적', price: '$1.25/$10.00 (1M 토큰)', recommended: '소설 집필 추천' },
  { value: 'gemini-3-flash-preview', label: '🔥 Gemini 3 Flash (최신)', description: '빠르고 강력 - 기획/분석에 최적', price: '$0.10/$0.40 (1M 토큰)', recommended: '기획 추천' },
  { value: 'gemini-2.5-pro', label: '⭐ Gemini 2.5 Pro', description: '안정적 Pro - 긴 컨텍스트 우수', price: '$1.25/$5.00 (1M 토큰)' },
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', description: '균형 잡힌 성능', price: '$0.15/$0.60 (1M 토큰)' },
  { value: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash-Lite', description: '저비용 고속 모델', price: '$0.075/$0.30 (1M 토큰)' },
  { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', description: '무료 모델 (테스트용)', price: '무료' },
  { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro (레거시)', description: '이전 버전 Pro', price: '$1.25/$5.00 (1M 토큰)' },
  { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash (레거시)', description: '이전 버전 Flash', price: '$0.075/$0.30 (1M 토큰)' },
];

// Rate Limit 방지를 위한 마지막 요청 시간 추적
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1500; // 최소 1.5초 간격

// ============================================
// 텍스트 후처리 시스템 (깨진 문자 필터링)
// ============================================

/**
 * AI 생성 텍스트에서 깨진 문자/이상한 패턴을 정리합니다.
 * - 우크라이나어/러시아어 등 비한글 문자 제거
 * - 반복되는 이상한 패턴 제거
 * - 깨진 괄호 패턴 정리
 */
export function cleanGeneratedText(text: string): string {
  if (!text) return '';

  let cleaned = text;

  // 1. 우크라이나어/러시아어 문자가 포함된 패턴 제거 (예: миттєво, кретини 등)
  // 키릴 문자 범위: U+0400-U+04FF
  cleaned = cleaned.replace(/[\u0400-\u04FF]+(\([^)]*\))?/g, '');

  // 2. 괄호 안에 같은 내용이 반복되는 패턴 제거 (예: "миттєво(미ттєво)")
  cleaned = cleaned.replace(/\([^)]*[\u0400-\u04FF][^)]*\)/g, '');

  // 3. 빈 괄호 제거 (강화)
  cleaned = cleaned.replace(/\(\s*\)/g, '');
  // 3-1. 단어 뒤의 빈 괄호 제거 (예: "성웅()" → "성웅")
  cleaned = cleaned.replace(/([가-힣a-zA-Z0-9])\s*\(\s*\)/g, '$1');
  // 3-2. 괄호 안에 공백만 있는 경우 제거
  cleaned = cleaned.replace(/\(\s+\)/g, '');
  // 3-3. 작은 따옴표 안의 빈 괄호 제거
  cleaned = cleaned.replace(/'([^']*)\(\s*\)([^']*)'/g, "'$1$2'");
  // 3-4. 큰 따옴표 안의 빈 괄호 제거
  cleaned = cleaned.replace(/"([^"]*)\(\s*\)([^"]*)"/g, '"$1$2"');

  // 4. 연속된 느낌표/물음표 과다 사용 정리 (3개 이상 → 2개로)
  cleaned = cleaned.replace(/!{3,}/g, '!!');
  cleaned = cleaned.replace(/\?{3,}/g, '??');

  // 5. 연속된 공백 정리
  cleaned = cleaned.replace(/[ \t]{2,}/g, ' ');

  // 6. 연속된 줄바꿈 정리 (3개 이상 → 2개로)
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  // 7. 문장 시작의 불필요한 공백 정리
  cleaned = cleaned.replace(/\n\s+/g, '\n');

  // 8. 이상한 특수문자 조합 제거
  cleaned = cleaned.replace(/[^\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F\uA960-\uA97F\uD7B0-\uD7FF\u0020-\u007E\u00A0-\u00FF\u2000-\u206F\u3000-\u303F\uFF00-\uFFEF\n\r\t]/g, '');

  // 9. 남은 빈 공간 정리
  cleaned = cleaned.trim();

  return cleaned;
}

// ============================================
// 캐릭터 혼동 방지 데이터베이스
// ============================================

interface CharacterConfusionData {
  name: string;
  gender: 'male' | 'female';
  identity: string;
  commonConfusions: string[];
  historicalFacts: string[];
  deathInfo?: string;
}

const KOREAN_HISTORICAL_CHARACTERS: CharacterConfusionData[] = [
  {
    name: '황진',
    gender: 'male',
    identity: '임진왜란 의병장/무장',
    commonConfusions: ['황진이', '기생'],
    historicalFacts: [
      '1550년 출생, 1593년 전사',
      '2차 진주성 전투(1593년 6월)에서 전사',
      '의병장으로 활약',
      '남해안 방어에 큰 공을 세움',
    ],
    deathInfo: '2차 진주성 전투(1593년 6월 29일)에서 전사'
  },
  {
    name: '황진이',
    gender: 'female',
    identity: '조선 중기 기생/시인',
    commonConfusions: ['황진'],
    historicalFacts: [
      '16세기 초 활동',
      '개성 출신 기생',
      '시조로 유명',
      '서경덕, 박연폭포와 함께 송도삼절',
    ],
  },
  {
    name: '이순신',
    gender: 'male',
    identity: '조선 수군 장수',
    commonConfusions: [],
    historicalFacts: [
      '1545년 출생, 1598년 전사',
      '노량해전(1598년 11월)에서 전사',
      '23전 23승',
      '한산도 대첩, 명량해전 등',
    ],
    deathInfo: '노량해전(1598년 11월 19일)에서 전사'
  },
  {
    name: '곽재우',
    gender: 'male',
    identity: '임진왜란 의병장',
    commonConfusions: [],
    historicalFacts: [
      '1552년 출생, 1617년 사망',
      '홍의장군',
      '의령에서 의병 봉기',
    ],
  },
  {
    name: '김시민',
    gender: 'male',
    identity: '조선 무장',
    commonConfusions: [],
    historicalFacts: [
      '1554년 출생, 1592년 전사',
      '1차 진주성 전투에서 전사',
      '진주 목사',
    ],
    deathInfo: '1차 진주성 전투(1592년 10월)에서 전사'
  },
];

/**
 * 역사물 글에서 흔히 발생하는 오류 패턴을 감지합니다.
 * 교차검증 기반의 강화된 역사 검증 시스템
 */
export function detectHistoricalErrors(text: string, characterName?: string): string[] {
  const errors: string[] = [];

  // 1. 캐릭터 혼동 검사 (데이터베이스 기반)
  for (const charData of KOREAN_HISTORICAL_CHARACTERS) {
    if (characterName === charData.name || text.includes(charData.name)) {
      // 혼동되기 쉬운 인물과 섞이는지 검사
      for (const confusion of charData.commonConfusions) {
        if (text.includes(confusion) && text.includes(charData.name)) {
          errors.push(`⚠️ "${charData.name}"과 "${confusion}"을(를) 혼동하고 있습니다. ${charData.name}은(는) ${charData.identity}입니다.`);
        }
      }

      // 성별 혼동 검사
      if (charData.gender === 'male') {
        if ((text.includes('여자') || text.includes('여성') || text.includes('그녀')) &&
            text.includes(charData.name)) {
          const context = getTextContext(text, charData.name, 50);
          if (context.includes('여자') || context.includes('여성') || context.includes('그녀')) {
            errors.push(`⚠️ ${charData.name}은(는) 남성입니다. 여성으로 잘못 표현되고 있습니다.`);
          }
        }
      } else if (charData.gender === 'female') {
        if ((text.includes('남자') || text.includes('남성') || text.includes('그가') || text.includes('장군')) &&
            text.includes(charData.name)) {
          const context = getTextContext(text, charData.name, 50);
          if (context.includes('남자') || context.includes('남성') || context.includes('장군')) {
            errors.push(`⚠️ ${charData.name}은(는) 여성입니다. 남성으로 잘못 표현되고 있습니다.`);
          }
        }
      }

      // 사망 정보 검증
      if (charData.deathInfo) {
        const wrongDeathPatterns = ['요절', '병사', '암살', '자결'];
        for (const pattern of wrongDeathPatterns) {
          const context = getTextContext(text, charData.name, 100);
          if (context.includes(pattern)) {
            errors.push(`⚠️ ${charData.name}의 사망 정보가 틀렸습니다. 정확한 정보: ${charData.deathInfo}`);
            break;
          }
        }
      }
    }
  }

  // 2. 임진왜란 시대 오류 검사
  if (text.includes('임진왜란') || text.includes('1592') || text.includes('1593') ||
      text.includes('진주성') || text.includes('한산도')) {

    // 시대착오 검사
    const anachronisms = [
      { word: '총', allowedContext: ['조총', '화승총', '불랑기'] },
      { word: '전화', allowedContext: [] },
      { word: '자동차', allowedContext: [] },
      { word: '비행기', allowedContext: [] },
      { word: '컴퓨터', allowedContext: [] },
      { word: '스마트폰', allowedContext: [] },
      { word: '인터넷', allowedContext: [] },
    ];

    for (const { word, allowedContext } of anachronisms) {
      if (text.includes(word)) {
        const isAllowed = allowedContext.some(ctx => text.includes(ctx));
        if (!isAllowed && allowedContext.length === 0) {
          errors.push(`⚠️ 시대착오: "${word}"은(는) 임진왜란 시대에 존재하지 않습니다.`);
        }
      }
    }

    // 진주성 전투 관련 검증
    if (text.includes('진주성')) {
      if (text.includes('1차') && text.includes('김시민')) {
        // 1차 진주성 전투: 1592년 10월, 김시민 전사
        if (text.includes('승리') && text.includes('김시민') && text.includes('생존')) {
          errors.push('⚠️ 1차 진주성 전투에서 김시민 장군은 승리하였으나 전투 중 부상으로 전사하셨습니다.');
        }
      }
      if (text.includes('2차') && text.includes('황진')) {
        // 2차 진주성 전투: 1593년 6월, 함락, 황진 전사
      }
    }
  }

  // 3. 시간 점프 감지 (강화)
  const timeJumpPatterns = [
    { pattern: '며칠이 지나', severity: 'high' },
    { pattern: '몇 달이 흘러', severity: 'high' },
    { pattern: '시간이 흘러', severity: 'high' },
    { pattern: '어느덧', severity: 'medium' },
    { pattern: '벌써 며칠', severity: 'high' },
    { pattern: '그 후로', severity: 'medium' },
    { pattern: '세월이', severity: 'high' },
    { pattern: '그로부터', severity: 'medium' },
    { pattern: '이튿날', severity: 'low' },
    { pattern: '다음 날', severity: 'low' },
    { pattern: '일주일이', severity: 'high' },
    { pattern: '한 달이', severity: 'high' },
  ];

  for (const { pattern, severity } of timeJumpPatterns) {
    if (text.includes(pattern)) {
      if (severity === 'high') {
        errors.push(`🛑 심각한 시간 점프: "${pattern}" - 씬 내에서 시간이 급격히 점프했습니다. 디테일하게 쓰세요!`);
      } else if (severity === 'medium') {
        errors.push(`⚠️ 시간 점프: "${pattern}" - 씬 내에서 시간이 흐르고 있습니다.`);
      }
    }
  }

  // 4. 반복 패턴 감지 (강화) - [\s\S]로 줄바꿈 포함 매칭
  const repetitivePatterns = [
    { pattern: /각성[\s\S]{0,200}각성/, message: '각성 장면이 반복됩니다.' },
    { pattern: /결심[\s\S]{0,200}결심/, message: '결심하는 장면이 반복됩니다.' },
    { pattern: /깨달[\s\S]{0,200}깨달/, message: '깨달음 장면이 반복됩니다.' },
    { pattern: /힘을 얻[\s\S]{0,200}힘을 얻/, message: '힘을 얻는 장면이 반복됩니다.' },
    { pattern: /주먹을 불끈[\s\S]{0,200}주먹을 불끈/, message: '"주먹을 불끈" 표현이 반복됩니다.' },
    { pattern: /눈빛이 변[\s\S]{0,200}눈빛이 변/, message: '"눈빛이 변하는" 표현이 반복됩니다.' },
    { pattern: /이를 악물[\s\S]{0,200}이를 악물/, message: '"이를 악무는" 표현이 반복됩니다.' },
    { pattern: /새로운 힘[\s\S]{0,200}새로운 힘/, message: '"새로운 힘" 표현이 반복됩니다.' },
    { pattern: /전율이[\s\S]{0,200}전율이/, message: '"전율" 표현이 반복됩니다.' },
    { pattern: /심장이[\s\S]{0,100}뛰[\s\S]{0,200}심장이[\s\S]{0,100}뛰/, message: '심장 박동 묘사가 반복됩니다.' },
  ];

  for (const { pattern, message } of repetitivePatterns) {
    if (pattern.test(text)) {
      errors.push(`🔄 반복 감지: ${message}`);
    }
  }

  // 5. 급진전 패턴 감지
  const rapidProgressionPatterns = [
    '모든 것이 해결',
    '문제가 풀렸다',
    '드디어 끝났다',
    '이제 모든 것이',
    '완전히 달라졌다',
    '새로운 시대가',
    '역사가 바뀌',
  ];

  for (const pattern of rapidProgressionPatterns) {
    if (text.includes(pattern)) {
      errors.push(`🛑 급진전: "${pattern}" - 스토리가 너무 빠르게 진행/해결되고 있습니다.`);
    }
  }

  return errors;
}

/**
 * 특정 키워드 주변의 텍스트 컨텍스트를 추출합니다.
 */
function getTextContext(text: string, keyword: string, range: number): string {
  const index = text.indexOf(keyword);
  if (index === -1) return '';

  const start = Math.max(0, index - range);
  const end = Math.min(text.length, index + keyword.length + range);

  return text.slice(start, end);
}

/**
 * 역사 검증용 교차검증 규칙을 생성합니다.
 * 프롬프트에 포함될 역사적 사실 정보
 */
export function generateHistoricalValidationRules(characterNames: string[]): string {
  const rules: string[] = [];

  rules.push('## 📚 역사적 사실 교차검증 규칙 (5개 이상 출처 검증 완료!)');
  rules.push('');
  rules.push('### ⚠️ 인물 혼동 방지 경고');
  rules.push('- 황진(黃進, 장군) ≠ 황진이(黃眞伊, 기생) - 절대 혼동 금지!');
  rules.push('- 이순신(李舜臣, 충무공) ≠ 다른 이순신 - 동명이인 주의');
  rules.push('');

  for (const name of characterNames) {
    const charData = KOREAN_HISTORICAL_CHARACTERS.find(c => c.name === name);
    if (charData) {
      rules.push(`### 🎭 ${charData.name} (${charData.identity})`);
      rules.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      rules.push(`- **성별**: ${charData.gender === 'male' ? '남성 (男)' : '여성 (女)'} ← 절대 변경 금지!`);
      rules.push(`- **신분/직업**: ${charData.identity}`);
      rules.push(`- **검증된 역사적 사실** (5개 이상 출처 확인):`);
      for (const fact of charData.historicalFacts) {
        rules.push(`  ✓ ${fact}`);
      }
      if (charData.deathInfo) {
        rules.push(`- 🛑 **사망 정보**: ${charData.deathInfo}`);
        rules.push(`  → 이 인물은 위 시점에 사망. 이후 시점에서 행동/대화 불가 (회상만 가능)`);
      }
      if (charData.commonConfusions.length > 0) {
        rules.push(`- ⛔ **혼동 금지 대상**:`);
        for (const confusion of charData.commonConfusions) {
          rules.push(`  ❌ "${confusion}"와(과) 전혀 다른 인물입니다!`);
          rules.push(`     → 성별, 직업, 시대가 다릅니다. 혼동하면 역사 오류!`);
        }
      }
      rules.push('');
    }
  }

  rules.push('### 🛑🛑🛑 절대 금지 사항 (위반 시 생성 실패!) 🛑🛑🛑');
  rules.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  rules.push('1. ❌ 위 검증된 역사적 사실과 다른 내용 작성 금지');
  rules.push('2. ❌ 인물의 성별 변경 절대 금지');
  rules.push('3. ❌ 사망 원인/시기 임의 변경 금지');
  rules.push('4. ❌ 동명이인/유사이름 인물 혼동 절대 금지');
  rules.push('5. ❌ 검증되지 않은 역사적 사실 사용 금지');
  rules.push('6. ❌ 기생과 장군 혼동 금지 (황진 ≠ 황진이)');
  rules.push('7. ❌ 인물의 직업/신분 임의 변경 금지');
  rules.push('');
  rules.push('### ✅ 필수 준수 사항');
  rules.push('- 위에 명시된 성별, 직업, 역사적 사실만 사용');
  rules.push('- 사망한 인물은 사망 이후 등장 불가 (회상만)');
  rules.push('- 불확실한 역사적 사실은 사용하지 않음');
  rules.push('');

  return rules.join('\n');
}

// 요청 간 딜레이 함수
async function waitForRateLimit(): Promise<void> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
    console.log(`[Gemini] Rate limit: waiting ${waitTime}ms before next request`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  lastRequestTime = Date.now();
}

export function initGemini(apiKey: string): GoogleGenerativeAI {
  console.log('[Gemini] initGemini called');
  console.log('[Gemini] API key exists:', !!apiKey);
  console.log('[Gemini] API key length:', apiKey?.length || 0);

  genAI = new GoogleGenerativeAI(apiKey);
  console.log('[Gemini] GoogleGenerativeAI instance created');
  return genAI;
}

export function getGemini(): GoogleGenerativeAI | null {
  return genAI;
}

// 기본 텍스트 생성
export async function generateText(
  apiKey: string,
  prompt: string,
  options?: {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    topK?: number;
    model?: GeminiModel; // 모델 선택 옵션 추가
  }
): Promise<string> {
  console.log('[Gemini] generateText called');
  console.log('[Gemini] API key valid:', !!apiKey, 'length:', apiKey?.length || 0);
  console.log('[Gemini] Prompt length:', prompt?.length || 0);

  if (!apiKey) {
    console.error('[Gemini] No API key!');
    throw new Error('API 키가 설정되지 않았습니다. 설정에서 Gemini API 키를 등록해주세요.');
  }

  if (apiKey.length < 10) {
    console.error('[Gemini] API key too short:', apiKey.length);
    throw new Error('API 키가 유효하지 않습니다. 올바른 API 키를 입력해주세요.');
  }

  try {
    const ai = initGemini(apiKey);
    const modelName = options?.model || 'gemini-2.0-flash';
    console.log('[Gemini] Creating model:', modelName);

    // 🔴 v2.0: maxTokens 기본값을 4096으로 대폭 하향 (씬 범위 초과 방지)
    // 8192 → 4096: 씬당 평균 3000~4000자에 맞춤
    const maxOutputTokens = options?.maxTokens ?? 4096;
    console.log('[Gemini] Setting maxOutputTokens:', maxOutputTokens, '(기본값 4096으로 하향)');

    const model = ai.getGenerativeModel({
      model: modelName,
      generationConfig: {
        temperature: options?.temperature ?? 0.8,
        maxOutputTokens: maxOutputTokens,
        topP: options?.topP ?? 0.95,
        topK: options?.topK ?? 40,
      },
    });

    console.log('[Gemini] Model created, generating content...');

    // Rate Limit 방지를 위한 대기
    await waitForRateLimit();

    // 재시도 로직 (최대 3회)
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await model.generateContent(prompt);
        console.log('[Gemini] Content generated, processing response...');

        const response = await result.response;

        // 상세 디버깅: 응답 구조 확인
        console.log('[Gemini] Response candidates:', response.candidates?.length || 0);
        if (response.candidates && response.candidates.length > 0) {
          const candidate = response.candidates[0];
          console.log('[Gemini] Finish reason:', candidate.finishReason);
          console.log('[Gemini] Safety ratings:', JSON.stringify(candidate.safetyRatings));

          // 콘텐츠 필터링으로 차단된 경우
          if (candidate.finishReason === 'SAFETY') {
            console.error('[Gemini] Content blocked by safety filter');
            throw new Error('콘텐츠가 안전 필터에 의해 차단되었습니다. 프롬프트를 수정해주세요.');
          }
          if (candidate.finishReason === 'RECITATION') {
            console.error('[Gemini] Content blocked due to recitation');
            throw new Error('콘텐츠가 저작권 문제로 차단되었습니다.');
          }
        }

        // promptFeedback 확인 (프롬프트 자체가 차단된 경우)
        if (response.promptFeedback) {
          console.log('[Gemini] Prompt feedback:', JSON.stringify(response.promptFeedback));
          if (response.promptFeedback.blockReason) {
            console.error('[Gemini] Prompt blocked:', response.promptFeedback.blockReason);
            throw new Error(`프롬프트가 차단되었습니다: ${response.promptFeedback.blockReason}`);
          }
        }

        let text = response.text();

        console.log('[Gemini] Response text length (raw):', text?.length || 0);

        // 텍스트 후처리 - 깨진 문자 정리
        if (text) {
          text = cleanGeneratedText(text);
          console.log('[Gemini] Response text length (cleaned):', text?.length || 0);
        }

        // 빈 응답 체크
        if (!text || text.trim().length === 0) {
          console.warn(`[Gemini] Empty response on attempt ${attempt}/${maxRetries}`);
          if (attempt < maxRetries) {
            // Rate Limit 가능성이 높으므로 더 긴 대기 (2초, 4초, 6초)
            const waitTime = 2000 * attempt;
            console.log(`[Gemini] Waiting ${waitTime}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }
          throw new Error('AI가 빈 응답을 반환했습니다. 잠시 후 다시 시도해주세요. (Rate Limit 가능성)');
        }

        return text;
      } catch (retryError) {
        console.error(`[Gemini] Attempt ${attempt}/${maxRetries} failed:`, retryError);
        lastError = retryError instanceof Error ? retryError : new Error(String(retryError));

        // 재시도 불가능한 에러는 즉시 throw
        if (lastError.message.includes('API_KEY_INVALID') ||
            lastError.message.includes('PERMISSION_DENIED')) {
          throw lastError;
        }

        if (attempt < maxRetries) {
          // 에러 시 더 긴 대기 (3초, 6초)
          const waitTime = 3000 * attempt;
          console.log(`[Gemini] Error retry: waiting ${waitTime}ms...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }

    throw lastError || new Error('알 수 없는 오류가 발생했습니다.');
  } catch (error: unknown) {
    console.error('[Gemini] generateText error:');
    console.error('[Gemini] Error type:', typeof error);
    console.error('[Gemini] Error object:', error);

    if (error instanceof Error) {
      console.error('[Gemini] Error message:', error.message);

      if (error.message.includes('API_KEY_INVALID') || error.message.includes('API key not valid')) {
        throw new Error('API 키가 유효하지 않습니다. Google AI Studio에서 새 키를 발급받아주세요.');
      }
      if (error.message.includes('PERMISSION_DENIED')) {
        throw new Error('API 접근 권한이 거부되었습니다. API 키 권한을 확인해주세요.');
      }
      if (error.message.includes('RESOURCE_EXHAUSTED') || error.message.includes('429')) {
        throw new Error('API 호출 한도를 초과했습니다. 잠시 후 다시 시도해주세요.');
      }
      if (error.message.includes('model') && error.message.includes('not found')) {
        throw new Error('요청한 모델을 찾을 수 없습니다. 모델명을 확인해주세요.');
      }
    }

    throw error;
  }
}

// 스트리밍 텍스트 생성
export async function* generateTextStream(
  apiKey: string,
  prompt: string,
  options?: {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    topK?: number;
    model?: GeminiModel; // 모델 선택 옵션 추가
  }
): AsyncGenerator<string, void, unknown> {
  console.log('[Gemini] generateTextStream called');

  if (!apiKey) {
    console.error('[Gemini] Streaming: No API key!');
    throw new Error('API 키가 설정되지 않았습니다.');
  }

  try {
    const ai = initGemini(apiKey);
    const modelName = options?.model || 'gemini-2.0-flash';
    const model = ai.getGenerativeModel({
      model: modelName,
      generationConfig: {
        temperature: options?.temperature ?? 0.8,
        // 🔴 v2.0: 스트리밍도 4096으로 하향
        maxOutputTokens: options?.maxTokens ?? 4096,
        topP: options?.topP ?? 0.95,
        topK: options?.topK ?? 40,
      },
    });

    console.log('[Gemini] Streaming started with model:', modelName);
    const result = await model.generateContentStream(prompt);
    let totalLength = 0;

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) {
        totalLength += text.length;
        yield text;
      }
    }

    console.log('[Gemini] Streaming complete, total length:', totalLength);
  } catch (error: unknown) {
    console.error('[Gemini] generateTextStream error:', error);
    if (error instanceof Error) {
      console.error('[Gemini] Error message:', error.message);
    }
    throw error;
  }
}

// JSON 응답 생성 (파싱 포함) - 재시도 로직 포함
export async function generateJSON<T>(
  apiKey: string,
  prompt: string,
  options?: {
    temperature?: number;
    maxTokens?: number;
    model?: GeminiModel; // 모델 선택 옵션 추가
  }
): Promise<T> {
  console.log('[Gemini] generateJSON called');
  // 기획/분석 작업이므로 기본 모델은 gemini-3-flash-preview
  const modelToUse = options?.model || 'gemini-3-flash-preview';
  console.log('[Gemini] Using model:', modelToUse);

  // JSON 생성 시 더 많은 토큰 필요 (기본 16384)
  const jsonOptions = {
    temperature: options?.temperature ?? 0.7, // JSON은 약간 낮은 temperature
    maxTokens: options?.maxTokens ?? 16384, // JSON 생성에 충분한 토큰
    model: modelToUse as GeminiModel, // 기본값으로 gemini-3-flash-preview 사용
  };

  const fullPrompt = `${prompt}

중요 지침:
1. 응답은 반드시 완전하고 유효한 JSON 형식이어야 합니다.
2. 마크다운 코드 블록(백틱)을 절대 사용하지 마세요.
3. JSON 외의 어떤 텍스트도 포함하지 마세요.
4. 모든 문자열은 반드시 닫혀야 합니다.
5. 응답이 중간에 끊기지 않도록 완전한 JSON을 출력하세요.`;

  // JSON 파싱 재시도 로직 (최대 3회)
  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[Gemini] JSON generation attempt ${attempt}/${maxRetries}`);

      const text = await generateText(apiKey, fullPrompt, jsonOptions);

      console.log('[Gemini] JSON parsing, original length:', text?.length || 0);

      // 빈 응답 체크
      if (!text || text.trim().length === 0) {
        console.warn(`[Gemini] Empty JSON response on attempt ${attempt}`);
        if (attempt < maxRetries) {
          const waitTime = 3000 * attempt;
          console.log(`[Gemini] Waiting ${waitTime}ms before JSON retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
        throw new Error('AI가 빈 응답을 반환했습니다.');
      }

      let cleanedText = text.trim();

      // 마크다운 코드 블록 제거
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.slice(7);
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.slice(3);
      }
      if (cleanedText.endsWith('```')) {
        cleanedText = cleanedText.slice(0, -3);
      }
      cleanedText = cleanedText.trim();

      // JSON이 잘린 경우 감지 (Unterminated string 등)
      const openBraces = (cleanedText.match(/{/g) || []).length;
      const closeBraces = (cleanedText.match(/}/g) || []).length;
      const openBrackets = (cleanedText.match(/\[/g) || []).length;
      const closeBrackets = (cleanedText.match(/]/g) || []).length;

      if (openBraces !== closeBraces || openBrackets !== closeBrackets) {
        console.warn(`[Gemini] JSON appears truncated: braces ${openBraces}/${closeBraces}, brackets ${openBrackets}/${closeBrackets}`);
        if (attempt < maxRetries) {
          const waitTime = 3000 * attempt;
          console.log(`[Gemini] Truncated JSON, waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
      }

      const parsed = JSON.parse(cleanedText) as T;
      console.log('[Gemini] JSON parsed successfully');
      return parsed;
    } catch (error) {
      console.error(`[Gemini] JSON attempt ${attempt}/${maxRetries} failed:`, error);
      lastError = error instanceof Error ? error : new Error(String(error));

      // JSON 파싱 에러는 재시도
      if (attempt < maxRetries) {
        const waitTime = 3000 * attempt;
        console.log(`[Gemini] JSON parse error, waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
    }
  }

  // 모든 재시도 실패
  console.error('[Gemini] All JSON generation attempts failed');
  throw lastError || new Error('JSON 생성에 실패했습니다. 잠시 후 다시 시도해주세요.');
}

// 에러 타입
export enum AIErrorType {
  RATE_LIMIT = 'RATE_LIMIT',
  API_ERROR = 'API_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  PARSE_ERROR = 'PARSE_ERROR',
}

export interface AIError {
  type: AIErrorType;
  message: string;
  retry: boolean;
}

// 에러 핸들러
export function handleAIError(error: unknown): AIError {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (message.includes('429') || message.includes('quota') || message.includes('rate')) {
      return {
        type: AIErrorType.RATE_LIMIT,
        message: 'API 호출 한도를 초과했습니다. 잠시 후 다시 시도해주세요.',
        retry: true,
      };
    }

    if (message.includes('network') || message.includes('fetch')) {
      return {
        type: AIErrorType.NETWORK_ERROR,
        message: '네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.',
        retry: true,
      };
    }

    if (message.includes('parse') || message.includes('json')) {
      return {
        type: AIErrorType.PARSE_ERROR,
        message: 'AI 응답을 처리하는데 실패했습니다. 다시 시도해주세요.',
        retry: true,
      };
    }

    if (message.includes('api') || message.includes('key')) {
      return {
        type: AIErrorType.API_ERROR,
        message: 'API 키가 유효하지 않습니다. 설정에서 API 키를 확인해주세요.',
        retry: false,
      };
    }
  }

  return {
    type: AIErrorType.API_ERROR,
    message: '알 수 없는 오류가 발생했습니다.',
    retry: true,
  };
}
