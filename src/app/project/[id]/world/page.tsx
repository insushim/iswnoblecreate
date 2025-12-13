'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Plus,
  Trash2,
  Edit3,
  Wand2,
  RefreshCw,
  Globe,
  MapPin,
  Clock,
  Users,
  Building,
  Sparkles,
  BookOpen,
  Coins,
  Scale,
  Heart,
  Cpu,
  Mountain,
  History,
  Languages,
  MoreVertical,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { EmptyState, LoadingSpinner } from '@/components/common';
import { useWorldStore } from '@/stores/worldStore';
import { useProjectStore } from '@/stores/projectStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { generateText } from '@/lib/gemini';
import { WorldSetting } from '@/types';

const categoryIcons: Record<WorldSetting['category'], React.ReactNode> = {
  time: <Clock className="h-5 w-5" />,
  space: <MapPin className="h-5 w-5" />,
  society: <Users className="h-5 w-5" />,
  culture: <Heart className="h-5 w-5" />,
  economy: <Coins className="h-5 w-5" />,
  politics: <Scale className="h-5 w-5" />,
  religion: <Sparkles className="h-5 w-5" />,
  technology: <Cpu className="h-5 w-5" />,
  magic: <Wand2 className="h-5 w-5" />,
  nature: <Mountain className="h-5 w-5" />,
  history: <History className="h-5 w-5" />,
  language: <Languages className="h-5 w-5" />,
  custom: <Globe className="h-5 w-5" />,
};

const categoryLabels: Record<WorldSetting['category'], string> = {
  time: '시대/시간',
  space: '공간/지리',
  society: '사회 구조',
  culture: '문화/풍습',
  economy: '경제 체계',
  politics: '정치 체제',
  religion: '종교/신앙',
  technology: '기술 수준',
  magic: '마법/초자연',
  nature: '자연환경',
  history: '역사',
  language: '언어',
  custom: '기타',
};

const importanceLabels: Record<WorldSetting['importance'], string> = {
  core: '핵심',
  major: '주요',
  minor: '부가',
};

const importanceColors: Record<WorldSetting['importance'], string> = {
  core: 'bg-primary/10 text-primary border-primary',
  major: 'bg-yellow-500/10 text-yellow-600 border-yellow-500',
  minor: 'bg-muted text-muted-foreground border-muted-foreground',
};

export default function WorldPage() {
  const params = useParams();
  const projectId = params.id as string;

  const { currentProject } = useProjectStore();
  const { settings } = useSettingsStore();
  const { worldSettings, isLoading, fetchWorldSettings, createWorldSetting, updateWorldSetting, deleteWorldSetting } = useWorldStore();

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSetting, setEditingSetting] = useState<WorldSetting | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [settingToDelete, setSettingToDelete] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const [form, setForm] = useState({
    category: 'custom' as WorldSetting['category'],
    title: '',
    description: '',
    importance: 'minor' as WorldSetting['importance'],
  });

  useEffect(() => {
    fetchWorldSettings(projectId);
  }, [projectId, fetchWorldSettings]);

  const filteredSettings = activeCategory === 'all'
    ? worldSettings
    : worldSettings.filter((s) => s.category === activeCategory);

  const handleSave = async () => {
    if (!form.title.trim()) return;

    if (editingSetting) {
      await updateWorldSetting(editingSetting.id, form);
    } else {
      await createWorldSetting(projectId, form);
    }

    setDialogOpen(false);
    setEditingSetting(null);
    setForm({ category: 'custom', title: '', description: '', importance: 'minor' });
  };

  const handleDelete = async () => {
    if (settingToDelete) {
      await deleteWorldSetting(settingToDelete);
      setDeleteDialogOpen(false);
      setSettingToDelete(null);
    }
  };

  const handleGenerateWorldBuilding = async () => {
    if (!settings?.geminiApiKey || !currentProject) return;

    setIsGenerating(true);
    try {
      const prompt = `다음 소설 정보를 바탕으로 세계관 설정을 생성해주세요.

## 작품 정보
- 제목: ${currentProject.title}
- 장르: ${currentProject.genre.join(', ')}
- 컨셉: ${currentProject.concept}
- 시놉시스: ${currentProject.synopsis}

## 기존 설정
${worldSettings.map(s => `- ${categoryLabels[s.category]}: ${s.title}`).join('\n') || '없음'}

## 요청
이 소설에 필요한 세계관 설정 5개를 제안해주세요.
각 설정은 다음 형식으로:

[카테고리] 제목
설명 (2-3문장)
중요도: 핵심/주요/부가

카테고리: ${Object.values(categoryLabels).join(', ')} 중 선택`;

      const response = await generateText(settings.geminiApiKey, prompt, { temperature: 0.8 });

      // 파싱하여 설정 추가
      const blocks = response.split(/\n\n+/).filter(b => b.trim());

      for (const block of blocks) {
        const lines = block.split('\n').filter(l => l.trim());
        if (lines.length < 2) continue;

        const headerMatch = lines[0].match(/\[([^\]]+)\]\s*(.+)/);
        if (!headerMatch) continue;

        const [, categoryStr, title] = headerMatch;
        const description = lines.slice(1, -1).join(' ').trim();
        const importanceMatch = lines[lines.length - 1].match(/중요도:\s*(핵심|주요|부가)/);

        const categoryMap: Record<string, WorldSetting['category']> = {
          '시대/시간': 'time',
          '공간/지리': 'space',
          '사회 구조': 'society',
          '문화/풍습': 'culture',
          '경제 체계': 'economy',
          '정치 체제': 'politics',
          '종교/신앙': 'religion',
          '기술 수준': 'technology',
          '마법/초자연': 'magic',
          '자연환경': 'nature',
          '역사': 'history',
          '언어': 'language',
        };

        const importanceMap: Record<string, WorldSetting['importance']> = {
          '핵심': 'core',
          '주요': 'major',
          '부가': 'minor',
        };

        const category = categoryMap[categoryStr] || 'custom';
        const importance = importanceMatch ? importanceMap[importanceMatch[1]] || 'minor' : 'minor';

        await createWorldSetting(projectId, {
          category,
          title: title.trim(),
          description: description || title,
          importance,
        });
      }
    } catch (error) {
      console.error('세계관 생성 실패:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const categoryCounts = worldSettings.reduce((acc, s) => {
    acc[s.category] = (acc[s.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
        <LoadingSpinner size="lg" text="세계관 정보를 불러오는 중..." />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">세계관</h1>
          <p className="text-muted-foreground">이야기의 배경과 규칙을 설정하세요</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={handleGenerateWorldBuilding} disabled={isGenerating || !settings?.geminiApiKey}>
            {isGenerating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
            AI 제안
          </Button>
          <Button className="gap-2" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            새 설정
          </Button>
        </div>
      </div>

      {/* 카테고리 탭 */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={activeCategory === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveCategory('all')}
        >
          전체 ({worldSettings.length})
        </Button>
        {Object.entries(categoryLabels).map(([key, label]) => {
          const count = categoryCounts[key] || 0;
          if (count === 0 && activeCategory !== key) return null;
          return (
            <Button
              key={key}
              variant={activeCategory === key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveCategory(key)}
              className="gap-2"
            >
              {categoryIcons[key as WorldSetting['category']]}
              {label} ({count})
            </Button>
          );
        })}
      </div>

      {/* 설정 목록 */}
      {filteredSettings.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={Globe}
              title="세계관 설정이 없습니다"
              description="이야기의 배경이 될 세계관을 만들어보세요"
              action={{
                label: '첫 설정 추가',
                onClick: () => setDialogOpen(true),
              }}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredSettings.map((setting, index) => (
            <motion.div
              key={setting.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="h-full">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {categoryIcons[setting.category]}
                      <Badge variant="outline" className="text-xs">
                        {categoryLabels[setting.category]}
                      </Badge>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setEditingSetting(setting);
                            setForm({
                              category: setting.category,
                              title: setting.title,
                              description: setting.description,
                              importance: setting.importance,
                            });
                            setDialogOpen(true);
                          }}
                        >
                          <Edit3 className="h-4 w-4 mr-2" />
                          편집
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => {
                            setSettingToDelete(setting.id);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          삭제
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <CardTitle className="text-lg">{setting.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-4">{setting.description}</p>
                  <div className="mt-4">
                    <Badge variant="outline" className={importanceColors[setting.importance]}>
                      {importanceLabels[setting.importance]}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* 설정 다이얼로그 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSetting ? '설정 수정' : '새 세계관 설정'}</DialogTitle>
            <DialogDescription>이야기의 배경이 될 설정을 추가하세요</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>카테고리</Label>
                <Select
                  value={form.category}
                  onValueChange={(value) => setForm({ ...form, category: value as WorldSetting['category'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoryLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        <span className="flex items-center gap-2">
                          {categoryIcons[key as WorldSetting['category']]}
                          {label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>중요도</Label>
                <Select
                  value={form.importance}
                  onValueChange={(value) => setForm({ ...form, importance: value as WorldSetting['importance'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(importanceLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>제목</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="예: 마법 체계, 신분 제도, 지리적 특징 등"
              />
            </div>
            <div className="space-y-2">
              <Label>설명</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="이 설정에 대해 상세히 설명해주세요"
                rows={5}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setDialogOpen(false);
                setEditingSetting(null);
                setForm({ category: 'custom', title: '', description: '', importance: 'minor' });
              }}>
                취소
              </Button>
              <Button onClick={handleSave}>
                {editingSetting ? '수정' : '추가'}
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
