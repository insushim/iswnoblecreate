// 프로젝트 타입 정의
export interface Project {
  id: string;
  title: string;
  subtitle?: string;
  concept: string;
  logline: string;
  synopsis: string;
  detailedSynopsis?: string;
  genre: string[];
  subGenre?: string[];
  targetAudience: string;
  ageRating: 'all' | 'teen' | 'adult';
  keywords: string[];
  similarWorks?: string[];
  status: 'idea' | 'planning' | 'writing' | 'editing' | 'completed';
  seriesId?: string;
  seriesOrder?: number;
  createdAt: Date;
  updatedAt: Date;
  settings: ProjectSettings;
  stats: ProjectStats;
  goals: WritingGoals;
}

// 프로젝트 설정
export interface ProjectSettings {
  writingStyle: 'calm' | 'elaborate' | 'concise' | 'lyrical' | 'tense' | 'humorous' | 'custom';
  customStylePrompt?: string;
  referenceStyle?: string;
  perspective: 'first' | 'third-limited' | 'omniscient' | 'second';
  perspectiveCharacterId?: string;
  tense: 'past' | 'present';
  tone?: string;
  dialogueRatio: number;
  descriptionDetail: number;
  pacingPreference: 'slow' | 'moderate' | 'fast';
  emotionIntensity: number;
  targetChapterCount?: number;
  targetChapterLength: number;
  targetSceneLength?: number;
  targetTotalLength?: number;
  language: 'ko' | 'en';
  autoSaveInterval: number;
}

// 글쓰기 목표
export interface WritingGoals {
  dailyWordCount: number;
  weeklyWordCount?: number;
  deadline?: Date;
  deadlineType?: 'contest' | 'personal' | 'publication';
  contestName?: string;
  milestones: Milestone[];
}

// 마일스톤
export interface Milestone {
  id: string;
  title: string;
  targetDate: Date;
  targetWordCount?: number;
  targetChapter?: number;
  completed: boolean;
  completedAt?: Date;
}

// 프로젝트 통계
export interface ProjectStats {
  totalWords: number;
  totalCharacters: number;
  chaptersCompleted: number;
  chaptersTotal: number;
  averageWordsPerChapter: number;
  writingDays: number;
  totalWritingTime: number;
  averageWordsPerDay: number;
  lastWritingSession?: Date;
  longestStreak: number;
  currentStreak: number;
}

// 세계관
export interface WorldSetting {
  id: string;
  projectId: string;
  category: 'time' | 'space' | 'society' | 'culture' | 'economy' | 'politics' | 'religion' | 'technology' | 'magic' | 'nature' | 'history' | 'language' | 'custom';
  title: string;
  description: string;
  details: Record<string, string>;
  importance: 'core' | 'major' | 'minor';
  relatedSettings?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// 용어 사전
export interface DictionaryEntry {
  id: string;
  projectId: string;
  term: string;
  definition: string;
  category: string;
  pronunciation?: string;
  aliases?: string[];
  relatedTerms?: string[];
  firstAppearance?: string;
  createdAt: Date;
}

// 장소
export interface Location {
  id: string;
  projectId: string;
  name: string;
  type: 'country' | 'city' | 'building' | 'room' | 'natural' | 'fictional' | 'other';
  description: string;
  atmosphere: string;
  significance: string;
  parentLocationId?: string;
  connectedLocations?: string[];
  coordinates?: { x: number; y: number };
  imageUrl?: string;
  createdAt: Date;
}

// 캐릭터
export interface Character {
  id: string;
  projectId: string;
  name: string;
  fullName?: string;
  nickname?: string[];
  role: 'protagonist' | 'antagonist' | 'deuteragonist' | 'supporting' | 'minor' | 'mentioned';
  age: number | string;
  birthday?: string;
  gender: string;
  occupation?: string;
  appearance: string;
  physicalTraits?: string[];
  personality: string;
  mbti?: string;
  enneagram?: string;
  temperament?: string;
  background: string;
  familyBackground?: string;
  motivation: string;
  goal: string;
  internalGoal?: string;
  fear?: string;
  secret?: string;
  lie?: string;
  strengths: string[];
  weaknesses: string[];
  skills?: string[];
  habits?: string[];
  quirks?: string[];
  speechStyle?: string;
  speechPattern: SpeechPattern;
  arc: CharacterArc;
  relationships: Relationship[];
  emotionalState: EmotionalState[];
  firstAppearance?: string;
  imageUrl?: string;
  color?: string;
  createdAt: Date;
  updatedAt: Date;
}

// 말투 패턴
export interface SpeechPattern {
  formalityLevel: number;
  speechSpeed: 'slow' | 'normal' | 'fast';
  vocabularyLevel: 'simple' | 'average' | 'complex';
  tone: string;
  catchphrase?: string[];
  dialect?: string;
  speechHabits?: string[];
  avoidWords?: string[];
  sampleDialogues?: string[];
}

// 캐릭터 아크
export interface CharacterArc {
  type: 'positive' | 'negative' | 'flat' | 'corruption' | 'disillusionment';
  startingState: string;
  endingState: string;
  keyMoments: ArcMoment[];
  transformationTrigger?: string;
}

// 아크 주요 순간
export interface ArcMoment {
  id: string;
  sceneId?: string;
  description: string;
  stage: 'beginning' | 'catalyst' | 'struggle' | 'climax' | 'resolution';
  emotionalImpact: string;
}

// 감정 상태
export interface EmotionalState {
  sceneId: string;
  primaryEmotion: string;
  secondaryEmotion?: string;
  intensity: number;
  trigger?: string;
  note?: string;
}

// 관계
export interface Relationship {
  targetId: string;
  type: 'family' | 'friend' | 'rival' | 'love' | 'enemy' | 'colleague' | 'mentor' | 'student' | 'business' | 'other';
  subtype?: string;
  description: string;
  dynamicDescription?: string;
  startingRelation: string;
  currentRelation: string;
  tension?: number;
  evolution?: RelationshipEvolution[];
}

// 관계 변화 추적
export interface RelationshipEvolution {
  sceneId: string;
  description: string;
  relationBefore: string;
  relationAfter: string;
}

// 플롯 구조
export interface PlotStructure {
  id: string;
  projectId: string;
  template: 'three-act' | 'hero-journey' | 'seven-point' | 'kishotenketsu' | 'freytag' | 'save-the-cat' | 'mystery' | 'romance' | 'custom';
  customTemplate?: CustomTemplate;
  stages?: PlotStage[];
  plotPoints: PlotPoint[];
  subplots: Subplot[];
  updatedAt: Date;
}

// 플롯 포인트
export interface PlotPoint {
  id: string;
  title: string;
  description: string;
  type: 'opening' | 'inciting-incident' | 'first-plot-point' | 'rising-action' | 'midpoint' | 'second-plot-point' | 'climax' | 'resolution' | 'custom';
  stage: string;
  chapterId?: string;
  sceneId?: string;
  order: number;
  completed: boolean;
}

// 사용자 정의 템플릿
export interface CustomTemplate {
  name: string;
  description: string;
  stages: { name: string; description: string; percentage: number }[];
}

// 플롯 단계
export interface PlotStage {
  id: string;
  name: string;
  description: string;
  purpose: string;
  targetPercentage: number;
  chapters: string[];
  order: number;
  status: 'planned' | 'in-progress' | 'completed';
}

// 서브플롯
export interface Subplot {
  id: string;
  title: string;
  description: string;
  type: 'romance' | 'mystery' | 'character-growth' | 'theme' | 'comic-relief' | 'other';
  mainCharacters: string[];
  connectionToMain: string;
  startChapter?: string;
  endChapter?: string;
  status: 'active' | 'resolved' | 'abandoned';
  beats: SubplotBeat[];
}

// 서브플롯 비트
export interface SubplotBeat {
  id: string;
  sceneId?: string;
  description: string;
  order: number;
}

// 챕터
export interface Chapter {
  id: string;
  projectId: string;
  number: number;
  title: string;
  subtitle?: string;
  purpose: string;
  emotionalGoal?: string;
  emotionalTone?: string;
  keyEvents: string[];
  povCharacterId?: string;
  location?: string;
  timeframe?: string;
  scenes: Scene[];
  sceneOutline?: string[];
  characters?: string[];
  status: 'outline' | 'draft' | 'revision' | 'polished' | 'approved';
  wordCount: number;
  targetWordCount?: number;
  notes?: string;
  plotStageId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// 씬
export interface Scene {
  id: string;
  chapterId: string;
  order: number;
  title: string;
  type: 'action' | 'dialogue' | 'reflection' | 'exposition' | 'transition' | 'climax';
  summary: string;
  goal: string;
  conflict?: string;
  outcome?: string;
  content: string;
  pov?: string;
  povType?: 'first' | 'third-limited' | 'omniscient';
  location?: string;
  timeOfDay?: string;
  weather?: string;
  mood?: string;
  participants: string[];
  mentionedCharacters?: string[];
  status: 'outline' | 'draft' | 'revision' | 'polished' | 'approved';
  wordCount: number;
  versions: SceneVersion[];
  foreshadowings?: string[];
  resolvedForeshadowings?: string[];
  conflicts?: string[];
  notes?: string;
  aiGenerationParams?: AIGenerationParams;
  createdAt: Date;
  updatedAt: Date;
}

// AI 생성 파라미터
export interface AIGenerationParams {
  style: string;
  perspective: string;
  dialogueRatio: number;
  descriptionDetail: number;
  pacing: string;
  emotionIntensity: number;
  additionalInstructions?: string;
}

// 씬 버전
export interface SceneVersion {
  id: string;
  content: string;
  wordCount: number;
  createdAt: Date;
  note?: string;
  type: 'auto' | 'manual' | 'ai-generated' | 'branch';
  branchName?: string;
}

// 복선
export interface Foreshadowing {
  id: string;
  projectId: string;
  title: string;
  description: string;
  type: 'hint' | 'symbol' | 'prophecy' | 'setup' | 'red-herring';
  subtlety: number;
  plantedIn: string;
  plantedMethod: string;
  resolvedIn?: string;
  resolutionMethod?: string;
  relatedCharacters?: string[];
  relatedPlot?: string;
  status: 'planted' | 'reinforced' | 'resolved' | 'abandoned';
  priority: 'critical' | 'major' | 'minor';
  notes?: string;
  createdAt: Date;
}

// 갈등
export interface Conflict {
  id: string;
  projectId: string;
  type: 'internal' | 'interpersonal' | 'societal' | 'environmental' | 'supernatural' | 'technological';
  title: string;
  description: string;
  stakes: string;
  involvedCharacters: string[];
  primaryCharacter?: string;
  introducedIn: string;
  escalations?: ConflictEscalation[];
  climaxIn?: string;
  resolvedIn?: string;
  resolution?: string;
  status: 'brewing' | 'active' | 'escalating' | 'climax' | 'resolved' | 'abandoned';
  intensity: number;
  createdAt: Date;
}

// 갈등 에스컬레이션
export interface ConflictEscalation {
  sceneId: string;
  description: string;
  intensityChange: number;
}

// 분석 결과
export interface Analysis {
  id: string;
  targetType: 'scene' | 'chapter' | 'project';
  targetId: string;
  qualityScore: QualityScore;
  tensionAnalysis: TensionAnalysis;
  emotionAnalysis: EmotionAnalysis;
  pacingAnalysis: PacingAnalysis;
  styleAnalysis: StyleAnalysis;
  suggestions: Suggestion[];
  consistencyIssues: ConsistencyIssue[];
  createdAt: Date;
}

// 품질 점수
export interface QualityScore {
  overall: number;
  readability: number;
  grammar: number;
  style: number;
  engagement: number;
  originality: number;
  details: string[];
}

// 긴장감 분석
export interface TensionAnalysis {
  averageLevel: number;
  peakMoments: { position: number; level: number; description: string }[];
  lowPoints: { position: number; level: number; suggestion: string }[];
  curve: { position: number; level: number }[];
}

// 감정 분석
export interface EmotionAnalysis {
  dominantEmotions: { emotion: string; percentage: number }[];
  emotionFlow: { position: number; emotion: string; intensity: number }[];
  toneConsistency: number;
  emotionalImpact: string;
}

// 페이싱 분석
export interface PacingAnalysis {
  overallPacing: 'too-slow' | 'slow' | 'balanced' | 'fast' | 'too-fast';
  variationScore: number;
  slowSections: { start: number; end: number; suggestion: string }[];
  fastSections: { start: number; end: number; suggestion: string }[];
}

// 스타일 분석
export interface StyleAnalysis {
  showVsTell: { show: number; tell: number };
  activeVsPassive: { active: number; passive: number };
  dialogueRatio: number;
  averageSentenceLength: number;
  vocabularyRichness: number;
  repetitiveWords: { word: string; count: number }[];
  cliches: { phrase: string; suggestion: string }[];
}

// 제안
export interface Suggestion {
  id: string;
  type: 'style' | 'description' | 'dialogue' | 'flow' | 'tension' | 'character' | 'world' | 'grammar' | 'other';
  priority: 'high' | 'medium' | 'low';
  location?: { start: number; end: number };
  original?: string;
  suggestion: string;
  reason: string;
  applied: boolean;
}

// 일관성 문제
export interface ConsistencyIssue {
  id: string;
  type: 'character-personality' | 'character-speech' | 'character-knowledge' | 'world-rules' | 'timeline' | 'foreshadowing' | 'location' | 'relationship' | 'other';
  description: string;
  severity: 'critical' | 'major' | 'minor';
  location?: { start: number; end: number };
  reference?: string;
  suggestion?: string;
  resolved: boolean;
}

// 표현 라이브러리
export interface Expression {
  id: string;
  projectId?: string;
  category: 'emotion' | 'sense' | 'metaphor' | 'action' | 'description' | 'dialogue-tag' | 'other';
  subcategory?: string;
  content: string;
  context?: string;
  tags: string[];
  isFavorite: boolean;
  isCustom: boolean;
  createdAt: Date;
}

// 시리즈
export interface Series {
  id: string;
  title: string;
  description: string;
  genre: string[];
  targetBooks: number;
  status: 'ongoing' | 'completed' | 'hiatus';
  projects: string[];
  sharedWorld?: string;
  sharedCharacters?: string[];
  timeline: SeriesTimeline;
  bible: SeriesBible;
  createdAt: Date;
  updatedAt: Date;
}

// 시리즈 타임라인
export interface SeriesTimeline {
  events: SeriesEvent[];
}

// 시리즈 이벤트
export interface SeriesEvent {
  id: string;
  bookIndex: number;
  description: string;
  date?: string;
  order: number;
}

// 시리즈 성경
export interface SeriesBible {
  overview: string;
  worldRules: string[];
  recurringElements: string[];
  characterNotes: Record<string, string>;
  plotThreads: string[];
  toneGuidelines: string;
}

// 독자 페르소나
export interface ReaderPersona {
  id: string;
  name: string;
  ageRange: string;
  readingExperience: 'casual' | 'regular' | 'avid' | 'critic';
  preferredGenres: string[];
  petPeeves: string[];
  preferences: string[];
}

// 리서치 노트
export interface ResearchNote {
  id: string;
  projectId: string;
  title: string;
  category: string;
  content: string;
  source?: string;
  url?: string;
  tags: string[];
  createdAt: Date;
}

// 글쓰기 세션
export interface WritingSession {
  id: string;
  projectId: string;
  startTime: Date;
  endTime?: Date;
  wordsWritten: number;
  chaptersWorked: string[];
  notes?: string;
}

// Gemini 모델 타입
export type GeminiModel = 'gemini-2.0-flash' | 'gemini-3-flash' | 'gemini-2.5-flash' | 'gemini-1.5-flash';

// 앱 설정
export interface AppSettings {
  id: string;
  theme: 'dark' | 'light' | 'sepia';
  fontSize: number;
  fontFamily: string;
  autoSave: boolean;
  autoSaveInterval: number;
  soundEffects: boolean;
  notifications: boolean;
  geminiApiKey?: string;
  // 모델 설정 (기획용/집필용 분리)
  planningModel: GeminiModel;  // 기획용 모델 (캐릭터, 세계관, 플롯 등)
  writingModel: GeminiModel;   // 집필용 모델 (실제 글쓰기)
}

// ============================================
// 소설 집필 시스템 - 권/씬 구조 관리
// ============================================

// 권(Volume) 구조 - 기존 Chapter를 확장
export interface VolumeStructure {
  id: string;
  projectId: string;
  volumeNumber: number;
  title: string;
  targetWordCount: number; // 목표 글자수
  startPoint: string; // 이 권의 시작점 (구체적 장면)
  endPoint: string; // 이 권의 종료점 (구체적 장면/대사) ⚠️ 핵심
  endPointType: 'dialogue' | 'action' | 'narration' | 'scene';
  endPointExact: string; // 정확한 종료 대사 또는 행동
  coreEvent: string; // 핵심 사건
  previousVolumeSummary?: string; // 이전 권 요약
  nextVolumePreview?: string; // 다음 권 예고 (참고용, 쓰지 말 것)
  scenes: SceneStructure[]; // 이 권의 씬 목록
  status: 'planning' | 'writing' | 'completed';
  actualWordCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// 씬 구조 - 분할 집필용
export interface SceneStructure {
  id: string;
  volumeId: string;
  sceneNumber: number;
  title: string;
  targetWordCount: number;
  pov: string; // 시점 인물
  povType: 'first' | 'third-limited' | 'omniscient';
  location: string;
  timeframe: string;
  participants: string[]; // 등장인물

  // 필수 포함 내용
  mustInclude: string[]; // 반드시 포함할 내용 (3-5개)

  // 시작/종료 조건
  startCondition: string; // 이 씬의 시작 상황
  endCondition: string; // ⚠️ 핵심: 이 씬의 종료 조건 (구체적 장면/대사)
  endConditionType: 'dialogue' | 'action' | 'narration' | 'scene';

  // 연결
  previousSceneSummary?: string; // 직전 씬 요약 (이어쓰기용)
  nextScenePreview?: string; // 다음 씬 예고 (참고용만)

  // 상태
  status: 'pending' | 'in_progress' | 'completed' | 'needs_revision';
  actualWordCount: number;
  content?: string;

  createdAt: Date;
  updatedAt: Date;
}

// 집필 프롬프트 생성 설정
export interface WritingPromptConfig {
  projectId: string;
  volumeId: string;
  sceneId?: string; // 씬 단위 집필시

  // 집필 모드
  mode: 'volume' | 'scene' | 'continue'; // 권 전체 / 씬 단위 / 이어쓰기

  // 이어쓰기 설정
  continueFrom?: {
    lastContent: string; // 마지막 500자
    remainingContent: string[]; // 아직 안 쓴 내용
  };

  // 스타일 설정
  style: WritingStyle;
}

// 글쓰기 스타일
export interface WritingStyle {
  writingStyle: string;
  perspective: 'first' | 'third-limited' | 'omniscient' | 'second';
  tense: 'past' | 'present';
  dialogueRatio: number; // 0-100
  descriptionDetail: number; // 1-10
  pacing: 'slow' | 'moderate' | 'fast';
  emotionIntensity: number; // 1-10
  additionalInstructions?: string;
}

// 생성된 프롬프트
export interface GeneratedPrompt {
  systemPrompt: string;
  userPrompt: string;
  metadata: {
    volumeNumber: number;
    sceneNumber?: number;
    targetWordCount: number;
    endCondition: string;
    mode: 'volume' | 'scene' | 'continue';
  };
}

// 분량 체크 결과
export interface WordCountCheck {
  currentCount: number;
  targetCount: number;
  percentage: number;
  status: 'under' | 'on_target' | 'over';
  endConditionReached: boolean;
}

// 권별 진행 상황
export interface VolumeProgress {
  volumeId: string;
  volumeNumber: number;
  title: string;
  totalScenes: number;
  completedScenes: number;
  targetWordCount: number;
  actualWordCount: number;
  progressPercentage: number;
  status: 'planning' | 'writing' | 'completed';
  estimatedCompletion?: Date;
}

// 프로젝트 전체 진행 상황
export interface ProjectWritingProgress {
  projectId: string;
  totalVolumes: number;
  completedVolumes: number;
  totalTargetWordCount: number;
  totalActualWordCount: number;
  volumes: VolumeProgress[];
  overallPercentage: number;
}

// ============================================
// 캐릭터 일관성 관리 시스템
// ============================================

// 캐릭터 상태 추적 (생존/죽음/부상/상태변화)
export interface CharacterStatus {
  characterId: string;
  characterName: string;
  status: 'alive' | 'dead' | 'missing' | 'imprisoned' | 'injured' | 'transformed';
  statusChangedAt?: string; // 어느 장면/권에서 상태가 변경되었는지
  statusChangeDescription?: string; // 상태 변경 설명
  lastSeenAt?: string; // 마지막으로 등장한 장면
  currentLocation?: string; // 현재 위치
  notes?: string; // 추가 메모
}

// 캐릭터 등장 기록
export interface CharacterAppearance {
  characterId: string;
  characterName: string;
  sceneId?: string;
  chapterId?: string;
  volumeNumber?: number;
  location: string;
  action: string; // 무엇을 했는지
  dialogue?: string; // 대표 대사
  emotionalState?: string; // 감정 상태
  timestamp: Date;
}

// 캐릭터 일관성 규칙
export interface CharacterConsistencyRule {
  id: string;
  characterId: string;
  characterName: string;
  ruleType: 'status' | 'location' | 'knowledge' | 'relationship' | 'trait' | 'speech' | 'ability';
  rule: string; // 규칙 설명
  effectiveFrom?: string; // 언제부터 적용되는지 (장면/권)
  effectiveUntil?: string; // 언제까지 적용되는지
  priority: 'critical' | 'major' | 'minor';
  isActive: boolean;
  createdAt: Date;
}

// 캐릭터 일관성 검증 결과
export interface CharacterConsistencyCheck {
  isConsistent: boolean;
  violations: CharacterConsistencyViolation[];
  warnings: CharacterConsistencyWarning[];
  suggestions: string[];
}

// 일관성 위반
export interface CharacterConsistencyViolation {
  id: string;
  characterId: string;
  characterName: string;
  violationType: 'dead_character_appears' | 'wrong_location' | 'knowledge_inconsistency' |
                 'relationship_mismatch' | 'trait_contradiction' | 'speech_pattern_break' |
                 'ability_inconsistency' | 'timeline_error';
  description: string;
  severity: 'critical' | 'major' | 'minor';
  location: {
    sceneId?: string;
    chapterId?: string;
    volumeNumber?: number;
    textPosition?: number;
  };
  suggestedFix?: string;
  relatedRule?: string;
}

// 일관성 경고
export interface CharacterConsistencyWarning {
  characterId: string;
  characterName: string;
  warningType: 'potential_inconsistency' | 'missing_context' | 'ambiguous_status' | 'long_absence';
  description: string;
  suggestion?: string;
}

// 캐릭터 지식 상태 (누가 무엇을 알고 있는지)
export interface CharacterKnowledge {
  characterId: string;
  characterName: string;
  knowledgeItems: KnowledgeItem[];
}

export interface KnowledgeItem {
  id: string;
  topic: string; // 무엇에 대한 지식
  description: string; // 구체적 내용
  learnedAt?: string; // 어디서 알게 되었는지
  learnedFrom?: string; // 누구에게서 알게 되었는지
  isSecret: boolean; // 비밀 정보인지
  canShareWith?: string[]; // 공유 가능한 캐릭터 ID
}

// 캐릭터 일관성 컨텍스트 (집필 시 참조용)
export interface CharacterConsistencyContext {
  projectId: string;
  characters: CharacterStatus[];
  rules: CharacterConsistencyRule[];
  appearances: CharacterAppearance[];
  knowledge: CharacterKnowledge[];
  lastUpdated: Date;
}

// 자동 추출된 캐릭터 정보 (기존 소설에서)
export interface ExtractedCharacterInfo {
  name: string;
  aliases: string[];
  role: string;
  status: 'alive' | 'dead' | 'unknown';
  statusChangeLocation?: string;
  appearances: {
    location: string;
    context: string;
  }[];
  relationships: {
    targetName: string;
    type: string;
    description: string;
  }[];
  traits: string[];
  speechPatterns: string[];
  keyEvents: string[];
}
