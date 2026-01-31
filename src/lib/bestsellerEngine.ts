/**
 * Bestseller Engine v1.0
 * Market analysis, trend prediction, hit formula system
 */

import Anthropic from '@anthropic-ai/sdk';

export type MarketSegment = 'mass-market' | 'literary' | 'genre-specific' | 'crossover' | 'niche-premium';

export type AudienceDemographic = {
  ageRange: [number, number];
  gender: 'all' | 'female-leaning' | 'male-leaning';
  readingHabits: ('casual' | 'avid' | 'genre-loyal' | 'trend-follower')[];
  emotionalNeeds: string[];
  escapismType: 'adventure' | 'romance' | 'intellectual' | 'emotional' | 'power-fantasy';
};

export type MarketTrend = {
  name: string;
  category: 'rising' | 'peak' | 'declining' | 'evergreen';
  saturation: number;
  examples: string[];
  predictedLifespan: string;
  differentiationOpportunity: string;
};

export type CompetitiveAnalysis = {
  topCompetitors: Array<{
    title: string;
    author: string;
    successFactors: string[];
    weaknesses: string[];
    audienceOverlap: number;
  }>;
  marketGaps: string[];
  saturatedElements: string[];
  underservedNeeds: string[];
};

export type HitFormula = {
  coreConcept: { highConcept: string; elevator: string; uniqueHook: string; };
  emotionalCore: { primaryEmotion: string; emotionalJourney: string[]; catharticMoment: string; };
  marketPositioning: { comp1: string; comp2: string; differentiator: string; };
  viralPotential: { talkability: string[]; bookClubAppeal: string[]; socialMediaHooks: string[]; };
};

export type BestsellerPrediction = {
  overallScore: number;
  components: {
    conceptStrength: number;
    marketTiming: number;
    emotionalResonance: number;
    uniqueness: number;
    commercialAppeal: number;
    wordOfMouthPotential: number;
  };
  riskFactors: string[];
  opportunities: string[];
  recommendedAdjustments: string[];
  predictedPerformance: { worstCase: string; likelyCase: string; bestCase: string; };
};

export type MarketIntelligence = {
  currentTrends: MarketTrend[];
  audienceInsights: AudienceDemographic;
  competitiveAnalysis: CompetitiveAnalysis;
  timingAdvice: { optimalRelease: string; seasonalFactors: string[]; avoidPeriods: string[]; };
  pricingStrategy: { recommendedPrice: string; rationale: string; };
};

export interface BestsellerConfig {
  targetMarket: MarketSegment;
  primaryGenre: string;
  targetAudience: Partial<AudienceDemographic>;
  competitorTitles?: string[];
  marketGoal: 'bestseller-list' | 'steady-seller' | 'cult-classic' | 'blockbuster';
}

const BESTSELLER_PATTERNS: Record<string, {
  mustHaves: string[];
  avoidList: string[];
  sweetSpots: { wordCount: number[]; chapterLength: number[]; pacing: string; };
}> = {
  thriller: {
    mustHaves: ['First chapter incident', 'Cliffhanger every chapter', 'At least 3 twists', 'Personal stakes', 'Time pressure', 'Moral dilemma'],
    avoidList: ['Slow start', 'Excessive exposition', 'Predictable plot', 'Passive protagonist'],
    sweetSpots: { wordCount: [80000, 100000], chapterLength: [2500, 4000], pacing: 'fast-with-breathers' }
  },
  romance: {
    mustHaves: ['Immediate chemistry', 'Obstacles to love', 'Emotional vulnerability', 'Spark in dialogue', 'Misunderstanding and reconciliation', 'Satisfying ending'],
    avoidList: ['One-sided relationship', 'Conflict without communication', 'Unrealistic perfection', 'Too many subplots'],
    sweetSpots: { wordCount: [70000, 90000], chapterLength: [3000, 5000], pacing: 'emotional-waves' }
  },
  fantasy: {
    mustHaves: ['Unique magic system', 'Clear stakes', 'Gradual worldbuilding', 'Memorable side characters', 'Epic climax', 'Emotional anchor'],
    avoidList: ['Info dumps', 'Too many complex names', 'World over character', 'Cliche chosen one'],
    sweetSpots: { wordCount: [100000, 150000], chapterLength: [4000, 6000], pacing: 'epic-buildup' }
  },
  mystery: {
    mustHaves: ['First chapter mystery', 'Fair clue placement', 'At least 3 red herrings', 'Personal connection', 'Satisfying solution', 'Twist element'],
    avoidList: ['Out of nowhere solution', 'Excessive coincidence', 'Incompetent investigator', 'Illogical motive'],
    sweetSpots: { wordCount: [75000, 95000], chapterLength: [3000, 4500], pacing: 'steady-revelation' }
  },
  literary: {
    mustHaves: ['Unique style/voice', 'Universal theme', 'Complex characters', 'Symbolic layers', 'Resonant ending', 'Social reflection'],
    avoidList: ['Style only work', 'Elitist attitude', 'Emotional distance', 'Obscurity for its own sake'],
    sweetSpots: { wordCount: [70000, 100000], chapterLength: [2000, 8000], pacing: 'contemplative-immersive' }
  }
};

export class BestsellerEngine {
  private client: Anthropic;
  private config: BestsellerConfig;

  constructor(config: BestsellerConfig) {
    this.client = new Anthropic();
    this.config = config;
  }

  async gatherMarketIntelligence(): Promise<MarketIntelligence> {
    const prompt = `You are a publishing market analyst.

Settings:
- Target market: ${this.config.targetMarket}
- Primary genre: ${this.config.primaryGenre}
- Goal: ${this.config.marketGoal}

Analyze:

1. Current trends (5):
- name, category (rising/peak/declining/evergreen), saturation (0-100), examples, predicted lifespan, differentiation opportunity

2. Target audience analysis:
- age range, reading habits, emotional needs, escapism type

3. Competitive analysis:
- top 3 competitors (success factors, weaknesses), market gaps, saturated elements, underserved needs

4. Timing advice:
- optimal release, seasonal factors, periods to avoid

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

    return this.generateDefaultMarketIntelligence();
  }

  async generateHitFormula(concept: string, marketIntel: MarketIntelligence): Promise<HitFormula> {
    const genrePatterns = BESTSELLER_PATTERNS[this.config.primaryGenre] || BESTSELLER_PATTERNS['literary'];

    const prompt = `You are a bestseller strategist.

Concept: ${concept}
Genre: ${this.config.primaryGenre}
Target: ${this.config.marketGoal}

Genre requirements:
${genrePatterns.mustHaves.join('\n')}

Avoid:
${genrePatterns.avoidList.join('\n')}

Market trends:
${marketIntel.currentTrends.map(t => `- ${t.name} (${t.category})`).join('\n')}

Underserved needs:
${marketIntel.competitiveAnalysis.underservedNeeds.join('\n')}

Create hit formula:

1. Core concept: highConcept, elevator pitch (30 sec), unique hook
2. Emotional core: primary emotion, emotional journey arc, catharsis moment
3. Market positioning: comp1 (famous), comp2 (recent), differentiator
4. Viral potential: talkability factors, book club points, social media hooks

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

    return this.generateDefaultHitFormula(concept);
  }

  async predictBestsellerPotential(
    manuscript: { title: string; synopsis: string; sampleChapters: string; wordCount: number; },
    hitFormula: HitFormula
  ): Promise<BestsellerPrediction> {
    const prompt = `You are a 20-year publishing editor.

Manuscript:
Title: ${manuscript.title}
Synopsis: ${manuscript.synopsis}
Word count: ${manuscript.wordCount}

Sample:
${manuscript.sampleChapters.substring(0, 5000)}

Hit formula target:
- High concept: ${hitFormula.coreConcept.highConcept}
- Unique hook: ${hitFormula.coreConcept.uniqueHook}
- Emotional core: ${hitFormula.emotionalCore.primaryEmotion}
- Comps: ${hitFormula.marketPositioning.comp1} + ${hitFormula.marketPositioning.comp2}

Evaluate strictly:

1. Scores (each 0-100):
- conceptStrength, marketTiming, emotionalResonance, uniqueness, commercialAppeal, wordOfMouthPotential
- overallScore

2. Risk factors (specific)
3. Opportunities
4. Required adjustments
5. Predicted performance: worst case, likely case, best case

Respond in JSON. Be honest and constructive.`;

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

    return this.generateDefaultPrediction();
  }

  async transformConceptToBestseller(originalConcept: string): Promise<{
    original: string;
    transformed: string;
    changes: string[];
    potentialIncrease: number;
  }> {
    const marketIntel = await this.gatherMarketIntelligence();

    const prompt = `You are a bestseller maker.

Original concept:
${originalConcept}

Market analysis:
- Current trends: ${marketIntel.currentTrends.map(t => t.name).join(', ')}
- Market gaps: ${marketIntel.competitiveAnalysis.marketGaps.join(', ')}
- Underserved needs: ${marketIntel.competitiveAnalysis.underservedNeeds.join(', ')}

Transform this concept to maximize bestseller potential:

1. Transformed concept (detailed)
2. Changes list (with reasons for each)
3. Expected potential increase (%)

Keep core idea but maximize commercial appeal.

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
        const result = JSON.parse(jsonMatch[0]);
        return {
          original: originalConcept,
          transformed: result.transformed || result.transformedConcept,
          changes: result.changes || [],
          potentialIncrease: result.potentialIncrease || 0
        };
      }
    } catch { /* parse failed */ }

    return { original: originalConcept, transformed: originalConcept, changes: [], potentialIncrease: 0 };
  }

  private generateDefaultMarketIntelligence(): MarketIntelligence {
    return {
      currentTrends: [
        { name: 'Dark Romance', category: 'peak', saturation: 75, examples: ['Twisted Love'], predictedLifespan: '2-3 years', differentiationOpportunity: 'Add psychological depth' },
        { name: 'Cozy Fantasy', category: 'rising', saturation: 40, examples: ['Legends & Lattes'], predictedLifespan: '3-5 years', differentiationOpportunity: 'Cultural setting' }
      ],
      audienceInsights: { ageRange: [18, 35], gender: 'female-leaning', readingHabits: ['avid'], emotionalNeeds: ['escape', 'catharsis'], escapismType: 'romance' },
      competitiveAnalysis: { topCompetitors: [], marketGaps: ['Cultural fantasy romance'], saturatedElements: ['Villain hero', 'Contract marriage'], underservedNeeds: ['Healthy relationships'] },
      timingAdvice: { optimalRelease: 'Spring/Fall', seasonalFactors: ['Summer romance demand'], avoidPeriods: ['Major series finales'] },
      pricingStrategy: { recommendedPrice: '$14-16', rationale: 'Genre standard' }
    };
  }

  private generateDefaultHitFormula(concept: string): HitFormula {
    return {
      coreConcept: { highConcept: concept, elevator: `A moving story about ${concept}`, uniqueHook: 'Fresh perspective on familiar theme' },
      emotionalCore: { primaryEmotion: 'hope', emotionalJourney: ['curiosity', 'immersion', 'tension', 'emotion', 'afterglow'], catharticMoment: 'Protagonist decision moment' },
      marketPositioning: { comp1: 'Genre classic', comp2: 'Recent hit', differentiator: 'Cultural depth with universal emotion' },
      viralPotential: { talkability: ['twist', 'quotes', 'ending'], bookClubAppeal: ['character discussion', 'theme discussion'], socialMediaHooks: ['#bookfinished', '#quotable'] }
    };
  }

  private generateDefaultPrediction(): BestsellerPrediction {
    return {
      overallScore: 65,
      components: { conceptStrength: 70, marketTiming: 60, emotionalResonance: 65, uniqueness: 60, commercialAppeal: 65, wordOfMouthPotential: 70 },
      riskFactors: ['Market saturation', 'Competition'],
      opportunities: ['Unique setting', 'Strong character'],
      recommendedAdjustments: ['Strengthen opening', 'Add cliffhangers'],
      predictedPerformance: { worstCase: 'Below average sales', likelyCase: 'Average genre sales', bestCase: 'Bestseller entry' }
    };
  }
}

export default BestsellerEngine;
