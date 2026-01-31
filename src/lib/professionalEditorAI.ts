/**
 * AI 전문 편집자 시뮬레이터 (ProfessionalEditorAI)
 *
 * 실제 출판사 편집자의 역할을 완전히 대체
 * - 발전적 편집 (Developmental Editing)
 * - 라인 편집 (Line Editing)
 * - 카피 편집 (Copy Editing)
 * - 교정 (Proofreading)
 * - 편집자 피드백 & 수정 요청
 */

import { generateText, generateJSON } from './gemini';
import { GeminiModel } from '@/types';

// ============================================================================
// 편집자 페르소나 타입
// ============================================================================

export interface EditorPersona {
  id: string;
  name: string;
  title: string;
  experience: string;
  specialty: string[];
  editingStyle: EditingStyle;
  standards: QualityStandard[];
  petPeeves: string[];  // 편집자가 특히 싫어하는 것
  praises: string[];     // 편집자가 좋아하는 것
  communicationStyle: 'gentle' | 'direct' | 'encouraging' | 'strict';
}

export interface EditingStyle {
  thoroughness: 1 | 2 | 3 | 4 | 5;  // 꼼꼼함 정도
  preserveVoice: boolean;           // 작가 목소리 보존 중시
  focusAreas: string[];
  approach: 'surgical' | 'holistic' | 'balanced';
}

export interface QualityStandard {
  category: string;
  minimumLevel: string;
  idealLevel: string;
}

// ============================================================================
// 편집 결과 타입
// ============================================================================

export interface EditorialReport {
  overallAssessment: OverallAssessment;
  structuralAnalysis: StructuralAnalysis;
  lineEditSuggestions: LineEditSuggestion[];
  copyEditCorrections: CopyEditCorrection[];
  proofreadingFixes: ProofreadingFix[];
  editorLetter: string;  // 편집자 레터
  revisionRequests: RevisionRequest[];
  strengthsToPreserve: string[];
  prioritizedIssues: PrioritizedIssue[];
}

export interface OverallAssessment {
  publishabilityScore: number;  // 1-100
  publishabilityLevel: 'ready' | 'minor-revision' | 'major-revision' | 'significant-work' | 'not-ready';
  summary: string;
  keyStrengths: string[];
  criticalWeaknesses: string[];
}

export interface StructuralAnalysis {
  plotStructure: {
    assessment: string;
    issues: string[];
    suggestions: string[];
  };
  pacing: {
    assessment: string;
    slowSpots: string[];
    rushingSpots: string[];
  };
  characterArcs: {
    character: string;
    arcAssessment: string;
    issues: string[];
  }[];
  thematicCoherence: {
    assessment: string;
    strengthening: string[];
  };
}

export interface LineEditSuggestion {
  location: string;
  original: string;
  issue: string;
  suggestion: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: 'clarity' | 'flow' | 'voice' | 'impact' | 'redundancy' | 'show-dont-tell';
}

export interface CopyEditCorrection {
  location: string;
  original: string;
  corrected: string;
  ruleReference: string;
  category: 'grammar' | 'punctuation' | 'spelling' | 'consistency' | 'style-guide';
}

export interface ProofreadingFix {
  location: string;
  error: string;
  fix: string;
  errorType: 'typo' | 'spacing' | 'punctuation' | 'formatting';
}

export interface RevisionRequest {
  section: string;
  issue: string;
  requestedChange: string;
  reasoning: string;
  priority: 'must-fix' | 'strongly-recommend' | 'consider' | 'optional';
  exampleOfDesired?: string;
}

export interface PrioritizedIssue {
  rank: number;
  issue: string;
  impact: string;
  effort: 'low' | 'medium' | 'high';
  recommendation: string;
}

// ============================================================================
// 편집자 페르소나 프리셋
// ============================================================================

export const EDITOR_PERSONAS: Record<string, EditorPersona> = {
  'traditional-literary': {
    id: 'traditional-literary',
    name: '김수현 편집장',
    title: '문학출판사 편집장',
    experience: '20년차 문학 편집자. 한국문학상 수상작 다수 편집.',
    specialty: ['순수문학', '현대소설', '문학성 높은 작품'],
    editingStyle: {
      thoroughness: 5,
      preserveVoice: true,
      focusAreas: ['문장력', '주제의식', '문학적 가치', '독창성'],
      approach: 'holistic',
    },
    standards: [
      { category: '문장', minimumLevel: '문법적 오류 0', idealLevel: '문학적 울림이 있는 문장' },
      { category: '구성', minimumLevel: '논리적 흐름', idealLevel: '예술적 구조' },
      { category: '캐릭터', minimumLevel: '일관성', idealLevel: '입체적이고 기억에 남는' },
    ],
    petPeeves: ['클리셰', '과잉 감정', '설명하기', '작가의 개입', '진부한 비유'],
    praises: ['절제된 문장', '여백의 미', '신선한 시각', '섬세한 심리'],
    communicationStyle: 'direct',
  },

  'commercial-fiction': {
    id: 'commercial-fiction',
    name: '박지영 팀장',
    title: '대형 출판사 상업소설 편집팀장',
    experience: '15년차. 베스트셀러 50권 이상 편집.',
    specialty: ['스릴러', '로맨스', '장르소설', '대중소설'],
    editingStyle: {
      thoroughness: 4,
      preserveVoice: true,
      focusAreas: ['가독성', '몰입감', '페이지터너', '상업성'],
      approach: 'balanced',
    },
    standards: [
      { category: '훅', minimumLevel: '관심 유발', idealLevel: '첫 문장에 낚임' },
      { category: '페이싱', minimumLevel: '지루하지 않음', idealLevel: '쉴 틈 없이 끌려감' },
      { category: '결말', minimumLevel: '마무리됨', idealLevel: '여운과 만족감' },
    ],
    petPeeves: ['느린 시작', '늘어지는 중반', '예측 가능한 전개', '약한 동기'],
    praises: ['강렬한 오프닝', '예상치 못한 반전', '매력적인 캐릭터', '긴장감'],
    communicationStyle: 'encouraging',
  },

  'web-novel-platform': {
    id: 'web-novel-platform',
    name: '최현우 PD',
    title: '웹소설 플랫폼 콘텐츠 PD',
    experience: '10년차. 억대 조회수 작품 다수 담당.',
    specialty: ['웹소설', '판타지', '로맨스판타지', '연재물'],
    editingStyle: {
      thoroughness: 3,
      preserveVoice: true,
      focusAreas: ['후킹', '연재 리듬', '독자 반응', '클리프행어'],
      approach: 'surgical',
    },
    standards: [
      { category: '회당 분량', minimumLevel: '3,000자 이상', idealLevel: '4,000-5,000자' },
      { category: '끊기', minimumLevel: '다음화 기대', idealLevel: '당장 읽고 싶은 마무리' },
      { category: '캐릭터 매력', minimumLevel: '호감', idealLevel: '팬덤 형성' },
    ],
    petPeeves: ['느린 도입', '복잡한 문장', '과도한 설정 설명', '비호감 주인공'],
    praises: ['빠른 전개', '사이다', '케미', '성장', '먼치킨'],
    communicationStyle: 'direct',
  },

  'meticulous-copyeditor': {
    id: 'meticulous-copyeditor',
    name: '이은정 교정교열사',
    title: '프리랜서 교정교열 전문가',
    experience: '25년차. 수백 권 교정. 완벽주의자.',
    specialty: ['교정', '교열', '문법', '일관성'],
    editingStyle: {
      thoroughness: 5,
      preserveVoice: true,
      focusAreas: ['맞춤법', '띄어쓰기', '일관성', '가독성'],
      approach: 'surgical',
    },
    standards: [
      { category: '맞춤법', minimumLevel: '오류 0', idealLevel: '오류 0' },
      { category: '일관성', minimumLevel: '용어 통일', idealLevel: '스타일 완전 통일' },
      { category: '포맷', minimumLevel: '기본 준수', idealLevel: '출판 규격 완벽' },
    ],
    petPeeves: ['띄어쓰기 오류', '조사 오용', '외래어 표기 오류', '일관성 없음'],
    praises: ['깔끔한 문장', '정확한 표현', '꼼꼼한 디테일'],
    communicationStyle: 'strict',
  },
};

// ============================================================================
// AI 전문 편집자 클래스
// ============================================================================

export class ProfessionalEditorAI {
  private persona: EditorPersona;
  private model: GeminiModel = 'gemini-2.0-flash';
  private editHistory: EditorialReport[] = [];

  constructor(personaId: string = 'traditional-literary') {
    this.persona = EDITOR_PERSONAS[personaId] || EDITOR_PERSONAS['traditional-literary'];
  }

  setPersona(personaId: string): void {
    this.persona = EDITOR_PERSONAS[personaId] || this.persona;
  }

  setModel(model: GeminiModel): void {
    this.model = model;
  }

  /**
   * 전체 원고 종합 편집 리포트
   */
  async generateFullEditorialReport(
    manuscript: {
      title: string;
      genre: string;
      synopsis: string;
      chapters: { title: string; content: string }[];
      targetAudience: string;
    }
  ): Promise<EditorialReport> {
    // 병렬로 여러 분석 실행
    const [
      overallResult,
      structuralResult,
      lineEditResult,
    ] = await Promise.all([
      this.assessOverallQuality(manuscript),
      this.analyzeStructure(manuscript),
      this.performLineEdit(manuscript.chapters.map(c => c.content).join('\n\n---\n\n')),
    ]);

    const editorLetter = await this.writeEditorLetter(
      manuscript,
      overallResult,
      structuralResult
    );

    const report: EditorialReport = {
      overallAssessment: overallResult,
      structuralAnalysis: structuralResult,
      lineEditSuggestions: lineEditResult.suggestions,
      copyEditCorrections: [],  // 별도 실행 필요
      proofreadingFixes: [],    // 별도 실행 필요
      editorLetter,
      revisionRequests: this.generateRevisionRequests(overallResult, structuralResult),
      strengthsToPreserve: overallResult.keyStrengths,
      prioritizedIssues: this.prioritizeIssues(overallResult, structuralResult),
    };

    this.editHistory.push(report);
    return report;
  }

  /**
   * 전체 품질 평가
   */
  private async assessOverallQuality(
    manuscript: {
      title: string;
      genre: string;
      synopsis: string;
      chapters: { title: string; content: string }[];
    }
  ): Promise<OverallAssessment> {
    const sampleContent = manuscript.chapters.slice(0, 3).map(c => c.content).join('\n\n');

    const prompt = `당신은 ${this.persona.name}, ${this.persona.title}입니다.
${this.persona.experience}

【편집 스타일】
- 꼼꼼함: ${this.persona.editingStyle.thoroughness}/5
- 집중 영역: ${this.persona.editingStyle.focusAreas.join(', ')}
- 접근법: ${this.persona.editingStyle.approach}

【기준】
${this.persona.standards.map(s => `- ${s.category}: 최소 "${s.minimumLevel}", 이상적 "${s.idealLevel}"`).join('\n')}

【싫어하는 것】 ${this.persona.petPeeves.join(', ')}
【좋아하는 것】 ${this.persona.praises.join(', ')}

═══════════════════════════════════════════════════════════════

【평가 대상 원고】
제목: ${manuscript.title}
장르: ${manuscript.genre}
시놉시스: ${manuscript.synopsis}

【본문 샘플 (앞부분)】
${sampleContent.substring(0, 15000)}

═══════════════════════════════════════════════════════════════

이 원고가 출판 가능한 수준인지 냉정하게 평가하세요.
실제 출판사에서 이 원고를 받았다고 가정하고 판단하세요.

출력 형식 (JSON):
{
  "publishabilityScore": 1-100점,
  "publishabilityLevel": "ready/minor-revision/major-revision/significant-work/not-ready",
  "summary": "전체 평가 요약 (2-3문장)",
  "keyStrengths": ["강점 1", "강점 2", "강점 3"],
  "criticalWeaknesses": ["치명적 약점 1", "약점 2"],
  "detailedAssessment": {
    "writing": { "score": 점수, "comment": "평가" },
    "story": { "score": 점수, "comment": "평가" },
    "characters": { "score": 점수, "comment": "평가" },
    "marketability": { "score": 점수, "comment": "평가" }
  }
}`;

    const result = await generateJSON<{
      publishabilityScore: number;
      publishabilityLevel: 'ready' | 'minor-revision' | 'major-revision' | 'significant-work' | 'not-ready';
      summary: string;
      keyStrengths: string[];
      criticalWeaknesses: string[];
    }>(prompt, this.model);

    return result;
  }

  /**
   * 구조 분석
   */
  private async analyzeStructure(
    manuscript: {
      title: string;
      chapters: { title: string; content: string }[];
    }
  ): Promise<StructuralAnalysis> {
    const chapterSummaries = manuscript.chapters.map((c, i) =>
      `챕터 ${i + 1}: ${c.title}\n내용 요약: ${c.content.substring(0, 500)}...`
    ).join('\n\n');

    const prompt = `당신은 ${this.persona.name}입니다.
${this.persona.experience}

【원고 구조】
${chapterSummaries}

═══════════════════════════════════════════════════════════════

구조적 분석을 수행하세요:

1. **플롯 구조**: 3막 구조, 영웅의 여정 등 관점에서 분석
2. **페이싱**: 느린 부분, 급한 부분 식별
3. **캐릭터 아크**: 주요 캐릭터들의 성장/변화 분석
4. **주제적 일관성**: 작품이 전달하는 메시지의 일관성

출력 형식 (JSON):
{
  "plotStructure": {
    "assessment": "플롯 구조 평가",
    "issues": ["이슈 1", "이슈 2"],
    "suggestions": ["제안 1", "제안 2"]
  },
  "pacing": {
    "assessment": "페이싱 평가",
    "slowSpots": ["느린 부분 1 (위치와 설명)"],
    "rushingSpots": ["급한 부분 1 (위치와 설명)"]
  },
  "characterArcs": [
    {
      "character": "캐릭터명",
      "arcAssessment": "아크 평가",
      "issues": ["이슈"]
    }
  ],
  "thematicCoherence": {
    "assessment": "주제 일관성 평가",
    "strengthening": ["강화 방안 1"]
  }
}`;

    return await generateJSON<StructuralAnalysis>(prompt, this.model);
  }

  /**
   * 라인 편집 수행
   */
  private async performLineEdit(
    content: string
  ): Promise<{ suggestions: LineEditSuggestion[] }> {
    const prompt = `당신은 ${this.persona.name}입니다.
${this.persona.experience}

【싫어하는 것】 ${this.persona.petPeeves.join(', ')}

═══════════════════════════════════════════════════════════════

【편집 대상 텍스트】
${content.substring(0, 20000)}

═══════════════════════════════════════════════════════════════

라인 바이 라인으로 편집하세요.
각 문제에 대해 구체적인 수정 제안을 하세요.

집중 영역:
- 불필요한 단어/문장 제거
- 더 강력한 동사 사용
- Show, don't tell
- 문장 리듬과 흐름
- 작가 목소리 살리기
- 클리셰 제거

출력 형식 (JSON):
{
  "suggestions": [
    {
      "location": "문제 위치 (원문 인용)",
      "original": "원문",
      "issue": "무엇이 문제인지",
      "suggestion": "수정 제안",
      "priority": "critical/high/medium/low",
      "category": "clarity/flow/voice/impact/redundancy/show-dont-tell"
    }
  ]
}

최대 30개의 가장 중요한 수정 사항을 제안하세요.`;

    return await generateJSON<{ suggestions: LineEditSuggestion[] }>(prompt, this.model);
  }

  /**
   * 카피 편집 (문법, 맞춤법, 일관성)
   */
  async performCopyEdit(
    content: string
  ): Promise<CopyEditCorrection[]> {
    const prompt = `당신은 ${EDITOR_PERSONAS['meticulous-copyeditor'].name}입니다.
${EDITOR_PERSONAS['meticulous-copyeditor'].experience}

═══════════════════════════════════════════════════════════════

【편집 대상 텍스트】
${content}

═══════════════════════════════════════════════════════════════

카피 편집을 수행하세요:

1. **맞춤법 오류**: 한글 맞춤법 규정에 따라
2. **띄어쓰기 오류**: 정확한 띄어쓰기
3. **문법 오류**: 조사, 어미 등
4. **일관성 문제**: 용어, 표기 통일
5. **문장부호**: 올바른 사용

출력 형식 (JSON):
{
  "corrections": [
    {
      "location": "위치 (문장 인용)",
      "original": "원문",
      "corrected": "수정문",
      "ruleReference": "적용 규칙",
      "category": "grammar/punctuation/spelling/consistency/style-guide"
    }
  ]
}`;

    const result = await generateJSON<{ corrections: CopyEditCorrection[] }>(prompt, this.model);
    return result.corrections;
  }

  /**
   * 교정 (Proofreading)
   */
  async performProofreading(
    content: string
  ): Promise<ProofreadingFix[]> {
    const prompt = `당신은 최종 교정 전문가입니다.
인쇄 직전 마지막 검토를 수행합니다.

【텍스트】
${content}

다음을 찾아 수정하세요:
1. 오탈자
2. 띄어쓰기 오류
3. 문장부호 오류
4. 포맷팅 오류

출력 형식 (JSON):
{
  "fixes": [
    {
      "location": "위치",
      "error": "오류",
      "fix": "수정",
      "errorType": "typo/spacing/punctuation/formatting"
    }
  ]
}`;

    const result = await generateJSON<{ fixes: ProofreadingFix[] }>(prompt, this.model);
    return result.fixes;
  }

  /**
   * 편집자 레터 작성
   */
  private async writeEditorLetter(
    manuscript: { title: string; genre: string },
    overall: OverallAssessment,
    structural: StructuralAnalysis
  ): Promise<string> {
    const prompt = `당신은 ${this.persona.name}, ${this.persona.title}입니다.
소통 스타일: ${this.persona.communicationStyle}

작가에게 보내는 편집자 레터를 작성하세요.

【원고】
제목: ${manuscript.title}
장르: ${manuscript.genre}

【평가 결과】
점수: ${overall.publishabilityScore}/100
수준: ${overall.publishabilityLevel}
강점: ${overall.keyStrengths.join(', ')}
약점: ${overall.criticalWeaknesses.join(', ')}

【구조 분석】
플롯: ${structural.plotStructure.assessment}
페이싱: ${structural.pacing.assessment}

═══════════════════════════════════════════════════════════════

편집자 레터 형식:

1. 인사 및 원고에 대한 전반적 인상
2. 강점 인정 (구체적으로)
3. 개선이 필요한 부분 (건설적으로)
4. 구체적인 수정 방향 제안
5. 격려와 마무리

실제 출판사 편집자가 작가에게 보내는 것처럼 전문적이면서도 따뜻하게 작성하세요.
최소 500자 이상으로 상세하게 작성하세요.`;

    return await generateText(prompt, this.model);
  }

  /**
   * 수정 요청 생성
   */
  private generateRevisionRequests(
    overall: OverallAssessment,
    structural: StructuralAnalysis
  ): RevisionRequest[] {
    const requests: RevisionRequest[] = [];

    // 치명적 약점에서 수정 요청 생성
    overall.criticalWeaknesses.forEach((weakness, i) => {
      requests.push({
        section: '전체',
        issue: weakness,
        requestedChange: `${weakness} 문제 해결 필요`,
        reasoning: '출판 수준 도달을 위한 필수 수정',
        priority: 'must-fix',
      });
    });

    // 구조적 이슈에서 수정 요청 생성
    structural.plotStructure.issues.forEach(issue => {
      requests.push({
        section: '플롯',
        issue,
        requestedChange: structural.plotStructure.suggestions[0] || '플롯 구조 개선',
        reasoning: '스토리 완성도 향상',
        priority: 'strongly-recommend',
      });
    });

    return requests;
  }

  /**
   * 이슈 우선순위 지정
   */
  private prioritizeIssues(
    overall: OverallAssessment,
    structural: StructuralAnalysis
  ): PrioritizedIssue[] {
    const issues: PrioritizedIssue[] = [];
    let rank = 1;

    overall.criticalWeaknesses.forEach(weakness => {
      issues.push({
        rank: rank++,
        issue: weakness,
        impact: '출판 가능성에 직접 영향',
        effort: 'high',
        recommendation: '최우선 수정',
      });
    });

    return issues;
  }

  /**
   * 수정된 원고 재검토
   */
  async reviewRevision(
    originalReport: EditorialReport,
    revisedContent: string
  ): Promise<{
    improvementAssessment: string;
    remainingIssues: string[];
    newIssues: string[];
    approvalStatus: 'approved' | 'needs-more-work' | 'rejected';
    nextSteps: string[];
  }> {
    const prompt = `당신은 ${this.persona.name}입니다.

작가가 수정본을 제출했습니다. 이전 피드백과 비교하여 평가하세요.

【이전 평가】
점수: ${originalReport.overallAssessment.publishabilityScore}
주요 문제: ${originalReport.overallAssessment.criticalWeaknesses.join(', ')}

【수정된 원고】
${revisedContent.substring(0, 20000)}

═══════════════════════════════════════════════════════════════

다음을 평가하세요:
1. 요청한 수정이 반영되었는가?
2. 수정으로 인해 개선된 점
3. 아직 남은 문제
4. 새로 발생한 문제
5. 최종 승인 여부

출력 형식 (JSON):
{
  "improvementAssessment": "개선 평가",
  "addressedIssues": ["해결된 문제 1", "해결된 문제 2"],
  "remainingIssues": ["남은 문제 1"],
  "newIssues": ["새 문제 (있다면)"],
  "approvalStatus": "approved/needs-more-work/rejected",
  "nextSteps": ["다음 단계 1", "다음 단계 2"]
}`;

    return await generateJSON(prompt, this.model);
  }

  /**
   * 최종 출판 승인
   */
  async grantFinalApproval(
    manuscript: {
      title: string;
      content: string;
      metadata: Record<string, string>;
    }
  ): Promise<{
    approved: boolean;
    certificate: string;
    finalNotes: string;
    publishingRecommendations: string[];
  }> {
    const prompt = `당신은 ${this.persona.name}, ${this.persona.title}입니다.

최종 출판 승인 검토를 수행합니다.

【원고】
제목: ${manuscript.title}
${manuscript.content.substring(0, 10000)}

═══════════════════════════════════════════════════════════════

최종 검토 후 출판 승인 여부를 결정하세요.

출력 형식 (JSON):
{
  "approved": true/false,
  "finalScore": 1-100,
  "certificate": "출판 승인서 (승인 시)",
  "finalNotes": "최종 편집자 노트",
  "publishingRecommendations": ["출판 관련 조언 1", "조언 2"]
}`;

    return await generateJSON(prompt, this.model);
  }

  getPersonaInfo(): EditorPersona {
    return this.persona;
  }
}

// 싱글톤 인스턴스
export const professionalEditorAI = new ProfessionalEditorAI();
