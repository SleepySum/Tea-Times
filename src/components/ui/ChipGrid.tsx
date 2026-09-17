'use client';

import { Category } from '@/lib/types';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

interface Props {
  categories: Category[];
  selected: Category[];
  onToggle: (cat: Category) => void;
}

export const ChipGrid = ({ categories, selected, onToggle }: Props) => {
  return (
    <div className="flex flex-wrap gap-3 my-4">
      {categories.map((cat) => {
        const isSelected = selected.includes(cat);
        return (
          <button
            key={cat}
            onClick={() => onToggle(cat)}
            className="relative overflow-hidden rounded-full px-4 py-2 font-mono text-xs font-bold transition-all border border-white/20 glass-tier-3"
          >
            {/* Liquid Fill Animation Sweep on Selection */}
            {isSelected && (
              <motion.div
                layoutId={`chip-bg-${cat}`}
                className="absolute inset-0 bg-accent text-black z-0"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
            <span className={`relative z-10 flex items-center gap-1.5 ${isSelected ? 'text-black' : 'text-foreground'}`}>
              {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              {cat}
            </span>
          </button>
        );
      })}
    </div>
  );
};