'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Save,
  Wand2,
  RefreshCw,
  BookOpen,
  Target,
  Users,
  Lightbulb,
  Rocket,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { AIThinking } from '@/components/common';
import { useProjectStore } from '@/stores/projectStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useWorldStore } from '@/stores/worldStore';
import { useCharacterStore } from '@/stores/characterStore';
import { usePlotStore } from '@/stores/plotStore';
import { useChapterStore } from '@/stores/chapterStore';
import { generateJSON, generateText } from '@/lib/gemini';
import { WorldSetting, Character, PlotPoint } from '@/types';

const genres = [
  '로맨스', '판타지', '무협', '현대', '역사', '미스터리', '스릴러',
  '호러', 'SF', '라이트노벨', '드라마', '액션', '코미디', '성장물'
];

const ageRatings = [
  { value: 'all', label: '전체 이용가' },
  { value: 'teen', label: '15세 이상' },
  { value: 'adult', label: '19세 이상' },
];

const perspectives = [
  { value: 'first', label: '1인칭' },
  { value: 'third-limited', label: '3인칭 제한' },
  { value: 'omniscient', label: '전지적 시점' },
  { value: 'second', label: '2인칭' },
];

const writingStyles = [
  { value: 'calm', label: '차분한' },
  { value: 'elaborate', label: '섬세한' },
  { value: 'concise', label: '간결한' },
  { value: 'lyrical', label: '서정적' },
  { value: 'tense', label: '긴박한' },
  { value: 'humorous', label: '유머러스' },
];

const novelLengths = [
  { value: 50000, label: '단편 (5만자)', chapters: 5, characters: 5 },
  { value: 100000, label: '중편 (10만자)', chapters: 10, characters: 8 },
  { value: 200000, label: '장편 (20만자)', chapters: 20, characters: 12 },
  { value: 500000, label: '대작 (50만자)', chapters: 50, characters: 15 },
  { value: 1000000, label: '시리즈급 (100만자)', chapters: 100, characters: 20 },
];

export default function PlanningPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { currentProject, updateProject } = useProjectStore();
  const { settings } = useSettingsStore();
  const { createWorldSetting } = useWorldStore();
  const { createCharacter } = useCharacterStore();
  const { fetchPlotStructure, addPlotPoint } = usePlotStore();
  const { createChapter } = useChapterStore();

  const [title, setTitle] = useState('');
  const [concept, setConcept] = useState('');
  const [logline, setLogline] = useState('');
  const [synopsis, setSynopsis] = useState('');
  const [detailedSynopsis, setDetailedSynopsis] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [targetAudience, setTargetAudience] = useState('');
  const [ageRating, setAgeRating] = useState<'all' | 'teen' | 'adult'>('all');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState('');

  const [perspective, setPerspective] = useState('third-limited');
  const [writingStyle, setWritingStyle] = useState('calm');
  const [dialogueRatio, setDialogueRatio] = useState(40);
  const [descriptionDetail, setDescriptionDetail] = useState(3);
  const [targetChapterLength, setTargetChapterLength] = useState(5000);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingType, setGeneratingType] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [isAutoGenerating, setIsAutoGenerating] = useState(false);
  const [targetNovelLength, setTargetNovelLength] = useState(200000);
  const [autoGenerateProgress, setAutoGenerateProgress] = useState<{
    step: string;
    current: number;
    total: number;
  } | null>(null);

  useEffect(() => {
    if (currentProject) {
      setTitle(currentProject.title);
      setConcept(currentProject.concept);
      setLogline(currentProject.logline);
      setSynopsis(currentProject.synopsis);
      setDetailedSynopsis(currentProject.detailedSynopsis || '');
      setSelectedGenres(currentProject.genre);
      setTargetAudience(currentProject.targetAudience);
      setAgeRating(currentProject.ageRating);
      setKeywords(currentProject.keywords);
      setPerspective(currentProject.settings.perspective);
      setWritingStyle(currentProject.settings.writingStyle);
      setDialogueRatio(currentProject.settings.dialogueRatio);
      setDescriptionDetail(currentProject.settings.descriptionDetail);
      setTargetChapterLength(currentProject.settings.targetChapterLength);
    }
  }, [currentProject]);

  const handleSave = async () => {
    if (!currentProject) return;

    setIsSaving(true);
    try {
      await updateProject(projectId, {
        title,
        concept,
        logline,
        synopsis,
        detailedSynopsis,
        genre: selectedGenres,
        targetAudience,
        ageRating,
        keywords,
        settings: {
          ...currentProject.settings,
          perspective: perspective as 'first' | 'third-limited' | 'omniscient' | 'second',
          writingStyle: writingStyle as 'calm' | 'elaborate' | 'concise' | 'lyrical' | 'tense' | 'humorous' | 'custom',
          dialogueRatio,
          descriptionDetail,
          targetChapterLength,
        },
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenreToggle = (genre: string) => {
    if (selectedGenres.includes(genre)) {
      setSelectedGenres(selectedGenres.filter(g => g !== genre));
    } else {
      setSelectedGenres([...selectedGenres, genre]);
    }
  };

  const handleAddKeyword = () => {
    if (newKeyword.trim() && !keywords.includes(newKeyword.trim())) {
      setKeywords([...keywords, newKeyword.trim()]);
      setNewKeyword('');
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    setKeywords(keywords.filter(k => k !== keyword));
  };

  const generateLogline = async () => {
    if (!settings?.geminiApiKey || !concept) return;

    setIsGenerating(true);
    setGeneratingType('logline');

    try {
      const prompt = `당신은 출판 전문 에디터입니다.
다음 소설 컨셉을 바탕으로 매력적인 로그라인(한 문장 요약)을 작성해주세요.

컨셉: ${concept}
장르: ${selectedGenres.join(', ') || '미정'}

로그라인은:
- 주인공이 누구인지
- 어떤 갈등/도전에 직면하는지
- 무엇이 위태로운지
를 한 문장에 담아야 합니다.

로그라인만 출력하세요. 추가 설명 없이 한 문장만 작성하세요.`;

      const result = await generateText(settings.geminiApiKey, prompt, { temperature: 0.7 });
      setLogline(result.trim());
    } catch (error) {
      console.error('로그라인 생성 실패:', error);
    } finally {
      setIsGenerating(false);
      setGeneratingType('');
    }
  };

  const generateSynopsis = async () => {
    if (!settings?.geminiApiKey || !concept) return;

    setIsGenerating(true);
    setGeneratingType('synopsis');

    try {
      const prompt = `당신은 출판 전문 에디터입니다.
다음 정보를 바탕으로 소설의 시놉시스를 작성해주세요.

컨셉: ${concept}
장르: ${selectedGenres.join(', ') || '미정'}
로그라인: ${logline || '없음'}
타겟 독자: ${targetAudience || '일반'}

시놉시스는:
- 300-500자 분량
- 주인공 소개
- 핵심 갈등
- 스토리의 흐름
- 결말의 암시(스포일러 없이)
를 포함해야 합니다.

시놉시스만 출력하세요.`;

      const result = await generateText(settings.geminiApiKey, prompt, { temperature: 0.7 });
      setSynopsis(result.trim());
    } catch (error) {
      console.error('시놉시스 생성 실패:', error);
    } finally {
      setIsGenerating(false);
      setGeneratingType('');
    }
  };

  const generateDetailedSynopsis = async () => {
    if (!settings?.geminiApiKey || !synopsis) return;

    setIsGenerating(true);
    setGeneratingType('detailed');

    try {
      const prompt = `당신은 출판 전문 에디터입니다.
다음 시놉시스를 바탕으로 상세 시놉시스를 작성해주세요.

기존 시놉시스: ${synopsis}
장르: ${selectedGenres.join(', ') || '미정'}

상세 시놉시스는:
- 1000-1500자 분량
- 주요 등장인물 소개
- 기승전결 구조로 스토리 전개
- 주요 플롯 포인트
- 감정적 클라이맥스
를 포함해야 합니다.

상세 시놉시스만 출력하세요.`;

      const result = await generateText(settings.geminiApiKey, prompt, { temperature: 0.7 });
      setDetailedSynopsis(result.trim());
    } catch (error) {
      console.error('상세 시놉시스 생성 실패:', error);
    } finally {
      setIsGenerating(false);
      setGeneratingType('');
    }
  };

  // AI 전체 자동 생성 (원클릭으로 모든 것 생성)
  const handleAutoGenerateAll = async () => {
    if (!settings?.geminiApiKey || !concept) {
      alert('API 키와 컨셉을 먼저 입력해주세요.');
      return;
    }

    setIsAutoGenerating(true);
    const totalSteps = 7;

    try {
      // 1단계: 로그라인 생성
      setAutoGenerateProgress({ step: '로그라인 생성 중...', current: 1, total: totalSteps });
      const loglinePrompt = `당신은 출판 전문 에디터입니다.
다음 소설 컨셉을 바탕으로 매력적인 로그라인(한 문장 요약)을 작성해주세요.

컨셉: ${concept}
장르: ${selectedGenres.join(', ') || '판타지, 액션'}

로그라인은 주인공, 갈등, 위기를 한 문장에 담아야 합니다.
로그라인만 출력하세요.`;
      const newLogline = await generateText(settings.geminiApiKey, loglinePrompt, { temperature: 0.7 });
      setLogline(newLogline.trim());

      // 2단계: 시놉시스 생성
      setAutoGenerateProgress({ step: '시놉시스 생성 중...', current: 2, total: totalSteps });
      const synopsisPrompt = `당신은 출판 전문 에디터입니다.
다음 정보를 바탕으로 500자 내외의 시놉시스를 작성해주세요.

컨셉: ${concept}
로그라인: ${newLogline}
장르: ${selectedGenres.join(', ') || '판타지, 액션'}

시놉시스만 출력하세요.`;
      const newSynopsis = await generateText(settings.geminiApiKey, synopsisPrompt, { temperature: 0.7 });
      setSynopsis(newSynopsis.trim());

      // 3단계: 상세 시놉시스 생성
      setAutoGenerateProgress({ step: '상세 시놉시스 생성 중...', current: 3, total: totalSteps });
      const detailedPrompt = `다음 시놉시스를 1500자 내외의 상세 시놉시스로 확장해주세요.
기승전결 구조로 주요 플롯 포인트를 포함하세요.

시놉시스: ${newSynopsis}

상세 시놉시스만 출력하세요.`;
      const newDetailed = await generateText(settings.geminiApiKey, detailedPrompt, { temperature: 0.7 });
      setDetailedSynopsis(newDetailed.trim());

      // 기획 저장
      await updateProject(projectId, {
        title: title || '새 소설',
        concept,
        logline: newLogline.trim(),
        synopsis: newSynopsis.trim(),
        detailedSynopsis: newDetailed.trim(),
        genre: selectedGenres.length > 0 ? selectedGenres : ['판타지', '액션'],
        settings: {
          writingStyle: writingStyle as 'calm' | 'elaborate' | 'concise' | 'lyrical' | 'tense' | 'humorous' | 'custom',
          perspective: perspective as 'first' | 'third-limited' | 'omniscient' | 'second',
          tense: currentProject?.settings?.tense || 'past',
          dialogueRatio,
          descriptionDetail,
          targetChapterLength,
          pacingPreference: currentProject?.settings?.pacingPreference || 'moderate',
          emotionIntensity: currentProject?.settings?.emotionIntensity || 5,
          language: currentProject?.settings?.language || 'ko',
          autoSaveInterval: currentProject?.settings?.autoSaveInterval || 30,
        },
      });

      // 4단계: 세계관 생성
      setAutoGenerateProgress({ step: '세계관 생성 중...', current: 4, total: totalSteps });
      const worldPrompt = `다음 소설 정보를 바탕으로 세계관 설정 5개를 JSON 배열로 생성해주세요.

제목: ${title}
컨셉: ${concept}
시놉시스: ${newSynopsis}
장르: ${selectedGenres.join(', ')}

JSON 형식:
[
  {"category": "magic", "title": "마법 체계", "description": "설명...", "importance": "core"},
  ...
]

카테고리: time, space, society, culture, economy, politics, religion, technology, magic, nature, history, language, custom
중요도: core, major, minor`;

      const worldResult = await generateJSON<Array<{category: WorldSetting['category'], title: string, description: string, importance: WorldSetting['importance']}>>(
        settings.geminiApiKey, worldPrompt, { temperature: 0.7 }
      );

      for (const world of worldResult) {
        await createWorldSetting(projectId, world);
      }

      // 5단계: 캐릭터 생성
      setAutoGenerateProgress({ step: '캐릭터 생성 중...', current: 5, total: totalSteps });
      const selectedLength = novelLengths.find(l => l.value === targetNovelLength) || novelLengths[2];
      const numCharacters = selectedLength.characters;

      const characterPrompt = `다음 소설 정보를 바탕으로 주요 캐릭터 ${numCharacters}명을 JSON 배열로 생성해주세요.

제목: ${title}
컨셉: ${concept}
시놉시스: ${newSynopsis}
목표 분량: ${selectedLength.label}

JSON 형식:
[
  {
    "name": "이름",
    "role": "protagonist",
    "age": "20",
    "gender": "남성",
    "occupation": "직업",
    "personality": "성격 설명 (2-3문장)",
    "background": "배경 스토리 (2-3문장)",
    "motivation": "동기",
    "goal": "목표",
    "appearance": "외모 설명"
  },
  ...
]

역할 배분 (총 ${numCharacters}명):
- protagonist(주인공): 1-2명
- antagonist(악역/적대자): 1-2명
- deuteragonist(조연 주인공/히로인): 1-2명
- supporting(주요 조연): ${Math.max(2, numCharacters - 6)}명
- minor(단역/엑스트라): 나머지

각 캐릭터는 개성있는 이름과 뚜렷한 성격을 가져야 합니다.`;

      const characterResult = await generateJSON<Array<{
        name: string;
        role: Character['role'];
        age: string;
        gender: string;
        occupation?: string;
        personality: string;
        background: string;
        motivation: string;
        goal: string;
        appearance?: string;
      }>>(settings.geminiApiKey, characterPrompt, { temperature: 0.8 });

      for (const char of characterResult) {
        await createCharacter(projectId, {
          name: char.name,
          role: char.role,
          age: char.age,
          gender: char.gender,
          occupation: char.occupation,
          personality: char.personality,
          background: char.background,
          motivation: char.motivation,
          goal: char.goal,
          appearance: char.appearance,
          strengths: [],
          weaknesses: [],
          relationships: [],
          emotionalState: [],
          speechPattern: {
            formalityLevel: 3,
            speechSpeed: 'normal',
            vocabularyLevel: 'average',
            tone: '',
          },
          arc: {
            type: 'positive',
            startingState: '',
            endingState: '',
            keyMoments: [],
          },
        });
      }

      // 6단계: 플롯 포인트 생성
      setAutoGenerateProgress({ step: '플롯 구조 생성 중...', current: 6, total: totalSteps });
      await fetchPlotStructure(projectId);

      const plotPrompt = `다음 소설 정보를 바탕으로 주요 플롯 포인트 7개를 JSON 배열로 생성해주세요.

제목: ${title}
시놉시스: ${newSynopsis}
상세 시놉시스: ${newDetailed}

JSON 형식:
[
  {"title": "제목", "description": "설명", "type": "opening", "order": 0},
  ...
]

타입: opening, inciting-incident, first-plot-point, midpoint, second-plot-point, climax, resolution`;

      const plotResult = await generateJSON<Array<{
        title: string;
        description: string;
        type: PlotPoint['type'];
        order: number;
      }>>(settings.geminiApiKey, plotPrompt, { temperature: 0.7 });

      for (const plot of plotResult) {
        await addPlotPoint({
          ...plot,
          stage: '',
          completed: false,
        });
      }

      // 7단계: 챕터 구조 생성
      setAutoGenerateProgress({ step: '챕터 구조 생성 중...', current: 7, total: totalSteps });
      const numChapters = selectedLength.chapters;
      const chapterPrompt = `다음 소설 정보를 바탕으로 ${numChapters}개 챕터 구조를 JSON 배열로 생성해주세요.

시놉시스: ${newSynopsis}
상세 시놉시스: ${newDetailed}
목표 분량: ${selectedLength.label} (총 ${numChapters}장)

JSON 형식:
[
  {"number": 1, "title": "제목", "purpose": "이 챕터의 목적", "keyEvents": ["주요 사건1", "주요 사건2"]},
  ...
]

각 챕터는 스토리 진행에 맞게 기승전결 구조를 따르고, 제목은 흥미를 끄는 것으로 작성해주세요.`;

      const chapterResult = await generateJSON<Array<{
        number: number;
        title: string;
        purpose: string;
        keyEvents: string[];
      }>>(settings.geminiApiKey, chapterPrompt, { temperature: 0.7 });

      for (const chapter of chapterResult) {
        await createChapter(projectId, {
          number: chapter.number,
          title: chapter.title,
          purpose: chapter.purpose,
          keyEvents: chapter.keyEvents,
          status: 'outline',
        });
      }

      setAutoGenerateProgress({ step: '완료!', current: totalSteps, total: totalSteps });

      // 완료 알림
      setTimeout(() => {
        setAutoGenerateProgress(null);
        alert('AI 자동 생성이 완료되었습니다! 각 메뉴에서 결과를 확인하고 수정할 수 있습니다.');
      }, 1000);

    } catch (error) {
      console.error('자동 생성 실패:', error);
      alert('자동 생성 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsAutoGenerating(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      {/* AI 자동 생성 진행 상태 */}
      {isAutoGenerating && autoGenerateProgress && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
        >
          <Card className="w-[400px]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                AI 자동 생성 중
              </CardTitle>
              <CardDescription>
                모든 설정을 자동으로 생성하고 있습니다. 잠시만 기다려주세요.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{autoGenerateProgress.step}</span>
                  <span>{autoGenerateProgress.current}/{autoGenerateProgress.total}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${(autoGenerateProgress.current / autoGenerateProgress.total) * 100}%` }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1">
                {[1, 2, 3, 4, 5, 6, 7].map((step) => (
                  <div
                    key={step}
                    className={`h-1 rounded-full ${
                      step <= autoGenerateProgress.current ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">기획</h1>
          <p className="text-muted-foreground">소설의 기본 설정을 정의하세요</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleAutoGenerateAll}
            disabled={isAutoGenerating || !concept}
            variant="default"
            className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            <Rocket className="h-4 w-4" />
            AI 전체 자동 생성
          </Button>
          <Button onClick={handleSave} disabled={isSaving} variant="outline" className="gap-2">
            <Save className="h-4 w-4" />
            {isSaving ? '저장 중...' : '저장'}
          </Button>
        </div>
      </div>

      {/* 자동 생성 안내 카드 */}
      {!isAutoGenerating && (
        <Card className="border-dashed border-2 border-primary/30 bg-primary/5">
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">AI가 모든 것을 자동으로 생성합니다</h3>
                <p className="text-sm text-muted-foreground">
                  컨셉만 입력하면 로그라인, 시놉시스, 세계관, 캐릭터, 플롯, 챕터까지 모두 AI가 생성합니다.
                  생성 후 각 메뉴에서 내용을 확인하고 수정하세요.
                </p>
                {/* 목표 분량 선택 */}
                <div className="flex items-center gap-3 mt-3">
                  <Label className="text-sm whitespace-nowrap">목표 분량:</Label>
                  <Select value={targetNovelLength.toString()} onValueChange={(v) => setTargetNovelLength(Number(v))}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {novelLengths.map((length) => (
                        <SelectItem key={length.value} value={length.value.toString()}>
                          {length.label} ({length.chapters}장, {length.characters}명)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {concept && (
                <Button onClick={handleAutoGenerateAll} disabled={isAutoGenerating} className="gap-2">
                  <Wand2 className="h-4 w-4" />
                  지금 생성
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="basic" className="space-y-6">
        <TabsList>
          <TabsTrigger value="basic">기본 정보</TabsTrigger>
          <TabsTrigger value="synopsis">시놉시스</TabsTrigger>
          <TabsTrigger value="style">문체 설정</TabsTrigger>
          <TabsTrigger value="target">타겟 분석</TabsTrigger>
        </TabsList>

        {/* 기본 정보 탭 */}
        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                기본 정보
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">제목</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="소설 제목을 입력하세요"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="concept">컨셉 / 아이디어</Label>
                <Textarea
                  id="concept"
                  value={concept}
                  onChange={(e) => setConcept(e.target.value)}
                  placeholder="소설의 핵심 아이디어를 입력하세요"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="logline">로그라인</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={generateLogline}
                    disabled={isGenerating || !concept}
                    className="gap-1"
                  >
                    {isGenerating && generatingType === 'logline' ? (
                      <RefreshCw className="h-3 w-3 animate-spin" />
                    ) : (
                      <Wand2 className="h-3 w-3" />
                    )}
                    AI 생성
                  </Button>
                </div>
                <Textarea
                  id="logline"
                  value={logline}
                  onChange={(e) => setLogline(e.target.value)}
                  placeholder="한 문장으로 소설을 요약하세요"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>장르</Label>
                <div className="flex flex-wrap gap-2">
                  {genres.map((genre) => (
                    <Badge
                      key={genre}
                      variant={selectedGenres.includes(genre) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => handleGenreToggle(genre)}
                    >
                      {genre}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>키워드</Label>
                <div className="flex gap-2">
                  <Input
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    placeholder="키워드 추가"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword()}
                  />
                  <Button onClick={handleAddKeyword} variant="outline">추가</Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {keywords.map((keyword) => (
                    <Badge
                      key={keyword}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => handleRemoveKeyword(keyword)}
                    >
                      {keyword} ×
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 시놉시스 탭 */}
        <TabsContent value="synopsis" className="space-y-6">
          {isGenerating && (
            <AIThinking message={`${generatingType === 'synopsis' ? '시놉시스를' : '상세 시놉시스를'} 작성하고 있습니다...`} />
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  시놉시스
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={generateSynopsis}
                  disabled={isGenerating || !concept}
                  className="gap-1"
                >
                  {isGenerating && generatingType === 'synopsis' ? (
                    <RefreshCw className="h-3 w-3 animate-spin" />
                  ) : (
                    <Wand2 className="h-3 w-3" />
                  )}
                  AI 생성
                </Button>
              </CardTitle>
              <CardDescription>300-500자 분량의 요약</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={synopsis}
                onChange={(e) => setSynopsis(e.target.value)}
                placeholder="소설의 시놉시스를 작성하세요"
                rows={8}
              />
              <p className="text-xs text-muted-foreground mt-2">
                {synopsis.length}자
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>상세 시놉시스</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={generateDetailedSynopsis}
                  disabled={isGenerating || !synopsis}
                  className="gap-1"
                >
                  {isGenerating && generatingType === 'detailed' ? (
                    <RefreshCw className="h-3 w-3 animate-spin" />
                  ) : (
                    <Wand2 className="h-3 w-3" />
                  )}
                  AI 확장
                </Button>
              </CardTitle>
              <CardDescription>1000-1500자 분량의 상세 줄거리</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={detailedSynopsis}
                onChange={(e) => setDetailedSynopsis(e.target.value)}
                placeholder="상세한 줄거리를 작성하세요"
                rows={12}
              />
              <p className="text-xs text-muted-foreground mt-2">
                {detailedSynopsis.length}자
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 문체 설정 탭 */}
        <TabsContent value="style" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>문체 설정</CardTitle>
              <CardDescription>AI가 참고할 글쓰기 스타일을 설정하세요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>시점</Label>
                  <Select value={perspective} onValueChange={setPerspective}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {perspectives.map((p) => (
                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>문체</Label>
                  <Select value={writingStyle} onValueChange={setWritingStyle}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {writingStyles.map((s) => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>대화 비중</Label>
                  <span className="text-sm text-muted-foreground">{dialogueRatio}%</span>
                </div>
                <Slider
                  value={[dialogueRatio]}
                  onValueChange={(v) => setDialogueRatio(v[0])}
                  min={10}
                  max={80}
                  step={5}
                />
                <p className="text-xs text-muted-foreground">
                  대화문이 전체에서 차지하는 비율
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>묘사 상세도</Label>
                  <span className="text-sm text-muted-foreground">{descriptionDetail}/5</span>
                </div>
                <Slider
                  value={[descriptionDetail]}
                  onValueChange={(v) => setDescriptionDetail(v[0])}
                  min={1}
                  max={5}
                  step={1}
                />
                <p className="text-xs text-muted-foreground">
                  1: 간결한 묘사 / 5: 상세한 묘사
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>챕터당 목표 글자수</Label>
                  <span className="text-sm text-muted-foreground">{targetChapterLength.toLocaleString()}자</span>
                </div>
                <Slider
                  value={[targetChapterLength]}
                  onValueChange={(v) => setTargetChapterLength(v[0])}
                  min={2000}
                  max={15000}
                  step={500}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 타겟 분석 탭 */}
        <TabsContent value="target" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                타겟 독자
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>연령 등급</Label>
                <Select value={ageRating} onValueChange={(v) => setAgeRating(v as 'all' | 'teen' | 'adult')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ageRatings.map((r) => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetAudience">타겟 독자층</Label>
                <Textarea
                  id="targetAudience"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="예: 20-30대 여성, 로맨스 판타지를 좋아하는 독자"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                유사 작품
              </CardTitle>
              <CardDescription>
                비슷한 느낌의 작품을 참고로 등록하세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="예: '해리포터' 시리즈의 마법 학원물 + '반지의 제왕'의 서사시적 모험"
                rows={3}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
