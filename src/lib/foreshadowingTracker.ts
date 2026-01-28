/**
 * 복선/떡밥 관리 시스템 (ForeshadowingTracker)
 *
 * 상업 출판 수준의 플롯 관리
 * - 복선(떡밥) 설치 및 회수 추적
 * - 미스터리/서스펜스 요소 관리
 * - 씬 간 인과관계 검증
 * - 체호프의 총 원칙 적용
 * - 반복 모티프 관리
 */

// ============================================
// 복선/떡밥 타입 정의
// ============================================

export interface Foreshadowing {
  id: string;
  type: ForeshadowingType;
  priority: 'critical' | 'major' | 'minor' | 'subtle';

  // 설치 정보
  plantedInScene: number;         // 설치된 씬 번호
  plantedInVolume: number;        // 설치된 권 번호
  plantDescription: string;       // 설치 설명
  plantMethod: PlantMethod;       // 설치 방법

  // 회수 정보
  payoffTargetScene?: number;     // 회수 예정 씬
  payoffTargetVolume?: number;    // 회수 예정 권
  payoffDescription?: string;     // 회수 방법 설명
  payoffMethod?: PayoffMethod;    // 회수 방법
  actualPayoffScene?: number;     // 실제 회수된 씬
  actualPayoffVolume?: number;    // 실제 회수된 권

  // 중간 강화
  reinforcements: {
    sceneNumber: number;
    volumeNumber: number;
    description: string;
    method: 'reminder' | 'escalation' | 'misdirection' | 'parallel';
  }[];

  // 상태
  status: 'planted' | 'reinforced' | 'partially-resolved' | 'resolved' | 'abandoned';

  // 메타데이터
  relatedCharacters: string[];
  keywords: string[];             // 관련 키워드 (검색/매칭용)
  notes?: string;
}

export type ForeshadowingType =
  | 'chekhov-gun'      // 체호프의 총 (사물/도구가 나중에 사용됨)
  | 'prophecy'         // 예언/암시 (미래 사건 암시)
  | 'character-trait'  // 캐릭터 특성 (나중에 중요해질 특성)
  | 'mystery'          // 미스터리 (풀어야 할 수수께끼)
  | 'relationship'     // 관계 복선 (인물 관계 변화 암시)
  | 'symbol'           // 상징 (반복되는 상징/이미지)
  | 'backstory'        // 배경 이야기 (점진적 공개)
  | 'red-herring'      // 레드 헤링 (의도적 오도)
  | 'motif'            // 모티프 (반복 주제/이미지)
  | 'dramatic-irony'   // 극적 아이러니 (독자만 아는 정보)
  | 'setup-payoff';    // 셋업-페이오프 (설정과 회수)

export type PlantMethod =
  | 'dialogue'         // 대화 속에 자연스럽게
  | 'description'      // 묘사 속에 숨겨서
  | 'action'           // 행동/사건으로
  | 'internal-thought' // 내면 독백으로
  | 'environmental'    // 환경/배경으로
  | 'symbolic';        // 상징적 이미지로

export type PayoffMethod =
  | 'revelation'       // 밝혀짐/공개
  | 'confrontation'    // 대면/직면
  | 'consequence'      // 결과 발생
  | 'callback'         // 콜백/재등장
  | 'twist'            // 반전
  | 'resolution';      // 해결

// ============================================
// 인과관계 체인
// ============================================

export interface CausalChain {
  id: string;
  name: string;
  description: string;

  links: CausalLink[];
  status: 'active' | 'completed' | 'broken';
}

export interface CausalLink {
  cause: {
    sceneNumber: number;
    volumeNumber: number;
    event: string;
  };
  effect: {
    sceneNumber: number;
    volumeNumber: number;
    event: string;
  };
  type: 'direct' | 'indirect' | 'delayed' | 'chain';
  verified: boolean;
}

// ============================================
// 모티프/상징 관리
// ============================================

export interface RecurringMotif {
  id: string;
  name: string;
  symbol: string;           // 상징 이미지
  meaning: string;          // 의미
  firstAppearance: number;  // 첫 등장 씬
  appearances: {
    sceneNumber: number;
    volumeNumber: number;
    context: string;
    variation: string;       // 변형/발전
  }[];
  evolution: string;         // 모티프의 변화/발전 방향
  targetFrequency: number;   // 목표 등장 빈도 (씬 단위)
}

// ============================================
// 복선 추적기 클래스
// ============================================

export class ForeshadowingTracker {
  private foreshadowings: Map<string, Foreshadowing> = new Map();
  private causalChains: Map<string, CausalChain> = new Map();
  private motifs: Map<string, RecurringMotif> = new Map();
  private currentVolume: number = 1;
  private currentScene: number = 1;

  constructor(volume?: number, scene?: number) {
    if (volume) this.currentVolume = volume;
    if (scene) this.currentScene = scene;
  }

  /**
   * 복선 추가
   */
  addForeshadowing(foreshadowing: Foreshadowing): void {
    this.foreshadowings.set(foreshadowing.id, foreshadowing);
  }

  /**
   * 복선 상태 업데이트
   */
  updateForeshadowingStatus(id: string, status: Foreshadowing['status'], details?: Partial<Foreshadowing>): void {
    const f = this.foreshadowings.get(id);
    if (f) {
      f.status = status;
      if (details) {
        Object.assign(f, details);
      }
    }
  }

  /**
   * 모티프 추가
   */
  addMotif(motif: RecurringMotif): void {
    this.motifs.set(motif.id, motif);
  }

  /**
   * 인과관계 체인 추가
   */
  addCausalChain(chain: CausalChain): void {
    this.causalChains.set(chain.id, chain);
  }

  /**
   * 현재 씬에서 사용해야 할 복선 정보 생성
   */
  generateSceneForeshadowingGuide(sceneNumber: number, volumeNumber: number): string {
    this.currentScene = sceneNumber;
    this.currentVolume = volumeNumber;

    const toPlant = this.getForeshadowingsToPlant(sceneNumber, volumeNumber);
    const toReinforce = this.getForeshadowingsToReinforce(sceneNumber, volumeNumber);
    const toResolve = this.getForeshadowingsToResolve(sceneNumber, volumeNumber);
    const activeMotifs = this.getActiveMotifs(sceneNumber, volumeNumber);
    const unresolvedWarnings = this.getUnresolvedWarnings(sceneNumber, volumeNumber);

    let guide = `
## 🧵 복선/떡밥 관리 지침

`;

    // 이번 씬에서 설치할 복선
    if (toPlant.length > 0) {
      guide += `### 🌱 이번 씬에서 설치할 복선\n`;
      for (const f of toPlant) {
        guide += `
**[${this.getPriorityEmoji(f.priority)}${f.priority}] ${f.plantDescription}**
- 설치 방법: ${this.getPlantMethodKorean(f.plantMethod)}
- 핵심 키워드: ${f.keywords.join(', ')}
- 관련 인물: ${f.relatedCharacters.join(', ')}
- ⚠️ 너무 노골적으로 설치하지 마세요. 자연스럽게 녹여넣으세요.
- 회수 예정: ${f.payoffTargetVolume ? `${f.payoffTargetVolume}권 ${f.payoffTargetScene}씬` : '미정'}
`;
      }
    }

    // 이번 씬에서 강화할 복선
    if (toReinforce.length > 0) {
      guide += `\n### 🔄 이번 씬에서 강화(리마인드)할 복선\n`;
      for (const f of toReinforce) {
        guide += `
**${f.plantDescription}** (${f.plantedInVolume}권 ${f.plantedInScene}씬에서 설치됨)
- 강화 방법: 간접적으로 떠올리게 하세요 (직접 언급 X)
- 관련 키워드: ${f.keywords.join(', ')} 중 1-2개를 자연스럽게 배치
`;
      }
    }

    // 이번 씬에서 회수할 복선
    if (toResolve.length > 0) {
      guide += `\n### ✅ 이번 씬에서 회수할 복선\n`;
      for (const f of toResolve) {
        guide += `
**[${this.getPriorityEmoji(f.priority)}] ${f.plantDescription}**
- 회수 방법: ${f.payoffDescription || '미정'}
- 회수 기법: ${f.payoffMethod ? this.getPayoffMethodKorean(f.payoffMethod) : '미정'}
- ⚠️ 독자가 "아, 그때 그거!" 하고 깨달을 수 있도록 연결 고리를 명확히 하세요.
`;
      }
    }

    // 활성 모티프
    if (activeMotifs.length > 0) {
      guide += `\n### 🔁 반복 모티프 (자연스럽게 배치)\n`;
      for (const m of activeMotifs) {
        guide += `- **${m.name}** (${m.symbol}): ${m.meaning} - ${m.evolution}\n`;
      }
    }

    // 미해결 복선 경고
    if (unresolvedWarnings.length > 0) {
      guide += `\n### ⚠️ 미해결 복선 경고\n`;
      for (const warning of unresolvedWarnings) {
        guide += `- ${warning}\n`;
      }
    }

    // 기본 지침
    guide += `
### 📖 복선 기본 원칙

1. **체호프의 총**: 의미 없는 디테일을 넣지 마세요. 모든 언급은 나중에 의미가 있어야 합니다.
2. **3번 법칙**: 중요한 복선은 최소 3번 언급/암시 후 회수하세요.
3. **간접 암시**: 직접 말하지 말고 행동, 환경, 대화를 통해 암시하세요.
4. **의외성**: 회수 시 독자의 예상을 약간 비틀어 놀라움을 주세요.
5. **레드 헤링**: 진짜 복선을 숨기기 위해 가짜 단서를 적절히 배치하세요.
`;

    return guide;
  }

  /**
   * 전체 복선 상태 요약
   */
  generateStatusReport(): string {
    const all = Array.from(this.foreshadowings.values());
    const planted = all.filter(f => f.status === 'planted');
    const reinforced = all.filter(f => f.status === 'reinforced');
    const resolved = all.filter(f => f.status === 'resolved');
    const abandoned = all.filter(f => f.status === 'abandoned');

    return `
## 복선 상태 보고서

| 상태 | 개수 |
|------|------|
| 🌱 설치됨 | ${planted.length} |
| 🔄 강화됨 | ${reinforced.length} |
| ✅ 회수됨 | ${resolved.length} |
| ❌ 포기됨 | ${abandoned.length} |

### 미회수 복선 목록
${all.filter(f => f.status !== 'resolved' && f.status !== 'abandoned')
  .map(f => `- [${f.priority}] ${f.plantDescription} (${f.plantedInVolume}권 ${f.plantedInScene}씬)`)
  .join('\n')}
`;
  }

  // ============================================
  // Private Helper Methods
  // ============================================

  private getForeshadowingsToPlant(scene: number, volume: number): Foreshadowing[] {
    return Array.from(this.foreshadowings.values()).filter(
      f => f.plantedInScene === scene && f.plantedInVolume === volume && f.status === 'planted'
    );
  }

  private getForeshadowingsToReinforce(scene: number, volume: number): Foreshadowing[] {
    return Array.from(this.foreshadowings.values()).filter(f => {
      if (f.status === 'resolved' || f.status === 'abandoned') return false;

      // 설치 후 일정 간격으로 강화 필요
      const sceneDistance = (volume - f.plantedInVolume) * 50 + (scene - f.plantedInScene);
      return sceneDistance > 5 && sceneDistance % 10 < 3; // 10씬마다 근처에서 강화
    });
  }

  private getForeshadowingsToResolve(scene: number, volume: number): Foreshadowing[] {
    return Array.from(this.foreshadowings.values()).filter(
      f => f.payoffTargetScene === scene && f.payoffTargetVolume === volume
    );
  }

  private getActiveMotifs(scene: number, volume: number): RecurringMotif[] {
    return Array.from(this.motifs.values()).filter(m => {
      const lastAppearance = m.appearances[m.appearances.length - 1];
      if (!lastAppearance) return true;

      const distance = (volume - lastAppearance.volumeNumber) * 50 + (scene - lastAppearance.sceneNumber);
      return distance >= m.targetFrequency;
    });
  }

  private getUnresolvedWarnings(scene: number, volume: number): string[] {
    const warnings: string[] = [];

    for (const f of Array.from(this.foreshadowings.values())) {
      if (f.status === 'resolved' || f.status === 'abandoned') continue;

      // 회수 예정 씬을 지났는데 아직 미회수
      if (f.payoffTargetVolume && f.payoffTargetScene) {
        if (volume > f.payoffTargetVolume || (volume === f.payoffTargetVolume && scene > f.payoffTargetScene)) {
          warnings.push(
            `❗ "${f.plantDescription}" 복선이 예정 회수 시점(${f.payoffTargetVolume}권 ${f.payoffTargetScene}씬)을 지났습니다!`
          );
        }
      }

      // 너무 오래 방치된 복선
      const distance = (volume - f.plantedInVolume) * 50 + (scene - f.plantedInScene);
      if (distance > 100 && f.priority === 'critical') {
        warnings.push(
          `⚠️ "${f.plantDescription}" 핵심 복선이 ${distance}씬 동안 미회수 상태입니다.`
        );
      }
    }

    return warnings;
  }

  private getPriorityEmoji(priority: Foreshadowing['priority']): string {
    switch (priority) {
      case 'critical': return '🔴';
      case 'major': return '🟠';
      case 'minor': return '🟡';
      case 'subtle': return '🟢';
    }
  }

  private getPlantMethodKorean(method: PlantMethod): string {
    const map: Record<PlantMethod, string> = {
      dialogue: '대화 속에 자연스럽게 삽입',
      description: '배경/환경 묘사에 숨기기',
      action: '행동/사건을 통해 보여주기',
      'internal-thought': '캐릭터의 내면 독백으로',
      environmental: '환경/날씨/계절 변화로 암시',
      symbolic: '상징적 이미지/물건으로 암시',
    };
    return map[method];
  }

  private getPayoffMethodKorean(method: PayoffMethod): string {
    const map: Record<PayoffMethod, string> = {
      revelation: '진실이 밝혀짐',
      confrontation: '직접 대면/직면',
      consequence: '결과가 발생함',
      callback: '과거 장면의 콜백',
      twist: '반전으로 회수',
      resolution: '문제가 해결됨',
    };
    return map[method];
  }
}

export default ForeshadowingTracker;
