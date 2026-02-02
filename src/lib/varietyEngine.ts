/**
 * Variety Engine - Repetition and Cliche Detection System
 *
 * Detects and prevents:
 * - Word/phrase repetition
 * - Sentence structure patterns
 * - Overused expressions and cliches
 * - Predictable narrative patterns
 */

// Common cliches and overused expressions
const CLICHE_PATTERNS: Record<string, string[]> = {
  emotion: [
    'heart pounded',
    'blood ran cold',
    'breath caught',
    'eyes widened',
    'jaw dropped',
    'heart skipped a beat',
    'butterflies in stomach',
    'tears welled up',
    'face turned pale',
    'hands trembled'
  ],
  description: [
    'like a knife',
    'crystal clear',
    'pitch black',
    'dead silent',
    'time stood still',
    'like lightning',
    'as white as snow',
    'as black as night',
    'piercing gaze',
    'chiseled features'
  ],
  action: [
    'nodded slowly',
    'let out a breath',
    'ran a hand through hair',
    'bit lip',
    'looked away',
    'shrugged shoulders',
    'crossed arms',
    'rolled eyes',
    'raised an eyebrow',
    'took a deep breath'
  ],
  dialogue: [
    'said softly',
    'whispered quietly',
    'shouted loudly',
    'muttered under breath',
    'exclaimed suddenly',
    'replied quickly',
    'answered hesitantly',
    'admitted reluctantly'
  ],
  narrative: [
    'little did they know',
    'suddenly',
    'without warning',
    'in the blink of an eye',
    'before they knew it',
    'at that moment',
    'just then',
    'all of a sudden'
  ]
};

// Sentence structure patterns to detect
const STRUCTURE_PATTERNS = [
  { name: 'subject_verb_start', pattern: /^[A-Z][a-z]+\s+(was|were|is|are|had|has)\s/g },
  { name: 'pronoun_start', pattern: /^(He|She|They|It|I|We)\s/g },
  { name: 'ing_start', pattern: /^[A-Z][a-z]+ing,?\s/g },
  { name: 'as_clause', pattern: /^As\s[^,]+,\s/g },
  { name: 'when_clause', pattern: /^When\s[^,]+,\s/g },
  { name: 'adverb_start', pattern: /^[A-Z][a-z]+ly,?\s/g }
];

export interface RepetitionIssue {
  type: 'word' | 'phrase' | 'structure' | 'cliche';
  text: string;
  count: number;
  positions: number[];
  severity: 'low' | 'medium' | 'high';
  suggestion?: string;
}

export interface VarietyAnalysis {
  score: number; // 0-100
  issues: RepetitionIssue[];
  statistics: {
    uniqueWordRatio: number;
    averageSentenceLength: number;
    sentenceLengthVariance: number;
    structureVariety: number;
    clicheCount: number;
  };
  recommendations: string[];
}

export class VarietyEngine {
  private wordFrequency: Map<string, number[]> = new Map();
  private phraseFrequency: Map<string, number[]> = new Map();
  private structureHistory: Map<string, number[]> = new Map();
  private recentParagraphs: string[] = [];
  private readonly maxHistorySize = 50;

  constructor() {
    this.reset();
  }

  reset(): void {
    this.wordFrequency.clear();
    this.phraseFrequency.clear();
    this.structureHistory.clear();
    this.recentParagraphs = [];
  }

  /**
   * Analyze text for repetition and variety issues
   */
  analyzeText(text: string): VarietyAnalysis {
    const issues: RepetitionIssue[] = [];
    const sentences = this.splitIntoSentences(text);
    const words = this.extractWords(text);
    const paragraphs = text.split(/\n\n+/);

    // Update history
    this.updateHistory(text);

    // Check word repetition
    const wordIssues = this.checkWordRepetition(words);
    issues.push(...wordIssues);

    // Check phrase repetition
    const phraseIssues = this.checkPhraseRepetition(text);
    issues.push(...phraseIssues);

    // Check sentence structure variety
    const structureIssues = this.checkStructureVariety(sentences);
    issues.push(...structureIssues);

    // Check for cliches
    const clicheIssues = this.checkCliches(text);
    issues.push(...clicheIssues);

    // Calculate statistics
    const statistics = this.calculateStatistics(words, sentences);

    // Generate recommendations
    const recommendations = this.generateRecommendations(issues, statistics);

    // Calculate overall score
    const score = this.calculateScore(issues, statistics);

    return {
      score,
      issues,
      statistics,
      recommendations
    };
  }

  /**
   * Check for word repetition
   */
  private checkWordRepetition(words: string[]): RepetitionIssue[] {
    const issues: RepetitionIssue[] = [];
    const wordPositions = new Map<string, number[]>();

    // Track positions of each word
    words.forEach((word, index) => {
      const normalized = word.toLowerCase();
      if (normalized.length < 4) return; // Skip short words

      const positions = wordPositions.get(normalized) || [];
      positions.push(index);
      wordPositions.set(normalized, positions);
    });

    // Find repeated words
    const wordEntries = Array.from(wordPositions.entries());
    for (const [word, positions] of wordEntries) {
      if (positions.length >= 3) {
        // Check if repetitions are too close
        const closeRepetitions = this.findCloseRepetitions(positions, 20);
        if (closeRepetitions.length >= 2) {
          issues.push({
            type: 'word',
            text: word,
            count: positions.length,
            positions,
            severity: positions.length >= 5 ? 'high' : positions.length >= 3 ? 'medium' : 'low',
            suggestion: this.getSynonymSuggestion(word)
          });
        }
      }
    }

    return issues;
  }

  /**
   * Check for phrase repetition
   */
  private checkPhraseRepetition(text: string): RepetitionIssue[] {
    const issues: RepetitionIssue[] = [];
    const phrases = this.extractPhrases(text);
    const phrasePositions = new Map<string, number[]>();

    phrases.forEach((phrase, index) => {
      const normalized = phrase.toLowerCase();
      const positions = phrasePositions.get(normalized) || [];
      positions.push(index);
      phrasePositions.set(normalized, positions);
    });

    const phraseEntries = Array.from(phrasePositions.entries());
    for (const [phrase, positions] of phraseEntries) {
      if (positions.length >= 2 && phrase.split(' ').length >= 3) {
        issues.push({
          type: 'phrase',
          text: phrase,
          count: positions.length,
          positions,
          severity: positions.length >= 4 ? 'high' : positions.length >= 3 ? 'medium' : 'low',
          suggestion: `Rephrase: "${phrase}"`
        });
      }
    }

    return issues;
  }

  /**
   * Check sentence structure variety
   */
  private checkStructureVariety(sentences: string[]): RepetitionIssue[] {
    const issues: RepetitionIssue[] = [];
    const structureCounts = new Map<string, number[]>();

    sentences.forEach((sentence, index) => {
      for (const pattern of STRUCTURE_PATTERNS) {
        if (pattern.pattern.test(sentence)) {
          const positions = structureCounts.get(pattern.name) || [];
          positions.push(index);
          structureCounts.set(pattern.name, positions);
          pattern.pattern.lastIndex = 0; // Reset regex
        }
      }
    });

    const structureEntries = Array.from(structureCounts.entries());
    for (const [structure, positions] of structureEntries) {
      const ratio = positions.length / sentences.length;
      if (ratio > 0.3 && positions.length >= 3) {
        issues.push({
          type: 'structure',
          text: this.getStructureDescription(structure),
          count: positions.length,
          positions,
          severity: ratio > 0.5 ? 'high' : ratio > 0.4 ? 'medium' : 'low',
          suggestion: this.getStructureVariationSuggestion(structure)
        });
      }
    }

    return issues;
  }

  /**
   * Check for cliches
   */
  private checkCliches(text: string): RepetitionIssue[] {
    const issues: RepetitionIssue[] = [];
    const lowerText = text.toLowerCase();

    for (const [category, cliches] of Object.entries(CLICHE_PATTERNS)) {
      for (const cliche of cliches) {
        const positions = this.findAllOccurrences(lowerText, cliche.toLowerCase());
        if (positions.length > 0) {
          issues.push({
            type: 'cliche',
            text: cliche,
            count: positions.length,
            positions,
            severity: positions.length >= 2 ? 'high' : 'medium',
            suggestion: this.getClicheAlternative(cliche, category)
          });
        }
      }
    }

    return issues;
  }

  /**
   * Calculate text statistics
   */
  private calculateStatistics(words: string[], sentences: string[]): VarietyAnalysis['statistics'] {
    const uniqueWords = new Set(words.map(w => w.toLowerCase()));
    const uniqueWordRatio = uniqueWords.size / words.length;

    const sentenceLengths = sentences.map(s => s.split(/\s+/).length);
    const averageSentenceLength = sentenceLengths.reduce((a, b) => a + b, 0) / sentences.length;

    const variance = sentenceLengths.reduce((sum, len) => {
      return sum + Math.pow(len - averageSentenceLength, 2);
    }, 0) / sentences.length;
    const sentenceLengthVariance = Math.sqrt(variance);

    // Calculate structure variety
    const structureTypes = new Set<string>();
    for (const sentence of sentences) {
      for (const pattern of STRUCTURE_PATTERNS) {
        if (pattern.pattern.test(sentence)) {
          structureTypes.add(pattern.name);
          pattern.pattern.lastIndex = 0;
        }
      }
    }
    const structureVariety = structureTypes.size / STRUCTURE_PATTERNS.length;

    // Count cliches
    let clicheCount = 0;
    const lowerText = words.join(' ').toLowerCase();
    for (const cliches of Object.values(CLICHE_PATTERNS)) {
      for (const cliche of cliches) {
        if (lowerText.includes(cliche.toLowerCase())) {
          clicheCount++;
        }
      }
    }

    return {
      uniqueWordRatio,
      averageSentenceLength,
      sentenceLengthVariance,
      structureVariety,
      clicheCount
    };
  }

  /**
   * Generate recommendations based on analysis
   */
  private generateRecommendations(
    issues: RepetitionIssue[],
    statistics: VarietyAnalysis['statistics']
  ): string[] {
    const recommendations: string[] = [];

    // Word variety recommendations
    if (statistics.uniqueWordRatio < 0.6) {
      recommendations.push('Vocabulary is limited. Consider using more varied word choices and synonyms.');
    }

    // Sentence length recommendations
    if (statistics.sentenceLengthVariance < 3) {
      recommendations.push('Sentence lengths are too uniform. Mix short punchy sentences with longer complex ones.');
    }

    if (statistics.averageSentenceLength > 25) {
      recommendations.push('Sentences are generally too long. Break some into shorter ones for better readability.');
    }

    if (statistics.averageSentenceLength < 10) {
      recommendations.push('Sentences are too short. Add some longer, more complex sentences for depth.');
    }

    // Structure variety recommendations
    if (statistics.structureVariety < 0.5) {
      recommendations.push('Sentence structures are repetitive. Vary how you start sentences.');
    }

    // Cliche recommendations
    if (statistics.clicheCount > 3) {
      recommendations.push(`Found ${statistics.clicheCount} cliches. Replace with fresh, original expressions.`);
    }

    // Issue-specific recommendations
    const wordIssues = issues.filter(i => i.type === 'word' && i.severity === 'high');
    if (wordIssues.length > 0) {
      const words = wordIssues.slice(0, 3).map(i => `"${i.text}"`).join(', ');
      recommendations.push(`Frequently repeated words: ${words}. Use synonyms or restructure sentences.`);
    }

    const structureIssues = issues.filter(i => i.type === 'structure' && i.severity === 'high');
    if (structureIssues.length > 0) {
      recommendations.push('Many sentences follow the same pattern. Try starting with different grammatical structures.');
    }

    return recommendations;
  }

  /**
   * Calculate overall variety score
   */
  private calculateScore(
    issues: RepetitionIssue[],
    statistics: VarietyAnalysis['statistics']
  ): number {
    let score = 100;

    // Deduct for issues
    for (const issue of issues) {
      switch (issue.severity) {
        case 'high':
          score -= 5;
          break;
        case 'medium':
          score -= 3;
          break;
        case 'low':
          score -= 1;
          break;
      }
    }

    // Deduct for poor statistics
    if (statistics.uniqueWordRatio < 0.5) score -= 10;
    else if (statistics.uniqueWordRatio < 0.6) score -= 5;

    if (statistics.sentenceLengthVariance < 2) score -= 10;
    else if (statistics.sentenceLengthVariance < 4) score -= 5;

    if (statistics.structureVariety < 0.3) score -= 10;
    else if (statistics.structureVariety < 0.5) score -= 5;

    if (statistics.clicheCount > 5) score -= 15;
    else if (statistics.clicheCount > 3) score -= 10;
    else if (statistics.clicheCount > 0) score -= 5;

    return Math.max(0, Math.min(100, score));
  }

  // Helper methods
  private splitIntoSentences(text: string): string[] {
    return text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  }

  private extractWords(text: string): string[] {
    return text.match(/\b[a-zA-Z]+\b/g) || [];
  }

  private extractPhrases(text: string): string[] {
    const words = text.split(/\s+/);
    const phrases: string[] = [];

    for (let i = 0; i < words.length - 2; i++) {
      phrases.push(words.slice(i, i + 3).join(' '));
    }

    return phrases;
  }

  private updateHistory(text: string): void {
    this.recentParagraphs.push(text);
    if (this.recentParagraphs.length > this.maxHistorySize) {
      this.recentParagraphs.shift();
    }
  }

  private findCloseRepetitions(positions: number[], maxDistance: number): number[] {
    const close: number[] = [];
    for (let i = 0; i < positions.length - 1; i++) {
      if (positions[i + 1] - positions[i] <= maxDistance) {
        if (!close.includes(positions[i])) close.push(positions[i]);
        close.push(positions[i + 1]);
      }
    }
    return close;
  }

  private findAllOccurrences(text: string, search: string): number[] {
    const positions: number[] = [];
    let pos = text.indexOf(search);
    while (pos !== -1) {
      positions.push(pos);
      pos = text.indexOf(search, pos + 1);
    }
    return positions;
  }

  private getSynonymSuggestion(word: string): string {
    // Simple synonym suggestions
    const synonyms: Record<string, string[]> = {
      'said': ['replied', 'answered', 'stated', 'remarked', 'responded'],
      'looked': ['gazed', 'glanced', 'peered', 'stared', 'observed'],
      'walked': ['strolled', 'strode', 'ambled', 'paced', 'wandered'],
      'thought': ['considered', 'pondered', 'reflected', 'mused', 'contemplated'],
      'felt': ['sensed', 'experienced', 'perceived', 'noticed'],
      'saw': ['noticed', 'observed', 'spotted', 'glimpsed', 'witnessed'],
      'went': ['headed', 'moved', 'proceeded', 'traveled', 'journeyed'],
      'got': ['obtained', 'received', 'acquired', 'gained'],
      'made': ['created', 'produced', 'constructed', 'formed'],
      'came': ['arrived', 'approached', 'appeared', 'emerged']
    };

    const suggestions = synonyms[word.toLowerCase()];
    if (suggestions) {
      return `Try: ${suggestions.slice(0, 3).join(', ')}`;
    }
    return 'Use a thesaurus for alternatives';
  }

  private getStructureDescription(structure: string): string {
    const descriptions: Record<string, string> = {
      'subject_verb_start': 'Subject + was/were/is/are pattern',
      'pronoun_start': 'Starting with pronoun (He/She/They/I)',
      'ing_start': 'Starting with -ing word',
      'as_clause': 'Starting with "As..." clause',
      'when_clause': 'Starting with "When..." clause',
      'adverb_start': 'Starting with adverb (-ly word)'
    };
    return descriptions[structure] || structure;
  }

  private getStructureVariationSuggestion(structure: string): string {
    const suggestions: Record<string, string> = {
      'subject_verb_start': 'Try starting with action, dialogue, or description instead',
      'pronoun_start': 'Use character names, descriptions, or start with action/setting',
      'ing_start': 'Try different sentence openings: dialogue, short sentence, or setting',
      'as_clause': 'Use "While", "During", or restructure as two sentences',
      'when_clause': 'Try "The moment", "Upon", or restructure the timing',
      'adverb_start': 'Move adverb to middle of sentence or remove if unnecessary'
    };
    return suggestions[structure] || 'Vary your sentence structure';
  }

  private getClicheAlternative(cliche: string, category: string): string {
    const alternatives: Record<string, Record<string, string>> = {
      emotion: {
        'heart pounded': 'Describe specific physical sensations unique to the character',
        'blood ran cold': 'Show the emotion through action or thought',
        'breath caught': 'Describe what made them pause',
        'eyes widened': 'Show surprise through action or dialogue'
      },
      description: {
        'crystal clear': 'Be specific about what makes it clear',
        'pitch black': 'Describe what the darkness feels like',
        'dead silent': 'Note what sounds are absent'
      },
      action: {
        'nodded slowly': 'Show agreement through dialogue or action',
        'let out a breath': 'Describe the specific emotion causing this',
        'took a deep breath': 'Show the preparation differently'
      }
    };

    const categoryAlts = alternatives[category];
    if (categoryAlts && categoryAlts[cliche]) {
      return categoryAlts[cliche];
    }
    return 'Replace with a fresh, specific description';
  }

  /**
   * Get real-time suggestions while writing
   */
  getSuggestions(text: string, cursorPosition: number): string[] {
    const suggestions: string[] = [];
    const recentText = text.slice(Math.max(0, cursorPosition - 200), cursorPosition);

    // Check for recent cliches
    const lowerText = recentText.toLowerCase();
    for (const cliches of Object.values(CLICHE_PATTERNS)) {
      for (const cliche of cliches) {
        if (lowerText.endsWith(cliche.toLowerCase()) ||
            lowerText.includes(cliche.toLowerCase())) {
          suggestions.push(`Consider replacing "${cliche}" with a more original expression`);
        }
      }
    }

    // Check for repeated words in recent text
    const words = recentText.match(/\b[a-zA-Z]+\b/g) || [];
    const wordCounts = new Map<string, number>();
    for (const word of words) {
      const lower = word.toLowerCase();
      if (lower.length >= 4) {
        wordCounts.set(lower, (wordCounts.get(lower) || 0) + 1);
      }
    }

    const wordEntries = Array.from(wordCounts.entries());
    for (const [word, count] of wordEntries) {
      if (count >= 3) {
        const synonym = this.getSynonymSuggestion(word);
        suggestions.push(`"${word}" appears ${count} times recently. ${synonym}`);
      }
    }

    return suggestions;
  }
}

// Export singleton instance
export const varietyEngine = new VarietyEngine();
