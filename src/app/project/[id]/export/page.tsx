'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Download,
  FileText,
  FileJson,
  File,
  Users,
  CheckCircle,
  Settings,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LoadingSpinner } from '@/components/common';
import { useProjectStore } from '@/stores/projectStore';
import { useChapterStore } from '@/stores/chapterStore';
import { useCharacterStore } from '@/stores/characterStore';
import {
  exportToTxt,
  exportToHtml,
  exportToMarkdown,
  exportToPdf,
  exportToEpub,
  exportToJson,
  exportCharacterProfiles,
} from '@/lib/export';

interface ExportFormat {
  id: string;
  name: string;
  extension: string;
  description: string;
  icon: React.ReactNode;
  available: boolean;
}

const exportFormats: ExportFormat[] = [
  {
    id: 'txt',
    name: '텍스트',
    extension: '.txt',
    description: '순수 텍스트 파일로 내보냅니다',
    icon: <FileText className="h-8 w-8" />,
    available: true,
  },
  {
    id: 'md',
    name: '마크다운',
    extension: '.md',
    description: '마크다운 형식으로 내보냅니다',
    icon: <FileText className="h-8 w-8" />,
    available: true,
  },
  {
    id: 'html',
    name: 'HTML',
    extension: '.html',
    description: '웹 페이지 형식으로 내보냅니다',
    icon: <File className="h-8 w-8" />,
    available: true,
  },
  {
    id: 'pdf',
    name: 'PDF',
    extension: '.pdf',
    description: 'PDF 문서로 내보냅니다',
    icon: <File className="h-8 w-8" />,
    available: true,
  },
  {
    id: 'epub',
    name: 'EPUB',
    extension: '.xhtml',
    description: '전자책 형식으로 내보냅니다 (베타)',
    icon: <File className="h-8 w-8" />,
    available: true,
  },
  {
    id: 'json',
    name: 'JSON (백업)',
    extension: '.json',
    description: '모든 데이터를 JSON으로 백업합니다',
    icon: <FileJson className="h-8 w-8" />,
    available: true,
  },
];

export default function ExportPage() {
  const params = useParams();
  const projectId = params.id as string;

  const { currentProject, fetchProject } = useProjectStore();
  const { chapters, fetchChapters } = useChapterStore();
  const { characters, fetchCharacters } = useCharacterStore();

  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<string>('');
  const [selectedChapters, setSelectedChapters] = useState<string[]>([]);
  const [exportSuccess, setExportSuccess] = useState(false);

  // 옵션
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [includeStyles, setIncludeStyles] = useState(true);
  const [fontSize, setFontSize] = useState([12]);
  const [lineHeight, setLineHeight] = useState([1.5]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchProject(projectId),
        fetchChapters(projectId),
        fetchCharacters(projectId),
      ]);
      setIsLoading(false);
    };
    loadData();
  }, [projectId, fetchProject, fetchChapters, fetchCharacters]);

  useEffect(() => {
    if (chapters.length > 0) {
      setSelectedChapters(chapters.map((c) => c.id));
    }
  }, [chapters]);

  const handleExport = async () => {
    if (!currentProject || !selectedFormat) return;

    setIsExporting(true);
    setExportSuccess(false);

    try {
      const chaptersToExport = chapters.filter((c) => selectedChapters.includes(c.id));

      switch (selectedFormat) {
        case 'txt':
          exportToTxt(currentProject, chaptersToExport, { includeMetadata });
          break;
        case 'md':
          exportToMarkdown(currentProject, chaptersToExport, { includeMetadata });
          break;
        case 'html':
          exportToHtml(currentProject, chaptersToExport, { includeStyles });
          break;
        case 'pdf':
          await exportToPdf(currentProject, chaptersToExport, {
            fontSize: fontSize[0],
            lineHeight: lineHeight[0],
            includeMetadata,
          });
          break;
        case 'epub':
          await exportToEpub(currentProject, chaptersToExport, {
            description: currentProject.logline,
          });
          break;
        case 'json':
          exportToJson(currentProject, chaptersToExport, characters);
          break;
      }

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (error) {
      console.error('내보내기 실패:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCharacters = () => {
    if (!currentProject) return;
    exportCharacterProfiles(currentProject, characters);
  };

  const toggleChapter = (chapterId: string) => {
    setSelectedChapters((prev) =>
      prev.includes(chapterId) ? prev.filter((id) => id !== chapterId) : [...prev, chapterId]
    );
  };

  const selectAllChapters = () => {
    setSelectedChapters(chapters.map((c) => c.id));
  };

  const deselectAllChapters = () => {
    setSelectedChapters([]);
  };

  const totalWordCount = chapters
    .filter((c) => selectedChapters.includes(c.id))
    .reduce((sum, c) => sum + c.wordCount, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
        <LoadingSpinner size="lg" text="내보내기 준비 중..." />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">내보내기</h1>
          <p className="text-muted-foreground">작품을 다양한 형식으로 내보냅니다</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 형식 선택 */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">내보내기 형식</CardTitle>
              <CardDescription>원하는 파일 형식을 선택하세요</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {exportFormats.map((format) => (
                  <motion.button
                    key={format.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`p-4 rounded-lg border text-left transition-colors ${
                      selectedFormat === format.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-muted'
                    } ${!format.available ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() => format.available && setSelectedFormat(format.id)}
                    disabled={!format.available}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-primary">{format.icon}</div>
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {format.name}
                          <Badge variant="secondary" className="text-xs">
                            {format.extension}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{format.description}</p>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 챕터 선택 */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">챕터 선택</CardTitle>
                  <CardDescription>
                    {selectedChapters.length}개 선택 · {totalWordCount.toLocaleString()}자
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={selectAllChapters}>
                    전체 선택
                  </Button>
                  <Button variant="outline" size="sm" onClick={deselectAllChapters}>
                    전체 해제
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {chapters
                  .sort((a, b) => a.number - b.number)
                  .map((chapter) => (
                    <div
                      key={chapter.id}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-muted"
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={selectedChapters.includes(chapter.id)}
                          onCheckedChange={() => toggleChapter(chapter.id)}
                        />
                        <div>
                          <span className="font-medium">
                            제 {chapter.number}장: {chapter.title}
                          </span>
                          <p className="text-xs text-muted-foreground">
                            {chapter.wordCount.toLocaleString()}자 · {chapter.scenes?.length || 0}개 씬
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">
                        {chapter.status === 'outline' && '개요'}
                        {chapter.status === 'draft' && '초고'}
                        {chapter.status === 'revision' && '수정 중'}
                        {chapter.status === 'polished' && '다듬기'}
                        {chapter.status === 'approved' && '완료'}
                      </Badge>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* 옵션 */}
          {selectedFormat && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  내보내기 옵션
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {(selectedFormat === 'txt' || selectedFormat === 'md' || selectedFormat === 'pdf') && (
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>메타데이터 포함</Label>
                      <p className="text-xs text-muted-foreground">제목, 장르, 시놉시스 포함</p>
                    </div>
                    <Switch checked={includeMetadata} onCheckedChange={setIncludeMetadata} />
                  </div>
                )}

                {selectedFormat === 'html' && (
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>스타일 포함</Label>
                      <p className="text-xs text-muted-foreground">CSS 스타일 포함</p>
                    </div>
                    <Switch checked={includeStyles} onCheckedChange={setIncludeStyles} />
                  </div>
                )}

                {selectedFormat === 'pdf' && (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>글자 크기</Label>
                        <span className="text-sm text-muted-foreground">{fontSize[0]}pt</span>
                      </div>
                      <Slider value={fontSize} onValueChange={setFontSize} min={8} max={18} step={1} />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>줄 간격</Label>
                        <span className="text-sm text-muted-foreground">{lineHeight[0].toFixed(1)}</span>
                      </div>
                      <Slider value={lineHeight} onValueChange={setLineHeight} min={1} max={2.5} step={0.1} />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* 사이드바 */}
        <div className="space-y-6">
          {/* 내보내기 버튼 */}
          <Card>
            <CardContent className="py-6">
              <Button
                className="w-full gap-2"
                size="lg"
                onClick={handleExport}
                disabled={!selectedFormat || selectedChapters.length === 0 || isExporting}
              >
                {isExporting ? (
                  <>
                    <RefreshCw className="h-5 w-5 animate-spin" />
                    내보내는 중...
                  </>
                ) : exportSuccess ? (
                  <>
                    <CheckCircle className="h-5 w-5" />
                    완료!
                  </>
                ) : (
                  <>
                    <Download className="h-5 w-5" />
                    내보내기
                  </>
                )}
              </Button>

              {!selectedFormat && (
                <p className="text-xs text-muted-foreground text-center mt-2">
                  먼저 내보내기 형식을 선택하세요
                </p>
              )}
            </CardContent>
          </Card>

          {/* 작품 정보 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">작품 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">제목</p>
                <p className="font-medium">{currentProject?.title}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground">장르</p>
                <p className="font-medium">{currentProject?.genre.join(', ')}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground">총 분량</p>
                <p className="font-medium">
                  {chapters.length}개 챕터 · {chapters.reduce((sum, c) => sum + c.wordCount, 0).toLocaleString()}자
                </p>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground">캐릭터</p>
                <p className="font-medium">{characters.length}명</p>
              </div>
            </CardContent>
          </Card>

          {/* 캐릭터 프로필 내보내기 */}
          {characters.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  캐릭터 프로필
                </CardTitle>
                <CardDescription>캐릭터 정보를 별도로 내보냅니다</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full gap-2" onClick={handleExportCharacters}>
                  <Download className="h-4 w-4" />
                  캐릭터 프로필 내보내기
                </Button>
              </CardContent>
            </Card>
          )}

          {/* 도움말 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">형식 가이드</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="font-medium">TXT / MD</p>
                <p className="text-muted-foreground">가장 호환성이 좋은 형식입니다.</p>
              </div>
              <div>
                <p className="font-medium">HTML</p>
                <p className="text-muted-foreground">웹 브라우저에서 미리보기 가능합니다.</p>
              </div>
              <div>
                <p className="font-medium">PDF</p>
                <p className="text-muted-foreground">인쇄 또는 공유에 적합합니다.</p>
              </div>
              <div>
                <p className="font-medium">EPUB</p>
                <p className="text-muted-foreground">전자책 리더기에서 읽을 수 있습니다.</p>
              </div>
              <div>
                <p className="font-medium">JSON</p>
                <p className="text-muted-foreground">모든 데이터를 백업합니다.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
