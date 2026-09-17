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
            className="relative overflow-hidden rounded-full px-5 py-2.5 font-mono-ui text-xs font-bold uppercase tracking-wider transition-all border glass-panel"
            style={{
              borderColor: isSelected ? '#B8FF00' : 'rgba(0,0,0,0.1)',
              background: isSelected ? 'linear-gradient(135deg, #B8FF00, #88CC00)' : undefined,
              color: isSelected ? '#1A1A1A' : '#2A2A2A',
              boxShadow: isSelected ? '0 4px 16px rgba(136, 204, 0, 0.3)' : undefined,
            }}
          >
            <span className="relative z-10 flex items-center gap-1.5">
              {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              {cat}
            </span>
          </button>
        );
      })}
    </div>
  );
};