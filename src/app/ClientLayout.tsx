'use client';

import { useEffect } from 'react';
import { Header, Sidebar, ThemeProvider } from '@/components/layout';
import { useUIStore } from '@/stores/uiStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { TooltipProvider } from '@/components/ui/tooltip';

interface ClientLayoutProps {
  children: React.ReactNode;
}

export function ClientLayout({ children }: ClientLayoutProps) {
  const { sidebarOpen, sidebarWidth } = useUIStore();
  const { initSettings } = useSettingsStore();

  // 앱 초기화
  useEffect(() => {
    console.log('[ClientLayout] 앱 초기화 시작...');
    initSettings().then(() => {
      console.log('[ClientLayout] ✅ 설정 초기화 완료');
    }).catch((error) => {
      console.error('[ClientLayout] ❌ 설정 초기화 실패:', error);
    });
  }, [initSettings]);

  return (
    <ThemeProvider>
      <TooltipProvider>
        <div className="relative min-h-screen">
          <Header />
          <div className="flex">
            <Sidebar />
            <main
              className="flex-1 min-h-[calc(100vh-3.5rem)] transition-all duration-300"
              style={{
                marginLeft: sidebarOpen ? sidebarWidth : 0,
              }}
            >
              {children}
            </main>
          </div>
        </div>
      </TooltipProvider>
    </ThemeProvider>
  );
}
