'use client';

import React, { useState, useEffect } from 'react';
import {
  Scissors,
  Merge,
  RotateCcw,
  Trash2,
  Plus,
  Edit3,
  Eye,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  Info,
  History,
  GitBranch,
  FileText,
  Copy,
  RefreshCw,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSceneRewriteStore, SceneRewriteVersion } from '@/stores/sceneRewriteStore';
import { ParsedScene, SceneIssue } from '@/lib/sceneParser';

interface SceneRewritePanelProps {
  initialText?: string;
  documentId?: string;
  documentTitle?: string;
  onSave?: (text: string) => void;
}

export default function SceneRewritePanel({
  documentId = 'default',
  documentTitle = '제목 없음',
  onSave,
}: SceneRewritePanelProps) {
  const {
    currentDocument,
    selectedSceneId,
    isParsing,
    error,
    parseDocument,
    selectScene,
    rewriteScene,
    deleteSceneById,
    insertSceneAfter,
    mergeScenes,
    splitScene,
    reorderScene,
    restoreVersion,
    exportDocument,
    getSceneById,
    getSceneVersions,
  } = useSceneRewriteStore();

  const [editingContent, setEditingContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [mergeSelection, setMergeSelection] = useState<string[]>([]);
  const [isMergeMode, setIsMergeMode] = useState(false);
  const [splitPosition, setSplitPosition] = useState<number | null>(null);
  const [newSceneContent, setNewSceneContent] = useState('');
  const [showInsertDialog, setShowInsertDialog] = useState(false);
  const [insertAfterSceneId, setInsertAfterSceneId] = useState<string | null>(null);
  const [rewriteNote, setRewriteNote] = useState('');

  useEffect(() => {
    if (selectedSceneId) {
      const scene = getSceneById(selectedSceneId);
      if (scene) {
        setEditingContent(scene.content);
      }
    }
  }, [selectedSceneId, getSceneById]);

  const scenes = currentDocument?.parseResult?.scenes || [];
  const selectedScene = selectedSceneId ? getSceneById(selectedSceneId) : null;
  const versions = selectedSceneId ? getSceneVersions(selectedSceneId) : [];

  const getStatusIcon = (status: ParsedScene['status']) => {
    switch (status) {
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default:
        return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
  };

  const getSeverityColor = (severity: SceneIssue['severity']) => {
    switch (severity) {
      case 'error':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'warning':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      default:
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    }
  };

  const handleSave = () => {
    if (!selectedSceneId || !editingContent) return;
    rewriteScene(selectedSceneId, editingContent, rewriteNote || undefined);
    setIsEditing(false);
    setRewriteNote('');
    if (onSave) {
      onSave(exportDocument());
    }
  };

  const toggleMergeSelection = (sceneId: string) => {
    if (mergeSelection.includes(sceneId)) {
      setMergeSelection(mergeSelection.filter(id => id !== sceneId));
    } else {
      setMergeSelection([...mergeSelection, sceneId]);
    }
  };

  const handleMerge = () => {
    if (mergeSelection.length >= 2) {
      mergeScenes(mergeSelection);
      setMergeSelection([]);
      setIsMergeMode(false);
    }
  };

  const handleSplit = () => {
    if (selectedSceneId && splitPosition !== null) {
      splitScene(selectedSceneId, [splitPosition]);
      setSplitPosition(null);
    }
  };

  const handleInsertScene = () => {
    if (insertAfterSceneId && newSceneContent.trim()) {
      insertSceneAfter(insertAfterSceneId, newSceneContent);
      setNewSceneContent('');
      setShowInsertDialog(false);
      setInsertAfterSceneId(null);
    }
  };

  if (isParsing) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-500" />
          <p className="text-sm text-gray-500">씬 분석 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-red-500">
          <AlertCircle className="w-8 h-8 mx-auto mb-2" />
          <p>{error}</p>
          <Button variant="outline" onClick={parseDocument} className="mt-4">
            다시 시도
          </Button>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex h-full gap-4">
        {/* 왼쪽: 씬 목록 */}
        <div className="w-80 flex-shrink-0">
          <Card className="h-full">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Layers className="w-5 h-5" />
                  씬 목록
                  <Badge variant="secondary">{scenes.length}개</Badge>
                </CardTitle>
                <div className="flex gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={isMergeMode ? 'default' : 'ghost'}
                        size="icon"
                        onClick={() => {
                          setIsMergeMode(!isMergeMode);
                          setMergeSelection([]);
                        }}
                      >
                        <Merge className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>씬 병합 모드</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-2">
              <ScrollArea className="h-[calc(100vh-16rem)]">
                <div className="space-y-2">
                  {scenes.map((scene: ParsedScene, index: number) => (
                    <div
                      key={scene.id}
                      className={`
                        p-3 rounded-lg border cursor-pointer transition-all
                        ${selectedSceneId === scene.id
                          ? 'bg-blue-500/10 border-blue-500'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-800 border-gray-200 dark:border-gray-700'
                        }
                        ${isMergeMode && mergeSelection.includes(scene.id)
                          ? 'ring-2 ring-purple-500'
                          : ''
                        }
                      `}
                      onClick={() => {
                        if (isMergeMode) {
                          toggleMergeSelection(scene.id);
                        } else {
                          selectScene(scene.id);
                        }
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {isMergeMode && (
                              <input
                                type="checkbox"
                                checked={mergeSelection.includes(scene.id)}
                                onChange={() => toggleMergeSelection(scene.id)}
                                className="rounded"
                              />
                            )}
                            <span className="font-medium text-sm">
                              씬 {scene.number}
                            </span>
                            {getStatusIcon(scene.status)}
                          </div>
                          <p className="text-xs text-gray-500 truncate">
                            {scene.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {scene.wordCount.toLocaleString()}자
                            </Badge>
                            {scene.characters.length > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                {scene.characters.length}명
                              </Badge>
                            )}
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ChevronDown className="w-3 h-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setInsertAfterSceneId(scene.id);
                                setShowInsertDialog(true);
                              }}
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              씬 삽입
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                selectScene(scene.id);
                                setSplitPosition(Math.floor(scene.content.length / 2));
                              }}
                            >
                              <Scissors className="w-4 h-4 mr-2" />
                              씬 분할
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                if (index > 0) reorderScene(scene.id, index - 1);
                              }}
                              disabled={index === 0}
                            >
                              <ChevronUp className="w-4 h-4 mr-2" />
                              위로 이동
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                if (index < scenes.length - 1) reorderScene(scene.id, index + 1);
                              }}
                              disabled={index === scenes.length - 1}
                            >
                              <ChevronDown className="w-4 h-4 mr-2" />
                              아래로 이동
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => deleteSceneById(scene.id)}
                              className="text-red-500"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              삭제
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {scene.issues.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {scene.issues.slice(0, 2).map((issue: SceneIssue, i: number) => (
                            <div
                              key={i}
                              className={`text-xs p-1 rounded border ${getSeverityColor(issue.severity)}`}
                            >
                              {issue.description}
                            </div>
                          ))}
                          {scene.issues.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{scene.issues.length - 2} 더 보기
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {isMergeMode && mergeSelection.length >= 2 && (
                <div className="mt-4 p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                  <p className="text-sm mb-2">
                    {mergeSelection.length}개 씬 선택됨
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleMerge}>
                      <Merge className="w-4 h-4 mr-1" />
                      병합
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setMergeSelection([]);
                        setIsMergeMode(false);
                      }}
                    >
                      취소
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 오른쪽: 씬 편집 */}
        <div className="flex-1">
          {selectedScene ? (
            <Card className="h-full">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-lg">
                      씬 {selectedScene.number}: {selectedScene.title}
                    </CardTitle>
                    {getStatusIcon(selectedScene.status)}
                  </div>
                  <div className="flex gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setShowVersionHistory(!showVersionHistory)}
                        >
                          <History className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>버전 히스토리</TooltipContent>
                    </Tooltip>
                    <Button
                      variant={isEditing ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setIsEditing(!isEditing)}
                    >
                      {isEditing ? (
                        <>
                          <Eye className="w-4 h-4 mr-1" />
                          미리보기
                        </>
                      ) : (
                        <>
                          <Edit3 className="w-4 h-4 mr-1" />
                          편집
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="outline">
                    {selectedScene.wordCount.toLocaleString()}자
                  </Badge>
                  {selectedScene.characters.length > 0 && (
                    <Badge variant="secondary">
                      등장인물: {selectedScene.characters.join(', ')}
                    </Badge>
                  )}
                  {selectedScene.locations.length > 0 && (
                    <Badge variant="secondary">
                      장소: {selectedScene.locations.join(', ')}
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="p-4">
                <div className="flex gap-4 h-[calc(100vh-18rem)]">
                  <div className="flex-1">
                    <Tabs defaultValue="content" className="h-full">
                      <TabsList>
                        <TabsTrigger value="content">내용</TabsTrigger>
                        <TabsTrigger value="issues">
                          문제점
                          {selectedScene.issues.length > 0 && (
                            <Badge variant="destructive" className="ml-1">
                              {selectedScene.issues.length}
                            </Badge>
                          )}
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="content" className="h-[calc(100%-3rem)]">
                        {isEditing ? (
                          <div className="h-full flex flex-col gap-2">
                            <Textarea
                              value={editingContent}
                              onChange={(e) => setEditingContent(e.target.value)}
                              className="flex-1 resize-none font-mono text-sm"
                              placeholder="씬 내용을 입력하세요..."
                            />
                            <div className="flex items-center gap-2">
                              <Input
                                placeholder="변경 사항 메모 (선택)"
                                value={rewriteNote}
                                onChange={(e) => setRewriteNote(e.target.value)}
                                className="flex-1"
                              />
                              <Button onClick={handleSave}>
                                저장
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setEditingContent(selectedScene.content);
                                  setIsEditing(false);
                                }}
                              >
                                취소
                              </Button>
                            </div>

                            {splitPosition !== null && (
                              <div className="p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
                                <p className="text-sm mb-2">
                                  분할 위치: {splitPosition}자 위치
                                </p>
                                <div className="flex gap-2">
                                  <Input
                                    type="number"
                                    value={splitPosition}
                                    onChange={(e) => setSplitPosition(Number(e.target.value))}
                                    min={0}
                                    max={editingContent.length}
                                    className="w-32"
                                  />
                                  <Button size="sm" onClick={handleSplit}>
                                    <Scissors className="w-4 h-4 mr-1" />
                                    분할
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setSplitPosition(null)}
                                  >
                                    취소
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <ScrollArea className="h-full">
                            <div className="prose dark:prose-invert max-w-none p-4 whitespace-pre-wrap">
                              {selectedScene.content}
                            </div>
                          </ScrollArea>
                        )}
                      </TabsContent>

                      <TabsContent value="issues" className="h-[calc(100%-3rem)]">
                        <ScrollArea className="h-full">
                          <div className="space-y-3 p-2">
                            {selectedScene.issues.length === 0 ? (
                              <div className="text-center py-8 text-gray-500">
                                <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                                <p>발견된 문제가 없습니다.</p>
                              </div>
                            ) : (
                              selectedScene.issues.map((issue: SceneIssue, index: number) => (
                                <Card
                                  key={index}
                                  className={`border ${getSeverityColor(issue.severity)}`}
                                >
                                  <CardContent className="p-3">
                                    <div className="flex items-start gap-2">
                                      {issue.severity === 'error' ? (
                                        <AlertCircle className="w-4 h-4 mt-0.5 text-red-500" />
                                      ) : issue.severity === 'warning' ? (
                                        <AlertTriangle className="w-4 h-4 mt-0.5 text-yellow-500" />
                                      ) : (
                                        <Info className="w-4 h-4 mt-0.5 text-blue-500" />
                                      )}
                                      <div>
                                        <p className="text-sm font-medium">
                                          {issue.description}
                                        </p>
                                        {issue.suggestion && (
                                          <p className="text-xs text-gray-500 mt-1">
                                            💡 {issue.suggestion}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))
                            )}
                          </div>
                        </ScrollArea>
                      </TabsContent>
                    </Tabs>
                  </div>

                  {showVersionHistory && (
                    <div className="w-[280px] border-l pl-4 overflow-hidden">
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <GitBranch className="w-4 h-4" />
                        버전 히스토리
                      </h4>
                      <ScrollArea className="h-[calc(100%-2rem)]">
                        <div className="space-y-2">
                          {versions.map((version: SceneRewriteVersion, index: number) => (
                            <div
                              key={version.id}
                              className={`
                                p-2 rounded border cursor-pointer transition-all
                                ${selectedVersionId === version.id
                                  ? 'bg-blue-500/10 border-blue-500'
                                  : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                                }
                              `}
                              onClick={() => setSelectedVersionId(version.id)}
                            >
                              <div className="flex items-center justify-between">
                                <Badge
                                  variant={version.type === 'original' ? 'default' : 'secondary'}
                                >
                                  {version.type === 'original' ? '원본' :
                                   version.type === 'rewrite' ? '재집필' :
                                   version.type === 'merged' ? '병합' : 'AI'}
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  v{versions.length - index}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(version.createdAt).toLocaleString('ko-KR')}
                              </p>
                              {version.note && (
                                <p className="text-xs mt-1 truncate">
                                  {version.note}
                                </p>
                              )}
                              <p className="text-xs text-gray-400 mt-1">
                                {version.wordCount.toLocaleString()}자
                              </p>

                              {selectedVersionId === version.id && (
                                <div className="flex gap-1 mt-2">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 text-xs"
                                    onClick={() => {
                                      if (selectedSceneId) {
                                        restoreVersion(selectedSceneId, version.id);
                                      }
                                    }}
                                  >
                                    <RotateCcw className="w-3 h-3 mr-1" />
                                    복원
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 text-xs"
                                    onClick={() => {
                                      navigator.clipboard.writeText(version.content);
                                    }}
                                  >
                                    <Copy className="w-3 h-3 mr-1" />
                                    복사
                                  </Button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full flex items-center justify-center">
              <div className="text-center text-gray-500">
                <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">씬을 선택하세요</p>
                <p className="text-sm mt-1">
                  왼쪽 목록에서 편집할 씬을 선택해주세요
                </p>
              </div>
            </Card>
          )}
        </div>

        <Dialog open={showInsertDialog} onOpenChange={setShowInsertDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>새 씬 삽입</DialogTitle>
              <DialogDescription>
                선택한 씬 다음에 새로운 씬을 추가합니다.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Textarea
                value={newSceneContent}
                onChange={(e) => setNewSceneContent(e.target.value)}
                placeholder="새 씬의 내용을 입력하세요..."
                className="min-h-[300px]"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowInsertDialog(false)}>
                취소
              </Button>
              <Button onClick={handleInsertScene} disabled={!newSceneContent.trim()}>
                <Plus className="w-4 h-4 mr-1" />
                삽입
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
