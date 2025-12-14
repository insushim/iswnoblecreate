'use client';

import { useState } from 'react';
import { Wand2, RefreshCw, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AIThinking } from '@/components/common';
import { useCharacterStore } from '@/stores/characterStore';
import { useProjectStore } from '@/stores/projectStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { generateJSON } from '@/lib/gemini';
import { Character, SpeechPattern, CharacterArc } from '@/types';

interface CharacterFormProps {
  projectId: string;
  character?: Character;
  onSuccess: () => void;
}

const roles: { value: Character['role']; label: string }[] = [
  { value: 'protagonist', label: '주인공' },
  { value: 'antagonist', label: '악역' },
  { value: 'deuteragonist', label: '조연 주인공' },
  { value: 'supporting', label: '조연' },
  { value: 'minor', label: '단역' },
  { value: 'mentioned', label: '언급만' },
];

const arcTypes: { value: CharacterArc['type']; label: string; description: string }[] = [
  { value: 'positive', label: '긍정적 성장', description: '결함에서 성장으로' },
  { value: 'negative', label: '부정적 변화', description: '좋은 상태에서 타락으로' },
  { value: 'flat', label: '변화 없음', description: '신념을 유지하며 주변을 변화시킴' },
  { value: 'corruption', label: '타락', description: '점진적 부패' },
  { value: 'disillusionment', label: '환멸', description: '믿음의 붕괴' },
];

const mbtiTypes = [
  'INTJ', 'INTP', 'ENTJ', 'ENTP',
  'INFJ', 'INFP', 'ENFJ', 'ENFP',
  'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
  'ISTP', 'ISFP', 'ESTP', 'ESFP',
];

const colors = [
  '#EF4444', '#F97316', '#F59E0B', '#84CC16',
  '#22C55E', '#06B6D4', '#3B82F6', '#6366F1',
  '#8B5CF6', '#A855F7', '#EC4899', '#F43F5E',
];

export function CharacterForm({ projectId, character, onSuccess }: CharacterFormProps) {
  const { createCharacter, updateCharacter } = useCharacterStore();
  const { currentProject } = useProjectStore();
  const { settings } = useSettingsStore();

  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 기본 정보
  const [name, setName] = useState(character?.name || '');
  const [fullName, setFullName] = useState(character?.fullName || '');
  const [nickname, setNickname] = useState<string[]>(character?.nickname || []);
  const [newNickname, setNewNickname] = useState('');
  const [role, setRole] = useState<Character['role']>(character?.role || 'supporting');
  const [age, setAge] = useState<string>(String(character?.age || ''));
  const [gender, setGender] = useState(character?.gender || '');
  const [occupation, setOccupation] = useState(character?.occupation || '');
  const [color, setColor] = useState(character?.color || colors[0]);

  // 외모 & 성격
  const [appearance, setAppearance] = useState(character?.appearance || '');
  const [personality, setPersonality] = useState(character?.personality || '');
  const [mbti, setMbti] = useState(character?.mbti || '');

  // 배경
  const [background, setBackground] = useState(character?.background || '');
  const [motivation, setMotivation] = useState(character?.motivation || '');
  const [goal, setGoal] = useState(character?.goal || '');
  const [fear, setFear] = useState(character?.fear || '');
  const [secret, setSecret] = useState(character?.secret || '');

  // 강점 & 약점
  const [strengths, setStrengths] = useState<string[]>(character?.strengths || []);
  const [weaknesses, setWeaknesses] = useState<string[]>(character?.weaknesses || []);
  const [newStrength, setNewStrength] = useState('');
  const [newWeakness, setNewWeakness] = useState('');

  // 말투
  const [formalityLevel, setFormalityLevel] = useState(character?.speechPattern.formalityLevel || 3);
  const [speechSpeed, setSpeechSpeed] = useState<SpeechPattern['speechSpeed']>(character?.speechPattern.speechSpeed || 'normal');
  const [tone, setTone] = useState(character?.speechPattern.tone || '');
  const [catchphrase, setCatchphrase] = useState<string[]>(character?.speechPattern.catchphrase || []);
  const [newCatchphrase, setNewCatchphrase] = useState('');

  // 캐릭터 아크
  const [arcType, setArcType] = useState<CharacterArc['type']>(character?.arc.type || 'positive');
  const [startingState, setStartingState] = useState(character?.arc.startingState || '');
  const [endingState, setEndingState] = useState(character?.arc.endingState || '');

  const handleAddItem = (
    item: string,
    list: string[],
    setList: (list: string[]) => void,
    setItem: (item: string) => void
  ) => {
    if (item.trim() && !list.includes(item.trim())) {
      setList([...list, item.trim()]);
      setItem('');
    }
  };

  const handleRemoveItem = (item: string, list: string[], setList: (list: string[]) => void) => {
    setList(list.filter(i => i !== item));
  };

  const handleGenerateWithAI = async () => {
    console.log('[CharacterForm] handleGenerateWithAI 호출됨');
    console.log('[CharacterForm] API 키 존재:', !!settings?.geminiApiKey);
    console.log('[CharacterForm] 캐릭터 이름:', name);

    if (!settings?.geminiApiKey || !name) {
      console.error('[CharacterForm] ❌ API 키 또는 이름 없음');
      return;
    }

    setIsGenerating(true);

    try {
      const prompt = `당신은 소설 캐릭터 설계 전문가입니다.
다음 정보를 바탕으로 입체적인 캐릭터 설정을 만들어주세요.

## 소설 정보
- 제목: ${currentProject?.title || '미정'}
- 장르: ${currentProject?.genre.join(', ') || '미정'}
- 시놉시스: ${currentProject?.synopsis || '없음'}

## 캐릭터 기본 정보
- 이름: ${name}
- 역할: ${roles.find(r => r.value === role)?.label}
- 나이: ${age || '미정'}
- 성별: ${gender || '미정'}
- 직업: ${occupation || '미정'}

## 요청
다음 JSON 형식으로 캐릭터 설정을 생성해주세요:
{
  "appearance": "외모 상세 묘사 (2-3문장)",
  "personality": "성격 설명 (2-3문장)",
  "mbti": "MBTI 4글자",
  "background": "배경 스토리 (3-4문장)",
  "motivation": "주요 동기",
  "goal": "목표",
  "fear": "가장 큰 두려움",
  "secret": "숨기고 있는 비밀",
  "strengths": ["강점1", "강점2", "강점3"],
  "weaknesses": ["약점1", "약점2", "약점3"],
  "speechTone": "말투 특징 설명",
  "catchphrases": ["입버릇1", "입버릇2"],
  "startingState": "스토리 시작 시 캐릭터 상태",
  "endingState": "성장 후 캐릭터 상태"
}

캐릭터가 생동감 있고 입체적이 되도록 작성해주세요.`;

      const result = await generateJSON<{
        appearance: string;
        personality: string;
        mbti: string;
        background: string;
        motivation: string;
        goal: string;
        fear: string;
        secret: string;
        strengths: string[];
        weaknesses: string[];
        speechTone: string;
        catchphrases: string[];
        startingState: string;
        endingState: string;
      }>(settings.geminiApiKey, prompt, { temperature: 0.8 });

      setAppearance(result.appearance);
      setPersonality(result.personality);
      setMbti(result.mbti);
      setBackground(result.background);
      setMotivation(result.motivation);
      setGoal(result.goal);
      setFear(result.fear);
      setSecret(result.secret);
      setStrengths(result.strengths);
      setWeaknesses(result.weaknesses);
      setTone(result.speechTone);
      setCatchphrase(result.catchphrases);
      setStartingState(result.startingState);
      setEndingState(result.endingState);
      console.log('[CharacterForm] ✅ AI 생성 완료');
    } catch (error: unknown) {
      console.error('[CharacterForm] ❌ AI 생성 실패:');
      console.error('[CharacterForm] 오류 객체:', error);
      if (error instanceof Error) {
        console.error('[CharacterForm] 오류 메시지:', error.message);
        console.error('[CharacterForm] 오류 스택:', error.stack);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!name) return;

    setIsSaving(true);

    const characterData: Partial<Character> = {
      name,
      fullName,
      nickname,
      role,
      age,
      gender,
      occupation,
      appearance,
      personality,
      mbti,
      background,
      motivation,
      goal,
      fear,
      secret,
      strengths,
      weaknesses,
      color,
      speechPattern: {
        formalityLevel,
        speechSpeed,
        vocabularyLevel: 'average',
        tone,
        catchphrase,
      },
      arc: {
        type: arcType,
        startingState,
        endingState,
        keyMoments: character?.arc.keyMoments || [],
      },
    };

    try {
      if (character) {
        await updateCharacter(character.id, characterData);
      } else {
        await createCharacter(projectId, characterData);
      }
      onSuccess();
    } catch (error) {
      console.error('저장 실패:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {isGenerating && <AIThinking message="캐릭터 설정을 생성하고 있습니다..." />}

      <Tabs defaultValue="basic" className="space-y-4">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="basic">기본</TabsTrigger>
          <TabsTrigger value="personality">성격</TabsTrigger>
          <TabsTrigger value="background">배경</TabsTrigger>
          <TabsTrigger value="speech">말투</TabsTrigger>
          <TabsTrigger value="arc">아크</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">이름 *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="캐릭터 이름"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fullName">전체 이름</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="성 + 이름"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>별명</Label>
            <div className="flex gap-2">
              <Input
                value={newNickname}
                onChange={(e) => setNewNickname(e.target.value)}
                placeholder="별명 추가"
                onKeyDown={(e) => e.key === 'Enter' && handleAddItem(newNickname, nickname, setNickname, setNewNickname)}
              />
              <Button variant="outline" onClick={() => handleAddItem(newNickname, nickname, setNickname, setNewNickname)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {nickname.map((n) => (
                <Badge key={n} variant="secondary" className="cursor-pointer" onClick={() => handleRemoveItem(n, nickname, setNickname)}>
                  {n} <X className="h-3 w-3 ml-1" />
                </Badge>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>역할</Label>
              <Select value={role} onValueChange={(v) => setRole(v as Character['role'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="age">나이</Label>
              <Input
                id="age"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="예: 25, 20대 후반"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">성별</Label>
              <Input
                id="gender"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                placeholder="예: 남성, 여성"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="occupation">직업</Label>
            <Input
              id="occupation"
              value={occupation}
              onChange={(e) => setOccupation(e.target.value)}
              placeholder="캐릭터의 직업 또는 역할"
            />
          </div>

          <div className="space-y-2">
            <Label>식별 색상</Label>
            <div className="flex flex-wrap gap-2">
              {colors.map((c) => (
                <button
                  key={c}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    color === c ? 'border-foreground scale-110' : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="personality" className="space-y-4">
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={handleGenerateWithAI}
              disabled={isGenerating || !name}
              className="gap-2"
            >
              {isGenerating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              AI로 생성
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="appearance">외모</Label>
            <Textarea
              id="appearance"
              value={appearance}
              onChange={(e) => setAppearance(e.target.value)}
              placeholder="캐릭터의 외모를 묘사하세요"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="personality">성격</Label>
            <Textarea
              id="personality"
              value={personality}
              onChange={(e) => setPersonality(e.target.value)}
              placeholder="캐릭터의 성격을 설명하세요"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>MBTI</Label>
            <Select value={mbti} onValueChange={setMbti}>
              <SelectTrigger><SelectValue placeholder="선택..." /></SelectTrigger>
              <SelectContent>
                {mbtiTypes.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>강점</Label>
              <div className="flex gap-2">
                <Input
                  value={newStrength}
                  onChange={(e) => setNewStrength(e.target.value)}
                  placeholder="강점 추가"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddItem(newStrength, strengths, setStrengths, setNewStrength)}
                />
                <Button variant="outline" onClick={() => handleAddItem(newStrength, strengths, setStrengths, setNewStrength)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {strengths.map((s) => (
                  <Badge key={s} variant="secondary" className="cursor-pointer bg-green-500/10 text-green-500" onClick={() => handleRemoveItem(s, strengths, setStrengths)}>
                    {s} <X className="h-3 w-3 ml-1" />
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>약점</Label>
              <div className="flex gap-2">
                <Input
                  value={newWeakness}
                  onChange={(e) => setNewWeakness(e.target.value)}
                  placeholder="약점 추가"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddItem(newWeakness, weaknesses, setWeaknesses, setNewWeakness)}
                />
                <Button variant="outline" onClick={() => handleAddItem(newWeakness, weaknesses, setWeaknesses, setNewWeakness)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {weaknesses.map((w) => (
                  <Badge key={w} variant="secondary" className="cursor-pointer bg-red-500/10 text-red-500" onClick={() => handleRemoveItem(w, weaknesses, setWeaknesses)}>
                    {w} <X className="h-3 w-3 ml-1" />
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="background" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="background">배경 스토리</Label>
            <Textarea
              id="background"
              value={background}
              onChange={(e) => setBackground(e.target.value)}
              placeholder="캐릭터의 과거와 배경을 설명하세요"
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="motivation">동기</Label>
            <Textarea
              id="motivation"
              value={motivation}
              onChange={(e) => setMotivation(e.target.value)}
              placeholder="캐릭터를 움직이는 주요 동기"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="goal">목표</Label>
            <Textarea
              id="goal"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="캐릭터가 달성하고자 하는 목표"
              rows={2}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fear">두려움</Label>
              <Textarea
                id="fear"
                value={fear}
                onChange={(e) => setFear(e.target.value)}
                placeholder="가장 큰 두려움"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="secret">비밀</Label>
              <Textarea
                id="secret"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                placeholder="숨기고 있는 비밀"
                rows={2}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="speech" className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>경어 수준</Label>
              <span className="text-sm text-muted-foreground">{formalityLevel}/5</span>
            </div>
            <Slider
              value={[formalityLevel]}
              onValueChange={(v) => setFormalityLevel(v[0])}
              min={1}
              max={5}
              step={1}
            />
            <p className="text-xs text-muted-foreground">1: 반말 / 5: 격식체</p>
          </div>

          <div className="space-y-2">
            <Label>말하는 속도</Label>
            <Select value={speechSpeed} onValueChange={(v) => setSpeechSpeed(v as SpeechPattern['speechSpeed'])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="slow">느림</SelectItem>
                <SelectItem value="normal">보통</SelectItem>
                <SelectItem value="fast">빠름</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tone">말투 특징</Label>
            <Textarea
              id="tone"
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              placeholder="예: 차분하고 조용한, 활발하고 수다스러운"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>입버릇 / 말버릇</Label>
            <div className="flex gap-2">
              <Input
                value={newCatchphrase}
                onChange={(e) => setNewCatchphrase(e.target.value)}
                placeholder="예: '그러니까 말이야...'"
                onKeyDown={(e) => e.key === 'Enter' && handleAddItem(newCatchphrase, catchphrase, setCatchphrase, setNewCatchphrase)}
              />
              <Button variant="outline" onClick={() => handleAddItem(newCatchphrase, catchphrase, setCatchphrase, setNewCatchphrase)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {catchphrase.map((c) => (
                <Badge key={c} variant="secondary" className="cursor-pointer" onClick={() => handleRemoveItem(c, catchphrase, setCatchphrase)}>
                  "{c}" <X className="h-3 w-3 ml-1" />
                </Badge>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="arc" className="space-y-4">
          <div className="space-y-2">
            <Label>캐릭터 아크 유형</Label>
            <div className="grid md:grid-cols-2 gap-2">
              {arcTypes.map((arc) => (
                <div
                  key={arc.value}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    arcType === arc.value ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                  }`}
                  onClick={() => setArcType(arc.value)}
                >
                  <div className="font-medium">{arc.label}</div>
                  <div className="text-xs text-muted-foreground">{arc.description}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="startingState">시작 상태</Label>
            <Textarea
              id="startingState"
              value={startingState}
              onChange={(e) => setStartingState(e.target.value)}
              placeholder="스토리 시작 시 캐릭터의 상태"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="endingState">변화 후 상태</Label>
            <Textarea
              id="endingState"
              value={endingState}
              onChange={(e) => setEndingState(e.target.value)}
              placeholder="스토리 종료 시 캐릭터의 상태"
              rows={2}
            />
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onSuccess}>취소</Button>
        <Button onClick={handleSave} disabled={!name || isSaving}>
          {isSaving ? '저장 중...' : character ? '수정' : '생성'}
        </Button>
      </div>
    </div>
  );
}
