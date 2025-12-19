'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Layers } from 'lucide-react';
import { useProjectStore } from '@/stores/projectStore';
import { useVolumeStore } from '@/stores/volumeStore';
import { LoadingSpinner } from '@/components/common';
import { VolumeStructureManager } from '@/components/writing/VolumeStructureManager';

export default function VolumesPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { currentProject, isLoading } = useProjectStore();
  const { fetchVolumes } = useVolumeStore();

  useEffect(() => {
    if (projectId) {
      fetchVolumes(projectId);
    }
  }, [projectId, fetchVolumes]);

  if (isLoading || !currentProject) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* 헤더 */}
        <div className="flex items-center gap-3">
          <Layers className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">권/씬 구조 관리</h1>
            <p className="text-muted-foreground">
              소설의 권별 구조와 씬을 설정하여 AI가 정확한 분량과 종료점을 지키도록 합니다.
            </p>
          </div>
        </div>

        {/* 권 구조 관리 컴포넌트 */}
        <VolumeStructureManager
          projectId={projectId}
        />
      </motion.div>
    </div>
  );
}
