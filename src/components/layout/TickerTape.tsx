'use client';

import { TICKER_ITEMS } from '@/lib/mockData';
import { TrendingUp } from 'lucide-react';

export const TickerTape = () => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 glass-tier-1 border-t border-white/10 py-2.5 px-4 overflow-hidden">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-accent/20 text-accent text-xs font-mono font-bold whitespace-nowrap border border-accent/30">
          <TrendingUp className="w-3.5 h-3.5" />
          LIVE TEA TAPE
        </div>

        {/* Sine Wave Vertical Rippling Marquee Track */}
        <div className="flex overflow-hidden whitespace-nowrap mask-gradient">
          <div className="flex animate-[translateX_20s_linear_infinite] gap-8 font-mono text-xs">
            {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, index) => (
              <div
                key={index}
                className="inline-flex items-center gap-2 animate-ticker-wave"
                style={{ animationDelay: `${(index % 5) * 0.4}s` }}
              >
                <span className="font-bold text-foreground/90">{item.symbol}</span>
                <span className="text-foreground/70">${item.price}</span>
                <span className={item.change.startsWith('+') ? 'text-accent font-bold' : 'text-rose-400 font-bold'}>
                  {item.change}
                </span>
                <span className="text-white/20">|</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};