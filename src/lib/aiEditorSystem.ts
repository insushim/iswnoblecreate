/**
 * AI 편집자 시스템 (AIEditorSystem)
 *
 * 전문 편집자의 역할을 AI로 구현
 * - 다층적 편집 (구조 편집, 라인 편집, 카피 편집)
 * - 피드백 생성 및 자동 적용
 * - 퇴고 워크플로우
 * - 문장력 향상 가이드
 */

import { generateJSON, generateText } from './gemini';
import { GeminiModel } from '@/types';

// ============================================
// 편집 레벨 정의
// ============================================

export type EditingLevel =
  | 'developmental'  // 구조 편집 (스토리 구조, 플롯, 캐릭터 아크)
  | 'line'           // 라인 편집 (문장력, 스타일, 흐름)
  | 'copy'           // 카피 편집 (문법, 맞춤법, 일관성)
  | 'proofread';     // 교정 (최종 오류 검수)

export interface EditingPass {
  level: EditingLevel;
  focus: string[];
  strictness: 1 | 2 | 3 | 4 | 5;
}

// ============================================
// 편집 결과 타입
// ============================================

export interface EditingResult {
  level: EditingLevel;
  originalText: string;
  editedText: string;

  changes: EditChange[];

  score: {
    before: number;
    after: number;
    improvement: number;
  };

  overallFeedback: string;
  priorityIssues: string[];

  statistics: {
    totalChanges: number;
    majorChanges: number;
    minorChanges: number;
    styleChanges: number;
    grammarFixes: number;
  };
}

export interface EditChange {
  id: string;
  type: 'deletion' | 'addition' | 'replacement' | 'reorder' | 'suggestion';
  severity: 'critical' | 'major' | 'minor' | 'suggestion';
  category: 'plot' | 'character' | 'dialogue' | 'description' | 'pacing' |
            'style' | 'grammar' | 'consistency' | 'clarity' | 'emotion';

  location: {
    start: number;
    end: number;
    context: string;
  };

  original: string;
  replacement: string;
  reason: string;

  applied: boolean;
}

// ============================================
// 구조 편집 (Developmental Editing)
// ============================================

export interface DevelopmentalFeedback {
  plotAnalysis: {
    strength: string[];
    weaknesses: string[];
    suggestions: string[];
    structureScore: number;
  };

  characterAnalysis: {
    characterName: string;
    arcConsistency: number;
    voiceDistinctiveness: number;
    motivationClarity: number;
    issues: string[];
    suggestions: string[];
  }[];

  pacingAnalysis: {
    overallPacing: 'too-slow' | 'slow' | 'good' | 'fast' | 'too-fast';
    slowSpots: { location: string; suggestion: string }[];
    rushSpots: { location: string; suggestion: string }[];
  };

  themeAnalysis: {
    identifiedThemes: string[];
    themeIntegration: number;
    suggestions: string[];
  };

  overallRecommendations: string[];
}

// ============================================
// 라인 편집 (Line Editing)
// ============================================

export interface LineEditingFeedback {
  sentenceLevel: {
    awkwardSentences: { original: string; improved: string; reason: string }[];
    overlyLongSentences: { original: string; improved: string }[];
    fragments: { original: string; suggestion: string }[];
    runOnSentences: { original: string; improved: string }[];
  };

  wordChoice: {
    weakVerbs: { original: string; alternatives: string[] }[];
    cliches: { original: string; alternatives: string[] }[];
    repetitiveWords: { word: string; count: number; alternatives: string[] }[];
    vagueWords: { original: string; context: string; specific: string }[];
  };

  styleIssues: {
    passiveVoice: { original: string; active: string }[];
    adverbOveruse: { original: string; improved: string }[];
    showDontTell: { telling: string; showing: string }[];
    purpleProse: { original: string; simplified: string }[];
  };

  dialogueIssues: {
    unnaturalDialogue: { original: string; improved: string; reason: string }[];
    tagIssues: { original: string; improved: string }[];
    missingSubtext: { dialogue: string; suggestion: string }[];
  };

  flowIssues: {
    abruptTransitions: { location: string; suggestion: string }[];
    choppyPassages: { original: string; smoothed: string }[];
    monotonousRhythm: { passage: string; varied: string }[];
  };
}

// ============================================
// AI 편집자 클래스
// ============================================

export class AIEditorSystem {
  private editingPasses: EditingPass[] = [
    { level: 'developmental', focus: ['plot', 'character', 'pacing'], strictness: 4 },
    { level: 'line', focus: ['style', 'flow', 'word-choice'], strictness: 4 },
    { level: 'copy', focus: ['grammar', 'consistency'], strictness: 5 },
    { level: 'proofread', focus: ['typos', 'punctuation'], strictness: 5 },
  ];

  /**
   * 전체 편집 파이프라인 실행
   */
  async runFullEditingPipeline(
    apiKey: string,
    text: string,
    context: {
      genre: string[];
      targetAudience: string;
      authorStyle?: string;
    },
    model: GeminiModel = 'gemini-2.5-pro'
  ): Promise<{
    finalText: string;
    allResults: EditingResult[];
    summary: {
      totalImprovements: number;
      qualityScoreBefore: number;
      qualityScoreAfter: number;
      keyChanges: string[];
    };
  }> {
    const results: EditingResult[] = [];
    let currentText = text;

    // 각 편집 레벨 순차 실행
    for (const pass of this.editingPasses) {
      const result = await this.performEditingPass(apiKey, currentText, pass, context, model);
      results.push(result);
      currentText = result.editedText;
    }

    // 최종 품질 점수 계산
    const firstScore = results[0]?.score.before || 50;
    const lastScore = results[results.length - 1]?.score.after || 70;

    return {
      finalText: currentText,
      allResults: results,
      summary: {
        totalImprovements: results.reduce((sum, r) => sum + r.statistics.totalChanges, 0),
        qualityScoreBefore: firstScore,
        qualityScoreAfter: lastScore,
        keyChanges: results.flatMap(r => r.priorityIssues).slice(0, 10),
      },
    };
  }

  /**
   * 개별 편집 패스 실행
   */
  async performEditingPass(
    apiKey: string,
    text: string,
    pass: EditingPass,
    context: {
      genre: string[];
      targetAudience: string;
      authorStyle?: string;
    },
    model: GeminiModel = 'gemini-2.5-pro'
  ): Promise<EditingResult> {
    switch (pass.level) {
      case 'developmental':
        return this.developmentalEdit(apiKey, text, context, pass.strictness, model);
      case 'line':
        return this.lineEdit(apiKey, text, context, pass.strictness, model);
      case 'copy':
        return this.copyEdit(apiKey, text, pass.strictness, model);
      case 'proofread':
        return this.proofread(apiKey, text, model);
      default:
        throw new Error(`Unknown editing level: ${pass.level}`);
    }
  }

  /**
   * 구조 편집
   */
  async developmentalEdit(
    apiKey: string,
    text: string,
    context: { genre: string[]; targetAudience: string; authorStyle?: string },
    strictness: number,
    model: GeminiModel
  ): Promise<EditingResult> {
    const prompt = `당신은 베스트셀러를 만들어낸 경험이 풍부한 출판 편집자입니다.
다음 텍스트에 대한 구조 편집(Developmental Editing)을 수행하세요.

## 텍스트
${text.slice(0, 15000)}

## 컨텍스트
- 장르: ${context.genre.join(', ')}
- 타겟 독자: ${context.targetAudience}
${context.authorStyle ? `- 작가 스타일: ${context.authorStyle}` : ''}

## 편집 엄격도: ${strictness}/5

## 구조 편집 체크리스트

### 1. 플롯 분석
- 시작이 독자를 끌어당기는가?
- 갈등이 명확하고 흥미로운가?
- 긴장감이 적절히 구축되는가?
- 클라이맥스가 만족스러운가?
- 결말이 설득력 있는가?

### 2. 캐릭터 분석
- 주인공이 공감 가능하고 입체적인가?
- 캐릭터 동기가 명확한가?
- 캐릭터 아크가 일관되고 만족스러운가?
- 대화가 캐릭터 성격을 반영하는가?

### 3. 페이싱 분석
- 속도가 적절한가?
- 지루한 구간이 있는가?
- 급하게 처리된 부분이 있는가?
- 씬과 요약의 균형이 맞는가?

### 4. 테마 분석
- 테마가 명확히 드러나는가?
- 테마가 자연스럽게 통합되어 있는가?

## 수정 지침
- 문제점만 지적하지 말고, 구체적으로 수정해주세요
- 작가의 목소리를 존중하면서 개선하세요
- 장르 관습을 고려하세요

## 응답 형식 (JSON)
{
  "editedText": "구조적으로 개선된 전체 텍스트",
  "changes": [
    {
      "id": "고유ID",
      "type": "replacement/addition/deletion/reorder",
      "severity": "critical/major/minor",
      "category": "plot/character/pacing",
      "location": {
        "start": 0,
        "end": 100,
        "context": "주변 텍스트"
      },
      "original": "원본",
      "replacement": "수정본",
      "reason": "수정 이유"
    }
  ],
  "score": {
    "before": 1-100,
    "after": 1-100
  },
  "overallFeedback": "전체 피드백",
  "priorityIssues": ["우선 해결할 문제들"]
}

JSON만 출력하세요.`;

    try {
      const result = await generateJSON<{
        editedText: string;
        changes: EditChange[];
        score: { before: number; after: number };
        overallFeedback: string;
        priorityIssues: string[];
      }>(apiKey, prompt, {
        model,
        temperature: 0.4,
        maxTokens: 32000,
      });

      return {
        level: 'developmental',
        originalText: text,
        editedText: result.editedText,
        changes: result.changes.map(c => ({ ...c, applied: true })),
        score: {
          before: result.score.before,
          after: result.score.after,
          improvement: result.score.after - result.score.before,
        },
        overallFeedback: result.overallFeedback,
        priorityIssues: result.priorityIssues,
        statistics: {
          totalChanges: result.changes.length,
          majorChanges: result.changes.filter(c => c.severity === 'major' || c.severity === 'critical').length,
          minorChanges: result.changes.filter(c => c.severity === 'minor').length,
          styleChanges: 0,
          grammarFixes: 0,
        },
      };
    } catch (error) {
      console.error('[AIEditorSystem] 구조 편집 실패:', error);
      throw error;
    }
  }

  /**
   * 라인 편집
   */
  async lineEdit(
    apiKey: string,
    text: string,
    context: { genre: string[]; targetAudience: string; authorStyle?: string },
    strictness: number,
    model: GeminiModel
  ): Promise<EditingResult> {
    const prompt = `당신은 문장력이 뛰어난 프로 편집자입니다.
다음 텍스트에 대한 라인 편집(Line Editing)을 수행하세요.

## 텍스트
${text.slice(0, 15000)}

## 장르: ${context.genre.join(', ')}
## 편집 엄격도: ${strictness}/5

## 라인 편집 체크리스트

### 1. 문장 수준
- 어색한 문장 → 자연스럽게
- 너무 긴 문장 → 분리
- 문장 파편 → 완성된 문장으로
- 런온 문장 → 적절히 끊기

### 2. 단어 선택
- 약한 동사 → 강한 동사
- 클리셰 → 신선한 표현
- 반복 단어 → 동의어로 변주
- 모호한 표현 → 구체적 표현

### 3. 스타일 개선
- 수동태 → 능동태
- 부사 과용 → 강한 동사로
- 말하기(Tell) → 보여주기(Show)
- 과잉 묘사 → 간결하게

### 4. 대화 개선
- 부자연스러운 대화 → 실제 대화처럼
- 대화 태그 문제 → 다양하게
- 서브텍스트 부족 → 깊이 추가

### 5. 흐름 개선
- 급작스러운 전환 → 매끄럽게
- 뚝뚝 끊기는 문장 → 연결
- 단조로운 리듬 → 변화

## 수정 원칙
- 모든 수정에는 이유가 있어야 함
- 작가의 목소리 유지
- 과도한 수정 지양 (필요한 것만)

## 응답 형식 (JSON)
{
  "editedText": "라인 편집된 전체 텍스트",
  "changes": [
    {
      "id": "고유ID",
      "type": "replacement",
      "severity": "major/minor",
      "category": "style/dialogue/flow/word-choice",
      "location": {
        "start": 0,
        "end": 50,
        "context": "주변 텍스트"
      },
      "original": "원본 표현",
      "replacement": "수정된 표현",
      "reason": "수정 이유"
    }
  ],
  "score": {
    "before": 1-100,
    "after": 1-100
  },
  "overallFeedback": "전체 문장력 피드백",
  "priorityIssues": ["스타일 관련 주요 이슈"]
}

JSON만 출력하세요.`;

    try {
      const result = await generateJSON<{
        editedText: string;
        changes: EditChange[];
        score: { before: number; after: number };
        overallFeedback: string;
        priorityIssues: string[];
      }>(apiKey, prompt, {
        model,
        temperature: 0.5,
        maxTokens: 32000,
      });

      return {
        level: 'line',
        originalText: text,
        editedText: result.editedText,
        changes: result.changes.map(c => ({ ...c, applied: true })),
        score: {
          before: result.score.before,
          after: result.score.after,
          improvement: result.score.after - result.score.before,
        },
        overallFeedback: result.overallFeedback,
        priorityIssues: result.priorityIssues,
        statistics: {
          totalChanges: result.changes.length,
          majorChanges: result.changes.filter(c => c.severity === 'major').length,
          minorChanges: result.changes.filter(c => c.severity === 'minor').length,
          styleChanges: result.changes.filter(c => c.category === 'style').length,
          grammarFixes: 0,
        },
      };
    } catch (error) {
      console.error('[AIEditorSystem] 라인 편집 실패:', error);
      throw error;
    }
  }

  /**
   * 카피 편집
   */
  async copyEdit(
    apiKey: string,
    text: string,
    strictness: number,
    model: GeminiModel
  ): Promise<EditingResult> {
    const prompt = `당신은 꼼꼼한 카피 에디터입니다.
다음 텍스트에 대한 카피 편집(Copy Editing)을 수행하세요.

## 텍스트
${text.slice(0, 15000)}

## 편집 엄격도: ${strictness}/5

## 카피 편집 체크리스트

### 1. 문법
- 주어-서술어 호응
- 조사 사용
- 어미 일관성
- 높임법 일관성
- 시제 일관성

### 2. 맞춤법
- 띄어쓰기
- 된소리/거센소리
- 사이시옷
- 외래어 표기

### 3. 구두점
- 마침표, 쉼표 사용
- 따옴표 사용
- 물음표, 느낌표 적절성

### 4. 일관성
- 용어 일관성 (같은 개념을 같은 단어로)
- 표기 일관성 (숫자, 날짜 등)
- 캐릭터 이름 일관성
- 설정 일관성

### 5. 명확성
- 모호한 대명사 참조
- 혼란스러운 문장 구조
- 논리적 비약

## 응답 형식 (JSON)
{
  "editedText": "카피 편집된 전체 텍스트",
  "changes": [
    {
      "id": "고유ID",
      "type": "replacement",
      "severity": "minor",
      "category": "grammar/consistency/clarity",
      "location": {
        "start": 0,
        "end": 20,
        "context": "주변 텍스트"
      },
      "original": "원본",
      "replacement": "수정",
      "reason": "수정 이유"
    }
  ],
  "score": {
    "before": 1-100,
    "after": 1-100
  },
  "overallFeedback": "전체 피드백",
  "priorityIssues": ["일관성/문법 관련 주요 이슈"]
}

JSON만 출력하세요.`;

    try {
      const result = await generateJSON<{
        editedText: string;
        changes: EditChange[];
        score: { before: number; after: number };
        overallFeedback: string;
        priorityIssues: string[];
      }>(apiKey, prompt, {
        model,
        temperature: 0.2,
        maxTokens: 32000,
      });

      return {
        level: 'copy',
        originalText: text,
        editedText: result.editedText,
        changes: result.changes.map(c => ({ ...c, applied: true })),
        score: {
          before: result.score.before,
          after: result.score.after,
          improvement: result.score.after - result.score.before,
        },
        overallFeedback: result.overallFeedback,
        priorityIssues: result.priorityIssues,
        statistics: {
          totalChanges: result.changes.length,
          majorChanges: 0,
          minorChanges: result.changes.length,
          styleChanges: 0,
          grammarFixes: result.changes.filter(c => c.category === 'grammar').length,
        },
      };
    } catch (error) {
      console.error('[AIEditorSystem] 카피 편집 실패:', error);
      throw error;
    }
  }

  /**
   * 교정
   */
  async proofread(
    apiKey: string,
    text: string,
    model: GeminiModel
  ): Promise<EditingResult> {
    const prompt = `당신은 출판 전 최종 교정자입니다.
다음 텍스트의 최종 교정을 수행하세요.

## 텍스트
${text.slice(0, 15000)}

## 교정 체크리스트
1. 오타
2. 누락된 글자
3. 잘못된 띄어쓰기
4. 구두점 오류
5. 중복 단어
6. 누락된 따옴표/괄호

## 응답 형식 (JSON)
{
  "editedText": "교정된 전체 텍스트",
  "changes": [
    {
      "id": "고유ID",
      "type": "replacement",
      "severity": "minor",
      "category": "grammar",
      "location": {
        "start": 0,
        "end": 10,
        "context": "주변"
      },
      "original": "오류",
      "replacement": "수정",
      "reason": "오타 수정"
    }
  ],
  "score": {
    "before": 1-100,
    "after": 1-100
  },
  "overallFeedback": "최종 교정 완료",
  "priorityIssues": []
}

JSON만 출력하세요.`;

    try {
      const result = await generateJSON<{
        editedText: string;
        changes: EditChange[];
        score: { before: number; after: number };
        overallFeedback: string;
        priorityIssues: string[];
      }>(apiKey, prompt, {
        model,
        temperature: 0.1,
        maxTokens: 32000,
      });

      return {
        level: 'proofread',
        originalText: text,
        editedText: result.editedText,
        changes: result.changes.map(c => ({ ...c, applied: true })),
        score: {
          before: result.score.before,
          after: result.score.after,
          improvement: result.score.after - result.score.before,
        },
        overallFeedback: result.overallFeedback,
        priorityIssues: [],
        statistics: {
          totalChanges: result.changes.length,
          majorChanges: 0,
          minorChanges: result.changes.length,
          styleChanges: 0,
          grammarFixes: result.changes.length,
        },
      };
    } catch (error) {
      console.error('[AIEditorSystem] 교정 실패:', error);
      throw error;
    }
  }

  /**
   * 문장력 향상 가이드 생성
   */
  async generateWritingGuide(
    apiKey: string,
    text: string,
    model: GeminiModel = 'gemini-2.5-flash'
  ): Promise<{
    overallAssessment: string;
    strengths: string[];
    areasForImprovement: string[];
    specificExercises: { skill: string; exercise: string; example: string }[];
    recommendedReadings: string[];
  }> {
    const prompt = `당신은 작문 교육 전문가입니다.
다음 텍스트를 분석하고, 작가가 문장력을 향상시킬 수 있는 맞춤형 가이드를 제공하세요.

## 텍스트 샘플
${text.slice(0, 5000)}

## 분석 후 제공할 것
1. 전체 평가
2. 강점 (구체적으로)
3. 개선이 필요한 부분 (구체적으로)
4. 맞춤형 연습 (이 작가에게 필요한)
5. 추천 도서/작품 (이 작가가 배울 수 있는)

## 응답 형식 (JSON)
{
  "overallAssessment": "전체 평가",
  "strengths": ["강점1", "강점2"],
  "areasForImprovement": ["개선점1", "개선점2"],
  "specificExercises": [
    {
      "skill": "개선할 스킬",
      "exercise": "연습 방법",
      "example": "예시"
    }
  ],
  "recommendedReadings": ["추천 도서/작품"]
}

JSON만 출력하세요.`;

    try {
      return await generateJSON<{
        overallAssessment: string;
        strengths: string[];
        areasForImprovement: string[];
        specificExercises: { skill: string; exercise: string; example: string }[];
        recommendedReadings: string[];
      }>(apiKey, prompt, {
        model,
        temperature: 0.5,
      });
    } catch (error) {
      console.error('[AIEditorSystem] 가이드 생성 실패:', error);
      throw error;
    }
  }

  /**
   * 특정 문장/단락 집중 편집
   */
  async focusEdit(
    apiKey: string,
    passage: string,
    focusArea: 'dialogue' | 'action' | 'description' | 'emotion' | 'transition',
    model: GeminiModel = 'gemini-2.5-flash'
  ): Promise<{
    original: string;
    variations: { text: string; style: string; strength: string }[];
    recommended: number;
    explanation: string;
  }> {
    const focusPrompts: Record<string, string> = {
      dialogue: '대화가 자연스럽고 캐릭터 성격이 드러나도록',
      action: '행동이 역동적이고 명확하게 전달되도록',
      description: '묘사가 감각적이고 생생하도록',
      emotion: '감정이 신체적 반응을 통해 전달되도록',
      transition: '전환이 자연스럽고 매끄럽도록',
    };

    const prompt = `다음 구절을 ${focusPrompts[focusArea]} 3가지 다른 버전으로 다시 써주세요.

## 원본
${passage}

## 요구사항
- 각 버전은 서로 다른 스타일/접근법
- 원본보다 확실히 개선되어야 함
- 핵심 의미는 유지

## 응답 형식 (JSON)
{
  "original": "원본",
  "variations": [
    {
      "text": "버전1",
      "style": "스타일 설명",
      "strength": "이 버전의 강점"
    }
  ],
  "recommended": 0,
  "explanation": "추천 이유"
}

JSON만 출력하세요.`;

    try {
      return await generateJSON<{
        original: string;
        variations: { text: string; style: string; strength: string }[];
        recommended: number;
        explanation: string;
      }>(apiKey, prompt, {
        model,
        temperature: 0.8,
      });
    } catch (error) {
      console.error('[AIEditorSystem] 집중 편집 실패:', error);
      throw error;
    }
  }
}

// ============================================
// 내보내기
// ============================================

export const aiEditorSystem = new AIEditorSystem();
export default AIEditorSystem;
