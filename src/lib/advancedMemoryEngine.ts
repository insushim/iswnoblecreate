/**
 * Advanced Memory Engine - Long-term Novel Memory Management
 *
 * Manages:
 * - Character states and development arcs
 * - Plot threads and storylines
 * - World-building details
 * - Temporal consistency
 * - Relationship dynamics
 * - Thematic elements
 */

export interface CharacterMemory {
  id: string;
  name: string;
  aliases: string[];
  physicalDescription: {
    appearance: string[];
    clothing: string[];
    distinctiveFeatures: string[];
  };
  personality: {
    traits: string[];
    quirks: string[];
    speechPatterns: string[];
    values: string[];
  };
  background: {
    history: string[];
    secrets: string[];
    motivations: string[];
    fears: string[];
  };
  relationships: Map<string, RelationshipState>;
  currentState: {
    location: string;
    emotionalState: string;
    physicalCondition: string;
    knowledge: string[]; // What this character knows
    possessions: string[];
  };
  developmentArc: CharacterArcPoint[];
  lastUpdated: number;
}

export interface RelationshipState {
  targetCharacterId: string;
  type: 'family' | 'friend' | 'enemy' | 'lover' | 'acquaintance' | 'rival' | 'mentor' | 'other';
  sentiment: number; // -100 to 100
  history: RelationshipEvent[];
  dynamics: string[];
}

export interface RelationshipEvent {
  chapter: number;
  description: string;
  sentimentChange: number;
  timestamp: number;
}

export interface CharacterArcPoint {
  chapter: number;
  state: string;
  transformation: string;
  catalyst: string;
}

export interface PlotThread {
  id: string;
  name: string;
  type: 'main' | 'subplot' | 'background';
  status: 'setup' | 'rising' | 'climax' | 'falling' | 'resolved' | 'abandoned';
  involvedCharacters: string[];
  keyEvents: PlotEvent[];
  foreshadowing: string[];
  conflictType?: 'person_vs_person' | 'person_vs_self' | 'person_vs_nature' | 'person_vs_society' | 'person_vs_fate';
  stakes: string;
  resolution?: string;
}

export interface PlotEvent {
  chapter: number;
  description: string;
  consequences: string[];
  charactersInvolved: string[];
}

export interface WorldDetail {
  id: string;
  category: 'location' | 'culture' | 'history' | 'magic_system' | 'technology' | 'politics' | 'economy' | 'religion';
  name: string;
  description: string;
  rules: string[];
  connections: string[]; // Related world detail IDs
  firstMentioned: number;
  lastReferenced: number;
}

export interface TemporalMarker {
  chapter: number;
  inWorldTime: string;
  events: string[];
  weather?: string;
  seasonOrPeriod?: string;
}

export interface ThematicElement {
  theme: string;
  instances: ThemeInstance[];
  development: 'introduced' | 'developing' | 'reinforced' | 'challenged' | 'resolved';
}

export interface ThemeInstance {
  chapter: number;
  manifestation: string;
  subtlety: 'explicit' | 'implicit' | 'symbolic';
}

export interface MemoryQuery {
  type: 'character' | 'plot' | 'world' | 'temporal' | 'theme' | 'all';
  scope?: {
    chapters?: number[];
    characters?: string[];
    locations?: string[];
  };
  relevanceThreshold?: number;
}

export interface MemoryContext {
  characters: CharacterMemory[];
  plotThreads: PlotThread[];
  worldDetails: WorldDetail[];
  temporalContext: TemporalMarker[];
  themes: ThematicElement[];
  recentEvents: string[];
}

export class AdvancedMemoryEngine {
  private characters: Map<string, CharacterMemory> = new Map();
  private plotThreads: Map<string, PlotThread> = new Map();
  private worldDetails: Map<string, WorldDetail> = new Map();
  private timeline: TemporalMarker[] = [];
  private themes: Map<string, ThematicElement> = new Map();
  private currentChapter: number = 1;
  private chapterSummaries: Map<number, string> = new Map();

  constructor() {
    this.reset();
  }

  reset(): void {
    this.characters.clear();
    this.plotThreads.clear();
    this.worldDetails.clear();
    this.timeline = [];
    this.themes.clear();
    this.currentChapter = 1;
    this.chapterSummaries.clear();
  }

  // ==================== Character Management ====================

  addCharacter(character: Omit<CharacterMemory, 'relationships' | 'developmentArc' | 'lastUpdated'>): void {
    const fullCharacter: CharacterMemory = {
      ...character,
      relationships: new Map(),
      developmentArc: [],
      lastUpdated: Date.now()
    };
    this.characters.set(character.id, fullCharacter);
  }

  updateCharacterState(
    characterId: string,
    updates: Partial<CharacterMemory['currentState']>
  ): void {
    const character = this.characters.get(characterId);
    if (character) {
      character.currentState = { ...character.currentState, ...updates };
      character.lastUpdated = Date.now();
    }
  }

  addCharacterKnowledge(characterId: string, knowledge: string): void {
    const character = this.characters.get(characterId);
    if (character && !character.currentState.knowledge.includes(knowledge)) {
      character.currentState.knowledge.push(knowledge);
      character.lastUpdated = Date.now();
    }
  }

  updateRelationship(
    characterId: string,
    targetId: string,
    event: Omit<RelationshipEvent, 'timestamp'>
  ): void {
    const character = this.characters.get(characterId);
    if (!character) return;

    let relationship = character.relationships.get(targetId);
    if (!relationship) {
      relationship = {
        targetCharacterId: targetId,
        type: 'acquaintance',
        sentiment: 0,
        history: [],
        dynamics: []
      };
      character.relationships.set(targetId, relationship);
    }

    relationship.history.push({
      ...event,
      timestamp: Date.now()
    });
    relationship.sentiment = Math.max(-100, Math.min(100,
      relationship.sentiment + event.sentimentChange
    ));
  }

  addCharacterArcPoint(characterId: string, arcPoint: Omit<CharacterArcPoint, 'chapter'>): void {
    const character = this.characters.get(characterId);
    if (character) {
      character.developmentArc.push({
        ...arcPoint,
        chapter: this.currentChapter
      });
    }
  }

  getCharacter(characterId: string): CharacterMemory | undefined {
    return this.characters.get(characterId);
  }

  getCharacterByName(name: string): CharacterMemory | undefined {
    const charValues = Array.from(this.characters.values());
    return charValues.find(c =>
      c.name.toLowerCase() === name.toLowerCase() ||
      c.aliases.some(a => a.toLowerCase() === name.toLowerCase())
    );
  }

  // ==================== Plot Thread Management ====================

  addPlotThread(thread: Omit<PlotThread, 'keyEvents' | 'foreshadowing'>): void {
    const fullThread: PlotThread = {
      ...thread,
      keyEvents: [],
      foreshadowing: []
    };
    this.plotThreads.set(thread.id, fullThread);
  }

  updatePlotThreadStatus(threadId: string, status: PlotThread['status']): void {
    const thread = this.plotThreads.get(threadId);
    if (thread) {
      thread.status = status;
    }
  }

  addPlotEvent(threadId: string, event: Omit<PlotEvent, 'chapter'>): void {
    const thread = this.plotThreads.get(threadId);
    if (thread) {
      thread.keyEvents.push({
        ...event,
        chapter: this.currentChapter
      });
    }
  }

  addForeshadowing(threadId: string, hint: string): void {
    const thread = this.plotThreads.get(threadId);
    if (thread) {
      thread.foreshadowing.push(hint);
    }
  }

  getActivePlotThreads(): PlotThread[] {
    const allThreads = Array.from(this.plotThreads.values());
    return allThreads.filter(t =>
      t.status !== 'resolved' && t.status !== 'abandoned'
    );
  }

  getPlotThread(threadId: string): PlotThread | undefined {
    return this.plotThreads.get(threadId);
  }

  // ==================== World Building ====================

  addWorldDetail(detail: WorldDetail): void {
    this.worldDetails.set(detail.id, detail);
  }

  updateWorldDetail(detailId: string, updates: Partial<WorldDetail>): void {
    const detail = this.worldDetails.get(detailId);
    if (detail) {
      Object.assign(detail, updates);
      detail.lastReferenced = this.currentChapter;
    }
  }

  getWorldDetailsByCategory(category: WorldDetail['category']): WorldDetail[] {
    const allDetails = Array.from(this.worldDetails.values());
    return allDetails.filter(d => d.category === category);
  }

  // ==================== Timeline Management ====================

  addTemporalMarker(marker: Omit<TemporalMarker, 'chapter'>): void {
    this.timeline.push({
      ...marker,
      chapter: this.currentChapter
    });
  }

  getCurrentTimeContext(): TemporalMarker | undefined {
    return this.timeline[this.timeline.length - 1];
  }

  getTimelineForChapter(chapter: number): TemporalMarker | undefined {
    return this.timeline.find(t => t.chapter === chapter);
  }

  // ==================== Theme Management ====================

  addTheme(theme: string, initialManifestation?: Omit<ThemeInstance, 'chapter'>): void {
    const thematicElement: ThematicElement = {
      theme,
      instances: initialManifestation ? [{
        ...initialManifestation,
        chapter: this.currentChapter
      }] : [],
      development: 'introduced'
    };
    this.themes.set(theme, thematicElement);
  }

  addThemeInstance(theme: string, instance: Omit<ThemeInstance, 'chapter'>): void {
    const thematicElement = this.themes.get(theme);
    if (thematicElement) {
      thematicElement.instances.push({
        ...instance,
        chapter: this.currentChapter
      });
    }
  }

  updateThemeDevelopment(theme: string, development: ThematicElement['development']): void {
    const thematicElement = this.themes.get(theme);
    if (thematicElement) {
      thematicElement.development = development;
    }
  }

  // ==================== Chapter Management ====================

  setCurrentChapter(chapter: number): void {
    this.currentChapter = chapter;
  }

  getCurrentChapter(): number {
    return this.currentChapter;
  }

  addChapterSummary(chapter: number, summary: string): void {
    this.chapterSummaries.set(chapter, summary);
  }

  getChapterSummary(chapter: number): string | undefined {
    return this.chapterSummaries.get(chapter);
  }

  // ==================== Context Retrieval ====================

  /**
   * Get relevant memory context for generating new content
   */
  getContextForGeneration(query: MemoryQuery): MemoryContext {
    const context: MemoryContext = {
      characters: [],
      plotThreads: [],
      worldDetails: [],
      temporalContext: [],
      themes: [],
      recentEvents: []
    };

    // Get relevant characters
    if (query.type === 'character' || query.type === 'all') {
      if (query.scope?.characters) {
        for (const charId of query.scope.characters) {
          const char = this.characters.get(charId);
          if (char) context.characters.push(char);
        }
      } else {
        // Get recently updated characters
        const allChars = Array.from(this.characters.values());
        const sortedChars = allChars
          .sort((a, b) => b.lastUpdated - a.lastUpdated)
          .slice(0, 10);
        context.characters.push(...sortedChars);
      }
    }

    // Get active plot threads
    if (query.type === 'plot' || query.type === 'all') {
      context.plotThreads = this.getActivePlotThreads();
    }

    // Get relevant world details
    if (query.type === 'world' || query.type === 'all') {
      if (query.scope?.locations) {
        for (const locId of query.scope.locations) {
          const detail = this.worldDetails.get(locId);
          if (detail) context.worldDetails.push(detail);
        }
      } else {
        // Get recently referenced world details
        const allDetails = Array.from(this.worldDetails.values());
        const sortedDetails = allDetails
          .sort((a, b) => b.lastReferenced - a.lastReferenced)
          .slice(0, 10);
        context.worldDetails.push(...sortedDetails);
      }
    }

    // Get temporal context
    if (query.type === 'temporal' || query.type === 'all') {
      const current = this.getCurrentTimeContext();
      if (current) {
        context.temporalContext = [current];
      }
      // Add recent timeline events
      context.temporalContext.push(...this.timeline.slice(-5));
    }

    // Get themes
    if (query.type === 'theme' || query.type === 'all') {
      context.themes = Array.from(this.themes.values());
    }

    // Get recent events from all sources
    context.recentEvents = this.getRecentEvents();

    return context;
  }

  /**
   * Get recent events across all memory types
   */
  private getRecentEvents(): string[] {
    const events: string[] = [];

    // Recent plot events
    const allThreads = Array.from(this.plotThreads.values());
    for (const thread of allThreads) {
      const recentPlotEvents = thread.keyEvents
        .filter(e => e.chapter >= this.currentChapter - 2)
        .map(e => e.description);
      events.push(...recentPlotEvents);
    }

    // Recent character changes
    const allChars = Array.from(this.characters.values());
    for (const char of allChars) {
      const recentArc = char.developmentArc
        .filter(a => a.chapter >= this.currentChapter - 2)
        .map(a => `${char.name}: ${a.transformation}`);
      events.push(...recentArc);
    }

    return events.slice(0, 20);
  }

  /**
   * Generate a prompt addition with relevant context
   */
  generateContextPrompt(query: MemoryQuery): string {
    const context = this.getContextForGeneration(query);
    const parts: string[] = [];

    // Character context
    if (context.characters.length > 0) {
      parts.push('=== CHARACTER CONTEXT ===');
      for (const char of context.characters) {
        parts.push(`\n[${char.name}]`);
        parts.push(`Current location: ${char.currentState.location}`);
        parts.push(`Emotional state: ${char.currentState.emotionalState}`);
        parts.push(`Physical condition: ${char.currentState.physicalCondition}`);

        if (char.currentState.knowledge.length > 0) {
          parts.push(`Knows: ${char.currentState.knowledge.slice(-5).join('; ')}`);
        }

        // Key relationships
        const relArray = Array.from(char.relationships.entries());
        const significantRels = relArray.slice(0, 3);
        if (significantRels.length > 0) {
          const relStrings = significantRels.map(([targetId, rel]) => {
            const target = this.characters.get(targetId);
            const targetName = target?.name || targetId;
            const sentiment = rel.sentiment > 50 ? 'positive' :
                            rel.sentiment < -50 ? 'negative' : 'neutral';
            return `${targetName} (${rel.type}, ${sentiment})`;
          });
          parts.push(`Key relationships: ${relStrings.join(', ')}`);
        }
      }
    }

    // Plot context
    if (context.plotThreads.length > 0) {
      parts.push('\n=== ACTIVE PLOT THREADS ===');
      for (const thread of context.plotThreads) {
        parts.push(`\n[${thread.name}] - ${thread.status}`);
        parts.push(`Type: ${thread.type}, Stakes: ${thread.stakes}`);
        if (thread.keyEvents.length > 0) {
          const lastEvent = thread.keyEvents[thread.keyEvents.length - 1];
          parts.push(`Last event: ${lastEvent.description}`);
        }
        if (thread.foreshadowing.length > 0) {
          parts.push(`Planted foreshadowing: ${thread.foreshadowing.slice(-3).join('; ')}`);
        }
      }
    }

    // World context
    if (context.worldDetails.length > 0) {
      parts.push('\n=== WORLD CONTEXT ===');
      for (const detail of context.worldDetails.slice(0, 5)) {
        parts.push(`[${detail.name}] (${detail.category}): ${detail.description}`);
        if (detail.rules.length > 0) {
          parts.push(`Rules: ${detail.rules.join('; ')}`);
        }
      }
    }

    // Temporal context
    if (context.temporalContext.length > 0) {
      const current = context.temporalContext[0];
      parts.push('\n=== TEMPORAL CONTEXT ===');
      parts.push(`In-world time: ${current.inWorldTime}`);
      if (current.weather) parts.push(`Weather: ${current.weather}`);
      if (current.seasonOrPeriod) parts.push(`Season/Period: ${current.seasonOrPeriod}`);
    }

    // Theme context
    if (context.themes.length > 0) {
      parts.push('\n=== THEMATIC ELEMENTS ===');
      for (const theme of context.themes) {
        parts.push(`[${theme.theme}] - ${theme.development}`);
      }
    }

    // Recent events
    if (context.recentEvents.length > 0) {
      parts.push('\n=== RECENT EVENTS ===');
      parts.push(context.recentEvents.slice(0, 10).join('\n'));
    }

    return parts.join('\n');
  }

  /**
   * Check for consistency issues
   */
  checkConsistency(): ConsistencyIssue[] {
    const issues: ConsistencyIssue[] = [];

    // Check character location consistency
    const allChars = Array.from(this.characters.values());
    for (const char of allChars) {
      // Check if character knows things they shouldn't
      for (const knowledge of char.currentState.knowledge) {
        // This would need more sophisticated checks based on when info was revealed
      }
    }

    // Check plot thread consistency
    const allThreads = Array.from(this.plotThreads.values());
    for (const thread of allThreads) {
      // Check for abandoned threads
      if (thread.status === 'rising' && thread.keyEvents.length > 0) {
        const lastEvent = thread.keyEvents[thread.keyEvents.length - 1];
        if (this.currentChapter - lastEvent.chapter > 5) {
          issues.push({
            type: 'plot_abandoned',
            severity: 'medium',
            description: `Plot thread "${thread.name}" has not progressed in ${this.currentChapter - lastEvent.chapter} chapters`
          });
        }
      }

      // Check for unfired Chekhov's guns
      if (thread.foreshadowing.length > thread.keyEvents.length) {
        issues.push({
          type: 'unfired_foreshadowing',
          severity: 'low',
          description: `Plot thread "${thread.name}" has unresolved foreshadowing elements`
        });
      }
    }

    // Check temporal consistency
    for (let i = 1; i < this.timeline.length; i++) {
      const prev = this.timeline[i - 1];
      const curr = this.timeline[i];
      // Would need date parsing to check actual temporal consistency
    }

    return issues;
  }

  // ==================== Serialization ====================

  toJSON(): object {
    return {
      characters: Array.from(this.characters.entries()).map(([id, char]) => ({
        ...char,
        relationships: Array.from(char.relationships.entries())
      })),
      plotThreads: Array.from(this.plotThreads.entries()),
      worldDetails: Array.from(this.worldDetails.entries()),
      timeline: this.timeline,
      themes: Array.from(this.themes.entries()),
      currentChapter: this.currentChapter,
      chapterSummaries: Array.from(this.chapterSummaries.entries())
    };
  }

  fromJSON(data: ReturnType<AdvancedMemoryEngine['toJSON']>): void {
    this.reset();

    const typedData = data as {
      characters: Array<[string, CharacterMemory & { relationships: Array<[string, RelationshipState]> }]>;
      plotThreads: Array<[string, PlotThread]>;
      worldDetails: Array<[string, WorldDetail]>;
      timeline: TemporalMarker[];
      themes: Array<[string, ThematicElement]>;
      currentChapter: number;
      chapterSummaries: Array<[number, string]>;
    };

    // Restore characters
    for (const [id, charData] of typedData.characters) {
      const char: CharacterMemory = {
        ...charData,
        relationships: new Map(charData.relationships)
      };
      this.characters.set(id, char);
    }

    // Restore other data
    this.plotThreads = new Map(typedData.plotThreads);
    this.worldDetails = new Map(typedData.worldDetails);
    this.timeline = typedData.timeline;
    this.themes = new Map(typedData.themes);
    this.currentChapter = typedData.currentChapter;
    this.chapterSummaries = new Map(typedData.chapterSummaries);
  }
}

export interface ConsistencyIssue {
  type: 'character_location' | 'knowledge_leak' | 'plot_abandoned' | 'unfired_foreshadowing' | 'temporal_inconsistency';
  severity: 'low' | 'medium' | 'high';
  description: string;
}

// Export singleton instance
export const advancedMemoryEngine = new AdvancedMemoryEngine();
