'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Plus, Wand2, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useProjectStore } from '@/stores/projectStore';

const defaultTemplates = [
  {
    id: '1',
    title: '현대 로맨스',
    description: '현대를 배경으로 한 로맨스 소설. 두 주인공의 만남부터 해피엔딩까지.',
    genre: ['로맨스', '현대'],
    icon: '💕',
    concept: '현대 도시를 배경으로 한 달달한 로맨스 이야기',
  },
  {
    id: '2',
    title: '이세계 판타지',
    description: '이세계로 전생/전이하는 판타지. 시스템, 레벨업, 성장 요소.',
    genre: ['판타지', '이세계'],
    icon: '⚔️',
    concept: '평범한 주인공이 이세계로 전이하여 특별한 능력을 얻고 성장하는 이야기',
  },
  {
    id: '3',
    title: '미스터리 스릴러',
    description: '사건 발생부터 해결까지의 미스터리 구조. 복선과 반전.',
    genre: ['미스터리', '스릴러'],
    icon: '🔍',
    concept: '연쇄 사건의 진실을 파헤치는 탐정/형사의 추리 이야기',
  },
  {
    id: '4',
    title: '무협 소설',
    description: '강호를 배경으로 한 무협. 무공 체계와 문파 설정.',
    genre: ['무협', '액션'],
    icon: '🥋',
    concept: '강호에서 무공을 익히고 정의를 실현하는 무림 고수의 이야기',
  },
  {
    id: '5',
    title: '학원물',
    description: '학교를 배경으로 한 성장 스토리. 청춘과 우정.',
    genre: ['학원', '성장'],
    icon: '🏫',
    concept: '고등학교/대학교를 배경으로 한 청춘 성장 드라마',
  },
  {
    id: '6',
    title: '회귀물',
    description: '과거로 회귀하여 인생을 다시 사는 이야기.',
    genre: ['회귀', '판타지'],
    icon: '⏪',
    concept: '죽음 직전 과거로 돌아가 인생을 다시 살며 실수를 바로잡는 이야기',
  },
  {
    id: '7',
    title: '빙의물',
    description: '소설/게임 속 캐릭터에게 빙의하는 이야기.',
    genre: ['빙의', '판타지'],
    icon: '👻',
    concept: '읽던 소설 속 악역/조연에게 빙의하여 운명을 바꾸는 이야기',
  },
  {
    id: '8',
    title: '아포칼립스',
    description: '멸망 후 세계에서의 생존기. 좀비, 재난, 포스트아포칼립스.',
    genre: ['아포칼립스', '생존'],
    icon: '🧟',
    concept: '문명이 붕괴한 세계에서 살아남기 위해 고군분투하는 이야기',
  },
  {
    id: '9',
    title: '게임 판타지',
    description: '게임 시스템이 적용된 세계. 스탯, 스킬, 던전.',
    genre: ['게임', '판타지'],
    icon: '🎮',
    concept: '게임 같은 시스템이 존재하는 세계에서 레벨업하며 성장하는 이야기',
  },
  {
    id: '10',
    title: '궁중 로맨스',
    description: '왕궁을 배경으로 한 로맨스. 왕자/공주, 정치적 음모.',
    genre: ['로맨스', '궁중'],
    icon: '👑',
    concept: '왕궁에서 벌어지는 사랑과 권력 다툼의 이야기',
  },
  {
    id: '11',
    title: '현대 판타지',
    description: '현대 세계에 마법/초능력이 존재하는 설정.',
    genre: ['현대', '판타지'],
    icon: '✨',
    concept: '현대 사회에 숨겨진 마법 세계가 존재하는 이야기',
  },
  {
    id: '12',
    title: '헌터물',
    description: '던전과 헌터가 존재하는 현대. 각성, 랭킹 시스템.',
    genre: ['헌터', '액션'],
    icon: '🗡️',
    concept: '던전이 출현한 현대에서 헌터로 각성하여 성장하는 이야기',
  },
  {
    id: '13',
    title: '스포츠',
    description: '스포츠를 소재로 한 열혈 성장물.',
    genre: ['스포츠', '성장'],
    icon: '⚽',
    concept: '스포츠 선수로서 정상을 향해 도전하는 열혈 성장 이야기',
  },
  {
    id: '14',
    title: '요리/음식',
    description: '요리사/음식을 소재로 한 이야기.',
    genre: ['요리', '일상'],
    icon: '🍳',
    concept: '요리로 사람들의 마음을 치유하고 성공을 향해 나아가는 이야기',
  },
  {
    id: '15',
    title: 'SF 우주',
    description: '우주를 배경으로 한 SF. 외계인, 우주선, 행성 탐험.',
    genre: ['SF', '우주'],
    icon: '🚀',
    concept: '광활한 우주를 탐험하며 새로운 문명과 조우하는 이야기',
  },
  {
    id: '16',
    title: '역사물',
    description: '실제 역사를 배경으로 한 이야기. 조선, 삼국시대 등.',
    genre: ['역사', '드라마'],
    icon: '📜',
    concept: '역사 속 인물이 되어 시대를 살아가는 이야기',
  },
  {
    id: '17',
    title: '호러/공포',
    description: '공포와 서스펜스가 가득한 이야기.',
    genre: ['호러', '스릴러'],
    icon: '👹',
    concept: '알 수 없는 공포와 맞서 싸우며 생존하는 이야기',
  },
  {
    id: '18',
    title: '직장/비즈니스',
    description: '회사/사업을 배경으로 한 성공 스토리.',
    genre: ['직장', '성공'],
    icon: '💼',
    concept: '비즈니스 세계에서 정상을 향해 올라가는 성공 스토리',
  },
  {
    id: '19',
    title: '의료/병원',
    description: '의사/병원을 배경으로 한 휴먼 드라마.',
    genre: ['의료', '드라마'],
    icon: '🏥',
    concept: '생과 사의 경계에서 환자를 살리는 의료진의 이야기',
  },
  {
    id: '20',
    title: '아이돌/연예계',
    description: '연예계를 배경으로 한 스타 성장기.',
    genre: ['연예', '성장'],
    icon: '🎤',
    concept: '무명에서 시작해 톱스타로 성장하는 연예인의 이야기',
  },
];

export default function TemplatesPage() {
  const router = useRouter();
  const { createProject } = useProjectStore();
  const [templates] = useState(defaultTemplates);
  const [isCreating, setIsCreating] = useState<string | null>(null);

  const handleUseTemplate = async (template: typeof defaultTemplates[0]) => {
    setIsCreating(template.id);
    try {
      const project = await createProject({
        title: `새 ${template.title} 프로젝트`,
        concept: template.concept,
        genre: template.genre,
        status: 'planning',
      });
      router.push(`/project/${project.id}/planning`);
    } catch (error) {
      console.error('프로젝트 생성 실패:', error);
      alert('프로젝트 생성에 실패했습니다.');
    } finally {
      setIsCreating(null);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">템플릿</h1>
          <p className="text-muted-foreground">장르별 템플릿으로 빠르게 시작하세요</p>
        </div>
        <Button className="gap-2" onClick={() => router.push('/new')}>
          <Plus className="h-4 w-4" />
          새 프로젝트
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {templates.map((template, index) => (
          <motion.div
            key={template.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
          >
            <Card className="cursor-pointer hover:shadow-lg transition-all group h-full">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="text-3xl mb-2">{template.icon}</div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleUseTemplate(template)}
                    disabled={isCreating === template.id}
                  >
                    {isCreating === template.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Wand2 className="h-4 w-4 mr-1" />
                        사용
                      </>
                    )}
                  </Button>
                </div>
                <CardTitle className="text-base">{template.title}</CardTitle>
                <CardDescription className="text-xs line-clamp-2">{template.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex gap-1 flex-wrap">
                  {template.genre.map((g) => (
                    <Badge key={g} variant="secondary" className="text-xs">
                      {g}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card className="bg-muted/50">
        <CardContent className="py-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">템플릿으로 빠르게 시작하기</h3>
              <p className="text-sm text-muted-foreground">
                원하는 템플릿을 선택하면 장르와 컨셉이 자동으로 설정됩니다.
                기획 페이지에서 AI 전체 자동 생성을 클릭하면 세계관, 캐릭터, 플롯까지 모두 자동 생성됩니다.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
