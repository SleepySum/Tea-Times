'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { Sun, Moon } from 'lucide-react';

export const LiquidThemeToggle = () => {
  const { theme, toggleTheme } = useStore();
  const isDark = theme === 'dark';
  const shouldReduceMotion = useReducedMotion();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="relative w-20 h-10 rounded-full glass-tier-3 p-1 cursor-pointer select-none flex items-center justify-between px-2 transition-all hover:scale-105"
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
    >
      <Sun className="w-4 h-4 text-amber-400 z-10" />
      <Moon className="w-4 h-4 text-cyan-400 z-10" />

      {/* Mercury Blob Liquid Switch */}
      <div className="absolute inset-0 rounded-full overflow-hidden">
        <motion.div
          transition={shouldReduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 30 }}
          className="h-8 w-8 rounded-full bg-accent absolute top-1 shadow-[0_0_12px_var(--accent-color)]"
          style={{
            left: isDark ? '4px' : 'calc(100% - 36px)',
          }}
        />
      </div>
    </button>
  );
};
