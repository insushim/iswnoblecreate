import type {
  EditMark,
  EditSession,
  EditPhase,
  EditPhaseRecord,
  EditCategory,
  ManuscriptInfo,
} from '@/types/editor';

// 편집 단계 순서 정의
const PHASE_ORDER: EditPhase[] = [
  'ai_draft',
  'structural_edit',
  'line_edit',
  'copy_edit',
  'proofread',
  'human_review',
  'final_approval',
];

// 편집 단계 한국어 라벨
const PHASE_LABELS: Record<EditPhase, string> = {
  ai_draft: 'AI 초고',
  structural_edit: '구조 편집',
  line_edit: '라인 편집',
  copy_edit: '카피 편집',
  proofread: '교정',
  human_review: '인간 검토',
  final_approval: '최종 승인',
};

// 편집 카테고리 한국어 라벨
const CATEGORY_LABELS: Record<EditCategory, string> = {
  spelling: '맞춤법',
  grammar: '문법',
  style: '문체',
  consistency: '일관성',
  translation: '번역투',
  cliche: '클리셰',
  pacing: '페이싱',
  dialogue: '대화',
  description: '묘사',
  plot: '플롯',
  character: '캐릭터',
  other: '기타',
};

// ============================================
// 규칙 기반 분석 데이터
// ============================================

// 한국어 클리셰 표현 목록
const KOREAN_CLICHES: { pattern: RegExp; suggestion: string }[] = [
  { pattern: /눈이 휘둥그레/g, suggestion: '놀란 표정을 구체적으로 묘사해보세요' },
  { pattern: /심장이 쿵쾅/g, suggestion: '긴장감을 다른 감각으로 표현해보세요' },
  { pattern: /온몸이 떨렸다/g, suggestion: '떨림의 구체적 양상을 묘사해보세요' },
  { pattern: /눈물이 주르륵/g, suggestion: '감정의 원인을 행동으로 보여주세요' },
  { pattern: /가슴이 먹먹/g, suggestion: '신체적 감각을 더 구체적으로 묘사해보세요' },
  { pattern: /피가 끓/g, suggestion: '분노를 행동이나 대화로 보여주세요' },
  { pattern: /머리가 하얘/g, suggestion: '혼란 상태를 구체적 사고 과정으로 표현해보세요' },
  { pattern: /손에 땀이/g, suggestion: '긴장감을 다양한 감각으로 전달해보세요' },
  { pattern: /눈앞이 캄캄/g, suggestion: '절망을 구체적 상황 인식으로 표현해보세요' },
  { pattern: /입이 떡 벌어/g, suggestion: '놀라움을 구체적 반응으로 묘사해보세요' },
  { pattern: /가슴이 철렁/g, suggestion: '불안감을 구체적 신체 반응으로 표현해보세요' },
  { pattern: /한숨을 내쉬었다/g, suggestion: '한숨 대신 캐릭터의 내면을 보여주세요' },
  { pattern: /고개를 끄덕/g, suggestion: '동의를 다른 방식으로 표현해보세요' },
  { pattern: /미간을 찌푸/g, suggestion: '불쾌함을 대화나 행동으로 보여주세요' },
];

// 번역투 표현 감지
const TRANSLATION_PATTERNS: { pattern: RegExp; suggestion: string; category: EditCategory }[] = [
  { pattern: /그것은\s/g, suggestion: '"그것은"을 구체적 명사로 바꾸세요', category: 'translation' },
  { pattern: /~것이다\./g, suggestion: '"~것이다" 종결을 자연스러운 한국어로 바꾸세요', category: 'translation' },
  { pattern: /~에 대해서/g, suggestion: '"~에 대해서"를 간결하게 줄여보세요', category: 'translation' },
  { pattern: /~하는 것이 가능/g, suggestion: '"~할 수 있다"로 간결하게 표현하세요', category: 'translation' },
  { pattern: /~임에 틀림없/g, suggestion: '"~일 것이다", "~이다"로 자연스럽게 바꾸세요', category: 'translation' },
  { pattern: /나는\s.*했다\.\s나는/g, suggestion: '주어 반복을 줄이세요. 한국어는 주어 생략이 자연스럽습니다', category: 'translation' },
  { pattern: /그녀는\s/g, suggestion: '"그녀"는 번역투입니다. 이름이나 "그 여자"를 사용하세요', category: 'translation' },
  { pattern: /~하기 위해서/g, suggestion: '"~하려고", "~하고자"로 자연스럽게 바꾸세요', category: 'translation' },
];

// 반복 표현 감지를 위한 주요 서술어/부사
const REPETITION_TARGETS = [
  '그리고', '하지만', '그러나', '그래서', '그런데', '또한',
  '갑자기', '천천히', '조용히', '빠르게', '살짝', '슬쩍',
  '말했다', '물었다', '대답했다', '소리쳤다',
];

// 맞춤법/띄어쓰기 오류 패턴
const SPELLING_PATTERNS: { pattern: RegExp; correction: string; description: string }[] = [
  { pattern: /되어지/g, correction: '되', description: '"되어지다"는 이중 피동입니다. "되다"로 수정하세요' },
  { pattern: /시켜지/g, correction: '되', description: '"시켜지다"는 이중 사동입니다' },
  { pattern: /해 주/g, correction: '해주', description: '보조 용언은 붙여 쓰는 것이 자연스럽습니다' },
  { pattern: /할 수있/g, correction: '할 수 있', description: '"수"와 "있" 사이를 띄어쓰세요' },
  { pattern: /돼는/g, correction: '되는', description: '"돼"가 아닌 "되"가 맞습니다' },
  { pattern: /됬/g, correction: '됐', description: '"됬"이 아닌 "됐"이 맞습니다' },
  { pattern: /뵈요/g, correction: '봬요', description: '"뵈요"가 아닌 "봬요"가 맞습니다' },
  { pattern: /웬지/g, correction: '왠지', description: '"웬지"가 아닌 "왠지"가 맞습니다' },
  { pattern: /어의없/g, correction: '어이없', description: '"어의없다"가 아닌 "어이없다"가 맞습니다' },
  { pattern: /몇일/g, correction: '며칠', description: '"몇일"이 아닌 "며칠"이 맞습니다' },
  { pattern: /금새/g, correction: '금세', description: '"금새"가 아닌 "금세"가 맞습니다' },
  { pattern: /일일히/g, correction: '일일이', description: '"일일히"가 아닌 "일일이"가 맞습니다' },
  { pattern: /오랫만/g, correction: '오랜만', description: '"오랫만"이 아닌 "오랜만"이 맞습니다' },
  { pattern: /설레임/g, correction: '설렘', description: '"설레임"이 아닌 "설렘"이 맞습니다' },
];

// 문장부호 오류
const PUNCTUATION_PATTERNS: { pattern: RegExp; correction: string; description: string }[] = [
  { pattern: /\.\.\./g, correction: '...', description: '말줄임표는 가운뎃점 세 개(...)가 표준입니다' },
  { pattern: /\?\?/g, correction: '?', description: '물음표 중복 사용을 피하세요' },
  { pattern: /!!/g, correction: '!', description: '느낌표 중복 사용을 피하세요' },
  { pattern: /\.\s*\./g, correction: '.', description: '마침표 중복을 피하세요' },
  { pattern: /,\s*,/g, correction: ',', description: '쉼표 중복을 피하세요' },
];

// 숫자 표기 규칙 (교정 단계)
const NUMBER_PATTERNS: { pattern: RegExp; suggestion: string }[] = [
  { pattern: /(\d+)명/g, suggestion: '소설에서 숫자는 한글로 표기하는 것이 자연스럽습니다 (예: 세 명)' },
  { pattern: /(\d+)번/g, suggestion: '소설에서 숫자는 한글로 표기하는 것이 자연스럽습니다 (예: 세 번)' },
  { pattern: /(\d+)개/g, suggestion: '소설에서 숫자는 한글로 표기하는 것이 자연스럽습니다 (예: 세 개)' },
  { pattern: /(\d+)살/g, suggestion: '소설에서 나이는 한글로 표기하는 것이 자연스럽습니다 (예: 스물다섯 살)' },
];

// 외래어 표기 오류
const LOANWORD_PATTERNS: { pattern: RegExp; correction: string }[] = [
  { pattern: /컨텐츠/g, correction: '콘텐츠' },
  { pattern: /메세지/g, correction: '메시지' },
  { pattern: /악세사리/g, correction: '액세서리' },
  { pattern: /가디건/g, correction: '카디건' },
  { pattern: /케릭터/g, correction: '캐릭터' },
  { pattern: /시뮬레이션/g, correction: '시뮬레이션' },
  { pattern: /아이덴티티/g, correction: '아이덴티티' },
  { pattern: /커뮤니케이션/g, correction: '커뮤니케이션' },
  { pattern: /배트맨/g, correction: '배트맨' },
  { pattern: /쉐이크/g, correction: '셰이크' },
  { pattern: /쥬스/g, correction: '주스' },
  { pattern: /져지/g, correction: '저지' },
];

// ============================================
// EditorWorkflow 클래스
// ============================================

export class EditorWorkflow {
  /**
   * 새 편집 세션 시작
   */
  static createSession(projectId: string, chapterId: string): EditSession {
    const now = new Date().toISOString();
    return {
      id: crypto.randomUUID(),
      projectId,
      chapterId,
      status: 'in_progress',
      currentPhase: 'ai_draft',
      phases: [
        {
          phase: 'ai_draft',
          startedAt: now,
          editorType: 'ai',
          marksCreated: 0,
          marksResolved: 0,
        },
      ],
      totalMarks: 0,
      resolvedMarks: 0,
      acceptedMarks: 0,
      rejectedMarks: 0,
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * AI 자동 편집 마크 생성 (구조/라인/카피/교정 단계별)
   * AI API 호출 없이 규칙 기반으로 분석
   */
  static async generateAIEdits(
    content: string,
    phase: EditPhase,
    context: { projectGenre: string[]; characters: string[] }
  ): Promise<EditMark[]> {
    const marks: EditMark[] = [];

    switch (phase) {
      case 'structural_edit':
        marks.push(...EditorWorkflow.analyzeStructure(content, context));
        break;
      case 'line_edit':
        marks.push(...EditorWorkflow.analyzeLineEdit(content, context));
        break;
      case 'copy_edit':
        marks.push(...EditorWorkflow.analyzeCopyEdit(content));
        break;
      case 'proofread':
        marks.push(...EditorWorkflow.analyzeProofread(content, context));
        break;
      default:
        break;
    }

    return marks;
  }

  /**
   * 편집 마크 적용 (승인된 것만)
   * endOffset 기준 내림차순 정렬하여 뒤에서부터 적용 (오프셋 꼬임 방지)
   */
  static applyAcceptedEdits(content: string, marks: EditMark[]): string {
    const accepted = marks
      .filter((m) => m.status === 'accepted' && m.suggestedText !== undefined)
      .sort((a, b) => b.startOffset - a.startOffset);

    let result = content;
    for (const mark of accepted) {
      const before = result.slice(0, mark.startOffset);
      const after = result.slice(mark.endOffset);
      result = before + (mark.suggestedText ?? '') + after;
    }

    return result;
  }

  /**
   * 다음 편집 단계로 진행
   */
  static advancePhase(session: EditSession): EditSession {
    const currentIndex = PHASE_ORDER.indexOf(session.currentPhase);
    if (currentIndex < 0 || currentIndex >= PHASE_ORDER.length - 1) {
      // 이미 마지막 단계이거나 유효하지 않은 단계
      return {
        ...session,
        status: session.currentPhase === 'final_approval' ? 'approved' : session.status,
        updatedAt: new Date().toISOString(),
      };
    }

    const now = new Date().toISOString();
    const nextPhase = PHASE_ORDER[currentIndex + 1];

    // 현재 단계 완료 처리
    const updatedPhases = session.phases.map((p) =>
      p.phase === session.currentPhase && !p.completedAt
        ? { ...p, completedAt: now }
        : p
    );

    // 다음 단계 추가
    const newPhaseRecord: EditPhaseRecord = {
      phase: nextPhase,
      startedAt: now,
      editorType: nextPhase === 'human_review' || nextPhase === 'final_approval' ? 'human' : 'ai',
      marksCreated: 0,
      marksResolved: 0,
    };

    updatedPhases.push(newPhaseRecord);

    // 상태 결정
    let newStatus = session.status;
    if (nextPhase === 'human_review') {
      newStatus = 'review';
    } else if (nextPhase === 'final_approval') {
      newStatus = 'approved';
    }

    return {
      ...session,
      currentPhase: nextPhase,
      phases: updatedPhases,
      status: newStatus,
      updatedAt: now,
    };
  }

  /**
   * 원고 통계 계산
   */
  static calculateManuscriptInfo(content: string): ManuscriptInfo {
    // 공백, 줄바꿈 제외한 순수 글자수
    const totalChars = content.replace(/\s/g, '').length;

    // 200자 원고지 매수
    const manuscriptPages = Math.ceil(totalChars / 200);

    // 예상 책 페이지 (신국판 기준 페이지당 약 500자)
    const estimatedBookPages = Math.ceil(totalChars / 500);

    // 분류
    let publishingCategory: string;
    if (manuscriptPages <= 200) {
      publishingCategory = '단편소설';
    } else if (manuscriptPages <= 600) {
      publishingCategory = '중편소설';
    } else {
      publishingCategory = '장편소설';
    }

    // 예상 인쇄 비용 (페이지당 약 30~50원 기준, 1000부 기준)
    const minCost = estimatedBookPages * 30 * 1000;
    const maxCost = estimatedBookPages * 50 * 1000;
    const formatCost = (value: number): string => {
      if (value >= 10000000) {
        return `${(value / 10000000).toFixed(1)}천만`;
      }
      if (value >= 10000) {
        return `${Math.round(value / 10000)}만`;
      }
      return `${value.toLocaleString()}`;
    };
    const estimatedPrintCost = `약 ${formatCost(minCost)}원 ~ ${formatCost(maxCost)}원 (1,000부 기준)`;

    return {
      totalChars,
      manuscriptPages,
      estimatedBookPages,
      estimatedPrintCost,
      publishingCategory,
    };
  }

  /**
   * 편집 진행률
   */
  static getProgress(session: EditSession): {
    percentage: number;
    currentPhase: string;
    remainingPhases: string[];
    estimatedCompletion: string;
  } {
    const currentIndex = PHASE_ORDER.indexOf(session.currentPhase);
    const totalPhases = PHASE_ORDER.length;
    const percentage = Math.round(((currentIndex + 1) / totalPhases) * 100);

    const remainingPhases = PHASE_ORDER.slice(currentIndex + 1).map(
      (phase) => PHASE_LABELS[phase]
    );

    // 예상 완료 시간: 각 단계당 평균 소요 시간으로 추정
    const completedPhases = session.phases.filter((p) => p.completedAt);
    let estimatedCompletion = '추정 불가';

    if (completedPhases.length > 0) {
      const totalMs = completedPhases.reduce((acc, p) => {
        if (p.completedAt) {
          return acc + (new Date(p.completedAt).getTime() - new Date(p.startedAt).getTime());
        }
        return acc;
      }, 0);
      const avgMsPerPhase = totalMs / completedPhases.length;
      const remainingMs = avgMsPerPhase * (totalPhases - currentIndex - 1);
      const completionDate = new Date(Date.now() + remainingMs);

      const diffHours = Math.round(remainingMs / (1000 * 60 * 60));
      if (diffHours < 1) {
        estimatedCompletion = '1시간 이내';
      } else if (diffHours < 24) {
        estimatedCompletion = `약 ${diffHours}시간 후`;
      } else {
        const diffDays = Math.round(diffHours / 24);
        estimatedCompletion = `약 ${diffDays}일 후 (${completionDate.toLocaleDateString('ko-KR')})`;
      }
    }

    return {
      percentage,
      currentPhase: PHASE_LABELS[session.currentPhase],
      remainingPhases,
      estimatedCompletion,
    };
  }

  // ============================================
  // 내부 분석 메서드들
  // ============================================

  /**
   * 구조 편집: 씬 길이 불균형, 긴장감 곡선, 페이싱 문제 감지
   */
  private static analyzeStructure(
    content: string,
    context: { projectGenre: string[]; characters: string[] }
  ): EditMark[] {
    const marks: EditMark[] = [];
    const now = new Date().toISOString();

    // 단락별 분리 (빈 줄 기준)
    const paragraphs = content.split(/\n\s*\n/).filter((p) => p.trim().length > 0);

    // 1. 씬 길이 불균형 감지 (단락 길이 기준)
    if (paragraphs.length > 3) {
      const avgLen = paragraphs.reduce((sum, p) => sum + p.length, 0) / paragraphs.length;

      for (let i = 0; i < paragraphs.length; i++) {
        const para = paragraphs[i];
        const startOffset = content.indexOf(para);

        // 매우 긴 단락 (평균의 3배 이상)
        if (para.length > avgLen * 3 && para.length > 500) {
          marks.push(EditorWorkflow.createMark({
            sceneId: '',
            chapterId: '',
            type: 'suggestion',
            startOffset,
            endOffset: startOffset + para.length,
            originalText: para.slice(0, 80) + '...',
            comment: `이 단락이 지나치게 깁니다 (${para.length}자). 평균 단락 길이(${Math.round(avgLen)}자)의 ${Math.round(para.length / avgLen)}배입니다. 씬을 나누거나 단락을 분리하세요.`,
            category: 'pacing',
            createdAt: now,
          }));
        }

        // 매우 짧은 단락 연속 (3개 이상 연속으로 100자 미만)
        if (i < paragraphs.length - 2) {
          const shortSequence = [para, paragraphs[i + 1], paragraphs[i + 2]];
          if (shortSequence.every((s) => s.length < 100) && !shortSequence.every((s) => s.includes('"') || s.includes('\u201C'))) {
            marks.push(EditorWorkflow.createMark({
              sceneId: '',
              chapterId: '',
              type: 'suggestion',
              startOffset,
              endOffset: startOffset + para.length,
              originalText: para.slice(0, 50) + '...',
              comment: '짧은 단락이 연속됩니다. 묘사나 내면 서술을 추가하여 리듬감을 살려보세요.',
              category: 'pacing',
              createdAt: now,
            }));
          }
        }
      }
    }

    // 2. 긴장감 곡선 분석 (대화/행동/묘사 비율)
    const dialogueLines = (content.match(/[""\u201C\u201D][^"""\u201C\u201D]*[""\u201C\u201D]/g) || []).length;
    const totalSentences = (content.match(/[.?!]\s/g) || []).length + 1;
    const dialogueRatio = dialogueLines / Math.max(totalSentences, 1);

    if (dialogueRatio > 0.7) {
      marks.push(EditorWorkflow.createMark({
        sceneId: '',
        chapterId: '',
        type: 'comment',
        startOffset: 0,
        endOffset: Math.min(content.length, 100),
        originalText: content.slice(0, 100),
        comment: `대화 비율이 ${Math.round(dialogueRatio * 100)}%로 매우 높습니다. 내면 묘사, 배경 묘사, 행동 묘사를 추가하여 균형을 맞추세요.`,
        category: 'pacing',
        createdAt: now,
      }));
    } else if (dialogueRatio < 0.1 && content.length > 1000) {
      marks.push(EditorWorkflow.createMark({
        sceneId: '',
        chapterId: '',
        type: 'comment',
        startOffset: 0,
        endOffset: Math.min(content.length, 100),
        originalText: content.slice(0, 100),
        comment: `대화 비율이 ${Math.round(dialogueRatio * 100)}%로 매우 낮습니다. 대화를 통해 캐릭터 성격과 갈등을 드러내보세요.`,
        category: 'dialogue',
        createdAt: now,
      }));
    }

    // 3. 캐릭터 등장 누락 감지
    if (context.characters.length > 0) {
      const missingChars = context.characters.filter(
        (char) => !content.includes(char)
      );
      if (missingChars.length > 0 && missingChars.length < context.characters.length) {
        marks.push(EditorWorkflow.createMark({
          sceneId: '',
          chapterId: '',
          type: 'comment',
          startOffset: 0,
          endOffset: Math.min(content.length, 50),
          originalText: content.slice(0, 50),
          comment: `등장인물 [${missingChars.join(', ')}]이(가) 이 씬에 등장하지 않습니다. 의도적인지 확인하세요.`,
          category: 'character',
          createdAt: now,
        }));
      }
    }

    // 4. 전체 텍스트 길이 기반 페이싱
    if (content.length < 500) {
      marks.push(EditorWorkflow.createMark({
        sceneId: '',
        chapterId: '',
        type: 'comment',
        startOffset: 0,
        endOffset: content.length,
        originalText: content.slice(0, 50),
        comment: `씬 분량이 ${content.length}자로 매우 짧습니다. 장면을 더 풍부하게 전개해보세요.`,
        category: 'pacing',
        createdAt: now,
      }));
    }

    return marks;
  }

  /**
   * 라인 편집: 반복 표현, 클리셰, Show Don't Tell 위반 감지
   */
  private static analyzeLineEdit(
    content: string,
    _context: { projectGenre: string[]; characters: string[] }
  ): EditMark[] {
    const marks: EditMark[] = [];
    const now = new Date().toISOString();

    // 1. 클리셰 감지
    for (const cliche of KOREAN_CLICHES) {
      let match: RegExpExecArray | null;
      const regex = new RegExp(cliche.pattern.source, 'g');
      while ((match = regex.exec(content)) !== null) {
        marks.push(EditorWorkflow.createMark({
          sceneId: '',
          chapterId: '',
          type: 'suggestion',
          startOffset: match.index,
          endOffset: match.index + match[0].length,
          originalText: match[0],
          suggestedText: undefined,
          comment: `클리셰 표현입니다. ${cliche.suggestion}`,
          category: 'cliche',
          createdAt: now,
        }));
      }
    }

    // 2. 번역투 감지
    for (const tp of TRANSLATION_PATTERNS) {
      let match: RegExpExecArray | null;
      const regex = new RegExp(tp.pattern.source, 'g');
      while ((match = regex.exec(content)) !== null) {
        marks.push(EditorWorkflow.createMark({
          sceneId: '',
          chapterId: '',
          type: 'correction',
          startOffset: match.index,
          endOffset: match.index + match[0].length,
          originalText: match[0],
          comment: tp.suggestion,
          category: tp.category,
          createdAt: now,
        }));
      }
    }

    // 3. 반복 표현 감지
    for (const word of REPETITION_TARGETS) {
      const regex = new RegExp(word, 'g');
      const matches: number[] = [];
      let match: RegExpExecArray | null;
      while ((match = regex.exec(content)) !== null) {
        matches.push(match.index);
      }

      // 1000자 내에 같은 표현이 3회 이상 등장
      if (matches.length >= 3) {
        for (let i = 0; i < matches.length - 2; i++) {
          if (matches[i + 2] - matches[i] < 1000) {
            marks.push(EditorWorkflow.createMark({
              sceneId: '',
              chapterId: '',
              type: 'suggestion',
              startOffset: matches[i],
              endOffset: matches[i] + word.length,
              originalText: word,
              comment: `"${word}"이(가) 짧은 구간(1000자 이내)에서 3회 이상 반복됩니다. 다른 표현으로 변경하세요.`,
              category: 'style',
              createdAt: now,
            }));
            break; // 같은 단어에 대해 한 번만 경고
          }
        }
      }
    }

    // 4. Show Don't Tell 위반 감지
    const tellPatterns: { pattern: RegExp; suggestion: string }[] = [
      { pattern: /그는 슬펐다/g, suggestion: '슬픔을 행동이나 묘사로 보여주세요 (Show, Don\'t Tell)' },
      { pattern: /그녀는 화가 났다/g, suggestion: '분노를 행동이나 대화로 보여주세요' },
      { pattern: /그는 기뻤다/g, suggestion: '기쁨을 구체적 행동으로 보여주세요' },
      { pattern: /무서웠다/g, suggestion: '두려움을 신체 반응이나 행동으로 보여주세요' },
      { pattern: /행복했다/g, suggestion: '행복을 구체적 장면으로 보여주세요' },
      { pattern: /외로웠다/g, suggestion: '외로움을 상황 묘사로 보여주세요' },
      { pattern: /(?:매우|정말|너무|굉장히|무척)\s*(?:슬[펐프]|화[가난]|기[뻤쁜]|무서[웠운]|행복[했한]|외로[웠운])/g, suggestion: '감정을 직접 서술하지 말고 행동과 묘사로 보여주세요 (Show, Don\'t Tell)' },
    ];

    for (const tp of tellPatterns) {
      let match: RegExpExecArray | null;
      const regex = new RegExp(tp.pattern.source, 'g');
      while ((match = regex.exec(content)) !== null) {
        marks.push(EditorWorkflow.createMark({
          sceneId: '',
          chapterId: '',
          type: 'suggestion',
          startOffset: match.index,
          endOffset: match.index + match[0].length,
          originalText: match[0],
          comment: tp.suggestion,
          category: 'style',
          createdAt: now,
        }));
      }
    }

    // 5. 문장 길이 분석 (너무 긴 문장)
    const sentences = content.split(/(?<=[.?!])\s+/);
    let offset = 0;
    for (const sentence of sentences) {
      const sentenceStart = content.indexOf(sentence, offset);
      if (sentenceStart >= 0) {
        offset = sentenceStart + sentence.length;
        if (sentence.length > 150) {
          marks.push(EditorWorkflow.createMark({
            sceneId: '',
            chapterId: '',
            type: 'suggestion',
            startOffset: sentenceStart,
            endOffset: sentenceStart + sentence.length,
            originalText: sentence.slice(0, 60) + '...',
            comment: `문장이 ${sentence.length}자로 너무 깁니다. 가독성을 위해 두세 개로 나누세요.`,
            category: 'style',
            createdAt: now,
          }));
        }
      }
    }

    return marks;
  }

  /**
   * 카피 편집: 맞춤법, 띄어쓰기, 문장부호 오류 감지
   */
  private static analyzeCopyEdit(content: string): EditMark[] {
    const marks: EditMark[] = [];
    const now = new Date().toISOString();

    // 1. 맞춤법 오류 감지
    for (const sp of SPELLING_PATTERNS) {
      let match: RegExpExecArray | null;
      const regex = new RegExp(sp.pattern.source, 'g');
      while ((match = regex.exec(content)) !== null) {
        marks.push(EditorWorkflow.createMark({
          sceneId: '',
          chapterId: '',
          type: 'correction',
          startOffset: match.index,
          endOffset: match.index + match[0].length,
          originalText: match[0],
          suggestedText: match[0].replace(new RegExp(sp.pattern.source), sp.correction),
          comment: sp.description,
          category: 'spelling',
          createdAt: now,
        }));
      }
    }

    // 2. 문장부호 오류 감지
    for (const pp of PUNCTUATION_PATTERNS) {
      let match: RegExpExecArray | null;
      const regex = new RegExp(pp.pattern.source, 'g');
      while ((match = regex.exec(content)) !== null) {
        marks.push(EditorWorkflow.createMark({
          sceneId: '',
          chapterId: '',
          type: 'correction',
          startOffset: match.index,
          endOffset: match.index + match[0].length,
          originalText: match[0],
          suggestedText: pp.correction,
          comment: pp.description,
          category: 'grammar',
          createdAt: now,
        }));
      }
    }

    // 3. 외래어 표기 오류 감지
    for (const lw of LOANWORD_PATTERNS) {
      let match: RegExpExecArray | null;
      const regex = new RegExp(lw.pattern.source, 'g');
      while ((match = regex.exec(content)) !== null) {
        if (match[0] !== lw.correction) {
          marks.push(EditorWorkflow.createMark({
            sceneId: '',
            chapterId: '',
            type: 'correction',
            startOffset: match.index,
            endOffset: match.index + match[0].length,
            originalText: match[0],
            suggestedText: lw.correction,
            comment: `외래어 표기법에 따르면 "${match[0]}"은(는) "${lw.correction}"이 맞습니다.`,
            category: 'spelling',
            createdAt: now,
          }));
        }
      }
    }

    // 4. 이중 피동/사동 감지
    const doublePatternsGrammar: { pattern: RegExp; suggestion: string }[] = [
      { pattern: /보여지/g, suggestion: '"보여지다"는 이중 피동입니다. "보이다"로 수정하세요' },
      { pattern: /읽혀지/g, suggestion: '"읽혀지다"는 이중 피동입니다. "읽히다"로 수정하세요' },
      { pattern: /잡혀지/g, suggestion: '"잡혀지다"는 이중 피동입니다. "잡히다"로 수정하세요' },
      { pattern: /만들어지/g, suggestion: '"만들어지다"보다 "만들다" 능동형을 고려하세요' },
    ];

    for (const dp of doublePatternsGrammar) {
      let match: RegExpExecArray | null;
      const regex = new RegExp(dp.pattern.source, 'g');
      while ((match = regex.exec(content)) !== null) {
        marks.push(EditorWorkflow.createMark({
          sceneId: '',
          chapterId: '',
          type: 'correction',
          startOffset: match.index,
          endOffset: match.index + match[0].length,
          originalText: match[0],
          comment: dp.suggestion,
          category: 'grammar',
          createdAt: now,
        }));
      }
    }

    return marks;
  }

  /**
   * 교정: 숫자 표기, 외래어 표기, 고유명사 일관성 감지
   */
  private static analyzeProofread(
    content: string,
    context: { projectGenre: string[]; characters: string[] }
  ): EditMark[] {
    const marks: EditMark[] = [];
    const now = new Date().toISOString();

    // 1. 숫자 표기 규칙
    for (const np of NUMBER_PATTERNS) {
      let match: RegExpExecArray | null;
      const regex = new RegExp(np.pattern.source, 'g');
      while ((match = regex.exec(content)) !== null) {
        const num = parseInt(match[1], 10);
        // 100 이하의 숫자만 한글 표기 권장
        if (num <= 100) {
          marks.push(EditorWorkflow.createMark({
            sceneId: '',
            chapterId: '',
            type: 'suggestion',
            startOffset: match.index,
            endOffset: match.index + match[0].length,
            originalText: match[0],
            comment: np.suggestion,
            category: 'style',
            createdAt: now,
          }));
        }
      }
    }

    // 2. 고유명사 일관성 감지
    // 캐릭터 이름이 여러 가지 형태로 등장하는지 확인
    for (const charName of context.characters) {
      if (charName.length >= 2) {
        // 이름의 첫 글자 + 다른 형태 감지 (예: 민수 vs 민 수)
        const spaced = charName.split('').join('\\s*');
        if (spaced !== charName.split('').join('')) {
          const spacedRegex = new RegExp(spaced, 'g');
          let match: RegExpExecArray | null;
          while ((match = spacedRegex.exec(content)) !== null) {
            if (match[0] !== charName && match[0].replace(/\s/g, '') === charName.replace(/\s/g, '')) {
              marks.push(EditorWorkflow.createMark({
                sceneId: '',
                chapterId: '',
                type: 'correction',
                startOffset: match.index,
                endOffset: match.index + match[0].length,
                originalText: match[0],
                suggestedText: charName,
                comment: `고유명사 표기를 "${charName}"으로 통일하세요.`,
                category: 'consistency',
                createdAt: now,
              }));
            }
          }
        }
      }
    }

    // 3. 연속된 동일 조사/어미 감지
    const particles = ['는', '을', '를', '이', '가', '에서', '으로', '에게'];
    const sentenceList = content.split(/[.?!]\s*/);
    let sentenceOffset = 0;

    for (const sentence of sentenceList) {
      const actualStart = content.indexOf(sentence, sentenceOffset);
      if (actualStart >= 0) {
        sentenceOffset = actualStart + sentence.length;
        for (const particle of particles) {
          const pRegex = new RegExp(particle, 'g');
          const pMatches: number[] = [];
          let pMatch: RegExpExecArray | null;
          while ((pMatch = pRegex.exec(sentence)) !== null) {
            pMatches.push(pMatch.index);
          }
          // 한 문장에 같은 조사가 3회 이상
          if (pMatches.length >= 3 && sentence.length < 200) {
            marks.push(EditorWorkflow.createMark({
              sceneId: '',
              chapterId: '',
              type: 'suggestion',
              startOffset: actualStart,
              endOffset: actualStart + sentence.length,
              originalText: sentence.slice(0, 60) + (sentence.length > 60 ? '...' : ''),
              comment: `한 문장에 조사 "${particle}"이(가) ${pMatches.length}회 반복됩니다. 문장을 나누거나 조사를 변경하세요.`,
              category: 'style',
              createdAt: now,
            }));
            break;
          }
        }
      }
    }

    return marks;
  }

  // ============================================
  // 유틸리티
  // ============================================

  /**
   * EditMark 생성 헬퍼
   */
  private static createMark(params: {
    sceneId: string;
    chapterId: string;
    type: EditMark['type'];
    startOffset: number;
    endOffset: number;
    originalText: string;
    suggestedText?: string;
    comment?: string;
    category: EditCategory;
    createdAt: string;
  }): EditMark {
    return {
      id: crypto.randomUUID(),
      sceneId: params.sceneId,
      chapterId: params.chapterId,
      type: params.type,
      status: 'pending',
      author: 'ai',
      startOffset: params.startOffset,
      endOffset: params.endOffset,
      originalText: params.originalText,
      suggestedText: params.suggestedText,
      comment: params.comment,
      category: params.category,
      createdAt: params.createdAt,
    };
  }

  /**
   * 편집 단계 라벨 가져오기
   */
  static getPhaseLabel(phase: EditPhase): string {
    return PHASE_LABELS[phase];
  }

  /**
   * 편집 카테고리 라벨 가져오기
   */
  static getCategoryLabel(category: EditCategory): string {
    return CATEGORY_LABELS[category];
  }

  /**
   * 모든 편집 단계 목록 반환
   */
  static getAllPhases(): { phase: EditPhase; label: string }[] {
    return PHASE_ORDER.map((phase) => ({
      phase,
      label: PHASE_LABELS[phase],
    }));
  }
}
