// ============================================================
// 번역투 감지 시스템
// ============================================================

export interface TranslationIssue {
  pattern: string;
  original: string;
  suggestion: string;
  severity: 'high' | 'medium' | 'low';
  category: 'passive' | 'structure' | 'expression' | 'redundant' | 'connector';
  position: number;
  context: string;
}

export interface TranslationStyleResult {
  issues: TranslationIssue[];
  score: number; // 0-100 (100이 완전 자연스러운 한국어)
  summary: string;
}

// ============================================================
// 컨텍스트 추출 헬퍼
// ============================================================

function extractContext(text: string, position: number, length: number): string {
  const contextRadius = 20;
  const start = Math.max(0, position - contextRadius);
  const end = Math.min(text.length, position + length + contextRadius);
  let context = text.slice(start, end);
  if (start > 0) context = '...' + context;
  if (end < text.length) context = context + '...';
  return context;
}

// ============================================================
// 1. 피동 표현 과다 사용 감지
// ============================================================

interface PassivePattern {
  pattern: RegExp;
  patternName: string;
  suggestion: string;
  severity: 'high' | 'medium' | 'low';
}

const PASSIVE_PATTERNS: ReadonlyArray<PassivePattern> = [
  // "~에 의해" 구문
  {
    pattern: /([가-힣]+)에\s*의해\s*((?:[가-힣]+(?:되|된|되었|되어|돼|됐)[가-힣]*))/g,
    patternName: '~에 의해 (피동)',
    suggestion: '능동 표현으로 바꾸세요. 예: "A에 의해 B가 ~되었다" → "A가 B를 ~했다"',
    severity: 'high',
  },
  {
    pattern: /에\s*의해(?:서)?/g,
    patternName: '~에 의해(서)',
    suggestion: '"~에 의해"는 영어 "by"의 직역입니다. 능동 표현으로 변환하세요.',
    severity: 'high',
  },

  // 이중 피동: ~되어지다
  {
    pattern: /되어지[가-힣]*/g,
    patternName: '이중 피동 (~되어지다)',
    suggestion: '"~되어지다"는 이중 피동입니다. "~되다"로 충분합니다.',
    severity: 'high',
  },
  {
    pattern: /되어져/g,
    patternName: '이중 피동 (~되어져)',
    suggestion: '"~되어져"는 이중 피동입니다. "~되어"로 충분합니다.',
    severity: 'high',
  },

  // ~해지다 과다 (패턴만 감지, 맥락에서 빈도 분석)
  {
    pattern: /(?:좋아지|나빠지|커지|작아지|많아지|적어지|높아지|낮아지|길어지|짧아지|넓어지|좁아지)[가-힣]*/g,
    patternName: '~해지다 표현',
    suggestion: '"~해지다" 표현이 과다할 수 있습니다. 일부를 능동 표현으로 바꿔보세요.',
    severity: 'medium',
  },

  // ~당하다 과다
  {
    pattern: /(?:공격|비난|비판|무시|거절|거부|배신|배척|소외|차별)당하[가-힣]*/g,
    patternName: '~당하다 (피동)',
    suggestion: '"~당하다"를 능동 표현으로 바꿀 수 있는지 검토하세요.',
    severity: 'medium',
  },
];

function detectPassiveOveruse(text: string): TranslationIssue[] {
  const issues: TranslationIssue[] = [];

  for (const rule of PASSIVE_PATTERNS) {
    const regex = new RegExp(rule.pattern.source, rule.pattern.flags);
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      issues.push({
        pattern: rule.patternName,
        original: match[0],
        suggestion: rule.suggestion,
        severity: rule.severity,
        category: 'passive',
        position: match.index,
        context: extractContext(text, match.index, match[0].length),
      });
    }
  }

  return issues;
}

// ============================================================
// 2. 영어식 구문 직역 감지
// ============================================================

interface StructurePattern {
  pattern: RegExp;
  patternName: string;
  suggestion: string;
  severity: 'high' | 'medium' | 'low';
}

const STRUCTURE_PATTERNS: ReadonlyArray<StructurePattern> = [
  // "~하는 것은 ~이다" (It is ~ that 직역)
  {
    pattern: /[가-힣]+(?:하는|되는|인)\s*것은\s*[가-힣\s]+(?:이다|입니다|이었다|였다)/g,
    patternName: '"~하는 것은 ~이다" 구문',
    suggestion: '"~하는 것은 ~이다" 구문은 영어 "It is ~ that" 직역일 수 있습니다. 간결하게 줄이세요.',
    severity: 'high',
  },

  // "~에 대해서" 과다 (about 직역)
  {
    pattern: /에\s*대해서?/g,
    patternName: '"~에 대해(서)" 과다',
    suggestion: '"~에 대해"는 영어 "about"의 직역일 수 있습니다. "~을/를"로 바꿀 수 있는지 검토하세요.',
    severity: 'medium',
  },

  // "그것은" / "이것은" 과다
  {
    pattern: /(?:그것|이것|저것)(?:은|는|이|을|를)/g,
    patternName: '지시대명사 과다 사용',
    suggestion: '"그것은/이것은"을 구체적 명사로 바꾸거나 생략하세요. 한국어에서는 지시대명사를 자주 쓰지 않습니다.',
    severity: 'medium',
  },

  // 소유격 연쇄: "~의 ~의 ~의"
  {
    pattern: /[가-힣]+의\s+[가-힣]+의\s+[가-힣]+의/g,
    patternName: '소유격 "~의" 연쇄',
    suggestion: '"~의 ~의 ~의"는 영어식 소유격 연쇄입니다. 문장을 분리하거나 "~의"를 줄이세요.',
    severity: 'high',
  },
  // 소유격 2연속도 경고 (낮은 수준)
  {
    pattern: /[가-힣]+의\s+[가-힣]+의\s+[가-힣]+/g,
    patternName: '소유격 "~의" 반복',
    suggestion: '"~의"가 연속으로 쓰였습니다. 한 개를 줄일 수 있는지 검토하세요.',
    severity: 'low',
  },

  // "~하기 위해서" 과다
  {
    pattern: /[가-힣]+(?:하기|되기)\s*위해(?:서)?/g,
    patternName: '"~하기 위해(서)" 과다',
    suggestion: '"~하기 위해서"는 영어 "in order to" 직역입니다. "~하려고", "~하려면"으로 바꿔보세요.',
    severity: 'medium',
  },

  // "~하는 것이 가능하다" (It is possible to 직역)
  {
    pattern: /[가-힣]+(?:하는|되는)\s*것이\s*가능하/g,
    patternName: '"~하는 것이 가능하다" 구문',
    suggestion: '"~하는 것이 가능하다"는 "~할 수 있다"로 바꾸세요.',
    severity: 'high',
  },

  // "~하는 것이 필요하다" (It is necessary to 직역)
  {
    pattern: /[가-힣]+(?:하는|되는)\s*것이\s*필요하/g,
    patternName: '"~하는 것이 필요하다" 구문',
    suggestion: '"~하는 것이 필요하다"는 "~해야 한다"로 바꾸세요.',
    severity: 'high',
  },

  // "~하는 것이 중요하다" (It is important to 직역)
  {
    pattern: /[가-힣]+(?:하는|되는)\s*것이\s*중요하/g,
    patternName: '"~하는 것이 중요하다" 구문',
    suggestion: '"~하는 것이 중요하다"는 더 간결하게 표현할 수 있습니다.',
    severity: 'medium',
  },
];

function detectStructurePatterns(text: string): TranslationIssue[] {
  const issues: TranslationIssue[] = [];

  for (const rule of STRUCTURE_PATTERNS) {
    const regex = new RegExp(rule.pattern.source, rule.pattern.flags);
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      issues.push({
        pattern: rule.patternName,
        original: match[0],
        suggestion: rule.suggestion,
        severity: rule.severity,
        category: 'structure',
        position: match.index,
        context: extractContext(text, match.index, match[0].length),
      });
    }
  }

  return issues;
}

// ============================================================
// 3. 불필요한 주어 반복 감지
// ============================================================

function detectSubjectRepetition(text: string): TranslationIssue[] {
  const issues: TranslationIssue[] = [];

  // 문장 단위로 분리
  const sentences = text.split(/(?<=[.!?])\s+/);

  // 주어 패턴: "그는", "그녀는", "그것은", "나는", "우리는" 등
  const subjectPatterns = [
    /^(그는)/,
    /^(그녀는)/,
    /^(그가)/,
    /^(그녀가)/,
    /^(나는)/,
    /^(우리는)/,
    /^(그들은)/,
    /^(그들이)/,
    /^(그것은)/,
    /^(이것은)/,
  ];

  // 연속 3문장 이상 같은 주어로 시작하면 경고
  let consecutiveCount = 0;
  let lastSubject = '';
  let firstPosition = 0;
  let runningPosition = 0;

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i].trim();
    let foundSubject = '';

    for (const pattern of subjectPatterns) {
      const match = sentence.match(pattern);
      if (match) {
        foundSubject = match[1];
        break;
      }
    }

    if (foundSubject && foundSubject === lastSubject) {
      consecutiveCount++;
      if (consecutiveCount >= 3) {
        issues.push({
          pattern: '주어 반복',
          original: `"${lastSubject}"가 ${consecutiveCount}문장 연속 사용`,
          suggestion: `"${lastSubject}"가 연속으로 반복됩니다. 주어를 생략하거나 다른 표현으로 바꾸세요. 한국어에서는 주어를 자주 생략합니다.`,
          severity: 'medium',
          category: 'redundant',
          position: firstPosition,
          context: extractContext(text, firstPosition, 50),
        });
      }
    } else {
      consecutiveCount = foundSubject ? 1 : 0;
      lastSubject = foundSubject;
      firstPosition = runningPosition;
    }

    // 다음 문장의 시작 위치 계산
    runningPosition += sentence.length + 1; // +1 for separator
  }

  return issues;
}

// ============================================================
// 4. 접속사 과다 감지
// ============================================================

const CONNECTORS = ['그리고', '하지만', '그러나', '그래서', '그런데', '그러므로', '따라서', '또한', '게다가', '더욱이'];

function detectConnectorOveruse(text: string): TranslationIssue[] {
  const issues: TranslationIssue[] = [];

  // 문장 단위로 분리
  const sentences = text.split(/(?<=[.!?])\s+/);

  // 각 접속사의 문장 시작 위치 추적
  const connectorPositions: Record<string, number[]> = {};
  let runningPosition = 0;

  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    for (const connector of CONNECTORS) {
      if (trimmed.startsWith(connector)) {
        if (!connectorPositions[connector]) {
          connectorPositions[connector] = [];
        }
        connectorPositions[connector].push(runningPosition);
      }
    }
    runningPosition += sentence.length + 1;
  }

  // 전체 문장 대비 접속사로 시작하는 비율
  const totalSentences = sentences.length;
  let totalConnectorStarts = 0;
  const connectorKeys = Object.keys(connectorPositions);
  for (const key of connectorKeys) {
    totalConnectorStarts += connectorPositions[key].length;
  }

  // 30% 이상의 문장이 접속사로 시작하면 경고
  if (totalSentences >= 5 && totalConnectorStarts / totalSentences > 0.3) {
    issues.push({
      pattern: '접속사 과다',
      original: `전체 ${totalSentences}문장 중 ${totalConnectorStarts}문장이 접속사로 시작`,
      suggestion: `문장의 ${Math.round((totalConnectorStarts / totalSentences) * 100)}%가 접속사로 시작합니다. 접속사를 줄이고 문장 구조를 다양하게 만드세요.`,
      severity: 'low',
      category: 'connector',
      position: 0,
      context: text.slice(0, 80) + (text.length > 80 ? '...' : ''),
    });
  }

  // 같은 접속사 연속 사용 감지
  for (const connector of connectorKeys) {
    const positions = connectorPositions[connector];
    if (positions.length >= 3) {
      issues.push({
        pattern: `"${connector}" 반복`,
        original: `"${connector}"가 ${positions.length}회 문장 시작에 사용`,
        suggestion: `"${connector}"가 너무 자주 사용됩니다. 다른 접속 표현으로 바꾸거나 문장 구조를 변경하세요.`,
        severity: 'low',
        category: 'connector',
        position: positions[0],
        context: extractContext(text, positions[0], connector.length),
      });
    }
  }

  return issues;
}

// ============================================================
// 5. 명사화 과다 감지
// ============================================================

function detectNominalization(text: string): TranslationIssue[] {
  const issues: TranslationIssue[] = [];

  // ~함, ~됨, ~음 으로 끝나는 명사절 패턴
  const nominalizationPattern = /[가-힣]+(?:함|됨|음|임)(?:[,.\s]|$)/g;
  const matches: Array<{ match: string; index: number }> = [];

  let match: RegExpExecArray | null;
  while ((match = nominalizationPattern.exec(text)) !== null) {
    matches.push({ match: match[0], index: match.index });
  }

  // 1000자 당 5개 이상이면 과다로 판단
  const textLength = text.replace(/\s/g, '').length;
  const threshold = Math.max(3, Math.ceil(textLength / 1000) * 5);

  if (matches.length >= threshold) {
    // 처음 발견된 위치에서 보고
    const firstMatch = matches[0];
    issues.push({
      pattern: '명사화 과다',
      original: `명사형 종결("~함", "~됨", "~음")이 ${matches.length}회 사용`,
      suggestion: '명사형 종결이 과다합니다. 동사 표현("~합니다", "~됩니다", "~습니다")으로 바꾸면 더 자연스럽습니다.',
      severity: 'medium',
      category: 'expression',
      position: firstMatch.index,
      context: extractContext(text, firstMatch.index, firstMatch.match.length),
    });
  }

  // 개별 명사화가 문장 끝에 있는 경우도 표시 (5개 초과 시)
  if (matches.length > 5) {
    for (const m of matches.slice(0, 5)) {
      issues.push({
        pattern: '명사형 종결',
        original: m.match.trim(),
        suggestion: `"${m.match.trim()}"을(를) 동사형으로 바꿔보세요. 예: "~했음" → "~했다"`,
        severity: 'low',
        category: 'expression',
        position: m.index,
        context: extractContext(text, m.index, m.match.length),
      });
    }
  }

  return issues;
}

// ============================================================
// 6. 시제 혼용 감지
// ============================================================

function detectTenseMixing(text: string): TranslationIssue[] {
  const issues: TranslationIssue[] = [];

  // 문단 단위로 분리
  const paragraphs = text.split(/\n\s*\n/);

  for (const paragraph of paragraphs) {
    if (paragraph.trim().length < 20) continue;

    const sentences = paragraph.split(/(?<=[.!?])\s+/);
    if (sentences.length < 3) continue;

    // 각 문장의 시제 판별
    const tenses: Array<{ tense: 'past' | 'present' | 'unknown'; sentence: string }> = [];

    for (const sentence of sentences) {
      const trimmed = sentence.trim();
      if (!trimmed) continue;

      // 과거형 종결어미
      const pastEndings = /(?:했다|였다|었다|됐다|갔다|왔다|봤다|샀다|났다|졌다|렸다|랐다|았다|였다|했습니다|였습니다|었습니다)[.!?]?\s*$/;
      // 현재형 종결어미
      const presentEndings = /(?:한다|된다|간다|온다|본다|난다|진다|린다|란다|는다|인다|습니다|합니다|됩니다)[.!?]?\s*$/;

      if (pastEndings.test(trimmed)) {
        tenses.push({ tense: 'past', sentence: trimmed });
      } else if (presentEndings.test(trimmed)) {
        tenses.push({ tense: 'present', sentence: trimmed });
      } else {
        tenses.push({ tense: 'unknown', sentence: trimmed });
      }
    }

    // 알려진 시제만 필터
    const knownTenses = tenses.filter((t) => t.tense !== 'unknown');
    if (knownTenses.length < 3) continue;

    // 주요 시제 결정 (더 많이 쓰인 것)
    const pastCount = knownTenses.filter((t) => t.tense === 'past').length;
    const presentCount = knownTenses.filter((t) => t.tense === 'present').length;

    const dominantTense = pastCount >= presentCount ? 'past' : 'present';
    const dominantLabel = dominantTense === 'past' ? '과거형' : '현재형';
    const minorityLabel = dominantTense === 'past' ? '현재형' : '과거형';
    const minorityTense = dominantTense === 'past' ? 'present' : 'past';

    // 소수 시제가 전체의 15% ~ 45% 사이면 혼용 경고
    const minorityCount = dominantTense === 'past' ? presentCount : pastCount;
    const ratio = minorityCount / knownTenses.length;

    if (ratio >= 0.15 && ratio <= 0.45 && minorityCount >= 2) {
      // 혼용된 문장 찾기
      const mixedSentence = knownTenses.find((t) => t.tense === minorityTense);
      const position = mixedSentence ? text.indexOf(mixedSentence.sentence) : 0;

      issues.push({
        pattern: '시제 혼용',
        original: `${dominantLabel} 서술 중 ${minorityLabel} ${minorityCount}회 등장`,
        suggestion: `문단 내에서 ${dominantLabel}과 ${minorityLabel}이 혼용되고 있습니다. 시제를 ${dominantLabel}으로 통일하세요.`,
        severity: 'high',
        category: 'structure',
        position: Math.max(0, position),
        context: mixedSentence
          ? extractContext(text, Math.max(0, position), mixedSentence.sentence.length)
          : paragraph.slice(0, 60) + '...',
      });
    }
  }

  return issues;
}

// ============================================================
// 7. 관계대명사 직역 감지
// ============================================================

function detectRelativeClauseTranslation(text: string): TranslationIssue[] {
  const issues: TranslationIssue[] = [];

  // "~한 사람인 그는" 패턴
  const relativePattern1 = /[가-힣]+(?:한|된|인|는|던)\s+[가-힣]+인\s+(?:그는|그녀는|그가|그녀가)/g;
  let match: RegExpExecArray | null;

  while ((match = relativePattern1.exec(text)) !== null) {
    issues.push({
      pattern: '관계대명사 직역',
      original: match[0],
      suggestion: '관계대명사 구문의 직역입니다. 문장을 분리하거나 간결하게 수정하세요.',
      severity: 'medium',
      category: 'structure',
      position: match.index,
      context: extractContext(text, match.index, match[0].length),
    });
  }

  // 긴 수식절: 10음절 이상의 관형절 + 명사
  const longModifierPattern = /([가-힣\s]{10,})(?:하는|되는|인|했던|되었던)\s+([가-힣]+)(?:을|를|이|가|은|는)/g;
  while ((match = longModifierPattern.exec(text)) !== null) {
    issues.push({
      pattern: '긴 관형절',
      original: match[0],
      suggestion: '관형절이 너무 깁니다. 문장을 분리하여 가독성을 높이세요.',
      severity: 'low',
      category: 'structure',
      position: match.index,
      context: extractContext(text, match.index, match[0].length),
    });
  }

  return issues;
}

// ============================================================
// 중복 제거
// ============================================================

function deduplicateIssues(issues: TranslationIssue[]): TranslationIssue[] {
  const seen = new Set<string>();
  return issues.filter((issue) => {
    const key = `${issue.position}:${issue.pattern}:${issue.original}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ============================================================
// 점수 계산
// ============================================================

function calculateTranslationScore(text: string, issues: TranslationIssue[]): number {
  if (text.length === 0) return 100;

  const charCount = text.replace(/\s/g, '').length;
  if (charCount === 0) return 100;

  const severityWeights: Record<TranslationIssue['severity'], number> = {
    high: 5,
    medium: 3,
    low: 1,
  };

  let totalPenalty = 0;
  for (const issue of issues) {
    totalPenalty += severityWeights[issue.severity];
  }

  // 1000자 기준으로 정규화
  const normalizedPenalty = (totalPenalty / charCount) * 1000;
  const score = Math.max(0, Math.min(100, 100 - normalizedPenalty * 2));

  return Math.round(score * 10) / 10;
}

// ============================================================
// 요약 생성
// ============================================================

function generateSummary(issues: TranslationIssue[], score: number): string {
  if (issues.length === 0) {
    return '번역투가 감지되지 않았습니다. 자연스러운 한국어 문체입니다.';
  }

  const categoryCount: Record<string, number> = {};
  const severityCount: Record<string, number> = { high: 0, medium: 0, low: 0 };

  for (const issue of issues) {
    categoryCount[issue.category] = (categoryCount[issue.category] ?? 0) + 1;
    severityCount[issue.severity]++;
  }

  const parts: string[] = [];

  if (score >= 80) {
    parts.push('전반적으로 자연스러운 한국어입니다.');
  } else if (score >= 60) {
    parts.push('일부 번역투 표현이 감지되었습니다.');
  } else if (score >= 40) {
    parts.push('번역투 표현이 다수 발견되었습니다. 수정을 권장합니다.');
  } else {
    parts.push('번역투가 심각한 수준입니다. 전면적인 수정이 필요합니다.');
  }

  const categoryLabels: Record<string, string> = {
    passive: '피동 표현',
    structure: '영어식 구문',
    expression: '부자연스러운 표현',
    redundant: '불필요한 반복',
    connector: '접속사 과다',
  };

  const topCategories = Object.entries(categoryCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  if (topCategories.length > 0) {
    const categoryDescriptions = topCategories
      .map(([cat, count]) => `${categoryLabels[cat] ?? cat} ${count}건`)
      .join(', ');
    parts.push(`주요 문제: ${categoryDescriptions}`);
  }

  if (severityCount['high'] > 0) {
    parts.push(`심각도 높음 ${severityCount['high']}건을 우선 수정하세요.`);
  }

  return parts.join(' ');
}

// ============================================================
// 메인 함수
// ============================================================

export function detectTranslationStyle(text: string): TranslationStyleResult {
  if (!text || text.trim().length === 0) {
    return {
      issues: [],
      score: 100,
      summary: '분석할 텍스트가 없습니다.',
    };
  }

  const allIssues: TranslationIssue[] = [
    ...detectPassiveOveruse(text),
    ...detectStructurePatterns(text),
    ...detectSubjectRepetition(text),
    ...detectConnectorOveruse(text),
    ...detectNominalization(text),
    ...detectTenseMixing(text),
    ...detectRelativeClauseTranslation(text),
  ];

  const issues = deduplicateIssues(allIssues);
  issues.sort((a, b) => {
    // severity 우선 정렬
    const severityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
    const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (severityDiff !== 0) return severityDiff;
    return a.position - b.position;
  });

  const score = calculateTranslationScore(text, issues);
  const summary = generateSummary(issues, score);

  return { issues, score, summary };
}
