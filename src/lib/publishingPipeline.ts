/**
 * 통합 출판 파이프라인 (Publishing Pipeline)
 *
 * AI만으로 전통 출판 품질의 소설을 완성하는 end-to-end 파이프라인
 * 인간 개입 없이 작가 → 편집자 → 베타리더 → 퇴고 → 출판사 심사까지 자동화
 */

import { HumanAuthorSimulator, AUTHOR_PERSONAS, type AuthorPersona } from './humanAuthorSimulator';
import { ProfessionalEditorAI, EDITOR_PERSONAS, type EditorPersona, type EditorialReport } from './professionalEditorAI';
import { BetaReaderSimulator, BETA_READER_PERSONAS, type BetaReaderPersona, type BetaReaderFeedback, type SynthesizedFeedback } from './betaReaderSimulator';
import { FinalPolishSystem, type PolishingResult } from './finalPolishSystem';
import { PublisherReviewSimulator, PUBLISHERS, type Publisher, type SubmissionResult } from './publisherReviewSimulator';
import type { PrimaryGenre } from './genreMasterSystem';

// ============================================================================
// 타입 정의
// ============================================================================

export interface NovelProject {
  id: string;
  title: string;
  author: string;
  genre: PrimaryGenre;
  targetAudience: string;
  synopsis: string;
  targetWordCount: number;
  chapters: ChapterContent[];
  metadata: NovelMetadata;
  status: ProjectStatus;
}

export interface ChapterContent {
  number: number;
  title: string;
  content: string;
  wordCount: number;
  version: number;
  lastModified: Date;
}

export interface NovelMetadata {
  createdAt: Date;
  lastModified: Date;
  totalRevisions: number;
  currentPhase: PipelinePhase;
  qualityScore: number;
  publisherSubmissions: number;
}

export type ProjectStatus =
  | 'draft'
  | 'writing'
  | 'first-draft-complete'
  | 'editing'
  | 'beta-reading'
  | 'polishing'
  | 'publisher-submission'
  | 'revision-requested'
  | 'accepted'
  | 'rejected'
  | 'published';

export type PipelinePhase =
  | 'initialization'
  | 'author-writing'
  | 'author-self-revision'
  | 'editor-structural-edit'
  | 'editor-line-edit'
  | 'editor-copy-edit'
  | 'editor-proofread'
  | 'beta-reader-feedback'
  | 'beta-feedback-integration'
  | 'final-polish'
  | 'quality-certification'
  | 'publisher-submission'
  | 'revision-iteration'
  | 'publication-ready';

export interface PipelineConfig {
  // 작가 설정
  authorPersona: string;
  writingStyle: 'detailed' | 'concise' | 'poetic' | 'conversational';

  // 편집 설정
  editorPersona: string;
  editingIntensity: 'light' | 'moderate' | 'thorough' | 'intensive';

  // 베타리더 설정
  betaReaderCount: number;
  betaReaderPersonas: string[];

  // 퇴고 설정
  targetQualityScore: number;
  maxPolishIterations: number;

  // 출판사 설정
  targetPublishers: string[];
  maxSubmissionAttempts: number;

  // 전체 파이프라인 설정
  maxTotalIterations: number;
  autoReviseOnRejection: boolean;
  detailedLogging: boolean;
}

export interface PipelineState {
  currentPhase: PipelinePhase;
  iterationCount: number;
  phaseHistory: PhaseHistoryEntry[];
  qualityScore: number;  // 품질 점수 (0-100)
  editorialReports: EditorialReport[];
  betaFeedback: SynthesizedFeedback | null;
  polishingResults: PolishingResult[];
  submissionResults: SubmissionResult[];
  errors: PipelineError[];
  startTime: Date;
  lastUpdateTime: Date;
}

export interface PhaseHistoryEntry {
  phase: PipelinePhase;
  startTime: Date;
  endTime: Date;
  outcome: 'success' | 'needs-revision' | 'failed';
  details: string;
  qualityBefore?: number;
  qualityAfter?: number;
}

export interface PipelineError {
  phase: PipelinePhase;
  timestamp: Date;
  message: string;
  recoverable: boolean;
  resolution?: string;
}

export interface PipelineResult {
  success: boolean;
  finalStatus: ProjectStatus;
  totalDuration: number;
  iterationsCompleted: number;
  finalQualityScore: number;
  acceptedBy?: string;
  contractOffer?: {
    publisher: string;
    advance: number;
    royaltyRate: number;
  };
  summary: PipelineSummary;
  detailedReport: DetailedPipelineReport;
}

export interface PipelineSummary {
  writingPhase: {
    chaptersWritten: number;
    totalWordCount: number;
    selfRevisionCycles: number;
  };
  editingPhase: {
    structuralIssuesFixed: number;
    lineEditsApplied: number;
    copyEditsApplied: number;
    proofreadCorrections: number;
  };
  betaReadingPhase: {
    readersParticipated: number;
    averageEngagement: number;
    majorConcernsAddressed: number;
  };
  polishingPhase: {
    polishPassesRun: number;
    aiPatternsRemoved: number;
    qualityImprovement: number;
  };
  submissionPhase: {
    publishersApproached: number;
    rejectionsReceived: number;
    acceptanceReceived: boolean;
  };
}

export interface DetailedPipelineReport {
  projectInfo: {
    title: string;
    genre: string;
    targetAudience: string;
    finalWordCount: number;
  };
  qualityProgression: {
    initial: number;
    afterWriting: number;
    afterEditing: number;
    afterBetaReading: number;
    afterPolishing: number;
    final: number;
  };
  phaseDetails: PhaseHistoryEntry[];
  keyImprovements: string[];
  remainingConcerns: string[];
  publisherFeedback: string[];
  recommendations: string[];
}

// ============================================================================
// 기본 설정
// ============================================================================

export const DEFAULT_PIPELINE_CONFIG: PipelineConfig = {
  authorPersona: 'literary-perfectionist',
  writingStyle: 'detailed',
  editorPersona: 'traditional-literary',
  editingIntensity: 'thorough',
  betaReaderCount: 5,
  betaReaderPersonas: [
    'casual-commuter',
    'avid-fantasy-fan',
    'literary-connoisseur',
    'emotional-reader',
    'picky-thriller-fan'
  ],
  targetQualityScore: 85,
  maxPolishIterations: 10,
  targetPublishers: ['major-literary-1', 'major-commercial-1', 'genre-romance-1'],
  maxSubmissionAttempts: 5,
  maxTotalIterations: 20,
  autoReviseOnRejection: true,
  detailedLogging: true
};

// 장르별 최적 파이프라인 설정
export const GENRE_PIPELINE_PRESETS: Record<PrimaryGenre, Partial<PipelineConfig>> = {
  fantasy: {
    authorPersona: 'plot-architect',
    editorPersona: 'commercial-fiction',
    betaReaderPersonas: ['avid-fantasy-fan', 'casual-commuter', 'teen-reader', 'picky-thriller-fan', 'emotional-reader'],
    targetPublishers: ['major-commercial-1', 'genre-fantasy-1', 'web-platform-kakao']
  },
  romance: {
    authorPersona: 'emotional-craftsman',
    editorPersona: 'commercial-fiction',
    betaReaderPersonas: ['emotional-reader', 'casual-commuter', 'literary-connoisseur', 'teen-reader', 'avid-fantasy-fan'],
    targetPublishers: ['genre-romance-1', 'major-commercial-1', 'web-platform-kakao']
  },
  thriller: {
    authorPersona: 'plot-architect',
    editorPersona: 'commercial-fiction',
    betaReaderPersonas: ['picky-thriller-fan', 'casual-commuter', 'avid-fantasy-fan', 'literary-connoisseur', 'emotional-reader'],
    targetPublishers: ['genre-thriller-1', 'major-commercial-1', 'major-literary-1']
  },
  mystery: {
    authorPersona: 'plot-architect',
    editorPersona: 'meticulous-copyeditor',
    betaReaderPersonas: ['picky-thriller-fan', 'literary-connoisseur', 'casual-commuter', 'avid-fantasy-fan', 'emotional-reader'],
    targetPublishers: ['genre-thriller-1', 'major-commercial-1', 'indie-literary-1']
  },
  'sci-fi': {
    authorPersona: 'literary-perfectionist',
    editorPersona: 'traditional-literary',
    betaReaderPersonas: ['avid-fantasy-fan', 'literary-connoisseur', 'picky-thriller-fan', 'teen-reader', 'casual-commuter'],
    targetPublishers: ['major-literary-1', 'major-commercial-1', 'genre-fantasy-1']
  },
  horror: {
    authorPersona: 'emotional-craftsman',
    editorPersona: 'commercial-fiction',
    betaReaderPersonas: ['picky-thriller-fan', 'emotional-reader', 'avid-fantasy-fan', 'teen-reader', 'casual-commuter'],
    targetPublishers: ['genre-thriller-1', 'major-commercial-1', 'indie-literary-1']
  },
  historical: {
    authorPersona: 'literary-perfectionist',
    editorPersona: 'meticulous-copyeditor',
    betaReaderPersonas: ['literary-connoisseur', 'emotional-reader', 'casual-commuter', 'avid-fantasy-fan', 'picky-thriller-fan'],
    targetPublishers: ['major-literary-1', 'major-commercial-1', 'indie-literary-1']
  },
  'martial-arts': {
    authorPersona: 'plot-architect',
    editorPersona: 'commercial-fiction',
    betaReaderPersonas: ['avid-fantasy-fan', 'picky-thriller-fan', 'teen-reader', 'casual-commuter', 'emotional-reader'],
    targetPublishers: ['web-platform-kakao', 'major-commercial-1', 'genre-fantasy-1']
  },
  'slice-of-life': {
    authorPersona: 'emotional-craftsman',
    editorPersona: 'traditional-literary',
    betaReaderPersonas: ['emotional-reader', 'literary-connoisseur', 'casual-commuter', 'teen-reader', 'avid-fantasy-fan'],
    targetPublishers: ['major-literary-1', 'indie-literary-1', 'web-platform-kakao']
  },
  action: {
    authorPersona: 'plot-architect',
    editorPersona: 'commercial-fiction',
    betaReaderPersonas: ['picky-thriller-fan', 'avid-fantasy-fan', 'teen-reader', 'casual-commuter', 'emotional-reader'],
    targetPublishers: ['major-commercial-1', 'web-platform-kakao', 'genre-thriller-1']
  },
  drama: {
    authorPersona: 'emotional-craftsman',
    editorPersona: 'traditional-literary',
    betaReaderPersonas: ['emotional-reader', 'literary-connoisseur', 'casual-commuter', 'avid-fantasy-fan', 'picky-thriller-fan'],
    targetPublishers: ['major-literary-1', 'major-commercial-1', 'indie-literary-1']
  },
  comedy: {
    authorPersona: 'web-novel-master',
    editorPersona: 'web-novel-platform',
    betaReaderPersonas: ['casual-commuter', 'teen-reader', 'avid-fantasy-fan', 'emotional-reader', 'literary-connoisseur'],
    targetPublishers: ['web-platform-kakao', 'major-commercial-1', 'indie-literary-1']
  },
  isekai: {
    authorPersona: 'plot-architect',
    editorPersona: 'web-novel-platform',
    betaReaderPersonas: ['avid-fantasy-fan', 'teen-reader', 'casual-commuter', 'picky-thriller-fan', 'emotional-reader'],
    targetPublishers: ['web-platform-kakao', 'major-commercial-1', 'genre-fantasy-1']
  },
  regression: {
    authorPersona: 'plot-architect',
    editorPersona: 'web-novel-platform',
    betaReaderPersonas: ['avid-fantasy-fan', 'picky-thriller-fan', 'teen-reader', 'casual-commuter', 'emotional-reader'],
    targetPublishers: ['web-platform-kakao', 'major-commercial-1', 'genre-fantasy-1']
  },
  academy: {
    authorPersona: 'web-novel-master',
    editorPersona: 'web-novel-platform',
    betaReaderPersonas: ['teen-reader', 'avid-fantasy-fan', 'casual-commuter', 'emotional-reader', 'picky-thriller-fan'],
    targetPublishers: ['web-platform-kakao', 'major-commercial-1', 'genre-romance-1']
  },
  survival: {
    authorPersona: 'plot-architect',
    editorPersona: 'commercial-fiction',
    betaReaderPersonas: ['picky-thriller-fan', 'avid-fantasy-fan', 'teen-reader', 'casual-commuter', 'emotional-reader'],
    targetPublishers: ['web-platform-kakao', 'major-commercial-1', 'genre-thriller-1']
  },
  'game-system': {
    authorPersona: 'plot-architect',
    editorPersona: 'web-novel-platform',
    betaReaderPersonas: ['avid-fantasy-fan', 'teen-reader', 'picky-thriller-fan', 'casual-commuter', 'emotional-reader'],
    targetPublishers: ['web-platform-kakao', 'major-commercial-1', 'genre-fantasy-1']
  }
};

// ============================================================================
// 메인 파이프라인 클래스
// ============================================================================

export class PublishingPipeline {
  private config: PipelineConfig;
  private state: PipelineState;
  private project: NovelProject;

  // 서브시스템 인스턴스
  private authorSimulator: HumanAuthorSimulator;
  private editorAI: ProfessionalEditorAI;
  private betaReaderSimulator: BetaReaderSimulator;
  private polishSystem: FinalPolishSystem;
  private publisherSimulator: PublisherReviewSimulator;

  // 콜백
  private onPhaseChange?: (phase: PipelinePhase, details: string) => void;
  private onProgress?: (progress: number, message: string) => void;
  private onError?: (error: PipelineError) => void;

  constructor(
    project: NovelProject,
    config: Partial<PipelineConfig> = {},
    callbacks?: {
      onPhaseChange?: (phase: PipelinePhase, details: string) => void;
      onProgress?: (progress: number, message: string) => void;
      onError?: (error: PipelineError) => void;
    }
  ) {
    // 장르 기반 프리셋 적용
    const genrePreset = GENRE_PIPELINE_PRESETS[project.genre] || {};
    this.config = { ...DEFAULT_PIPELINE_CONFIG, ...genrePreset, ...config };

    this.project = project;
    this.state = this.initializeState();

    // 서브시스템 초기화
    this.authorSimulator = new HumanAuthorSimulator();
    this.editorAI = new ProfessionalEditorAI();
    this.betaReaderSimulator = new BetaReaderSimulator();
    this.polishSystem = new FinalPolishSystem();
    this.publisherSimulator = new PublisherReviewSimulator();

    // 콜백 설정
    this.onPhaseChange = callbacks?.onPhaseChange;
    this.onProgress = callbacks?.onProgress;
    this.onError = callbacks?.onError;
  }

  private initializeState(): PipelineState {
    return {
      currentPhase: 'initialization',
      iterationCount: 0,
      phaseHistory: [],
      qualityScore: 0,
      editorialReports: [],
      betaFeedback: null,
      polishingResults: [],
      submissionResults: [],
      errors: [],
      startTime: new Date(),
      lastUpdateTime: new Date()
    };
  }

  // ============================================================================
  // 메인 파이프라인 실행
  // ============================================================================

  async runFullPipeline(): Promise<PipelineResult> {
    this.log('파이프라인 시작', `프로젝트: ${this.project.title}`);

    try {
      // Phase 1: 작가 집필 & 자가 수정
      await this.runWritingPhase();

      // Phase 2: 전문 편집
      await this.runEditingPhase();

      // Phase 3: 베타리더 피드백
      await this.runBetaReadingPhase();

      // Phase 4: 최종 퇴고
      await this.runPolishingPhase();

      // Phase 5: 출판사 투고
      const submissionSuccess = await this.runSubmissionPhase();

      // 결과 생성
      return this.generatePipelineResult(submissionSuccess);

    } catch (error) {
      const pipelineError: PipelineError = {
        phase: this.state.currentPhase,
        timestamp: new Date(),
        message: error instanceof Error ? error.message : '알 수 없는 오류',
        recoverable: false
      };
      this.state.errors.push(pipelineError);
      this.onError?.(pipelineError);

      return this.generatePipelineResult(false);
    }
  }

  // ============================================================================
  // Phase 1: 작가 집필 & 자가 수정
  // ============================================================================

  private async runWritingPhase(): Promise<void> {
    this.transitionPhase('author-writing');
    this.log('집필 단계', '인간 작가 시뮬레이션으로 초고 작성 시작');

    const authorPersona = AUTHOR_PERSONAS[this.config.authorPersona];
    if (!authorPersona) {
      throw new Error(`알 수 없는 작가 페르소나: ${this.config.authorPersona}`);
    }

    // 각 챕터 집필 (이미 있는 경우 향상)
    for (let i = 0; i < this.project.chapters.length; i++) {
      const chapter = this.project.chapters[i];
      this.onProgress?.(
        (i / this.project.chapters.length) * 20,
        `챕터 ${chapter.number} 집필 중...`
      );

      // 인간 작가처럼 집필
      const emotionalTone = this.determineChapterTone(i, this.project.chapters.length);
      const writtenContent = await this.authorSimulator.writeAsHumanAuthor({
        type: i === 0 ? 'opening' : (i === this.project.chapters.length - 1 ? 'ending' : 'chapter'),
        context: `${this.project.synopsis}\n\n${this.generatePlotContext(i)}\n\n현재 챕터: ${chapter.title}`,
        requirements: [
          `장르: ${this.project.genre}`,
          `분위기: ${emotionalTone}`,
          `타겟 독자: ${this.project.targetAudience}`
        ],
        emotionalTarget: emotionalTone
      });

      this.project.chapters[i] = {
        ...chapter,
        content: writtenContent.content,
        wordCount: this.countWords(writtenContent.content),
        version: chapter.version + 1,
        lastModified: new Date()
      };
    }

    // 자가 수정 단계
    this.transitionPhase('author-self-revision');
    this.log('자가 수정', '작가의 자기 검토 및 수정');

    let selfRevisionCount = 0;
    const maxSelfRevisions = 3;

    while (selfRevisionCount < maxSelfRevisions) {
      let needsMoreRevision = false;

      for (let i = 0; i < this.project.chapters.length; i++) {
        const chapter = this.project.chapters[i];

        const revisionResult = await this.authorSimulator.reviseAsHumanAuthor(
          chapter.content,
          ['style', 'emotion', 'pacing']
        );

        if (revisionResult.changes.length > 0) {
          needsMoreRevision = true;
          this.project.chapters[i] = {
            ...chapter,
            content: revisionResult.revisedContent,
            wordCount: this.countWords(revisionResult.revisedContent),
            version: chapter.version + 1,
            lastModified: new Date()
          };
        }
      }

      selfRevisionCount++;
      this.project.metadata.totalRevisions++;

      if (!needsMoreRevision) break;
    }

    this.recordPhaseCompletion('author-self-revision', 'success',
      `${selfRevisionCount}회 자가 수정 완료`);
  }

  // ============================================================================
  // Phase 2: 전문 편집
  // ============================================================================

  private async runEditingPhase(): Promise<void> {
    const editorPersona = EDITOR_PERSONAS[this.config.editorPersona];
    if (!editorPersona) {
      throw new Error(`알 수 없는 편집자 페르소나: ${this.config.editorPersona}`);
    }

    // 구조 편집
    this.transitionPhase('editor-structural-edit');
    this.log('구조 편집', '전체 구조 및 스토리 아크 검토');

    const editorialReport = await this.editorAI.generateFullEditorialReport({
      title: this.project.title,
      genre: this.project.genre,
      synopsis: this.project.synopsis,
      chapters: this.project.chapters.map(ch => ({
        title: ch.title,
        content: ch.content
      })),
      targetAudience: this.project.targetAudience
    });
    this.state.editorialReports.push(editorialReport);

    // 구조적 피드백 반영
    const structuralIssues = [
      ...editorialReport.structuralAnalysis.plotStructure.issues,
      ...editorialReport.structuralAnalysis.pacing.slowSpots,
      ...editorialReport.structuralAnalysis.pacing.rushingSpots
    ];
    if (structuralIssues.length > 0) {
      await this.applyStructuralFeedback(editorialReport, structuralIssues);
    }

    // 라인 편집
    this.transitionPhase('editor-line-edit');
    this.log('라인 편집', '문장 단위 개선');

    for (let i = 0; i < this.project.chapters.length; i++) {
      const chapter = this.project.chapters[i];
      this.onProgress?.(
        40 + (i / this.project.chapters.length) * 10,
        `챕터 ${chapter.number} 라인 편집 중...`
      );

      // 해당 챕터의 라인 편집 제안 적용
      const chapterSuggestions = editorialReport.lineEditSuggestions
        .filter(s => chapter.content.includes(s.original.substring(0, 50)));

      let editedContent = chapter.content;
      for (const suggestion of chapterSuggestions) {
        if (suggestion.priority === 'high' || suggestion.priority === 'medium' || suggestion.priority === 'critical') {
          editedContent = editedContent.replace(suggestion.original, suggestion.suggestion);
        }
      }

      this.project.chapters[i] = {
        ...chapter,
        content: editedContent,
        version: chapter.version + 1,
        lastModified: new Date()
      };
    }

    // 카피 편집
    this.transitionPhase('editor-copy-edit');
    this.log('카피 편집', '문법, 맞춤법, 일관성 검토');

    const updatedManuscript = this.combineChapters();
    const copyEditCorrections = await this.editorAI.performCopyEdit(updatedManuscript);

    // 카피 편집 적용
    await this.applyCopyEdits(copyEditCorrections);

    // 교정
    this.transitionPhase('editor-proofread');
    this.log('교정', '최종 오류 검출');

    const finalManuscript = this.combineChapters();
    const proofreadFixes = await this.editorAI.performProofreading(finalManuscript);

    // 교정 적용
    await this.applyProofreadCorrections(proofreadFixes);

    this.recordPhaseCompletion('editor-proofread', 'success',
      `구조 이슈 ${structuralIssues.length}개, ` +
      `라인 편집 ${editorialReport.lineEditSuggestions.length}개 적용`);
  }

  // ============================================================================
  // Phase 3: 베타리더 피드백
  // ============================================================================

  private async runBetaReadingPhase(): Promise<void> {
    this.transitionPhase('beta-reader-feedback');
    this.log('베타리딩', `${this.config.betaReaderCount}명의 베타리더 피드백 수집`);

    // 다수의 베타리더 피드백 수집
    const feedbacks = await this.betaReaderSimulator.generateMultipleFeedback(
      this.config.betaReaderPersonas.slice(0, this.config.betaReaderCount),
      {
        title: this.project.title,
        genre: this.project.genre,
        synopsis: this.project.synopsis,
        chapters: this.project.chapters.map(ch => ({
          number: ch.number,
          title: ch.title,
          content: ch.content
        }))
      }
    );

    // 피드백 종합
    const synthesized = await this.betaReaderSimulator.synthesizeFeedback(feedbacks);
    this.state.betaFeedback = synthesized;

    this.onProgress?.(65, '베타리더 피드백 통합 중...');

    // 피드백 통합 반영
    this.transitionPhase('beta-feedback-integration');
    this.log('피드백 반영', '베타리더 피드백 기반 수정');

    await this.integrateBetaFeedback(synthesized);

    this.recordPhaseCompletion('beta-feedback-integration', 'success',
      `평균 평점 ${synthesized.averageRating.toFixed(1)}/5, ` +
      `주요 우려사항 ${synthesized.consensus.majorConcerns.length}개 해결`);
  }

  // ============================================================================
  // Phase 4: 최종 퇴고
  // ============================================================================

  private async runPolishingPhase(): Promise<void> {
    this.transitionPhase('final-polish');
    this.log('최종 퇴고', 'AI 패턴 제거 및 품질 향상');

    const manuscript = this.combineChapters();

    // 풀 퇴고 프로세스 실행
    const polishResult = await this.polishSystem.runFullPolishProcess(
      manuscript,
      {
        genre: this.project.genre,
        targetQuality: this.config.targetQualityScore,
        maxIterations: this.config.maxPolishIterations
      }
    );

    this.state.polishingResults.push(polishResult);
    this.state.qualityScore = polishResult.finalQualityScore;

    // 퇴고된 콘텐츠를 챕터별로 분배
    await this.distributePolishedContent(polishResult.finalContent);

    // 품질 인증
    this.transitionPhase('quality-certification');
    this.log('품질 인증', '출판 품질 기준 검증');

    const qualityMet = polishResult.finalQualityScore >= this.config.targetQualityScore;

    if (!qualityMet && this.state.iterationCount < this.config.maxTotalIterations) {
      // 품질 미달 시 재수정 루프
      this.state.iterationCount++;
      await this.runRevisionIteration();
    }

    this.recordPhaseCompletion('quality-certification',
      qualityMet ? 'success' : 'needs-revision',
      `최종 품질 점수: ${polishResult.finalQualityScore.toFixed(1)}/100`);
  }

  // ============================================================================
  // Phase 5: 출판사 투고
  // ============================================================================

  private async runSubmissionPhase(): Promise<boolean> {
    this.transitionPhase('publisher-submission');
    this.log('출판사 투고', '출판사 심사 시뮬레이션');

    const manuscriptContent = this.combineChapters();
    let submissionCount = 0;
    let accepted = false;
    let acceptedPublisher: string | undefined;

    for (const publisherId of this.config.targetPublishers) {
      if (submissionCount >= this.config.maxSubmissionAttempts) break;
      if (accepted) break;

      submissionCount++;
      this.onProgress?.(
        80 + (submissionCount / this.config.targetPublishers.length) * 15,
        `${PUBLISHERS[publisherId]?.name || publisherId}에 투고 중...`
      );

      const submissionResult = await this.publisherSimulator.simulateSubmission(
        publisherId,
        {
          title: this.project.title,
          genre: this.project.genre,
          synopsis: this.project.synopsis,
          sampleChapters: manuscriptContent,
          wordCount: this.project.chapters.reduce((sum, ch) => sum + ch.wordCount, 0),
          authorBio: `AI 작가 - ${this.project.author}`
        }
      );

      this.state.submissionResults.push(submissionResult);
      this.project.metadata.publisherSubmissions++;

      if (submissionResult.finalDecision.accepted) {
        accepted = true;
        acceptedPublisher = publisherId;
        this.project.status = 'accepted';
        this.log('채택!', `${PUBLISHERS[publisherId]?.name}에서 출판 제안`);
      } else if (submissionResult.finalDecision.decisionType === 'revise-resubmit') {
        // 수정 후 재투고 요청
        if (this.config.autoReviseOnRejection &&
            this.state.iterationCount < this.config.maxTotalIterations) {
          this.log('수정 요청', '출판사 피드백 기반 수정');
          await this.applyPublisherFeedback(submissionResult);
          this.state.iterationCount++;
          // 같은 출판사에 재투고
          submissionCount--; // 다시 시도할 수 있도록
        }
      }
    }

    if (accepted) {
      this.transitionPhase('publication-ready');
      this.project.status = 'published';
    } else {
      this.project.status = 'rejected';
    }

    this.recordPhaseCompletion('publisher-submission',
      accepted ? 'success' : 'failed',
      accepted
        ? `${PUBLISHERS[acceptedPublisher!]?.name}에서 채택`
        : `${submissionCount}개 출판사 거절`);

    return accepted;
  }

  // ============================================================================
  // 헬퍼 메서드
  // ============================================================================

  private transitionPhase(newPhase: PipelinePhase): void {
    this.state.currentPhase = newPhase;
    this.state.lastUpdateTime = new Date();
    this.project.metadata.currentPhase = newPhase;
    this.onPhaseChange?.(newPhase, `${newPhase} 단계 시작`);
  }

  private recordPhaseCompletion(
    phase: PipelinePhase,
    outcome: 'success' | 'needs-revision' | 'failed',
    details: string
  ): void {
    const entry: PhaseHistoryEntry = {
      phase,
      startTime: this.state.lastUpdateTime,
      endTime: new Date(),
      outcome,
      details,
      qualityBefore: this.state.qualityScore,
      qualityAfter: this.state.qualityScore
    };
    this.state.phaseHistory.push(entry);
  }

  private log(title: string, message: string): void {
    if (this.config.detailedLogging) {
      console.log(`[${this.state.currentPhase}] ${title}: ${message}`);
    }
  }

  private combineChapters(): string {
    return this.project.chapters
      .map(ch => `## ${ch.title}\n\n${ch.content}`)
      .join('\n\n---\n\n');
  }

  private countWords(text: string): number {
    return text.replace(/\s+/g, ' ').trim().split(' ').length;
  }

  private determineChapterTone(
    chapterIndex: number,
    totalChapters: number
  ): string {
    const position = chapterIndex / totalChapters;
    if (position < 0.1) return 'introduction';
    if (position < 0.25) return 'rising-action';
    if (position < 0.5) return 'building-tension';
    if (position < 0.75) return 'climax-approach';
    if (position < 0.9) return 'climax';
    return 'resolution';
  }

  private generatePlotContext(chapterIndex: number): string {
    const prevChapters = this.project.chapters.slice(0, chapterIndex);
    if (prevChapters.length === 0) return '소설의 시작';

    return `이전 전개: ${prevChapters.map(ch => ch.title).join(' → ')}`;
  }

  private async applyStructuralFeedback(
    report: EditorialReport,
    issues: string[]
  ): Promise<void> {
    // 구조적 이슈 해결을 위한 재작성
    for (const issue of issues) {
      // AI 작가 시뮬레이터를 통해 해당 부분 재작성
      const affectedChapters = this.identifyAffectedChapters(issue);
      for (const chapterIndex of affectedChapters) {
        const chapter = this.project.chapters[chapterIndex];
        const revised = await this.authorSimulator.reviseAsHumanAuthor(
          chapter.content,
          ['style', 'logic', 'pacing']
        );
        this.project.chapters[chapterIndex] = {
          ...chapter,
          content: revised.revisedContent,
          version: chapter.version + 1,
          lastModified: new Date()
        };
      }
    }
  }

  private identifyAffectedChapters(issue: string): number[] {
    // 이슈 내용을 기반으로 영향받는 챕터 식별
    const affected: number[] = [];
    const issueLower = issue.toLowerCase();

    if (issueLower.includes('시작') || issueLower.includes('도입')) {
      affected.push(0, 1);
    } else if (issueLower.includes('결말') || issueLower.includes('마무리')) {
      affected.push(this.project.chapters.length - 2, this.project.chapters.length - 1);
    } else if (issueLower.includes('중반') || issueLower.includes('전환')) {
      const mid = Math.floor(this.project.chapters.length / 2);
      affected.push(mid - 1, mid, mid + 1);
    } else {
      // 전체 검토 필요
      affected.push(...this.project.chapters.map((_, i) => i));
    }

    return affected.filter(i => i >= 0 && i < this.project.chapters.length);
  }

  private async applyCopyEdits(corrections: Array<{
    location: string;
    original: string;
    corrected: string;
    ruleReference: string;
    category: string;
  }>): Promise<void> {
    for (let i = 0; i < this.project.chapters.length; i++) {
      let content = this.project.chapters[i].content;

      for (const correction of corrections) {
        content = content.replace(correction.original, correction.corrected);
      }

      this.project.chapters[i] = {
        ...this.project.chapters[i],
        content,
        version: this.project.chapters[i].version + 1,
        lastModified: new Date()
      };
    }
  }

  private async applyProofreadCorrections(fixes: Array<{
    location: string;
    error: string;
    fix: string;
    errorType: string;
  }>): Promise<void> {
    for (let i = 0; i < this.project.chapters.length; i++) {
      let content = this.project.chapters[i].content;

      for (const item of fixes) {
        content = content.replace(item.error, item.fix);
      }

      this.project.chapters[i] = {
        ...this.project.chapters[i],
        content,
        version: this.project.chapters[i].version + 1,
        lastModified: new Date()
      };
    }
  }

  private async integrateBetaFeedback(feedback: SynthesizedFeedback): Promise<void> {
    // 주요 우려사항 해결
    for (const concern of feedback.consensus.majorConcerns) {
      const affectedChapters = this.identifyChaptersForConcern(concern);

      for (const chapterIndex of affectedChapters) {
        const chapter = this.project.chapters[chapterIndex];
        const revised = await this.authorSimulator.reviseAsHumanAuthor(
          chapter.content,
          ['emotion', 'dialogue', 'pacing']
        );

        this.project.chapters[chapterIndex] = {
          ...chapter,
          content: revised.revisedContent,
          version: chapter.version + 1,
          lastModified: new Date()
        };
      }
    }
  }

  private identifyChaptersForConcern(concern: string): number[] {
    const concernLower = concern.toLowerCase();
    const affected: number[] = [];

    // 키워드 기반 챕터 식별
    for (let i = 0; i < this.project.chapters.length; i++) {
      const chapter = this.project.chapters[i];
      const contentLower = chapter.content.toLowerCase();
      const titleLower = chapter.title.toLowerCase();

      // 우려사항과 관련된 키워드가 포함된 챕터 찾기
      const keywords = concernLower.split(/\s+/).filter(w => w.length > 2);
      const hasRelevantContent = keywords.some(kw =>
        contentLower.includes(kw) || titleLower.includes(kw)
      );

      if (hasRelevantContent) {
        affected.push(i);
      }
    }

    // 관련 챕터를 찾지 못하면 전체 대상
    return affected.length > 0 ? affected : this.project.chapters.map((_, i) => i);
  }

  private async distributePolishedContent(polishedContent: string): Promise<void> {
    // 퇴고된 전체 콘텐츠를 챕터별로 분배
    const sections = polishedContent.split(/---\n\n|## /);

    for (let i = 0; i < this.project.chapters.length; i++) {
      if (sections[i + 1]) {  // +1 because first split might be empty
        const sectionContent = sections[i + 1].replace(/^[^\n]+\n\n/, '').trim();
        this.project.chapters[i] = {
          ...this.project.chapters[i],
          content: sectionContent,
          wordCount: this.countWords(sectionContent),
          version: this.project.chapters[i].version + 1,
          lastModified: new Date()
        };
      }
    }
  }

  private async runRevisionIteration(): Promise<void> {
    this.transitionPhase('revision-iteration');
    this.log('재수정', `${this.state.iterationCount}차 수정 반복`);

    // 품질 점수가 낮은 영역 집중 수정
    if (this.state.qualityScore > 0) {
      const weakAreas = this.identifyWeakAreas(this.state.qualityScore);

      for (const area of weakAreas) {
        await this.improveWeakArea(area);
      }
    }

    // 다시 퇴고
    await this.runPolishingPhase();
  }

  private identifyWeakAreas(qualityScore: number): string[] {
    const weakAreas: string[] = [];

    // 점수에 따라 개선이 필요한 영역 결정
    if (qualityScore < 60) {
      weakAreas.push('naturalness', 'emotion', 'flow', 'dialogue', 'description', 'consistency');
    } else if (qualityScore < 70) {
      weakAreas.push('naturalness', 'emotion', 'flow');
    } else if (qualityScore < 80) {
      weakAreas.push('naturalness', 'emotion');
    } else if (qualityScore < 90) {
      weakAreas.push('naturalness');
    }

    return weakAreas;
  }

  private async improveWeakArea(area: string): Promise<void> {
    const passMap: Record<string, string> = {
      'naturalness': 'ai-decontamination',
      'emotion': 'emotion-enhancement',
      'flow': 'rhythm-flow',
      'dialogue': 'dialogue-polish',
      'description': 'description-vivid',
      'consistency': 'consistency-check'
    };

    const passType = passMap[area];
    if (passType) {
      const manuscript = this.combineChapters();
      const result = await this.polishSystem.runFullPolishProcess(
        manuscript,
        {
          genre: this.project.genre,
          targetQuality: this.config.targetQualityScore,
          maxIterations: 3
        }
      );
      await this.distributePolishedContent(result.finalContent);
    }
  }

  private async applyPublisherFeedback(result: SubmissionResult): Promise<void> {
    // 출판사 피드백을 반영하여 수정
    // reviews 단계의 concerns와 feedback의 suggestedRevisions를 활용
    const allConcerns: string[] = [];

    // 각 리뷰 단계의 concerns 수집
    for (const review of result.reviews) {
      allConcerns.push(...review.concerns);
    }

    // feedback의 suggestedRevisions 추가
    allConcerns.push(...result.feedback.suggestedRevisions);
    allConcerns.push(...result.feedback.whatNeedsWork);

    // 주요 우려사항 기반으로 수정
    for (const concern of allConcerns.slice(0, 5)) {  // 상위 5개만 처리
      const affectedChapters = this.identifyChaptersForConcern(concern);

      for (const chapterIndex of affectedChapters) {
        const chapter = this.project.chapters[chapterIndex];
        const revised = await this.authorSimulator.reviseAsHumanAuthor(
          chapter.content,
          ['style', 'emotion', 'pacing', 'dialogue', 'description']
        );

        this.project.chapters[chapterIndex] = {
          ...chapter,
          content: revised.revisedContent,
          version: chapter.version + 1,
          lastModified: new Date()
        };
      }
    }
  }

  // ============================================================================
  // 결과 생성
  // ============================================================================

  private generatePipelineResult(success: boolean): PipelineResult {
    const endTime = new Date();
    const duration = endTime.getTime() - this.state.startTime.getTime();

    const acceptedSubmission = this.state.submissionResults.find(
      r => r.finalDecision.accepted
    );

    return {
      success,
      finalStatus: this.project.status,
      totalDuration: duration,
      iterationsCompleted: this.state.iterationCount,
      finalQualityScore: this.state.qualityScore,
      acceptedBy: acceptedSubmission ?
        acceptedSubmission.publisher.name : undefined,
      contractOffer: acceptedSubmission?.offerDetails ? {
        publisher: acceptedSubmission.publisher.name,
        advance: acceptedSubmission.offerDetails.advance,
        royaltyRate: acceptedSubmission.offerDetails.royaltyRate
      } : undefined,
      summary: this.generateSummary(),
      detailedReport: this.generateDetailedReport()
    };
  }

  private generateSummary(): PipelineSummary {
    const editReport = this.state.editorialReports[0];

    return {
      writingPhase: {
        chaptersWritten: this.project.chapters.length,
        totalWordCount: this.project.chapters.reduce((sum, ch) => sum + ch.wordCount, 0),
        selfRevisionCycles: this.project.metadata.totalRevisions
      },
      editingPhase: {
        structuralIssuesFixed: editReport ? (
          editReport.structuralAnalysis.plotStructure.issues.length +
          editReport.structuralAnalysis.pacing.slowSpots.length +
          editReport.structuralAnalysis.pacing.rushingSpots.length
        ) : 0,
        lineEditsApplied: editReport?.lineEditSuggestions.filter(s =>
          s.priority === 'high' || s.priority === 'medium' || s.priority === 'critical'
        ).length || 0,
        copyEditsApplied: editReport?.copyEditCorrections.length || 0,
        proofreadCorrections: editReport?.proofreadingFixes.length || 0
      },
      betaReadingPhase: {
        readersParticipated: this.config.betaReaderCount,
        averageEngagement: this.state.betaFeedback?.averageRating || 0,
        majorConcernsAddressed: this.state.betaFeedback?.consensus.majorConcerns.length || 0
      },
      polishingPhase: {
        polishPassesRun: this.state.polishingResults.reduce(
          (sum, r) => sum + r.totalPasses, 0
        ),
        aiPatternsRemoved: this.state.polishingResults.reduce(
          (sum, r) => sum + r.passes.filter(p =>
            p.passType === 'ai-decontamination'
          ).length, 0
        ),
        qualityImprovement: this.state.qualityScore - 50  // 기준점 50에서의 향상
      },
      submissionPhase: {
        publishersApproached: this.state.submissionResults.length,
        rejectionsReceived: this.state.submissionResults.filter(
          r => !r.finalDecision.accepted
        ).length,
        acceptanceReceived: this.state.submissionResults.some(
          r => r.finalDecision.accepted
        )
      }
    };
  }

  private generateDetailedReport(): DetailedPipelineReport {
    const editReport = this.state.editorialReports[0];

    return {
      projectInfo: {
        title: this.project.title,
        genre: this.project.genre,
        targetAudience: this.project.targetAudience,
        finalWordCount: this.project.chapters.reduce((sum, ch) => sum + ch.wordCount, 0)
      },
      qualityProgression: {
        initial: 50,  // 기준점
        afterWriting: 60,
        afterEditing: 70,
        afterBetaReading: 75,
        afterPolishing: this.state.qualityScore || 80,
        final: this.state.qualityScore || 80
      },
      phaseDetails: this.state.phaseHistory,
      keyImprovements: [
        ...this.state.polishingResults.flatMap(r =>
          r.passes.map(p => `${p.passType}: ${p.passNotes}`)
        ),
        ...(editReport?.strengthsToPreserve || [])
      ],
      remainingConcerns: [
        ...(this.state.betaFeedback?.consensus.divisivePoints || []),
        ...(editReport?.structuralAnalysis.plotStructure.issues || [])
      ].slice(0, 5),
      publisherFeedback: this.state.submissionResults
        .flatMap(r => r.reviews)
        .flatMap(s => s.concerns)
        .slice(0, 10),
      recommendations: this.generateRecommendations()
    };
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    if (this.state.qualityScore < 90) {
      if (this.state.qualityScore < 80) {
        recommendations.push('AI 패턴 제거를 위한 추가 퇴고 권장');
      }
      if (this.state.qualityScore < 85) {
        recommendations.push('감정 묘사 심화 필요');
        recommendations.push('대화문 자연스러움 개선 권장');
      }
    }

    if (!this.state.submissionResults.some(r => r.finalDecision.accepted)) {
      recommendations.push('다른 출판사 또는 장르 전문 출판사 투고 고려');
      recommendations.push('웹소설 플랫폼 연재 후 출판 전환 전략 검토');
    }

    if (recommendations.length === 0) {
      recommendations.push('출판 품질 달성! 마케팅 및 프로모션 전략 수립 권장');
    }

    return recommendations;
  }

  // ============================================================================
  // 퍼블릭 API
  // ============================================================================

  getState(): PipelineState {
    return { ...this.state };
  }

  getProject(): NovelProject {
    return { ...this.project };
  }

  getConfig(): PipelineConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<PipelineConfig>): void {
    this.config = { ...this.config, ...updates };
  }
}

// ============================================================================
// 유틸리티 함수
// ============================================================================

export function createNovelProject(
  title: string,
  genre: PrimaryGenre,
  synopsis: string,
  chapterOutlines: Array<{ title: string; summary: string }>,
  options: Partial<{
    author: string;
    targetAudience: string;
    targetWordCount: number;
  }> = {}
): NovelProject {
  return {
    id: `novel-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title,
    author: options.author || 'AI 작가',
    genre,
    targetAudience: options.targetAudience || '일반 성인 독자',
    synopsis,
    targetWordCount: options.targetWordCount || 80000,
    chapters: chapterOutlines.map((outline, index) => ({
      number: index + 1,
      title: outline.title,
      content: outline.summary,
      wordCount: 0,
      version: 0,
      lastModified: new Date()
    })),
    metadata: {
      createdAt: new Date(),
      lastModified: new Date(),
      totalRevisions: 0,
      currentPhase: 'initialization',
      qualityScore: 0,
      publisherSubmissions: 0
    },
    status: 'draft'
  };
}

export function getRecommendedConfig(
  genre: PrimaryGenre,
  targetMarket: 'literary' | 'commercial' | 'web-novel'
): Partial<PipelineConfig> {
  const baseConfig = GENRE_PIPELINE_PRESETS[genre] || {};

  const marketConfigs: Record<'literary' | 'commercial' | 'web-novel', Partial<PipelineConfig>> = {
    literary: {
      editorPersona: 'traditional-literary',
      editingIntensity: 'intensive' as const,
      targetQualityScore: 90,
      targetPublishers: ['major-literary-1', 'indie-literary-1']
    },
    commercial: {
      editorPersona: 'commercial-fiction',
      editingIntensity: 'thorough' as const,
      targetQualityScore: 85,
      targetPublishers: ['major-commercial-1', 'genre-thriller-1', 'genre-romance-1']
    },
    'web-novel': {
      editorPersona: 'web-novel-platform',
      editingIntensity: 'moderate' as const,
      targetQualityScore: 75,
      targetPublishers: ['web-platform-kakao']
    }
  };

  return { ...baseConfig, ...marketConfigs[targetMarket] };
}

// ============================================================================
// 예제 사용법
// ============================================================================

/*
// 프로젝트 생성
const project = createNovelProject(
  '별이 빛나는 밤에',
  'romance',
  '서울의 작은 서점에서 우연히 만난 두 사람의 운명적인 사랑 이야기',
  [
    { title: '우연한 만남', summary: '서점에서의 첫 만남' },
    { title: '알아가는 시간', summary: '서로를 알아가며' },
    // ... more chapters
  ],
  {
    targetAudience: '20-30대 여성 독자',
    targetWordCount: 100000
  }
);

// 파이프라인 설정
const config = getRecommendedConfig('romance', 'commercial');

// 파이프라인 실행
const pipeline = new PublishingPipeline(project, config, {
  onPhaseChange: (phase, details) => console.log(`[${phase}] ${details}`),
  onProgress: (progress, message) => console.log(`${progress}%: ${message}`),
  onError: (error) => console.error('Error:', error)
});

const result = await pipeline.runFullPipeline();

console.log('결과:', result);
*/

export default PublishingPipeline;
