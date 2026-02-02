/**
 * Foreshadowing Tracker - Manages plot foreshadowing elements
 * Plant -> Water -> Payoff lifecycle
 * Chekhov's Gun validation
 */

export type ForeshadowingType =
  | 'chekhov-gun'
  | 'character-hint'
  | 'plot-seed'
  | 'symbol'
  | 'prophecy'
  | 'red-herring'
  | 'callback'
  | 'thematic'
  | 'mystery-clue';

export type ForeshadowingStatus =
  | 'planted'
  | 'watered'
  | 'payoff-ready'
  | 'paid-off'
  | 'abandoned'
  | 'forgotten';

export interface ForeshadowingMention {
  chapterId: string;
  sceneId: string;
  chapterNumber: number;
  sceneOrder: number;
  mentionType: 'plant' | 'water' | 'payoff';
  context: string;
  subtlety: number;
  createdAt: Date;
}

export interface ForeshadowingPlan {
  id: string;
  projectId: string;
  title: string;
  description: string;
  type: ForeshadowingType;
  status: ForeshadowingStatus;
  importance: 'critical' | 'major' | 'minor' | 'easter-egg';

  plantPlan: {
    targetChapter: number;
    method: string;
    subtlety: number;
    context: string;
  };

  waterPlans: Array<{
    targetChapter: number;
    method: string;
    subtlety: number;
  }>;

  payoffPlan: {
    targetChapter: number;
    method: string;
    impact: 'shocking' | 'satisfying' | 'emotional' | 'humorous';
    buildup: string;
  };

  mentions: ForeshadowingMention[];
  relatedCharacters: string[];
  relatedLocations: string[];
  relatedItems: string[];
  connectedForeshadowings: string[];
  createdAt: Date;
  updatedAt: Date;
  notes: string;
}

export interface ForeshadowingStats {
  total: number;
  planted: number;
  watered: number;
  paidOff: number;
  forgotten: number;
  redHerrings: number;
  chekhovViolations: string[];
}

export interface ForeshadowingIssue {
  type: 'chekhov-violation' | 'orphan-payoff' | 'too-obvious' | 'forgotten' | 'overcrowded';
  severity: 'critical' | 'warning' | 'info';
  foreshadowingId: string;
  message: string;
  suggestion: string;
}

export class ForeshadowingTracker {
  private foreshadowings: Map<string, ForeshadowingPlan> = new Map();
  private projectId: string;

  constructor(projectId: string) {
    this.projectId = projectId;
  }

  loadForeshadowings(plans: ForeshadowingPlan[]): void {
    this.foreshadowings.clear();
    for (const plan of plans) {
      this.foreshadowings.set(plan.id, plan);
    }
  }

  createForeshadowing(
    plan: Omit<ForeshadowingPlan, 'id' | 'createdAt' | 'updatedAt' | 'mentions'>
  ): ForeshadowingPlan {
    const now = new Date();
    const newPlan: ForeshadowingPlan = {
      ...plan,
      id: crypto.randomUUID(),
      mentions: [],
      createdAt: now,
      updatedAt: now,
    };
    this.foreshadowings.set(newPlan.id, newPlan);
    return newPlan;
  }

  recordPlant(
    foreshadowingId: string,
    chapterId: string,
    sceneId: string,
    chapterNumber: number,
    sceneOrder: number,
    context: string,
    subtlety: number
  ): ForeshadowingPlan | null {
    const plan = this.foreshadowings.get(foreshadowingId);
    if (!plan) return null;

    const mention: ForeshadowingMention = {
      chapterId,
      sceneId,
      chapterNumber,
      sceneOrder,
      mentionType: 'plant',
      context,
      subtlety,
      createdAt: new Date(),
    };

    plan.mentions.push(mention);
    plan.status = 'planted';
    plan.updatedAt = new Date();
    return plan;
  }

  recordWater(
    foreshadowingId: string,
    chapterId: string,
    sceneId: string,
    chapterNumber: number,
    sceneOrder: number,
    context: string,
    subtlety: number
  ): ForeshadowingPlan | null {
    const plan = this.foreshadowings.get(foreshadowingId);
    if (!plan) return null;

    const mention: ForeshadowingMention = {
      chapterId,
      sceneId,
      chapterNumber,
      sceneOrder,
      mentionType: 'water',
      context,
      subtlety,
      createdAt: new Date(),
    };

    plan.mentions.push(mention);
    plan.status = 'watered';
    plan.updatedAt = new Date();
    return plan;
  }

  recordPayoff(
    foreshadowingId: string,
    chapterId: string,
    sceneId: string,
    chapterNumber: number,
    sceneOrder: number,
    context: string
  ): ForeshadowingPlan | null {
    const plan = this.foreshadowings.get(foreshadowingId);
    if (!plan) return null;

    const mention: ForeshadowingMention = {
      chapterId,
      sceneId,
      chapterNumber,
      sceneOrder,
      mentionType: 'payoff',
      context,
      subtlety: 1,
      createdAt: new Date(),
    };

    plan.mentions.push(mention);
    plan.status = 'paid-off';
    plan.updatedAt = new Date();
    return plan;
  }

  checkThreeTimeRule(foreshadowingId: string): {
    passes: boolean;
    mentionCount: number;
    recommendation: string;
  } {
    const plan = this.foreshadowings.get(foreshadowingId);
    if (!plan) {
      return {
        passes: false,
        mentionCount: 0,
        recommendation: 'Foreshadowing not found.',
      };
    }

    const prePayoffMentions = plan.mentions.filter(m => m.mentionType !== 'payoff');
    const count = prePayoffMentions.length;

    const minMentions = {
      'critical': 4,
      'major': 3,
      'minor': 2,
      'easter-egg': 1,
    };

    const required = minMentions[plan.importance];
    const passes = count >= required;

    let recommendation = '';
    if (!passes) {
      const needed = required - count;
      recommendation = `"${plan.title}" needs ${needed} more mentions before payoff.`;
    } else {
      recommendation = 'Ready for payoff.';
    }

    return { passes, mentionCount: count, recommendation };
  }

  validateChekhovGun(currentChapter: number, totalChapters: number): ForeshadowingIssue[] {
    const issues: ForeshadowingIssue[] = [];
    const progressPercent = (currentChapter / totalChapters) * 100;

    const allPlans = Array.from(this.foreshadowings.values());
    for (const plan of allPlans) {
      if (plan.type === 'red-herring') continue;

      const isPlanted = plan.mentions.some(m => m.mentionType === 'plant');
      const isPaidOff = plan.status === 'paid-off';

      if (isPlanted && !isPaidOff) {
        const expectedPayoffChapter = plan.payoffPlan.targetChapter;
        const isOverdue = currentChapter > expectedPayoffChapter;
        const isNearEnd = progressPercent > 80;

        if (isOverdue) {
          issues.push({
            type: 'chekhov-violation',
            severity: 'critical',
            foreshadowingId: plan.id,
            message: `"${plan.title}" should have been paid off by chapter ${expectedPayoffChapter}`,
            suggestion: 'Pay off immediately or reschedule',
          });
        } else if (isNearEnd && plan.importance === 'critical') {
          issues.push({
            type: 'chekhov-violation',
            severity: 'warning',
            foreshadowingId: plan.id,
            message: `"${plan.title}" (critical) still unpaid at 80% progress`,
            suggestion: 'Ensure payoff in final chapters',
          });
        }
      }
    }

    return issues;
  }

  getActiveForeshadowings(currentChapter: number): ForeshadowingPlan[] {
    return Array.from(this.foreshadowings.values()).filter(plan => {
      const isPlanted = plan.mentions.some(m => m.mentionType === 'plant');
      const isPaidOff = plan.status === 'paid-off';
      return isPlanted && !isPaidOff;
    });
  }

  getWateringRecommendations(currentChapter: number): Array<{
    plan: ForeshadowingPlan;
    urgency: 'high' | 'medium' | 'low';
    reason: string;
  }> {
    const recommendations: Array<{
      plan: ForeshadowingPlan;
      urgency: 'high' | 'medium' | 'low';
      reason: string;
    }> = [];

    const allPlansForWater = Array.from(this.foreshadowings.values());
    for (const plan of allPlansForWater) {
      if (plan.status === 'paid-off') continue;

      for (const waterPlan of plan.waterPlans) {
        if (waterPlan.targetChapter === currentChapter) {
          recommendations.push({
            plan,
            urgency: 'high',
            reason: `Scheduled watering in chapter ${currentChapter}`,
          });
        } else if (waterPlan.targetChapter === currentChapter + 1) {
          recommendations.push({
            plan,
            urgency: 'medium',
            reason: 'Watering scheduled for next chapter',
          });
        }
      }

      const threeTimeCheck = this.checkThreeTimeRule(plan.id);
      if (!threeTimeCheck.passes && plan.payoffPlan.targetChapter - currentChapter <= 3) {
        recommendations.push({
          plan,
          urgency: 'high',
          reason: threeTimeCheck.recommendation,
        });
      }
    }

    return recommendations;
  }

  getPayoffReadyForeshadowings(currentChapter: number): ForeshadowingPlan[] {
    return Array.from(this.foreshadowings.values()).filter(plan => {
      if (plan.status === 'paid-off') return false;
      if (plan.payoffPlan.targetChapter === currentChapter) return true;
      const threeTimeCheck = this.checkThreeTimeRule(plan.id);
      return threeTimeCheck.passes && plan.status === 'payoff-ready';
    });
  }

  getStats(): ForeshadowingStats {
    const stats: ForeshadowingStats = {
      total: this.foreshadowings.size,
      planted: 0,
      watered: 0,
      paidOff: 0,
      forgotten: 0,
      redHerrings: 0,
      chekhovViolations: [],
    };

    const allPlansForStats = Array.from(this.foreshadowings.values());
    for (const plan of allPlansForStats) {
      switch (plan.status) {
        case 'planted':
          stats.planted++;
          break;
        case 'watered':
        case 'payoff-ready':
          stats.watered++;
          break;
        case 'paid-off':
          stats.paidOff++;
          break;
        case 'forgotten':
          stats.forgotten++;
          stats.chekhovViolations.push(plan.id);
          break;
      }
      if (plan.type === 'red-herring') {
        stats.redHerrings++;
      }
    }

    return stats;
  }

  generateForeshadowingGuidelines(currentChapter: number, currentScene: number): string {
    const active = this.getActiveForeshadowings(currentChapter);
    const waterRecs = this.getWateringRecommendations(currentChapter);
    const payoffReady = this.getPayoffReadyForeshadowings(currentChapter);

    let guidelines = `\n## Foreshadowing Guide (Ch.${currentChapter} Sc.${currentScene})\n\n`;

    if (active.length > 0) {
      guidelines += `### Active Foreshadowings (${active.length})\n`;
      for (const plan of active) {
        const mentionCount = plan.mentions.length;
        guidelines += `- **${plan.title}** [${plan.type}] - ${mentionCount} mentions\n`;
        guidelines += `  - ${plan.description}\n`;
      }
      guidelines += '\n';
    }

    if (waterRecs.length > 0) {
      guidelines += `### Reinforce This Chapter\n`;
      for (const rec of waterRecs) {
        const urgencyMark = rec.urgency === 'high' ? '[URGENT]' :
                            rec.urgency === 'medium' ? '[RECOMMENDED]' : '[OPTIONAL]';
        guidelines += `${urgencyMark} **${rec.plan.title}**: ${rec.reason}\n`;
      }
      guidelines += '\n';
    }

    if (payoffReady.length > 0) {
      guidelines += `### Ready for Payoff\n`;
      for (const plan of payoffReady) {
        guidelines += `- **${plan.title}**: ${plan.payoffPlan.method}\n`;
        guidelines += `  - Impact: ${plan.payoffPlan.impact}\n`;
      }
      guidelines += '\n';
    }

    return guidelines;
  }

  generateSceneChecklist(chapterId: string, sceneId: string, currentChapter: number): string[] {
    const checklist: string[] = [];

    const allPlansForChecklist = Array.from(this.foreshadowings.values());
    for (const plan of allPlansForChecklist) {
      if (plan.plantPlan.targetChapter === currentChapter && plan.status !== 'planted') {
        checklist.push(`[PLANT] "${plan.title}" - Method: ${plan.plantPlan.method}`);
      }
    }

    const waterRecs = this.getWateringRecommendations(currentChapter).filter(r => r.urgency === 'high');
    for (const rec of waterRecs) {
      checklist.push(`[WATER] "${rec.plan.title}" - ${rec.reason}`);
    }

    const payoffReady = this.getPayoffReadyForeshadowings(currentChapter);
    for (const plan of payoffReady) {
      if (plan.payoffPlan.targetChapter === currentChapter) {
        checklist.push(`[PAYOFF] "${plan.title}" - Impact: ${plan.payoffPlan.impact}`);
      }
    }

    return checklist;
  }

  getAllForeshadowings(): ForeshadowingPlan[] {
    return Array.from(this.foreshadowings.values());
  }

  getForeshadowing(id: string): ForeshadowingPlan | undefined {
    return this.foreshadowings.get(id);
  }

  updateForeshadowing(id: string, updates: Partial<ForeshadowingPlan>): ForeshadowingPlan | null {
    const plan = this.foreshadowings.get(id);
    if (!plan) return null;

    const updated = {
      ...plan,
      ...updates,
      updatedAt: new Date(),
    };
    this.foreshadowings.set(id, updated);
    return updated;
  }

  deleteForeshadowing(id: string): boolean {
    return this.foreshadowings.delete(id);
  }
}

export const FORESHADOWING_TEMPLATES: Record<ForeshadowingType, {
  name: string;
  description: string;
  plantingTips: string[];
  wateringTips: string[];
  payoffTips: string[];
}> = {
  'chekhov-gun': {
    name: "Chekhov's Gun",
    description: 'Item/character introduced early becomes crucial later',
    plantingTips: ['Hide in background description', 'Mention casually'],
    wateringTips: ['Brief reminder', 'Different context'],
    payoffTips: ['Decisive moment', 'Clear connection'],
  },
  'character-hint': {
    name: 'Character Hint',
    description: 'Subtle hints about hidden nature or past',
    plantingTips: ['Subtle behavior patterns', 'Small inconsistencies'],
    wateringTips: ['Similar patterns repeat', 'Other reactions'],
    payoffTips: ['Truth revealed', 'All hints connect'],
  },
  'plot-seed': {
    name: 'Plot Seed',
    description: 'Small element foreshadowing future events',
    plantingTips: ['Casual dialogue', 'Environmental detail'],
    wateringTips: ['Related small events', 'Different perspectives'],
    payoffTips: ['Event occurs', 'Causal link clear'],
  },
  'symbol': {
    name: 'Symbol/Motif',
    description: 'Recurring image reinforcing theme',
    plantingTips: ['Visual image', 'Character-linked object'],
    wateringTips: ['Variations', 'New contexts'],
    payoffTips: ['Climax completion', 'Unified meaning'],
  },
  'prophecy': {
    name: 'Prophecy',
    description: 'Direct future hints',
    plantingTips: ['Ambiguous wording', 'Multiple interpretations'],
    wateringTips: ['Partial fulfillment', 'Different interpretations'],
    payoffTips: ['Unexpected fulfillment', 'Ironic completion'],
  },
  'red-herring': {
    name: 'Red Herring',
    description: 'Intentional misdirection',
    plantingTips: ['Plant like real foreshadowing', 'Plausible evidence'],
    wateringTips: ['Add evidence', 'Hide real clues'],
    payoffTips: ['Reveal with twist', 'Explain misdirection'],
  },
  'callback': {
    name: 'Callback',
    description: 'Earlier scene/dialogue gains new meaning',
    plantingTips: ['Memorable line', 'Distinctive phrase'],
    wateringTips: ['Similar situations', 'Contrasting context'],
    payoffTips: ['Decisive callback', 'Emotional resonance'],
  },
  'thematic': {
    name: 'Thematic Foreshadowing',
    description: 'Theme reinforcement through parallel stories',
    plantingTips: ['Mini-story episodes', 'Secondary character experiences'],
    wateringTips: ['Different scales', 'Protagonist connection grows'],
    payoffTips: ['Protagonist embodies theme', 'All variations unite'],
  },
  'mystery-clue': {
    name: 'Mystery Clue',
    description: 'Key hints for puzzle resolution',
    plantingTips: ['Hide among info', 'Seem unimportant'],
    wateringTips: ['New context', 'Partial connections'],
    payoffTips: ['Detective reasoning', 'Fair play satisfaction'],
  },
};

export function suggestPlantingMethod(type: ForeshadowingType, subtlety: number): string[] {
  const template = FORESHADOWING_TEMPLATES[type];
  const suggestions: string[] = [];

  if (subtlety >= 4) {
    suggestions.push('Weave into background naturally');
    suggestions.push('Mention during other important dialogue');
    suggestions.push('Express through unconscious behavior');
  } else if (subtlety >= 2) {
    suggestions.push('Character dialogue indirect mention');
    suggestions.push('Brief independent scene');
    suggestions.push('Other character POV observation');
  } else {
    suggestions.push('Direct scene emphasis');
    suggestions.push('Narrator explicit mention');
    suggestions.push('Multiple character reactions');
  }

  suggestions.push(...template.plantingTips);
  return suggestions;
}

export function createRedHerring(
  projectId: string,
  targetMystery: string,
  misdirection: string
): Partial<ForeshadowingPlan> {
  return {
    projectId,
    type: 'red-herring',
    title: `[Red Herring] ${misdirection}`,
    description: `Truth: Hide ${targetMystery} by misdirecting to ${misdirection}`,
    status: 'planted',
    importance: 'minor',
    plantPlan: {
      targetChapter: 0,
      method: 'Present plausible evidence/motive',
      subtlety: 2,
      context: '',
    },
    waterPlans: [{
      targetChapter: 0,
      method: 'Reinforce with additional evidence',
      subtlety: 2,
    }],
    payoffPlan: {
      targetChapter: 0,
      method: 'Reveal truth and invalidate red herring',
      impact: 'shocking',
      buildup: 'When reader fully believes',
    },
    relatedCharacters: [],
    relatedLocations: [],
    relatedItems: [],
    connectedForeshadowings: [],
    notes: 'Warning: Too obvious backfires. Guide reader to deduce themselves.',
  };
}

export function analyzeForeshadowingDensity(
  plans: ForeshadowingPlan[],
  totalChapters: number
): Map<number, { count: number; overloaded: boolean; plans: ForeshadowingPlan[] }> {
  const density = new Map<number, { count: number; overloaded: boolean; plans: ForeshadowingPlan[] }>();

  for (let i = 1; i <= totalChapters; i++) {
    density.set(i, { count: 0, overloaded: false, plans: [] });
  }

  for (const plan of plans) {
    const plantChapter = plan.plantPlan.targetChapter;
    if (plantChapter && density.has(plantChapter)) {
      const data = density.get(plantChapter)!;
      data.count++;
      data.plans.push(plan);
    }

    for (const water of plan.waterPlans) {
      if (water.targetChapter && density.has(water.targetChapter)) {
        const data = density.get(water.targetChapter)!;
        data.count++;
        data.plans.push(plan);
      }
    }

    const payoffChapter = plan.payoffPlan.targetChapter;
    if (payoffChapter && density.has(payoffChapter)) {
      const data = density.get(payoffChapter)!;
      data.count++;
      data.plans.push(plan);
    }
  }

  const densityEntries = Array.from(density.entries());
  for (const [, data] of densityEntries) {
    if (data.count >= 5) {
      data.overloaded = true;
    }
  }

  return density;
}

export default ForeshadowingTracker;
