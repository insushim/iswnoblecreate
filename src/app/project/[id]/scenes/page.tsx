'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
  FileText,
  Upload,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Layers,
  BarChart3,
  Users,
  MapPin,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useProjectStore } from '@/stores/projectStore';
import { useSceneRewriteStore } from '@/stores/sceneRewriteStore';
import SceneRewritePanel from '@/components/writing/SceneRewritePanel';
import { ParsedScene, SceneIssue } from '@/lib/sceneParser';

export default function SceneEditorPage() {
  const params = useParams();
  const projectId = params.id as string;

  const { fetchProject } = useProjectStore();
  const {
    currentDocument,
    loadDocument,
    exportDocument,
    reset,
  } = useSceneRewriteStore();

  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importText, setImportText] = useState('');
  const [documentTitle, setDocumentTitle] = useState('');
  const [activeTab, setActiveTab] = useState<'editor' | 'overview'>('editor');

  useEffect(() => {
    if (projectId) {
      fetchProject(projectId);
    }
  }, [projectId, fetchProject]);

  const handleImport = () => {
    if (importText.trim() && documentTitle.trim()) {
      loadDocument(
        `doc-${Date.now()}`,
        documentTitle,
        importText
      );
      setShowImportDialog(false);
      setImportText('');
      setDocumentTitle('');
    }
  };

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setImportText(text);
      setDocumentTitle(file.name.replace(/\.[^/.]+$/, ''));
    };
    reader.readAsText(file);
  }, []);

  const handleExport = () => {
    const text = exportDocument();
    if (!text) return;

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentDocument?.title || 'document'}_edited.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const scenes = currentDocument?.parseResult?.scenes || [];
  const issues = currentDocument?.parseResult?.issues || [];

  // 통계 계산
  let totalWords = 0;
  let totalChars = 0;
  let okScenes = 0;
  let warningScenes = 0;
  let errorScenes = 0;
  let issueCount = issues.length;
  const allCharacters: string[] = [];
  const allLocations: string[] = [];

  for (const scene of scenes) {
    totalWords += scene.wordCount;
    totalChars += scene.characterCount;
    issueCount += scene.issues.length;

    if (scene.status === 'ok') okScenes++;
    else if (scene.status === 'warning') warningScenes++;
    else if (scene.status === 'error') errorScenes++;

    for (const char of scene.characters) {
      if (!allCharacters.includes(char)) allCharacters.push(char);
    }
    for (const loc of scene.locations) {
      if (!allLocations.includes(loc)) allLocations.push(loc);
    }
  }

  const stats = {
    totalScenes: scenes.length,
    totalWords,
    totalChars,
    uniqueCharacters: allCharacters,
    uniqueLocations: allLocations,
    issueCount,
    okScenes,
    warningScenes,
    errorScenes,
  };

  return (
    <div className="h-full flex flex-col">
      {/* 헤더 */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Layers className="w-6 h-6" />
              씬 편집기
            </h1>
            {currentDocument && (
              <p className="text-sm text-gray-500 mt-1">
                {currentDocument.title}
              </p>
            )}
          </div>
          {currentDocument && (
            <div className="flex gap-2">
              <Badge variant="outline">
                {stats.totalScenes}개 씬
              </Badge>
              <Badge variant="outline">
                {stats.totalWords.toLocaleString()}자
              </Badge>
              {stats.issueCount > 0 && (
                <Badge variant="destructive">
                  {stats.issueCount}개 문제
                </Badge>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'editor' | 'overview')}>
            <TabsList>
              <TabsTrigger value="editor">편집</TabsTrigger>
              <TabsTrigger value="overview">개요</TabsTrigger>
            </TabsList>
          </Tabs>

          <Button
            variant="outline"
            onClick={() => setShowImportDialog(true)}
          >
            <Upload className="w-4 h-4 mr-2" />
            불러오기
          </Button>

          {currentDocument && (
            <>
              <Button variant="outline" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                내보내기
              </Button>
              <Button variant="ghost" onClick={reset}>
                <RefreshCw className="w-4 h-4 mr-2" />
                초기화
              </Button>
            </>
          )}
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="flex-1 overflow-hidden p-4">
        {!currentDocument ? (
          <div className="h-full flex items-center justify-center">
            <Card className="max-w-lg w-full">
              <CardHeader className="text-center">
                <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <CardTitle>소설 텍스트를 불러오세요</CardTitle>
                <CardDescription>
                  텍스트를 붙여넣거나 파일을 업로드하면
                  자동으로 씬 단위로 분석합니다.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => setShowImportDialog(true)}
                >
                  <Upload className="w-5 h-5 mr-2" />
                  텍스트 불러오기
                </Button>

                <div className="text-center text-sm text-gray-500">
                  <p>지원 기능:</p>
                  <ul className="mt-2 space-y-1">
                    <li>✅ 씬 자동 분할 (*** 구분자 인식)</li>
                    <li>✅ 등장인물/장소 자동 추출</li>
                    <li>✅ 연속성 문제 감지</li>
                    <li>✅ 씬별 재집필/병합/분할</li>
                    <li>✅ 버전 히스토리 관리</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : activeTab === 'editor' ? (
          <SceneRewritePanel
            documentId={currentDocument.id}
            documentTitle={currentDocument.title}
            onSave={() => {
              // 저장 완료
            }}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full overflow-auto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  문서 통계
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-500/10 rounded-lg">
                    <p className="text-2xl font-bold">{stats.totalScenes}</p>
                    <p className="text-sm text-gray-500">전체 씬</p>
                  </div>
                  <div className="p-4 bg-green-500/10 rounded-lg">
                    <p className="text-2xl font-bold">{stats.totalWords.toLocaleString()}</p>
                    <p className="text-sm text-gray-500">총 글자수</p>
                  </div>
                  <div className="p-4 bg-purple-500/10 rounded-lg">
                    <p className="text-2xl font-bold">{stats.uniqueCharacters.length}</p>
                    <p className="text-sm text-gray-500">등장인물</p>
                  </div>
                  <div className="p-4 bg-orange-500/10 rounded-lg">
                    <p className="text-2xl font-bold">{stats.uniqueLocations.length}</p>
                    <p className="text-sm text-gray-500">장소</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  씬 상태
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-green-500">정상</span>
                      <span>{stats.okScenes}개</span>
                    </div>
                    <Progress
                      value={stats.totalScenes > 0 ? (stats.okScenes / stats.totalScenes) * 100 : 0}
                      className="h-2"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-yellow-500">경고</span>
                      <span>{stats.warningScenes}개</span>
                    </div>
                    <Progress
                      value={stats.totalScenes > 0 ? (stats.warningScenes / stats.totalScenes) * 100 : 0}
                      className="h-2 [&>div]:bg-yellow-500"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-red-500">오류</span>
                      <span>{stats.errorScenes}개</span>
                    </div>
                    <Progress
                      value={stats.totalScenes > 0 ? (stats.errorScenes / stats.totalScenes) * 100 : 0}
                      className="h-2 [&>div]:bg-red-500"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  등장인물
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {stats.uniqueCharacters.length > 0 ? (
                    stats.uniqueCharacters.map((char, i) => (
                      <Badge key={i} variant="secondary">
                        {char}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">감지된 인물 없음</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  장소
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {stats.uniqueLocations.length > 0 ? (
                    stats.uniqueLocations.map((loc, i) => (
                      <Badge key={i} variant="outline">
                        {loc}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">감지된 장소 없음</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  발견된 문제
                  {stats.issueCount > 0 && (
                    <Badge variant="destructive">{stats.issueCount}</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats.issueCount === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                    <p>발견된 문제가 없습니다!</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-auto">
                    {issues.map((issue: SceneIssue, i: number) => (
                      <div
                        key={`global-${i}`}
                        className={`p-3 rounded-lg border ${
                          issue.severity === 'error'
                            ? 'bg-red-500/10 border-red-500/20'
                            : issue.severity === 'warning'
                            ? 'bg-yellow-500/10 border-yellow-500/20'
                            : 'bg-blue-500/10 border-blue-500/20'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">전역</Badge>
                          <span className="text-sm">{issue.description}</span>
                        </div>
                        {issue.suggestion && (
                          <p className="text-xs text-gray-500 mt-1">
                            💡 {issue.suggestion}
                          </p>
                        )}
                      </div>
                    ))}

                    {scenes.map((scene: ParsedScene, si: number) =>
                      scene.issues.map((issue: SceneIssue, ii: number) => (
                        <div
                          key={`scene-${si}-${ii}`}
                          className={`p-3 rounded-lg border ${
                            issue.severity === 'error'
                              ? 'bg-red-500/10 border-red-500/20'
                              : issue.severity === 'warning'
                              ? 'bg-yellow-500/10 border-yellow-500/20'
                              : 'bg-blue-500/10 border-blue-500/20'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">씬 {scene.number}</Badge>
                            <span className="text-sm">{issue.description}</span>
                          </div>
                          {issue.suggestion && (
                            <p className="text-xs text-gray-500 mt-1">
                              💡 {issue.suggestion}
                            </p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>소설 텍스트 불러오기</DialogTitle>
            <DialogDescription>
              소설 텍스트를 붙여넣거나 파일을 업로드하세요.
              *** 또는 ### 로 구분된 씬을 자동으로 인식합니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Input
                placeholder="문서 제목"
                value={documentTitle}
                onChange={(e) => setDocumentTitle(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" asChild className="flex-1">
                <label className="cursor-pointer">
                  <Upload className="w-4 h-4 mr-2" />
                  파일 업로드 (.txt)
                  <input
                    type="file"
                    accept=".txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </Button>
            </div>

            <Textarea
              placeholder="여기에 소설 텍스트를 붙여넣으세요..."
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              className="min-h-[400px] font-mono text-sm"
            />

            <div className="text-sm text-gray-500">
              <p>💡 팁:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>씬 구분은 ***, ###, --- 등으로 할 수 있습니다</li>
                <li>빈 줄만으로는 씬이 구분되지 않습니다</li>
                <li>불러온 후 수동으로 씬을 분할/병합할 수 있습니다</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImportDialog(false)}>
              취소
            </Button>
            <Button
              onClick={handleImport}
              disabled={!importText.trim() || !documentTitle.trim()}
            >
              불러오기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
