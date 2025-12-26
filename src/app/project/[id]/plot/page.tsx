'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Wand2,
  RefreshCw,
  BookOpen,
  Target,
  Zap,
  TrendingUp,
  Flag,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { EmptyState, LoadingSpinner } from '@/components/common';
import { usePlotStore } from '@/stores/plotStore';
import { useProjectStore } from '@/stores/projectStore';
import { useChapterStore } from '@/stores/chapterStore';
import { useCharacterStore } from '@/stores/characterStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { generateText } from '@/lib/gemini';
import { PlotPoint, Foreshadowing, Conflict, PlotStructure } from '@/types';

const templateInfo: Record<PlotStructure['template'], { name: string; description: string; stages: { name: string; description: string; percentage: number }[] }> = {
  'three-act': {
    name: '3막 구조',
    description: '가장 전통적인 스토리 구조. 설정, 대립, 해결의 3단계로 구성됩니다.',
    stages: [
      { name: '1막: 설정', description: '세계관, 캐릭터, 갈등 소개', percentage: 25 },
      { name: '2막: 대립', description: '갈등 전개, 시련과 성장', percentage: 50 },
      { name: '3막: 해결', description: '클라이맥스와 결말', percentage: 25 },
    ],
  },
  'hero-journey': {
    name: '영웅의 여정',
    description: 'Joseph Campbell의 신화적 구조. 12단계의 여정을 통한 변화.',
    stages: [
      { name: '일상 세계', description: '영웅의 평범한 일상', percentage: 8 },
      { name: '모험의 소명', description: '모험으로 이끄는 사건', percentage: 8 },
      { name: '소명의 거부', description: '두려움에 의한 거부', percentage: 8 },
      { name: '정신적 스승', description: '조력자 등장', percentage: 8 },
      { name: '문턱 넘기', description: '미지의 세계로 진입', percentage: 8 },
      { name: '시험, 동맹, 적', description: '동료와 적을 만남', percentage: 12 },
      { name: '가장 깊은 동굴', description: '가장 큰 위기 직면', percentage: 12 },
      { name: '시련', description: '죽음 같은 시련', percentage: 8 },
      { name: '보상', description: '승리와 보상', percentage: 8 },
      { name: '귀환의 길', description: '일상으로의 복귀', percentage: 8 },
      { name: '부활', description: '마지막 시험', percentage: 8 },
      { name: '영약의 귀환', description: '변화된 영웅의 귀환', percentage: 4 },
    ],
  },
  'seven-point': {
    name: '7포인트 구조',
    description: 'Dan Wells의 스토리 구조. 핵심 전환점 7개로 구성.',
    stages: [
      { name: '훅', description: '독자를 사로잡는 시작', percentage: 10 },
      { name: '1차 전환점', description: '갈등/모험 시작', percentage: 15 },
      { name: '1차 핀치 포인트', description: '악당/갈등 부각', percentage: 15 },
      { name: '미드포인트', description: '주인공의 변화', percentage: 20 },
      { name: '2차 핀치 포인트', description: '최대 위기', percentage: 15 },
      { name: '2차 전환점', description: '해결책 발견', percentage: 15 },
      { name: '해결', description: '결말', percentage: 10 },
    ],
  },
  'kishotenketsu': {
    name: '기승전결',
    description: '동아시아 전통 구조. 4단계로 이야기 전개.',
    stages: [
      { name: '기(起)', description: '배경과 인물 소개', percentage: 25 },
      { name: '승(承)', description: '사건 전개', percentage: 25 },
      { name: '전(轉)', description: '예상치 못한 전환', percentage: 25 },
      { name: '결(結)', description: '결말과 여운', percentage: 25 },
    ],
  },
  'freytag': {
    name: '프라이탁 피라미드',
    description: '극작법의 고전적 구조. 상승과 하강의 드라마틱 구조.',
    stages: [
      { name: '발단', description: '배경과 인물 설정', percentage: 15 },
      { name: '상승', description: '갈등 고조', percentage: 25 },
      { name: '절정', description: '가장 극적인 순간', percentage: 20 },
      { name: '하강', description: '해결을 향한 전개', percentage: 25 },
      { name: '대단원', description: '최종 결말', percentage: 15 },
    ],
  },
  'save-the-cat': {
    name: 'Save the Cat',
    description: 'Blake Snyder의 비트 시트. 15개의 핵심 비트.',
    stages: [
      { name: '오프닝 이미지', description: '작품의 첫인상', percentage: 1 },
      { name: '테마 제시', description: '중심 주제 암시', percentage: 4 },
      { name: '설정', description: '세계관과 인물', percentage: 10 },
      { name: '촉매', description: '변화를 일으키는 사건', percentage: 5 },
      { name: '논쟁', description: '주인공의 망설임', percentage: 5 },
      { name: '2막 전환', description: '새로운 세계 진입', percentage: 5 },
      { name: 'B 스토리', description: '서브플롯 시작', percentage: 10 },
      { name: '재미와 게임', description: '장르의 매력', percentage: 15 },
      { name: '미드포인트', description: '거짓 승리/패배', percentage: 5 },
      { name: '악당의 반격', description: '상황 악화', percentage: 10 },
      { name: '모든 것을 잃다', description: '최악의 순간', percentage: 5 },
      { name: '영혼의 암흑기', description: '절망의 순간', percentage: 5 },
      { name: '3막 전환', description: '해결책 발견', percentage: 5 },
      { name: '피날레', description: '최종 대결', percentage: 10 },
      { name: '파이널 이미지', description: '변화의 증거', percentage: 5 },
    ],
  },
  mystery: {
    name: '미스터리 구조',
    description: '추리소설에 최적화된 구조.',
    stages: [
      { name: '사건 발생', description: '미스터리의 시작', percentage: 15 },
      { name: '수사 시작', description: '단서 수집 시작', percentage: 20 },
      { name: '미끼/방향 전환', description: '잘못된 단서들', percentage: 20 },
      { name: '진실의 발견', description: '핵심 단서 발견', percentage: 20 },
      { name: '대결', description: '범인과의 대면', percentage: 15 },
      { name: '해결', description: '진실 규명과 결말', percentage: 10 },
    ],
  },
  romance: {
    name: '로맨스 구조',
    description: '로맨스 소설에 최적화된 구조.',
    stages: [
      { name: '첫 만남', description: '주인공들의 만남', percentage: 15 },
      { name: '끌림', description: '서로에 대한 감정', percentage: 15 },
      { name: '장애물', description: '관계의 방해요소', percentage: 20 },
      { name: '친밀감 형성', description: '감정 깊어짐', percentage: 15 },
      { name: '위기', description: '관계의 위기', percentage: 15 },
      { name: '결합', description: '해피엔딩', percentage: 20 },
    ],
  },
  custom: {
    name: '사용자 정의',
    description: '직접 구조를 설계합니다.',
    stages: [],
  },
};

const plotPointTypes = [
  { value: 'opening', label: '오프닝', icon: <BookOpen className="h-4 w-4" /> },
  { value: 'inciting-incident', label: '촉발 사건', icon: <Zap className="h-4 w-4" /> },
  { value: 'first-plot-point', label: '1차 전환점', icon: <TrendingUp className="h-4 w-4" /> },
  { value: 'midpoint', label: '미드포인트', icon: <Target className="h-4 w-4" /> },
  { value: 'second-plot-point', label: '2차 전환점', icon: <TrendingUp className="h-4 w-4" /> },
  { value: 'climax', label: '클라이맥스', icon: <Flag className="h-4 w-4" /> },
  { value: 'resolution', label: '결말', icon: <Check className="h-4 w-4" /> },
  { value: 'custom', label: '커스텀', icon: <Sparkles className="h-4 w-4" /> },
];

const conflictTypes = [
  { value: 'internal', label: '내적 갈등' },
  { value: 'interpersonal', label: '대인 갈등' },
  { value: 'societal', label: '사회적 갈등' },
  { value: 'environmental', label: '환경적 갈등' },
  { value: 'supernatural', label: '초자연적 갈등' },
  { value: 'technological', label: '기술적 갈등' },
];

const foreshadowingTypes = [
  { value: 'hint', label: '힌트' },
  { value: 'symbol', label: '상징' },
  { value: 'prophecy', label: '예언' },
  { value: 'setup', label: '설정' },
  { value: 'red-herring', label: '레드 헤링' },
];

export default function PlotPage() {
  const params = useParams();
  const projectId = params.id as string;

  const { currentProject } = useProjectStore();
  const { chapters, fetchChapters } = useChapterStore();
  const { characters, fetchCharacters } = useCharacterStore();
  const { settings } = useSettingsStore();
  const {
    plotStructure,
    foreshadowings,
    conflicts,
    isLoading,
    fetchPlotStructure,
    updatePlotStructure,
    addPlotPoint,
    updatePlotPoint,
    deletePlotPoint,
    fetchForeshadowings,
    createForeshadowing,
    updateForeshadowing,
    deleteForeshadowing,
    fetchConflicts,
    createConflict,
    updateConflict,
    deleteConflict,
  } = usePlotStore();

  const [activeTab, setActiveTab] = useState('structure');
  const [isGenerating, setIsGenerating] = useState(false);

  // Plot Point Dialog
  const [plotPointDialogOpen, setPlotPointDialogOpen] = useState(false);
  const [editingPlotPoint, setEditingPlotPoint] = useState<PlotPoint | null>(null);
  const [plotPointForm, setPlotPointForm] = useState({
    title: '',
    description: '',
    type: 'custom' as PlotPoint['type'],
    stage: '',
    chapterId: '',
  });

  // Foreshadowing Dialog
  const [foreshadowingDialogOpen, setForeshadowingDialogOpen] = useState(false);
  const [editingForeshadowing, setEditingForeshadowing] = useState<Foreshadowing | null>(null);
  const [foreshadowingForm, setForeshadowingForm] = useState({
    title: '',
    description: '',
    type: 'hint' as Foreshadowing['type'],
    subtlety: 3,
    plantedIn: '',
    plantedMethod: '',
    priority: 'minor' as Foreshadowing['priority'],
  });

  // Conflict Dialog
  const [conflictDialogOpen, setConflictDialogOpen] = useState(false);
  const [editingConflict, setEditingConflict] = useState<Conflict | null>(null);
  const [conflictForm, setConflictForm] = useState({
    title: '',
    description: '',
    type: 'interpersonal' as Conflict['type'],
    stakes: '',
    involvedCharacters: [] as string[],
    intensity: 5,
  });

  // Delete Dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'plotPoint' | 'foreshadowing' | 'conflict'; id: string } | null>(null);

  useEffect(() => {
    fetchPlotStructure(projectId);
    fetchForeshadowings(projectId);
    fetchConflicts(projectId);
    fetchChapters(projectId);
    fetchCharacters(projectId);
  }, [projectId, fetchPlotStructure, fetchForeshadowings, fetchConflicts, fetchChapters, fetchCharacters]);

  const handleTemplateChange = async (template: PlotStructure['template']) => {
    if (!plotStructure) return;
    await updatePlotStructure(plotStructure.id, { template });
  };

  const handleSavePlotPoint = async () => {
    if (!plotPointForm.title.trim()) return;

    if (editingPlotPoint) {
      await updatePlotPoint(editingPlotPoint.id, {
        ...plotPointForm,
        completed: editingPlotPoint.completed,
      });
    } else {
      await addPlotPoint({
        ...plotPointForm,
        order: plotStructure?.plotPoints.length || 0,
        completed: false,
      });
    }

    setPlotPointDialogOpen(false);
    setEditingPlotPoint(null);
    setPlotPointForm({ title: '', description: '', type: 'custom', stage: '', chapterId: '' });
  };

  const handleSaveForeshadowing = async () => {
    if (!foreshadowingForm.title.trim()) return;

    if (editingForeshadowing) {
      await updateForeshadowing(editingForeshadowing.id, foreshadowingForm);
    } else {
      await createForeshadowing(projectId, {
        ...foreshadowingForm,
        status: 'planted',
      });
    }

    setForeshadowingDialogOpen(false);
    setEditingForeshadowing(null);
    setForeshadowingForm({ title: '', description: '', type: 'hint', subtlety: 3, plantedIn: '', plantedMethod: '', priority: 'minor' });
  };

  const handleSaveConflict = async () => {
    if (!conflictForm.title.trim()) return;

    if (editingConflict) {
      await updateConflict(editingConflict.id, conflictForm);
    } else {
      await createConflict(projectId, {
        ...conflictForm,
        introducedIn: '',
        status: 'brewing',
      });
    }

    setConflictDialogOpen(false);
    setEditingConflict(null);
    setConflictForm({ title: '', description: '', type: 'interpersonal', stakes: '', involvedCharacters: [], intensity: 5 });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    switch (deleteTarget.type) {
      case 'plotPoint':
        await deletePlotPoint(deleteTarget.id);
        break;
      case 'foreshadowing':
        await deleteForeshadowing(deleteTarget.id);
        break;
      case 'conflict':
        await deleteConflict(deleteTarget.id);
        break;
    }

    setDeleteDialogOpen(false);
    setDeleteTarget(null);
  };

  const handleGeneratePlotSuggestion = async () => {
    if (!settings?.geminiApiKey || !currentProject) return;

    setIsGenerating(true);
    try {
      const prompt = `다음 소설 정보를 바탕으로 플롯 구조를 제안해주세요.

## 작품 정보
- 제목: ${currentProject.title}
- 장르: ${currentProject.genre.join(', ')}
- 컨셉: ${currentProject.concept}
- 로그라인: ${currentProject.logline}
- 시놉시스: ${currentProject.synopsis}

## 현재 구조
- 템플릿: ${templateInfo[plotStructure?.template || 'three-act'].name}
- 기존 플롯 포인트: ${plotStructure?.plotPoints.map(p => p.title).join(', ') || '없음'}

## 등장인물
${characters.map(c => `- ${c.name} (${c.role}): ${c.motivation}`).join('\n')}

## 요청
이 소설에 맞는 주요 플롯 포인트 5-7개를 제안해주세요.
각 포인트는 다음 형식으로:
1. [타입] 제목: 설명

타입: 오프닝, 촉발 사건, 1차 전환점, 미드포인트, 2차 전환점, 클라이맥스, 결말 중 선택`;

      const response = await generateText(settings.geminiApiKey, prompt, {
        temperature: 0.8,
        model: settings.planningModel || 'gemini-3-flash-preview' // 기획용 모델 사용
      });

      // 결과를 파싱하여 플롯 포인트로 추가 (간단한 버전)
      const lines = response.split('\n').filter(line => line.match(/^\d+\./));

      for (const line of lines) {
        const match = line.match(/^\d+\.\s*\[([^\]]+)\]\s*([^:]+):\s*(.+)/);
        if (match) {
          const [, typeStr, title, description] = match;
          const typeMap: Record<string, PlotPoint['type']> = {
            '오프닝': 'opening',
            '촉발 사건': 'inciting-incident',
            '1차 전환점': 'first-plot-point',
            '미드포인트': 'midpoint',
            '2차 전환점': 'second-plot-point',
            '클라이맥스': 'climax',
            '결말': 'resolution',
          };

          await addPlotPoint({
            title: title.trim(),
            description: description.trim(),
            type: typeMap[typeStr] || 'custom',
            stage: '',
            order: plotStructure?.plotPoints.length || 0,
            completed: false,
          });
        }
      }
    } catch (error) {
      console.error('플롯 제안 생성 실패:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const completedPoints = plotStructure?.plotPoints.filter(p => p.completed).length || 0;
  const totalPoints = plotStructure?.plotPoints.length || 0;
  const progress = totalPoints > 0 ? (completedPoints / totalPoints) * 100 : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
        <LoadingSpinner size="lg" text="플롯 정보를 불러오는 중..." />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">플롯 구조</h1>
          <p className="text-muted-foreground">이야기의 구조와 흐름을 설계하세요</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={handleGeneratePlotSuggestion} disabled={isGenerating || !settings?.geminiApiKey}>
            {isGenerating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
            AI 플롯 제안
          </Button>
        </div>
      </div>

      {/* 진행률 */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">플롯 완성도</span>
            <span className="text-sm text-muted-foreground">{completedPoints}/{totalPoints} 포인트</span>
          </div>
          <Progress value={progress} className="h-2" />
        </CardContent>
      </Card>

      {/* 템플릿 선택 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">스토리 구조 템플릿</CardTitle>
          <CardDescription>이야기에 맞는 구조를 선택하세요</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {Object.entries(templateInfo).map(([key, info]) => (
              <button
                key={key}
                className={`p-4 rounded-lg border text-left transition-colors ${
                  plotStructure?.template === key
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:bg-muted'
                }`}
                onClick={() => handleTemplateChange(key as PlotStructure['template'])}
              >
                <div className="font-medium">{info.name}</div>
                <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{info.description}</div>
              </button>
            ))}
          </div>

          {/* 선택된 템플릿의 단계 표시 */}
          {plotStructure?.template && plotStructure.template !== 'custom' && (
            <div className="mt-6">
              <h4 className="text-sm font-medium mb-3">구조 단계</h4>
              <div className="space-y-2">
                {templateInfo[plotStructure.template].stages.map((stage, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-16 text-xs text-right text-muted-foreground">{stage.percentage}%</div>
                    <div className="flex-1">
                      <div className="h-6 bg-muted rounded relative overflow-hidden">
                        <div
                          className="h-full bg-primary/20"
                          style={{ width: `${stage.percentage}%` }}
                        />
                        <span className="absolute inset-0 flex items-center px-2 text-xs font-medium">
                          {stage.name}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 탭 컨텐츠 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="structure">플롯 포인트</TabsTrigger>
          <TabsTrigger value="foreshadowing">복선</TabsTrigger>
          <TabsTrigger value="conflicts">갈등</TabsTrigger>
        </TabsList>

        {/* 플롯 포인트 */}
        <TabsContent value="structure" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">플롯 포인트</CardTitle>
                <CardDescription>이야기의 주요 전환점을 정의하세요</CardDescription>
              </div>
              <Button className="gap-2" onClick={() => setPlotPointDialogOpen(true)}>
                <Plus className="h-4 w-4" />
                추가
              </Button>
            </CardHeader>
            <CardContent>
              {(!plotStructure?.plotPoints || plotStructure.plotPoints.length === 0) ? (
                <EmptyState
                  icon={Target}
                  title="플롯 포인트가 없습니다"
                  description="이야기의 주요 전환점을 추가하세요"
                  action={{
                    label: '첫 플롯 포인트 추가',
                    onClick: () => setPlotPointDialogOpen(true),
                  }}
                />
              ) : (
                <div className="space-y-3">
                  {plotStructure.plotPoints
                    .sort((a, b) => a.order - b.order)
                    .map((point, index) => (
                      <motion.div
                        key={point.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`flex items-start gap-4 p-4 rounded-lg border ${
                          point.completed ? 'bg-muted/30' : 'bg-background'
                        }`}
                      >
                        <Checkbox
                          checked={point.completed}
                          onCheckedChange={(checked) => updatePlotPoint(point.id, { completed: !!checked })}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`font-medium ${point.completed ? 'line-through text-muted-foreground' : ''}`}>
                              {point.title}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {plotPointTypes.find(t => t.value === point.type)?.label || point.type}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{point.description}</p>
                          {point.chapterId && (
                            <span className="text-xs text-primary mt-2 inline-block">
                              → {chapters.find(c => c.id === point.chapterId)?.title || '챕터'}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              setEditingPlotPoint(point);
                              setPlotPointForm({
                                title: point.title,
                                description: point.description,
                                type: point.type,
                                stage: point.stage,
                                chapterId: point.chapterId || '',
                              });
                              setPlotPointDialogOpen(true);
                            }}
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => {
                              setDeleteTarget({ type: 'plotPoint', id: point.id });
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 복선 */}
        <TabsContent value="foreshadowing" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">복선 관리</CardTitle>
                <CardDescription>심어둔 복선과 회수 상태를 추적하세요</CardDescription>
              </div>
              <Button className="gap-2" onClick={() => setForeshadowingDialogOpen(true)}>
                <Plus className="h-4 w-4" />
                추가
              </Button>
            </CardHeader>
            <CardContent>
              {foreshadowings.length === 0 ? (
                <EmptyState
                  icon={Sparkles}
                  title="복선이 없습니다"
                  description="이야기에 복선을 심어보세요"
                  action={{
                    label: '첫 복선 추가',
                    onClick: () => setForeshadowingDialogOpen(true),
                  }}
                />
              ) : (
                <div className="space-y-3">
                  {foreshadowings.map((f, index) => (
                    <motion.div
                      key={f.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-start gap-4 p-4 rounded-lg border"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{f.title}</span>
                          <Badge variant="outline" className="text-xs">
                            {foreshadowingTypes.find(t => t.value === f.type)?.label}
                          </Badge>
                          <Badge
                            variant={f.status === 'resolved' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {f.status === 'planted' && '심어짐'}
                            {f.status === 'reinforced' && '강화됨'}
                            {f.status === 'resolved' && '회수됨'}
                            {f.status === 'abandoned' && '폐기'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{f.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>미묘함: {f.subtlety}/5</span>
                          {f.plantedMethod && <span>방법: {f.plantedMethod}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setEditingForeshadowing(f);
                            setForeshadowingForm({
                              title: f.title,
                              description: f.description,
                              type: f.type,
                              subtlety: f.subtlety,
                              plantedIn: f.plantedIn,
                              plantedMethod: f.plantedMethod,
                              priority: f.priority,
                            });
                            setForeshadowingDialogOpen(true);
                          }}
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => {
                            setDeleteTarget({ type: 'foreshadowing', id: f.id });
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 갈등 */}
        <TabsContent value="conflicts" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">갈등 관리</CardTitle>
                <CardDescription>이야기의 갈등을 추적하고 관리하세요</CardDescription>
              </div>
              <Button className="gap-2" onClick={() => setConflictDialogOpen(true)}>
                <Plus className="h-4 w-4" />
                추가
              </Button>
            </CardHeader>
            <CardContent>
              {conflicts.length === 0 ? (
                <EmptyState
                  icon={AlertTriangle}
                  title="갈등이 없습니다"
                  description="이야기에 갈등을 추가하세요"
                  action={{
                    label: '첫 갈등 추가',
                    onClick: () => setConflictDialogOpen(true),
                  }}
                />
              ) : (
                <div className="space-y-3">
                  {conflicts.map((c, index) => (
                    <motion.div
                      key={c.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-start gap-4 p-4 rounded-lg border"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{c.title}</span>
                          <Badge variant="outline" className="text-xs">
                            {conflictTypes.find(t => t.value === c.type)?.label}
                          </Badge>
                          <Badge
                            variant={c.status === 'resolved' ? 'default' : c.status === 'climax' ? 'destructive' : 'secondary'}
                            className="text-xs"
                          >
                            {c.status === 'brewing' && '잠복'}
                            {c.status === 'active' && '진행'}
                            {c.status === 'escalating' && '고조'}
                            {c.status === 'climax' && '절정'}
                            {c.status === 'resolved' && '해결'}
                            {c.status === 'abandoned' && '폐기'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{c.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>강도: {c.intensity}/10</span>
                          <span>이해관계: {c.stakes}</span>
                        </div>
                        {c.involvedCharacters.length > 0 && (
                          <div className="flex gap-1 mt-2">
                            {c.involvedCharacters.map(charId => {
                              const char = characters.find(ch => ch.id === charId);
                              return char ? (
                                <Badge key={charId} variant="secondary" className="text-xs" style={{ borderColor: char.color }}>
                                  {char.name}
                                </Badge>
                              ) : null;
                            })}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setEditingConflict(c);
                            setConflictForm({
                              title: c.title,
                              description: c.description,
                              type: c.type,
                              stakes: c.stakes,
                              involvedCharacters: c.involvedCharacters,
                              intensity: c.intensity,
                            });
                            setConflictDialogOpen(true);
                          }}
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => {
                            setDeleteTarget({ type: 'conflict', id: c.id });
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 플롯 포인트 다이얼로그 */}
      <Dialog open={plotPointDialogOpen} onOpenChange={setPlotPointDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPlotPoint ? '플롯 포인트 수정' : '새 플롯 포인트'}</DialogTitle>
            <DialogDescription>이야기의 주요 전환점을 정의하세요</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>제목</Label>
              <Input
                value={plotPointForm.title}
                onChange={(e) => setPlotPointForm({ ...plotPointForm, title: e.target.value })}
                placeholder="예: 주인공의 결심"
              />
            </div>
            <div className="space-y-2">
              <Label>유형</Label>
              <Select
                value={plotPointForm.type}
                onValueChange={(value) => setPlotPointForm({ ...plotPointForm, type: value as PlotPoint['type'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {plotPointTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <span className="flex items-center gap-2">
                        {type.icon}
                        {type.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>설명</Label>
              <Textarea
                value={plotPointForm.description}
                onChange={(e) => setPlotPointForm({ ...plotPointForm, description: e.target.value })}
                placeholder="이 포인트에서 무슨 일이 일어나는지 설명하세요"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>연결 챕터 (선택)</Label>
              <Select
                value={plotPointForm.chapterId}
                onValueChange={(value) => setPlotPointForm({ ...plotPointForm, chapterId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="챕터 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">없음</SelectItem>
                  {chapters.map((chapter) => (
                    <SelectItem key={chapter.id} value={chapter.id}>
                      {chapter.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setPlotPointDialogOpen(false)}>
                취소
              </Button>
              <Button onClick={handleSavePlotPoint}>
                {editingPlotPoint ? '수정' : '추가'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 복선 다이얼로그 */}
      <Dialog open={foreshadowingDialogOpen} onOpenChange={setForeshadowingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingForeshadowing ? '복선 수정' : '새 복선'}</DialogTitle>
            <DialogDescription>이야기에 심을 복선을 정의하세요</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>제목</Label>
              <Input
                value={foreshadowingForm.title}
                onChange={(e) => setForeshadowingForm({ ...foreshadowingForm, title: e.target.value })}
                placeholder="예: 비 오는 날의 약속"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>유형</Label>
                <Select
                  value={foreshadowingForm.type}
                  onValueChange={(value) => setForeshadowingForm({ ...foreshadowingForm, type: value as Foreshadowing['type'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {foreshadowingTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>미묘함 (1-5)</Label>
                <Input
                  type="number"
                  min={1}
                  max={5}
                  value={foreshadowingForm.subtlety}
                  onChange={(e) => setForeshadowingForm({ ...foreshadowingForm, subtlety: parseInt(e.target.value) })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>설명</Label>
              <Textarea
                value={foreshadowingForm.description}
                onChange={(e) => setForeshadowingForm({ ...foreshadowingForm, description: e.target.value })}
                placeholder="복선의 내용과 의미"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>심는 방법</Label>
              <Input
                value={foreshadowingForm.plantedMethod}
                onChange={(e) => setForeshadowingForm({ ...foreshadowingForm, plantedMethod: e.target.value })}
                placeholder="예: 대화 중 언급, 배경 묘사 등"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setForeshadowingDialogOpen(false)}>
                취소
              </Button>
              <Button onClick={handleSaveForeshadowing}>
                {editingForeshadowing ? '수정' : '추가'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 갈등 다이얼로그 */}
      <Dialog open={conflictDialogOpen} onOpenChange={setConflictDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingConflict ? '갈등 수정' : '새 갈등'}</DialogTitle>
            <DialogDescription>이야기의 갈등을 정의하세요</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>제목</Label>
              <Input
                value={conflictForm.title}
                onChange={(e) => setConflictForm({ ...conflictForm, title: e.target.value })}
                placeholder="예: 가족과의 갈등"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>유형</Label>
                <Select
                  value={conflictForm.type}
                  onValueChange={(value) => setConflictForm({ ...conflictForm, type: value as Conflict['type'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {conflictTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>강도 (1-10)</Label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={conflictForm.intensity}
                  onChange={(e) => setConflictForm({ ...conflictForm, intensity: parseInt(e.target.value) })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>설명</Label>
              <Textarea
                value={conflictForm.description}
                onChange={(e) => setConflictForm({ ...conflictForm, description: e.target.value })}
                placeholder="갈등의 내용"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>이해관계 (Stakes)</Label>
              <Input
                value={conflictForm.stakes}
                onChange={(e) => setConflictForm({ ...conflictForm, stakes: e.target.value })}
                placeholder="이 갈등이 해결되지 않으면 어떻게 되는지"
              />
            </div>
            <div className="space-y-2">
              <Label>관련 캐릭터</Label>
              <div className="flex flex-wrap gap-2">
                {characters.map((char) => (
                  <Badge
                    key={char.id}
                    variant={conflictForm.involvedCharacters.includes(char.id) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => {
                      setConflictForm({
                        ...conflictForm,
                        involvedCharacters: conflictForm.involvedCharacters.includes(char.id)
                          ? conflictForm.involvedCharacters.filter(id => id !== char.id)
                          : [...conflictForm.involvedCharacters, char.id],
                      });
                    }}
                  >
                    {char.name}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setConflictDialogOpen(false)}>
                취소
              </Button>
              <Button onClick={handleSaveConflict}>
                {editingConflict ? '수정' : '추가'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>정말 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
