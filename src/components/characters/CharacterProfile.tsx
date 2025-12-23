'use client';

import { Edit, MessageSquare, Star, Swords, Shield, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Character } from '@/types';

interface CharacterProfileProps {
  character: Character;
  onEdit: () => void;
  onInterview: () => void;
}

const roleIcons: Record<Character['role'], React.ElementType> = {
  protagonist: Star,
  antagonist: Swords,
  deuteragonist: Shield,
  supporting: User,
  minor: User,
  mentioned: User,
};

const roleLabels: Record<Character['role'], string> = {
  protagonist: '주인공',
  antagonist: '악역',
  deuteragonist: '조연 주인공',
  supporting: '조연',
  minor: '단역',
  mentioned: '언급만',
};

const arcTypeLabels: Record<string, string> = {
  positive: '긍정적 성장',
  negative: '부정적 변화',
  flat: '변화 없음',
  corruption: '타락',
  disillusionment: '환멸',
};

export function CharacterProfile({ character, onEdit, onInterview }: CharacterProfileProps) {
  const RoleIcon = roleIcons[character.role];

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-start gap-4">
        <Avatar
          className="h-20 w-20 border-4"
          style={{ borderColor: character.color || 'hsl(var(--border))' }}
        >
          <AvatarFallback
            className="text-2xl"
            style={{ backgroundColor: character.color ? `${character.color}20` : undefined }}
          >
            {character.name.slice(0, 2)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h2 className="text-2xl font-bold">{character.name}</h2>
          {character.fullName && character.fullName !== character.name && (
            <p className="text-muted-foreground">{character.fullName}</p>
          )}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <Badge variant="outline" className="gap-1">
              <RoleIcon className="h-3 w-3" />
              {roleLabels[character.role]}
            </Badge>
            {character.mbti && <Badge variant="secondary">{character.mbti}</Badge>}
            {character.age && <Badge variant="outline">{character.age}세</Badge>}
            {character.gender && <Badge variant="outline">{character.gender}</Badge>}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onInterview}>
            <MessageSquare className="h-4 w-4 mr-1" />
            인터뷰
          </Button>
          <Button size="sm" onClick={onEdit}>
            <Edit className="h-4 w-4 mr-1" />
            수정
          </Button>
        </div>
      </div>

      {/* 별명 */}
      {character.nickname && character.nickname.length > 0 && (
        <div>
          <p className="text-sm text-muted-foreground mb-1">별명</p>
          <div className="flex flex-wrap gap-2">
            {character.nickname.map((n) => (
              <Badge key={n} variant="secondary">{n}</Badge>
            ))}
          </div>
        </div>
      )}

      <Separator />

      {/* 기본 정보 */}
      <div className="grid md:grid-cols-2 gap-6">
        {character.occupation && (
          <div>
            <p className="text-sm text-muted-foreground mb-1">직업</p>
            <p>{character.occupation}</p>
          </div>
        )}
      </div>

      {/* 외모 */}
      {character.appearance && (
        <div>
          <h3 className="font-semibold mb-2">외모</h3>
          <p className="text-muted-foreground">{character.appearance}</p>
        </div>
      )}

      {/* 성격 */}
      {character.personality && (
        <div>
          <h3 className="font-semibold mb-2">성격</h3>
          <p className="text-muted-foreground">{character.personality}</p>
        </div>
      )}

      {/* 강점 & 약점 */}
      {(character.strengths.length > 0 || character.weaknesses.length > 0) && (
        <div className="grid md:grid-cols-2 gap-4">
          {character.strengths.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">강점</h3>
              <div className="flex flex-wrap gap-2">
                {character.strengths.map((s) => (
                  <Badge key={s} variant="outline" className="bg-green-500/10 text-green-500">
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {character.weaknesses.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">약점</h3>
              <div className="flex flex-wrap gap-2">
                {character.weaknesses.map((w) => (
                  <Badge key={w} variant="outline" className="bg-red-500/10 text-red-500">
                    {w}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <Separator />

      {/* 배경 스토리 */}
      {character.background && (
        <div>
          <h3 className="font-semibold mb-2">배경 스토리</h3>
          <p className="text-muted-foreground whitespace-pre-wrap">{character.background}</p>
        </div>
      )}

      {/* 동기 & 목표 */}
      <div className="grid md:grid-cols-2 gap-4">
        {character.motivation && (
          <div>
            <h3 className="font-semibold mb-2">동기</h3>
            <p className="text-muted-foreground">{character.motivation}</p>
          </div>
        )}
        {character.goal && (
          <div>
            <h3 className="font-semibold mb-2">목표</h3>
            <p className="text-muted-foreground">{character.goal}</p>
          </div>
        )}
      </div>

      {/* 두려움 & 비밀 */}
      <div className="grid md:grid-cols-2 gap-4">
        {character.fear && (
          <div>
            <h3 className="font-semibold mb-2">두려움</h3>
            <p className="text-muted-foreground">{character.fear}</p>
          </div>
        )}
        {character.secret && (
          <div>
            <h3 className="font-semibold mb-2">비밀</h3>
            <p className="text-muted-foreground">{character.secret}</p>
          </div>
        )}
      </div>

      <Separator />

      {/* 말투 */}
      <div>
        <h3 className="font-semibold mb-2">말투 특성</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">경어 수준</p>
            <p>{character.speechPattern.formalityLevel}/5</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">말 속도</p>
            <p>
              {character.speechPattern.speechSpeed === 'slow' && '느림'}
              {character.speechPattern.speechSpeed === 'normal' && '보통'}
              {character.speechPattern.speechSpeed === 'fast' && '빠름'}
            </p>
          </div>
          {character.speechPattern.tone && (
            <div>
              <p className="text-sm text-muted-foreground">말투 특징</p>
              <p>{character.speechPattern.tone}</p>
            </div>
          )}
        </div>
        {character.speechPattern.catchphrase && character.speechPattern.catchphrase.length > 0 && (
          <div className="mt-2">
            <p className="text-sm text-muted-foreground mb-1">입버릇</p>
            <div className="flex flex-wrap gap-2">
              {character.speechPattern.catchphrase.map((c) => (
                <Badge key={c} variant="outline">&quot;{c}&quot;</Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      <Separator />

      {/* 캐릭터 아크 */}
      <div>
        <h3 className="font-semibold mb-2">캐릭터 아크</h3>
        <Badge variant="secondary" className="mb-3">{arcTypeLabels[character.arc.type]}</Badge>
        <div className="grid md:grid-cols-2 gap-4">
          {character.arc.startingState && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">시작 상태</p>
              <p>{character.arc.startingState}</p>
            </div>
          )}
          {character.arc.endingState && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">변화 후</p>
              <p>{character.arc.endingState}</p>
            </div>
          )}
        </div>
      </div>

      {/* 관계 */}
      {character.relationships.length > 0 && (
        <>
          <Separator />
          <div>
            <h3 className="font-semibold mb-2">관계</h3>
            <div className="space-y-2">
              {character.relationships.map((rel) => (
                <div key={rel.targetId} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                  <span>{rel.description}</span>
                  <Badge variant="outline">{rel.type}</Badge>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
