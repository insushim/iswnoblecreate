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
  Rocket,
  Loader2,
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
import { useSettingsStore } from '@/stores/settingsStore';
import { useWorldStore } from '@/stores/worldStore';
import { useUIStore } from '@/stores/uiStore';
import { generateText } from '@/lib/gemini';
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
  const { settings } = useSettingsStore();
  const { worldSettings, fetchWorldSettings } = useWorldStore();
  const { writingMode, setWritingMode } = useUIStore();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [content, setContent] = useState('');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAutoWriting, setIsAutoWriting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchChapter(chapterId),
        fetchCharacters(projectId),
        fetchWorldSettings(projectId),
      ]);
      setIsLoading(false);
    };
    loadData();
  }, [chapterId, projectId, fetchChapter, fetchCharacters, fetchWorldSettings]);

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

  // AI 자동 집필 - 전체 챕터 생성
  const handleAutoWriteChapter = async () => {
    if (!settings?.geminiApiKey || !currentProject || !currentChapter) return;

    // 씬이 없으면 먼저 생성
    if (!currentChapter.scenes || currentChapter.scenes.length === 0) {
      await handleCreateScene();
    }

    setIsAutoWriting(true);
    try {
      const characterInfo = characters
        .slice(0, 5)
        .map(c => `- ${c.name} (${c.role}): ${c.personality}\n  배경: ${c.background}`)
        .join('\n');

      const worldInfo = worldSettings
        .slice(0, 5)
        .map(w => `- ${w.title}: ${w.description}`)
        .join('\n');

      const prompt = `당신은 한국의 베스트셀러 소설가입니다. 출판용 소설 원고를 작성합니다.

[작품 정보]
제목: ${currentProject.title}
장르: ${currentProject.genre.join(', ')}
시놉시스: ${currentProject.synopsis}

[세계관]
${worldInfo || '없음'}

[등장인물]
${characterInfo || '없음'}

[현재 챕터]
${currentChapter.number}장 - ${currentChapter.title}
목적: ${currentChapter.purpose || '스토리 전개'}
주요 사건: ${currentChapter.keyEvents?.join(', ') || '없음'}

[이전 내용]
${content.slice(-800) || '(첫 장면입니다)'}

[분량]
${currentProject.settings?.targetChapterLength || 10000}자

[출판용 원고 형식 - 반드시 준수]

1. 들여쓰기: 모든 문단 첫 줄은 전각 공백(　) 하나로 시작
2. 문단 구분: 문단 사이에 빈 줄 하나
3. 대화문: 새 줄에서 전각 공백 후 큰따옴표로 시작
4. 지문: 대화 뒤 지문은 같은 줄에 쓰거나 새 문단으로
5. 장면 전환: 빈 줄 두 개로 구분
6. 금지: *, #, -, =, _ 등 특수문자로 구분선이나 강조 절대 금지

[예시 원고]
　창밖으로 붉은 노을이 번져가고 있었다. 하늘은 마치 누군가 물감을 흩뿌린 것처럼 붉고 푸른 빛이 뒤섞여 있었다. 그녀는 창가에 서서 멍하니 그 풍경을 바라보았다.

　"뭘 그렇게 보고 있어?"

　뒤에서 들려온 목소리에 그녀는 고개를 돌렸다. 문 앞에 그가 서 있었다. 손에는 김이 모락모락 나는 머그컵 두 개가 들려 있었다.

　"그냥, 노을이 예뻐서."

　그녀는 미소를 지으며 대답했다. 그가 다가와 그녀 옆에 섰다. 두 사람은 나란히 서서 저물어가는 하늘을 바라보았다.


　밤이 되자 거리에는 가로등이 하나둘 켜지기 시작했다. 낮의 소란스러움은 사라지고, 고요한 정적만이 감돌았다.

위 예시처럼 출판 소설 형식으로 이 챕터를 작성하세요. 본문만 출력하세요.`;

      const targetLength = currentProject.settings?.targetChapterLength || 10000;
      const response = await generateText(settings.geminiApiKey, prompt, {
        temperature: 0.85,
        maxTokens: Math.max(16000, targetLength * 2), // 목표 글자수의 2배 토큰 확보
      });

      // 텍스트 후처리 - 출판 형식으로 정리
      const formatNovelText = (text: string): string => {
        let formatted = text.trim();

        // 특수문자 구분선 제거 (*, -, =, #, _ 등)
        formatted = formatted.replace(/^[\*\-\=\#\_]{2,}\s*$/gm, '');
        formatted = formatted.replace(/^\*{3,}.*$/gm, '');
        formatted = formatted.replace(/^-{3,}.*$/gm, '');
        formatted = formatted.replace(/^={3,}.*$/gm, '');

        // **강조** 또는 *강조* 제거
        formatted = formatted.replace(/\*{1,2}([^*]+)\*{1,2}/g, '$1');

        // 여러 개의 빈 줄을 두 개로 통일 (장면 전환)
        formatted = formatted.replace(/\n{4,}/g, '\n\n\n');

        // 각 문단에 들여쓰기 추가 (전각 공백)
        const lines = formatted.split('\n');
        const processedLines = lines.map(line => {
          const trimmedLine = line.trim();
          // 빈 줄은 그대로
          if (!trimmedLine) return '';
          // 이미 전각 공백으로 시작하면 그대로
          if (trimmedLine.startsWith('　')) return trimmedLine;
          // 일반 공백으로 들여쓰기된 경우 전각 공백으로 변경
          if (line.startsWith('  ') || line.startsWith('\t')) {
            return '　' + trimmedLine;
          }
          // 들여쓰기 없는 문단에 전각 공백 추가
          return '　' + trimmedLine;
        });

        formatted = processedLines.join('\n');

        // 대화문 앞뒤 빈 줄 보장
        formatted = formatted.replace(/([^\n])\n(　")/g, '$1\n\n$2');
        formatted = formatted.replace(/(["'"'])\n(　[^"'])/g, '$1\n\n$2');

        return formatted;
      };

      const formattedResponse = formatNovelText(response);
      const newContent = content ? content + '\n\n\n' + formattedResponse : formattedResponse;
      setContent(newContent);

      // 자동 저장
      if (currentScene) {
        await updateScene(currentScene.id, { content: newContent });
        setLastSaved(new Date());
      }

    } catch (error) {
      console.error('자동 집필 실패:', error);
      alert('자동 집필 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsAutoWriting(false);
    }
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

          <Button
            onClick={handleAutoWriteChapter}
            disabled={isAutoWriting || !settings?.geminiApiKey}
            className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            {isAutoWriting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                집필 중...
              </>
            ) : (
              <>
                <Rocket className="h-4 w-4" />
                AI 자동 집필
              </>
            )}
          </Button>

          <Button onClick={handleSave} disabled={isSaving} variant="outline" className="gap-2">
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
