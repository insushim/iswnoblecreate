'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Plus, Wand2, BookOpen, Users, Globe, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const defaultTemplates = [
  {
    id: '1',
    title: '현대 로맨스',
    description: '현대를 배경으로 한 로맨스 소설 템플릿. 두 주인공의 만남부터 해피엔딩까지의 구조를 제공합니다.',
    genre: ['로맨스', '현대'],
    icon: '💕',
  },
  {
    id: '2',
    title: '이세계 판타지',
    description: '이세계로 전생/전이하는 판타지 소설 템플릿. 시스템, 레벨업, 귀환 요소 포함.',
    genre: ['판타지', '이세계'],
    icon: '⚔️',
  },
  {
    id: '3',
    title: '미스터리 스릴러',
    description: '사건 발생부터 해결까지의 미스터리 구조. 복선과 반전 설계 포함.',
    genre: ['미스터리', '스릴러'],
    icon: '🔍',
  },
  {
    id: '4',
    title: '무협 소설',
    description: '강호를 배경으로 한 무협 소설 템플릿. 무공 체계와 문파 설정 포함.',
    genre: ['무협', '액션'],
    icon: '🥋',
  },
  {
    id: '5',
    title: '학원물',
    description: '학교를 배경으로 한 성장 스토리. 학교 생활과 청춘 로맨스 요소.',
    genre: ['학원', '성장'],
    icon: '🏫',
  },
  {
    id: '6',
    title: '회귀/빙의물',
    description: '과거로 회귀하거나 다른 인물에게 빙의하는 구조. 앞선 지식을 활용한 전개.',
    genre: ['회귀', '판타지'],
    icon: '⏪',
  },
];

export default function TemplatesPage() {
  const [templates] = useState(defaultTemplates);

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">템플릿</h1>
          <p className="text-muted-foreground">장르별 템플릿으로 빠르게 시작하세요</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          템플릿 만들기
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((template, index) => (
          <motion.div
            key={template.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="cursor-pointer hover:shadow-lg transition-all group">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="text-4xl mb-2">{template.icon}</div>
                  <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Wand2 className="h-4 w-4 mr-2" />
                    사용
                  </Button>
                </div>
                <CardTitle>{template.title}</CardTitle>
                <CardDescription className="line-clamp-2">{template.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 flex-wrap">
                  {template.genre.map((g) => (
                    <Badge key={g} variant="secondary">
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
              <h3 className="font-semibold">나만의 템플릿 만들기</h3>
              <p className="text-sm text-muted-foreground">
                자주 사용하는 설정을 템플릿으로 저장하여 새 프로젝트에서 빠르게 시작할 수 있습니다.
                세계관, 캐릭터 구조, 플롯 템플릿을 포함할 수 있습니다.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
