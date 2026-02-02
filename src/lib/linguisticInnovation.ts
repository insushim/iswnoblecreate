/**
 * Linguistic Innovation Engine - Language Revolution
 *
 * Nobel literature often creates new ways of using language:
 * - Syntax that mirrors consciousness
 * - Rhythm as meaning
 * - Silence and white space
 * - Neologisms and linguistic invention
 * - Voice as fingerprint
 */

export interface LinguisticStyle {
  name: string;
  description: string;
  syntaxPatterns: SyntaxPattern[];
  rhythmProfile: RhythmProfile;
  vocabularyProfile: VocabularyProfile;
  punctuationStyle: PunctuationStyle;
  examples: StyleExample[];
}

export interface SyntaxPattern {
  name: string;
  description: string;
  structure: string;
  effect: string;
  example: string;
}

export interface RhythmProfile {
  dominantPattern: 'staccato' | 'flowing' | 'varied' | 'incantatory' | 'conversational';
  sentenceLengthRange: { min: number; max: number; preferred: number };
  paragraphDensity: 'sparse' | 'moderate' | 'dense';
  breathingRoom: boolean;
  musicality: number; // 1-10
}

export interface VocabularyProfile {
  register: 'elevated' | 'colloquial' | 'mixed' | 'technical' | 'poetic';
  concreteToAbstract: number; // 0=all concrete, 100=all abstract
  sensoryDensity: number; // 1-10
  neologismFrequency: 'none' | 'rare' | 'occasional' | 'frequent';
  etymologicalAwareness: boolean;
}

export interface PunctuationStyle {
  useOfDash: 'none' | 'minimal' | 'frequent' | 'structural';
  useOfEllipsis: 'none' | 'minimal' | 'frequent';
  useOfSemicolon: 'none' | 'classical' | 'modern';
  paragraphBreaks: 'traditional' | 'frequent' | 'rare' | 'unconventional';
  whitespaceAsMeaning: boolean;
}

export interface StyleExample {
  author: string;
  work: string;
  passage: string;
  analysis: string;
}

export interface SentenceVariation {
  type: 'simple' | 'compound' | 'complex' | 'fragment' | 'periodic' | 'cumulative' | 'inverted';
  length: 'very_short' | 'short' | 'medium' | 'long' | 'very_long';
  structure: string;
  when_to_use: string;
}

export interface LinguisticDevice {
  name: string;
  category: 'sound' | 'meaning' | 'structure' | 'rhythm';
  description: string;
  effect: string;
  example: string;
  overuseWarning: string;
}

export interface VoiceFingerprint {
  characterId: string;
  vocabularyLevel: number; // 1-10
  sentenceComplexity: number; // 1-10
  favoredWords: string[];
  avoidedWords: string[];
  speechPatterns: string[];
  silences: string[]; // What they don't say
  tics: string[]; // Verbal tics and repetitions
  rhythmPattern: string;
}

// Master styles from Nobel laureates
const LINGUISTIC_STYLES: Record<string, LinguisticStyle> = {
  proustian: {
    name: 'Proustian',
    description: 'Long, sinuous sentences that mirror the movement of consciousness and memory',
    syntaxPatterns: [
      {
        name: 'Nested Parenthetical',
        description: 'Sentences within sentences, thought interrupting thought',
        structure: 'Main clause (digression (deeper digression) return) continuation',
        effect: 'Mimics how memory actually works - associative, layered',
        example: 'The church steeple (which, when I think of it now, seems so different from the one I knew then, though perhaps it is I who have changed, as we do, imperceptibly, like the steeple itself weathering in ways invisible to daily observation) still marks the center of the town.'
      }
    ],
    rhythmProfile: {
      dominantPattern: 'flowing',
      sentenceLengthRange: { min: 20, max: 200, preferred: 80 },
      paragraphDensity: 'dense',
      breathingRoom: false,
      musicality: 9
    },
    vocabularyProfile: {
      register: 'elevated',
      concreteToAbstract: 60,
      sensoryDensity: 9,
      neologismFrequency: 'rare',
      etymologicalAwareness: true
    },
    punctuationStyle: {
      useOfDash: 'frequent',
      useOfEllipsis: 'minimal',
      useOfSemicolon: 'classical',
      paragraphBreaks: 'rare',
      whitespaceAsMeaning: false
    },
    examples: [
      {
        author: 'Proust',
        work: 'In Search of Lost Time',
        passage: 'The taste was that of the little piece of madeleine which on Sunday mornings at Combray...',
        analysis: 'A single taste expands into volumes of memory, the sentence structure dilating to contain whole worlds.'
      }
    ]
  },

  hemingwayesque: {
    name: 'Hemingwayesque',
    description: 'Stripped bare, declarative, iceberg theory - what is not said matters most',
    syntaxPatterns: [
      {
        name: 'Simple Declarative',
        description: 'Subject-verb-object, no ornamentation',
        structure: 'Short. Declarative. Repeated pattern.',
        effect: 'Creates tension through restraint, meaning through omission',
        example: 'He sat down. He ordered a drink. The bar was empty. He did not think about her.'
      }
    ],
    rhythmProfile: {
      dominantPattern: 'staccato',
      sentenceLengthRange: { min: 3, max: 30, preferred: 10 },
      paragraphDensity: 'sparse',
      breathingRoom: true,
      musicality: 6
    },
    vocabularyProfile: {
      register: 'colloquial',
      concreteToAbstract: 20,
      sensoryDensity: 7,
      neologismFrequency: 'none',
      etymologicalAwareness: false
    },
    punctuationStyle: {
      useOfDash: 'none',
      useOfEllipsis: 'none',
      useOfSemicolon: 'none',
      paragraphBreaks: 'frequent',
      whitespaceAsMeaning: true
    },
    examples: [
      {
        author: 'Hemingway',
        work: 'Hills Like White Elephants',
        passage: '"They look like white elephants," she said. "I\'ve never seen one," the man drank his beer.',
        analysis: 'What they don\'t say about the pregnancy is the entire story.'
      }
    ]
  },

  woolfian: {
    name: 'Woolfian',
    description: 'Stream of consciousness, permeable boundaries between minds, time made fluid',
    syntaxPatterns: [
      {
        name: 'Free Indirect Discourse',
        description: 'Narrator and character thoughts blend seamlessly',
        structure: 'Third person that becomes first person without marking the shift',
        effect: 'Reader slips between consciousnesses, boundaries dissolve',
        example: 'Mrs. Dalloway said she would buy the flowers herself. For Lucy had her work cut out for her. And then, thought Clarissa, what a morning—fresh as if issued to children on a beach.'
      }
    ],
    rhythmProfile: {
      dominantPattern: 'flowing',
      sentenceLengthRange: { min: 10, max: 100, preferred: 40 },
      paragraphDensity: 'moderate',
      breathingRoom: true,
      musicality: 8
    },
    vocabularyProfile: {
      register: 'elevated',
      concreteToAbstract: 50,
      sensoryDensity: 8,
      neologismFrequency: 'occasional',
      etymologicalAwareness: true
    },
    punctuationStyle: {
      useOfDash: 'frequent',
      useOfEllipsis: 'frequent',
      useOfSemicolon: 'modern',
      paragraphBreaks: 'unconventional',
      whitespaceAsMeaning: true
    },
    examples: [
      {
        author: 'Woolf',
        work: 'To the Lighthouse',
        passage: 'Yes, she thought, laying down her brush in extreme fatigue, I have had my vision.',
        analysis: 'The final sentence completes both the painting and the novel, action and consciousness fused.'
      }
    ]
  },

  borgesian: {
    name: 'Borgesian',
    description: 'Labyrinthine, philosophical, treating ideas as if they were sensory experiences',
    syntaxPatterns: [
      {
        name: 'Scholarly Distance',
        description: 'Abstract subjects treated with the precision of a footnote',
        structure: 'Perhaps it is true that... It is well known that... Some have argued...',
        effect: 'Creates vertigo of recursion, ideas become labyrinths',
        example: 'In the second story of the building there existed (and doubtless still exists) a library which the neighbors considered infinite.'
      }
    ],
    rhythmProfile: {
      dominantPattern: 'varied',
      sentenceLengthRange: { min: 15, max: 80, preferred: 35 },
      paragraphDensity: 'moderate',
      breathingRoom: false,
      musicality: 7
    },
    vocabularyProfile: {
      register: 'elevated',
      concreteToAbstract: 70,
      sensoryDensity: 5,
      neologismFrequency: 'rare',
      etymologicalAwareness: true
    },
    punctuationStyle: {
      useOfDash: 'minimal',
      useOfEllipsis: 'minimal',
      useOfSemicolon: 'classical',
      paragraphBreaks: 'traditional',
      whitespaceAsMeaning: false
    },
    examples: [
      {
        author: 'Borges',
        work: 'The Library of Babel',
        passage: 'The universe (which others call the Library) is composed of an indefinite, perhaps infinite number of hexagonal galleries.',
        analysis: 'The parenthetical casually equates universe and library, making the metaphysical seem mundane.'
      }
    ]
  },

  carveresque: {
    name: 'Carveresque',
    description: 'Minimalist, ordinary surfaces hiding extraordinary depths',
    syntaxPatterns: [
      {
        name: 'Understated Observation',
        description: 'Simple statements carrying enormous weight',
        structure: 'He did X. She did Y. Nothing more was said.',
        effect: 'The unsaid becomes deafening',
        example: 'He put the glass down. She looked at the table. The children were somewhere else in the house.'
      }
    ],
    rhythmProfile: {
      dominantPattern: 'staccato',
      sentenceLengthRange: { min: 4, max: 25, preferred: 12 },
      paragraphDensity: 'sparse',
      breathingRoom: true,
      musicality: 5
    },
    vocabularyProfile: {
      register: 'colloquial',
      concreteToAbstract: 15,
      sensoryDensity: 6,
      neologismFrequency: 'none',
      etymologicalAwareness: false
    },
    punctuationStyle: {
      useOfDash: 'none',
      useOfEllipsis: 'minimal',
      useOfSemicolon: 'none',
      paragraphBreaks: 'frequent',
      whitespaceAsMeaning: true
    },
    examples: [
      {
        author: 'Carver',
        work: 'What We Talk About When We Talk About Love',
        passage: 'The gin was gone. The light was going. But we didn\'t move.',
        analysis: 'Three short sentences create a complete world of exhaustion, dimming hope, paralysis.'
      }
    ]
  },

  mccarthyesque: {
    name: 'McCarthyesque',
    description: 'Biblical cadence, no quotation marks, violence as poetry',
    syntaxPatterns: [
      {
        name: 'Polysyndeton',
        description: 'Repeated conjunctions creating relentless forward motion',
        structure: 'And X. And Y. And Z.',
        effect: 'Biblical rhythm, inexorable, elemental',
        example: 'They rode on and the wind drove the snow before them and they crossed through the white blindness and came at last to a small arroyo.'
      }
    ],
    rhythmProfile: {
      dominantPattern: 'incantatory',
      sentenceLengthRange: { min: 10, max: 150, preferred: 50 },
      paragraphDensity: 'moderate',
      breathingRoom: false,
      musicality: 9
    },
    vocabularyProfile: {
      register: 'mixed',
      concreteToAbstract: 30,
      sensoryDensity: 8,
      neologismFrequency: 'occasional',
      etymologicalAwareness: true
    },
    punctuationStyle: {
      useOfDash: 'minimal',
      useOfEllipsis: 'none',
      useOfSemicolon: 'none',
      paragraphBreaks: 'traditional',
      whitespaceAsMeaning: false
    },
    examples: [
      {
        author: 'McCarthy',
        work: 'Blood Meridian',
        passage: 'Whatever in creation exists without my knowledge exists without my consent.',
        analysis: 'The Judge speaks in aphorisms that sound like scripture but invert all values.'
      }
    ]
  }
};

// Linguistic devices for creating unique voice
const LINGUISTIC_DEVICES: LinguisticDevice[] = [
  {
    name: 'Anaphora',
    category: 'rhythm',
    description: 'Repetition of word or phrase at the beginning of successive clauses',
    effect: 'Creates rhythm, emphasis, and emotional buildup',
    example: 'She remembered the summer. She remembered the light. She remembered his hands.',
    overuseWarning: 'Can become mechanical if every paragraph uses it'
  },
  {
    name: 'Anadiplosis',
    category: 'structure',
    description: 'Last word of one clause becomes first word of next',
    effect: 'Creates chain of thought, inevitability',
    example: 'Fear leads to anger. Anger leads to hate. Hate leads to suffering.',
    overuseWarning: 'Effective sparingly; overuse sounds like a sermon'
  },
  {
    name: 'Zeugma',
    category: 'meaning',
    description: 'One word governs multiple others in unexpected way',
    effect: 'Surprise, wit, compressed meaning',
    example: 'She lowered her standards and her neckline.',
    overuseWarning: 'Can seem too clever; use for specific effect'
  },
  {
    name: 'Asyndeton',
    category: 'rhythm',
    description: 'Omission of conjunctions between clauses',
    effect: 'Speed, urgency, breathlessness',
    example: 'I came, I saw, I conquered.',
    overuseWarning: 'Can exhaust reader if sustained too long'
  },
  {
    name: 'Chiasmus',
    category: 'structure',
    description: 'Reversal of grammatical structures in successive phrases',
    effect: 'Balance, memorability, philosophical weight',
    example: 'Ask not what your country can do for you, but what you can do for your country.',
    overuseWarning: 'Reserve for moments of real significance'
  },
  {
    name: 'Synesthesia',
    category: 'meaning',
    description: 'Mixing sensory modalities',
    effect: 'Freshness of perception, defamiliarization',
    example: 'The blue note hung in the smoky air.',
    overuseWarning: 'Overuse makes it feel like a tic rather than insight'
  },
  {
    name: 'Tmesis',
    category: 'sound',
    description: 'Inserting a word into the middle of another',
    effect: 'Emphasis, colloquial energy',
    example: 'Abso-bloody-lutely',
    overuseWarning: 'Very specific register; can seem forced in literary prose'
  },
  {
    name: 'Litotes',
    category: 'meaning',
    description: 'Understatement through double negative',
    effect: 'Irony, restraint, British dryness',
    example: 'She was not unfamiliar with disappointment.',
    overuseWarning: 'Can make prose seem evasive or passive'
  }
];

// Sentence variations for rhythm
const SENTENCE_VARIATIONS: SentenceVariation[] = [
  {
    type: 'simple',
    length: 'short',
    structure: 'Subject + Verb + Object',
    when_to_use: 'For impact, clarity, action, or after long sentences'
  },
  {
    type: 'fragment',
    length: 'very_short',
    structure: 'No main clause. Just this.',
    when_to_use: 'For emphasis, interiority, or mimicking thought'
  },
  {
    type: 'periodic',
    length: 'long',
    structure: 'Subordinate clauses build to main clause at end',
    when_to_use: 'For suspense, building, delayed revelation'
  },
  {
    type: 'cumulative',
    length: 'long',
    structure: 'Main clause first, then modifying phrases accumulate',
    when_to_use: 'For description, enumeration, overwhelming detail'
  },
  {
    type: 'inverted',
    length: 'medium',
    structure: 'Object/Modifier before Subject',
    when_to_use: 'For emphasis, formality, or poetic effect'
  },
  {
    type: 'complex',
    length: 'medium',
    structure: 'Main + dependent clauses with varied connectors',
    when_to_use: 'For showing causation, condition, or nuance'
  },
  {
    type: 'compound',
    length: 'medium',
    structure: 'Independent clause + conjunction + independent clause',
    when_to_use: 'For balance, comparison, or parallel ideas'
  }
];

export class LinguisticInnovationEngine {
  private characterVoices: Map<string, VoiceFingerprint> = new Map();

  constructor() {}

  /**
   * Get available linguistic styles
   */
  getStyles(): LinguisticStyle[] {
    return Object.values(LINGUISTIC_STYLES);
  }

  /**
   * Get a specific style
   */
  getStyle(styleName: string): LinguisticStyle | undefined {
    return LINGUISTIC_STYLES[styleName];
  }

  /**
   * Get all linguistic devices
   */
  getDevices(): LinguisticDevice[] {
    return LINGUISTIC_DEVICES;
  }

  /**
   * Get sentence variations
   */
  getSentenceVariations(): SentenceVariation[] {
    return SENTENCE_VARIATIONS;
  }

  /**
   * Generate linguistic style guidance for a passage
   */
  generateStyleGuidance(
    intent: string,
    emotionalTone: string,
    pacing: 'slow' | 'medium' | 'fast',
    baseStyle?: string
  ): string {
    const style = baseStyle ? LINGUISTIC_STYLES[baseStyle] : null;

    const rhythmGuidance = this.generateRhythmGuidance(emotionalTone, pacing);
    const syntaxGuidance = this.generateSyntaxGuidance(intent, emotionalTone);
    const deviceSuggestions = this.suggestDevices(intent, emotionalTone);

    return `
=== LINGUISTIC GUIDANCE ===

INTENT: ${intent}
EMOTIONAL TONE: ${emotionalTone}
PACING: ${pacing}

${style ? `BASE STYLE: ${style.name}
${style.description}

KEY PATTERN: ${style.syntaxPatterns[0].name}
${style.syntaxPatterns[0].description}
Example: "${style.syntaxPatterns[0].example}"
` : ''}

RHYTHM:
${rhythmGuidance}

SYNTAX APPROACH:
${syntaxGuidance}

SUGGESTED DEVICES:
${deviceSuggestions.map(d => `- ${d.name}: ${d.effect}`).join('\n')}

SENTENCE VARIATION SEQUENCE:
${this.generateSentenceSequence(pacing)}

REMEMBER:
- Every sentence should feel inevitable yet surprising
- Rhythm carries meaning beyond words
- White space is a tool
- Read aloud - if you can't breathe, neither can the reader
    `.trim();
  }

  private generateRhythmGuidance(tone: string, pacing: string): string {
    const rhythmPatterns: Record<string, string> = {
      'grief': 'Long sentences that lose their way, interrupted by stark short ones. The breath should catch.',
      'joy': 'Varied lengths, lots of momentum, sentences that want to continue. Let the language dance.',
      'tension': 'Short, getting shorter. Then longer. Control the reader\'s breathing.',
      'contemplation': 'Flowing, parenthetical, allow digressions. The mind wanders when thinking deeply.',
      'action': 'Clipped. Direct. No time for subordinate clauses. Subject verb object. Next.',
      'intimacy': 'Whispered rhythm. Incomplete thoughts. What is not said. The silence between words.'
    };

    const pacingGuidance: Record<string, string> = {
      'slow': 'Let sentences breathe. Use white space. Allow pauses. Dense is not deep.',
      'medium': 'Vary the rhythm. Short following long. Keep the reader slightly off-balance.',
      'fast': 'Compress. Cut adjectives. Active voice only. Paragraph breaks are for breathing.'
    };

    return `${rhythmPatterns[tone] || 'Match rhythm to emotional truth.'}\n${pacingGuidance[pacing]}`;
  }

  private generateSyntaxGuidance(intent: string, tone: string): string {
    if (intent.includes('memory') || intent.includes('past')) {
      return `Use past perfect to create temporal depth. Let tenses blur at the edges of memory.
Consider: "She had been happy then, or she remembered having been happy, which was not quite the same thing."`;
    }

    if (intent.includes('dialogue') || intent.includes('conversation')) {
      return `Dialogue should be asymmetrical - people don't really respond to what was said.
Include the unsaid. "Fine," she said. (But what did fine mean? And why did she look away?)`;
    }

    if (intent.includes('description') || intent.includes('setting')) {
      return `Move from general to specific, or reverse - specific detail that implies the whole.
Avoid full inventory. A single telling detail beats a paragraph of atmosphere.`;
    }

    if (intent.includes('interior') || intent.includes('thought')) {
      return `Free indirect discourse - blend narrator and character until boundaries blur.
Fragments are thinking. Full sentences are rationalizing after the fact.`;
    }

    return `Find the syntax that matches the content. Form should embody meaning.`;
  }

  private suggestDevices(intent: string, tone: string): LinguisticDevice[] {
    const suggestions: LinguisticDevice[] = [];

    if (tone === 'grief' || tone === 'contemplation') {
      const anaphora = LINGUISTIC_DEVICES.find(d => d.name === 'Anaphora');
      if (anaphora) suggestions.push(anaphora);
    }

    if (tone === 'tension' || tone === 'action') {
      const asyndeton = LINGUISTIC_DEVICES.find(d => d.name === 'Asyndeton');
      if (asyndeton) suggestions.push(asyndeton);
    }

    if (intent.includes('sensory') || intent.includes('description')) {
      const synesthesia = LINGUISTIC_DEVICES.find(d => d.name === 'Synesthesia');
      if (synesthesia) suggestions.push(synesthesia);
    }

    if (intent.includes('philosophical') || intent.includes('reflection')) {
      const chiasmus = LINGUISTIC_DEVICES.find(d => d.name === 'Chiasmus');
      if (chiasmus) suggestions.push(chiasmus);
    }

    // Always include litotes as option for restraint
    const litotes = LINGUISTIC_DEVICES.find(d => d.name === 'Litotes');
    if (litotes && suggestions.length < 3) suggestions.push(litotes);

    return suggestions.slice(0, 3);
  }

  private generateSentenceSequence(pacing: string): string {
    const sequences: Record<string, string> = {
      'slow': `1. Long cumulative sentence (scene setting)
2. Medium complex sentence (deepening)
3. Short simple sentence (punctuation point)
4. Fragment (emphasis)
5. Return to medium length
6. Long periodic sentence (building to revelation)`,

      'medium': `1. Medium compound sentence (establishing)
2. Short (shift)
3. Medium complex (development)
4. Long cumulative (expansion)
5. Short (return)
6. Medium (continue)`,

      'fast': `1. Short declarative
2. Shorter fragment
3. Short
4. Medium (brief relief)
5. Short short short
6. Fragment. Impact.`
    };

    return sequences[pacing] || sequences['medium'];
  }

  /**
   * Create a character voice fingerprint
   */
  createVoiceFingerprint(
    characterId: string,
    education: 'none' | 'basic' | 'educated' | 'scholarly',
    personality: string,
    background: string
  ): VoiceFingerprint {
    const vocabularyLevel = this.calculateVocabularyLevel(education, background);
    const complexity = this.calculateComplexity(education, personality);

    const fingerprint: VoiceFingerprint = {
      characterId,
      vocabularyLevel,
      sentenceComplexity: complexity,
      favoredWords: this.generateFavoredWords(personality, background),
      avoidedWords: this.generateAvoidedWords(personality, background),
      speechPatterns: this.generateSpeechPatterns(personality, education),
      silences: this.generateSilences(personality, background),
      tics: this.generateTics(personality),
      rhythmPattern: this.generateRhythmPattern(personality, education)
    };

    this.characterVoices.set(characterId, fingerprint);
    return fingerprint;
  }

  private calculateVocabularyLevel(education: string, background: string): number {
    const baseLevel: Record<string, number> = {
      'none': 3,
      'basic': 5,
      'educated': 7,
      'scholarly': 9
    };
    return baseLevel[education] || 5;
  }

  private calculateComplexity(education: string, personality: string): number {
    let base = this.calculateVocabularyLevel(education, '');

    if (personality.includes('anxious')) base += 1; // Anxious people hedge more
    if (personality.includes('direct')) base -= 2;
    if (personality.includes('evasive')) base += 2;
    if (personality.includes('simple')) base -= 2;

    return Math.max(1, Math.min(10, base));
  }

  private generateFavoredWords(personality: string, background: string): string[] {
    const words: string[] = [];

    if (personality.includes('anxious')) {
      words.push('maybe', 'perhaps', 'I think', 'sort of', 'kind of');
    }
    if (personality.includes('confident')) {
      words.push('obviously', 'clearly', 'certainly', 'definitely');
    }
    if (personality.includes('intellectual')) {
      words.push('essentially', 'fundamentally', 'arguably', 'precisely');
    }
    if (personality.includes('emotional')) {
      words.push('feel', 'heart', 'soul', 'deeply', 'truly');
    }

    return words;
  }

  private generateAvoidedWords(personality: string, background: string): string[] {
    const words: string[] = [];

    if (personality.includes('proud')) {
      words.push('sorry', 'mistake', 'wrong', 'help');
    }
    if (personality.includes('repressed')) {
      words.push('love', 'hate', 'need', 'want', 'feel');
    }
    if (personality.includes('practical')) {
      words.push('dream', 'hope', 'wish', 'imagine');
    }

    return words;
  }

  private generateSpeechPatterns(personality: string, education: string): string[] {
    const patterns: string[] = [];

    if (personality.includes('nervous')) {
      patterns.push('Starts sentences, abandons them, starts again');
      patterns.push('Qualifies everything - "but I could be wrong"');
    }
    if (personality.includes('dominant')) {
      patterns.push('Declarative sentences, few questions');
      patterns.push('Interrupts, finishes others\' sentences');
    }
    if (personality.includes('academic')) {
      patterns.push('Complex subordinate clauses');
      patterns.push('References, allusions, quotations');
    }
    if (personality.includes('working_class')) {
      patterns.push('Concrete vocabulary, practical metaphors');
      patterns.push('Shorter sentences, gets to the point');
    }

    return patterns;
  }

  private generateSilences(personality: string, background: string): string[] {
    const silences: string[] = [];

    silences.push('What they never speak of'); // Everyone has this

    if (background.includes('trauma')) {
      silences.push('The event - referred to only obliquely');
    }
    if (personality.includes('proud')) {
      silences.push('Admissions of weakness or need');
    }
    if (background.includes('loss')) {
      silences.push('The lost one - named reluctantly if at all');
    }

    return silences;
  }

  private generateTics(personality: string): string[] {
    const tics: string[] = [];

    if (personality.includes('anxious')) {
      tics.push('"you know"', '"I mean"', 'trailing off...');
    }
    if (personality.includes('pompous')) {
      tics.push('"As I was saying"', '"The point is"', 'throat clearing');
    }
    if (personality.includes('tentative')) {
      tics.push('"I suppose"', '"If you think"', 'self-corrections');
    }

    return tics;
  }

  private generateRhythmPattern(personality: string, education: string): string {
    if (personality.includes('anxious')) {
      return 'Halting, uneven, sentences that lose their way';
    }
    if (personality.includes('confident')) {
      return 'Steady, measured, declarative rhythm';
    }
    if (personality.includes('intellectual')) {
      return 'Complex periodic sentences with embedded clauses';
    }
    if (personality.includes('passionate')) {
      return 'Building intensity, crescendos and releases';
    }

    return 'Varies with emotional state';
  }

  /**
   * Get character voice
   */
  getVoiceFingerprint(characterId: string): VoiceFingerprint | undefined {
    return this.characterVoices.get(characterId);
  }

  /**
   * Analyze linguistic quality of text
   */
  analyzeLinguisticQuality(text: string): {
    score: number;
    rhythmAnalysis: string;
    varietyScore: number;
    deviceUsage: string[];
    suggestions: string[];
  } {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim());
    const words = text.split(/\s+/);

    // Analyze rhythm
    const lengths = sentences.map(s => s.split(/\s+/).length);
    const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const variance = this.calculateVariance(lengths);

    let rhythmAnalysis = '';
    if (variance < 20) {
      rhythmAnalysis = 'Monotonous - sentence lengths too uniform. Vary the rhythm.';
    } else if (variance > 200) {
      rhythmAnalysis = 'Erratic - wild swings in length. Find a pattern within variation.';
    } else {
      rhythmAnalysis = 'Good rhythmic variety. Sentences breathe.';
    }

    // Analyze variety
    const uniqueWords = new Set(words.map(w => w.toLowerCase()));
    const varietyScore = Math.min(100, (uniqueWords.size / words.length) * 150);

    // Detect device usage
    const deviceUsage: string[] = [];
    if (/\b(and|or)\b.*\b(and|or)\b.*\b(and|or)\b/i.test(text)) {
      deviceUsage.push('Polysyndeton detected');
    }
    if (/^\w+.*\. \w+.*\. \w+/m.test(text)) {
      deviceUsage.push('Possible anaphora or repetition pattern');
    }

    // Calculate score
    let score = 50;
    score += variance > 30 && variance < 150 ? 20 : 0;
    score += varietyScore > 60 ? 15 : 0;
    score += deviceUsage.length * 5;
    score += avgLength > 8 && avgLength < 25 ? 10 : 0;

    // Suggestions
    const suggestions: string[] = [];
    if (variance < 30) {
      suggestions.push('Add some very short sentences for impact. And fragments.');
    }
    if (avgLength > 30) {
      suggestions.push('Some sentences are quite long. Break a few for breathing room.');
    }
    if (avgLength < 10) {
      suggestions.push('All short sentences can feel choppy. Allow some to expand.');
    }
    if (deviceUsage.length === 0) {
      suggestions.push('Consider employing a rhetorical device for emphasis or rhythm.');
    }

    return {
      score: Math.min(100, score),
      rhythmAnalysis,
      varietyScore,
      deviceUsage,
      suggestions
    };
  }

  private calculateVariance(numbers: number[]): number {
    const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
    return numbers.reduce((sum, n) => sum + Math.pow(n - mean, 2), 0) / numbers.length;
  }

  /**
   * Generate innovative sentence variations
   */
  generateSentenceVariations(baseSentence: string): string[] {
    const variations: string[] = [];

    // Original
    variations.push(`Original: ${baseSentence}`);

    // Fragment
    const words = baseSentence.split(' ');
    if (words.length > 3) {
      variations.push(`Fragment: ${words.slice(0, 3).join(' ')}.`);
    }

    // Inverted
    variations.push(`Inverted: Consider inverting the subject-object order for emphasis.`);

    // Expanded
    variations.push(`Expanded: Add a subordinate clause that deepens or qualifies.`);

    // Stripped
    variations.push(`Stripped: What is the minimum this sentence needs? Remove everything else.`);

    return variations;
  }
}

// Export singleton
export const linguisticInnovationEngine = new LinguisticInnovationEngine();
