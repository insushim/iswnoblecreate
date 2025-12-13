'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Plus,
  BookOpen,
  Clock,
  TrendingUp,
  Target,
  MoreVertical,
  Trash2,
  Copy,
  Edit,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import { LoadingSpinner } from '@/components/common';
import { EmptyState } from '@/components/common';
import { useProjectStore } from '@/stores/projectStore';
import { Project } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

const statusLabels: Record<Project['status'], string> = {
  idea: '아이디어',
  planning: '기획 중',
  writing: '집필 중',
  editing: '퇴고 중',
  completed: '완료',
};

const statusColors: Record<Project['status'], string> = {
  idea: 'bg-blue-500/10 text-blue-500',
  planning: 'bg-yellow-500/10 text-yellow-500',
  writing: 'bg-green-500/10 text-green-500',
  editing: 'bg-purple-500/10 text-purple-500',
  completed: 'bg-primary/10 text-primary',
};

export default function DashboardPage() {
  const router = useRouter();
  const { projects, isLoading, fetchProjects, deleteProject, duplicateProject } = useProjectStore();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleDelete = async () => {
    if (projectToDelete) {
      await deleteProject(projectToDelete);
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
    }
  };

  const handleDuplicate = async (id: string) => {
    const newProject = await duplicateProject(id);
    router.push(`/project/${newProject.id}`);
  };

  const totalWords = projects.reduce((sum, p) => sum + p.stats.totalWords, 0);
  const activeProjects = projects.filter(p => p.status === 'writing' || p.status === 'editing').length;
  const completedProjects = projects.filter(p => p.status === 'completed').length;

  const stats = [
    {
      title: '총 프로젝트',
      value: projects.length,
      icon: BookOpen,
      description: '생성된 프로젝트 수',
    },
    {
      title: '진행 중',
      value: activeProjects,
      icon: Edit,
      description: '집필/퇴고 중인 프로젝트',
    },
    {
      title: '총 글자 수',
      value: totalWords.toLocaleString(),
      icon: TrendingUp,
      description: '모든 프로젝트 합계',
    },
    {
      title: '완료',
      value: completedProjects,
      icon: Target,
      description: '완료된 프로젝트',
    },
  ];

  if (isLoading && projects.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
        <LoadingSpinner size="lg" text="프로젝트를 불러오는 중..." />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">대시보드</h1>
          <p className="text-muted-foreground mt-1">
            창작의 세계에 오신 것을 환영합니다
          </p>
        </div>
        <Link href="/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            새 프로젝트
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">내 프로젝트</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/templates">템플릿 둘러보기</Link>
          </Button>
        </div>

        {projects.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <EmptyState
                icon={Sparkles}
                title="아직 프로젝트가 없습니다"
                description="새로운 아이디어로 첫 번째 소설을 시작해보세요. AI가 당신의 창작을 도와드립니다."
                action={{
                  label: '첫 프로젝트 만들기',
                  onClick: () => router.push('/new'),
                }}
              />
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="group hover:shadow-lg transition-all duration-200 cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <Link href={`/project/${project.id}`} className="flex-1">
                        <CardTitle className="line-clamp-1 group-hover:text-primary transition-colors">
                          {project.title || '제목 없음'}
                        </CardTitle>
                        <CardDescription className="mt-1 line-clamp-2">
                          {project.logline || project.concept || '설명이 없습니다'}
                        </CardDescription>
                      </Link>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/project/${project.id}`)}>
                            <Edit className="h-4 w-4 mr-2" />
                            열기
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicate(project.id)}>
                            <Copy className="h-4 w-4 mr-2" />
                            복제
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              setProjectToDelete(project.id);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            삭제
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Link href={`/project/${project.id}`}>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className={statusColors[project.status]}>
                            {statusLabels[project.status]}
                          </Badge>
                          {project.genre.slice(0, 2).map((g) => (
                            <Badge key={g} variant="secondary" className="text-xs">
                              {g}
                            </Badge>
                          ))}
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">진행률</span>
                            <span className="font-medium">
                              {project.stats.chaptersTotal > 0
                                ? Math.round((project.stats.chaptersCompleted / project.stats.chaptersTotal) * 100)
                                : 0}%
                            </span>
                          </div>
                          <Progress
                            value={
                              project.stats.chaptersTotal > 0
                                ? (project.stats.chaptersCompleted / project.stats.chaptersTotal) * 100
                                : 0
                            }
                            className="h-1.5"
                          />
                        </div>

                        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
                          <span className="flex items-center gap-1">
                            <BookOpen className="h-3 w-3" />
                            {project.stats.totalWords.toLocaleString()}자
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(project.updatedAt), {
                              addSuffix: true,
                              locale: ko,
                            })}
                          </span>
                        </div>
                      </div>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>프로젝트를 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              이 작업은 되돌릴 수 없습니다. 프로젝트와 관련된 모든 데이터(캐릭터, 챕터, 설정 등)가 영구적으로 삭제됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
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
