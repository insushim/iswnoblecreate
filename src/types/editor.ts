// 편집 마크업 타입
export interface EditMark {
  id: string;
  sceneId: string;
  chapterId: string;
  type: 'correction' | 'suggestion' | 'comment' | 'deletion' | 'insertion' | 'rewrite';
  status: 'pending' | 'accepted' | 'rejected' | 'modified';
  author: 'ai' | 'human';

  // 위치
  startOffset: number;
  endOffset: number;
  originalText: string;

  // 수정 내용
  suggestedText?: string;
  comment?: string;
  category: EditCategory;

  // 메타
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: 'ai' | 'human';
}

export type EditCategory =
  | 'spelling'       // 맞춤법
  | 'grammar'        // 문법
  | 'style'          // 문체
  | 'consistency'    // 일관성
  | 'translation'    // 번역투
  | 'cliche'         // 클리셰
  | 'pacing'         // 페이싱
  | 'dialogue'       // 대화
  | 'description'    // 묘사
  | 'plot'           // 플롯
  | 'character'      // 캐릭터
  | 'other';         // 기타

// 편집 세션
export interface EditSession {
  id: string;
  projectId: string;
  chapterId: string;
  status: 'in_progress' | 'review' | 'approved' | 'published';

  // 편집 단계
  currentPhase: EditPhase;
  phases: EditPhaseRecord[];

  // 통계
  totalMarks: number;
  resolvedMarks: number;
  acceptedMarks: number;
  rejectedMarks: number;

  createdAt: string;
  updatedAt: string;
}

export type EditPhase =
  | 'ai_draft'           // AI 초고
  | 'structural_edit'    // 구조 편집 (플롯, 전개)
  | 'line_edit'          // 라인 편집 (문장, 문체)
  | 'copy_edit'          // 카피 편집 (맞춤법, 문법)
  | 'proofread'          // 교정 (최종 확인)
  | 'human_review'       // 인간 편집자 검토
  | 'final_approval';    // 최종 승인

export interface EditPhaseRecord {
  phase: EditPhase;
  startedAt: string;
  completedAt?: string;
  editorType: 'ai' | 'human';
  marksCreated: number;
  marksResolved: number;
  notes?: string;
}

// 원고지 매수 환산
export interface ManuscriptInfo {
  totalChars: number;
  manuscriptPages: number;        // 200자 원고지 매수
  estimatedBookPages: number;     // 예상 책 페이지 (신국판 기준)
  estimatedPrintCost: string;     // 예상 인쇄 비용 범위
  publishingCategory: string;     // 분류 (단편/중편/장편)
}
