'use client';

import { useState } from 'react';
import { Wand2, X, RefreshCw, Sparkles, MessageSquare, BookOpen, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSettingsStore } from '@/stores/settingsStore';
import { useProjectStore } from '@/stores/projectStore';
import { generateText } from '@/lib/gemini';
import { Chapter, Scene, Character } from '@/types';

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

  const [generationType, setGenerationType] = useState<GenerationType>('continue');
  const [customPrompt, setCustomPrompt] = useState('');
  const [selectedCharacters, setSelectedCharacters] = useState<string[]>([]);
  const [tone, setTone] = useState('neutral');
  const [length, setLength] = useState([200]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!settings?.geminiApiKey) {
      setError('설정에서 Gemini API 키를 등록해주세요.');
      return;
    }

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

      const prompt = `당신은 전문 소설 작가입니다. 다음 설정에 맞춰 소설 내용을 생성해주세요.

## 작품 정보
- 제목: ${currentProject?.title || '제목 없음'}
- 장르: ${currentProject?.genre?.join(', ') || '일반'}

## 챕터 정보
- 챕터: ${chapter.title}
- 목적: ${chapter.purpose || '없음'}

## 씬 정보
- 씬: ${scene.title}
- 목표: ${scene.goal || '없음'}
- 장소: ${scene.location || '미정'}

## 등장인물
${characterInfo || '등장인물 정보 없음'}

## 현재 내용 (마지막 부분)
${lastParagraphs || '(시작 부분)'}

## 생성 요청
- 유형: ${generationTypes.find((t) => t.value === generationType)?.label}
- 분위기: ${toneOptions.find((t) => t.value === tone)?.label || '중립적'}
- 목표 길이: 약 ${length[0]}자
${customPrompt ? `- 추가 지시: ${customPrompt}` : ''}

## 지시사항
${typeSpecificPrompt}

## 작성 규칙
1. 한국어로 작성
2. 소설 문체 유지 (HTML 태그 없이 순수 텍스트)
3. 자연스러운 문단 구분
4. 캐릭터의 성격과 말투 반영
5. 현재 내용과 자연스럽게 연결
6. 독자의 몰입을 해치지 않는 흐름

생성된 내용만 출력해주세요.`;

      const response = await generateText(settings.geminiApiKey, prompt, {
        temperature: 0.85,
        maxTokens: Math.max(500, length[0] * 2),
      });

      setGeneratedContent(response.trim());
    } catch (err) {
      console.error('생성 실패:', err);
      setError('콘텐츠 생성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApply = () => {
    if (generatedContent) {
      onGenerate(generatedContent);
      setGeneratedContent('');
    }
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

      <ScrollArea className="flex-1">
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
              <div className="p-4 rounded-lg bg-muted/50 border">
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
    </div>
  );
}
