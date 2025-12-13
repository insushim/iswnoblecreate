'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Users,
  Globe,
  GitBranch,
  Edit3,
  BarChart3,
  Clock,
  Target,
  ArrowRight,
  Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useProjectStore } from '@/stores/projectStore';
import { useCharacterStore } from '@/stores/characterStore';
import { useChapterStore } from '@/stores/chapterStore';
import { LoadingSpinner } from '@/components/common';
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

const quickActions = [
  { title: '기획', href: 'planning', icon: BookOpen, description: '시놉시스와 설정 작업' },
  { title: '세계관', href: 'world', icon: Globe, description: '세계관 구축하기' },
  { title: '캐릭터', href: 'characters', icon: Users, description: '캐릭터 설계하기' },
  { title: '플롯', href: 'plot', icon: GitBranch, description: '스토리 구조 설계' },
  { title: '집필', href: 'chapters', icon: Edit3, description: '소설 집필하기' },
  { title: '분석', href: 'analysis', icon: BarChart3, description: 'AI 피드백 받기' },
];

export default function ProjectOverviewPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { currentProject, isLoading } = useProjectStore();
  const { characters, fetchCharacters } = useCharacterStore();
  const { chapters, fetchChapters } = useChapterStore();

  useEffect(() => {
    if (projectId) {
      fetchCharacters(projectId);
      fetchChapters(projectId);
    }
  }, [projectId, fetchCharacters, fetchChapters]);

  if (isLoading || !currentProject) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const progress = currentProject.stats.chaptersTotal > 0
    ? (currentProject.stats.chaptersCompleted / currentProject.stats.chaptersTotal) * 100
    : 0;

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        {/* 프로젝트 헤더 */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                {currentProject.title || '제목 없음'}
              </h1>
              <Badge variant="outline">{statusLabels[currentProject.status]}</Badge>
            </div>
            {currentProject.logline && (
              <p className="text-lg text-muted-foreground max-w-2xl">
                {currentProject.logline}
              </p>
            )}
            <div className="flex items-center gap-2 flex-wrap">
              {currentProject.genre.map((g) => (
                <Badge key={g} variant="secondary">{g}</Badge>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <Link href={`/project/${projectId}/chapters`}>
              <Button className="gap-2">
                <Edit3 className="h-4 w-4" />
                집필 시작
              </Button>
            </Link>
            <Link href={`/project/${projectId}/settings`}>
              <Button variant="outline" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">총 글자 수</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {currentProject.stats.totalWords.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                목표: {currentProject.settings.targetTotalLength?.toLocaleString() || '-'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">챕터 진행</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {currentProject.stats.chaptersCompleted} / {currentProject.stats.chaptersTotal || chapters.length || '-'}
              </div>
              <Progress value={progress} className="h-1.5 mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">캐릭터</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{characters.length}</div>
              <p className="text-xs text-muted-foreground">
                주인공: {characters.filter(c => c.role === 'protagonist').length}명
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">최근 작업</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold flex items-center gap-1">
                <Clock className="h-5 w-5" />
              </div>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(currentProject.updatedAt), {
                  addSuffix: true,
                  locale: ko,
                })}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 빠른 액션 */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">빠른 작업</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {quickActions.map((action, index) => (
              <motion.div
                key={action.href}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link href={`/project/${projectId}/${action.href}`}>
                  <Card className="hover:shadow-md transition-all cursor-pointer group">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <action.icon className="h-5 w-5 text-primary" />
                        {action.title}
                        <ArrowRight className="h-4 w-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        {action.description}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        {/* 시놉시스 */}
        {currentProject.synopsis && (
          <Card>
            <CardHeader>
              <CardTitle>시놉시스</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{currentProject.synopsis}</p>
            </CardContent>
          </Card>
        )}

        {/* 글쓰기 목표 */}
        {currentProject.goals.dailyWordCount > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                글쓰기 목표
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <p className="text-sm text-muted-foreground">일일 목표</p>
                  <p className="text-lg font-semibold">
                    {currentProject.goals.dailyWordCount.toLocaleString()}자
                  </p>
                </div>
                {currentProject.goals.weeklyWordCount && (
                  <div>
                    <p className="text-sm text-muted-foreground">주간 목표</p>
                    <p className="text-lg font-semibold">
                      {currentProject.goals.weeklyWordCount.toLocaleString()}자
                    </p>
                  </div>
                )}
                {currentProject.goals.deadline && (
                  <div>
                    <p className="text-sm text-muted-foreground">마감일</p>
                    <p className="text-lg font-semibold">
                      {new Date(currentProject.goals.deadline).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                )}
              </div>

              {currentProject.goals.milestones.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">마일스톤</p>
                  <div className="space-y-2">
                    {currentProject.goals.milestones.map((milestone) => (
                      <div
                        key={milestone.id}
                        className={`flex items-center justify-between p-2 rounded-lg ${
                          milestone.completed ? 'bg-primary/10' : 'bg-muted/50'
                        }`}
                      >
                        <span className={milestone.completed ? 'line-through text-muted-foreground' : ''}>
                          {milestone.title}
                        </span>
                        <Badge variant={milestone.completed ? 'default' : 'outline'}>
                          {milestone.completed ? '완료' : '진행 중'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  );
}
