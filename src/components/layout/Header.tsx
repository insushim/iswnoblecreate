'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  PenTool,
  Settings,
  Sun,
  Moon,
  BookOpen,
  Menu,
  Search,
  Bell,
  Timer,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useUIStore, ThemeMode } from '@/stores/uiStore';
import { PomodoroTimer } from './PomodoroTimer';

export function Header() {
  const pathname = usePathname();
  const { theme, setTheme, toggleSidebar, pomodoroActive } = useUIStore();
  const [searchOpen, setSearchOpen] = useState(false);
  const [pomodoroOpen, setPomodoroOpen] = useState(false);

  const themeOptions: { value: ThemeMode; label: string; icon: React.ReactNode }[] = [
    { value: 'dark', label: '다크 모드', icon: <Moon className="h-4 w-4" /> },
    { value: 'light', label: '라이트 모드', icon: <Sun className="h-4 w-4" /> },
    { value: 'sepia', label: '세피아 모드', icon: <BookOpen className="h-4 w-4" /> },
  ];

  const currentThemeIcon = themeOptions.find(t => t.value === theme)?.icon || <Moon className="h-4 w-4" />;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4 gap-4">
        {/* 햄버거 메뉴 (모바일 및 사이드바 토글) */}
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className="shrink-0">
          <Menu className="h-5 w-5" />
          <span className="sr-only">메뉴 토글</span>
        </Button>

        {/* 로고 */}
        <Link href="/" className="flex items-center gap-2 font-bold text-lg shrink-0">
          <PenTool className="h-6 w-6 text-primary" />
          <span className="hidden sm:inline-block">NovelForge AI</span>
        </Link>

        {/* 검색바 */}
        <div className="flex-1 max-w-md mx-auto">
          {searchOpen ? (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="프로젝트, 캐릭터, 장면 검색..."
                className="pl-9 pr-4"
                autoFocus
                onBlur={() => setSearchOpen(false)}
              />
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full justify-start text-muted-foreground"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">검색...</span>
              <kbd className="pointer-events-none ml-auto hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                <span className="text-xs">⌘</span>K
              </kbd>
            </Button>
          )}
        </div>

        {/* 오른쪽 버튼들 */}
        <div className="flex items-center gap-2">
          {/* 포모도로 타이머 */}
          <DropdownMenu open={pomodoroOpen} onOpenChange={setPomodoroOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Timer className="h-5 w-5" />
                {pomodoroActive && (
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary animate-pulse" />
                )}
                <span className="sr-only">포모도로 타이머</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72 p-4">
              <PomodoroTimer />
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 알림 */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px]">
              3
            </Badge>
            <span className="sr-only">알림</span>
          </Button>

          {/* 테마 전환 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                {currentThemeIcon}
                <span className="sr-only">테마 변경</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {themeOptions.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => setTheme(option.value)}
                  className={theme === option.value ? 'bg-accent' : ''}
                >
                  {option.icon}
                  <span className="ml-2">{option.label}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 설정 */}
          <Link href="/settings">
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
              <span className="sr-only">설정</span>
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
