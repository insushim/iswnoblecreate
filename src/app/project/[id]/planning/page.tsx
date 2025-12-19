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
import { useVolumeStore } from '@/stores/volumeStore';
import { generateJSON, generateText } from '@/lib/gemini';
import { WorldSetting, Character, PlotPoint, VolumeStructure, SceneStructure } from '@/types';

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
  const { createVolume, createScene, updateVolume } = useVolumeStore();

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

  // 세계관 카테고리 목록
  const worldCategories: Array<{category: WorldSetting['category'], name: string, importance: WorldSetting['importance']}> = [
    { category: 'time', name: '시대 배경', importance: 'core' },
    { category: 'space', name: '지리/공간', importance: 'core' },
    { category: 'society', name: '사회 구조', importance: 'major' },
    { category: 'magic', name: '마법/무공 체계', importance: 'major' },
    { category: 'politics', name: '정치/권력', importance: 'major' },
    { category: 'history', name: '역사/전설', importance: 'minor' },
    { category: 'culture', name: '문화/풍습', importance: 'minor' },
    { category: 'economy', name: '경제/생활', importance: 'minor' },
  ];

  // 2단계: 세계관 생성 (하나씩 순차 생성)
  const handleStep2_World = async () => {
    if (!settings?.geminiApiKey) {
      alert('API 키를 먼저 설정해주세요.');
      return;
    }

    setIsAutoGenerating(true);
    setStepError(null);

    try {
      const config = getRecommendedConfig();
      const worldCount = Math.min(config.worldSettings, worldCategories.length);
      let createdCount = 0;

      for (let i = 0; i < worldCount; i++) {
        const cat = worldCategories[i];
        setAutoGenerateProgress({ step: `세계관 생성 중... (${i + 1}/${worldCount}) - ${cat.name}`, current: i + 1, total: worldCount });

        const worldPrompt = `당신은 세계관 전문가입니다.
다음 소설의 "${cat.name}" 설정을 작성해주세요.

[소설 정보]
- 제목: ${title}
- 컨셉: ${concept}
- 시놉시스: ${synopsis.slice(0, 500)}
- 장르: ${selectedGenres.join(', ')}

[요청]
"${cat.name}"에 대한 세계관 설정을 JSON 형식으로 작성해주세요.
${calculatedTotalLength >= 1000000 ? '대작급 소설이므로 300자 이상 상세하게 작성해주세요.' : '150자 이상으로 작성해주세요.'}

JSON 형식 (반드시 이 형식만 출력):
{"category": "${cat.category}", "title": "제목", "description": "상세 설명", "importance": "${cat.importance}"}`;

        try {
          const result = await generateJSON<{category: WorldSetting['category'], title: string, description: string, importance: WorldSetting['importance']}>(
            settings.geminiApiKey, worldPrompt, { temperature: 0.7, maxTokens: 1500 }
          );
          await createWorldSetting(projectId, result);
          createdCount++;
        } catch (err) {
          console.error(`세계관 ${cat.name} 생성 실패:`, err);
          // 개별 실패해도 계속 진행
        }
      }

      setGenerationStep(2);
      if (!isFullAutoMode) {
        alert(`2단계 완료! 세계관 ${createdCount}개가 생성되었습니다.`);
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

  // 개별 세계관 생성 함수
  const handleGenerateSingleWorld = async (category: WorldSetting['category'], name: string, importance: WorldSetting['importance']) => {
    if (!settings?.geminiApiKey) {
      alert('API 키를 먼저 설정해주세요.');
      return;
    }

    setIsGenerating(true);
    setGeneratingType(`world-${category}`);

    try {
      const worldPrompt = `당신은 세계관 전문가입니다.
다음 소설의 "${name}" 설정을 작성해주세요.

[소설 정보]
- 제목: ${title}
- 컨셉: ${concept}
- 시놉시스: ${synopsis.slice(0, 500)}
- 장르: ${selectedGenres.join(', ')}

[요청]
"${name}"에 대한 세계관 설정을 JSON 형식으로 작성해주세요.
150자 이상으로 상세하게 작성해주세요.

JSON 형식 (반드시 이 형식만 출력):
{"category": "${category}", "title": "제목", "description": "상세 설명", "importance": "${importance}"}`;

      const result = await generateJSON<{category: WorldSetting['category'], title: string, description: string, importance: WorldSetting['importance']}>(
        settings.geminiApiKey, worldPrompt, { temperature: 0.7, maxTokens: 1500 }
      );
      await createWorldSetting(projectId, result);
      alert(`"${name}" 세계관이 생성되었습니다.`);
    } catch (error) {
      console.error(`세계관 ${name} 생성 실패:`, error);
      alert(`세계관 생성 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setIsGenerating(false);
      setGeneratingType('');
    }
  };

  // 3단계: 캐릭터 생성 (한 명씩 순차 생성으로 파싱 오류 방지)
  const handleStep3_Characters = async () => {
    if (!settings?.geminiApiKey) {
      alert('API 키를 먼저 설정해주세요.');
      return;
    }

    setIsAutoGenerating(true);
    setStepError(null);

    try {
      const config = getRecommendedConfig();
      const numCharacters = config.characters;
      let createdCount = 0;

      // 캐릭터 역할 분배 계산
      const roleDistribution: Array<{role: Character['role'], label: string}> = [];
      roleDistribution.push({ role: 'protagonist', label: '주인공' });
      roleDistribution.push({ role: 'antagonist', label: '적대자' });

      // 조연 수 계산 (전체의 약 40%)
      const deuteragonistCount = Math.max(2, Math.floor(numCharacters * 0.3));
      for (let i = 0; i < deuteragonistCount; i++) {
        roleDistribution.push({ role: 'deuteragonist', label: `주요 조연 ${i + 1}` });
      }

      // 나머지는 보조 캐릭터
      const supportingCount = numCharacters - roleDistribution.length;
      for (let i = 0; i < supportingCount; i++) {
        roleDistribution.push({ role: 'supporting', label: `보조 캐릭터 ${i + 1}` });
      }

      // 이미 생성된 캐릭터 목록 (중복 방지용)
      const createdCharacters: Array<{name: string, role: string, description: string}> = [];

      for (let i = 0; i < Math.min(numCharacters, roleDistribution.length); i++) {
        const roleInfo = roleDistribution[i];
        setAutoGenerateProgress({
          step: `캐릭터 생성 중... (${i + 1}/${numCharacters}) - ${roleInfo.label}`,
          current: i + 1,
          total: numCharacters
        });

        const existingCharsContext = createdCharacters.length > 0
          ? `\n\n[이미 생성된 캐릭터들 - 중복되지 않게 새로운 캐릭터 생성]\n${createdCharacters.map(c => `- ${c.name} (${c.role}): ${c.description}`).join('\n')}`
          : '';

        const characterPrompt = `당신은 캐릭터 디자인 전문가입니다.
다음 소설의 "${roleInfo.label}" 캐릭터 1명을 JSON으로 생성해주세요.

[소설 정보]
- 제목: ${title}
- 컨셉: ${concept}
- 시놉시스: ${synopsis.slice(0, 1000)}
- 장르: ${selectedGenres.join(', ')}
- 목표 분량: ${getLengthLabel()}${existingCharsContext}

[요청]
역할: ${roleInfo.role} (${roleInfo.label})
${roleInfo.role === 'protagonist' ? '- 소설의 핵심 주인공입니다. 매력적이고 독자가 공감할 수 있는 캐릭터로.' : ''}
${roleInfo.role === 'antagonist' ? '- 주인공과 대립하는 적대자입니다. 단순한 악역이 아닌 입체적인 동기를 가진.' : ''}
${roleInfo.role === 'deuteragonist' ? '- 주인공의 동료/조력자 또는 중요 인물입니다.' : ''}
${roleInfo.role === 'supporting' ? '- 스토리를 풍성하게 만드는 보조 캐릭터입니다.' : ''}

JSON 형식 (반드시 이 형식만 출력):
{
  "name": "캐릭터 이름",
  "role": "${roleInfo.role}",
  "age": "나이",
  "gender": "성별",
  "occupation": "직업/신분",
  "personality": "성격 설명 2-3문장",
  "background": "배경 스토리 2-3문장",
  "motivation": "동기 1문장",
  "goal": "목표",
  "appearance": "외모 설명 1-2문장"
}`;

        try {
          const charResult = await generateJSON<{
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
          }>(settings.geminiApiKey, characterPrompt, { temperature: 0.8, maxTokens: 1500 });

          await createCharacter(projectId, {
            name: charResult.name,
            role: charResult.role,
            age: charResult.age,
            gender: charResult.gender,
            occupation: charResult.occupation,
            personality: charResult.personality,
            background: charResult.background,
            motivation: charResult.motivation,
            goal: charResult.goal,
            appearance: charResult.appearance,
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
              type: charResult.role === 'protagonist' ? 'positive' : (charResult.role === 'antagonist' ? 'negative' : 'flat'),
              startingState: '',
              endingState: '',
              keyMoments: [],
            },
          });

          // 생성된 캐릭터 목록에 추가
          createdCharacters.push({
            name: charResult.name,
            role: roleInfo.label,
            description: charResult.personality.slice(0, 50)
          });
          createdCount++;
        } catch (err) {
          console.error(`캐릭터 ${roleInfo.label} 생성 실패:`, err);
          // 개별 실패해도 계속 진행
        }
      }

      setGenerationStep(3);
      if (!isFullAutoMode) {
        alert(`3단계 완료! 캐릭터 ${createdCount}명이 생성되었습니다.`);
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

  // 4단계: 플롯 생성 (개별 플롯 포인트 순차 생성)
  const handleStep4_Plot = async () => {
    if (!settings?.geminiApiKey) {
      alert('API 키를 먼저 설정해주세요.');
      return;
    }

    setIsAutoGenerating(true);
    setStepError(null);

    try {
      await fetchPlotStructure(projectId);
      const config = getRecommendedConfig();
      const plotCount = config.plotPoints;
      let createdCount = 0;

      // 플롯 포인트 타입 분배 (기승전결 구조)
      const plotTypes: Array<{type: PlotPoint['type'], label: string, description: string}> = [
        { type: 'opening', label: '도입', description: '세계관과 주인공 소개, 일상의 모습' },
        { type: 'inciting-incident', label: '촉발 사건', description: '주인공의 일상을 뒤흔드는 사건' },
        { type: 'first-plot-point', label: '첫 번째 전환점', description: '모험/갈등의 시작, 목표 설정' },
        { type: 'rising-action', label: '상승 액션 1', description: '초기 도전과 성장, 동료 획득' },
        { type: 'rising-action', label: '상승 액션 2', description: '더 큰 도전, 적의 등장' },
        { type: 'midpoint', label: '중간 반전', description: '스토리 방향이 바뀌는 중요한 순간' },
        { type: 'rising-action', label: '상승 액션 3', description: '위기 심화, 내면 갈등' },
        { type: 'second-plot-point', label: '두 번째 전환점', description: '암흑의 순간, 최대 위기' },
        { type: 'climax', label: '클라이맥스', description: '최종 대결, 모든 갈등의 정점' },
        { type: 'resolution', label: '결말', description: '갈등 해결, 새로운 일상' },
      ];

      // 대작의 경우 플롯 포인트 추가
      if (plotCount > 10) {
        const additionalCount = plotCount - 10;
        for (let i = 0; i < additionalCount; i++) {
          plotTypes.splice(5 + i, 0, {
            type: 'rising-action',
            label: `서브플롯 ${i + 1}`,
            description: '메인 스토리와 연결된 부가 사건'
          });
        }
      }

      const createdPlots: Array<{title: string, type: string}> = [];

      for (let i = 0; i < Math.min(plotCount, plotTypes.length); i++) {
        const plotType = plotTypes[i];
        setAutoGenerateProgress({
          step: `플롯 생성 중... (${i + 1}/${plotCount}) - ${plotType.label}`,
          current: i + 1,
          total: plotCount
        });

        const existingPlotsContext = createdPlots.length > 0
          ? `\n\n[이전 플롯 포인트들 - 연속성 있게 이어지도록]\n${createdPlots.map((p, idx) => `${idx + 1}. ${p.title} (${p.type})`).join('\n')}`
          : '';

        const plotPrompt = `당신은 스토리 구조 전문가입니다.
다음 소설의 "${plotType.label}" 플롯 포인트를 JSON으로 생성해주세요.

[소설 정보]
- 제목: ${title}
- 시놉시스: ${synopsis.slice(0, 800)}
- 장르: ${selectedGenres.join(', ')}
- 목표 분량: ${getLengthLabel()}${existingPlotsContext}

[요청]
플롯 타입: ${plotType.type} (${plotType.label})
이 플롯의 역할: ${plotType.description}
순서: ${i + 1}번째 플롯 포인트

JSON 형식 (반드시 이 형식만 출력):
{
  "title": "플롯 포인트 제목",
  "description": "이 플롯에서 일어나는 사건 2-3문장",
  "type": "${plotType.type}",
  "order": ${i + 1}
}`;

        try {
          const plotResult = await generateJSON<{
            title: string;
            description: string;
            type: PlotPoint['type'];
            order: number;
          }>(settings.geminiApiKey, plotPrompt, { temperature: 0.7, maxTokens: 1000 });

          await addPlotPoint({
            ...plotResult,
            stage: '',
            completed: false,
          });

          createdPlots.push({ title: plotResult.title, type: plotType.label });
          createdCount++;
        } catch (err) {
          console.error(`플롯 ${plotType.label} 생성 실패:`, err);
          // 개별 실패해도 계속 진행
        }
      }

      setGenerationStep(4);
      if (!isFullAutoMode) {
        alert(`4단계 완료! 플롯 포인트 ${createdCount}개가 생성되었습니다.`);
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

  // 5단계: 챕터 생성 (개별 챕터 순차 생성)
  const handleStep5_Chapters = async () => {
    if (!settings?.geminiApiKey) {
      alert('API 키를 먼저 설정해주세요.');
      return;
    }

    setIsAutoGenerating(true);
    setStepError(null);

    try {
      let createdCount = 0;

      // 기승전결 구간 계산
      const actBreaks = {
        act1End: Math.floor(targetChapterCount * 0.2),     // 기(起) 끝
        act2End: Math.floor(targetChapterCount * 0.5),     // 승(承) 끝
        act3End: Math.floor(targetChapterCount * 0.8),     // 전(轉) 끝
      };

      const getActInfo = (chapterNum: number): {act: string, actLabel: string, purpose: string} => {
        if (chapterNum <= actBreaks.act1End) {
          return { act: '1부', actLabel: '기(起) 도입부', purpose: '세계관 소개, 주인공 일상, 촉발 사건' };
        } else if (chapterNum <= actBreaks.act2End) {
          return { act: '2부', actLabel: '승(承) 전개부', purpose: '모험 시작, 동료 만남, 1차 시련' };
        } else if (chapterNum <= actBreaks.act3End) {
          return { act: '3부', actLabel: '전(轉) 위기부', purpose: '진짜 적 등장, 2차 시련, 암흑의 순간' };
        } else {
          return { act: '4부', actLabel: '결(結) 결말부', purpose: '최종 대결, 갈등 해결, 에필로그' };
        }
      };

      const createdChapters: Array<{number: number, title: string, summary: string}> = [];

      for (let i = 1; i <= targetChapterCount; i++) {
        const actInfo = getActInfo(i);
        setAutoGenerateProgress({
          step: `챕터 생성 중... (${i}/${targetChapterCount}) - ${actInfo.act} ${actInfo.actLabel}`,
          current: i,
          total: targetChapterCount
        });

        // 최근 3개 챕터만 컨텍스트로 사용 (토큰 절약)
        const recentChapters = createdChapters.slice(-3);
        const existingChaptersContext = recentChapters.length > 0
          ? `\n\n[직전 챕터들 - 연속성 있게 이어지도록]\n${recentChapters.map(c => `${c.number}장 "${c.title}": ${c.summary}`).join('\n')}`
          : '';

        const chapterPrompt = `당신은 소설 구성 전문가입니다.
다음 소설의 ${i}장을 JSON으로 생성해주세요.

[소설 정보]
- 제목: ${title}
- 시놉시스: ${synopsis.slice(0, 600)}
- 장르: ${selectedGenres.join(', ')}
- 총 ${targetChapterCount}장 중 ${i}장째
- 챕터당 목표: ${targetChapterLength.toLocaleString()}자${existingChaptersContext}

[현재 위치]
${actInfo.act} ${actInfo.actLabel} (${i}/${targetChapterCount}장)
이 구간의 역할: ${actInfo.purpose}

[요청]
${i}장의 제목, 목적, 주요 사건을 생성해주세요.
- purpose: 이 챕터가 전체 스토리에서 하는 역할 (2문장)
- keyEvents: 이 챕터에서 일어나는 3-5개의 구체적 사건

JSON 형식 (반드시 이 형식만 출력):
{
  "number": ${i},
  "title": "챕터 제목",
  "purpose": "이 챕터의 목적 2문장",
  "keyEvents": ["사건1", "사건2", "사건3"]
}`;

        try {
          const chapterResult = await generateJSON<{
            number: number;
            title: string;
            purpose: string;
            keyEvents: string[];
          }>(settings.geminiApiKey, chapterPrompt, { temperature: 0.7, maxTokens: 1200 });

          await createChapter(projectId, {
            number: chapterResult.number,
            title: chapterResult.title,
            purpose: chapterResult.purpose,
            keyEvents: chapterResult.keyEvents,
            status: 'outline',
          });

          createdChapters.push({
            number: i,
            title: chapterResult.title,
            summary: chapterResult.purpose.slice(0, 50)
          });
          createdCount++;
        } catch (err) {
          console.error(`${i}장 생성 실패:`, err);
          // 개별 실패해도 계속 진행
        }
      }

      // 권/씬 구조 자동 생성
      setAutoGenerateProgress({
        step: `권/씬 구조 생성 중...`,
        current: targetChapterCount,
        total: targetChapterCount
      });

      await generateVolumeStructure(createdChapters);

      setGenerationStep(5);
      if (!isFullAutoMode) {
        alert(`5단계 완료! 챕터 ${createdCount}개와 권/씬 구조가 생성되었습니다.\n\n모든 기획이 완료되었습니다!`);
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

  // 권/씬 구조 자동 생성
  const generateVolumeStructure = async (chapters: Array<{number: number, title: string, summary: string}>) => {
    if (!settings?.geminiApiKey) return;

    const config = getRecommendedConfig();
    const scenesPerChapter = config.scenesPerChapter;

    // 권 수 계산 (챕터를 권으로 그룹핑 - 1권 = 약 20만자 기준)
    const chaptersPerVolume = Math.max(1, Math.floor(200000 / targetChapterLength));
    const totalVolumes = Math.ceil(targetChapterCount / chaptersPerVolume);

    for (let volNum = 1; volNum <= totalVolumes; volNum++) {
      setAutoGenerateProgress({
        step: `${volNum}권 구조 생성 중... (${volNum}/${totalVolumes})`,
        current: volNum,
        total: totalVolumes
      });

      // 이 권에 해당하는 챕터들
      const startChapter = (volNum - 1) * chaptersPerVolume + 1;
      const endChapter = Math.min(volNum * chaptersPerVolume, targetChapterCount);
      const volumeChapters = chapters.filter(c => c.number >= startChapter && c.number <= endChapter);

      // 권 정보 생성
      const volumePrompt = `당신은 소설 구성 전문가입니다.
다음 소설의 ${volNum}권 구조를 JSON으로 생성해주세요.

[소설 정보]
- 제목: ${title}
- 시놉시스: ${synopsis.slice(0, 500)}
- 장르: ${selectedGenres.join(', ')}
- 총 ${totalVolumes}권 중 ${volNum}권
- 이 권의 챕터: ${startChapter}장 ~ ${endChapter}장

[이 권에 포함된 챕터들]
${volumeChapters.map(c => `${c.number}장 "${c.title}": ${c.summary}`).join('\n')}

[요청]
${volNum}권의 핵심 내용과 종료점을 생성해주세요.
⚠️ 종료점은 반드시 구체적인 대사나 행동으로 명시해야 합니다.
모호한 표현("성장한다", "깨닫는다" 등) 금지!

JSON 형식 (반드시 이 형식만 출력):
{
  "title": "${volNum}권 부제목",
  "startPoint": "이 권의 시작 상황 1문장",
  "endPoint": "이 권의 종료 상황 1문장",
  "endPointExact": "정확한 종료 대사 또는 행동 (예: \\"그가 말했다. '이제 시작이야.'\\" 또는 \\"그녀는 문을 닫고 뒤돌아섰다.\\")",
  "endPointType": "dialogue 또는 action",
  "coreEvent": "이 권의 핵심 사건 1문장"
}`;

      try {
        const volumeResult = await generateJSON<{
          title: string;
          startPoint: string;
          endPoint: string;
          endPointExact: string;
          endPointType: 'dialogue' | 'action';
          coreEvent: string;
        }>(settings.geminiApiKey, volumePrompt, { temperature: 0.7, maxTokens: 1500 });

        // 권 생성
        const newVolume = await createVolume(projectId, {
          volumeNumber: volNum,
          title: volumeResult.title || `${volNum}권`,
          targetWordCount: chaptersPerVolume * targetChapterLength,
          startPoint: volumeResult.startPoint,
          endPoint: volumeResult.endPoint,
          endPointExact: volumeResult.endPointExact,
          endPointType: volumeResult.endPointType || 'action',
          coreEvent: volumeResult.coreEvent,
          status: 'planning',
        });

        // 이 권의 씬들 생성
        const totalScenes = (endChapter - startChapter + 1) * scenesPerChapter;
        const sceneWordCount = Math.floor((chaptersPerVolume * targetChapterLength) / totalScenes);

        for (let sceneNum = 1; sceneNum <= totalScenes; sceneNum++) {
          const chapterIndex = Math.floor((sceneNum - 1) / scenesPerChapter);
          const sceneInChapter = ((sceneNum - 1) % scenesPerChapter) + 1;
          const currentChapter = volumeChapters[chapterIndex] || volumeChapters[volumeChapters.length - 1];

          setAutoGenerateProgress({
            step: `${volNum}권 씬 ${sceneNum}/${totalScenes} 생성 중...`,
            current: sceneNum,
            total: totalScenes
          });

          const scenePrompt = `당신은 소설 구성 전문가입니다.
다음 소설의 ${volNum}권 ${sceneNum}번째 씬을 JSON으로 생성해주세요.

[소설 정보]
- 제목: ${title}
- 장르: ${selectedGenres.join(', ')}
- 현재 챕터: ${currentChapter.number}장 "${currentChapter.title}"
- 챕터 내 ${sceneInChapter}번째 씬

[요청]
이 씬의 설정을 생성해주세요.
⚠️ 종료 조건은 구체적인 대사나 행동으로 명시!

JSON 형식:
{
  "title": "씬 제목",
  "pov": "시점 캐릭터 이름",
  "location": "장소",
  "timeframe": "시간대",
  "startCondition": "씬 시작 상황",
  "endCondition": "씬 종료 조건 (구체적 대사/행동)",
  "endConditionType": "dialogue 또는 action",
  "mustInclude": ["이 씬에서 반드시 포함할 내용 1", "내용 2"]
}`;

          try {
            const sceneResult = await generateJSON<{
              title: string;
              pov: string;
              location: string;
              timeframe: string;
              startCondition: string;
              endCondition: string;
              endConditionType: 'dialogue' | 'action';
              mustInclude: string[];
            }>(settings.geminiApiKey, scenePrompt, { temperature: 0.7, maxTokens: 1000 });

            await createScene(newVolume.id, {
              sceneNumber: sceneNum,
              title: sceneResult.title || `씬 ${sceneNum}`,
              targetWordCount: sceneWordCount,
              pov: sceneResult.pov || '',
              povType: 'third-limited',
              location: sceneResult.location || '',
              timeframe: sceneResult.timeframe || '',
              participants: [],
              mustInclude: sceneResult.mustInclude || [],
              startCondition: sceneResult.startCondition || '',
              endCondition: sceneResult.endCondition || '',
              endConditionType: sceneResult.endConditionType || 'action',
              status: 'pending',
            });
          } catch (sceneErr) {
            console.error(`${volNum}권 씬 ${sceneNum} 생성 실패:`, sceneErr);
            // 기본 씬 생성
            await createScene(newVolume.id, {
              sceneNumber: sceneNum,
              title: `${volNum}-${sceneNum}`,
              targetWordCount: sceneWordCount,
              pov: '',
              povType: 'third-limited',
              location: '',
              timeframe: '',
              participants: [],
              mustInclude: [],
              startCondition: '',
              endCondition: '',
              endConditionType: 'action',
              status: 'pending',
            });
          }
        }
      } catch (volErr) {
        console.error(`${volNum}권 생성 실패:`, volErr);
        // 기본 권 생성
        const newVolume = await createVolume(projectId, {
          volumeNumber: volNum,
          title: `${volNum}권`,
          targetWordCount: chaptersPerVolume * targetChapterLength,
          startPoint: '',
          endPoint: '',
          endPointExact: '',
          endPointType: 'action',
          coreEvent: '',
          status: 'planning',
        });

        // 기본 씬들 생성
        const totalScenes = (endChapter - startChapter + 1) * scenesPerChapter;
        const sceneWordCount = Math.floor((chaptersPerVolume * targetChapterLength) / totalScenes);
        for (let sceneNum = 1; sceneNum <= totalScenes; sceneNum++) {
          await createScene(newVolume.id, {
            sceneNumber: sceneNum,
            title: `${volNum}-${sceneNum}`,
            targetWordCount: sceneWordCount,
            pov: '',
            povType: 'third-limited',
            location: '',
            timeframe: '',
            participants: [],
            mustInclude: [],
            startCondition: '',
            endCondition: '',
            endConditionType: 'action',
            status: 'pending',
          });
        }
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
                  <Rocket className="h-3 w-3" />
                  전체 생성 ({getRecommendedConfig().worldSettings}개)
                </Button>
              </div>
              {/* 개별 세계관 생성 버튼 */}
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground mb-2">개별 생성:</p>
                <div className="flex flex-wrap gap-2">
                  {worldCategories.map((cat) => (
                    <Button
                      key={cat.category}
                      onClick={() => handleGenerateSingleWorld(cat.category, cat.name, cat.importance)}
                      disabled={isAutoGenerating || isGenerating || !synopsis}
                      variant="outline"
                      size="sm"
                      className="gap-1 text-xs"
                    >
                      {isGenerating && generatingType === `world-${cat.category}` ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Wand2 className="h-3 w-3" />
                      )}
                      {cat.name}
                    </Button>
                  ))}
                </div>
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
