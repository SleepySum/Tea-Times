'use client';

import { useStore } from '@/store/useStore';
import { ARTICLES } from '@/lib/mockData';
import { LiquidCarousel } from '@/components/motion/LiquidCarousel';
import { GlassCard } from '@/components/ui/GlassCard';
import { Sparkles, Cpu, Flame, Layers } from 'lucide-react';

export default function Home() {
  const { userPreferences } = useStore();

  // AI Recommendation Filter Engine
  const recommendedArticles = ARTICLES.filter((art) =>
    userPreferences.categories.includes(art.category)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-8 space-y-12">
      {/* Hero Header Section */}
      <section className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-tier-3 text-accent text-xs font-mono font-bold uppercase border border-accent/30">
          <Sparkles className="w-3.5 h-3.5" /> DAILY INTEL BROADCAST
        </div>
        <h1 className="text-4xl sm:text-7xl font-black font-mono tracking-tighter uppercase leading-none">
          HOT TEA. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent via-cyan-400 to-accent-secondary">
            ZERO FILTER.
          </span>
        </h1>
        <p className="max-w-xl text-sm sm:text-base text-foreground/70 font-sans">
          An upscale cyberpunk magazine with physics-driven liquid motion dynamics and neural recommendation intelligence.
        </p>
      </section>

      {/* Physics Liquid Motion Carousel */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-lg font-mono font-bold uppercase tracking-wider flex items-center gap-2">
            <Flame className="w-5 h-5 text-accent" /> TOP FEATURED STORIES
          </h2>
          <span className="text-xs font-mono text-foreground/50">DRAG HORIZONTALLY →</span>
        </div>
        <LiquidCarousel articles={ARTICLES} />
      </section>

      {/* AI Recommendations Grid */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <h2 className="text-lg font-mono font-bold uppercase tracking-wider flex items-center gap-2">
            <Cpu className="w-5 h-5 text-cyan-400" /> AI RECOMMENDED FOR YOU
          </h2>
          <span className="text-xs font-mono text-accent">
            {recommendedArticles.length} MATCHES
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recommendedArticles.map((article) => (
            <GlassCard key={article.id} tier={2} className="flex flex-col justify-between h-64 group">
              <div>
                <div className="flex items-center justify-between text-xs font-mono text-foreground/60 mb-3">
                  <span className="text-accent uppercase font-bold">{article.category}</span>
                  <span>{article.date}</span>
                </div>
                <h3 className="text-lg font-bold font-mono group-hover:text-accent transition-colors line-clamp-2">
                  {article.title}
                </h3>
                <p className="text-xs text-foreground/70 mt-2 line-clamp-3 font-sans">
                  {article.excerpt}
                </p>
              </div>

              <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs font-mono">
                <span className="text-foreground/50">{article.author}</span>
                <span className="text-accent font-bold group-hover:translate-x-1 transition-transform">
                  READ →
                </span>
              </div>
            </GlassCard>
          ))}
        </div>
      </section>
    </div>
  );
}