/**
 * Quality Validator - 한국어 소설 출판 품질 평가 시스템
 *
 * 한국어 소설 원고를 전문 출판 기준으로 평가:
 * - 문장 품질 및 문체 일관성
 * - 서사 구조 및 페이싱
 * - 캐릭터 개발
 * - 대화 자연스러움
 * - Show vs Tell 균형
 * - 종결어미 다양성
 * - 존칭/호칭 일관성
 * - 클리셰 및 반복 표현 감지
 * - 의성어/의태어 활용도
 */

export type QualityGrade = 'S' | 'A' | 'B' | 'C' | 'D' | 'F';

export interface QualityScore {
  overall: number; // 0-100
  grade: QualityGrade;
  categories: CategoryScores;
  publishingReadiness: PublishingReadiness;
  detailedAnalysis: DetailedAnalysis;
  recommendations: QualityRecommendation[];
}

export interface CategoryScores {
  prose: number;
  structure: number;
  characterization: number;
  dialogue: number;
  pacing: number;
  worldBuilding: number;
  emotionalImpact: number;
  originality: number;
  technicalQuality: number;
  marketability: number;
}

export interface PublishingReadiness {
  ready: boolean;
  tier: 'traditional' | 'indie' | 'self_publish' | 'needs_work';
  blockers: string[];
  strengths: string[];
  estimatedRevisionRounds: number;
}

export interface DetailedAnalysis {
  proseAnalysis: ProseAnalysis;
  structureAnalysis: StructureAnalysis;
  characterAnalysis: CharacterAnalysis;
  dialogueAnalysis: DialogueAnalysis;
  showVsTell: ShowVsTellAnalysis;
  technicalIssues: TechnicalIssue[];
}

export interface ProseAnalysis {
  readabilityScore: number;
  sentenceVariety: number;
  wordChoiceQuality: number;
  rhythmAndFlow: number;
  voiceConsistency: number;
  purpleProse: number; // Lower is better
  issues: ProseIssue[];
}

export interface ProseIssue {
  type: 'weak_verb' | 'adverb_overuse' | 'passive_voice' | 'purple_prose' | 'repetition' | 'awkward_phrasing';
  location: string;
  example: string;
  suggestion: string;
}

export interface StructureAnalysis {
  threeActStructure: boolean;
  incitingIncident: boolean;
  risingAction: boolean;
  climax: boolean;
  resolution: boolean;
  subplotIntegration: number;
  pacingBalance: number;
  chapterStructure: number;
}

export interface CharacterAnalysis {
  protagonistDepth: number;
  antagonistDepth: number;
  supportingCastQuality: number;
  characterArcs: number;
  motivationClarity: number;
  distinctVoices: number;
  characterConsistency: number;
}

export interface DialogueAnalysis {
  naturalness: number;
  subtext: number;
  characterVoiceDistinction: number;
  purposefulness: number;
  tagVariety: number;
  expositionInDialogue: number; // Lower is better
  issues: DialogueIssue[];
}

export interface DialogueIssue {
  type: 'info_dump' | 'unnatural' | 'same_voice' | 'excessive_tags' | 'said_bookism';
  example: string;
  suggestion: string;
}

export interface ShowVsTellAnalysis {
  ratio: number; // Higher means more showing
  tellingInstances: TellingInstance[];
  effectiveShowing: string[];
}

export interface TellingInstance {
  text: string;
  emotion: string;
  suggestion: string;
}

export interface TechnicalIssue {
  type: 'grammar' | 'punctuation' | 'formatting' | 'continuity' | 'timeline';
  severity: 'minor' | 'moderate' | 'major';
  description: string;
  location?: string;
}

export interface QualityRecommendation {
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: keyof CategoryScores;
  issue: string;
  recommendation: string;
  impact: string;
}

// ============================================================================
// 한국어 분석 패턴
// ============================================================================

// 등급 기준 점수
const GRADE_THRESHOLDS: Record<QualityGrade, number> = {
  'S': 95,
  'A': 85,
  'B': 75,
  'C': 65,
  'D': 50,
  'F': 0
};

// 한국어 약한 표현 (무기력한 서술)
const KOREAN_WEAK_EXPRESSIONS = [
  '있었다', '없었다', '했다', '되었다', '것이다', '것이었다',
  '수 있었다', '수 없었다', '듯했다', '모양이었다',
  '하였다', '되어 있었다', '인 것 같았다', '는 것이었다',
  '뿐이었다', '따름이었다', '셈이었다',
];

// 한국어 감정 직접 서술 패턴 (Show Don't Tell 위반)
const KOREAN_TELLING_PATTERNS = [
  '슬펐다', '기뻤다', '화가 났다', '두려웠다', '행복했다',
  '불안했다', '초조했다', '외로웠다', '분노했다', '절망했다',
  '감동했다', '놀랐다', '당황했다', '부끄러웠다', '허탈했다',
  '슬픔을 느꼈다', '기쁨을 느꼈다', '분노를 느꼈다',
  '두려움을 느꼈다', '행복을 느꼈다', '불안을 느꼈다',
  '초조함을 느꼈다', '외로움을 느꼈다', '절망을 느꼈다',
  '감동을 받았다', '놀라움을 느꼈다', '수치심을 느꼈다',
];

// 한국어 대화 태그 - 과도한 변형 (said bookism)
const KOREAN_SAID_BOOKISMS = [
  '외쳤다', '소리쳤다', '중얼거렸다', '속삭였다', '울부짖었다',
  '내뱉었다', '토해냈다', '읊조렸다', '부르짖었다', '악을 썼다',
  '으르렁거렸다', '버럭 소리쳤다', '날카롭게 말했다',
  '차갑게 내뱉었다', '이를 갈며 말했다', '씹어 뱉듯 말했다',
];

// 기본 대화 태그 (자연스러운 것들)
const KOREAN_BASIC_TAGS = [
  '말했다', '대답했다', '물었다', '답했다', '이야기했다',
];

// 한국어 클리셰 표현
const KOREAN_CLICHES = [
  '심장이 두근거렸다', '눈물이 흘러내렸다', '주먹을 불끈 쥐었다',
  '한숨을 내쉬었다', '눈앞이 캄캄했다', '머릿속이 하얘졌다',
  '가슴이 먹먹했다', '온몸이 굳었다', '시간이 멈춘 것 같았다',
  '머리를 한 대 맞은 것 같았다', '가슴이 철렁했다',
  '눈물을 삼켰다', '이를 악물었다', '온몸에 소름이 돋았다',
  '숨이 막혔다', '가슴이 미어지는 것 같았다',
  '다리에 힘이 풀렸다', '입술을 깨물었다', '눈시울이 붉어졌다',
  '목이 메었다', '가슴이 찢어지는 것 같았다',
  '세상이 무너지는 것 같았다', '머리가 멍해졌다',
  '심장이 쿵 내려앉았다', '피가 거꾸로 솟는 것 같았다',
  '온몸의 털이 곤두섰다', '등골이 서늘해졌다',
];

// 한국어 과잉 수식 표현 (purple prose)
const KOREAN_PURPLE_PROSE = [
  '너무나도', '정말로', '진정으로', '참으로', '실로',
  '매우 매우', '극도로', '대단히', '엄청나게', '무척이나',
  '형언할 수 없는', '이루 말할 수 없는', '필설로 다할 수 없는',
  '차마 눈뜨고 볼 수 없는', '세상 그 무엇과도 비할 수 없는',
];

// 한국어 긴장감 표현
const KOREAN_TENSION_WORDS = [
  '위험', '공포', '위협', '갈등', '투쟁', '절박', '긴급', '위기',
  '싸움', '탈출', '죽음', '살인', '공격', '추격', '대결', '전투',
  '폭발', '도주', '비명', '혈투', '함정', '배신', '습격', '위기일발',
  '필사적', '처절', '살벌', '아수라장',
];

// 한국어 구조 감지 - 사건 발단
const KOREAN_INCITING_INDICATORS = [
  '모든 것이 바뀌었다', '그때부터', '그날', '갑자기', '예상치 못한',
  '발견했다', '알게 되었다', '도착했다', '나타났다', '시작되었다',
  '그것이 시작이었다', '운명이 바뀌', '전환점', '그 순간',
  '뜻밖의', '첫 만남', '사건이 벌어', '일이 터졌다',
];

// 한국어 구조 감지 - 클라이맥스
const KOREAN_CLIMAX_INDICATORS = [
  '마침내', '드디어', '그 순간', '지금이 아니면', '최후의',
  '맞서다', '대면하다', '결전', '결투', '진실이 밝혀',
  '모든 것이', '마지막', '결말', '최종', '운명의',
  '돌이킬 수 없', '승부', '각오', '결심',
];

// 한국어 구조 감지 - 결말
const KOREAN_RESOLUTION_INDICATORS = [
  '그 후', '마침내', '평화', '집으로', '함께',
  '새로운 시작', '떠났다', '배웠다', '이해했다', '깨달았다',
  '돌아왔다', '용서했다', '받아들였다', '안식', '마무리',
];

// 한국어 세계관 관련 키워드
const KOREAN_WORLD_INDICATORS = [
  '세계', '왕국', '도시', '마을', '숲', '산', '바다',
  '마법', '기술', '문화', '전통', '역사', '사회', '백성',
  '관습', '법', '규율', '종족', '제국', '문명', '신전',
  '궁전', '성', '대륙', '영토', '풍습',
];

// 한국어 감정 키워드
const KOREAN_EMOTION_WORDS = [
  '사랑', '증오', '공포', '기쁨', '슬픔', '비탄',
  '희망', '절망', '분노', '평화', '열정', '그리움',
  '배신', '희생', '구원', '상실', '승리', '고독',
  '용서', '원한', '감사', '후회', '동경', '질투',
  '연민', '경외', '환희',
];

// 한국어 내면 묘사 키워드
const KOREAN_INTERNAL_INDICATORS = [
  '생각했다', '느꼈다', '떠올렸다', '알고 있었다', '믿었다',
  '두려워했다', '바랐다', '회상했다', '고민했다', '결심했다',
  '직감했다', '예감했다', '확신했다', '의심했다', '후회했다',
  '마음속으로', '속으로', '내면에서', '가슴 깊이',
];

// 한국어 동기 부여 키워드
const KOREAN_MOTIVATION_INDICATORS = [
  '원했다', '필요했다', '해야만 했다', '목표', '사명',
  '결의', '소망', '야망', '집착', '갈망', '열망',
  '반드시', '기어코', '꼭', '어떻게든',
];

// 한국어 캐릭터 성장 지표
const KOREAN_ARC_INDICATORS = [
  '변했다', '배웠다', '깨달았다', '이해했다', '성장했다',
  '달라졌다', '되었다', '더 이상', '마침내', '이제는',
  '전과 다르게', '예전의', '새로운', '극복했다', '받아들였다',
];

// 한국어 의성어/의태어 패턴
const KOREAN_ONOMATOPOEIA_PATTERNS = [
  // 의성어
  /[가-힣]{1,2}[가-힣]{1,2}(?:거리|대)/g,  // ~거리다/~대다 형태
  /쿵|쾅|탕|팡|뻥|찰칵|달그락|철커덕/g,
  /후드득|바스락|사각사각|촤르르|콸콸|졸졸|찰랑/g,
  /딸깍|삐걱|끼릭|삐익|윙윙|쏴아|우르르/g,
  // 의태어
  /살금살금|슬금슬금|어슬렁|비틀비틀|뒤뚱뒤뚱/g,
  /반짝반짝|번쩍번쩍|아른아른|일렁일렁/g,
  /후들후들|벌벌|덜덜|와들와들|부들부들/g,
  /살살|스르르|스윽|살며시|소복소복/g,
  /두근두근|쿵쿵|콩닥콩닥|벅차|울컥/g,
];

// 한국어 대화 설명 과잉 패턴 (info dump)
const KOREAN_INFO_DUMP_PATTERNS = [
  /[""][^""]*알다시피[^""]*[""]/g,
  /[""][^""]*설명하자면[^""]*[""]/g,
  /[""][^""]*아시다시피[^""]*[""]/g,
  /[""][^""]*기억하[시지겠]?[^""]*[""]/g,
  /[""][^""]*사실은[^""]{40,}[""]/g, // 40자 이상 긴 설명 대사
  /[""][^""]*원래는[^""]{40,}[""]/g,
];

// ============================================================================
// 한국어 유틸리티 함수
// ============================================================================

/** 한국어 문장 분리 (마침표, 느낌표, 물음표 기준 + 줄바꿈) */
function splitKoreanSentences(content: string): string[] {
  return content
    .split(/(?<=[.!?。])\s*|\n+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

/** 한국어 문자 수 (공백 제외) */
function countKoreanChars(text: string): number {
  return text.replace(/\s/g, '').length;
}

/** 한국어 문단 분리 */
function splitParagraphs(content: string): string[] {
  return content.split(/\n\n+/).filter(p => p.trim().length > 0);
}

/** 한국어 대화문 추출 (큰따옴표, 겹따옴표) */
function extractDialogues(content: string): string[] {
  const doubleQuote = content.match(/[""][^""]+[""]/g) || [];
  const singleQuote = content.match(/[''][^'']+['']/g) || [];
  return [...doubleQuote, ...singleQuote];
}

/** 종결어미 추출 */
function extractSentenceEndings(sentences: string[]): string[] {
  return sentences
    .map(s => {
      const trimmed = s.replace(/[.!?。\s]+$/, '');
      // 마지막 2-4글자를 종결어미로 간주
      if (trimmed.length >= 4) return trimmed.slice(-4);
      if (trimmed.length >= 2) return trimmed.slice(-2);
      return trimmed;
    })
    .filter(e => e.length > 0);
}

/** 패턴 매칭 카운트 */
function countPatternMatches(content: string, patterns: string[]): number {
  let count = 0;
  for (const pattern of patterns) {
    const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'g');
    const matches = content.match(regex);
    if (matches) count += matches.length;
  }
  return count;
}

/** 패턴별 매칭 결과 */
function findPatternMatches(content: string, patterns: string[]): Map<string, number> {
  const results = new Map<string, number>();
  for (const pattern of patterns) {
    const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'g');
    const matches = content.match(regex);
    if (matches && matches.length > 0) {
      results.set(pattern, matches.length);
    }
  }
  return results;
}

// ============================================================================
// 종결어미 다양성 분석
// ============================================================================

interface EndingVarietyResult {
  score: number;
  repeatedEndings: string[];
}

function analyzeEndingVariety(content: string): EndingVarietyResult {
  const sentences = splitKoreanSentences(content);
  const repeatedEndings: string[] = [];

  // 과거형 종결어미 패턴
  const pastEndings = ['했다', '였다', '었다', '았다', '렸다', '겼다', '셨다'];
  const presentEndings = ['한다', '는다', 'ㄴ다', '인다', '된다'];

  let consecutivePastCount = 0;
  let maxConsecutivePast = 0;
  let pastTotal = 0;
  let presentTotal = 0;

  for (const sentence of sentences) {
    const trimmed = sentence.replace(/[.!?。\s]+$/, '');
    const isPast = pastEndings.some(e => trimmed.endsWith(e));
    const isPresent = presentEndings.some(e => trimmed.endsWith(e));

    if (isPast) {
      pastTotal++;
      consecutivePastCount++;
      if (consecutivePastCount >= 3) {
        const ending = pastEndings.find(e => trimmed.endsWith(e)) || '과거형';
        if (!repeatedEndings.includes(ending)) {
          repeatedEndings.push(ending);
        }
      }
      maxConsecutivePast = Math.max(maxConsecutivePast, consecutivePastCount);
    } else {
      consecutivePastCount = 0;
    }

    if (isPresent) {
      presentTotal++;
    }
  }

  // 같은 종결어미 연속 3문장 이상이면 감점
  let score = 100;
  if (maxConsecutivePast >= 5) score -= 30;
  else if (maxConsecutivePast >= 4) score -= 20;
  else if (maxConsecutivePast >= 3) score -= 10;

  // 과거형:현재형 비율 - 너무 한쪽으로 치우치면 감점
  const total = pastTotal + presentTotal;
  if (total > 0) {
    const pastRatio = pastTotal / total;
    if (pastRatio > 0.95) score -= 15; // 거의 전부 과거형
    else if (pastRatio > 0.9) score -= 10;
  }

  return { score: Math.max(0, score), repeatedEndings };
}

// ============================================================================
// 존칭/호칭 일관성 분석
// ============================================================================

interface HonorificConsistencyResult {
  consistent: boolean;
  issues: string[];
}

function analyzeHonorificConsistency(content: string): HonorificConsistencyResult {
  const issues: string[] = [];

  // 높임말 패턴
  const honorificPatterns = [
    /요\./g, /요\?/g, /요!/g,
    /습니다/g, /습니까/g, /십시오/g,
    /세요/g, /셨/g, /시죠/g,
  ];

  // 반말 패턴
  const casualPatterns = [
    /[^요]다\./g, /었다\./g, /았다\./g,
    /지\?/g, /나\?/g, /냐\?/g,
    /해라/g, /하자/g, /거야/g,
  ];

  // 대화문 내부에서 같은 문단에 높임과 반말이 혼재하는지 확인
  const paragraphs = splitParagraphs(content);
  let mixedCount = 0;

  for (const para of paragraphs) {
    // 대화문만 검사 (서술 부분은 반말 체가 정상)
    const dialogues = extractDialogues(para);
    for (const dialogue of dialogues) {
      let hasHonorific = false;
      let hasCasual = false;

      for (const pattern of honorificPatterns) {
        if (pattern.test(dialogue)) {
          hasHonorific = true;
          pattern.lastIndex = 0;
        }
      }
      for (const pattern of casualPatterns) {
        if (pattern.test(dialogue)) {
          hasCasual = true;
          pattern.lastIndex = 0;
        }
      }

      if (hasHonorific && hasCasual) {
        mixedCount++;
        if (mixedCount <= 3) {
          const sample = dialogue.length > 50 ? dialogue.slice(0, 50) + '...' : dialogue;
          issues.push(`대화문 내 높임말/반말 혼용: ${sample}`);
        }
      }
    }
  }

  if (mixedCount > 3) {
    issues.push(`총 ${mixedCount}건의 높임말/반말 혼용이 발견되었습니다.`);
  }

  return {
    consistent: mixedCount === 0,
    issues
  };
}

// ============================================================================
// 반복 표현 감지
// ============================================================================

interface RepetitionResult {
  repeatedWords: Map<string, number>;
  repeatedPatterns: string[];
  score: number;
}

function detectRepetition(content: string): RepetitionResult {
  const paragraphs = splitParagraphs(content);
  const repeatedWords = new Map<string, number>();
  const repeatedPatterns: string[] = [];

  // 문단별 단어 반복 검사
  for (const para of paragraphs) {
    // 2글자 이상 단어 추출 (조사 제외를 위해 명사/동사 추정)
    const words = para.match(/[가-힣]{2,}/g) || [];
    const wordCounts = new Map<string, number>();

    for (const word of words) {
      // 일반적인 조사/어미는 제외
      if (word.length <= 2) continue;
      const count = (wordCounts.get(word) || 0) + 1;
      wordCounts.set(word, count);
    }

    // 한 문단에서 3회 이상 반복된 단어
    for (const [word, count] of Array.from(wordCounts.entries())) {
      if (count >= 3) {
        const existing = repeatedWords.get(word) || 0;
        repeatedWords.set(word, existing + count);
      }
    }
  }

  // 문장 구조 반복 감지 ("~하며 ~했다", "~고 ~했다" 등)
  const sentences = splitKoreanSentences(content);
  const structurePatterns = new Map<string, number>();

  for (const sentence of sentences) {
    // 문장 끝 패턴 추출 (마지막 6-8자)
    const trimmed = sentence.replace(/[.!?。\s]+$/, '');
    if (trimmed.length >= 6) {
      const ending = trimmed.slice(-6);
      const count = (structurePatterns.get(ending) || 0) + 1;
      structurePatterns.set(ending, count);
    }
  }

  // 연속된 문장에서 동일 구조 패턴
  for (let i = 0; i < sentences.length - 2; i++) {
    const endings = [sentences[i], sentences[i + 1], sentences[i + 2]]
      .map(s => s.replace(/[.!?。\s]+$/, ''))
      .map(s => s.length >= 4 ? s.slice(-4) : s);

    if (endings[0] === endings[1] && endings[1] === endings[2]) {
      const pattern = `연속 동일 종결: "...${endings[0]}" (${i + 1}-${i + 3}번째 문장)`;
      if (!repeatedPatterns.includes(pattern)) {
        repeatedPatterns.push(pattern);
      }
    }
  }

  // 점수 계산
  let score = 100;
  score -= repeatedWords.size * 3;
  score -= repeatedPatterns.length * 5;

  return {
    repeatedWords,
    repeatedPatterns,
    score: Math.max(0, Math.min(100, score))
  };
}

// ============================================================================
// 의성어/의태어 활용도 분석
// ============================================================================

interface OnomatopoeiaResult {
  count: number;
  density: number; // 1000자당 빈도
  assessment: 'insufficient' | 'balanced' | 'excessive';
  score: number;
}

function analyzeOnomatopoeia(content: string): OnomatopoeiaResult {
  let totalCount = 0;

  for (const pattern of KOREAN_ONOMATOPOEIA_PATTERNS) {
    const matches = content.match(pattern);
    if (matches) totalCount += matches.length;
  }

  // 1000자당 밀도 계산
  const charCount = countKoreanChars(content);
  const density = charCount > 0 ? (totalCount / charCount) * 1000 : 0;

  let assessment: 'insufficient' | 'balanced' | 'excessive';
  let score: number;

  if (density < 0.5) {
    assessment = 'insufficient';
    score = 60; // 너무 건조함
  } else if (density > 5) {
    assessment = 'excessive';
    score = 50; // 너무 과다하여 유치함
  } else {
    assessment = 'balanced';
    score = 80 + Math.min(20, density * 5); // 적절한 범위
  }

  return { count: totalCount, density, assessment, score };
}

// ============================================================================
// QualityValidator 클래스
// ============================================================================

export class QualityValidator {
  /**
   * 종합 품질 검증 수행
   */
  validateQuality(
    content: string,
    metadata?: {
      genre?: string;
      targetAudience?: string;
      chapterCount?: number;
    }
  ): QualityScore {
    // 모든 분석 수행
    const proseAnalysis = this.analyzeProseQuality(content);
    const structureAnalysis = this.analyzeStructure(content);
    const characterAnalysis = this.analyzeCharacters(content);
    const dialogueAnalysis = this.analyzeDialogue(content);
    const showVsTell = this.analyzeShowVsTell(content);
    const technicalIssues = this.findTechnicalIssues(content);

    // 카테고리별 점수 산출
    const categories: CategoryScores = {
      prose: this.calculateProseScore(proseAnalysis),
      structure: this.calculateStructureScore(structureAnalysis),
      characterization: this.calculateCharacterScore(characterAnalysis),
      dialogue: this.calculateDialogueScore(dialogueAnalysis),
      pacing: structureAnalysis.pacingBalance,
      worldBuilding: this.assessWorldBuilding(content),
      emotionalImpact: this.assessEmotionalImpact(content),
      originality: this.assessOriginality(content),
      technicalQuality: this.calculateTechnicalScore(technicalIssues),
      marketability: this.assessMarketability(content, metadata)
    };

    // 종합 점수 산출
    const overall = this.calculateOverallScore(categories);
    const grade = this.determineGrade(overall);

    // 출판 준비도 평가
    const publishingReadiness = this.assessPublishingReadiness(categories, grade, technicalIssues);

    // 개선 권고사항 생성
    const recommendations = this.generateRecommendations(categories, {
      proseAnalysis,
      structureAnalysis,
      characterAnalysis,
      dialogueAnalysis,
      showVsTell,
      technicalIssues
    });

    return {
      overall,
      grade,
      categories,
      publishingReadiness,
      detailedAnalysis: {
        proseAnalysis,
        structureAnalysis,
        characterAnalysis,
        dialogueAnalysis,
        showVsTell,
        technicalIssues
      },
      recommendations
    };
  }

  /**
   * 문장 품질 분석 (한국어)
   */
  private analyzeProseQuality(content: string): ProseAnalysis {
    const sentences = splitKoreanSentences(content);
    const issues: ProseIssue[] = [];

    if (sentences.length === 0) {
      return {
        readabilityScore: 0,
        sentenceVariety: 0,
        wordChoiceQuality: 0,
        rhythmAndFlow: 0,
        voiceConsistency: 50,
        purpleProse: 0,
        issues: []
      };
    }

    // 문장 길이 다양성 분석 (한국어 글자 수 기준)
    const sentenceLengths = sentences.map(s => countKoreanChars(s));
    const avgLength = sentenceLengths.reduce((a, b) => a + b, 0) / sentences.length;
    const variance = sentenceLengths.reduce(
      (sum, len) => sum + Math.pow(len - avgLength, 2), 0
    ) / sentences.length;
    const sentenceVariety = Math.min(100, Math.sqrt(variance) * 5);

    // 약한 표현 검사
    const weakExprCount = countPatternMatches(content, KOREAN_WEAK_EXPRESSIONS);
    const weakRatio = weakExprCount / sentences.length;
    if (weakRatio > 0.15) {
      const foundPatterns = findPatternMatches(content, KOREAN_WEAK_EXPRESSIONS);
      const topPatterns = Array.from(foundPatterns.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([p]) => p);

      issues.push({
        type: 'weak_verb',
        location: '전체',
        example: topPatterns.join(', '),
        suggestion: '구체적이고 강한 서술 동사로 교체하세요. 예: "있었다" -> 구체적 동작/상태 서술'
      });
    }

    // 과잉 수식 검사 (purple prose)
    const purpleCount = countPatternMatches(content, KOREAN_PURPLE_PROSE);
    if (purpleCount > 3) {
      issues.push({
        type: 'purple_prose',
        location: '전체',
        example: KOREAN_PURPLE_PROSE.filter(p => content.includes(p)).slice(0, 3).join(', '),
        suggestion: '과도한 수식어를 줄이고 간결한 표현을 사용하세요'
      });
    }

    // 문장 길이 분석 (한국어 기준)
    const longSentences = sentenceLengths.filter(l => l > 80).length;
    const shortSentenceRuns = this.countConsecutiveShortSentences(sentenceLengths, 10);
    if (longSentences > sentences.length * 0.1) {
      issues.push({
        type: 'awkward_phrasing',
        location: '전체',
        example: `80자 이상 긴 문장 ${longSentences}개 발견`,
        suggestion: '긴 문장을 분리하여 가독성을 높이세요. 한국어 적정 문장 길이: 20-40자'
      });
    }
    if (shortSentenceRuns > 0) {
      issues.push({
        type: 'awkward_phrasing',
        location: '전체',
        example: `10자 미만 짧은 문장이 연속 5개 이상 ${shortSentenceRuns}건`,
        suggestion: '짧은 문장의 연속 사용은 리듬감을 해칩니다. 문장 길이를 다양하게 조절하세요'
      });
    }

    // 반복 표현 검사
    const repetition = detectRepetition(content);
    if (repetition.repeatedWords.size > 5) {
      const topRepeated = Array.from(repetition.repeatedWords.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([w, c]) => `${w}(${c}회)`);

      issues.push({
        type: 'repetition',
        location: '전체',
        example: topRepeated.join(', '),
        suggestion: '동의어나 다른 표현으로 대체하여 어휘의 다양성을 높이세요'
      });
    }
    if (repetition.repeatedPatterns.length > 0) {
      issues.push({
        type: 'repetition',
        location: '전체',
        example: repetition.repeatedPatterns.slice(0, 2).join('; '),
        suggestion: '문장 구조를 다양하게 변형하세요'
      });
    }

    // 종결어미 다양성
    const endingVariety = analyzeEndingVariety(content);

    // 가독성 점수 (한국어 기준: 평균 문장 길이 20-40자 적정)
    let readabilityScore = 80;
    if (avgLength < 10) readabilityScore -= 20;
    else if (avgLength < 20) readabilityScore -= 5;
    else if (avgLength > 60) readabilityScore -= 25;
    else if (avgLength > 40) readabilityScore -= 10;
    readabilityScore = Math.max(0, Math.min(100, readabilityScore));

    // 어휘 선택 품질
    const wordChoiceQuality = Math.max(0, 100 - weakRatio * 200 - purpleCount * 5);

    // 리듬감/흐름 (종결어미 다양성 + 문장 길이 다양성)
    const rhythmAndFlow = (sentenceVariety * 0.5 + endingVariety.score * 0.5);

    // 존칭 일관성
    const honorificResult = analyzeHonorificConsistency(content);
    const voiceConsistency = honorificResult.consistent ? 85 : Math.max(40, 85 - honorificResult.issues.length * 10);

    return {
      readabilityScore,
      sentenceVariety,
      wordChoiceQuality,
      rhythmAndFlow,
      voiceConsistency,
      purpleProse: purpleCount,
      issues
    };
  }

  /** 연속 짧은 문장 카운트 */
  private countConsecutiveShortSentences(lengths: number[], threshold: number): number {
    let count = 0;
    let consecutive = 0;

    for (const len of lengths) {
      if (len < threshold) {
        consecutive++;
        if (consecutive >= 5) count++;
      } else {
        consecutive = 0;
      }
    }

    return count;
  }

  /**
   * 서사 구조 분석 (한국어)
   */
  private analyzeStructure(content: string): StructureAnalysis {
    const paragraphs = splitParagraphs(content);
    const totalLength = content.length;

    // 구조적 요소 감지
    const hasIncitingIncident = this.detectIncitingIncident(content);
    const hasClimax = this.detectClimax(content);
    const hasResolution = this.detectResolution(content);

    // 3분할 긴장감 밀도 분석
    const firstThird = content.slice(0, totalLength / 3);
    const middleThird = content.slice(totalLength / 3, 2 * totalLength / 3);
    const lastThird = content.slice(2 * totalLength / 3);

    const firstDensity = this.calculateTensionDensity(firstThird);
    const middleDensity = this.calculateTensionDensity(middleThird);
    const lastDensity = this.calculateTensionDensity(lastThird);

    const pacingBalance = this.evaluatePacing(firstDensity, middleDensity, lastDensity);

    return {
      threeActStructure: hasIncitingIncident && hasClimax && hasResolution,
      incitingIncident: hasIncitingIncident,
      risingAction: middleDensity > firstDensity,
      climax: hasClimax,
      resolution: hasResolution,
      subplotIntegration: 70,
      pacingBalance,
      chapterStructure: this.evaluateChapterStructure(paragraphs)
    };
  }

  private detectIncitingIncident(content: string): boolean {
    const firstQuarter = content.slice(0, content.length / 4);
    return KOREAN_INCITING_INDICATORS.some(ind => firstQuarter.includes(ind));
  }

  private detectClimax(content: string): boolean {
    const lastThird = content.slice(2 * content.length / 3);
    return KOREAN_CLIMAX_INDICATORS.some(ind => lastThird.includes(ind));
  }

  private detectResolution(content: string): boolean {
    const lastTenth = content.slice(9 * content.length / 10);
    return KOREAN_RESOLUTION_INDICATORS.some(ind => lastTenth.includes(ind));
  }

  private calculateTensionDensity(text: string): number {
    const charCount = countKoreanChars(text);
    if (charCount === 0) return 0;

    let tensionCount = 0;
    for (const word of KOREAN_TENSION_WORDS) {
      const regex = new RegExp(word, 'g');
      const matches = text.match(regex);
      if (matches) tensionCount += matches.length;
    }
    return (tensionCount / charCount) * 10000;
  }

  private evaluatePacing(first: number, middle: number, last: number): number {
    let score = 70;
    if (middle > first) score += 10;
    if (last > middle * 0.8) score += 10;
    if (first < middle && middle < last) score += 10;
    return Math.min(100, score);
  }

  private evaluateChapterStructure(paragraphs: string[]): number {
    if (paragraphs.length === 0) return 50;

    const lengths = paragraphs.map(p => countKoreanChars(p));
    const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    if (avgLength === 0) return 50;

    const variance = lengths.reduce(
      (sum, len) => sum + Math.pow(len - avgLength, 2), 0
    ) / lengths.length;
    const cv = Math.sqrt(variance) / avgLength;

    if (cv > 0.3 && cv < 0.8) return 80; // 적절한 다양성
    if (cv <= 0.3) return 60; // 너무 균일
    return 50; // 너무 들쭉날쭉
  }

  /**
   * 캐릭터 분석 (한국어)
   */
  private analyzeCharacters(content: string): CharacterAnalysis {
    // 한국어 캐릭터 이름 추출 (한글 2-4자가 반복 등장)
    // 호칭 패턴 포함: ~씨, ~님, ~군, ~양 등
    const namePatterns = [
      /([가-힣]{2,4})(?:이|가|은|는|을|를|의|에게|한테|와|과|도|만|씨|님|군|양)/g,
    ];

    const nameCounts = new Map<string, number>();
    for (const pattern of namePatterns) {
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(content)) !== null) {
        const name = match[1];
        // 일반 명사/동사 필터 (조건부)
        if (name.length >= 2) {
          nameCounts.set(name, (nameCounts.get(name) || 0) + 1);
        }
      }
    }

    // 5회 이상 등장하는 이름
    const characterNames = Array.from(nameCounts.entries())
      .filter(([_, count]) => count >= 5)
      .map(([name]) => name);

    // 내면 묘사 깊이
    let internalCount = 0;
    for (const ind of KOREAN_INTERNAL_INDICATORS) {
      const regex = new RegExp(ind.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      const matches = content.match(regex);
      if (matches) internalCount += matches.length;
    }

    const protagonistDepth = Math.min(90, 50 + internalCount * 2);

    // 동기 부여 명확성
    let motivationCount = 0;
    for (const ind of KOREAN_MOTIVATION_INDICATORS) {
      const regex = new RegExp(ind.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      const matches = content.match(regex);
      if (matches) motivationCount += matches.length;
    }

    return {
      protagonistDepth,
      antagonistDepth: Math.min(80, 40 + motivationCount),
      supportingCastQuality: Math.min(80, characterNames.length * 10),
      characterArcs: this.detectCharacterArcs(content),
      motivationClarity: Math.min(90, 50 + motivationCount * 3),
      distinctVoices: this.assessVoiceDistinction(content),
      characterConsistency: 75
    };
  }

  private detectCharacterArcs(content: string): number {
    const lastQuarter = content.slice(3 * content.length / 4);

    let arcScore = 50;
    for (const ind of KOREAN_ARC_INDICATORS) {
      if (lastQuarter.includes(ind)) {
        arcScore += 5;
      }
    }
    return Math.min(90, arcScore);
  }

  private assessVoiceDistinction(content: string): number {
    const dialogues = extractDialogues(content);
    if (dialogues.length < 10) return 50;

    // 대화 길이와 스타일 다양성
    const lengths = dialogues.map(d => d.length);
    const variance = this.calculateVariance(lengths);

    // 높임말/반말 비율로 캐릭터별 음성 다양성 추정
    let honorificDialogues = 0;
    let casualDialogues = 0;
    for (const d of dialogues) {
      if (/요[.!?]|습니다|습니까/.test(d)) honorificDialogues++;
      else casualDialogues++;
    }

    const voiceMix = Math.min(honorificDialogues, casualDialogues) / Math.max(1, dialogues.length);
    const voiceBonus = voiceMix > 0.1 ? 10 : 0;

    return Math.min(85, 50 + variance * 0.3 + voiceBonus);
  }

  private calculateVariance(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    const avg = numbers.reduce((a, b) => a + b, 0) / numbers.length;
    return Math.sqrt(
      numbers.reduce((sum, n) => sum + Math.pow(n - avg, 2), 0) / numbers.length
    );
  }

  /**
   * 대화 분석 (한국어)
   */
  private analyzeDialogue(content: string): DialogueAnalysis {
    const dialogues = extractDialogues(content);
    const issues: DialogueIssue[] = [];

    // said bookism 검사 (과도한 대화 태그)
    let saidBookismCount = 0;
    const bookismMatches = findPatternMatches(content, KOREAN_SAID_BOOKISMS);
    for (const [bookism, count] of Array.from(bookismMatches.entries())) {
      saidBookismCount += count;
      if (count > 2) {
        issues.push({
          type: 'said_bookism',
          example: `"..." ${bookism} (${count}회 사용)`,
          suggestion: `과도한 대화 태그 "${bookism}" 대신 "말했다"/"대답했다"를 사용하거나 태그 자체를 생략하세요`
        });
      }
    }

    // 기본 태그 대비 과장된 태그 비율
    const basicTagCount = countPatternMatches(content, KOREAN_BASIC_TAGS);
    const totalTags = basicTagCount + saidBookismCount;
    const bookismRatio = totalTags > 0 ? saidBookismCount / totalTags : 0;

    if (bookismRatio > 0.5 && saidBookismCount > 3) {
      issues.push({
        type: 'excessive_tags',
        example: `대화 태그 중 ${Math.round(bookismRatio * 100)}%가 과장된 표현`,
        suggestion: '대화 태그의 70% 이상은 "말했다"/"대답했다" 같은 기본형이 적절합니다'
      });
    }

    // 정보 덤프 검사
    let infoDumpCount = 0;
    for (const pattern of KOREAN_INFO_DUMP_PATTERNS) {
      const matches = content.match(pattern);
      if (matches) infoDumpCount += matches.length;
    }

    if (infoDumpCount > 0) {
      issues.push({
        type: 'info_dump',
        example: '"알다시피..." 또는 긴 설명 대사',
        suggestion: '행동, 갈등, 자연스러운 대화를 통해 정보를 전달하세요'
      });
    }

    // 서브텍스트 분석
    const subtextIndicators = ['...', '?', '!', '그러나', '하지만', '사실'];
    let subtextScore = 50;
    for (const dialogue of dialogues) {
      for (const ind of subtextIndicators) {
        if (dialogue.includes(ind)) subtextScore += 1;
      }
    }

    return {
      naturalness: Math.max(0, 80 - infoDumpCount * 10 - saidBookismCount * 2),
      subtext: Math.min(90, subtextScore),
      characterVoiceDistinction: this.assessVoiceDistinction(content),
      purposefulness: 70,
      tagVariety: Math.max(0, 80 - (bookismRatio > 0.5 ? 20 : 0) - saidBookismCount * 3),
      expositionInDialogue: infoDumpCount,
      issues
    };
  }

  /**
   * Show vs Tell 분석 (한국어)
   */
  private analyzeShowVsTell(content: string): ShowVsTellAnalysis {
    const tellingInstances: TellingInstance[] = [];
    const effectiveShowing: string[] = [];

    // 감정 직접 서술 (telling) 감지
    for (const pattern of KOREAN_TELLING_PATTERNS) {
      const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`[^.!?]*${escaped}[^.!?]*[.!?]?`, 'g');
      const matches = content.match(regex) || [];

      for (const match of matches.slice(0, 3)) {
        const emotion = this.extractKoreanEmotion(pattern);
        tellingInstances.push({
          text: match.trim().slice(0, 100),
          emotion,
          suggestion: `"${emotion}" 감정을 신체 반응, 행동, 대화로 보여주세요`
        });
      }
    }

    // 효과적인 showing 감지 (감각 묘사, 신체 반응)
    const showingPatterns = [
      /손[이가]\s*(?:떨렸다|경련했다|움켜쥐었다|파르르)/g,
      /심장[이가]\s*(?:뛰었다|요동쳤다|쿵쿵|멎는)/g,
      /눈[이가]\s*(?:커졌다|가늘어졌다|번뜩|흔들)/g,
      /목소리[가가]\s*(?:갈라졌다|떨렸다|높아졌다|잠겼다)/g,
      /숨[이을]\s*(?:가빠졌다|삼켰다|멎었다|몰아쉬)/g,
      /등[이에]\s*(?:식은땀|소름|전율|오한)/g,
      /입술[이을]\s*(?:달싹|깨물|떨|벌)/g,
      /어깨[가를]\s*(?:떨었다|움츠렸다|축 늘어|펴)/g,
    ];

    for (const pattern of showingPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        effectiveShowing.push(...matches.slice(0, 2));
      }
    }

    // 의성어/의태어 사용도 showing에 기여
    const onomatopoeia = analyzeOnomatopoeia(content);
    if (onomatopoeia.assessment === 'balanced') {
      effectiveShowing.push(`의성어/의태어 ${onomatopoeia.count}회 활용`);
    }

    // 비율 계산
    const sentences = splitKoreanSentences(content);
    const sentenceCount = Math.max(1, sentences.length);
    const tellingRatio = tellingInstances.length / sentenceCount;
    const showingRatio = effectiveShowing.length / sentenceCount;

    const ratio = (showingRatio + tellingRatio) > 0
      ? (showingRatio / (showingRatio + tellingRatio)) * 100
      : 50;

    return {
      ratio,
      tellingInstances: tellingInstances.slice(0, 10),
      effectiveShowing: effectiveShowing.slice(0, 10)
    };
  }

  private extractKoreanEmotion(pattern: string): string {
    const emotionMap: Record<string, string> = {
      '슬펐다': '슬픔', '기뻤다': '기쁨', '화가 났다': '분노',
      '두려웠다': '두려움', '행복했다': '행복', '불안했다': '불안',
      '초조했다': '초조', '외로웠다': '외로움', '분노했다': '분노',
      '절망했다': '절망', '감동했다': '감동', '놀랐다': '놀라움',
      '당황했다': '당황', '부끄러웠다': '수치심', '허탈했다': '허탈',
      '슬픔을 느꼈다': '슬픔', '기쁨을 느꼈다': '기쁨',
      '분노를 느꼈다': '분노', '두려움을 느꼈다': '두려움',
      '행복을 느꼈다': '행복', '불안을 느꼈다': '불안',
      '초조함을 느꼈다': '초조', '외로움을 느꼈다': '외로움',
      '절망을 느꼈다': '절망', '감동을 받았다': '감동',
      '놀라움을 느꼈다': '놀라움', '수치심을 느꼈다': '수치심',
    };

    return emotionMap[pattern] || '감정';
  }

  /**
   * 기술적 문제 탐지 (한국어)
   */
  private findTechnicalIssues(content: string): TechnicalIssue[] {
    const issues: TechnicalIssue[] = [];

    // 맞춤법/문법 패턴 검사
    const grammarPatterns: Array<{ pattern: RegExp; issue: string; severity: TechnicalIssue['severity'] }> = [
      { pattern: /\s[,]/g, issue: '쉼표 앞 불필요한 공백', severity: 'minor' },
      { pattern: /\s[.]/g, issue: '마침표 앞 불필요한 공백', severity: 'minor' },
      { pattern: /["""][^"""]*[^"""]\s*$/gm, issue: '닫히지 않은 인용부호', severity: 'moderate' },
      { pattern: /([가-힣])\1{3,}/g, issue: '같은 글자 과도한 반복 (예: ㅋㅋㅋㅋ 패턴)', severity: 'minor' },
      { pattern: /\.\.\.\.\./g, issue: '말줄임표 과다 사용 (3점이 표준)', severity: 'minor' },
      { pattern: /!{3,}/g, issue: '느낌표 과다 사용', severity: 'minor' },
      { pattern: /\?{3,}/g, issue: '물음표 과다 사용', severity: 'minor' },
    ];

    for (const { pattern, issue, severity } of grammarPatterns) {
      const matches = content.match(pattern);
      if (matches && matches.length > 0) {
        issues.push({
          type: 'grammar',
          severity,
          description: `${issue} (${matches.length}건)`
        });
      }
    }

    // 이중 공백 검사
    const doubleSpaces = content.match(/ {2,}/g);
    if (doubleSpaces && doubleSpaces.length > 2) {
      issues.push({
        type: 'formatting',
        severity: 'minor',
        description: `이중 공백 발견 (${doubleSpaces.length}건)`
      });
    }

    // 한국어 문단 내 동일 어절 근접 반복 검사
    const sentences = splitKoreanSentences(content);
    let nearRepeatCount = 0;
    for (let i = 0; i < sentences.length - 1; i++) {
      const current = sentences[i];
      const next = sentences[i + 1];

      // 3글자 이상 어절 추출
      const currentWords = (current.match(/[가-힣]{3,}/g) || []);
      const nextWords = new Set(next.match(/[가-힣]{3,}/g) || []);

      for (const word of currentWords) {
        if (nextWords.has(word) && word.length >= 3) {
          nearRepeatCount++;
          if (nearRepeatCount <= 3) {
            issues.push({
              type: 'continuity',
              severity: 'minor',
              description: `인접 문장에서 "${word}" 반복`,
              location: `${i + 1}번째 문장 부근`
            });
          }
          break;
        }
      }
    }

    if (nearRepeatCount > 3) {
      issues.push({
        type: 'continuity',
        severity: 'moderate',
        description: `인접 문장 간 단어 반복 총 ${nearRepeatCount}건`
      });
    }

    // 종결어미 단조로움 경고
    const endingResult = analyzeEndingVariety(content);
    if (endingResult.repeatedEndings.length > 0) {
      issues.push({
        type: 'formatting',
        severity: 'moderate',
        description: `종결어미 단조로움: "${endingResult.repeatedEndings.join('", "')}" 패턴이 연속 3문장 이상 반복`
      });
    }

    // 존칭 일관성 경고
    const honorificResult = analyzeHonorificConsistency(content);
    if (!honorificResult.consistent) {
      for (const issue of honorificResult.issues.slice(0, 3)) {
        issues.push({
          type: 'continuity',
          severity: 'moderate',
          description: issue
        });
      }
    }

    return issues.slice(0, 20);
  }

  // ============================================================================
  // 점수 계산 메서드
  // ============================================================================

  private calculateProseScore(analysis: ProseAnalysis): number {
    const raw = (
      analysis.readabilityScore * 0.2 +
      analysis.sentenceVariety * 0.2 +
      analysis.wordChoiceQuality * 0.25 +
      analysis.rhythmAndFlow * 0.2 +
      analysis.voiceConsistency * 0.15
    ) - (analysis.purpleProse * 2) - (analysis.issues.length * 3);

    return Math.max(0, Math.min(100, raw));
  }

  private calculateStructureScore(analysis: StructureAnalysis): number {
    let score = 0;
    if (analysis.threeActStructure) score += 20;
    if (analysis.incitingIncident) score += 15;
    if (analysis.risingAction) score += 15;
    if (analysis.climax) score += 20;
    if (analysis.resolution) score += 10;
    score += analysis.pacingBalance * 0.2;
    return Math.min(100, score);
  }

  private calculateCharacterScore(analysis: CharacterAnalysis): number {
    return Math.max(0, Math.min(100, (
      analysis.protagonistDepth * 0.25 +
      analysis.antagonistDepth * 0.15 +
      analysis.supportingCastQuality * 0.1 +
      analysis.characterArcs * 0.2 +
      analysis.motivationClarity * 0.15 +
      analysis.distinctVoices * 0.15
    )));
  }

  private calculateDialogueScore(analysis: DialogueAnalysis): number {
    const raw = (
      analysis.naturalness * 0.3 +
      analysis.subtext * 0.2 +
      analysis.characterVoiceDistinction * 0.2 +
      analysis.purposefulness * 0.15 +
      analysis.tagVariety * 0.15
    ) - (analysis.expositionInDialogue * 5);

    return Math.max(0, Math.min(100, raw));
  }

  private assessWorldBuilding(content: string): number {
    let score = 50;
    for (const ind of KOREAN_WORLD_INDICATORS) {
      const regex = new RegExp(ind, 'g');
      const matches = content.match(regex);
      if (matches) score += matches.length * 0.5;
    }

    // 장소/환경 묘사 감지
    const descriptivePatterns = [
      /[가-힣]+[이가] 펼쳐/g,
      /[가-힣]+[이가] 보였다/g,
      /[가-힣]+[이가] 가득/g,
      /바람[이가]/g,
      /하늘[이을에]/g,
      /빛[이을]/g,
    ];

    for (const pattern of descriptivePatterns) {
      const matches = content.match(pattern);
      if (matches) score += matches.length * 0.3;
    }

    return Math.min(90, score);
  }

  private assessEmotionalImpact(content: string): number {
    let score = 40;
    for (const word of KOREAN_EMOTION_WORDS) {
      const regex = new RegExp(word, 'g');
      const matches = content.match(regex);
      if (matches) score += matches.length * 2;
    }

    // 의성어/의태어로 인한 감정적 생동감
    const onomatopoeia = analyzeOnomatopoeia(content);
    if (onomatopoeia.assessment === 'balanced') score += 10;

    return Math.min(95, score);
  }

  private assessOriginality(content: string): number {
    let score = 80;

    // 한국어 클리셰 감지
    for (const cliche of KOREAN_CLICHES) {
      if (content.includes(cliche)) {
        score -= 3;
      }
    }

    // 과잉 수식 패턴
    const purpleCount = countPatternMatches(content, KOREAN_PURPLE_PROSE);
    score -= purpleCount * 2;

    return Math.max(30, Math.min(100, score));
  }

  private calculateTechnicalScore(issues: TechnicalIssue[]): number {
    let score = 100;
    for (const issue of issues) {
      switch (issue.severity) {
        case 'major': score -= 10; break;
        case 'moderate': score -= 5; break;
        case 'minor': score -= 2; break;
      }
    }
    return Math.max(0, score);
  }

  private assessMarketability(
    content: string,
    metadata?: { genre?: string; targetAudience?: string }
  ): number {
    let score = 60;

    // 한국어 소설 분량 평가 (글자 수 기준)
    // 한국 장편소설: 보통 200자 원고지 기준 800-1200매 (약 16만-24만자)
    const charCount = countKoreanChars(content);
    if (charCount >= 160000 && charCount <= 240000) score += 15;
    else if (charCount >= 100000 && charCount <= 300000) score += 10;
    else if (charCount >= 50000) score += 5;

    // 장르 인식
    if (metadata?.genre) {
      score += 5;
    }

    // 대화문 비율 (적절한 대화 비율은 30-50%)
    const dialogues = extractDialogues(content);
    const dialogueChars = dialogues.reduce((sum, d) => sum + d.length, 0);
    const dialogueRatio = charCount > 0 ? dialogueChars / charCount : 0;
    if (dialogueRatio >= 0.3 && dialogueRatio <= 0.5) score += 5;
    else if (dialogueRatio >= 0.2 && dialogueRatio <= 0.6) score += 2;

    return Math.min(90, score);
  }

  private calculateOverallScore(categories: CategoryScores): number {
    const weights = {
      prose: 0.15,
      structure: 0.12,
      characterization: 0.15,
      dialogue: 0.12,
      pacing: 0.1,
      worldBuilding: 0.08,
      emotionalImpact: 0.1,
      originality: 0.08,
      technicalQuality: 0.05,
      marketability: 0.05
    };

    let total = 0;
    for (const [key, weight] of Object.entries(weights)) {
      total += categories[key as keyof CategoryScores] * weight;
    }

    return Math.round(total);
  }

  private determineGrade(score: number): QualityGrade {
    if (score >= GRADE_THRESHOLDS.S) return 'S';
    if (score >= GRADE_THRESHOLDS.A) return 'A';
    if (score >= GRADE_THRESHOLDS.B) return 'B';
    if (score >= GRADE_THRESHOLDS.C) return 'C';
    if (score >= GRADE_THRESHOLDS.D) return 'D';
    return 'F';
  }

  private assessPublishingReadiness(
    categories: CategoryScores,
    grade: QualityGrade,
    issues: TechnicalIssue[]
  ): PublishingReadiness {
    const blockers: string[] = [];
    const strengths: string[] = [];

    // 출판 차단 요소 (한국어 기준)
    if (categories.prose < 60) blockers.push('문장 품질이 출판 기준에 미달합니다');
    if (categories.structure < 50) blockers.push('서사 구조에 문제가 있습니다');
    if (categories.characterization < 55) blockers.push('캐릭터 개발이 부족합니다');
    if (categories.dialogue < 50) blockers.push('대화문 품질 개선이 필요합니다');
    if (issues.filter(i => i.severity === 'major').length > 5) blockers.push('기술적 문제가 너무 많습니다');

    // 강점 식별
    if (categories.prose >= 80) strengths.push('탁월한 문체');
    if (categories.characterization >= 80) strengths.push('깊이 있는 캐릭터 묘사');
    if (categories.emotionalImpact >= 80) strengths.push('강한 감정적 울림');
    if (categories.originality >= 80) strengths.push('신선하고 독창적인 표현');
    if (categories.dialogue >= 80) strengths.push('자연스러운 대화');
    if (categories.structure >= 80) strengths.push('탄탄한 서사 구조');

    // 출판 등급 결정
    // - traditional: 대형 출판사 투고 가능 (S/A)
    // - indie: 독립 출판사/웹소설 플랫폼 (B)
    // - self_publish: 자가 출판/블로그 (C)
    // - needs_work: 추가 작업 필요 (D/F)
    let tier: PublishingReadiness['tier'];
    let estimatedRevisions: number;

    if (grade === 'S' || grade === 'A') {
      tier = 'traditional';
      estimatedRevisions = grade === 'S' ? 1 : 2;
    } else if (grade === 'B') {
      tier = 'indie';
      estimatedRevisions = 3;
    } else if (grade === 'C') {
      tier = 'self_publish';
      estimatedRevisions = 4;
    } else {
      tier = 'needs_work';
      estimatedRevisions = grade === 'D' ? 5 : 7;
    }

    return {
      ready: blockers.length === 0 && (grade === 'S' || grade === 'A' || grade === 'B'),
      tier,
      blockers,
      strengths,
      estimatedRevisionRounds: estimatedRevisions
    };
  }

  private generateRecommendations(
    categories: CategoryScores,
    analysis: DetailedAnalysis
  ): QualityRecommendation[] {
    const recommendations: QualityRecommendation[] = [];

    // 문장 품질 권고
    if (categories.prose < 70) {
      recommendations.push({
        priority: categories.prose < 50 ? 'critical' : 'high',
        category: 'prose',
        issue: '문장 품질이 출판 기준에 미달합니다',
        recommendation: '약한 표현(있었다, 했다)을 구체적 동사로 교체하고, 문장 길이를 다양하게 조절하세요',
        impact: '문장 품질 향상은 전체 독서 경험을 크게 개선합니다'
      });
    }

    // 종결어미 단조로움
    if (analysis.proseAnalysis.rhythmAndFlow < 60) {
      recommendations.push({
        priority: 'medium',
        category: 'prose',
        issue: '문장 리듬이 단조롭습니다',
        recommendation: '종결어미를 다양하게 사용하세요. 과거형(-했다)만 반복하지 말고 현재형(-한다), 명사형(-것이다) 등을 섞어주세요',
        impact: '리듬감 있는 문장은 몰입도를 높입니다'
      });
    }

    // 구조 권고
    if (!analysis.structureAnalysis.threeActStructure) {
      recommendations.push({
        priority: 'high',
        category: 'structure',
        issue: '핵심 서사 구조 요소가 부족합니다',
        recommendation: '사건의 발단(도입부 1/4), 갈등의 고조(중반), 클라이맥스(후반 1/3), 결말을 명확히 구성하세요',
        impact: '탄탄한 구조는 독자에게 만족스러운 서사 경험을 제공합니다'
      });
    }

    // 캐릭터 권고
    if (categories.characterization < 65) {
      recommendations.push({
        priority: 'high',
        category: 'characterization',
        issue: '캐릭터에 깊이가 부족합니다',
        recommendation: '내면 독백, 명확한 동기, 가시적인 성장 과정을 추가하세요',
        impact: '독자는 깊이 있는 캐릭터에 감정적으로 연결됩니다'
      });
    }

    // 대화 권고
    if (analysis.dialogueAnalysis.expositionInDialogue > 2) {
      recommendations.push({
        priority: 'medium',
        category: 'dialogue',
        issue: '대화문에 과도한 설명이 포함되어 있습니다',
        recommendation: '"알다시피..." 같은 설명 대사 대신, 행동과 갈등을 통해 정보를 전달하세요',
        impact: '자연스러운 대화는 몰입감을 높입니다'
      });
    }

    if (analysis.dialogueAnalysis.issues.some(i => i.type === 'said_bookism')) {
      recommendations.push({
        priority: 'medium',
        category: 'dialogue',
        issue: '과장된 대화 태그가 많습니다',
        recommendation: '"외쳤다", "토해냈다" 같은 표현을 줄이고 "말했다"/"대답했다"를 기본으로 사용하세요',
        impact: '절제된 대화 태그는 대화 자체에 집중하게 합니다'
      });
    }

    // Show vs Tell 권고
    if (analysis.showVsTell.ratio < 50) {
      recommendations.push({
        priority: 'high',
        category: 'prose',
        issue: '감정 직접 서술(telling)이 너무 많습니다',
        recommendation: '"슬펐다", "화가 났다" 대신 신체 반응, 행동, 대화로 감정을 보여주세요',
        impact: 'Show, Don\'t Tell은 독자의 체감적 경험을 극대화합니다'
      });
    }

    // 클리셰 권고
    if (categories.originality < 65) {
      recommendations.push({
        priority: 'medium',
        category: 'originality',
        issue: '클리셰 표현이 많습니다',
        recommendation: '"심장이 두근거렸다", "눈물이 흘러내렸다" 같은 상투적 표현을 독창적으로 재해석하세요',
        impact: '신선한 표현은 작품의 문학적 가치를 높입니다'
      });
    }

    // 세계관 구축 권고
    if (categories.worldBuilding < 60) {
      recommendations.push({
        priority: 'low',
        category: 'worldBuilding',
        issue: '세계관 묘사가 부족합니다',
        recommendation: '배경, 환경, 사회/문화적 맥락을 구체적으로 묘사하세요',
        impact: '풍부한 세계관은 서사의 설득력을 높입니다'
      });
    }

    // 기술적 품질 권고
    if (categories.technicalQuality < 70) {
      recommendations.push({
        priority: categories.technicalQuality < 50 ? 'high' : 'medium',
        category: 'technicalQuality',
        issue: '기술적 문제가 발견되었습니다',
        recommendation: '인접 문장 반복, 종결어미 단조로움, 존칭 일관성 등을 점검하세요',
        impact: '기술적 완성도는 전문성과 가독성의 기본입니다'
      });
    }

    // 우선순위 정렬
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return recommendations;
  }
}

// Export singleton instance
export const qualityValidator = new QualityValidator();
