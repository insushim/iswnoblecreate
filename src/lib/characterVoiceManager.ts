/**
 * 캐릭터 음성 일관성 시스템 (CharacterVoiceManager)
 *
 * 등장인물별 고유한 말투/어투를 정의하고 유지
 * - 대사 패턴 분석 및 강제
 * - 사회적 지위/관계에 따른 경어법
 * - 감정 상태에 따른 말투 변화
 * - 시대별 언어 차이 (현대어 vs 고어)
 * - 캐릭터 성장에 따른 말투 변화
 */

// ============================================
// 캐릭터 음성 프로필
// ============================================

export interface CharacterVoice {
  characterId: string;
  characterName: string;

  // 기본 말투 특성
  speechPattern: {
    formality: 1 | 2 | 3 | 4 | 5;       // 격식 수준
    speed: 'slow' | 'normal' | 'fast';    // 말 속도
    verbosity: 'terse' | 'moderate' | 'verbose';  // 말의 양
    directness: 'indirect' | 'balanced' | 'direct'; // 직접성
    educationLevel: 'uneducated' | 'basic' | 'educated' | 'scholarly'; // 교육 수준
    era: 'ancient' | 'joseon' | 'modern' | 'contemporary'; // 시대
  };

  // 말버릇/특징적 표현
  speechHabits: {
    catchPhrases: string[];       // 자주 쓰는 말/입버릇
    fillerWords: string[];        // 추임새/군말
    exclamations: string[];       // 감탄사
    endingStyles: string[];       // 종결어미 패턴
    avoidWords: string[];         // 절대 안 쓰는 표현
    uniqueExpressions: string[];  // 고유한 표현 방식
  };

  // 대화 상대별 말투 변화
  addressPatterns: {
    targetId: string;       // 상대 캐릭터 ID
    targetName: string;     // 상대 이름
    honorific: string;      // 호칭 (너, 자네, 도련님, 장군님 등)
    formalityShift: number; // 격식 변화 (-2 ~ +2)
    specialRules: string;   // 특별 규칙
  }[];

  // 감정별 말투 변화
  emotionalSpeech: {
    calm: string;      // 평상시
    angry: string;     // 분노 시
    sad: string;       // 슬플 때
    happy: string;     // 기쁠 때
    scared: string;    // 두려울 때
    nervous: string;   // 긴장할 때
    excited: string;   // 흥분할 때
  };

  // 내면 독백 스타일
  innerVoice: {
    style: 'analytical' | 'emotional' | 'practical' | 'philosophical'; // 사고 방식
    selfReference: string;  // 자기 지칭 (나, 본인, 이 강민우가...)
    thinkingPattern: string; // 사고 패턴 설명
    examples: string[];     // 예시 내면 독백
  };

  // 캐릭터 성장에 따른 변화
  evolution: {
    phase: number;          // 현재 단계
    phases: {
      phaseNumber: number;
      triggerEvent: string;  // 변화 트리거
      changes: string;       // 변화 내용
      examples: string[];    // 변화 후 예시
    }[];
  };

  // 비언어적 행동 패턴
  nonverbalHabits: {
    gestureWhenThinking: string;   // 생각할 때 습관
    nervousHabit: string;          // 긴장할 때 습관
    comfortAction: string;         // 안심될 때 행동
    uniqueMannerism: string;       // 고유 버릇
  };
}

// ============================================
// 사전 정의된 캐릭터 음성 (황진 소설용)
// ============================================

export const PREDEFINED_VOICES: Record<string, CharacterVoice> = {
  'gang-minwoo-modern': {
    characterId: 'gang-minwoo-modern',
    characterName: '강민우 (현대)',
    speechPattern: {
      formality: 2,
      speed: 'fast',
      verbosity: 'moderate',
      directness: 'direct',
      educationLevel: 'scholarly',
      era: 'contemporary',
    },
    speechHabits: {
      catchPhrases: ['역사가 증명합니다', '자, 여러분', '이건 팩트입니다'],
      fillerWords: ['음', '그러니까', '아 뭐랄까'],
      exclamations: ['와', '대박', '이런', '헐', '젠장'],
      endingStyles: ['~거든요', '~잖아요', '~입니다', '~거야'],
      avoidWords: ['모르겠다', '관심없다'],
      uniqueExpressions: [
        '역사는 반복됩니다, 하지만 같은 방식으로는 아닙니다',
        '과거를 모르면 미래도 모릅니다',
      ],
    },
    addressPatterns: [],
    emotionalSpeech: {
      calm: '또렷하고 자신감 있는 말투, 강의하듯 설명적',
      angry: '짧고 단호해짐, 말 사이 간격이 짧아짐',
      sad: '조용해지고 말수가 줄어듦, 혼잣말이 늘어남',
      happy: '말이 빨라지고 열정적, 과장된 표현 사용',
      scared: '말을 더듬고 호흡이 불안정, 현대어가 튀어나옴',
      nervous: '속도가 빨라지고 불필요한 말이 늘어남',
      excited: '강의 모드 돌입, 줄줄 지식을 쏟아냄',
    },
    innerVoice: {
      style: 'analytical',
      selfReference: '나',
      thinkingPattern: '역사적 지식을 기반으로 분석적으로 사고. 현재 상황을 역사적 맥락에서 해석하려 함',
      examples: [
        '잠깐, 이건... 1590년이면 임진왜란 2년 전이잖아. 역사책에서 읽은 그대로라면...',
        '이 시대의 무기 체계를 생각하면... 아, 조총이 아직 조선에 없을 때구나.',
        '강민우, 침착해. 네가 아는 역사 지식이 최고의 무기야.',
      ],
    },
    evolution: {
      phase: 1,
      phases: [
        {
          phaseNumber: 1,
          triggerEvent: '빙의 직후',
          changes: '현대적 말투 그대로, 당황하여 현대어가 자주 튀어나옴',
          examples: [
            '"아 진짜? 여기가 조선이라고? 말도 안 돼..."',
            '"핸드폰... 아 맞다, 1590년이지. 씁."',
          ],
        },
        {
          phaseNumber: 2,
          triggerEvent: '조선 생활 적응',
          changes: '현대어 빈도 줄어들고, 상황에 맞게 존댓말 사용 시작',
          examples: [
            '"그대의 말이... 아니, 네 말이 맞소."',
            '"ㅋ... 아니, 그래, 좋은 생각이네."',
          ],
        },
        {
          phaseNumber: 3,
          triggerEvent: '장수로서 각성',
          changes: '위엄 있는 말투 섞임, 현대어와 고어의 자연스러운 혼합',
          examples: [
            '"물러서라. 이 싸움은 내가 끝낸다."',
            '"병법에 이르기를... 아, 손자병법 말고 내 경험으로 얘기하면 말이지."',
          ],
        },
      ],
    },
    nonverbalHabits: {
      gestureWhenThinking: '손가락으로 관자놀이를 두드린다',
      nervousHabit: '목 뒤를 긁는다',
      comfortAction: '깊은 숨을 내쉬며 어깨를 편다',
      uniqueMannerism: '흥미로운 사실을 발견하면 검지로 허공을 가리킨다',
    },
  },

  'kim-yeomul': {
    characterId: 'kim-yeomul',
    characterName: '김여물',
    speechPattern: {
      formality: 4,
      speed: 'normal',
      verbosity: 'moderate',
      directness: 'indirect',
      educationLevel: 'educated',
      era: 'joseon',
    },
    speechHabits: {
      catchPhrases: ['도련님', '소인이', '어찌...'],
      fillerWords: ['그, 저...', '아니 그러니까...'],
      exclamations: ['이런!', '세상에!', '아이고!'],
      endingStyles: ['~옵니다', '~사옵니다', '~이옵니다', '~소서'],
      avoidWords: [],
      uniqueExpressions: [
        '소인은 도련님을 끝까지 모시겠사옵니다',
      ],
    },
    addressPatterns: [
      {
        targetId: 'gang-minwoo',
        targetName: '강민우(황진)',
        honorific: '도련님',
        formalityShift: 2,
        specialRules: '항상 극존칭 사용, 절대 반말 금지',
      },
    ],
    emotionalSpeech: {
      calm: '공손하고 차분한 조선시대 하인의 말투',
      angry: '격식은 유지하되 목소리에 힘이 들어감',
      sad: '목이 잠기고 말끝이 떨림',
      happy: '목소리가 밝아지되 격식은 유지',
      scared: '말이 빨라지고 더듬음',
      nervous: '손을 비비며 조심스럽게',
      excited: '눈이 빛나며 말이 약간 빨라짐',
    },
    innerVoice: {
      style: 'practical',
      selfReference: '소인',
      thinkingPattern: '충성과 의무감 기반 실용적 사고',
      examples: [
        '도련님이 이상해지셨다... 하지만 소인은 모실 뿐이다.',
        '이건 분명 하늘이 보내신 분이시다. 도련님을 끝까지 지켜드리리.',
      ],
    },
    evolution: {
      phase: 1,
      phases: [
        {
          phaseNumber: 1,
          triggerEvent: '강민우 빙의 직후',
          changes: '도련님의 변화에 혼란스러워하며 더 조심스러워짐',
          examples: ['"도, 도련님? 괜찮으십니까?"'],
        },
        {
          phaseNumber: 2,
          triggerEvent: '강민우의 능력 인정',
          changes: '존경이 더해지고 확신을 갖게 됨',
          examples: ['"도련님은... 하늘이 보내신 분이십니다!"'],
        },
      ],
    },
    nonverbalHabits: {
      gestureWhenThinking: '턱을 쓰다듬는다',
      nervousHabit: '손을 비빈다',
      comfortAction: '허리를 깊이 숙여 인사한다',
      uniqueMannerism: '놀라면 한 발 뒤로 물러선다',
    },
  },

  'bae-dolsoe': {
    characterId: 'bae-dolsoe',
    characterName: '배돌쇠',
    speechPattern: {
      formality: 1,
      speed: 'fast',
      verbosity: 'verbose',
      directness: 'direct',
      educationLevel: 'uneducated',
      era: 'joseon',
    },
    speechHabits: {
      catchPhrases: ['헤헤', '도련님!', '제가 할게요!', '걱정 마이소!'],
      fillerWords: ['그, 뭐냐면', '아이고'],
      exclamations: ['엇!', '아이고!', '으으!', '어라?'],
      endingStyles: ['~요', '~입니더', '~이유', '~구만유'],
      avoidWords: [],
      uniqueExpressions: [
        '이 배돌쇠가 있는 한 걱정 마이소!',
      ],
    },
    addressPatterns: [
      {
        targetId: 'gang-minwoo',
        targetName: '강민우(황진)',
        honorific: '도련님',
        formalityShift: 2,
        specialRules: '충성스럽지만 격식이 서투름, 가끔 실수',
      },
    ],
    emotionalSpeech: {
      calm: '밝고 활기찬 사투리 섞인 말투',
      angry: '거친 욕설과 큰 소리',
      sad: '코를 훌쩍이며 서툰 위로',
      happy: '더 시끄러워지고 과장됨',
      scared: '말이 빨라지고 목소리가 높아짐',
      nervous: '헛웃음을 치며 허둥지둥',
      excited: '온몸으로 표현하며 주위 사람에게도 알림',
    },
    innerVoice: {
      style: 'emotional',
      selfReference: '나',
      thinkingPattern: '단순하고 직관적, 감정 중심 사고',
      examples: [
        '도련님은 정말 대단한 분이시다. 이 은혜를 반드시 갚아드려야 해!',
        '배가 고프다... 밥 언제 먹지?',
      ],
    },
    evolution: {
      phase: 1,
      phases: [
        {
          phaseNumber: 1,
          triggerEvent: '강민우에게 구출됨',
          changes: '맹목적 충성, 과도한 열정',
          examples: ['"도련님! 이 목숨 다 바치겠습니더!"'],
        },
        {
          phaseNumber: 2,
          triggerEvent: '전투 경험',
          changes: '용맹함이 더해지고 약간의 차분함',
          examples: ['"도련님, 제가 앞에 섭니더. 걱정 마이소."'],
        },
      ],
    },
    nonverbalHabits: {
      gestureWhenThinking: '머리를 긁적인다',
      nervousHabit: '발을 동동 구른다',
      comfortAction: '크게 웃는다',
      uniqueMannerism: '기쁘면 어깨춤을 춘다',
    },
  },
};

// ============================================
// 캐릭터 음성 관리자 클래스
// ============================================

export class CharacterVoiceManager {
  private voices: Map<string, CharacterVoice> = new Map();
  private dialogueHistory: Map<string, string[]> = new Map();

  constructor(voices?: CharacterVoice[]) {
    if (voices) {
      for (const voice of voices) {
        this.voices.set(voice.characterId, voice);
      }
    }
  }

  /**
   * 캐릭터 음성 등록
   */
  registerVoice(voice: CharacterVoice): void {
    this.voices.set(voice.characterId, voice);
  }

  /**
   * 씬에 참여하는 캐릭터들의 음성 가이드 생성
   */
  generateVoiceGuide(participantIds: string[], sceneContext?: string): string {
    let guide = `
## 🗣️ 캐릭터 음성 일관성 지침

### ⛔ 핵심 원칙
- 모든 캐릭터는 **반드시** 아래 정의된 말투를 지켜야 합니다
- 캐릭터의 대사만 봐도 누구인지 알 수 있어야 합니다
- "그가 말했다" 없이 대사만으로 화자를 구분할 수 있게 하세요

`;

    for (const id of participantIds) {
      const voice = this.voices.get(id);
      if (!voice) continue;

      guide += this.generateSingleVoiceGuide(voice, participantIds);
    }

    // 대화 상호작용 규칙
    guide += this.generateInteractionRules(participantIds);

    return guide;
  }

  /**
   * 대사 검증 - 캐릭터에 맞는 대사인지 확인
   */
  validateDialogue(characterId: string, dialogue: string): {
    valid: boolean;
    issues: string[];
    suggestions: string[];
  } {
    const voice = this.voices.get(characterId);
    if (!voice) return { valid: true, issues: [], suggestions: [] };

    const issues: string[] = [];
    const suggestions: string[] = [];

    // 금지 표현 체크
    for (const avoid of voice.speechHabits.avoidWords) {
      if (dialogue.includes(avoid)) {
        issues.push(`"${voice.characterName}"이(가) 사용하지 않는 표현 "${avoid}" 발견`);
      }
    }

    // 시대 불일치 체크
    if (voice.speechPattern.era === 'joseon') {
      const modernWords = ['ㅋㅋ', 'ㅎㅎ', '대박', '갑자기', '완전', '진짜', '오케이', 'OK'];
      for (const word of modernWords) {
        if (dialogue.includes(word)) {
          issues.push(`조선시대 캐릭터 "${voice.characterName}"에게 현대어 "${word}" 사용됨`);
          suggestions.push(`"${word}" 대신 시대에 맞는 표현을 사용하세요`);
        }
      }
    }

    // 격식 수준 체크
    if (voice.speechPattern.formality >= 4) {
      if (dialogue.includes('야') || dialogue.includes('너') || dialogue.match(/~해$/)) {
        issues.push(`높은 격식의 캐릭터 "${voice.characterName}"에게 반말 사용됨`);
      }
    }

    return {
      valid: issues.length === 0,
      issues,
      suggestions,
    };
  }

  /**
   * 캐릭터 성장 단계 업데이트
   */
  updateCharacterPhase(characterId: string, newPhase: number): void {
    const voice = this.voices.get(characterId);
    if (voice) {
      voice.evolution.phase = newPhase;
    }
  }

  // ============================================
  // Private Helper Methods
  // ============================================

  private generateSingleVoiceGuide(voice: CharacterVoice, allParticipants: string[]): string {
    const currentPhase = voice.evolution.phases.find(p => p.phaseNumber === voice.evolution.phase);

    let guide = `
---
### 👤 ${voice.characterName}

**말투 특성:**
- 격식: ${this.getFormalityDescription(voice.speechPattern.formality)}
- 속도: ${voice.speechPattern.speed === 'fast' ? '빠르게' : voice.speechPattern.speed === 'slow' ? '느리게' : '보통'}
- 말의 양: ${voice.speechPattern.verbosity === 'terse' ? '과묵함' : voice.speechPattern.verbosity === 'verbose' ? '수다스러움' : '보통'}
- 직접성: ${voice.speechPattern.directness === 'direct' ? '직설적' : voice.speechPattern.directness === 'indirect' ? '완곡한' : '상황에 따라'}
- 교육 수준: ${this.getEducationDescription(voice.speechPattern.educationLevel)}

**입버릇/자주 쓰는 말:**
${voice.speechHabits.catchPhrases.map(p => `- "${p}"`).join('\n')}

**감탄사:** ${voice.speechHabits.exclamations.join(', ')}
**추임새:** ${voice.speechHabits.fillerWords.join(', ')}
**종결어미:** ${voice.speechHabits.endingStyles.join(', ')}

**감정별 말투:**
- 평소: ${voice.emotionalSpeech.calm}
- 화났을 때: ${voice.emotionalSpeech.angry}
- 슬플 때: ${voice.emotionalSpeech.sad}
- 기쁠 때: ${voice.emotionalSpeech.happy}
- 무서울 때: ${voice.emotionalSpeech.scared}

**내면 독백 스타일:**
- 자기 지칭: "${voice.innerVoice.selfReference}"
- 사고 방식: ${voice.innerVoice.thinkingPattern}
- 예시:
${voice.innerVoice.examples.map(e => `  > ${e}`).join('\n')}

**비언어적 습관:**
- 생각할 때: ${voice.nonverbalHabits.gestureWhenThinking}
- 긴장할 때: ${voice.nonverbalHabits.nervousHabit}
- 편안할 때: ${voice.nonverbalHabits.comfortAction}
- 고유 버릇: ${voice.nonverbalHabits.uniqueMannerism}

${currentPhase ? `
**현재 성장 단계 (${currentPhase.phaseNumber}단계):**
- 트리거: ${currentPhase.triggerEvent}
- 변화: ${currentPhase.changes}
- 예시: ${currentPhase.examples.map(e => `"${e}"`).join(', ')}
` : ''}
`;

    // 대화 상대별 말투
    const relevantPatterns = voice.addressPatterns.filter(p => allParticipants.includes(p.targetId));
    if (relevantPatterns.length > 0) {
      guide += `\n**대화 상대별 말투:**\n`;
      for (const pattern of relevantPatterns) {
        guide += `- ${pattern.targetName}에게: 호칭 "${pattern.honorific}", ${pattern.specialRules}\n`;
      }
    }

    return guide;
  }

  private generateInteractionRules(participantIds: string[]): string {
    if (participantIds.length < 2) return '';

    let rules = `
### 🤝 대화 상호작용 규칙

**대사 구분의 핵심:**
1. 대사의 어휘/종결어미만으로 화자가 구분되어야 합니다
2. 서술태그("~라고 말했다")에 지나치게 의존하지 마세요
3. 각 캐릭터의 고유한 리듬과 호흡을 유지하세요
4. 대화가 길어질 때, 캐릭터별 행동/반응을 사이사이에 넣으세요
5. 한 캐릭터가 다른 캐릭터의 말투를 침범하지 않도록 주의하세요

**대사 서술태그 다양화:**
- ❌ 반복 금지: "~라고 말했다", "~라고 말했다"
- ✅ 다양하게:
  - 행동 + 대사: "그가 검을 들며 말했다"
  - 대사만: "돌아가야 합니다."
  - 반응 + 대사: 눈이 커졌다. "정말입니까?"
  - 대사 + 내면: "그래." 하지만 마음은 달랐다.
`;

    return rules;
  }

  private getFormalityDescription(level: number): string {
    switch (level) {
      case 1: return '매우 캐주얼 (반말, 속어)';
      case 2: return '캐주얼 (반말, 친근)';
      case 3: return '표준 (상황에 따라 존댓말/반말)';
      case 4: return '격식 (존댓말 위주)';
      case 5: return '극존칭 (고어/존경어)';
      default: return '보통';
    }
  }

  private getEducationDescription(level: string): string {
    switch (level) {
      case 'uneducated': return '교육 없음 (문맹, 단순한 표현)';
      case 'basic': return '기본 교육 (읽기 가능, 간단한 표현)';
      case 'educated': return '교육받음 (사자성어, 격언 사용)';
      case 'scholarly': return '학식 높음 (한문, 역사 인용)';
      default: return '보통';
    }
  }
}

export default CharacterVoiceManager;
