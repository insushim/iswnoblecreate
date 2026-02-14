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

  useEffect(() => {
    initSettings().catch(() => {});
  }, [initSettings]);

  return (
    <ThemeProvider>
      <TooltipProvider>
        <div className="relative min-h-screen">
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-2 focus:left-2 focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded-md"
          >
            본문으로 건너뛰기
          </a>
          <Header />
          <div className="flex">
            <Sidebar />
            <main
              id="main-content"
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
