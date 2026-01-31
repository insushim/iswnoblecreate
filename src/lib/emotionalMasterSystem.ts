/**
 * Emotional Master System v1.0
 * Reader emotion manipulation and immersion maximization
 */

import Anthropic from '@anthropic-ai/sdk';

export type EmotionType =
  | 'joy' | 'sadness' | 'fear' | 'anger' | 'surprise' | 'disgust'
  | 'anticipation' | 'trust' | 'love' | 'guilt' | 'shame' | 'pride'
  | 'hope' | 'despair' | 'nostalgia' | 'longing' | 'relief' | 'tension'
  | 'awe' | 'curiosity' | 'empathy' | 'schadenfreude' | 'catharsis';

export type EmotionIntensity = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export interface EmotionBeat {
  emotion: EmotionType;
  intensity: EmotionIntensity;
  duration: 'flash' | 'sustained' | 'building' | 'lingering';
  trigger: string;
  physicalResponse: string[];
}

export interface EmotionalArc {
  opening: EmotionBeat;
  risingAction: EmotionBeat[];
  climax: EmotionBeat;
  fallingAction: EmotionBeat[];
  resolution: EmotionBeat;
  afterglow: EmotionBeat;
}

export interface ReaderPsychology {
  attachmentLevel: number;
  investmentLevel: number;
  anticipationLevel: number;
  satisfactionDebt: number;
  emotionalFatigue: number;
}

export interface CatharsisDesign {
  buildupPhases: Array<{ phase: string; emotion: EmotionType; intensity: EmotionIntensity; techniques: string[]; }>;
  releasePoint: { trigger: string; emotion: EmotionType; intensity: EmotionIntensity; physicalReaction: string; };
  afterEffect: { emotion: EmotionType; duration: string; readerState: string; };
}

const EMOTION_TRIGGERS: Record<EmotionType, { literary: string[]; psychological: string[]; physical: string[]; }> = {
  joy: { literary: ['unexpected reunion', 'effort pays off', 'heartfelt confession', 'crisis overcome'], psychological: ['dopamine surge', 'relief', 'belonging confirmation'], physical: ['tears', 'laughter', 'heart swelling', 'chills'] },
  sadness: { literary: ['separation', 'loss', 'moment of regret', 'missed opportunity', 'sacrifice'], psychological: ['attachment loss', 'helplessness', 'empathized pain'], physical: ['throat tightness', 'reddening eyes', 'chest heaviness'] },
  fear: { literary: ['unknown threat', 'time pressure', 'isolation', 'betrayal hint', 'ominous foreshadowing'], psychological: ['survival instinct', 'loss of control', 'unpredictability'], physical: ['racing heart', 'sweaty palms', 'breath holding'] },
  anger: { literary: ['unfair treatment', 'betrayal', 'bullying weak', 'lie exposed'], psychological: ['justice triggered', 'boundary violation', 'values threatened'], physical: ['jaw clenching', 'fist clenching', 'heat'] },
  surprise: { literary: ['twist', 'identity reveal', 'hidden connection', 'expectation reversal'], psychological: ['schema collapse', 'forced reevaluation', 'attention capture'], physical: ['breath stops', 'eyes widen', 'book pause'] },
  disgust: { literary: ['moral corruption', 'hypocrisy exposed', 'repulsive act'], psychological: ['moral boundary', 'contamination avoidance', 'purity threat'], physical: ['frowning', 'flinching', 'rejection'] },
  anticipation: { literary: ['foreshadowing', 'promise', 'setup', 'countdown', 'confrontation preview'], psychological: ['prediction urge', 'pattern completion need', 'reward expectation'], physical: ['fast page turning', 'leaning forward', 'focus'] },
  trust: { literary: ['promise kept', 'consistent behavior', 'vulnerability shared', 'sacrifice'], psychological: ['safety need', 'predictability', 'bonding'], physical: ['relaxation', 'comfort', 'smile'] },
  love: { literary: ['unconditional acceptance', 'sacrifice', 'understanding', 'growth support', 'vulnerability embrace'], psychological: ['oxytocin surge', 'attachment formation', 'identification'], physical: ['warm chest', 'smile', 'tears'] },
  guilt: { literary: ['mistake consequence', 'choice price', 'unknown truth'], psychological: ['moral self-evaluation', 'compensation urge', 'regret'], physical: ['heavy chest', 'sigh', 'head down'] },
  shame: { literary: ['secret exposed', 'public failure', 'identity crisis'], psychological: ['self threat', 'belonging threat', 'worth doubt'], physical: ['blushing', 'gaze avoidance', 'shrinking'] },
  pride: { literary: ['achievement', 'recognition', 'growth proof', 'worth confirmation'], psychological: ['self-esteem rise', 'efficacy', 'belonging'], physical: ['shoulders back', 'smile', 'bright eyes'] },
  hope: { literary: ['small victory', 'ally help', 'new possibility', 'recovery sign'], psychological: ['future orientation', 'sense of control', 'meaning'], physical: ['chest swelling', 'brightening', 'energy'] },
  despair: { literary: ['all doors closed', 'betrayal', 'accumulated loss', 'time running out'], psychological: ['helplessness', 'meaning loss', 'isolation'], physical: ['lethargy', 'tears', 'emptiness'] },
  nostalgia: { literary: ['past memory', 'lost innocence', 'changed things'], psychological: ['bittersweet memory', 'time awareness', 'identity connection'], physical: ['aching chest', 'smile and tears', 'sigh'] },
  longing: { literary: ['unreachable object', 'lost thing', 'impossible dream'], psychological: ['deficit awareness', 'ideal vs reality', 'yearning'], physical: ['aching heart', 'lingering gaze', 'sigh'] },
  relief: { literary: ['crisis escape', 'misunderstanding resolved', 'truth revealed', 'danger removed'], psychological: ['tension release', 'safety confirmation', 'control recovery'], physical: ['sigh', 'relaxation', 'laughter burst'] },
  tension: { literary: ['threat present', 'time pressure', 'secret keeping', 'confrontation imminent'], psychological: ['alert state', 'prediction attempt', 'resolution urge'], physical: ['shoulder tension', 'breath holding', 'focus'] },
  awe: { literary: ['overwhelming scale', 'sublime sacrifice', 'miraculous moment', 'cosmic scale'], psychological: ['self-diminishment', 'reverence', 'transcendence'], physical: ['chills', 'mouth open', 'breath stops'] },
  curiosity: { literary: ['mystery', 'clue', 'incomplete information', 'contradiction'], psychological: ['knowledge gap', 'pattern completion need', 'exploration instinct'], physical: ['leaning forward', 'focus', 'fast reading'] },
  empathy: { literary: ['vulnerability exposed', 'universal pain', 'relatable situation'], psychological: ['mirror neurons', 'emotion transfer', 'perspective taking'], physical: ['shared tears', 'aching heart', 'wanting to hug'] },
  schadenfreude: { literary: ['villain fall', 'arrogance price', 'justice served'], psychological: ['justice need', 'comparative advantage', 'moral satisfaction'], physical: ['satisfaction', 'smile', 'nodding'] },
  catharsis: { literary: ['emotional explosion', 'honest conversation', 'reconciliation', 'forgiveness', 'acceptance'], psychological: ['emotional purification', 'tension release', 'integration'], physical: ['tears burst', 'deep sigh', 'relaxation', 'smile'] }
};

export class EmotionalMasterSystem {
  private client: Anthropic;
  private readerState: ReaderPsychology;

  constructor() {
    this.client = new Anthropic();
    this.readerState = { attachmentLevel: 0, investmentLevel: 0, anticipationLevel: 0, satisfactionDebt: 0, emotionalFatigue: 0 };
  }

  async designEmotionalArc(storyPremise: string, genre: string, targetEmotions: EmotionType[]): Promise<EmotionalArc> {
    const prompt = `You are a reader psychology expert.

Story premise: ${storyPremise}
Genre: ${genre}
Target emotions: ${targetEmotions.join(', ')}

Emotion triggers:
${targetEmotions.map(e => {
  const triggers = EMOTION_TRIGGERS[e];
  return `${e}:\n  - Literary: ${triggers.literary.join(', ')}\n  - Psychological: ${triggers.psychological.join(', ')}`;
}).join('\n\n')}

Design the emotional arc:

1. Opening: emotion, intensity (1-10), duration, trigger, physicalResponse
2. Rising Action (3-5 beats): same format
3. Climax: peak moment
4. Falling Action (2-3 beats): catharsis prep
5. Resolution: main emotion resolved
6. Afterglow: lingering emotion after book closes

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

    return this.createDefaultEmotionalArc(targetEmotions);
  }

  async generateEmotionBeats(
    sceneDescription: string,
    targetEmotion: EmotionType,
    intensity: EmotionIntensity,
    context: { previousEmotion?: EmotionType; characterState: string; readerExpectation: string; }
  ): Promise<{ setup: string; beats: EmotionBeat[]; payoff: string; techniques: string[]; }> {
    const triggers = EMOTION_TRIGGERS[targetEmotion];

    const prompt = `You are an emotion director expert.

Scene: ${sceneDescription}
Target emotion: ${targetEmotion}
Target intensity: ${intensity}/10
Previous emotion: ${context.previousEmotion || 'none'}
Character state: ${context.characterState}
Reader expectation: ${context.readerExpectation}

Emotion triggers:
- Literary: ${triggers.literary.join(', ')}
- Psychological: ${triggers.psychological.join(', ')}
- Physical: ${triggers.physical.join(', ')}

Design emotion beats:

1. Setup: preparation for emotion
2. Beats (3-5): emotion, intensity, duration, trigger, physicalResponse
3. Payoff: climax/resolution moment
4. Techniques: sentence-level techniques

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

    return { setup: '', beats: [], payoff: '', techniques: [] };
  }

  async designCatharsis(emotionalJourney: EmotionType[], climaxScene: string, characterArc: string): Promise<CatharsisDesign> {
    const prompt = `You are a catharsis design expert.

Emotional journey: ${emotionalJourney.join(' -> ')}
Climax scene: ${climaxScene}
Character arc: ${characterArc}

Design perfect catharsis:

1. Buildup Phases (4-5): phase name, emotion, intensity (increasing), techniques
2. Release Point: trigger, emotion, intensity, physical reaction
3. After Effect: emotion, duration, reader state

Design so reader experiences tears or great emotional release.

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

    return this.createDefaultCatharsis(emotionalJourney);
  }

  async addEmotionalLayer(content: string, targetEmotion: EmotionType, intensity: EmotionIntensity): Promise<{ enhanced: string; changes: Array<{ original: string; modified: string; technique: string; }>; }> {
    const triggers = EMOTION_TRIGGERS[targetEmotion];

    const prompt = `You are an emotion writer.

Original:
${content}

Target emotion: ${targetEmotion}
Target intensity: ${intensity}/10

Techniques:
- Literary triggers: ${triggers.literary.join(', ')}
- Physical responses to evoke: ${triggers.physical.join(', ')}

Enhance emotionally:

1. Enhanced: emotionally enhanced text
2. Changes: original, modified, technique used

Criteria:
- Add sensory details
- Strengthen internal description
- Adjust rhythm and tempo
- Use images and metaphors
- Insert physical responses

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

    return { enhanced: content, changes: [] };
  }

  async measureEmotionalImpact(content: string): Promise<{
    overallImpact: number;
    emotionScores: Record<string, number>;
    peakMoments: Array<{ text: string; emotion: EmotionType; intensity: number; }>;
    weakPoints: string[];
    suggestions: string[];
  }> {
    const prompt = `You are an emotion analyst.

Text:
${content.substring(0, 8000)}

Analyze:

1. Overall Impact (0-100)
2. Emotion Scores: joy, sadness, fear, anger, surprise, anticipation, trust, love, hope, tension, empathy, catharsis (each 0-100)
3. Peak Moments (up to 5): text excerpt, emotion, intensity
4. Weak Points: flat emotion areas, missed opportunities
5. Suggestions: specific improvements

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

    return { overallImpact: 50, emotionScores: {}, peakMoments: [], weakPoints: [], suggestions: [] };
  }

  private createDefaultEmotionalArc(targetEmotions: EmotionType[]): EmotionalArc {
    const primary = targetEmotions[0] || 'anticipation';
    return {
      opening: { emotion: 'curiosity', intensity: 5, duration: 'building', trigger: 'mysterious start', physicalResponse: ['focus', 'anticipation'] },
      risingAction: [
        { emotion: primary, intensity: 6, duration: 'sustained', trigger: 'conflict deepens', physicalResponse: ['tension'] },
        { emotion: 'tension', intensity: 7, duration: 'building', trigger: 'crisis rises', physicalResponse: ['anxiety'] }
      ],
      climax: { emotion: primary, intensity: 10, duration: 'flash', trigger: 'decisive moment', physicalResponse: ['shock', 'tears'] },
      fallingAction: [{ emotion: 'relief', intensity: 7, duration: 'sustained', trigger: 'resolution', physicalResponse: ['relief'] }],
      resolution: { emotion: 'catharsis', intensity: 8, duration: 'lingering', trigger: 'completion', physicalResponse: ['satisfaction', 'afterglow'] },
      afterglow: { emotion: 'nostalgia', intensity: 6, duration: 'lingering', trigger: 'echo', physicalResponse: ['longing'] }
    };
  }

  private createDefaultCatharsis(emotions: EmotionType[]): CatharsisDesign {
    return {
      buildupPhases: [
        { phase: 'seed', emotion: 'tension', intensity: 3, techniques: ['foreshadowing'] },
        { phase: 'growth', emotion: 'anticipation', intensity: 5, techniques: ['conflict deepening'] },
        { phase: 'storm brewing', emotion: 'fear', intensity: 8, techniques: ['crisis'] },
        { phase: 'peak', emotion: 'despair', intensity: 9, techniques: ['worst moment'] }
      ],
      releasePoint: { trigger: 'realization/decision', emotion: 'catharsis', intensity: 10, physicalReaction: 'tears' },
      afterEffect: { emotion: 'hope', duration: 'long lasting', readerState: 'emotional purification, satisfaction' }
    };
  }

  getEmotionTriggers(emotion: EmotionType) { return EMOTION_TRIGGERS[emotion]; }
  resetReaderState(): void { this.readerState = { attachmentLevel: 0, investmentLevel: 0, anticipationLevel: 0, satisfactionDebt: 0, emotionalFatigue: 0 }; }
}

export default EmotionalMasterSystem;
