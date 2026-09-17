'use client';

import { LiquidThemeToggle } from '../motion/LiquidThemeToggle';
import { useStore } from '@/store/useStore';
import { User, ShieldAlert } from 'lucide-react';

export const Header = () => {
  const { setIsAuthOpen, isAuthenticated } = useStore();

  return (
    <header className="sticky top-0 z-40 w-full glass-tier-1 border-b border-white/10 px-6 py-4 flex items-center justify-between transition-all">
      {/* Brand Wordmark */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center font-mono font-black text-black text-xl shadow-[0_0_15px_var(--accent-color)]">
          T
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tighter font-mono uppercase bg-clip-text text-transparent bg-gradient-to-r from-foreground via-accent to-accent-secondary">
            THE TEA TIMES
          </h1>
          <p className="text-[10px] font-mono tracking-widest uppercase text-foreground/60 -mt-1">
            your daily tea
          </p>
        </div>
      </div>

      {/* Nav Controls */}
      <div className="flex items-center gap-4">
        <LiquidThemeToggle />

        <button
          onClick={() => setIsAuthOpen(true)}
          className="glass-tier-3 px-4 py-2 rounded-full font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 border border-white/20 hover:border-accent transition-all hover:scale-105"
        >
          {isAuthenticated ? (
            <>
              <ShieldAlert className="w-4 h-4 text-accent" />
              <span>VIP ACCESS</span>
            </>
          ) : (
            <>
              <User className="w-4 h-4" />
              <span>SIGN IN</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};