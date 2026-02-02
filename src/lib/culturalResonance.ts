/**
 * Cultural Resonance Engine - Zeitgeist and Universal Themes
 *
 * Nobel literature captures something true about its historical moment
 * while speaking to timeless human concerns:
 * - Historical consciousness
 * - Social critique
 * - Cultural memory
 * - Universal human experiences across cultures
 * - The tension between individual and collective
 */

export interface HistoricalMoment {
  era: string;
  period: string;
  keyEvents: string[];
  dominantAnxieties: string[];
  emergingHopes: string[];
  culturalShifts: string[];
  literaryResponses: LiteraryResponse[];
}

export interface LiteraryResponse {
  work: string;
  author: string;
  howItCapturedMoment: string;
  whyItEndured: string;
}

export interface UniversalExperience {
  name: string;
  description: string;
  culturalVariations: CulturalVariation[];
  timelessCore: string;
  literaryTreatments: string[];
}

export interface CulturalVariation {
  culture: string;
  expression: string;
  uniqueAspect: string;
}

export interface SocialCritique {
  target: string;
  method: 'direct' | 'allegorical' | 'satirical' | 'tragic' | 'through_absence';
  tone: string;
  examples: CritiqueExample[];
  risks: string[];
}

export interface CritiqueExample {
  work: string;
  author: string;
  approach: string;
  impact: string;
}

export interface CollectiveMemory {
  event: string;
  howRemembered: string[];
  whoRemembers: string;
  whoForgets: string;
  literaryFunction: string;
}

export interface CulturalTension {
  tension: string;
  pole1: string;
  pole2: string;
  currentManifestations: string[];
  literaryPotential: string;
}

// Historical moments and their literary capture
const HISTORICAL_MOMENTS: Record<string, HistoricalMoment> = {
  postwar_disillusionment: {
    era: '20th Century',
    period: 'Post-WWI (1918-1930s)',
    keyEvents: ['World War I', 'Spanish Flu', 'Rise of fascism', 'Great Depression'],
    dominantAnxieties: [
      'Collapse of meaning systems',
      'Technology as destroyer',
      'Death of progress narrative',
      'Mass death normalized'
    ],
    emergingHopes: [
      'New art forms',
      'Internationalism',
      'Psychological understanding',
      'Rejection of old certainties'
    ],
    culturalShifts: [
      'Modernism in arts',
      'Questioning of authority',
      'Stream of consciousness',
      'Fragmentation as form'
    ],
    literaryResponses: [
      {
        work: 'The Waste Land',
        author: 'T.S. Eliot',
        howItCapturedMoment: 'Fragmented form mirrored fragmented civilization',
        whyItEndured: 'Made new meaning from ruins - showed how to build from rubble'
      },
      {
        work: 'Mrs Dalloway',
        author: 'Virginia Woolf',
        howItCapturedMoment: 'Shell-shock and society, trauma beneath surface',
        whyItEndured: 'Consciousness as refuge and prison'
      }
    ]
  },

  cold_war_anxiety: {
    era: '20th Century',
    period: 'Cold War (1947-1991)',
    keyEvents: ['Nuclear threat', 'Ideological division', 'Space race', 'Decolonization'],
    dominantAnxieties: [
      'Nuclear annihilation',
      'Surveillance state',
      'Loss of individual agency',
      'Ideological capture'
    ],
    emergingHopes: [
      'Civil rights',
      'Technological utopia',
      'Youth culture',
      'Globalization'
    ],
    culturalShifts: [
      'Absurdism',
      'Postmodernism begins',
      'Counter-culture',
      'Media society'
    ],
    literaryResponses: [
      {
        work: '1984',
        author: 'George Orwell',
        howItCapturedMoment: 'Totalitarian logic taken to conclusion',
        whyItEndured: 'Every generation sees its relevance'
      },
      {
        work: 'One Hundred Years of Solitude',
        author: 'Gabriel Garcia Marquez',
        howItCapturedMoment: 'Colonial legacy, cyclical history, magic as resistance',
        whyItEndured: 'Made Latin American experience universal'
      }
    ]
  },

  digital_age: {
    era: '21st Century',
    period: 'Digital Age (1990s-present)',
    keyEvents: ['Internet revolution', 'Social media', 'Climate crisis awareness', 'Global pandemic'],
    dominantAnxieties: [
      'Information overload',
      'Authenticity crisis',
      'Climate despair',
      'Algorithmic control',
      'Loneliness epidemic',
      'Post-truth'
    ],
    emergingHopes: [
      'Global connection',
      'Democratized voice',
      'New forms of community',
      'Activism at scale'
    ],
    culturalShifts: [
      'Attention economy',
      'Identity fluidity',
      'Collapse of privacy',
      'Virtual reality'
    ],
    literaryResponses: [
      {
        work: 'The Circle',
        author: 'Dave Eggers',
        howItCapturedMoment: 'Surveillance capitalism as utopia/dystopia',
        whyItEndured: 'Prescient about tech company power'
      },
      {
        work: 'Weather',
        author: 'Jenny Offill',
        howItCapturedMoment: 'Climate anxiety as ambient dread',
        whyItEndured: 'Made diffuse anxiety speakable'
      }
    ]
  },

  ai_emergence: {
    era: '21st Century',
    period: 'AI Emergence (2020s-)',
    keyEvents: ['GPT breakthrough', 'AI art generation', 'Automation acceleration', 'Questions of consciousness'],
    dominantAnxieties: [
      'Obsolescence of human labor',
      'Loss of authenticity',
      'Unknowable intelligence',
      'Erosion of human uniqueness',
      'Deepfakes and truth',
      'AI-human relationships'
    ],
    emergingHopes: [
      'Augmented creativity',
      'Solving intractable problems',
      'New forms of collaboration',
      'Expanded consciousness'
    ],
    culturalShifts: [
      'Questioning human exceptionalism',
      'New definitions of creativity',
      'Hybrid authorship',
      'Algorithmic aesthetics'
    ],
    literaryResponses: [
      {
        work: 'Klara and the Sun',
        author: 'Kazuo Ishiguro',
        howItCapturedMoment: 'AI perspective on human love and mortality',
        whyItEndured: 'Found humanity through non-human eyes'
      }
    ]
  }
};

// Universal human experiences across cultures
const UNIVERSAL_EXPERIENCES: UniversalExperience[] = [
  {
    name: 'Grief',
    description: 'The experience of loss and the process of mourning',
    culturalVariations: [
      { culture: 'Western', expression: 'Stages model, individual processing', uniqueAspect: 'Grief as private journey' },
      { culture: 'East Asian', expression: 'Ancestor reverence, continuing bonds', uniqueAspect: 'Dead remain present' },
      { culture: 'African traditions', expression: 'Communal mourning, celebration of life', uniqueAspect: 'Collective processing' },
      { culture: 'Latin American', expression: 'Dia de los Muertos, death as companion', uniqueAspect: 'Death not opposite of life' }
    ],
    timelessCore: 'The hole left by absence, the impossible task of continuing',
    literaryTreatments: ['The Year of Magical Thinking', 'A Grief Observed', 'H is for Hawk', 'The Friend']
  },
  {
    name: 'Coming of Age',
    description: 'The transition from childhood to adulthood, loss of innocence',
    culturalVariations: [
      { culture: 'Western', expression: 'Individual journey, rebellion', uniqueAspect: 'Self-discovery narrative' },
      { culture: 'Indigenous', expression: 'Ritual initiation, community role', uniqueAspect: 'Becoming part of whole' },
      { culture: 'South Asian', expression: 'Family duty meets individual desire', uniqueAspect: 'Collective vs personal identity' }
    ],
    timelessCore: 'The moment you realize the world is not what you were told',
    literaryTreatments: ['Catcher in the Rye', 'To Kill a Mockingbird', 'Never Let Me Go', 'The House on Mango Street']
  },
  {
    name: 'Love',
    description: 'The connection between beings, in all its forms',
    culturalVariations: [
      { culture: 'Western romantic', expression: 'Soul mates, individual completion', uniqueAspect: 'Two become one narrative' },
      { culture: 'Arranged marriage cultures', expression: 'Love grows through duty', uniqueAspect: 'Commitment precedes feeling' },
      { culture: 'Ancient Greek', expression: 'Multiple types: eros, philia, agape, storge', uniqueAspect: 'Differentiated love vocabulary' }
    ],
    timelessCore: 'The recognition of another consciousness as real as your own',
    literaryTreatments: ['Anna Karenina', 'Love in the Time of Cholera', 'Normal People', 'Giovanni\'s Room']
  },
  {
    name: 'Exile',
    description: 'Displacement from home, identity between worlds',
    culturalVariations: [
      { culture: 'Jewish diaspora', expression: 'Next year in Jerusalem, portable homeland', uniqueAspect: 'Home as text and memory' },
      { culture: 'Postcolonial', expression: 'Between colonizer language and mother tongue', uniqueAspect: 'Hybrid identity' },
      { culture: 'Refugee experience', expression: 'Forced displacement, bureaucratic limbo', uniqueAspect: 'Home as impossible return' }
    ],
    timelessCore: 'Not belonging anywhere, belonging nowhere fully',
    literaryTreatments: ['Exit West', 'The Namesake', 'Beloved', 'The Reader']
  },
  {
    name: 'Shame',
    description: 'The experience of being seen as flawed, unworthy',
    culturalVariations: [
      { culture: 'Western', expression: 'Individual failing, therapy culture', uniqueAspect: 'Shame as something to heal' },
      { culture: 'Honor cultures', expression: 'Family/community honor, public face', uniqueAspect: 'Shame as social death' },
      { culture: 'Religious', expression: 'Sin, fall, redemption arc', uniqueAspect: 'Shame as spiritual condition' }
    ],
    timelessCore: 'The desire to disappear when truly seen',
    literaryTreatments: ['Crime and Punishment', 'The Scarlet Letter', 'Disgrace', 'Atonement']
  },
  {
    name: 'Injustice',
    description: 'The experience of unfair treatment, structural violence',
    culturalVariations: [
      { culture: 'American', expression: 'Rights discourse, legal remedy', uniqueAspect: 'Justice as individual rights' },
      { culture: 'Marxist', expression: 'Class struggle, systemic analysis', uniqueAspect: 'Justice as collective liberation' },
      { culture: 'Religious', expression: 'Divine justice, karma, afterlife balance', uniqueAspect: 'Ultimate justice beyond this world' }
    ],
    timelessCore: 'The outrage when the world does not match what should be',
    literaryTreatments: ['Native Son', 'The Grapes of Wrath', 'Things Fall Apart', 'The Trial']
  }
];

// Methods of social critique in literature
const SOCIAL_CRITIQUES: SocialCritique[] = [
  {
    target: 'Class inequality',
    method: 'tragic',
    tone: 'Compassionate but unflinching',
    examples: [
      {
        work: 'The Grapes of Wrath',
        author: 'Steinbeck',
        approach: 'Following one family through systemic destruction',
        impact: 'Made invisible suffering visible'
      }
    ],
    risks: ['Poverty porn', 'Sentimentality', 'Speaking for instead of with']
  },
  {
    target: 'Totalitarianism',
    method: 'allegorical',
    tone: 'Chilling through restraint',
    examples: [
      {
        work: 'The Master and Margarita',
        author: 'Bulgakov',
        approach: 'Satan as truth-teller in a lying society',
        impact: 'Critique through absurdist comedy'
      }
    ],
    risks: ['Too obvious', 'Preaching', 'Losing the human story']
  },
  {
    target: 'Colonialism',
    method: 'through_absence',
    tone: 'What is not said speaks loudest',
    examples: [
      {
        work: 'Heart of Darkness / Achebe\'s response',
        author: 'Conrad/Achebe',
        approach: 'Showing what colonial narrative excludes',
        impact: 'Changed how we read colonial literature'
      }
    ],
    risks: ['Centering the wrong perspective', 'Exoticizing']
  },
  {
    target: 'Patriarchy',
    method: 'direct',
    tone: 'Anger channeled into precision',
    examples: [
      {
        work: 'The Handmaid\'s Tale',
        author: 'Atwood',
        approach: 'Extrapolating current trends to logical conclusion',
        impact: 'Made the invisible visible'
      }
    ],
    risks: ['Alienating readers', 'Didacticism']
  },
  {
    target: 'Technology/Modernity',
    method: 'satirical',
    tone: 'Dark comedy',
    examples: [
      {
        work: 'White Noise',
        author: 'DeLillo',
        approach: 'Absurdity of consumer death-denial culture',
        impact: 'Named something we couldn\'t articulate'
      }
    ],
    risks: ['Seeming out of touch', 'Elitism']
  }
];

// Contemporary cultural tensions
const CULTURAL_TENSIONS: CulturalTension[] = [
  {
    tension: 'Individual vs Collective',
    pole1: 'Personal freedom, self-expression, privacy',
    pole2: 'Social responsibility, community, belonging',
    currentManifestations: [
      'Vaccine debates',
      'Social media self-presentation',
      'Cancel culture',
      'Climate action'
    ],
    literaryPotential: 'Character torn between authentic self and community belonging'
  },
  {
    tension: 'Global vs Local',
    pole1: 'Universal values, global citizenship, connection',
    pole2: 'Local identity, tradition, rootedness',
    currentManifestations: [
      'Immigration debates',
      'Cultural homogenization fears',
      'Climate as global problem',
      'Supply chain awareness'
    ],
    literaryPotential: 'Character navigating between inherited and chosen identity'
  },
  {
    tension: 'Human vs Machine',
    pole1: 'Human uniqueness, consciousness, creativity',
    pole2: 'AI capability, efficiency, augmentation',
    currentManifestations: [
      'AI art controversy',
      'Job automation',
      'Algorithmic decision-making',
      'Human-AI relationships'
    ],
    literaryPotential: 'What remains essentially human when machines can do everything?'
  },
  {
    tension: 'Truth vs Narrative',
    pole1: 'Objective facts, science, expertise',
    pole2: 'Lived experience, perspective, storytelling',
    currentManifestations: [
      'Post-truth politics',
      'Misinformation',
      'Whose history gets told',
      'Scientific consensus vs skepticism'
    ],
    literaryPotential: 'Unreliable narrator in age of unreliable everything'
  },
  {
    tension: 'Progress vs Preservation',
    pole1: 'Innovation, change, improvement',
    pole2: 'Tradition, stability, conservation',
    currentManifestations: [
      'Climate change action',
      'Cultural heritage',
      'Technological disruption',
      'Urban development'
    ],
    literaryPotential: 'Character who must destroy something to save something else'
  },
  {
    tension: 'Connection vs Isolation',
    pole1: 'Always connected, never alone, visible',
    pole2: 'Solitude, privacy, interiority',
    currentManifestations: [
      'Social media ubiquity',
      'Loneliness epidemic',
      'Remote work',
      'Mental health crisis'
    ],
    literaryPotential: 'Character surrounded by people but profoundly alone'
  }
];

export class CulturalResonanceEngine {
  private currentContext: HistoricalMoment | null = null;
  private selectedTensions: CulturalTension[] = [];

  constructor() {}

  /**
   * Get all historical moments
   */
  getHistoricalMoments(): HistoricalMoment[] {
    return Object.values(HISTORICAL_MOMENTS);
  }

  /**
   * Get specific historical moment
   */
  getHistoricalMoment(key: string): HistoricalMoment | undefined {
    return HISTORICAL_MOMENTS[key];
  }

  /**
   * Get universal experiences
   */
  getUniversalExperiences(): UniversalExperience[] {
    return UNIVERSAL_EXPERIENCES;
  }

  /**
   * Get social critique methods
   */
  getSocialCritiques(): SocialCritique[] {
    return SOCIAL_CRITIQUES;
  }

  /**
   * Get cultural tensions
   */
  getCulturalTensions(): CulturalTension[] {
    return CULTURAL_TENSIONS;
  }

  /**
   * Set the historical/cultural context for a work
   */
  setContext(momentKey: string): void {
    this.currentContext = HISTORICAL_MOMENTS[momentKey] || null;
  }

  /**
   * Generate zeitgeist-aware guidance
   */
  generateZeitgeistGuidance(theme: string, setting: string): string {
    const context = this.currentContext || HISTORICAL_MOMENTS['digital_age'];
    const relevantTensions = CULTURAL_TENSIONS.filter(t =>
      theme.toLowerCase().includes(t.tension.toLowerCase().split(' ')[0]) ||
      t.currentManifestations.some(m => theme.toLowerCase().includes(m.toLowerCase().split(' ')[0]))
    );

    return `
=== CULTURAL RESONANCE GUIDANCE ===

HISTORICAL CONTEXT: ${context.period}
Era anxieties your work can speak to:
${context.dominantAnxieties.map(a => `- ${a}`).join('\n')}

Emerging hopes to engage with:
${context.emergingHopes.map(h => `- ${h}`).join('\n')}

CULTURAL TENSIONS TO EXPLORE:
${relevantTensions.length > 0
  ? relevantTensions.map(t => `
${t.tension}
- Current manifestations: ${t.currentManifestations.slice(0, 2).join(', ')}
- Literary potential: ${t.literaryPotential}`).join('\n')
  : CULTURAL_TENSIONS.slice(0, 2).map(t => `
${t.tension}
- Literary potential: ${t.literaryPotential}`).join('\n')
}

LITERARY PRECEDENTS:
${context.literaryResponses.map(r => `
"${r.work}" by ${r.author}
- How it captured its moment: ${r.howItCapturedMoment}
- Why it endured: ${r.whyItEndured}`).join('\n')}

HOW TO CAPTURE YOUR MOMENT:
1. Ground the timeless in the specific details of now
2. Let contemporary anxiety inform but not dominate
3. Find the universal through the particular
4. Trust readers to see relevance without spelling it out
5. The best social critique is embodied, not stated

AVOID:
- Direct contemporary references that will date quickly
- Lecturing about issues
- Using characters as mouthpieces
- Assuming your perspective is universal
    `.trim();
  }

  /**
   * Generate guidance for universal experience treatment
   */
  generateUniversalExperienceGuidance(experience: string): string {
    const exp = UNIVERSAL_EXPERIENCES.find(e =>
      e.name.toLowerCase() === experience.toLowerCase()
    );

    if (!exp) {
      return `Experience "${experience}" not found in database. Consider how it manifests across cultures and what its timeless core might be.`;
    }

    return `
=== UNIVERSAL EXPERIENCE: ${exp.name.toUpperCase()} ===

${exp.description}

TIMELESS CORE:
"${exp.timelessCore}"
- This is what your treatment must touch, regardless of specific cultural expression

CULTURAL VARIATIONS:
${exp.culturalVariations.map(v => `
${v.culture}:
- Expression: ${v.expression}
- Unique aspect: ${v.uniqueAspect}`).join('\n')}

LITERARY TREATMENTS TO STUDY:
${exp.literaryTreatments.join(', ')}

GUIDANCE:
1. Root in specific cultural context but gesture toward universal
2. Honor particularity - don't flatten difference
3. Physical, sensory details make emotion real
4. The body knows ${exp.name.toLowerCase()} before the mind names it
5. What is unsayable about this experience? Circle that.

QUESTIONS TO ASK:
- What does ${exp.name.toLowerCase()} look like from the inside?
- What do we hide about ${exp.name.toLowerCase()}? What do we perform?
- How does ${exp.name.toLowerCase()} change a person permanently?
- What can only be known through experiencing ${exp.name.toLowerCase()}?
    `.trim();
  }

  /**
   * Generate social critique guidance
   */
  generateCritiqueGuidance(target: string, preferredMethod?: string): string {
    const critique = SOCIAL_CRITIQUES.find(c =>
      c.target.toLowerCase().includes(target.toLowerCase())
    );

    if (!critique) {
      return this.generateGenericCritiqueGuidance(target);
    }

    return `
=== SOCIAL CRITIQUE: ${critique.target.toUpperCase()} ===

METHOD: ${critique.method}
TONE: ${critique.tone}

EXAMPLE TO STUDY:
"${critique.examples[0].work}" by ${critique.examples[0].author}
- Approach: ${critique.examples[0].approach}
- Impact: ${critique.examples[0].impact}

RISKS TO AVOID:
${critique.risks.map(r => `- ${r}`).join('\n')}

PRINCIPLES OF EFFECTIVE CRITIQUE:
1. Show, don't preach - let the reader draw conclusions
2. Complex characters, not villains and victims
3. Implicate everyone, including narrator and reader
4. Find the humanity in complicity
5. Leave space for readers who disagree

THE DIFFERENCE BETWEEN:
- Propaganda (tells you what to think) vs Literature (makes you think)
- Morality play (characters as types) vs Novel (characters as people)
- Issue fiction (problem at center) vs Literary fiction (humans at center)

YOUR APPROACH:
The most powerful critique often comes through:
- A sympathetic character embedded in unjust system
- The moment someone chooses complicity
- What people sacrifice to survive
- Small daily violences normalized
- The gap between what is said and what is
    `.trim();
  }

  private generateGenericCritiqueGuidance(target: string): string {
    return `
=== SOCIAL CRITIQUE: ${target.toUpperCase()} ===

No specific template found. General principles:

1. Understand the system you're critiquing from inside
2. Create characters who are not just victims or villains
3. Show how individuals are shaped by and shape systems
4. Let contradiction and complexity stand
5. Trust the reader to see what you show

METHODS:
- Direct: Show injustice unfolding
- Allegorical: Fantastical stand-in for real issue
- Satirical: Exaggerate to expose
- Tragic: Show human cost
- Through absence: What's missing speaks

Remember: The best critique illuminates, it doesn't lecture.
    `.trim();
  }

  /**
   * Analyze cultural resonance of content
   */
  analyzeCulturalResonance(content: string): {
    score: number;
    detectedThemes: string[];
    zeitgeistConnection: string;
    universalityScore: number;
    suggestions: string[];
  } {
    const detectedThemes: string[] = [];
    let score = 40;
    const suggestions: string[] = [];

    // Check for cultural tension engagement
    for (const tension of CULTURAL_TENSIONS) {
      const keywords = tension.currentManifestations
        .flatMap(m => m.toLowerCase().split(' '));
      if (keywords.some(k => content.toLowerCase().includes(k))) {
        detectedThemes.push(tension.tension);
        score += 10;
      }
    }

    // Check for universal experience engagement
    for (const exp of UNIVERSAL_EXPERIENCES) {
      if (content.toLowerCase().includes(exp.name.toLowerCase())) {
        detectedThemes.push(exp.name);
        score += 10;
      }
    }

    // Calculate universality based on sensory/emotional grounding
    const emotionalWords = ['feel', 'felt', 'heart', 'body', 'breath', 'hands', 'eyes', 'voice'];
    const emotionalCount = emotionalWords.filter(w => content.toLowerCase().includes(w)).length;
    const universalityScore = Math.min(100, 40 + emotionalCount * 10);

    // Zeitgeist connection
    let zeitgeistConnection = 'Minimal engagement with contemporary concerns';
    if (detectedThemes.length >= 2) {
      zeitgeistConnection = `Engages with ${detectedThemes.slice(0, 2).join(' and ')}`;
    }

    // Suggestions
    if (detectedThemes.length === 0) {
      suggestions.push('Consider grounding your narrative in a contemporary cultural tension');
    }
    if (universalityScore < 60) {
      suggestions.push('Add more embodied, sensory detail to make themes feel universal');
    }
    if (score < 60) {
      suggestions.push('The work may feel disconnected from its historical moment');
    }

    return {
      score: Math.min(100, score),
      detectedThemes,
      zeitgeistConnection,
      universalityScore,
      suggestions
    };
  }

  /**
   * Generate prompt enhancement for cultural depth
   */
  enhanceWithCulturalDepth(basePrompt: string, setting: string): string {
    const context = this.currentContext || HISTORICAL_MOMENTS['digital_age'];
    const randomTension = CULTURAL_TENSIONS[Math.floor(Math.random() * CULTURAL_TENSIONS.length)];
    const randomExperience = UNIVERSAL_EXPERIENCES[Math.floor(Math.random() * UNIVERSAL_EXPERIENCES.length)];

    return `
${basePrompt}

=== CULTURAL DEPTH LAYER ===

Ground this in the anxieties of our moment:
- ${context.dominantAnxieties[0]}
- ${context.dominantAnxieties[1]}

Let this tension simmer beneath:
${randomTension.tension}
Literary potential: ${randomTension.literaryPotential}

Touch the universal through:
${randomExperience.name}: ${randomExperience.timelessCore}

Remember:
- The particular reveals the universal
- Historical moment should be felt, not explained
- Speak to now by speaking truly about humans
    `.trim();
  }
}

// Export singleton
export const culturalResonanceEngine = new CulturalResonanceEngine();
