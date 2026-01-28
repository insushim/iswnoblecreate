/**
 * 감각 몰입 시스템 (SensoryImmersionSystem) v1.0
 *
 * 오감 묘사 레이어링으로 독자를 장면 속에 몰입시키는 시스템
 * - 5감각 + 고유감각 + 내부감각 묘사 가이드
 * - 장소/시간대별 감각 팔레트 제공
 * - 감정-감각 매핑
 * - 한국 역사 시대별 감각 데이터베이스
 * - 계절/날씨 감각 맵
 */

// ============================================
// 감각 타입 정의
// ============================================

export type SensoryType =
  | 'visual'         // 시각
  | 'auditory'       // 청각
  | 'tactile'        // 촉각
  | 'olfactory'      // 후각
  | 'gustatory'      // 미각
  | 'proprioceptive' // 고유감각 (위치/움직임/균형)
  | 'interoceptive'; // 내부감각 (심박/호흡/통증/체온)

export interface SensoryPalette {
  location: string;
  timeOfDay: string;
  season: string;
  weather: string;
  senses: {
    visual: string[];
    auditory: string[];
    tactile: string[];
    olfactory: string[];
    gustatory: string[];
    proprioceptive: string[];
    interoceptive: string[];
  };
}

export interface EmotionSensoryMap {
  emotion: string;
  physicalSensations: string[];
  environmentalReflections: string[];
  perceptionChanges: string[];   // 감정에 의한 지각 변화
}

// ============================================
// 감각 몰입 시스템 클래스
// ============================================

export class SensoryImmersionSystem {

  /**
   * 씬 맞춤형 감각 가이드 생성
   */
  generateSensoryGuide(sceneContext: {
    location: string;
    timeframe: string;
    emotionalGoal: string;
    sceneType: string;
    era?: string;          // 시대 (예: "조선", "현대")
    season?: string;
    weather?: string;
  }): string {
    const palette = this.buildSensoryPalette(sceneContext);
    const emotionSensory = this.getEmotionSensoryMap(sceneContext.emotionalGoal);

    return `
---
## 감각 몰입 가이드 (이 씬 전용)

### 핵심 규칙
- **매 단락**: 최소 2가지 감각 사용 (시각 + 1가지 이상)
- **매 페이지**: 5감각 중 최소 3가지 등장
- **감정 장면**: 내부감각(심박, 호흡, 체온) 필수 포함
- **전투/행동 장면**: 고유감각(균형, 움직임) 필수 포함

### 이 씬의 감각 팔레트
**장소**: ${sceneContext.location} | **시간**: ${sceneContext.timeframe}

#### 시각 (보이는 것)
${palette.senses.visual.map(v => `- ${v}`).join('\n')}

#### 청각 (들리는 것)
${palette.senses.auditory.map(a => `- ${a}`).join('\n')}

#### 촉각 (느껴지는 것)
${palette.senses.tactile.map(t => `- ${t}`).join('\n')}

#### 후각 (맡아지는 것)
${palette.senses.olfactory.map(o => `- ${o}`).join('\n')}

#### 미각 (맛/입안 감각)
${palette.senses.gustatory.map(g => `- ${g}`).join('\n')}

#### 고유감각 (몸의 움직임/위치)
${palette.senses.proprioceptive.map(p => `- ${p}`).join('\n')}

#### 내부감각 (몸 안의 느낌)
${palette.senses.interoceptive.map(i => `- ${i}`).join('\n')}

### 감정 "${sceneContext.emotionalGoal}"의 감각적 표현
${emotionSensory.physicalSensations.map(p => `- 신체: ${p}`).join('\n')}
${emotionSensory.environmentalReflections.map(e => `- 환경 반영: ${e}`).join('\n')}
${emotionSensory.perceptionChanges.map(pc => `- 지각 변화: ${pc}`).join('\n')}

### 감각 묘사 기법
1. **감각 전이 (synesthesia)**: 한 감각을 다른 감각으로 표현
   - "차가운 침묵" (청각→촉각), "날카로운 향기" (후각→촉각)
   - "어둠의 무게" (시각→촉각), "쓴 기억" (기억→미각)

2. **주관적 감각**: 감정에 따라 같은 감각이 다르게 느껴지도록
   - 행복할 때: "햇살이 따뜻하게 어깨를 감쌌다"
   - 슬플 때: "햇살이 무심하게 내리쬐었다"

3. **감각의 부재**: 감각이 사라지는 것도 묘사
   - "갑자기 모든 소리가 멀어졌다" (충격 시)
   - "맛을 느낄 수 없었다" (상실 시)

4. **미세 감각**: 보통 의식하지 못하는 섬세한 감각
   - 의자의 나무결이 손등에 닿는 느낌
   - 먼 곳에서 들려오는 개 짖는 소리
   - 옷깃에서 나는 희미한 향
`;
  }

  // ============================================
  // Private: 감각 팔레트 구축
  // ============================================

  private buildSensoryPalette(context: {
    location: string;
    timeframe: string;
    emotionalGoal: string;
    era?: string;
    season?: string;
    weather?: string;
  }): SensoryPalette {
    const loc = context.location.toLowerCase();
    const time = context.timeframe.toLowerCase();
    const era = context.era?.toLowerCase() || '';
    const season = context.season?.toLowerCase() || '';
    const isHistorical = era.includes('조선') || era.includes('역사') || era.includes('고려');

    // 기본 팔레트
    const palette: SensoryPalette = {
      location: context.location,
      timeOfDay: context.timeframe,
      season: context.season || '',
      weather: context.weather || '',
      senses: {
        visual: [],
        auditory: [],
        tactile: [],
        olfactory: [],
        gustatory: [],
        proprioceptive: [],
        interoceptive: [],
      },
    };

    // 시간대별 시각
    if (time.includes('새벽') || time.includes('dawn')) {
      palette.senses.visual.push('동쪽 하늘의 회색빛이 서서히 분홍으로', '이슬에 젖은 풀잎의 반짝임', '흐릿한 윤곽만 보이는 주변 사물');
      palette.senses.auditory.push('새벽닭 울음소리', '고요한 정적 속 먼 개 짖는 소리', '자신의 호흡 소리');
    } else if (time.includes('아침') || time.includes('morning')) {
      palette.senses.visual.push('비스듬한 아침 햇살의 긴 그림자', '물안개가 걷히는 풍경', '눈이 부신 햇살');
      palette.senses.auditory.push('새소리', '사람들의 움직이는 소리', '문 열리는 소리');
    } else if (time.includes('밤') || time.includes('night') || time.includes('야간')) {
      palette.senses.visual.push('달빛에 은빛으로 빛나는 지붕/나뭇잎', '횃불/등불의 흔들리는 그림자', '어둠 속 구별하기 힘든 형체');
      palette.senses.auditory.push('벌레 소리', '바람 소리', '자신의 발소리가 유독 크게');
    } else {
      palette.senses.visual.push('한낮의 선명한 색감', '움직이는 사람들과 사물', '빛과 그림자의 대비');
      palette.senses.auditory.push('사람들의 대화 소리', '일상의 소음', '바람에 흔들리는 소리');
    }

    // 장소별 감각
    if (loc.includes('궁') || loc.includes('전') || loc.includes('관아')) {
      palette.senses.visual.push('단청의 붉은색과 녹색', '기와 위의 빛 반사', '넓은 마당의 하얀 자갈');
      palette.senses.tactile.push('차가운 대리석 바닥', '두꺼운 문턱의 높이', '관복 비단의 매끄러움');
      palette.senses.olfactory.push('향의 연기 냄새', '오래된 나무 냄새', '먹물 향');
    } else if (loc.includes('산') || loc.includes('숲') || loc.includes('들') || loc.includes('야외')) {
      palette.senses.visual.push('나뭇잎 사이로 비치는 빛', '멀리 보이는 산능선', '흙길의 질감');
      palette.senses.tactile.push('바람이 볼을 스치는 감촉', '발밑 흙/돌의 울퉁불퉁함', '풀잎의 까끄라움');
      palette.senses.olfactory.push('흙 냄새', '풀 냄새', '나무 수액 향');
    } else if (loc.includes('시장') || loc.includes('마을') || loc.includes('거리')) {
      palette.senses.visual.push('사람들의 움직임과 옷 색깔', '물건이 진열된 가판대', '먼지가 이는 길');
      palette.senses.auditory.push('물건 파는 소리', '흥정하는 목소리들', '아이들 뛰는 소리');
      palette.senses.olfactory.push('음식 굽는 냄새', '사람 냄새', '짚 냄새');
    } else if (loc.includes('전장') || loc.includes('전쟁') || loc.includes('전투')) {
      palette.senses.visual.push('칼날의 번뜩임', '피와 흙이 뒤섞인 색', '쓰러진 사람들');
      palette.senses.auditory.push('금속 부딪치는 소리', '비명과 고함', '화살 날아가는 휘파람');
      palette.senses.olfactory.push('피 냄새', '화약/연기 냄새', '땀과 흙 냄새');
      palette.senses.tactile.push('무기의 진동', '갑옷의 무게', '땀에 젖은 손잡이의 미끄러움');
    } else if (loc.includes('방') || loc.includes('집') || loc.includes('실내')) {
      palette.senses.visual.push('창으로 들어오는 빛의 각도', '벽의 질감과 색', '가구의 그림자');
      palette.senses.tactile.push('바닥의 온도', '이불/방석의 질감', '문고리의 차가움');
      palette.senses.olfactory.push('나무 냄새', '음식 냄새의 잔향', '사람의 체취');
    }

    // 계절별 감각
    if (season.includes('봄')) {
      palette.senses.olfactory.push('꽃 향기', '젖은 흙 냄새', '새싹의 풋풋한 향');
      palette.senses.visual.push('연두색 새잎', '꽃잎이 흩날리는 모습');
      palette.senses.tactile.push('포근한 바람', '간간이 스치는 차가운 기운');
    } else if (season.includes('여름')) {
      palette.senses.tactile.push('끈적이는 더위', '땀에 젖은 옷', '뜨거운 햇살');
      palette.senses.auditory.push('매미 울음', '천둥소리', '개울물 소리');
      palette.senses.olfactory.push('풀 냄새', '흙 냄새', '비 오기 전 습한 공기');
    } else if (season.includes('가을')) {
      palette.senses.visual.push('붉고 노란 단풍', '쌀쌀한 공기의 투명함');
      palette.senses.olfactory.push('낙엽 냄새', '서늘한 공기', '곡식 익는 냄새');
      palette.senses.tactile.push('서늘한 바람', '바스락거리는 낙엽', '선선한 공기');
    } else if (season.includes('겨울')) {
      palette.senses.tactile.push('뼈를 에는 추위', '얼어붙은 손끝', '코끝의 시림');
      palette.senses.visual.push('하얀 입김', '흰 눈 위의 발자국', '앙상한 나뭇가지');
      palette.senses.auditory.push('눈 밟는 소리', '바람 소리', '고요함');
    }

    // 역사 시대 특수 감각
    if (isHistorical) {
      palette.senses.gustatory.push('된장/간장의 짠맛', '막걸리의 텁텁함', '숯불에 구운 고기의 훈연 맛');
      palette.senses.olfactory.push('장작 타는 냄새', '솔잎 향', '한약 냄새');
      palette.senses.auditory.push('나무문 삐걱거리는 소리', '말발굽 소리', '북소리');
    }

    // 기본 고유/내부 감각
    palette.senses.proprioceptive.push(
      '걸음의 무게감', '몸의 기울어짐', '근육의 긴장/이완', '손끝의 미세한 떨림'
    );
    palette.senses.interoceptive.push(
      '심장 박동의 속도', '호흡의 깊이', '위장의 뒤틀림', '목구멍의 건조함/습함'
    );

    return palette;
  }

  private getEmotionSensoryMap(emotionalGoal: string): EmotionSensoryMap {
    const emotionMaps: Record<string, EmotionSensoryMap> = {
      '긴장': {
        emotion: '긴장',
        physicalSensations: ['어깨가 귀까지 올라감', '손에 땀이 남', '목이 뻣뻣해짐', '호흡이 얕아짐'],
        environmentalReflections: ['공간이 좁아지는 느낌', '소리가 더 크게 들림', '시간이 느리게 가는 듯'],
        perceptionChanges: ['주변 시야가 좁아짐', '작은 소리도 크게 들림', '감각이 예민해짐'],
      },
      '슬픔': {
        emotion: '슬픔',
        physicalSensations: ['명치가 무거움', '목구멍이 조여옴', '눈이 뜨거워짐', '온몸에 힘이 빠짐'],
        environmentalReflections: ['색이 바랜 것처럼', '공간이 텅 빈 느낌', '빛이 흐릿해 보임'],
        perceptionChanges: ['시간이 멈춘 듯', '소리가 멀어짐', '맛을 느끼지 못함'],
      },
      '분노': {
        emotion: '분노',
        physicalSensations: ['관자놀이가 뜀', '주먹에 힘이 들어감', '이를 악물게 됨', '체온이 상승함'],
        environmentalReflections: ['모든 것이 거슬림', '공간이 답답해짐', '빛이 강렬해 보임'],
        perceptionChanges: ['시야가 빨갛게/좁아짐', '소리가 찌르듯 날카롭게', '시간이 빠르게 감'],
      },
      '두려움': {
        emotion: '두려움',
        physicalSensations: ['등골이 서늘함', '심장이 멎는 느낌', '다리에 힘이 빠짐', '입안이 마름'],
        environmentalReflections: ['그림자가 길어지는 느낌', '공간이 위협적으로', '소리가 왜곡됨'],
        perceptionChanges: ['감각이 극도로 예민해짐', '시간이 느려짐', '몸이 얼어붙음'],
      },
      '기쁨': {
        emotion: '기쁨',
        physicalSensations: ['가슴이 따뜻함', '입꼬리가 올라감', '발걸음이 가벼움', '에너지가 넘침'],
        environmentalReflections: ['빛이 밝아 보임', '색이 선명해짐', '공간이 넓어지는 느낌'],
        perceptionChanges: ['모든 것이 아름다워 보임', '시간이 빠르게 감', '감각이 풍부해짐'],
      },
      '충격': {
        emotion: '충격',
        physicalSensations: ['숨이 멎음', '머리가 텅 빔', '몸이 굳음', '귀가 먹먹함'],
        environmentalReflections: ['세상이 기울어지는 느낌', '소리가 사라짐', '시간이 정지함'],
        perceptionChanges: ['감각이 일시 차단됨', '현실감 상실', '터널 시야'],
      },
    };

    // 매칭되는 감정 찾기
    for (const [key, map] of Object.entries(emotionMaps)) {
      if (emotionalGoal.includes(key)) return map;
    }

    // 기본값
    return {
      emotion: emotionalGoal,
      physicalSensations: ['호흡의 변화', '근육의 긴장/이완', '체온의 미세한 변화'],
      environmentalReflections: ['주변 환경이 감정을 반영하도록 묘사하세요'],
      perceptionChanges: ['감정에 따라 지각이 변화하도록 묘사하세요'],
    };
  }
}

export default SensoryImmersionSystem;
