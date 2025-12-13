'use client';

import { usePathname, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Home,
  FolderPlus,
  BookOpen,
  Users,
  Globe,
  GitBranch,
  Edit3,
  BarChart3,
  Download,
  Clock,
  Library,
  Layers,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useUIStore } from '@/stores/uiStore';
import { useProjectStore } from '@/stores/projectStore';

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

const mainNavItems: NavItem[] = [
  { title: '대시보드', href: '/', icon: Home },
  { title: '새 프로젝트', href: '/new', icon: FolderPlus },
  { title: '템플릿', href: '/templates', icon: Library },
  { title: '시리즈', href: '/series', icon: Layers },
];

const projectNavItems: NavItem[] = [
  { title: '개요', href: '', icon: BookOpen },
  { title: '기획', href: '/planning', icon: Sparkles },
  { title: '세계관', href: '/world', icon: Globe },
  { title: '캐릭터', href: '/characters', icon: Users },
  { title: '플롯', href: '/plot', icon: GitBranch },
  { title: '집필', href: '/chapters', icon: Edit3 },
  { title: '분석', href: '/analysis', icon: BarChart3 },
  { title: '타임라인', href: '/timeline', icon: Clock },
  { title: '내보내기', href: '/export', icon: Download },
];

export function Sidebar() {
  const pathname = usePathname();
  const params = useParams();
  const { sidebarOpen, sidebarWidth } = useUIStore();
  const { currentProject } = useProjectStore();

  const projectId = params?.id as string | undefined;
  const isInProject = pathname.startsWith('/project/') && projectId;

  if (!sidebarOpen) {
    return null;
  }

  return (
    <aside
      className="fixed left-0 top-14 z-40 h-[calc(100vh-3.5rem)] border-r bg-background transition-all duration-300"
      style={{ width: sidebarWidth }}
    >
      <ScrollArea className="h-full py-4">
        <div className="px-3 space-y-4">
          {/* 메인 네비게이션 */}
          <div className="space-y-1">
            <h4 className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              메뉴
            </h4>
            {mainNavItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={pathname === item.href ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full justify-start gap-2',
                    pathname === item.href && 'bg-primary/10 text-primary'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.title}</span>
                  {item.badge && (
                    <span className="ml-auto text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded">
                      {item.badge}
                    </span>
                  )}
                </Button>
              </Link>
            ))}
          </div>

          {/* 프로젝트 네비게이션 (프로젝트 내부에 있을 때만 표시) */}
          {isInProject && (
            <>
              <Separator />
              <div className="space-y-1">
                <h4 className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <span>프로젝트</span>
                  {currentProject && (
                    <span className="text-foreground font-normal normal-case truncate max-w-[120px]">
                      {currentProject.title || '제목 없음'}
                    </span>
                  )}
                </h4>
                {projectNavItems.map((item) => {
                  const href = `/project/${projectId}${item.href}`;
                  const isActive = item.href === ''
                    ? pathname === `/project/${projectId}`
                    : pathname.startsWith(href);

                  return (
                    <Link key={item.href} href={href}>
                      <Button
                        variant={isActive ? 'secondary' : 'ghost'}
                        className={cn(
                          'w-full justify-start gap-2',
                          isActive && 'bg-primary/10 text-primary'
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                        <ChevronRight className={cn(
                          'ml-auto h-4 w-4 transition-transform',
                          isActive && 'rotate-90'
                        )} />
                      </Button>
                    </Link>
                  );
                })}
              </div>
            </>
          )}

          {/* 최근 프로젝트 (대시보드에서만) */}
          {!isInProject && pathname === '/' && (
            <>
              <Separator />
              <div className="space-y-1">
                <h4 className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  최근 프로젝트
                </h4>
                <div className="text-sm text-muted-foreground px-2 py-4 text-center">
                  프로젝트가 로드되면 여기에 표시됩니다
                </div>
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </aside>
  );
}
