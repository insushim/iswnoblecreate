'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Wand2,
  ArrowRight,
  BookOpen,
  Lightbulb,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { AIThinking } from '@/components/common';
import { useProjectStore } from '@/stores/projectStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { generateJSON } from '@/lib/gemini';

interface IdeaExpansionResult {
  titles: { title: string; style: string; reasoning: string }[];
  genres: { genre: string; reason: string }[];
  logline: string;
  synopsis: string;
  themes: string[];
  targetAudience: string;
  uniquePoints: string[];
  estimatedChapters: number;
}

const exampleIdeas = [
  '평범한 고등학생이 어느 날 시간을 멈추는 능력을 얻게 된다',
  '사라진 언니를 찾아 떠나는 소녀의 미스터리 여행',
  '요리로 사람의 마음을 치유하는 심야식당 이야기',
  '조선시대로 떨어진 현대 의사의 생존기',
  'AI 로봇과 사랑에 빠진 인간의 이야기',
];

export default function NewProjectPage() {
  const router = useRouter();
  const { createProject } = useProjectStore();
  const { settings } = useSettingsStore();
  const [idea, setIdea] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [expansionResult, setExpansionResult] = useState<IdeaExpansionResult | null>(null);
  const [selectedTitle, setSelectedTitle] = useState<string>('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleExpandIdea = async () => {
    console.log('[NewProject] handleExpandIdea 호출됨');
    console.log('[NewProject] 아이디어:', idea);
    console.log('[NewProject] API 키 존재:', !!settings?.geminiApiKey);
    console.log('[NewProject] API 키 길이:', settings?.geminiApiKey?.length || 0);

    if (!idea.trim()) {
      console.warn('[NewProject] 아이디어가 비어있음');
      return;
    }

    if (!settings?.geminiApiKey) {
      console.error('[NewProject] ❌ API 키가 없습니다!');
      setError('설정에서 Gemini API 키를 먼저 등록해주세요.');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const prompt = `당신은 베스트셀러 소설의 기획을 담당하는 출판 전문 에디터입니다.
다음 아이디어를 바탕으로 매력적인 소설 기획안을 작성해주세요.

## 원본 아이디어
${idea}

## 요청 사항
다음 내용을 JSON 형식으로 제공해주세요:

{
  "titles": [
    { "title": "제목1", "style": "스타일유형", "reasoning": "선택이유" },
    { "title": "제목2", "style": "스타일유형", "reasoning": "선택이유" },
    { "title": "제목3", "style": "스타일유형", "reasoning": "선택이유" }
  ],
  "genres": [
    { "genre": "주요장르", "reason": "이유" },
    { "genre": "서브장르", "reason": "이유" }
  ],
  "logline": "핵심 갈등과 주인공을 포함한 한 문장 로그라인",
  "synopsis": "300-400자 분량의 시놉시스",
  "themes": ["테마1", "테마2", "테마3"],
  "targetAudience": "타겟 독자층 설명",
  "uniquePoints": ["차별점1", "차별점2", "차별점3"],
  "estimatedChapters": 예상챕터수(숫자)
}

매력적이고 시장성 있는 기획안을 작성해주세요.
모든 내용은 한국어로 작성하세요.`;

      console.log('[NewProject] generateJSON 호출 중...');
      const result = await generateJSON<IdeaExpansionResult>(
        settings.geminiApiKey,
        prompt,
        { temperature: 0.8 }
      );

      console.log('[NewProject] ✅ 결과 수신:', result);
      setExpansionResult(result);
      if (result.titles.length > 0) {
        setSelectedTitle(result.titles[0].title);
      }
      if (result.genres.length > 0) {
        setSelectedGenres(result.genres.map(g => g.genre));
      }
    } catch (error: unknown) {
      console.error('[NewProject] ❌ 아이디어 확장 실패:');
      console.error('[NewProject] 오류 객체:', error);
      if (error instanceof Error) {
        console.error('[NewProject] 오류 메시지:', error.message);
        console.error('[NewProject] 오류 스택:', error.stack);
        setError(error.message);
      } else {
        setError('아이디어 확장에 실패했습니다. 다시 시도해주세요.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateProject = async () => {
    if (!expansionResult || !selectedTitle) return;

    try {
      const newProject = await createProject({
        title: selectedTitle,
        concept: idea,
        logline: expansionResult.logline,
        synopsis: expansionResult.synopsis,
        genre: selectedGenres,
        targetAudience: expansionResult.targetAudience,
        keywords: expansionResult.themes,
        status: 'planning',
      });

      router.push(`/project/${newProject.id}/planning`);
    } catch (error) {
      setError('프로젝트 생성에 실패했습니다.');
    }
  };

  const handleExampleClick = (example: string) => {
    setIdea(example);
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        {/* 헤더 */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">새로운 이야기 시작하기</h1>
          <p className="text-muted-foreground">
            당신의 아이디어를 입력하면 AI가 소설의 뼈대를 만들어 드립니다
          </p>
        </div>

        {/* 아이디어 입력 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              아이디어 입력
            </CardTitle>
            <CardDescription>
              1-3줄의 간단한 아이디어나 컨셉을 입력해주세요
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="예: 평범한 고등학생이 어느 날 시간을 멈추는 능력을 얻게 된다..."
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              rows={4}
              className="resize-none"
            />

            {/* 예시 아이디어 */}
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">아이디어가 필요하신가요?</p>
              <div className="flex flex-wrap gap-2">
                {exampleIdeas.map((example, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary/10 transition-colors"
                    onClick={() => handleExampleClick(example)}
                  >
                    {example.slice(0, 20)}...
                  </Badge>
                ))}
              </div>
            </div>

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                {error}
              </div>
            )}

            <Button
              onClick={handleExpandIdea}
              disabled={!idea.trim() || isGenerating}
              className="w-full gap-2"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  AI가 분석 중...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4" />
                  AI로 아이디어 확장하기
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* AI 생각 중 표시 */}
        {isGenerating && (
          <AIThinking message="아이디어를 분석하고 소설 기획안을 작성하고 있습니다..." />
        )}

        {/* 확장 결과 */}
        {expansionResult && !isGenerating && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* 제목 선택 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  제목 선택
                </CardTitle>
                <CardDescription>
                  AI가 제안한 제목 중 하나를 선택하거나 직접 수정하세요
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {expansionResult.titles.map((t, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedTitle === t.title
                        ? 'border-primary bg-primary/5'
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedTitle(t.title)}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg">{t.title}</h3>
                      <Badge variant="secondary">{t.style}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{t.reasoning}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* 장르 */}
            <Card>
              <CardHeader>
                <CardTitle>장르</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {expansionResult.genres.map((g, index) => (
                    <Badge
                      key={index}
                      variant={selectedGenres.includes(g.genre) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => {
                        if (selectedGenres.includes(g.genre)) {
                          setSelectedGenres(selectedGenres.filter(genre => genre !== g.genre));
                        } else {
                          setSelectedGenres([...selectedGenres, g.genre]);
                        }
                      }}
                    >
                      {g.genre}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 로그라인 */}
            <Card>
              <CardHeader>
                <CardTitle>로그라인</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg">{expansionResult.logline}</p>
              </CardContent>
            </Card>

            {/* 시놉시스 */}
            <Card>
              <CardHeader>
                <CardTitle>시놉시스</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{expansionResult.synopsis}</p>
              </CardContent>
            </Card>

            {/* 테마 & 차별점 */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">주요 테마</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {expansionResult.themes.map((theme, index) => (
                      <Badge key={index} variant="secondary">
                        {theme}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">타겟 독자</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{expansionResult.targetAudience}</p>
                </CardContent>
              </Card>
            </div>

            {/* 차별점 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">차별화 포인트</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {expansionResult.uniquePoints.map((point, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span className="text-sm">{point}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* 프로젝트 생성 버튼 */}
            <div className="flex justify-end gap-4">
              <Button
                variant="outline"
                onClick={() => {
                  setExpansionResult(null);
                  setSelectedTitle('');
                  setSelectedGenres([]);
                }}
              >
                다시 생성하기
              </Button>
              <Button onClick={handleCreateProject} className="gap-2">
                프로젝트 만들기
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
