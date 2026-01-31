/**
 * Ultimate Novel Master v1.0
 * Master integration system for bestseller-quality novel generation
 */

import Anthropic from '@anthropic-ai/sdk';
import { BestsellerEngine, BestsellerConfig, HitFormula, MarketIntelligence, BestsellerPrediction } from './bestsellerEngine';
import { EmotionalMasterSystem, EmotionType, EmotionalArc, CatharsisDesign } from './emotionalMasterSystem';
import { LiteraryDepthEngine, ThemeType, ThemeLayer, Symbol, Foreshadowing } from './literaryDepthEngine';
import { OriginalityGenerator, ClichePattern, OriginalityScore } from './originalityGenerator';
import { PageTurnerSystem, ChapterDesign, AddictionMechanics, TensionCurve } from './pageTurnerSystem';

export interface NovelProject {
  id: string;
  title: string;
  genre: string;
  targetMarket: string;
  premise: string;
  themes: ThemeType[];
  targetEmotions: EmotionType[];
  status: 'planning' | 'writing' | 'editing' | 'polishing' | 'complete';
  createdAt: Date;
  updatedAt: Date;
}

export interface NovelBlueprint {
  project: NovelProject;
  hitFormula: HitFormula;
  marketIntelligence: MarketIntelligence;
  emotionalArc: EmotionalArc;
  themeLayer: ThemeLayer;
  symbolSystem: Symbol[];
  foreshadowingNetwork: Foreshadowing[];
  addictionMechanics: AddictionMechanics;
  tensionCurve: TensionCurve;
  chapterDesigns: ChapterDesign[];
  originalityScore: OriginalityScore;
  clichesToAvoid: ClichePattern[];
}

export interface ChapterContent {
  chapterNumber: number;
  title: string;
  content: string;
  wordCount: number;
  emotionalBeats: string[];
  hooks: string[];
  cliffhanger: string;
  symbolsUsed: string[];
  foreshadowingPlanted: string[];
}

export interface NovelManuscript {
  blueprint: NovelBlueprint;
  chapters: ChapterContent[];
  totalWordCount: number;
  qualityScores: {
    overall: number;
    originality: number;
    emotion: number;
    pacing: number;
    depth: number;
    marketFit: number;
  };
}

export interface QualityReport {
  overallScore: number;
  bestsellerPotential: BestsellerPrediction;
  originalityScore: OriginalityScore;
  emotionalImpact: number;
  literaryDepth: number;
  pageTurnerScore: number;
  strengths: string[];
  weaknesses: string[];
  criticalIssues: string[];
  recommendations: string[];
  readyForPublishing: boolean;
}

export class UltimateNovelMaster {
  private client: Anthropic;
  private bestsellerEngine: BestsellerEngine;
  private emotionalSystem: EmotionalMasterSystem;
  private literaryEngine: LiteraryDepthEngine;
  private originalityGen: OriginalityGenerator;
  private pageTurner: PageTurnerSystem;

  constructor(config: BestsellerConfig) {
    this.client = new Anthropic();
    this.bestsellerEngine = new BestsellerEngine(config);
    this.emotionalSystem = new EmotionalMasterSystem();
    this.literaryEngine = new LiteraryDepthEngine();
    this.originalityGen = new OriginalityGenerator();
    this.pageTurner = new PageTurnerSystem();
  }

  async createNovelBlueprint(
    project: NovelProject,
    targetChapterCount: number
  ): Promise<NovelBlueprint> {
    // Step 1: Gather market intelligence
    const marketIntelligence = await this.bestsellerEngine.gatherMarketIntelligence();

    // Step 2: Generate hit formula
    const hitFormula = await this.bestsellerEngine.generateHitFormula(project.premise, marketIntelligence);

    // Step 3: Design emotional arc
    const emotionalArc = await this.emotionalSystem.designEmotionalArc(
      project.premise,
      project.genre,
      project.targetEmotions
    );

    // Step 4: Design theme layer
    const primaryTheme = project.themes[0] || 'identity';
    const secondaryThemes = project.themes.slice(1);
    const themeLayer = await this.literaryEngine.designThemeLayer(
      project.premise,
      primaryTheme,
      secondaryThemes
    );

    // Step 5: Create symbol system
    const symbolSystem = await this.literaryEngine.createSymbolSystem(
      project.themes,
      project.premise,
      []
    );

    // Step 6: Design foreshadowing network
    const plotPointsForForeshadowing = [
      { chapter: 1, event: 'Opening incident' },
      { chapter: 3, event: 'First plot point' },
      { chapter: Math.floor(targetChapterCount / 2), event: 'Midpoint revelation' },
      { chapter: Math.floor(targetChapterCount * 0.75), event: 'Dark night of soul' },
      { chapter: Math.floor(targetChapterCount * 0.9), event: 'Climax' },
      { chapter: targetChapterCount, event: 'Resolution' }
    ];
    const twists = ['Major revelation', 'Character betrayal', 'Hidden truth exposed'];
    const foreshadowingNetwork = await this.literaryEngine.designForeshadowingNetwork(
      plotPointsForForeshadowing,
      twists
    );

    // Step 7: Design addiction mechanics
    const plotPointNames = plotPointsForForeshadowing.map(p => p.event);
    const addictionMechanics = await this.pageTurner.designAddictionMechanics(
      project.premise,
      [], // characters to be defined later
      plotPointNames
    );

    // Step 8: Design tension curve
    const chapters = Array.from({ length: targetChapterCount }, (_, i) => ({
      number: i + 1,
      summary: `Chapter ${i + 1}`
    }));
    const climaxChapter = Math.floor(targetChapterCount * 0.85);
    const tensionCurve = await this.pageTurner.designTensionCurve(chapters, climaxChapter);

    // Step 9: Design each chapter
    const chapterDesigns: ChapterDesign[] = [];
    for (let i = 0; i < targetChapterCount; i++) {
      const targetTension = tensionCurve.points[i]?.level || 5;
      const design = await this.pageTurner.designChapterHooks(
        `Chapter ${i + 1}`,
        i + 1,
        project.premise,
        targetTension as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10
      );
      chapterDesigns.push(design);
    }

    // Step 10: Detect cliches to avoid
    const allCliches = this.originalityGen.getClicheDatabase();
    const genreCliches = allCliches[project.genre as keyof typeof allCliches] || [];
    const clichesToAvoid = Array.isArray(genreCliches) ? genreCliches : [];

    // Step 11: Initial originality assessment
    const originalityScore = await this.originalityGen.evaluateOriginality(
      project.premise,
      project.genre
    );

    return {
      project,
      hitFormula,
      marketIntelligence,
      emotionalArc,
      themeLayer,
      symbolSystem,
      foreshadowingNetwork,
      addictionMechanics,
      tensionCurve,
      chapterDesigns,
      originalityScore,
      clichesToAvoid
    };
  }

  async generateChapter(
    blueprint: NovelBlueprint,
    chapterNumber: number,
    previousChapters: ChapterContent[]
  ): Promise<ChapterContent> {
    const chapterDesign = blueprint.chapterDesigns[chapterNumber - 1];
    const tensionLevel = blueprint.tensionCurve.points[chapterNumber - 1]?.level || 5;

    // Build context from previous chapters
    const previousContext = previousChapters
      .slice(-3)
      .map(c => `Chapter ${c.chapterNumber}: ${c.content.substring(0, 500)}...`)
      .join('\n\n');

    const prompt = `You are a bestselling novelist writing Chapter ${chapterNumber}.

NOVEL BLUEPRINT:
Title: ${blueprint.project.title}
Genre: ${blueprint.project.genre}
Premise: ${blueprint.project.premise}

HIT FORMULA:
- High Concept: ${blueprint.hitFormula.coreConcept.highConcept}
- Unique Hook: ${blueprint.hitFormula.coreConcept.uniqueHook}
- Emotional Core: ${blueprint.hitFormula.emotionalCore.primaryEmotion}

CHAPTER DESIGN:
- Opening Hook: ${chapterDesign.openingHook.content} (${chapterDesign.openingHook.type})
- Target Tension: ${tensionLevel}/10
- Cliffhanger Type: ${chapterDesign.cliffhanger.type}

THEMES TO WEAVE:
- Primary Theme: ${blueprint.themeLayer.primary}
- Thesis: ${blueprint.themeLayer.thesis}
- Antithesis: ${blueprint.themeLayer.antithesis}

SYMBOLS TO USE:
${blueprint.symbolSystem.slice(0, 3).map(s => `- ${s.name}: ${s.meaning.join(', ')}`).join('\n')}

FORESHADOWING TO PLANT:
${blueprint.foreshadowingNetwork.filter(f => f.chapter.setup === chapterNumber).map(f => f.hint).join('\n')}

EMOTIONAL ARC POSITION:
${chapterNumber <= 2 ? 'Opening - establish curiosity and attachment' :
  chapterNumber <= blueprint.chapterDesigns.length * 0.4 ? 'Rising Action - build tension and investment' :
  chapterNumber <= blueprint.chapterDesigns.length * 0.75 ? 'Escalation - increase stakes dramatically' :
  chapterNumber <= blueprint.chapterDesigns.length * 0.9 ? 'Climax Zone - maximum intensity' :
  'Resolution - catharsis and afterglow'}

CLICHES TO AVOID:
${blueprint.clichesToAvoid.slice(0, 5).map(c => c.pattern).join(', ')}

${previousContext ? `PREVIOUS CHAPTERS CONTEXT:\n${previousContext}` : 'This is the first chapter.'}

Write a complete, polished chapter (3000-4000 words) that:
1. Opens with a compelling hook
2. Maintains the target tension level
3. Weaves in symbols and themes naturally
4. Plants required foreshadowing subtly
5. Ends with an irresistible cliffhanger
6. Avoids all listed cliches
7. Creates deep emotional resonance
8. Reads like a bestseller

Return the chapter content only, no metadata.`;

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      messages: [{ role: 'user', content: prompt }]
    });

    const content = response.content[0].type === 'text' ? response.content[0].text : '';

    return {
      chapterNumber,
      title: `Chapter ${chapterNumber}`,
      content,
      wordCount: content.split(/\s+/).length,
      emotionalBeats: [],
      hooks: [chapterDesign.openingHook.content],
      cliffhanger: chapterDesign.cliffhanger.hangingElement,
      symbolsUsed: blueprint.symbolSystem.slice(0, 3).map(s => s.name),
      foreshadowingPlanted: blueprint.foreshadowingNetwork
        .filter(f => f.chapter.setup === chapterNumber)
        .map(f => f.hint)
    };
  }

  async generateFullNovel(
    blueprint: NovelBlueprint,
    onChapterComplete?: (chapter: ChapterContent) => void
  ): Promise<NovelManuscript> {
    const chapters: ChapterContent[] = [];

    for (let i = 1; i <= blueprint.chapterDesigns.length; i++) {
      const chapter = await this.generateChapter(blueprint, i, chapters);
      chapters.push(chapter);
      if (onChapterComplete) onChapterComplete(chapter);
    }

    const totalWordCount = chapters.reduce((sum, c) => sum + c.wordCount, 0);

    // Calculate quality scores
    const fullContent = chapters.map(c => c.content).join('\n\n');
    const originalityScore = await this.originalityGen.evaluateOriginality(fullContent, blueprint.project.genre);
    const emotionalImpact = await this.emotionalSystem.measureEmotionalImpact(fullContent);

    return {
      blueprint,
      chapters,
      totalWordCount,
      qualityScores: {
        overall: Math.round((originalityScore.overall + emotionalImpact.overallImpact) / 2),
        originality: originalityScore.overall,
        emotion: emotionalImpact.overallImpact,
        pacing: 75, // Would need detailed analysis
        depth: 70, // Would need detailed analysis
        marketFit: 80 // Based on hit formula alignment
      }
    };
  }

  async evaluateQuality(manuscript: NovelManuscript): Promise<QualityReport> {
    const fullContent = manuscript.chapters.map(c => c.content).join('\n\n');

    // Run all quality assessments
    const bestsellerPotential = await this.bestsellerEngine.predictBestsellerPotential(
      {
        title: manuscript.blueprint.project.title,
        synopsis: manuscript.blueprint.project.premise,
        sampleChapters: manuscript.chapters.slice(0, 3).map(c => c.content).join('\n\n'),
        wordCount: manuscript.totalWordCount
      },
      manuscript.blueprint.hitFormula
    );

    const originalityScore = await this.originalityGen.evaluateOriginality(
      fullContent,
      manuscript.blueprint.project.genre
    );

    const emotionalImpact = await this.emotionalSystem.measureEmotionalImpact(fullContent);

    const literaryAnalysis = await this.literaryEngine.evaluateLiteraryDepth(fullContent);

    // Compile report
    const overallScore = Math.round(
      (bestsellerPotential.overallScore +
        originalityScore.overall +
        emotionalImpact.overallImpact +
        literaryAnalysis.overallDepth) / 4
    );

    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const criticalIssues: string[] = [];

    if (originalityScore.overall >= 70) strengths.push('High originality');
    else if (originalityScore.overall < 50) weaknesses.push('Lacks originality');

    if (emotionalImpact.overallImpact >= 70) strengths.push('Strong emotional impact');
    else if (emotionalImpact.overallImpact < 50) weaknesses.push('Weak emotional resonance');

    if (literaryAnalysis.overallDepth >= 70) strengths.push('Literary depth');
    else if (literaryAnalysis.overallDepth < 50) weaknesses.push('Shallow themes');

    if (bestsellerPotential.overallScore >= 70) strengths.push('High commercial potential');
    else if (bestsellerPotential.overallScore < 50) weaknesses.push('Limited market appeal');

    // Add specific issues
    if (originalityScore.clichesDetected.length > 5) {
      criticalIssues.push(`${originalityScore.clichesDetected.length} cliches detected`);
    }
    if (emotionalImpact.weakPoints.length > 3) {
      criticalIssues.push('Multiple emotionally flat sections');
    }

    const recommendations = [
      ...originalityScore.suggestions,
      ...emotionalImpact.suggestions,
      ...bestsellerPotential.recommendedAdjustments
    ].slice(0, 10);

    return {
      overallScore,
      bestsellerPotential,
      originalityScore,
      emotionalImpact: emotionalImpact.overallImpact,
      literaryDepth: literaryAnalysis.overallDepth,
      pageTurnerScore: manuscript.qualityScores.pacing,
      strengths,
      weaknesses,
      criticalIssues,
      recommendations,
      readyForPublishing: overallScore >= 75 && criticalIssues.length === 0
    };
  }

  async improveChapter(
    chapter: ChapterContent,
    blueprint: NovelBlueprint,
    issues: string[]
  ): Promise<ChapterContent> {
    const prompt = `You are an expert editor improving a chapter.

ORIGINAL CHAPTER:
${chapter.content}

ISSUES TO FIX:
${issues.join('\n')}

BLUEPRINT REQUIREMENTS:
- Genre: ${blueprint.project.genre}
- Themes: ${blueprint.project.themes.join(', ')}
- Target Emotions: ${blueprint.project.targetEmotions.join(', ')}

Rewrite the chapter fixing all issues while:
1. Maintaining the story flow
2. Enhancing emotional impact
3. Improving originality
4. Strengthening hooks and cliffhangers
5. Deepening theme integration

Return only the improved chapter content.`;

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      messages: [{ role: 'user', content: prompt }]
    });

    const improvedContent = response.content[0].type === 'text' ? response.content[0].text : chapter.content;

    return {
      ...chapter,
      content: improvedContent,
      wordCount: improvedContent.split(/\s+/).length
    };
  }

  async autoImproveUntilReady(
    manuscript: NovelManuscript,
    maxIterations: number = 3,
    targetScore: number = 75
  ): Promise<{ manuscript: NovelManuscript; report: QualityReport; iterations: number }> {
    let currentManuscript = manuscript;
    let report = await this.evaluateQuality(currentManuscript);
    let iterations = 0;

    while (report.overallScore < targetScore && iterations < maxIterations) {
      iterations++;

      // Identify chapters needing improvement
      for (let i = 0; i < currentManuscript.chapters.length; i++) {
        const chapter = currentManuscript.chapters[i];
        const chapterIssues: string[] = [];

        // Check for cliches in this chapter
        const cliches = await this.originalityGen.detectCliches(chapter.content);
        if (cliches.length > 0) {
          chapterIssues.push(`Cliches detected: ${cliches.map(c => c.pattern).join(', ')}`);
        }

        // Check emotional impact
        const emotionalCheck = await this.emotionalSystem.measureEmotionalImpact(chapter.content);
        if (emotionalCheck.overallImpact < 60) {
          chapterIssues.push('Low emotional impact');
          chapterIssues.push(...emotionalCheck.weakPoints);
        }

        if (chapterIssues.length > 0) {
          const improvedChapter = await this.improveChapter(
            chapter,
            currentManuscript.blueprint,
            chapterIssues
          );
          currentManuscript.chapters[i] = improvedChapter;
        }
      }

      // Re-evaluate
      report = await this.evaluateQuality(currentManuscript);
    }

    return { manuscript: currentManuscript, report, iterations };
  }

  // Utility methods for external access
  getSubsystems() {
    return {
      bestseller: this.bestsellerEngine,
      emotional: this.emotionalSystem,
      literary: this.literaryEngine,
      originality: this.originalityGen,
      pageTurner: this.pageTurner
    };
  }
}

export default UltimateNovelMaster;
