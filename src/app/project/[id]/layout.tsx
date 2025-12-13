'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useProjectStore } from '@/stores/projectStore';
import { LoadingSpinner } from '@/components/common';

interface ProjectLayoutProps {
  children: React.ReactNode;
}

export default function ProjectLayout({ children }: ProjectLayoutProps) {
  const params = useParams();
  const projectId = params.id as string;
  const { currentProject, fetchProject, isLoading, error } = useProjectStore();

  useEffect(() => {
    if (projectId && (!currentProject || currentProject.id !== projectId)) {
      fetchProject(projectId);
    }
  }, [projectId, currentProject, fetchProject]);

  if (isLoading && !currentProject) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
        <LoadingSpinner size="lg" text="프로젝트를 불러오는 중..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)] gap-4">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  return <>{children}</>;
}
