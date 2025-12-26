/**
 * 베스트셀러 작가 워크플로우 시스템
 *
 * 프로 작가들의 집필 방식을 체계화한 시스템입니다.
 * - 철저한 기획
 * - 캐릭터 심층 개발
 * - 씬 비트 설계
 * - 감정선 관리
 * - 복선/페이백 추적
 * - 독자 반응 예측
 */

import { generateJSON, generateText } from './gemini';
import { GeminiModel, Character, Project, WorldSetting, PlotStructure } from '@/types';

// ============================================
// 1. 캐릭터 심층 개발 시스템
// ============================================

export interface DeepCharacterProfile {
  // 기본 정보
  name: string;
  role: 'protagonist' | 'antagonist' | 'deuteragonist' | 'supporting' | 'minor';

  // 심리적 프로필
  psychology: {
    coreWound: string; // 핵심 상처 (캐릭터 동기의 근원)
    ghostOfThePast: string; // 과거의 유령 (트라우마)
    lie: string; // 캐릭터가 믿는 거짓 (변화 전)
    truth: string; // 깨달아야 할 진실 (변화 후)
    want: string; // 외적 목표 (원하는 것)
    need: string; // 내적 필요 (진정으로 필요한 것)
    fear: string; // 가장 큰 두려움
    secret: string; // 비밀
    flaw: string; // 치명적 결함
    strength: string; // 가장 큰 강점
  };

  // 관계 역학
  relationships: {
    targetName: string;
    type: string;
    dynamic: string; // 역학 관계
    conflict: string; // 잠재적 갈등
    growthPotential: string; // 성장 가능성
    scenesNeeded: string[]; // 필요한 장면들
  }[];

  // 캐릭터 아크
  arc: {
    type: 'positive' | 'negative' | 'flat' | 'corruption' | 'disillusionment';
    startingPoint: string;
    catalystMoment: string;
    progressMarkers: string[];
    darkNightOfSoul: string;
    transformationMoment: string;
    endingPoint: string;
  };

  // 말투/행동 패턴
  voice: {
    speechPatterns: string[];
    catchPhrases: string[];
    avoidWords: string[];
    bodyLanguage: string[];
    habits: string[];
    tells: string[]; // 거짓말할 때 버릇 등
  };

  // 장면별 감정 곡선
  emotionalJourney: {
    volume: number;
    keyEmotions: string[];
    intensityPeak: string;
  }[];
}

/**
 * 캐릭터 심층 프로필을 생성합니다.
 */
export async function generateDeepCharacterProfile(
  apiKey: string,
  character: Partial<Character>,
  project: Project,
  existingCharacters: Character[],
  model: GeminiModel = 'gemini-3-flash-preview'
): Promise<DeepCharacterProfile> {
  const prompt = `당신은 베스트셀러 소설가이자 캐릭터 개발 전문가입니다.
다음 캐릭터에 대한 심층 프로필을 작성해주세요.

## 작품 정보
- 제목: ${project.title}
- 장르: ${project.genre.join(', ')}
- 시놉시스: ${project.synopsis?.slice(0, 500) || ''}

## 캐릭터 기본 정보
- 이름: ${character.name}
- 역할: ${character.role}
- 나이: ${character.age}
- 성격: ${character.personality || ''}
- 배경: ${character.background || ''}
- 목표: ${character.goal || ''}
- 동기: ${character.motivation || ''}

## 기존 캐릭터들
${existingCharacters.filter(c => c.id !== character.id).map(c => `- ${c.name} (${c.role}): ${c.personality?.slice(0, 50) || ''}`).join('\n')}

## 심층 프로필 작성 지침

### 1. 심리적 프로필
- coreWound: 캐릭터의 모든 행동을 설명하는 근본적 상처
- ghostOfThePast: 과거에 일어난 트라우마적 사건
- lie: 캐릭터가 진실이라고 믿는 거짓 (예: "나는 사랑받을 자격이 없다")
- truth: 스토리를 통해 깨달아야 할 진실
- want: 외적으로 추구하는 목표
- need: 진정으로 필요한 것 (보통 want와 다름)
- fear: 가장 큰 두려움 (장애물로 작용)
- secret: 다른 캐릭터들이 모르는 비밀
- flaw: 성장을 방해하는 치명적 결함
- strength: 위기 순간에 발휘되는 강점

### 2. 관계 역학
각 주요 캐릭터와의:
- 현재 관계 역학
- 잠재적 갈등 요소
- 성장 가능성
- 관계 발전을 위해 필요한 장면들

### 3. 캐릭터 아크
- 시작점에서 끝점까지의 변화
- 변화를 촉발하는 순간
- 진행 마커들
- 암흑의 순간 (모든 것을 잃는 순간)
- 변화가 완성되는 순간

### 4. 말투/행동 패턴
- 특유의 말투
- 자주 쓰는 표현
- 절대 쓰지 않는 표현
- 특징적인 몸짓
- 습관
- 거짓말할 때 나오는 버릇

### 5. 감정 여정
각 권별 주요 감정과 절정

## 응답 형식 (JSON)
{
  "name": "이름",
  "role": "역할",
  "psychology": {
    "coreWound": "핵심 상처",
    "ghostOfThePast": "과거의 유령",
    "lie": "믿는 거짓",
    "truth": "깨달을 진실",
    "want": "외적 목표",
    "need": "내적 필요",
    "fear": "두려움",
    "secret": "비밀",
    "flaw": "결함",
    "strength": "강점"
  },
  "relationships": [
    {
      "targetName": "대상 캐릭터",
      "type": "관계 유형",
      "dynamic": "역학",
      "conflict": "갈등 요소",
      "growthPotential": "성장 가능성",
      "scenesNeeded": ["필요한 장면들"]
    }
  ],
  "arc": {
    "type": "아크 유형",
    "startingPoint": "시작점",
    "catalystMoment": "촉매 순간",
    "progressMarkers": ["진행 마커들"],
    "darkNightOfSoul": "암흑의 순간",
    "transformationMoment": "변화 순간",
    "endingPoint": "끝점"
  },
  "voice": {
    "speechPatterns": ["말투 패턴"],
    "catchPhrases": ["입버릇"],
    "avoidWords": ["쓰지 않는 표현"],
    "bodyLanguage": ["몸짓"],
    "habits": ["습관"],
    "tells": ["거짓말 시 버릇"]
  },
  "emotionalJourney": [
    {
      "volume": 1,
      "keyEmotions": ["주요 감정"],
      "intensityPeak": "절정 순간"
    }
  ]
}

캐릭터가 진정으로 살아있는 것처럼 느껴지도록 상세하게 작성해주세요.
JSON만 출력하세요.`;

  try {
    return await generateJSON<DeepCharacterProfile>(apiKey, prompt, {
      model,
      temperature: 0.8,
      maxTokens: 8000,
    });
  } catch (error) {
    console.error('[ProfessionalWorkflow] 캐릭터 프로필 생성 실패:', error);
    throw error;
  }
}

// ============================================
// 2. 씬 비트 설계 시스템
// ============================================

export interface SceneBeat {
  beatNumber: number;
  type: 'action' | 'reaction' | 'dialogue' | 'revelation' | 'decision' | 'transition';
  description: string;
  pov: string;
  emotion: string;
  tension: number; // 1-10
  purpose: string; // 씬 전체 목적에서 이 비트의 역할
  dialogueSample?: string;
  actionSample?: string;
  internalSample?: string; // 내적 독백
}

export interface SceneDesign {
  sceneNumber: number;
  title: string;
  purpose: string;
  emotionalGoal: string;

  // 씬 구조
  beats: SceneBeat[];

  // 긴장감 곡선
  tensionCurve: number[];

  // 필수 요소
  mustInclude: {
    dialogues: { speaker: string; essence: string }[];
    actions: string[];
    revelations: string[];
    foreshadowings: string[];
    emotionalBeats: string[];
  };

  // 연결
  hookFromPrevious: string; // 이전 씬에서 넘어오는 훅
  hookToNext: string; // 다음 씬으로 이어지는 훅

  // 금지 사항
  avoid: string[];
}

/**
 * 씬 비트를 상세하게 설계합니다.
 */
export async function designSceneBeats(
  apiKey: string,
  scene: {
    number: number;
    title: string;
    purpose: string;
    participants: string[];
    location: string;
    timeframe: string;
    mustInclude: string[];
    startCondition: string;
    endCondition: string;
  },
  characters: DeepCharacterProfile[],
  previousSceneSummary: string,
  nextScenePreview: string,
  model: GeminiModel = 'gemini-3-flash-preview'
): Promise<SceneDesign> {
  const prompt = `당신은 베스트셀러 소설의 씬 설계 전문가입니다.
다음 씬의 상세 비트를 설계해주세요.

## 씬 정보
- 번호: ${scene.number}
- 제목: ${scene.title}
- 목적: ${scene.purpose}
- 등장인물: ${scene.participants.join(', ')}
- 장소: ${scene.location}
- 시간: ${scene.timeframe}
- 시작 상황: ${scene.startCondition}
- 종료 조건: ${scene.endCondition}
- 필수 포함 내용: ${scene.mustInclude.join(', ')}

## 캐릭터 심층 정보
${characters.filter(c => scene.participants.includes(c.name)).map(c => `
### ${c.name}
- 현재 감정 상태: ${c.emotionalJourney[0]?.keyEmotions.join(', ') || '미정'}
- 이 씬에서의 목표: ${c.psychology.want}
- 내적 갈등: ${c.psychology.lie}
- 말투 특징: ${c.voice.speechPatterns.join(', ')}
- 입버릇: ${c.voice.catchPhrases.join(', ')}
`).join('')}

## 이전 씬 요약
${previousSceneSummary || '첫 번째 씬입니다.'}

## 다음 씬 예고
${nextScenePreview || '마지막 씬입니다.'}

## 씬 비트 설계 원칙

### 1. 비트 유형
- action: 물리적 행동
- reaction: 감정적/신체적 반응
- dialogue: 대화
- revelation: 정보 공개/발견
- decision: 결정의 순간
- transition: 장면 전환

### 2. 긴장감 곡선
- 시작은 중간 수준 (5)
- 중반에 상승
- 절정 직전 최고조 (8-10)
- 클리프행어 또는 해소로 마무리

### 3. 목적 없는 비트 금지
- 모든 비트는 플롯/캐릭터/테마 중 하나를 발전시켜야 함

### 4. 캐릭터 말투 반영
- 각 캐릭터의 고유 말투 유지
- 입버릇 자연스럽게 배치

## 응답 형식 (JSON)
{
  "sceneNumber": 씬 번호,
  "title": "씬 제목",
  "purpose": "씬의 핵심 목적",
  "emotionalGoal": "독자가 느껴야 할 감정",
  "beats": [
    {
      "beatNumber": 1,
      "type": "action/reaction/dialogue/revelation/decision/transition",
      "description": "비트 상세 설명",
      "pov": "시점 캐릭터",
      "emotion": "이 순간의 감정",
      "tension": 1-10,
      "purpose": "이 비트의 목적",
      "dialogueSample": "예시 대사 (대화 비트인 경우)",
      "actionSample": "예시 액션",
      "internalSample": "예시 내적 독백"
    }
  ],
  "tensionCurve": [5, 6, 7, 8, 9, 8],
  "mustInclude": {
    "dialogues": [
      { "speaker": "화자", "essence": "대사의 핵심" }
    ],
    "actions": ["필수 액션"],
    "revelations": ["밝혀져야 할 것"],
    "foreshadowings": ["심을 복선"],
    "emotionalBeats": ["감정 변화 포인트"]
  },
  "hookFromPrevious": "이전 씬에서 이어지는 긴장/질문",
  "hookToNext": "다음 씬으로 이어지는 훅",
  "avoid": ["피해야 할 것들"]
}

비트는 최소 8개 이상, 씬의 흐름이 자연스럽게 설계해주세요.
JSON만 출력하세요.`;

  try {
    return await generateJSON<SceneDesign>(apiKey, prompt, {
      model,
      temperature: 0.7,
      maxTokens: 8000,
    });
  } catch (error) {
    console.error('[ProfessionalWorkflow] 씬 비트 설계 실패:', error);
    throw error;
  }
}

// ============================================
// 3. 복선/페이백 추적 시스템
// ============================================

export interface SetupPayoff {
  id: string;
  setup: {
    description: string;
    volume: number;
    scene: number;
    subtlety: number; // 1-10 (1=노골적, 10=미묘)
    method: string; // 심는 방법
  };
  reinforcements: {
    volume: number;
    scene: number;
    method: string;
  }[];
  payoff: {
    description: string;
    plannedVolume: number;
    plannedScene: number;
    emotionalImpact: string;
    completed: boolean;
  };
  importance: 'critical' | 'major' | 'minor';
}

/**
 * 복선/페이백 계획을 생성합니다.
 */
export async function planSetupPayoffs(
  apiKey: string,
  project: Project,
  plotStructure: PlotStructure,
  totalVolumes: number,
  model: GeminiModel = 'gemini-3-flash-preview'
): Promise<SetupPayoff[]> {
  const prompt = `당신은 복선과 페이백의 대가인 베스트셀러 작가입니다.
다음 소설에 대한 복선/페이백 계획을 수립해주세요.

## 작품 정보
- 제목: ${project.title}
- 장르: ${project.genre.join(', ')}
- 시놉시스: ${project.synopsis || ''}
- 상세 시놉시스: ${project.detailedSynopsis?.slice(0, 1000) || ''}
- 총 권수: ${totalVolumes}

## 플롯 포인트
${plotStructure?.plotPoints.map(p => `- ${p.title}: ${p.description}`).join('\n') || '미정'}

## 복선/페이백 설계 원칙

### 1. 중요도 분류
- critical: 메인 플롯에 영향, 반드시 해소
- major: 서브플롯/캐릭터 발전에 영향
- minor: 분위기/디테일 강화

### 2. 미묘함 수준
- 1-3: 독자가 바로 알아챌 수 있음
- 4-6: 주의 깊게 보면 알아챔
- 7-10: 페이백 때 "아!" 하고 깨달음

### 3. 강화 필요성
- critical/major 복선은 2-3회 강화
- minor는 1회 정도

### 4. 페이백 타이밍
- 너무 빠르면 효과 약함
- 너무 늦으면 잊혀짐
- 적절한 거리 유지

## 응답 형식 (JSON)
{
  "setupPayoffs": [
    {
      "id": "고유 ID",
      "setup": {
        "description": "복선 내용",
        "volume": 심을 권 번호,
        "scene": 심을 씬 번호,
        "subtlety": 1-10,
        "method": "심는 방법 (대사/묘사/행동/소품 등)"
      },
      "reinforcements": [
        {
          "volume": 강화할 권,
          "scene": 강화할 씬,
          "method": "강화 방법"
        }
      ],
      "payoff": {
        "description": "페이백 내용",
        "plannedVolume": 해소할 권,
        "plannedScene": 해소할 씬,
        "emotionalImpact": "독자가 느낄 감정",
        "completed": false
      },
      "importance": "critical/major/minor"
    }
  ]
}

메인 플롯용 critical 2-3개, major 5-7개, minor 10개 이상 설계해주세요.
JSON만 출력하세요.`;

  try {
    const result = await generateJSON<{ setupPayoffs: SetupPayoff[] }>(apiKey, prompt, {
      model,
      temperature: 0.7,
      maxTokens: 8000,
    });
    return result.setupPayoffs;
  } catch (error) {
    console.error('[ProfessionalWorkflow] 복선 계획 실패:', error);
    throw error;
  }
}

// ============================================
// 4. 감정선 관리 시스템
// ============================================

export interface EmotionalArc {
  volumeNumber: number;
  emotionalTheme: string;
  startingMood: string;
  endingMood: string;
  keyEmotionalMoments: {
    scene: number;
    emotion: string;
    intensity: number;
    trigger: string;
  }[];
  readerExperience: string;
}

/**
 * 전체 감정선을 설계합니다.
 */
export async function designEmotionalArc(
  apiKey: string,
  project: Project,
  volumes: number,
  model: GeminiModel = 'gemini-3-flash-preview'
): Promise<EmotionalArc[]> {
  const prompt = `당신은 독자의 감정을 조율하는 베스트셀러 작가입니다.
다음 소설의 감정선을 권별로 설계해주세요.

## 작품 정보
- 제목: ${project.title}
- 장르: ${project.genre.join(', ')}
- 시놉시스: ${project.synopsis || ''}
- 총 권수: ${volumes}

## 감정선 설계 원칙

### 1. 권별 감정 테마
- 1권: 호기심, 기대
- 중반: 긴장, 위기, 좌절
- 클라이막스: 극적 긴장
- 마지막: 카타르시스

### 2. 감정 롤러코스터
- 한 감정이 너무 오래 지속되면 안 됨
- 긴장 → 이완 → 긴장 패턴
- 웃음과 눈물의 교차

### 3. 독자 경험
- 각 권 마지막에 독자가 느낄 감정
- 다음 권을 읽고 싶게 만드는 감정

## 응답 형식 (JSON)
{
  "emotionalArcs": [
    {
      "volumeNumber": 권 번호,
      "emotionalTheme": "이 권의 감정 테마",
      "startingMood": "시작 분위기",
      "endingMood": "끝 분위기",
      "keyEmotionalMoments": [
        {
          "scene": 씬 번호,
          "emotion": "감정",
          "intensity": 1-10,
          "trigger": "촉발 요인"
        }
      ],
      "readerExperience": "독자가 경험할 감정 여정"
    }
  ]
}

각 권의 감정 곡선이 다이나믹하게 설계해주세요.
JSON만 출력하세요.`;

  try {
    const result = await generateJSON<{ emotionalArcs: EmotionalArc[] }>(apiKey, prompt, {
      model,
      temperature: 0.7,
    });
    return result.emotionalArcs;
  } catch (error) {
    console.error('[ProfessionalWorkflow] 감정선 설계 실패:', error);
    throw error;
  }
}

// ============================================
// 5. 캐릭터 자동 생성 (장르/분량 기반)
// ============================================

export interface CharacterRecommendation {
  role: string;
  archetype: string;
  purpose: string;
  relationshipToProtagonist: string;
  suggestedName?: string;
  suggestedPersonality?: string;
  necessity: 'essential' | 'recommended' | 'optional';
}

/**
 * 프로젝트에 필요한 캐릭터들을 추천합니다.
 */
export async function recommendCharacters(
  apiKey: string,
  project: Project,
  totalWordCount: number,
  existingCharacters: Character[],
  model: GeminiModel = 'gemini-3-flash-preview'
): Promise<CharacterRecommendation[]> {
  // 분량에 따른 권장 캐릭터 수
  const getRecommendedCount = (words: number) => {
    if (words < 100000) return { min: 3, max: 7 };
    if (words < 300000) return { min: 5, max: 12 };
    if (words < 600000) return { min: 8, max: 20 };
    if (words < 1000000) return { min: 12, max: 30 };
    return { min: 20, max: 50 };
  };

  const { min, max } = getRecommendedCount(totalWordCount);

  const prompt = `당신은 소설 기획 전문가입니다.
다음 소설에 필요한 캐릭터들을 추천해주세요.

## 작품 정보
- 제목: ${project.title}
- 장르: ${project.genre.join(', ')}
- 시놉시스: ${project.synopsis || ''}
- 상세 시놉시스: ${project.detailedSynopsis?.slice(0, 1500) || ''}
- 총 분량: ${totalWordCount.toLocaleString()}자 (약 ${Math.ceil(totalWordCount / 200000)}권)

## 기존 캐릭터
${existingCharacters.map(c => `- ${c.name} (${c.role}): ${c.personality?.slice(0, 50) || ''}`).join('\n') || '없음'}

## 캐릭터 추천 기준

### 분량별 권장 캐릭터 수
- 이 소설은 ${totalWordCount.toLocaleString()}자 분량으로, 최소 ${min}명 ~ 최대 ${max}명의 캐릭터가 필요합니다.

### 필수 역할 (장르: ${project.genre.join(', ')})
${project.genre.includes('로맨스') ? '- 사랑의 대상/라이벌' : ''}
${project.genre.includes('판타지') ? '- 멘토/동료 모험가/적대 세력' : ''}
${project.genre.includes('무협') ? '- 사부/문파 동료/적대 고수' : ''}
${project.genre.includes('미스터리') ? '- 용의자들/조력자/진범' : ''}
${project.genre.includes('스릴러') ? '- 추적자/피해자/조력자' : ''}

### 역할 분류
- protagonist: 주인공 (1명)
- antagonist: 주적/악역 (1-2명)
- deuteragonist: 제2주인공/핵심 조연 (2-3명)
- supporting: 조연 (플롯에 영향)
- minor: 단역 (분위기/디테일)

### 아키타입 예시
- 멘토, 그림자, 변신자, 문지기, 전령, 트릭스터, 동료, 연인

## 응답 형식 (JSON)
{
  "recommendations": [
    {
      "role": "protagonist/antagonist/deuteragonist/supporting/minor",
      "archetype": "아키타입",
      "purpose": "이 캐릭터가 필요한 이유",
      "relationshipToProtagonist": "주인공과의 관계",
      "suggestedName": "제안 이름 (한국식)",
      "suggestedPersonality": "제안 성격",
      "necessity": "essential/recommended/optional"
    }
  ],
  "totalRecommended": 총 추천 수,
  "reasoning": "이 구성을 추천하는 이유"
}

기존 캐릭터와 중복되지 않도록, 스토리에 꼭 필요한 캐릭터들을 추천해주세요.
${min}명 이상 ${max}명 이하로 추천해주세요.
JSON만 출력하세요.`;

  try {
    const result = await generateJSON<{
      recommendations: CharacterRecommendation[];
      totalRecommended: number;
      reasoning: string;
    }>(apiKey, prompt, {
      model,
      temperature: 0.8,
      maxTokens: 8000,
    });
    return result.recommendations;
  } catch (error) {
    console.error('[ProfessionalWorkflow] 캐릭터 추천 실패:', error);
    throw error;
  }
}

// ============================================
// 6. 독자 반응 예측 시스템
// ============================================

export interface ReaderReactionPrediction {
  scene: number;
  volume: number;
  predictedReactions: {
    emotion: string;
    intensity: number;
    trigger: string;
  }[];
  engagementLevel: number; // 1-10
  pageturnerScore: number; // 다음 장 넘기고 싶은 정도
  potentialIssues: string[];
  improvements: string[];
}

/**
 * 독자 반응을 예측합니다.
 */
export async function predictReaderReaction(
  apiKey: string,
  sceneContent: string,
  previousContext: string,
  model: GeminiModel = 'gemini-3-flash-preview'
): Promise<ReaderReactionPrediction> {
  const prompt = `당신은 독자 심리 분석 전문가입니다.
다음 씬에 대한 독자 반응을 예측해주세요.

## 이전 맥락
${previousContext.slice(-1000) || '없음'}

## 현재 씬 내용
${sceneContent.slice(0, 3000)}

## 분석 항목

### 1. 감정 반응
- 독자가 느낄 감정들
- 각 감정의 강도 (1-10)
- 촉발 요인

### 2. 몰입도
- 전체 몰입 수준 (1-10)
- 페이지터너 점수 (다음 장 넘기고 싶은 정도)

### 3. 잠재적 문제
- 지루하게 느껴질 수 있는 부분
- 혼란스러울 수 있는 부분
- 설득력이 떨어지는 부분

### 4. 개선 제안
- 더 몰입하게 만들 방법
- 감정 강화 방법

## 응답 형식 (JSON)
{
  "scene": 1,
  "volume": 1,
  "predictedReactions": [
    {
      "emotion": "감정",
      "intensity": 1-10,
      "trigger": "촉발 요인"
    }
  ],
  "engagementLevel": 1-10,
  "pageturnerScore": 1-10,
  "potentialIssues": ["잠재적 문제들"],
  "improvements": ["개선 제안들"]
}

솔직하게 평가해주세요.
JSON만 출력하세요.`;

  try {
    return await generateJSON<ReaderReactionPrediction>(apiKey, prompt, {
      model,
      temperature: 0.6,
    });
  } catch (error) {
    console.error('[ProfessionalWorkflow] 독자 반응 예측 실패:', error);
    throw error;
  }
}

// ============================================
// 7. 집필 가이드라인 생성
// ============================================

export interface WritingGuidelines {
  style: {
    toneDescriptions: string[];
    sentenceLength: string;
    dialogueStyle: string;
    descriptionDepth: string;
    pacingGuidelines: string;
  };
  characterVoices: {
    characterName: string;
    voiceGuide: string;
    sampleDialogues: string[];
    internalMonologueStyle: string;
  }[];
  sceneGuidelines: {
    openingHook: string;
    tensionBuilding: string;
    dialogueBalance: string;
    closingHook: string;
  };
  avoidList: string[];
  mustIncludeList: string[];
}

/**
 * 집필 가이드라인을 생성합니다.
 */
export async function generateWritingGuidelines(
  apiKey: string,
  project: Project,
  characters: DeepCharacterProfile[],
  model: GeminiModel = 'gemini-3-flash-preview'
): Promise<WritingGuidelines> {
  const prompt = `당신은 베스트셀러 작가의 집필 코치입니다.
다음 소설의 집필 가이드라인을 작성해주세요.

## 작품 정보
- 제목: ${project.title}
- 장르: ${project.genre.join(', ')}
- 문체: ${project.settings?.writingStyle || '미정'}
- 시점: ${project.settings?.perspective || '3인칭 제한'}

## 캐릭터들
${characters.map(c => `
### ${c.name} (${c.role})
- 말투: ${c.voice.speechPatterns.join(', ')}
- 입버릇: ${c.voice.catchPhrases.join(', ')}
- 피해야 할 표현: ${c.voice.avoidWords.join(', ')}
`).join('')}

## 가이드라인 작성 항목

### 1. 문체 가이드
- 전체 톤
- 문장 길이
- 대화 스타일
- 묘사 깊이
- 페이싱

### 2. 캐릭터 음성 가이드
- 각 캐릭터별 말투 가이드
- 예시 대사 3개씩
- 내적 독백 스타일

### 3. 씬 작성 가이드
- 오프닝 훅
- 긴장감 구축
- 대화/서술 비율
- 클로징 훅

### 4. 금지 사항
- 이 작품에서 절대 하면 안 되는 것들

### 5. 필수 사항
- 이 작품에서 반드시 지켜야 할 것들

## 응답 형식 (JSON)
{
  "style": {
    "toneDescriptions": ["톤 설명"],
    "sentenceLength": "문장 길이 가이드",
    "dialogueStyle": "대화 스타일",
    "descriptionDepth": "묘사 깊이",
    "pacingGuidelines": "페이싱 가이드"
  },
  "characterVoices": [
    {
      "characterName": "캐릭터 이름",
      "voiceGuide": "음성 가이드",
      "sampleDialogues": ["예시 대사1", "예시 대사2", "예시 대사3"],
      "internalMonologueStyle": "내적 독백 스타일"
    }
  ],
  "sceneGuidelines": {
    "openingHook": "오프닝 훅 방법",
    "tensionBuilding": "긴장감 구축 방법",
    "dialogueBalance": "대화 비율 가이드",
    "closingHook": "클로징 훅 방법"
  },
  "avoidList": ["금지 사항"],
  "mustIncludeList": ["필수 사항"]
}

실제 집필에 바로 적용할 수 있도록 구체적으로 작성해주세요.
JSON만 출력하세요.`;

  try {
    return await generateJSON<WritingGuidelines>(apiKey, prompt, {
      model,
      temperature: 0.7,
      maxTokens: 8000,
    });
  } catch (error) {
    console.error('[ProfessionalWorkflow] 가이드라인 생성 실패:', error);
    throw error;
  }
}
