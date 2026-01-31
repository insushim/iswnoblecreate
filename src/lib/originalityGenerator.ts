/**
 * Originality Generator v1.0
 * Cliche avoidance and unique element generation
 */

import Anthropic from '@anthropic-ai/sdk';

export type ClicheCategory = 'character' | 'plot' | 'setting' | 'dialogue' | 'relationship' | 'conflict' | 'resolution' | 'trope' | 'description' | 'opening';

export interface ClichePattern {
  category: ClicheCategory;
  pattern: string;
  examples: string[];
  frequency: 'extremely-common' | 'common' | 'moderate' | 'occasional';
  subversion: string;
  alternative: string;
}

export interface CharacterOriginality {
  archetype: string;
  subversion: string;
  uniqueTraits: string[];
  contradiction: string;
  hiddenDepth: string;
  growthPotential: string;
  memorableQuirks: string[];
}

export interface SettingOriginality {
  baseWorld: string;
  uniqueTwist: string;
  rulesAndLimitations: string[];
  sensoryDetails: string[];
  culturalDepth: string;
  hiddenLayers: string[];
  metaphoricalMeaning: string;
}

export interface PlotOriginality {
  baseStructure: string;
  unexpectedTwists: string[];
  subvertedExpectations: string[];
  uniqueCausality: string;
  emotionalSurprises: string[];
  thematicIntegration: string;
}

export interface OriginalityScore {
  overall: number;
  breakdown: {
    conceptNovelty: number;
    executionFreshness: number;
    characterUniqueness: number;
    worldBuildingOriginality: number;
    plotSurprises: number;
    voiceDistinctiveness: number;
  };
  clichesDetected: ClichePattern[];
  uniqueElements: string[];
  suggestions: string[];
}

const CLICHE_DATABASE: Record<ClicheCategory, ClichePattern[]> = {
  character: [
    { category: 'character', pattern: 'Chosen One / Prophecy Child', examples: ['Harry Potter', 'Anakin', 'Neo'], frequency: 'extremely-common', subversion: 'Prophecy is wrong, chosen one refuses, ordinary person becomes hero', alternative: 'Self-choosing hero, system-created "chosen one"' },
    { category: 'character', pattern: 'Trauma = entire personality', examples: ['Revenge-driven character', 'Parent death causes justice pursuit'], frequency: 'extremely-common', subversion: 'Multi-dimensional character where trauma exists but is not sole identity', alternative: 'Positive experience motivation, philosophical goal' },
    { category: 'character', pattern: 'Cold male lead + bright female lead', examples: ['90% of romance genre'], frequency: 'extremely-common', subversion: 'Role reversal, both complex, both bright or both dark', alternative: 'Similar personalities clash, unexpected combinations' },
    { category: 'character', pattern: 'Overpowered protagonist', examples: ['All stats maxed', 'Strongest from start'], frequency: 'common', subversion: 'Power comes with great cost, strength causes problems', alternative: 'Clear weaknesses, meaningful growth' }
  ],
  plot: [
    { category: 'plot', pattern: 'Memory loss -> truth discovery', examples: ['Actually a prince', 'Actually the culprit', 'Actually a god'], frequency: 'extremely-common', subversion: 'Memory returns but nothing special, fake memories, chosen amnesia', alternative: 'Identity exploration without memory device' },
    { category: 'plot', pattern: 'Power of love awakening/revival', examples: ['Death reversed', 'Curse broken by kiss'], frequency: 'extremely-common', subversion: 'Love alone not enough, price required, failure', alternative: 'Self-acceptance, reconciliation, forgiveness as awakening' },
    { category: 'plot', pattern: 'Betrayal -> revenge -> success', examples: ['Regression novels', 'Chaebol novels'], frequency: 'extremely-common', subversion: 'Revenge feels empty, forgiveness chosen, self-discovery during revenge', alternative: 'Reconciliation with betrayer, growth without revenge' },
    { category: 'plot', pattern: 'Tournament/exam -> first place', examples: ['Martial arts tournament', 'Magic exam', 'Audition'], frequency: 'common', subversion: 'Loses but gains something more important, emptiness of winning', alternative: 'Cooperation not competition, growth outside competition' }
  ],
  setting: [
    { category: 'setting', pattern: 'Medieval European fantasy', examples: ['Kingdom, knights, wizards, dragons'], frequency: 'extremely-common', subversion: 'Non-European culture base, different era, hybrid', alternative: 'African, Asian, South American mythology, future fantasy' },
    { category: 'setting', pattern: 'Academy/school', examples: ['Magic school', 'Hunter academy'], frequency: 'extremely-common', subversion: 'Apprenticeship, workplace, community instead', alternative: 'Master-disciple, guild, family business, wandering life' },
    { category: 'setting', pattern: 'Tower/dungeon clearing', examples: ['100-floor tower', 'Infinite dungeon'], frequency: 'common', subversion: 'Tower is alive, tower is prison/protection, escape is goal', alternative: 'Horizontal world, cyclical world, inverted structure' }
  ],
  dialogue: [
    { category: 'dialogue', pattern: 'Direct emotion statement', examples: ['I am angry', 'So sad', 'I love you'], frequency: 'common', subversion: 'Show emotion through action and subtext', alternative: 'Silence, indirect expression, body language, situational irony' },
    { category: 'dialogue', pattern: 'Exposition dump dialogue', examples: ['As you know, this world...', 'Remember when we...'], frequency: 'common', subversion: 'Natural information in dialogue, showing', alternative: 'Show through action, gradual reveal, reader inference' }
  ],
  relationship: [
    { category: 'relationship', pattern: 'Love at first sight -> fated love', examples: ['Most romance'], frequency: 'extremely-common', subversion: 'Worst first impression, slowly built feelings', alternative: 'Friends to lovers, reunion romance, forced proximity' },
    { category: 'relationship', pattern: 'Love triangle', examples: ['Woman between two men', 'Choice between opposites'], frequency: 'common', subversion: 'All three stay friends, unexpected choice, no one chosen', alternative: 'Polyamory, choosing self, redefining relationship' },
    { category: 'relationship', pattern: 'Enemies to lovers', examples: ['Villain hero', 'Contract marriage'], frequency: 'common', subversion: 'Stay enemies, unchanging things', alternative: 'Colleagues to lovers, mentor to equal partner' }
  ],
  conflict: [
    { category: 'conflict', pattern: 'Good vs evil binary', examples: ['Demon Lord and Hero', 'Empire and Rebellion'], frequency: 'extremely-common', subversion: 'Both sides have good/evil, perspective dependent', alternative: 'Ideological clash, survival competition, system vs individual' },
    { category: 'conflict', pattern: 'Repeated stronger enemy', examples: ['Power inflation'], frequency: 'common', subversion: 'Definition of strength changes, conflict strength cannot solve', alternative: 'Internal conflict, moral dilemma, relationship conflict' }
  ],
  resolution: [
    { category: 'resolution', pattern: 'Forced happy ending', examples: ['Everything works out', 'Evil destroyed', 'Couple formed'], frequency: 'common', subversion: 'Bittersweet ending, open ending, victory with cost', alternative: 'Grew but did not gain, failed but meaningful' },
    { category: 'resolution', pattern: 'Deus ex machina', examples: ['Sudden new power', 'Actually a god', 'Hidden helper'], frequency: 'common', subversion: 'Foreshadowed, cost required, partial solution only', alternative: 'Creative use of existing elements, character growth solution' }
  ],
  trope: [
    { category: 'trope', pattern: 'Regression/Reincarnation/Possession', examples: ['Die and go to past', 'Into the book', 'Into the game'], frequency: 'extremely-common', subversion: 'Regression does not change things, regression is curse, memory fades', alternative: 'Change in present, move to future, parallel world' },
    { category: 'trope', pattern: 'System/Status window', examples: ['Level up', 'Stats', 'Skill window'], frequency: 'common', subversion: 'System is enemy, existence outside system, system hacking', alternative: 'Narrative growth, symbolic change, development through relationship' }
  ],
  description: [
    { category: 'description', pattern: 'Appearance cliches', examples: ['Silver hair red eyes', 'Black hair black eyes', 'Cold smile'], frequency: 'common', subversion: 'Ordinary appearance + unique inner self', alternative: 'Characterize through actions and habits, not looks' },
    { category: 'description', pattern: 'Weather = emotion', examples: ['Rain when sad', 'Sunny when happy'], frequency: 'common', subversion: 'Emotion and weather mismatch for irony', alternative: 'Sensory details, symbolic environment' }
  ],
  opening: [
    { category: 'opening', pattern: 'Wake up in another world/past', examples: ['Regression', 'Isekai'], frequency: 'extremely-common', subversion: 'Gradual change, clear transition point, chosen movement', alternative: 'Start with conflict, mysterious start, start from ending' },
    { category: 'opening', pattern: 'Protagonist ignored/bullied', examples: ['Outcast', 'Neglected', 'Abandoned'], frequency: 'common', subversion: 'Start respected, neutral start', alternative: 'Normal daily life then incident, start successful then fall' }
  ]
};

export class OriginalityGenerator {
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic();
  }

  async detectCliches(content: string): Promise<ClichePattern[]> {
    const allCliches = Object.values(CLICHE_DATABASE).flat();

    const prompt = `You are a cliche detection expert.

Text:
${content.substring(0, 6000)}

Known cliche patterns:
${allCliches.map(c => `- ${c.pattern}`).join('\n')}

Identify cliches in this text:
1. category: ${Object.keys(CLICHE_DATABASE).join('/')}
2. pattern: pattern name
3. examples: specific examples from text
4. frequency: extremely-common/common/moderate/occasional
5. subversion: how to subvert this cliche
6. alternative: alternative approach

Respond as JSON array. Empty array if no cliches.`;

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }]
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';

    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
    } catch { /* parse failed */ }

    return [];
  }

  async generateOriginalCharacter(role: string, genre: string, avoidArchetypes: string[]): Promise<CharacterOriginality> {
    const characterCliches = CLICHE_DATABASE.character;

    const prompt = `You are a master of original character creation.

Role: ${role}
Genre: ${genre}
Archetypes to avoid: ${avoidArchetypes.join(', ')}

Common character cliches:
${characterCliches.map(c => `- ${c.pattern}`).join('\n')}

Create a truly original character:

1. archetype: base archetype (if any)
2. subversion: how to subvert it
3. uniqueTraits: unique traits (5-7)
4. contradiction: inner contradiction (core of complexity)
5. hiddenDepth: hidden depth (reader discovers)
6. growthPotential: growth potential
7. memorableQuirks: memorable quirks

Principles:
- Complex humanity, not simple reversal
- Relatable yet unpredictable
- Meet genre expectations while exceeding them

Respond in JSON.`;

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }]
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';

    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
    } catch { /* parse failed */ }

    return { archetype: role, subversion: '', uniqueTraits: [], contradiction: '', hiddenDepth: '', growthPotential: '', memorableQuirks: [] };
  }

  async generateOriginalSetting(baseGenre: string, themes: string[], avoidSettings: string[]): Promise<SettingOriginality> {
    const settingCliches = CLICHE_DATABASE.setting;

    const prompt = `You are a master of original worldbuilding.

Base genre: ${baseGenre}
Themes: ${themes.join(', ')}
Settings to avoid: ${avoidSettings.join(', ')}

Common setting cliches:
${settingCliches.map(c => `- ${c.pattern}`).join('\n')}

Create a truly original setting:

1. baseWorld: base world type
2. uniqueTwist: unique twist/reinterpretation
3. rulesAndLimitations: world rules and limits (5-7)
4. sensoryDetails: sensory details (5-7)
5. culturalDepth: cultural depth
6. hiddenLayers: hidden layers
7. metaphoricalMeaning: what this world symbolizes

Principles:
- Defamiliarize the familiar
- Consistent internal logic
- World reflects theme

Respond in JSON.`;

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3500,
      messages: [{ role: 'user', content: prompt }]
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';

    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
    } catch { /* parse failed */ }

    return { baseWorld: baseGenre, uniqueTwist: '', rulesAndLimitations: [], sensoryDetails: [], culturalDepth: '', hiddenLayers: [], metaphoricalMeaning: '' };
  }

  async generateOriginalPlot(premise: string, genre: string, avoidTropes: string[]): Promise<PlotOriginality> {
    const plotCliches = CLICHE_DATABASE.plot;
    const resolutionCliches = CLICHE_DATABASE.resolution;

    const prompt = `You are a master of original plot design.

Premise: ${premise}
Genre: ${genre}
Tropes to avoid: ${avoidTropes.join(', ')}

Common plot cliches:
${plotCliches.map(c => `- ${c.pattern}`).join('\n')}

Common resolution cliches:
${resolutionCliches.map(c => `- ${c.pattern}`).join('\n')}

Design a truly original plot:

1. baseStructure: base structure (3-act/hero journey/etc)
2. unexpectedTwists: unexpected twists (3-5)
3. subvertedExpectations: subverted genre expectations (3-5)
4. uniqueCausality: unique causality
5. emotionalSurprises: emotional surprises (3-5)
6. thematicIntegration: how plot embodies theme

Principles:
- Avoid twist for twist sake
- Plot from character
- Meet genre + exceed expectations

Respond in JSON.`;

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3500,
      messages: [{ role: 'user', content: prompt }]
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';

    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
    } catch { /* parse failed */ }

    return { baseStructure: '', unexpectedTwists: [], subvertedExpectations: [], uniqueCausality: '', emotionalSurprises: [], thematicIntegration: '' };
  }

  async evaluateOriginality(content: string, genre: string): Promise<OriginalityScore> {
    const allCliches = Object.values(CLICHE_DATABASE).flat();

    const prompt = `You are a strict originality evaluator.

Genre: ${genre}

Text:
${content.substring(0, 6000)}

Known cliche list (reference):
${allCliches.slice(0, 30).map(c => c.pattern).join(', ')}

Evaluate originality:

1. overall (0-100)
2. breakdown:
   - conceptNovelty (0-100)
   - executionFreshness (0-100)
   - characterUniqueness (0-100)
   - worldBuildingOriginality (0-100)
   - plotSurprises (0-100)
   - voiceDistinctiveness (0-100)
3. clichesDetected: detected cliches
4. uniqueElements: original elements
5. suggestions: originality improvement suggestions

Judge strictly by bestseller + literary award standards.

Respond in JSON.`;

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }]
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';

    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
    } catch { /* parse failed */ }

    return {
      overall: 50,
      breakdown: { conceptNovelty: 50, executionFreshness: 50, characterUniqueness: 50, worldBuildingOriginality: 50, plotSurprises: 50, voiceDistinctiveness: 50 },
      clichesDetected: [],
      uniqueElements: [],
      suggestions: []
    };
  }

  getClicheDatabase() { return CLICHE_DATABASE; }
  getClichesByCategory(category: ClicheCategory) { return CLICHE_DATABASE[category]; }
}

export default OriginalityGenerator;
