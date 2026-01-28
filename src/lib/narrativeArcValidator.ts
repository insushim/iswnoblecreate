/**
 * 전체 서사 아크 검증 시스템 (NarrativeArcValidator) v1.0
 *
 * 권 단위로 서사 곡선이 제대로 형성되는지 검증
 * - 3막 구조 / 기승전결 검증
 * - 긴장감 곡선 분석
 * - 캐릭터 아크 추적
 * - 주제 일관성 검증
 * - 페이싱 분석
 * - 감정 곡선 분석
 * - 전환점(turning point) 배치 검증
 */

// ============================================
// 서사 아크 구조
// ============================================

export interface NarrativeArc {
  volumeNumber: number;
  totalScenes: number;

  // 3막 구조 매핑
  actStructure: {
    act1: { start: number; end: number; name: string; purpose: string };
    act2a: { start: number; end: number; name: string; purpose: string };
    midpoint: { scene: number; event: string };
    act2b: { start: number; end: number; name: string; purpose: string };
    act3: { start: number; end: number; name: string; purpose: string };
  };

  // 전환점
  turningPoints: TurningPoint[];

  // 긴장감 곡선
  tensionCurve: TensionPoint[];

  // 캐릭터 아크
  characterArcs: CharacterArc[];

  // 주제
  themes: ThemeThread[];
}

export interface TurningPoint {
  name: string;
  sceneNumber: number;
  type: 'inciting-incident' | 'first-plot-point' | 'midpoint-reversal' |
        'all-is-lost' | 'climax' | 'resolution' |
        'pinch-point-1' | 'pinch-point-2';
  description: string;
  emotionalImpact: 'low' | 'medium' | 'high' | 'devastating';
  stakeEscalation: string;
}

export interface TensionPoint {
  sceneNumber: number;
  tensionLevel: number;     // 0-10
  emotionalLevel: number;   // 0-10
  paceLevel: number;        // 0-10 (빠름)
  dominantEmotion: string;
}

export interface CharacterArc {
  characterId: string;
  characterName: string;
  arcType: 'positive-change' | 'negative-change' | 'flat' | 'corruption' | 'disillusion' | 'growth';

  // 아크 단계
  stages: {
    sceneRange: [number, number];
    stage: 'ordinary-world' | 'call-to-adventure' | 'refusal' | 'crossing-threshold' |
           'tests-allies-enemies' | 'innermost-cave' | 'ordeal' | 'reward' |
           'road-back' | 'resurrection' | 'return';
    description: string;
    internalState: string;    // 내면 상태
    belief: string;           // 이 시점의 믿음/가치관
    wantVsNeed: string;       // 원하는 것 vs 필요한 것 갈등
  }[];

  // 성장 키워드
  growthKeywords: {
    before: string[];          // 초반 키워드 (약점, 두려움)
    after: string[];           // 후반 키워드 (극복, 성장)
  };
}

export interface ThemeThread {
  name: string;
  description: string;
  appearances: {
    sceneNumber: number;
    manifestation: string;    // 어떻게 드러나는지
    method: 'dialogue' | 'action' | 'symbol' | 'contrast' | 'consequence';
  }[];
  resolution: string;         // 최종 결론
}

// ============================================
// 서사 아크 검증기 클래스
// ============================================

export class NarrativeArcValidator {

  /**
   * 권 단위 서사 아크 검증 가이드
   * 씬 작성 전 전체 구조 내에서 현재 씬의 위치를 알려주는 프롬프트
   */
  generateArcPositionGuide(
    sceneNumber: number,
    totalScenes: number,
    volumeNumber: number,
    arc?: NarrativeArc
  ): string {
    const position = sceneNumber / totalScenes;

    // 3막 구조에서 현재 위치 판단
    const actPosition = this.determineActPosition(position);

    let guide = `
---
## 서사 구조 내 현재 위치

### 전체 진행률: ${Math.round(position * 100)}% (${volumeNumber}권 ${sceneNumber}/${totalScenes}씬)
### 현재 위치: **${actPosition.name}** (${actPosition.koreanName})

`;

    // 현재 위치에 따른 씬 목표
    guide += `### 이 씬의 서사적 목표
${actPosition.sceneGoals.map(g => `- ${g}`).join('\n')}

### 긴장감 수준: ${actPosition.targetTension}/10
### 페이싱: ${actPosition.pacing}
### 감정 방향: ${actPosition.emotionalDirection}

`;

    // 전환점 근접 경고
    const nearbyTurningPoint = this.getNearbyTurningPoint(position);
    if (nearbyTurningPoint) {
      guide += `### 전환점 임박!
**${nearbyTurningPoint.name}** (${nearbyTurningPoint.koreanName})
- ${nearbyTurningPoint.description}
- 이 전환점은 독자에게 ${nearbyTurningPoint.impact}을 주어야 합니다
- 이전까지 쌓아온 기대/긴장을 ${nearbyTurningPoint.action}하세요

`;
    }

    // 페이싱 지침
    guide += this.generatePacingGuide(actPosition);

    // 캐릭터 아크 지침
    guide += this.generateCharacterArcGuide(position);

    // 주제 지침
    guide += this.generateThemeGuide(position);

    return guide;
  }

  /**
   * 전체 권의 서사 구조 검증 프롬프트
   */
  generateFullArcValidationPrompt(volumeSummaries: string[]): string {
    return `## 서사 아크 검증

아래는 각 씬의 요약입니다. 전체 서사 구조를 분석하세요:

${volumeSummaries.map((s, i) => `### 씬 ${i + 1}\n${s}`).join('\n\n')}

---

### 검증 항목:

1. **3막 구조**: 도입-전개-클라이맥스-결말이 적절히 배치되었는가?
2. **긴장감 곡선**: 점진적으로 상승하며 적절한 완급 조절이 있는가?
3. **전환점**: 촉발 사건, 1차 전환점, 중간 반전, 암흑의 순간, 클라이맥스가 있는가?
4. **캐릭터 아크**: 주인공의 내면 변화가 일관되게 진행되는가?
5. **스테이크 상승**: 갈수록 위험이 커지는가?
6. **주제 일관성**: 핵심 주제가 일관되게 탐구되는가?
7. **페이싱**: 속도가 적절한가? (행동-성찰-행동의 교대)

### 문제 발견 시 구체적 개선안을 제시하세요.`;
  }

  // ============================================
  // Private Methods
  // ============================================

  private determineActPosition(position: number): ActPositionInfo {
    if (position < 0.12) {
      return {
        name: 'Act 1 - Setup',
        koreanName: '1막 - 일상 세계',
        sceneGoals: [
          '주인공의 일상과 결핍/욕구를 보여주세요',
          '세계관과 분위기를 감각적으로 확립하세요',
          '이후 변화를 부각시킬 "평범한 일상"을 설정하세요',
          '주인공의 성격적 결함(flaw)을 자연스럽게 보여주세요',
        ],
        targetTension: 3,
        pacing: '보통 - 세계관 확립과 캐릭터 소개에 집중',
        emotionalDirection: '안정 → 불안 조짐',
      };
    }
    if (position < 0.25) {
      return {
        name: 'Act 1 - Inciting Incident',
        koreanName: '1막 - 촉발 사건',
        sceneGoals: [
          '일상을 깨뜨리는 사건을 발생시키세요',
          '주인공이 선택/결정을 강요받는 상황을 만드세요',
          '스테이크(걸린 것)를 명확히 하세요',
          '독자가 "이제 어떻게 되지?"라고 궁금해하도록',
        ],
        targetTension: 5,
        pacing: '가속 - 사건 발생으로 긴장감 상승',
        emotionalDirection: '동요 → 결심',
      };
    }
    if (position < 0.50) {
      return {
        name: 'Act 2a - Rising Action',
        koreanName: '2막 전반 - 상승 전개',
        sceneGoals: [
          '주인공이 새로운 세계/상황에 적응하는 과정을 그리세요',
          '동맹과 적을 명확히 하세요',
          '장애물을 점점 어렵게 만드세요',
          '서브플롯을 발전시키세요',
          '복선을 자연스럽게 깔아두세요',
        ],
        targetTension: 6,
        pacing: '점진 상승 - 시련과 성장의 교대',
        emotionalDirection: '도전 → 작은 성공과 좌절의 반복',
      };
    }
    if (position < 0.55) {
      return {
        name: 'Midpoint Reversal',
        koreanName: '중간 반전',
        sceneGoals: [
          '상황을 완전히 뒤집는 사건을 일으키세요',
          '주인공의 목표나 이해가 근본적으로 바뀌어야 합니다',
          '"알고 있던 것이 사실이 아니었다" 류의 반전',
          '스테이크를 극적으로 높이세요',
          '이 순간 이후 주인공은 수동에서 능동으로 (또는 그 반대로) 변화',
        ],
        targetTension: 8,
        pacing: '급가속 - 반전의 충격',
        emotionalDirection: '충격 → 재정비',
      };
    }
    if (position < 0.75) {
      return {
        name: 'Act 2b - Complications',
        koreanName: '2막 후반 - 복잡화',
        sceneGoals: [
          '중간 반전의 여파를 다루세요',
          '갈등을 심화시키세요 - 내적/외적 모두',
          '적대 세력이 더 강해지거나 새로운 위협 등장',
          '캐릭터 관계에 균열이나 변화를 주세요',
          '주인공의 내면 갈등이 최고조에 달하도록',
        ],
        targetTension: 7,
        pacing: '고조 - 위기 감각 증가',
        emotionalDirection: '불안 → 절박',
      };
    }
    if (position < 0.80) {
      return {
        name: 'All Is Lost Moment',
        koreanName: '암흑의 순간',
        sceneGoals: [
          '주인공이 가장 큰 실패/상실을 겪도록 하세요',
          '모든 것이 끝난 것처럼 보여야 합니다',
          '독자도 "이건 끝이다"라고 느껴야 합니다',
          '이 절망에서 주인공의 진짜 성장이 시작됩니다',
          '키 복선이 여기서 의미를 갖기 시작합니다',
        ],
        targetTension: 9,
        pacing: '최고 긴장 후 짧은 정적',
        emotionalDirection: '절망 → 내면의 전환',
      };
    }
    if (position < 0.90) {
      return {
        name: 'Act 3 - Climax',
        koreanName: '3막 - 클라이맥스',
        sceneGoals: [
          '모든 갈등이 한 점으로 수렴하도록',
          '주인공이 자신의 결함과 직면하세요',
          '핵심 복선을 회수하세요',
          '최대의 시련에서 성장한 모습을 보여주세요',
          '독자의 감정을 최고조로 끌어올리세요',
        ],
        targetTension: 10,
        pacing: '최고속 - 빈틈없는 긴장감',
        emotionalDirection: '최고조 감정 폭발',
      };
    }
    return {
      name: 'Act 3 - Resolution',
      koreanName: '3막 - 결말',
      sceneGoals: [
        '변화한 주인공의 "새로운 일상"을 보여주세요',
        '남은 서브플롯을 마무리하세요',
        '주제를 최종적으로 확인하세요 (직접 말하지 말고 보여주기로)',
        '독자에게 여운을 남기세요',
        '다음 권으로의 씨앗을 심으세요 (시리즈인 경우)',
      ],
      targetTension: 4,
      pacing: '감속 - 여운과 마무리',
      emotionalDirection: '해소 → 여운',
    };
  }

  private getNearbyTurningPoint(position: number): TurningPointInfo | null {
    const turningPoints: TurningPointInfo[] = [
      {
        position: 0.12,
        name: 'Inciting Incident',
        koreanName: '촉발 사건',
        description: '일상을 깨뜨리는 사건. 주인공을 행동하게 만드는 계기.',
        impact: '"이제 뭔가 시작된다"는 기대감',
        action: '폭발시키세요',
      },
      {
        position: 0.25,
        name: 'First Plot Point',
        koreanName: '1차 전환점',
        description: '주인공이 돌이킬 수 없는 선택을 하는 순간.',
        impact: '돌이킬 수 없다는 긴장감',
        action: '확정시키세요',
      },
      {
        position: 0.375,
        name: 'Pinch Point 1',
        koreanName: '1차 압박점',
        description: '적대 세력의 힘을 독자에게 상기시키는 장면.',
        impact: '위험의 실체에 대한 두려움',
        action: '강화하세요',
      },
      {
        position: 0.50,
        name: 'Midpoint',
        koreanName: '중간 반전',
        description: '모든 것이 바뀌는 순간. 새로운 정보나 반전.',
        impact: '충격과 패러다임 전환',
        action: '완전히 뒤집으세요',
      },
      {
        position: 0.625,
        name: 'Pinch Point 2',
        koreanName: '2차 압박점',
        description: '적의 힘이 더 강해지고 주인공이 궁지에 몰리는 장면.',
        impact: '절박함과 위기감',
        action: '극대화하세요',
      },
      {
        position: 0.75,
        name: 'All Is Lost',
        koreanName: '암흑의 순간',
        description: '가장 큰 실패. 모든 것이 끝난 것처럼 보이는 순간.',
        impact: '절망감과 감정적 바닥',
        action: '바닥까지 떨어뜨리세요',
      },
      {
        position: 0.85,
        name: 'Climax',
        koreanName: '클라이맥스',
        description: '최종 대결. 모든 것이 결정되는 순간.',
        impact: '최고조의 감정적 카타르시스',
        action: '모든 것을 수렴시키세요',
      },
    ];

    // 가장 가까운 전환점 찾기 (±5% 범위)
    for (const tp of turningPoints) {
      if (Math.abs(position - tp.position) < 0.05) {
        return tp;
      }
    }
    return null;
  }

  private generatePacingGuide(actPosition: ActPositionInfo): string {
    return `
### 페이싱 지침
- **문장 길이**: ${actPosition.targetTension >= 8 ? '짧은 문장 위주 (긴장감 극대화)' :
      actPosition.targetTension >= 5 ? '중간 길이, 긴장 고조 시 짧게' :
      '긴 문장 허용, 여유로운 묘사'}
- **장면 전환**: ${actPosition.targetTension >= 7 ? '빠르게, 컷 전환식' :
      '자연스럽게, 감각 묘사로 연결'}
- **대화 vs 묘사 비율**: ${actPosition.targetTension >= 8 ? '대화 60% + 행동 30% + 묘사 10%' :
      actPosition.targetTension >= 5 ? '대화 40% + 행동 30% + 묘사 30%' :
      '묘사 50% + 대화 30% + 행동 20%'}
`;
  }

  private generateCharacterArcGuide(position: number): string {
    let stage: string;
    let guidance: string;

    if (position < 0.15) {
      stage = '일상 세계 / 결핍 상태';
      guidance = '주인공의 결핍과 거짓 믿음(false belief)을 보여주세요. 이것이 나중에 극복할 대상입니다.';
    } else if (position < 0.30) {
      stage = '모험에의 부름 / 저항';
      guidance = '주인공이 변화를 거부하는 모습을 보여주세요. 이 저항이 나중의 성장을 더 극적으로 만듭니다.';
    } else if (position < 0.50) {
      stage = '시련과 성장';
      guidance = '작은 시련을 통해 조금씩 변화하되, 핵심 결함은 아직 남아있어야 합니다.';
    } else if (position < 0.55) {
      stage = '각성 / 거울의 순간';
      guidance = '주인공이 자신의 진짜 문제를 처음으로 직시하는 순간입니다.';
    } else if (position < 0.75) {
      stage = '내면 갈등 최고조';
      guidance = '원하는 것(want)과 필요한 것(need)의 갈등이 극대화됩니다.';
    } else if (position < 0.85) {
      stage = '최종 선택';
      guidance = '주인공이 거짓 믿음을 버리고 진짜 자신이 되는 순간입니다.';
    } else {
      stage = '변화한 존재';
      guidance = '주인공이 변화했음을 행동으로 보여주세요. 말로 설명하지 마세요.';
    }

    return `
### 캐릭터 아크 위치
- **현재 단계**: ${stage}
- **지침**: ${guidance}
- **핵심**: 캐릭터의 변화는 갑자기가 아니라 점진적으로. 이 씬에서 한 단계만 진전시키세요.
`;
  }

  private generateThemeGuide(position: number): string {
    return `
### 주제 표현 지침
- 주제를 직접 말하지 마세요 ("인생이란..." "사랑은..." 금지)
- 주제를 캐릭터의 **선택**과 **결과**를 통해 보여주세요
- 주제에 대한 **반론**도 다른 캐릭터를 통해 제시하세요
- ${position < 0.5
      ? '전반부: 주제에 대한 질문을 던지세요 (답을 주지 마세요)'
      : position < 0.85
        ? '후반부: 주제에 대한 다양한 관점이 충돌하도록 하세요'
        : '결말부: 주제에 대한 작가의 답을 캐릭터의 행동으로 보여주세요'}
`;
  }
}

// ============================================
// 타입 정의
// ============================================

interface ActPositionInfo {
  name: string;
  koreanName: string;
  sceneGoals: string[];
  targetTension: number;
  pacing: string;
  emotionalDirection: string;
}

interface TurningPointInfo {
  position: number;
  name: string;
  koreanName: string;
  description: string;
  impact: string;
  action: string;
}

export default NarrativeArcValidator;
