'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Key,
  Palette,
  Type,
  Save,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Cpu,
  Sparkles,
  PenTool,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSettingsStore } from '@/stores/settingsStore';
import { useUIStore, ThemeMode } from '@/stores/uiStore';
import { MODEL_OPTIONS } from '@/lib/gemini';
import { GeminiModel } from '@/types';

const fontOptions = [
  { value: 'Pretendard', label: 'Pretendard (기본)' },
  { value: 'Noto Sans KR', label: 'Noto Sans KR' },
  { value: 'Noto Serif KR', label: 'Noto Serif KR (명조)' },
  { value: 'KoPub Batang', label: 'KoPub 바탕체' },
];

const themeOptions: { value: ThemeMode; label: string }[] = [
  { value: 'dark', label: '다크 모드' },
  { value: 'light', label: '라이트 모드' },
  { value: 'sepia', label: '세피아 모드' },
];

export default function SettingsPage() {
  const { settings, updateSettings } = useSettingsStore();
  const { theme, setTheme, editorFontSize, editorLineHeight, editorFontFamily, setEditorFontSize, setEditorLineHeight, setEditorFontFamily } = useUIStore();

  const [apiKey, setApiKey] = useState(settings?.geminiApiKey || '');
  const [showApiKey, setShowApiKey] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const handleSaveApiKey = async () => {
    console.log('[Settings] handleSaveApiKey 호출됨');
    console.log('[Settings] 저장할 API 키 길이:', apiKey?.length || 0);
    console.log('[Settings] API 키 앞 10자:', apiKey?.substring(0, 10) + '...');

    setSaveStatus('saving');
    try {
      await updateSettings({ geminiApiKey: apiKey });
      console.log('[Settings] ✅ API 키 저장 성공');
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('[Settings] ❌ API 키 저장 실패:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  };

  const handleSaveSettings = async () => {
    console.log('[Settings] handleSaveSettings 호출됨');
    console.log('[Settings] 저장할 설정:', { theme, fontSize: editorFontSize, fontFamily: editorFontFamily });

    setSaveStatus('saving');
    try {
      await updateSettings({
        theme: theme,
        fontSize: editorFontSize,
        fontFamily: editorFontFamily,
      });
      console.log('[Settings] ✅ 설정 저장 성공');
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('[Settings] ❌ 설정 저장 실패:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-3xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight">설정</h1>
          <p className="text-muted-foreground mt-1">
            앱 환경을 사용자에 맞게 설정하세요
          </p>
        </div>

        {/* API 키 설정 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              API 설정
            </CardTitle>
            <CardDescription>
              AI 기능을 사용하려면 Google Gemini API 키가 필요합니다
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="api-key">Gemini API 키</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="api-key"
                    type={showApiKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <Button onClick={handleSaveApiKey} disabled={saveStatus === 'saving'}>
                  {saveStatus === 'saved' ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : saveStatus === 'error' ? (
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Google AI Studio
                </a>
                에서 API 키를 발급받을 수 있습니다
              </p>
            </div>
          </CardContent>
        </Card>

        {/* AI 모델 설정 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="h-5 w-5" />
              AI 모델 설정
            </CardTitle>
            <CardDescription>
              기획용과 집필용 모델을 분리하여 비용을 절감하세요
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 비용 절감 팁 */}
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
              <p className="text-sm font-medium text-primary mb-2">💡 비용 절감 팁</p>
              <p className="text-xs text-muted-foreground">
                기획(캐릭터, 세계관, 플롯)은 고품질 모델로, 집필은 무료 모델로 설정하면
                <br />
                <strong>품질은 유지하면서 비용을 90% 이상 절감</strong>할 수 있습니다!
              </p>
            </div>

            {/* 기획용 모델 */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-yellow-500" />
                기획용 모델
              </Label>
              <p className="text-xs text-muted-foreground mb-2">
                캐릭터 설정, 세계관, 플롯 구성 등 창의적인 기획 작업에 사용됩니다
              </p>
              <Select
                value={settings?.planningModel || 'gemini-3-flash-preview'}
                onValueChange={(value: GeminiModel) => updateSettings({ planningModel: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MODEL_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center justify-between w-full gap-4">
                        <span>{option.label}</span>
                        <span className="text-xs text-muted-foreground">{option.price}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 집필용 모델 */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <PenTool className="h-4 w-4 text-blue-500" />
                집필용 모델
              </Label>
              <p className="text-xs text-muted-foreground mb-2">
                실제 소설 본문 작성에 사용됩니다 (기획 내용을 바탕으로 글쓰기)
              </p>
              <Select
                value={settings?.writingModel || 'gemini-2.0-flash'}
                onValueChange={(value: GeminiModel) => updateSettings({ writingModel: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MODEL_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center justify-between w-full gap-4">
                        <span>{option.label}</span>
                        <span className="text-xs text-muted-foreground">{option.price}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 예상 비용 안내 */}
            <div className="border rounded-lg p-4 bg-muted/30">
              <p className="text-sm font-medium mb-2">📊 예상 비용 (소설 1편 기준)</p>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>• 기획 10회 ({settings?.planningModel || 'gemini-3-flash-preview'}):
                  {settings?.planningModel === 'gemini-2.0-flash' ? ' 무료' :
                   settings?.planningModel === 'gemini-3-flash-preview' ? ' ~$0.95' :
                   settings?.planningModel === 'gemini-2.5-flash' ? ' ~$0.20' : ' ~$0.10'}
                </p>
                <p>• 집필 50회 ({settings?.writingModel || 'gemini-2.0-flash'}):
                  {settings?.writingModel === 'gemini-2.0-flash' ? ' 무료' :
                   settings?.writingModel === 'gemini-3-flash-preview' ? ' ~$10.50' :
                   settings?.writingModel === 'gemini-2.5-flash' ? ' ~$2.10' : ' ~$1.05'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 테마 설정 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              테마 설정
            </CardTitle>
            <CardDescription>
              앱의 외관을 변경합니다
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>테마</Label>
              <Select value={theme} onValueChange={(value: ThemeMode) => setTheme(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {themeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* 에디터 설정 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Type className="h-5 w-5" />
              에디터 설정
            </CardTitle>
            <CardDescription>
              글쓰기 환경을 설정합니다
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>글꼴</Label>
              <Select value={editorFontFamily} onValueChange={setEditorFontFamily}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fontOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>글자 크기</Label>
                <span className="text-sm text-muted-foreground">{editorFontSize}px</span>
              </div>
              <Slider
                value={[editorFontSize]}
                onValueChange={(value) => setEditorFontSize(value[0])}
                min={12}
                max={28}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>줄 간격</Label>
                <span className="text-sm text-muted-foreground">{editorLineHeight}</span>
              </div>
              <Slider
                value={[editorLineHeight]}
                onValueChange={(value) => setEditorLineHeight(value[0])}
                min={1.2}
                max={2.5}
                step={0.1}
              />
            </div>

            {/* 미리보기 */}
            <div className="border rounded-lg p-4 bg-muted/30">
              <p className="text-sm text-muted-foreground mb-2">미리보기</p>
              <p
                style={{
                  fontFamily: editorFontFamily,
                  fontSize: `${editorFontSize}px`,
                  lineHeight: editorLineHeight,
                }}
              >
                그녀는 창밖을 바라보았다. 빗방울이 유리창에 부딪히며 흘러내리고 있었다.
                어느새 여름이 끝나고 가을이 찾아온 것이다.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 기타 설정 */}
        <Card>
          <CardHeader>
            <CardTitle>기타 설정</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>자동 저장</Label>
                <p className="text-sm text-muted-foreground">
                  작업 내용을 자동으로 저장합니다
                </p>
              </div>
              <Switch
                checked={settings?.autoSave ?? true}
                onCheckedChange={(checked) => updateSettings({ autoSave: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>알림</Label>
                <p className="text-sm text-muted-foreground">
                  타이머 완료 등의 알림을 받습니다
                </p>
              </div>
              <Switch
                checked={settings?.notifications ?? true}
                onCheckedChange={(checked) => updateSettings({ notifications: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>효과음</Label>
                <p className="text-sm text-muted-foreground">
                  타이핑 효과음 등을 재생합니다
                </p>
              </div>
              <Switch
                checked={settings?.soundEffects ?? false}
                onCheckedChange={(checked) => updateSettings({ soundEffects: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* 저장 버튼 */}
        <div className="flex justify-end">
          <Button onClick={handleSaveSettings} className="gap-2">
            <Save className="h-4 w-4" />
            설정 저장
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
