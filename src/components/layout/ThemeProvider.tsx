'use client';

import { useEffect } from 'react';
import { useUIStore } from '@/stores/uiStore';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { theme } = useUIStore();

  useEffect(() => {
    // 초기 테마 적용
    const root = document.documentElement;
    root.classList.remove('dark', 'light', 'sepia');
    root.classList.add(theme);

    // CSS 변수 업데이트
    if (theme === 'dark') {
      root.style.setProperty('--background', '240 10% 8%');
      root.style.setProperty('--foreground', '0 0% 95%');
      root.style.setProperty('--card', '240 10% 12%');
      root.style.setProperty('--card-foreground', '0 0% 95%');
      root.style.setProperty('--popover', '240 10% 12%');
      root.style.setProperty('--popover-foreground', '0 0% 95%');
      root.style.setProperty('--primary', '45 65% 50%');
      root.style.setProperty('--primary-foreground', '240 10% 8%');
      root.style.setProperty('--secondary', '270 100% 25%');
      root.style.setProperty('--secondary-foreground', '0 0% 95%');
      root.style.setProperty('--muted', '240 5% 18%');
      root.style.setProperty('--muted-foreground', '240 5% 65%');
      root.style.setProperty('--accent', '180 100% 27%');
      root.style.setProperty('--accent-foreground', '0 0% 95%');
      root.style.setProperty('--border', '240 5% 20%');
    } else if (theme === 'light') {
      root.style.setProperty('--background', '40 20% 95%');
      root.style.setProperty('--foreground', '240 10% 10%');
      root.style.setProperty('--card', '40 30% 98%');
      root.style.setProperty('--card-foreground', '240 10% 10%');
      root.style.setProperty('--popover', '40 30% 98%');
      root.style.setProperty('--popover-foreground', '240 10% 10%');
      root.style.setProperty('--primary', '45 70% 40%');
      root.style.setProperty('--primary-foreground', '0 0% 100%');
      root.style.setProperty('--secondary', '270 50% 90%');
      root.style.setProperty('--secondary-foreground', '270 100% 25%');
      root.style.setProperty('--muted', '40 20% 90%');
      root.style.setProperty('--muted-foreground', '240 5% 45%');
      root.style.setProperty('--accent', '180 50% 90%');
      root.style.setProperty('--accent-foreground', '180 100% 20%');
      root.style.setProperty('--border', '40 10% 85%');
    } else if (theme === 'sepia') {
      root.style.setProperty('--background', '35 35% 90%');
      root.style.setProperty('--foreground', '30 30% 20%');
      root.style.setProperty('--card', '35 40% 93%');
      root.style.setProperty('--card-foreground', '30 30% 20%');
      root.style.setProperty('--popover', '35 40% 93%');
      root.style.setProperty('--popover-foreground', '30 30% 20%');
      root.style.setProperty('--primary', '30 60% 40%');
      root.style.setProperty('--primary-foreground', '35 35% 95%');
      root.style.setProperty('--secondary', '30 30% 80%');
      root.style.setProperty('--secondary-foreground', '30 30% 20%');
      root.style.setProperty('--muted', '35 25% 85%');
      root.style.setProperty('--muted-foreground', '30 20% 40%');
      root.style.setProperty('--accent', '30 40% 85%');
      root.style.setProperty('--accent-foreground', '30 30% 20%');
      root.style.setProperty('--border', '35 20% 80%');
    }
  }, [theme]);

  return <>{children}</>;
}
