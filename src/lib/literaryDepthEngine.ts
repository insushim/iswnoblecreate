/**
 * Literary Depth Engine v1.0
 * Theme, Symbol, Metaphor, Foreshadowing system
 */

import Anthropic from '@anthropic-ai/sdk';

// Types
export type ThemeType =
  | 'identity' | 'love' | 'death' | 'power' | 'freedom' | 'justice'
  | 'redemption' | 'betrayal' | 'sacrifice' | 'growth' | 'loss'
  | 'family' | 'society' | 'nature' | 'time' | 'memory' | 'truth'
  | 'illusion' | 'fate' | 'choice' | 'isolation' | 'connection'
  | 'ambition' | 'morality' | 'faith' | 'doubt' | 'hope' | 'despair';

export interface ThemeLayer {
  primary: ThemeType;
  secondary: ThemeType[];
  thesis: string;
  antithesis: string;
  synthesis: string;
  progression: Array<{
    stage: string;
    expression: string;
    subtlety: 'overt' | 'implied' | 'subtle' | 'hidden';
  }>;
}

export interface Symbol {
  name: string;
  meaning: string[];
  firstAppearance: string;
  recurrences: Array<{ context: string; evolution: string; }>;
  finalMeaning: string;
}

export interface Motif {
  name: string;
  pattern: string;
  instances: string[];
  thematicConnection: string;
}

export interface Metaphor {
  surface: string;
  depth: string;
  context: string;
  resonance: string;
}

export interface Foreshadowing {
  hint: string;
  payoff: string;
  subtlety: 'obvious' | 'moderate' | 'subtle' | 'hidden';
  chapter: { setup: number; payoff: number; };
}

export interface ParallelStructure {
  elements: string[];
  pattern: string;
  meaning: string;
  contrast?: string;
}

export interface Irony {
  type: 'dramatic' | 'situational' | 'verbal' | 'cosmic';
  setup: string;
  reveal: string;
  effect: string;
}

export interface Subtext {
  surface: string;
  beneath: string;
  technique: string;
  readerRealization: string;
}

export interface LiteraryDepthAnalysis {
  thematicDepth: number;
  symbolicRichness: number;
  subtextQuality: number;
  structuralElegance: number;
  overallArtistry: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
}

const THEME_EXPRESSIONS: Record<ThemeType, {
  symbols: string[];
  motifs: string[];
  situations: string[];
  questions: string[];
}> = {
  identity: {
    symbols: ['mirror', 'mask', 'shadow', 'name', 'clothes', 'transformation'],
    motifs: ['self-recognition', 'others gaze', 'role-playing', 'essence vs appearance'],
    situations: ['identity crisis', 'self-discovery', 'persona collapse', 'true self confrontation'],
    questions: ['Who am I?', 'Is who others see the real me?', 'Does essence change?']
  },
  love: {
    symbols: ['flame', 'water', 'flower', 'bird', 'light', 'hand'],
    motifs: ['sacrifice', 'waiting', 'growth', 'change', 'acceptance'],
    situations: ['love begins', 'trial', 'misunderstanding', 'reconciliation', 'maturity'],
    questions: ['Is love enough?', 'What is true love?', 'Does love change?']
  },
  death: {
    symbols: ['crow', 'clock', 'sunset', 'winter', 'seed', 'butterfly'],
    motifs: ['finiteness', 'legacy', 'memory', 'transformation', 'liberation'],
    situations: ['facing death', 'loss', 'last words', 'mourning', 'acceptance'],
    questions: ['What remains after death?', 'How to live?', 'What is meaningful death?']
  },
  power: {
    symbols: ['crown', 'sword', 'heights', 'chains', 'fire', 'shadow'],
    motifs: ['corruption', 'resistance', 'balance', 'responsibility', 'price'],
    situations: ['gaining power', 'abuse', 'corruption', 'fall', 'recovery'],
    questions: ['Does power corrupt?', 'What is legitimate power?', 'Does strength require responsibility?']
  },
  freedom: {
    symbols: ['bird', 'wind', 'sea', 'sky', 'key', 'wings'],
    motifs: ['oppression', 'liberation', 'choice', 'price', 'responsibility'],
    situations: ['imprisonment', 'escape', 'crossroads', 'weight of freedom'],
    questions: ['What is true freedom?', 'What is the price of freedom?', 'Freedom and responsibility?']
  },
  justice: {
    symbols: ['scales', 'sword', 'blindfold', 'light', 'trial', 'evidence'],
    motifs: ['pursuit of justice', 'revenge and forgiveness', 'law and morality', 'fairness'],
    situations: ['injustice', 'trial', 'revenge', 'forgiveness', 'reconciliation'],
    questions: ['What is justice?', 'Is revenge justice?', 'Is perfect justice possible?']
  },
  redemption: {
    symbols: ['water', 'light', 'spring', 'dawn', 'phoenix', 'path'],
    motifs: ['guilt', 'confession', 'atonement', 'forgiveness', 'rebirth'],
    situations: ['past sins', 'chance for redemption', 'seeking forgiveness', 'self-forgiveness'],
    questions: ['Can I be forgiven?', 'How to atone?', 'Can the past be erased?']
  },
  betrayal: {
    symbols: ['snake', 'thorn', 'shadow', 'mirror', 'knife', 'poison'],
    motifs: ['trust', 'suspicion', 'discovery', 'consequence', 'healing'],
    situations: ['building trust', 'moment of betrayal', 'discovery', 'confrontation', 'aftermath'],
    questions: ['Why betray?', 'Can recovery happen after betrayal?', 'Value of trust?']
  },
  sacrifice: {
    symbols: ['flame', 'cross', 'blood', 'altar', 'seed', 'bridge'],
    motifs: ['price', 'choice', 'love', 'duty', 'legacy'],
    situations: ['dilemma', 'moment of sacrifice', 'result', 'meaning'],
    questions: ['Value of sacrifice?', 'Sacrifice for whom?', 'Is sacrifice necessary?']
  },
  growth: {
    symbols: ['seed', 'tree', 'ladder', 'path', 'river', 'seasons'],
    motifs: ['trial', 'realization', 'change', 'maturity', 'acceptance'],
    situations: ['facing challenge', 'failure', 'lesson', 'growth', 'reflection'],
    questions: ['What is growth?', 'Can one grow without pain?', 'Standard of maturity?']
  },
  loss: {
    symbols: ['empty space', 'shadow', 'photo', 'letter', 'autumn', 'ruins'],
    motifs: ['absence', 'memory', 'mourning', 'acceptance', 'rebuilding'],
    situations: ['moment of loss', 'denial', 'anger', 'acceptance', 'new beginning'],
    questions: ['What do we learn from loss?', 'How do memories remain?', 'Is recovery possible?']
  },
  family: {
    symbols: ['home', 'roots', 'blood', 'table', 'photo', 'legacy'],
    motifs: ['bond', 'conflict', 'duty', 'love', 'liberation'],
    situations: ['family conflict', 'secrets', 'reconciliation', 'separation', 'reunion'],
    questions: ['What is family?', 'Blood vs chosen family?', 'Family duty?']
  },
  society: {
    symbols: ['city', 'wall', 'crowd', 'mask', 'class', 'machine'],
    motifs: ['belonging', 'alienation', 'norms', 'resistance', 'conformity'],
    situations: ['entering society', 'conflict', 'conformity vs resistance', 'change'],
    questions: ['Individual vs society?', 'What is normal?', 'Can society change?']
  },
  nature: {
    symbols: ['forest', 'sea', 'mountain', 'animal', 'seasons', 'storm'],
    motifs: ['cycle', 'balance', 'primitiveness', 'recovery', 'connection'],
    situations: ['return to nature', 'disaster', 'harmony', 'destruction', 'regeneration'],
    questions: ['Human-nature relationship?', 'Is nature enemy or ally?', 'Power of nature?']
  },
  time: {
    symbols: ['clock', 'hourglass', 'river', 'seasons', 'aging', 'ruins'],
    motifs: ['finiteness', 'change', 'memory', 'regret', 'present'],
    situations: ['time awareness', 'regret', 'present focus', 'accepting mortality'],
    questions: ['Is time linear?', 'Does the past change?', 'Value of present?']
  },
  memory: {
    symbols: ['photo', 'scent', 'music', 'scar', 'keepsake', 'dream'],
    motifs: ['memory and reality', 'forgetting', 'reconstruction', 'obsession', 'liberation'],
    situations: ['reminiscence', 'distorted memory', 'confrontation', 'acceptance'],
    questions: ['Is memory truth?', 'Is forgetting healing?', 'Identity without memory?']
  },
  truth: {
    symbols: ['light', 'mirror', 'unmasking', 'eye', 'book', 'evidence'],
    motifs: ['search', 'discovery', 'acceptance', 'consequence', 'change'],
    situations: ['doubt', 'search', 'discovery', 'confrontation', 'acceptance'],
    questions: ['Is absolute truth possible?', 'Price of truth?', 'Is truth always good?']
  },
  illusion: {
    symbols: ['mirror', 'fog', 'dream', 'stage', 'magic', 'shadow'],
    motifs: ['self-deception', 'maintaining illusion', 'facing reality', 'awakening'],
    situations: ['life in illusion', 'cracks', 'collapse', 'accepting reality'],
    questions: ['Are illusions necessary?', 'Is reality bearable?', 'Border between truth and illusion?']
  },
  fate: {
    symbols: ['thread', 'star', 'path', 'wheel', 'prophecy', 'cards'],
    motifs: ['fate vs free will', 'resistance', 'acceptance', 'transcendence'],
    situations: ['fate recognition', 'resistance', 'frustration', 'acceptance/transcendence'],
    questions: ['Does fate exist?', 'Is choice free?', 'Can fate change?']
  },
  choice: {
    symbols: ['crossroads', 'door', 'hand', 'coin', 'contract', 'signature'],
    motifs: ['dilemma', 'consequence', 'responsibility', 'regret', 'acceptance'],
    situations: ['moment of choice', 'conflict', 'decision', 'facing consequence'],
    questions: ['Best choice?', 'Criteria for choice?', 'Is not choosing also a choice?']
  },
  isolation: {
    symbols: ['island', 'wall', 'prison', 'silence', 'darkness', 'void'],
    motifs: ['isolation', 'inner exploration', 'longing', 'connection attempt', 'acceptance/escape'],
    situations: ['isolation begins', 'inner confrontation', 'connection attempt', 'liberation/acceptance'],
    questions: ['Is solitude necessary?', 'Is connection possible?', 'Does self exist alone?']
  },
  connection: {
    symbols: ['bridge', 'hand', 'rope', 'light', 'door', 'language'],
    motifs: ['meeting', 'understanding', 'conflict', 'reconciliation', 'bond'],
    situations: ['first meeting', 'misunderstanding', 'communication attempt', 'connection', 'parting'],
    questions: ['What is true connection?', 'Is understanding possible?', 'Price of connection?']
  },
  ambition: {
    symbols: ['mountain', 'star', 'ladder', 'fire', 'crown', 'shadow'],
    motifs: ['goal', 'sacrifice', 'corruption', 'achievement', 'emptiness'],
    situations: ['dream begins', 'obstacles', 'compromise', 'achievement', 'reflection'],
    questions: ['Price of ambition?', 'What is success?', 'Where to stop?']
  },
  morality: {
    symbols: ['scales', 'light and dark', 'path', 'boundary', 'hand'],
    motifs: ['good and evil', 'gray area', 'judgment', 'consequence', 'reflection'],
    situations: ['moral dilemma', 'choice', 'consequence', 'reflection'],
    questions: ['Is absolute good/evil possible?', 'Does end justify means?', 'Standard of morality?']
  },
  faith: {
    symbols: ['light', 'star', 'flame', 'mountain', 'water', 'seed'],
    motifs: ['belief', 'test', 'doubt', 'recovery', 'transcendence'],
    situations: ['belief formation', 'test', 'doubt', 'recovery/loss'],
    questions: ['What is faith?', 'Is faith blind?', 'Can one live without faith?']
  },
  doubt: {
    symbols: ['shadow', 'fog', 'mirror', 'crack', 'question mark'],
    motifs: ['certainty', 'crack', 'exploration', 'new understanding'],
    situations: ['certainty', 'doubt begins', 'exploration', 'conclusion'],
    questions: ['Is doubt destructive or constructive?', 'Is certainty possible?']
  },
  hope: {
    symbols: ['dawn', 'seed', 'star', 'flame', 'spring', 'child'],
    motifs: ['darkness', 'small light', 'growth', 'realization'],
    situations: ['despair', 'sprout of hope', 'trial', 'hope maintained/realized'],
    questions: ['Basis of hope?', 'Can one live without hope?', 'What is false hope?']
  },
  despair: {
    symbols: ['abyss', 'winter', 'ruins', 'shadow', 'void', 'thorns'],
    motifs: ['loss', 'meaninglessness', 'isolation', 'collapse', 'rebuilding attempt'],
    situations: ['despair begins', 'abyss', 'bottom', 'finding light'],
    questions: ['Is despair the end?', 'Where does meaning come from?', 'What do we learn from despair?']
  }
};

export class LiteraryDepthEngine {
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic();
  }

  async designThemeLayer(
    premise: string,
    primaryTheme: ThemeType,
    secondaryThemes: ThemeType[]
  ): Promise<ThemeLayer> {
    const themeData = THEME_EXPRESSIONS[primaryTheme];

    const prompt = `You are a literary critic and author.

Premise: ${premise}
Theme: ${primaryTheme}
Secondary themes: ${secondaryThemes.join(', ')}

Theme expression tools:
- Symbols: ${themeData.symbols.join(', ')}
- Motifs: ${themeData.motifs.join(', ')}
- Situations: ${themeData.situations.join(', ')}
- Questions: ${themeData.questions.join(', ')}

Design the theme layer for this work:

1. Primary Theme: ${primaryTheme}
2. Secondary Themes: list
3. Thesis: initial proposition about theme (presented early)
4. Antithesis: counter-proposition (challenged in middle)
5. Synthesis: integration (insight reached at end)

6. Progression (5-7 stages):
- stage: name
- expression: specific expression method
- subtlety: overt/implied/subtle/hidden

Themes should be revealed through story and characters, not explained directly.

Respond in JSON.`;

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }]
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';

    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch {
      // Parse failed
    }

    return this.createDefaultThemeLayer(primaryTheme, secondaryThemes);
  }

  async createSymbolSystem(
    themes: ThemeType[],
    setting: string,
    keyElements: string[]
  ): Promise<Symbol[]> {
    const relevantSymbols = themes.flatMap(t => THEME_EXPRESSIONS[t].symbols);

    const prompt = `You are a symbolism expert.

Themes: ${themes.join(', ')}
Setting: ${setting}
Key elements: ${keyElements.join(', ')}
Reference symbols: ${relevantSymbols.join(', ')}

Create a symbol system for this work (4-6 symbols):

Each symbol:
1. name: symbol name
2. meaning: meanings (multi-layered, 3-5)
3. firstAppearance: first appearance context
4. recurrences: reappearances (3-5)
   - context: appearance context
   - evolution: meaning change
5. finalMeaning: final meaning (integrated)

Symbols should:
- Blend naturally into the story
- Deepen gradually in meaning
- Allow multiple interpretations

Respond as JSON array.`;

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }]
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';

    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch {
      // Parse failed
    }

    return [];
  }

  async designForeshadowingNetwork(
    plotPoints: Array<{ chapter: number; event: string }>,
    twists: string[]
  ): Promise<Foreshadowing[]> {
    const prompt = `You are a master of foreshadowing.

Plot points:
${plotPoints.map(p => `Chapter ${p.chapter}: ${p.event}`).join('\n')}

Major twists/events:
${twists.join('\n')}

Design foreshadowing for each important event/twist:

Each foreshadowing:
1. hint: hint content (specific)
2. payoff: connected event
3. subtlety: obvious/moderate/subtle/hidden
4. chapter:
   - setup: chapter where hint appears
   - payoff: chapter where resolved

Principles:
- Pass naturally on first read
- "Aha!" moment on reread
- Mix different subtlety levels
- Mix red herrings with real foreshadowing

Respond as JSON array.`;

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }]
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';

    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch {
      // Parse failed
    }

    return [];
  }

  async addSubtextLayer(
    scene: string,
    characterDynamics: string,
    hiddenTensions: string[]
  ): Promise<{ enhanced: string; subtexts: Subtext[]; }> {
    const prompt = `You are a subtext expert.

Scene:
${scene}

Character dynamics: ${characterDynamics}
Hidden tensions: ${hiddenTensions.join(', ')}

Add subtext layer to this scene:

1. Enhanced: enhanced scene with subtext
2. Subtexts: subtexts added
- surface: surface meaning
- beneath: hidden meaning
- technique: technique used
- readerRealization: when reader realizes

Respond in JSON.`;

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }]
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';

    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch {
      // Parse failed
    }

    return { enhanced: scene, subtexts: [] };
  }

  async designIrony(
    situation: string,
    characters: string[],
    readerKnowledge: string
  ): Promise<Irony[]> {
    const prompt = `You are a master of irony.

Situation: ${situation}
Characters: ${characters.join(', ')}
What reader knows: ${readerKnowledge}

Design irony for this situation (2-4):

Types:
1. dramatic: reader knows but character doesn't
2. situational: expectation vs result mismatch
3. verbal: words vs meaning mismatch
4. cosmic: irony of fate

Each:
- type
- setup
- reveal
- effect

Respond as JSON array.`;

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2500,
      messages: [{ role: 'user', content: prompt }]
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';

    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch {
      // Parse failed
    }

    return [];
  }

  async designParallelStructures(
    plotlines: string[],
    characters: Array<{ name: string; arc: string }>
  ): Promise<ParallelStructure[]> {
    const prompt = `You are a structuralist literary expert.

Plotlines:
${plotlines.join('\n')}

Character arcs:
${characters.map(c => `${c.name}: ${c.arc}`).join('\n')}

Design parallel structures:

Types:
1. Character arc parallel
2. Situation parallel
3. Image parallel
4. Contrast parallel

Each:
- elements: parallel elements
- pattern: pattern description
- meaning: meaning/effect
- contrast: (if any) contrast element

Respond as JSON array.`;

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }]
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';

    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch {
      // Parse failed
    }

    return [];
  }

  async generateMetaphors(
    theme: ThemeType,
    context: string,
    count: number = 5
  ): Promise<Metaphor[]> {
    const themeData = THEME_EXPRESSIONS[theme];

    const prompt = `You are a master of metaphor.

Theme: ${theme}
Context: ${context}
Reference symbols: ${themeData.symbols.join(', ')}

Generate ${count} rich metaphors:

Each:
- surface: surface image
- depth: deep meaning
- context: usage context
- resonance: why it resonates with reader

Respond as JSON array.`;

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2500,
      messages: [{ role: 'user', content: prompt }]
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';

    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch {
      // Parse failed
    }

    return [];
  }

  async designMotifs(themes: ThemeType[], setting: string): Promise<Motif[]> {
    const relevantMotifs = themes.flatMap(t => THEME_EXPRESSIONS[t].motifs);

    const prompt = `You are a motif design expert.

Themes: ${themes.join(', ')}
Setting: ${setting}
Reference motifs: ${relevantMotifs.join(', ')}

Design motifs for this work (4-6):

Each:
- name: motif name
- pattern: repetition pattern
- instances: specific appearances (4-6)
- thematicConnection: connection to theme

Respond as JSON array.`;

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }]
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';

    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch {
      // Parse failed
    }

    return [];
  }

  async analyzeLiteraryDepth(
    content: string,
    intendedThemes: ThemeType[]
  ): Promise<LiteraryDepthAnalysis> {
    const prompt = `You are a strict literary critic.

Text:
${content.substring(0, 8000)}

Intended themes: ${intendedThemes.join(', ')}

Analyze literary depth:

1. thematicDepth (0-100)
2. symbolicRichness (0-100)
3. subtextQuality (0-100)
4. structuralElegance (0-100)
5. overallArtistry (0-100)
6. strengths
7. weaknesses
8. suggestions

Judge strictly by bestseller + literary award standards.

Respond in JSON.`;

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }]
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';

    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch {
      // Parse failed
    }

    return {
      thematicDepth: 50,
      symbolicRichness: 50,
      subtextQuality: 50,
      structuralElegance: 50,
      overallArtistry: 50,
      strengths: [],
      weaknesses: ['Analysis failed'],
      suggestions: []
    };
  }

  async enhanceLiteraryDepth(
    content: string,
    themeLayer: ThemeLayer,
    symbols: Symbol[]
  ): Promise<string> {
    const prompt = `You are an expert at adding literary depth.

Original:
${content}

Theme layer:
- Theme: ${themeLayer.primary}
- Thesis: ${themeLayer.thesis}
- Antithesis: ${themeLayer.antithesis}

Symbol system:
${symbols.map(s => `${s.name}: ${s.meaning.join(', ')}`).join('\n')}

Add literary depth to the original:
- Insert symbols naturally
- Add subtext layer
- Enhance metaphors and images
- Add thematic resonance

Express through images and actions, not direct explanation.
Output only the modified text.`;

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      messages: [{ role: 'user', content: prompt }]
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    return text || content;
  }

  private createDefaultThemeLayer(
    primary: ThemeType,
    secondary: ThemeType[]
  ): ThemeLayer {
    const themeData = THEME_EXPRESSIONS[primary];

    return {
      primary,
      secondary,
      thesis: themeData.questions[0] || `Exploration of ${primary}`,
      antithesis: 'Challenge to this',
      synthesis: 'Integrated understanding',
      progression: [
        { stage: 'introduction', expression: 'Theme presented', subtlety: 'implied' },
        { stage: 'development', expression: 'Theme explored', subtlety: 'subtle' },
        { stage: 'conflict', expression: 'Theme challenged', subtlety: 'overt' },
        { stage: 'climax', expression: 'Theme confronted', subtlety: 'overt' },
        { stage: 'resolution', expression: 'Theme integrated', subtlety: 'implied' }
      ]
    };
  }

  getThemeExpressions(theme: ThemeType): typeof THEME_EXPRESSIONS[ThemeType] {
    return THEME_EXPRESSIONS[theme];
  }

  getAvailableThemes(): ThemeType[] {
    return Object.keys(THEME_EXPRESSIONS) as ThemeType[];
  }

  /**
   * Generate master literary guide for a scene
   */
  generateMasterLiteraryGuide(options: {
    sceneNumber: number;
    sceneType: string;
    emotionalGoal: string;
    participants: string[];
    themes: string[];
  }): string {
    const themeGuides = options.themes.map(theme => {
      const themeKey = theme as ThemeType;
      const themeData = THEME_EXPRESSIONS[themeKey];
      if (!themeData) return '';
      return `
### ${theme} Theme Guide
- Symbols: ${themeData.symbols.slice(0, 3).join(', ')}
- Motifs: ${themeData.motifs.slice(0, 3).join(', ')}
- Core Question: ${themeData.questions[0] || 'Explore this theme deeply'}`;
    }).filter(Boolean).join('\n');

    return `
## Literary Depth Guide - Scene ${options.sceneNumber}

### Scene Context
- Type: ${options.sceneType}
- Emotional Goal: ${options.emotionalGoal}
- Participants: ${options.participants.join(', ') || 'TBD'}

${themeGuides || '### No specific theme assigned'}

### Writing Techniques
1. Show, don't tell - Express theme through actions and images
2. Use sensory details to ground abstract concepts
3. Layer subtext beneath surface dialogue
4. Plant symbols naturally within the scene
5. Build toward emotional resonance

### Quality Markers
- Avoid direct exposition of theme
- Create memorable images
- Balance action with reflection
- Connect to broader narrative threads
`;
  }

  /**
   * Evaluate overall literary depth of content
   */
  async evaluateLiteraryDepth(content: string): Promise<{
    overallDepth: number;
    thematicDepth: number;
    symbolicRichness: number;
    subtextQuality: number;
    strengths: string[];
    weaknesses: string[];
  }> {
    const prompt = `You are a literary critic evaluating depth.

Content:
${content.substring(0, 6000)}

Evaluate:
1. overallDepth (0-100)
2. thematicDepth (0-100)
3. symbolicRichness (0-100)
4. subtextQuality (0-100)
5. strengths (list)
6. weaknesses (list)

Respond in JSON.`;

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }]
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';

    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
    } catch { /* parse failed */ }

    return {
      overallDepth: 50,
      thematicDepth: 50,
      symbolicRichness: 50,
      subtextQuality: 50,
      strengths: [],
      weaknesses: []
    };
  }
}

export default LiteraryDepthEngine;
