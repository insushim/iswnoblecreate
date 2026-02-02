/**
 * Creativity Engine - Beyond Pattern Recognition
 *
 * Nobel-grade creative generation through:
 * - Conceptual blending (Fauconnier & Turner's theory)
 * - Defamiliarization (Shklovsky's ostranenie)
 * - Unexpected juxtaposition
 * - Metaphor generation from first principles
 * - Breaking narrative conventions purposefully
 */

export interface ConceptualSpace {
  domain: string;
  elements: string[];
  relations: string[];
  properties: string[];
  emotions: string[];
  sensoryDetails: string[];
}

export interface ConceptualBlend {
  inputSpace1: ConceptualSpace;
  inputSpace2: ConceptualSpace;
  genericSpace: string[]; // Shared abstract structure
  blendedSpace: BlendedConcept;
  emergentMeaning: string;
  noveltyScore: number;
}

export interface BlendedConcept {
  newConcept: string;
  inheritedFrom1: string[];
  inheritedFrom2: string[];
  emergentProperties: string[];
  metaphoricalMappings: Map<string, string>;
}

export interface DefamiliarizationTechnique {
  name: string;
  description: string;
  method: 'perspective_shift' | 'slow_motion' | 'alien_view' | 'child_view' | 'object_consciousness' | 'reverse_causality' | 'time_distortion';
  example: string;
  applicationGuide: string;
}

export interface NarrativeSubversion {
  convention: string;
  subversion: string;
  purpose: string;
  risk: string;
  literaryPrecedent: string;
}

export interface CreativePromptEnhancement {
  originalIntent: string;
  defamiliarizationLayer: string;
  conceptualBlend: string;
  unexpectedElement: string;
  philosophicalUndercurrent: string;
  sensoryInnovation: string;
  finalPrompt: string;
}

// Conceptual spaces for blending
const CONCEPTUAL_DOMAINS: Record<string, ConceptualSpace> = {
  death: {
    domain: 'death',
    elements: ['ending', 'silence', 'stillness', 'departure', 'absence', 'void'],
    relations: ['precedes life renewal', 'separates', 'transforms', 'equalizes'],
    properties: ['inevitable', 'mysterious', 'final', 'universal', 'transitional'],
    emotions: ['grief', 'fear', 'acceptance', 'liberation', 'longing'],
    sensoryDetails: ['cold', 'weight', 'darkness', 'echo', 'emptiness']
  },
  time: {
    domain: 'time',
    elements: ['moment', 'eternity', 'memory', 'anticipation', 'cycle', 'flow'],
    relations: ['passes', 'accumulates', 'erases', 'preserves', 'distorts'],
    properties: ['relentless', 'subjective', 'irreversible', 'layered', 'elastic'],
    emotions: ['nostalgia', 'anxiety', 'wonder', 'regret', 'hope'],
    sensoryDetails: ['ticking', 'fading', 'weathering', 'rhythm', 'dust']
  },
  water: {
    domain: 'water',
    elements: ['ocean', 'river', 'rain', 'tears', 'blood', 'ink'],
    relations: ['flows', 'reflects', 'drowns', 'cleanses', 'connects'],
    properties: ['formless', 'powerful', 'essential', 'transparent', 'deep'],
    emotions: ['calm', 'terror', 'melancholy', 'rebirth', 'vastness'],
    sensoryDetails: ['cold', 'wet', 'sound of waves', 'salt', 'weight']
  },
  memory: {
    domain: 'memory',
    elements: ['image', 'scent', 'voice', 'place', 'face', 'sensation'],
    relations: ['preserves', 'distorts', 'haunts', 'comforts', 'betrays'],
    properties: ['fragile', 'persistent', 'selective', 'reconstructive', 'embodied'],
    emotions: ['longing', 'warmth', 'pain', 'confusion', 'identity'],
    sensoryDetails: ['faded colors', 'echoes', 'phantom touch', 'familiar smell']
  },
  light: {
    domain: 'light',
    elements: ['sun', 'shadow', 'dawn', 'fire', 'star', 'reflection'],
    relations: ['reveals', 'blinds', 'warms', 'guides', 'deceives'],
    properties: ['ephemeral', 'essential', 'dual', 'sacred', 'scientific'],
    emotions: ['hope', 'exposure', 'enlightenment', 'loneliness', 'truth'],
    sensoryDetails: ['warmth', 'glare', 'gold', 'dancing particles', 'sharp edges']
  },
  language: {
    domain: 'language',
    elements: ['word', 'silence', 'name', 'story', 'lie', 'prayer'],
    relations: ['creates', 'destroys', 'connects', 'isolates', 'transforms'],
    properties: ['arbitrary', 'powerful', 'insufficient', 'magical', 'inherited'],
    emotions: ['frustration', 'communion', 'alienation', 'power', 'loss'],
    sensoryDetails: ['sound', 'rhythm', 'taste of words', 'weight of meaning']
  },
  body: {
    domain: 'body',
    elements: ['skin', 'bone', 'breath', 'wound', 'hand', 'eye'],
    relations: ['contains', 'betrays', 'remembers', 'ages', 'desires'],
    properties: ['mortal', 'sensate', 'boundary', 'inherited', 'political'],
    emotions: ['shame', 'pleasure', 'vulnerability', 'power', 'alienation'],
    sensoryDetails: ['pulse', 'heat', 'texture', 'weight', 'boundary']
  },
  home: {
    domain: 'home',
    elements: ['door', 'window', 'table', 'bed', 'wall', 'roof'],
    relations: ['shelters', 'traps', 'defines', 'excludes', 'remembers'],
    properties: ['constructed', 'psychological', 'contested', 'nostalgic', 'political'],
    emotions: ['belonging', 'exile', 'safety', 'claustrophobia', 'longing'],
    sensoryDetails: ['familiar smell', 'creaking', 'light through window', 'temperature']
  }
};

// Defamiliarization techniques from Russian Formalism and beyond
const DEFAMILIARIZATION_TECHNIQUES: DefamiliarizationTechnique[] = [
  {
    name: 'Tolstoyan Estrangement',
    description: 'Describe familiar things as if seen for the first time, without naming them directly',
    method: 'alien_view',
    example: 'Tolstoy describing an opera from the perspective of Natasha who has never seen one',
    applicationGuide: 'Remove all conventional labels. Describe only what the senses perceive. Let the reader rediscover the familiar.'
  },
  {
    name: 'Kafka Perspective',
    description: 'Present absurd situations with complete matter-of-factness',
    method: 'perspective_shift',
    example: 'Gregor Samsa waking as a bug, worrying about missing his train',
    applicationGuide: 'The impossible should be treated as mundane. Focus on practical consequences of the metaphysical.'
  },
  {
    name: 'Proustian Dilation',
    description: 'Expand a single moment to contain entire worlds of association',
    method: 'slow_motion',
    example: 'The madeleine moment expanding into volumes of recovered time',
    applicationGuide: 'One sensory trigger. Let it open doors. Follow each corridor. Return transformed.'
  },
  {
    name: 'Child Consciousness',
    description: 'Filter reality through a consciousness that lacks adult categories',
    method: 'child_view',
    example: 'Faulkner\'s Benjy in Sound and Fury, perceiving without understanding',
    applicationGuide: 'Remove cause-effect logic. Privilege sensation over interpretation. Let patterns emerge without explanation.'
  },
  {
    name: 'Object Consciousness',
    description: 'Give voice or perspective to inanimate objects',
    method: 'object_consciousness',
    example: 'A door that has witnessed generations, a letter that waits to be read',
    applicationGuide: 'What does permanence see that mortality misses? What patience do objects have?'
  },
  {
    name: 'Reverse Causality',
    description: 'Present effects before causes, endings before beginnings',
    method: 'reverse_causality',
    example: 'Garcia Marquez: "Many years later, facing the firing squad..."',
    applicationGuide: 'Begin with the consequence. Let the reader hunger for the cause. Satisfy slowly.'
  },
  {
    name: 'Temporal Palimpsest',
    description: 'Layer multiple times onto a single moment or place',
    method: 'time_distortion',
    example: 'Woolf\'s layering of past and present in To the Lighthouse',
    applicationGuide: 'This room contains all its pasts. Let them bleed through. The present is thin.'
  }
];

// Narrative conventions to potentially subvert
const NARRATIVE_SUBVERSIONS: NarrativeSubversion[] = [
  {
    convention: 'Reliable narrator',
    subversion: 'Narrator who lies, forgets, or genuinely cannot perceive truth',
    purpose: 'Questions the nature of truth and storytelling itself',
    risk: 'Reader frustration if not handled with care',
    literaryPrecedent: 'Nabokov\'s Humbert Humbert, Ishiguro\'s Stevens'
  },
  {
    convention: 'Linear time',
    subversion: 'Circular, spiral, or shattered temporality',
    purpose: 'Reflects how memory and meaning actually work',
    risk: 'Confusion without emotional anchor',
    literaryPrecedent: 'Faulkner, Borges, Ondaatje'
  },
  {
    convention: 'Character consistency',
    subversion: 'Characters who genuinely change beyond recognition, or contain multitudes',
    purpose: 'Captures the fluidity of identity',
    risk: 'Loss of reader attachment',
    literaryPrecedent: 'Woolf\'s Orlando, Dostoevsky\'s underground man'
  },
  {
    convention: 'Resolution',
    subversion: 'Meaningful irresolution, questions that deepen rather than close',
    purpose: 'Literature as inquiry, not answer',
    risk: 'Feels incomplete to satisfaction-seeking readers',
    literaryPrecedent: 'Chekhov, Carver, much of modernism'
  },
  {
    convention: 'Single genre',
    subversion: 'Genre bleeding - tragedy becoming comedy, realism becoming magical',
    purpose: 'Reflects life\'s tonal complexity',
    risk: 'Tonal whiplash',
    literaryPrecedent: 'Shakespeare\'s problem plays, Garcia Marquez'
  },
  {
    convention: 'Human perspective only',
    subversion: 'Non-human, posthuman, or collective consciousness',
    purpose: 'Decenters anthropocentrism',
    risk: 'Alienating readers seeking human connection',
    literaryPrecedent: 'Woolf\'s Flush, some Coetzee'
  }
];

export class CreativityEngine {
  private blendHistory: ConceptualBlend[] = [];
  private usedTechniques: Set<string> = new Set();

  constructor() {
    this.reset();
  }

  reset(): void {
    this.blendHistory = [];
    this.usedTechniques.clear();
  }

  /**
   * Generate a novel conceptual blend from two domains
   */
  generateConceptualBlend(domain1: string, domain2: string): ConceptualBlend {
    const space1 = CONCEPTUAL_DOMAINS[domain1] || this.createCustomSpace(domain1);
    const space2 = CONCEPTUAL_DOMAINS[domain2] || this.createCustomSpace(domain2);

    // Find generic space (shared abstract structure)
    const genericSpace = this.findGenericSpace(space1, space2);

    // Create the blend
    const blendedSpace = this.createBlend(space1, space2, genericSpace);

    // Calculate novelty
    const noveltyScore = this.calculateNovelty(blendedSpace);

    const blend: ConceptualBlend = {
      inputSpace1: space1,
      inputSpace2: space2,
      genericSpace,
      blendedSpace,
      emergentMeaning: this.generateEmergentMeaning(blendedSpace),
      noveltyScore
    };

    this.blendHistory.push(blend);
    return blend;
  }

  private createCustomSpace(domain: string): ConceptualSpace {
    // Generate a space for domains not in our database
    return {
      domain,
      elements: [`core_${domain}`, `essence_${domain}`, `form_${domain}`],
      relations: ['transforms', 'connects', 'reveals'],
      properties: ['essential', 'complex', 'human'],
      emotions: ['wonder', 'recognition', 'unease'],
      sensoryDetails: ['texture', 'weight', 'presence']
    };
  }

  private findGenericSpace(space1: ConceptualSpace, space2: ConceptualSpace): string[] {
    const generic: string[] = [];

    // Find shared abstract properties
    const sharedProperties = space1.properties.filter(p =>
      space2.properties.some(p2 => this.areConceptuallySimilar(p, p2))
    );
    generic.push(...sharedProperties);

    // Find shared relational structures
    const sharedRelations = space1.relations.filter(r =>
      space2.relations.some(r2 => this.areConceptuallySimilar(r, r2))
    );
    generic.push(...sharedRelations);

    // Add abstract commonalities
    if (space1.emotions.some(e => space2.emotions.includes(e))) {
      generic.push('shared_emotional_resonance');
    }

    return generic;
  }

  private areConceptuallySimilar(concept1: string, concept2: string): boolean {
    // Simple similarity check - in production would use embeddings
    const abstractCategories: Record<string, string[]> = {
      'change': ['transforms', 'flows', 'ages', 'erases', 'distorts'],
      'connection': ['connects', 'relates', 'binds', 'links'],
      'boundary': ['separates', 'contains', 'defines', 'isolates'],
      'revelation': ['reveals', 'exposes', 'shows', 'illuminates'],
      'permanence': ['preserves', 'eternal', 'persistent', 'enduring']
    };

    for (const [_, members] of Object.entries(abstractCategories)) {
      if (members.includes(concept1) && members.includes(concept2)) {
        return true;
      }
    }
    return concept1 === concept2;
  }

  private createBlend(
    space1: ConceptualSpace,
    space2: ConceptualSpace,
    genericSpace: string[]
  ): BlendedConcept {
    // Select elements to inherit from each space
    const inherited1 = space1.elements.slice(0, 2);
    const inherited2 = space2.elements.slice(0, 2);

    // Create metaphorical mappings
    const mappings = new Map<string, string>();
    for (let i = 0; i < Math.min(space1.elements.length, space2.elements.length); i++) {
      mappings.set(space1.elements[i], space2.elements[i]);
    }

    // Generate emergent properties that exist only in the blend
    const emergent = this.generateEmergentProperties(space1, space2, genericSpace);

    // Create the new concept name
    const newConcept = this.generateBlendedConceptName(space1.domain, space2.domain);

    return {
      newConcept,
      inheritedFrom1: inherited1,
      inheritedFrom2: inherited2,
      emergentProperties: emergent,
      metaphoricalMappings: mappings
    };
  }

  private generateEmergentProperties(
    space1: ConceptualSpace,
    space2: ConceptualSpace,
    genericSpace: string[]
  ): string[] {
    const emergent: string[] = [];

    // Combine sensory details in unexpected ways
    if (space1.sensoryDetails.length > 0 && space2.sensoryDetails.length > 0) {
      emergent.push(`${space1.sensoryDetails[0]} of ${space2.domain}`);
      emergent.push(`${space2.sensoryDetails[0]} that ${space1.relations[0]}`);
    }

    // Create emotional paradoxes
    if (space1.emotions[0] !== space2.emotions[0]) {
      emergent.push(`${space1.emotions[0]} intertwined with ${space2.emotions[0]}`);
    }

    // Emergent from generic space
    for (const generic of genericSpace) {
      emergent.push(`${generic} manifested through ${space1.domain}-${space2.domain} fusion`);
    }

    return emergent;
  }

  private generateBlendedConceptName(domain1: string, domain2: string): string {
    const blendPatterns = [
      `${domain1}-${domain2}`,
      `the ${domain2} of ${domain1}`,
      `${domain1} as ${domain2}`,
      `where ${domain1} becomes ${domain2}`
    ];
    return blendPatterns[Math.floor(Math.random() * blendPatterns.length)];
  }

  private generateEmergentMeaning(blend: BlendedConcept): string {
    const mappingEntries = Array.from(blend.metaphoricalMappings.entries());
    const primaryMapping = mappingEntries[0];

    if (primaryMapping) {
      return `When ${primaryMapping[0]} is understood through ${primaryMapping[1]}, ` +
             `new properties emerge: ${blend.emergentProperties.slice(0, 2).join(', ')}. ` +
             `This reveals ${blend.newConcept} as a site of profound human meaning.`;
    }

    return `The blend ${blend.newConcept} creates meaning through unexpected juxtaposition.`;
  }

  private calculateNovelty(blend: BlendedConcept): number {
    let score = 50; // Base novelty

    // More emergent properties = more novel
    score += blend.emergentProperties.length * 10;

    // More mappings = richer blend
    score += blend.metaphoricalMappings.size * 5;

    // Check against history for uniqueness
    const similarBlends = this.blendHistory.filter(b =>
      b.blendedSpace.newConcept === blend.newConcept
    );
    score -= similarBlends.length * 20;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Apply defamiliarization to a scene or description
   */
  applyDefamiliarization(
    content: string,
    technique?: DefamiliarizationTechnique
  ): { transformed: string; techniqueUsed: DefamiliarizationTechnique; guidance: string } {
    // Select technique if not provided
    const selectedTechnique = technique || this.selectUnusedTechnique();
    this.usedTechniques.add(selectedTechnique.name);

    const guidance = this.generateDefamiliarizationGuidance(content, selectedTechnique);

    return {
      transformed: this.transformWithTechnique(content, selectedTechnique),
      techniqueUsed: selectedTechnique,
      guidance
    };
  }

  private selectUnusedTechnique(): DefamiliarizationTechnique {
    const unused = DEFAMILIARIZATION_TECHNIQUES.filter(t => !this.usedTechniques.has(t.name));
    if (unused.length === 0) {
      this.usedTechniques.clear();
      return DEFAMILIARIZATION_TECHNIQUES[0];
    }
    return unused[Math.floor(Math.random() * unused.length)];
  }

  private generateDefamiliarizationGuidance(
    content: string,
    technique: DefamiliarizationTechnique
  ): string {
    const guidanceTemplates: Record<string, string> = {
      'alien_view': `
        Rewrite this passage as if the observer has never encountered these objects or actions before.
        Do not use the common names for things. Describe only what would be perceived by senses.
        What is strange about ${content.split(' ').slice(0, 5).join(' ')}... when truly seen?
      `,
      'perspective_shift': `
        Take this familiar scene and present it from an impossible or unexpected perspective.
        What would a dying person notice? What would someone who has never felt love see?
        The absurd should feel inevitable.
      `,
      'slow_motion': `
        Dilate this moment. A second contains multitudes.
        What memories does this instant trigger? What sensations layer upon sensation?
        Follow each thread. Let time become elastic.
      `,
      'child_view': `
        Remove adult interpretation. A child sees but does not categorize.
        Colors are louder than words. Emotions are weather, not psychology.
        Logic is the adult's prison.
      `,
      'object_consciousness': `
        What would the objects in this scene say if they could speak?
        They have witnessed more than any character. They will remain when all leave.
        Give them voice, but not human voice.
      `,
      'reverse_causality': `
        Begin with the consequence. The bullet has already been fired.
        Now unspool time. Let the reader discover why.
        The ending is a door to the beginning.
      `,
      'time_distortion': `
        This moment contains all moments that happened here before.
        Layer them. Let the past bleed through.
        The present is a palimpsest.
      `
    };

    return guidanceTemplates[technique.method] || technique.applicationGuide;
  }

  private transformWithTechnique(content: string, technique: DefamiliarizationTechnique): string {
    // This returns guidance for transformation rather than actually transforming
    // The actual transformation would happen in the AI generation step
    return `[DEFAMILIARIZATION: ${technique.name}]\n\n` +
           `Original intent: ${content}\n\n` +
           `Transformation guidance: ${technique.applicationGuide}\n\n` +
           `Reference: ${technique.example}`;
  }

  /**
   * Suggest narrative subversions for a given story element
   */
  suggestSubversions(element: string): NarrativeSubversion[] {
    // Find relevant subversions based on the element
    const keywords: Record<string, string[]> = {
      'narrator': ['Reliable narrator'],
      'time': ['Linear time'],
      'character': ['Character consistency'],
      'ending': ['Resolution'],
      'genre': ['Single genre'],
      'perspective': ['Human perspective only']
    };

    const relevantSubversions: NarrativeSubversion[] = [];

    for (const [keyword, conventions] of Object.entries(keywords)) {
      if (element.toLowerCase().includes(keyword)) {
        const matching = NARRATIVE_SUBVERSIONS.filter(s =>
          conventions.includes(s.convention)
        );
        relevantSubversions.push(...matching);
      }
    }

    // If no specific match, return random selection for inspiration
    if (relevantSubversions.length === 0) {
      return NARRATIVE_SUBVERSIONS.slice(0, 3);
    }

    return relevantSubversions;
  }

  /**
   * Generate an enhanced creative prompt
   */
  enhancePrompt(originalIntent: string): CreativePromptEnhancement {
    // Get a conceptual blend
    const domains = Object.keys(CONCEPTUAL_DOMAINS);
    const domain1 = domains[Math.floor(Math.random() * domains.length)];
    let domain2 = domains[Math.floor(Math.random() * domains.length)];
    while (domain2 === domain1) {
      domain2 = domains[Math.floor(Math.random() * domains.length)];
    }
    const blend = this.generateConceptualBlend(domain1, domain2);

    // Get defamiliarization
    const defam = this.applyDefamiliarization(originalIntent);

    // Get possible subversion
    const subversions = this.suggestSubversions(originalIntent);
    const selectedSubversion = subversions[0];

    // Generate philosophical undercurrent
    const philosophicalQuestions = [
      'What does it mean to remember someone who has forgotten you?',
      'Can we ever truly know another consciousness?',
      'Is identity continuous or an illusion of continuity?',
      'What remains when everything that can be lost is lost?',
      'Does language create reality or merely fail to capture it?',
      'What would it mean to be free of the self?',
      'How do we live knowing we will die?',
      'Is love a discovery or a creation?'
    ];
    const philosophicalUndercurrent = philosophicalQuestions[
      Math.floor(Math.random() * philosophicalQuestions.length)
    ];

    // Generate sensory innovation
    const sensoryInnovations = [
      'Describe sound through the vocabulary of touch',
      'Let colors have emotional temperatures',
      'Give smells narrative weight - what stories do scents tell?',
      'Describe time through physical sensation',
      'Let silence have texture'
    ];
    const sensoryInnovation = sensoryInnovations[
      Math.floor(Math.random() * sensoryInnovations.length)
    ];

    // Construct the enhanced prompt
    const finalPrompt = this.constructEnhancedPrompt(
      originalIntent,
      blend,
      defam,
      selectedSubversion,
      philosophicalUndercurrent,
      sensoryInnovation
    );

    return {
      originalIntent,
      defamiliarizationLayer: defam.guidance,
      conceptualBlend: blend.emergentMeaning,
      unexpectedElement: selectedSubversion?.subversion || 'None applied',
      philosophicalUndercurrent,
      sensoryInnovation,
      finalPrompt
    };
  }

  private constructEnhancedPrompt(
    original: string,
    blend: ConceptualBlend,
    defam: { transformed: string; techniqueUsed: DefamiliarizationTechnique; guidance: string },
    subversion: NarrativeSubversion | undefined,
    philosophical: string,
    sensory: string
  ): string {
    return `
=== NOBEL-GRADE CREATIVE GENERATION ===

ORIGINAL INTENT: ${original}

CONCEPTUAL ENRICHMENT:
${blend.emergentMeaning}
- Draw from: ${blend.inputSpace1.domain} and ${blend.inputSpace2.domain}
- Emergent properties to explore: ${blend.blendedSpace.emergentProperties.join(', ')}

DEFAMILIARIZATION (${defam.techniqueUsed.name}):
${defam.guidance}
Reference: "${defam.techniqueUsed.example}"

${subversion ? `NARRATIVE SUBVERSION:
Consider: ${subversion.subversion}
Purpose: ${subversion.purpose}
Precedent: ${subversion.literaryPrecedent}
` : ''}

PHILOSOPHICAL UNDERCURRENT:
Let this question haunt the subtext: "${philosophical}"
Do not answer it. Let it resonate.

SENSORY INNOVATION:
${sensory}

EXECUTION PRINCIPLES:
1. Every sentence should earn its place
2. Prefer the specific over the general
3. Let meaning emerge from juxtaposition
4. Trust the reader's intelligence
5. The unsaid is as important as the said
6. Rhythm matters - vary sentence length for music
7. End on resonance, not resolution

Write now with the ambition of literature that changes how we see.
    `.trim();
  }

  /**
   * Get available conceptual domains for blending
   */
  getAvailableDomains(): string[] {
    return Object.keys(CONCEPTUAL_DOMAINS);
  }

  /**
   * Get all defamiliarization techniques
   */
  getDefamiliarizationTechniques(): DefamiliarizationTechnique[] {
    return DEFAMILIARIZATION_TECHNIQUES;
  }

  /**
   * Get all narrative subversions
   */
  getNarrativeSubversions(): NarrativeSubversion[] {
    return NARRATIVE_SUBVERSIONS;
  }

  /**
   * Analyze text for creative potential and suggest enhancements
   */
  analyzeCreativePotential(text: string): {
    currentApproach: string[];
    missedOpportunities: string[];
    suggestions: string[];
    score: number;
  } {
    const currentApproach: string[] = [];
    const missedOpportunities: string[] = [];
    const suggestions: string[] = [];
    let score = 50;

    // Check for defamiliarization
    const hasDefamiliarization = this.detectDefamiliarization(text);
    if (hasDefamiliarization) {
      currentApproach.push('Some defamiliarization present');
      score += 10;
    } else {
      missedOpportunities.push('No defamiliarization detected - familiar descriptions dominate');
      suggestions.push('Apply Tolstoyan estrangement: describe familiar things as if never seen before');
    }

    // Check for conceptual blending
    const hasBlending = this.detectConceptualBlending(text);
    if (hasBlending) {
      currentApproach.push('Conceptual blending/metaphor present');
      score += 15;
    } else {
      missedOpportunities.push('Metaphors are conventional or absent');
      suggestions.push('Create unexpected conceptual blends - what would memory taste like? How does time have texture?');
    }

    // Check for narrative innovation
    const hasNarrativeInnovation = this.detectNarrativeInnovation(text);
    if (hasNarrativeInnovation) {
      currentApproach.push('Some narrative innovation');
      score += 10;
    } else {
      missedOpportunities.push('Narrative follows conventional patterns');
      suggestions.push('Consider: unreliable narrator, non-linear time, or perspective shifts');
    }

    // Check sentence variety and rhythm
    const rhythmScore = this.analyzeRhythm(text);
    score += rhythmScore;
    if (rhythmScore < 10) {
      missedOpportunities.push('Sentence rhythm is monotonous');
      suggestions.push('Vary sentence length dramatically - short punches between long flowing passages');
    } else {
      currentApproach.push('Good rhythmic variety');
    }

    // Check for sensory specificity
    const sensoryScore = this.analyzeSensoryDetail(text);
    score += sensoryScore;
    if (sensoryScore < 10) {
      missedOpportunities.push('Sensory details are generic or absent');
      suggestions.push('Ground abstractions in specific sensory experience - what does grief smell like?');
    } else {
      currentApproach.push('Rich sensory detail');
    }

    return {
      currentApproach,
      missedOpportunities,
      suggestions,
      score: Math.min(100, score)
    };
  }

  private detectDefamiliarization(text: string): boolean {
    const indicators = [
      /as if (seeing|hearing|feeling).*first time/i,
      /strange(ly)? familiar/i,
      /what (was|is) (this|that) (thing|object|sound)/i,
      /without (name|word|label)/i
    ];
    return indicators.some(pattern => pattern.test(text));
  }

  private detectConceptualBlending(text: string): boolean {
    // Check for unexpected metaphor structures
    const metaphorPatterns = [
      /the (memory|time|silence|grief|joy) of/i,
      /tasted like/i,
      /sounded like.*felt like/i,
      /where .* becomes/i
    ];
    return metaphorPatterns.some(pattern => pattern.test(text));
  }

  private detectNarrativeInnovation(text: string): boolean {
    const innovationMarkers = [
      /years later.*would remember/i, // Reverse causality
      /but (I|he|she|they) (lied|was wrong|couldn't know)/i, // Unreliable narrator
      /at the same moment.*years (before|ago)/i, // Temporal layering
    ];
    return innovationMarkers.some(pattern => pattern.test(text));
  }

  private analyzeRhythm(text: string): number {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim());
    if (sentences.length < 3) return 5;

    const lengths = sentences.map(s => s.split(/\s+/).length);
    const variance = this.calculateVariance(lengths);

    if (variance > 100) return 15; // High variety
    if (variance > 50) return 10;
    if (variance > 20) return 5;
    return 0;
  }

  private calculateVariance(numbers: number[]): number {
    const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
    return numbers.reduce((sum, n) => sum + Math.pow(n - mean, 2), 0) / numbers.length;
  }

  private analyzeSensoryDetail(text: string): number {
    const sensoryWords = [
      // Touch
      'rough', 'smooth', 'cold', 'warm', 'sharp', 'soft', 'weight', 'pressure',
      // Smell
      'scent', 'smell', 'fragrance', 'stench', 'aroma', 'odor',
      // Taste
      'bitter', 'sweet', 'sour', 'metallic', 'salt',
      // Sound
      'whisper', 'echo', 'silence', 'hum', 'crack', 'rustle',
      // Sight (specific)
      'shadow', 'glint', 'flicker', 'pale', 'vivid'
    ];

    const lowerText = text.toLowerCase();
    const sensoryCount = sensoryWords.filter(word => lowerText.includes(word)).length;

    if (sensoryCount > 10) return 15;
    if (sensoryCount > 5) return 10;
    if (sensoryCount > 2) return 5;
    return 0;
  }
}

// Export singleton
export const creativityEngine = new CreativityEngine();
