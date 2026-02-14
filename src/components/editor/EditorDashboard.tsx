'use client';

import { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  CheckCircle2,
  XCircle,
  Pencil,
  MessageSquare,
  FileText,
  BookOpen,
  ChevronRight,
  Filter,
  Clock,
  BarChart3,
  AlertTriangle,
  Sparkles,
  Eye,
  Trash2,
  Plus,
  RotateCcw,
} from 'lucide-react';
import type { EditMark, EditSession, EditPhase, EditCategory, ManuscriptInfo } from '@/types/editor';
import { EditorWorkflow } from '@/lib/editorWorkflow';

// ============================================
// 타입 정의
// ============================================

interface EditorDashboardProps {
  session: EditSession;
  marks: EditMark[];
  manuscriptInfo: ManuscriptInfo;
  content: string;
  onMarkAction: (markId: string, action: 'accept' | 'reject' | 'modify', modifiedText?: string) => void;
  onAdvancePhase: () => void;
  onGenerateEdits: () => void;
  onApplyEdits: () => void;
}

type FilterStatus = 'all' | 'pending' | 'accepted' | 'rejected' | 'modified';
type FilterAuthor = 'all' | 'ai' | 'human';

// ============================================
// 상수
// ============================================

const PHASE_ICONS: Record<EditPhase, React.ReactNode> = {
  ai_draft: <Sparkles className="h-4 w-4" />,
  structural_edit: <BarChart3 className="h-4 w-4" />,
  line_edit: <Pencil className="h-4 w-4" />,
  copy_edit: <FileText className="h-4 w-4" />,
  proofread: <Eye className="h-4 w-4" />,
  human_review: <MessageSquare className="h-4 w-4" />,
  final_approval: <CheckCircle2 className="h-4 w-4" />,
};

const STATUS_COLORS: Record<EditMark['status'], string> = {
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  accepted: 'bg-green-500/20 text-green-400 border-green-500/30',
  rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
  modified: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
};

const STATUS_LABELS: Record<EditMark['status'], string> = {
  pending: '검토 대기',
  accepted: '승인됨',
  rejected: '거절됨',
  modified: '수정됨',
};

const TYPE_LABELS: Record<EditMark['type'], string> = {
  correction: '교정',
  suggestion: '제안',
  comment: '코멘트',
  deletion: '삭제',
  insertion: '삽입',
  rewrite: '재작성',
};

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

const CATEGORY_COLORS: Record<EditCategory, string> = {
  spelling: 'bg-red-500/20 text-red-300',
  grammar: 'bg-orange-500/20 text-orange-300',
  style: 'bg-purple-500/20 text-purple-300',
  consistency: 'bg-yellow-500/20 text-yellow-300',
  translation: 'bg-pink-500/20 text-pink-300',
  cliche: 'bg-indigo-500/20 text-indigo-300',
  pacing: 'bg-cyan-500/20 text-cyan-300',
  dialogue: 'bg-teal-500/20 text-teal-300',
  description: 'bg-emerald-500/20 text-emerald-300',
  plot: 'bg-blue-500/20 text-blue-300',
  character: 'bg-violet-500/20 text-violet-300',
  other: 'bg-gray-500/20 text-gray-300',
};

// ============================================
// 편집 진행 상태 바 컴포넌트
// ============================================

function PhaseProgressBar({ session }: { session: EditSession }) {
  const phases = EditorWorkflow.getAllPhases();
  const currentIndex = phases.findIndex((p) => p.phase === session.currentPhase);
  const progress = EditorWorkflow.getProgress(session);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">편집 진행 상황</CardTitle>
          <Badge variant="outline" className="text-xs">
            {progress.percentage}% 완료
          </Badge>
        </div>
        <CardDescription>
          현재: {progress.currentPhase}
          {progress.remainingPhases.length > 0 && (
            <span className="ml-2 text-muted-foreground">
              (남은 단계: {progress.remainingPhases.join(' > ')})
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* 프로그레스 바 */}
        <Progress value={progress.percentage} className="mb-4 h-2" />

        {/* 단계 시각화 */}
        <div className="flex items-center justify-between gap-1">
          <TooltipProvider>
            {phases.map((phase, index) => {
              const isCompleted = index < currentIndex;
              const isCurrent = index === currentIndex;
              const isFuture = index > currentIndex;

              const phaseRecord = session.phases.find((p) => p.phase === phase.phase);

              return (
                <Tooltip key={phase.phase}>
                  <TooltipTrigger asChild>
                    <div className="flex flex-1 flex-col items-center gap-1">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors ${
                          isCompleted
                            ? 'border-green-500 bg-green-500/20 text-green-400'
                            : isCurrent
                              ? 'border-primary bg-primary/20 text-primary'
                              : 'border-muted bg-muted/20 text-muted-foreground'
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          PHASE_ICONS[phase.phase]
                        )}
                      </div>
                      <span
                        className={`text-[10px] text-center leading-tight ${
                          isCurrent ? 'font-semibold text-foreground' : isFuture ? 'text-muted-foreground' : 'text-green-400'
                        }`}
                      >
                        {phase.label}
                      </span>
                      {index < phases.length - 1 && (
                        <div className="absolute" />
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-xs">
                      <p className="font-semibold">{phase.label}</p>
                      {phaseRecord && (
                        <>
                          <p>마크 생성: {phaseRecord.marksCreated}개</p>
                          <p>마크 해결: {phaseRecord.marksResolved}개</p>
                          <p>편집자: {phaseRecord.editorType === 'ai' ? 'AI' : '인간'}</p>
                          {phaseRecord.completedAt && (
                            <p>완료: {new Date(phaseRecord.completedAt).toLocaleDateString('ko-KR')}</p>
                          )}
                        </>
                      )}
                      {!phaseRecord && <p className="text-muted-foreground">아직 시작되지 않음</p>}
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </TooltipProvider>
        </div>

        {/* 예상 완료 시간 */}
        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>예상 완료: {progress.estimatedCompletion}</span>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// 원고 통계 카드 컴포넌트
// ============================================

function ManuscriptStatsCard({ info }: { info: ManuscriptInfo }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <BookOpen className="h-5 w-5" />
          원고 통계
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">총 글자수</p>
            <p className="text-2xl font-bold">{info.totalChars.toLocaleString()}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">원고지 매수 (200자)</p>
            <p className="text-2xl font-bold">{info.manuscriptPages.toLocaleString()}<span className="text-sm font-normal text-muted-foreground">매</span></p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">예상 책 페이지</p>
            <p className="text-2xl font-bold">{info.estimatedBookPages.toLocaleString()}<span className="text-sm font-normal text-muted-foreground">쪽</span></p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">분류</p>
            <Badge variant="secondary" className="text-sm">
              {info.publishingCategory}
            </Badge>
          </div>
        </div>
        <div className="mt-4 rounded-lg bg-muted/50 p-3">
          <p className="text-xs text-muted-foreground">
            예상 인쇄 비용: {info.estimatedPrintCost}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// 편집 마크 카드 컴포넌트
// ============================================

function EditMarkCard({
  mark,
  onAction,
}: {
  mark: EditMark;
  onAction: (markId: string, action: 'accept' | 'reject' | 'modify', modifiedText?: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className={`border-l-4 ${
      mark.status === 'pending' ? 'border-l-yellow-500' :
      mark.status === 'accepted' ? 'border-l-green-500' :
      mark.status === 'rejected' ? 'border-l-red-500' :
      'border-l-blue-500'
    }`}>
      <CardContent className="p-4">
        {/* 헤더 */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={CATEGORY_COLORS[mark.category]}>
              {CATEGORY_LABELS[mark.category]}
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              {TYPE_LABELS[mark.type]}
            </Badge>
            <Badge className={STATUS_COLORS[mark.status]}>
              {STATUS_LABELS[mark.status]}
            </Badge>
            <span className="text-[10px] text-muted-foreground">
              {mark.author === 'ai' ? 'AI' : '편집자'}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <ChevronRight className={`h-3 w-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
          </Button>
        </div>

        {/* 원문 */}
        <div className="mt-2">
          <p className="text-xs text-muted-foreground">원문:</p>
          <p className="mt-1 rounded bg-muted/50 p-2 text-sm leading-relaxed">
            <span className="text-red-400 line-through">{mark.originalText}</span>
          </p>
        </div>

        {/* 수정안 (있을 경우) */}
        {mark.suggestedText && (
          <div className="mt-2">
            <p className="text-xs text-muted-foreground">수정안:</p>
            <p className="mt-1 rounded bg-green-500/10 p-2 text-sm leading-relaxed text-green-300">
              {mark.suggestedText}
            </p>
          </div>
        )}

        {/* 코멘트 */}
        {mark.comment && (
          <div className="mt-2">
            <p className="text-xs text-muted-foreground">코멘트:</p>
            <p className="mt-1 text-sm text-foreground/80">{mark.comment}</p>
          </div>
        )}

        {/* 확장 영역 - 위치 정보 등 */}
        {isExpanded && (
          <div className="mt-3 space-y-1 border-t border-border/50 pt-3 text-xs text-muted-foreground">
            <p>위치: {mark.startOffset} ~ {mark.endOffset} (길이: {mark.endOffset - mark.startOffset}자)</p>
            <p>생성: {new Date(mark.createdAt).toLocaleString('ko-KR')}</p>
            {mark.resolvedAt && (
              <p>해결: {new Date(mark.resolvedAt).toLocaleString('ko-KR')} ({mark.resolvedBy === 'ai' ? 'AI' : '편집자'})</p>
            )}
          </div>
        )}

        {/* 액션 버튼 */}
        {mark.status === 'pending' && (
          <div className="mt-3 flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-7 border-green-500/30 text-green-400 hover:bg-green-500/20"
              onClick={() => onAction(mark.id, 'accept')}
            >
              <CheckCircle2 className="mr-1 h-3 w-3" />
              승인
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 border-red-500/30 text-red-400 hover:bg-red-500/20"
              onClick={() => onAction(mark.id, 'reject')}
            >
              <XCircle className="mr-1 h-3 w-3" />
              거절
            </Button>
            {mark.suggestedText && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 border-blue-500/30 text-blue-400 hover:bg-blue-500/20"
                onClick={() => onAction(mark.id, 'modify')}
              >
                <Pencil className="mr-1 h-3 w-3" />
                수정
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================
// 편집 요약 통계 컴포넌트
// ============================================

function EditSummary({ marks }: { marks: EditMark[] }) {
  const stats = useMemo(() => {
    const byCategory: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    const byType: Record<string, number> = {};

    for (const mark of marks) {
      byCategory[mark.category] = (byCategory[mark.category] || 0) + 1;
      byStatus[mark.status] = (byStatus[mark.status] || 0) + 1;
      byType[mark.type] = (byType[mark.type] || 0) + 1;
    }

    return { byCategory, byStatus, byType };
  }, [marks]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <BarChart3 className="h-5 w-5" />
          편집 요약
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* 상태별 */}
          <div>
            <p className="mb-2 text-xs font-semibold text-muted-foreground">상태별</p>
            <div className="space-y-1">
              {Object.entries(stats.byStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between text-sm">
                  <Badge className={STATUS_COLORS[status as EditMark['status']]}>
                    {STATUS_LABELS[status as EditMark['status']]}
                  </Badge>
                  <span className="font-mono">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 카테고리별 */}
          <div>
            <p className="mb-2 text-xs font-semibold text-muted-foreground">카테고리별</p>
            <div className="space-y-1">
              {Object.entries(stats.byCategory)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([category, count]) => (
                  <div key={category} className="flex items-center justify-between text-sm">
                    <Badge className={CATEGORY_COLORS[category as EditCategory]}>
                      {CATEGORY_LABELS[category as EditCategory]}
                    </Badge>
                    <span className="font-mono">{count}</span>
                  </div>
                ))}
            </div>
          </div>

          {/* 유형별 */}
          <div>
            <p className="mb-2 text-xs font-semibold text-muted-foreground">유형별</p>
            <div className="space-y-1">
              {Object.entries(stats.byType)
                .sort(([, a], [, b]) => b - a)
                .map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{TYPE_LABELS[type as EditMark['type']]}</span>
                    <span className="font-mono">{count}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// 메인 대시보드 컴포넌트
// ============================================

export function EditorDashboard({
  session,
  marks,
  manuscriptInfo,
  content,
  onMarkAction,
  onAdvancePhase,
  onGenerateEdits,
  onApplyEdits,
}: EditorDashboardProps) {
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterAuthor, setFilterAuthor] = useState<FilterAuthor>('all');

  // 필터링된 마크 목록
  const filteredMarks = useMemo(() => {
    return marks.filter((mark) => {
      if (filterStatus !== 'all' && mark.status !== filterStatus) return false;
      if (filterCategory !== 'all' && mark.category !== filterCategory) return false;
      if (filterAuthor !== 'all' && mark.author !== filterAuthor) return false;
      return true;
    });
  }, [marks, filterStatus, filterCategory, filterAuthor]);

  // 대기 중인 마크 수
  const pendingCount = useMemo(
    () => marks.filter((m) => m.status === 'pending').length,
    [marks]
  );

  // 승인된 마크 수
  const acceptedCount = useMemo(
    () => marks.filter((m) => m.status === 'accepted').length,
    [marks]
  );

  // 사용 중인 카테고리 목록
  const usedCategories = useMemo(() => {
    const cats = new Set(marks.map((m) => m.category));
    return Array.from(cats);
  }, [marks]);

  const handleResetFilters = useCallback(() => {
    setFilterStatus('all');
    setFilterCategory('all');
    setFilterAuthor('all');
  }, []);

  return (
    <div className="space-y-6">
      {/* 편집 진행 상태 바 */}
      <PhaseProgressBar session={session} />

      {/* 원고 통계 + 편집 요약 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ManuscriptStatsCard info={manuscriptInfo} />
        <EditSummary marks={marks} />
      </div>

      {/* 액션 버튼 영역 */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 p-4">
          <Button onClick={onGenerateEdits} className="gap-2">
            <Sparkles className="h-4 w-4" />
            AI 편집 마크 생성
          </Button>
          <Button
            onClick={onApplyEdits}
            variant="secondary"
            className="gap-2"
            disabled={acceptedCount === 0}
          >
            <CheckCircle2 className="h-4 w-4" />
            승인된 편집 적용 ({acceptedCount}개)
          </Button>
          <Button
            onClick={onAdvancePhase}
            variant="outline"
            className="gap-2"
            disabled={pendingCount > 0}
          >
            <ChevronRight className="h-4 w-4" />
            다음 단계로 진행
          </Button>
          {pendingCount > 0 && (
            <div className="flex items-center gap-1 text-xs text-yellow-400">
              <AlertTriangle className="h-3 w-3" />
              검토 대기 중인 마크가 {pendingCount}개 있습니다
            </div>
          )}
        </CardContent>
      </Card>

      {/* 편집 마크 목록 */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Pencil className="h-5 w-5" />
              편집 마크 ({filteredMarks.length}/{marks.length})
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="h-7 gap-1 text-xs"
            >
              <RotateCcw className="h-3 w-3" />
              필터 초기화
            </Button>
          </div>

          {/* 필터 영역 */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Filter className="h-3 w-3" />
              필터:
            </div>

            <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as FilterStatus)}>
              <SelectTrigger className="h-7 w-[120px] text-xs">
                <SelectValue placeholder="상태" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 상태</SelectItem>
                <SelectItem value="pending">검토 대기</SelectItem>
                <SelectItem value="accepted">승인됨</SelectItem>
                <SelectItem value="rejected">거절됨</SelectItem>
                <SelectItem value="modified">수정됨</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="h-7 w-[120px] text-xs">
                <SelectValue placeholder="카테고리" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 카테고리</SelectItem>
                {usedCategories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {CATEGORY_LABELS[cat]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterAuthor} onValueChange={(v) => setFilterAuthor(v as FilterAuthor)}>
              <SelectTrigger className="h-7 w-[100px] text-xs">
                <SelectValue placeholder="작성자" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="ai">AI</SelectItem>
                <SelectItem value="human">편집자</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          {filteredMarks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <FileText className="mb-2 h-8 w-8" />
              <p className="text-sm">편집 마크가 없습니다</p>
              <p className="text-xs">AI 편집 마크 생성 버튼을 클릭하여 시작하세요</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="space-y-3 pr-4">
                {filteredMarks.map((mark) => (
                  <EditMarkCard
                    key={mark.id}
                    mark={mark}
                    onAction={onMarkAction}
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default EditorDashboard;
