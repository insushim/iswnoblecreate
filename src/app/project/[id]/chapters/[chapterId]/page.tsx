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

  // 텍스트 후처리 - 출판 형식으로 정리 (소설책 스타일)
  const formatNovelText = useCallback((text: string): string => {
    let formatted = text.trim();

    // 특수문자 구분선 제거 (*, -, =, #, _ 등)
    formatted = formatted.replace(/^[\*\-\=\#\_]{2,}\s*$/gm, '');
    formatted = formatted.replace(/^\*{3,}.*$/gm, '');
    formatted = formatted.replace(/^-{3,}.*$/gm, '');
    formatted = formatted.replace(/^={3,}.*$/gm, '');

    // **강조** 또는 *강조* 제거
    formatted = formatted.replace(/\*{1,2}([^*]+)\*{1,2}/g, '$1');

    // 대화문 따옴표 정리 - 따옴표 앞뒤 불필요한 공백 제거
    formatted = formatted.replace(/"\s+/g, '"');
    formatted = formatted.replace(/\s+"/g, '"');
    formatted = formatted.replace(/"\s+/g, '"');
    formatted = formatted.replace(/\s+"/g, '"');

    // 따옴표 통일 (영문 따옴표를 한글 따옴표로)
    formatted = formatted.replace(/"/g, '"');
    formatted = formatted.replace(/"/g, '"');

    // 줄 단위로 처리
    const lines = formatted.split('\n');
    const processedLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();

      // 빈 줄은 장면 전환용으로만 유지 (연속 빈줄 제거)
      if (!line) {
        // 이전 줄이 빈 줄이 아닐 때만 빈 줄 추가
        if (processedLines.length > 0 && processedLines[processedLines.length - 1] !== '') {
          processedLines.push('');
        }
        continue;
      }

      // 전각 공백 중복 제거 후 하나만 추가
      line = line.replace(/^[　\s]+/, ''); // 앞의 모든 공백 제거

      // 마침표 누락 체크 - 문장부호로 끝나지 않으면 마침표 추가
      const endsWithPunctuation = /[.。?!'"」…~, ]$/.test(line);
      if (!endsWithPunctuation && line.length > 0) {
        line = line + '.';
      }

      // 전각 공백으로 들여쓰기
      processedLines.push('　' + line);
    }

    // 결과 생성 - 소설책처럼 문단 붙여쓰기 (장면 전환만 빈 줄)
    let result = '';
    let prevWasEmpty = false;

    for (let i = 0; i < processedLines.length; i++) {
      const line = processedLines[i];

      if (line === '') {
        if (!prevWasEmpty) {
          result += '\n'; // 장면 전환을 위한 빈 줄
          prevWasEmpty = true;
        }
      } else {
        result += (result && !prevWasEmpty ? '\n' : (prevWasEmpty ? '\n' : '')) + line;
        prevWasEmpty = false;
      }
    }

    return result.trim();
  }, []);

  // AI 자동 집필 - 전체 챕터 생성 (목표 글자수까지 반복, 최대 20만자)
  const handleAutoWriteChapter = async () => {
    if (!settings?.geminiApiKey || !currentProject || !currentChapter) return;

    // 씬이 없으면 먼저 생성
    if (!currentChapter.scenes || currentChapter.scenes.length === 0) {
      await handleCreateScene();
    }

    setIsAutoWriting(true);

    const targetLength = currentProject.settings?.targetChapterLength || 10000;
    let currentText = content;
    let iteration = 0;
    // 20만자 기준 약 50회 반복 필요 (회당 ~4000자)
    const maxIterations = Math.ceil(targetLength / 3000) + 10; // 목표에 따라 동적 설정
    let consecutiveErrors = 0;

    try {
      // 상세 캐릭터 정보 구성 (새로운 확장 필드 활용)
      const characterInfo = characters
        .slice(0, 8)
        .map(c => {
          let info = `[${c.name}] (${c.role})`;
          info += `\n  성격: ${c.personality}`;
          info += `\n  배경: ${c.background}`;
          // 확장 필드가 있으면 포함
          if (c.speechStyle) {
            info += `\n  말투: ${c.speechStyle}`;
          }
          if (c.strengths?.length > 0) {
            info += `\n  강점: ${c.strengths.join(', ')}`;
          }
          if (c.weaknesses?.length > 0) {
            info += `\n  약점: ${c.weaknesses.join(', ')}`;
          }
          if (c.motivation) {
            info += `\n  동기: ${c.motivation}`;
          }
          return info;
        })
        .join('\n\n');

      // 상세 세계관 정보 구성
      const worldInfo = worldSettings
        .slice(0, 8)
        .map(w => `【${w.title}】\n${w.description}`)
        .join('\n\n');

      // 챕터별 씬 개요 정보 구성
      const sceneOutlineInfo = currentChapter.sceneOutline && currentChapter.sceneOutline.length > 0
        ? currentChapter.sceneOutline.map((scene: string, idx: number) => `  씬${idx + 1}: ${scene}`).join('\n')
        : null;

      // 목표 글자수에 도달할 때까지 반복 생성
      while (currentText.length < targetLength && iteration < maxIterations) {
        iteration++;
        const currentLength = currentText.length; // 공백 포함 글자수
        const remainingLength = targetLength - currentLength;
        const progress = Math.round((currentLength / targetLength) * 100);

        console.log(`[자동집필] ${iteration}회차 - 현재: ${currentLength.toLocaleString()}자 / 목표: ${targetLength.toLocaleString()}자 (${progress}%)`);

        // 첫 생성인지 이어쓰기인지에 따라 프롬프트 조정
        const isFirstGeneration = currentLength < 500;
        const recentContent = currentText.slice(-3000); // 최근 3000자 참조 (맥락 유지)

        // 현재 진행 상황에 따른 씬 가이드
        const totalScenes = currentChapter.sceneOutline?.length || 5;
        const currentSceneIdx = Math.floor((progress / 100) * totalScenes);
        const currentSceneGuide = sceneOutlineInfo
          ? `현재 작성해야 할 씬: ${currentChapter.sceneOutline?.[currentSceneIdx] || '클라이맥스 또는 마무리'}`
          : '';

        const prompt = `당신은 한국의 베스트셀러 소설가입니다. 상업적으로 성공할 수준의 출판용 소설 원고를 작성합니다.

[작품 정보]
제목: ${currentProject.title}
장르: ${currentProject.genre.join(', ')}
분위기: ${currentProject.settings?.tone || '몰입감 있는'}

[시놉시스]
${currentProject.synopsis}

${currentProject.detailedSynopsis ? `[상세 시놉시스]\n${currentProject.detailedSynopsis}\n` : ''}
[세계관 설정]
${worldInfo || '현대 배경'}

[등장인물 상세]
${characterInfo || '주인공 중심 스토리'}

[현재 챕터: ${currentChapter.number}장 - ${currentChapter.title}]
목적: ${currentChapter.purpose || '스토리 전개'}
주요 사건: ${currentChapter.keyEvents?.join(', ') || '없음'}
감정톤: ${currentChapter.emotionalTone || '긴장과 기대'}
${currentChapter.characters && currentChapter.characters.length > 0 ? `등장인물: ${currentChapter.characters.join(', ')}` : ''}

${sceneOutlineInfo ? `[이 챕터의 씬 구성]\n${sceneOutlineInfo}\n\n${currentSceneGuide}` : ''}

[진행 상황]
현재 ${currentLength.toLocaleString()}자 작성됨 (목표: ${targetLength.toLocaleString()}자, ${progress}% 완료)
남은 분량: 약 ${remainingLength.toLocaleString()}자

${isFirstGeneration ? `[지시사항 - 챕터 시작]
이 챕터의 시작 부분을 작성하세요.
- 독자를 단번에 사로잡는 강렬한 도입부
- 장면 묘사로 시작하거나 인물의 행동으로 시작
- 전 챕터와의 연결성 고려
- 이 챕터의 핵심 갈등/사건을 암시` : `[이전 내용 - 반드시 이어서 작성]
${recentContent}

[지시사항 - 이어쓰기]
위 내용 바로 다음부터 자연스럽게 이어서 작성하세요.
- 앞 내용을 반복하거나 요약하지 마세요
- 스토리를 계속 전개하세요
- 인물 간 갈등과 감정을 깊이 있게 표현
- 대화와 지문의 균형 유지
- 복선과 암시 활용`}

[분량 - 매우 중요!]
이번에 최소 5000자 이상 작성하세요. 가능한 많이 작성하세요.
절대 짧게 끊지 마세요. 장면을 충분히 전개하세요.

[한국 소설책 형식 - 필수]
- 문단 시작: 전각 공백(　)으로 들여쓰기
- 대화문: "대사" 형식, 따옴표 안에 공백 없이
- 지문: 대사 직후 같은 줄 또는 바로 다음 줄
- 장면 전환시에만 빈 줄 하나 사용
- 모든 문장은 마침표로 종료
- **강조** 같은 마크다운 사용 금지

[품질 체크리스트]
✓ 생생한 오감 묘사 (시각, 청각, 촉각 등)
✓ 인물의 내면 심리 묘사
✓ 자연스러운 대화 (각 인물 말투 반영)
✓ 장면 전환의 자연스러운 흐름
✓ 긴장감과 몰입감 유지

본문만 출력하세요.`;

        try {
          const response = await generateText(settings.geminiApiKey, prompt, {
            temperature: 0.85,
            maxTokens: 8192,
          });

          const formattedResponse = formatNovelText(response);

          // 첫 생성이면 그대로, 아니면 이어붙이기
          if (isFirstGeneration && currentText.trim().length === 0) {
            currentText = formattedResponse;
          } else {
            currentText = currentText + '\n' + formattedResponse;
          }

          consecutiveErrors = 0; // 성공하면 에러 카운트 리셋

          // 중간 저장 및 UI 업데이트 (5회마다 저장으로 최적화)
          setContent(currentText);
          if (currentScene && iteration % 3 === 0) {
            await updateScene(currentScene.id, { content: currentText });
            setLastSaved(new Date());
          }

          // API 호출 간격 (rate limit 방지) - 대용량이므로 1.5초
          await new Promise(resolve => setTimeout(resolve, 1500));

        } catch (apiError) {
          consecutiveErrors++;
          console.error(`[자동집필] API 오류 (${consecutiveErrors}회):`, apiError);

          if (consecutiveErrors >= 3) {
            throw new Error('연속 3회 API 오류 발생. 잠시 후 다시 시도해주세요.');
          }

          // 오류 시 더 긴 대기
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }

      // 최종 저장
      if (currentScene) {
        await updateScene(currentScene.id, { content: currentText });
        setLastSaved(new Date());
      }

      const finalLength = currentText.length;
      console.log(`[자동집필] 완료! 총 ${iteration}회 생성, 최종 ${finalLength.toLocaleString()}자 (공백 포함)`);
      alert(`집필 완료! ${finalLength.toLocaleString()}자 생성됨`);

    } catch (error) {
      console.error('자동 집필 실패:', error);
      // 오류 발생해도 현재까지 작성된 내용은 저장
      if (currentScene && currentText.length > 0) {
        await updateScene(currentScene.id, { content: currentText });
        setLastSaved(new Date());
      }
      alert(`자동 집필 중 오류가 발생했습니다. 현재까지 ${currentText.length.toLocaleString()}자 저장됨.`);
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
