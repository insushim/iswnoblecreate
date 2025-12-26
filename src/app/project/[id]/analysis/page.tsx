'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Wand2,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  BarChart3,
  MessageSquare,
  Lightbulb,
  BookOpen,
  Zap,
  Heart,
  Clock,
  ThumbsUp,
  ThumbsDown,
  History,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { EmptyState } from '@/components/common';
import { useAnalysisStore } from '@/stores/analysisStore';
import { useProjectStore } from '@/stores/projectStore';
import { useChapterStore } from '@/stores/chapterStore';
import { useCharacterStore } from '@/stores/characterStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { generateJSON } from '@/lib/gemini';
import { Suggestion, ConsistencyIssue } from '@/types';

const priorityColors: Record<Suggestion['priority'], string> = {
  high: 'text-destructive border-destructive',
  medium: 'text-yellow-500 border-yellow-500',
  low: 'text-muted-foreground border-muted-foreground',
};

const severityColors: Record<ConsistencyIssue['severity'], string> = {
  critical: 'bg-destructive/10 text-destructive',
  major: 'bg-yellow-500/10 text-yellow-500',
  minor: 'bg-muted text-muted-foreground',
};

const suggestionTypeLabels: Record<Suggestion['type'], string> = {
  style: '문체',
  description: '묘사',
  dialogue: '대화',
  flow: '흐름',
  tension: '긴장감',
  character: '캐릭터',
  world: '세계관',
  grammar: '문법',
  other: '기타',
};

export default function AnalysisPage() {
  const params = useParams();
  const projectId = params.id as string;

  useProjectStore();
  const { chapters, fetchChapters } = useChapterStore();
  const { characters, fetchCharacters } = useCharacterStore();
  const { settings } = useSettingsStore();
  const { currentAnalysis, analyses, fetchAnalyses, saveAnalysis, setCurrentAnalysis } = useAnalysisStore();

  const [selectedChapter, setSelectedChapter] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStep, setAnalysisStep] = useState('');

  useEffect(() => {
    fetchChapters(projectId);
    fetchCharacters(projectId);
  }, [projectId, fetchChapters, fetchCharacters]);

  useEffect(() => {
    if (selectedChapter) {
      fetchAnalyses('chapter', selectedChapter);
    }
  }, [selectedChapter, fetchAnalyses]);

  const handleAnalyze = async () => {
    if (!settings?.geminiApiKey || !selectedChapter) return;

    const chapter = chapters.find((c) => c.id === selectedChapter);
    if (!chapter || !chapter.scenes || chapter.scenes.length === 0) return;

    setIsAnalyzing(true);
    setAnalysisProgress(0);

    try {
      const content = chapter.scenes.map((s) => s.content).join('\n\n');

      // Step 1: 품질 분석
      setAnalysisStep('품질 분석 중...');
      setAnalysisProgress(20);

      const qualityPrompt = `다음 소설 텍스트의 품질을 분석해주세요.

## 텍스트
${content.slice(0, 5000)}

## 분석 항목
1. overall: 전체 품질 (0-100)
2. readability: 가독성 (0-100)
3. grammar: 문법 정확도 (0-100)
4. style: 문체 일관성 (0-100)
5. engagement: 흥미도 (0-100)
6. originality: 독창성 (0-100)
7. details: 상세 피드백 (문자열 배열)

JSON 형식으로만 응답해주세요.`;

      const qualityResult = await generateJSON(settings.geminiApiKey, qualityPrompt, {
        model: settings.planningModel || 'gemini-3-flash-preview' // 기획/분석용 모델 사용
      });

      // Step 2: 감정/긴장감 분석
      setAnalysisStep('감정 분석 중...');
      setAnalysisProgress(40);

      const emotionPrompt = `다음 소설 텍스트의 감정과 긴장감을 분석해주세요.

## 텍스트
${content.slice(0, 5000)}

## 응답 형식
{
  "tensionAnalysis": {
    "averageLevel": 0-10,
    "peakMoments": [{"position": 0-100, "level": 0-10, "description": "..."}],
    "lowPoints": [{"position": 0-100, "level": 0-10, "suggestion": "..."}],
    "curve": [{"position": 0-100, "level": 0-10}]
  },
  "emotionAnalysis": {
    "dominantEmotions": [{"emotion": "...", "percentage": 0-100}],
    "emotionFlow": [{"position": 0-100, "emotion": "...", "intensity": 0-10}],
    "toneConsistency": 0-100,
    "emotionalImpact": "..."
  }
}

JSON 형식으로만 응답해주세요.`;

      const emotionResult = await generateJSON(settings.geminiApiKey, emotionPrompt, {
        model: settings.planningModel || 'gemini-3-flash-preview' // 기획/분석용 모델 사용
      }) as {
        tensionAnalysis?: { averageLevel: number; peakMoments: { position: number; level: number; description: string }[]; lowPoints: { position: number; level: number; suggestion: string }[]; curve: { position: number; level: number }[] };
        emotionAnalysis?: { dominantEmotions: { emotion: string; percentage: number }[]; emotionFlow: { position: number; emotion: string; intensity: number }[]; toneConsistency: number; emotionalImpact: string };
      } | null;

      // Step 3: 스타일/페이싱 분석
      setAnalysisStep('스타일 분석 중...');
      setAnalysisProgress(60);

      const stylePrompt = `다음 소설 텍스트의 문체와 페이싱을 분석해주세요.

## 텍스트
${content.slice(0, 5000)}

## 응답 형식
{
  "pacingAnalysis": {
    "overallPacing": "too-slow|slow|balanced|fast|too-fast",
    "variationScore": 0-100,
    "slowSections": [{"start": 0-100, "end": 0-100, "suggestion": "..."}],
    "fastSections": [{"start": 0-100, "end": 0-100, "suggestion": "..."}]
  },
  "styleAnalysis": {
    "showVsTell": {"show": 0-100, "tell": 0-100},
    "activeVsPassive": {"active": 0-100, "passive": 0-100},
    "dialogueRatio": 0-100,
    "averageSentenceLength": number,
    "vocabularyRichness": 0-100,
    "repetitiveWords": [{"word": "...", "count": number}],
    "cliches": [{"phrase": "...", "suggestion": "..."}]
  }
}

JSON 형식으로만 응답해주세요.`;

      const styleResult = await generateJSON(settings.geminiApiKey, stylePrompt, {
        model: settings.planningModel || 'gemini-3-flash-preview' // 기획/분석용 모델 사용
      }) as {
        pacingAnalysis?: { overallPacing: 'too-slow' | 'slow' | 'balanced' | 'fast' | 'too-fast'; variationScore: number; slowSections: { start: number; end: number; suggestion: string }[]; fastSections: { start: number; end: number; suggestion: string }[] };
        styleAnalysis?: { showVsTell: { show: number; tell: number }; activeVsPassive: { active: number; passive: number }; dialogueRatio: number; averageSentenceLength: number; vocabularyRichness: number; repetitiveWords: { word: string; count: number }[]; cliches: { phrase: string; suggestion: string }[] };
      } | null;

      // Step 4: 제안 및 일관성 검사
      setAnalysisStep('개선점 도출 중...');
      setAnalysisProgress(80);

      const characterInfo = characters.map((c) => `${c.name}: ${c.personality}, 말투 레벨 ${c.speechPattern.formalityLevel}`).join('\n');

      const suggestionPrompt = `다음 소설 텍스트를 분석하고 개선점과 일관성 문제를 찾아주세요.

## 텍스트
${content.slice(0, 5000)}

## 캐릭터 정보
${characterInfo}

## 응답 형식
{
  "suggestions": [
    {
      "id": "uuid",
      "type": "style|description|dialogue|flow|tension|character|world|grammar|other",
      "priority": "high|medium|low",
      "original": "문제가 있는 원문",
      "suggestion": "개선 제안",
      "reason": "이유",
      "applied": false
    }
  ],
  "consistencyIssues": [
    {
      "id": "uuid",
      "type": "character-personality|character-speech|character-knowledge|world-rules|timeline|foreshadowing|location|relationship|other",
      "description": "문제 설명",
      "severity": "critical|major|minor",
      "suggestion": "해결 방안",
      "resolved": false
    }
  ]
}

최대 5개의 제안과 3개의 일관성 문제를 JSON 형식으로만 응답해주세요.`;

      const suggestionResult = await generateJSON(settings.geminiApiKey, suggestionPrompt, {
        model: settings.planningModel || 'gemini-3-flash-preview' // 기획/분석용 모델 사용
      }) as {
        suggestions?: Suggestion[];
        consistencyIssues?: ConsistencyIssue[];
      } | null;

      // 분석 결과 저장
      setAnalysisStep('결과 저장 중...');
      setAnalysisProgress(95);

      await saveAnalysis({
        targetType: 'chapter',
        targetId: selectedChapter,
        qualityScore: (qualityResult as { overall: number; readability: number; grammar: number; style: number; engagement: number; originality: number; details: string[] }) || {
          overall: 0,
          readability: 0,
          grammar: 0,
          style: 0,
          engagement: 0,
          originality: 0,
          details: [],
        },
        tensionAnalysis: emotionResult?.tensionAnalysis || {
          averageLevel: 0,
          peakMoments: [],
          lowPoints: [],
          curve: [],
        },
        emotionAnalysis: emotionResult?.emotionAnalysis || {
          dominantEmotions: [],
          emotionFlow: [],
          toneConsistency: 0,
          emotionalImpact: '',
        },
        pacingAnalysis: styleResult?.pacingAnalysis || {
          overallPacing: 'balanced',
          variationScore: 0,
          slowSections: [],
          fastSections: [],
        },
        styleAnalysis: styleResult?.styleAnalysis || {
          showVsTell: { show: 50, tell: 50 },
          activeVsPassive: { active: 50, passive: 50 },
          dialogueRatio: 0,
          averageSentenceLength: 0,
          vocabularyRichness: 0,
          repetitiveWords: [],
          cliches: [],
        },
        suggestions: suggestionResult?.suggestions || [],
        consistencyIssues: suggestionResult?.consistencyIssues || [],
      });

      setAnalysisProgress(100);
    } catch (error) {
      console.error('분석 실패:', error);
    } finally {
      setIsAnalyzing(false);
      setAnalysisStep('');
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-destructive';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-destructive';
  };

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">AI 분석</h1>
          <p className="text-muted-foreground">작품의 품질과 일관성을 분석합니다</p>
        </div>
      </div>

      {/* 챕터 선택 및 분석 시작 */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Select value={selectedChapter} onValueChange={setSelectedChapter}>
                <SelectTrigger>
                  <SelectValue placeholder="분석할 챕터 선택" />
                </SelectTrigger>
                <SelectContent>
                  {chapters.map((chapter) => (
                    <SelectItem key={chapter.id} value={chapter.id}>
                      {chapter.title} ({chapter.wordCount.toLocaleString()}자)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              className="gap-2"
              onClick={handleAnalyze}
              disabled={isAnalyzing || !selectedChapter || !settings?.geminiApiKey}
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  분석 중...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4" />
                  분석 시작
                </>
              )}
            </Button>
          </div>

          {isAnalyzing && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>{analysisStep}</span>
                <span>{analysisProgress}%</span>
              </div>
              <Progress value={analysisProgress} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      {!settings?.geminiApiKey && (
        <Card className="border-destructive">
          <CardContent className="py-4">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <p>설정에서 Gemini API 키를 등록해주세요.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 분석 결과 */}
      {currentAnalysis && !isAnalyzing && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">개요</TabsTrigger>
              <TabsTrigger value="style">문체</TabsTrigger>
              <TabsTrigger value="emotion">감정</TabsTrigger>
              <TabsTrigger value="suggestions">제안</TabsTrigger>
              <TabsTrigger value="consistency">일관성</TabsTrigger>
            </TabsList>

            {/* 개요 */}
            <TabsContent value="overview" className="mt-4 space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      전체 점수
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-4xl font-bold ${getScoreColor(currentAnalysis.qualityScore.overall)}`}>
                      {currentAnalysis.qualityScore.overall}
                    </div>
                    <Progress
                      value={currentAnalysis.qualityScore.overall}
                      className={`h-2 mt-2 ${getScoreBgColor(currentAnalysis.qualityScore.overall)}`}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      긴장감
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-4xl font-bold ${getScoreColor(currentAnalysis.tensionAnalysis.averageLevel * 10)}`}>
                      {currentAnalysis.tensionAnalysis.averageLevel.toFixed(1)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">평균 긴장도 (0-10)</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      페이싱
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {currentAnalysis.pacingAnalysis.overallPacing === 'too-slow' && '매우 느림'}
                      {currentAnalysis.pacingAnalysis.overallPacing === 'slow' && '느림'}
                      {currentAnalysis.pacingAnalysis.overallPacing === 'balanced' && '균형'}
                      {currentAnalysis.pacingAnalysis.overallPacing === 'fast' && '빠름'}
                      {currentAnalysis.pacingAnalysis.overallPacing === 'too-fast' && '매우 빠름'}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      변화도: {currentAnalysis.pacingAnalysis.variationScore}%
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* 세부 점수 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">세부 점수</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { label: '가독성', value: currentAnalysis.qualityScore.readability, icon: <BookOpen className="h-4 w-4" /> },
                      { label: '문법', value: currentAnalysis.qualityScore.grammar, icon: <CheckCircle className="h-4 w-4" /> },
                      { label: '문체', value: currentAnalysis.qualityScore.style, icon: <MessageSquare className="h-4 w-4" /> },
                      { label: '흥미도', value: currentAnalysis.qualityScore.engagement, icon: <Heart className="h-4 w-4" /> },
                      { label: '독창성', value: currentAnalysis.qualityScore.originality, icon: <Lightbulb className="h-4 w-4" /> },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center gap-4">
                        <div className="flex items-center gap-2 w-24">
                          {item.icon}
                          <span className="text-sm">{item.label}</span>
                        </div>
                        <div className="flex-1">
                          <Progress value={item.value} className="h-2" />
                        </div>
                        <span className={`w-12 text-right font-medium ${getScoreColor(item.value)}`}>
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* 주요 피드백 */}
              {currentAnalysis.qualityScore.details && currentAnalysis.qualityScore.details.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">주요 피드백</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {currentAnalysis.qualityScore.details.map((detail, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                          <span className="text-sm">{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* 문체 분석 */}
            <TabsContent value="style" className="mt-4 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">보여주기 vs 말하기</CardTitle>
                    <CardDescription>Show don&apos;t tell 비율</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span>보여주기</span>
                          <span>{currentAnalysis.styleAnalysis.showVsTell.show}%</span>
                        </div>
                        <Progress value={currentAnalysis.styleAnalysis.showVsTell.show} className="h-2" />
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-4">
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span>말하기</span>
                          <span>{currentAnalysis.styleAnalysis.showVsTell.tell}%</span>
                        </div>
                        <Progress value={currentAnalysis.styleAnalysis.showVsTell.tell} className="h-2 bg-muted" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">능동태 vs 수동태</CardTitle>
                    <CardDescription>문장 구조 분석</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="flex items-center gap-1">
                            <ThumbsUp className="h-3 w-3 text-green-500" />
                            능동태
                          </span>
                          <span>{currentAnalysis.styleAnalysis.activeVsPassive.active}%</span>
                        </div>
                        <Progress value={currentAnalysis.styleAnalysis.activeVsPassive.active} className="h-2" />
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-4">
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="flex items-center gap-1">
                            <ThumbsDown className="h-3 w-3 text-yellow-500" />
                            수동태
                          </span>
                          <span>{currentAnalysis.styleAnalysis.activeVsPassive.passive}%</span>
                        </div>
                        <Progress value={currentAnalysis.styleAnalysis.activeVsPassive.passive} className="h-2 bg-muted" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">대화 비율</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{currentAnalysis.styleAnalysis.dialogueRatio}%</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">평균 문장 길이</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{currentAnalysis.styleAnalysis.averageSentenceLength}자</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">어휘 풍부도</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{currentAnalysis.styleAnalysis.vocabularyRichness}%</div>
                  </CardContent>
                </Card>
              </div>

              {/* 반복 단어 */}
              {currentAnalysis.styleAnalysis.repetitiveWords && currentAnalysis.styleAnalysis.repetitiveWords.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">반복 단어 주의</CardTitle>
                    <CardDescription>자주 반복되는 단어들입니다</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {currentAnalysis.styleAnalysis.repetitiveWords.map((item, index) => (
                        <Badge key={index} variant="secondary">
                          {item.word} ({item.count}회)
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 상투적 표현 */}
              {currentAnalysis.styleAnalysis.cliches && currentAnalysis.styleAnalysis.cliches.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">상투적 표현</CardTitle>
                    <CardDescription>다른 표현으로 바꿔보세요</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {currentAnalysis.styleAnalysis.cliches.map((item, index) => (
                        <div key={index} className="flex items-start gap-4 p-3 rounded-lg bg-muted">
                          <div className="flex-1">
                            <p className="text-sm line-through text-muted-foreground">{item.phrase}</p>
                            <p className="text-sm text-primary mt-1">→ {item.suggestion}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* 감정 분석 */}
            <TabsContent value="emotion" className="mt-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">주요 감정</CardTitle>
                  <CardDescription>작품에서 드러나는 감정 분포</CardDescription>
                </CardHeader>
                <CardContent>
                  {currentAnalysis.emotionAnalysis.dominantEmotions && currentAnalysis.emotionAnalysis.dominantEmotions.length > 0 ? (
                    <div className="space-y-3">
                      {currentAnalysis.emotionAnalysis.dominantEmotions.map((emotion, index) => (
                        <div key={index} className="flex items-center gap-4">
                          <span className="w-20 text-sm">{emotion.emotion}</span>
                          <div className="flex-1">
                            <Progress value={emotion.percentage} className="h-3" />
                          </div>
                          <span className="w-12 text-right text-sm">{emotion.percentage}%</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">감정 분석 데이터가 없습니다.</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">감정적 영향</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{currentAnalysis.emotionAnalysis.emotionalImpact || '분석 데이터가 없습니다.'}</p>
                  <div className="mt-4 flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">톤 일관성:</span>
                    <Progress value={currentAnalysis.emotionAnalysis.toneConsistency} className="h-2 w-32" />
                    <span className="text-sm">{currentAnalysis.emotionAnalysis.toneConsistency}%</span>
                  </div>
                </CardContent>
              </Card>

              {/* 긴장감 분석 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">긴장감 분석</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {currentAnalysis.tensionAnalysis.peakMoments && currentAnalysis.tensionAnalysis.peakMoments.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-green-500" />
                          최고조 순간
                        </h4>
                        <div className="space-y-2">
                          {currentAnalysis.tensionAnalysis.peakMoments.map((moment, index) => (
                            <div key={index} className="p-2 rounded bg-green-500/10 text-sm">
                              <span className="font-medium">{moment.level}/10</span>: {moment.description}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {currentAnalysis.tensionAnalysis.lowPoints && currentAnalysis.tensionAnalysis.lowPoints.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                          <TrendingDown className="h-4 w-4 text-yellow-500" />
                          개선 필요 구간
                        </h4>
                        <div className="space-y-2">
                          {currentAnalysis.tensionAnalysis.lowPoints.map((point, index) => (
                            <div key={index} className="p-2 rounded bg-yellow-500/10 text-sm">
                              <span className="font-medium">{point.level}/10</span>: {point.suggestion}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 제안 */}
            <TabsContent value="suggestions" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">개선 제안</CardTitle>
                  <CardDescription>AI가 발견한 개선점입니다</CardDescription>
                </CardHeader>
                <CardContent>
                  {currentAnalysis.suggestions && currentAnalysis.suggestions.length > 0 ? (
                    <Accordion type="single" collapsible className="w-full">
                      {currentAnalysis.suggestions.map((suggestion, index) => (
                        <AccordionItem key={suggestion.id || index} value={`suggestion-${index}`}>
                          <AccordionTrigger className="hover:no-underline">
                            <div className="flex items-center gap-3">
                              <Badge variant="outline" className={priorityColors[suggestion.priority]}>
                                {suggestion.priority === 'high' && '높음'}
                                {suggestion.priority === 'medium' && '중간'}
                                {suggestion.priority === 'low' && '낮음'}
                              </Badge>
                              <Badge variant="secondary">
                                {suggestionTypeLabels[suggestion.type]}
                              </Badge>
                              <span className="text-sm">{suggestion.suggestion.slice(0, 50)}...</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-3 pt-2">
                              {suggestion.original && (
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">원문</p>
                                  <p className="text-sm p-2 rounded bg-muted">{suggestion.original}</p>
                                </div>
                              )}
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">제안</p>
                                <p className="text-sm p-2 rounded bg-primary/10">{suggestion.suggestion}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">이유</p>
                                <p className="text-sm">{suggestion.reason}</p>
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  ) : (
                    <EmptyState
                      icon={Lightbulb}
                      title="제안이 없습니다"
                      description="분석을 실행하면 개선 제안이 표시됩니다"
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* 일관성 */}
            <TabsContent value="consistency" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">일관성 검사</CardTitle>
                  <CardDescription>캐릭터, 세계관, 타임라인 등의 일관성을 검사합니다</CardDescription>
                </CardHeader>
                <CardContent>
                  {currentAnalysis.consistencyIssues && currentAnalysis.consistencyIssues.length > 0 ? (
                    <div className="space-y-4">
                      {currentAnalysis.consistencyIssues.map((issue, index) => (
                        <div
                          key={issue.id || index}
                          className={`p-4 rounded-lg ${severityColors[issue.severity]}`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <AlertCircle className="h-4 w-4" />
                              <Badge variant="outline" className="text-xs">
                                {issue.type === 'character-personality' && '캐릭터 성격'}
                                {issue.type === 'character-speech' && '캐릭터 말투'}
                                {issue.type === 'character-knowledge' && '캐릭터 지식'}
                                {issue.type === 'world-rules' && '세계관 규칙'}
                                {issue.type === 'timeline' && '타임라인'}
                                {issue.type === 'foreshadowing' && '복선'}
                                {issue.type === 'location' && '장소'}
                                {issue.type === 'relationship' && '관계'}
                                {issue.type === 'other' && '기타'}
                              </Badge>
                            </div>
                            <Badge variant={issue.severity === 'critical' ? 'destructive' : issue.severity === 'major' ? 'default' : 'secondary'}>
                              {issue.severity === 'critical' && '심각'}
                              {issue.severity === 'major' && '주요'}
                              {issue.severity === 'minor' && '경미'}
                            </Badge>
                          </div>
                          <p className="text-sm mt-2">{issue.description}</p>
                          {issue.suggestion && (
                            <p className="text-sm mt-2 opacity-80">
                              <span className="font-medium">해결 방안:</span> {issue.suggestion}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      icon={CheckCircle}
                      title="일관성 문제가 없습니다"
                      description="분석 결과 일관성 문제가 발견되지 않았습니다"
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* 분석 히스토리 */}
          {analyses.length > 1 && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <History className="h-5 w-5" />
                  분석 히스토리
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 flex-wrap">
                  {analyses.map((analysis) => (
                    <Button
                      key={analysis.id}
                      variant={currentAnalysis?.id === analysis.id ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentAnalysis(analysis)}
                    >
                      {new Date(analysis.createdAt).toLocaleDateString()} ({analysis.qualityScore.overall}점)
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      )}

      {!currentAnalysis && !isAnalyzing && selectedChapter && (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={BarChart3}
              title="분석 결과가 없습니다"
              description="분석 시작 버튼을 눌러 챕터를 분석하세요"
              action={{
                label: '분석 시작',
                onClick: handleAnalyze,
              }}
            />
          </CardContent>
        </Card>
      )}

      {!selectedChapter && (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={BookOpen}
              title="챕터를 선택하세요"
              description="분석할 챕터를 선택해주세요"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
