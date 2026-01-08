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
  RefreshCw,
  Sparkles,
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
import { useProjectStore } from '@/stores/projectStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useCharacterStore } from '@/stores/characterStore';
import { useWorldStore } from '@/stores/worldStore';
import { usePlotStore } from '@/stores/plotStore';
import { generateJSON } from '@/lib/gemini';
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

  const { currentProject } = useProjectStore();
  const { settings } = useSettingsStore();
  const { characters } = useCharacterStore();
  const { worldSettings } = useWorldStore();
  const { plotStructure } = usePlotStore();

  // 프로젝트 관련 데이터 필터링
  const projectCharacters = characters.filter(c => c.projectId === projectId);
  const projectWorldSettings = worldSettings.filter(w => w.projectId === projectId);
  const projectPlotPoints = plotStructure?.plotPoints || [];

  const [isAddVolumeOpen, setIsAddVolumeOpen] = useState(false);
  const [isAddSceneOpen, setIsAddSceneOpen] = useState(false);
  const [selectedVolumeForScene, setSelectedVolumeForScene] = useState<string | null>(null);
  const [expandedVolumes, setExpandedVolumes] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [regeneratingVolumeId, setRegeneratingVolumeId] = useState<string | null>(null);
  const [isDeleteAllOpen, setIsDeleteAllOpen] = useState(false);

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

  // 전체 권 삭제
  const handleDeleteAllVolumes = async () => {
    for (const vol of projectVolumes) {
      await deleteVolume(vol.id);
    }
    setIsDeleteAllOpen(false);
  };

  // AI 권 구조 자동 생성 (기존 전체 삭제 후 새로 생성, 씬 포함)
  const handleAutoGenerateVolumes = async () => {
    if (!settings?.geminiApiKey || !currentProject) return;

    setIsGenerating(true);
    try {
      // 기존 권 전체 삭제
      for (const vol of projectVolumes) {
        await deleteVolume(vol.id);
      }

      const totalWordCount = currentProject.settings?.targetTotalLength || 4300000; // 기본 430만자
      const avgVolumeWordCount = 195000; // 권당 평균 19.5만자
      const suggestedVolumeCount = Math.ceil(totalWordCount / avgVolumeWordCount);

      // 캐릭터 정보 요약
      const mainCharacters = projectCharacters.filter(c => c.role === 'protagonist' || c.role === 'antagonist');
      const supportCharacters = projectCharacters.filter(c => c.role === 'supporting' || c.role === 'deuteragonist');
      const characterSummary = mainCharacters.length > 0
        ? mainCharacters.map(c => `- ${c.name} (${c.role === 'protagonist' ? '주인공' : '적대자'}): ${c.background?.slice(0, 100) || c.personality?.slice(0, 100) || '설명 없음'}`).join('\n')
        : '캐릭터 미설정';

      // 세계관 정보 요약
      const coreWorldSettings = projectWorldSettings.filter(w => w.importance === 'core');
      const worldSummary = coreWorldSettings.length > 0
        ? coreWorldSettings.map(w => `- ${w.title}: ${w.description?.slice(0, 80) || ''}`).join('\n')
        : '세계관 미설정';

      // 플롯 정보 요약
      const sortedPlotPoints = [...projectPlotPoints].sort((a, b) => a.order - b.order);
      const plotSummary = sortedPlotPoints.length > 0
        ? sortedPlotPoints.slice(0, 10).map(p => `${p.order}. ${p.title}: ${p.description?.slice(0, 60) || ''}`).join('\n')
        : '플롯 미설정';

      const prompt = `다음 소설의 모든 기획을 바탕으로 권별 구조와 씬을 JSON 배열로 생성해주세요.

## 작품 정보
- 제목: ${currentProject.title}
- 장르: ${currentProject.genre.join(', ')}
- 컨셉: ${currentProject.concept}
- 시놉시스: ${currentProject.synopsis}
- 상세 시놉시스: ${currentProject.detailedSynopsis || '없음'}
- 목표 글자수: ${(totalWordCount / 10000).toFixed(0)}만자
- 예상 권수: ${suggestedVolumeCount}권

## 주요 캐릭터
${characterSummary}
${supportCharacters.length > 0 ? '\n조연: ' + supportCharacters.map(c => c.name).join(', ') : ''}

## 핵심 세계관
${worldSummary}

## 플롯 포인트
${plotSummary}

## 요청
총 ${Math.min(suggestedVolumeCount, 22)}권의 구조를 생성해주세요.
각 권에는 8-12개의 씬을 포함해주세요.

규칙:
1. 각 권은 19-20만자 분량 (각 씬은 1.5-2만자)
2. 종료점은 반드시 구체적인 대사나 행동으로 명시
3. 모호한 표현(성장한다, 변화한다, 깨닫는다) 대신 구체적인 장면 제시
4. 플롯 포인트를 적절히 배분
5. 캐릭터의 성장 아크 반영
6. ⛔ 빈 괄호() 사용 금지 - "천군()"처럼 빈 괄호 절대 금지
7. ⛔ 불필요한 특수문자 사용 금지 - 제목에 괄호, 물음표, 느낌표 등 최소화

JSON 형식:
[
  {
    "volumeNumber": 1,
    "title": "권 제목 (부제 포함)",
    "targetWordCount": 195000,
    "startPoint": "이 권이 시작되는 구체적인 상황",
    "coreEvent": "이 권의 핵심 사건/갈등",
    "endPoint": "이 권이 끝나는 구체적인 장면 설명",
    "endPointType": "dialogue",
    "endPointExact": "정확한 종료 대사 또는 행동 (큰따옴표로 대사 표현)",
    "scenes": [
      {
        "sceneNumber": 1,
        "title": "씬 제목",
        "targetWordCount": 18000,
        "pov": "시점 인물 이름",
        "povType": "third-limited",
        "location": "장소",
        "timeframe": "시간대",
        "participants": ["이 씬에 등장하는 캐릭터1", "캐릭터2"],
        "startCondition": "씬 시작 상황",
        "mustInclude": ["필수 포함 내용1", "필수 포함 내용2"],
        "endCondition": "씬 종료 조건 (구체적 대사/행동)",
        "endConditionType": "dialogue"
      }
    ]
  }
]

endPointType/endConditionType: dialogue(대사), action(행동), narration(서술), scene(장면)
povType: first(1인칭), third-limited(3인칭 제한), omniscient(전지적)`;

      const result = await generateJSON<Array<{
        volumeNumber: number;
        title: string;
        targetWordCount: number;
        startPoint: string;
        coreEvent: string;
        endPoint: string;
        endPointType: 'dialogue' | 'action' | 'narration' | 'scene';
        endPointExact: string;
        scenes: Array<{
          sceneNumber: number;
          title: string;
          targetWordCount: number;
          pov: string;
          povType: 'first' | 'third-limited' | 'omniscient';
          location: string;
          timeframe: string;
          participants: string[]; // 🔒 등장인물 필수!
          startCondition: string;
          mustInclude: string[];
          endCondition: string;
          endConditionType: 'dialogue' | 'action' | 'narration' | 'scene';
        }>;
      }>>(settings.geminiApiKey, prompt, { temperature: 0.8, maxTokens: 32000, model: settings.planningModel || 'gemini-3-flash-preview' });

      // 생성된 권과 씬 저장
      for (let i = 0; i < result.length; i++) {
        const vol = result[i];

        // 이전 권 요약 자동 생성 (2권 이상)
        let previousVolumeSummary = '';
        if (i > 0) {
          const prevVol = result[i - 1];
          previousVolumeSummary = `${prevVol.title}: ${prevVol.coreEvent}. 종료: ${prevVol.endPoint}`;
        }

        // 다음 권 예고 자동 생성 (마지막 권 제외)
        let nextVolumePreview = '';
        if (i < result.length - 1) {
          const nextVol = result[i + 1];
          nextVolumePreview = `${nextVol.title}: ${nextVol.coreEvent}`;
        }

        // 빈 괄호 제거 (title에서)
        const cleanTitle = vol.title.replace(/\(\s*\)/g, '').trim();

        const newVolume = await createVolume(projectId, {
          volumeNumber: i + 1,
          title: cleanTitle,
          targetWordCount: vol.targetWordCount || 195000,
          startPoint: vol.startPoint,
          coreEvent: vol.coreEvent,
          endPoint: vol.endPoint,
          endPointType: vol.endPointType || 'dialogue',
          endPointExact: vol.endPointExact,
          previousVolumeSummary,
          nextVolumePreview,
          status: 'planning',
        });

        // 씬 생성
        if (newVolume && vol.scenes && vol.scenes.length > 0) {
          for (let j = 0; j < vol.scenes.length; j++) {
            const scene = vol.scenes[j];
            // 빈 괄호 제거 (씬 title, pov 등에서)
            const cleanSceneTitle = scene.title.replace(/\(\s*\)/g, '').trim();
            const cleanPov = (scene.pov || '').replace(/\(\s*\)/g, '').trim();
            const cleanLocation = (scene.location || '').replace(/\(\s*\)/g, '').trim();

            await createScene(newVolume.id, {
              sceneNumber: j + 1,
              title: cleanSceneTitle,
              targetWordCount: scene.targetWordCount || 18000,
              pov: cleanPov,
              povType: scene.povType || 'third-limited',
              location: cleanLocation,
              timeframe: scene.timeframe || '',
              participants: scene.participants || [], // 🔒 등장인물 필수 전달!
              startCondition: scene.startCondition || '',
              mustInclude: scene.mustInclude || [],
              endCondition: scene.endCondition || '',
              endConditionType: scene.endConditionType || 'scene',
              status: 'pending',
            });
          }
        }
      }

      await fetchVolumes(projectId);
    } catch (error) {
      console.error('권 구조 생성 실패:', error);
      alert('권 구조 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  // 단일 권 재생성 (씬 포함)
  const handleRegenerateVolume = async (volumeId: string) => {
    if (!settings?.geminiApiKey || !currentProject) return;

    const volume = projectVolumes.find(v => v.id === volumeId);
    if (!volume) return;

    setRegeneratingVolumeId(volumeId);
    try {
      // 기존 씬 삭제
      for (const scene of volume.scenes) {
        await deleteScene(scene.id);
      }

      // 이전 권과 다음 권 정보 가져오기
      const prevVolume = projectVolumes.find(v => v.volumeNumber === volume.volumeNumber - 1);
      const nextVolume = projectVolumes.find(v => v.volumeNumber === volume.volumeNumber + 1);

      // 캐릭터 정보 요약
      const mainCharacters = projectCharacters.filter(c => c.role === 'protagonist' || c.role === 'antagonist');
      const characterSummary = mainCharacters.length > 0
        ? mainCharacters.map(c => `- ${c.name}: ${c.background?.slice(0, 80) || c.personality?.slice(0, 80) || ''}`).join('\n')
        : '캐릭터 미설정';

      const prompt = `다음 소설의 ${volume.volumeNumber}권 구조와 씬을 재생성해주세요.

## 작품 정보
- 제목: ${currentProject.title}
- 장르: ${currentProject.genre.join(', ')}
- 컨셉: ${currentProject.concept}
- 시놉시스: ${currentProject.synopsis}

## 주요 캐릭터
${characterSummary}

## 이전 권 (${volume.volumeNumber - 1}권)
${prevVolume
  ? `- 제목: ${prevVolume.title}
- 종료점: ${prevVolume.endPoint || '미설정'}
- 정확한 종료: ${prevVolume.endPointExact || '미설정'}`
  : '없음 (첫 번째 권)'}

## 다음 권 (${volume.volumeNumber + 1}권)
${nextVolume
  ? `- 제목: ${nextVolume.title}
- 시작점: ${nextVolume.startPoint || '미설정'}`
  : '없음 (마지막 권)'}

## 요청
${volume.volumeNumber}권의 구조와 8-12개의 씬을 재생성해주세요.
이전 권의 종료점에서 자연스럽게 이어지고, 다음 권의 시작점으로 연결되어야 합니다.

규칙:
1. 권은 19-20만자 분량 (각 씬은 1.5-2만자)
2. 종료점은 반드시 구체적인 대사나 행동으로 명시
3. 모호한 표현 대신 구체적인 장면 제시
4. ⛔ 빈 괄호() 사용 금지 - "천군()"처럼 빈 괄호 절대 금지
5. ⛔ 불필요한 특수문자 사용 금지 - 제목에 괄호, 물음표, 느낌표 등 최소화

JSON 형식 (단일 객체):
{
  "title": "권 제목",
  "targetWordCount": 195000,
  "startPoint": "이 권이 시작되는 구체적인 상황",
  "coreEvent": "이 권의 핵심 사건/갈등",
  "endPoint": "이 권이 끝나는 구체적인 장면 설명",
  "endPointType": "dialogue",
  "endPointExact": "정확한 종료 대사 또는 행동",
  "scenes": [
    {
      "sceneNumber": 1,
      "title": "씬 제목",
      "targetWordCount": 18000,
      "pov": "시점 인물 이름",
      "povType": "third-limited",
      "location": "장소",
      "timeframe": "시간대",
      "startCondition": "씬 시작 상황",
      "mustInclude": ["필수 포함 내용1", "필수 포함 내용2"],
      "endCondition": "씬 종료 조건",
      "endConditionType": "dialogue"
    }
  ]
}

endPointType/endConditionType: dialogue(대사), action(행동), narration(서술), scene(장면)`;

      const result = await generateJSON<{
        title: string;
        targetWordCount: number;
        startPoint: string;
        coreEvent: string;
        endPoint: string;
        endPointType: 'dialogue' | 'action' | 'narration' | 'scene';
        endPointExact: string;
        scenes: Array<{
          sceneNumber: number;
          title: string;
          targetWordCount: number;
          pov: string;
          povType: 'first' | 'third-limited' | 'omniscient';
          location: string;
          timeframe: string;
          participants: string[]; // 🔒 등장인물 필수!
          startCondition: string;
          mustInclude: string[];
          endCondition: string;
          endConditionType: 'dialogue' | 'action' | 'narration' | 'scene';
        }>;
      }>(settings.geminiApiKey, prompt, { temperature: 0.8, maxTokens: 16000, model: settings.planningModel || 'gemini-3-flash-preview' });

      // 빈 괄호 제거
      const cleanTitle = result.title.replace(/\(\s*\)/g, '').trim();

      // 이전 권 요약 자동 생성
      let previousVolumeSummary = '';
      if (prevVolume) {
        previousVolumeSummary = `${prevVolume.title}: ${prevVolume.coreEvent}. 종료: ${prevVolume.endPoint}`;
      }

      // 다음 권 예고 자동 생성
      let nextVolumePreview = '';
      if (nextVolume) {
        nextVolumePreview = `${nextVolume.title}: ${nextVolume.coreEvent || nextVolume.startPoint}`;
      }

      await updateVolume(volumeId, {
        title: cleanTitle,
        targetWordCount: result.targetWordCount || 195000,
        startPoint: result.startPoint,
        coreEvent: result.coreEvent,
        endPoint: result.endPoint,
        endPointType: result.endPointType || 'dialogue',
        endPointExact: result.endPointExact,
        previousVolumeSummary,
        nextVolumePreview,
      });

      // 씬 생성
      if (result.scenes && result.scenes.length > 0) {
        for (let j = 0; j < result.scenes.length; j++) {
          const scene = result.scenes[j];
          // 빈 괄호 제거
          const cleanSceneTitle = scene.title.replace(/\(\s*\)/g, '').trim();
          const cleanPov = (scene.pov || '').replace(/\(\s*\)/g, '').trim();
          const cleanLocation = (scene.location || '').replace(/\(\s*\)/g, '').trim();

          await createScene(volumeId, {
            sceneNumber: j + 1,
            title: cleanSceneTitle,
            targetWordCount: scene.targetWordCount || 18000,
            pov: cleanPov,
            povType: scene.povType || 'third-limited',
            location: cleanLocation,
            timeframe: scene.timeframe || '',
            participants: scene.participants || [], // 🔒 등장인물 필수 전달!
            startCondition: scene.startCondition || '',
            mustInclude: scene.mustInclude || [],
            endCondition: scene.endCondition || '',
            endConditionType: scene.endConditionType || 'scene',
            status: 'pending',
          });
        }
      }

      await fetchVolumes(projectId);
    } catch (error) {
      console.error('권 재생성 실패:', error);
      alert('권 재생성 중 오류가 발생했습니다.');
    } finally {
      setRegeneratingVolumeId(null);
    }
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
        <div className="flex gap-2">
          <Button
            variant="default"
            className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            onClick={handleAutoGenerateVolumes}
            disabled={isGenerating || !settings?.geminiApiKey}
          >
            {isGenerating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            AI 재생성
          </Button>
          {projectVolumes.length > 0 && (
            <Button
              variant="outline"
              className="gap-2 text-destructive hover:text-destructive"
              onClick={() => setIsDeleteAllOpen(true)}
            >
              <Trash2 className="w-4 h-4" />
              전체 삭제
            </Button>
          )}
          <Button variant="outline" onClick={() => setIsAddVolumeOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            권 추가
          </Button>
        </div>
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
                onRegenerate={() => handleRegenerateVolume(volume.id)}
                isRegenerating={regeneratingVolumeId === volume.id}
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

      {/* 전체 삭제 확인 다이얼로그 */}
      <Dialog open={isDeleteAllOpen} onOpenChange={setIsDeleteAllOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              전체 권 삭제
            </DialogTitle>
            <DialogDescription>
              정말로 모든 권({projectVolumes.length}개)을 삭제하시겠습니까?
              <br />
              <span className="text-destructive font-medium">이 작업은 되돌릴 수 없습니다.</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteAllOpen(false)}>
              취소
            </Button>
            <Button variant="destructive" onClick={handleDeleteAllVolumes}>
              <Trash2 className="w-4 h-4 mr-2" />
              전체 삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
  onRegenerate: () => void;
  isRegenerating: boolean;
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
  onRegenerate,
  isRegenerating,
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

            {/* 개별 재생성 버튼 */}
            {!validation.isValid && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1 text-purple-600 border-purple-300 hover:bg-purple-50"
                onClick={(e) => {
                  e.stopPropagation();
                  onRegenerate();
                }}
                disabled={isRegenerating}
              >
                {isRegenerating ? (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                ) : (
                  <Sparkles className="w-3 h-3" />
                )}
                재생성
              </Button>
            )}

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
                <DropdownMenuItem onClick={onRegenerate} disabled={isRegenerating}>
                  {isRegenerating ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  AI 재생성
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
                    정확한 종료: &quot;{volume.endPointExact}&quot;
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
  const [participantsText, setParticipantsText] = useState((scene.participants || []).join('\n'));

  useEffect(() => {
    setFormData(scene);
    setMustIncludeText(scene.mustInclude.join('\n'));
    setParticipantsText((scene.participants || []).join('\n'));
  }, [scene]);

  const handleSave = () => {
    onSave({
      ...formData,
      participants: participantsText.split('\n').filter(Boolean), // 🔒 등장인물 저장!
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

          {/* 🔒 등장인물 입력 필드 (핵심!) */}
          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <Label className="text-blue-700 dark:text-blue-400 font-semibold">
              👥 등장인물 (한 줄에 하나씩) - 필수!
            </Label>
            <Textarea
              value={participantsText}
              onChange={(e) => setParticipantsText(e.target.value)}
              placeholder="이 씬에 등장하는 캐릭터만 입력&#10;황진&#10;춘섬&#10;(언급만 되는 캐릭터는 제외!)"
              rows={3}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              ⚠️ 여기 입력한 캐릭터만 이 씬에서 등장할 수 있습니다!
            </p>
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
