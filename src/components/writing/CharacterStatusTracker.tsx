'use client';

import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, CheckCircle, XCircle, User, MapPin, Skull, Lock, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Character, CharacterStatus, CharacterConsistencyViolation } from '@/types';

interface CharacterStatusTrackerProps {
  projectId: string;
  characters: Character[];
  currentContent: string;
  currentSceneId?: string;
  currentVolumeNumber?: number;
  onViolationDetected?: (violations: CharacterConsistencyViolation[]) => void;
}

interface TrackedCharacter {
  character: Character;
  status: CharacterStatus;
  mentionedInCurrent: boolean;
  lastAction?: string;
}

// 캐릭터 상태별 아이콘
const statusIcons: Record<string, React.ReactNode> = {
  alive: <User className="h-4 w-4 text-green-500" />,
  dead: <Skull className="h-4 w-4 text-red-500" />,
  imprisoned: <Lock className="h-4 w-4 text-orange-500" />,
  injured: <AlertCircle className="h-4 w-4 text-yellow-500" />,
  missing: <AlertTriangle className="h-4 w-4 text-gray-500" />,
  transformed: <User className="h-4 w-4 text-purple-500" />,
};

// 캐릭터 상태별 배지 색상
const statusColors: Record<string, string> = {
  alive: 'bg-green-100 text-green-800',
  dead: 'bg-red-100 text-red-800',
  imprisoned: 'bg-orange-100 text-orange-800',
  injured: 'bg-yellow-100 text-yellow-800',
  missing: 'bg-gray-100 text-gray-800',
  transformed: 'bg-purple-100 text-purple-800',
};

// 상태 한글 변환
const statusLabels: Record<string, string> = {
  alive: '생존',
  dead: '사망',
  imprisoned: '감금',
  injured: '부상',
  missing: '실종',
  transformed: '변화',
};

export function CharacterStatusTracker({
  projectId,
  characters,
  currentContent,
  currentSceneId,
  currentVolumeNumber,
  onViolationDetected,
}: CharacterStatusTrackerProps) {
  const [trackedCharacters, setTrackedCharacters] = useState<TrackedCharacter[]>([]);
  const [violations, setViolations] = useState<CharacterConsistencyViolation[]>([]);
  const [showViolationDialog, setShowViolationDialog] = useState(false);
  const [characterStatuses, setCharacterStatuses] = useState<Map<string, CharacterStatus>>(new Map());

  // 캐릭터 상태 초기화
  useEffect(() => {
    const storedStatuses = localStorage.getItem(`character-statuses-${projectId}`);
    if (storedStatuses) {
      const parsed = JSON.parse(storedStatuses);
      const statusMap = new Map<string, CharacterStatus>();
      parsed.forEach((s: CharacterStatus) => statusMap.set(s.characterId, s));
      setCharacterStatuses(statusMap);
    }
  }, [projectId]);

  // 현재 내용에서 캐릭터 언급 감지 및 일관성 검증
  const detectMentionsAndValidate = useCallback(() => {
    if (!currentContent || characters.length === 0) return;

    const newTracked: TrackedCharacter[] = [];
    const newViolations: CharacterConsistencyViolation[] = [];

    characters.forEach(char => {
      // 캐릭터 이름으로 검색 (이름, 별명 포함)
      const searchTerms = [char.name];
      if (char.nickname) searchTerms.push(...char.nickname);
      if (char.fullName && char.fullName !== char.name) searchTerms.push(char.fullName);

      let mentioned = false;
      let lastAction = '';

      for (const term of searchTerms) {
        if (currentContent.includes(term)) {
          mentioned = true;

          // 마지막 등장 문맥 추출
          const regex = new RegExp(`[^.。]*${term}[^.。]*[.。]`, 'g');
          const matches = currentContent.match(regex);
          if (matches && matches.length > 0) {
            lastAction = matches[matches.length - 1].trim().slice(0, 100);
          }
          break;
        }
      }

      // 저장된 상태 가져오기 또는 기본 상태 생성
      const status = characterStatuses.get(char.id) || {
        characterId: char.id,
        characterName: char.name,
        status: 'alive' as const,
      };

      // 일관성 위반 검사
      if (mentioned) {
        // 사망한 캐릭터가 활동하는지 검사
        if (status.status === 'dead') {
          // 회상/과거 문맥인지 확인
          const flashbackIndicators = ['회상', '그때', '예전에', '과거에', '기억 속', '떠올리며', '였었다', '였던', '했었'];
          const isFlashback = flashbackIndicators.some(indicator => {
            const charIndex = currentContent.indexOf(char.name);
            if (charIndex === -1) return false;
            const contextStart = Math.max(0, charIndex - 100);
            const contextEnd = Math.min(currentContent.length, charIndex + 100);
            const context = currentContent.slice(contextStart, contextEnd);
            return context.includes(indicator);
          });

          // 활동 동사 패턴 검사
          const actionPatterns = [
            new RegExp(`${char.name}(이|가|은|는)\\s*(말했|했다|갔다|왔다|나타났다|공격|위협|웃|울)`, 'g'),
            new RegExp(`"[^"]*"\\s*${char.name}(이|가)`, 'g'),
          ];

          const hasAction = actionPatterns.some(pattern => pattern.test(currentContent));

          if (hasAction && !isFlashback) {
            newViolations.push({
              id: crypto.randomUUID(),
              characterId: char.id,
              characterName: char.name,
              violationType: 'dead_character_appears',
              description: `사망한 캐릭터 "${char.name}"이(가) 현재 시점에서 활동하고 있습니다. 사망 시점: ${status.statusChangedAt || '알 수 없음'}`,
              severity: 'critical',
              location: {
                sceneId: currentSceneId,
                volumeNumber: currentVolumeNumber,
              },
              suggestedFix: `"${char.name}"의 등장을 회상이나 언급으로 변경하거나, 다른 캐릭터로 대체하세요.`,
            });
          }
        }

        // 감금된 캐릭터가 다른 장소에서 활동하는지 검사
        if (status.status === 'imprisoned' && status.currentLocation) {
          // 활동 동사가 있는지 확인
          const actionPatterns = [
            new RegExp(`${char.name}(이|가|은|는)\\s*(갔다|왔다|나타났다|뛰어|걸어|달려)`, 'g'),
          ];

          const hasMovement = actionPatterns.some(pattern => pattern.test(currentContent));

          if (hasMovement) {
            newViolations.push({
              id: crypto.randomUUID(),
              characterId: char.id,
              characterName: char.name,
              violationType: 'wrong_location',
              description: `감금된 캐릭터 "${char.name}"이(가) 이동하고 있습니다. 현재 감금 장소: ${status.currentLocation}`,
              severity: 'critical',
              location: {
                sceneId: currentSceneId,
                volumeNumber: currentVolumeNumber,
              },
              suggestedFix: `"${char.name}"의 이동 장면을 삭제하거나, 탈출/석방 장면을 먼저 추가하세요.`,
            });
          }
        }
      }

      newTracked.push({
        character: char,
        status,
        mentionedInCurrent: mentioned,
        lastAction,
      });
    });

    setTrackedCharacters(newTracked);
    setViolations(newViolations);

    if (newViolations.length > 0) {
      setShowViolationDialog(true);
      onViolationDetected?.(newViolations);
    }
  }, [currentContent, characters, characterStatuses, currentSceneId, currentVolumeNumber, onViolationDetected]);

  // 내용이 변경될 때마다 검증 (디바운스 적용)
  useEffect(() => {
    const timer = setTimeout(() => {
      detectMentionsAndValidate();
    }, 1000);

    return () => clearTimeout(timer);
  }, [detectMentionsAndValidate]);

  // 캐릭터 상태 업데이트
  const updateCharacterStatus = (characterId: string, newStatus: Partial<CharacterStatus>) => {
    setCharacterStatuses(prev => {
      const updated = new Map(prev);
      const current = updated.get(characterId) || {
        characterId,
        characterName: characters.find(c => c.id === characterId)?.name || '',
        status: 'alive' as const,
      };
      updated.set(characterId, { ...current, ...newStatus });

      // localStorage에 저장
      localStorage.setItem(
        `character-statuses-${projectId}`,
        JSON.stringify(Array.from(updated.values()))
      );

      return updated;
    });
  };

  // 현재 씬에서 언급된 캐릭터들
  const mentionedCharacters = trackedCharacters.filter(tc => tc.mentionedInCurrent);

  // 특수 상태 (사망/감금 등) 캐릭터들
  const specialStatusCharacters = trackedCharacters.filter(
    tc => tc.status.status !== 'alive'
  );

  return (
    <>
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <User className="h-4 w-4" />
            캐릭터 상태 추적
            {violations.length > 0 && (
              <Badge variant="destructive" className="ml-auto">
                {violations.length} 위반
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          <ScrollArea className="h-[300px]">
            {/* 위반 사항 */}
            {violations.length > 0 && (
              <div className="mb-4">
                <h4 className="text-xs font-semibold text-red-600 mb-2 flex items-center gap-1">
                  <XCircle className="h-3 w-3" />
                  일관성 위반
                </h4>
                {violations.map(v => (
                  <div
                    key={v.id}
                    className="bg-red-50 border border-red-200 rounded p-2 mb-2 text-xs"
                  >
                    <p className="font-medium text-red-800">{v.characterName}</p>
                    <p className="text-red-600 mt-1">{v.description}</p>
                    {v.suggestedFix && (
                      <p className="text-red-500 mt-1 italic">💡 {v.suggestedFix}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* 특수 상태 캐릭터 */}
            {specialStatusCharacters.length > 0 && (
              <div className="mb-4">
                <h4 className="text-xs font-semibold text-orange-600 mb-2 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  주의 필요 캐릭터
                </h4>
                {specialStatusCharacters.map(tc => (
                  <div
                    key={tc.character.id}
                    className="flex items-center justify-between py-1 px-2 bg-orange-50 rounded mb-1"
                  >
                    <div className="flex items-center gap-2">
                      {statusIcons[tc.status.status]}
                      <span className="text-xs font-medium">{tc.character.name}</span>
                    </div>
                    <Badge className={`text-xs ${statusColors[tc.status.status]}`}>
                      {statusLabels[tc.status.status]}
                    </Badge>
                  </div>
                ))}
              </div>
            )}

            {/* 현재 씬에서 언급된 캐릭터 */}
            <div>
              <h4 className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                현재 씬 등장 캐릭터 ({mentionedCharacters.length})
              </h4>
              {mentionedCharacters.length === 0 ? (
                <p className="text-xs text-gray-400">등장하는 캐릭터가 없습니다</p>
              ) : (
                mentionedCharacters.map(tc => (
                  <div
                    key={tc.character.id}
                    className="flex items-center justify-between py-1 px-2 hover:bg-gray-50 rounded"
                  >
                    <div className="flex items-center gap-2">
                      {statusIcons[tc.status.status]}
                      <span className="text-xs">{tc.character.name}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {tc.character.role === 'protagonist' ? '주인공' :
                       tc.character.role === 'antagonist' ? '적대자' :
                       tc.character.role === 'deuteragonist' ? '조연' : '기타'}
                    </Badge>
                  </div>
                ))
              )}
            </div>

            {/* 상태 변경 버튼 */}
            <div className="mt-4 pt-4 border-t">
              <h4 className="text-xs font-semibold text-gray-600 mb-2">
                캐릭터 상태 관리
              </h4>
              <div className="space-y-1">
                {characters.slice(0, 5).map(char => {
                  const status = characterStatuses.get(char.id)?.status || 'alive';
                  return (
                    <div key={char.id} className="flex items-center justify-between py-1">
                      <span className="text-xs">{char.name}</span>
                      <select
                        className="text-xs border rounded px-1 py-0.5"
                        value={status}
                        onChange={(e) => updateCharacterStatus(char.id, {
                          status: e.target.value as CharacterStatus['status'],
                          statusChangedAt: currentSceneId,
                        })}
                      >
                        <option value="alive">생존</option>
                        <option value="dead">사망</option>
                        <option value="imprisoned">감금</option>
                        <option value="injured">부상</option>
                        <option value="missing">실종</option>
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* 위반 상세 다이얼로그 */}
      <Dialog open={showViolationDialog} onOpenChange={setShowViolationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              캐릭터 일관성 위반 감지
            </DialogTitle>
            <DialogDescription>
              현재 작성 중인 내용에서 캐릭터 일관성 문제가 발견되었습니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {violations.map(v => (
              <div key={v.id} className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="destructive">
                    {v.violationType === 'dead_character_appears' ? '사망 캐릭터 등장' :
                     v.violationType === 'wrong_location' ? '위치 불일치' :
                     v.violationType}
                  </Badge>
                  <span className="font-semibold">{v.characterName}</span>
                </div>
                <p className="text-sm text-red-700 mb-2">{v.description}</p>
                {v.suggestedFix && (
                  <div className="bg-white rounded p-2 mt-2">
                    <p className="text-xs text-gray-600">💡 수정 제안:</p>
                    <p className="text-sm">{v.suggestedFix}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowViolationDialog(false)}>
              나중에 수정
            </Button>
            <Button onClick={() => setShowViolationDialog(false)}>
              확인
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
