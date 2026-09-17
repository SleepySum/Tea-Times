'use client';

import { Category } from '@/lib/types';
import { Cpu, Zap, DollarSign, Globe, Sparkles, Layers } from 'lucide-react';

export const AiThumbnails = ({ category, className = '' }: { category: Category; className?: string }) => {
  const getIcon = () => {
    switch (category) {
      case 'AI': return <Cpu className="w-10 h-10 text-lime-400" />;
      case 'Tech': return <Zap className="w-10 h-10 text-cyan-400" />;
      case 'Finance': return <DollarSign className="w-10 h-10 text-emerald-400" />;
      case 'Culture': return <Globe className="w-10 h-10 text-amber-400" />;
      case 'Cyberpunk': return <Sparkles className="w-10 h-10 text-fuchsia-400" />;
      case 'Design': return <Layers className="w-10 h-10 text-violet-400" />;
    }
  };

  return (
    <div className={`w-full h-full bg-gradient-to-br from-black/80 via-black/40 to-lime-500/10 flex items-center justify-center relative overflow-hidden ${className}`}>
      {/* Duotone Grid Lines Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:16px_16px]" />
      <div className="relative z-10 p-4 rounded-2xl glass-panel border border-white/20 shadow-xl">
        {getIcon()}
      </div>
    </div>
  );
};