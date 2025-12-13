'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Plus, Folder, Settings, Trash2, Edit, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/common';

export default function SeriesPage() {
  const [series] = useState<Array<{ id: string; title: string; projectCount: number }>>([]);

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">시리즈 관리</h1>
          <p className="text-muted-foreground">여러 작품을 시리즈로 묶어 관리하세요</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          새 시리즈
        </Button>
      </div>

      {series.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={Folder}
              title="시리즈가 없습니다"
              description="여러 작품을 시리즈로 묶어 관리해보세요. 시리즈 내 작품들은 세계관과 캐릭터를 공유할 수 있습니다."
              action={{
                label: '첫 시리즈 만들기',
                onClick: () => {},
              }}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {series.map((s, index) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Folder className="h-5 w-5" />
                    {s.title}
                  </CardTitle>
                  <CardDescription>{s.projectCount}개 작품</CardDescription>
                </CardHeader>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <Card className="bg-muted/50">
        <CardContent className="py-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-primary/10">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">시리즈 기능 안내</h3>
              <p className="text-sm text-muted-foreground">
                시리즈 기능은 현재 준비 중입니다. 곧 여러 작품을 하나의 시리즈로 묶어 세계관과 캐릭터를 공유할 수 있습니다.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
