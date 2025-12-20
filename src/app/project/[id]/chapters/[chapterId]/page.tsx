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
  Download,
  FileText,
  FileJson,
  File,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
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
  const { currentProject, fetchProject } = useProjectStore();
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
        fetchProject(projectId),
        fetchChapter(chapterId),
        fetchCharacters(projectId),
        fetchWorldSettings(projectId),
      ]);
      setIsLoading(false);
    };
    loadData();
  }, [chapterId, projectId, fetchProject, fetchChapter, fetchCharacters, fetchWorldSettings]);

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

  // AI 자동 집필 - 씬별로 순차 생성 (목표 글자수까지 반복, 이전 씬 내용 참고)
  const handleAutoWriteChapter = async () => {
    if (!settings?.geminiApiKey || !currentProject || !currentChapter) return;

    // 씬이 없으면 먼저 생성
    if (!currentChapter.scenes || currentChapter.scenes.length === 0) {
      await handleCreateScene();
    }

    setIsAutoWriting(true);

    try {
      // 상세 캐릭터 정보 구성
      const characterInfo = characters
        .slice(0, 8)
        .map(c => {
          let info = `[${c.name}] (${c.role})`;
          info += `\n  성격: ${c.personality}`;
          if (c.background) info += `\n  배경: ${c.background}`;
          if (c.speechPattern?.tone) info += `\n  말투: ${c.speechPattern.tone}`;
          if (c.goal) info += `\n  목표: ${c.goal}`;
          return info;
        })
        .join('\n\n');

      // 상세 세계관 정보 구성
      const worldInfo = worldSettings
        .slice(0, 8)
        .map(w => `【${w.title}】\n${w.description}`)
        .join('\n\n');

      // 모든 씬을 순차적으로 생성
      const scenes = currentChapter.scenes.sort((a, b) => a.order - b.order);
      let previousSceneContent = ''; // 직전 씬의 내용 (마지막 부분)
      let totalGenerated = 0;

      for (let sceneIndex = 0; sceneIndex < scenes.length; sceneIndex++) {
        const scene = scenes[sceneIndex];
        const isFirstScene = sceneIndex === 0;
        const isLastScene = sceneIndex === scenes.length - 1;

        // 씬의 목표 글자수 (notes에서 파싱하거나 기본값 20000자)
        // notes 형식: "목표: 15,000자\n필수 포함: ..."
        let sceneTargetLength = 20000; // 기본 2만자
        const notesMatch = scene.goal?.match(/목표[:\s]*([0-9,]+)/);
        if (notesMatch) {
          sceneTargetLength = parseInt(notesMatch[1].replace(/,/g, ''), 10);
        }

        // 씬의 목표/설정 가져오기
        const sceneGoal = scene.goal || scene.summary || '';
        const sceneNotes = scene.conflict || '';

        console.log(`[자동집필] 씬 ${sceneIndex + 1}/${scenes.length} 시작: ${scene.title} (목표: ${sceneTargetLength.toLocaleString()}자)`);

        let sceneContent = scene.content || '';
        let iteration = 0;
        const maxIterations = Math.ceil(sceneTargetLength / 4000) + 5; // 안전 여유분

        // 목표 글자수까지 반복 생성
        while (sceneContent.length < sceneTargetLength && iteration < maxIterations) {
          iteration++;
          const currentLength = sceneContent.length;
          const remainingLength = sceneTargetLength - currentLength;
          const progress = Math.round((currentLength / sceneTargetLength) * 100);
          const isFirstGeneration = currentLength < 500;

          // 이전 내용 (직전 씬 + 현재 씬)
          const contextContent = isFirstGeneration
            ? previousSceneContent.slice(-2000)
            : sceneContent.slice(-2500);

          console.log(`[자동집필] 씬 ${sceneIndex + 1} - ${iteration}회차: ${currentLength.toLocaleString()}/${sceneTargetLength.toLocaleString()}자 (${progress}%)`);

          const prompt = `당신은 한국의 베스트셀러 소설가입니다. 상업적으로 성공할 수준의 출판용 소설 원고를 작성합니다.

[작품 정보]
제목: ${currentProject.title}
장르: ${currentProject.genre.join(', ')}
분위기: ${currentProject.settings?.tone || '몰입감 있는'}

[시놉시스]
${currentProject.synopsis || currentProject.logline || ''}

[세계관 설정]
${worldInfo || '현대 배경'}

[등장인물]
${characterInfo || '주인공 중심 스토리'}

[현재 챕터: ${currentChapter.number}장 - ${currentChapter.title}]
목적: ${currentChapter.purpose || '스토리 전개'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[현재 씬: ${scene.order}번 - ${scene.title}]
- 장소: ${scene.location || '미정'}
- 시간: ${scene.timeOfDay || '미정'}
- 등장인물: ${scene.participants?.join(', ') || '미정'}
${sceneGoal ? `- 씬 목표: ${sceneGoal}` : ''}
${sceneNotes ? `- 갈등/긴장: ${sceneNotes}` : ''}
- 진행: ${currentLength.toLocaleString()}/${sceneTargetLength.toLocaleString()}자 (${progress}%)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${contextContent ? `[이전 내용 - 반드시 이어서 작성]
"""
${contextContent}
"""
` : ''}

[지시사항]
${isFirstGeneration && isFirstScene
  ? `이것은 ${currentChapter.number}장의 첫 씬입니다.
- 독자를 사로잡는 강렬한 도입
- 챕터의 핵심 갈등을 암시
- 장면/행동으로 시작 (설명 금지)`
  : isFirstGeneration
  ? `이것은 새로운 씬의 시작입니다.
- 직전 씬의 내용에서 자연스럽게 이어지도록
- 장면 전환을 자연스럽게 처리`
  : `위 내용 바로 다음부터 자연스럽게 이어서 작성하세요.
- 앞 내용을 반복하거나 요약하지 마세요
- 스토리를 계속 전개하세요`}

${isLastScene && remainingLength < 8000
  ? `\n- 이것은 이 챕터의 마지막 씬입니다
- 챕터를 마무리하되 다음 챕터로의 궁금증을 남기세요`
  : ''}

[분량 - 매우 중요!]
이번에 최소 5000자 이상 작성하세요.
남은 분량: ${remainingLength.toLocaleString()}자
절대 짧게 끊지 마세요. 장면을 충분히 전개하세요.

[한국 소설책 형식 - 필수]
- 문단 시작: 전각 공백(　)으로 들여쓰기
- 대화문: "대사" 형식
- 장면 전환시에만 빈 줄 사용
- 모든 문장은 마침표로 종료
- 마크다운 사용 금지

본문만 출력하세요.`;

          try {
            const response = await generateText(settings.geminiApiKey, prompt, {
              temperature: 0.85,
              maxTokens: 8192,
            });

            let formattedResponse = formatNovelText(response);

            // 중복 감지 및 제거
            if (!isFirstGeneration && sceneContent.length > 500) {
              // 기존 내용의 마지막 500자에서 중복 체크
              const lastPart = sceneContent.slice(-500);

              // 새 응답의 첫 부분이 기존 내용과 겹치는지 확인
              for (let checkLen = Math.min(300, formattedResponse.length); checkLen >= 50; checkLen -= 10) {
                const checkPart = formattedResponse.slice(0, checkLen);
                if (lastPart.includes(checkPart)) {
                  // 중복 발견 - 중복 부분 제거
                  const overlapIndex = lastPart.indexOf(checkPart);
                  const overlapLength = 500 - overlapIndex;
                  formattedResponse = formattedResponse.slice(overlapLength);
                  console.log(`[자동집필] 중복 ${overlapLength}자 제거`);
                  break;
                }
              }

              // 문장 단위로도 중복 체크 (같은 문장으로 시작하면 제거)
              const lastSentences = sceneContent.slice(-1000).split(/[.!?]\s+/).slice(-3);
              const newFirstSentence = formattedResponse.split(/[.!?]\s+/)[0];
              if (lastSentences.some(s => s.length > 20 && newFirstSentence.includes(s.slice(0, 30)))) {
                // 첫 문장이 중복이면 스킵
                const firstPeriod = formattedResponse.search(/[.!?]\s+/);
                if (firstPeriod > 0) {
                  formattedResponse = formattedResponse.slice(firstPeriod + 2);
                  console.log(`[자동집필] 중복 문장 제거`);
                }
              }
            }

            // 이어붙이기
            if (isFirstGeneration && sceneContent.trim().length === 0) {
              sceneContent = formattedResponse;
            } else if (formattedResponse.trim().length > 100) {
              // 최소 100자 이상일 때만 추가 (중복 제거 후 너무 짧으면 스킵)
              sceneContent = sceneContent + '\n' + formattedResponse;
            }

            // 중간 저장 (3회마다)
            if (iteration % 3 === 0) {
              await updateScene(scene.id, { content: sceneContent });
            }

            // 현재 씬이면 UI 업데이트
            if (currentScene?.id === scene.id) {
              setContent(sceneContent);
            }

            // API 호출 간격
            await new Promise(resolve => setTimeout(resolve, 1500));

          } catch (apiError) {
            console.error(`[자동집필] 씬 ${sceneIndex + 1} - ${iteration}회차 실패:`, apiError);
            await new Promise(resolve => setTimeout(resolve, 5000));
          }
        }

        // 씬 최종 저장
        await updateScene(scene.id, { content: sceneContent });
        totalGenerated += sceneContent.length;

        // 다음 씬을 위해 현재 씬 내용 저장
        previousSceneContent = sceneContent;

        console.log(`[자동집필] 씬 ${sceneIndex + 1} 완료: ${sceneContent.length.toLocaleString()}자 (${iteration}회 생성)`);

        // 씬 간 대기
        if (sceneIndex < scenes.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      console.log(`[자동집필] 완료! 총 ${scenes.length}개 씬, ${totalGenerated.toLocaleString()}자 생성`);
      alert(`집필 완료! ${scenes.length}개 씬, 총 ${totalGenerated.toLocaleString()}자 생성됨`);

    } catch (error) {
      console.error('자동 집필 실패:', error);
      alert('자동 집필 중 오류가 발생했습니다.');
    } finally {
      setIsAutoWriting(false);
    }
  };

  const wordCount = content.replace(/\s/g, '').length;

  // HTML을 순수 텍스트로 변환
  const htmlToPlainText = (html: string): string => {
    return html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .trim();
  };

  // 현재 챕터 TXT로 내보내기
  const exportChapterToTxt = () => {
    if (!currentChapter) return;

    let exportContent = `제 ${currentChapter.number}장: ${currentChapter.title}\n`;
    exportContent += `${'─'.repeat(40)}\n\n`;
    exportContent += htmlToPlainText(content);
    exportContent += `\n\n─────────────────────────────────────────\n`;
    exportContent += `총 ${wordCount.toLocaleString()}자\n`;

    const blob = new Blob([exportContent], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, `${currentProject?.title || '소설'}_${currentChapter.number}장_${currentChapter.title}.txt`);
  };

  // 현재 챕터 마크다운으로 내보내기
  const exportChapterToMarkdown = () => {
    if (!currentChapter) return;

    let exportContent = `# 제 ${currentChapter.number}장: ${currentChapter.title}\n\n`;
    exportContent += htmlToPlainText(content);
    exportContent += `\n\n---\n*총 ${wordCount.toLocaleString()}자*\n`;

    const blob = new Blob([exportContent], { type: 'text/markdown;charset=utf-8' });
    saveAs(blob, `${currentProject?.title || '소설'}_${currentChapter.number}장_${currentChapter.title}.md`);
  };

  // 현재 챕터 HTML로 내보내기
  const exportChapterToHtml = () => {
    if (!currentChapter) return;

    const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${currentProject?.title || '소설'} - ${currentChapter.title}</title>
  <style>
    body {
      font-family: 'Pretendard', 'Noto Sans KR', sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
      line-height: 1.8;
      color: #333;
      background: #fafafa;
    }
    h1 { font-size: 1.8rem; margin-bottom: 2rem; border-bottom: 2px solid #333; padding-bottom: 1rem; }
    .content { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    p { margin-bottom: 1rem; text-indent: 1rem; }
    .footer { margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #ddd; color: #666; font-size: 0.9rem; text-align: right; }
  </style>
</head>
<body>
  <h1>제 ${currentChapter.number}장: ${currentChapter.title}</h1>
  <div class="content">
    ${content || '<p>내용이 없습니다.</p>'}
  </div>
  <div class="footer">총 ${wordCount.toLocaleString()}자</div>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    saveAs(blob, `${currentProject?.title || '소설'}_${currentChapter.number}장_${currentChapter.title}.html`);
  };

  // 현재 챕터 PDF로 내보내기
  const exportChapterToPdf = async () => {
    if (!currentChapter) return;

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const textWidth = pageWidth - margin * 2;
    let y = 20;

    // 제목
    doc.setFontSize(18);
    doc.text(`제 ${currentChapter.number}장: ${currentChapter.title}`, pageWidth / 2, y, { align: 'center' });
    y += 15;

    // 구분선
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;

    // 본문
    doc.setFontSize(11);
    const plainText = htmlToPlainText(content);
    const lines = doc.splitTextToSize(plainText, textWidth);

    for (const line of lines) {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, margin, y);
      y += 5;
    }

    // 하단 정보
    y += 10;
    if (y > 280) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(9);
    doc.text(`총 ${wordCount.toLocaleString()}자`, pageWidth - margin, y, { align: 'right' });

    doc.save(`${currentProject?.title || '소설'}_${currentChapter.number}장_${currentChapter.title}.pdf`);
  };

  // 현재 챕터 JSON으로 백업
  const exportChapterToJson = () => {
    if (!currentChapter) return;

    const data = {
      exportedAt: new Date().toISOString(),
      projectTitle: currentProject?.title,
      chapter: {
        number: currentChapter.number,
        title: currentChapter.title,
        status: currentChapter.status,
        wordCount: wordCount,
        content: content,
        scenes: currentChapter.scenes,
      },
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
    saveAs(blob, `${currentProject?.title || '소설'}_${currentChapter.number}장_${currentChapter.title}_backup.json`);
  };

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

          {/* 내보내기 드롭다운 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                내보내기
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>현재 챕터 저장</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={exportChapterToTxt} className="gap-2 cursor-pointer">
                <FileText className="h-4 w-4" />
                텍스트 파일 (.txt)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportChapterToMarkdown} className="gap-2 cursor-pointer">
                <FileText className="h-4 w-4" />
                마크다운 (.md)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportChapterToHtml} className="gap-2 cursor-pointer">
                <File className="h-4 w-4" />
                HTML 파일 (.html)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportChapterToPdf} className="gap-2 cursor-pointer">
                <File className="h-4 w-4" />
                PDF 문서 (.pdf)
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={exportChapterToJson} className="gap-2 cursor-pointer">
                <FileJson className="h-4 w-4" />
                JSON 백업 (.json)
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => router.push(`/project/${projectId}/export`)}
                className="gap-2 cursor-pointer"
              >
                <Download className="h-4 w-4" />
                전체 내보내기...
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
