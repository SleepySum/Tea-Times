'use client';

import { TICKER_ITEMS } from '@/lib/mockData';
import { TrendingUp, TrendingDown } from 'lucide-react';

const FINANCIAL_TICKER = [
  { symbol: 'BSE SENSEX', price: '78,151.45', change: '+964.58', changePct: '+1.25%', positive: true },
  { symbol: 'NIFTY 50', price: '23,658.30', change: '+287.40', changePct: '+1.23%', positive: true },
  { symbol: 'NASDAQ', price: '18,420.15', change: '-45.20', changePct: '-0.24%', positive: false },
  { symbol: 'S&P 500', price: '5,430.60', change: '+12.85', changePct: '+0.24%', positive: true },
  { symbol: 'BITCOIN', price: '$67,234.10', change: '+1,845.30', changePct: '+2.82%', positive: true },
  { symbol: 'ETHEREUM', price: '$3,842.50', change: '-12.40', changePct: '-0.32%', positive: false },
  { symbol: 'GOLD', price: '$2,345.80', change: '+8.20', changePct: '+0.35%', positive: true },
  { symbol: 'CRUDE OIL', price: '$78.45', change: '-0.65', changePct: '-0.82%', positive: false },
  { symbol: 'DOW JONES', price: '39,850.20', change: '+310.50', changePct: '+0.78%', positive: true },
  { symbol: 'RUSSELL 2000', price: '2,145.60', change: '-5.40', changePct: '-0.25%', positive: false },
];

export const TickerTape = () => {
  const items = [...FINANCIAL_TICKER, ...FINANCIAL_TICKER];

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 z-40 py-2.5 px-4 overflow-hidden border-t-2 border-black select-none shadow-[0_-4px_20px_rgba(0,0,0,0.3)]"
      style={{ backgroundColor: '#FFE600', color: '#000000' }}
    >
      <div className="flex items-center gap-6 whitespace-nowrap animate-marquee">
        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-3 shrink-0 font-mono-ui text-xs sm:text-sm font-bold tracking-tight">
            <span className="uppercase tracking-wider font-extrabold text-black">
              {item.symbol}
            </span>
            <span className="tabular-nums text-black font-semibold">
              {item.price}
            </span>
            <span 
              className="tabular-nums flex items-center gap-1 font-bold"
              style={{ color: item.positive ? '#0A5C0A' : '#A30000' }}
            >
              {item.positive ? <TrendingUp className="w-3.5 h-3.5 stroke-[2.5]" /> : <TrendingDown className="w-3.5 h-3.5 stroke-[2.5]" />}
              {item.change} {item.changePct}
            </span>
            <span className="font-bold text-black/90">
              {item.positive ? 'Positive (+)' : 'Negative (-)'}
            </span>
            <span className="text-black/30 w-px h-4 mx-2" />
          </div>
        ))}
      </div>
    </div>
  );
};