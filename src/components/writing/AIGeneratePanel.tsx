'use client';

import { useState, useEffect, useMemo } from 'react';
import { Wand2, X, RefreshCw, Sparkles, MessageSquare, BookOpen, Lightbulb, Target, Copy, CheckCircle, AlertTriangle, Layers, Play } from 'lucide-react';
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
import { generateText } from '@/lib/gemini';
import {
  generateVolumePrompt,
  generateScenePrompt,
  generateContinuePrompt,
  generateSystemPrompt,
} from '@/lib/promptGenerator';
import { Chapter, Scene, Character, VolumeStructure, SceneStructure, WritingStyle } from '@/types';

interface AIGeneratePanelProps {
  projectId: string;
  chapter: Chapter;
  scene: Scene;
  characters: Character[];
  currentContent: string;
  onGenerate: (content: string) => void;
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
  onGenerate,
  onClose,
}: AIGeneratePanelProps) {
  const { settings } = useSettingsStore();
  const { currentProject } = useProjectStore();
  const { volumes, currentVolume, currentScene, setCurrentVolume, setCurrentScene, validateVolumeEndPoints, updateWordCount, getVolumeProgress } = useVolumeStore();
  const { settings: worldSettings } = useWorldStore();

  // 탭 모드: 'quick' = 기존 빠른 생성, 'structured' = 권/씬 기반 구조화 생성
  const [activeTab, setActiveTab] = useState<'quick' | 'structured'>('quick');

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
      const selectedChars = characters.filter((c) => selectedCharacters.includes(c.id));
      const characterInfo = selectedChars
        .map(
          (c) => `
- ${c.name} (${c.role}): ${c.personality}
  말투: 경어 ${c.speechPattern.formalityLevel}/5, ${c.speechPattern.tone || '보통'}`
        )
        .join('\n');

      const lastParagraphs = currentContent
        .split('</p>')
        .slice(-3)
        .join('</p>')
        .replace(/<[^>]*>/g, '')
        .trim();

      let typeSpecificPrompt = '';
      switch (generationType) {
        case 'continue':
          typeSpecificPrompt = '현재 내용에서 자연스럽게 이어지도록 다음 장면을 작성해주세요.';
          break;
        case 'dialogue':
          typeSpecificPrompt = `등장인물들 간의 대화를 작성해주세요. 각 캐릭터의 말투와 성격이 드러나야 합니다.
대화 형식: 큰따옴표로 대사를 감싸고, 필요시 지문을 추가합니다.`;
          break;
        case 'description':
          typeSpecificPrompt = '장면의 분위기, 배경, 인물의 감정이나 외양을 생생하게 묘사해주세요.';
          break;
        case 'action':
          typeSpecificPrompt = '역동적이고 긴장감 있는 액션 장면을 작성해주세요. 동작과 움직임을 구체적으로 묘사합니다.';
          break;
        case 'rewrite':
          typeSpecificPrompt = '마지막 부분을 다른 관점이나 표현으로 다시 작성해주세요.';
          break;
        case 'expand':
          typeSpecificPrompt = '마지막 부분을 더 풍부하고 상세하게 확장해주세요.';
          break;
      }

      const prompt = `당신은 한국의 베스트셀러 소설가입니다.

[작품 정보]
제목: ${currentProject?.title || '제목 없음'}
장르: ${currentProject?.genre?.join(', ') || '일반'}

[챕터] ${chapter.title}
[씬] ${scene.title} / 장소: ${scene.location || '미정'}

[등장인물]
${characterInfo || '등장인물 정보 없음'}

[현재 내용]
${lastParagraphs || '(시작 부분)'}

[요청]
- 유형: ${generationTypes.find((t) => t.value === generationType)?.label}
- 분위기: ${toneOptions.find((t) => t.value === tone)?.label || '중립적'}
- 분량: ${length[0]}자 이상
${customPrompt ? `- 추가: ${customPrompt}` : ''}

[지시사항]
${typeSpecificPrompt}

[한국 소설책 형식 - 필수]
실제 출판되는 한국 소설책처럼 작성하세요:
- 문단 시작: 들여쓰기 한 칸
- 대화문: "대사" 형식, 따옴표 안에 불필요한 공백 금지
- 지문: 대사 뒤에 바로 붙이거나 다음 줄에 작성
- 장면 전환시에만 빈 줄 사용 (문단마다 빈 줄 넣지 않음)
- 모든 문장은 마침표로 종료
- 특수문자(*, #, -, =) 금지

[예시]
　그녀는 창가에 서서 멍하니 밖을 바라보았다. 하늘에는 붉은 노을이 번지고 있었다.
　"뭘 그렇게 보고 있어?" 뒤에서 그의 목소리가 들려왔다.
　그녀는 고개를 돌렸다. "그냥, 노을이 예뻐서." 그녀는 미소를 지으며 대답했다.

본문만 출력하세요.`;

      console.log('[AIGeneratePanel] 프롬프트 생성 완료, 길이:', prompt.length);
      console.log('[AIGeneratePanel] generateText 호출 중...');

      const response = await generateText(settings.geminiApiKey, prompt, {
        temperature: 0.85,
        maxTokens: Math.max(500, length[0] * 2),
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

      if (structuredMode === 'volume') {
        // 권 전체 생성
        promptResult = generateVolumePrompt(
          currentProject,
          selectedVolume,
          writingStyle,
          characters,
          worldSettingsArray,
          previousContent || undefined
        );
      } else if (structuredMode === 'scene' && selectedScene) {
        // 씬 단위 생성
        promptResult = generateScenePrompt(
          currentProject,
          selectedVolume,
          selectedScene,
          writingStyle,
          characters,
          previousContent || undefined
        );
      } else if (structuredMode === 'continue' && selectedScene) {
        // 이어쓰기
        const remainingMustInclude = selectedScene.mustInclude.filter(
          item => !currentContent.includes(item)
        );
        promptResult = generateContinuePrompt(
          currentProject,
          selectedVolume,
          selectedScene,
          writingStyle,
          currentContent,
          currentContent.replace(/<[^>]*>/g, '').length,
          remainingMustInclude
        );
      } else {
        throw new Error('올바른 생성 모드를 선택해주세요.');
      }

      console.log('[AIGeneratePanel] 구조화 프롬프트 생성 완료');
      console.log('[AIGeneratePanel] 시스템 프롬프트 길이:', promptResult.systemPrompt.length);
      console.log('[AIGeneratePanel] 유저 프롬프트 길이:', promptResult.userPrompt.length);

      // 전체 프롬프트 결합
      const fullPrompt = `${promptResult.systemPrompt}\n\n---\n\n${promptResult.userPrompt}`;

      const response = await generateText(settings.geminiApiKey, fullPrompt, {
        temperature: 0.8,
        maxTokens: Math.min(32000, promptResult.metadata.targetWordCount * 2),
      });

      // 텍스트 후처리
      const formattedContent = formatNovelText(response);
      setGeneratedContent(formattedContent);

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

  // 소설책 형식으로 텍스트 정리
  const formatNovelText = (text: string): string => {
    let formatted = text.trim();

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

    return result.trim();
  };

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

      {/* 탭 선택: 빠른 생성 vs 구조화 생성 */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'quick' | 'structured')} className="flex-1 flex flex-col">
        <div className="px-4 pt-2">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="quick" className="gap-2">
              <Sparkles className="h-4 w-4" />
              빠른 생성
            </TabsTrigger>
            <TabsTrigger value="structured" className="gap-2">
              <Layers className="h-4 w-4" />
              구조화 집필
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

                  {error && <p className="text-sm text-destructive">{error}</p>}

                  {/* 생성된 내용 */}
                  {generatedContent && (
                    <div className="space-y-3">
                      <Label>생성된 내용</Label>
                      <div className="p-4 rounded-lg bg-muted/50 border max-h-60 overflow-y-auto">
                        <p className="text-sm whitespace-pre-wrap">{generatedContent}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" className="flex-1" onClick={handleStructuredGenerate}>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          다시 생성
                        </Button>
                        <Button className="flex-1" onClick={handleApply}>
                          적용하기
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
