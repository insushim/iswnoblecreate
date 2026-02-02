/**
 * Reader Simulation Engine
 *
 * Simulates different reader personas to evaluate:
 * - Engagement and pacing
 * - Emotional resonance
 * - Clarity and comprehension
 * - Interest maintenance
 * - Predictability vs surprise balance
 */

export interface ReaderPersona {
  id: string;
  name: string;
  type: 'casual' | 'avid' | 'critical' | 'genre_fan' | 'literary';
  characteristics: {
    patienceLevel: number; // 1-10: how long they'll wait for payoff
    attentionToDetail: number; // 1-10: catches subtle foreshadowing
    emotionalReceptivity: number; // 1-10: responds to emotional beats
    criticalEye: number; // 1-10: notices plot holes, inconsistencies
    genreExpectations: string[]; // What they expect from the genre
    petPeeves: string[]; // What annoys them
  };
  readingSpeed: 'slow' | 'medium' | 'fast';
  preferences: {
    preferredPacing: 'slow_burn' | 'balanced' | 'fast_paced';
    toleratesExposition: boolean;
    needsActionRegularly: boolean;
    appreciatesSubtext: boolean;
  };
}

export interface ReaderState {
  personaId: string;
  engagement: number; // 0-100
  emotionalInvestment: number; // 0-100
  confusion: number; // 0-100
  anticipation: number; // 0-100
  satisfaction: number; // 0-100
  currentMood: 'bored' | 'curious' | 'engaged' | 'excited' | 'confused' | 'satisfied' | 'frustrated';
  predictions: ReaderPrediction[];
  unansweredQuestions: string[];
  emotionalJourney: EmotionalBeat[];
  attentionSpan: number; // Remaining patience
  wouldContinueReading: boolean;
  wouldRecommend: boolean;
}

export interface ReaderPrediction {
  chapter: number;
  prediction: string;
  confidence: number;
  resolved: boolean;
  wasCorrect?: boolean;
}

export interface EmotionalBeat {
  chapter: number;
  paragraph: number;
  emotion: string;
  intensity: number;
  trigger: string;
}

export interface PacingAnalysis {
  overallPace: 'too_slow' | 'slow' | 'balanced' | 'fast' | 'too_fast';
  actionDensity: number;
  dialogueDensity: number;
  descriptionDensity: number;
  tensionCurve: TensionPoint[];
  pacingIssues: PacingIssue[];
}

export interface TensionPoint {
  position: number; // 0-100% of text
  tension: number; // 0-100
  type: 'rising' | 'climax' | 'falling' | 'plateau';
}

export interface PacingIssue {
  position: number;
  issue: string;
  severity: 'minor' | 'moderate' | 'major';
  suggestion: string;
}

export interface EngagementMetrics {
  hookStrength: number; // First paragraph/chapter hook
  pageturnerScore: number; // Would reader keep reading?
  cliffhangerEffectiveness: number;
  emotionalResonance: number;
  intellectualEngagement: number;
  curiosityGeneration: number;
}

export interface SimulationResult {
  persona: ReaderPersona;
  finalState: ReaderState;
  engagement: EngagementMetrics;
  pacing: PacingAnalysis;
  chapterByChapterAnalysis: ChapterAnalysis[];
  overallVerdict: ReaderVerdict;
  detailedFeedback: string[];
}

export interface ChapterAnalysis {
  chapter: number;
  engagementLevel: number;
  emotionalImpact: number;
  clarityScore: number;
  pacingScore: number;
  highlightMoments: string[];
  concerns: string[];
}

export interface ReaderVerdict {
  wouldFinish: boolean;
  wouldRecommend: boolean;
  rating: number; // 1-5 stars
  summary: string;
  strengths: string[];
  weaknesses: string[];
}

// Default reader personas
const DEFAULT_PERSONAS: ReaderPersona[] = [
  {
    id: 'casual_reader',
    name: 'Casual Reader',
    type: 'casual',
    characteristics: {
      patienceLevel: 4,
      attentionToDetail: 3,
      emotionalReceptivity: 7,
      criticalEye: 3,
      genreExpectations: ['entertainment', 'easy to follow'],
      petPeeves: ['slow pacing', 'too many characters', 'confusing plots']
    },
    readingSpeed: 'fast',
    preferences: {
      preferredPacing: 'fast_paced',
      toleratesExposition: false,
      needsActionRegularly: true,
      appreciatesSubtext: false
    }
  },
  {
    id: 'avid_reader',
    name: 'Avid Reader',
    type: 'avid',
    characteristics: {
      patienceLevel: 7,
      attentionToDetail: 6,
      emotionalReceptivity: 8,
      criticalEye: 5,
      genreExpectations: ['good characters', 'engaging plot', 'emotional depth'],
      petPeeves: ['predictable plots', 'flat characters', 'inconsistencies']
    },
    readingSpeed: 'medium',
    preferences: {
      preferredPacing: 'balanced',
      toleratesExposition: true,
      needsActionRegularly: false,
      appreciatesSubtext: true
    }
  },
  {
    id: 'critical_reader',
    name: 'Critical Reader',
    type: 'critical',
    characteristics: {
      patienceLevel: 6,
      attentionToDetail: 9,
      emotionalReceptivity: 5,
      criticalEye: 9,
      genreExpectations: ['originality', 'craft', 'depth'],
      petPeeves: ['cliches', 'plot holes', 'telling not showing', 'weak prose']
    },
    readingSpeed: 'slow',
    preferences: {
      preferredPacing: 'balanced',
      toleratesExposition: true,
      needsActionRegularly: false,
      appreciatesSubtext: true
    }
  },
  {
    id: 'literary_reader',
    name: 'Literary Reader',
    type: 'literary',
    characteristics: {
      patienceLevel: 9,
      attentionToDetail: 10,
      emotionalReceptivity: 8,
      criticalEye: 8,
      genreExpectations: ['beautiful prose', 'thematic depth', 'character study', 'symbolism'],
      petPeeves: ['genre cliches', 'simplistic themes', 'purple prose', 'melodrama']
    },
    readingSpeed: 'slow',
    preferences: {
      preferredPacing: 'slow_burn',
      toleratesExposition: true,
      needsActionRegularly: false,
      appreciatesSubtext: true
    }
  },
  {
    id: 'genre_fan',
    name: 'Genre Fan',
    type: 'genre_fan',
    characteristics: {
      patienceLevel: 6,
      attentionToDetail: 7,
      emotionalReceptivity: 8,
      criticalEye: 6,
      genreExpectations: ['genre conventions', 'familiar tropes done well', 'satisfying payoffs'],
      petPeeves: ['subverted expectations without payoff', 'genre misrepresentation']
    },
    readingSpeed: 'medium',
    preferences: {
      preferredPacing: 'balanced',
      toleratesExposition: true,
      needsActionRegularly: false,
      appreciatesSubtext: true
    }
  }
];

export class ReaderSimulationEngine {
  private personas: Map<string, ReaderPersona> = new Map();
  private activeSimulations: Map<string, ReaderState> = new Map();

  constructor() {
    this.initializeDefaultPersonas();
  }

  private initializeDefaultPersonas(): void {
    for (const persona of DEFAULT_PERSONAS) {
      this.personas.set(persona.id, persona);
    }
  }

  addPersona(persona: ReaderPersona): void {
    this.personas.set(persona.id, persona);
  }

  getPersona(personaId: string): ReaderPersona | undefined {
    return this.personas.get(personaId);
  }

  getAllPersonas(): ReaderPersona[] {
    return Array.from(this.personas.values());
  }

  /**
   * Initialize a reading simulation for a persona
   */
  startSimulation(personaId: string): ReaderState {
    const persona = this.personas.get(personaId);
    if (!persona) {
      throw new Error(`Persona not found: ${personaId}`);
    }

    const state: ReaderState = {
      personaId,
      engagement: 50, // Start neutral
      emotionalInvestment: 0,
      confusion: 0,
      anticipation: 0,
      satisfaction: 0,
      currentMood: 'curious',
      predictions: [],
      unansweredQuestions: [],
      emotionalJourney: [],
      attentionSpan: persona.characteristics.patienceLevel * 10,
      wouldContinueReading: true,
      wouldRecommend: false
    };

    this.activeSimulations.set(personaId, state);
    return state;
  }

  /**
   * Simulate reading a chapter
   */
  simulateChapterRead(
    personaId: string,
    chapterContent: string,
    chapterNumber: number
  ): ChapterAnalysis {
    const state = this.activeSimulations.get(personaId);
    const persona = this.personas.get(personaId);

    if (!state || !persona) {
      throw new Error(`No active simulation for persona: ${personaId}`);
    }

    const analysis: ChapterAnalysis = {
      chapter: chapterNumber,
      engagementLevel: 0,
      emotionalImpact: 0,
      clarityScore: 0,
      pacingScore: 0,
      highlightMoments: [],
      concerns: []
    };

    // Analyze content
    const contentMetrics = this.analyzeContent(chapterContent);

    // Calculate engagement based on persona preferences
    analysis.engagementLevel = this.calculateEngagement(persona, contentMetrics, state);

    // Calculate emotional impact
    analysis.emotionalImpact = this.calculateEmotionalImpact(persona, chapterContent);

    // Calculate clarity
    analysis.clarityScore = this.calculateClarity(persona, chapterContent);

    // Calculate pacing score
    analysis.pacingScore = this.calculatePacingScore(persona, contentMetrics);

    // Find highlight moments
    analysis.highlightMoments = this.findHighlightMoments(chapterContent);

    // Identify concerns
    analysis.concerns = this.identifyConcerns(persona, contentMetrics, chapterContent);

    // Update reader state
    this.updateReaderState(state, persona, analysis);

    return analysis;
  }

  /**
   * Analyze content metrics
   */
  private analyzeContent(content: string): ContentMetrics {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim());
    const words = content.split(/\s+/).filter(w => w.length > 0);
    const paragraphs = content.split(/\n\n+/).filter(p => p.trim());

    // Count dialogue
    const dialogueMatches = content.match(/"[^"]+"/g) || [];
    const dialogueWords = dialogueMatches.join(' ').split(/\s+/).length;
    const dialogueRatio = dialogueWords / words.length;

    // Count action verbs
    const actionVerbs = ['ran', 'jumped', 'hit', 'grabbed', 'pulled', 'pushed', 'threw', 'caught', 'dodged', 'attacked', 'fled', 'charged', 'struck'];
    let actionCount = 0;
    for (const verb of actionVerbs) {
      const regex = new RegExp(`\\b${verb}\\b`, 'gi');
      const matches = content.match(regex);
      actionCount += matches ? matches.length : 0;
    }
    const actionDensity = actionCount / paragraphs.length;

    // Count description indicators
    const descriptionWords = ['was', 'were', 'seemed', 'appeared', 'looked', 'felt'];
    let descriptionCount = 0;
    for (const word of descriptionWords) {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      const matches = content.match(regex);
      descriptionCount += matches ? matches.length : 0;
    }

    // Check for hooks
    const firstParagraph = paragraphs[0] || '';
    const hasHook = this.detectHook(firstParagraph);

    // Check for cliffhanger
    const lastParagraph = paragraphs[paragraphs.length - 1] || '';
    const hasCliffhanger = this.detectCliffhanger(lastParagraph);

    // Calculate tension indicators
    const tensionWords = ['suddenly', 'danger', 'fear', 'threat', 'scream', 'death', 'kill', 'desperate', 'urgent', 'panic'];
    let tensionCount = 0;
    for (const word of tensionWords) {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      const matches = content.match(regex);
      tensionCount += matches ? matches.length : 0;
    }

    return {
      wordCount: words.length,
      sentenceCount: sentences.length,
      paragraphCount: paragraphs.length,
      averageSentenceLength: words.length / sentences.length,
      dialogueRatio,
      actionDensity,
      descriptionDensity: descriptionCount / paragraphs.length,
      hasHook,
      hasCliffhanger,
      tensionIndicators: tensionCount
    };
  }

  private detectHook(paragraph: string): boolean {
    // Check for hook patterns
    const hookPatterns = [
      /^"[^"]+"/,  // Starts with dialogue
      /\?$/,       // Ends with question
      /dead|death|kill|blood/i,  // Dark elements
      /secret|mystery|strange|unusual/i,  // Mystery elements
      /never|always|everything|nothing/i,  // Absolute statements
    ];

    return hookPatterns.some(pattern => pattern.test(paragraph));
  }

  private detectCliffhanger(paragraph: string): boolean {
    const cliffhangerPatterns = [
      /\.\.\."?$/,  // Trailing off
      /\?$/,        // Question
      /!$/,         // Exclamation
      /but then/i,
      /suddenly/i,
      /until/i,
      /before [^.]+could/i,
    ];

    return cliffhangerPatterns.some(pattern => pattern.test(paragraph));
  }

  /**
   * Calculate engagement based on persona and content
   */
  private calculateEngagement(
    persona: ReaderPersona,
    metrics: ContentMetrics,
    currentState: ReaderState
  ): number {
    let engagement = currentState.engagement;

    // Pacing alignment
    const pacingScore = this.getPacingAlignment(persona, metrics);
    engagement += (pacingScore - 50) * 0.3;

    // Hook bonus
    if (metrics.hasHook) {
      engagement += 10;
    }

    // Cliffhanger bonus
    if (metrics.hasCliffhanger) {
      engagement += 15;
    }

    // Dialogue preference (casual readers like more dialogue)
    if (persona.type === 'casual') {
      if (metrics.dialogueRatio > 0.3) engagement += 10;
      if (metrics.dialogueRatio < 0.1) engagement -= 10;
    }

    // Action preference
    if (persona.preferences.needsActionRegularly) {
      if (metrics.actionDensity < 0.5) engagement -= 15;
      if (metrics.actionDensity > 1) engagement += 10;
    }

    // Length fatigue for impatient readers
    if (persona.characteristics.patienceLevel < 5 && metrics.wordCount > 3000) {
      engagement -= 10;
    }

    return Math.max(0, Math.min(100, engagement));
  }

  private getPacingAlignment(persona: ReaderPersona, metrics: ContentMetrics): number {
    const actualPacing = metrics.actionDensity > 1 ? 'fast_paced' :
                        metrics.actionDensity < 0.3 ? 'slow_burn' : 'balanced';

    if (actualPacing === persona.preferences.preferredPacing) return 80;
    if (persona.preferences.preferredPacing === 'balanced') return 60;
    return 40;
  }

  /**
   * Calculate emotional impact
   */
  private calculateEmotionalImpact(persona: ReaderPersona, content: string): number {
    let impact = 0;
    const receptivity = persona.characteristics.emotionalReceptivity;

    // Emotional keywords
    const emotionalPatterns: Record<string, number> = {
      'love|loved|loving': 8,
      'hate|hated|hatred': 7,
      'fear|afraid|terrified': 8,
      'joy|happy|happiness': 6,
      'sad|sorrow|grief': 8,
      'anger|angry|rage': 7,
      'hope|hopeful': 6,
      'despair|hopeless': 9,
      'betrayal|betrayed': 9,
      'sacrifice': 9,
      'death|died|dying': 8,
      'tears|crying|wept': 7
    };

    for (const [pattern, weight] of Object.entries(emotionalPatterns)) {
      const regex = new RegExp(`\\b(${pattern})\\b`, 'gi');
      const matches = content.match(regex);
      if (matches) {
        impact += matches.length * weight * (receptivity / 10);
      }
    }

    return Math.min(100, impact);
  }

  /**
   * Calculate clarity score
   */
  private calculateClarity(persona: ReaderPersona, content: string): number {
    let clarity = 80; // Start with high clarity

    const sentences = content.split(/[.!?]+/).filter(s => s.trim());

    // Very long sentences reduce clarity
    const longSentences = sentences.filter(s => s.split(/\s+/).length > 40);
    clarity -= longSentences.length * 5;

    // Check for clarity issues
    const confusingPatterns = [
      /\b(he|she|they|it)\b.*\b(he|she|they|it)\b.*\b(he|she|they|it)\b/gi, // Pronoun confusion
      /\b(former|latter)\b/gi, // These are often confusing
      /\b(respectively)\b/gi,
    ];

    for (const pattern of confusingPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        clarity -= matches.length * 3;
      }
    }

    // Critical readers are more affected by clarity issues
    if (persona.type === 'critical') {
      clarity = clarity * 0.9; // More sensitive
    }

    return Math.max(0, Math.min(100, clarity));
  }

  /**
   * Calculate pacing score
   */
  private calculatePacingScore(persona: ReaderPersona, metrics: ContentMetrics): number {
    let score = 70;

    // Check variance in sentence length (good for pacing)
    // This is simplified - real implementation would calculate actual variance

    // Action density alignment
    if (persona.preferences.preferredPacing === 'fast_paced') {
      if (metrics.actionDensity < 0.5) score -= 20;
      if (metrics.actionDensity > 1) score += 10;
    } else if (persona.preferences.preferredPacing === 'slow_burn') {
      if (metrics.actionDensity > 1.5) score -= 15;
    }

    // Dialogue breaks up description (good for pacing)
    if (metrics.dialogueRatio > 0.2 && metrics.dialogueRatio < 0.5) {
      score += 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Find highlight moments in text
   */
  private findHighlightMoments(content: string): string[] {
    const highlights: string[] = [];
    const sentences = content.split(/[.!?]+/).filter(s => s.trim());

    // Strong emotional beats
    const emotionalIndicators = ['heart', 'tears', 'love', 'hate', 'fear', 'joy'];
    for (const sentence of sentences) {
      if (emotionalIndicators.some(ind => sentence.toLowerCase().includes(ind))) {
        if (sentence.length < 200) {
          highlights.push(sentence.trim().slice(0, 100) + '...');
        }
      }
    }

    // Dialogue with emotional weight
    const dialogues = content.match(/"[^"]+"/g) || [];
    for (const dialogue of dialogues) {
      if (dialogue.includes('!') || dialogue.includes('?') || dialogue.length > 50) {
        highlights.push(dialogue.slice(0, 80) + (dialogue.length > 80 ? '...' : ''));
      }
    }

    return highlights.slice(0, 5);
  }

  /**
   * Identify concerns based on persona
   */
  private identifyConcerns(
    persona: ReaderPersona,
    metrics: ContentMetrics,
    content: string
  ): string[] {
    const concerns: string[] = [];

    // Pacing concerns
    if (persona.preferences.needsActionRegularly && metrics.actionDensity < 0.3) {
      concerns.push('Chapter feels slow - consider adding more action or tension');
    }

    if (!persona.preferences.toleratesExposition && metrics.descriptionDensity > 2) {
      concerns.push('Heavy exposition may lose reader attention');
    }

    // Clarity concerns
    if (persona.characteristics.attentionToDetail < 5) {
      // Check for subtle plot points that might be missed
      const subtleIndicators = ['faint', 'barely', 'almost', 'slight', 'hint'];
      let subtleCount = 0;
      for (const ind of subtleIndicators) {
        if (content.toLowerCase().includes(ind)) subtleCount++;
      }
      if (subtleCount > 3) {
        concerns.push('Subtle details may be missed by casual readers');
      }
    }

    // Cliche concerns for critical readers
    if (persona.characteristics.criticalEye > 7) {
      const cliches = ['heart pounded', 'blood ran cold', 'eyes widened', 'jaw dropped'];
      for (const cliche of cliches) {
        if (content.toLowerCase().includes(cliche)) {
          concerns.push(`Cliche detected: "${cliche}" - critical readers may notice`);
        }
      }
    }

    // Length concerns
    if (metrics.wordCount > 5000 && persona.characteristics.patienceLevel < 5) {
      concerns.push('Chapter length may test reader patience');
    }

    return concerns;
  }

  /**
   * Update reader state after reading chapter
   */
  private updateReaderState(
    state: ReaderState,
    persona: ReaderPersona,
    analysis: ChapterAnalysis
  ): void {
    // Update engagement
    state.engagement = (state.engagement * 0.7) + (analysis.engagementLevel * 0.3);

    // Update emotional investment
    state.emotionalInvestment = Math.min(100,
      state.emotionalInvestment + (analysis.emotionalImpact * 0.2)
    );

    // Update confusion
    state.confusion = Math.max(0, 100 - analysis.clarityScore);

    // Update attention span
    if (analysis.engagementLevel < 40) {
      state.attentionSpan -= 10;
    } else if (analysis.engagementLevel > 70) {
      state.attentionSpan = Math.min(100, state.attentionSpan + 5);
    }

    // Update mood
    state.currentMood = this.determineMood(state);

    // Update would continue reading
    state.wouldContinueReading = state.engagement > 30 && state.attentionSpan > 0;

    // Update would recommend
    state.wouldRecommend = state.engagement > 70 && state.emotionalInvestment > 50;
  }

  private determineMood(state: ReaderState): ReaderState['currentMood'] {
    if (state.confusion > 50) return 'confused';
    if (state.engagement < 30) return 'bored';
    if (state.attentionSpan < 20) return 'frustrated';
    if (state.engagement > 80) return 'excited';
    if (state.emotionalInvestment > 60) return 'engaged';
    if (state.anticipation > 60) return 'curious';
    return 'engaged';
  }

  /**
   * Generate final verdict for a simulation
   */
  generateVerdict(personaId: string): ReaderVerdict {
    const state = this.activeSimulations.get(personaId);
    const persona = this.personas.get(personaId);

    if (!state || !persona) {
      throw new Error(`No simulation found for persona: ${personaId}`);
    }

    const strengths: string[] = [];
    const weaknesses: string[] = [];

    // Analyze final state
    if (state.engagement > 70) {
      strengths.push('Highly engaging narrative');
    } else if (state.engagement < 40) {
      weaknesses.push('Failed to maintain engagement');
    }

    if (state.emotionalInvestment > 60) {
      strengths.push('Strong emotional resonance');
    } else if (state.emotionalInvestment < 30) {
      weaknesses.push('Lacks emotional depth');
    }

    if (state.confusion > 40) {
      weaknesses.push('Clarity issues - reader may feel lost');
    }

    if (state.anticipation > 50) {
      strengths.push('Successfully generates curiosity');
    }

    // Calculate rating
    const rating = Math.round(
      (state.engagement * 0.3 +
       state.emotionalInvestment * 0.25 +
       (100 - state.confusion) * 0.2 +
       state.satisfaction * 0.25) / 20
    );

    const summary = this.generateVerdictSummary(persona, state, rating);

    return {
      wouldFinish: state.wouldContinueReading,
      wouldRecommend: state.wouldRecommend,
      rating: Math.max(1, Math.min(5, rating)),
      summary,
      strengths,
      weaknesses
    };
  }

  private generateVerdictSummary(
    persona: ReaderPersona,
    state: ReaderState,
    rating: number
  ): string {
    const personaName = persona.name;

    if (rating >= 4) {
      return `${personaName} would thoroughly enjoy this story. Strong engagement and emotional connection throughout.`;
    } else if (rating >= 3) {
      return `${personaName} would find this story decent but not memorable. Some engaging moments but inconsistent.`;
    } else if (rating >= 2) {
      return `${personaName} might struggle to finish. Too many issues with ${state.confusion > 50 ? 'clarity' : 'engagement'}.`;
    } else {
      return `${personaName} would likely abandon this story. Does not meet basic expectations for ${persona.type} readers.`;
    }
  }

  /**
   * Run simulation with all personas and aggregate results
   */
  runFullSimulation(chapters: string[]): Map<string, SimulationResult> {
    const results = new Map<string, SimulationResult>();
    const allPersonas = Array.from(this.personas.values());

    for (const persona of allPersonas) {
      this.startSimulation(persona.id);

      const chapterAnalyses: ChapterAnalysis[] = [];
      for (let i = 0; i < chapters.length; i++) {
        const analysis = this.simulateChapterRead(persona.id, chapters[i], i + 1);
        chapterAnalyses.push(analysis);
      }

      const state = this.activeSimulations.get(persona.id)!;
      const verdict = this.generateVerdict(persona.id);

      results.set(persona.id, {
        persona,
        finalState: state,
        engagement: this.calculateEngagementMetrics(chapterAnalyses),
        pacing: this.analyzePacing(chapters),
        chapterByChapterAnalysis: chapterAnalyses,
        overallVerdict: verdict,
        detailedFeedback: this.generateDetailedFeedback(persona, chapterAnalyses, state)
      });
    }

    return results;
  }

  private calculateEngagementMetrics(analyses: ChapterAnalysis[]): EngagementMetrics {
    const avgEngagement = analyses.reduce((sum, a) => sum + a.engagementLevel, 0) / analyses.length;
    const avgEmotional = analyses.reduce((sum, a) => sum + a.emotionalImpact, 0) / analyses.length;

    return {
      hookStrength: analyses[0]?.engagementLevel || 0,
      pageturnerScore: avgEngagement,
      cliffhangerEffectiveness: analyses[analyses.length - 1]?.engagementLevel || 0,
      emotionalResonance: avgEmotional,
      intellectualEngagement: analyses.reduce((sum, a) => sum + a.clarityScore, 0) / analyses.length,
      curiosityGeneration: 70 // Placeholder - would need question tracking
    };
  }

  private analyzePacing(chapters: string[]): PacingAnalysis {
    const tensionCurve: TensionPoint[] = [];
    const issues: PacingIssue[] = [];

    chapters.forEach((chapter, index) => {
      const metrics = this.analyzeContent(chapter);
      const position = ((index + 1) / chapters.length) * 100;
      const tension = Math.min(100, metrics.tensionIndicators * 10 + metrics.actionDensity * 20);

      tensionCurve.push({
        position,
        tension,
        type: this.determineTensionType(tension, index, chapters.length)
      });
    });

    // Detect pacing issues
    let consecutiveLow = 0;
    for (const point of tensionCurve) {
      if (point.tension < 30) {
        consecutiveLow++;
        if (consecutiveLow >= 3) {
          issues.push({
            position: point.position,
            issue: 'Extended low-tension sequence',
            severity: 'moderate',
            suggestion: 'Add conflict or raise stakes'
          });
        }
      } else {
        consecutiveLow = 0;
      }
    }

    const avgTension = tensionCurve.reduce((sum, t) => sum + t.tension, 0) / tensionCurve.length;

    return {
      overallPace: avgTension > 60 ? 'fast' : avgTension > 40 ? 'balanced' : 'slow',
      actionDensity: 0.5, // Would calculate from content
      dialogueDensity: 0.3,
      descriptionDensity: 0.2,
      tensionCurve,
      pacingIssues: issues
    };
  }

  private determineTensionType(
    tension: number,
    index: number,
    total: number
  ): TensionPoint['type'] {
    const position = index / total;

    if (tension > 80) return 'climax';
    if (position > 0.7 && tension > 60) return 'climax';
    if (position > 0.5 && tension > 50) return 'rising';
    if (position < 0.3 && tension > 40) return 'rising';
    if (tension < 30) return 'plateau';
    return 'rising';
  }

  private generateDetailedFeedback(
    persona: ReaderPersona,
    analyses: ChapterAnalysis[],
    state: ReaderState
  ): string[] {
    const feedback: string[] = [];

    // Opening feedback
    if (analyses[0]?.engagementLevel < 60) {
      feedback.push(`The opening did not hook ${persona.name}. Consider a stronger first line or immediate conflict.`);
    }

    // Middle sag detection
    const middleChapters = analyses.slice(Math.floor(analyses.length * 0.3), Math.floor(analyses.length * 0.7));
    const middleAvg = middleChapters.reduce((sum, a) => sum + a.engagementLevel, 0) / middleChapters.length;
    if (middleAvg < 50) {
      feedback.push('The middle section loses momentum. Add subplots or complications to maintain interest.');
    }

    // Emotional journey feedback
    if (state.emotionalInvestment < 40) {
      feedback.push(`${persona.name} did not form strong emotional connections. Deepen character moments.`);
    }

    // Clarity feedback
    const clarityIssues = analyses.filter(a => a.clarityScore < 60);
    if (clarityIssues.length > 0) {
      feedback.push(`Chapters ${clarityIssues.map(a => a.chapter).join(', ')} have clarity issues.`);
    }

    return feedback;
  }
}

interface ContentMetrics {
  wordCount: number;
  sentenceCount: number;
  paragraphCount: number;
  averageSentenceLength: number;
  dialogueRatio: number;
  actionDensity: number;
  descriptionDensity: number;
  hasHook: boolean;
  hasCliffhanger: boolean;
  tensionIndicators: number;
}

// Export singleton instance
export const readerSimulationEngine = new ReaderSimulationEngine();
