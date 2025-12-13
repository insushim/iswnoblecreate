'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Calendar, Plus, Clock, Flag, ChevronDown, ChevronUp, Sparkles, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState, LoadingSpinner } from '@/components/common';
import { useChapterStore } from '@/stores/chapterStore';
import { usePlotStore } from '@/stores/plotStore';
import { useProjectStore } from '@/stores/projectStore';

export default function TimelinePage() {
  const params = useParams();
  const projectId = params.id as string;

  const { chapters, fetchChapters } = useChapterStore();
  const { plotStructure, fetchPlotStructure } = usePlotStore();
  const { currentProject } = useProjectStore();

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchChapters(projectId),
        fetchPlotStructure(projectId),
      ]);
      setIsLoading(false);
    };
    loadData();
  }, [projectId, fetchChapters, fetchPlotStructure]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
        <LoadingSpinner size="lg" text="타임라인을 불러오는 중..." />
      </div>
    );
  }

  const plotPoints = plotStructure?.plotPoints || [];

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">타임라인</h1>
          <p className="text-muted-foreground">스토리의 시간 흐름을 시각적으로 확인하세요</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          이벤트 추가
        </Button>
      </div>

      {/* 타임라인 뷰 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            스토리 타임라인
          </CardTitle>
          <CardDescription>플롯 포인트와 챕터를 시간순으로 보여줍니다</CardDescription>
        </CardHeader>
        <CardContent>
          {plotPoints.length === 0 && chapters.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="타임라인이 비어있습니다"
              description="플롯 구조에서 플롯 포인트를 추가하면 여기에 표시됩니다."
            />
          ) : (
            <div className="relative">
              {/* 타임라인 선 */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

              <div className="space-y-6 ml-8">
                {plotPoints.sort((a, b) => a.order - b.order).map((point, index) => (
                  <motion.div
                    key={point.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="relative"
                  >
                    {/* 타임라인 점 */}
                    <div className={`absolute -left-10 w-4 h-4 rounded-full border-2 ${
                      point.completed ? 'bg-primary border-primary' : 'bg-background border-muted-foreground'
                    }`} />

                    <Card className={point.completed ? 'border-primary/50' : ''}>
                      <CardHeader className="py-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">{point.title}</CardTitle>
                          <Badge variant={point.completed ? 'default' : 'outline'}>
                            {point.type}
                          </Badge>
                        </div>
                        <CardDescription className="line-clamp-2">
                          {point.description}
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  </motion.div>
                ))}

                {/* 챕터 마커 */}
                {chapters.map((chapter, index) => (
                  <motion.div
                    key={chapter.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (plotPoints.length + index) * 0.1 }}
                    className="relative"
                  >
                    <div className="absolute -left-10 w-4 h-4 rounded-full bg-blue-500 border-2 border-blue-500" />
                    <Card className="border-blue-500/30">
                      <CardHeader className="py-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">
                            {chapter.number}장: {chapter.title}
                          </CardTitle>
                          <Badge variant="secondary">{chapter.status}</Badge>
                        </div>
                        <CardDescription className="line-clamp-1">
                          {chapter.purpose || '목적 없음'}
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 안내 */}
      <Card className="bg-muted/50">
        <CardContent className="py-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Clock className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">타임라인 기능</h3>
              <p className="text-sm text-muted-foreground">
                타임라인을 통해 스토리의 흐름을 한눈에 파악할 수 있습니다.
                플롯 포인트, 챕터, 주요 이벤트를 시간순으로 정리하세요.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
