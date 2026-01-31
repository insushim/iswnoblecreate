/**
 * Page Turner System v1.0
 * Hooks, cliffhangers, tension curves, pacing mechanics
 */

import Anthropic from '@anthropic-ai/sdk';

export type HookType = 'mystery' | 'danger' | 'promise' | 'question' | 'revelation' | 'emotional' | 'action' | 'tease';
export type TensionLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export interface Hook {
  type: HookType;
  content: string;
  placement: 'opening' | 'chapter-start' | 'mid-chapter' | 'chapter-end' | 'scene-end';
  strength: TensionLevel;
  resolution: 'immediate' | 'delayed' | 'prolonged' | 'never-fully';
  technique: string;
}

export interface Cliffhanger {
  type: 'danger' | 'revelation' | 'decision' | 'arrival' | 'departure' | 'twist' | 'question' | 'threat';
  setup: string;
  hangingElement: string;
  emotionalStake: string;
  optimalDelay: 'next-scene' | 'next-chapter' | 'multiple-chapters' | 'end-of-book';
  resolution: string;
}

export interface TensionPoint {
  position: number;
  level: TensionLevel;
  source: string;
  technique: string;
}

export interface TensionCurve {
  points: TensionPoint[];
  pattern: 'rising' | 'wave' | 'escalating-waves' | 'roller-coaster' | 'slow-burn';
  averageTension: number;
  peakMoments: number[];
  restPoints: number[];
}

export interface PacingAnalysis {
  overallPace: 'slow' | 'moderate' | 'fast' | 'variable';
  sceneBreakdown: Array<{ scene: string; pace: string; wordCount: number; suggestedPace: string; }>;
  recommendations: string[];
  tensionCurve: TensionCurve;
}

export interface ChapterDesign {
  openingHook: Hook;
  midChapterHooks: Hook[];
  cliffhanger: Cliffhanger;
  tensionCurve: TensionCurve;
  pacingNotes: string[];
  wordCountTarget: number;
}

export interface AddictionMechanics {
  curiosityGaps: string[];
  promisePayoffs: Array<{ promise: string; payoff: string; delay: string; }>;
  emotionalInvestment: string[];
  unpredictability: string[];
  satisfactionCycle: string[];
}

const HOOK_TECHNIQUES: Record<HookType, { patterns: string[]; examples: string[]; psychology: string; }> = {
  mystery: {
    patterns: ['Unexplained event', 'Hidden identity', 'Missing information', 'Cryptic message', 'Strange behavior'],
    examples: ['Dead body in locked room', 'Character knows too much', 'Letter with half the words blacked out'],
    psychology: 'Curiosity gap - brain cannot rest until gap is filled'
  },
  danger: {
    patterns: ['Immediate threat', 'Countdown', 'Pursuit', 'Trap', 'Ominous warning'],
    examples: ['Footsteps behind in dark alley', 'Bomb timer', 'Car brakes fail'],
    psychology: 'Survival instinct activation - must know outcome'
  },
  promise: {
    patterns: ['Foreshadowing', 'Prophecy', 'Setup', 'Character goal', 'Implied reward'],
    examples: ['He would regret this moment forever', 'The treasure was said to grant any wish'],
    psychology: 'Anticipation of reward - dopamine loop'
  },
  question: {
    patterns: ['Direct question', 'Implied question', 'Contradiction', 'Anomaly', 'Why would they...'],
    examples: ['Why did she lie?', 'What was in the box?', 'Who sent the message?'],
    psychology: 'Need for closure - Zeigarnik effect'
  },
  revelation: {
    patterns: ['Partial reveal', 'Hint at bigger truth', 'Connection made', 'Secret glimpsed'],
    examples: ['She saw the birthmark and gasped', 'The documents proved everything', 'He was not who he claimed'],
    psychology: 'Pattern completion desire - brain seeks full picture'
  },
  emotional: {
    patterns: ['Relationship tension', 'Unspoken feelings', 'Sacrifice hint', 'Vulnerability moment'],
    examples: ['I never told you, but...', 'This might be our last chance', 'He looked at her like...'],
    psychology: 'Emotional investment - attachment triggers'
  },
  action: {
    patterns: ['Mid-fight cut', 'Chase start', 'Attack incoming', 'Explosion imminent'],
    examples: ['The blade swung toward his neck', 'She ran, not daring to look back'],
    psychology: 'Adrenaline activation - visceral need to continue'
  },
  tease: {
    patterns: ['Almost kiss', 'Almost reveal', 'Interrupted moment', 'So close yet...'],
    examples: ['Their lips were inches apart when', 'She was about to tell the truth when'],
    psychology: 'Frustration energy - redirected to page turning'
  }
};

const CLIFFHANGER_PATTERNS: Record<string, { setup: string; techniques: string[]; resolution: string; }> = {
  danger: {
    setup: 'Character in immediate physical peril',
    techniques: ['Freeze frame at worst moment', 'Cut to black', 'Time dilation'],
    resolution: 'Narrow escape, injury, or rescue'
  },
  revelation: {
    setup: 'Shocking truth about to be revealed',
    techniques: ['Partial reveal then cut', 'Witness reaction only', 'Document glimpse'],
    resolution: 'Full truth with new implications'
  },
  decision: {
    setup: 'Impossible choice presented',
    techniques: ['Door A or B', 'Save one or other', 'Sacrifice dilemma'],
    resolution: 'Choice made with consequences'
  },
  arrival: {
    setup: 'Significant character appears unexpectedly',
    techniques: ['Door opens to reveal...', 'Voice from shadows', 'Silhouette recognition'],
    resolution: 'Identity confirmed with new stakes'
  },
  departure: {
    setup: 'Character leaves at crucial moment',
    techniques: ['Walking away speech', 'Door closes', 'Last look'],
    resolution: 'Return or permanent loss'
  },
  twist: {
    setup: 'Everything reader believed is upended',
    techniques: ['Reality shift', 'Identity swap', 'Timeline reveal'],
    resolution: 'New normal established'
  },
  question: {
    setup: 'Critical question asked but not answered',
    techniques: ['Character refuses to answer', 'Interrupted', 'Ominous silence'],
    resolution: 'Answer finally given'
  },
  threat: {
    setup: 'Future danger promised',
    techniques: ['Villain warning', 'Prophecy activated', 'Clock started'],
    resolution: 'Threat manifests or is prevented'
  }
};

export class PageTurnerSystem {
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic();
  }

  async designChapterHooks(
    chapterSummary: string,
    chapterNumber: number,
    overallPlot: string,
    targetTension: TensionLevel
  ): Promise<ChapterDesign> {
    const prompt = `You are a master of page-turner design.

Chapter ${chapterNumber} summary:
${chapterSummary}

Overall plot:
${overallPlot}

Target tension level: ${targetTension}/10

Hook techniques available:
${Object.entries(HOOK_TECHNIQUES).map(([type, info]) =>
  `${type}:\n  - Patterns: ${info.patterns.join(', ')}\n  - Psychology: ${info.psychology}`
).join('\n\n')}

Design chapter hooks:

1. Opening Hook: type, content, placement, strength (1-10), resolution timing, technique
2. Mid-Chapter Hooks (2-3): same format
3. Chapter-End Cliffhanger: type, setup, hanging element, emotional stake, optimal delay, resolution hint
4. Tension Curve: points (position 0-100, level 1-10, source, technique), pattern
5. Pacing Notes: specific pacing guidance
6. Word Count Target: based on content density

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

    return this.createDefaultChapterDesign(chapterNumber, targetTension);
  }

  async analyzeAndEnhancePacing(content: string, targetPace: string): Promise<{
    analysis: PacingAnalysis;
    enhancedContent: string;
    changes: Array<{ location: string; change: string; reason: string; }>;
  }> {
    const prompt = `You are a pacing expert.

Content:
${content.substring(0, 8000)}

Target pace: ${targetPace}

Analyze and enhance:

1. Analysis:
   - Overall pace (slow/moderate/fast/variable)
   - Scene breakdown: scene description, current pace, word count, suggested pace
   - Recommendations
   - Tension curve: points, pattern, average, peaks, rest points

2. Enhanced content: rewritten with better pacing

3. Changes: location, change made, reason

Key pacing techniques:
- Short sentences for speed
- Long sentences for slow moments
- White space for impact
- Dialogue for acceleration
- Description for deceleration
- Cliffhangers for urgency

Respond in JSON.`;

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 6000,
      messages: [{ role: 'user', content: prompt }]
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';

    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
    } catch { /* parse failed */ }

    return {
      analysis: this.createDefaultPacingAnalysis(),
      enhancedContent: content,
      changes: []
    };
  }

  async generateCliffhanger(
    sceneContext: string,
    availableElements: string[],
    targetType: Cliffhanger['type']
  ): Promise<Cliffhanger> {
    const pattern = CLIFFHANGER_PATTERNS[targetType];

    const prompt = `You are a cliffhanger master.

Scene context:
${sceneContext}

Available story elements:
${availableElements.join(', ')}

Cliffhanger type: ${targetType}
Pattern: ${pattern.setup}
Techniques: ${pattern.techniques.join(', ')}

Create perfect cliffhanger:

1. type: ${targetType}
2. setup: scene setup for cliffhanger
3. hangingElement: what is left unresolved
4. emotionalStake: why reader MUST continue
5. optimalDelay: next-scene/next-chapter/multiple-chapters/end-of-book
6. resolution: how it will eventually resolve

Make it irresistible to stop reading.

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
      type: targetType,
      setup: sceneContext,
      hangingElement: 'Unresolved tension',
      emotionalStake: 'Character safety',
      optimalDelay: 'next-chapter',
      resolution: 'To be revealed'
    };
  }

  async designAddictionMechanics(
    storyPremise: string,
    mainCharacters: string[],
    plotPoints: string[]
  ): Promise<AddictionMechanics> {
    const prompt = `You are a reader addiction expert.

Story premise:
${storyPremise}

Main characters:
${mainCharacters.join(', ')}

Plot points:
${plotPoints.join('\n')}

Design addiction mechanics:

1. Curiosity Gaps (5-7): unanswered questions that drive reading
2. Promise-Payoff Cycles (5-7): promise made, eventual payoff, delay duration
3. Emotional Investment Hooks (5-7): what makes reader care deeply
4. Unpredictability Elements (5-7): how to keep reader guessing
5. Satisfaction Cycle (5-7): regular small satisfactions that reward continued reading

Psychology principles:
- Variable reward schedule (like slot machines)
- Curiosity gap (information need)
- Sunk cost (invested too much to stop)
- Social proof (characters reader relates to)
- Completion drive (need to finish)

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

    return {
      curiosityGaps: ['Main mystery', 'Character secret', 'Hidden past'],
      promisePayoffs: [{ promise: 'Truth revealed', payoff: 'Full revelation', delay: 'mid-story' }],
      emotionalInvestment: ['Character relatability', 'Stakes clarity'],
      unpredictability: ['Plot twists', 'Character surprises'],
      satisfactionCycle: ['Small victories', 'Relationship moments', 'Mystery clues']
    };
  }

  async designTensionCurve(
    chapters: Array<{ number: number; summary: string; }>,
    climaxChapter: number
  ): Promise<TensionCurve> {
    const prompt = `You are a tension architect.

Chapters:
${chapters.map(c => `Ch ${c.number}: ${c.summary}`).join('\n')}

Climax chapter: ${climaxChapter}

Design optimal tension curve:

1. Points: for each chapter, position (0-100 of story), level (1-10), source of tension, technique used
2. Pattern: rising/wave/escalating-waves/roller-coaster/slow-burn
3. Average tension
4. Peak moments (chapter numbers)
5. Rest points (chapter numbers) - necessary for contrast

Principles:
- Never flat - always rising or falling
- Peaks need valleys for impact
- Escalating waves before climax
- Brief relief before final push
- Afterglow after climax

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

    return {
      points: chapters.map((c, i) => ({
        position: (i / chapters.length) * 100,
        level: Math.min(10, Math.floor(5 + (i / chapters.length) * 5)) as TensionLevel,
        source: 'Plot progression',
        technique: 'Escalation'
      })),
      pattern: 'escalating-waves',
      averageTension: 6,
      peakMoments: [climaxChapter],
      restPoints: [Math.floor(climaxChapter / 2)]
    };
  }

  async insertHooks(content: string, hooks: Hook[]): Promise<{
    enhancedContent: string;
    insertedHooks: Array<{ hook: Hook; location: string; }>;
  }> {
    const prompt = `You are a hook insertion expert.

Original content:
${content.substring(0, 6000)}

Hooks to insert:
${hooks.map(h => `- ${h.type}: ${h.content} (strength: ${h.strength}, placement: ${h.placement})`).join('\n')}

Insert hooks naturally:

1. Enhanced content: content with hooks seamlessly integrated
2. Inserted hooks: each hook with its insertion location

Rules:
- Hooks must feel organic, not forced
- Preserve author's voice
- Place for maximum impact
- Don't over-hook (diminishing returns)

Respond in JSON.`;

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 5000,
      messages: [{ role: 'user', content: prompt }]
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';

    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
    } catch { /* parse failed */ }

    return { enhancedContent: content, insertedHooks: [] };
  }

  private createDefaultChapterDesign(chapterNumber: number, targetTension: TensionLevel): ChapterDesign {
    return {
      openingHook: {
        type: 'question',
        content: 'Intriguing opening question',
        placement: 'opening',
        strength: Math.min(10, targetTension + 1) as TensionLevel,
        resolution: 'delayed',
        technique: 'Curiosity gap'
      },
      midChapterHooks: [
        {
          type: 'revelation',
          content: 'Partial truth revealed',
          placement: 'mid-chapter',
          strength: targetTension,
          resolution: 'prolonged',
          technique: 'Breadcrumb'
        }
      ],
      cliffhanger: {
        type: 'danger',
        setup: 'Tension builds to breaking point',
        hangingElement: 'Outcome unknown',
        emotionalStake: 'Character welfare',
        optimalDelay: 'next-chapter',
        resolution: 'Resolved with new complication'
      },
      tensionCurve: {
        points: [
          { position: 0, level: 6, source: 'Opening', technique: 'Hook' },
          { position: 50, level: targetTension, source: 'Mid-point', technique: 'Escalation' },
          { position: 100, level: Math.min(10, targetTension + 2) as TensionLevel, source: 'Cliffhanger', technique: 'Suspension' }
        ],
        pattern: 'rising',
        averageTension: targetTension,
        peakMoments: [100],
        restPoints: [25]
      },
      pacingNotes: ['Start strong', 'Build steadily', 'End on high note'],
      wordCountTarget: 3500
    };
  }

  private createDefaultPacingAnalysis(): PacingAnalysis {
    return {
      overallPace: 'moderate',
      sceneBreakdown: [],
      recommendations: ['Vary sentence length', 'Add more white space', 'Increase dialogue in slow sections'],
      tensionCurve: {
        points: [],
        pattern: 'wave',
        averageTension: 5,
        peakMoments: [],
        restPoints: []
      }
    };
  }

  getHookTechniques(type: HookType) { return HOOK_TECHNIQUES[type]; }
  getCliffhangerPattern(type: string) { return CLIFFHANGER_PATTERNS[type]; }
}

export default PageTurnerSystem;
