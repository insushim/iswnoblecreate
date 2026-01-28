/**
 * 씬 간 일관성 검증 시스템 (SceneCoherenceValidator) v1.0
 *
 * 이전 씬의 실제 텍스트를 분석해서 다음 씬에 반영
 * - 이전 씬 마지막 상황 추출 → 다음 씬 시작점 지정
 * - 캐릭터 상태 연속성 (부상, 감정, 위치, 소지품)
 * - 시간/날씨/환경 연속성
 * - 언급된 약속/계획의 추적
 * - 대화 중 미완결 주제 추적
 */

// ============================================
// 씬 연속성 컨텍스트
// ============================================

export interface SceneContinuityContext {
  // 이전 씬 종료 상태
  previousSceneEnd: {
    lastAction: string;        // 마지막 행동/상황
    lastDialogue: string;      // 마지막 대사 (있으면)
    lastEmotion: string;       // 마지막 감정 상태
    lastLocation: string;      // 마지막 위치
    timeOfDay: string;         // 시간대
    weather: string;           // 날씨/환경
  };

  // 캐릭터 상태 추적
  characterStates: CharacterContinuityState[];

  // 미완결 요소
  unresolvedElements: {
    pendingPromises: string[];    // 미이행 약속
    openQuestions: string[];       // 답 안 된 질문
    unresolvedConflicts: string[]; // 미해결 갈등
    pendingActions: string[];      // 예고된 행동
    interruptedTopics: string[];   // 중단된 대화 주제
  };

  // 사물/소지품 추적
  objectTracking: {
    characterId: string;
    objects: string[];             // 소지품 목록
    objectStates: Record<string, string>; // 사물 상태 (예: "칼" → "피묻은")
  }[];

  // 시간 연속성
  timelinePosition: {
    absoluteTime: string;          // 절대 시간 (예: "1592년 4월 14일 저녁")
    elapsedSinceStart: string;     // 시작부터 경과
    dayNightCycle: 'dawn' | 'morning' | 'afternoon' | 'evening' | 'night' | 'late-night';
  };
}

export interface CharacterContinuityState {
  characterId: string;
  characterName: string;
  physicalState: {
    injuries: string[];          // 부상 목록
    fatigue: 'fresh' | 'tired' | 'exhausted' | 'collapsed';
    appearance: string;          // 현재 외모 상태
    clothing: string;            // 현재 복장
  };
  emotionalState: {
    primary: string;             // 주요 감정
    underlying: string;          // 내면 감정
    trajectory: 'rising' | 'stable' | 'falling';
  };
  location: string;              // 현재 위치
  lastAction: string;            // 마지막 행동
  knowledge: string[];           // 이 시점에서 아는 정보
  relationships: {
    targetId: string;
    currentStatus: string;       // 현재 관계 상태
    recentChange: string;        // 최근 변화
  }[];
}

// ============================================
// 일관성 검증기 클래스
// ============================================

export class SceneCoherenceValidator {

  /**
   * 이전 씬 텍스트에서 연속성 컨텍스트 추출 지침 생성
   * (AI에게 이전 씬을 분석하라는 프롬프트 부분)
   */
  generateContextExtractionPrompt(previousSceneText: string): string {
    return `## 이전 씬 분석 (연속성 추출)

아래 이전 씬 텍스트의 마지막 부분을 분석하여 다음 정보를 추출하세요:

1. **마지막 상황**: 씬이 어떤 상황에서 끝났는지
2. **캐릭터 상태**: 각 인물의 물리적/감정적 상태
3. **위치**: 마지막 장소
4. **시간**: 시간대
5. **미완결 요소**: 답 안 된 질문, 미이행 약속, 예고된 행동
6. **소지품**: 인물들이 가지고 있는 사물

### 이전 씬 (마지막 부분):
${previousSceneText.slice(-3000)}

---
`;
  }

  /**
   * 씬 시작 시 연속성 지침 생성
   * (프롬프트에 포함하여 AI가 이전 씬과 자연스럽게 연결하도록)
   */
  generateContinuityGuide(context: SceneContinuityContext | null, previousSceneEndText?: string): string {
    let guide = `
---
## 씬 간 연속성 지침 (매우 중요!)

### 핵심 원칙
- 이전 씬의 마지막 상황에서 **자연스럽게** 이어져야 합니다
- 시간, 장소, 캐릭터 상태가 갑자기 바뀌면 안 됩니다
- 이전 씬에서 부상당한 캐릭터는 다음 씬에서도 부상 상태입니다
- 이전 씬에서 한 약속은 이후 씬에서 지켜지거나 언급되어야 합니다

`;

    // 이전 씬 끝부분이 있으면 직접 참조
    if (previousSceneEndText) {
      guide += `### 이전 씬 마지막 부분 (이어서 쓰세요)
\`\`\`
${previousSceneEndText.slice(-1500)}
\`\`\`

**위 상황에서 자연스럽게 이어지는 장면으로 시작하세요.**
- 이전 씬의 마지막 행동/대사/감정을 이어받으세요
- 시간 경과가 있다면 명시하세요 ("다음 날 아침" 등)
- 장소가 바뀌면 이동 과정이나 새 장소 도입을 자연스럽게 하세요

`;
    }

    // 구조화된 컨텍스트가 있으면 상세 지침
    if (context) {
      guide += `### 이전 씬 종료 상태
- 마지막 행동: ${context.previousSceneEnd.lastAction}
- 마지막 감정: ${context.previousSceneEnd.lastEmotion}
- 위치: ${context.previousSceneEnd.lastLocation}
- 시간대: ${context.previousSceneEnd.timeOfDay}
- 환경: ${context.previousSceneEnd.weather}

`;

      // 캐릭터 상태
      if (context.characterStates.length > 0) {
        guide += `### 캐릭터 현재 상태 (반드시 반영)\n`;
        for (const cs of context.characterStates) {
          guide += `**${cs.characterName}**:
- 신체: ${cs.physicalState.injuries.length > 0 ? `부상: ${cs.physicalState.injuries.join(', ')}` : '건강'}, 피로도: ${cs.physicalState.fatigue}
- 감정: ${cs.emotionalState.primary} (내면: ${cs.emotionalState.underlying})
- 위치: ${cs.location}
${cs.knowledge.length > 0 ? `- 현재 아는 정보: ${cs.knowledge.join(', ')}` : ''}
`;
        }
      }

      // 미완결 요소
      const ue = context.unresolvedElements;
      const hasUnresolved = ue.pendingPromises.length > 0 ||
        ue.openQuestions.length > 0 ||
        ue.unresolvedConflicts.length > 0 ||
        ue.pendingActions.length > 0;

      if (hasUnresolved) {
        guide += `\n### 미완결 요소 (적절한 시점에 해소)\n`;
        if (ue.pendingPromises.length > 0)
          guide += `- 미이행 약속: ${ue.pendingPromises.join(', ')}\n`;
        if (ue.openQuestions.length > 0)
          guide += `- 답 안 된 질문: ${ue.openQuestions.join(', ')}\n`;
        if (ue.unresolvedConflicts.length > 0)
          guide += `- 미해결 갈등: ${ue.unresolvedConflicts.join(', ')}\n`;
        if (ue.pendingActions.length > 0)
          guide += `- 예고된 행동: ${ue.pendingActions.join(', ')}\n`;
      }

      // 사물 추적
      if (context.objectTracking.length > 0) {
        guide += `\n### 사물/소지품 (일관성 유지)\n`;
        for (const ot of context.objectTracking) {
          guide += `- ${ot.characterId}: ${ot.objects.join(', ')}`;
          const states = Object.entries(ot.objectStates);
          if (states.length > 0) {
            guide += ` (${states.map(([k, v]) => `${k}: ${v}`).join(', ')})`;
          }
          guide += '\n';
        }
      }
    }

    // 연속성 금지 사항
    guide += `
### 연속성 위반 금지 사항
- ❌ 부상당한 캐릭터가 갑자기 멀쩡해지는 것
- ❌ 밤이었는데 갑자기 낮이 되는 것 (시간 경과 설명 없이)
- ❌ 이전 씬에서 한 약속/계획을 완전히 잊는 것
- ❌ 캐릭터의 감정이 설명 없이 180도 바뀌는 것
- ❌ 소지품이 갑자기 나타나거나 사라지는 것
- ❌ 이전 씬에서 배운 정보를 모르는 것처럼 행동하는 것
`;

    return guide;
  }

  /**
   * 다음 씬 작성 전 AI에게 이전 텍스트를 요약하라는 프롬프트
   */
  generatePreviousSceneSummaryPrompt(previousText: string): string {
    return `아래 이전 씬의 텍스트를 읽고, 다음 정보를 JSON 형태로 추출하세요:

{
  "lastAction": "마지막 행동/상황",
  "lastDialogue": "마지막 대사 (없으면 빈 문자열)",
  "lastEmotion": "주인공의 마지막 감정 상태",
  "lastLocation": "마지막 위치",
  "timeOfDay": "시간대",
  "characterStates": [
    {
      "name": "캐릭터명",
      "injuries": ["부상 목록"],
      "emotion": "감정 상태",
      "location": "위치"
    }
  ],
  "unresolvedElements": ["미완결 요소 목록"],
  "importantObjects": ["중요 사물/소지품"]
}

### 이전 씬 텍스트:
${previousText.slice(-4000)}
`;
  }
}

export default SceneCoherenceValidator;
