'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Save,
  Wand2,
  RefreshCw,
  ChevronLeft,
  Settings,
  Eye,
  Maximize2,
  Minimize2,
  History,
  Sparkles,
  MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { NovelEditor } from '@/components/writing/NovelEditor';
import { AIGeneratePanel } from '@/components/writing/AIGeneratePanel';
import { LoadingSpinner, AIThinking } from '@/components/common';
import { useChapterStore } from '@/stores/chapterStore';
import { useCharacterStore } from '@/stores/characterStore';
import { useProjectStore } from '@/stores/projectStore';
import { useUIStore } from '@/stores/uiStore';
import { Chapter, Scene } from '@/types';

const statusOptions: { value: Chapter['status']; label: string }[] = [
  { value: 'outline', label: '개요' },
  { value: 'draft', label: '초고' },
  { value: 'revision', label: '수정 중' },
  { value: 'polished', label: '다듬기' },
  { value: 'approved', label: '완료' },
];

export default function ChapterEditorPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const chapterId = params.chapterId as string;

  const { currentChapter, currentScene, fetchChapter, updateChapter, createScene, updateScene, setCurrentScene, saveSceneVersion } = useChapterStore();
  const { characters, fetchCharacters } = useCharacterStore();
  const { currentProject } = useProjectStore();
  const { writingMode, setWritingMode } = useUIStore();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [content, setContent] = useState('');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchChapter(chapterId),
        fetchCharacters(projectId),
      ]);
      setIsLoading(false);
    };
    loadData();
  }, [chapterId, projectId, fetchChapter, fetchCharacters]);

  useEffect(() => {
    if (currentChapter?.scenes && currentChapter.scenes.length > 0 && !currentScene) {
      setCurrentScene(currentChapter.scenes[0]);
    }
  }, [currentChapter, currentScene, setCurrentScene]);

  useEffect(() => {
    if (currentScene) {
      setContent(currentScene.content);
    }
  }, [currentScene]);

  // 자동 저장
  useEffect(() => {
    if (!currentScene || content === currentScene.content) return;

    const timer = setTimeout(async () => {
      await handleSave();
    }, 30000); // 30초마다 자동 저장

    return () => clearTimeout(timer);
  }, [content, currentScene]);

  const handleSave = async () => {
    if (!currentScene) return;

    setIsSaving(true);
    try {
      await updateScene(currentScene.id, { content });
      setLastSaved(new Date());

      // 버전 저장 (5분마다)
      const lastVersion = currentScene.versions[currentScene.versions.length - 1];
      if (!lastVersion || new Date().getTime() - new Date(lastVersion.createdAt).getTime() > 300000) {
        await saveSceneVersion(currentScene.id, content, 'auto');
      }
    } catch (error) {
      console.error('저장 실패:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateScene = async () => {
    if (!currentChapter) return;

    const newScene = await createScene(currentChapter.id, {
      title: `씬 ${(currentChapter.scenes?.length || 0) + 1}`,
    });
    setCurrentScene(newScene);
  };

  const handleStatusChange = async (status: Chapter['status']) => {
    if (!currentChapter) return;
    await updateChapter(currentChapter.id, { status });
  };

  const handleContentGenerated = (generatedContent: string) => {
    setContent((prev) => prev + '\n\n' + generatedContent);
    setShowAIPanel(false);
  };

  const wordCount = content.replace(/\s/g, '').length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
        <LoadingSpinner size="lg" text="챕터를 불러오는 중..." />
      </div>
    );
  }

  if (!currentChapter) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)] gap-4">
        <p className="text-muted-foreground">챕터를 찾을 수 없습니다</p>
        <Button onClick={() => router.back()}>돌아가기</Button>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-[calc(100vh-3.5rem)] ${isFullscreen ? 'fixed inset-0 z-50 bg-background' : ''}`}>
      {/* 툴바 */}
      <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push(`/project/${projectId}/chapters`)}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="font-semibold">{currentChapter.title}</h1>
            <p className="text-xs text-muted-foreground">
              {wordCount.toLocaleString()}자
              {lastSaved && ` · 마지막 저장: ${lastSaved.toLocaleTimeString()}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Select value={currentChapter.status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon" onClick={() => setIsFullscreen(!isFullscreen)}>
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>

          <Button variant="outline" size="icon" onClick={() => setShowAIPanel(!showAIPanel)}>
            <Sparkles className="h-4 w-4" />
          </Button>

          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            {isSaving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            저장
          </Button>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 씬 목록 사이드바 */}
        <div className="w-48 border-r bg-muted/30 overflow-y-auto hidden md:block">
          <div className="p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">씬</span>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCreateScene}>
                <span className="text-lg">+</span>
              </Button>
            </div>
            <div className="space-y-1">
              {currentChapter.scenes?.map((scene, index) => (
                <button
                  key={scene.id}
                  className={`w-full text-left p-2 rounded text-sm transition-colors ${
                    currentScene?.id === scene.id
                      ? 'bg-primary/10 text-primary'
                      : 'hover:bg-muted'
                  }`}
                  onClick={() => setCurrentScene(scene)}
                >
                  <div className="font-medium truncate">{scene.title || `씬 ${index + 1}`}</div>
                  <div className="text-xs text-muted-foreground">
                    {scene.wordCount.toLocaleString()}자
                  </div>
                </button>
              ))}
              {(!currentChapter.scenes || currentChapter.scenes.length === 0) && (
                <button
                  className="w-full text-left p-2 rounded text-sm text-muted-foreground hover:bg-muted"
                  onClick={handleCreateScene}
                >
                  + 첫 씬 만들기
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 에디터 영역 */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {currentScene ? (
            <NovelEditor
              content={content}
              onChange={setContent}
              placeholder="여기에 이야기를 작성하세요..."
            />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <p className="text-muted-foreground mb-4">씬을 선택하거나 새로 만드세요</p>
                <Button onClick={handleCreateScene}>첫 씬 만들기</Button>
              </div>
            </div>
          )}
        </div>

        {/* AI 생성 패널 */}
        {showAIPanel && currentScene && (
          <div className="w-96 border-l bg-background overflow-y-auto">
            <AIGeneratePanel
              projectId={projectId}
              chapter={currentChapter}
              scene={currentScene}
              characters={characters}
              currentContent={content}
              onGenerate={handleContentGenerated}
              onClose={() => setShowAIPanel(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
