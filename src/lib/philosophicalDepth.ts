/**
 * Philosophical Depth Engine - Existential Themes and Human Condition
 *
 * Nobel literature explores fundamental human questions:
 * - Mortality and meaning
 * - Freedom and responsibility
 * - Love and alienation
 * - Memory and identity
 * - Power and ethics
 * - Time and consciousness
 */

export interface PhilosophicalTheme {
  name: string;
  description: string;
  centralQuestion: string;
  subQuestions: string[];
  thinkers: string[]; // Philosophers who explored this
  literaryExamples: LiteraryExample[];
  manifestations: ThemeManifestation[];
  tensions: ThematicTension[];
}

export interface LiteraryExample {
  work: string;
  author: string;
  treatment: string;
}

export interface ThemeManifestation {
  level: 'plot' | 'character' | 'symbol' | 'language' | 'structure';
  description: string;
  example: string;
}

export interface ThematicTension {
  pole1: string;
  pole2: string;
  description: string;
  dramaticPotential: string;
}

export interface ExistentialMoment {
  type: 'confrontation' | 'epiphany' | 'crisis' | 'acceptance' | 'transformation';
  theme: string;
  trigger: string;
  internalProcess: string;
  externalManifestation: string;
  aftermath: string;
}

export interface CharacterPhilosophy {
  characterId: string;
  worldview: string;
  coreBeliefs: string[];
  blindSpots: string[];
  existentialWounds: string[];
  questionsTheyAvoid: string[];
  philosophicalJourney: PhilosophicalArc;
}

export interface PhilosophicalArc {
  startingPosition: string;
  challenges: string[];
  crisisPoint: string;
  transformation: string;
  endingPosition: string;
  remainingQuestions: string[];
}

export interface ThematicLayer {
  surface: string; // What happens
  psychological: string; // What characters feel
  social: string; // What it says about society
  existential: string; // What it says about human condition
  metaphysical: string; // What it says about reality itself
}

// Core philosophical themes in Nobel-worthy literature
const PHILOSOPHICAL_THEMES: Record<string, PhilosophicalTheme> = {
  mortality: {
    name: 'Mortality and the Awareness of Death',
    description: 'The unique human burden of knowing we will die and how this shapes existence',
    centralQuestion: 'How do we live meaningfully knowing we will die?',
    subQuestions: [
      'Does death give life meaning or render it meaningless?',
      'What survives us - memory, work, love, nothing?',
      'Is the fear of death really fear of not having lived?',
      'Can we truly comprehend our own non-existence?',
      'How does proximity to death transform perception?'
    ],
    thinkers: ['Heidegger', 'Camus', 'Epicurus', 'Tolstoy', 'Becker'],
    literaryExamples: [
      { work: 'The Death of Ivan Ilyich', author: 'Tolstoy', treatment: 'A man confronting mortality realizes he never truly lived' },
      { work: 'The Stranger', author: 'Camus', treatment: 'Indifference to death as existential freedom' },
      { work: 'One Hundred Years of Solitude', author: 'Garcia Marquez', treatment: 'Death as transformation and continuity' }
    ],
    manifestations: [
      { level: 'plot', description: 'Character facing terminal diagnosis', example: 'The journey from denial to acceptance' },
      { level: 'character', description: 'A character who lives as if immortal vs one who is death-aware', example: 'Contrast reveals different modes of being' },
      { level: 'symbol', description: 'Recurring images of decay, seasons, clocks', example: 'A house slowly crumbling throughout the narrative' },
      { level: 'language', description: 'Temporal language, references to endings in beginnings', example: 'Past tense narration of present events' },
      { level: 'structure', description: 'Narrative that moves toward inevitable end known from start', example: 'Chronicle of a Death Foretold structure' }
    ],
    tensions: [
      { pole1: 'Denial', pole2: 'Acceptance', description: 'The struggle between avoiding and embracing mortality', dramaticPotential: 'Character arc from false immortality to authentic living' },
      { pole1: 'Legacy', pole2: 'Meaninglessness', description: 'Does anything we do survive us?', dramaticPotential: 'A character building something that may or may not outlast them' }
    ]
  },

  freedom: {
    name: 'Freedom and Its Burdens',
    description: 'The terrifying responsibility of human freedom and the ways we flee from it',
    centralQuestion: 'What does it mean to be truly free, and can we bear it?',
    subQuestions: [
      'Is radical freedom liberating or terrifying?',
      'How do we flee from freedom into bad faith?',
      'What is the relationship between freedom and responsibility?',
      'Can we be free if determined by our past?',
      'Is choosing not to choose still a choice?'
    ],
    thinkers: ['Sartre', 'Kierkegaard', 'Dostoevsky', 'Fromm', 'Beauvoir'],
    literaryExamples: [
      { work: 'The Brothers Karamazov', author: 'Dostoevsky', treatment: 'The Grand Inquisitor argues humans cannot bear freedom' },
      { work: 'Nausea', author: 'Sartre', treatment: 'The vertigo of absolute freedom and contingency' },
      { work: 'The Handmaid\'s Tale', author: 'Atwood', treatment: 'The seductive comfort of unfreedom' }
    ],
    manifestations: [
      { level: 'plot', description: 'Character at crossroads with no right answer', example: 'A decision that will define who they become' },
      { level: 'character', description: 'One who embraces freedom vs one who flees to authority', example: 'Contrast illuminates the cost of each path' },
      { level: 'symbol', description: 'Open doors, vast spaces, prison imagery', example: 'The prison that characters build for themselves' },
      { level: 'language', description: 'Modal verbs, conditional tense, language of possibility', example: 'Could have, might have, what if' },
      { level: 'structure', description: 'Branching narratives, alternate endings', example: 'Reader aware of paths not taken' }
    ],
    tensions: [
      { pole1: 'Authenticity', pole2: 'Bad faith', description: 'Living one\'s own truth vs adopting ready-made identities', dramaticPotential: 'Character realizing their entire life has been performance' },
      { pole1: 'Freedom', pole2: 'Security', description: 'The trade-off between self-determination and comfort', dramaticPotential: 'A character who must choose between safe imprisonment and dangerous freedom' }
    ]
  },

  alienation: {
    name: 'Alienation and Connection',
    description: 'The fundamental separateness of human consciousness and the yearning to bridge it',
    centralQuestion: 'Can we ever truly know another person, or are we irremediably alone?',
    subQuestions: [
      'Is loneliness the human condition or a failure of connection?',
      'Can language bridge the gap between consciousnesses?',
      'What is lost in translation between inner and outer?',
      'Is love a genuine connection or a beautiful illusion?',
      'How do we remain ourselves while being with others?'
    ],
    thinkers: ['Levinas', 'Buber', 'Kierkegaard', 'Marx', 'Arendt'],
    literaryExamples: [
      { work: 'Notes from Underground', author: 'Dostoevsky', treatment: 'The underground man who cannot connect' },
      { work: 'Mrs Dalloway', author: 'Woolf', treatment: 'Parallel consciousnesses that never quite meet' },
      { work: 'Norwegian Wood', author: 'Murakami', treatment: 'The impossibility and necessity of connection' }
    ],
    manifestations: [
      { level: 'plot', description: 'Failed communication leading to tragedy', example: 'What was meant vs what was heard' },
      { level: 'character', description: 'Characters speaking past each other', example: 'Dialogue that reveals rather than bridges distance' },
      { level: 'symbol', description: 'Windows, walls, mirrors, separate rooms', example: 'Characters in same space, different worlds' },
      { level: 'language', description: 'Misunderstanding, silence, failed expression', example: 'The inadequacy of words for experience' },
      { level: 'structure', description: 'Multiple POVs showing same event differently', example: 'Rashomon effect revealing subjective isolation' }
    ],
    tensions: [
      { pole1: 'Solitude', pole2: 'Communion', description: 'The need for both self and other', dramaticPotential: 'A character who achieves connection only to find new loneliness' },
      { pole1: 'Authenticity', pole2: 'Belonging', description: 'Being true to self vs being understood', dramaticPotential: 'Must one be false to be loved?' }
    ]
  },

  identity: {
    name: 'Identity and Self',
    description: 'The question of what constitutes the self and whether it is continuous or constructed',
    centralQuestion: 'Who am I, and is there a stable "I" at all?',
    subQuestions: [
      'Is identity given or chosen?',
      'Can we escape our past selves?',
      'What happens to identity under extreme pressure?',
      'How much of "I" is actually "we"?',
      'Is the self a story we tell ourselves?'
    ],
    thinkers: ['Locke', 'Hume', 'Ricoeur', 'Butler', 'Parfit'],
    literaryExamples: [
      { work: 'The Remains of the Day', author: 'Ishiguro', treatment: 'A man discovering his life was built on false identity' },
      { work: 'Orlando', author: 'Woolf', treatment: 'Identity persisting through gender, time, transformation' },
      { work: 'If on a winter\'s night a traveler', author: 'Calvino', treatment: 'The reader as constructed identity' }
    ],
    manifestations: [
      { level: 'plot', description: 'Identity revealed to be false or constructed', example: 'The discovery that changes everything' },
      { level: 'character', description: 'Character who is different with different people', example: 'Who is the real self?' },
      { level: 'symbol', description: 'Masks, mirrors, photographs, names', example: 'The gap between image and reality' },
      { level: 'language', description: 'Shifting pronouns, unstable narrator', example: 'The I that cannot pin itself down' },
      { level: 'structure', description: 'Fragmentary narrative reflecting fragmentary self', example: 'Form mirrors theme' }
    ],
    tensions: [
      { pole1: 'Continuity', pole2: 'Change', description: 'The same person across time?', dramaticPotential: 'Meeting one\'s past or future self as stranger' },
      { pole1: 'Individual', pole2: 'Social', description: 'Self as unique vs self as role', dramaticPotential: 'Stripping away roles to find what remains' }
    ]
  },

  time: {
    name: 'Time and Memory',
    description: 'The mysterious nature of temporal experience and memory\'s role in constructing self and meaning',
    centralQuestion: 'What is the relationship between time as lived and time as measured?',
    subQuestions: [
      'Is the past real or only memory?',
      'How does memory construct rather than record?',
      'Can we ever be present or are we always elsewhere in time?',
      'What is the relationship between memory and identity?',
      'Is time a prison or a gift?'
    ],
    thinkers: ['Bergson', 'Husserl', 'Augustine', 'Heidegger', 'Ricoeur'],
    literaryExamples: [
      { work: 'In Search of Lost Time', author: 'Proust', treatment: 'Involuntary memory and time regained' },
      { work: 'To the Lighthouse', author: 'Woolf', treatment: 'Time as destroyer and preserver' },
      { work: 'Slaughterhouse-Five', author: 'Vonnegut', treatment: 'Being unstuck in time' }
    ],
    manifestations: [
      { level: 'plot', description: 'Non-linear narrative reflecting true temporal experience', example: 'Memory intrusion into present' },
      { level: 'character', description: 'Character haunted by past or anxious about future', example: 'Unable to be present' },
      { level: 'symbol', description: 'Clocks, seasons, photographs, ruins', example: 'Time made visible' },
      { level: 'language', description: 'Tense shifts, temporal markers, duration', example: 'Language struggling with time' },
      { level: 'structure', description: 'Temporal loops, flash-forwards, compressed/dilated time', example: 'Structure as temporal argument' }
    ],
    tensions: [
      { pole1: 'Presence', pole2: 'Absence', description: 'The present as only real vs always already past', dramaticPotential: 'A moment that cannot be held' },
      { pole1: 'Memory', pole2: 'Forgetting', description: 'The burden and gift of each', dramaticPotential: 'What should be remembered and what forgotten' }
    ]
  },

  truth: {
    name: 'Truth and Perspective',
    description: 'The nature of truth, the limits of knowledge, and the plurality of perspectives',
    centralQuestion: 'Is objective truth accessible, or are we trapped in perspectives?',
    subQuestions: [
      'Can there be truth without a perspective?',
      'What is the relationship between truth and power?',
      'Is fiction a lie or a different kind of truth?',
      'How do we adjudicate between competing truths?',
      'What truths are too dangerous to know?'
    ],
    thinkers: ['Nietzsche', 'Foucault', 'Rorty', 'Arendt', 'Wittgenstein'],
    literaryExamples: [
      { work: 'Rashomon', author: 'Akutagawa', treatment: 'Multiple incompatible true accounts' },
      { work: 'Pale Fire', author: 'Nabokov', treatment: 'Truth as madness and madness as truth' },
      { work: 'Beloved', author: 'Morrison', treatment: 'Truths too terrible to speak' }
    ],
    manifestations: [
      { level: 'plot', description: 'Mystery where truth is never fully revealed', example: 'The question matters more than the answer' },
      { level: 'character', description: 'Unreliable narrator who believes their lies', example: 'Subjective truth as only truth' },
      { level: 'symbol', description: 'Mirrors, mist, documents, testimony', example: 'Truth obscured and revealed' },
      { level: 'language', description: 'Hedging, qualification, paradox', example: 'Language undermining certainty' },
      { level: 'structure', description: 'Competing narratives, unreliable frame', example: 'No authoritative version' }
    ],
    tensions: [
      { pole1: 'Certainty', pole2: 'Doubt', description: 'The need for and danger of each', dramaticPotential: 'Comfortable lies vs unbearable truths' },
      { pole1: 'Public', pole2: 'Private', description: 'Truth known vs truth acknowledged', dramaticPotential: 'The secret everyone keeps' }
    ]
  },

  power: {
    name: 'Power and Ethics',
    description: 'The dynamics of power between humans and the moral questions they raise',
    centralQuestion: 'What are the ethics of power, and can power be exercised justly?',
    subQuestions: [
      'Does power corrupt or reveal?',
      'What does it mean to have power over another consciousness?',
      'Is resistance always possible?',
      'What are the ethics of complicity?',
      'Can the powerful understand the powerless?'
    ],
    thinkers: ['Foucault', 'Arendt', 'Weber', 'Fanon', 'Gramsci'],
    literaryExamples: [
      { work: 'The Trial', author: 'Kafka', treatment: 'Power as invisible and incomprehensible' },
      { work: 'Things Fall Apart', author: 'Achebe', treatment: 'Colonial power and cultural destruction' },
      { work: 'Crime and Punishment', author: 'Dostoevsky', treatment: 'The illusion of being beyond morality' }
    ],
    manifestations: [
      { level: 'plot', description: 'Power dynamics shifting, power abused or resisted', example: 'The moment power is recognized' },
      { level: 'character', description: 'Characters at different levels of power hierarchy', example: 'How power shapes perception' },
      { level: 'symbol', description: 'Thrones, chains, gaze, height', example: 'Power made visible' },
      { level: 'language', description: 'Command vs request, naming rights, silence', example: 'Language as power' },
      { level: 'structure', description: 'Whose story gets told, framing', example: 'The power to narrate' }
    ],
    tensions: [
      { pole1: 'Dominance', pole2: 'Submission', description: 'The dynamics of power exchange', dramaticPotential: 'Reversal of power, complicity in oppression' },
      { pole1: 'Justice', pole2: 'Mercy', description: 'The irreconcilable claims of each', dramaticPotential: 'When doing right causes harm' }
    ]
  },

  meaning: {
    name: 'Meaning and Absurdity',
    description: 'The human need for meaning in a universe that may offer none',
    centralQuestion: 'How do we create or find meaning in an indifferent universe?',
    subQuestions: [
      'Is meaning discovered or created?',
      'Can we live without meaning?',
      'Is the search for meaning itself meaningful?',
      'What happens when meaning collapses?',
      'Can suffering be meaningful?'
    ],
    thinkers: ['Camus', 'Kierkegaard', 'Frankl', 'Nagel', 'Nietzsche'],
    literaryExamples: [
      { work: 'The Myth of Sisyphus', author: 'Camus', treatment: 'Embracing absurdity as freedom' },
      { work: 'Waiting for Godot', author: 'Beckett', treatment: 'Meaning deferred infinitely' },
      { work: 'Man\'s Search for Meaning', author: 'Frankl', treatment: 'Finding meaning in suffering' }
    ],
    manifestations: [
      { level: 'plot', description: 'Quest for meaning, meaning found or lost', example: 'The moment meaning dissolves or crystallizes' },
      { level: 'character', description: 'Nihilist vs meaning-maker', example: 'How each faces the void' },
      { level: 'symbol', description: 'Void, light, task, journey', example: 'Sisyphean labor as meaning' },
      { level: 'language', description: 'Assertion vs questioning, declaration vs doubt', example: 'Language reaching for meaning' },
      { level: 'structure', description: 'Circular, endless, or conclusive', example: 'Does narrative itself provide meaning?' }
    ],
    tensions: [
      { pole1: 'Faith', pole2: 'Doubt', description: 'Belief in meaning vs skepticism', dramaticPotential: 'The leap of faith or refusal to leap' },
      { pole1: 'Action', pole2: 'Paralysis', description: 'Acting despite absurdity vs being frozen by it', dramaticPotential: 'What makes action possible?' }
    ]
  }
};

export class PhilosophicalDepthEngine {
  private activeThemes: Map<string, PhilosophicalTheme> = new Map();
  private characterPhilosophies: Map<string, CharacterPhilosophy> = new Map();

  constructor() {
    this.initializeThemes();
  }

  private initializeThemes(): void {
    for (const [key, theme] of Object.entries(PHILOSOPHICAL_THEMES)) {
      this.activeThemes.set(key, theme);
    }
  }

  /**
   * Get all available philosophical themes
   */
  getThemes(): PhilosophicalTheme[] {
    return Array.from(this.activeThemes.values());
  }

  /**
   * Get a specific theme
   */
  getTheme(themeName: string): PhilosophicalTheme | undefined {
    return this.activeThemes.get(themeName);
  }

  /**
   * Generate philosophical depth for a scene
   */
  generatePhilosophicalLayer(
    scene: string,
    themes: string[]
  ): ThematicLayer {
    const selectedThemes = themes
      .map(t => this.activeThemes.get(t))
      .filter((t): t is PhilosophicalTheme => t !== undefined);

    if (selectedThemes.length === 0) {
      // Default to mortality and meaning if no themes specified
      selectedThemes.push(
        this.activeThemes.get('mortality')!,
        this.activeThemes.get('meaning')!
      );
    }

    const surface = scene;

    const psychological = this.generatePsychologicalLayer(scene, selectedThemes);
    const social = this.generateSocialLayer(scene, selectedThemes);
    const existential = this.generateExistentialLayer(scene, selectedThemes);
    const metaphysical = this.generateMetaphysicalLayer(scene, selectedThemes);

    return {
      surface,
      psychological,
      social,
      existential,
      metaphysical
    };
  }

  private generatePsychologicalLayer(scene: string, themes: PhilosophicalTheme[]): string {
    const prompts: string[] = [];

    for (const theme of themes) {
      prompts.push(`Consider how ${theme.name} manifests in character psychology:`);
      prompts.push(`- ${theme.subQuestions[0]}`);

      const characterManif = theme.manifestations.find(m => m.level === 'character');
      if (characterManif) {
        prompts.push(`- ${characterManif.description}`);
      }
    }

    return prompts.join('\n');
  }

  private generateSocialLayer(scene: string, themes: PhilosophicalTheme[]): string {
    const socialQuestions = [
      'What does this scene reveal about power structures?',
      'How do social expectations constrain or enable characters?',
      'What is unspoken but understood by all present?',
      'Whose perspective is privileged, whose marginalized?'
    ];

    return `Social Dimension:\n${socialQuestions.join('\n')}`;
  }

  private generateExistentialLayer(scene: string, themes: PhilosophicalTheme[]): string {
    const prompts: string[] = ['Existential Undercurrent:'];

    for (const theme of themes) {
      prompts.push(`\n${theme.name}:`);
      prompts.push(`Central question haunting this scene: ${theme.centralQuestion}`);

      const tension = theme.tensions[0];
      if (tension) {
        prompts.push(`Tension at play: ${tension.pole1} vs ${tension.pole2}`);
        prompts.push(`Dramatic potential: ${tension.dramaticPotential}`);
      }
    }

    return prompts.join('\n');
  }

  private generateMetaphysicalLayer(scene: string, themes: PhilosophicalTheme[]): string {
    const metaphysicalQuestions = [
      'What does this scene suggest about the nature of reality?',
      'Is there meaning inherent in events or only in interpretation?',
      'What exists beyond what characters can perceive?',
      'What would remain if all observers were removed?'
    ];

    return `Metaphysical Dimension:\n${metaphysicalQuestions.join('\n')}`;
  }

  /**
   * Create an existential moment for a character
   */
  createExistentialMoment(
    characterId: string,
    theme: string,
    momentType: ExistentialMoment['type']
  ): ExistentialMoment {
    const themeData = this.activeThemes.get(theme);
    if (!themeData) {
      throw new Error(`Unknown theme: ${theme}`);
    }

    const triggers: Record<string, string[]> = {
      confrontation: [
        'A death that cannot be ignored',
        'A truth that cannot be unlearned',
        'A loss that strips away illusions',
        'An encounter with radical otherness'
      ],
      epiphany: [
        'A moment of unexpected beauty',
        'A pattern suddenly revealed',
        'A connection that illuminates',
        'A memory that returns transformed'
      ],
      crisis: [
        'The collapse of certainty',
        'A decision with no good choice',
        'The failure of meaning systems',
        'The encounter with the absurd'
      ],
      acceptance: [
        'The exhaustion of resistance',
        'The discovery of unexpected peace',
        'The embrace of limitation',
        'The surrender to what is'
      ],
      transformation: [
        'The death of an old self',
        'The birth of new perception',
        'The integration of opposites',
        'The crossing of a threshold'
      ]
    };

    const selectedTrigger = triggers[momentType][
      Math.floor(Math.random() * triggers[momentType].length)
    ];

    return {
      type: momentType,
      theme,
      trigger: selectedTrigger,
      internalProcess: this.generateInternalProcess(themeData, momentType),
      externalManifestation: this.generateExternalManifestation(momentType),
      aftermath: this.generateAftermath(themeData, momentType)
    };
  }

  private generateInternalProcess(theme: PhilosophicalTheme, type: ExistentialMoment['type']): string {
    const processes: Record<string, string> = {
      confrontation: `The character faces ${theme.centralQuestion} directly for perhaps the first time. Previous defenses fail. The question demands acknowledgment.`,
      epiphany: `In a flash, the character perceives ${theme.centralQuestion} not as abstract philosophy but as lived reality. The intellectual becomes visceral.`,
      crisis: `${theme.centralQuestion} becomes unbearable. The character can neither answer nor escape it. All previous certainties dissolve.`,
      acceptance: `The character stops fighting ${theme.centralQuestion}. Instead of demanding an answer, they learn to live within the question.`,
      transformation: `Through engaging with ${theme.centralQuestion}, the character becomes someone new - not by solving the question but by being changed by it.`
    };

    return processes[type];
  }

  private generateExternalManifestation(type: ExistentialMoment['type']): string {
    const manifestations: Record<string, string> = {
      confrontation: 'Stillness. The world continues but the character is suddenly outside it, looking in.',
      epiphany: 'Time dilates. Details become hyperreal. A sensation of the world cracking open.',
      crisis: 'Fragmentation. Speech becomes difficult. The body betrays distress the mind cannot articulate.',
      acceptance: 'A release of tension. Perhaps tears, perhaps laughter. The body lighter.',
      transformation: 'A different way of moving, seeing, speaking. Others notice something has changed.'
    };

    return manifestations[type];
  }

  private generateAftermath(theme: PhilosophicalTheme, type: ExistentialMoment['type']): string {
    const subQuestion = theme.subQuestions[
      Math.floor(Math.random() * theme.subQuestions.length)
    ];

    return `The moment passes but its resonance remains. A new question has taken root: ${subQuestion}. ` +
           `The character cannot return to who they were before. The world looks the same but is perceived differently.`;
  }

  /**
   * Define a character's philosophical stance
   */
  defineCharacterPhilosophy(
    characterId: string,
    worldview: string,
    coreBeliefs: string[],
    primaryTheme: string
  ): CharacterPhilosophy {
    const theme = this.activeThemes.get(primaryTheme);
    if (!theme) {
      throw new Error(`Unknown theme: ${primaryTheme}`);
    }

    const philosophy: CharacterPhilosophy = {
      characterId,
      worldview,
      coreBeliefs,
      blindSpots: this.generateBlindSpots(worldview, coreBeliefs),
      existentialWounds: this.generateExistentialWounds(theme),
      questionsTheyAvoid: this.generateAvoidedQuestions(theme, worldview),
      philosophicalJourney: this.generatePhilosophicalArc(theme, worldview)
    };

    this.characterPhilosophies.set(characterId, philosophy);
    return philosophy;
  }

  private generateBlindSpots(worldview: string, beliefs: string[]): string[] {
    // Blind spots are the shadow of beliefs
    return [
      'The experience that contradicts their worldview',
      'The perspective they cannot imagine',
      'The self-knowledge they resist',
      'The complicity they cannot see'
    ];
  }

  private generateExistentialWounds(theme: PhilosophicalTheme): string[] {
    return [
      `A formative experience with ${theme.name.toLowerCase()} that was never processed`,
      `A loss that created their stance toward ${theme.centralQuestion}`,
      `A betrayal that shaped their understanding`
    ];
  }

  private generateAvoidedQuestions(theme: PhilosophicalTheme, worldview: string): string[] {
    // Find questions that would threaten the worldview
    return theme.subQuestions.filter((_, i) => i % 2 === 0); // Simplified selection
  }

  private generatePhilosophicalArc(theme: PhilosophicalTheme, worldview: string): PhilosophicalArc {
    const tension = theme.tensions[0];

    return {
      startingPosition: `Firmly on the side of ${tension.pole1}. ${worldview} protects against ${tension.pole2}.`,
      challenges: [
        'Encounter with someone who embodies the opposite position',
        'An event that makes their position untenable',
        'A gradual erosion of certainty'
      ],
      crisisPoint: `Forced to confront ${theme.centralQuestion} directly. Old answers fail.`,
      transformation: `Integration of ${tension.pole1} and ${tension.pole2}. Not resolution but acceptance of tension.`,
      endingPosition: `Lives with the question rather than an answer. Wisdom not as certainty but as capacity for uncertainty.`,
      remainingQuestions: theme.subQuestions.slice(2, 4)
    };
  }

  /**
   * Generate philosophical dialogue prompts
   */
  generatePhilosophicalDialogue(
    theme: string,
    character1Philosophy: string,
    character2Philosophy: string
  ): string {
    const themeData = this.activeThemes.get(theme);
    if (!themeData) {
      throw new Error(`Unknown theme: ${theme}`);
    }

    return `
=== PHILOSOPHICAL DIALOGUE GENERATION ===

Theme: ${themeData.name}
Central Question: ${themeData.centralQuestion}

Character 1 Position: ${character1Philosophy}
Character 2 Position: ${character2Philosophy}

DIALOGUE PRINCIPLES:
1. Neither character should be simply right or wrong
2. Each should illuminate something true that the other misses
3. The dialogue should not resolve the question but deepen it
4. Subtext should carry as much weight as text
5. Allow for silence, deflection, and unfinished thoughts

WHAT EACH MIGHT SAY:
- Character 1 might articulate: "${themeData.tensions[0].pole1}"
- Character 2 might articulate: "${themeData.tensions[0].pole2}"
- Both might glimpse: The truth exists in the tension between positions

AVOID:
- Didactic speeches
- Easy conversion
- Straw man arguments
- Resolution

THE BEST PHILOSOPHICAL DIALOGUE:
- Happens between people, not positions
- Is grounded in specific experience
- Reveals character through argument
- Leaves the reader with more questions

Reference: ${themeData.literaryExamples[0].work} by ${themeData.literaryExamples[0].author}
Treatment: ${themeData.literaryExamples[0].treatment}
    `.trim();
  }

  /**
   * Generate thematic analysis of content
   */
  analyzeThematicDepth(content: string): {
    detectedThemes: string[];
    depthScore: number;
    suggestions: string[];
  } {
    const detectedThemes: string[] = [];
    let depthScore = 30; // Base score
    const suggestions: string[] = [];

    // Check for each theme's presence
    for (const [key, theme] of Array.from(this.activeThemes.entries())) {
      const indicators = [
        theme.name.toLowerCase(),
        ...theme.subQuestions.map(q => q.toLowerCase().split(' ').slice(0, 3).join(' ')),
        ...theme.thinkers.map(t => t.toLowerCase())
      ];

      const contentLower = content.toLowerCase();
      const found = indicators.some(ind => contentLower.includes(ind));

      if (found) {
        detectedThemes.push(key);
        depthScore += 10;
      }
    }

    // Check for philosophical depth markers
    const depthMarkers = [
      { pattern: /why/gi, weight: 1 },
      { pattern: /what does it mean/gi, weight: 3 },
      { pattern: /how can we/gi, weight: 2 },
      { pattern: /is it possible/gi, weight: 2 },
      { pattern: /the nature of/gi, weight: 3 },
      { pattern: /what remains/gi, weight: 2 }
    ];

    for (const marker of depthMarkers) {
      const matches = content.match(marker.pattern);
      if (matches) {
        depthScore += matches.length * marker.weight;
      }
    }

    // Generate suggestions
    if (detectedThemes.length === 0) {
      suggestions.push('No clear philosophical themes detected. Consider grounding the narrative in one of: mortality, freedom, alienation, identity, time, truth, power, or meaning.');
    }

    if (depthScore < 50) {
      suggestions.push('Add moments where characters grapple with fundamental questions, not just practical problems.');
      suggestions.push('Consider adding subtext that speaks to the human condition beyond the immediate plot.');
    }

    if (detectedThemes.length === 1) {
      suggestions.push(`Good focus on ${detectedThemes[0]}. Consider how it intersects with another theme for richer exploration.`);
    }

    return {
      detectedThemes,
      depthScore: Math.min(100, depthScore),
      suggestions
    };
  }

  /**
   * Get character philosophy
   */
  getCharacterPhilosophy(characterId: string): CharacterPhilosophy | undefined {
    return this.characterPhilosophies.get(characterId);
  }
}

// Export singleton
export const philosophicalDepthEngine = new PhilosophicalDepthEngine();
