/**
 * Nobel Literature Engine - The Ultimate AI Literature System
 *
 * This engine integrates all Nobel-grade components to produce literature
 * that transcends commercial fiction and approaches the realm of true art.
 *
 * "Literature is the question minus the answer." - Roland Barthes
 *
 * Core Philosophy:
 * - True creativity through conceptual blending and defamiliarization
 * - Deep philosophical engagement with the human condition
 * - Linguistic innovation that creates new forms of expression
 * - Cultural resonance that captures the zeitgeist while speaking to eternity
 */

import {
  CreativityEngine,
  type ConceptualBlend,
  type DefamiliarizationTechnique
} from './creativityEngine';

import {
  PhilosophicalDepthEngine,
  type ExistentialMoment,
  type CharacterPhilosophy,
  type PhilosophicalTheme
} from './philosophicalDepth';

import {
  LinguisticInnovationEngine,
  type VoiceFingerprint,
  type LinguisticStyle
} from './linguisticInnovation';

import {
  CulturalResonanceEngine,
  type HistoricalMoment,
  type CulturalTension
} from './culturalResonance';

import { AILiteratureEngine, type GenerationConfig } from './aiLiteratureEngine';
import { QualityValidator } from './qualityValidator';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface NobelQualityMetrics {
  creativity: {
    conceptualOriginality: number;    // 0-100: Novel conceptual blends
    defamiliarizationPower: number;   // 0-100: Makes familiar strange
    narrativeInnovation: number;      // 0-100: Breaks conventions meaningfully
  };
  philosophy: {
    existentialDepth: number;         // 0-100: Engagement with human condition
    thematicComplexity: number;       // 0-100: Multiple themes interwoven
    intellectualHonesty: number;      // 0-100: Questions without easy answers
  };
  language: {
    proseMastery: number;             // 0-100: Sentence-level artistry
    voiceDistinctiveness: number;     // 0-100: Unique literary voice
    innovativeExpression: number;     // 0-100: New ways of saying
  };
  culture: {
    zeitgeistCapture: number;         // 0-100: Speaks to now
    universalResonance: number;       // 0-100: Speaks to always
    socialCritique: number;           // 0-100: Illuminates society
  };
  overall: {
    literaryMerit: number;            // 0-100: Combined score
    nobelPotential: number;           // 0-100: Nobel-worthy estimate
    publishingReady: number;          // 0-100: Commercial viability
  };
}

export interface NobelGenerationRequest {
  scene: {
    description: string;
    emotionalTone: string;
    characters: string[];
    setting: string;
  };
  novel: {
    title: string;
    genre: string;
    themes: string[];
    worldview: string;
  };
  chapter: {
    number: number;
    purpose: string;
    previousSummary?: string;
  };
  options?: {
    creativityLevel: 'moderate' | 'high' | 'experimental';
    philosophicalDepth: 'subtle' | 'overt' | 'central';
    linguisticStyle: 'accessible' | 'literary' | 'avant-garde';
    culturalEngagement: 'universal' | 'contemporary' | 'prophetic';
  };
}

export interface DefamiliarizedPassage {
  original: string;
  technique: string;
  transformed: string;
}

export interface StylizedPassage {
  guidance: string;
  style: string;
  examples: string[];
}

export interface ZeitgeistAnalysis {
  summary: string;
  themes: string[];
  tensions: string[];
}

export interface NobelGenerationResult {
  enhancedPrompt: string;
  creativityGuidance: {
    conceptBlends: ConceptualBlend[];
    defamiliarizations: DefamiliarizedPassage[];
    narrativeSubversions: string[];
  };
  philosophicalGuidance: {
    themes: PhilosophicalTheme[];
    existentialMoments: ExistentialMoment[];
    characterPhilosophies: CharacterPhilosophy[];
  };
  linguisticGuidance: {
    styleProfile: StylizedPassage;
    voiceFingerprints: Map<string, VoiceFingerprint>;
    innovativeTechniques: string[];
  };
  culturalGuidance: {
    zeitgeistAnalysis: ZeitgeistAnalysis;
    tensions: CulturalTension[];
    universalThemes: string[];
  };
  qualityTargets: NobelQualityMetrics;
}

export interface NobelRevisionRequest {
  originalText: string;
  targetMetrics: Partial<NobelQualityMetrics>;
  focusAreas: ('creativity' | 'philosophy' | 'language' | 'culture')[];
  preserveElements?: string[];
}

export interface NobelRevisionResult {
  revisedPrompt: string;
  specificImprovements: {
    area: string;
    current: number;
    target: number;
    suggestions: string[];
  }[];
  expectedImprovement: NobelQualityMetrics;
}

// ============================================================================
// Nobel Literature Engine
// ============================================================================

export class NobelLiteratureEngine {
  private creativityEngine: CreativityEngine;
  private philosophyEngine: PhilosophicalDepthEngine;
  private linguisticEngine: LinguisticInnovationEngine;
  private culturalEngine: CulturalResonanceEngine;
  private baseEngine: AILiteratureEngine;
  private validator: QualityValidator;

  // Nobel laureate wisdom for guidance
  private readonly NOBEL_WISDOM = {
    onCreativity: [
      "The role of the writer is not to say what we can all say, but what we are unable to say. - Anais Nin",
      "No tears in the writer, no tears in the reader. - Robert Frost",
      "Write what should not be forgotten. - Isabel Allende"
    ],
    onTruth: [
      "The purpose of literature is to turn blood into ink. - T.S. Eliot",
      "Literature is a luxury; fiction is a necessity. - G.K. Chesterton",
      "The only truth is music. - Jack Kerouac (paraphrased)"
    ],
    onHumanity: [
      "We read to know we are not alone. - C.S. Lewis",
      "Literature is the most agreeable way of ignoring life. - Fernando Pessoa",
      "Books are the mirrors of the soul. - Virginia Woolf"
    ]
  };

  // Quality thresholds for Nobel-grade work
  private readonly QUALITY_THRESHOLDS = {
    commercial: 60,        // Publishable
    literary: 75,          // Literary fiction quality
    prizeWorthy: 85,       // Major prize consideration
    nobelPotential: 92     // Nobel Prize tier
  };

  constructor() {
    this.creativityEngine = new CreativityEngine();
    this.philosophyEngine = new PhilosophicalDepthEngine();
    this.linguisticEngine = new LinguisticInnovationEngine();
    this.culturalEngine = new CulturalResonanceEngine();
    this.baseEngine = new AILiteratureEngine();
    this.validator = new QualityValidator();
  }

  // ============================================================================
  // Core Generation Methods
  // ============================================================================

  /**
   * Generate Nobel-grade writing guidance
   */
  async generateNobelGuidance(request: NobelGenerationRequest): Promise<NobelGenerationResult> {
    const options = request.options || {
      creativityLevel: 'high',
      philosophicalDepth: 'overt',
      linguisticStyle: 'literary',
      culturalEngagement: 'contemporary'
    };

    // 1. Generate creativity guidance
    const creativityGuidance = await this.generateCreativityGuidance(request, options);

    // 2. Generate philosophical guidance
    const philosophicalGuidance = await this.generatePhilosophicalGuidance(request, options);

    // 3. Generate linguistic guidance
    const linguisticGuidance = await this.generateLinguisticGuidance(request, options);

    // 4. Generate cultural guidance
    const culturalGuidance = await this.generateCulturalGuidance(request, options);

    // 5. Synthesize into master prompt
    const enhancedPrompt = this.synthesizeMasterPrompt(
      request,
      creativityGuidance,
      philosophicalGuidance,
      linguisticGuidance,
      culturalGuidance
    );

    // 6. Set quality targets
    const qualityTargets = this.calculateQualityTargets(options);

    return {
      enhancedPrompt,
      creativityGuidance,
      philosophicalGuidance,
      linguisticGuidance,
      culturalGuidance,
      qualityTargets
    };
  }

  /**
   * Generate revision guidance to elevate existing text
   */
  async generateRevisionGuidance(request: NobelRevisionRequest): Promise<NobelRevisionResult> {
    const improvements: NobelRevisionResult['specificImprovements'] = [];
    const suggestions: string[] = [];

    for (const area of request.focusAreas) {
      switch (area) {
        case 'creativity':
          improvements.push({
            area: 'Conceptual Innovation',
            current: request.targetMetrics?.creativity?.conceptualOriginality || 50,
            target: 90,
            suggestions: [
              'Introduce unexpected conceptual blends - combine distant domains',
              'Apply defamiliarization to familiar elements',
              'Subvert one narrative expectation in this passage'
            ]
          });
          suggestions.push(
            '## Creativity Enhancement\n' +
            'Consider: What if this moment were viewed from an entirely unexpected angle?\n' +
            'The familiar should become strange, the strange familiar.\n' +
            'Break one expectation the reader has formed.'
          );
          break;

        case 'philosophy':
          improvements.push({
            area: 'Existential Depth',
            current: request.targetMetrics?.philosophy?.existentialDepth || 50,
            target: 90,
            suggestions: [
              'Embed a moment of existential awareness without stating it directly',
              'Let characters embody philosophical positions through action',
              'Leave a question that haunts the reader'
            ]
          });
          suggestions.push(
            '## Philosophical Deepening\n' +
            'Underlying question: What does it mean to be human in this moment?\n' +
            'The text should pose questions, not provide answers.\n' +
            'Show the weight of existence through specific, physical details.'
          );
          break;

        case 'language':
          improvements.push({
            area: 'Linguistic Artistry',
            current: request.targetMetrics?.language?.proseMastery || 50,
            target: 90,
            suggestions: [
              'Vary sentence rhythm more dramatically',
              'Use one unexpected image that illuminates',
              'Make the syntax mirror the emotional content'
            ]
          });
          suggestions.push(
            '## Linguistic Elevation\n' +
            'Each sentence should earn its place.\n' +
            'Rhythm matters: vary long and short, complex and simple.\n' +
            'Find one image that no one has used quite this way before.'
          );
          break;

        case 'culture':
          improvements.push({
            area: 'Cultural Resonance',
            current: request.targetMetrics?.culture?.zeitgeistCapture || 50,
            target: 90,
            suggestions: [
              'Connect this moment to a larger cultural tension',
              'Ground the universal in specific cultural details',
              'Let the particular illuminate the general'
            ]
          });
          suggestions.push(
            '## Cultural Deepening\n' +
            'This personal moment connects to: [identify larger pattern]\n' +
            'The specific details should feel both of-the-moment and timeless.\n' +
            'What does this scene say about how we live now?'
          );
          break;
      }
    }

    const revisedPrompt = this.buildRevisionPrompt(request, suggestions);

    return {
      revisedPrompt,
      specificImprovements: improvements,
      expectedImprovement: this.calculateExpectedImprovement(request.targetMetrics || {})
    };
  }

  /**
   * Evaluate text against Nobel standards
   */
  evaluateNobelQuality(text: string, context?: NobelGenerationRequest): NobelQualityMetrics {
    // Creativity metrics
    const creativity = {
      conceptualOriginality: this.evaluateConceptualOriginality(text),
      defamiliarizationPower: this.evaluateDefamiliarization(text),
      narrativeInnovation: this.evaluateNarrativeInnovation(text)
    };

    // Philosophy metrics
    const philosophy = {
      existentialDepth: this.evaluateExistentialDepth(text),
      thematicComplexity: this.evaluateThematicComplexity(text),
      intellectualHonesty: this.evaluateIntellectualHonesty(text)
    };

    // Language metrics
    const language = {
      proseMastery: this.evaluateProseMastery(text),
      voiceDistinctiveness: this.evaluateVoiceDistinctiveness(text),
      innovativeExpression: this.evaluateInnovativeExpression(text)
    };

    // Culture metrics
    const culture = {
      zeitgeistCapture: this.evaluateZeitgeistCapture(text, context),
      universalResonance: this.evaluateUniversalResonance(text),
      socialCritique: this.evaluateSocialCritique(text)
    };

    // Overall metrics
    const avgCreativity = (creativity.conceptualOriginality + creativity.defamiliarizationPower + creativity.narrativeInnovation) / 3;
    const avgPhilosophy = (philosophy.existentialDepth + philosophy.thematicComplexity + philosophy.intellectualHonesty) / 3;
    const avgLanguage = (language.proseMastery + language.voiceDistinctiveness + language.innovativeExpression) / 3;
    const avgCulture = (culture.zeitgeistCapture + culture.universalResonance + culture.socialCritique) / 3;

    const literaryMerit = (avgCreativity * 0.25 + avgPhilosophy * 0.25 + avgLanguage * 0.25 + avgCulture * 0.25);
    const nobelPotential = this.calculateNobelPotential(creativity, philosophy, language, culture);
    const publishingReady = Math.min(literaryMerit, avgLanguage, 85);

    return {
      creativity,
      philosophy,
      language,
      culture,
      overall: {
        literaryMerit: Math.round(literaryMerit),
        nobelPotential: Math.round(nobelPotential),
        publishingReady: Math.round(publishingReady)
      }
    };
  }

  // ============================================================================
  // Private Generation Methods
  // ============================================================================

  private async generateCreativityGuidance(
    request: NobelGenerationRequest,
    options: NonNullable<NobelGenerationRequest['options']>
  ) {
    const intensity = options.creativityLevel === 'experimental' ? 3 :
                      options.creativityLevel === 'high' ? 2 : 1;

    // Generate concept blends
    const domains = this.extractConceptualDomains(request);
    const conceptBlends: ConceptualBlend[] = [];

    if (domains.length >= 2) {
      for (let i = 0; i < intensity && i < domains.length - 1; i++) {
        const blend = this.creativityEngine.generateConceptualBlend(domains[i], domains[i + 1]);
        if (blend) conceptBlends.push(blend);
      }
    }

    // Generate defamiliarizations
    const defamiliarizations: DefamiliarizedPassage[] = [];
    const familiarElements = this.identifyFamiliarElements(request);

    for (let i = 0; i < intensity && i < familiarElements.length; i++) {
      // applyDefamiliarization will auto-select technique if not provided
      const result = this.creativityEngine.applyDefamiliarization(familiarElements[i]);
      defamiliarizations.push({
        original: familiarElements[i],
        technique: result.techniqueUsed.name,
        transformed: result.guidance
      });
    }

    // Generate narrative subversions
    const subversions = this.creativityEngine.suggestSubversions(request.scene.description);
    const narrativeSubversions = subversions.map(s => `${s.convention}: ${s.subversion}`);

    return {
      conceptBlends,
      defamiliarizations,
      narrativeSubversions: narrativeSubversions.slice(0, intensity + 1)
    };
  }

  private async generatePhilosophicalGuidance(
    request: NobelGenerationRequest,
    options: NonNullable<NobelGenerationRequest['options']>
  ) {
    const depth = options.philosophicalDepth === 'central' ? 'explicit' :
                  options.philosophicalDepth === 'overt' ? 'subtle' : 'background';

    // Map themes to philosophical themes
    const themes: PhilosophicalTheme[] = [];
    for (const t of request.novel.themes) {
      const theme = this.philosophyEngine.getTheme(t.toLowerCase());
      if (theme) themes.push(theme);
    }
    // Add default theme if none found
    if (themes.length === 0) {
      const defaultTheme = this.philosophyEngine.getTheme('identity');
      if (defaultTheme) themes.push(defaultTheme);
    }

    // Generate existential moments for characters
    const existentialMoments: ExistentialMoment[] = [];
    for (const character of request.scene.characters.slice(0, 2)) {
      const moment = this.philosophyEngine.createExistentialMoment(
        character,
        themes[0]?.name || 'identity',
        'epiphany'
      );
      existentialMoments.push(moment);
    }

    // Generate character philosophies
    const characterPhilosophies: CharacterPhilosophy[] = [];
    for (const character of request.scene.characters.slice(0, 2)) {
      const philosophy = this.philosophyEngine.defineCharacterPhilosophy(
        character,
        request.novel.worldview,
        ['existence', 'meaning', 'truth'], // core beliefs
        themes[0]?.name || 'identity'
      );
      characterPhilosophies.push(philosophy);
    }

    return {
      themes,
      existentialMoments,
      characterPhilosophies
    };
  }

  private async generateLinguisticGuidance(
    request: NobelGenerationRequest,
    options: NonNullable<NobelGenerationRequest['options']>
  ) {
    const pacing: 'slow' | 'medium' | 'fast' =
      options.linguisticStyle === 'avant-garde' ? 'slow' :
      options.linguisticStyle === 'literary' ? 'medium' : 'fast';

    // Generate style profile
    const guidance = this.linguisticEngine.generateStyleGuidance(
      request.scene.description,
      request.scene.emotionalTone,
      pacing
    );

    const styleProfile: StylizedPassage = {
      guidance,
      style: options.linguisticStyle,
      examples: []
    };

    // Generate voice fingerprints for characters
    const voiceFingerprints = new Map<string, VoiceFingerprint>();
    for (const character of request.scene.characters) {
      const fingerprint = this.linguisticEngine.createVoiceFingerprint(
        character,
        'educated',
        'complex',
        'urban'
      );
      voiceFingerprints.set(character, fingerprint);
    }

    // Generate innovative techniques from devices
    const devices = this.linguisticEngine.getDevices();
    const innovativeTechniques = devices.slice(0, 3).map(d => `${d.name}: ${d.effect}`);

    return {
      styleProfile,
      voiceFingerprints,
      innovativeTechniques
    };
  }

  private async generateCulturalGuidance(
    request: NobelGenerationRequest,
    options: NonNullable<NobelGenerationRequest['options']>
  ) {
    // Generate zeitgeist analysis
    const zeitgeistGuidance = this.culturalEngine.generateZeitgeistGuidance(
      request.novel.themes[0] || 'identity',
      request.scene.setting
    );

    const zeitgeistAnalysis: ZeitgeistAnalysis = {
      summary: zeitgeistGuidance,
      themes: request.novel.themes,
      tensions: []
    };

    // Get cultural tensions
    const tensions = this.culturalEngine.getCulturalTensions();

    // Get universal experiences as themes
    const universalExperiences = this.culturalEngine.getUniversalExperiences();
    const universalThemes = universalExperiences.map(e => e.name);

    return {
      zeitgeistAnalysis,
      tensions,
      universalThemes
    };
  }

  // ============================================================================
  // Synthesis Methods
  // ============================================================================

  private synthesizeMasterPrompt(
    request: NobelGenerationRequest,
    creativity: NobelGenerationResult['creativityGuidance'],
    philosophy: NobelGenerationResult['philosophicalGuidance'],
    linguistic: NobelGenerationResult['linguisticGuidance'],
    cultural: NobelGenerationResult['culturalGuidance']
  ): string {
    const sections: string[] = [];

    // Header with Nobel wisdom
    const wisdom = this.selectRelevantWisdom(request);
    sections.push(`# Nobel Literature Generation Guidance\n\n*"${wisdom}"*\n`);

    // Scene context
    sections.push(`## Scene Context
- **Setting**: ${request.scene.setting}
- **Emotional Tone**: ${request.scene.emotionalTone}
- **Characters**: ${request.scene.characters.join(', ')}
- **Chapter Purpose**: ${request.chapter.purpose}
`);

    // Creativity directives
    if (creativity.conceptBlends.length > 0 || creativity.defamiliarizations.length > 0) {
      sections.push(`## Creative Innovation Directives

### Conceptual Blending
${creativity.conceptBlends.map(b =>
  `- **${b.blendedSpace.newConcept}**: ${b.emergentMeaning}\n  - Novel metaphors: ${b.blendedSpace.emergentProperties.slice(0, 2).join('; ')}`
).join('\n')}

### Defamiliarization Opportunities
${creativity.defamiliarizations.map(d =>
  `- Transform "${d.original}" through ${d.technique}:\n  - Example approach: ${d.transformed}`
).join('\n')}

### Narrative Subversions to Consider
${creativity.narrativeSubversions.map(s => `- ${s}`).join('\n')}
`);
    }

    // Philosophical directives
    if (philosophy.themes.length > 0) {
      sections.push(`## Philosophical Depth Directives

### Core Themes to Embody
${philosophy.themes.map(t =>
  `- **${t.name}**: "${t.centralQuestion}"\n  - Manifest through: ${t.manifestations?.slice(0, 2).join(', ') || 'character choices and consequences'}`
).join('\n')}

### Existential Moments to Capture
${philosophy.existentialMoments.map(m =>
  `- **${m.type}**: ${m.theme}\n  - Trigger: ${m.trigger}\n  - Internal process: ${m.internalProcess}`
).join('\n')}

### Character Philosophical Positions
${philosophy.characterPhilosophies.map(p =>
  `- **${p.characterId}**: ${p.worldview}\n  - This creates tension with: ${p.blindSpots?.slice(0, 1).join(', ') || 'their desires'}`
).join('\n')}
`);
    }

    // Linguistic directives
    sections.push(`## Linguistic Innovation Directives

### Style Profile
${linguistic.styleProfile.guidance}

### Voice Fingerprints
${Array.from(linguistic.voiceFingerprints.entries()).map(([char, voice]) =>
  `- **${char}**: Vocabulary level ${voice.vocabularyLevel}/10, Complexity ${voice.sentenceComplexity}/10\n  - Speech patterns: ${voice.speechPatterns.slice(0, 2).join('; ')}`
).join('\n')}

### Innovative Techniques to Employ
${linguistic.innovativeTechniques.map(t => `- ${t}`).join('\n')}
`);

    // Cultural directives
    sections.push(`## Cultural Resonance Directives

### Zeitgeist Connection
${cultural.zeitgeistAnalysis.summary}

### Cultural Tensions to Explore
${cultural.tensions.map(t =>
  `- **${t.tension}**: ${t.pole1} vs ${t.pole2}\n  - Literary potential: ${t.literaryPotential}`
).join('\n')}

### Universal Themes
${cultural.universalThemes.map(t => `- ${t}`).join('\n')}
`);

    // Final synthesis
    sections.push(`## Master Directive

Write this scene with Nobel-level literary ambition:

1. **Every sentence must earn its place** - no filler, no cliches, no shortcuts
2. **Show the human condition through specific, sensory details** - not abstractions
3. **Leave questions in the reader's mind** - resist the urge to explain
4. **Make the familiar strange** - find new angles on universal experiences
5. **Let the prose rhythm match the emotional content** - form follows feeling
6. **Connect the personal to the universal** - one person's story is everyone's story
7. **Trust the reader** - understatement over explanation
8. **Surprise yourself** - if you're not surprised, the reader won't be either

The goal is not to write something good - it's to write something that couldn't have been written any other way.
`);

    return sections.join('\n');
  }

  private buildRevisionPrompt(request: NobelRevisionRequest, suggestions: string[]): string {
    let prompt = `# Nobel-Quality Revision Guidance

## Original Text
\`\`\`
${request.originalText}
\`\`\`

## Elements to Preserve
${request.preserveElements?.map(e => `- ${e}`).join('\n') || '- Core narrative events\n- Character identities'}

## Enhancement Directives
${suggestions.join('\n\n')}

## Revision Principles

1. **Addition through subtraction** - Can anything be cut to make it stronger?
2. **Concrete over abstract** - Replace any abstraction with specific detail
3. **Active transformation** - Don't just describe, reveal
4. **Earned emotion** - Remove any sentiment that hasn't been built through action
5. **Resonant silence** - What's NOT said can be more powerful than what is

Revise with the question: "How would Tolstoy/Woolf/Garcia Marquez have written this?"
`;

    return prompt;
  }

  // ============================================================================
  // Evaluation Methods
  // ============================================================================

  private evaluateConceptualOriginality(text: string): number {
    let score = 50; // Base score

    // Check for unexpected metaphors
    const metaphorPatterns = /like a|as if|resembles|echoes of|mirrors|shadows of/gi;
    const metaphors = text.match(metaphorPatterns) || [];
    score += Math.min(metaphors.length * 3, 15);

    // Check for conceptual juxtaposition
    const juxtapositionIndicators = /yet|but also|simultaneously|both.*and|neither.*nor/gi;
    const juxtapositions = text.match(juxtapositionIndicators) || [];
    score += Math.min(juxtapositions.length * 4, 12);

    // Check for absence of cliches
    const cliches = this.detectCliches(text);
    score -= cliches.length * 5;

    // Check for unique combinations
    if (text.length > 500 && cliches.length === 0) {
      score += 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  private evaluateDefamiliarization(text: string): number {
    let score = 50;

    // Check for unusual perspectives
    const perspectiveShifts = /from the perspective of|as seen by|through the eyes of|appeared to|seemed to become/gi;
    const shifts = text.match(perspectiveShifts) || [];
    score += Math.min(shifts.length * 5, 15);

    // Check for sensory descriptions of abstract concepts
    const synesthesia = /the (sound|color|taste|smell|texture) of (time|memory|silence|absence|thought)/gi;
    const synesthesias = text.match(synesthesia) || [];
    score += Math.min(synesthesias.length * 8, 16);

    // Check for making ordinary extraordinary
    const ordinaryWords = ['walked', 'said', 'looked', 'felt', 'was'];
    const transformedOrdinary = ordinaryWords.filter(w => {
      const regex = new RegExp(`\\b${w}\\b.*?(?:like|as if|into|becoming)`, 'gi');
      return regex.test(text);
    });
    score += transformedOrdinary.length * 4;

    return Math.max(0, Math.min(100, score));
  }

  private evaluateNarrativeInnovation(text: string): number {
    let score = 50;

    // Check for non-linear elements
    const timeShifts = /had been|would later|before that|years hence|in retrospect/gi;
    const shifts = text.match(timeShifts) || [];
    score += Math.min(shifts.length * 3, 12);

    // Check for meta-narrative awareness
    const metaElements = /the story|the reader|this telling|narrative|as if written/gi;
    const metas = text.match(metaElements) || [];
    if (metas.length > 0 && metas.length < 4) { // Some but not excessive
      score += 8;
    }

    // Check for structural variety
    const sentences = text.split(/[.!?]+/).filter(s => s.trim());
    if (sentences.length > 5) {
      const lengths = sentences.map(s => s.split(' ').length);
      const variance = this.calculateVariance(lengths);
      if (variance > 50) score += 10; // High variety is good
    }

    return Math.max(0, Math.min(100, score));
  }

  private evaluateExistentialDepth(text: string): number {
    let score = 40;

    // Check for existential themes
    const existentialWords = /death|mortality|meaning|existence|void|nothing|being|time|freedom|choice|alone|silence/gi;
    const existentials = text.match(existentialWords) || [];
    score += Math.min(existentials.length * 3, 18);

    // Check for philosophical questioning
    const questions = text.match(/\?/g) || [];
    const deepQuestions = text.match(/(why|what does it mean|who are we|how can|what is)/gi) || [];
    score += Math.min(deepQuestions.length * 5, 15);

    // Check for confrontation with limits
    const limits = /impossible|cannot|never|end|final|last|nothing more|no way/gi;
    const limitMatches = text.match(limits) || [];
    score += Math.min(limitMatches.length * 2, 10);

    // Penalize easy answers
    const easyAnswers = /the answer|the solution|everything.*clear|finally understood/gi;
    const easies = text.match(easyAnswers) || [];
    score -= easies.length * 8;

    return Math.max(0, Math.min(100, score));
  }

  private evaluateThematicComplexity(text: string): number {
    let score = 50;

    // Count distinct thematic threads
    const themeMarkers = {
      love: /love|heart|desire|longing|passion/gi,
      death: /death|dying|mortality|end|grave/gi,
      time: /time|memory|past|future|moment/gi,
      identity: /self|identity|who am I|becoming|being/gi,
      power: /power|control|domination|submission|authority/gi,
      truth: /truth|lie|deception|reality|illusion/gi
    };

    let themesPresent = 0;
    for (const [_, pattern] of Object.entries(themeMarkers)) {
      if (pattern.test(text)) themesPresent++;
    }

    score += themesPresent * 6;

    // Check for thematic interweaving
    if (themesPresent >= 3) {
      score += 10; // Bonus for complexity
    }

    return Math.max(0, Math.min(100, score));
  }

  private evaluateIntellectualHonesty(text: string): number {
    let score = 55;

    // Check for acknowledgment of ambiguity
    const ambiguity = /perhaps|maybe|uncertain|unclear|both|neither|or perhaps/gi;
    const ambiguities = text.match(ambiguity) || [];
    score += Math.min(ambiguities.length * 3, 15);

    // Penalize false certainty
    const certainty = /certainly|obviously|clearly|of course|naturally|undoubtedly/gi;
    const certainties = text.match(certainty) || [];
    score -= certainties.length * 4;

    // Check for nuanced character treatment
    const nuance = /but also|at the same time|despite|although|even as/gi;
    const nuances = text.match(nuance) || [];
    score += Math.min(nuances.length * 4, 16);

    return Math.max(0, Math.min(100, score));
  }

  private evaluateProseMastery(text: string): number {
    let score = 50;

    // Check sentence variety
    const sentences = text.split(/[.!?]+/).filter(s => s.trim());
    if (sentences.length > 3) {
      const lengths = sentences.map(s => s.split(' ').length);
      const variance = this.calculateVariance(lengths);

      if (variance > 30 && variance < 200) {
        score += 15; // Good variety
      }
    }

    // Check for strong verbs
    const weakVerbs = /\b(is|are|was|were|be|been|being|have|has|had|do|does|did|get|got|make|made)\b/gi;
    const weakCount = (text.match(weakVerbs) || []).length;
    const wordCount = text.split(/\s+/).length;
    const weakRatio = weakCount / wordCount;

    if (weakRatio < 0.05) score += 15;
    else if (weakRatio < 0.08) score += 8;
    else if (weakRatio > 0.12) score -= 10;

    // Check for sensory detail
    const sensory = /saw|heard|felt|smelled|tasted|touched|bright|dark|loud|soft|rough|smooth/gi;
    const sensoryCount = (text.match(sensory) || []).length;
    score += Math.min(sensoryCount * 2, 12);

    return Math.max(0, Math.min(100, score));
  }

  private evaluateVoiceDistinctiveness(text: string): number {
    let score = 50;

    // Check for consistent tone markers
    const toneMarkers = {
      ironic: /of course|naturally|as one might expect|unsurprisingly/gi,
      lyrical: /like|as|flowing|dancing|singing|whispering/gi,
      stark: /nothing|bare|empty|silence|void|still/gi,
      intimate: /you|we|us|our|between us/gi
    };

    let dominantTones = 0;
    for (const [_, pattern] of Object.entries(toneMarkers)) {
      const matches = text.match(pattern) || [];
      if (matches.length >= 2) dominantTones++;
    }

    if (dominantTones === 1 || dominantTones === 2) {
      score += 15; // Consistent but not monotonous
    }

    // Check for unique word choices
    const uniqueWords = this.countUniqueWords(text);
    const totalWords = text.split(/\s+/).length;
    const uniqueRatio = uniqueWords / totalWords;

    if (uniqueRatio > 0.7) score += 10;
    else if (uniqueRatio > 0.6) score += 5;

    return Math.max(0, Math.min(100, score));
  }

  private evaluateInnovativeExpression(text: string): number {
    let score = 45;

    // Check for novel combinations
    const unusualPhrases = this.detectUnusualPhrases(text);
    score += Math.min(unusualPhrases * 5, 20);

    // Check for creative syntax
    const syntaxVariations = /^[A-Z][^.!?]*,\s+[^.!?]*,\s+[^.!?]*[.!?]/gm;
    const complexSyntax = text.match(syntaxVariations) || [];
    score += Math.min(complexSyntax.length * 3, 12);

    // Check for invented or rare vocabulary
    const rareWords = this.detectRareVocabulary(text);
    score += Math.min(rareWords * 4, 16);

    return Math.max(0, Math.min(100, score));
  }

  private evaluateZeitgeistCapture(text: string, context?: NobelGenerationRequest): number {
    let score = 50;

    // Check for contemporary markers
    const contemporary = /digital|screen|network|virtual|algorithm|data|connection|isolation|anxiety|climate/gi;
    const contemporaryMatches = text.match(contemporary) || [];
    score += Math.min(contemporaryMatches.length * 4, 16);

    // Check for tension with tradition
    const tension = /used to|once|before|remember when|now|these days|no longer/gi;
    const tensionMatches = text.match(tension) || [];
    score += Math.min(tensionMatches.length * 3, 12);

    // Context-specific bonus
    if (context?.novel.themes.some(t =>
      ['technology', 'modern', 'contemporary', 'digital'].some(m => t.toLowerCase().includes(m))
    )) {
      score += 8;
    }

    return Math.max(0, Math.min(100, score));
  }

  private evaluateUniversalResonance(text: string): number {
    let score = 50;

    // Check for universal human experiences
    const universal = /mother|father|child|home|loss|love|fear|hope|dream|death|birth|memory/gi;
    const universalMatches = text.match(universal) || [];
    score += Math.min(universalMatches.length * 3, 18);

    // Check for body/physicality (grounds in human experience)
    const physical = /hand|eye|heart|breath|blood|bone|skin|face|body|touch/gi;
    const physicalMatches = text.match(physical) || [];
    score += Math.min(physicalMatches.length * 2, 14);

    // Check for elemental imagery
    const elemental = /water|fire|earth|air|light|dark|sun|moon|star|wind|rain/gi;
    const elementalMatches = text.match(elemental) || [];
    score += Math.min(elementalMatches.length * 2, 10);

    return Math.max(0, Math.min(100, score));
  }

  private evaluateSocialCritique(text: string): number {
    let score = 45;

    // Check for social observation
    const social = /society|class|wealth|poverty|power|justice|equality|freedom|oppression|system/gi;
    const socialMatches = text.match(social) || [];
    score += Math.min(socialMatches.length * 4, 16);

    // Check for implicit critique through contrast
    const contrast = /while|whereas|but|yet|though|although|despite|however/gi;
    const contrastMatches = text.match(contrast) || [];
    score += Math.min(contrastMatches.length * 2, 10);

    // Check for irony markers
    const irony = /of course|naturally|as expected|supposedly|so-called/gi;
    const ironyMatches = text.match(irony) || [];
    score += Math.min(ironyMatches.length * 5, 15);

    return Math.max(0, Math.min(100, score));
  }

  private calculateNobelPotential(
    creativity: NobelQualityMetrics['creativity'],
    philosophy: NobelQualityMetrics['philosophy'],
    language: NobelQualityMetrics['language'],
    culture: NobelQualityMetrics['culture']
  ): number {
    // Nobel potential requires excellence across ALL dimensions
    const scores = [
      creativity.conceptualOriginality,
      creativity.defamiliarizationPower,
      philosophy.existentialDepth,
      philosophy.intellectualHonesty,
      language.proseMastery,
      language.voiceDistinctiveness,
      culture.universalResonance,
      culture.zeitgeistCapture
    ];

    // Minimum score drags down the potential (no weak links)
    const minScore = Math.min(...scores);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;

    // Nobel potential is heavily influenced by the weakest area
    return minScore * 0.4 + avgScore * 0.6;
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private extractConceptualDomains(request: NobelGenerationRequest): string[] {
    const domains: string[] = [];

    // Extract from themes
    domains.push(...request.novel.themes);

    // Extract from setting
    const settingDomains = request.scene.setting.toLowerCase().split(/\s+/)
      .filter(w => w.length > 4);
    domains.push(...settingDomains.slice(0, 2));

    // Extract from emotional tone
    domains.push(request.scene.emotionalTone);

    return Array.from(new Set(domains));
  }

  private identifyFamiliarElements(request: NobelGenerationRequest): string[] {
    const familiar: string[] = [];

    // Common scene elements that could be defamiliarized
    const commonElements = ['room', 'street', 'morning', 'night', 'silence', 'waiting'];
    const description = request.scene.description.toLowerCase();

    for (const element of commonElements) {
      if (description.includes(element)) {
        familiar.push(element);
      }
    }

    return familiar.slice(0, 3);
  }

  private selectTechnique(genre: string): string {
    const genreTechniques: Record<string, string> = {
      'literary': 'Proustian Dilation',
      'fantasy': 'Borgesian Labyrinth',
      'thriller': 'Kafka Perspective',
      'romance': 'Woolfian Consciousness',
      'horror': 'Tolstoyan Estrangement',
      'default': 'Saramago Fluidity'
    };

    return genreTechniques[genre.toLowerCase()] || genreTechniques.default;
  }

  private inferCharacterTraits(character: string, request: NobelGenerationRequest): string[] {
    // Basic inference - in real implementation, would use character database
    const traits: string[] = [];

    if (request.scene.emotionalTone.includes('sad') || request.scene.emotionalTone.includes('melancholy')) {
      traits.push('introspective', 'sensitive');
    }
    if (request.novel.genre.includes('thriller')) {
      traits.push('alert', 'guarded');
    }
    if (request.chapter.number === 1) {
      traits.push('uncertain', 'hopeful');
    }

    return traits.length > 0 ? traits : ['complex', 'searching'];
  }

  private selectRelevantWisdom(request: NobelGenerationRequest): string {
    const allWisdom = [
      ...this.NOBEL_WISDOM.onCreativity,
      ...this.NOBEL_WISDOM.onTruth,
      ...this.NOBEL_WISDOM.onHumanity
    ];

    // Select based on emotional tone
    if (request.scene.emotionalTone.includes('sad') || request.scene.emotionalTone.includes('dark')) {
      return this.NOBEL_WISDOM.onTruth[0];
    }
    if (request.scene.emotionalTone.includes('hopeful') || request.scene.emotionalTone.includes('love')) {
      return this.NOBEL_WISDOM.onHumanity[0];
    }

    return allWisdom[Math.floor(Math.random() * allWisdom.length)];
  }

  private calculateQualityTargets(options: NonNullable<NobelGenerationRequest['options']>): NobelQualityMetrics {
    const baseTarget = 75;
    const highTarget = 85;
    const experimentalTarget = 92;

    const creativityTarget = options.creativityLevel === 'experimental' ? experimentalTarget :
                             options.creativityLevel === 'high' ? highTarget : baseTarget;

    const philosophyTarget = options.philosophicalDepth === 'central' ? experimentalTarget :
                             options.philosophicalDepth === 'overt' ? highTarget : baseTarget;

    const languageTarget = options.linguisticStyle === 'avant-garde' ? experimentalTarget :
                           options.linguisticStyle === 'literary' ? highTarget : baseTarget;

    const cultureTarget = options.culturalEngagement === 'prophetic' ? experimentalTarget :
                          options.culturalEngagement === 'contemporary' ? highTarget : baseTarget;

    return {
      creativity: {
        conceptualOriginality: creativityTarget,
        defamiliarizationPower: creativityTarget,
        narrativeInnovation: creativityTarget - 5
      },
      philosophy: {
        existentialDepth: philosophyTarget,
        thematicComplexity: philosophyTarget - 5,
        intellectualHonesty: philosophyTarget
      },
      language: {
        proseMastery: languageTarget,
        voiceDistinctiveness: languageTarget - 5,
        innovativeExpression: languageTarget
      },
      culture: {
        zeitgeistCapture: cultureTarget,
        universalResonance: cultureTarget,
        socialCritique: cultureTarget - 10
      },
      overall: {
        literaryMerit: Math.round((creativityTarget + philosophyTarget + languageTarget + cultureTarget) / 4),
        nobelPotential: Math.round((creativityTarget + philosophyTarget + languageTarget + cultureTarget) / 4) - 5,
        publishingReady: baseTarget
      }
    };
  }

  private calculateExpectedImprovement(current: Partial<NobelQualityMetrics>): NobelQualityMetrics {
    // Estimate improvement potential
    const improvement = 15; // Typical improvement from revision

    return {
      creativity: {
        conceptualOriginality: (current.creativity?.conceptualOriginality || 50) + improvement,
        defamiliarizationPower: (current.creativity?.defamiliarizationPower || 50) + improvement,
        narrativeInnovation: (current.creativity?.narrativeInnovation || 50) + improvement - 5
      },
      philosophy: {
        existentialDepth: (current.philosophy?.existentialDepth || 50) + improvement,
        thematicComplexity: (current.philosophy?.thematicComplexity || 50) + improvement,
        intellectualHonesty: (current.philosophy?.intellectualHonesty || 50) + improvement
      },
      language: {
        proseMastery: (current.language?.proseMastery || 50) + improvement,
        voiceDistinctiveness: (current.language?.voiceDistinctiveness || 50) + improvement,
        innovativeExpression: (current.language?.innovativeExpression || 50) + improvement
      },
      culture: {
        zeitgeistCapture: (current.culture?.zeitgeistCapture || 50) + improvement,
        universalResonance: (current.culture?.universalResonance || 50) + improvement,
        socialCritique: (current.culture?.socialCritique || 50) + improvement
      },
      overall: {
        literaryMerit: 75,
        nobelPotential: 70,
        publishingReady: 80
      }
    };
  }

  private detectCliches(text: string): string[] {
    const cliches = [
      'at the end of the day',
      'it is what it is',
      'think outside the box',
      'the bottom line',
      'crystal clear',
      'read between the lines',
      'the tip of the iceberg',
      'add insult to injury',
      'when all is said and done'
    ];

    return cliches.filter(c => text.toLowerCase().includes(c));
  }

  private calculateVariance(numbers: number[]): number {
    if (numbers.length < 2) return 0;
    const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
    const squaredDiffs = numbers.map(n => Math.pow(n - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / numbers.length;
  }

  private countUniqueWords(text: string): number {
    const words = text.toLowerCase().match(/\b[a-z]+\b/g) || [];
    return new Set(words).size;
  }

  private detectUnusualPhrases(text: string): number {
    // Simplified detection - counts adjective-noun pairs that are uncommon
    let count = 0;
    const patterns = [
      /\b(liquid|velvet|crystalline|fractured|hollow)\s+(silence|time|memory|light|darkness)\b/gi,
      /\b(ancient|forgotten|impossible|infinite)\s+(geometry|architecture|mathematics)\b/gi
    ];

    for (const pattern of patterns) {
      const matches = text.match(pattern) || [];
      count += matches.length;
    }

    return count;
  }

  private detectRareVocabulary(text: string): number {
    const rareWords = [
      'gossamer', 'ephemeral', 'liminal', 'palimpsest', 'penumbra',
      'susurrus', 'crepuscular', 'ineffable', 'numinous', 'lacuna'
    ];

    let count = 0;
    const lowerText = text.toLowerCase();

    for (const word of rareWords) {
      if (lowerText.includes(word)) count++;
    }

    return count;
  }

  // ============================================================================
  // Public Integration Methods
  // ============================================================================

  /**
   * Get quality assessment summary
   */
  getQualitySummary(metrics: NobelQualityMetrics): string {
    const tier = metrics.overall.nobelPotential >= this.QUALITY_THRESHOLDS.nobelPotential ? 'Nobel Potential' :
                 metrics.overall.nobelPotential >= this.QUALITY_THRESHOLDS.prizeWorthy ? 'Prize-Worthy' :
                 metrics.overall.nobelPotential >= this.QUALITY_THRESHOLDS.literary ? 'Literary Quality' :
                 metrics.overall.nobelPotential >= this.QUALITY_THRESHOLDS.commercial ? 'Commercial Ready' :
                 'Needs Development';

    return `
## Quality Assessment: ${tier}

### Creativity (${Math.round((metrics.creativity.conceptualOriginality + metrics.creativity.defamiliarizationPower + metrics.creativity.narrativeInnovation) / 3)}/100)
- Conceptual Originality: ${metrics.creativity.conceptualOriginality}
- Defamiliarization: ${metrics.creativity.defamiliarizationPower}
- Narrative Innovation: ${metrics.creativity.narrativeInnovation}

### Philosophy (${Math.round((metrics.philosophy.existentialDepth + metrics.philosophy.thematicComplexity + metrics.philosophy.intellectualHonesty) / 3)}/100)
- Existential Depth: ${metrics.philosophy.existentialDepth}
- Thematic Complexity: ${metrics.philosophy.thematicComplexity}
- Intellectual Honesty: ${metrics.philosophy.intellectualHonesty}

### Language (${Math.round((metrics.language.proseMastery + metrics.language.voiceDistinctiveness + metrics.language.innovativeExpression) / 3)}/100)
- Prose Mastery: ${metrics.language.proseMastery}
- Voice Distinctiveness: ${metrics.language.voiceDistinctiveness}
- Innovative Expression: ${metrics.language.innovativeExpression}

### Culture (${Math.round((metrics.culture.zeitgeistCapture + metrics.culture.universalResonance + metrics.culture.socialCritique) / 3)}/100)
- Zeitgeist Capture: ${metrics.culture.zeitgeistCapture}
- Universal Resonance: ${metrics.culture.universalResonance}
- Social Critique: ${metrics.culture.socialCritique}

### Overall
- **Literary Merit**: ${metrics.overall.literaryMerit}/100
- **Nobel Potential**: ${metrics.overall.nobelPotential}/100
- **Publishing Ready**: ${metrics.overall.publishingReady}/100
    `.trim();
  }

  /**
   * Get the base engine for standard operations
   */
  getBaseEngine(): AILiteratureEngine {
    return this.baseEngine;
  }

  /**
   * Get individual engines for specialized use
   */
  getEngines() {
    return {
      creativity: this.creativityEngine,
      philosophy: this.philosophyEngine,
      linguistic: this.linguisticEngine,
      cultural: this.culturalEngine,
      base: this.baseEngine,
      validator: this.validator
    };
  }
}

// ============================================================================
// Export singleton instance
// ============================================================================

export const nobelEngine = new NobelLiteratureEngine();

// Default export
export default NobelLiteratureEngine;
