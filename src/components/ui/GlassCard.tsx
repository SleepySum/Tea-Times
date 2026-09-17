'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  tier?: 1 | 2 | 3;
  onClick?: () => void;
}

export const GlassCard = ({ children, className, tier = 2, onClick }: GlassCardProps) => {
  const tierClass = {
    1: 'glass-tier-1',
    2: 'glass-tier-2 specular-hover',
    3: 'glass-tier-3',
  }[tier];

  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-3xl p-6 relative overflow-hidden transition-all duration-300 border border-white/10',
        tierClass,
        className
      )}
    >
      <div className="absolute inset-0 bg-noise pointer-events-none opacity-30" />
      <div className="relative z-10">{children}</div>
    </div>
  );
};