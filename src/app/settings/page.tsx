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
