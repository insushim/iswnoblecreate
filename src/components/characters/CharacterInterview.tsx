'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useSettingsStore } from '@/stores/settingsStore';
import { useProjectStore } from '@/stores/projectStore';
import { generateText } from '@/lib/gemini';
import { Character } from '@/types';

interface CharacterInterviewProps {
  character: Character;
  onClose: () => void;
}

interface Message {
  id: string;
  role: 'user' | 'character';
  content: string;
  timestamp: Date;
}

const suggestedQuestions = [
  '자기소개를 해주세요',
  '가장 소중히 여기는 것은 무엇인가요?',
  '과거에 가장 힘들었던 순간은?',
  '앞으로의 꿈이나 목표는?',
  '가장 좋아하는 것과 싫어하는 것은?',
  '믿을 수 있는 사람이 있나요?',
];

export function CharacterInterview({ character, onClose }: CharacterInterviewProps) {
  const { settings } = useSettingsStore();
  const { currentProject } = useProjectStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (question?: string) => {
    console.log('[CharacterInterview] handleSend 호출됨');
    const userQuestion = question || input;
    console.log('[CharacterInterview] 질문:', userQuestion);
    console.log('[CharacterInterview] API 키 존재:', !!settings?.geminiApiKey);

    if (!userQuestion.trim() || !settings?.geminiApiKey) {
      console.error('[CharacterInterview] ❌ 질문 없음 또는 API 키 없음');
      return;
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: userQuestion,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const prompt = `당신은 ${character.name}입니다.
다음 설정을 기반으로 인터뷰 질문에 캐릭터로서 답변해주세요.

## 캐릭터 설정
- 이름: ${character.name}
- 나이: ${character.age}
- 성별: ${character.gender}
- 직업: ${character.occupation || '없음'}
- 성격: ${character.personality}
- 배경: ${character.background}
- 동기: ${character.motivation}
- 목표: ${character.goal}
- 두려움: ${character.fear || '없음'}
- 비밀: ${character.secret || '없음'}
- 강점: ${character.strengths.join(', ')}
- 약점: ${character.weaknesses.join(', ')}

## 말투 가이드
- 경어 수준: ${character.speechPattern.formalityLevel}/5 (1:반말, 5:격식체)
- 말하는 속도: ${character.speechPattern.speechSpeed}
- 특징적 표현: ${character.speechPattern.catchphrase?.join(', ') || '없음'}
- 말투 특징: ${character.speechPattern.tone || '없음'}

## 세계관
${currentProject?.synopsis || '정보 없음'}

## 대화 기록
${messages.map(m => `${m.role === 'user' ? '질문자' : character.name}: ${m.content}`).join('\n')}

## 질문
${userQuestion}

## 지시사항
- 캐릭터의 성격과 배경을 반영하여 답변
- 캐릭터가 알 수 없는 정보는 모른다고 답변
- 말투와 어휘 선택이 캐릭터답게
- 감정과 생각을 캐릭터의 시선으로 표현
- 1인칭으로 직접 답변
- 2-4문장 정도로 자연스럽게 답변

답변만 출력해주세요 (따옴표나 캐릭터 이름 없이).`;

      console.log('[CharacterInterview] generateText 호출 중...');
      const response = await generateText(settings.geminiApiKey, prompt, { temperature: 0.8 });
      console.log('[CharacterInterview] ✅ 응답 수신, 길이:', response?.length || 0);

      const characterMessage: Message = {
        id: crypto.randomUUID(),
        role: 'character',
        content: response.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, characterMessage]);
    } catch (error: unknown) {
      console.error('[CharacterInterview] ❌ 인터뷰 응답 생성 실패:');
      console.error('[CharacterInterview] 오류 객체:', error);
      if (error instanceof Error) {
        console.error('[CharacterInterview] 오류 메시지:', error.message);
        console.error('[CharacterInterview] 오류 스택:', error.stack);
      }
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'character',
        content: error instanceof Error ? `(오류: ${error.message})` : '(응답을 생성하는 데 실패했습니다. 다시 시도해주세요.)',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[70vh]">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Avatar
            className="h-8 w-8 border-2"
            style={{ borderColor: character.color || 'hsl(var(--border))' }}
          >
            <AvatarFallback style={{ backgroundColor: character.color ? `${character.color}20` : undefined }}>
              {character.name.slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          {character.name}과의 인터뷰
        </DialogTitle>
        <DialogDescription>
          캐릭터에게 질문하여 더 깊이 이해해보세요
        </DialogDescription>
      </DialogHeader>

      {/* 제안 질문 */}
      {messages.length === 0 && (
        <div className="py-4">
          <p className="text-sm text-muted-foreground mb-2">제안 질문:</p>
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map((q) => (
              <Button
                key={q}
                variant="outline"
                size="sm"
                onClick={() => handleSend(q)}
                disabled={isLoading}
              >
                {q}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* 메시지 영역 */}
      <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
        <div className="space-y-4 py-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}
            >
              {message.role === 'character' && (
                <Avatar
                  className="h-8 w-8 shrink-0 border-2"
                  style={{ borderColor: character.color || 'hsl(var(--border))' }}
                >
                  <AvatarFallback style={{ backgroundColor: character.color ? `${character.color}20` : undefined }}>
                    {character.name.slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
              )}
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
              {message.role === 'user' && (
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3">
              <Avatar
                className="h-8 w-8 shrink-0 border-2"
                style={{ borderColor: character.color || 'hsl(var(--border))' }}
              >
                <AvatarFallback style={{ backgroundColor: character.color ? `${character.color}20` : undefined }}>
                  {character.name.slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="max-w-[80%] p-3 rounded-lg bg-muted">
                <RefreshCw className="h-4 w-4 animate-spin" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* 입력 영역 */}
      <div className="flex gap-2 pt-4 border-t">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="질문을 입력하세요..."
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
          disabled={isLoading || !settings?.geminiApiKey}
        />
        <Button onClick={() => handleSend()} disabled={isLoading || !input.trim() || !settings?.geminiApiKey}>
          <Send className="h-4 w-4" />
        </Button>
      </div>

      {!settings?.geminiApiKey && (
        <p className="text-xs text-destructive mt-2">
          설정에서 Gemini API 키를 등록해주세요.
        </p>
      )}
    </div>
  );
}
