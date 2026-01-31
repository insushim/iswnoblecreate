/**
 * 인간 작가 시뮬레이터 (HumanAuthorSimulator)
 *
 * AI가 인간 작가처럼 생각하고, 고민하고, 수정하는 과정을 시뮬레이션
 * - 작가의 창작 프로세스 모방
 * - 무의식적 직관과 의식적 수정의 반복
 * - 감정 이입과 독자 공감 시뮬레이션
 * - 퇴고의 고통과 선택의 과정
 */

import { generateText, generateJSON } from './gemini';
import { GeminiModel } from '@/types';

// ============================================================================
// 작가 페르소나 타입
// ============================================================================

export interface AuthorPersona {
  id: string;
  name: string;
  background: string;
  writingPhilosophy: string;
  strengths: string[];
  weaknesses: string[];
  influences: string[];  // 영향받은 작가들
  obsessions: string[];  // 집착하는 테마/요소
  writingHabits: WritingHabit[];
  innerVoice: InnerVoice;
  emotionalRange: EmotionalRange;
}

export interface WritingHabit {
  habit: string;
  frequency: 'always' | 'often' | 'sometimes' | 'rarely';
  triggerCondition: string;
}

export interface InnerVoice {
  selfDoubt: string[];      // 자기 의심의 목소리
  confidence: string[];     // 자신감의 목소리
  critic: string[];         // 내면의 비평가
  encourager: string[];     // 내면의 격려자
}

export interface EmotionalRange {
  canWrite: string[];       // 잘 표현하는 감정
  struggles: string[];      // 어려워하는 감정
  signature: string;        // 시그니처 감정 톤
}

// ============================================================================
// 창작 프로세스 타입
// ============================================================================

export interface CreativeProcess {
  stage: CreativeStage;
  thoughts: ThoughtProcess[];
  decisions: CreativeDecision[];
  revisions: Revision[];
  breakthroughs: Breakthrough[];
  struggles: Struggle[];
}

export type CreativeStage =
  | 'ideation'           // 아이디어 구상
  | 'outlining'          // 구조화
  | 'first-draft'        // 초고
  | 'cooling-off'        // 숙성 (거리두기)
  | 'revision'           // 수정
  | 'deep-edit'          // 깊은 편집
  | 'polish'             // 다듬기
  | 'final-read';        // 최종 읽기

export interface ThoughtProcess {
  type: 'question' | 'doubt' | 'insight' | 'decision' | 'emotion';
  content: string;
  resolution?: string;
}

export interface CreativeDecision {
  issue: string;
  options: string[];
  chosen: string;
  reasoning: string;
  confidence: number;  // 1-10
}

export interface Revision {
  original: string;
  revised: string;
  reason: string;
  revisionType: 'word' | 'sentence' | 'paragraph' | 'structure' | 'character' | 'plot';
  iterationCount: number;
}

export interface Breakthrough {
  moment: string;
  insight: string;
  impact: string;
}

export interface Struggle {
  problem: string;
  attempts: string[];
  resolution: string | null;
  lessonsLearned: string;
}

// ============================================================================
// 작가 페르소나 프리셋
// ============================================================================

export const AUTHOR_PERSONAS: Record<string, AuthorPersona> = {
  'literary-perfectionist': {
    id: 'literary-perfectionist',
    name: '완벽주의 문학가',
    background: '순수문학 20년차, 다수의 문학상 수상. 한 문장에 3일을 고민하는 것으로 유명.',
    writingPhilosophy: '모든 단어는 존재의 이유가 있어야 한다. 불필요한 것은 독자에 대한 모욕이다.',
    strengths: ['문장 밀도', '은유와 상징', '심리 묘사', '여운'],
    weaknesses: ['속도', '대중성', '과도한 고민'],
    influences: ['김영하', '은희경', '레이먼드 카버', '체호프'],
    obsessions: ['침묵의 의미', '관계의 균열', '일상의 심연'],
    writingHabits: [
      { habit: '한 문장 쓰고 10번 읽기', frequency: 'always', triggerCondition: '모든 문장' },
      { habit: '소리 내어 읽으며 리듬 확인', frequency: 'often', triggerCondition: '문단 완성 후' },
      { habit: '하루 뒤에 다시 보기', frequency: 'always', triggerCondition: '중요한 장면' },
    ],
    innerVoice: {
      selfDoubt: ['이게 최선인가?', '더 정확한 단어가 있을 텐데', '독자가 이해할까?'],
      confidence: ['이 문장은 살아있다', '드디어 찾았다'],
      critic: ['진부해', '설명이 많아', '감정을 강요하고 있어'],
      encourager: ['방향은 맞아', '조금만 더'],
    },
    emotionalRange: {
      canWrite: ['쓸쓸함', '체념', '미묘한 슬픔', '씁쓸한 깨달음'],
      struggles: ['격렬한 분노', '순수한 기쁨'],
      signature: '담담한 비애',
    },
  },

  'web-novel-master': {
    id: 'web-novel-master',
    name: '웹소설 마스터',
    background: '웹소설 7년차, 누적 조회수 10억. 독자 반응을 본능적으로 읽는다.',
    writingPhilosophy: '독자가 다음 화를 기다리게 만드는 것이 작가의 의무다.',
    strengths: ['훅', '페이싱', '캐릭터 매력', '사이다 전개'],
    weaknesses: ['문학성', '과도한 클리셰 의존'],
    influences: ['장르 소설 베스트셀러들', '만화', '게임'],
    obsessions: ['성장', '복수', '역전', '인정'],
    writingHabits: [
      { habit: '댓글 반응 체크', frequency: 'always', triggerCondition: '연재 후' },
      { habit: '훅으로 시작하고 훅으로 끝내기', frequency: 'always', triggerCondition: '모든 화' },
      { habit: '3줄 안에 몰입시키기', frequency: 'always', triggerCondition: '장면 시작' },
    ],
    innerVoice: {
      selfDoubt: ['이거 재미없나?', '독자가 이탈할 것 같은데'],
      confidence: ['이건 터진다', '댓글이 폭발할 거야'],
      critic: ['전개가 늘어져', '긴장감이 없어', '뻔해'],
      encourager: ['독자들이 좋아할 거야', '반전이 살렸어'],
    },
    emotionalRange: {
      canWrite: ['통쾌함', '분노', '설렘', '충격'],
      struggles: ['섬세한 슬픔', '복잡한 감정'],
      signature: '짜릿한 쾌감',
    },
  },

  'emotional-craftsman': {
    id: 'emotional-craftsman',
    name: '감정의 장인',
    background: '로맨스/드라마 전문 15년차. 독자를 울리는 것으로 유명.',
    writingPhilosophy: '독자의 마음을 움직이지 못하면 그 글은 죽은 것이다.',
    strengths: ['감정선', '관계 묘사', '대화', '감정 이입'],
    weaknesses: ['액션', '세계관 구축'],
    influences: ['공지영', '조남주', '제인 오스틴'],
    obsessions: ['사랑의 형태', '상실', '치유', '성장'],
    writingHabits: [
      { habit: '캐릭터가 되어 느끼기', frequency: 'always', triggerCondition: '감정 장면' },
      { habit: '눈물이 날 때까지 쓰기', frequency: 'sometimes', triggerCondition: '클라이맥스' },
      { habit: '실제 경험 떠올리기', frequency: 'often', triggerCondition: '진정성 필요할 때' },
    ],
    innerVoice: {
      selfDoubt: ['너무 감상적인가?', '억지스럽지 않나?'],
      confidence: ['이건 진짜야', '독자도 느낄 거야'],
      critic: ['신파야', '감정 강요하지 마', '보여줘, 말하지 말고'],
      encourager: ['진심이 느껴져', '캐릭터가 살아있어'],
    },
    emotionalRange: {
      canWrite: ['모든 형태의 사랑', '상실의 슬픔', '희망'],
      struggles: ['냉소', '무감정'],
      signature: '가슴 먹먹한 온기',
    },
  },

  'plot-architect': {
    id: 'plot-architect',
    name: '플롯 설계자',
    background: '스릴러/미스터리 전문 12년차. 복잡한 플롯의 장인.',
    writingPhilosophy: '모든 조각은 퍼즐의 일부다. 독자는 퍼즐을 맞추는 쾌감을 느껴야 한다.',
    strengths: ['복선', '반전', '논리적 구성', '긴장감'],
    weaknesses: ['캐릭터 감정', '서정적 묘사'],
    influences: ['히가시노 게이고', '아가사 크리스티', '길리언 플린'],
    obsessions: ['진실', '정의', '인간의 어두운 면'],
    writingHabits: [
      { habit: '역순 구성 (결말부터)', frequency: 'always', triggerCondition: '플롯 설계' },
      { habit: '복선 체크리스트 작성', frequency: 'always', triggerCondition: '초고 완성 후' },
      { habit: '독자 시점으로 추리해보기', frequency: 'often', triggerCondition: '반전 장면' },
    ],
    innerVoice: {
      selfDoubt: ['너무 뻔하지 않나?', '복선이 티나나?'],
      confidence: ['이 반전은 완벽해', '아무도 예상 못할 거야'],
      critic: ['논리적 허점이 있어', '페어플레이가 아니야', '독자를 속이지 말고 놀라게 해'],
      encourager: ['구조가 단단해', '긴장감이 살아있어'],
    },
    emotionalRange: {
      canWrite: ['긴장', '공포', '의심', '충격'],
      struggles: ['로맨틱한 감정', '평화로운 일상'],
      signature: '소름 끼치는 반전',
    },
  },
};

// ============================================================================
// 인간 작가 시뮬레이터 클래스
// ============================================================================

export class HumanAuthorSimulator {
  private persona: AuthorPersona;
  private creativeHistory: CreativeProcess[] = [];
  private model: GeminiModel = 'gemini-2.0-flash';

  constructor(personaId: string = 'literary-perfectionist') {
    this.persona = AUTHOR_PERSONAS[personaId] || AUTHOR_PERSONAS['literary-perfectionist'];
  }

  setPersona(personaId: string): void {
    this.persona = AUTHOR_PERSONAS[personaId] || this.persona;
  }

  setModel(model: GeminiModel): void {
    this.model = model;
  }

  /**
   * 작가처럼 생각하며 글쓰기
   */
  async writeAsHumanAuthor(
    task: {
      type: 'scene' | 'chapter' | 'dialogue' | 'description' | 'opening' | 'ending';
      context: string;
      requirements: string[];
      emotionalTarget?: string;
    }
  ): Promise<{
    content: string;
    creativeProcess: CreativeProcess;
    authorNotes: string;
  }> {
    const prompt = this.buildHumanWritingPrompt(task);

    const result = await generateJSON<{
      thinking: string[];
      drafts: { version: number; content: string; selfCritique: string }[];
      finalContent: string;
      authorNotes: string;
      decisions: { issue: string; chosen: string; reason: string }[];
      struggles: { problem: string; resolution: string }[];
    }>(prompt, this.model);

    const creativeProcess: CreativeProcess = {
      stage: 'first-draft',
      thoughts: result.thinking.map(t => ({
        type: 'insight' as const,
        content: t,
      })),
      decisions: result.decisions.map(d => ({
        issue: d.issue,
        options: [],
        chosen: d.chosen,
        reasoning: d.reason,
        confidence: 7,
      })),
      revisions: result.drafts.slice(1).map((draft, i) => ({
        original: result.drafts[i].content,
        revised: draft.content,
        reason: draft.selfCritique,
        revisionType: 'paragraph' as const,
        iterationCount: i + 1,
      })),
      breakthroughs: [],
      struggles: result.struggles.map(s => ({
        problem: s.problem,
        attempts: [],
        resolution: s.resolution,
        lessonsLearned: '',
      })),
    };

    this.creativeHistory.push(creativeProcess);

    return {
      content: result.finalContent,
      creativeProcess,
      authorNotes: result.authorNotes,
    };
  }

  /**
   * 인간 작가처럼 퇴고하기
   */
  async reviseAsHumanAuthor(
    content: string,
    revisionFocus: ('style' | 'emotion' | 'pacing' | 'dialogue' | 'description' | 'logic')[]
  ): Promise<{
    revisedContent: string;
    changes: Revision[];
    innerDialogue: string;
  }> {
    const prompt = `당신은 ${this.persona.name}입니다.

【작가 프로필】
${this.persona.background}
창작 철학: ${this.persona.writingPhilosophy}
강점: ${this.persona.strengths.join(', ')}
약점: ${this.persona.weaknesses.join(', ')}

【내면의 목소리】
의심: ${this.persona.innerVoice.selfDoubt.join(' / ')}
비평: ${this.persona.innerVoice.critic.join(' / ')}

═══════════════════════════════════════════════════════════════

지금 당신은 자신이 쓴 원고를 퇴고하고 있습니다.
마치 실제 작가가 며칠 뒤 자기 글을 다시 보듯이, 냉정하고 비판적인 눈으로 봅니다.

【퇴고 대상 원고】
${content}

【집중할 영역】
${revisionFocus.join(', ')}

═══════════════════════════════════════════════════════════════

다음 과정을 거쳐 퇴고하세요:

1. **첫 읽기 반응**: 객관적으로 읽으며 느낀 점 (좋은 점, 불편한 점)

2. **내면의 비평가 목소리**: 당신의 내면 비평가가 뭐라고 하는지
   - "${this.persona.innerVoice.critic[0]}"
   - 이런 식으로 자신에게 엄격하게

3. **문제 발견**: 구체적으로 어디가 문제인지 (줄 번호나 인용과 함께)

4. **해결 시도**: 각 문제에 대해 여러 해결책을 시도하고 최선을 선택

5. **최종 수정본**: 완전히 수정된 텍스트

출력 형식 (JSON):
{
  "firstReaction": "첫 읽기 반응",
  "innerCritic": ["비평가 목소리 1", "비평가 목소리 2"],
  "problems": [
    {
      "location": "문제 위치 (인용)",
      "issue": "무엇이 문제인지",
      "severity": "critical/major/minor"
    }
  ],
  "revisions": [
    {
      "original": "원문",
      "options": ["수정안 1", "수정안 2"],
      "chosen": "선택한 수정안",
      "reason": "선택 이유"
    }
  ],
  "innerDialogue": "퇴고하며 느낀 내면의 대화 (작가의 고뇌)",
  "revisedContent": "최종 수정된 전체 텍스트"
}`;

    const result = await generateJSON<{
      firstReaction: string;
      innerCritic: string[];
      problems: { location: string; issue: string; severity: string }[];
      revisions: { original: string; options: string[]; chosen: string; reason: string }[];
      innerDialogue: string;
      revisedContent: string;
    }>(prompt, this.model);

    return {
      revisedContent: result.revisedContent,
      changes: result.revisions.map((r, i) => ({
        original: r.original,
        revised: r.chosen,
        reason: r.reason,
        revisionType: 'sentence' as const,
        iterationCount: i + 1,
      })),
      innerDialogue: result.innerDialogue,
    };
  }

  /**
   * 감정 이입 시뮬레이션
   */
  async simulateEmotionalImmersion(
    character: {
      name: string;
      personality: string;
      currentSituation: string;
      emotionalState: string;
    },
    sceneContext: string
  ): Promise<{
    immersionProcess: string;
    emotionalInsights: string[];
    authenticReactions: string[];
    writingGuidance: string;
  }> {
    const prompt = `당신은 ${this.persona.name}입니다.
감정 표현 특기: ${this.persona.emotionalRange.canWrite.join(', ')}
시그니처 감정: ${this.persona.emotionalRange.signature}

═══════════════════════════════════════════════════════════════

지금 당신은 캐릭터에 감정 이입하려고 합니다.
실제 작가들이 하듯이, 캐릭터가 "되어" 느껴보세요.

【캐릭터】
이름: ${character.name}
성격: ${character.personality}
현재 상황: ${character.currentSituation}
감정 상태: ${character.emotionalState}

【장면 맥락】
${sceneContext}

═══════════════════════════════════════════════════════════════

다음을 수행하세요:

1. **감정 이입 과정**: 캐릭터가 되어가는 과정을 서술
   - 눈을 감고 그 상황에 있다고 상상
   - 신체적으로 무엇을 느끼는지
   - 어떤 생각이 스치는지
   - 과거의 어떤 기억이 떠오르는지

2. **진정성 있는 반응들**: 이 캐릭터가 보일 수 있는 진짜 반응들
   - 클리셰가 아닌, 이 특정 캐릭터만의 반응
   - 말하지 않는 것, 숨기는 것
   - 무의식적 행동

3. **글쓰기 가이드**: 이 감정을 글로 어떻게 표현할지

출력 형식 (JSON):
{
  "immersionProcess": "감정 이입 과정 서술",
  "physicalSensations": ["신체 감각 1", "신체 감각 2"],
  "flashingThoughts": ["스치는 생각 1", "스치는 생각 2"],
  "hiddenReactions": ["숨기는 것 1", "숨기는 것 2"],
  "authenticReactions": ["진정성 있는 반응 1", "반응 2", "반응 3"],
  "emotionalInsights": ["감정적 통찰 1", "통찰 2"],
  "writingGuidance": "이 감정을 표현하기 위한 구체적 가이드"
}`;

    const result = await generateJSON<{
      immersionProcess: string;
      physicalSensations: string[];
      flashingThoughts: string[];
      hiddenReactions: string[];
      authenticReactions: string[];
      emotionalInsights: string[];
      writingGuidance: string;
    }>(prompt, this.model);

    return {
      immersionProcess: result.immersionProcess,
      emotionalInsights: result.emotionalInsights,
      authenticReactions: result.authenticReactions,
      writingGuidance: result.writingGuidance,
    };
  }

  /**
   * 창작의 고통 시뮬레이션 (막힘, 돌파)
   */
  async simulateCreativeStruggle(
    problem: {
      type: 'writer-block' | 'scene-not-working' | 'character-flat' | 'dialogue-stiff' | 'pacing-off';
      description: string;
      attemptsSoFar: string[];
    }
  ): Promise<{
    internalStruggle: string;
    brainstormProcess: string[];
    breakthrough: Breakthrough | null;
    solution: string;
  }> {
    const prompt = `당신은 ${this.persona.name}입니다.
창작 철학: ${this.persona.writingPhilosophy}

당신은 지금 창작의 벽에 부딪혔습니다.
실제 작가들이 겪는 고통과 돌파의 과정을 시뮬레이션하세요.

【문제】
유형: ${problem.type}
설명: ${problem.description}
이미 시도한 것들: ${problem.attemptsSoFar.join(', ')}

【당신의 내면】
자기 의심: ${this.persona.innerVoice.selfDoubt.join(' / ')}
격려: ${this.persona.innerVoice.encourager.join(' / ')}

═══════════════════════════════════════════════════════════════

다음 과정을 거치세요:

1. **고통의 시간**: 좌절, 자기 의심, 포기하고 싶은 마음
2. **방황**: 산책, 샤워, 전혀 다른 생각 등
3. **실마리**: 작은 힌트, 연결고리
4. **돌파구**: "유레카!" 순간 (있다면)
5. **해결책**: 구체적인 해결 방안

출력 형식 (JSON):
{
  "internalStruggle": "내면의 고통 서술 (작가가 실제로 느끼는 것처럼)",
  "wanderingThoughts": ["방황하는 생각 1", "생각 2"],
  "clues": ["실마리 1", "실마리 2"],
  "breakthroughMoment": "돌파 순간 (없으면 null)",
  "breakthroughInsight": "깨달음 (없으면 null)",
  "solution": "최종 해결책",
  "brainstormProcess": ["시도 1", "시도 2", "시도 3"]
}`;

    const result = await generateJSON<{
      internalStruggle: string;
      wanderingThoughts: string[];
      clues: string[];
      breakthroughMoment: string | null;
      breakthroughInsight: string | null;
      solution: string;
      brainstormProcess: string[];
    }>(prompt, this.model);

    return {
      internalStruggle: result.internalStruggle,
      brainstormProcess: result.brainstormProcess,
      breakthrough: result.breakthroughMoment
        ? {
            moment: result.breakthroughMoment,
            insight: result.breakthroughInsight || '',
            impact: result.solution,
          }
        : null,
      solution: result.solution,
    };
  }

  /**
   * 인간 작가 스타일 글쓰기 프롬프트 생성
   */
  private buildHumanWritingPrompt(task: {
    type: string;
    context: string;
    requirements: string[];
    emotionalTarget?: string;
  }): string {
    return `당신은 ${this.persona.name}입니다.

═══════════════════════════════════════════════════════════════
                    👤 작가 프로필
═══════════════════════════════════════════════════════════════

【배경】
${this.persona.background}

【창작 철학】
"${this.persona.writingPhilosophy}"

【강점】 ${this.persona.strengths.join(', ')}
【약점】 ${this.persona.weaknesses.join(', ')}
【영향받은 작가들】 ${this.persona.influences.join(', ')}
【집착하는 테마】 ${this.persona.obsessions.join(', ')}

【습관】
${this.persona.writingHabits.map(h => `- ${h.habit} (${h.triggerCondition})`).join('\n')}

【내면의 목소리】
- 의심: "${this.persona.innerVoice.selfDoubt[0]}"
- 비평: "${this.persona.innerVoice.critic[0]}"
- 격려: "${this.persona.innerVoice.encourager[0]}"

═══════════════════════════════════════════════════════════════
                    ✍️ 창작 과제
═══════════════════════════════════════════════════════════════

【과제 유형】 ${task.type}
【맥락】
${task.context}

【요구사항】
${task.requirements.map(r => `• ${r}`).join('\n')}

${task.emotionalTarget ? `【목표 감정】 ${task.emotionalTarget}` : ''}

═══════════════════════════════════════════════════════════════
                    🧠 창작 프로세스
═══════════════════════════════════════════════════════════════

실제 인간 작가처럼 다음 과정을 거쳐 글을 쓰세요:

1. **생각하기** (thinking)
   - 이 장면에서 무엇이 중요한가?
   - 독자가 무엇을 느껴야 하는가?
   - 어떤 이미지/감각이 떠오르는가?
   - 어떤 위험(클리셰, 과잉)을 피해야 하는가?

2. **초고 쓰기** (first draft)
   - 일단 쓴다, 완벽하지 않아도
   - 흐름을 따라간다

3. **자기 비판** (self-critique)
   - 내면의 비평가 목소리로 읽기
   - 무엇이 작동하고 무엇이 안 되는가?

4. **수정하기** (revision)
   - 2-3회 반복 수정
   - 매번 더 나아지도록

5. **결정하기** (decisions)
   - 선택의 순간들을 기록
   - 왜 이 단어를, 이 구조를 선택했는가?

출력 형식 (JSON):
{
  "thinking": ["생각 1", "생각 2", "생각 3"],
  "drafts": [
    { "version": 1, "content": "초고", "selfCritique": "자기 비판" },
    { "version": 2, "content": "2차 수정", "selfCritique": "자기 비판" },
    { "version": 3, "content": "3차 수정", "selfCritique": "자기 비판" }
  ],
  "finalContent": "최종 완성본",
  "decisions": [
    { "issue": "결정 사항", "chosen": "선택", "reason": "이유" }
  ],
  "struggles": [
    { "problem": "겪은 어려움", "resolution": "해결 방법" }
  ],
  "authorNotes": "작가 노트 (이 글에 대한 생각)"
}

⚠️ 중요:
- 정말로 인간 작가처럼 생각하고 고민하세요
- 초고 → 수정 과정이 실제로 발전해야 합니다
- 최종본은 출판 가능한 수준이어야 합니다`;
  }

  /**
   * 현재 페르소나 정보 반환
   */
  getPersonaInfo(): AuthorPersona {
    return this.persona;
  }

  /**
   * 창작 히스토리 반환
   */
  getCreativeHistory(): CreativeProcess[] {
    return this.creativeHistory;
  }
}

// 싱글톤 인스턴스
export const humanAuthorSimulator = new HumanAuthorSimulator();
