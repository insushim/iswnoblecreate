'use client';

/**
 * 권별 구조 관리 컴포넌트
 * - 권/씬 단위 소설 구조 설정
 * - 종료점 설정 및 검증
 * - 분량 목표 설정
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  Target,
  BookOpen,
  FileText,
  Settings,
  Wand2,
  Copy,
  MoreVertical,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useVolumeStore } from '@/stores/volumeStore';
import type { VolumeStructure, SceneStructure } from '@/types';

interface VolumeStructureManagerProps {
  projectId: string;
  onGeneratePrompt?: (volumeId: string, sceneId?: string) => void;
}

export function VolumeStructureManager({
  projectId,
  onGeneratePrompt,
}: VolumeStructureManagerProps) {
  const {
    volumes,
    currentVolume,
    fetchVolumes,
    createVolume,
    updateVolume,
    deleteVolume,
    setCurrentVolume,
    createScene,
    updateScene,
    deleteScene,
    autoSplitVolume,
    validateVolumeEndPoints,
    getProjectProgress,
  } = useVolumeStore();

  const [isAddVolumeOpen, setIsAddVolumeOpen] = useState(false);
  const [isAddSceneOpen, setIsAddSceneOpen] = useState(false);
  const [selectedVolumeForScene, setSelectedVolumeForScene] = useState<string | null>(null);
  const [expandedVolumes, setExpandedVolumes] = useState<string[]>([]);

  // 프로젝트 권 목록 가져오기
  const projectVolumes = volumes.filter(v => v.projectId === projectId);
  const progress = getProjectProgress(projectId);

  useEffect(() => {
    fetchVolumes(projectId);
  }, [projectId, fetchVolumes]);

  // 권 추가
  const handleAddVolume = async () => {
    await createVolume(projectId);
    setIsAddVolumeOpen(false);
  };

  // 권 자동 분할
  const handleAutoSplit = async (volumeId: string, count: number) => {
    await autoSplitVolume(volumeId, count);
  };

  // 권 확장/축소 토글
  const toggleVolumeExpand = (volumeId: string) => {
    setExpandedVolumes(prev =>
      prev.includes(volumeId)
        ? prev.filter(id => id !== volumeId)
        : [...prev, volumeId]
    );
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">권별 구조 관리</h2>
          <p className="text-muted-foreground">
            정확한 분량과 종료점을 설정하여 체계적으로 집필하세요
          </p>
        </div>
        <Button onClick={() => setIsAddVolumeOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          권 추가
        </Button>
      </div>

      {/* 전체 진행 상황 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            전체 진행 상황
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{progress.totalVolumes}</div>
              <div className="text-sm text-muted-foreground">총 권수</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{progress.completedVolumes}</div>
              <div className="text-sm text-muted-foreground">완료</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {(progress.totalActualWordCount / 10000).toFixed(1)}만
              </div>
              <div className="text-sm text-muted-foreground">현재 글자수</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {(progress.totalTargetWordCount / 10000).toFixed(1)}만
              </div>
              <div className="text-sm text-muted-foreground">목표 글자수</div>
            </div>
          </div>
          <Progress value={progress.overallPercentage} className="h-3" />
          <div className="text-center text-sm text-muted-foreground mt-2">
            {progress.overallPercentage}% 완료
          </div>
        </CardContent>
      </Card>

      {/* 권 목록 */}
      <div className="space-y-4">
        {projectVolumes.length === 0 ? (
          <Card className="p-8 text-center">
            <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">권 구조가 없습니다</h3>
            <p className="text-muted-foreground mb-4">
              새 권을 추가하여 소설의 구조를 설계하세요
            </p>
            <Button onClick={() => setIsAddVolumeOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              첫 번째 권 추가
            </Button>
          </Card>
        ) : (
          projectVolumes
            .sort((a, b) => a.volumeNumber - b.volumeNumber)
            .map(volume => (
              <VolumeCard
                key={volume.id}
                volume={volume}
                isExpanded={expandedVolumes.includes(volume.id)}
                onToggleExpand={() => toggleVolumeExpand(volume.id)}
                onUpdate={(data) => updateVolume(volume.id, data)}
                onDelete={() => deleteVolume(volume.id)}
                onAddScene={() => {
                  setSelectedVolumeForScene(volume.id);
                  setIsAddSceneOpen(true);
                }}
                onAutoSplit={(count) => handleAutoSplit(volume.id, count)}
                onGeneratePrompt={onGeneratePrompt}
                validation={validateVolumeEndPoints(volume.id)}
              />
            ))
        )}
      </div>

      {/* 권 추가 다이얼로그 */}
      <AddVolumeDialog
        open={isAddVolumeOpen}
        onOpenChange={setIsAddVolumeOpen}
        onAdd={handleAddVolume}
        nextNumber={projectVolumes.length + 1}
      />

      {/* 씬 추가 다이얼로그 */}
      {selectedVolumeForScene && (
        <AddSceneDialog
          open={isAddSceneOpen}
          onOpenChange={setIsAddSceneOpen}
          volumeId={selectedVolumeForScene}
          onAdd={async (data) => {
            await createScene(selectedVolumeForScene, data);
            setIsAddSceneOpen(false);
          }}
        />
      )}
    </div>
  );
}

// ============================================
// 권 카드 컴포넌트
// ============================================

interface VolumeCardProps {
  volume: VolumeStructure;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdate: (data: Partial<VolumeStructure>) => void;
  onDelete: () => void;
  onAddScene: () => void;
  onAutoSplit: (count: number) => void;
  onGeneratePrompt?: (volumeId: string, sceneId?: string) => void;
  validation: { isValid: boolean; issues: string[] };
}

function VolumeCard({
  volume,
  isExpanded,
  onToggleExpand,
  onUpdate,
  onDelete,
  onAddScene,
  onAutoSplit,
  onGeneratePrompt,
  validation,
}: VolumeCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(volume);

  const progressPercent = volume.targetWordCount > 0
    ? Math.round((volume.actualWordCount / volume.targetWordCount) * 100)
    : 0;

  const statusColors = {
    planning: 'bg-yellow-500',
    writing: 'bg-blue-500',
    completed: 'bg-green-500',
  };

  return (
    <Card className="overflow-hidden">
      {/* 권 헤더 */}
      <div
        className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={onToggleExpand}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isExpanded ? (
              <ChevronDown className="w-5 h-5" />
            ) : (
              <ChevronRight className="w-5 h-5" />
            )}
            <div className="flex items-center gap-2">
              <Badge className={statusColors[volume.status]}>
                {volume.volumeNumber}권
              </Badge>
              <span className="font-semibold">{volume.title}</span>
            </div>
            {!validation.isValid && (
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
            )}
            {validation.isValid && volume.scenes.length > 0 && (
              <CheckCircle className="w-4 h-4 text-green-500" />
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              {(volume.actualWordCount / 10000).toFixed(1)}만 / {(volume.targetWordCount / 10000).toFixed(1)}만자
            </div>
            <Progress value={progressPercent} className="w-24 h-2" />

            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsEditing(true)}>
                  <Settings className="w-4 h-4 mr-2" />
                  설정 편집
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onAddScene}>
                  <Plus className="w-4 h-4 mr-2" />
                  씬 추가
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAutoSplit(10)}>
                  <Wand2 className="w-4 h-4 mr-2" />
                  10개 씬으로 분할
                </DropdownMenuItem>
                {onGeneratePrompt && (
                  <DropdownMenuItem onClick={() => onGeneratePrompt(volume.id)}>
                    <Copy className="w-4 h-4 mr-2" />
                    프롬프트 생성
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={onDelete}
                  className="text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  삭제
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* 확장된 내용 */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <CardContent className="border-t pt-4">
              {/* 검증 경고 */}
              {!validation.isValid && (
                <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <div className="flex items-center gap-2 text-yellow-600 font-medium mb-2">
                    <AlertTriangle className="w-4 h-4" />
                    종료점 검증 필요
                  </div>
                  <ul className="text-sm text-yellow-600 space-y-1">
                    {validation.issues.map((issue, i) => (
                      <li key={i}>• {issue}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 권 정보 */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <Label className="text-muted-foreground">시작점</Label>
                  <p className="text-sm">{volume.startPoint || '설정되지 않음'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">핵심 사건</Label>
                  <p className="text-sm">{volume.coreEvent || '설정되지 않음'}</p>
                </div>
              </div>

              {/* 종료점 (핵심) */}
              <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg mb-4">
                <Label className="text-primary font-semibold flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  종료점 (⚠️ 가장 중요)
                </Label>
                <p className="text-sm mt-1">{volume.endPoint || '설정되지 않음'}</p>
                {volume.endPointExact && (
                  <p className="text-sm mt-2 p-2 bg-background rounded border">
                    정확한 종료: "{volume.endPointExact}"
                  </p>
                )}
              </div>

              {/* 씬 목록 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>씬 목록 ({volume.scenes.length}개)</Label>
                  <Button variant="outline" size="sm" onClick={onAddScene}>
                    <Plus className="w-3 h-3 mr-1" />
                    씬 추가
                  </Button>
                </div>

                {volume.scenes.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    씬이 없습니다. 씬을 추가하거나 자동 분할을 사용하세요.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {volume.scenes
                      .sort((a, b) => a.sceneNumber - b.sceneNumber)
                      .map(scene => (
                        <SceneItem
                          key={scene.id}
                          scene={scene}
                          onGeneratePrompt={
                            onGeneratePrompt
                              ? () => onGeneratePrompt(volume.id, scene.id)
                              : undefined
                          }
                        />
                      ))}
                  </div>
                )}
              </div>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 편집 다이얼로그 */}
      <EditVolumeDialog
        open={isEditing}
        onOpenChange={setIsEditing}
        volume={volume}
        onSave={onUpdate}
      />
    </Card>
  );
}

// ============================================
// 씬 아이템 컴포넌트
// ============================================

interface SceneItemProps {
  scene: SceneStructure;
  onGeneratePrompt?: () => void;
}

function SceneItem({ scene, onGeneratePrompt }: SceneItemProps) {
  const { updateScene, deleteScene } = useVolumeStore();
  const [isEditing, setIsEditing] = useState(false);

  const statusColors = {
    pending: 'bg-gray-400',
    in_progress: 'bg-blue-500',
    completed: 'bg-green-500',
    needs_revision: 'bg-yellow-500',
  };

  const progressPercent = scene.targetWordCount > 0
    ? Math.round((scene.actualWordCount / scene.targetWordCount) * 100)
    : 0;

  return (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 group">
      <Badge variant="outline" className={`${statusColors[scene.status]} text-white border-0`}>
        {scene.sceneNumber}
      </Badge>
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{scene.title}</div>
        <div className="text-xs text-muted-foreground">
          {scene.endCondition ? `종료: ${scene.endCondition.slice(0, 30)}...` : '종료점 미설정'}
        </div>
      </div>
      <div className="text-sm text-muted-foreground whitespace-nowrap">
        {(scene.actualWordCount / 10000).toFixed(1)}만 / {(scene.targetWordCount / 10000).toFixed(1)}만
      </div>
      <Progress value={progressPercent} className="w-16 h-1" />

      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
        {onGeneratePrompt && (
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onGeneratePrompt}>
            <Copy className="w-3 h-3" />
          </Button>
        )}
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsEditing(true)}>
          <Settings className="w-3 h-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-destructive"
          onClick={() => deleteScene(scene.id)}
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>

      {/* 씬 편집 다이얼로그 */}
      <EditSceneDialog
        open={isEditing}
        onOpenChange={setIsEditing}
        scene={scene}
        onSave={(data) => updateScene(scene.id, data)}
      />
    </div>
  );
}

// ============================================
// 다이얼로그 컴포넌트들
// ============================================

function AddVolumeDialog({
  open,
  onOpenChange,
  onAdd,
  nextNumber,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: () => void;
  nextNumber: number;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>새 권 추가</DialogTitle>
          <DialogDescription>
            {nextNumber}권을 추가합니다. 추가 후 상세 설정을 진행하세요.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button onClick={onAdd}>추가</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddSceneDialog({
  open,
  onOpenChange,
  volumeId,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  volumeId: string;
  onAdd: (data: Partial<SceneStructure>) => void;
}) {
  const [title, setTitle] = useState('');
  const [targetWordCount, setTargetWordCount] = useState(15000);

  const handleAdd = () => {
    onAdd({ title: title || '새 씬', targetWordCount });
    setTitle('');
    setTargetWordCount(15000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>새 씬 추가</DialogTitle>
          <DialogDescription>
            씬의 제목과 목표 글자수를 설정하세요.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label>씬 제목</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="씬 제목을 입력하세요"
            />
          </div>
          <div>
            <Label>목표 글자수</Label>
            <Input
              type="number"
              value={targetWordCount}
              onChange={(e) => setTargetWordCount(Number(e.target.value))}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {(targetWordCount / 10000).toFixed(1)}만자
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button onClick={handleAdd}>추가</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditVolumeDialog({
  open,
  onOpenChange,
  volume,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  volume: VolumeStructure;
  onSave: (data: Partial<VolumeStructure>) => void;
}) {
  const [formData, setFormData] = useState(volume);

  useEffect(() => {
    setFormData(volume);
  }, [volume]);

  const handleSave = () => {
    onSave(formData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{volume.volumeNumber}권 설정</DialogTitle>
          <DialogDescription>
            권의 시작점, 종료점, 핵심 사건을 설정하세요. 종료점은 구체적인 대사나 행동으로 명시해야 합니다.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>권 제목</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div>
              <Label>목표 글자수</Label>
              <Input
                type="number"
                value={formData.targetWordCount}
                onChange={(e) => setFormData({ ...formData, targetWordCount: Number(e.target.value) })}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {(formData.targetWordCount / 10000).toFixed(1)}만자
              </p>
            </div>
          </div>

          <div>
            <Label>시작점</Label>
            <Textarea
              value={formData.startPoint}
              onChange={(e) => setFormData({ ...formData, startPoint: e.target.value })}
              placeholder="이 권이 시작되는 상황을 구체적으로 기술하세요"
              rows={2}
            />
          </div>

          <div>
            <Label>핵심 사건</Label>
            <Textarea
              value={formData.coreEvent}
              onChange={(e) => setFormData({ ...formData, coreEvent: e.target.value })}
              placeholder="이 권의 핵심 사건/갈등을 기술하세요"
              rows={2}
            />
          </div>

          <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <Label className="text-primary font-semibold">⚠️ 종료점 (가장 중요!)</Label>
            <Textarea
              value={formData.endPoint}
              onChange={(e) => setFormData({ ...formData, endPoint: e.target.value })}
              placeholder="이 권이 끝나는 구체적인 장면을 기술하세요. 모호하면 안 됩니다!"
              rows={3}
              className="mt-2"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>종료 유형</Label>
              <Select
                value={formData.endPointType}
                onValueChange={(v) => setFormData({ ...formData, endPointType: v as 'dialogue' | 'action' | 'narration' | 'scene' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dialogue">대사</SelectItem>
                  <SelectItem value="action">행동</SelectItem>
                  <SelectItem value="narration">서술</SelectItem>
                  <SelectItem value="scene">장면</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>상태</Label>
              <Select
                value={formData.status}
                onValueChange={(v) => setFormData({ ...formData, status: v as 'planning' | 'writing' | 'completed' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planning">기획 중</SelectItem>
                  <SelectItem value="writing">집필 중</SelectItem>
                  <SelectItem value="completed">완료</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>정확한 종료 대사/행동</Label>
            <Input
              value={formData.endPointExact}
              onChange={(e) => setFormData({ ...formData, endPointExact: e.target.value })}
              placeholder='예: "그래도 난 상인이 될 것이다"'
            />
            <p className="text-xs text-muted-foreground mt-1">
              이 대사나 행동이 나오면 AI가 멈춥니다
            </p>
          </div>

          <div>
            <Label>이전 권 요약 (2권 이상)</Label>
            <Textarea
              value={formData.previousVolumeSummary || ''}
              onChange={(e) => setFormData({ ...formData, previousVolumeSummary: e.target.value })}
              placeholder="이전 권의 주요 사건 2-3줄 요약"
              rows={2}
            />
          </div>

          <div>
            <Label>다음 권 예고 (참고용, 절대 쓰지 말 것)</Label>
            <Textarea
              value={formData.nextVolumePreview || ''}
              onChange={(e) => setFormData({ ...formData, nextVolumePreview: e.target.value })}
              placeholder="다음 권에서 다룰 내용 (AI가 참고만 하고 절대 쓰지 않음)"
              rows={2}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button onClick={handleSave}>저장</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditSceneDialog({
  open,
  onOpenChange,
  scene,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scene: SceneStructure;
  onSave: (data: Partial<SceneStructure>) => void;
}) {
  const [formData, setFormData] = useState(scene);
  const [mustIncludeText, setMustIncludeText] = useState(scene.mustInclude.join('\n'));

  useEffect(() => {
    setFormData(scene);
    setMustIncludeText(scene.mustInclude.join('\n'));
  }, [scene]);

  const handleSave = () => {
    onSave({
      ...formData,
      mustInclude: mustIncludeText.split('\n').filter(Boolean),
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>씬 {scene.sceneNumber} 설정</DialogTitle>
          <DialogDescription>
            씬의 장소, 시간, 등장인물, 종료 조건 등을 설정하세요.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>씬 제목</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div>
              <Label>목표 글자수</Label>
              <Input
                type="number"
                value={formData.targetWordCount}
                onChange={(e) => setFormData({ ...formData, targetWordCount: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>시점 인물 (POV)</Label>
              <Input
                value={formData.pov}
                onChange={(e) => setFormData({ ...formData, pov: e.target.value })}
                placeholder="누구의 시점으로 쓸 것인가"
              />
            </div>
            <div>
              <Label>시점 유형</Label>
              <Select
                value={formData.povType}
                onValueChange={(v) => setFormData({ ...formData, povType: v as 'first' | 'third-limited' | 'omniscient' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="first">1인칭</SelectItem>
                  <SelectItem value="third-limited">3인칭 제한</SelectItem>
                  <SelectItem value="omniscient">전지적</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>장소</Label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>
            <div>
              <Label>시간대</Label>
              <Input
                value={formData.timeframe}
                onChange={(e) => setFormData({ ...formData, timeframe: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label>시작 상황</Label>
            <Textarea
              value={formData.startCondition}
              onChange={(e) => setFormData({ ...formData, startCondition: e.target.value })}
              placeholder="이 씬이 시작될 때의 상황"
              rows={2}
            />
          </div>

          <div>
            <Label>필수 포함 내용 (한 줄에 하나씩)</Label>
            <Textarea
              value={mustIncludeText}
              onChange={(e) => setMustIncludeText(e.target.value)}
              placeholder="이 씬에 반드시 포함되어야 할 내용&#10;한 줄에 하나씩 입력"
              rows={4}
            />
          </div>

          <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <Label className="text-primary font-semibold">⚠️ 종료 조건 (가장 중요!)</Label>
            <Textarea
              value={formData.endCondition}
              onChange={(e) => setFormData({ ...formData, endCondition: e.target.value })}
              placeholder='구체적인 대사나 행동. 예: 소서노가 "떠나겠다"고 선언하는 장면'
              rows={2}
              className="mt-2"
            />
            <Select
              value={formData.endConditionType}
              onValueChange={(v) => setFormData({ ...formData, endConditionType: v as 'dialogue' | 'action' | 'narration' | 'scene' })}
            >
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="종료 유형" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dialogue">대사</SelectItem>
                <SelectItem value="action">행동</SelectItem>
                <SelectItem value="narration">서술</SelectItem>
                <SelectItem value="scene">장면</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>상태</Label>
            <Select
              value={formData.status}
              onValueChange={(v) => setFormData({ ...formData, status: v as 'pending' | 'in_progress' | 'completed' | 'needs_revision' })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">대기</SelectItem>
                <SelectItem value="in_progress">집필 중</SelectItem>
                <SelectItem value="completed">완료</SelectItem>
                <SelectItem value="needs_revision">수정 필요</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button onClick={handleSave}>저장</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default VolumeStructureManager;
