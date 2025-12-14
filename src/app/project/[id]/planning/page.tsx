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
  const [targetChapterCount, setTargetChapterCount] = useState(10);
  const [targetChapterLength, setTargetChapterLength] = useState(20000);
  const [targetSceneLength, setTargetSceneLength] = useState(3000);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingType, setGeneratingType] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [isAutoGenerating, setIsAutoGenerating] = useState(false);

  // 총 목표 글자수 자동 계산 (챕터 수 × 챕터당 글자수)
  const calculatedTotalLength = targetChapterCount * targetChapterLength;
  // 예상 권수 계산 (1권 = 약 20만자 기준)
  const estimatedBooks = Math.ceil(calculatedTotalLength / 200000);
  const [autoGenerateProgress, setAutoGenerateProgress] = useState<{
    step: string;
    current: number;
    total: number;
  } | null>(null);
  const [generationStep, setGenerationStep] = useState(0); // 0: 시작 전, 1-8: 각 단계
  const [stepError, setStepError] = useState<string | null>(null);
  const [isFullAutoMode, setIsFullAutoMode] = useState(false); // 전체 자동 생성 모드

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
      setTargetChapterCount(currentProject.settings.targetChapterCount || 10);
      setTargetChapterLength(currentProject.settings.targetChapterLength);
      setTargetSceneLength(currentProject.settings.targetSceneLength || 3000);
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
          targetChapterCount,
          targetChapterLength,
          targetSceneLength,
          targetTotalLength: calculatedTotalLength,
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

  // 단계별 생성 함수들
  // 분량 라벨 생성 (새로운 기준: 단편 20만+, 중편 60만+, 장편 100만+, 대작 200만+, 시리즈 400만+)
  const getLengthLabel = () => {
    if (calculatedTotalLength < 200000) return `습작 (${Math.floor(calculatedTotalLength / 10000)}만자)`;
    if (calculatedTotalLength < 600000) return `단편 (${Math.floor(calculatedTotalLength / 10000)}만자, 약 ${estimatedBooks}권)`;
    if (calculatedTotalLength < 1000000) return `중편 (${Math.floor(calculatedTotalLength / 10000)}만자, 약 ${estimatedBooks}권)`;
    if (calculatedTotalLength < 2000000) return `장편 (${Math.floor(calculatedTotalLength / 10000)}만자, 약 ${estimatedBooks}권)`;
    if (calculatedTotalLength < 4000000) return `대작 (${Math.floor(calculatedTotalLength / 10000)}만자, 약 ${estimatedBooks}권)`;
    return `시리즈급 (${Math.floor(calculatedTotalLength / 10000)}만자, 약 ${estimatedBooks}권)`;
  };

  // 분량에 따른 권장 구성 정보
  const getRecommendedConfig = () => {
    if (calculatedTotalLength < 200000) {
      return { chapters: 5, characters: 5, worldSettings: 4, plotPoints: 5, scenesPerChapter: 3 };
    }
    if (calculatedTotalLength < 600000) { // 단편 20만~60만
      return { chapters: 10, characters: 8, worldSettings: 6, plotPoints: 8, scenesPerChapter: 5 };
    }
    if (calculatedTotalLength < 1000000) { // 중편 60만~100만
      return { chapters: 20, characters: 12, worldSettings: 8, plotPoints: 10, scenesPerChapter: 6 };
    }
    if (calculatedTotalLength < 2000000) { // 장편 100만~200만
      return { chapters: 30, characters: 15, worldSettings: 10, plotPoints: 12, scenesPerChapter: 8 };
    }
    if (calculatedTotalLength < 4000000) { // 대작 200만~400만
      return { chapters: 50, characters: 20, worldSettings: 12, plotPoints: 15, scenesPerChapter: 10 };
    }
    // 시리즈급 400만 이상
    return { chapters: 100, characters: 25, worldSettings: 15, plotPoints: 20, scenesPerChapter: 12 };
  };

  // 1단계: 로그라인 + 시놉시스 생성
  const handleStep1_Synopsis = async () => {
    if (!settings?.geminiApiKey || !concept) {
      alert('API 키와 컨셉을 먼저 입력해주세요.');
      return;
    }

    setIsAutoGenerating(true);
    setStepError(null);
    setAutoGenerateProgress({ step: '로그라인 생성 중...', current: 1, total: 3 });

    try {
      const config = getRecommendedConfig();

      // 로그라인 생성
      const loglinePrompt = `당신은 베스트셀러 작가이자 스토리 컨설턴트입니다.
다음 소설 컨셉을 바탕으로 독자를 사로잡는 로그라인을 작성해주세요.

[필수 목표]
- 컨셉: ${concept}
- 장르: ${selectedGenres.join(', ') || '판타지, 액션'}
- 목표 분량: ${getLengthLabel()}
- 총 글자수: ${calculatedTotalLength.toLocaleString()}자 (반드시 이 분량을 채울 수 있는 스케일의 이야기)
- 총 ${targetChapterCount}장, 챕터당 ${targetChapterLength.toLocaleString()}자

[중요] 이 소설은 ${calculatedTotalLength.toLocaleString()}자 분량입니다.
${calculatedTotalLength >= 1000000 ? '이것은 출판 소설 ' + estimatedBooks + '권 분량의 대작입니다. 그에 걸맞은 웅장하고 복잡한 서사가 필요합니다.' : ''}

로그라인 작성 공식:
[주인공]이/가 [상황/세계]에서 [목표]를 위해 [장애물/적대자]와 맞서 싸우며 [위험/대가]를 감수해야 한다.

매력적인 로그라인 한 문장만 출력하세요.`;
      const newLogline = await generateText(settings.geminiApiKey, loglinePrompt, { temperature: 0.7 });
      setLogline(newLogline.trim());

      // 시놉시스 생성
      setAutoGenerateProgress({ step: '시놉시스 생성 중...', current: 2, total: 3 });
      const synopsisPrompt = `당신은 베스트셀러 작가입니다.
다음 정보를 바탕으로 ${calculatedTotalLength.toLocaleString()}자 분량의 소설을 위한 출판사 제출용 시놉시스를 작성해주세요.

[필수 목표]
- 컨셉: ${concept}
- 로그라인: ${newLogline}
- 장르: ${selectedGenres.join(', ') || '판타지, 액션'}
- 목표 분량: ${getLengthLabel()} = 총 ${calculatedTotalLength.toLocaleString()}자
- 구성: ${targetChapterCount}장 × ${targetChapterLength.toLocaleString()}자/장
- 예상 등장인물: ${config.characters}명
- 예상 플롯 포인트: ${config.plotPoints}개

[중요] 이 소설은 ${estimatedBooks}권 분량입니다. 시놉시스는 이 분량을 충분히 채울 수 있는 복잡하고 깊이 있는 스토리를 담아야 합니다.

시놉시스 필수 포함 사항 (3000자 내외):
1. 세계관 배경 - ${calculatedTotalLength >= 1000000 ? '광대하고 정교한 세계관 설정' : '핵심 배경 설명'}
2. 주인공 소개 - 캐릭터의 시작점, 내면의 결함
3. 촉발 사건 - 모험/갈등의 시작
4. 1차 시련 - 초기 도전과 성장
5. 중반 반전 - 스토리의 전환점
6. 2차 시련 - 더 큰 위기
7. 암흑의 순간 - 최대 위기, 모든 것을 잃음
8. 클라이맥스 - 최종 대결
9. 결말 - 변화와 성장, 새로운 일상

시놉시스만 출력하세요. 번호 없이 자연스러운 문장으로.`;
      const newSynopsis = await generateText(settings.geminiApiKey, synopsisPrompt, { temperature: 0.7, maxTokens: 6000 });
      setSynopsis(newSynopsis.trim());

      // 상세 시놉시스 생성
      setAutoGenerateProgress({ step: '상세 시놉시스 생성 중...', current: 3, total: 3 });
      const detailedPrompt = `당신은 베스트셀러 작가입니다.
다음 시놉시스를 바탕으로 ${calculatedTotalLength.toLocaleString()}자 분량 소설의 상세 기획서를 작성해주세요.

[필수 목표]
- 시놉시스: ${newSynopsis}
- 장르: ${selectedGenres.join(', ')}
- 목표 분량: ${getLengthLabel()} = 총 ${calculatedTotalLength.toLocaleString()}자
- 구성: ${targetChapterCount}장 × ${targetChapterLength.toLocaleString()}자/장 × ${config.scenesPerChapter}씬/장
- 이 분량은 출판 소설 약 ${estimatedBooks}권에 해당합니다.

[중요] 상세 시놉시스는 ${targetChapterCount}장의 모든 내용을 충분히 채울 수 있도록
각 부분별로 구체적인 사건, 갈등, 캐릭터 변화를 포함해야 합니다.

상세 시놉시스 (${Math.min(8000, calculatedTotalLength / 100)}자 내외):

1부 기(起) - 도입부 (${Math.floor(targetChapterCount * 0.2)}장 분량):
- 세계관과 일상
- 주인공 소개와 내면의 결함
- 촉발 사건과 모험의 시작

2부 승(承) - 전개부 (${Math.floor(targetChapterCount * 0.3)}장 분량):
- 새로운 세계/상황 적응
- 동료들과의 만남
- 1차 시련과 성장
- 중간 반전점

3부 전(轉) - 위기부 (${Math.floor(targetChapterCount * 0.3)}장 분량):
- 진정한 적의 등장
- 2차 시련과 패배
- 암흑의 순간 (최악의 위기)
- 재기를 위한 결심

4부 결(結) - 결말부 (${Math.floor(targetChapterCount * 0.2)}장 분량):
- 최종 대결 준비
- 클라이맥스 전투/대면
- 갈등 해결
- 에필로그와 새로운 일상

각 부분을 상세하게 서술해주세요. 이 기획서를 바탕으로 ${calculatedTotalLength.toLocaleString()}자의 소설이 집필됩니다.`;
      const newDetailed = await generateText(settings.geminiApiKey, detailedPrompt, { temperature: 0.7, maxTokens: 16000 });
      setDetailedSynopsis(newDetailed.trim());

      // 저장
      await updateProject(projectId, {
        title: title || '새 소설',
        concept,
        logline: newLogline.trim(),
        synopsis: newSynopsis.trim(),
        detailedSynopsis: newDetailed.trim(),
        genre: selectedGenres.length > 0 ? selectedGenres : ['판타지', '액션'],
        settings: {
          ...currentProject?.settings,
          writingStyle: writingStyle as 'calm' | 'elaborate' | 'concise' | 'lyrical' | 'tense' | 'humorous' | 'custom',
          perspective: perspective as 'first' | 'third-limited' | 'omniscient' | 'second',
          tense: currentProject?.settings?.tense || 'past',
          dialogueRatio,
          descriptionDetail,
          targetChapterCount,
          targetChapterLength,
          targetSceneLength,
          targetTotalLength: calculatedTotalLength,
          pacingPreference: currentProject?.settings?.pacingPreference || 'moderate',
          emotionIntensity: currentProject?.settings?.emotionIntensity || 5,
          language: currentProject?.settings?.language || 'ko',
          autoSaveInterval: currentProject?.settings?.autoSaveInterval || 30,
        },
      });

      setGenerationStep(1);
      // 전체 자동 생성 중이 아닐 때만 알림
      if (!isFullAutoMode) {
        alert('1단계 완료! 로그라인, 시놉시스, 상세 시놉시스가 생성되었습니다.');
      }
    } catch (error: unknown) {
      console.error('1단계 실패:', error);
      setStepError(error instanceof Error ? error.message : '알 수 없는 오류');
      throw error; // 전체 자동 생성 시 에러를 상위로 전파
    } finally {
      if (!isFullAutoMode) {
        setIsAutoGenerating(false);
        setAutoGenerateProgress(null);
      }
    }
  };

  // 2단계: 세계관 생성
  const handleStep2_World = async () => {
    if (!settings?.geminiApiKey) {
      alert('API 키를 먼저 설정해주세요.');
      return;
    }

    setIsAutoGenerating(true);
    setStepError(null);
    setAutoGenerateProgress({ step: '세계관 생성 중...', current: 1, total: 1 });

    try {
      const config = getRecommendedConfig();
      const worldCount = config.worldSettings;

      const worldPrompt = `당신은 세계관 전문가입니다.
다음 소설 정보를 바탕으로 세계관 설정 ${worldCount}개를 JSON 배열로 생성해주세요.

[필수 목표]
- 제목: ${title}
- 컨셉: ${concept}
- 시놉시스: ${synopsis}
- 장르: ${selectedGenres.join(', ')}
- 목표 분량: ${getLengthLabel()} = 총 ${calculatedTotalLength.toLocaleString()}자 (약 ${estimatedBooks}권)
- 총 ${targetChapterCount}장의 소설

[중요] 이 소설은 ${calculatedTotalLength.toLocaleString()}자 분량입니다.
${calculatedTotalLength >= 1000000 ? '이것은 대작급 소설이므로 세계관이 매우 정교하고 광대해야 합니다. 각 설정은 최소 200자 이상으로 상세하게 작성해주세요.' : '각 설정은 최소 100자 이상으로 작성해주세요.'}

JSON 형식 (반드시 이 형식만 출력):
[
  {"category": "time", "title": "시대 배경", "description": "상세 설명", "importance": "core"},
  {"category": "space", "title": "지리/공간", "description": "상세 설명", "importance": "core"}
]

category 값: time, space, society, magic, technology, history, culture, politics, economy, religion, custom
importance 값: core, major, minor

${worldCount}개 항목을 JSON 배열로만 출력하세요.`;

      const worldResult = await generateJSON<Array<{category: WorldSetting['category'], title: string, description: string, importance: WorldSetting['importance']}>>(
        settings.geminiApiKey, worldPrompt, { temperature: 0.7, maxTokens: 4096 }
      );

      for (const world of worldResult) {
        await createWorldSetting(projectId, world);
      }

      setGenerationStep(2);
      if (!isFullAutoMode) {
        alert(`2단계 완료! 세계관 ${worldResult.length}개가 생성되었습니다.`);
      }
    } catch (error: unknown) {
      console.error('2단계 실패:', error);
      setStepError(error instanceof Error ? error.message : '알 수 없는 오류');
      throw error;
    } finally {
      if (!isFullAutoMode) {
        setIsAutoGenerating(false);
        setAutoGenerateProgress(null);
      }
    }
  };

  // 3단계: 캐릭터 생성
  const handleStep3_Characters = async () => {
    if (!settings?.geminiApiKey) {
      alert('API 키를 먼저 설정해주세요.');
      return;
    }

    setIsAutoGenerating(true);
    setStepError(null);
    setAutoGenerateProgress({ step: '캐릭터 생성 중...', current: 1, total: 1 });

    try {
      const config = getRecommendedConfig();
      const numCharacters = config.characters;

      const characterPrompt = `당신은 캐릭터 디자인 전문가입니다.
다음 소설 정보를 바탕으로 캐릭터 ${numCharacters}명을 JSON 배열로 생성해주세요.

[필수 목표]
- 제목: ${title}
- 컨셉: ${concept}
- 시놉시스: ${synopsis}
- 목표 분량: ${getLengthLabel()} = 총 ${calculatedTotalLength.toLocaleString()}자 (약 ${estimatedBooks}권)
- 총 ${targetChapterCount}장의 소설

[중요] 이 소설은 ${calculatedTotalLength.toLocaleString()}자 분량입니다.
${calculatedTotalLength >= 1000000 ? `
이것은 대작급 소설이므로 캐릭터가 충분히 많고 각각 깊이 있는 배경을 가져야 합니다.
- 주인공 1명
- 주요 조연 (동료/적대자) 5-8명
- 보조 캐릭터 나머지
각 캐릭터의 성격, 배경, 동기를 5문장 이상으로 상세하게 작성해주세요.` : ''}

JSON 형식 (반드시 이 형식만 출력):
[
  {
    "name": "홍길동",
    "role": "protagonist",
    "age": "25",
    "gender": "남성",
    "occupation": "검객",
    "personality": "성격 설명 3-5문장",
    "background": "배경 스토리 3-5문장",
    "motivation": "동기 1-2문장",
    "goal": "목표",
    "appearance": "외모 설명 2-3문장"
  }
]

role 값: protagonist, antagonist, deuteragonist, supporting, minor

${numCharacters}명의 캐릭터를 JSON 배열로만 출력하세요.`;

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
      }>>(settings.geminiApiKey, characterPrompt, { temperature: 0.8, maxTokens: 6000 });

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
            type: char.role === 'protagonist' ? 'positive' : (char.role === 'antagonist' ? 'negative' : 'flat'),
            startingState: '',
            endingState: '',
            keyMoments: [],
          },
        });
      }

      setGenerationStep(3);
      if (!isFullAutoMode) {
        alert(`3단계 완료! 캐릭터 ${characterResult.length}명이 생성되었습니다.`);
      }
    } catch (error: unknown) {
      console.error('3단계 실패:', error);
      setStepError(error instanceof Error ? error.message : '알 수 없는 오류');
      throw error;
    } finally {
      if (!isFullAutoMode) {
        setIsAutoGenerating(false);
        setAutoGenerateProgress(null);
      }
    }
  };

  // 4단계: 플롯 생성
  const handleStep4_Plot = async () => {
    if (!settings?.geminiApiKey) {
      alert('API 키를 먼저 설정해주세요.');
      return;
    }

    setIsAutoGenerating(true);
    setStepError(null);
    setAutoGenerateProgress({ step: '플롯 구조 생성 중...', current: 1, total: 1 });

    try {
      await fetchPlotStructure(projectId);
      const config = getRecommendedConfig();
      const plotCount = config.plotPoints;

      const plotPrompt = `당신은 스토리 구조 전문가입니다.
다음 소설 정보를 바탕으로 플롯 포인트 ${plotCount}개를 JSON 배열로 생성해주세요.

[필수 목표]
- 제목: ${title}
- 시놉시스: ${synopsis}
- 상세 시놉시스: ${detailedSynopsis.slice(0, 3000)}
- 목표 분량: ${getLengthLabel()} = 총 ${calculatedTotalLength.toLocaleString()}자 (약 ${estimatedBooks}권)
- 총 ${targetChapterCount}장의 소설

[중요] 이 소설은 ${calculatedTotalLength.toLocaleString()}자 분량입니다.
${calculatedTotalLength >= 1000000 ? `
이것은 대작급 소설이므로 플롯 포인트가 더 많고 복잡해야 합니다.
- 메인 플롯 외에 서브플롯도 포함
- 각 플롯 포인트는 3-5문장으로 상세하게 설명
- 전체 ${targetChapterCount}장에 걸쳐 균형있게 배치` : '각 플롯 포인트를 2-3문장으로 설명해주세요.'}

JSON 형식 (반드시 이 형식만 출력):
[
  {"title": "도입", "description": "설명", "type": "opening", "order": 1},
  {"title": "촉발 사건", "description": "설명", "type": "inciting-incident", "order": 2}
]

type 값: opening, inciting-incident, first-plot-point, rising-action, midpoint, second-plot-point, climax, resolution

${plotCount}개 플롯 포인트를 JSON 배열로만 출력하세요.`;

      const plotResult = await generateJSON<Array<{
        title: string;
        description: string;
        type: PlotPoint['type'];
        order: number;
      }>>(settings.geminiApiKey, plotPrompt, { temperature: 0.7, maxTokens: 4096 });

      for (const plot of plotResult) {
        await addPlotPoint({
          ...plot,
          stage: '',
          completed: false,
        });
      }

      setGenerationStep(4);
      if (!isFullAutoMode) {
        alert(`4단계 완료! 플롯 포인트 ${plotResult.length}개가 생성되었습니다.`);
      }
    } catch (error: unknown) {
      console.error('4단계 실패:', error);
      setStepError(error instanceof Error ? error.message : '알 수 없는 오류');
      throw error;
    } finally {
      if (!isFullAutoMode) {
        setIsAutoGenerating(false);
        setAutoGenerateProgress(null);
      }
    }
  };

  // 5단계: 챕터 생성
  const handleStep5_Chapters = async () => {
    if (!settings?.geminiApiKey) {
      alert('API 키를 먼저 설정해주세요.');
      return;
    }

    setIsAutoGenerating(true);
    setStepError(null);
    setAutoGenerateProgress({ step: '챕터 구조 생성 중...', current: 1, total: 1 });

    try {
      const config = getRecommendedConfig();

      const chapterPrompt = `당신은 소설 구성 전문가입니다.
다음 소설 정보를 바탕으로 ${targetChapterCount}개 챕터를 JSON 배열로 생성해주세요.

[필수 목표]
- 시놉시스: ${synopsis}
- 상세 시놉시스: ${detailedSynopsis.slice(0, 4000)}
- 목표 분량: ${getLengthLabel()} = 총 ${calculatedTotalLength.toLocaleString()}자
- 구성: ${targetChapterCount}장 × ${targetChapterLength.toLocaleString()}자/장 × ${config.scenesPerChapter}씬/장
- 이 분량은 출판 소설 약 ${estimatedBooks}권에 해당합니다.

[중요] 이 소설은 ${calculatedTotalLength.toLocaleString()}자 분량입니다.
각 챕터는 ${targetChapterLength.toLocaleString()}자를 채울 수 있도록 충분한 내용이 있어야 합니다.
${calculatedTotalLength >= 1000000 ? `
이것은 대작급 소설이므로:
- 각 챕터는 ${config.scenesPerChapter}개 이상의 씬으로 구성
- 챕터별 목적과 주요 사건을 상세하게 기술
- 전체 스토리 아크를 균형있게 배분` : ''}

[챕터 배분 가이드]
- 1부 기(起) 도입: 1~${Math.floor(targetChapterCount * 0.2)}장
- 2부 승(承) 전개: ${Math.floor(targetChapterCount * 0.2) + 1}~${Math.floor(targetChapterCount * 0.5)}장
- 3부 전(轉) 위기: ${Math.floor(targetChapterCount * 0.5) + 1}~${Math.floor(targetChapterCount * 0.8)}장
- 4부 결(結) 결말: ${Math.floor(targetChapterCount * 0.8) + 1}~${targetChapterCount}장

JSON 형식 (반드시 이 형식만 출력):
[
  {
    "number": 1,
    "title": "챕터 제목",
    "purpose": "이 챕터의 목적 2-3문장",
    "keyEvents": ["사건1 상세설명", "사건2 상세설명", "사건3 상세설명", "사건4", "사건5"]
  }
]

${targetChapterCount}개 챕터를 JSON 배열로만 출력하세요.`;

      const chapterResult = await generateJSON<Array<{
        number: number;
        title: string;
        purpose: string;
        keyEvents: string[];
      }>>(settings.geminiApiKey, chapterPrompt, { temperature: 0.7, maxTokens: 8192 });

      for (const chapter of chapterResult) {
        await createChapter(projectId, {
          number: chapter.number,
          title: chapter.title,
          purpose: chapter.purpose,
          keyEvents: chapter.keyEvents,
          status: 'outline',
        });
      }

      setGenerationStep(5);
      if (!isFullAutoMode) {
        alert(`5단계 완료! 챕터 ${chapterResult.length}개가 생성되었습니다.\n\n모든 기획이 완료되었습니다!`);
      }
    } catch (error: unknown) {
      console.error('5단계 실패:', error);
      setStepError(error instanceof Error ? error.message : '알 수 없는 오류');
      throw error;
    } finally {
      if (!isFullAutoMode) {
        setIsAutoGenerating(false);
        setAutoGenerateProgress(null);
      }
    }
  };

  // 전체 자동 생성 (순차 실행)
  const handleAutoGenerateAll = async () => {
    if (!settings?.geminiApiKey || !concept) {
      alert('API 키와 컨셉을 먼저 입력해주세요.');
      return;
    }

    setIsFullAutoMode(true);
    setIsAutoGenerating(true);
    setStepError(null);

    try {
      // 1단계: 시놉시스
      setAutoGenerateProgress({ step: '1단계: 시놉시스 생성 중...', current: 1, total: 5 });
      await handleStep1_Synopsis();

      // 2단계: 세계관
      setAutoGenerateProgress({ step: '2단계: 세계관 생성 중...', current: 2, total: 5 });
      await handleStep2_World();

      // 3단계: 캐릭터
      setAutoGenerateProgress({ step: '3단계: 캐릭터 생성 중...', current: 3, total: 5 });
      await handleStep3_Characters();

      // 4단계: 플롯
      setAutoGenerateProgress({ step: '4단계: 플롯 생성 중...', current: 4, total: 5 });
      await handleStep4_Plot();

      // 5단계: 챕터
      setAutoGenerateProgress({ step: '5단계: 챕터 생성 중...', current: 5, total: 5 });
      await handleStep5_Chapters();

      // 전체 완료 알림
      alert('전체 자동 생성이 완료되었습니다!\n\n각 메뉴에서 결과를 확인하고 수정할 수 있습니다.');
    } catch (error) {
      console.error('전체 자동 생성 실패:', error);
      const failedStep = autoGenerateProgress?.step || '알 수 없는 단계';
      alert(`자동 생성 중 오류가 발생했습니다.\n\n실패 단계: ${failedStep}\n\n해당 단계부터 다시 시도해주세요.`);
    } finally {
      setIsFullAutoMode(false);
      setIsAutoGenerating(false);
      setAutoGenerateProgress(null);
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

      {/* 단계별 생성 카드 */}
      <Card className="border-dashed border-2 border-primary/30 bg-primary/5">
        <CardContent className="py-4">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">AI 단계별 기획 생성</h3>
                <p className="text-sm text-muted-foreground">
                  각 항목을 개별 생성하거나, 단계별로 진행하세요.
                </p>
              </div>
            </div>

            {/* 목표 분량 설정 */}
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">목표 총 분량</span>
                <span className="text-xl font-bold text-primary">
                  {calculatedTotalLength.toLocaleString()}자
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    ({getLengthLabel()})
                  </span>
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">총 챕터 수</Label>
                    <span className="text-sm text-muted-foreground">{targetChapterCount}장</span>
                  </div>
                  <Slider
                    value={[targetChapterCount]}
                    onValueChange={([v]) => setTargetChapterCount(v)}
                    min={1}
                    max={100}
                    step={1}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">챕터당 글자수</Label>
                    <span className="text-sm text-muted-foreground">{targetChapterLength.toLocaleString()}자</span>
                  </div>
                  <Slider
                    value={[targetChapterLength]}
                    onValueChange={([v]) => setTargetChapterLength(v)}
                    min={5000}
                    max={200000}
                    step={5000}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                분량 기준: 단편 20만+ | 중편 60만+ | 장편 100만+ | 대작 200만+ | 시리즈 400만+ (1권 = 20만자)
              </p>
            </div>

            {/* 에러 표시 */}
            {stepError && (
              <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-sm text-destructive">
                오류: {stepError}
              </div>
            )}

            {/* 진행 상태 표시 */}
            {isAutoGenerating && autoGenerateProgress && (
              <div className="p-3 bg-primary/10 border border-primary/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">{autoGenerateProgress.step}</span>
                </div>
              </div>
            )}

            {/* 1단계: 시놉시스 */}
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">1</span>
                  <span className="font-medium">시놉시스</span>
                  {generationStep >= 1 && <CheckCircle className="h-4 w-4 text-green-500" />}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={generateLogline}
                  disabled={isAutoGenerating || isGenerating || !concept}
                  variant="outline"
                  size="sm"
                  className="gap-1"
                >
                  {isGenerating && generatingType === 'logline' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
                  로그라인 생성
                </Button>
                <Button
                  onClick={generateSynopsis}
                  disabled={isAutoGenerating || isGenerating || !concept}
                  variant="outline"
                  size="sm"
                  className="gap-1"
                >
                  {isGenerating && generatingType === 'synopsis' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
                  시놉시스 생성
                </Button>
                <Button
                  onClick={generateDetailedSynopsis}
                  disabled={isAutoGenerating || isGenerating || !synopsis}
                  variant="outline"
                  size="sm"
                  className="gap-1"
                >
                  {isGenerating && generatingType === 'detailed' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
                  상세 시놉시스 생성
                </Button>
                <Button
                  onClick={handleStep1_Synopsis}
                  disabled={isAutoGenerating || !concept}
                  variant="default"
                  size="sm"
                  className="gap-1"
                >
                  <Rocket className="h-3 w-3" />
                  1단계 전체 생성
                </Button>
              </div>
              {(logline || synopsis) && (
                <div className="text-xs text-muted-foreground">
                  로그라인: {logline ? '✓' : '✗'} | 시놉시스: {synopsis ? `${synopsis.length}자` : '✗'} | 상세: {detailedSynopsis ? `${detailedSynopsis.length}자` : '✗'}
                </div>
              )}
            </div>

            {/* 2단계: 세계관 */}
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">2</span>
                  <span className="font-medium">세계관</span>
                  {generationStep >= 2 && <CheckCircle className="h-4 w-4 text-green-500" />}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={handleStep2_World}
                  disabled={isAutoGenerating || !synopsis}
                  variant={generationStep >= 2 ? "secondary" : "default"}
                  size="sm"
                  className="gap-1"
                >
                  <Wand2 className="h-3 w-3" />
                  세계관 생성 ({getRecommendedConfig().worldSettings}개)
                </Button>
              </div>
            </div>

            {/* 3단계: 캐릭터 */}
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">3</span>
                  <span className="font-medium">캐릭터</span>
                  {generationStep >= 3 && <CheckCircle className="h-4 w-4 text-green-500" />}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={handleStep3_Characters}
                  disabled={isAutoGenerating || !synopsis}
                  variant={generationStep >= 3 ? "secondary" : "default"}
                  size="sm"
                  className="gap-1"
                >
                  <Wand2 className="h-3 w-3" />
                  캐릭터 생성 ({getRecommendedConfig().characters}명)
                </Button>
              </div>
            </div>

            {/* 4단계: 플롯 */}
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">4</span>
                  <span className="font-medium">플롯</span>
                  {generationStep >= 4 && <CheckCircle className="h-4 w-4 text-green-500" />}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={handleStep4_Plot}
                  disabled={isAutoGenerating || !synopsis}
                  variant={generationStep >= 4 ? "secondary" : "default"}
                  size="sm"
                  className="gap-1"
                >
                  <Wand2 className="h-3 w-3" />
                  플롯 포인트 생성 ({getRecommendedConfig().plotPoints}개)
                </Button>
              </div>
            </div>

            {/* 5단계: 챕터 */}
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">5</span>
                  <span className="font-medium">챕터</span>
                  {generationStep >= 5 && <CheckCircle className="h-4 w-4 text-green-500" />}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={handleStep5_Chapters}
                  disabled={isAutoGenerating || !synopsis}
                  variant={generationStep >= 5 ? "secondary" : "default"}
                  size="sm"
                  className="gap-1"
                >
                  <Wand2 className="h-3 w-3" />
                  챕터 구조 생성 ({targetChapterCount}장)
                </Button>
              </div>
            </div>

            {/* 전체 자동 생성 버튼 */}
            <div className="flex justify-center pt-2 border-t">
              <Button
                onClick={handleAutoGenerateAll}
                disabled={isAutoGenerating || !concept}
                variant="default"
                className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                <Rocket className="h-4 w-4" />
                전체 자동 생성 (1~5단계 순차 실행)
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

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
                  min={5000}
                  max={200000}
                  step={5000}
                />
                <p className="text-xs text-muted-foreground">
                  AI 집필 시 각 챕터에 생성될 목표 글자수입니다. (최대 20만자, 소설책 약 1권 분량)
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>씬당 목표 글자수</Label>
                  <span className="text-sm text-muted-foreground">{targetSceneLength.toLocaleString()}자</span>
                </div>
                <Slider
                  value={[targetSceneLength]}
                  onValueChange={(v) => setTargetSceneLength(v[0])}
                  min={1000}
                  max={50000}
                  step={1000}
                />
                <p className="text-xs text-muted-foreground">
                  각 씬(장면)에 생성될 목표 글자수입니다. 챕터는 여러 씬으로 구성됩니다.
                </p>
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
