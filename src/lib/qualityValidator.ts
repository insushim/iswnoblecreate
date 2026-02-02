/**
 * Quality Validator - Publishing-Grade Quality Assessment
 *
 * Evaluates manuscripts against professional publishing standards:
 * - Prose quality and style consistency
 * - Narrative structure and pacing
 * - Character development
 * - Dialogue authenticity
 * - Show vs tell balance
 * - Technical writing quality
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
  expositionInDialogue: number; // Lower is better - "As you know, Bob"
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

// Quality thresholds for grades
const GRADE_THRESHOLDS: Record<QualityGrade, number> = {
  'S': 95,
  'A': 85,
  'B': 75,
  'C': 65,
  'D': 50,
  'F': 0
};

// Weak verbs to detect
const WEAK_VERBS = [
  'was', 'were', 'is', 'are', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did',
  'seem', 'seems', 'seemed', 'appear', 'appears', 'appeared',
  'feel', 'feels', 'felt', 'look', 'looks', 'looked'
];

// Filter words indicating telling
const FILTER_WORDS = [
  'felt', 'feeling', 'feelings',
  'thought', 'thinking', 'thoughts',
  'knew', 'know', 'knowing',
  'realized', 'realize', 'realizing',
  'noticed', 'notice', 'noticing',
  'saw', 'see', 'seeing',
  'heard', 'hear', 'hearing',
  'wondered', 'wonder', 'wondering'
];

// Said bookisms to avoid
const SAID_BOOKISMS = [
  'exclaimed', 'declared', 'proclaimed', 'announced',
  'queried', 'inquired', 'questioned',
  'retorted', 'countered', 'snapped',
  'chortled', 'guffawed', 'giggled',
  'hissed', 'snarled', 'growled',
  'breathed', 'gasped', 'sighed'
];

export class QualityValidator {
  /**
   * Perform comprehensive quality validation
   */
  validateQuality(
    content: string,
    metadata?: {
      genre?: string;
      targetAudience?: string;
      chapterCount?: number;
    }
  ): QualityScore {
    // Perform all analyses
    const proseAnalysis = this.analyzeProseQuality(content);
    const structureAnalysis = this.analyzeStructure(content);
    const characterAnalysis = this.analyzeCharacters(content);
    const dialogueAnalysis = this.analyzeDialogue(content);
    const showVsTell = this.analyzeShowVsTell(content);
    const technicalIssues = this.findTechnicalIssues(content);

    // Calculate category scores
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

    // Calculate overall score
    const overall = this.calculateOverallScore(categories);
    const grade = this.determineGrade(overall);

    // Determine publishing readiness
    const publishingReadiness = this.assessPublishingReadiness(categories, grade, technicalIssues);

    // Generate recommendations
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
   * Analyze prose quality
   */
  private analyzeProseQuality(content: string): ProseAnalysis {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim());
    const words = content.split(/\s+/).filter(w => w.length > 0);
    const issues: ProseIssue[] = [];

    // Calculate sentence variety
    const sentenceLengths = sentences.map(s => s.split(/\s+/).length);
    const avgLength = sentenceLengths.reduce((a, b) => a + b, 0) / sentences.length;
    const variance = sentenceLengths.reduce((sum, len) => sum + Math.pow(len - avgLength, 2), 0) / sentences.length;
    const sentenceVariety = Math.min(100, Math.sqrt(variance) * 10);

    // Check for weak verbs
    let weakVerbCount = 0;
    for (const verb of WEAK_VERBS) {
      const regex = new RegExp(`\\b${verb}\\b`, 'gi');
      const matches = content.match(regex);
      if (matches) weakVerbCount += matches.length;
    }
    const weakVerbRatio = weakVerbCount / words.length;
    if (weakVerbRatio > 0.05) {
      issues.push({
        type: 'weak_verb',
        location: 'Throughout',
        example: 'was, were, is, are, seemed, felt',
        suggestion: 'Replace weak verbs with strong, specific action verbs'
      });
    }

    // Check for adverb overuse
    const adverbMatches = content.match(/\b\w+ly\b/gi) || [];
    const adverbRatio = adverbMatches.length / words.length;
    if (adverbRatio > 0.02) {
      issues.push({
        type: 'adverb_overuse',
        location: 'Throughout',
        example: adverbMatches.slice(0, 5).join(', '),
        suggestion: 'Remove adverbs and strengthen the verbs instead'
      });
    }

    // Check for passive voice
    const passivePattern = /\b(was|were|is|are|been|being)\s+\w+ed\b/gi;
    const passiveMatches = content.match(passivePattern) || [];
    const passiveRatio = passiveMatches.length / sentences.length;
    if (passiveRatio > 0.15) {
      issues.push({
        type: 'passive_voice',
        location: 'Throughout',
        example: passiveMatches.slice(0, 3).join('; '),
        suggestion: 'Convert passive constructions to active voice'
      });
    }

    // Check for purple prose indicators
    const purpleIndicators = ['very', 'really', 'extremely', 'absolutely', 'incredibly', 'amazingly'];
    let purpleCount = 0;
    for (const word of purpleIndicators) {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      const matches = content.match(regex);
      if (matches) purpleCount += matches.length;
    }

    // Calculate readability (simplified Flesch-Kincaid)
    const syllableCount = this.estimateSyllables(content);
    const readabilityScore = Math.max(0, Math.min(100,
      100 - (0.39 * (words.length / sentences.length) + 11.8 * (syllableCount / words.length) - 15.59)
    ));

    return {
      readabilityScore,
      sentenceVariety,
      wordChoiceQuality: Math.max(0, 100 - weakVerbRatio * 500 - adverbRatio * 500),
      rhythmAndFlow: sentenceVariety * 0.7 + (100 - passiveRatio * 200) * 0.3,
      voiceConsistency: 75, // Would need more sophisticated analysis
      purpleProse: purpleCount,
      issues
    };
  }

  private estimateSyllables(text: string): number {
    const words = text.toLowerCase().match(/\b[a-z]+\b/g) || [];
    let count = 0;
    for (const word of words) {
      // Simple syllable estimation
      const vowelGroups = word.match(/[aeiouy]+/g) || [];
      count += Math.max(1, vowelGroups.length);
    }
    return count;
  }

  /**
   * Analyze narrative structure
   */
  private analyzeStructure(content: string): StructureAnalysis {
    const paragraphs = content.split(/\n\n+/).filter(p => p.trim());
    const totalLength = content.length;

    // Check for structural elements (simplified detection)
    const hasIncitingIncident = this.detectIncitingIncident(content);
    const hasClimax = this.detectClimax(content);
    const hasResolution = this.detectResolution(content);

    // Analyze pacing through paragraph density
    const firstThird = content.slice(0, totalLength / 3);
    const middleThird = content.slice(totalLength / 3, 2 * totalLength / 3);
    const lastThird = content.slice(2 * totalLength / 3);

    const firstDensity = this.calculateTensionDensity(firstThird);
    const middleDensity = this.calculateTensionDensity(middleThird);
    const lastDensity = this.calculateTensionDensity(lastThird);

    // Good pacing: rising tension with climax near end
    const pacingBalance = this.evaluatePacing(firstDensity, middleDensity, lastDensity);

    return {
      threeActStructure: hasIncitingIncident && hasClimax && hasResolution,
      incitingIncident: hasIncitingIncident,
      risingAction: middleDensity > firstDensity,
      climax: hasClimax,
      resolution: hasResolution,
      subplotIntegration: 70, // Would need subplot tracking
      pacingBalance,
      chapterStructure: this.evaluateChapterStructure(paragraphs)
    };
  }

  private detectIncitingIncident(content: string): boolean {
    const firstQuarter = content.slice(0, content.length / 4).toLowerCase();
    const incitingIndicators = [
      'everything changed', 'never be the same', 'that\'s when',
      'suddenly', 'unexpected', 'discovered', 'found out',
      'arrived', 'appeared', 'began'
    ];
    return incitingIndicators.some(ind => firstQuarter.includes(ind));
  }

  private detectClimax(content: string): boolean {
    const lastThird = content.slice(2 * content.length / 3).toLowerCase();
    const climaxIndicators = [
      'finally', 'at last', 'the moment', 'now or never',
      'confronted', 'faced', 'showdown', 'battle',
      'truth', 'revealed', 'everything'
    ];
    return climaxIndicators.some(ind => lastThird.includes(ind));
  }

  private detectResolution(content: string): boolean {
    const lastTenth = content.slice(9 * content.length / 10).toLowerCase();
    const resolutionIndicators = [
      'after', 'finally', 'peace', 'home', 'together',
      'new beginning', 'moved on', 'learned', 'understood'
    ];
    return resolutionIndicators.some(ind => lastTenth.includes(ind));
  }

  private calculateTensionDensity(text: string): number {
    const tensionWords = [
      'danger', 'fear', 'threat', 'conflict', 'struggle',
      'desperate', 'urgent', 'crisis', 'fight', 'escape',
      'death', 'kill', 'attack', 'chase', 'confront'
    ];
    const words = text.split(/\s+/).length;
    let tensionCount = 0;
    for (const word of tensionWords) {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      const matches = text.match(regex);
      if (matches) tensionCount += matches.length;
    }
    return (tensionCount / words) * 1000;
  }

  private evaluatePacing(first: number, middle: number, last: number): number {
    // Ideal: rising action (first < middle < peak in last section)
    let score = 70;
    if (middle > first) score += 10;
    if (last > middle * 0.8) score += 10; // Climax should be high
    if (first < middle && middle < last) score += 10; // Classic rising action
    return Math.min(100, score);
  }

  private evaluateChapterStructure(paragraphs: string[]): number {
    // Check for consistent paragraph lengths and good breaks
    const lengths = paragraphs.map(p => p.length);
    const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;

    // Good structure: varied but not wildly inconsistent
    const variance = lengths.reduce((sum, len) => sum + Math.pow(len - avgLength, 2), 0) / lengths.length;
    const cv = Math.sqrt(variance) / avgLength;

    if (cv > 0.3 && cv < 0.8) return 80; // Good variety
    if (cv <= 0.3) return 60; // Too uniform
    return 50; // Too varied
  }

  /**
   * Analyze character quality
   */
  private analyzeCharacters(content: string): CharacterAnalysis {
    // Extract potential character names (capitalized words that appear multiple times)
    const namePattern = /\b[A-Z][a-z]+\b/g;
    const potentialNames = content.match(namePattern) || [];
    const nameCounts = new Map<string, number>();

    for (const name of potentialNames) {
      nameCounts.set(name, (nameCounts.get(name) || 0) + 1);
    }

    // Filter to likely character names (appear 5+ times)
    const nameEntries = Array.from(nameCounts.entries());
    const characterNames = nameEntries
      .filter(([_, count]) => count >= 5)
      .map(([name, _]) => name);

    // Analyze character depth through associated content
    let protagonistDepth = 50;
    let antagonistDepth = 50;

    // Check for character internal thoughts and emotions
    const internalIndicators = ['thought', 'felt', 'wondered', 'knew', 'believed', 'feared', 'hoped'];
    let internalCount = 0;
    for (const ind of internalIndicators) {
      const regex = new RegExp(`\\b${ind}\\b`, 'gi');
      const matches = content.match(regex);
      if (matches) internalCount += matches.length;
    }

    // More internal content = deeper characterization
    protagonistDepth = Math.min(90, 50 + internalCount * 2);

    // Check for motivation clarity
    const motivationIndicators = ['wanted', 'needed', 'must', 'had to', 'driven', 'goal', 'purpose'];
    let motivationCount = 0;
    for (const ind of motivationIndicators) {
      const regex = new RegExp(`\\b${ind}\\b`, 'gi');
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
      characterConsistency: 75 // Would need state tracking
    };
  }

  private detectCharacterArcs(content: string): number {
    const arcIndicators = [
      'changed', 'learned', 'realized', 'understood', 'grew',
      'transformed', 'became', 'no longer', 'finally', 'now'
    ];
    const lastQuarter = content.slice(3 * content.length / 4);

    let arcScore = 50;
    for (const ind of arcIndicators) {
      if (lastQuarter.toLowerCase().includes(ind)) {
        arcScore += 5;
      }
    }
    return Math.min(90, arcScore);
  }

  private assessVoiceDistinction(content: string): number {
    // Check dialogue patterns for variety
    const dialogues = content.match(/"[^"]+"/g) || [];
    if (dialogues.length < 10) return 50;

    // Check for variety in dialogue length and style
    const lengths = dialogues.map(d => d.length);
    const variance = this.calculateVariance(lengths);

    return Math.min(85, 50 + variance * 0.5);
  }

  private calculateVariance(numbers: number[]): number {
    const avg = numbers.reduce((a, b) => a + b, 0) / numbers.length;
    return Math.sqrt(numbers.reduce((sum, n) => sum + Math.pow(n - avg, 2), 0) / numbers.length);
  }

  /**
   * Analyze dialogue quality
   */
  private analyzeDialogue(content: string): DialogueAnalysis {
    const dialogues = content.match(/"[^"]+"/g) || [];
    const issues: DialogueIssue[] = [];

    // Check for said bookisms
    let saidBookismCount = 0;
    for (const bookism of SAID_BOOKISMS) {
      const regex = new RegExp(`"[^"]+",?\\s+\\w+\\s+${bookism}`, 'gi');
      const matches = content.match(regex);
      if (matches) {
        saidBookismCount += matches.length;
        if (matches.length > 2) {
          issues.push({
            type: 'said_bookism',
            example: `"..." ${bookism}`,
            suggestion: 'Use "said" or "asked" for most dialogue tags, or remove tags entirely'
          });
        }
      }
    }

    // Check for info dumps in dialogue ("As you know, Bob")
    const infoDumpPatterns = [
      /"[^"]*as you know[^"]*"/gi,
      /"[^"]*let me explain[^"]*"/gi,
      /"[^"]*you see[^"]*"/gi,
      /"[^"]*remember when[^"]*"/gi
    ];

    let infoDumpCount = 0;
    for (const pattern of infoDumpPatterns) {
      const matches = content.match(pattern);
      if (matches) infoDumpCount += matches.length;
    }

    if (infoDumpCount > 0) {
      issues.push({
        type: 'info_dump',
        example: '"As you know..." or "Let me explain..."',
        suggestion: 'Convey information through action, conflict, or natural conversation'
      });
    }

    // Calculate subtext (dialogue that implies more than it says)
    const subtextIndicators = ['...', '?', '!', 'but', 'however', 'actually'];
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
      purposefulness: 70, // Would need context analysis
      tagVariety: Math.max(0, 80 - saidBookismCount * 5),
      expositionInDialogue: infoDumpCount,
      issues
    };
  }

  /**
   * Analyze show vs tell balance
   */
  private analyzeShowVsTell(content: string): ShowVsTellAnalysis {
    const tellingInstances: TellingInstance[] = [];
    const effectiveShowing: string[] = [];

    // Find telling instances
    for (const filterWord of FILTER_WORDS) {
      const regex = new RegExp(`[^.]*\\b${filterWord}\\b[^.]*\\.`, 'gi');
      const matches = content.match(regex) || [];

      for (const match of matches.slice(0, 3)) { // Limit examples
        const emotion = this.extractEmotion(match);
        if (emotion) {
          tellingInstances.push({
            text: match.trim().slice(0, 100),
            emotion,
            suggestion: `Show ${emotion} through physical reactions, actions, or dialogue`
          });
        }
      }
    }

    // Find showing instances (sensory details, actions)
    const showingPatterns = [
      /hands\s+(trembled|shook|clenched)/gi,
      /heart\s+(raced|pounded|skipped)/gi,
      /eyes\s+(widened|narrowed|darted)/gi,
      /voice\s+(cracked|trembled|rose)/gi
    ];

    for (const pattern of showingPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        effectiveShowing.push(...matches.slice(0, 2));
      }
    }

    // Calculate ratio
    const sentences = content.split(/[.!?]+/).length;
    const tellingRatio = tellingInstances.length / sentences;
    const showingRatio = effectiveShowing.length / sentences;

    const ratio = showingRatio > 0 ? (showingRatio / (showingRatio + tellingRatio)) * 100 : 50;

    return {
      ratio,
      tellingInstances: tellingInstances.slice(0, 10),
      effectiveShowing: effectiveShowing.slice(0, 10)
    };
  }

  private extractEmotion(sentence: string): string | null {
    const emotions = ['happy', 'sad', 'angry', 'afraid', 'surprised', 'disgusted', 'anxious', 'excited', 'nervous', 'relieved'];
    const lower = sentence.toLowerCase();

    for (const emotion of emotions) {
      if (lower.includes(emotion)) return emotion;
    }

    // Check for emotional indicators
    if (lower.includes('fear') || lower.includes('scared')) return 'fear';
    if (lower.includes('joy') || lower.includes('happy')) return 'joy';
    if (lower.includes('rage') || lower.includes('angry')) return 'anger';

    return null;
  }

  /**
   * Find technical issues
   */
  private findTechnicalIssues(content: string): TechnicalIssue[] {
    const issues: TechnicalIssue[] = [];

    // Check for repeated words close together
    const words = content.split(/\s+/);
    for (let i = 0; i < words.length - 5; i++) {
      const word = words[i].toLowerCase().replace(/[^a-z]/g, '');
      if (word.length > 5) {
        for (let j = i + 1; j <= i + 5 && j < words.length; j++) {
          const compareWord = words[j].toLowerCase().replace(/[^a-z]/g, '');
          if (word === compareWord) {
            issues.push({
              type: 'continuity',
              severity: 'minor',
              description: `Word "${word}" repeated within 5 words`,
              location: `Position ${i}`
            });
            break;
          }
        }
      }
    }

    // Check for common grammar issues
    const grammarPatterns = [
      { pattern: /\s,/g, issue: 'Space before comma' },
      { pattern: /\s\./g, issue: 'Space before period' },
      { pattern: /[^.!?]\s+[A-Z]/g, issue: 'Possible sentence fragment' },
      { pattern: /\bi\b/g, issue: 'Lowercase "I"' }
    ];

    for (const { pattern, issue } of grammarPatterns) {
      const matches = content.match(pattern);
      if (matches && matches.length > 2) {
        issues.push({
          type: 'grammar',
          severity: 'minor',
          description: issue
        });
      }
    }

    // Check for formatting issues
    if (content.includes('  ')) {
      issues.push({
        type: 'formatting',
        severity: 'minor',
        description: 'Double spaces detected'
      });
    }

    return issues.slice(0, 20); // Limit to 20 issues
  }

  // Score calculation methods
  private calculateProseScore(analysis: ProseAnalysis): number {
    return (
      analysis.readabilityScore * 0.2 +
      analysis.sentenceVariety * 0.2 +
      analysis.wordChoiceQuality * 0.25 +
      analysis.rhythmAndFlow * 0.2 +
      analysis.voiceConsistency * 0.15
    ) - (analysis.purpleProse * 2) - (analysis.issues.length * 3);
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
    return (
      analysis.protagonistDepth * 0.25 +
      analysis.antagonistDepth * 0.15 +
      analysis.supportingCastQuality * 0.1 +
      analysis.characterArcs * 0.2 +
      analysis.motivationClarity * 0.15 +
      analysis.distinctVoices * 0.15
    );
  }

  private calculateDialogueScore(analysis: DialogueAnalysis): number {
    return (
      analysis.naturalness * 0.3 +
      analysis.subtext * 0.2 +
      analysis.characterVoiceDistinction * 0.2 +
      analysis.purposefulness * 0.15 +
      analysis.tagVariety * 0.15
    ) - (analysis.expositionInDialogue * 5);
  }

  private assessWorldBuilding(content: string): number {
    const worldIndicators = [
      'world', 'kingdom', 'city', 'village', 'forest',
      'magic', 'technology', 'culture', 'tradition', 'history',
      'custom', 'law', 'rule', 'society', 'people'
    ];

    let score = 50;
    for (const ind of worldIndicators) {
      const regex = new RegExp(`\\b${ind}\\b`, 'gi');
      const matches = content.match(regex);
      if (matches) score += matches.length * 0.5;
    }

    return Math.min(90, score);
  }

  private assessEmotionalImpact(content: string): number {
    const emotionalWords = [
      'love', 'hate', 'fear', 'joy', 'sorrow', 'grief',
      'hope', 'despair', 'anger', 'peace', 'passion', 'longing',
      'betrayal', 'sacrifice', 'redemption', 'loss', 'triumph'
    ];

    let score = 40;
    for (const word of emotionalWords) {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      const matches = content.match(regex);
      if (matches) score += matches.length * 2;
    }

    return Math.min(95, score);
  }

  private assessOriginality(content: string): number {
    // Check for common cliches
    const cliches = [
      'dark and stormy', 'heart pounded', 'blood ran cold',
      'suddenly', 'little did they know', 'it was all a dream'
    ];

    let score = 80;
    for (const cliche of cliches) {
      if (content.toLowerCase().includes(cliche)) {
        score -= 5;
      }
    }

    return Math.max(40, score);
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

    // Length assessment (novel length)
    const wordCount = content.split(/\s+/).length;
    if (wordCount >= 70000 && wordCount <= 100000) score += 15;
    else if (wordCount >= 50000 && wordCount <= 120000) score += 10;

    // Genre conventions would be checked here
    if (metadata?.genre) {
      score += 5; // Has genre awareness
    }

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

    // Check for blockers
    if (categories.prose < 60) blockers.push('Prose quality needs significant improvement');
    if (categories.structure < 50) blockers.push('Narrative structure issues');
    if (categories.characterization < 55) blockers.push('Character development lacking');
    if (categories.dialogue < 50) blockers.push('Dialogue needs work');
    if (issues.filter(i => i.severity === 'major').length > 5) blockers.push('Too many technical issues');

    // Identify strengths
    if (categories.prose >= 80) strengths.push('Strong prose style');
    if (categories.characterization >= 80) strengths.push('Well-developed characters');
    if (categories.emotionalImpact >= 80) strengths.push('Strong emotional resonance');
    if (categories.originality >= 80) strengths.push('Fresh and original voice');

    // Determine tier
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
      estimatedRevisions = 5;
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

    // Prose recommendations
    if (categories.prose < 70) {
      recommendations.push({
        priority: categories.prose < 50 ? 'critical' : 'high',
        category: 'prose',
        issue: 'Prose quality below publishing standard',
        recommendation: 'Focus on strengthening verbs, reducing adverbs, and varying sentence structure',
        impact: 'Improved prose will elevate the entire reading experience'
      });
    }

    // Structure recommendations
    if (!analysis.structureAnalysis.threeActStructure) {
      recommendations.push({
        priority: 'high',
        category: 'structure',
        issue: 'Missing key structural elements',
        recommendation: 'Ensure clear inciting incident, rising action, climax, and resolution',
        impact: 'Better structure creates a more satisfying narrative arc'
      });
    }

    // Character recommendations
    if (categories.characterization < 65) {
      recommendations.push({
        priority: 'high',
        category: 'characterization',
        issue: 'Characters need more depth',
        recommendation: 'Add internal thoughts, clear motivations, and visible character growth',
        impact: 'Readers connect with well-developed characters'
      });
    }

    // Dialogue recommendations
    if (analysis.dialogueAnalysis.expositionInDialogue > 2) {
      recommendations.push({
        priority: 'medium',
        category: 'dialogue',
        issue: 'Exposition in dialogue ("As you know, Bob")',
        recommendation: 'Convey information through action, conflict, or natural discovery',
        impact: 'More natural dialogue increases immersion'
      });
    }

    // Show vs tell recommendations
    if (analysis.showVsTell.ratio < 50) {
      recommendations.push({
        priority: 'high',
        category: 'prose',
        issue: 'Too much telling, not enough showing',
        recommendation: 'Replace emotional statements with physical reactions and actions',
        impact: 'Showing creates visceral reader experience'
      });
    }

    // Sort by priority
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return recommendations;
  }
}

// Export singleton instance
export const qualityValidator = new QualityValidator();
