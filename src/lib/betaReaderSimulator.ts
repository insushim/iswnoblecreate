/**
 * AI 베타리더 시뮬레이터 (BetaReaderSimulator)
 *
 * 실제 베타리더처럼 다양한 관점에서 원고 피드백
 * - 다양한 독자 유형 시뮬레이션
 * - 감정적 반응 추적
 * - 몰입도/이탈 포인트 분석
 * - 진정성 있는 독자 피드백
 */

import { generateText, generateJSON } from './gemini';
import { GeminiModel } from '@/types';

// ============================================================================
// 베타리더 타입 정의
// ============================================================================

export interface BetaReaderPersona {
  id: string;
  name: string;
  age: number;
  occupation: string;
  readingHabits: ReadingHabits;
  preferences: ReaderPreferences;
  personality: string;
  criticalNature: 1 | 2 | 3 | 4 | 5;  // 1=관대, 5=까다로움
  articulateness: 1 | 2 | 3 | 4 | 5;  // 표현력
  emotionalResponsiveness: 1 | 2 | 3 | 4 | 5;  // 감정 반응 정도
}

export interface ReadingHabits {
  booksPerMonth: number;
  preferredGenres: string[];
  readingTime: string;  // "출퇴근", "취침 전" 등
  readingDevice: string;
  pacePreference: 'slow-savorer' | 'moderate' | 'speed-reader';
}

export interface ReaderPreferences {
  lovesElements: string[];
  hatesElements: string[];
  dealBreakers: string[];  // 이게 있으면 책 덮음
  mustHaves: string[];     // 이게 없으면 아쉬움
}

// ============================================================================
// 피드백 타입 정의
// ============================================================================

export interface BetaReaderFeedback {
  reader: BetaReaderPersona;
  overallExperience: OverallReadingExperience;
  chapterByChapter: ChapterFeedback[];
  characterReactions: CharacterReaction[];
  emotionalJourney: EmotionalJourneyPoint[];
  engagementTracking: EngagementPoint[];
  specificFeedback: SpecificFeedback[];
  finalVerdict: FinalVerdict;
  wouldRecommendTo: string[];
  comparisons: string[];  // "~와 비슷한 느낌", "~을 좋아하면 좋아할 듯"
}

export interface OverallReadingExperience {
  enjoymentScore: number;  // 1-10
  emotionalImpactScore: number;
  pageturnerScore: number;
  memorabilityScore: number;
  oneLineReaction: string;
  elevatorPitch: string;  // 친구에게 이 책을 어떻게 설명할지
}

export interface ChapterFeedback {
  chapterNumber: number;
  chapterTitle: string;
  initialReaction: string;
  whatWorked: string[];
  whatDidntWork: string[];
  confusingParts: string[];
  favoriteMoment: string | null;
  worstMoment: string | null;
  pageturnerRating: number;  // 다음 장 넘기고 싶은 정도 1-10
  emotionsDuringReading: string[];
}

export interface CharacterReaction {
  characterName: string;
  firstImpression: string;
  evolutionOfFeeling: string[];
  likability: number;  // 1-10
  believability: number;
  relatability: number;
  memorability: number;
  wouldBeFriendsWith: boolean;
  annoyingTraits: string[];
  lovableTraits: string[];
}

export interface EmotionalJourneyPoint {
  location: string;  // 챕터/장면
  emotion: string;
  intensity: number;  // 1-10
  trigger: string;
  naturalOrForced: 'natural' | 'somewhat-forced' | 'forced';
}

export interface EngagementPoint {
  location: string;
  engagementLevel: number;  // 1-10
  action: 'kept-reading' | 'took-break' | 'almost-stopped' | 'couldn\'t-stop';
  reason: string;
}

export interface SpecificFeedback {
  type: 'positive' | 'negative' | 'suggestion' | 'confusion' | 'nitpick';
  location: string;
  quote?: string;
  feedback: string;
  importance: 'critical' | 'notable' | 'minor';
}

export interface FinalVerdict {
  wouldFinishReading: boolean;
  wouldReread: boolean;
  wouldRecommend: boolean;
  wouldBuy: boolean;
  starRating: number;  // 1-5
  reviewSummary: string;
  biggestStrength: string;
  biggestWeakness: string;
  ifAuthorAskedOneChange: string;
}

export interface SynthesizedFeedback {
  averageRating: number;
  consensus: {
    strengths: string[];
    weaknesses: string[];
    majorConcerns: string[];
    divisivePoints: string[];
  };
  prioritizedChanges: Array<{
    change: string;
    supportingReaders: number;
    impact: string;
  }>;
  overallRecommendation: string;
}

// ============================================================================
// 베타리더 페르소나 프리셋
// ============================================================================

export const BETA_READER_PERSONAS: Record<string, BetaReaderPersona> = {
  'casual-commuter': {
    id: 'casual-commuter',
    name: '김민지',
    age: 28,
    occupation: '마케팅 회사 대리',
    readingHabits: {
      booksPerMonth: 2,
      preferredGenres: ['로맨스', '로맨스판타지', '힐링'],
      readingTime: '출퇴근 지하철',
      readingDevice: '스마트폰',
      pacePreference: 'speed-reader',
    },
    preferences: {
      lovesElements: ['설렘', '케미', '해피엔딩', '달달함'],
      hatesElements: ['NTR', '암울함', '열린결말', '죽음'],
      dealBreakers: ['주인공 비호감', '너무 느린 전개'],
      mustHaves: ['매력적인 남주', '공감가는 여주'],
    },
    personality: '솔직하고 직설적. 재미없으면 바로 드롭.',
    criticalNature: 3,
    articulateness: 3,
    emotionalResponsiveness: 4,
  },

  'avid-fantasy-fan': {
    id: 'avid-fantasy-fan',
    name: '이준혁',
    age: 24,
    occupation: '대학원생',
    readingHabits: {
      booksPerMonth: 8,
      preferredGenres: ['판타지', '무협', 'SF', '게임판타지'],
      readingTime: '야간 (새벽까지)',
      readingDevice: '태블릿',
      pacePreference: 'speed-reader',
    },
    preferences: {
      lovesElements: ['성장', '시스템', '전투씬', '세계관', '먼치킨'],
      hatesElements: ['신파', '연애 위주', '현실물'],
      dealBreakers: ['세계관 모순', '주인공 찐따짓', '억지 전개'],
      mustHaves: ['통쾌함', '멋진 주인공'],
    },
    personality: '장르 전문가. 클리셰에 민감하고 독창성 중시.',
    criticalNature: 4,
    articulateness: 4,
    emotionalResponsiveness: 3,
  },

  'literary-connoisseur': {
    id: 'literary-connoisseur',
    name: '박서윤',
    age: 35,
    occupation: '국문과 강사',
    readingHabits: {
      booksPerMonth: 6,
      preferredGenres: ['순수문학', '역사소설', '심리소설'],
      readingTime: '주말 오후',
      readingDevice: '종이책',
      pacePreference: 'slow-savorer',
    },
    preferences: {
      lovesElements: ['문장력', '깊은 주제', '입체적 캐릭터', '여운'],
      hatesElements: ['클리셰', '과잉감정', '얕은 전개'],
      dealBreakers: ['문장력 부족', '설득력 없는 캐릭터'],
      mustHaves: ['문학적 가치', '새로운 시각'],
    },
    personality: '분석적이고 냉정함. 하지만 좋은 문장에는 진심으로 감동.',
    criticalNature: 5,
    articulateness: 5,
    emotionalResponsiveness: 4,
  },

  'emotional-reader': {
    id: 'emotional-reader',
    name: '최수아',
    age: 22,
    occupation: '간호대학생',
    readingHabits: {
      booksPerMonth: 4,
      preferredGenres: ['로맨스', '드라마', '가족물', 'BL'],
      readingTime: '취침 전',
      readingDevice: '스마트폰',
      pacePreference: 'moderate',
    },
    preferences: {
      lovesElements: ['감동', '눈물', '위로', '치유', '따뜻함'],
      hatesElements: ['잔인함', '공포', '냉소적'],
      dealBreakers: ['동물학대', '아이학대'],
      mustHaves: ['감정적 카타르시스'],
    },
    personality: '공감능력 뛰어남. 쉽게 울고 쉽게 웃음.',
    criticalNature: 2,
    articulateness: 4,
    emotionalResponsiveness: 5,
  },

  'picky-thriller-fan': {
    id: 'picky-thriller-fan',
    name: '정태민',
    age: 42,
    occupation: '변호사',
    readingHabits: {
      booksPerMonth: 3,
      preferredGenres: ['스릴러', '미스터리', '범죄소설'],
      readingTime: '휴일',
      readingDevice: '종이책',
      pacePreference: 'moderate',
    },
    preferences: {
      lovesElements: ['반전', '논리', '긴장감', '심리전'],
      hatesElements: ['억지 반전', '허술한 논리', '뻔한 범인'],
      dealBreakers: ['논리적 오류', '데우스 엑스 마키나'],
      mustHaves: ['페어플레이', '놀라운 반전'],
    },
    personality: '논리적, 분석적. 플롯홀 발견에 능함.',
    criticalNature: 5,
    articulateness: 5,
    emotionalResponsiveness: 2,
  },

  'teen-reader': {
    id: 'teen-reader',
    name: '한소율',
    age: 17,
    occupation: '고등학생',
    readingHabits: {
      booksPerMonth: 5,
      preferredGenres: ['로맨스', '판타지', '학원물', '이세계'],
      readingTime: '자투리 시간',
      readingDevice: '스마트폰',
      pacePreference: 'speed-reader',
    },
    preferences: {
      lovesElements: ['설렘', '웃김', '공감', '또래 캐릭터'],
      hatesElements: ['어른들 이야기', '복잡함', '우울함'],
      dealBreakers: ['지루함', '공감 안됨'],
      mustHaves: ['재미', '빠른 전개'],
    },
    personality: '솔직하고 직관적. 재미가 최우선.',
    criticalNature: 2,
    articulateness: 3,
    emotionalResponsiveness: 4,
  },
};

// ============================================================================
// AI 베타리더 시뮬레이터 클래스
// ============================================================================

export class BetaReaderSimulator {
  private model: GeminiModel = 'gemini-2.0-flash';

  setModel(model: GeminiModel): void {
    this.model = model;
  }

  /**
   * 단일 베타리더 피드백 생성
   */
  async generateFeedback(
    persona: BetaReaderPersona,
    manuscript: {
      title: string;
      genre: string;
      synopsis: string;
      chapters: { number: number; title: string; content: string }[];
    }
  ): Promise<BetaReaderFeedback> {
    const prompt = this.buildBetaReaderPrompt(persona, manuscript);

    const result = await generateJSON<{
      overallExperience: {
        enjoymentScore: number;
        emotionalImpactScore: number;
        pageturnerScore: number;
        memorabilityScore: number;
        oneLineReaction: string;
        elevatorPitch: string;
      };
      chapterFeedback: ChapterFeedback[];
      characterReactions: CharacterReaction[];
      emotionalJourney: EmotionalJourneyPoint[];
      engagementTracking: EngagementPoint[];
      specificFeedback: SpecificFeedback[];
      finalVerdict: FinalVerdict;
      wouldRecommendTo: string[];
      comparisons: string[];
    }>(prompt, this.model);

    return {
      reader: persona,
      overallExperience: {
        ...result.overallExperience,
        elevatorPitch: result.overallExperience.elevatorPitch,
      },
      chapterByChapter: result.chapterFeedback,
      characterReactions: result.characterReactions,
      emotionalJourney: result.emotionalJourney,
      engagementTracking: result.engagementTracking,
      specificFeedback: result.specificFeedback,
      finalVerdict: result.finalVerdict,
      wouldRecommendTo: result.wouldRecommendTo,
      comparisons: result.comparisons,
    };
  }

  /**
   * 다중 베타리더 피드백 (병렬 실행)
   */
  async generateMultipleFeedback(
    personaIds: string[],
    manuscript: {
      title: string;
      genre: string;
      synopsis: string;
      chapters: { number: number; title: string; content: string }[];
    }
  ): Promise<BetaReaderFeedback[]> {
    const personas = personaIds
      .map(id => BETA_READER_PERSONAS[id])
      .filter(Boolean);

    const feedbackPromises = personas.map(persona =>
      this.generateFeedback(persona, manuscript)
    );

    return Promise.all(feedbackPromises);
  }

  /**
   * 베타리더 피드백 종합 분석
   */
  async synthesizeFeedback(
    feedbacks: BetaReaderFeedback[]
  ): Promise<SynthesizedFeedback> {
    // 평균 평점 계산
    const averageRating = feedbacks.reduce(
      (sum, f) => sum + f.finalVerdict.starRating, 0
    ) / feedbacks.length;

    const prompt = `다음은 여러 베타리더들의 피드백입니다.
이를 종합 분석하세요.

【피드백 요약】
${feedbacks.map(f => `
## ${f.reader.name} (${f.reader.occupation}, ${f.reader.age}세)
- 선호: ${f.reader.preferences.lovesElements.join(', ')}
- 비선호: ${f.reader.preferences.hatesElements.join(', ')}
- 총점: ${f.finalVerdict.starRating}/5
- 강점: ${f.finalVerdict.biggestStrength}
- 약점: ${f.finalVerdict.biggestWeakness}
- 한마디: ${f.overallExperience.oneLineReaction}
`).join('\n')}

═══════════════════════════════════════════════════════════════

종합 분석:
1. 모두가 동의하는 강점
2. 모두가 동의하는 약점
3. 주요 우려사항
4. 의견이 갈리는 부분
5. 우선 수정해야 할 사항 (영향도 순)
6. 전체 권고사항

출력 형식 (JSON):
{
  "consensus": {
    "strengths": ["강점 1", "강점 2"],
    "weaknesses": ["약점 1", "약점 2"],
    "majorConcerns": ["주요 우려사항 1", "주요 우려사항 2"],
    "divisivePoints": ["의견 갈림 1", "의견 갈림 2"]
  },
  "prioritizedChanges": [
    {
      "change": "수정 사항",
      "supportingReaders": 지지하는 독자 수,
      "impact": "예상 영향"
    }
  ],
  "overallRecommendation": "종합 권고사항"
}`;

    const result = await generateJSON<{
      consensus: {
        strengths: string[];
        weaknesses: string[];
        majorConcerns: string[];
        divisivePoints: string[];
      };
      prioritizedChanges: Array<{
        change: string;
        supportingReaders: number;
        impact: string;
      }>;
      overallRecommendation: string;
    }>(prompt, this.model);

    return {
      averageRating,
      consensus: result.consensus,
      prioritizedChanges: result.prioritizedChanges,
      overallRecommendation: result.overallRecommendation
    };
  }

  /**
   * 실시간 읽기 반응 시뮬레이션
   */
  async simulateRealTimeReading(
    persona: BetaReaderPersona,
    content: string
  ): Promise<{
    reactions: { position: number; reaction: string; emotion: string }[];
    internalMonologue: string[];
    wouldContinue: boolean;
  }> {
    const prompt = `당신은 ${persona.name}입니다.
${persona.age}세, ${persona.occupation}

【당신의 독서 성향】
- 좋아하는 것: ${persona.preferences.lovesElements.join(', ')}
- 싫어하는 것: ${persona.preferences.hatesElements.join(', ')}
- 책 덮는 포인트: ${persona.preferences.dealBreakers.join(', ')}
- 성격: ${persona.personality}
- 감정 반응 정도: ${persona.emotionalResponsiveness}/5

═══════════════════════════════════════════════════════════════

다음 텍스트를 읽으면서 실시간으로 반응하세요.
마치 실제로 처음 읽는 것처럼, 읽으면서 드는 생각과 감정을 기록하세요.

【텍스트】
${content}

═══════════════════════════════════════════════════════════════

출력 형식 (JSON):
{
  "reactions": [
    {
      "position": 대략적 위치 (0-100%),
      "reaction": "즉각적 반응 (예: '오 뭐야', '헐', '좀 지루한데')",
      "emotion": "느끼는 감정"
    }
  ],
  "internalMonologue": [
    "읽으면서 든 생각 1",
    "읽으면서 든 생각 2"
  ],
  "wouldContinue": true/false,
  "overallFeeling": "전체적인 느낌"
}

자연스럽게, 실제 독자처럼 반응하세요.
너무 분석적이지 말고, 직관적으로.`;

    return await generateJSON(prompt, this.model);
  }

  /**
   * 베타리더 프롬프트 생성
   */
  private buildBetaReaderPrompt(
    persona: BetaReaderPersona,
    manuscript: {
      title: string;
      genre: string;
      synopsis: string;
      chapters: { number: number; title: string; content: string }[];
    }
  ): string {
    return `당신은 ${persona.name}입니다.
${persona.age}세, ${persona.occupation}

═══════════════════════════════════════════════════════════════
                    👤 독자 프로필
═══════════════════════════════════════════════════════════════

【독서 습관】
- 월 독서량: ${persona.readingHabits.booksPerMonth}권
- 선호 장르: ${persona.readingHabits.preferredGenres.join(', ')}
- 독서 시간: ${persona.readingHabits.readingTime}
- 독서 기기: ${persona.readingHabits.readingDevice}
- 독서 속도: ${persona.readingHabits.pacePreference}

【취향】
- 좋아하는 요소: ${persona.preferences.lovesElements.join(', ')}
- 싫어하는 요소: ${persona.preferences.hatesElements.join(', ')}
- 책 덮는 포인트: ${persona.preferences.dealBreakers.join(', ')}
- 필수 요소: ${persona.preferences.mustHaves.join(', ')}

【성격】
${persona.personality}
- 까다로움: ${persona.criticalNature}/5
- 표현력: ${persona.articulateness}/5
- 감정 반응: ${persona.emotionalResponsiveness}/5

═══════════════════════════════════════════════════════════════
                    📖 읽을 원고
═══════════════════════════════════════════════════════════════

【작품 정보】
제목: ${manuscript.title}
장르: ${manuscript.genre}
시놉시스: ${manuscript.synopsis}

【본문】
${manuscript.chapters.map(c => `
--- 챕터 ${c.number}: ${c.title} ---
${c.content.substring(0, 5000)}${c.content.length > 5000 ? '...(생략)' : ''}
`).join('\n')}

═══════════════════════════════════════════════════════════════
                    ✍️ 피드백 작성
═══════════════════════════════════════════════════════════════

이 원고를 처음부터 끝까지 읽었다고 가정하고,
${persona.name}으로서 솔직한 베타리더 피드백을 작성하세요.

⚠️ 중요:
- 당신은 ${persona.name}입니다. 그 사람처럼 생각하고 반응하세요.
- 분석적인 비평가가 아닌, 실제 독자로서 반응하세요.
- ${persona.criticalNature >= 4 ? '까다롭게 평가하세요.' : persona.criticalNature <= 2 ? '관대하게 평가하세요.' : '균형있게 평가하세요.'}
- 좋아하는 요소(${persona.preferences.lovesElements.slice(0, 3).join(', ')})가 있으면 긍정적으로, 싫어하는 요소(${persona.preferences.hatesElements.slice(0, 3).join(', ')})가 있으면 부정적으로 반응하세요.

출력 형식 (JSON):
{
  "overallExperience": {
    "enjoymentScore": 1-10,
    "emotionalImpactScore": 1-10,
    "pageturnerScore": 1-10,
    "memorabilityScore": 1-10,
    "oneLineReaction": "한 줄 반응 (예: '밤새 읽었어요!', '중간에 접었다가 겨우 끝냄')",
    "elevatorPitch": "친구에게 이 책을 소개한다면? (2-3문장)"
  },
  "chapterFeedback": [
    {
      "chapterNumber": 1,
      "chapterTitle": "제목",
      "initialReaction": "첫 반응",
      "whatWorked": ["좋았던 점"],
      "whatDidntWork": ["안 좋았던 점"],
      "confusingParts": ["헷갈렸던 부분"],
      "favoriteMoment": "최고의 순간",
      "worstMoment": "최악의 순간",
      "pageturnerRating": 1-10,
      "emotionsDuringReading": ["읽으면서 느낀 감정들"]
    }
  ],
  "characterReactions": [
    {
      "characterName": "캐릭터명",
      "firstImpression": "첫인상",
      "evolutionOfFeeling": ["감정 변화 과정"],
      "likability": 1-10,
      "believability": 1-10,
      "relatability": 1-10,
      "memorability": 1-10,
      "wouldBeFriendsWith": true/false,
      "annoyingTraits": ["짜증나는 점"],
      "lovableTraits": ["매력적인 점"]
    }
  ],
  "emotionalJourney": [
    {
      "location": "위치 (챕터/장면)",
      "emotion": "감정",
      "intensity": 1-10,
      "trigger": "감정을 유발한 것",
      "naturalOrForced": "natural/somewhat-forced/forced"
    }
  ],
  "engagementTracking": [
    {
      "location": "위치",
      "engagementLevel": 1-10,
      "action": "kept-reading/took-break/almost-stopped/couldn't-stop",
      "reason": "이유"
    }
  ],
  "specificFeedback": [
    {
      "type": "positive/negative/suggestion/confusion/nitpick",
      "location": "위치",
      "quote": "해당 부분 인용 (있으면)",
      "feedback": "피드백 내용",
      "importance": "critical/notable/minor"
    }
  ],
  "finalVerdict": {
    "wouldFinishReading": true/false,
    "wouldReread": true/false,
    "wouldRecommend": true/false,
    "wouldBuy": true/false,
    "starRating": 1-5,
    "reviewSummary": "리뷰 요약 (3-5문장)",
    "biggestStrength": "가장 큰 강점",
    "biggestWeakness": "가장 큰 약점",
    "ifAuthorAskedOneChange": "작가가 딱 하나만 고쳐달라면?"
  },
  "wouldRecommendTo": ["이런 사람에게 추천", "이런 사람에게 추천"],
  "comparisons": ["~와 비슷한 느낌", "~를 좋아하면 좋아할 듯"]
}`;
  }

  /**
   * 사용 가능한 베타리더 목록
   */
  getAvailableReaders(): BetaReaderPersona[] {
    return Object.values(BETA_READER_PERSONAS);
  }

  /**
   * 장르에 맞는 베타리더 추천
   */
  recommendReadersForGenre(genre: string): BetaReaderPersona[] {
    const genreLower = genre.toLowerCase();

    return Object.values(BETA_READER_PERSONAS).filter(persona => {
      const preferredGenres = persona.readingHabits.preferredGenres.map(g => g.toLowerCase());
      return preferredGenres.some(pg =>
        genreLower.includes(pg) || pg.includes(genreLower)
      );
    });
  }
}

// 싱글톤 인스턴스
export const betaReaderSimulator = new BetaReaderSimulator();
