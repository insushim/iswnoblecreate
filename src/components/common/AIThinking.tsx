'use client';

import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIThinkingProps {
  message?: string;
  className?: string;
}

export function AIThinking({ message = 'AI가 생각하고 있습니다...', className }: AIThinkingProps) {
  return (
    <div className={cn('flex items-center gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20', className)}>
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <Sparkles className="h-5 w-5 text-primary" />
      </motion.div>
      <div className="flex-1">
        <p className="text-sm font-medium">{message}</p>
        <div className="flex gap-1 mt-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-primary"
              animate={{
                opacity: [0.3, 1, 0.3],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
