'use client';

import { useState, useEffect, useMemo } from 'react';
import { Wand2, X, RefreshCw, Sparkles, MessageSquare, BookOpen, Lightbulb, Target, Copy, CheckCircle, AlertTriangle, Layers, Play, Type, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { useSettingsStore } from '@/stores/settingsStore';
import { useProjectStore } from '@/stores/projectStore';
import { useVolumeStore } from '@/stores/volumeStore';
import { useWorldStore } from '@/stores/worldStore';
import { usePlotStore } from '@/stores/plotStore';
import { useCharacterStore } from '@/stores/characterStore';
import { generateText, generateTextStream } from '@/lib/gemini';
import {
  generateVolumePrompt,
  generateScenePrompt,
  generateContinuePrompt,
  generateQuickPrompt,
} from '@/lib/promptGenerator';
import {
  StreamGuard,
  StreamGuardResult,
  StreamViolation,
} from '@/lib/streamGuard';
import {
  analyzeFullStory,
  generateWritingContext,
  StoryAnalysisResult,
  detectStoryCompression,
  detectTimeJump,
} from '@/lib/storyAnalyzer';
import { cleanGeneratedText } from '@/lib/gemini';
import {
  validateSceneContent,
  SceneValidationResult,
  formatValidationResult,
} from '@/lib/sceneValidator';
import { Chapter, Scene, Character, VolumeStructure, SceneStructure, WritingStyle } from '@/types';

interface AIGeneratePanelProps {
  projectId: string;
  chapter: Chapter;
  scene: Scene;
  characters: Character[];
  currentContent: string;
  selectedText?: string;
  onGenerate: (content: string) => void;
  onReplaceSelection?: (content: string) => void;
  onReplaceScene?: (sceneId: string, content: string) => void;
  onClose: () => void;
}

type GenerationType = 'continue' | 'dialogue' | 'description' | 'action' | 'rewrite' | 'expand';

const generationTypes: { value: GenerationType; label: string; icon: React.ReactNode; description: string }[] = [
  { value: 'continue', label: '이어쓰기', icon: <Sparkles className="h-4 w-4" />, description: '현재 내용에서 자연스럽게 이어지는 문장 생성' },
  { value: 'dialogue', label: '대화 생성', icon: <MessageSquare className="h-4 w-4" />, description: '캐릭터 간의 대화 생성' },
  { value: 'description', label: '묘사 추가', icon: <BookOpen className="h-4 w-4" />, description: '장면, 감정, 배경 묘사 추가' },
  { value: 'action', label: '액션 씬', icon: <Lightbulb className="h-4 w-4" />, description: '역동적인 액션 장면 생성' },
  { value: 'rewrite', label: '다시 쓰기', icon: <RefreshCw className="h-4 w-4" />, description: '선택한 부분을 다르게 표현' },
  { value: 'expand', label: '확장하기', icon: <Wand2 className="h-4 w-4" />, description: '간단한 내용을 더 풍부하게 확장' },
];

const toneOptions = [
  { value: 'neutral', label: '중립적' },
  { value: 'dramatic', label: '극적' },
  { value: 'lyrical', label: '서정적' },
  { value: 'humorous', label: '유머러스' },
  { value: 'dark', label: '어두운' },
  { value: 'romantic', label: '로맨틱' },
  { value: 'tense', label: '긴장감 있는' },
];

// 기본 문체 설정
const defaultWritingStyle: WritingStyle = {
  writingStyle: '한국 소설 스타일',
  perspective: 'third-limited',
  tense: 'past',
  dialogueRatio: 40,
  descriptionDetail: 7,
  pacing: 'moderate',
  emotionIntensity: 6,
};

export function AIGeneratePanel({
  projectId,
  chapter,
  scene,
  characters,
  currentContent,
  selectedText,
  onGenerate,
  onReplaceSelection,
  onReplaceScene,
  onClose,
}: AIGeneratePanelProps) {
  const { settings } = useSettingsStore();
  const { currentProject } = useProjectStore();
  const { volumes, currentVolume, currentScene, setCurrentVolume, setCurrentScene, validateVolumeEndPoints, updateWordCount, getVolumeProgress } = useVolumeStore();
  const { settings: worldSettings } = useWorldStore();
  const { plotStructure, foreshadowings, conflicts } = usePlotStore();
  const { characters: allCharacters } = useCharacterStore();

  // 탭 모드: 'quick' = 기존 빠른 생성, 'selection' = 선택 부분 재생성, 'scene' = 씬 전체 재생성, 'structured' = 권/씬 기반 구조화 생성
  const [activeTab, setActiveTab] = useState<'quick' | 'selection' | 'scene' | 'structured'>(
    selectedText ? 'selection' : 'quick'
  );

  // 씬 재생성용 상태
  const [sceneToRegenerate, setSceneToRegenerate] = useState<string>(scene?.id || '');
  const [sceneRegeneratePrompt, setSceneRegeneratePrompt] = useState('');
  const [selectionRegeneratePrompt, setSelectionRegeneratePrompt] = useState('');

  const [generationType, setGenerationType] = useState<GenerationType>('continue');
  const [customPrompt, setCustomPrompt] = useState('');
  const [selectedCharacters, setSelectedCharacters] = useState<string[]>([]);
  const [tone, setTone] = useState('neutral');
  const [length, setLength] = useState([200]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [error, setError] = useState('');

  // 구조화 생성 관련 상태
  const [selectedVolumeId, setSelectedVolumeId] = useState<string>('');
  const [selectedSceneId, setSelectedSceneId] = useState<string>('');
  const [structuredMode, setStructuredMode] = useState<'volume' | 'scene' | 'continue'>('scene');
  const [writingStyle, setWritingStyle] = useState<WritingStyle>(defaultWritingStyle);
  const [previousContent, setPreviousContent] = useState('');

  // 스토리 분석 상태 (v2.0)
  const [storyAnalysis, setStoryAnalysis] = useState<StoryAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisWarnings, setAnalysisWarnings] = useState<string[]>([]);

  // 생성 결과 검증 상태 (sceneValidator.ts 사용)
  const [validationResult, setValidationResult] = useState<SceneValidationResult | null>(null);

  // 스트리밍 생성 상태 (StreamGuard 실시간 차단)
  const [streamingContent, setStreamingContent] = useState('');
  const [streamGuardResult, setStreamGuardResult] = useState<StreamGuardResult | null>(null);
  const [streamViolations, setStreamViolations] = useState<StreamViolation[]>([]);

  // 프로젝트의 권 목록 필터링
  const projectVolumes = useMemo(() =>
    volumes.filter(v => v.projectId === projectId),
    [volumes, projectId]
  );

  // 선택된 권의 씬 목록
  const selectedVolume = useMemo(() =>
    projectVolumes.find(v => v.id === selectedVolumeId),
    [projectVolumes, selectedVolumeId]
  );

  // 선택된 씬
  const selectedScene = useMemo(() =>
    selectedVolume?.scenes.find(s => s.id === selectedSceneId),
    [selectedVolume, selectedSceneId]
  );

  // 종료점 검증 결과
  const endPointValidation = useMemo(() => {
    if (!selectedVolumeId) return null;
    return validateVolumeEndPoints(selectedVolumeId);
  }, [selectedVolumeId, validateVolumeEndPoints]);

  // 진행 상황
  const volumeProgress = useMemo(() => {
    if (!selectedVolumeId) return null;
    return getVolumeProgress(selectedVolumeId);
  }, [selectedVolumeId, getVolumeProgress]);

  // 스토리 분석 수행 함수 (v2.0)
  const performStoryAnalysis = async (): Promise<StoryAnalysisResult | null> => {
    if (!settings?.geminiApiKey || projectVolumes.length === 0) {
      return null;
    }

    try {
      setIsAnalyzing(true);
      console.log('[AIGeneratePanel] 스토리 분석 시작...');

      const projectCharacters = allCharacters.filter(c => c.projectId === projectId);
      const result = await analyzeFullStory(
        settings.geminiApiKey,
        projectVolumes,
        projectCharacters,
        settings.planningModel || 'gemini-3-flash-preview'
      );

      // 치명적 경고 추출
      const criticalWarnings = result.warnings
        .filter(w => w.severity === 'critical')
        .map(w => w.description);
      setAnalysisWarnings(criticalWarnings);
      setStoryAnalysis(result);

      console.log('[AIGeneratePanel] 스토리 분석 완료, 경고 수:', criticalWarnings.length);
      return result;
    } catch (error) {
      console.error('[AIGeneratePanel] 스토리 분석 실패:', error);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerate = async () => {
    console.log('[AIGeneratePanel] handleGenerate 호출됨');
    console.log('[AIGeneratePanel] settings 객체:', settings);
    console.log('[AIGeneratePanel] API 키 존재 여부:', !!settings?.geminiApiKey);
    console.log('[AIGeneratePanel] API 키 길이:', settings?.geminiApiKey?.length || 0);

    if (!settings?.geminiApiKey) {
      console.error('[AIGeneratePanel] ❌ API 키가 설정되지 않음!');
      setError('설정에서 Gemini API 키를 먼저 등록해주세요.');
      return;
    }

    console.log('[AIGeneratePanel] 생성 시작...');
    setIsGenerating(true);
    setError('');
    setGeneratedContent('');

    try {
      // 프로젝트 캐릭터 가져오기
      const projectCharacters = allCharacters.filter(c => c.projectId === projectId);
      const charsToUse = projectCharacters.length > 0 ? projectCharacters : characters;

      // 프로젝트 세계관, 복선, 갈등 가져오기
      const worldSettingsArray = worldSettings ? Object.values(worldSettings).flat() : [];
      const projectForeshadowings = foreshadowings.filter(f => f.projectId === projectId);
      const projectConflicts = conflicts.filter(c => c.projectId === projectId);

      // 스토리 분석 수행 (이전 글 분석하여 일관성 유지) - v2.0
      let currentAnalysis = storyAnalysis;
      if (!currentAnalysis && projectVolumes.length > 0) {
        currentAnalysis = await performStoryAnalysis();
      }

      // 새로운 generateQuickPrompt 사용 (모든 기획 데이터 + 스토리 분석 포함)
      const prompt = currentProject
        ? generateQuickPrompt(
            currentProject,
            charsToUse,
            worldSettingsArray,
            plotStructure,
            projectForeshadowings,
            projectConflicts,
            {
              generationType,
              tone: toneOptions.find((t) => t.value === tone)?.label || '중립적',
              targetLength: length[0],
              currentContent,
              customPrompt: customPrompt || undefined,
              selectedCharacterIds: selectedCharacters.length > 0 ? selectedCharacters : undefined,
              sceneSetting: {
                title: scene.title,
                location: scene.location || '미정',
                timeframe: '미정',
              },
            },
            // v2.0: 스토리 분석 결과 전달 (사망/감금 캐릭터 등)
            currentAnalysis ? {
              storyAnalysis: currentAnalysis,
            } : undefined
          )
        : `당신은 한국의 베스트셀러 소설가입니다.

[작품 정보]
장르: 일반

[씬] ${scene.title} / 장소: ${scene.location || '미정'}

[현재 내용]
${currentContent.replace(/<[^>]*>/g, '').slice(-500) || '(시작 부분)'}

[요청]
- 유형: ${generationTypes.find((t) => t.value === generationType)?.label}
- 분위기: ${toneOptions.find((t) => t.value === tone)?.label || '중립적'}
- 분량: ${length[0]}자 이상
${customPrompt ? `- 추가: ${customPrompt}` : ''}

한국 소설책 형식으로 작성하세요.
- 문단 시작: 들여쓰기 한 칸
- 대화문: "대사" 형식
- 모든 문장은 마침표로 종료

본문만 출력하세요.`;

      console.log('[AIGeneratePanel] 프롬프트 생성 완료, 길이:', prompt.length);
      console.log('[AIGeneratePanel] generateText 호출 중...');

      const response = await generateText(settings.geminiApiKey, prompt, {
        temperature: 0.85,
        maxTokens: Math.max(500, length[0] * 2),
        model: settings.planningModel || 'gemini-3-flash-preview' // 기획용 모델 사용 (씬 생성은 창의적 작업)
      });

      console.log('[AIGeneratePanel] ✅ 응답 수신 완료, 길이:', response?.length || 0);

      // 텍스트 후처리 - 소설책 형식으로 정리
      const formatNovelText = (text: string): string => {
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

          // 빈 줄은 장면 전환용으로만 유지
          if (!line) {
            if (processedLines.length > 0 && processedLines[processedLines.length - 1] !== '') {
              processedLines.push('');
            }
            continue;
          }

          // 전각 공백 중복 제거 후 하나만 추가
          line = line.replace(/^[　\s]+/, '');

          // 마침표 누락 체크
          const endsWithPunctuation = /[.。?!'"」…~,]$/.test(line);
          if (!endsWithPunctuation && line.length > 0) {
            line = line + '.';
          }

          processedLines.push('　' + line);
        }

        // 소설책처럼 문단 붙여쓰기
        let result = '';
        let prevWasEmpty = false;

        for (let i = 0; i < processedLines.length; i++) {
          const line = processedLines[i];
          if (line === '') {
            if (!prevWasEmpty) {
              result += '\n';
              prevWasEmpty = true;
            }
          } else {
            result += (result && !prevWasEmpty ? '\n' : (prevWasEmpty ? '\n' : '')) + line;
            prevWasEmpty = false;
          }
        }

        return result.trim();
      };

      const formattedContent = formatNovelText(response);
      console.log('[AIGeneratePanel] 포맷팅 완료, 최종 길이:', formattedContent?.length || 0);
      setGeneratedContent(formattedContent);
    } catch (err: unknown) {
      console.error('[AIGeneratePanel] ❌ 생성 실패:');
      console.error('[AIGeneratePanel] 오류 타입:', typeof err);
      console.error('[AIGeneratePanel] 오류 객체:', err);

      if (err instanceof Error) {
        console.error('[AIGeneratePanel] 오류 메시지:', err.message);
        console.error('[AIGeneratePanel] 오류 스택:', err.stack);
        setError(err.message);
      } else {
        setError('콘텐츠 생성에 실패했습니다. 다시 시도해주세요.');
      }
    } finally {
      console.log('[AIGeneratePanel] 생성 프로세스 종료');
      setIsGenerating(false);
    }
  };

  const handleApply = () => {
    if (generatedContent) {
      onGenerate(generatedContent);
      setGeneratedContent('');
    }
  };

  // 선택 부분 재생성
  const handleSelectionRegenerate = async () => {
    if (!settings?.geminiApiKey) {
      setError('설정에서 Gemini API 키를 먼저 등록해주세요.');
      return;
    }

    if (!selectedText || selectedText.trim().length === 0) {
      setError('재생성할 텍스트를 선택해주세요.');
      return;
    }

    setIsGenerating(true);
    setError('');
    setGeneratedContent('');

    try {
      // 선택된 텍스트 앞뒤 컨텍스트 추출
      const selectionIndex = currentContent.indexOf(selectedText);
      const beforeContext = selectionIndex > 0 ? currentContent.slice(Math.max(0, selectionIndex - 500), selectionIndex) : '';
      const afterContext = currentContent.slice(selectionIndex + selectedText.length, selectionIndex + selectedText.length + 500);

      const prompt = `당신은 한국의 베스트셀러 소설가입니다.

[작품 정보]
제목: ${currentProject?.title || '소설'}
장르: ${currentProject?.genre?.join(', ') || '일반'}

[현재 씬]
${scene.title} / 장소: ${scene.location || '미정'}

[앞 문맥]
${beforeContext || '(시작 부분)'}

[재생성할 부분 - 원본]
"""
${selectedText}
"""

[뒤 문맥]
${afterContext || '(끝 부분)'}

[추가 지시]
${selectionRegeneratePrompt || '같은 내용을 더 자연스럽고 생생하게 다시 작성해주세요.'}

[요청]
위의 "재생성할 부분"을 다시 작성해주세요.
- 앞뒤 문맥과 자연스럽게 연결되어야 합니다
- 원본의 핵심 내용/의미는 유지하되 표현을 개선해주세요
- 분량은 원본과 비슷하게 (${selectedText.length}자 내외)

[한국 소설책 형식]
- 문단 시작: 전각 공백(　)으로 들여쓰기
- 대화문: "대사" 형식
- 모든 문장은 마침표로 종료

재생성된 부분만 출력하세요. 앞뒤 문맥은 출력하지 마세요.`;

      const response = await generateText(settings.geminiApiKey, prompt, {
        temperature: 0.85,
        maxTokens: Math.max(500, selectedText.length * 2),
        model: settings.planningModel || 'gemini-3-flash-preview' // 기획용 모델 사용 (재생성은 창의적 작업)
      });

      const formattedContent = formatNovelText(response);
      setGeneratedContent(formattedContent);
    } catch (err: unknown) {
      console.error('[AIGeneratePanel] 선택 부분 재생성 실패:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('재생성에 실패했습니다. 다시 시도해주세요.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // 선택 부분 적용
  const handleApplySelection = () => {
    if (generatedContent && onReplaceSelection) {
      onReplaceSelection(generatedContent);
      setGeneratedContent('');
    }
  };

  // 씬 전체 재생성
  const handleSceneRegenerate = async () => {
    if (!settings?.geminiApiKey) {
      setError('설정에서 Gemini API 키를 먼저 등록해주세요.');
      return;
    }

    const targetScene = chapter.scenes?.find(s => s.id === sceneToRegenerate);
    if (!targetScene) {
      setError('재생성할 씬을 선택해주세요.');
      return;
    }

    setIsGenerating(true);
    setError('');
    setGeneratedContent('');

    try {
      // 이전 씬 내용 가져오기 (컨텍스트용)
      const sceneIndex = chapter.scenes?.findIndex(s => s.id === sceneToRegenerate) || 0;
      const previousScene = sceneIndex > 0 ? chapter.scenes?.[sceneIndex - 1] : null;
      const previousContent = previousScene?.content?.slice(-1000) || '';

      // 캐릭터 정보
      const characterInfo = characters
        .slice(0, 5)
        .map(c => `[${c.name}] ${c.role} - ${c.personality}`)
        .join('\n');

      const prompt = `당신은 한국의 베스트셀러 소설가입니다.

[작품 정보]
제목: ${currentProject?.title || '소설'}
장르: ${currentProject?.genre?.join(', ') || '일반'}
시놉시스: ${currentProject?.synopsis || currentProject?.logline || ''}

[등장인물]
${characterInfo || '주인공 중심'}

[챕터 ${chapter.number}장: ${chapter.title}]

[재생성할 씬: ${targetScene.title}]
- 장소: ${targetScene.location || '미정'}
- 시간: ${targetScene.timeOfDay || '미정'}
- 등장인물: ${targetScene.participants?.join(', ') || '미정'}
- 씬 목표: ${targetScene.goal || targetScene.summary || '스토리 전개'}
- 갈등/긴장: ${targetScene.conflict || ''}

${previousContent ? `[이전 씬 마지막 부분 - 이어서 작성]
"""
${previousContent}
"""
` : ''}

[추가 지시]
${sceneRegeneratePrompt || '이 씬을 처음부터 다시 작성해주세요.'}

[분량]
최소 3000자 이상, 씬의 내용을 충분히 전개해주세요.

[한국 소설책 형식]
- 문단 시작: 전각 공백(　)으로 들여쓰기
- 대화문: "대사" 형식
- 장면 전환시에만 빈 줄 사용
- 모든 문장은 마침표로 종료
- 마크다운 사용 금지

본문만 출력하세요.`;

      const response = await generateText(settings.geminiApiKey, prompt, {
        temperature: 0.85,
        maxTokens: 8192,
        model: settings.planningModel || 'gemini-3-flash-preview' // 기획용 모델 사용 (씬 재생성은 창의적 작업)
      });

      const formattedContent = formatNovelText(response);
      setGeneratedContent(formattedContent);
    } catch (err: unknown) {
      console.error('[AIGeneratePanel] 씬 재생성 실패:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('씬 재생성에 실패했습니다. 다시 시도해주세요.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // 씬 재생성 적용
  const handleApplySceneRegenerate = () => {
    if (generatedContent && onReplaceScene && sceneToRegenerate) {
      onReplaceScene(sceneToRegenerate, generatedContent);
      setGeneratedContent('');
    }
  };

  // 구조화된 집필 생성 (권/씬 기반)
  const handleStructuredGenerate = async () => {
    if (!settings?.geminiApiKey) {
      setError('설정에서 Gemini API 키를 먼저 등록해주세요.');
      return;
    }

    if (!currentProject) {
      setError('프로젝트를 선택해주세요.');
      return;
    }

    if (!selectedVolume) {
      setError('권을 선택해주세요.');
      return;
    }

    // 씬 모드인데 씬이 선택 안 됨
    if (structuredMode === 'scene' && !selectedScene) {
      setError('씬을 선택해주세요.');
      return;
    }

    setIsGenerating(true);
    setError('');
    setGeneratedContent('');

    try {
      let promptResult;
      const worldSettingsArray = worldSettings ? Object.values(worldSettings).flat() : [];

      // 프로젝트의 캐릭터 필터링 (props로 받은 characters 또는 스토어에서)
      const projectCharacters = allCharacters.filter(c => c.projectId === projectId);
      const charsToUse = projectCharacters.length > 0 ? projectCharacters : characters;

      // 프로젝트의 복선/갈등 필터링
      const projectForeshadowings = foreshadowings.filter(f => f.projectId === projectId);
      const projectConflicts = conflicts.filter(c => c.projectId === projectId);

      // v2.0: 스토리 분석 수행 (일관성 체크)
      let currentAnalysis = storyAnalysis;
      if (!currentAnalysis && projectVolumes.length > 0) {
        currentAnalysis = await performStoryAnalysis();
      }

      // v2.0: 강화된 옵션 객체
      const enhancedOptions = currentAnalysis ? {
        storyAnalysis: currentAnalysis,
      } : undefined;

      if (structuredMode === 'volume') {
        // 권 전체 생성 - 모든 기획 데이터 + 스토리 분석 포함
        promptResult = generateVolumePrompt(
          currentProject,
          selectedVolume,
          writingStyle,
          charsToUse,
          worldSettingsArray,
          plotStructure,
          projectForeshadowings,
          projectConflicts,
          previousContent || undefined,
          undefined,
          enhancedOptions
        );
      } else if (structuredMode === 'scene' && selectedScene) {
        // 씬 단위 생성 - 모든 기획 데이터 + 스토리 분석 포함
        promptResult = generateScenePrompt(
          currentProject,
          selectedVolume,
          selectedScene,
          writingStyle,
          charsToUse,
          worldSettingsArray,
          plotStructure,
          projectForeshadowings,
          projectConflicts,
          previousContent || undefined,
          undefined,
          enhancedOptions
        );
      } else if (structuredMode === 'continue' && selectedScene) {
        // 이어쓰기 - 복선/갈등 포함
        const remainingMustInclude = selectedScene.mustInclude.filter(
          item => !currentContent.includes(item)
        );
        promptResult = generateContinuePrompt(
          currentProject,
          selectedVolume,
          selectedScene,
          writingStyle,
          charsToUse,
          currentContent,
          currentContent.replace(/<[^>]*>/g, '').length,
          remainingMustInclude,
          projectForeshadowings,
          projectConflicts
        );
      } else {
        throw new Error('올바른 생성 모드를 선택해주세요.');
      }

      console.log('[AIGeneratePanel] 구조화 프롬프트 생성 완료');
      console.log('[AIGeneratePanel] 시스템 프롬프트 길이:', promptResult.systemPrompt.length);
      console.log('[AIGeneratePanel] 유저 프롬프트 길이:', promptResult.userPrompt.length);

      // 전체 프롬프트 결합
      const fullPrompt = `${promptResult.systemPrompt}\n\n---\n\n${promptResult.userPrompt}`;

      let formattedContent = '';

      // 🚨 씬 생성 시 StreamGuard를 사용한 실시간 차단 적용
      if (structuredMode === 'scene' && selectedScene) {
        console.log('[AIGeneratePanel] 🛡️ StreamGuard 실시간 차단 모드로 생성 시작');

        // 🔒 전체 캐릭터 이름 목록 (미허용 캐릭터 감지용)
        const allCharacterNames = charsToUse.map(c => c.name);
        console.log('[AIGeneratePanel] 씬 허용 캐릭터:', selectedScene.participants);
        console.log('[AIGeneratePanel] 전체 캐릭터 목록:', allCharacterNames);

        // StreamGuard 초기화
        const guard = new StreamGuard({
          scene: selectedScene,
          allCharacterNames, // 캐릭터 검증용
          strictMode: true, // 위반 시 즉시 중단
          onViolation: (violation) => {
            console.warn('[StreamGuard] 위반 감지:', violation);
            setStreamViolations(prev => [...prev, violation]);
          },
          onEndConditionMet: (content) => {
            console.log('[StreamGuard] ✅ 종료 조건 도달! 생성 중단');
          },
        });

        // 스트리밍 상태 초기화
        setStreamingContent('');
        setStreamViolations([]);
        setStreamGuardResult(null);

        // 🔒🔒🔒 스트리밍 생성 시작 - 토큰 수를 매우 엄격하게 제한! 🔒🔒🔒
        // 핵심: 분량보다 종료조건이 더 중요하므로, maxTokens를 낮게 설정!
        // 18,000자 같은 높은 목표를 무시하고 5,000 토큰으로 강제 제한
        // 이렇게 하면 AI가 미래 이야기를 쓸 공간이 없어짐
        const MAX_TOKENS_HARD_LIMIT = 5000; // 절대 상한선
        const maxTokensForScene = Math.min(MAX_TOKENS_HARD_LIMIT, Math.floor(promptResult.metadata.targetWordCount / 3));
        console.log('[AIGeneratePanel] 🔒🔒🔒 maxTokens 강제 제한:', maxTokensForScene);
        console.log('[AIGeneratePanel] 목표 글자수:', promptResult.metadata.targetWordCount, '→ 실제 토큰:', maxTokensForScene);
        console.log('[AIGeneratePanel] ⚠️ 분량보다 종료조건 우선! 종료조건 도달 시 중단됨');

        // 🔒 집필용 모델 사용! (planningModel이 아닌 writingModel)
        const writingModelToUse = settings.writingModel || 'gemini-2.5-flash';
        console.log('[AIGeneratePanel] 🎯 집필 모델:', writingModelToUse);

        const stream = generateTextStream(settings.geminiApiKey, fullPrompt, {
          temperature: 0.7, // 0.8 → 0.7로 낮춰서 더 예측 가능하게
          maxTokens: maxTokensForScene,
          model: writingModelToUse,
        });

        // 스트리밍 처리 + 실시간 차단
        for await (const chunk of stream) {
          const result = guard.processChunk(chunk);

          // UI 업데이트 (실시간 표시)
          setStreamingContent(prev => prev + result.processedChunk);

          // 차단되면 즉시 중단
          if (!result.shouldContinue) {
            console.log('[AIGeneratePanel] 🛑 StreamGuard에 의해 생성 중단됨');
            break;
          }
        }

        // 최종 결과 가져오기
        const guardResult = guard.getResult();
        setStreamGuardResult(guardResult);

        console.log('[AIGeneratePanel] StreamGuard 결과:', {
          wasTerminated: guardResult.wasTerminated,
          terminationReason: guardResult.terminationReason,
          endConditionReached: guardResult.endConditionReached,
          violationsCount: guardResult.violations.length,
          contentLength: guardResult.content.length,
        });

        // 텍스트 후처리
        formattedContent = formatNovelText(guardResult.content);

        // 추가 검증 (sceneValidator 사용)
        const validation = validateSceneContent(formattedContent, selectedScene);
        setValidationResult(validation);

        console.log('[AIGeneratePanel] 최종 검증 결과:', formatValidationResult(validation));

        // 결과 요약 메시지
        if (guardResult.wasTerminated && guardResult.endConditionReached) {
          // 정상 종료 - 종료 조건 도달
          setError(''); // 에러 없음
        } else if (guardResult.wasTerminated && !guardResult.endConditionReached) {
          // 위반으로 인한 강제 중단
          setError(`⚠️ 생성 중단: ${guardResult.terminationReason}\n위반 ${guardResult.violations.length}건 감지됨`);
        } else if (!validation.isValid) {
          // 후처리 검증 실패
          const criticalViolations = validation.violations
            .filter(v => v.severity === 'critical')
            .map(v => v.description);
          setError([
            `⚠️ 씬 설정 위반 감지! (점수: ${validation.score}/100)`,
            ...criticalViolations.slice(0, 3),
          ].join('\n'));
        }

      } else {
        // 권 전체/이어쓰기는 기존 방식 사용 - 집필용 모델 사용!
        const writingModelForVolume = settings.writingModel || 'gemini-2.5-flash';
        console.log('[AIGeneratePanel] 🎯 권 집필 모델:', writingModelForVolume);

        const response = await generateText(settings.geminiApiKey, fullPrompt, {
          temperature: 0.7,
          maxTokens: Math.min(16000, promptResult.metadata.targetWordCount),
          model: writingModelForVolume,
        });
        formattedContent = formatNovelText(response);
        setValidationResult(null);
      }

      setGeneratedContent(formattedContent);
      setStreamingContent(''); // 스트리밍 표시 초기화

      // 글자수 업데이트
      if (selectedScene && structuredMode !== 'volume') {
        const wordCount = formattedContent.length;
        await updateWordCount(selectedScene.id, wordCount);
      }

    } catch (err: unknown) {
      console.error('[AIGeneratePanel] 구조화 생성 실패:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('콘텐츠 생성에 실패했습니다. 다시 시도해주세요.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // 소설책 형식으로 텍스트 정리 + 빈 괄호 제거 강화
  const formatNovelText = (text: string): string => {
    // 1단계: cleanGeneratedText로 기본 정리 (빈 괄호, 깨진 문자 등)
    let formatted = cleanGeneratedText(text);

    // 2단계: 추가 빈 괄호 제거 (더 강화)
    // 한글 단어 뒤의 빈 괄호 제거 (예: "성웅()" → "성웅")
    formatted = formatted.replace(/([가-힣]+)\s*\(\s*\)/g, '$1');
    // 영어 단어 뒤의 빈 괄호 제거
    formatted = formatted.replace(/([a-zA-Z]+)\s*\(\s*\)/g, '$1');
    // 숫자 뒤의 빈 괄호 제거
    formatted = formatted.replace(/(\d+)\s*\(\s*\)/g, '$1');
    // 빈 괄호만 단독으로 있는 경우 제거
    formatted = formatted.replace(/\s*\(\s*\)\s*/g, ' ');
    // 여러 개의 연속 공백 정리
    formatted = formatted.replace(/\s{2,}/g, ' ');

    // 특수문자 구분선 제거
    formatted = formatted.replace(/^[\*\-\=\#\_]{2,}\s*$/gm, '');
    formatted = formatted.replace(/^\*{3,}.*$/gm, '');
    formatted = formatted.replace(/^-{3,}.*$/gm, '');
    formatted = formatted.replace(/^={3,}.*$/gm, '');

    // **강조** 제거
    formatted = formatted.replace(/\*{1,2}([^*]+)\*{1,2}/g, '$1');

    // 따옴표 정리
    formatted = formatted.replace(/"\s+/g, '"');
    formatted = formatted.replace(/\s+"/g, '"');
    formatted = formatted.replace(/"/g, '"');
    formatted = formatted.replace(/"/g, '"');

    // 줄 단위 처리
    const lines = formatted.split('\n');
    const processedLines: string[] = [];

    for (const line of lines) {
      let processedLine = line.trim();
      if (!processedLine) {
        if (processedLines.length > 0 && processedLines[processedLines.length - 1] !== '') {
          processedLines.push('');
        }
        continue;
      }

      processedLine = processedLine.replace(/^[　\s]+/, '');
      const endsWithPunctuation = /[.。?!'"」…~,]$/.test(processedLine);
      if (!endsWithPunctuation && processedLine.length > 0) {
        processedLine = processedLine + '.';
      }
      processedLines.push('　' + processedLine);
    }

    // 결과 조합
    let result = '';
    let prevWasEmpty = false;
    for (const line of processedLines) {
      if (line === '') {
        if (!prevWasEmpty) {
          result += '\n';
          prevWasEmpty = true;
        }
      } else {
        result += (result && !prevWasEmpty ? '\n' : (prevWasEmpty ? '\n' : '')) + line;
        prevWasEmpty = false;
      }
    }

    // 최종 빈 괄호 한번 더 제거 (안전장치)
    result = result.replace(/([가-힣a-zA-Z0-9])\s*\(\s*\)/g, '$1');

    return result.trim();
  };

  // 기존 validateGeneratedSceneContent는 sceneValidator.ts의 validateSceneContent로 대체됨
  // 더 강력한 씬 설정 강제 검증 (시작/종료 조건, mustInclude, 범위, 시간점프 등)

  const toggleCharacter = (characterId: string) => {
    setSelectedCharacters((prev) =>
      prev.includes(characterId) ? prev.filter((id) => id !== characterId) : [...prev, characterId]
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Wand2 className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">AI 글쓰기 도우미</h2>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* 탭 선택 */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'quick' | 'selection' | 'scene' | 'structured')} className="flex-1 flex flex-col">
        <div className="px-4 pt-2">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="quick" className="gap-1 text-xs px-2">
              <Sparkles className="h-3 w-3" />
              빠른 생성
            </TabsTrigger>
            <TabsTrigger value="selection" className="gap-1 text-xs px-2">
              <Type className="h-3 w-3" />
              선택 재생성
            </TabsTrigger>
            <TabsTrigger value="scene" className="gap-1 text-xs px-2">
              <FileText className="h-3 w-3" />
              씬 재생성
            </TabsTrigger>
            <TabsTrigger value="structured" className="gap-1 text-xs px-2">
              <Layers className="h-3 w-3" />
              구조화
            </TabsTrigger>
          </TabsList>
        </div>

        {/* 빠른 생성 탭 */}
        <TabsContent value="quick" className="flex-1 mt-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-6">
              {/* 생성 유형 선택 */}
              <div className="space-y-3">
                <Label>생성 유형</Label>
                <div className="grid grid-cols-2 gap-2">
                  {generationTypes.map((type) => (
                    <button
                      key={type.value}
                      className={`flex items-center gap-2 p-3 rounded-lg border text-left transition-colors ${
                        generationType === type.value
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:bg-muted'
                      }`}
                      onClick={() => setGenerationType(type.value)}
                    >
                      {type.icon}
                      <div>
                        <div className="font-medium text-sm">{type.label}</div>
                      </div>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {generationTypes.find((t) => t.value === generationType)?.description}
                </p>
              </div>

              {/* 등장인물 선택 */}
              {characters.length > 0 && (
                <div className="space-y-2">
                  <Label>등장인물 (선택)</Label>
                  <div className="flex flex-wrap gap-2">
                    {characters.map((character) => (
                      <Badge
                        key={character.id}
                        variant={selectedCharacters.includes(character.id) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        style={{
                          borderColor: character.color,
                          backgroundColor: selectedCharacters.includes(character.id)
                            ? character.color
                            : 'transparent',
                          color: selectedCharacters.includes(character.id) ? 'white' : character.color,
                        }}
                        onClick={() => toggleCharacter(character.id)}
                      >
                        {character.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* 분위기 */}
              <div className="space-y-2">
                <Label>분위기</Label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {toneOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 길이 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>목표 길이</Label>
                  <span className="text-sm text-muted-foreground">{length[0]}자</span>
                </div>
                <Slider value={length} onValueChange={setLength} min={50} max={500} step={50} />
              </div>

              {/* 추가 지시 */}
              <div className="space-y-2">
                <Label>추가 지시 (선택)</Label>
                <Textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="예: 긴장감 있게, 감정적으로, 특정 상황 묘사..."
                  rows={2}
                />
              </div>

              {/* 생성 버튼 */}
              <Button
                className="w-full gap-2"
                onClick={handleGenerate}
                disabled={isGenerating || !settings?.geminiApiKey}
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    생성 중...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    생성하기
                  </>
                )}
              </Button>

              {error && <p className="text-sm text-destructive">{error}</p>}

              {/* 생성된 내용 */}
              {generatedContent && (
                <div className="space-y-3">
                  <Label>생성된 내용</Label>
                  <div className="p-4 rounded-lg bg-muted/50 border max-h-60 overflow-y-auto">
                    <p className="text-sm whitespace-pre-wrap">{generatedContent}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={handleGenerate}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      다시 생성
                    </Button>
                    <Button className="flex-1" onClick={handleApply}>
                      적용하기
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* 선택 부분 재생성 탭 */}
        <TabsContent value="selection" className="flex-1 mt-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-6">
              {/* 선택된 텍스트 표시 */}
              <div className="space-y-2">
                <Label>선택된 텍스트</Label>
                {selectedText ? (
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 max-h-40 overflow-y-auto">
                    <p className="text-sm whitespace-pre-wrap">{selectedText}</p>
                    <p className="text-xs text-muted-foreground mt-2">{selectedText.length}자 선택됨</p>
                  </div>
                ) : (
                  <Alert>
                    <Type className="h-4 w-4" />
                    <AlertTitle>텍스트를 선택해주세요</AlertTitle>
                    <AlertDescription>
                      에디터에서 재생성하고 싶은 부분을 드래그해서 선택하세요.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {/* 재생성 지시 */}
              <div className="space-y-2">
                <Label>재생성 지시 (선택)</Label>
                <Textarea
                  value={selectionRegeneratePrompt}
                  onChange={(e) => setSelectionRegeneratePrompt(e.target.value)}
                  placeholder="예: 더 긴장감 있게, 대화를 추가해서, 묘사를 더 풍부하게..."
                  rows={2}
                />
              </div>

              {/* 재생성 버튼 */}
              <Button
                className="w-full gap-2"
                onClick={handleSelectionRegenerate}
                disabled={isGenerating || !settings?.geminiApiKey || !selectedText}
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    재생성 중...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    선택 부분 재생성
                  </>
                )}
              </Button>

              {error && <p className="text-sm text-destructive">{error}</p>}

              {/* 생성된 내용 */}
              {generatedContent && (
                <div className="space-y-3">
                  <Label>재생성된 내용</Label>
                  <div className="p-4 rounded-lg bg-muted/50 border max-h-60 overflow-y-auto">
                    <p className="text-sm whitespace-pre-wrap">{generatedContent}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={handleSelectionRegenerate}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      다시 생성
                    </Button>
                    <Button className="flex-1" onClick={handleApplySelection} disabled={!onReplaceSelection}>
                      선택 부분 교체
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* 씬 전체 재생성 탭 */}
        <TabsContent value="scene" className="flex-1 mt-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-6">
              {/* 씬 선택 */}
              <div className="space-y-2">
                <Label>재생성할 씬 선택</Label>
                {chapter.scenes && chapter.scenes.length > 0 ? (
                  <Select value={sceneToRegenerate} onValueChange={setSceneToRegenerate}>
                    <SelectTrigger>
                      <SelectValue placeholder="씬을 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {chapter.scenes.map((sc, index) => (
                        <SelectItem key={sc.id} value={sc.id}>
                          씬 {index + 1}: {sc.title || `씬 ${index + 1}`} ({sc.wordCount.toLocaleString()}자)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Alert>
                    <FileText className="h-4 w-4" />
                    <AlertTitle>씬이 없습니다</AlertTitle>
                    <AlertDescription>
                      먼저 씬을 생성해주세요.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {/* 선택된 씬 정보 */}
              {sceneToRegenerate && chapter.scenes && (
                <Card className="bg-muted/30">
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      선택된 씬 정보
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-2 space-y-1 text-xs">
                    {(() => {
                      const selectedSceneData = chapter.scenes.find(s => s.id === sceneToRegenerate);
                      if (!selectedSceneData) return null;
                      return (
                        <>
                          <div><strong>제목:</strong> {selectedSceneData.title}</div>
                          <div><strong>장소:</strong> {selectedSceneData.location || '미정'}</div>
                          <div><strong>현재 분량:</strong> {selectedSceneData.wordCount.toLocaleString()}자</div>
                          {selectedSceneData.goal && <div><strong>목표:</strong> {selectedSceneData.goal}</div>}
                        </>
                      );
                    })()}
                  </CardContent>
                </Card>
              )}

              {/* 재생성 지시 */}
              <div className="space-y-2">
                <Label>재생성 지시 (선택)</Label>
                <Textarea
                  value={sceneRegeneratePrompt}
                  onChange={(e) => setSceneRegeneratePrompt(e.target.value)}
                  placeholder="예: 전투 장면을 더 역동적으로, 감정 묘사를 강화해서, 대화를 늘려서..."
                  rows={3}
                />
              </div>

              {/* 재생성 버튼 */}
              <Button
                className="w-full gap-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                onClick={handleSceneRegenerate}
                disabled={isGenerating || !settings?.geminiApiKey || !sceneToRegenerate}
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    씬 재생성 중...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    씬 전체 재생성
                  </>
                )}
              </Button>

              <p className="text-xs text-muted-foreground">
                ⚠️ 씬 전체 재생성은 기존 내용을 완전히 대체합니다.
              </p>

              {error && <p className="text-sm text-destructive">{error}</p>}

              {/* 생성된 내용 */}
              {generatedContent && (
                <div className="space-y-3">
                  <Label>재생성된 씬 내용</Label>
                  <div className="p-4 rounded-lg bg-muted/50 border max-h-60 overflow-y-auto">
                    <p className="text-sm whitespace-pre-wrap">{generatedContent}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={handleSceneRegenerate}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      다시 생성
                    </Button>
                    <Button
                      className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                      onClick={handleApplySceneRegenerate}
                      disabled={!onReplaceScene}
                    >
                      씬 교체 적용
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* 구조화 집필 탭 */}
        <TabsContent value="structured" className="flex-1 mt-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-6">
              {/* 권/씬 미설정 안내 */}
              {projectVolumes.length === 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>권 구조가 없습니다</AlertTitle>
                  <AlertDescription>
                    구조화 집필을 사용하려면 먼저 &quot;권 구조 관리&quot;에서 권과 씬을 설정해주세요.
                    권/씬 기반 집필은 AI가 정확한 분량과 종료점을 지키도록 합니다.
                  </AlertDescription>
                </Alert>
              )}

              {/* 권 선택 */}
              {projectVolumes.length > 0 && (
                <>
                  <div className="space-y-2">
                    <Label>권 선택</Label>
                    <Select value={selectedVolumeId} onValueChange={setSelectedVolumeId}>
                      <SelectTrigger>
                        <SelectValue placeholder="권을 선택하세요" />
                      </SelectTrigger>
                      <SelectContent>
                        {projectVolumes.map((vol) => (
                          <SelectItem key={vol.id} value={vol.id}>
                            {vol.volumeNumber}권: {vol.title} ({vol.actualWordCount.toLocaleString()}/{vol.targetWordCount.toLocaleString()}자)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 진행 상황 표시 */}
                  {volumeProgress && (
                    <Card>
                      <CardHeader className="py-3">
                        <CardTitle className="text-sm">진행 상황</CardTitle>
                      </CardHeader>
                      <CardContent className="py-2 space-y-2">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>씬: {volumeProgress.completedScenes}/{volumeProgress.totalScenes}</span>
                          <span>{volumeProgress.progressPercentage}%</span>
                        </div>
                        <Progress value={volumeProgress.progressPercentage} className="h-2" />
                        <div className="text-xs text-muted-foreground">
                          {volumeProgress.actualWordCount.toLocaleString()} / {volumeProgress.targetWordCount.toLocaleString()}자
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* 종료점 검증 경고 */}
                  {endPointValidation && !endPointValidation.isValid && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>종료점 검증 실패</AlertTitle>
                      <AlertDescription>
                        <ul className="list-disc list-inside text-xs mt-1">
                          {endPointValidation.issues.slice(0, 3).map((issue, i) => (
                            <li key={i}>{issue}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* 씬 선택 (권 선택 후) */}
                  {selectedVolume && selectedVolume.scenes.length > 0 && (
                    <div className="space-y-2">
                      <Label>씬 선택</Label>
                      <Select value={selectedSceneId} onValueChange={setSelectedSceneId}>
                        <SelectTrigger>
                          <SelectValue placeholder="씬을 선택하세요" />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedVolume.scenes.map((sc) => (
                            <SelectItem key={sc.id} value={sc.id}>
                              씬 {sc.sceneNumber}: {sc.title} ({sc.status === 'completed' ? '완료' : sc.status === 'in_progress' ? '진행중' : '대기'})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* 선택된 씬 정보 */}
                  {selectedScene && (
                    <Card className="bg-muted/30">
                      <CardHeader className="py-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          씬 {selectedScene.sceneNumber} 정보
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="py-2 space-y-2 text-xs">
                        <div><strong>장소:</strong> {selectedScene.location || '미정'}</div>
                        <div><strong>시간:</strong> {selectedScene.timeframe || '미정'}</div>
                        <div><strong>목표:</strong> {selectedScene.targetWordCount.toLocaleString()}자</div>

                        {/* 🔒 등장인물 표시 (핵심!) */}
                        <div className={`p-2 rounded border ${
                          selectedScene.participants && selectedScene.participants.length > 0
                            ? 'bg-blue-500/10 border-blue-500/20'
                            : 'bg-red-500/10 border-red-500/20'
                        }`}>
                          <strong className={
                            selectedScene.participants && selectedScene.participants.length > 0
                              ? 'text-blue-700 dark:text-blue-400'
                              : 'text-red-700 dark:text-red-400'
                          }>
                            👥 등장인물:
                          </strong>
                          {selectedScene.participants && selectedScene.participants.length > 0 ? (
                            <span className="ml-1">{selectedScene.participants.join(', ')}</span>
                          ) : (
                            <span className="ml-1 text-red-600">⚠️ 미설정 (씬 편집에서 설정 필요!)</span>
                          )}
                        </div>

                        <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded text-amber-700 dark:text-amber-400">
                          <strong>종료 조건:</strong> {selectedScene.endCondition || '(미설정)'}
                        </div>
                        {selectedScene.mustInclude.length > 0 && (
                          <div>
                            <strong>필수 포함:</strong>
                            <ul className="list-disc list-inside ml-2">
                              {selectedScene.mustInclude.map((item, i) => (
                                <li key={i}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* 생성 모드 선택 */}
                  <div className="space-y-2">
                    <Label>생성 모드</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        className={`p-3 rounded-lg border text-center transition-colors ${
                          structuredMode === 'scene' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted'
                        }`}
                        onClick={() => setStructuredMode('scene')}
                      >
                        <BookOpen className="h-4 w-4 mx-auto mb-1" />
                        <div className="text-xs font-medium">씬 생성</div>
                      </button>
                      <button
                        className={`p-3 rounded-lg border text-center transition-colors ${
                          structuredMode === 'continue' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted'
                        }`}
                        onClick={() => setStructuredMode('continue')}
                      >
                        <Play className="h-4 w-4 mx-auto mb-1" />
                        <div className="text-xs font-medium">이어쓰기</div>
                      </button>
                      <button
                        className={`p-3 rounded-lg border text-center transition-colors ${
                          structuredMode === 'volume' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted'
                        }`}
                        onClick={() => setStructuredMode('volume')}
                      >
                        <Layers className="h-4 w-4 mx-auto mb-1" />
                        <div className="text-xs font-medium">권 전체</div>
                      </button>
                    </div>
                  </div>

                  {/* 문체 설정 */}
                  <div className="space-y-3">
                    <Label>문체 설정</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">시점</Label>
                        <Select
                          value={writingStyle.perspective}
                          onValueChange={(v) => setWritingStyle({ ...writingStyle, perspective: v as WritingStyle['perspective'] })}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="first">1인칭</SelectItem>
                            <SelectItem value="third-limited">3인칭 제한</SelectItem>
                            <SelectItem value="omniscient">전지적 시점</SelectItem>
                            <SelectItem value="second">2인칭</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">시제</Label>
                        <Select
                          value={writingStyle.tense}
                          onValueChange={(v) => setWritingStyle({ ...writingStyle, tense: v as WritingStyle['tense'] })}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="past">과거형</SelectItem>
                            <SelectItem value="present">현재형</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">페이싱</Label>
                        <Select
                          value={writingStyle.pacing}
                          onValueChange={(v) => setWritingStyle({ ...writingStyle, pacing: v as WritingStyle['pacing'] })}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="slow">느림</SelectItem>
                            <SelectItem value="moderate">보통</SelectItem>
                            <SelectItem value="fast">빠름</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">대사 비율: {writingStyle.dialogueRatio}%</Label>
                        <Slider
                          value={[writingStyle.dialogueRatio]}
                          onValueChange={(v) => setWritingStyle({ ...writingStyle, dialogueRatio: v[0] })}
                          min={10}
                          max={80}
                          step={5}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 이전 내용 (이어쓰기용) */}
                  {structuredMode === 'continue' && (
                    <div className="space-y-2">
                      <Label>이전 내용 요약 (선택)</Label>
                      <Textarea
                        value={previousContent}
                        onChange={(e) => setPreviousContent(e.target.value)}
                        placeholder="직전에 쓴 내용의 마지막 부분을 붙여넣으세요..."
                        rows={3}
                      />
                    </div>
                  )}

                  {/* 생성 버튼 */}
                  <Button
                    className="w-full gap-2"
                    onClick={handleStructuredGenerate}
                    disabled={isGenerating || !settings?.geminiApiKey || !selectedVolumeId || (structuredMode === 'scene' && !selectedSceneId)}
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        생성 중...
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-4 w-4" />
                        구조화 생성
                      </>
                    )}
                  </Button>

                  {error && <p className="text-sm text-destructive whitespace-pre-line">{error}</p>}

                  {/* 검증 결과 표시 - 강화된 씬 설정 검증 */}
                  {validationResult && !validationResult.isValid && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>⛔ 씬 설정 위반 감지! (점수: {validationResult.score}/100)</AlertTitle>
                      <AlertDescription>
                        <ul className="list-disc list-inside text-xs mt-1 space-y-1">
                          {validationResult.violations.slice(0, 5).map((violation, i) => (
                            <li key={i} className={
                              violation.severity === 'critical' ? 'text-red-600 font-bold' :
                              violation.severity === 'major' ? 'text-orange-600' : 'text-yellow-600'
                            }>
                              [{violation.severity}] {violation.description}
                            </li>
                          ))}
                        </ul>
                        {validationResult.suggestions.length > 0 && (
                          <div className="mt-2 text-xs">
                            <p className="font-semibold">💡 제안:</p>
                            <ul className="list-disc list-inside">
                              {validationResult.suggestions.slice(0, 2).map((s, i) => (
                                <li key={i}>{s}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/30 rounded text-xs">
                          <p>📋 세부 검증:</p>
                          <p>- 시작 조건: {validationResult.startConditionCheck.passed ? '✓' : '✗'}</p>
                          <p>- 종료 조건: {validationResult.endConditionCheck.passed ? '✓' : '✗'} (유사도: {((validationResult.endConditionCheck.similarity || 0) * 100).toFixed(0)}%)</p>
                          <p>- 필수 내용: {validationResult.mustIncludeCheck.foundItems}/{validationResult.mustIncludeCheck.totalItems} 포함</p>
                          <p>- 시간 점프: {validationResult.timeJumpCheck.passed ? '✓' : `✗ (${validationResult.timeJumpCheck.jumpCount}개)`}</p>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  {validationResult && validationResult.warnings.length > 0 && validationResult.isValid && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <AlertTitle className="text-yellow-700">경고 ({validationResult.warnings.length}개)</AlertTitle>
                      <AlertDescription>
                        <ul className="list-disc list-inside text-xs mt-1">
                          {validationResult.warnings.slice(0, 3).map((warn, i) => (
                            <li key={i}>{warn.description}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* 🔴 실시간 스트리밍 표시 (생성 중) */}
                  {isGenerating && streamingContent && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="flex items-center gap-2">
                          <span className="animate-pulse">🔴</span> 실시간 생성 중...
                          <span className="text-xs text-muted-foreground">
                            ({streamingContent.length.toLocaleString()}자)
                          </span>
                        </Label>
                        {streamViolations.length > 0 && (
                          <Badge variant="destructive">
                            ⚠ 위반 {streamViolations.length}건 감지
                          </Badge>
                        )}
                      </div>
                      <div className="p-4 rounded-lg border bg-muted/50 max-h-60 overflow-y-auto">
                        <p className="text-sm whitespace-pre-wrap">{streamingContent}</p>
                      </div>
                      {streamViolations.length > 0 && (
                        <Alert variant="destructive">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertTitle>실시간 위반 감지</AlertTitle>
                          <AlertDescription>
                            <ul className="text-xs mt-1 space-y-1">
                              {streamViolations.slice(-3).map((v, i) => (
                                <li key={i}>
                                  [{v.type}] {v.description}
                                  {v.detectedText && (
                                    <span className="text-muted-foreground"> - &quot;{v.detectedText.slice(0, 30)}...&quot;</span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )}

                  {/* StreamGuard 결과 표시 */}
                  {streamGuardResult && streamGuardResult.wasTerminated && (
                    <Alert variant={streamGuardResult.endConditionReached ? 'default' : 'destructive'}>
                      {streamGuardResult.endConditionReached ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <AlertTriangle className="h-4 w-4" />
                      )}
                      <AlertTitle>
                        {streamGuardResult.endConditionReached
                          ? '✅ 종료 조건 도달 - 정상 중단'
                          : `⚠️ 강제 중단: ${streamGuardResult.terminationReason}`}
                      </AlertTitle>
                      <AlertDescription className="text-xs">
                        생성된 글자수: {streamGuardResult.content.length.toLocaleString()}자
                        {streamGuardResult.violations.length > 0 && (
                          <span> | 위반 {streamGuardResult.violations.length}건</span>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* 생성된 내용 */}
                  {generatedContent && !isGenerating && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>생성된 내용</Label>
                        <div className="flex items-center gap-2">
                          {streamGuardResult?.endConditionReached && (
                            <Badge variant="outline" className="text-green-600">
                              ✓ 종료조건 도달
                            </Badge>
                          )}
                          {validationResult && (
                            <Badge variant={validationResult.isValid ? 'default' : 'destructive'}>
                              {validationResult.isValid
                                ? `✓ 검증 통과 (${validationResult.score}/100)`
                                : `⚠ 검증 실패 (${validationResult.score}/100)`}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className={`p-4 rounded-lg border max-h-60 overflow-y-auto ${
                        validationResult && !validationResult.isValid
                          ? 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800'
                          : streamGuardResult?.endConditionReached
                            ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800'
                            : 'bg-muted/50'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap">{generatedContent}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" className="flex-1" onClick={handleStructuredGenerate}>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          다시 생성
                        </Button>
                        <Button
                          className="flex-1"
                          onClick={handleApply}
                          variant={validationResult && !validationResult.isValid ? 'destructive' : 'default'}
                        >
                          {validationResult && !validationResult.isValid ? '⚠ 그래도 적용' : '적용하기'}
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
