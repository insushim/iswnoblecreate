// 씬 파서 - 소설 텍스트를 씬 단위로 분석하고 분할

export interface ParsedScene {
  id: string;
  number: number;
  title: string;
  content: string;
  wordCount: number;
  characterCount: number;
  startLine: number;
  endLine: number;
  previousSceneId?: string;
  nextSceneId?: string;
  characters: string[];
  locations: string[];
  timeMarkers: string[];
  keyEvents: string[];
  issues: SceneIssue[];
  status: 'ok' | 'warning' | 'error';
}

export interface SceneIssue {
  type: 'continuity' | 'character' | 'timeline' | 'logic' | 'duplicate' | 'incomplete';
  severity: 'error' | 'warning' | 'info';
  description: string;
  suggestion?: string;
  position?: { start: number; end: number };
}

export interface SceneBreakpoint {
  type: 'scene_break' | 'chapter_break' | 'pov_change' | 'time_skip' | 'location_change';
  position: number;
  lineNumber: number;
  marker?: string;
}

export interface ParseResult {
  scenes: ParsedScene[];
  breakpoints: SceneBreakpoint[];
  totalWordCount: number;
  totalCharacterCount: number;
  issues: SceneIssue[];
}

const SCENE_BREAK_PATTERNS = [
  /^[\s]*\*{3,}[\s]*$/m,
  /^[\s]*#{3,}[\s]*$/m,
  /^[\s]*-{3,}[\s]*$/m,
  /^[\s]*~{3,}[\s]*$/m,
];

export function parseNovelIntoScenes(text: string): ParseResult {
  const lines = text.split('\n');
  const breakpoints = findBreakpoints(lines);
  const scenes = extractScenes(text, lines, breakpoints);
  const globalIssues = analyzeGlobalIssues(scenes);

  let totalWords = 0;
  let totalChars = 0;
  for (const s of scenes) {
    totalWords += s.wordCount;
    totalChars += s.characterCount;
  }

  return {
    scenes,
    breakpoints,
    totalWordCount: totalWords,
    totalCharacterCount: totalChars,
    issues: globalIssues,
  };
}

function findBreakpoints(lines: string[]): SceneBreakpoint[] {
  const breakpoints: SceneBreakpoint[] = [];
  let charPosition = 0;

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex];
    for (const pattern of SCENE_BREAK_PATTERNS) {
      if (pattern.test(line)) {
        breakpoints.push({
          type: 'scene_break',
          position: charPosition,
          lineNumber: lineIndex + 1,
          marker: line.trim(),
        });
        break;
      }
    }
    charPosition += line.length + 1;
  }

  return breakpoints;
}

function extractScenes(text: string, lines: string[], breakpoints: SceneBreakpoint[]): ParsedScene[] {
  const scenes: ParsedScene[] = [];
  const sceneBreaks = breakpoints.filter(bp => bp.type === 'scene_break');

  if (sceneBreaks.length === 0) {
    const content = text.trim();
    if (content.length > 0) {
      scenes.push(createScene(1, content, 1, lines.length));
    }
    return scenes;
  }

  const firstBreakLine = sceneBreaks[0].lineNumber;
  if (firstBreakLine > 1) {
    const content = lines.slice(0, firstBreakLine - 1).join('\n').trim();
    if (content.length > 0) {
      scenes.push(createScene(1, content, 1, firstBreakLine - 1));
    }
  }

  for (let i = 0; i < sceneBreaks.length; i++) {
    const startLine = sceneBreaks[i].lineNumber;
    const endLine = sceneBreaks[i + 1]?.lineNumber ?? lines.length + 1;
    const content = lines.slice(startLine, endLine - 1).join('\n').trim();
    if (content.length > 0) {
      scenes.push(createScene(scenes.length + 1, content, startLine + 1, endLine - 1));
    }
  }

  for (let i = 0; i < scenes.length; i++) {
    if (i > 0) scenes[i].previousSceneId = scenes[i - 1].id;
    if (i < scenes.length - 1) scenes[i].nextSceneId = scenes[i + 1].id;
  }

  return scenes;
}

function createScene(number: number, content: string, startLine: number, endLine: number): ParsedScene {
  const characters = extractCharacters(content);
  const locations = extractLocations(content);
  const issues = analyzeSceneIssues(content);

  return {
    id: `scene-${number}-${Date.now()}`,
    number,
    title: `씬 ${number}`,
    content,
    wordCount: content.replace(/\s/g, '').length,
    characterCount: content.length,
    startLine,
    endLine,
    characters,
    locations,
    timeMarkers: [],
    keyEvents: [],
    issues,
    status: issues.some(i => i.severity === 'error') ? 'error' :
            issues.some(i => i.severity === 'warning') ? 'warning' : 'ok',
  };
}

function extractCharacters(content: string): string[] {
  const characters: string[] = [];
  const pattern = /([가-힣]{2,4})(이|가|은|는|을|를)/g;
  let match;
  const seen = new Set<string>();

  while ((match = pattern.exec(content)) !== null) {
    const name = match[1];
    if (!seen.has(name) && !isCommonNoun(name)) {
      seen.add(name);
      characters.push(name);
    }
  }
  return characters;
}

function isCommonNoun(word: string): boolean {
  const common = ['그것', '이것', '저것', '무엇', '사람', '남자', '여자', '순간', '시간', '마음', '생각'];
  return common.includes(word);
}

function extractLocations(content: string): string[] {
  const locations: string[] = [];
  const patterns = [
    /([\w가-힣]+\s*(성|궁|관|부|진|고개|강|산|마을))/g,
  ];

  const seen = new Set<string>();
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      if (!seen.has(match[1])) {
        seen.add(match[1]);
        locations.push(match[1]);
      }
    }
  }
  return locations;
}

function analyzeSceneIssues(content: string): SceneIssue[] {
  const issues: SceneIssue[] = [];

  if (content.length < 500) {
    issues.push({
      type: 'incomplete',
      severity: 'warning',
      description: '씬이 너무 짧습니다 (500자 미만)',
      suggestion: '씬을 더 상세하게 작성하거나 다른 씬과 병합을 고려하세요.',
    });
  }

  if (content.length > 10000) {
    issues.push({
      type: 'incomplete',
      severity: 'info',
      description: '씬이 매우 깁니다 (10000자 초과)',
      suggestion: '씬을 분할하는 것을 고려하세요.',
    });
  }

  return issues;
}

function analyzeGlobalIssues(scenes: ParsedScene[]): SceneIssue[] {
  const issues: SceneIssue[] = [];

  if (scenes.length < 2) return issues;

  for (let i = 0; i < scenes.length - 1; i++) {
    for (let j = i + 1; j < scenes.length; j++) {
      const similarity = calculateSimilarity(scenes[i].content, scenes[j].content);
      if (similarity > 0.5) {
        issues.push({
          type: 'duplicate',
          severity: 'error',
          description: `씬 ${i + 1}과 씬 ${j + 1}이 유사합니다 (${Math.round(similarity * 100)}% 유사도)`,
          suggestion: '중복 내용을 제거하거나 재작성하세요.',
        });
      }
    }
  }

  return issues;
}

function calculateSimilarity(text1: string, text2: string): number {
  const words1 = new Set(text1.match(/[가-힣]+/g) || []);
  const words2 = new Set(text2.match(/[가-힣]+/g) || []);

  let intersection = 0;
  words1.forEach(w => { if (words2.has(w)) intersection++; });

  const unionSize = words1.size + words2.size - intersection;
  if (unionSize === 0) return 0;
  return intersection / unionSize;
}

export function combineScenesToText(scenes: ParsedScene[], separator: string = '\n\n***\n\n'): string {
  return scenes.map(s => s.content).join(separator);
}

export function replaceScene(scenes: ParsedScene[], sceneId: string, newContent: string): ParsedScene[] {
  return scenes.map(scene => {
    if (scene.id === sceneId) {
      return createScene(scene.number, newContent, scene.startLine, scene.endLine);
    }
    return scene;
  });
}

export function deleteScene(scenes: ParsedScene[], sceneId: string): ParsedScene[] {
  const filtered = scenes.filter(s => s.id !== sceneId);
  return filtered.map((scene, index) => ({
    ...scene,
    number: index + 1,
  }));
}

export function insertScene(scenes: ParsedScene[], afterSceneId: string, newContent: string): ParsedScene[] {
  const index = scenes.findIndex(s => s.id === afterSceneId);
  if (index === -1) return scenes;

  const newScene = createScene(index + 2, newContent, 0, 0);
  const result = [...scenes.slice(0, index + 1), newScene, ...scenes.slice(index + 1)];

  return result.map((scene, i) => ({
    ...scene,
    number: i + 1,
  }));
}

export function reorderScenes(scenes: ParsedScene[], sceneId: string, newIndex: number): ParsedScene[] {
  const currentIndex = scenes.findIndex(s => s.id === sceneId);
  if (currentIndex === -1 || newIndex < 0 || newIndex >= scenes.length) return scenes;

  const result = [...scenes];
  const [removed] = result.splice(currentIndex, 1);
  result.splice(newIndex, 0, removed);

  return result.map((scene, i) => ({
    ...scene,
    number: i + 1,
  }));
}
