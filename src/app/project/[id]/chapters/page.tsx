'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Plus,
  Edit3,
  MoreVertical,
  Trash2,
  Eye,
  CheckCircle,
  Clock,
  FileText,
  GripVertical,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { EmptyState, LoadingSpinner } from '@/components/common';
import { useChapterStore } from '@/stores/chapterStore';
import { useProjectStore } from '@/stores/projectStore';
import { Chapter } from '@/types';

const statusLabels: Record<Chapter['status'], string> = {
  outline: '개요',
  draft: '초고',
  revision: '수정 중',
  polished: '다듬기',
  approved: '완료',
};

const statusColors: Record<Chapter['status'], string> = {
  outline: 'bg-gray-500/10 text-gray-500',
  draft: 'bg-blue-500/10 text-blue-500',
  revision: 'bg-yellow-500/10 text-yellow-500',
  polished: 'bg-purple-500/10 text-purple-500',
  approved: 'bg-green-500/10 text-green-500',
};

export default function ChaptersPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const { chapters, isLoading, fetchChapters, createChapter, deleteChapter } = useChapterStore();
  const { currentProject, updateProject } = useProjectStore();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [chapterToDelete, setChapterToDelete] = useState<string | null>(null);
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [newChapterPurpose, setNewChapterPurpose] = useState('');

  useEffect(() => {
    if (projectId) {
      fetchChapters(projectId);
    }
  }, [projectId, fetchChapters]);

  const handleCreateChapter = async () => {
    if (!newChapterTitle.trim()) return;

    await createChapter(projectId, {
      title: newChapterTitle,
      purpose: newChapterPurpose,
    });

    // 프로젝트 통계 업데이트
    if (currentProject) {
      await updateProject(projectId, {
        stats: {
          ...currentProject.stats,
          chaptersTotal: chapters.length + 1,
        },
      });
    }

    setNewChapterTitle('');
    setNewChapterPurpose('');
    setCreateDialogOpen(false);
  };

  const handleDeleteChapter = async () => {
    if (chapterToDelete) {
      await deleteChapter(chapterToDelete);
      setDeleteDialogOpen(false);
      setChapterToDelete(null);
    }
  };

  const totalWords = chapters.reduce((sum, c) => sum + c.wordCount, 0);
  const completedChapters = chapters.filter(c => c.status === 'approved').length;
  const progress = chapters.length > 0 ? (completedChapters / chapters.length) * 100 : 0;

  if (isLoading && chapters.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
        <LoadingSpinner size="lg" text="챕터를 불러오는 중..." />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">집필</h1>
          <p className="text-muted-foreground">챕터별로 소설을 집필하세요</p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              새 챕터
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>새 챕터 만들기</DialogTitle>
              <DialogDescription>
                챕터 {chapters.length + 1}을 생성합니다
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">제목</Label>
                <Input
                  id="title"
                  value={newChapterTitle}
                  onChange={(e) => setNewChapterTitle(e.target.value)}
                  placeholder={`제 ${chapters.length + 1}장`}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="purpose">챕터 목적</Label>
                <Textarea
                  id="purpose"
                  value={newChapterPurpose}
                  onChange={(e) => setNewChapterPurpose(e.target.value)}
                  placeholder="이 챕터에서 달성하고자 하는 것"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  취소
                </Button>
                <Button onClick={handleCreateChapter}>
                  생성
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* 통계 카드 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">총 챕터</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{chapters.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">완료</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedChapters}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">총 글자 수</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalWords.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">진행률</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(progress)}%</div>
            <Progress value={progress} className="h-1.5 mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* 챕터 목록 */}
      {chapters.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={FileText}
              title="아직 챕터가 없습니다"
              description="첫 번째 챕터를 만들어 집필을 시작하세요"
              action={{
                label: '첫 챕터 만들기',
                onClick: () => setCreateDialogOpen(true),
              }}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {chapters.map((chapter, index) => (
            <motion.div
              key={chapter.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <Card className="group hover:shadow-md transition-all">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="hidden md:flex items-center text-muted-foreground cursor-grab">
                      <GripVertical className="h-5 w-5" />
                    </div>

                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-lg font-bold text-primary">{chapter.number}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold truncate">{chapter.title}</h3>
                        <Badge variant="outline" className={statusColors[chapter.status]}>
                          {statusLabels[chapter.status]}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {chapter.purpose || '목적이 설정되지 않았습니다'}
                      </p>
                    </div>

                    <div className="hidden md:flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        {chapter.wordCount.toLocaleString()}자
                      </span>
                      <span className="flex items-center gap-1">
                        <Edit3 className="h-4 w-4" />
                        {chapter.scenes?.length || 0} 씬
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/project/${projectId}/chapters/${chapter.id}`)}
                      >
                        <Edit3 className="h-4 w-4 mr-1" />
                        집필
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/project/${projectId}/chapters/${chapter.id}`)}>
                            <Edit3 className="h-4 w-4 mr-2" />
                            편집
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/project/${projectId}/chapters/${chapter.id}/outline`)}>
                            <Eye className="h-4 w-4 mr-2" />
                            개요 보기
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              setChapterToDelete(chapter.id);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            삭제
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>챕터를 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              이 작업은 되돌릴 수 없습니다. 챕터와 포함된 모든 씬이 삭제됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteChapter}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
