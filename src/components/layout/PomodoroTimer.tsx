'use client';

import { useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Coffee } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useUIStore } from '@/stores/uiStore';

export function PomodoroTimer() {
  const {
    pomodoroActive,
    pomodoroMinutes,
    pomodoroSeconds,
    pomodoroMode,
    startPomodoro,
    stopPomodoro,
    updatePomodoroTime,
    setPomodoroMode,
  } = useUIStore();

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (pomodoroActive) {
      intervalRef.current = setInterval(() => {
        const { pomodoroMinutes: min, pomodoroSeconds: sec } = useUIStore.getState();

        if (sec === 0) {
          if (min === 0) {
            // 타이머 종료
            stopPomodoro();

            // 알림음 재생 (선택적)
            if (typeof window !== 'undefined' && 'Notification' in window) {
              if (Notification.permission === 'granted') {
                new Notification('NovelForge AI', {
                  body: pomodoroMode === 'work' ? '휴식 시간입니다!' : '다시 집필을 시작하세요!',
                  icon: '/icon.png',
                });
              }
            }

            // 자동으로 다음 모드로 전환
            if (pomodoroMode === 'work') {
              setPomodoroMode('break');
            } else {
              setPomodoroMode('work');
            }
          } else {
            updatePomodoroTime(min - 1, 59);
          }
        } else {
          updatePomodoroTime(min, sec - 1);
        }
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [pomodoroActive, pomodoroMode, stopPomodoro, updatePomodoroTime, setPomodoroMode]);

  const totalSeconds = pomodoroMode === 'work' ? 25 * 60 : 5 * 60;
  const currentSeconds = pomodoroMinutes * 60 + pomodoroSeconds;
  const progress = ((totalSeconds - currentSeconds) / totalSeconds) * 100;

  const formatTime = (min: number, sec: number) => {
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    if (pomodoroActive) {
      stopPomodoro();
    } else {
      startPomodoro(pomodoroMode === 'work' ? 25 : 5);
    }
  };

  const handleReset = () => {
    stopPomodoro();
    setPomodoroMode('work');
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="text-sm text-muted-foreground mb-1">
          {pomodoroMode === 'work' ? '집중 시간' : '휴식 시간'}
        </div>
        <div className="text-4xl font-mono font-bold">
          {formatTime(pomodoroMinutes, pomodoroSeconds)}
        </div>
      </div>

      <Progress value={progress} className="h-2" />

      <div className="flex justify-center gap-2">
        <Button variant="outline" size="icon" onClick={handleStart}>
          {pomodoroActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        <Button variant="outline" size="icon" onClick={handleReset}>
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button
          variant={pomodoroMode === 'break' ? 'default' : 'outline'}
          size="icon"
          onClick={() => setPomodoroMode(pomodoroMode === 'work' ? 'break' : 'work')}
          disabled={pomodoroActive}
        >
          <Coffee className="h-4 w-4" />
        </Button>
      </div>

      <div className="text-xs text-center text-muted-foreground">
        {pomodoroMode === 'work'
          ? '25분 집중 후 5분 휴식'
          : '휴식 후 다시 집중하세요'}
      </div>
    </div>
  );
}
