/**
 * AI 품질 보증 시스템 (QualityAssurance)
 *
 * AI 베타리더, 다중 평가자, 출판 기준 검증을 구현
 * - AI 베타리더 피드백
 * - 다중 관점 평가 (독자, 편집자, 평론가)
 * - 상업 출판 기준 체크리스트
 * - 품질 점수화 및 등급
 */

import { generateJSON, generateText } from './gemini';
import { GeminiModel } from '@/types';

// ============================================
// 평가자 페르소나
// ============================================

export type EvaluatorPersonaType =
  | 'casual-reader'
  | 'avid-reader'
  | 'critical-reader'
  | 'web-novel-editor'
  | 'literary-editor'
  | 'genre-critic'
  | 'market-analyst';

export interface EvaluatorPersona {
  id: EvaluatorPersonaType;
  name: string;
  type: 'reader' | 'editor' | 'critic' | 'market-analyst';
  description: string;
  evaluationFocus: string[];
  harshness: 1 | 2 | 3 | 4 | 5;  // 평가 엄격도
  genreExpertise?: string[];
}

export const EVALUATOR_PERSONAS: EvaluatorPersona[] = [
  // 독자 페르소나
  {
    id: 'casual-reader',
    name: '캐주얼 독자 (민지)',
    type: 'reader',
    description: '출퇴근길에 웹소설을 읽는 20대 직장인. 재미와 몰입감 중시.',
    evaluationFocus: ['재미', '몰입감', '페이지터너', '캐릭터 매력'],
    harshness: 2,
    genreExpertise: ['로맨스', '판타지'],
  },
  {
    id: 'avid-reader',
    name: '열혈 독자 (준혁)',
    type: 'reader',
    description: '하루에 1권 이상 읽는 독서광. 다양한 장르 섭렵.',
    evaluationFocus: ['신선함', '캐릭터 깊이', '플롯 완성도', '반전'],
    harshness: 3,
    genreExpertise: ['판타지', '무협', 'SF', '스릴러'],
  },
  {
    id: 'critical-reader',
    name: '비판적 독자 (서윤)',
    type: 'reader',
    description: '책 리뷰 블로거. 논리적 일관성과 문학성 중시.',
    evaluationFocus: ['논리성', '문장력', '주제 의식', '캐릭터 일관성'],
    harshness: 4,
  },

  // 편집자 페르소나
  {
    id: 'web-novel-editor',
    name: '웹소설 편집자 (재현)',
    type: 'editor',
    description: '대형 플랫폼 10년차 편집자. 상업성과 독자 반응에 민감.',
    evaluationFocus: ['후킹', '연재 분량', '클리프행어', '독자 이탈 포인트'],
    harshness: 4,
    genreExpertise: ['웹소설 전반'],
  },
  {
    id: 'literary-editor',
    name: '문학 편집자 (은주)',
    type: 'editor',
    description: '출판사 문학팀장. 문학성과 완성도 중시.',
    evaluationFocus: ['문장력', '구성', '테마', '독창성', '문학적 가치'],
    harshness: 5,
    genreExpertise: ['순수문학', '드라마'],
  },

  // 평론가 페르소나
  {
    id: 'genre-critic',
    name: '장르 평론가 (성민)',
    type: 'critic',
    description: '장르 문학 전문 평론가. 장르 규칙 준수와 혁신 평가.',
    evaluationFocus: ['장르 규칙', '클리셰 활용', '세계관', '캐릭터 아키타입'],
    harshness: 4,
  },

  // 시장 분석가
  {
    id: 'market-analyst',
    name: '시장 분석가 (현수)',
    type: 'market-analyst',
    description: '출판 시장 분석 전문가. 상업적 가능성 평가.',
    evaluationFocus: ['시장성', '타겟 적합성', '경쟁력', '플랫폼 적합성'],
    harshness: 3,
  },
];

// ============================================
// 평가 결과 타입
// ============================================

export interface EvaluationResult {
  evaluatorId: string;
  evaluatorName: string;
  evaluatorType: string;

  overallScore: number;  // 1-100

  categoryScores: {
    category: string;
    score: number;
    comments: string;
  }[];

  strengths: string[];
  weaknesses: string[];

  specificFeedback: {
    location?: string;
    issue: string;
    suggestion: string;
    priority: 'high' | 'medium' | 'low';
  }[];

  wouldRecommend: boolean;
  targetAudienceFit: number;

  quotableReview: string;  // 한 줄 평
}

export interface MultiEvaluationResult {
  text: string;
  evaluations: EvaluationResult[];

  consensusScore: number;
  consensusStrengths: string[];
  consensusWeaknesses: string[];

  divergentOpinions: {
    topic: string;
    opinions: { evaluator: string; opinion: string }[];
  }[];

  prioritizedImprovements: {
    improvement: string;
    mentionedBy: string[];
    priority: number;
  }[];

  publishReadiness: {
    isReady: boolean;
    remainingIssues: string[];
    estimatedWorkNeeded: string;
  };
}

// ============================================
// 품질 등급
// ============================================

export type QualityGrade = 'S' | 'A' | 'B' | 'C' | 'D' | 'F';

export interface QualityGrading {
  grade: QualityGrade;
  score: number;
  breakdown: {
    category: string;
    grade: QualityGrade;
    score: number;
  }[];
  gradeDescription: string;
  improvementPath: string;
}

// ============================================
// AI 베타리더 시스템 클래스
// ============================================

export class QualityAssuranceSystem {
  private evaluators: EvaluatorPersona[] = EVALUATOR_PERSONAS;

  /**
   * 단일 평가자로 평가
   */
  async evaluateWithPersona(
    apiKey: string,
    text: string,
    evaluator: EvaluatorPersona,
    context: { genre: string[]; targetAudience: string },
    model: GeminiModel = 'gemini-2.5-flash'
  ): Promise<EvaluationResult> {
    const prompt = `당신은 다음 페르소나로 소설을 평가합니다.

## 평가자 페르소나
- 이름: ${evaluator.name}
- 유형: ${evaluator.type}
- 설명: ${evaluator.description}
- 중점 평가 항목: ${evaluator.evaluationFocus.join(', ')}
- 평가 엄격도: ${evaluator.harshness}/5 (높을수록 엄격)
${evaluator.genreExpertise ? `- 전문 장르: ${evaluator.genreExpertise.join(', ')}` : ''}

## 작품 정보
- 장르: ${context.genre.join(', ')}
- 타겟 독자: ${context.targetAudience}

## 평가할 텍스트
${text.slice(0, 12000)}

## 평가 지침
- 해당 페르소나의 관점에서 솔직하게 평가
- 엄격도에 맞게 점수 조정
- 구체적이고 실행 가능한 피드백 제공
- 페르소나의 성격/말투 반영

## 응답 형식 (JSON)
{
  "evaluatorId": "${evaluator.id}",
  "evaluatorName": "${evaluator.name}",
  "evaluatorType": "${evaluator.type}",
  "overallScore": 1-100,
  "categoryScores": [
    {
      "category": "${evaluator.evaluationFocus[0]}",
      "score": 1-100,
      "comments": "상세 코멘트"
    }
  ],
  "strengths": ["강점1", "강점2"],
  "weaknesses": ["약점1", "약점2"],
  "specificFeedback": [
    {
      "location": "위치 (선택)",
      "issue": "문제점",
      "suggestion": "개선 제안",
      "priority": "high/medium/low"
    }
  ],
  "wouldRecommend": true/false,
  "targetAudienceFit": 1-100,
  "quotableReview": "한 줄 평 (페르소나 성격 반영)"
}

페르소나의 성격과 관점을 반영하여 평가하세요.
JSON만 출력하세요.`;

    try {
      return await generateJSON<EvaluationResult>(apiKey, prompt, {
        model,
        temperature: 0.6,
      });
    } catch (error) {
      console.error('[QualityAssurance] 평가 실패:', error);
      throw error;
    }
  }

  /**
   * 다중 평가자로 종합 평가
   */
  async evaluateWithMultiplePersonas(
    apiKey: string,
    text: string,
    context: { genre: string[]; targetAudience: string },
    evaluatorIds?: string[],
    model: GeminiModel = 'gemini-2.5-flash'
  ): Promise<MultiEvaluationResult> {
    // 평가자 선택
    const selectedEvaluators = evaluatorIds
      ? this.evaluators.filter(e => evaluatorIds.includes(e.id))
      : this.evaluators.slice(0, 4);  // 기본 4명

    // 병렬 평가 실행
    const evaluationPromises = selectedEvaluators.map(evaluator =>
      this.evaluateWithPersona(apiKey, text, evaluator, context, model)
    );

    const evaluations = await Promise.all(evaluationPromises);

    // 종합 분석
    return this.synthesizeEvaluations(text, evaluations);
  }

  /**
   * 평가 종합
   */
  private synthesizeEvaluations(
    text: string,
    evaluations: EvaluationResult[]
  ): MultiEvaluationResult {
    // 합의 점수 계산
    const scores = evaluations.map(e => e.overallScore);
    const consensusScore = scores.reduce((a, b) => a + b, 0) / scores.length;

    // 공통 강점 찾기
    const allStrengths = evaluations.flatMap(e => e.strengths);
    const strengthCounts = this.countOccurrences(allStrengths);
    const consensusStrengths = Object.entries(strengthCounts)
      .filter(([_, count]) => count >= 2)
      .map(([strength]) => strength);

    // 공통 약점 찾기
    const allWeaknesses = evaluations.flatMap(e => e.weaknesses);
    const weaknessCounts = this.countOccurrences(allWeaknesses);
    const consensusWeaknesses = Object.entries(weaknessCounts)
      .filter(([_, count]) => count >= 2)
      .map(([weakness]) => weakness);

    // 의견 차이 분석
    const divergentOpinions: MultiEvaluationResult['divergentOpinions'] = [];

    // 추천 여부 차이
    const recommendCounts = evaluations.filter(e => e.wouldRecommend).length;
    if (recommendCounts > 0 && recommendCounts < evaluations.length) {
      divergentOpinions.push({
        topic: '추천 여부',
        opinions: evaluations.map(e => ({
          evaluator: e.evaluatorName,
          opinion: e.wouldRecommend ? '추천함' : '추천하지 않음',
        })),
      });
    }

    // 우선 개선사항 정리
    const allFeedback = evaluations.flatMap(e =>
      e.specificFeedback.map(f => ({ ...f, evaluator: e.evaluatorName }))
    );

    const feedbackByIssue = new Map<string, { evaluators: string[]; priority: number }>();
    for (const feedback of allFeedback) {
      const existing = feedbackByIssue.get(feedback.issue);
      const priorityValue = feedback.priority === 'high' ? 3 : feedback.priority === 'medium' ? 2 : 1;
      if (existing) {
        existing.evaluators.push(feedback.evaluator);
        existing.priority = Math.max(existing.priority, priorityValue);
      } else {
        feedbackByIssue.set(feedback.issue, {
          evaluators: [feedback.evaluator],
          priority: priorityValue,
        });
      }
    }

    const prioritizedImprovements = Array.from(feedbackByIssue.entries())
      .map(([improvement, data]) => ({
        improvement,
        mentionedBy: data.evaluators,
        priority: data.priority,
      }))
      .sort((a, b) => b.priority - a.priority || b.mentionedBy.length - a.mentionedBy.length);

    // 출판 준비도 평가
    const isReady = consensusScore >= 75 && !consensusWeaknesses.some(w =>
      w.includes('치명적') || w.includes('심각') || w.includes('기본')
    );

    return {
      text: text.slice(0, 500) + '...',
      evaluations,
      consensusScore,
      consensusStrengths,
      consensusWeaknesses,
      divergentOpinions,
      prioritizedImprovements,
      publishReadiness: {
        isReady,
        remainingIssues: isReady ? [] : prioritizedImprovements.slice(0, 5).map(p => p.improvement),
        estimatedWorkNeeded: isReady
          ? '출판 준비 완료'
          : consensusScore >= 60
            ? '1-2회 수정 필요'
            : consensusScore >= 40
              ? '상당한 수정 필요'
              : '대폭 수정 또는 재작성 필요',
      },
    };
  }

  /**
   * 품질 등급 산정
   */
  async gradeQuality(
    apiKey: string,
    text: string,
    context: { genre: string[]; targetAudience: string },
    model: GeminiModel = 'gemini-2.5-flash'
  ): Promise<QualityGrading> {
    const prompt = `당신은 소설 품질 평가 시스템입니다.
다음 텍스트의 품질을 평가하고 등급을 매겨주세요.

## 텍스트
${text.slice(0, 10000)}

## 컨텍스트
- 장르: ${context.genre.join(', ')}
- 타겟: ${context.targetAudience}

## 평가 기준 및 등급

### 등급 기준
- S (90-100): 출판 준비 완료. 즉시 상업 출판 가능한 수준.
- A (80-89): 우수. 약간의 수정으로 출판 가능.
- B (70-79): 양호. 편집 과정을 거치면 출판 가능.
- C (60-69): 보통. 상당한 수정 필요.
- D (50-59): 미흡. 대폭 수정 필요.
- F (0-49): 재작성 필요.

### 평가 카테고리
1. 플롯/구조 (25%)
2. 캐릭터 (25%)
3. 문장력 (20%)
4. 독창성 (15%)
5. 장르 적합성 (15%)

## 응답 형식 (JSON)
{
  "grade": "S/A/B/C/D/F",
  "score": 1-100,
  "breakdown": [
    {
      "category": "플롯/구조",
      "grade": "등급",
      "score": 1-100
    }
  ],
  "gradeDescription": "이 등급을 받은 이유 설명",
  "improvementPath": "다음 등급으로 올라가기 위해 필요한 것"
}

솔직하고 정확하게 평가하세요.
JSON만 출력하세요.`;

    try {
      return await generateJSON<QualityGrading>(apiKey, prompt, {
        model,
        temperature: 0.3,
      });
    } catch (error) {
      console.error('[QualityAssurance] 등급 평가 실패:', error);
      throw error;
    }
  }

  /**
   * 출판 체크리스트 검증
   */
  async checkPublishingReadiness(
    apiKey: string,
    fullText: string,
    metadata: {
      title: string;
      genre: string[];
      wordCount: number;
      chapterCount: number;
    },
    model: GeminiModel = 'gemini-2.5-pro'
  ): Promise<{
    isReady: boolean;
    overallScore: number;

    checklist: {
      category: string;
      items: {
        item: string;
        passed: boolean;
        severity: 'blocker' | 'major' | 'minor';
        details: string;
      }[];
      categoryScore: number;
    }[];

    blockers: string[];
    warnings: string[];
    recommendations: string[];

    estimatedGrade: QualityGrade;
    nextSteps: string[];
  }> {
    const sampleText = this.extractSamples(fullText, 3);

    const prompt = `당신은 출판사의 원고 심사 담당자입니다.
다음 원고가 출판 기준을 충족하는지 체크리스트로 검증하세요.

## 작품 정보
- 제목: ${metadata.title}
- 장르: ${metadata.genre.join(', ')}
- 분량: ${metadata.wordCount.toLocaleString()}자 (${metadata.chapterCount}챕터)

## 샘플 텍스트
${sampleText}

## 출판 체크리스트

### 1. 기본 요건 (Blockers - 하나라도 실패하면 출판 불가)
- 맞춤법/문법 오류 비율 5% 이하
- 일관된 시점 유지
- 캐릭터 이름/설정 일관성
- 스토리 완결성 (열린 결말도 의도된 것이어야 함)
- 저작권 문제 없음 (표절/과도한 오마주 없음)

### 2. 품질 요건 (Major - 상당 부분 충족해야 함)
- 독자를 끌어당기는 오프닝
- 명확한 갈등 구조
- 캐릭터 발전/아크
- 페이싱 적절성
- 대화 자연스러움
- 장르 규칙 준수

### 3. 우수성 요건 (Minor - 차별화 요소)
- 독창적 설정/아이디어
- 깊이 있는 테마
- 뛰어난 문장력
- 감정적 공명
- 기억에 남는 장면

## 응답 형식 (JSON)
{
  "isReady": true/false,
  "overallScore": 1-100,
  "checklist": [
    {
      "category": "기본 요건",
      "items": [
        {
          "item": "항목명",
          "passed": true/false,
          "severity": "blocker/major/minor",
          "details": "상세 설명"
        }
      ],
      "categoryScore": 1-100
    }
  ],
  "blockers": ["출판 불가 사유 (있다면)"],
  "warnings": ["주의 사항"],
  "recommendations": ["개선 권고"],
  "estimatedGrade": "S/A/B/C/D/F",
  "nextSteps": ["다음 단계 제안"]
}

엄격하지만 공정하게 평가하세요.
JSON만 출력하세요.`;

    try {
      return await generateJSON<{
        isReady: boolean;
        overallScore: number;
        checklist: {
          category: string;
          items: {
            item: string;
            passed: boolean;
            severity: 'blocker' | 'major' | 'minor';
            details: string;
          }[];
          categoryScore: number;
        }[];
        blockers: string[];
        warnings: string[];
        recommendations: string[];
        estimatedGrade: QualityGrade;
        nextSteps: string[];
      }>(apiKey, prompt, {
        model,
        temperature: 0.2,
        maxTokens: 8000,
      });
    } catch (error) {
      console.error('[QualityAssurance] 출판 체크 실패:', error);
      throw error;
    }
  }

  /**
   * 경쟁작 대비 분석
   */
  async compareWithSuccessfulWorks(
    apiKey: string,
    text: string,
    genre: string[],
    model: GeminiModel = 'gemini-2.5-flash'
  ): Promise<{
    comparedTo: string[];
    overallComparison: string;
    strengthsVsMarket: string[];
    weaknessesVsMarket: string[];
    uniqueSellingPoints: string[];
    marketPositioning: string;
    improvementSuggestions: string[];
  }> {
    const prompt = `당신은 출판 시장 분석 전문가입니다.
다음 작품을 동일 장르의 성공작들과 비교 분석하세요.

## 분석할 작품 (샘플)
${text.slice(0, 8000)}

## 장르: ${genre.join(', ')}

## 비교 분석 항목
1. 이 장르의 최근 성공작들과 비교
2. 시장에서의 경쟁력
3. 차별화 포인트
4. 개선이 필요한 부분

## 응답 형식 (JSON)
{
  "comparedTo": ["비교 대상 작품들"],
  "overallComparison": "전체 비교 분석",
  "strengthsVsMarket": ["시장 대비 강점"],
  "weaknessesVsMarket": ["시장 대비 약점"],
  "uniqueSellingPoints": ["차별화 포인트"],
  "marketPositioning": "시장 포지셔닝 제안",
  "improvementSuggestions": ["개선 제안"]
}

JSON만 출력하세요.`;

    try {
      return await generateJSON<{
        comparedTo: string[];
        overallComparison: string;
        strengthsVsMarket: string[];
        weaknessesVsMarket: string[];
        uniqueSellingPoints: string[];
        marketPositioning: string;
        improvementSuggestions: string[];
      }>(apiKey, prompt, {
        model,
        temperature: 0.5,
      });
    } catch (error) {
      console.error('[QualityAssurance] 비교 분석 실패:', error);
      throw error;
    }
  }

  // ============================================
  // Helper Methods
  // ============================================

  private countOccurrences(arr: string[]): Record<string, number> {
    return arr.reduce((acc, item) => {
      // 유사한 항목 그룹화 (간단한 처리)
      const normalized = item.toLowerCase().trim();
      acc[item] = (acc[item] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private extractSamples(text: string, count: number): string {
    const parts = text.split(/(?=#{1,3}\s)|(?=\n\n)/);
    const samples: string[] = [];

    // 시작 부분
    samples.push(`[시작 부분]\n${text.slice(0, 2000)}`);

    // 중간 부분들
    if (parts.length > 2) {
      const middleIndex = Math.floor(parts.length / 2);
      samples.push(`[중간 부분]\n${parts.slice(middleIndex, middleIndex + 3).join('\n').slice(0, 2000)}`);
    }

    // 끝 부분
    samples.push(`[끝 부분]\n${text.slice(-2000)}`);

    return samples.slice(0, count).join('\n\n---\n\n');
  }

  /**
   * 평가자 목록 가져오기
   */
  getEvaluators(): EvaluatorPersona[] {
    return this.evaluators;
  }

  /**
   * 특정 유형의 평가자 가져오기
   */
  getEvaluatorsByType(type: EvaluatorPersona['type']): EvaluatorPersona[] {
    return this.evaluators.filter(e => e.type === type);
  }
}

// ============================================
// 내보내기
// ============================================

export const qualityAssuranceSystem = new QualityAssuranceSystem();
export default QualityAssuranceSystem;
