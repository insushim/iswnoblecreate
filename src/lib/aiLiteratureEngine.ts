/**
 * AI Literature Engine - Integrated Novel Generation Pipeline
 *
 * Combines all engines into a unified system for publication-quality novel generation:
 * - Literary Masters: Style and technique application
 * - Foreshadowing Tracker: Plant, water, payoff lifecycle
 * - Variety Engine: Repetition and cliche prevention
 * - Advanced Memory: Long-term coherence
 * - Reader Simulation: Engagement validation
 * - Quality Validator: Publishing standards assessment
 */

import { MASTER_PROFILES, generateMasterStylePrompt, generateBlendedStylePrompt, MasterProfile, MasterStyle } from './literaryMasters';
import { ForeshadowingTracker, ForeshadowingPlan } from './foreshadowingTracker';
import { VarietyEngine, VarietyAnalysis } from './varietyEngine';
import { AdvancedMemoryEngine, MemoryContext, CharacterMemory, PlotThread } from './advancedMemoryEngine';
import { ReaderSimulationEngine, SimulationResult, ReaderPersona } from './readerSimulation';
import { QualityValidator, QualityScore, QualityGrade } from './qualityValidator';

export interface NovelProject {
  id: string;
  title: string;
  genre: string;
  targetAudience: string;
  styleInfluences: string[]; // Master author IDs
  synopsis: string;
  themes: string[];
  settings: NovelSettings;
  chapters: Chapter[];
  metadata: ProjectMetadata;
}

export interface NovelSettings {
  targetWordCount: number;
  chapterCount: number;
  pov: 'first' | 'third_limited' | 'third_omniscient';
  tense: 'past' | 'present';
  tone: string[];
  contentRatings: string[];
}

export interface Chapter {
  number: number;
  title: string;
  content: string;
  wordCount: number;
  status: 'outline' | 'draft' | 'revised' | 'polished';
  qualityScore?: number;
  notes: string[];
}

export interface ProjectMetadata {
  createdAt: number;
  lastModified: number;
  totalWordCount: number;
  averageQualityScore: number;
  publishingReadiness: boolean;
}

export interface GenerationConfig {
  styleBlend?: { master: MasterStyle; weight: number }[];
  qualityThreshold: number; // Minimum quality score to accept
  maxRegenerationAttempts: number;
  enableForeshadowing: boolean;
  enableVarietyCheck: boolean;
  enableReaderSimulation: boolean;
  targetReaderPersonas?: string[];
}

export interface GenerationResult {
  content: string;
  qualityScore: QualityScore;
  varietyAnalysis?: VarietyAnalysis;
  readerSimulations?: Map<string, SimulationResult>;
  foreshadowingStatus?: ForeshadowingStatus;
  suggestions: string[];
  regenerationCount: number;
  accepted: boolean;
}

export interface ForeshadowingStatus {
  activePlans: number;
  plantedThisChapter: number;
  wateredThisChapter: number;
  payoffsThisChapter: number;
  upcomingPayoffs: { hint: string; targetChapter: number }[];
  overdueForeshadowing: string[];
}

export interface ChapterOutline {
  chapterNumber: number;
  title: string;
  summary: string;
  keyEvents: string[];
  charactersPresent: string[];
  emotionalBeats: string[];
  foreshadowingActions: ForeshadowingAction[];
  targetWordCount: number;
}

export interface ForeshadowingAction {
  type: 'plant' | 'water' | 'payoff';
  planId: string;
  description: string;
}

export interface NovelAnalysisReport {
  project: NovelProject;
  overallQuality: QualityScore;
  chapterAnalysis: ChapterAnalysisReport[];
  consistencyIssues: ConsistencyIssue[];
  foreshadowingHealth: ForeshadowingHealth;
  readerEngagement: ReaderEngagementSummary;
  recommendations: PriorityRecommendation[];
}

export interface ChapterAnalysisReport {
  chapter: number;
  quality: QualityScore;
  variety: VarietyAnalysis;
  issues: string[];
}

export interface ConsistencyIssue {
  type: string;
  description: string;
  chapters: number[];
  severity: 'low' | 'medium' | 'high';
}

export interface ForeshadowingHealth {
  totalPlans: number;
  resolved: number;
  overdue: number;
  wellPaced: number;
  issues: string[];
}

export interface ReaderEngagementSummary {
  averageEngagement: number;
  lowestEngagementChapter: number;
  highestEngagementChapter: number;
  dropoffRisk: number[];
  recommendations: string[];
}

export interface PriorityRecommendation {
  priority: 'critical' | 'high' | 'medium' | 'low';
  area: string;
  issue: string;
  suggestion: string;
  affectedChapters: number[];
}

export class AILiteratureEngine {
  private foreshadowingTracker: ForeshadowingTracker;
  private varietyEngine: VarietyEngine;
  private memoryEngine: AdvancedMemoryEngine;
  private readerSimulator: ReaderSimulationEngine;
  private qualityValidator: QualityValidator;

  private currentProject: NovelProject | null = null;
  private defaultConfig: GenerationConfig = {
    qualityThreshold: 70,
    maxRegenerationAttempts: 3,
    enableForeshadowing: true,
    enableVarietyCheck: true,
    enableReaderSimulation: true
  };

  constructor(projectId: string = 'default') {
    this.foreshadowingTracker = new ForeshadowingTracker(projectId);
    this.varietyEngine = new VarietyEngine();
    this.memoryEngine = new AdvancedMemoryEngine();
    this.readerSimulator = new ReaderSimulationEngine();
    this.qualityValidator = new QualityValidator();
  }

  // ==================== Project Management ====================

  /**
   * Create a new novel project
   */
  createProject(
    title: string,
    genre: string,
    synopsis: string,
    settings: Partial<NovelSettings>,
    styleInfluences?: string[]
  ): NovelProject {
    const project: NovelProject = {
      id: this.generateId(),
      title,
      genre,
      targetAudience: 'general',
      styleInfluences: styleInfluences || [],
      synopsis,
      themes: [],
      settings: {
        targetWordCount: settings.targetWordCount || 80000,
        chapterCount: settings.chapterCount || 25,
        pov: settings.pov || 'third_limited',
        tense: settings.tense || 'past',
        tone: settings.tone || [],
        contentRatings: settings.contentRatings || ['general']
      },
      chapters: [],
      metadata: {
        createdAt: Date.now(),
        lastModified: Date.now(),
        totalWordCount: 0,
        averageQualityScore: 0,
        publishingReadiness: false
      }
    };

    this.currentProject = project;
    this.initializeEnginesForProject(project);

    return project;
  }

  /**
   * Load an existing project
   */
  loadProject(project: NovelProject): void {
    this.currentProject = project;
    this.initializeEnginesForProject(project);

    // Foreshadowing state will be loaded when project data includes it
  }

  private initializeEnginesForProject(project: NovelProject): void {
    this.foreshadowingTracker.loadForeshadowings([]); // Clear existing
    this.varietyEngine.reset();
    this.memoryEngine.reset();
    this.memoryEngine.setCurrentChapter(1);
  }

  private generateId(): string {
    return `novel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // ==================== Style Management ====================

  /**
   * Get available master authors
   */
  getAvailableMasters(): MasterProfile[] {
    return Object.values(MASTER_PROFILES);
  }

  /**
   * Generate style prompt based on project settings
   */
  generateStylePrompt(customBlend?: { master: MasterStyle; weight: number }[]): string {
    if (!this.currentProject) {
      throw new Error('No project loaded');
    }

    const genre = this.currentProject.genre;

    if (customBlend && customBlend.length > 0) {
      return generateBlendedStylePrompt(customBlend, genre);
    }

    if (this.currentProject.styleInfluences.length === 1) {
      return generateMasterStylePrompt(this.currentProject.styleInfluences[0] as MasterStyle);
    }

    if (this.currentProject.styleInfluences.length > 1) {
      const blend = this.currentProject.styleInfluences.map(id => ({
        master: id as MasterStyle,
        weight: 1 / this.currentProject!.styleInfluences.length
      }));
      return generateBlendedStylePrompt(blend, genre);
    }

    // Default: balanced blend of relevant masters based on genre
    const genreMasters = this.selectMastersForGenre(genre);
    return generateBlendedStylePrompt(genreMasters, genre);
  }

  private selectMastersForGenre(genre: string): { master: MasterStyle; weight: number }[] {
    const genreMappings: Record<string, MasterStyle[]> = {
      'fantasy': ['sanderson', 'rowling', 'tolstoy'],
      'literary': ['dostoevsky', 'tolstoy', 'murakami'],
      'thriller': ['king', 'dostoevsky'],
      'horror': ['king', 'dostoevsky'],
      'romance': ['tolstoy', 'rowling'],
      'mystery': ['king', 'dostoevsky'],
      'scifi': ['sanderson', 'murakami'],
      'contemporary': ['murakami', 'king']
    };

    const masters = genreMappings[genre.toLowerCase()] || ['tolstoy', 'king'] as MasterStyle[];
    return masters.map(id => ({ master: id, weight: 1 / masters.length }));
  }

  // ==================== Memory & Context ====================

  /**
   * Add a character to the memory system
   */
  addCharacter(character: Omit<CharacterMemory, 'relationships' | 'developmentArc' | 'lastUpdated'>): void {
    this.memoryEngine.addCharacter(character);
  }

  /**
   * Add a plot thread
   */
  addPlotThread(thread: Omit<PlotThread, 'keyEvents' | 'foreshadowing'>): void {
    this.memoryEngine.addPlotThread(thread);
  }

  /**
   * Get context for generation
   */
  getGenerationContext(): string {
    const memoryContext = this.memoryEngine.generateContextPrompt({ type: 'all' });
    const currentChapter = this.memoryEngine.getCurrentChapter();
    const foreshadowingContext = this.foreshadowingTracker.generateForeshadowingGuidelines(
      currentChapter, 1 // Default to scene 1
    );

    return `${memoryContext}\n\n=== FORESHADOWING GUIDANCE ===\n${foreshadowingContext}`;
  }

  // ==================== Foreshadowing Management ====================

  /**
   * Plan foreshadowing for the novel
   */
  planForeshadowing(
    title: string,
    description: string,
    plantChapter: number,
    payoffChapter: number,
    options?: {
      type?: 'chekhov-gun' | 'character-hint' | 'plot-seed' | 'symbol' | 'prophecy';
      importance?: 'critical' | 'major' | 'minor' | 'easter-egg';
      wateringChapters?: number[];
    }
  ): ForeshadowingPlan {
    const waterPlans = (options?.wateringChapters || []).map(ch => ({
      targetChapter: ch,
      method: 'Reinforce the foreshadowing element',
      subtlety: 5
    }));

    return this.foreshadowingTracker.createForeshadowing({
      projectId: this.currentProject?.id || 'default',
      title,
      description,
      type: options?.type || 'plot-seed',
      status: 'planted',
      importance: options?.importance || 'major',
      plantPlan: {
        targetChapter: plantChapter,
        method: 'Introduce element naturally',
        subtlety: 7,
        context: description
      },
      waterPlans,
      payoffPlan: {
        targetChapter: payoffChapter,
        method: 'Deliver satisfying payoff',
        impact: 'satisfying',
        buildup: description
      },
      relatedCharacters: [],
      relatedLocations: [],
      relatedItems: [],
      connectedForeshadowings: [],
      notes: ''
    });
  }

  /**
   * Get foreshadowing status for current chapter
   */
  getForeshadowingStatus(): ForeshadowingStatus {
    const currentChapter = this.memoryEngine.getCurrentChapter();
    const activePlans = this.foreshadowingTracker.getActiveForeshadowings(currentChapter);
    const stats = this.foreshadowingTracker.getStats();

    return {
      activePlans: activePlans.length,
      plantedThisChapter: 0,
      wateredThisChapter: 0,
      payoffsThisChapter: 0,
      upcomingPayoffs: activePlans
        .filter(p => p.payoffPlan.targetChapter > currentChapter)
        .map(p => ({
          hint: p.title,
          targetChapter: p.payoffPlan.targetChapter
        })),
      overdueForeshadowing: stats.chekhovViolations
    };
  }

  // ==================== Content Generation ====================

  /**
   * Generate a chapter outline
   */
  generateChapterOutline(
    chapterNumber: number,
    previousSummary: string,
    plotPoints: string[]
  ): ChapterOutline {
    const foreshadowingGuidance = this.foreshadowingTracker.generateForeshadowingGuidelines(chapterNumber, 1);
    const foreshadowingActions: ForeshadowingAction[] = [];

    // Parse foreshadowing guidance into actions
    const activePlans = this.foreshadowingTracker.getActiveForeshadowings(chapterNumber);
    for (const plan of activePlans) {
      if (plan.plantPlan.targetChapter === chapterNumber) {
        foreshadowingActions.push({
          type: 'plant',
          planId: plan.id,
          description: plan.description
        });
      }
      const wateringChapters = plan.waterPlans.map(w => w.targetChapter);
      if (wateringChapters.includes(chapterNumber)) {
        foreshadowingActions.push({
          type: 'water',
          planId: plan.id,
          description: `Reinforce: ${plan.title}`
        });
      }
      if (plan.payoffPlan.targetChapter === chapterNumber) {
        foreshadowingActions.push({
          type: 'payoff',
          planId: plan.id,
          description: plan.payoffPlan.buildup
        });
      }
    }

    const targetWords = this.currentProject ?
      Math.floor(this.currentProject.settings.targetWordCount / this.currentProject.settings.chapterCount) :
      3000;

    return {
      chapterNumber,
      title: `Chapter ${chapterNumber}`,
      summary: '',
      keyEvents: plotPoints,
      charactersPresent: [],
      emotionalBeats: [],
      foreshadowingActions,
      targetWordCount: targetWords
    };
  }

  /**
   * Build the complete generation prompt
   */
  buildGenerationPrompt(
    chapterOutline: ChapterOutline,
    config: Partial<GenerationConfig> = {}
  ): string {
    const mergedConfig = { ...this.defaultConfig, ...config };
    const parts: string[] = [];

    // Style prompt
    parts.push('=== WRITING STYLE ===');
    parts.push(this.generateStylePrompt(mergedConfig.styleBlend));

    // Memory context
    parts.push('\n=== STORY CONTEXT ===');
    parts.push(this.getGenerationContext());

    // Chapter specific instructions
    parts.push('\n=== CHAPTER INSTRUCTIONS ===');
    parts.push(`Chapter ${chapterOutline.chapterNumber}: ${chapterOutline.title}`);
    parts.push(`Target word count: ${chapterOutline.targetWordCount}`);
    parts.push(`\nKey events to include:`);
    for (const event of chapterOutline.keyEvents) {
      parts.push(`- ${event}`);
    }

    // Foreshadowing instructions
    if (mergedConfig.enableForeshadowing && chapterOutline.foreshadowingActions.length > 0) {
      parts.push('\n=== FORESHADOWING REQUIREMENTS ===');
      for (const action of chapterOutline.foreshadowingActions) {
        parts.push(`[${action.type.toUpperCase()}] ${action.description}`);
      }
    }

    // Variety guidance
    if (mergedConfig.enableVarietyCheck) {
      const suggestions = this.varietyEngine.getSuggestions('', 0);
      if (suggestions.length > 0) {
        parts.push('\n=== VARIETY NOTES ===');
        parts.push('Avoid these patterns based on recent writing:');
        for (const suggestion of suggestions.slice(0, 3)) {
          parts.push(`- ${suggestion}`);
        }
      }
    }

    // Quality requirements
    parts.push('\n=== QUALITY REQUIREMENTS ===');
    parts.push(`Minimum quality threshold: ${mergedConfig.qualityThreshold}/100`);
    parts.push('- Use strong, specific verbs');
    parts.push('- Vary sentence structure');
    parts.push('- Show emotions through action, not statements');
    parts.push('- Ensure dialogue serves character and plot');
    parts.push('- Avoid cliches and overused phrases');

    return parts.join('\n');
  }

  /**
   * Validate generated content
   */
  validateContent(
    content: string,
    chapterNumber: number,
    config: Partial<GenerationConfig> = {}
  ): GenerationResult {
    const mergedConfig = { ...this.defaultConfig, ...config };
    const suggestions: string[] = [];

    // Quality validation
    const qualityScore = this.qualityValidator.validateQuality(content, {
      genre: this.currentProject?.genre,
      targetAudience: this.currentProject?.targetAudience
    });

    // Variety analysis
    let varietyAnalysis: VarietyAnalysis | undefined;
    if (mergedConfig.enableVarietyCheck) {
      varietyAnalysis = this.varietyEngine.analyzeText(content);
      suggestions.push(...varietyAnalysis.recommendations);
    }

    // Reader simulation
    let readerSimulations: Map<string, SimulationResult> | undefined;
    if (mergedConfig.enableReaderSimulation) {
      const personas = mergedConfig.targetReaderPersonas ||
        ['casual_reader', 'avid_reader', 'critical_reader'];

      readerSimulations = new Map();
      for (const personaId of personas) {
        this.readerSimulator.startSimulation(personaId);
        const chapterAnalysis = this.readerSimulator.simulateChapterRead(
          personaId,
          content,
          chapterNumber
        );
        const verdict = this.readerSimulator.generateVerdict(personaId);

        readerSimulations.set(personaId, {
          persona: this.readerSimulator.getPersona(personaId)!,
          finalState: this.readerSimulator['activeSimulations'].get(personaId)!,
          engagement: {
            hookStrength: chapterAnalysis.engagementLevel,
            pageturnerScore: chapterAnalysis.engagementLevel,
            cliffhangerEffectiveness: 0,
            emotionalResonance: chapterAnalysis.emotionalImpact,
            intellectualEngagement: chapterAnalysis.clarityScore,
            curiosityGeneration: 70
          },
          pacing: {
            overallPace: 'balanced',
            actionDensity: 0.5,
            dialogueDensity: 0.3,
            descriptionDensity: 0.2,
            tensionCurve: [],
            pacingIssues: []
          },
          chapterByChapterAnalysis: [chapterAnalysis],
          overallVerdict: verdict,
          detailedFeedback: chapterAnalysis.concerns
        });

        suggestions.push(...chapterAnalysis.concerns);
      }
    }

    // Foreshadowing status
    let foreshadowingStatus: ForeshadowingStatus | undefined;
    if (mergedConfig.enableForeshadowing) {
      // Note: Foreshadowing tracking is based on plan definitions, not content parsing
      foreshadowingStatus = this.getForeshadowingStatus();
    }

    // Determine if content is accepted
    const accepted = qualityScore.overall >= mergedConfig.qualityThreshold;

    if (!accepted) {
      suggestions.unshift(
        `Quality score (${qualityScore.overall}) below threshold (${mergedConfig.qualityThreshold}). ` +
        `Focus on: ${qualityScore.recommendations.slice(0, 2).map(r => r.issue).join(', ')}`
      );
    }

    return {
      content,
      qualityScore,
      varietyAnalysis,
      readerSimulations,
      foreshadowingStatus,
      suggestions: Array.from(new Set(suggestions)), // Remove duplicates
      regenerationCount: 0,
      accepted
    };
  }

  /**
   * Process and store a completed chapter
   */
  finalizeChapter(
    chapterNumber: number,
    content: string,
    title?: string
  ): Chapter {
    if (!this.currentProject) {
      throw new Error('No project loaded');
    }

    const qualityScore = this.qualityValidator.validateQuality(content);
    const wordCount = content.split(/\s+/).length;

    const chapter: Chapter = {
      number: chapterNumber,
      title: title || `Chapter ${chapterNumber}`,
      content,
      wordCount,
      status: 'draft',
      qualityScore: qualityScore.overall,
      notes: []
    };

    // Update or add chapter
    const existingIndex = this.currentProject.chapters.findIndex(c => c.number === chapterNumber);
    if (existingIndex >= 0) {
      this.currentProject.chapters[existingIndex] = chapter;
    } else {
      this.currentProject.chapters.push(chapter);
      this.currentProject.chapters.sort((a, b) => a.number - b.number);
    }

    // Update metadata
    this.updateProjectMetadata();

    // Advance memory engine chapter
    this.memoryEngine.setCurrentChapter(chapterNumber + 1);

    // Foreshadowing is tracked through plan definitions

    return chapter;
  }

  private updateProjectMetadata(): void {
    if (!this.currentProject) return;

    const chapters = this.currentProject.chapters;
    this.currentProject.metadata.totalWordCount = chapters.reduce((sum, c) => sum + c.wordCount, 0);
    this.currentProject.metadata.averageQualityScore = chapters.length > 0 ?
      chapters.reduce((sum, c) => sum + (c.qualityScore || 0), 0) / chapters.length : 0;
    this.currentProject.metadata.lastModified = Date.now();
    this.currentProject.metadata.publishingReadiness =
      this.currentProject.metadata.averageQualityScore >= 75;
  }

  // ==================== Analysis & Reports ====================

  /**
   * Generate comprehensive novel analysis report
   */
  analyzeNovel(): NovelAnalysisReport {
    if (!this.currentProject) {
      throw new Error('No project loaded');
    }

    const chapters = this.currentProject.chapters;

    // Analyze each chapter
    const chapterAnalysis: ChapterAnalysisReport[] = chapters.map(chapter => {
      const quality = this.qualityValidator.validateQuality(chapter.content);
      const variety = this.varietyEngine.analyzeText(chapter.content);

      return {
        chapter: chapter.number,
        quality,
        variety,
        issues: [
          ...quality.recommendations.map(r => r.issue),
          ...variety.recommendations
        ]
      };
    });

    // Check consistency
    const consistencyIssues = this.memoryEngine.checkConsistency().map(issue => ({
      type: issue.type,
      description: issue.description,
      chapters: [],
      severity: issue.severity
    }));

    // Foreshadowing health
    const foreshadowingStats = this.foreshadowingTracker.getStats();
    const currentChapter = this.memoryEngine.getCurrentChapter();
    const chekhovIssues = this.foreshadowingTracker.validateChekhovGun(currentChapter, this.currentProject.settings.chapterCount);
    const foreshadowingHealth: ForeshadowingHealth = {
      totalPlans: foreshadowingStats.total,
      resolved: foreshadowingStats.paidOff,
      overdue: foreshadowingStats.forgotten,
      wellPaced: foreshadowingStats.planted - foreshadowingStats.forgotten,
      issues: chekhovIssues.map(i => i.message)
    };

    // Reader engagement summary
    const fullContent = chapters.map(c => c.content);
    const simResults = this.readerSimulator.runFullSimulation(fullContent);
    const engagementScores = Array.from(simResults.values())
      .map(r => r.engagement.pageturnerScore);
    const avgEngagement = engagementScores.reduce((a, b) => a + b, 0) / engagementScores.length;

    const chapterEngagements = chapterAnalysis.map((ca, i) => ({
      chapter: i + 1,
      engagement: ca.quality.categories.emotionalImpact
    }));

    const readerEngagement: ReaderEngagementSummary = {
      averageEngagement: avgEngagement,
      lowestEngagementChapter: chapterEngagements.sort((a, b) => a.engagement - b.engagement)[0]?.chapter || 1,
      highestEngagementChapter: chapterEngagements.sort((a, b) => b.engagement - a.engagement)[0]?.chapter || 1,
      dropoffRisk: chapterAnalysis
        .filter(ca => ca.quality.overall < 60)
        .map(ca => ca.chapter),
      recommendations: Array.from(simResults.values())
        .flatMap(r => r.detailedFeedback)
        .slice(0, 10)
    };

    // Overall quality
    const allContent = chapters.map(c => c.content).join('\n\n');
    const overallQuality = this.qualityValidator.validateQuality(allContent, {
      genre: this.currentProject.genre,
      targetAudience: this.currentProject.targetAudience
    });

    // Priority recommendations
    const recommendations: PriorityRecommendation[] = [];

    // Add quality-based recommendations
    for (const rec of overallQuality.recommendations.slice(0, 5)) {
      recommendations.push({
        priority: rec.priority,
        area: rec.category,
        issue: rec.issue,
        suggestion: rec.recommendation,
        affectedChapters: chapterAnalysis
          .filter(ca => ca.quality.categories[rec.category] < 60)
          .map(ca => ca.chapter)
      });
    }

    // Add foreshadowing recommendations
    if (foreshadowingHealth.overdue > 0) {
      recommendations.push({
        priority: 'high',
        area: 'foreshadowing',
        issue: `${foreshadowingHealth.overdue} overdue foreshadowing payoffs`,
        suggestion: 'Resolve planted foreshadowing elements before readers forget them',
        affectedChapters: []
      });
    }

    // Add engagement recommendations
    if (readerEngagement.dropoffRisk.length > 0) {
      recommendations.push({
        priority: 'high',
        area: 'engagement',
        issue: `High reader dropoff risk in ${readerEngagement.dropoffRisk.length} chapters`,
        suggestion: 'Improve pacing, add hooks, or increase tension in flagged chapters',
        affectedChapters: readerEngagement.dropoffRisk
      });
    }

    recommendations.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    return {
      project: this.currentProject,
      overallQuality,
      chapterAnalysis,
      consistencyIssues,
      foreshadowingHealth,
      readerEngagement,
      recommendations
    };
  }

  /**
   * Get quick quality check for a piece of content
   */
  quickQualityCheck(content: string): {
    grade: QualityGrade;
    score: number;
    topIssues: string[];
    passesThreshold: boolean;
  } {
    const result = this.qualityValidator.validateQuality(content);

    return {
      grade: result.grade,
      score: result.overall,
      topIssues: result.recommendations.slice(0, 3).map(r => r.issue),
      passesThreshold: result.overall >= this.defaultConfig.qualityThreshold
    };
  }

  /**
   * Export project for saving
   */
  exportProject(): NovelProject | null {
    return this.currentProject;
  }

  /**
   * Get current project status
   */
  getProjectStatus(): {
    title: string;
    progress: number;
    wordCount: number;
    averageQuality: number;
    publishingReady: boolean;
  } | null {
    if (!this.currentProject) return null;

    const targetWords = this.currentProject.settings.targetWordCount;
    const currentWords = this.currentProject.metadata.totalWordCount;

    return {
      title: this.currentProject.title,
      progress: Math.min(100, (currentWords / targetWords) * 100),
      wordCount: currentWords,
      averageQuality: this.currentProject.metadata.averageQualityScore,
      publishingReady: this.currentProject.metadata.publishingReadiness
    };
  }
}

// Export singleton instance
export const aiLiteratureEngine = new AILiteratureEngine();

// Re-export types and classes for convenience
export {
  MASTER_PROFILES,
  generateMasterStylePrompt,
  generateBlendedStylePrompt
} from './literaryMasters';

export { ForeshadowingTracker } from './foreshadowingTracker';
export { VarietyEngine } from './varietyEngine';
export { AdvancedMemoryEngine } from './advancedMemoryEngine';
export { ReaderSimulationEngine } from './readerSimulation';
export { QualityValidator } from './qualityValidator';
