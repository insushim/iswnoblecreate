/**
 * 최종 퇴고 자동화 시스템 (FinalPolishSystem)
 *
 * 출판 직전 마지막 완성도를 높이는 시스템
 * - 다단계 퇴고 프로세스
 * - AI 자가 수정 반복
 * - 품질 기준 자동 검증
 * - 출판 수준 도달까지 반복
 */

import { generateText, generateJSON } from './gemini';
import { GeminiModel } from '@/types';

// ============================================================================
// 퇴고 타입 정의
// ============================================================================

export interface PolishPass {
  passNumber: number;
  passType: PolishPassType;
  focus: string[];
  inputContent: string;
  outputContent: string;
  changes: PolishChange[];
  qualityBefore: number;
  qualityAfter: number;
  passNotes: string;
}

export type PolishPassType =
  | 'ai-decontamination'    // AI 느낌 제거
  | 'sentence-refinement'   // 문장 다듬기
  | 'rhythm-flow'           // 리듬과 흐름
  | 'emotion-enhancement'   // 감정 강화
  | 'dialogue-polish'       // 대화 다듬기
  | 'description-vivid'     // 묘사 생생하게
  | 'consistency-check'     // 일관성 확인
  | 'final-proofread';      // 최종 교정

export interface PolishChange {
  type: PolishChangeType;
  before: string;
  after: string;
  reason: string;
  location: string;
}

export type PolishChangeType =
  | 'word-choice'
  | 'sentence-structure'
  | 'paragraph-flow'
  | 'emotion-expression'
  | 'dialogue-naturalization'
  | 'description-enhancement'
  | 'pacing-adjustment'
  | 'error-fix';

export interface PolishingResult {
  originalContent: string;
  finalContent: string;
  totalPasses: number;
  passes: PolishPass[];
  qualityProgression: number[];
  finalQualityScore: number;
  publishReady: boolean;
  remainingIssues: string[];
  certificate: string | null;
}

export interface QualityMetrics {
  overall: number;
  sentenceQuality: number;
  emotionalDepth: number;
  dialogueNaturalness: number;
  descriptionVividness: number;
  pacing: number;
  consistency: number;
  aiDecontamination: number;
}

// ============================================================================
// 퇴고 규칙 정의
// ============================================================================

export const POLISH_RULES = {
  // AI 탈취 규칙
  aiDecontamination: {
    bannedPatterns: [
      { pattern: /마치\s+.*처럼/g, reason: '과도한 비유' },
      { pattern: /그러나\s+그럼에도\s+불구하고/g, reason: '중복 접속사' },
      { pattern: /분명히|확실히|틀림없이/g, reason: '불필요한 확언' },
      { pattern: /(슬픔|기쁨|분노|두려움)을?\s+(느꼈|느낄)/g, reason: '감정 직접 서술' },
      { pattern: /~라고\s+할\s+수\s+있(다|었다)/g, reason: 'AI 설명체' },
      { pattern: /즉,?\s+/g, reason: '요약 어투' },
      { pattern: /다시\s+말해서?/g, reason: '반복 설명' },
      { pattern: /첫째.*둘째.*셋째/g, reason: '나열식 서술' },
    ],
    emotionReplacements: {
      '슬펐다': ['목이 메었다', '가슴이 먹먹했다', '눈시울이 붉어졌다'],
      '기뻤다': ['입꼬리가 올라갔다', '가슴이 벅찼다', '발걸음이 가벼워졌다'],
      '화가 났다': ['주먹을 움켜쥐었다', '이를 악물었다', '목에 핏줄이 섰다'],
      '무서웠다': ['심장이 쪼그라들었다', '숨이 막혔다', '등에 식은땀이 흘렀다'],
      '놀랐다': ['숨을 삼켰다', '눈이 커졌다', '심장이 멎는 듯했다'],
    },
  },

  // 문장 품질 규칙
  sentenceQuality: {
    maxSentenceLength: 80,
    minVariety: 3,  // 연속 문장 시작 다양성
    avoidRepetition: true,
    rhythmVariation: true,
  },

  // 대화 자연스러움 규칙
  dialogueNaturalness: {
    avoidInfoDump: true,
    subtextRequired: true,
    characterVoiceDistinct: true,
    tagVariation: true,
  },
};

// ============================================================================
// 최종 퇴고 시스템 클래스
// ============================================================================

export class FinalPolishSystem {
  private model: GeminiModel = 'gemini-2.0-flash';
  private maxIterations: number = 10;
  private targetQuality: number = 90;

  setModel(model: GeminiModel): void {
    this.model = model;
  }

  setTargetQuality(score: number): void {
    this.targetQuality = Math.min(100, Math.max(0, score));
  }

  /**
   * 전체 퇴고 프로세스 실행
   */
  async runFullPolishProcess(
    content: string,
    options: {
      genre?: string;
      style?: string;
      targetQuality?: number;
      maxIterations?: number;
    } = {}
  ): Promise<PolishingResult> {
    const targetQuality = options.targetQuality || this.targetQuality;
    const maxIterations = options.maxIterations || this.maxIterations;

    const passes: PolishPass[] = [];
    const qualityProgression: number[] = [];
    let currentContent = content;
    let currentQuality = await this.assessQuality(content);
    qualityProgression.push(currentQuality.overall);

    const passTypes: PolishPassType[] = [
      'ai-decontamination',
      'sentence-refinement',
      'rhythm-flow',
      'emotion-enhancement',
      'dialogue-polish',
      'description-vivid',
      'consistency-check',
      'final-proofread',
    ];

    let iteration = 0;

    // 목표 품질 도달까지 반복
    while (currentQuality.overall < targetQuality && iteration < maxIterations) {
      for (const passType of passTypes) {
        if (currentQuality.overall >= targetQuality) break;

        const pass = await this.executePolishPass(
          currentContent,
          passType,
          passes.length + 1,
          options.genre,
          options.style
        );

        passes.push(pass);
        currentContent = pass.outputContent;
        currentQuality = await this.assessQuality(currentContent);
        qualityProgression.push(currentQuality.overall);

        // 품질 향상이 없으면 다음 패스 타입으로
        if (pass.qualityAfter <= pass.qualityBefore) {
          continue;
        }
      }

      iteration++;
    }

    const publishReady = currentQuality.overall >= targetQuality;
    const remainingIssues = await this.identifyRemainingIssues(currentContent);

    return {
      originalContent: content,
      finalContent: currentContent,
      totalPasses: passes.length,
      passes,
      qualityProgression,
      finalQualityScore: currentQuality.overall,
      publishReady,
      remainingIssues,
      certificate: publishReady ? await this.generateCertificate(currentContent, currentQuality) : null,
    };
  }

  /**
   * 개별 퇴고 패스 실행
   */
  private async executePolishPass(
    content: string,
    passType: PolishPassType,
    passNumber: number,
    genre?: string,
    style?: string
  ): Promise<PolishPass> {
    const qualityBefore = (await this.assessQuality(content)).overall;
    const prompt = this.buildPolishPrompt(content, passType, genre, style);

    const result = await generateJSON<{
      polishedContent: string;
      changes: { before: string; after: string; reason: string; location: string }[];
      notes: string;
    }>(prompt, this.model);

    const qualityAfter = (await this.assessQuality(result.polishedContent)).overall;

    return {
      passNumber,
      passType,
      focus: this.getPassFocus(passType),
      inputContent: content,
      outputContent: result.polishedContent,
      changes: result.changes.map(c => ({
        type: this.determineChangeType(passType),
        before: c.before,
        after: c.after,
        reason: c.reason,
        location: c.location,
      })),
      qualityBefore,
      qualityAfter,
      passNotes: result.notes,
    };
  }

  /**
   * 품질 평가
   */
  async assessQuality(content: string): Promise<QualityMetrics> {
    const prompt = `다음 텍스트의 품질을 평가하세요.

【텍스트】
${content.substring(0, 10000)}

【평가 기준】
1. 문장 품질 (sentenceQuality): 문법, 가독성, 리듬
2. 감정 깊이 (emotionalDepth): 감정 표현의 깊이와 진정성
3. 대화 자연스러움 (dialogueNaturalness): 대화의 자연스러움과 캐릭터성
4. 묘사 생생함 (descriptionVividness): 묘사의 구체성과 감각성
5. 페이싱 (pacing): 속도감과 긴장/이완 조절
6. 일관성 (consistency): 설정, 캐릭터, 톤의 일관성
7. AI 탈취 (aiDecontamination): AI스러운 표현 제거 정도

각 항목 1-100점으로 평가하세요.

출력 형식 (JSON):
{
  "sentenceQuality": 점수,
  "emotionalDepth": 점수,
  "dialogueNaturalness": 점수,
  "descriptionVividness": 점수,
  "pacing": 점수,
  "consistency": 점수,
  "aiDecontamination": 점수,
  "overall": 종합점수,
  "assessment": "간단한 평가"
}`;

    return await generateJSON<QualityMetrics>(prompt, this.model);
  }

  /**
   * 퇴고 프롬프트 생성
   */
  private buildPolishPrompt(
    content: string,
    passType: PolishPassType,
    genre?: string,
    style?: string
  ): string {
    const basePrompt = `당신은 20년 경력의 전문 퇴고 편집자입니다.

${genre ? `장르: ${genre}` : ''}
${style ? `문체: ${style}` : ''}

【퇴고 대상】
${content}

═══════════════════════════════════════════════════════════════`;

    const passPrompts: Record<PolishPassType, string> = {
      'ai-decontamination': `
【AI 탈취 패스】

AI가 쓴 것 같은 느낌을 완전히 제거하세요.

제거할 패턴:
1. "마치 ~처럼" 남용 → 더 직접적인 표현으로
2. 감정 직접 서술 ("슬펐다") → 신체 반응으로 ("목이 메었다")
3. 설명적 문장 ("왜냐하면~때문이다") → 자연스러운 흐름으로
4. 과도한 접속사 ("그러나 그럼에도 불구하고") → 간결하게
5. 확언 표현 ("분명히", "확실히") → 삭제
6. 나열식 서술 ("첫째, 둘째") → 유기적 전개로

모든 AI스러운 표현을 인간 작가 스타일로 변환하세요.`,

      'sentence-refinement': `
【문장 다듬기 패스】

모든 문장을 더 강력하고 정교하게 다듬으세요.

개선 사항:
1. 불필요한 단어 제거 (군더더기)
2. 더 강력한 동사 사용
3. 수동태 → 능동태
4. 긴 문장 분리 또는 리듬 조절
5. 문장 시작 다양화 (연속 "~는", "~가" 피하기)
6. 중복 표현 제거`,

      'rhythm-flow': `
【리듬과 흐름 패스】

문장과 문단의 리듬을 최적화하세요.

개선 사항:
1. 짧은 문장과 긴 문장 교차
2. 긴장 장면 = 짧은 문장
3. 서정적 장면 = 긴 문장
4. 문단 전환 자연스럽게
5. 읽기 호흡 고려
6. 클라이맥스 리듬 강화`,

      'emotion-enhancement': `
【감정 강화 패스】

감정 표현을 더 깊고 진정성 있게 만드세요.

개선 사항:
1. 감정 직접 서술 → 신체 반응/행동
2. 내면 독백 깊이 추가
3. 감정의 미묘한 결 표현
4. 독자 공감 포인트 강화
5. 억지 감정 제거
6. 서브텍스트 추가`,

      'dialogue-polish': `
【대화 다듬기 패스】

대화를 더 자연스럽고 캐릭터답게 만드세요.

개선 사항:
1. 설명적 대화 제거
2. 캐릭터별 말투 차별화
3. 서브텍스트 추가 (말과 속마음의 차이)
4. 자연스러운 끊김/중첩
5. 대화 태그 다양화
6. 불필요한 태그 제거`,

      'description-vivid': `
【묘사 생생하게 패스】

묘사를 더 감각적이고 구체적으로 만드세요.

개선 사항:
1. 추상적 → 구체적
2. 시각 외 감각 추가 (청각, 촉각, 후각)
3. 독특한 디테일 추가
4. 클리셰 비유 → 신선한 비유
5. 배경을 살아있게
6. 분위기 강화`,

      'consistency-check': `
【일관성 확인 패스】

일관성 문제를 찾아 수정하세요.

확인 사항:
1. 캐릭터 외모/성격 일관성
2. 시점/시제 일관성
3. 설정/세계관 일관성
4. 시간 흐름 논리
5. 톤 일관성
6. 호칭/이름 통일`,

      'final-proofread': `
【최종 교정 패스】

마지막 오류를 찾아 수정하세요.

확인 사항:
1. 맞춤법 오류
2. 띄어쓰기 오류
3. 문장부호 오류
4. 오탈자
5. 포맷팅 문제
6. 누락/중복`,
    };

    return `${basePrompt}

${passPrompts[passType]}

═══════════════════════════════════════════════════════════════

출력 형식 (JSON):
{
  "polishedContent": "완전히 수정된 텍스트 (전체)",
  "changes": [
    {
      "before": "수정 전",
      "after": "수정 후",
      "reason": "수정 이유",
      "location": "위치"
    }
  ],
  "notes": "이번 패스 노트"
}

⚠️ 중요: polishedContent에는 반드시 수정된 전체 텍스트를 포함하세요.`;
  }

  /**
   * 남은 이슈 식별
   */
  private async identifyRemainingIssues(content: string): Promise<string[]> {
    const prompt = `다음 텍스트에서 아직 남아있는 문제점을 찾으세요.

【텍스트】
${content.substring(0, 10000)}

출력 형식 (JSON):
{
  "issues": ["문제점 1", "문제점 2", ...]
}

완벽하면 빈 배열을 반환하세요.`;

    const result = await generateJSON<{ issues: string[] }>(prompt, this.model);
    return result.issues;
  }

  /**
   * 품질 인증서 생성
   */
  private async generateCertificate(
    content: string,
    quality: QualityMetrics
  ): Promise<string> {
    return `
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║              🏆 AI 퇴고 완료 인증서                           ║
║              Final Polish Certificate                        ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  📊 품질 점수                                                 ║
║  ─────────────────────────────────────────                   ║
║  종합: ${quality.overall}/100                                          ║
║  문장 품질: ${quality.sentenceQuality}/100                              ║
║  감정 깊이: ${quality.emotionalDepth}/100                               ║
║  대화 자연스러움: ${quality.dialogueNaturalness}/100                    ║
║  묘사 생생함: ${quality.descriptionVividness}/100                       ║
║  페이싱: ${quality.pacing}/100                                          ║
║  일관성: ${quality.consistency}/100                                     ║
║  AI 탈취: ${quality.aiDecontamination}/100                              ║
║                                                              ║
║  ─────────────────────────────────────────                   ║
║                                                              ║
║  ✅ 출판 수준 품질 달성                                       ║
║                                                              ║
║  발급일: ${new Date().toISOString().split('T')[0]}                      ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝`;
  }

  private getPassFocus(passType: PolishPassType): string[] {
    const focusMap: Record<PolishPassType, string[]> = {
      'ai-decontamination': ['AI 표현 제거', '자연스러운 문장'],
      'sentence-refinement': ['문장 구조', '단어 선택'],
      'rhythm-flow': ['리듬', '흐름', '페이싱'],
      'emotion-enhancement': ['감정 표현', '공감'],
      'dialogue-polish': ['대화 자연스러움', '캐릭터성'],
      'description-vivid': ['감각적 묘사', '구체성'],
      'consistency-check': ['일관성', '논리'],
      'final-proofread': ['맞춤법', '오탈자'],
    };
    return focusMap[passType];
  }

  private determineChangeType(passType: PolishPassType): PolishChangeType {
    const typeMap: Record<PolishPassType, PolishChangeType> = {
      'ai-decontamination': 'word-choice',
      'sentence-refinement': 'sentence-structure',
      'rhythm-flow': 'pacing-adjustment',
      'emotion-enhancement': 'emotion-expression',
      'dialogue-polish': 'dialogue-naturalization',
      'description-vivid': 'description-enhancement',
      'consistency-check': 'error-fix',
      'final-proofread': 'error-fix',
    };
    return typeMap[passType];
  }
}

// 싱글톤 인스턴스
export const finalPolishSystem = new FinalPolishSystem();
