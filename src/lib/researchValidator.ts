/**
 * 역사물 교차검증 시스템
 *
 * 역사적 사실을 3개 이상의 공신력 있는 출처에서 검증합니다.
 * 집필 시 자동으로 역사적 자료를 수집하고 교차 분석합니다.
 */

import { generateJSON, generateText } from './gemini';
import { GeminiModel } from '@/types';

// 공신력 있는 역사 자료 출처 목록
export const CREDIBLE_SOURCES = {
  korean: [
    { name: '국사편찬위원회', category: 'official', reliability: 10 },
    { name: '한국학중앙연구원', category: 'academic', reliability: 10 },
    { name: '한국민족문화대백과사전', category: 'encyclopedia', reliability: 9 },
    { name: '조선왕조실록', category: 'primary', reliability: 10 },
    { name: '승정원일기', category: 'primary', reliability: 10 },
    { name: '삼국사기', category: 'primary', reliability: 9 },
    { name: '삼국유사', category: 'primary', reliability: 8 },
    { name: '고려사', category: 'primary', reliability: 9 },
    { name: '국립중앙박물관', category: 'museum', reliability: 9 },
    { name: '규장각한국학연구원', category: 'academic', reliability: 10 },
  ],
  chinese: [
    { name: '二十四史', category: 'primary', reliability: 9 },
    { name: '资治通鉴', category: 'primary', reliability: 9 },
    { name: '中国历史档案馆', category: 'official', reliability: 10 },
  ],
  japanese: [
    { name: '日本書紀', category: 'primary', reliability: 8 },
    { name: '国立国会図書館', category: 'official', reliability: 9 },
  ],
  western: [
    { name: 'JSTOR', category: 'academic', reliability: 9 },
    { name: 'Oxford Academic', category: 'academic', reliability: 9 },
    { name: 'Cambridge Core', category: 'academic', reliability: 9 },
  ],
} as const;

// 역사적 사실 검증 결과
export interface HistoricalFactCheck {
  query: string; // 검증 대상
  verified: boolean; // 검증 성공 여부
  confidence: number; // 신뢰도 (0-100)
  sources: VerifiedSource[]; // 검증된 출처들
  consensus: string; // 출처들의 공통 의견
  discrepancies: string[]; // 출처 간 불일치
  recommendation: string; // 집필 권장 사항
  warnings: string[]; // 주의사항
}

// 검증된 출처
export interface VerifiedSource {
  name: string;
  category: 'primary' | 'academic' | 'official' | 'encyclopedia' | 'museum';
  reliability: number;
  finding: string; // 해당 출처의 발견 내용
  citation: string; // 인용 정보
  agrees: boolean; // 다른 출처와 일치 여부
}

// 역사 연구 컨텍스트
export interface HistoricalResearchContext {
  projectId: string;
  era: string; // 시대 (예: '조선 중기', '삼국시대')
  period: string; // 세부 기간 (예: '1592-1598')
  region: string; // 지역
  verifiedFacts: HistoricalFactCheck[];
  unresolvedQueries: string[];
  lastUpdated: Date;
}

// ResearchSummary는 HistoricalResearchContext의 별칭 (promptGenerator 호환용)
export type ResearchSummary = HistoricalResearchContext;

// 역사적 사실 검증 요청
export interface FactCheckRequest {
  query: string;
  era?: string;
  context?: string;
  requiredSources?: number; // 최소 필요 출처 수 (기본 3)
}

/**
 * 역사적 사실을 교차 검증합니다.
 * 최소 3개 이상의 공신력 있는 출처에서 정보를 수집하고 비교합니다.
 */
export async function verifyHistoricalFact(
  apiKey: string,
  request: FactCheckRequest,
  model: GeminiModel = 'gemini-3-flash-preview'
): Promise<HistoricalFactCheck> {
  const requiredSources = request.requiredSources || 3;

  const prompt = `당신은 역사학 박사이자 사료 검증 전문가입니다.
다음 역사적 사실에 대해 ${requiredSources}개 이상의 공신력 있는 출처를 바탕으로 검증해주세요.

## 검증 대상
"${request.query}"

${request.era ? `## 시대: ${request.era}` : ''}
${request.context ? `## 맥락: ${request.context}` : ''}

## 검증 원칙
1. 1차 사료(실록, 일기, 비문 등)를 우선시
2. 학술 논문 및 학회지 참조
3. 국가기관 자료 활용
4. 최소 ${requiredSources}개 출처 확보
5. 출처 간 불일치 명확히 기록

## 신뢰할 수 있는 출처 예시
- 조선왕조실록, 승정원일기, 삼국사기 (1차 사료)
- 국사편찬위원회, 한국학중앙연구원 (국가기관)
- 한국민족문화대백과사전 (백과사전)
- 규장각한국학연구원 (학술기관)

## 응답 형식 (JSON)
{
  "verified": true/false,
  "confidence": 0-100,
  "sources": [
    {
      "name": "출처명",
      "category": "primary/academic/official/encyclopedia/museum",
      "reliability": 1-10,
      "finding": "해당 출처에서 발견한 내용",
      "citation": "구체적 인용 정보 (권, 호, 년도 등)",
      "agrees": true/false
    }
  ],
  "consensus": "출처들의 공통된 의견/사실",
  "discrepancies": ["출처 간 불일치 사항"],
  "recommendation": "소설 집필 시 이 사실을 어떻게 활용할지 권장사항",
  "warnings": ["주의해야 할 점, 논쟁이 있는 부분"]
}

반드시 ${requiredSources}개 이상의 출처를 포함하고, 출처 간 일치 여부를 정확히 평가해주세요.
JSON만 출력하세요.`;

  try {
    const result = await generateJSON<Omit<HistoricalFactCheck, 'query'>>(apiKey, prompt, {
      model,
      temperature: 0.3, // 사실 검증은 낮은 temperature
    });

    return {
      ...result,
      query: request.query,
    };
  } catch (error) {
    console.error('[ResearchValidator] 역사 검증 실패:', error);
    return {
      query: request.query,
      verified: false,
      confidence: 0,
      sources: [],
      consensus: '',
      discrepancies: [],
      recommendation: '검증에 실패했습니다. 다시 시도해주세요.',
      warnings: ['자동 검증 실패 - 수동 확인 필요'],
    };
  }
}

/**
 * 여러 역사적 사실을 일괄 검증합니다.
 */
export async function verifyMultipleFacts(
  apiKey: string,
  queries: string[],
  era: string,
  model: GeminiModel = 'gemini-3-flash-preview'
): Promise<HistoricalFactCheck[]> {
  const results: HistoricalFactCheck[] = [];

  for (const query of queries) {
    const result = await verifyHistoricalFact(apiKey, { query, era }, model);
    results.push(result);

    // Rate limit 방지
    await new Promise(resolve => setTimeout(resolve, 1500));
  }

  return results;
}

/**
 * 소설 텍스트에서 역사적 사실을 추출하고 검증합니다.
 */
export async function extractAndVerifyHistoricalFacts(
  apiKey: string,
  text: string,
  era: string,
  model: GeminiModel = 'gemini-3-flash-preview'
): Promise<{
  extractedFacts: string[];
  verificationResults: HistoricalFactCheck[];
  overallAccuracy: number;
  criticalIssues: string[];
}> {
  // 1단계: 텍스트에서 역사적 사실 추출
  const extractPrompt = `당신은 역사학 전문가입니다.
다음 소설 텍스트에서 역사적으로 검증이 필요한 사실들을 추출해주세요.

## 시대 배경: ${era}

## 텍스트
${text.slice(0, 10000)}

## 추출 대상
1. 역사적 인물의 이름, 직책, 행적
2. 역사적 사건의 날짜, 장소, 경과
3. 당시의 제도, 관습, 문화
4. 지명, 건물명, 조직명
5. 기술, 무기, 의복, 음식 등 시대적 요소

## 응답 형식 (JSON)
{
  "facts": [
    "검증이 필요한 역사적 사실 1",
    "검증이 필요한 역사적 사실 2",
    ...
  ],
  "potentialIssues": [
    "명백히 틀린 것으로 보이는 사항"
  ]
}

JSON만 출력하세요.`;

  try {
    const extraction = await generateJSON<{
      facts: string[];
      potentialIssues: string[];
    }>(apiKey, extractPrompt, { model, temperature: 0.3 });

    // 2단계: 각 사실 검증 (최대 10개까지)
    const factsToVerify = extraction.facts.slice(0, 10);
    const verificationResults = await verifyMultipleFacts(
      apiKey,
      factsToVerify,
      era,
      model
    );

    // 3단계: 전체 정확도 계산
    const verifiedCount = verificationResults.filter(r => r.verified).length;
    const overallAccuracy = (verifiedCount / verificationResults.length) * 100;

    // 4단계: 심각한 문제 수집
    const criticalIssues = [
      ...extraction.potentialIssues,
      ...verificationResults
        .filter(r => !r.verified && r.confidence < 30)
        .map(r => `"${r.query}" - ${r.warnings.join(', ')}`),
    ];

    return {
      extractedFacts: extraction.facts,
      verificationResults,
      overallAccuracy,
      criticalIssues,
    };
  } catch (error) {
    console.error('[ResearchValidator] 추출 및 검증 실패:', error);
    return {
      extractedFacts: [],
      verificationResults: [],
      overallAccuracy: 0,
      criticalIssues: ['자동 검증 실패'],
    };
  }
}

/**
 * 역사물 집필을 위한 사전 리서치를 수행합니다.
 * 시대, 인물, 사건에 대한 종합적인 정보를 수집합니다.
 */
export async function conductHistoricalResearch(
  apiKey: string,
  topic: string,
  era: string,
  aspects: ('인물' | '사건' | '제도' | '문화' | '지리' | '군사' | '경제')[],
  model: GeminiModel = 'gemini-3-flash-preview'
): Promise<{
  research: Record<string, string>;
  sources: VerifiedSource[];
  writingGuidelines: string[];
  commonMistakes: string[];
}> {
  const prompt = `당신은 역사학 박사이자 역사 소설 자문 전문가입니다.
다음 주제에 대해 소설 집필에 필요한 종합적인 리서치를 수행해주세요.

## 주제: ${topic}
## 시대: ${era}
## 조사 항목: ${aspects.join(', ')}

## 리서치 원칙
1. 모든 정보는 공신력 있는 출처 기반
2. 1차 사료 우선 (실록, 문집, 비문 등)
3. 학술 연구 결과 반영
4. 소설적 활용 가능성 고려

## 응답 형식 (JSON)
{
  "research": {
    "인물": "관련 인물들의 상세 정보 (이름, 직책, 성격, 관계, 일화 등)",
    "사건": "주요 사건의 전개 과정, 날짜, 장소, 결과",
    "제도": "당시의 관직, 법률, 사회 제도",
    "문화": "풍속, 예절, 의복, 음식, 주거",
    "지리": "지명, 위치, 지형, 이동 경로",
    "군사": "군제, 무기, 전술, 훈련",
    "경제": "화폐, 상업, 농업, 세금"
  },
  "sources": [
    {
      "name": "출처명",
      "category": "primary/academic/official",
      "reliability": 1-10,
      "finding": "핵심 발견 내용",
      "citation": "인용 정보",
      "agrees": true
    }
  ],
  "writingGuidelines": [
    "소설 집필 시 유의사항 1",
    "소설 집필 시 유의사항 2"
  ],
  "commonMistakes": [
    "흔히 저지르는 역사적 오류 1",
    "흔히 저지르는 역사적 오류 2"
  ]
}

각 항목에 대해 충분히 상세하게 작성하고, 최소 5개 이상의 출처를 포함해주세요.
JSON만 출력하세요.`;

  try {
    const result = await generateJSON<{
      research: Record<string, string>;
      sources: VerifiedSource[];
      writingGuidelines: string[];
      commonMistakes: string[];
    }>(apiKey, prompt, {
      model,
      temperature: 0.4,
      maxTokens: 16000,
    });

    return result;
  } catch (error) {
    console.error('[ResearchValidator] 리서치 실패:', error);
    return {
      research: {},
      sources: [],
      writingGuidelines: ['리서치 실패 - 수동 조사 필요'],
      commonMistakes: [],
    };
  }
}

/**
 * 집필 중 실시간으로 역사적 사실을 확인합니다.
 */
export async function quickFactCheck(
  apiKey: string,
  question: string,
  era: string,
  model: GeminiModel = 'gemini-3-flash-preview'
): Promise<{
  answer: string;
  confidence: number;
  sources: string[];
  warning?: string;
}> {
  const prompt = `당신은 역사학 전문가입니다.
다음 질문에 대해 역사적 사실에 기반하여 간결하게 답변해주세요.

## 질문: ${question}
## 시대 배경: ${era}

## 응답 형식 (JSON)
{
  "answer": "간결하고 정확한 답변",
  "confidence": 0-100,
  "sources": ["출처1", "출처2", "출처3"],
  "warning": "논쟁이 있거나 불확실한 경우 경고 메시지"
}

최소 2개 이상의 출처를 명시하고, 확실하지 않은 경우 warning을 포함해주세요.
JSON만 출력하세요.`;

  try {
    return await generateJSON<{
      answer: string;
      confidence: number;
      sources: string[];
      warning?: string;
    }>(apiKey, prompt, {
      model,
      temperature: 0.3,
    });
  } catch (error) {
    console.error('[ResearchValidator] 빠른 확인 실패:', error);
    return {
      answer: '확인 실패',
      confidence: 0,
      sources: [],
      warning: '자동 확인 실패 - 수동 조사 필요',
    };
  }
}

/**
 * 역사 연구 컨텍스트를 생성합니다.
 */
export function createResearchContext(
  projectId: string,
  era: string,
  period: string,
  region: string
): HistoricalResearchContext {
  return {
    projectId,
    era,
    period,
    region,
    verifiedFacts: [],
    unresolvedQueries: [],
    lastUpdated: new Date(),
  };
}

/**
 * 역사 검증 결과를 프롬프트에 포함할 형식으로 변환합니다.
 */
export function generateResearchSummaryForPrompt(
  context: HistoricalResearchContext
): string {
  if (context.verifiedFacts.length === 0) {
    return '';
  }

  let summary = `\n## 🏛️ 역사적 사실 검증 결과 (교차검증 완료)\n\n`;
  summary += `시대: ${context.era} (${context.period})\n`;
  summary += `지역: ${context.region}\n\n`;

  summary += `### ✅ 검증된 사실 (반드시 준수)\n`;
  for (const fact of context.verifiedFacts.filter(f => f.verified)) {
    summary += `- ${fact.query}\n`;
    summary += `  → ${fact.consensus}\n`;
    summary += `  [신뢰도: ${fact.confidence}%, 출처 ${fact.sources.length}개]\n`;
  }

  const unverified = context.verifiedFacts.filter(f => !f.verified);
  if (unverified.length > 0) {
    summary += `\n### ⚠️ 주의 필요 사항\n`;
    for (const fact of unverified) {
      summary += `- ${fact.query}: ${fact.warnings.join(', ')}\n`;
    }
  }

  if (context.unresolvedQueries.length > 0) {
    summary += `\n### ❓ 미확인 사항 (창작적 해석 가능)\n`;
    for (const query of context.unresolvedQueries) {
      summary += `- ${query}\n`;
    }
  }

  return summary;
}
