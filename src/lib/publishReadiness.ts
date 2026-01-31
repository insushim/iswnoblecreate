/**
 * 출판 준비 체크리스트 시스템
 *
 * 인간 편집자 없이도 출판 수준의 완성도를 달성하기 위한
 * 포괄적인 출판 준비 검증 시스템
 */

// ============================================================================
// 타입 정의
// ============================================================================

export interface PublishingChecklistItem {
  id: string;
  category: ChecklistCategory;
  name: string;
  description: string;
  importance: 'critical' | 'high' | 'medium' | 'low';
  autoCheckable: boolean;
  checkPrompt?: string;
  passCriteria: string;
}

export type ChecklistCategory =
  | 'manuscript-quality'      // 원고 품질
  | 'story-completeness'      // 스토리 완결성
  | 'character-consistency'   // 캐릭터 일관성
  | 'world-building'          // 세계관 완성도
  | 'formatting'              // 포맷팅
  | 'legal-compliance'        // 법적 준수사항
  | 'market-readiness'        // 시장 준비도
  | 'metadata'                // 메타데이터
  | 'platform-specific';      // 플랫폼별 요구사항

export interface CheckResult {
  itemId: string;
  passed: boolean;
  score: number; // 0-100
  details: string;
  issues: string[];
  suggestions: string[];
  autoFixed?: boolean;
}

export interface PublishingReadinessReport {
  overallScore: number;
  readinessLevel: 'ready' | 'nearly-ready' | 'needs-work' | 'major-revision';
  categoryScores: Record<ChecklistCategory, number>;
  criticalIssues: string[];
  highPriorityIssues: string[];
  recommendations: string[];
  estimatedRevisionTime: string;
  checkResults: CheckResult[];
  platformRecommendations: PlatformRecommendation[];
}

export interface PlatformRecommendation {
  platform: PublishingPlatform;
  suitabilityScore: number;
  requirements: PlatformRequirement[];
  missingRequirements: string[];
  tips: string[];
}

export type PublishingPlatform =
  | 'kakao-page'
  | 'naver-series'
  | 'ridi-books'
  | 'munpia'
  | 'joara'
  | 'novelpia'
  | 'traditional-publisher'
  | 'self-publish-ebook'
  | 'self-publish-print';

export interface PlatformRequirement {
  name: string;
  description: string;
  met: boolean;
}

export interface ManuscriptStats {
  totalCharacters: number;
  totalWords: number;
  chapterCount: number;
  averageChapterLength: number;
  dialogueRatio: number;
  descriptionRatio: number;
  actionRatio: number;
}

// ============================================================================
// 출판 체크리스트 정의
// ============================================================================

export const PUBLISHING_CHECKLIST: PublishingChecklistItem[] = [
  // 원고 품질
  {
    id: 'mq-001',
    category: 'manuscript-quality',
    name: '맞춤법/문법 검사',
    description: '전체 원고의 맞춤법과 문법 오류 검사',
    importance: 'critical',
    autoCheckable: true,
    checkPrompt: `다음 텍스트의 맞춤법과 문법을 검사하세요.
발견된 모든 오류를 나열하고 수정안을 제시하세요.
한국어 맞춤법 규정에 따라 엄격하게 검사하세요.

검사 항목:
1. 띄어쓰기 오류
2. 조사 사용 오류
3. 문장 부호 오류
4. 존댓말/반말 일관성
5. 외래어 표기법
6. 숫자 표기법

텍스트:
{text}`,
    passCriteria: '1000자당 오류 2개 미만'
  },
  {
    id: 'mq-002',
    category: 'manuscript-quality',
    name: '문장 품질 검사',
    description: '어색한 문장, 중복 표현, 불필요한 수식어 검사',
    importance: 'high',
    autoCheckable: true,
    checkPrompt: `다음 텍스트의 문장 품질을 분석하세요.

검사 항목:
1. 어색하거나 부자연스러운 문장
2. 불필요한 중복 표현
3. 과도한 수식어
4. 문장 길이의 균형
5. AI스러운 표현 (판에 박힌 표현, 과도한 설명)
6. 읽기 어려운 복잡한 문장 구조

텍스트:
{text}`,
    passCriteria: '90% 이상의 문장이 자연스럽고 읽기 쉬움'
  },
  {
    id: 'mq-003',
    category: 'manuscript-quality',
    name: '시점 일관성',
    description: '서술 시점의 일관성 검사 (1인칭/3인칭, 시제)',
    importance: 'critical',
    autoCheckable: true,
    checkPrompt: `다음 텍스트의 서술 시점과 시제 일관성을 분석하세요.

검사 항목:
1. 서술 시점 (1인칭/3인칭) 일관성
2. 시제 (과거형/현재형) 일관성
3. 시점 혼동 구간
4. 부적절한 시점 전환
5. 시점에 따른 정보 제공 적절성

텍스트:
{text}`,
    passCriteria: '시점 혼동 0건, 시제 오류 5건 미만'
  },
  {
    id: 'mq-004',
    category: 'manuscript-quality',
    name: '대화문 품질',
    description: '대화의 자연스러움과 캐릭터별 말투 일관성',
    importance: 'high',
    autoCheckable: true,
    checkPrompt: `다음 텍스트의 대화문을 분석하세요.

검사 항목:
1. 대화의 자연스러움
2. 캐릭터별 말투 일관성
3. 대화 태그 다양성 (말했다, 대답했다 등의 반복)
4. 불필요한 설명적 대화
5. 서브텍스트 존재 여부
6. 대화와 서술의 균형

텍스트:
{text}`,
    passCriteria: '대화가 캐릭터 개성을 반영하고 자연스러움'
  },

  // 스토리 완결성
  {
    id: 'sc-001',
    category: 'story-completeness',
    name: '플롯 완결성',
    description: '주요 플롯 라인의 해결 여부 확인',
    importance: 'critical',
    autoCheckable: true,
    checkPrompt: `다음 소설의 플롯 완결성을 분석하세요.

검사 항목:
1. 메인 플롯 해결 여부
2. 서브플롯 해결 여부
3. 미해결 복선 (체호프의 총)
4. 미답변 질문들
5. 결말의 만족도
6. 주제의 완결성

전체 스토리 요약:
{storySummary}

미해결 요소 목록:
{unresolvedElements}`,
    passCriteria: '모든 주요 플롯과 90% 이상의 서브플롯 해결'
  },
  {
    id: 'sc-002',
    category: 'story-completeness',
    name: '복선 회수 검사',
    description: '설정된 복선들의 회수 여부 확인',
    importance: 'high',
    autoCheckable: true,
    checkPrompt: `다음 복선 목록을 검토하고 회수 상태를 분석하세요.

복선 목록:
{foreshadowingList}

검사 항목:
1. 각 복선의 회수 여부
2. 회수 방식의 적절성
3. 회수 시점의 적절성
4. 미회수 복선의 필요성
5. 과도하게 예측 가능한 복선`,
    passCriteria: '중요 복선 100% 회수, 일반 복선 80% 이상 회수'
  },
  {
    id: 'sc-003',
    category: 'story-completeness',
    name: '캐릭터 아크 완결',
    description: '주요 캐릭터들의 성장/변화 아크 완결 확인',
    importance: 'high',
    autoCheckable: true,
    checkPrompt: `다음 캐릭터들의 아크 완결성을 분석하세요.

캐릭터 정보:
{characterInfo}

검사 항목:
1. 각 캐릭터의 성장/변화
2. 시작과 끝의 대비
3. 변화의 설득력
4. 미완결 캐릭터 아크
5. 캐릭터 목표 달성 여부`,
    passCriteria: '주인공 아크 완결 필수, 주요 캐릭터 80% 이상 완결'
  },
  {
    id: 'sc-004',
    category: 'story-completeness',
    name: '감정적 만족도',
    description: '결말의 감정적 카타르시스와 만족도',
    importance: 'high',
    autoCheckable: true,
    checkPrompt: `다음 결말의 감정적 만족도를 분석하세요.

결말 부분:
{ending}

검사 항목:
1. 카타르시스 충족도
2. 독자 기대 충족/전복
3. 여운의 깊이
4. 감정적 해소
5. 주제와의 연결성`,
    passCriteria: '감정적 카타르시스와 적절한 여운 제공'
  },

  // 캐릭터 일관성
  {
    id: 'cc-001',
    category: 'character-consistency',
    name: '캐릭터 외모 일관성',
    description: '캐릭터 외모 묘사의 일관성 검사',
    importance: 'medium',
    autoCheckable: true,
    checkPrompt: `다음 캐릭터 외모 묘사들의 일관성을 검사하세요.

캐릭터: {characterName}
외모 묘사 목록:
{descriptions}

검사 항목:
1. 외모 특징 일관성 (눈 색, 머리 색, 키 등)
2. 모순되는 묘사
3. 갑작스러운 외모 변화 (설명 없이)
4. 누락된 주요 특징`,
    passCriteria: '외모 묘사 간 모순 0건'
  },
  {
    id: 'cc-002',
    category: 'character-consistency',
    name: '캐릭터 성격 일관성',
    description: '캐릭터 성격과 행동 패턴의 일관성',
    importance: 'critical',
    autoCheckable: true,
    checkPrompt: `다음 캐릭터의 성격 일관성을 분석하세요.

캐릭터 프로필:
{characterProfile}

행동/대화 샘플:
{behaviorSamples}

검사 항목:
1. 성격 특성 일관성
2. 행동 동기 일관성
3. 설명 없는 급격한 성격 변화
4. OOC(Out of Character) 행동
5. 성격과 행동의 불일치`,
    passCriteria: '설명 없는 OOC 행동 0건'
  },
  {
    id: 'cc-003',
    category: 'character-consistency',
    name: '이름/호칭 일관성',
    description: '캐릭터 이름과 호칭의 일관된 사용',
    importance: 'high',
    autoCheckable: true,
    checkPrompt: `다음 텍스트에서 캐릭터 이름과 호칭 사용을 검사하세요.

캐릭터 목록:
{characterList}

텍스트:
{text}

검사 항목:
1. 이름 철자 일관성
2. 호칭 사용 일관성 (관계에 따른)
3. 잘못된 이름 사용
4. 호칭 혼동`,
    passCriteria: '이름/호칭 오류 0건'
  },

  // 세계관 완성도
  {
    id: 'wb-001',
    category: 'world-building',
    name: '설정 일관성',
    description: '세계관 설정의 내부 일관성 검사',
    importance: 'critical',
    autoCheckable: true,
    checkPrompt: `다음 세계관 설정의 일관성을 검사하세요.

세계관 설정:
{worldSetting}

본문에서의 설정 언급:
{settingMentions}

검사 항목:
1. 규칙/법칙의 일관성
2. 지리/지명 일관성
3. 역사/연대기 일관성
4. 사회 체계 일관성
5. 모순되는 설정`,
    passCriteria: '설정 간 모순 0건'
  },
  {
    id: 'wb-002',
    category: 'world-building',
    name: '마법/능력 체계 일관성',
    description: '마법이나 특수 능력 체계의 규칙 일관성',
    importance: 'high',
    autoCheckable: true,
    checkPrompt: `다음 마법/능력 체계의 일관성을 검사하세요.

체계 설정:
{systemSetting}

사용 장면들:
{usageScenes}

검사 항목:
1. 규칙 준수 여부
2. 비용/대가 일관성
3. 제한 사항 준수
4. 갑작스러운 능력 상승
5. 설명 없는 신능력`,
    passCriteria: '체계 위반 0건 (또는 설명 있는 예외)'
  },
  {
    id: 'wb-003',
    category: 'world-building',
    name: '시간/거리 일관성',
    description: '작품 내 시간과 거리의 논리적 일관성',
    importance: 'medium',
    autoCheckable: true,
    checkPrompt: `다음 텍스트의 시간과 거리 일관성을 검사하세요.

시간/거리 언급:
{timeDistanceMentions}

검사 항목:
1. 이동 시간의 일관성
2. 경과 시간의 논리성
3. 거리 설정의 일관성
4. 계절/날씨 변화의 적절성`,
    passCriteria: '시간/거리 모순 0건'
  },

  // 포맷팅
  {
    id: 'fm-001',
    category: 'formatting',
    name: '장/절 구분',
    description: '챕터와 씬 구분의 적절성',
    importance: 'medium',
    autoCheckable: true,
    checkPrompt: `다음 원고의 장/절 구분을 검사하세요.

챕터 구조:
{chapterStructure}

검사 항목:
1. 장 제목 형식 일관성
2. 장 길이 균형
3. 씬 전환 표시
4. 적절한 끊기점`,
    passCriteria: '장 형식 일관성 100%, 적절한 길이 분배'
  },
  {
    id: 'fm-002',
    category: 'formatting',
    name: '대화 포맷',
    description: '대화문 형식의 일관성',
    importance: 'medium',
    autoCheckable: true,
    checkPrompt: `대화문 포맷을 검사하세요.

검사 항목:
1. 따옴표 사용 일관성
2. 대화 태그 포맷
3. 생각/내면 묘사 구분
4. 단락 나누기

텍스트:
{text}`,
    passCriteria: '대화 포맷 100% 일관성'
  },
  {
    id: 'fm-003',
    category: 'formatting',
    name: '문단 구조',
    description: '문단 나누기와 들여쓰기 일관성',
    importance: 'low',
    autoCheckable: true,
    checkPrompt: `문단 구조를 검사하세요.

검사 항목:
1. 들여쓰기 일관성
2. 문단 길이 적절성
3. 빈 줄 사용
4. 특수 포맷 (편지, 문서 등)

텍스트:
{text}`,
    passCriteria: '포맷 일관성 100%'
  },

  // 법적 준수사항
  {
    id: 'lc-001',
    category: 'legal-compliance',
    name: '저작권 검토',
    description: '인용, 패러디, 오마주 등의 저작권 이슈 검토',
    importance: 'critical',
    autoCheckable: true,
    checkPrompt: `저작권 관련 이슈를 검토하세요.

검사 항목:
1. 직접 인용 (출처 표기 필요)
2. 다른 작품 패러디/오마주 (과도한 유사성)
3. 실존 상표/브랜드 언급
4. 실존 인물 언급
5. 노래 가사, 시 등 인용

텍스트:
{text}`,
    passCriteria: '저작권 침해 위험 요소 0건'
  },
  {
    id: 'lc-002',
    category: 'legal-compliance',
    name: '민감 콘텐츠 검토',
    description: '폭력, 성적 콘텐츠 등급 적절성',
    importance: 'high',
    autoCheckable: true,
    checkPrompt: `콘텐츠 등급을 검토하세요.

검사 항목:
1. 폭력 수위
2. 성적 콘텐츠 수위
3. 욕설/비속어 사용
4. 약물/알코올 묘사
5. 타겟 연령층 적합성

텍스트:
{text}`,
    passCriteria: '명시된 등급에 부합하는 콘텐츠'
  },
  {
    id: 'lc-003',
    category: 'legal-compliance',
    name: '차별/혐오 표현 검토',
    description: '차별적이거나 혐오스러운 표현 검토',
    importance: 'critical',
    autoCheckable: true,
    checkPrompt: `차별/혐오 표현을 검토하세요.

검사 항목:
1. 인종/민족 차별
2. 성차별
3. 장애 차별
4. 종교 차별
5. 성소수자 차별
6. 기타 혐오 표현

(캐릭터의 발언이 아닌 서술 관점에서)

텍스트:
{text}`,
    passCriteria: '서술 관점의 차별/혐오 표현 0건'
  },

  // 시장 준비도
  {
    id: 'mr-001',
    category: 'market-readiness',
    name: '분량 적절성',
    description: '타겟 시장/플랫폼에 맞는 분량',
    importance: 'high',
    autoCheckable: true,
    checkPrompt: `분량 적절성을 분석하세요.

현재 분량:
- 총 글자 수: {totalCharacters}
- 총 단어 수: {totalWords}
- 챕터 수: {chapterCount}

타겟: {targetPlatform}

검사 항목:
1. 플랫폼별 권장 분량 충족
2. 챕터당 분량 적절성
3. 연재 단위 분량`,
    passCriteria: '타겟 플랫폼 분량 기준 충족'
  },
  {
    id: 'mr-002',
    category: 'market-readiness',
    name: '훅 효과성',
    description: '첫 장면/첫 챕터의 독자 유입 효과',
    importance: 'high',
    autoCheckable: true,
    checkPrompt: `첫 부분의 훅 효과를 분석하세요.

첫 3000자:
{openingText}

검사 항목:
1. 첫 문장의 흡인력
2. 초반 갈등/질문 제시
3. 캐릭터 매력 전달
4. 세계관 효과적 소개
5. 읽기 지속 욕구`,
    passCriteria: '강력한 훅과 지속적 읽기 욕구 유발'
  },
  {
    id: 'mr-003',
    category: 'market-readiness',
    name: '장르 컨벤션 충족',
    description: '타겟 장르의 핵심 요소 충족도',
    importance: 'high',
    autoCheckable: true,
    checkPrompt: `장르 컨벤션 충족도를 분석하세요.

장르: {genre}
작품 요약: {summary}

검사 항목:
1. 장르 필수 요소 포함
2. 독자 기대 충족
3. 장르 클리셰 적절한 활용
4. 차별화 포인트`,
    passCriteria: '장르 필수 요소 100% 충족'
  },

  // 메타데이터
  {
    id: 'md-001',
    category: 'metadata',
    name: '제목 효과성',
    description: '제목의 매력도와 장르 적합성',
    importance: 'high',
    autoCheckable: true,
    checkPrompt: `제목을 분석하세요.

제목: {title}
장르: {genre}
스토리 요약: {summary}

검사 항목:
1. 기억하기 쉬움
2. 장르 암시
3. 호기심 유발
4. 검색 친화성
5. 유사 작품과 차별화`,
    passCriteria: '매력적이고 장르 적합한 제목'
  },
  {
    id: 'md-002',
    category: 'metadata',
    name: '시놉시스 품질',
    description: '시놉시스의 완성도와 매력',
    importance: 'high',
    autoCheckable: true,
    checkPrompt: `시놉시스를 분석하세요.

시놉시스:
{synopsis}

검사 항목:
1. 핵심 갈등 명확성
2. 주인공 매력 전달
3. 독특한 설정 강조
4. 스포일러 적절성
5. 읽고 싶은 욕구 유발`,
    passCriteria: '설득력 있고 매력적인 시놉시스'
  },
  {
    id: 'md-003',
    category: 'metadata',
    name: '키워드/태그 적절성',
    description: '검색과 추천을 위한 키워드 적절성',
    importance: 'medium',
    autoCheckable: true,
    checkPrompt: `키워드/태그를 분석하세요.

현재 키워드: {keywords}
작품 내용: {content}

검사 항목:
1. 장르 키워드 포함
2. 핵심 소재 키워드
3. 타겟 독자 키워드
4. 검색 트렌드 반영
5. 과도한 태그 지양`,
    passCriteria: '적절하고 효과적인 키워드 선정'
  },

  // 플랫폼별 요구사항
  {
    id: 'ps-001',
    category: 'platform-specific',
    name: '연재 분량 최적화',
    description: '회당 분량의 플랫폼 최적화',
    importance: 'medium',
    autoCheckable: true,
    checkPrompt: `연재 분량을 분석하세요.

챕터별 글자 수:
{chapterLengths}

타겟 플랫폼: {platform}

검사 항목:
1. 회당 최소/최대 분량
2. 분량 일관성
3. 끊기점 효과
4. 클리프행어 배치`,
    passCriteria: '플랫폼 권장 분량 준수'
  },
  {
    id: 'ps-002',
    category: 'platform-specific',
    name: '플랫폼 가이드라인',
    description: '타겟 플랫폼의 콘텐츠 가이드라인 준수',
    importance: 'high',
    autoCheckable: true,
    checkPrompt: `플랫폼 가이드라인 준수를 검사하세요.

플랫폼: {platform}
가이드라인: {guidelines}

검사 항목:
1. 금지 콘텐츠
2. 필수 표시 사항
3. 연령 제한 준수
4. 특수 문자 사용`,
    passCriteria: '플랫폼 가이드라인 100% 준수'
  }
];

// ============================================================================
// 플랫폼별 요구사항 정의
// ============================================================================

export const PLATFORM_REQUIREMENTS: Record<PublishingPlatform, {
  name: string;
  minChapterLength: number;
  maxChapterLength: number;
  recommendedChapterLength: number;
  minTotalLength: number;
  allowedRatings: string[];
  specialRequirements: string[];
  advantages: string[];
  disadvantages: string[];
}> = {
  'kakao-page': {
    name: '카카오페이지',
    minChapterLength: 3000,
    maxChapterLength: 6000,
    recommendedChapterLength: 4500,
    minTotalLength: 100000,
    allowedRatings: ['전체', '12세', '15세', '19세'],
    specialRequirements: [
      '기다리면 무료 시스템에 적합한 끊기',
      '연재 시 정기적 업로드 권장',
      '썸네일 이미지 필요',
      '3회분 이상 사전 작성 권장'
    ],
    advantages: ['대형 플랫폼', '높은 노출', 'IP 사업 기회'],
    disadvantages: ['경쟁 치열', '독점 계약 필요']
  },
  'naver-series': {
    name: '네이버 시리즈',
    minChapterLength: 3000,
    maxChapterLength: 7000,
    recommendedChapterLength: 5000,
    minTotalLength: 100000,
    allowedRatings: ['전체', '12세', '15세', '19세'],
    specialRequirements: [
      '네이버 작가 등록 필요',
      '정기 연재 시 노출 유리',
      '커버 이미지 필요',
      '시놉시스 작성 필수'
    ],
    advantages: ['네이버 검색 노출', '안정적 수익'],
    disadvantages: ['승인 과정', '독점 계약']
  },
  'ridi-books': {
    name: '리디북스',
    minChapterLength: 5000,
    maxChapterLength: 15000,
    recommendedChapterLength: 8000,
    minTotalLength: 150000,
    allowedRatings: ['전체', '15세', '19세'],
    specialRequirements: [
      '완결작 선호',
      '권당 분리 필요',
      'EPUB 포맷 지원',
      '커버 디자인 중요'
    ],
    advantages: ['완결작 강점', '높은 단가'],
    disadvantages: ['비독점이나 수수료 높음']
  },
  'munpia': {
    name: '문피아',
    minChapterLength: 4000,
    maxChapterLength: 8000,
    recommendedChapterLength: 6000,
    minTotalLength: 200000,
    allowedRatings: ['전체', '15세', '19세'],
    specialRequirements: [
      '판타지/무협 장르 강세',
      '꾸준한 연재 중요',
      '독자 소통 활발',
      '베스트 선정 시스템'
    ],
    advantages: ['판타지 독자층', '자유로운 연재'],
    disadvantages: ['타 장르 약세', '독자층 한정']
  },
  'joara': {
    name: '조아라',
    minChapterLength: 3000,
    maxChapterLength: 6000,
    recommendedChapterLength: 4000,
    minTotalLength: 100000,
    allowedRatings: ['전체', '15세', '19세'],
    specialRequirements: [
      '로맨스 장르 강세',
      '신인 데뷔 용이',
      '공모전 다수',
      '비독점 가능'
    ],
    advantages: ['로맨스 독자층', '신인 친화'],
    disadvantages: ['단가 낮음', '플랫폼 규모 작음']
  },
  'novelpia': {
    name: '노벨피아',
    minChapterLength: 2000,
    maxChapterLength: 5000,
    recommendedChapterLength: 3500,
    minTotalLength: 50000,
    allowedRatings: ['전체', '15세', '19세'],
    specialRequirements: [
      '신인 친화적',
      '다양한 장르',
      '자유 연재',
      '후원 시스템'
    ],
    advantages: ['진입 장벽 낮음', '자유도 높음'],
    disadvantages: ['수익 불안정', '노출 어려움']
  },
  'traditional-publisher': {
    name: '전통 출판사',
    minChapterLength: 10000,
    maxChapterLength: 30000,
    recommendedChapterLength: 15000,
    minTotalLength: 300000,
    allowedRatings: ['전체', '청소년', '성인'],
    specialRequirements: [
      '완결 원고 필수',
      '출판사별 투고 규정',
      '긴 검토 기간 (3-6개월)',
      '퇴고 완료 상태'
    ],
    advantages: ['브랜드 가치', '오프라인 유통', '마케팅 지원'],
    disadvantages: ['진입 어려움', '낮은 인세율', '긴 과정']
  },
  'self-publish-ebook': {
    name: '전자책 자가출판',
    minChapterLength: 5000,
    maxChapterLength: 20000,
    recommendedChapterLength: 10000,
    minTotalLength: 100000,
    allowedRatings: ['전체', '15세', '19세'],
    specialRequirements: [
      'EPUB 제작 필요',
      '커버 디자인 필요',
      'ISBN 등록 선택',
      '마케팅 자체 수행'
    ],
    advantages: ['높은 수익률', '완전한 통제', '빠른 출간'],
    disadvantages: ['마케팅 부담', '초기 비용', '신뢰도']
  },
  'self-publish-print': {
    name: '종이책 자가출판',
    minChapterLength: 10000,
    maxChapterLength: 30000,
    recommendedChapterLength: 15000,
    minTotalLength: 200000,
    allowedRatings: ['전체', '청소년', '성인'],
    specialRequirements: [
      '인쇄용 PDF 필요',
      '커버 디자인 (표지/후면)',
      'ISBN 등록 필수',
      '재고 관리/배송'
    ],
    advantages: ['물리적 책', '선물/판매용', '소장 가치'],
    disadvantages: ['초기 비용 높음', '재고 리스크', '유통 어려움']
  }
};

// ============================================================================
// 출판 준비 체크리스트 시스템
// ============================================================================

export class PublishReadinessSystem {

  /**
   * 전체 출판 준비도 평가
   */
  generateFullAssessmentPrompt(
    manuscript: {
      title: string;
      genre: string;
      synopsis: string;
      chapters: { title: string; content: string }[];
      characters: { name: string; profile: string }[];
      worldSetting: string;
      keywords: string[];
    },
    targetPlatform: PublishingPlatform
  ): string {
    const stats = this.calculateManuscriptStats(manuscript.chapters);
    const platformReqs = PLATFORM_REQUIREMENTS[targetPlatform];

    return `당신은 전문 출판 에디터입니다. 다음 원고의 출판 준비도를 종합 평가하세요.

═══════════════════════════════════════════════════════════════
                    📚 출판 준비도 종합 평가
═══════════════════════════════════════════════════════════════

【작품 정보】
제목: ${manuscript.title}
장르: ${manuscript.genre}
타겟 플랫폼: ${platformReqs.name}

【원고 통계】
- 총 글자 수: ${stats.totalCharacters.toLocaleString()}자
- 챕터 수: ${stats.chapterCount}개
- 평균 챕터 길이: ${stats.averageChapterLength.toLocaleString()}자
- 대화 비율: ${(stats.dialogueRatio * 100).toFixed(1)}%

【플랫폼 요구사항】
- 권장 챕터 길이: ${platformReqs.recommendedChapterLength.toLocaleString()}자
- 최소 총 분량: ${platformReqs.minTotalLength.toLocaleString()}자
- 특수 요구사항: ${platformReqs.specialRequirements.join(', ')}

【시놉시스】
${manuscript.synopsis}

【세계관 설정】
${manuscript.worldSetting}

【캐릭터 목록】
${manuscript.characters.map(c => `- ${c.name}: ${c.profile.substring(0, 100)}...`).join('\n')}

═══════════════════════════════════════════════════════════════

다음 항목을 상세히 평가하세요:

## 1. 원고 품질 (25점)
□ 맞춤법/문법 (10점)
□ 문장 품질 (5점)
□ 시점 일관성 (5점)
□ 대화문 품질 (5점)

## 2. 스토리 완결성 (25점)
□ 플롯 완결성 (10점)
□ 복선 회수 (5점)
□ 캐릭터 아크 (5점)
□ 감정적 만족도 (5점)

## 3. 일관성 (20점)
□ 캐릭터 일관성 (10점)
□ 세계관 일관성 (10점)

## 4. 시장 준비도 (20점)
□ 분량 적절성 (5점)
□ 훅 효과성 (5점)
□ 장르 컨벤션 (5점)
□ 제목/시놉시스 (5점)

## 5. 플랫폼 적합성 (10점)
□ ${platformReqs.name} 요구사항 충족

═══════════════════════════════════════════════════════════════

출력 형식:

### 📊 종합 점수: [점수]/100

### 📈 준비도 레벨: [ready/nearly-ready/needs-work/major-revision]

### ✅ 강점
1. [강점 1]
2. [강점 2]
3. [강점 3]

### ⚠️ 치명적 이슈 (반드시 수정)
1. [이슈] - [해결 방안]

### 📝 권장 수정 사항
1. [항목] - [구체적 수정 방안]

### 🎯 플랫폼별 적합도
- ${platformReqs.name}: [점수]/100
- 대안 플랫폼: [추천]

### ⏱️ 예상 수정 기간
[추정 기간과 근거]

### 📋 출판 전 최종 체크리스트
□ [항목 1]
□ [항목 2]
...`;
  }

  /**
   * 원고 통계 계산
   */
  calculateManuscriptStats(chapters: { title: string; content: string }[]): ManuscriptStats {
    let totalCharacters = 0;
    let totalWords = 0;
    let dialogueCount = 0;
    let totalDialogueLength = 0;

    for (const chapter of chapters) {
      totalCharacters += chapter.content.length;
      totalWords += chapter.content.split(/\s+/).filter(w => w.length > 0).length;

      // 대화 비율 계산
      const dialogueMatches = chapter.content.match(/"[^"]*"|"[^"]*"/g) || [];
      for (const dialogue of dialogueMatches) {
        dialogueCount++;
        totalDialogueLength += dialogue.length;
      }
    }

    return {
      totalCharacters,
      totalWords,
      chapterCount: chapters.length,
      averageChapterLength: Math.round(totalCharacters / chapters.length),
      dialogueRatio: totalCharacters > 0 ? totalDialogueLength / totalCharacters : 0,
      descriptionRatio: 0.4, // 추정값
      actionRatio: 0.2 // 추정값
    };
  }

  /**
   * 특정 체크리스트 항목 검사 프롬프트 생성
   */
  generateChecklistItemPrompt(
    item: PublishingChecklistItem,
    context: Record<string, string>
  ): string {
    if (!item.checkPrompt) {
      return '';
    }

    let prompt = item.checkPrompt;
    for (const [key, value] of Object.entries(context)) {
      prompt = prompt.replace(`{${key}}`, value);
    }

    return `${prompt}

═══════════════════════════════════════════════════════════════

평가 항목: ${item.name}
중요도: ${item.importance}
통과 기준: ${item.passCriteria}

출력 형식:
{
  "passed": true/false,
  "score": 0-100,
  "details": "상세 분석 내용",
  "issues": ["발견된 문제 1", "발견된 문제 2"],
  "suggestions": ["개선 제안 1", "개선 제안 2"]
}`;
  }

  /**
   * 플랫폼 적합성 분석 프롬프트
   */
  generatePlatformAnalysisPrompt(
    manuscript: {
      title: string;
      genre: string;
      synopsis: string;
      totalCharacters: number;
      chapterCount: number;
      averageChapterLength: number;
      contentRating: string;
    }
  ): string {
    const platforms = Object.entries(PLATFORM_REQUIREMENTS);

    return `다음 작품의 플랫폼별 적합도를 분석하세요.

【작품 정보】
제목: ${manuscript.title}
장르: ${manuscript.genre}
시놉시스: ${manuscript.synopsis}

【원고 통계】
- 총 글자 수: ${manuscript.totalCharacters.toLocaleString()}자
- 챕터 수: ${manuscript.chapterCount}개
- 평균 챕터 길이: ${manuscript.averageChapterLength.toLocaleString()}자
- 콘텐츠 등급: ${manuscript.contentRating}

【플랫폼 목록】
${platforms.map(([id, p]) => `
## ${p.name}
- 권장 챕터 길이: ${p.recommendedChapterLength.toLocaleString()}자
- 최소 총 분량: ${p.minTotalLength.toLocaleString()}자
- 허용 등급: ${p.allowedRatings.join(', ')}
- 장점: ${p.advantages.join(', ')}
- 단점: ${p.disadvantages.join(', ')}
`).join('\n')}

═══════════════════════════════════════════════════════════════

각 플랫폼별로 다음을 분석하세요:

1. 적합도 점수 (0-100)
2. 충족 요구사항
3. 미충족 요구사항
4. 추천 이유 또는 비추천 이유
5. 성공 가능성

출력 형식:
{
  "recommendations": [
    {
      "platform": "플랫폼명",
      "score": 점수,
      "metRequirements": ["충족 1", "충족 2"],
      "unmetRequirements": ["미충족 1"],
      "recommendation": "추천/비추천 이유",
      "tips": ["성공 팁 1", "성공 팁 2"]
    }
  ],
  "bestMatch": "최적 플랫폼",
  "reasoning": "선정 이유"
}`;
  }

  /**
   * 최종 출판 체크리스트 생성
   */
  generateFinalChecklistPrompt(
    platform: PublishingPlatform,
    completedChecks: string[]
  ): string {
    const platformReqs = PLATFORM_REQUIREMENTS[platform];
    const allItems = PUBLISHING_CHECKLIST;
    const criticalItems = allItems.filter(i => i.importance === 'critical');
    const highItems = allItems.filter(i => i.importance === 'high');

    return `${platformReqs.name} 출판을 위한 최종 체크리스트를 생성하세요.

【플랫폼 요구사항】
${platformReqs.specialRequirements.map(r => `- ${r}`).join('\n')}

【완료된 검사】
${completedChecks.map(c => `✅ ${c}`).join('\n')}

【필수 검사 항목 (Critical)】
${criticalItems.map(i => `□ ${i.name}: ${i.description}`).join('\n')}

【중요 검사 항목 (High)】
${highItems.map(i => `□ ${i.name}: ${i.description}`).join('\n')}

═══════════════════════════════════════════════════════════════

다음을 생성하세요:

## 📋 출판 전 최종 체크리스트

### 🔴 필수 완료 (출판 불가 항목)
1. [ ] 항목 - 확인 방법
...

### 🟡 강력 권장 (품질 영향)
1. [ ] 항목 - 확인 방법
...

### 🟢 선택 사항 (추가 개선)
1. [ ] 항목 - 확인 방법
...

### 📦 제출 준비물
1. [ ] 준비물 항목
...

### ⏰ 권장 일정
- D-7: [할 일]
- D-3: [할 일]
- D-1: [할 일]
- D-Day: [제출]`;
  }

  /**
   * 품질 인증서 생성 프롬프트
   */
  generateQualityCertificatePrompt(
    manuscript: {
      title: string;
      author: string;
      genre: string;
    },
    assessmentResults: {
      overallScore: number;
      categoryScores: Record<string, number>;
      strengths: string[];
      completedChecks: string[];
    }
  ): string {
    return `다음 작품의 AI 품질 인증서를 생성하세요.

【작품 정보】
제목: ${manuscript.title}
작가: ${manuscript.author}
장르: ${manuscript.genre}

【평가 결과】
종합 점수: ${assessmentResults.overallScore}/100
카테고리별 점수:
${Object.entries(assessmentResults.categoryScores)
  .map(([cat, score]) => `- ${cat}: ${score}/100`)
  .join('\n')}

【강점】
${assessmentResults.strengths.map(s => `- ${s}`).join('\n')}

【완료된 검사】
${assessmentResults.completedChecks.map(c => `✅ ${c}`).join('\n')}

═══════════════════════════════════════════════════════════════

다음 형식의 품질 인증서를 생성하세요:

╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║                    🏆 AI 품질 인증서                          ║
║                 AI Quality Certificate                       ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  작품명: [제목]                                               ║
║  작가: [작가명]                                               ║
║  장르: [장르]                                                 ║
║                                                              ║
║  ────────────────────────────────────────────                ║
║                                                              ║
║  📊 종합 품질 등급: [S/A/B/C]                                 ║
║  📈 종합 점수: [점수]/100                                     ║
║                                                              ║
║  ────────────────────────────────────────────                ║
║                                                              ║
║  ✅ 검증 완료 항목:                                           ║
║  • [항목 1]                                                   ║
║  • [항목 2]                                                   ║
║                                                              ║
║  ────────────────────────────────────────────                ║
║                                                              ║
║  🎯 특별 인정:                                                ║
║  [특별히 우수한 점]                                            ║
║                                                              ║
║  ────────────────────────────────────────────                ║
║                                                              ║
║  발급일: [날짜]                                               ║
║  인증 ID: [고유 ID]                                           ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝`;
  }

  /**
   * 카테고리별 체크리스트 가져오기
   */
  getChecklistByCategory(category: ChecklistCategory): PublishingChecklistItem[] {
    return PUBLISHING_CHECKLIST.filter(item => item.category === category);
  }

  /**
   * 중요도별 체크리스트 가져오기
   */
  getChecklistByImportance(importance: 'critical' | 'high' | 'medium' | 'low'): PublishingChecklistItem[] {
    return PUBLISHING_CHECKLIST.filter(item => item.importance === importance);
  }

  /**
   * 자동 검사 가능한 항목만 가져오기
   */
  getAutoCheckableItems(): PublishingChecklistItem[] {
    return PUBLISHING_CHECKLIST.filter(item => item.autoCheckable);
  }

  /**
   * 출판 준비도 레벨 결정
   */
  determineReadinessLevel(score: number): 'ready' | 'nearly-ready' | 'needs-work' | 'major-revision' {
    if (score >= 90) return 'ready';
    if (score >= 75) return 'nearly-ready';
    if (score >= 50) return 'needs-work';
    return 'major-revision';
  }

  /**
   * 수정 예상 시간 계산
   */
  estimateRevisionTime(
    readinessLevel: 'ready' | 'nearly-ready' | 'needs-work' | 'major-revision',
    criticalIssueCount: number,
    highIssueCount: number
  ): string {
    const baseTime: Record<string, number> = {
      'ready': 0,
      'nearly-ready': 3,
      'needs-work': 14,
      'major-revision': 30
    };

    const additionalDays = criticalIssueCount * 3 + highIssueCount * 1;
    const totalDays = baseTime[readinessLevel] + additionalDays;

    if (totalDays === 0) return '즉시 출판 가능';
    if (totalDays <= 3) return '1-3일 (최종 교정)';
    if (totalDays <= 7) return '1주일 (소규모 수정)';
    if (totalDays <= 14) return '1-2주 (중간 수정)';
    if (totalDays <= 30) return '2-4주 (대규모 수정)';
    return '1개월 이상 (전면 개고)';
  }
}

// 싱글톤 인스턴스
export const publishReadinessSystem = new PublishReadinessSystem();
