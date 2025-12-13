'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { MessageSquare, Plus, Wand2, RefreshCw, Users, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState, LoadingSpinner } from '@/components/common';
import { useCharacterStore } from '@/stores/characterStore';
import { useProjectStore } from '@/stores/projectStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { generateText } from '@/lib/gemini';

export default function DialoguePage() {
  const params = useParams();
  const projectId = params.id as string;

  const { characters, fetchCharacters } = useCharacterStore();
  const { currentProject } = useProjectStore();
  const { settings } = useSettingsStore();

  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDialogue, setGeneratedDialogue] = useState('');
  const [selectedCharacters, setSelectedCharacters] = useState<string[]>([]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await fetchCharacters(projectId);
      setIsLoading(false);
    };
    loadData();
  }, [projectId, fetchCharacters]);

  const handleGenerateDialogue = async () => {
    if (!settings?.geminiApiKey || selectedCharacters.length < 2) return;

    setIsGenerating(true);
    try {
      const selectedChars = characters.filter(c => selectedCharacters.includes(c.id));
      const characterInfo = selectedChars.map(c =>
        `- ${c.name}: ${c.personality}, 말투 격식 ${c.speechPattern?.formalityLevel || 3}/5`
      ).join('\n');

      const prompt = `다음 캐릭터들 간의 자연스러운 대화를 작성해주세요.

## 캐릭터
${characterInfo}

## 작품 정보
- 제목: ${currentProject?.title}
- 장르: ${currentProject?.genre.join(', ')}

## 요청
두 캐릭터가 처음 만나는 상황에서의 대화를 작성해주세요.
각 캐릭터의 성격과 말투가 잘 드러나도록 해주세요.
대화문 형식으로 작성하고, 지문도 포함해주세요.

10~15회 정도의 대화를 포함해주세요.`;

      const result = await generateText(settings.geminiApiKey, prompt, { temperature: 0.85 });
      setGeneratedDialogue(result);
    } catch (error) {
      console.error('대화 생성 실패:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleCharacter = (id: string) => {
    setSelectedCharacters(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
        <LoadingSpinner size="lg" text="로딩 중..." />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">대화 생성</h1>
          <p className="text-muted-foreground">캐릭터들 간의 대화를 AI로 생성하세요</p>
        </div>
      </div>

      {/* 캐릭터 선택 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            대화할 캐릭터 선택
          </CardTitle>
          <CardDescription>2명 이상의 캐릭터를 선택하세요</CardDescription>
        </CardHeader>
        <CardContent>
          {characters.length === 0 ? (
            <p className="text-sm text-muted-foreground">먼저 캐릭터를 생성해주세요.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {characters.map(char => (
                <Badge
                  key={char.id}
                  variant={selectedCharacters.includes(char.id) ? 'default' : 'outline'}
                  className="cursor-pointer text-sm py-2 px-4"
                  style={{
                    backgroundColor: selectedCharacters.includes(char.id) ? char.color : 'transparent',
                    borderColor: char.color,
                    color: selectedCharacters.includes(char.id) ? 'white' : char.color,
                  }}
                  onClick={() => toggleCharacter(char.id)}
                >
                  {char.name}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 생성 버튼 */}
      <Button
        onClick={handleGenerateDialogue}
        disabled={isGenerating || selectedCharacters.length < 2 || !settings?.geminiApiKey}
        className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
      >
        {isGenerating ? (
          <>
            <RefreshCw className="h-4 w-4 animate-spin" />
            대화 생성 중...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            AI 대화 생성
          </>
        )}
      </Button>

      {/* 생성된 대화 */}
      {generatedDialogue && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">생성된 대화</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="whitespace-pre-wrap bg-muted/50 p-4 rounded-lg text-sm">
              {generatedDialogue}
            </div>
            <div className="flex gap-2 mt-4">
              <Button variant="outline" onClick={handleGenerateDialogue} disabled={isGenerating}>
                <RefreshCw className="h-4 w-4 mr-2" />
                다시 생성
              </Button>
              <Button onClick={() => navigator.clipboard.writeText(generatedDialogue)}>
                복사하기
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 안내 */}
      <Card className="bg-muted/50">
        <CardContent className="py-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-primary/10">
              <MessageSquare className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">대화 생성 도우미</h3>
              <p className="text-sm text-muted-foreground">
                캐릭터의 성격과 말투를 반영하여 자연스러운 대화를 생성합니다.
                생성된 대화는 집필 시 참고하거나 그대로 사용할 수 있습니다.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
