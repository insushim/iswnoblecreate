'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { BookOpen, Plus, Folder, Trash2, Edit, MoreVertical, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { EmptyState } from '@/components/common';
import { db } from '@/lib/db';
import { Series } from '@/types';
import { useProjectStore } from '@/stores/projectStore';

export default function SeriesPage() {
  const router = useRouter();
  const { projects, fetchProjects } = useProjectStore();
  const [series, setSeries] = useState<Series[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [newSeriesTitle, setNewSeriesTitle] = useState('');
  const [newSeriesDescription, setNewSeriesDescription] = useState('');
  const [editingSeries, setEditingSeries] = useState<Series | null>(null);

  useEffect(() => {
    loadSeries();
    fetchProjects();
  }, []);

  const loadSeries = async () => {
    setIsLoading(true);
    try {
      const allSeries = await db.series.toArray();
      setSeries(allSeries);
    } catch (error) {
      console.error('시리즈 로드 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSeries = async () => {
    if (!newSeriesTitle.trim()) return;

    setIsCreating(true);
    try {
      const newSeries: Series = {
        id: crypto.randomUUID(),
        title: newSeriesTitle.trim(),
        description: newSeriesDescription.trim(),
        genre: [],
        targetBooks: 1,
        status: 'ongoing',
        projects: [],
        timeline: { events: [] },
        bible: {
          overview: '',
          worldRules: [],
          recurringElements: [],
          characterNotes: {},
          plotThreads: [],
          toneGuidelines: '',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.series.add(newSeries);
      setSeries([...series, newSeries]);
      setNewSeriesTitle('');
      setNewSeriesDescription('');
      setShowDialog(false);
    } catch (error) {
      console.error('시리즈 생성 실패:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateSeries = async () => {
    if (!editingSeries || !newSeriesTitle.trim()) return;

    try {
      await db.series.update(editingSeries.id, {
        title: newSeriesTitle.trim(),
        description: newSeriesDescription.trim(),
        updatedAt: new Date(),
      });
      setSeries(series.map(s =>
        s.id === editingSeries.id
          ? { ...s, title: newSeriesTitle.trim(), description: newSeriesDescription.trim() }
          : s
      ));
      setEditingSeries(null);
      setNewSeriesTitle('');
      setNewSeriesDescription('');
      setShowDialog(false);
    } catch (error) {
      console.error('시리즈 수정 실패:', error);
    }
  };

  const handleDeleteSeries = async (seriesId: string) => {
    if (!confirm('정말 이 시리즈를 삭제하시겠습니까?')) return;

    try {
      await db.series.delete(seriesId);
      setSeries(series.filter(s => s.id !== seriesId));
    } catch (error) {
      console.error('시리즈 삭제 실패:', error);
    }
  };

  const openEditDialog = (s: Series) => {
    setEditingSeries(s);
    setNewSeriesTitle(s.title);
    setNewSeriesDescription(s.description || '');
    setShowDialog(true);
  };

  const openCreateDialog = () => {
    setEditingSeries(null);
    setNewSeriesTitle('');
    setNewSeriesDescription('');
    setShowDialog(true);
  };

  const getProjectCount = (seriesId: string) => {
    return projects.filter(p => p.seriesId === seriesId).length;
  };

  const getSeriesProjects = (seriesId: string) => {
    return projects.filter(p => p.seriesId === seriesId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">시리즈 관리</h1>
          <p className="text-muted-foreground">여러 작품을 시리즈로 묶어 관리하세요</p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={openCreateDialog}>
              <Plus className="h-4 w-4" />
              새 시리즈
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingSeries ? '시리즈 수정' : '새 시리즈 만들기'}</DialogTitle>
              <DialogDescription>
                시리즈에 여러 작품을 묶어 세계관과 캐릭터를 공유할 수 있습니다.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">시리즈 제목</Label>
                <Input
                  id="title"
                  value={newSeriesTitle}
                  onChange={(e) => setNewSeriesTitle(e.target.value)}
                  placeholder="예: 드래곤 시리즈"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">설명 (선택)</Label>
                <Textarea
                  id="description"
                  value={newSeriesDescription}
                  onChange={(e) => setNewSeriesDescription(e.target.value)}
                  placeholder="시리즈에 대한 간단한 설명"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                취소
              </Button>
              <Button
                onClick={editingSeries ? handleUpdateSeries : handleCreateSeries}
                disabled={isCreating || !newSeriesTitle.trim()}
              >
                {isCreating ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {editingSeries ? '수정' : '만들기'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {series.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={Folder}
              title="시리즈가 없습니다"
              description="여러 작품을 시리즈로 묶어 관리해보세요. 시리즈 내 작품들은 세계관과 캐릭터를 공유할 수 있습니다."
              action={{
                label: '첫 시리즈 만들기',
                onClick: openCreateDialog,
              }}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {series.map((s, index) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Folder className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg">{s.title}</CardTitle>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(s)}>
                          <Edit className="h-4 w-4 mr-2" />
                          수정
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDeleteSeries(s.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          삭제
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {s.description || '설명 없음'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">
                      {getProjectCount(s.id)}개 작품
                    </Badge>
                    <Badge variant={s.status === 'ongoing' ? 'default' : 'outline'}>
                      {s.status === 'ongoing' ? '연재중' : s.status === 'completed' ? '완결' : '휴재'}
                    </Badge>
                  </div>
                  {getProjectCount(s.id) > 0 && (
                    <div className="mt-3 space-y-1">
                      {getSeriesProjects(s.id).slice(0, 3).map(p => (
                        <div
                          key={p.id}
                          className="text-sm text-muted-foreground cursor-pointer hover:text-foreground"
                          onClick={() => router.push(`/project/${p.id}`)}
                        >
                          • {p.title}
                        </div>
                      ))}
                      {getProjectCount(s.id) > 3 && (
                        <div className="text-sm text-muted-foreground">
                          외 {getProjectCount(s.id) - 3}개...
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <Card className="bg-muted/50">
        <CardContent className="py-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-primary/10">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">시리즈 활용 팁</h3>
              <p className="text-sm text-muted-foreground">
                프로젝트 설정에서 시리즈를 지정하면 같은 시리즈의 작품들끼리 세계관과 캐릭터를 공유할 수 있습니다.
                시리즈로 묶인 작품은 일관된 세계관을 유지하기 쉽습니다.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
