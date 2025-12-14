'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Settings, Save, Trash2, RefreshCw, Download, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { LoadingSpinner } from '@/components/common';
import { useProjectStore } from '@/stores/projectStore';

export default function ProjectSettingsPage() {
  const params = useParams();
  const projectId = params.id as string;

  const { currentProject, updateProject, deleteProject } = useProjectStore();

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [status, setStatus] = useState<'idea' | 'planning' | 'writing' | 'editing' | 'completed'>('planning');
  const [targetChapterCount, setTargetChapterCount] = useState(10);
  const [targetChapterLength, setTargetChapterLength] = useState(10000);
  const [targetSceneLength, setTargetSceneLength] = useState(3000);
  const [autoSave, setAutoSave] = useState(true);

  // 총 목표 글자수 자동 계산 (챕터 수 × 챕터당 글자수)
  const calculatedTotalLength = targetChapterCount * targetChapterLength;
  // 예상 권수 계산 (1권 = 약 20만자 기준)
  const estimatedBooks = Math.ceil(calculatedTotalLength / 200000);

  useEffect(() => {
    if (currentProject) {
      setTitle(currentProject.title);
      setStatus(currentProject.status);
      setTargetChapterCount(currentProject.settings?.targetChapterCount || 10);
      setTargetChapterLength(currentProject.settings?.targetChapterLength || 10000);
      setTargetSceneLength(currentProject.settings?.targetSceneLength || 3000);
    }
  }, [currentProject]);

  const handleSave = async () => {
    if (!currentProject) return;

    setIsSaving(true);
    try {
      await updateProject(projectId, {
        title,
        status,
        settings: {
          ...currentProject.settings,
          targetChapterCount: targetChapterCount,
          targetChapterLength: targetChapterLength,
          targetSceneLength: targetSceneLength,
          targetTotalLength: calculatedTotalLength,
        },
      });
    } catch (error) {
      console.error('저장 실패:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    await deleteProject(projectId);
    window.location.href = '/';
  };

  if (!currentProject) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
        <LoadingSpinner size="lg" text="프로젝트 정보를 불러오는 중..." />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">프로젝트 설정</h1>
          <p className="text-muted-foreground">프로젝트의 기본 설정을 관리하세요</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="gap-2">
          {isSaving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          저장
        </Button>
      </div>

      {/* 기본 정보 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">기본 정보</CardTitle>
          <CardDescription>프로젝트의 기본 정보를 설정하세요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>프로젝트 제목</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="소설 제목"
            />
          </div>

          <div className="space-y-2">
            <Label>상태</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="idea">아이디어</SelectItem>
                <SelectItem value="planning">기획 중</SelectItem>
                <SelectItem value="writing">집필 중</SelectItem>
                <SelectItem value="editing">편집 중</SelectItem>
                <SelectItem value="completed">완료</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 목표 설정 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">집필 분량 설정</CardTitle>
          <CardDescription>소설의 목표 분량을 설정하세요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 자동 계산된 총 분량 표시 */}
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">목표 총 분량</span>
              <span className="text-2xl font-bold text-primary">{calculatedTotalLength.toLocaleString()}자</span>
            </div>
            <p className="text-sm text-muted-foreground">
              = {targetChapterCount}장 × {targetChapterLength.toLocaleString()}자/장
              {estimatedBooks > 0 && ` (약 ${estimatedBooks}권 분량)`}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>총 챕터 수</Label>
              <span className="text-sm text-muted-foreground">{targetChapterCount}장</span>
            </div>
            <Slider
              value={[targetChapterCount]}
              onValueChange={([v]) => setTargetChapterCount(v)}
              min={1}
              max={100}
              step={1}
            />
            <p className="text-xs text-muted-foreground">
              소설의 총 장(챕터) 수입니다. (1~100장)
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>챕터당 목표 글자수</Label>
              <span className="text-sm text-muted-foreground">{targetChapterLength.toLocaleString()}자</span>
            </div>
            <Slider
              value={[targetChapterLength]}
              onValueChange={([v]) => setTargetChapterLength(v)}
              min={5000}
              max={200000}
              step={5000}
            />
            <p className="text-xs text-muted-foreground">
              AI 집필 시 각 챕터에 생성될 글자수입니다. (최대 20만자 = 소설책 약 1권 분량)
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>씬당 목표 글자수</Label>
              <span className="text-sm text-muted-foreground">{targetSceneLength.toLocaleString()}자</span>
            </div>
            <Slider
              value={[targetSceneLength]}
              onValueChange={([v]) => setTargetSceneLength(v)}
              min={1000}
              max={50000}
              step={1000}
            />
            <p className="text-xs text-muted-foreground">
              각 씬(장면)에 생성될 목표 글자수입니다. 챕터는 여러 씬으로 구성됩니다.
            </p>
          </div>

          {/* 분량 가이드 */}
          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground mb-2">분량 기준 (1권 = 20만자):</p>
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div>단편: 20만자 이상 (1권+)</div>
              <div>중편: 60만자 이상 (3권+)</div>
              <div>장편: 100만자 이상 (5권+)</div>
              <div>대작: 200만자 이상 (10권+)</div>
              <div>시리즈급: 400만자 이상 (20권+)</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 자동 저장 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">자동 저장</CardTitle>
          <CardDescription>자동 저장 설정을 관리하세요</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label>자동 저장 활성화</Label>
              <p className="text-sm text-muted-foreground">30초마다 자동으로 저장합니다</p>
            </div>
            <Switch checked={autoSave} onCheckedChange={setAutoSave} />
          </div>
        </CardContent>
      </Card>

      {/* 내보내기/가져오기 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">데이터 관리</CardTitle>
          <CardDescription>프로젝트 데이터를 내보내거나 가져오세요</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            내보내기
          </Button>
          <Button variant="outline" className="gap-2">
            <Upload className="h-4 w-4" />
            가져오기
          </Button>
        </CardContent>
      </Card>

      {/* 위험 영역 */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-lg text-destructive">위험 영역</CardTitle>
          <CardDescription>이 작업은 되돌릴 수 없습니다</CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="gap-2">
                <Trash2 className="h-4 w-4" />
                프로젝트 삭제
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>정말 삭제하시겠습니까?</AlertDialogTitle>
                <AlertDialogDescription>
                  이 프로젝트와 관련된 모든 데이터(챕터, 캐릭터, 세계관 등)가 삭제됩니다.
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
        </CardContent>
      </Card>
    </div>
  );
}
