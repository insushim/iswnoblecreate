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
  const [targetWordCount, setTargetWordCount] = useState(100000);
  const [dailyGoal, setDailyGoal] = useState(1000);
  const [autoSave, setAutoSave] = useState(true);

  useEffect(() => {
    if (currentProject) {
      setTitle(currentProject.title);
      setStatus(currentProject.status);
      setTargetWordCount(currentProject.settings?.targetTotalLength || 100000);
      setDailyGoal(currentProject.goals?.dailyWordCount || 1000);
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
          targetTotalLength: targetWordCount,
        },
        goals: {
          ...currentProject.goals,
          dailyWordCount: dailyGoal,
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
          <CardTitle className="text-lg">목표 설정</CardTitle>
          <CardDescription>집필 목표를 설정하세요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>목표 총 글자수</Label>
              <span className="text-sm text-muted-foreground">{targetWordCount.toLocaleString()}자</span>
            </div>
            <Slider
              value={[targetWordCount]}
              onValueChange={([v]) => setTargetWordCount(v)}
              min={10000}
              max={500000}
              step={10000}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>일일 목표</Label>
              <span className="text-sm text-muted-foreground">{dailyGoal.toLocaleString()}자</span>
            </div>
            <Slider
              value={[dailyGoal]}
              onValueChange={([v]) => setDailyGoal(v)}
              min={100}
              max={10000}
              step={100}
            />
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
