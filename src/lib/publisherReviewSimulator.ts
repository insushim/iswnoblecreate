/**
 * 출판사 심사 시뮬레이터 (PublisherReviewSimulator)
 *
 * 실제 출판사의 원고 심사 과정을 완전 시뮬레이션
 * - 1차 심사 (기본 필터링)
 * - 2차 심사 (편집위원회)
 * - 3차 심사 (출간 결정)
 * - 계약 및 출간 조건
 */

import { generateText, generateJSON } from './gemini';
import { GeminiModel } from '@/types';

// ============================================================================
// 출판사 타입 정의
// ============================================================================

export interface Publisher {
  id: string;
  name: string;
  type: PublisherType;
  prestige: 1 | 2 | 3 | 4 | 5;  // 명성
  genres: string[];
  annualPublications: number;
  acceptanceRate: number;  // 0-1
  reviewCriteria: ReviewCriteria;
  dealTerms: DealTerms;
  recentSuccesses: string[];
}

export type PublisherType =
  | 'major-literary'     // 대형 문학 출판사
  | 'major-commercial'   // 대형 상업 출판사
  | 'indie-literary'     // 독립 문학 출판사
  | 'genre-specialist'   // 장르 전문 출판사
  | 'web-novel-platform' // 웹소설 플랫폼
  | 'self-publish';      // 자가출판

export interface ReviewCriteria {
  literaryValue: number;      // 문학성 중요도 1-10
  commercialPotential: number; // 상업성 중요도 1-10
  originality: number;        // 독창성 중요도 1-10
  marketFit: number;          // 시장 적합성 1-10
  authorPotential: number;    // 작가 잠재력 1-10
  mustHaves: string[];
  dealBreakers: string[];
}

export interface DealTerms {
  advanceRange: [number, number];  // 선인세 범위
  royaltyRate: [number, number];   // 인세율 범위
  contractLength: number;          // 계약 기간 (년)
  rightsIncluded: string[];
  exclusivity: boolean;
}

// ============================================================================
// 심사 결과 타입 정의
// ============================================================================

export interface SubmissionResult {
  publisher: Publisher;
  submissionDate: string;
  manuscript: {
    title: string;
    genre: string;
    wordCount: number;
  };
  reviews: ReviewStage[];
  finalDecision: FinalDecision;
  feedback: PublisherFeedback;
  offerDetails: ContractOffer | null;
}

export interface ReviewStage {
  stage: 'first-read' | 'editorial-committee' | 'publication-decision';
  reviewer: string;
  date: string;
  passed: boolean;
  score: number;
  comments: string;
  concerns: string[];
  strengths: string[];
}

export interface FinalDecision {
  accepted: boolean;
  decisionType: 'accept' | 'accept-with-revision' | 'revise-resubmit' | 'reject';
  reasoning: string;
  competitivePosition: string;
  marketAnalysis: string;
}

export interface PublisherFeedback {
  overallImpression: string;
  whatWorked: string[];
  whatNeedsWork: string[];
  comparableTitles: string[];
  marketPositioning: string;
  suggestedRevisions: string[];
  encouragement: string;
}

export interface ContractOffer {
  advance: number;
  royaltyRate: number;
  printRun: number;
  marketingBudget: string;
  publicationTimeline: string;
  specialTerms: string[];
  negotiationPoints: string[];
}

// ============================================================================
// 출판사 프리셋
// ============================================================================

export const PUBLISHERS: Record<string, Publisher> = {
  'major-literary-1': {
    id: 'major-literary-1',
    name: '문학과지성사 (가상)',
    type: 'major-literary',
    prestige: 5,
    genres: ['순수문학', '현대소설', '시', '인문'],
    annualPublications: 200,
    acceptanceRate: 0.02,
    reviewCriteria: {
      literaryValue: 10,
      commercialPotential: 4,
      originality: 9,
      marketFit: 5,
      authorPotential: 8,
      mustHaves: ['문학적 가치', '독창적 목소리', '깊은 주제의식'],
      dealBreakers: ['클리셰', '얕은 전개', '상업적 계산'],
    },
    dealTerms: {
      advanceRange: [3000000, 10000000],
      royaltyRate: [0.10, 0.12],
      contractLength: 5,
      rightsIncluded: ['국내 출판', '전자책', '오디오북'],
      exclusivity: true,
    },
    recentSuccesses: ['올해의 문학상 수상작', '10만부 판매 소설'],
  },

  'major-commercial-1': {
    id: 'major-commercial-1',
    name: '민음사 (가상)',
    type: 'major-commercial',
    prestige: 5,
    genres: ['소설', '에세이', '인문', '과학'],
    annualPublications: 500,
    acceptanceRate: 0.05,
    reviewCriteria: {
      literaryValue: 7,
      commercialPotential: 8,
      originality: 7,
      marketFit: 8,
      authorPotential: 7,
      mustHaves: ['완성도', '시장성', '브랜드 적합성'],
      dealBreakers: ['품질 미달', '논란성 콘텐츠'],
    },
    dealTerms: {
      advanceRange: [5000000, 30000000],
      royaltyRate: [0.08, 0.12],
      contractLength: 3,
      rightsIncluded: ['국내 출판', '전자책', '해외판권'],
      exclusivity: true,
    },
    recentSuccesses: ['베스트셀러 다수', '영화화 작품'],
  },

  'genre-thriller': {
    id: 'genre-thriller',
    name: '엘릭시르 (가상)',
    type: 'genre-specialist',
    prestige: 4,
    genres: ['스릴러', '미스터리', '범죄소설', '호러'],
    annualPublications: 80,
    acceptanceRate: 0.08,
    reviewCriteria: {
      literaryValue: 5,
      commercialPotential: 9,
      originality: 8,
      marketFit: 9,
      authorPotential: 6,
      mustHaves: ['긴장감', '반전', '페이지터너'],
      dealBreakers: ['느린 전개', '약한 플롯', '예측 가능'],
    },
    dealTerms: {
      advanceRange: [2000000, 15000000],
      royaltyRate: [0.08, 0.10],
      contractLength: 3,
      rightsIncluded: ['국내 출판', '전자책'],
      exclusivity: true,
    },
    recentSuccesses: ['스릴러 베스트셀러', 'OTT 드라마화'],
  },

  'genre-romance': {
    id: 'genre-romance',
    name: '로맨틱노블 (가상)',
    type: 'genre-specialist',
    prestige: 3,
    genres: ['로맨스', '로맨스판타지', 'BL', 'GL'],
    annualPublications: 150,
    acceptanceRate: 0.12,
    reviewCriteria: {
      literaryValue: 4,
      commercialPotential: 9,
      originality: 6,
      marketFit: 10,
      authorPotential: 7,
      mustHaves: ['설렘', '매력적 캐릭터', '해피엔딩'],
      dealBreakers: ['비호감 주인공', '불쾌한 전개', '열린결말'],
    },
    dealTerms: {
      advanceRange: [1000000, 8000000],
      royaltyRate: [0.08, 0.10],
      contractLength: 3,
      rightsIncluded: ['국내 출판', '전자책', '웹툰화'],
      exclusivity: false,
    },
    recentSuccesses: ['웹툰화 베스트', '드라마 원작'],
  },

  'web-platform-kakao': {
    id: 'web-platform-kakao',
    name: '카카오페이지 (가상)',
    type: 'web-novel-platform',
    prestige: 4,
    genres: ['판타지', '로맨스', '무협', '현대물'],
    annualPublications: 3000,
    acceptanceRate: 0.15,
    reviewCriteria: {
      literaryValue: 3,
      commercialPotential: 10,
      originality: 5,
      marketFit: 10,
      authorPotential: 8,
      mustHaves: ['훅', '연재 적합성', '독자 반응 예상'],
      dealBreakers: ['느린 도입', '복잡한 설정', '비주류 취향'],
    },
    dealTerms: {
      advanceRange: [0, 5000000],
      royaltyRate: [0.50, 0.70],  // 플랫폼 수익 분배
      contractLength: 2,
      rightsIncluded: ['플랫폼 독점', 'IP 우선협상권'],
      exclusivity: true,
    },
    recentSuccesses: ['억대 조회수 작품', 'IP 사업 성공작'],
  },

  'indie-literary': {
    id: 'indie-literary',
    name: '은행나무 (가상)',
    type: 'indie-literary',
    prestige: 3,
    genres: ['순수문학', '실험소설', '신인'],
    annualPublications: 30,
    acceptanceRate: 0.10,
    reviewCriteria: {
      literaryValue: 9,
      commercialPotential: 3,
      originality: 10,
      marketFit: 4,
      authorPotential: 9,
      mustHaves: ['실험정신', '신선한 시도', '작가적 비전'],
      dealBreakers: ['상업적', '뻔함', '모방'],
    },
    dealTerms: {
      advanceRange: [500000, 3000000],
      royaltyRate: [0.10, 0.15],
      contractLength: 3,
      rightsIncluded: ['국내 출판'],
      exclusivity: false,
    },
    recentSuccesses: ['문학상 수상', '평단 호평'],
  },
};

// ============================================================================
// 출판사 심사 시뮬레이터 클래스
// ============================================================================

export class PublisherReviewSimulator {
  private model: GeminiModel = 'gemini-2.0-flash';

  setModel(model: GeminiModel): void {
    this.model = model;
  }

  /**
   * 출판사 투고 시뮬레이션
   */
  async simulateSubmission(
    publisherId: string,
    manuscript: {
      title: string;
      genre: string;
      synopsis: string;
      sampleChapters: string;
      wordCount: number;
      authorBio?: string;
    }
  ): Promise<SubmissionResult> {
    const publisher = PUBLISHERS[publisherId];
    if (!publisher) {
      throw new Error(`Unknown publisher: ${publisherId}`);
    }

    // 3단계 심사 시뮬레이션
    const firstRead = await this.simulateFirstRead(publisher, manuscript);
    const reviews: ReviewStage[] = [firstRead];

    let finalDecision: FinalDecision;
    let offerDetails: ContractOffer | null = null;

    if (!firstRead.passed) {
      finalDecision = {
        accepted: false,
        decisionType: 'reject',
        reasoning: '1차 심사 탈락',
        competitivePosition: '',
        marketAnalysis: '',
      };
    } else {
      const editorialReview = await this.simulateEditorialCommittee(publisher, manuscript, firstRead);
      reviews.push(editorialReview);

      if (!editorialReview.passed) {
        finalDecision = {
          accepted: false,
          decisionType: 'reject',
          reasoning: '편집위원회 심사 탈락',
          competitivePosition: '',
          marketAnalysis: '',
        };
      } else {
        const publishDecision = await this.simulatePublicationDecision(publisher, manuscript, reviews);
        reviews.push(publishDecision);

        if (publishDecision.passed) {
          finalDecision = {
            accepted: true,
            decisionType: publishDecision.score >= 85 ? 'accept' : 'accept-with-revision',
            reasoning: publishDecision.comments,
            competitivePosition: '',
            marketAnalysis: '',
          };
          offerDetails = await this.generateContractOffer(publisher, manuscript, reviews);
        } else {
          finalDecision = {
            accepted: false,
            decisionType: publishDecision.score >= 60 ? 'revise-resubmit' : 'reject',
            reasoning: publishDecision.comments,
            competitivePosition: '',
            marketAnalysis: '',
          };
        }
      }
    }

    const feedback = await this.generatePublisherFeedback(publisher, manuscript, reviews);

    return {
      publisher,
      submissionDate: new Date().toISOString(),
      manuscript: {
        title: manuscript.title,
        genre: manuscript.genre,
        wordCount: manuscript.wordCount,
      },
      reviews,
      finalDecision,
      feedback,
      offerDetails,
    };
  }

  /**
   * 1차 심사 (슬러시 파일)
   */
  private async simulateFirstRead(
    publisher: Publisher,
    manuscript: {
      title: string;
      genre: string;
      synopsis: string;
      sampleChapters: string;
    }
  ): Promise<ReviewStage> {
    const prompt = `당신은 ${publisher.name}의 1차 심사 담당자입니다.

【출판사 정보】
유형: ${publisher.type}
명성: ${publisher.prestige}/5
장르: ${publisher.genres.join(', ')}
연간 출판: ${publisher.annualPublications}권
채택률: ${(publisher.acceptanceRate * 100).toFixed(1)}%

【심사 기준】
- 문학성 중요도: ${publisher.reviewCriteria.literaryValue}/10
- 상업성 중요도: ${publisher.reviewCriteria.commercialPotential}/10
- 독창성 중요도: ${publisher.reviewCriteria.originality}/10
- 필수 요소: ${publisher.reviewCriteria.mustHaves.join(', ')}
- 탈락 요소: ${publisher.reviewCriteria.dealBreakers.join(', ')}

═══════════════════════════════════════════════════════════════

【투고 원고】
제목: ${manuscript.title}
장르: ${manuscript.genre}
시놉시스: ${manuscript.synopsis}

【샘플 원고 (첫 부분)】
${manuscript.sampleChapters.substring(0, 8000)}

═══════════════════════════════════════════════════════════════

1차 심사를 수행하세요.
실제 출판사의 1차 심사자처럼 냉정하게 판단하세요.

출력 형식 (JSON):
{
  "passed": true/false,
  "score": 1-100,
  "comments": "심사평",
  "concerns": ["우려 사항 1", "우려 사항 2"],
  "strengths": ["강점 1", "강점 2"],
  "recommendation": "2차 심사 회부 여부 및 이유"
}`;

    const result = await generateJSON<{
      passed: boolean;
      score: number;
      comments: string;
      concerns: string[];
      strengths: string[];
    }>(prompt, this.model);

    return {
      stage: 'first-read',
      reviewer: '1차 심사 담당자',
      date: new Date().toISOString(),
      ...result,
    };
  }

  /**
   * 2차 심사 (편집위원회)
   */
  private async simulateEditorialCommittee(
    publisher: Publisher,
    manuscript: {
      title: string;
      genre: string;
      synopsis: string;
      sampleChapters: string;
    },
    firstRead: ReviewStage
  ): Promise<ReviewStage> {
    const prompt = `당신은 ${publisher.name} 편집위원회입니다.

1차 심사를 통과한 원고를 검토합니다.

【1차 심사 결과】
점수: ${firstRead.score}
심사평: ${firstRead.comments}
강점: ${firstRead.strengths.join(', ')}
우려: ${firstRead.concerns.join(', ')}

【원고】
제목: ${manuscript.title}
장르: ${manuscript.genre}
시놉시스: ${manuscript.synopsis}

【샘플】
${manuscript.sampleChapters.substring(0, 10000)}

═══════════════════════════════════════════════════════════════

편집위원회로서 다음을 검토하세요:
1. 출판사 브랜드와의 적합성
2. 시장성/경쟁력
3. 편집/제작 투자 가치
4. 장기적 작가 관계 가능성

출력 형식 (JSON):
{
  "passed": true/false,
  "score": 1-100,
  "comments": "위원회 의견",
  "concerns": ["우려 사항"],
  "strengths": ["강점"],
  "marketAnalysis": "시장 분석",
  "competitorAnalysis": "경쟁작 분석"
}`;

    const result = await generateJSON<{
      passed: boolean;
      score: number;
      comments: string;
      concerns: string[];
      strengths: string[];
    }>(prompt, this.model);

    return {
      stage: 'editorial-committee',
      reviewer: '편집위원회',
      date: new Date().toISOString(),
      ...result,
    };
  }

  /**
   * 3차 심사 (출간 결정)
   */
  private async simulatePublicationDecision(
    publisher: Publisher,
    manuscript: {
      title: string;
      genre: string;
      synopsis: string;
      wordCount: number;
    },
    previousReviews: ReviewStage[]
  ): Promise<ReviewStage> {
    const prompt = `당신은 ${publisher.name}의 발행인/편집장입니다.

최종 출간 결정을 내립니다.

【이전 심사 결과】
${previousReviews.map(r => `
${r.stage}: ${r.score}점
- ${r.comments}
`).join('\n')}

【원고 정보】
제목: ${manuscript.title}
장르: ${manuscript.genre}
분량: ${manuscript.wordCount}자

【사업적 고려】
- 예상 초판 부수
- 마케팅 전략
- 손익분기점
- 브랜드 영향

출력 형식 (JSON):
{
  "passed": true/false,
  "score": 1-100,
  "comments": "최종 결정 및 이유",
  "concerns": ["최종 우려"],
  "strengths": ["결정적 강점"],
  "businessCase": "사업성 분석",
  "publicationPlan": "출간 계획 (승인 시)"
}`;

    const result = await generateJSON<{
      passed: boolean;
      score: number;
      comments: string;
      concerns: string[];
      strengths: string[];
    }>(prompt, this.model);

    return {
      stage: 'publication-decision',
      reviewer: '발행인/편집장',
      date: new Date().toISOString(),
      ...result,
    };
  }

  /**
   * 계약 조건 생성
   */
  private async generateContractOffer(
    publisher: Publisher,
    manuscript: {
      title: string;
      wordCount: number;
    },
    reviews: ReviewStage[]
  ): Promise<ContractOffer> {
    const avgScore = reviews.reduce((sum, r) => sum + r.score, 0) / reviews.length;
    const scoreRatio = avgScore / 100;

    const [minAdvance, maxAdvance] = publisher.dealTerms.advanceRange;
    const [minRoyalty, maxRoyalty] = publisher.dealTerms.royaltyRate;

    return {
      advance: Math.round(minAdvance + (maxAdvance - minAdvance) * scoreRatio),
      royaltyRate: minRoyalty + (maxRoyalty - minRoyalty) * scoreRatio,
      printRun: Math.round(3000 + 7000 * scoreRatio),
      marketingBudget: scoreRatio >= 0.8 ? '적극 마케팅' : scoreRatio >= 0.6 ? '표준 마케팅' : '최소 마케팅',
      publicationTimeline: '계약 후 6-12개월',
      specialTerms: [],
      negotiationPoints: ['선인세', '인세율', '2차 저작권'],
    };
  }

  /**
   * 출판사 피드백 생성
   */
  private async generatePublisherFeedback(
    publisher: Publisher,
    manuscript: {
      title: string;
      genre: string;
      synopsis: string;
    },
    reviews: ReviewStage[]
  ): Promise<PublisherFeedback> {
    const prompt = `${publisher.name}으로서 작가에게 보내는 피드백을 작성하세요.

【심사 결과 요약】
${reviews.map(r => `${r.stage}: ${r.score}점 - ${r.comments}`).join('\n')}

【원고】
제목: ${manuscript.title}
장르: ${manuscript.genre}
시놉시스: ${manuscript.synopsis}

출력 형식 (JSON):
{
  "overallImpression": "전체 인상",
  "whatWorked": ["좋았던 점 1", "좋았던 점 2"],
  "whatNeedsWork": ["개선 필요점 1", "개선 필요점 2"],
  "comparableTitles": ["비교 가능한 작품 1", "작품 2"],
  "marketPositioning": "시장 포지셔닝 조언",
  "suggestedRevisions": ["수정 제안 1", "수정 제안 2"],
  "encouragement": "작가에게 격려의 말"
}`;

    return await generateJSON<PublisherFeedback>(prompt, this.model);
  }

  /**
   * 장르에 맞는 출판사 추천
   */
  recommendPublishers(genre: string): Publisher[] {
    return Object.values(PUBLISHERS)
      .filter(p => p.genres.some(g => g.toLowerCase().includes(genre.toLowerCase())))
      .sort((a, b) => b.prestige - a.prestige);
  }

  /**
   * 여러 출판사에 동시 투고 시뮬레이션
   */
  async simulateMultipleSubmissions(
    publisherIds: string[],
    manuscript: {
      title: string;
      genre: string;
      synopsis: string;
      sampleChapters: string;
      wordCount: number;
    }
  ): Promise<SubmissionResult[]> {
    const submissions = publisherIds.map(id =>
      this.simulateSubmission(id, manuscript)
    );

    return Promise.all(submissions);
  }

  /**
   * 사용 가능한 출판사 목록
   */
  getAvailablePublishers(): Publisher[] {
    return Object.values(PUBLISHERS);
  }
}

// 싱글톤 인스턴스
export const publisherReviewSimulator = new PublisherReviewSimulator();
