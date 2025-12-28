'use client';

/**
 * 씬 프롬프트 관리 컴포넌트
 * - 씬별 프롬프트 생성 및 조회
 * - 프롬프트 미리보기 및 복사
 * - AI 자동 생성 트리거
 */

import { useState, useCallback, useMemo } from 'react';
import { useVolumeStore } from '@/stores/volumeStore';
import { useProjectStore } from '@/stores/projectStore';
import { useCharacterStore } from '@/stores/characterStore';
import { useWorldStore } from '@/stores/worldStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  FileText,
  Copy,
  Check,
  Sparkles,
  ChevronRight,
  Clock,
  MapPin,
  Users,
  Target,
  AlertCircle,
  Play,
  Pause,
} from 'lucide-react';
import type { SceneStructure, WritingStyle } from '@/types';
import type { ScenePromptData } from '@/lib/scenePromptGenerator';

interface ScenePromptManagerProps {
  volumeId: string;
}

export function ScenePromptManager({ volumeId }: ScenePromptManagerProps) {
  const { currentProject } = useProjectStore();
  const { characters } = useCharacterStore();
  const { worldSettings } = useWorldStore();
  const {
    volumes,
    currentVolume,
    generateScenePrompt,
    generateAllScenePrompts,
    getScenePrompt,
    applyHwangjinTemplate,
  } = useVolumeStore();

  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedScene, setSelectedScene] = useState<SceneStructure | null>(null);
  const [generatedPrompts, setGeneratedPrompts] = useState<ScenePromptData[]>([]);

  const volume = volumes.find(v => v.id === volumeId) || currentVolume;

  // 기본 스타일 설정 (useMemo로 최적화)
  const defaultStyle: WritingStyle = useMemo(() => ({
    writingStyle: currentProject?.settings?.writingStyle || 'elaborate',
    perspective: currentProject?.settings?.perspective || 'third-limited',
    tense: currentProject?.settings?.tense || 'past',
    dialogueRatio: currentProject?.settings?.dialogueRatio || 40,
    descriptionDetail: currentProject?.settings?.descriptionDetail || 7,
    pacing: currentProject?.settings?.pacingPreference || 'moderate',
    emotionIntensity: currentProject?.settings?.emotionIntensity || 7,
  }), [currentProject?.settings]);

  // 단일 씬 프롬프트 생성
  const handleGenerateScenePrompt = useCallback((sceneId: string) => {
    if (!currentProject) return;

    const promptData = generateScenePrompt(
      sceneId,
      currentProject,
      characters,
      worldSettings,
      defaultStyle
    );

    if (promptData) {
      setGeneratedPrompts(prev => {
        const filtered = prev.filter(p => p.sceneId !== sceneId);
        return [...filtered, promptData];
      });
    }
  }, [currentProject, characters, worldSettings, generateScenePrompt, defaultStyle]);

  // 전체 씬 프롬프트 일괄 생성
  const handleGenerateAllPrompts = useCallback(async () => {
    if (!currentProject || !volume) return;

    setIsGenerating(true);
    try {
      const prompts = generateAllScenePrompts(
        volumeId,
        currentProject,
        characters,
        worldSettings,
        defaultStyle
      );
      setGeneratedPrompts(prompts);
    } finally {
      setIsGenerating(false);
    }
  }, [currentProject, volume, volumeId, characters, worldSettings, generateAllScenePrompts, defaultStyle]);

  // 황진 템플릿 적용
  const handleApplyHwangjinTemplate = useCallback(async () => {
    if (!volume) return;

    setIsGenerating(true);
    try {
      await applyHwangjinTemplate(volumeId);
    } finally {
      setIsGenerating(false);
    }
  }, [volume, volumeId, applyHwangjinTemplate]);

  // 클립보드 복사
  const handleCopy = useCallback((text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  // 씬 상태 색상
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in_progress': return 'bg-yellow-500';
      case 'needs_revision': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return '완료';
      case 'in_progress': return '작성 중';
      case 'needs_revision': return '수정 필요';
      default: return '대기';
    }
  };

  if (!volume) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          권을 선택하거나 생성해주세요.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">
                {volume.volumeNumber}권 &quot;{volume.title || '제목 없음'}&quot; 씬 관리
              </CardTitle>
              <CardDescription className="mt-1">
                총 {volume.scenes.length}개 씬 &middot; 목표 {volume.targetWordCount?.toLocaleString() || 0}자
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {volume.scenes.length === 0 && (
                <Button
                  variant="outline"
                  onClick={handleApplyHwangjinTemplate}
                  disabled={isGenerating}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  황진 1권 템플릿 적용
                </Button>
              )}
              <Button
                onClick={handleGenerateAllPrompts}
                disabled={isGenerating || volume.scenes.length === 0}
              >
                {isGenerating ? (
                  <>
                    <Pause className="w-4 h-4 mr-2 animate-pulse" />
                    생성 중...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    전체 프롬프트 생성
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* 권 정보 요약 */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">시작점</p>
              <p className="text-sm font-medium truncate">{volume.startPoint || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">종료점</p>
              <p className="text-sm font-medium truncate">{volume.endPoint || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">정확한 종료</p>
              <p className="text-sm font-medium truncate text-red-600">
                &quot;{volume.endPointExact || '-'}&quot;
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">핵심 사건</p>
              <p className="text-sm font-medium truncate">{volume.coreEvent || '-'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 씬 목록 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">씬 분할표</CardTitle>
        </CardHeader>
        <CardContent>
          {volume.scenes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>씬이 없습니다.</p>
              <p className="text-sm mt-2">
                &quot;황진 1권 템플릿 적용&quot; 버튼을 클릭하여 예시 씬을 추가하거나,
                <br />
                직접 씬을 추가해주세요.
              </p>
            </div>
          ) : (
            <Accordion type="multiple" className="space-y-2">
              {volume.scenes.map((scene, index) => {
                const promptData = generatedPrompts.find(p => p.sceneId === scene.id) ||
                                   getScenePrompt(scene.id);

                return (
                  <AccordionItem
                    key={scene.id}
                    value={scene.id}
                    className="border rounded-lg px-4"
                  >
                    <AccordionTrigger className="hover:no-underline py-4">
                      <div className="flex items-center gap-4 w-full">
                        {/* 상태 표시 */}
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(scene.status)}`} />

                        {/* 씬 번호 및 제목 */}
                        <div className="flex-1 text-left">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">
                              {scene.sceneNumber}. {scene.title}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {scene.targetWordCount?.toLocaleString()}자
                            </Badge>
                            {promptData && (
                              <Badge variant="secondary" className="text-xs">
                                <FileText className="w-3 h-3 mr-1" />
                                프롬프트 준비됨
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {scene.pov}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {scene.location}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {scene.timeframe}
                            </span>
                          </div>
                        </div>
                      </div>
                    </AccordionTrigger>

                    <AccordionContent className="pb-4">
                      <div className="space-y-4 pt-2">
                        {/* 기본 정보 */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">등장인물</p>
                            <div className="flex flex-wrap gap-1">
                              {scene.participants.map((p, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {p}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">상태</p>
                            <Badge className={getStatusColor(scene.status)}>
                              {getStatusText(scene.status)}
                            </Badge>
                          </div>
                        </div>

                        <Separator />

                        {/* 시작/종료 조건 */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                            <p className="text-xs font-medium text-green-700 dark:text-green-400 mb-1">
                              🟢 시작 조건
                            </p>
                            <p className="text-sm">&quot;{scene.startCondition}&quot;</p>
                          </div>
                          <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-lg">
                            <p className="text-xs font-medium text-red-700 dark:text-red-400 mb-1">
                              🔴 종료 조건 (도달 시 즉시 멈춤!)
                            </p>
                            <p className="text-sm">&quot;{scene.endCondition}&quot;</p>
                          </div>
                        </div>

                        {/* 필수 포함 내용 */}
                        <div>
                          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                            <Target className="w-3 h-3" />
                            필수 포함 내용 (mustInclude)
                          </p>
                          <ul className="space-y-1">
                            {scene.mustInclude.map((item, i) => (
                              <li key={i} className="text-sm flex items-start gap-2">
                                <ChevronRight className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <Separator />

                        {/* 프롬프트 액션 */}
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleGenerateScenePrompt(scene.id)}
                          >
                            <Sparkles className="w-4 h-4 mr-2" />
                            프롬프트 생성
                          </Button>

                          {promptData && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button size="sm" variant="outline">
                                  <FileText className="w-4 h-4 mr-2" />
                                  프롬프트 보기
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl max-h-[80vh]">
                                <DialogHeader>
                                  <DialogTitle>
                                    {scene.sceneNumber}씬 &quot;{scene.title}&quot; 집필 프롬프트
                                  </DialogTitle>
                                </DialogHeader>
                                <Tabs defaultValue="system" className="mt-4">
                                  <TabsList>
                                    <TabsTrigger value="system">시스템 프롬프트</TabsTrigger>
                                    <TabsTrigger value="user">사용자 프롬프트</TabsTrigger>
                                  </TabsList>
                                  <TabsContent value="system">
                                    <div className="relative">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="absolute top-2 right-2"
                                        onClick={() => handleCopy(promptData.systemPrompt, `sys-${scene.id}`)}
                                      >
                                        {copiedId === `sys-${scene.id}` ? (
                                          <Check className="w-4 h-4" />
                                        ) : (
                                          <Copy className="w-4 h-4" />
                                        )}
                                      </Button>
                                      <ScrollArea className="h-[400px] border rounded-lg p-4">
                                        <pre className="text-xs whitespace-pre-wrap font-mono">
                                          {promptData.systemPrompt}
                                        </pre>
                                      </ScrollArea>
                                    </div>
                                  </TabsContent>
                                  <TabsContent value="user">
                                    <div className="relative">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="absolute top-2 right-2"
                                        onClick={() => handleCopy(promptData.userPrompt, `usr-${scene.id}`)}
                                      >
                                        {copiedId === `usr-${scene.id}` ? (
                                          <Check className="w-4 h-4" />
                                        ) : (
                                          <Copy className="w-4 h-4" />
                                        )}
                                      </Button>
                                      <ScrollArea className="h-[400px] border rounded-lg p-4">
                                        <pre className="text-xs whitespace-pre-wrap font-mono">
                                          {promptData.userPrompt}
                                        </pre>
                                      </ScrollArea>
                                    </div>
                                  </TabsContent>
                                </Tabs>
                              </DialogContent>
                            </Dialog>
                          )}

                          {promptData && (
                            <Button
                              size="sm"
                              onClick={() => {
                                const fullPrompt = `${promptData.systemPrompt}\n\n---\n\n${promptData.userPrompt}`;
                                handleCopy(fullPrompt, `full-${scene.id}`);
                              }}
                            >
                              {copiedId === `full-${scene.id}` ? (
                                <>
                                  <Check className="w-4 h-4 mr-2" />
                                  복사됨!
                                </>
                              ) : (
                                <>
                                  <Copy className="w-4 h-4 mr-2" />
                                  전체 복사
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default ScenePromptManager;
