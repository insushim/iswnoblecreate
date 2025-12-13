'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Plus,
  Users,
  Wand2,
  MoreVertical,
  Trash2,
  Edit,
  MessageSquare,
  Network,
  User,
  Star,
  Shield,
  Swords,
  Heart,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { EmptyState, LoadingSpinner } from '@/components/common';
import { CharacterForm } from '@/components/characters/CharacterForm';
import { CharacterProfile } from '@/components/characters/CharacterProfile';
import { CharacterInterview } from '@/components/characters/CharacterInterview';
import { useCharacterStore } from '@/stores/characterStore';
import { Character } from '@/types';

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

const roleColors: Record<Character['role'], string> = {
  protagonist: 'bg-primary/10 text-primary border-primary/30',
  antagonist: 'bg-red-500/10 text-red-500 border-red-500/30',
  deuteragonist: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
  supporting: 'bg-green-500/10 text-green-500 border-green-500/30',
  minor: 'bg-gray-500/10 text-gray-500 border-gray-500/30',
  mentioned: 'bg-gray-500/10 text-gray-400 border-gray-500/30',
};

export default function CharactersPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const { characters, isLoading, fetchCharacters, deleteCharacter } = useCharacterStore();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [viewingCharacter, setViewingCharacter] = useState<Character | null>(null);
  const [interviewCharacter, setInterviewCharacter] = useState<Character | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [characterToDelete, setCharacterToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (projectId) {
      fetchCharacters(projectId);
    }
  }, [projectId, fetchCharacters]);

  const handleDelete = async () => {
    if (characterToDelete) {
      await deleteCharacter(characterToDelete);
      setDeleteDialogOpen(false);
      setCharacterToDelete(null);
    }
  };

  const groupedCharacters = characters.reduce((acc, char) => {
    if (!acc[char.role]) {
      acc[char.role] = [];
    }
    acc[char.role].push(char);
    return acc;
  }, {} as Record<Character['role'], Character[]>);

  const roleOrder: Character['role'][] = ['protagonist', 'antagonist', 'deuteragonist', 'supporting', 'minor', 'mentioned'];

  if (isLoading && characters.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
        <LoadingSpinner size="lg" text="캐릭터를 불러오는 중..." />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">캐릭터</h1>
          <p className="text-muted-foreground">소설에 등장하는 캐릭터를 관리하세요</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push(`/project/${projectId}/characters/relationships`)}>
            <Network className="h-4 w-4 mr-2" />
            관계도
          </Button>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                캐릭터 추가
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>새 캐릭터 만들기</DialogTitle>
                <DialogDescription>
                  캐릭터의 기본 정보를 입력하면 AI가 상세 설정을 도와드립니다
                </DialogDescription>
              </DialogHeader>
              <CharacterForm
                projectId={projectId}
                onSuccess={() => setCreateDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {characters.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={Users}
              title="아직 캐릭터가 없습니다"
              description="소설의 첫 번째 캐릭터를 만들어보세요. AI가 캐릭터 설정을 도와드립니다."
              action={{
                label: '캐릭터 만들기',
                onClick: () => setCreateDialogOpen(true),
              }}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {roleOrder.map((role) => {
            const chars = groupedCharacters[role];
            if (!chars || chars.length === 0) return null;

            const RoleIcon = roleIcons[role];

            return (
              <div key={role} className="space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <RoleIcon className="h-5 w-5" />
                  {roleLabels[role]}
                  <Badge variant="secondary" className="ml-2">{chars.length}</Badge>
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {chars.map((character, index) => (
                    <motion.div
                      key={character.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="group hover:shadow-lg transition-all">
                        <CardHeader className="pb-3">
                          <div className="flex items-start gap-3">
                            <Avatar
                              className="h-12 w-12 border-2"
                              style={{ borderColor: character.color || 'hsl(var(--border))' }}
                            >
                              <AvatarFallback
                                style={{ backgroundColor: character.color ? `${character.color}20` : undefined }}
                              >
                                {character.name.slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <CardTitle className="line-clamp-1">{character.name}</CardTitle>
                              <CardDescription className="line-clamp-1">
                                {character.occupation || character.age ? `${character.age}세` : ''}
                                {character.occupation && character.age ? ' · ' : ''}
                                {character.occupation || ''}
                              </CardDescription>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setViewingCharacter(character)}>
                                  <User className="h-4 w-4 mr-2" />
                                  상세 보기
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setEditingCharacter(character)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  수정
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setInterviewCharacter(character)}>
                                  <MessageSquare className="h-4 w-4 mr-2" />
                                  인터뷰
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => {
                                    setCharacterToDelete(character.id);
                                    setDeleteDialogOpen(true);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  삭제
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {character.personality || character.background || '설정을 추가해주세요'}
                            </p>

                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline" className={roleColors[character.role]}>
                                {roleLabels[character.role]}
                              </Badge>
                              {character.mbti && (
                                <Badge variant="secondary">{character.mbti}</Badge>
                              )}
                            </div>

                            {character.relationships.length > 0 && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Heart className="h-3 w-3" />
                                {character.relationships.length}개의 관계
                              </div>
                            )}

                            <div className="flex gap-2 pt-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={() => setViewingCharacter(character)}
                              >
                                상세 보기
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setInterviewCharacter(character)}
                              >
                                <MessageSquare className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 캐릭터 상세 보기 다이얼로그 */}
      <Dialog open={!!viewingCharacter} onOpenChange={() => setViewingCharacter(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {viewingCharacter && (
            <CharacterProfile
              character={viewingCharacter}
              onEdit={() => {
                setEditingCharacter(viewingCharacter);
                setViewingCharacter(null);
              }}
              onInterview={() => {
                setInterviewCharacter(viewingCharacter);
                setViewingCharacter(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* 캐릭터 수정 다이얼로그 */}
      <Dialog open={!!editingCharacter} onOpenChange={() => setEditingCharacter(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>캐릭터 수정</DialogTitle>
          </DialogHeader>
          {editingCharacter && (
            <CharacterForm
              projectId={projectId}
              character={editingCharacter}
              onSuccess={() => setEditingCharacter(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* 캐릭터 인터뷰 다이얼로그 */}
      <Dialog open={!!interviewCharacter} onOpenChange={() => setInterviewCharacter(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {interviewCharacter && (
            <CharacterInterview
              character={interviewCharacter}
              onClose={() => setInterviewCharacter(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>캐릭터를 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              이 작업은 되돌릴 수 없습니다. 캐릭터와 관련된 모든 데이터가 삭제됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
