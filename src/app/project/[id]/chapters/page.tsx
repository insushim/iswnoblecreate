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
  FileText,
  GripVertical,
  Sparkles,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { useSettingsStore } from '@/stores/settingsStore';
import { useVolumeStore } from '@/stores/volumeStore';
import { useCharacterStore } from '@/stores/characterStore';
import { useWorldStore } from '@/stores/worldStore';
import { usePlotStore } from '@/stores/plotStore';
import { generateJSON } from '@/lib/gemini';
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

  const { chapters, isLoading, fetchChapters, createChapter, deleteChapter, createScene } = useChapterStore();
  const { currentProject, updateProject } = useProjectStore();
  const { settings } = useSettingsStore();
  const { volumes, fetchVolumes } = useVolumeStore();
  const { characters, fetchCharacters } = useCharacterStore();
  const { worldSettings, fetchWorldSettings } = useWorldStore();
  const { plotStructure, foreshadowings, conflicts, fetchPlotStructure, fetchForeshadowings, fetchConflicts } = usePlotStore();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
  const [aiGenerateDialogOpen, setAiGenerateDialogOpen] = useState(false);
  const [chapterToDelete, setChapterToDelete] = useState<string | null>(null);
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [newChapterPurpose, setNewChapterPurpose] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [chapterCount, setChapterCount] = useState(10);

  useEffect(() => {
    if (projectId) {
      fetchChapters(projectId);
      fetchVolumes(projectId);
      fetchCharacters(projectId);
      fetchWorldSettings(projectId);
      fetchPlotStructure(projectId);
      fetchForeshadowings(projectId);
      fetchConflicts(projectId);
    }
  }, [projectId, fetchChapters, fetchVolumes, fetchCharacters, fetchWorldSettings, fetchPlotStructure, fetchForeshadowings, fetchConflicts]);

  // 프로젝트의 권/씬 구조 필터링
  const projectVolumes = volumes.filter(v => v.projectId === projectId);
  const projectCharacters = characters.filter(c => c.projectId === projectId);
  const hasVolumeStructure = projectVolumes.length > 0 && projectVolumes.some(v => v.scenes.length > 0);

  const handleCreateChapter = async () => {
    if (!newChapterTitle.trim()) return;

    await createChapter(projectId, {
      title: newChapterTitle,
      purpose: newChapterPurpose,
    });

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

  const handleDeleteAllChapters = async () => {
    setIsDeletingAll(true);
    try {
      for (const chapter of chapters) {
        await deleteChapter(chapter.id);
      }
      if (currentProject) {
        await updateProject(projectId, {
          stats: {
            ...currentProject.stats,
            chaptersTotal: 0,
            chaptersCompleted: 0,
          },
        });
      }
    } catch (error) {
      console.error('전체 챕터 삭제 실패:', error);
    } finally {
      setIsDeletingAll(false);
      setDeleteAllDialogOpen(false);
    }
  };

  // 권/씬 구조 기반으로 챕터와 씬 자동 생성
  const handleGenerateFromVolumeStructure = async () => {
    if (!currentProject) return;

    setIsGenerating(true);
    try {
      let totalChapters = 0;

      // 각 권/씬 구조를 챕터와 씬으로 변환
      for (const volume of projectVolumes.sort((a, b) => a.volumeNumber - b.volumeNumber)) {
        // 권을 챕터로 생성
        const chapter = await createChapter(projectId, {
          title: `${volume.volumeNumber}권: ${volume.title}`,
          purpose: volume.coreEvent || `${volume.startPoint}에서 ${volume.endPoint}까지의 이야기`,
        });

        if (chapter) {
          // 해당 권의 씬들을 챕터의 씬으로 추가
          for (const volumeScene of volume.scenes.sort((a, b) => a.sceneNumber - b.sceneNumber)) {
            // 씬 참가자 이름 가져오기
            const participantNames = volumeScene.participants
              .map(pId => {
                const char = projectCharacters.find(c => c.id === pId || c.name === pId);
                return char?.name || pId;
              })
              .filter(Boolean);

            await createScene(chapter.id, {
              title: volumeScene.title,
              content: '',
              order: volumeScene.sceneNumber,
              type: 'exposition',
              summary: volumeScene.endCondition || '',
              goal: `필수 포함: ${volumeScene.mustInclude.join(', ')}`,
              location: volumeScene.location || '',
              timeOfDay: volumeScene.timeframe || '',
              pov: volumeScene.pov || '',
              povType: volumeScene.povType || 'third-limited',
              participants: participantNames,
              status: 'outline',
              wordCount: 0,
            });
          }
          totalChapters++;
        }
      }

      await updateProject(projectId, {
        stats: {
          ...currentProject.stats,
          chaptersTotal: totalChapters,
        },
      });

      // 데이터 새로고침
      await fetchChapters(projectId);
      setAiGenerateDialogOpen(false);
      alert(`${totalChapters}개의 챕터와 씬이 생성되었습니다!`);
    } catch (error) {
      console.error('권/씬 구조 기반 챕터 생성 실패:', error);
      alert('챕터 생성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAIGenerateChapters = async () => {
    if (!settings?.geminiApiKey || !currentProject) {
      alert('API 키를 설정해주세요.');
      return;
    }

    setIsGenerating(true);
    try {
      // 캐릭터 정보 요약
      const characterSummary = projectCharacters.slice(0, 10).map(c =>
        `- ${c.name} (${c.role}): ${c.personality?.slice(0, 50) || ''}`
      ).join('\n');

      // 세계관 정보 요약
      const worldSettingsArray = worldSettings ? Object.values(worldSettings).flat() : [];
      const worldSummary = worldSettingsArray.slice(0, 5).map(w =>
        `- ${w.title}: ${w.description?.slice(0, 50) || ''}`
      ).join('\n');

      // 플롯 포인트 요약
      const plotPoints = plotStructure?.plotPoints || [];
      const plotSummary = plotPoints.slice(0, 10).map((p, i) =>
        `${i + 1}. ${p.title}: ${p.description?.slice(0, 50) || ''}`
      ).join('\n');

      const prompt = `당신은 소설 기획 전문가입니다. 다음 작품 정보를 바탕으로 ${chapterCount}개의 챕터 구조를 생성해주세요.

## 작품 정보
- 제목: ${currentProject.title}
- 장르: ${currentProject.genre.join(', ')}
- 컨셉: ${currentProject.concept}
- 로그라인: ${currentProject.logline || '없음'}
- 시놉시스: ${currentProject.synopsis || '없음'}

## 등장인물
${characterSummary || '등장인물 정보 없음'}

## 세계관
${worldSummary || '세계관 정보 없음'}

## 플롯 포인트
${plotSummary || '플롯 포인트 없음'}

## 요청사항
1. 각 챕터는 이야기의 전개에 맞게 논리적으로 구성
2. 3막 구조 (발단-전개-결말)를 따르되 자연스럽게
3. 각 챕터의 목적이 명확해야 함
4. 전체 스토리가 유기적으로 연결되어야 함
5. **각 챕터에 2-4개의 씬을 포함**

## 응답 형식
JSON 배열로 응답하세요. 각 챕터 객체는:
- number: 챕터 번호 (숫자)
- title: 챕터 제목 (문자열)
- purpose: 챕터 목적 (문자열)
- scenes: 씬 배열, 각 씬은 { title: 제목, location: 장소, characters: 등장인물배열, summary: 요약 }

${chapterCount}개의 챕터를 생성하세요.`;

      interface GeneratedScene {
        title: string;
        location: string;
        characters: string[];
        summary: string;
      }

      interface GeneratedChapter {
        number: number;
        title: string;
        purpose: string;
        scenes: GeneratedScene[];
      }

      const result = await generateJSON<GeneratedChapter[]>(
        settings.geminiApiKey,
        prompt,
        { temperature: 0.8, model: settings.planningModel || 'gemini-3-flash-preview' }
      );

      for (const chapterData of result) {
        const chapter = await createChapter(projectId, {
          title: chapterData.title,
          purpose: chapterData.purpose,
        });

        if (chapter && chapterData.scenes && chapterData.scenes.length > 0) {
          for (let i = 0; i < chapterData.scenes.length; i++) {
            const sceneData = chapterData.scenes[i];
            await createScene(chapter.id, {
              title: sceneData.title || `씬 ${i + 1}`,
              content: '',
              order: i + 1,
              type: 'exposition',
              summary: sceneData.summary || '',
              goal: '',
              location: sceneData.location || '',
              participants: sceneData.characters || [],
              status: 'outline',
              wordCount: 0,
            });
          }
        }
      }

      await updateProject(projectId, {
        stats: {
          ...currentProject.stats,
          chaptersTotal: result.length,
        },
      });

      await fetchChapters(projectId);
      setAiGenerateDialogOpen(false);
    } catch (error) {
      console.error('AI 챕터 생성 실패:', error);
      alert('챕터 생성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsGenerating(false);
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
        <div className="flex gap-2">
          <Dialog open={aiGenerateDialogOpen} onOpenChange={setAiGenerateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Sparkles className="h-4 w-4" />
                AI 챕터 생성
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>AI 챕터 구조 생성</DialogTitle>
                <DialogDescription>
                  작품 정보를 바탕으로 AI가 챕터 구조를 자동 생성합니다
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {/* 권/씬 구조가 있으면 우선 표시 */}
                {hasVolumeStructure && (
                  <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg space-y-3">
                    <div className="flex items-center gap-2 text-primary">
                      <Sparkles className="h-5 w-5" />
                      <span className="font-semibold">권/씬 구조 발견!</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      기획 단계에서 생성한 {projectVolumes.length}개의 권과{' '}
                      {projectVolumes.reduce((sum, v) => sum + v.scenes.length, 0)}개의 씬이 있습니다.
                      이 구조를 기반으로 챕터와 씬을 자동 생성할 수 있습니다.
                    </p>
                    <Button
                      onClick={handleGenerateFromVolumeStructure}
                      disabled={isGenerating}
                      className="w-full gap-2"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          생성 중...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          권/씬 구조 기반 생성 (권장)
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {/* 권/씬 구조 없을 때 안내 */}
                {!hasVolumeStructure && (
                  <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg space-y-2">
                    <div className="flex items-center gap-2 text-yellow-600">
                      <AlertTriangle className="h-5 w-5" />
                      <span className="font-semibold">권/씬 구조가 없습니다</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      기획 &gt; 권/씬 구조 관리에서 먼저 권과 씬 구조를 생성하면,
                      더 정확한 챕터 생성이 가능합니다.
                    </p>
                  </div>
                )}

                <div className="border-t pt-4">
                  <p className="text-sm font-medium mb-3">또는 AI가 새로 생성:</p>
                  <div className="space-y-2">
                    <Label htmlFor="chapterCount">생성할 챕터 수</Label>
                    <Input
                      id="chapterCount"
                      type="number"
                      value={chapterCount}
                      onChange={(e) => setChapterCount(Number(e.target.value))}
                      min={1}
                      max={100}
                    />
                    <p className="text-xs text-muted-foreground">
                      작품 분량에 맞게 챕터 수를 설정하세요 (1~100)
                    </p>
                  </div>
                </div>

                {!settings?.geminiApiKey && (
                  <div className="p-3 bg-yellow-500/10 rounded-lg text-sm text-yellow-600">
                    API 키가 설정되지 않았습니다. 설정에서 Gemini API 키를 입력해주세요.
                  </div>
                )}
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setAiGenerateDialogOpen(false)}>
                    취소
                  </Button>
                  <Button
                    onClick={handleAIGenerateChapters}
                    disabled={isGenerating || !settings?.geminiApiKey}
                    variant={hasVolumeStructure ? "outline" : "default"}
                    className="gap-2"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        생성 중...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        AI로 새로 생성
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {chapters.length > 0 && (
            <Button
              variant="outline"
              className="gap-2 text-destructive hover:text-destructive"
              onClick={() => setDeleteAllDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4" />
              전체 삭제
            </Button>
          )}

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
      </div>

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

      {chapters.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            {/* 권/씬 구조가 있으면 동기화 버튼 강조 표시 */}
            {hasVolumeStructure ? (
              <div className="text-center space-y-6">
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">기획된 권/씬 구조가 있습니다!</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    {projectVolumes.length}개의 권과 {projectVolumes.reduce((sum, v) => sum + v.scenes.length, 0)}개의 씬이 준비되어 있습니다.
                    아래 버튼을 클릭하여 집필 페이지로 가져오세요.
                  </p>
                </div>
                <Button
                  size="lg"
                  onClick={handleGenerateFromVolumeStructure}
                  disabled={isGenerating}
                  className="gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      챕터/씬 생성 중...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5" />
                      권/씬 구조 기반으로 챕터 생성
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground">
                  또는 <button className="underline" onClick={() => setAiGenerateDialogOpen(true)}>AI로 새로 생성</button>하거나{' '}
                  <button className="underline" onClick={() => setCreateDialogOpen(true)}>수동으로 추가</button>할 수 있습니다.
                </p>
              </div>
            ) : (
              <EmptyState
                icon={FileText}
                title="아직 챕터가 없습니다"
                description="기획 > 권/씬 구조 관리에서 먼저 구조를 만들거나, AI 챕터 생성을 사용하세요"
                action={{
                  label: 'AI로 챕터 생성',
                  onClick: () => setAiGenerateDialogOpen(true),
                }}
              />
            )}
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

      <AlertDialog open={deleteAllDialogOpen} onOpenChange={setDeleteAllDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              모든 챕터를 삭제하시겠습니까?
            </AlertDialogTitle>
            <AlertDialogDescription>
              이 작업은 되돌릴 수 없습니다. {chapters.length}개의 챕터와 포함된 모든 씬, 내용이 영구적으로 삭제됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingAll}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAllChapters}
              disabled={isDeletingAll}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletingAll ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  삭제 중...
                </>
              ) : (
                '전체 삭제'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
