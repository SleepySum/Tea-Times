'use client';

import { useStore } from '@/store/useStore';
import { ARTICLES } from '@/lib/mockData';
import { LiquidCarousel } from '@/components/motion/LiquidCarousel';
import { GlassCard } from '@/components/ui/GlassCard';
import { Sparkles, Cpu, Flame, Layers, Eye, ShieldCheck, ArrowRight } from 'lucide-react';

export default function Home() {
  const { userPreferences, activeView, setActiveView, setIsAuthOpen, setSelectedArticle } = useStore();

  const recommendedArticles = ARTICLES.filter((art) =>
    userPreferences.categories.includes(art.category)
  );

  return (
    <div className="relative min-h-screen selection:bg-[#B8FF00] selection:text-black">
      {/* Fluid Wavy Gradient Background with Heavy Film-Grain Noise & Dark Vignette */}
      <div className="bg-canvas">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
      </div>
      <div className="vignette" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-8 pt-6 space-y-12 pb-32">
        {/* Specification View Switcher Bar */}
        <section className="relative z-10 flex flex-wrap items-center justify-between gap-4 p-3 rounded-[24px] glass border border-white/40 shadow-[0_12px_28px_rgba(0,0,0,0.25)]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#B8FF00] animate-ping" />
            <span className="font-mono-ui text-xs font-bold uppercase tracking-wider text-white">
              DIGITAL TABLOID SPEC:
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveView('all')}
              className={`px-3.5 py-1.5 rounded-full font-mono-ui text-xs font-bold transition-all ${
                activeView === 'all'
                  ? 'bg-[#B8FF00] text-black shadow-[0_0_14px_rgba(184,255,0,0.6)] scale-105'
                  : 'text-white/80 hover:text-white glass'
              }`}
            >
              FULL MAGAZINE
            </button>
            <button
              onClick={() => {
                setActiveView('login');
                setIsAuthOpen(true);
              }}
              className={`px-3.5 py-1.5 rounded-full font-mono-ui text-xs font-bold transition-all ${
                activeView === 'login'
                  ? 'bg-[#B8FF00] text-black shadow-[0_0_14px_rgba(184,255,0,0.6)] scale-105'
                  : 'text-white/80 hover:text-white glass'
              }`}
            >
              VIEW 1: AUTH MODAL
            </button>
            <button
              onClick={() => setActiveView('deck')}
              className={`px-3.5 py-1.5 rounded-full font-mono-ui text-xs font-bold transition-all ${
                activeView === 'deck'
                  ? 'bg-[#B8FF00] text-black shadow-[0_0_14px_rgba(184,255,0,0.6)] scale-105'
                  : 'text-white/80 hover:text-white glass'
              }`}
            >
              VIEW 2: 3D CARD DECK
            </button>
            <button
              onClick={() => {
                setActiveView('article');
                setSelectedArticle(ARTICLES[0]);
              }}
              className={`px-3.5 py-1.5 rounded-full font-mono-ui text-xs font-bold transition-all ${
                activeView === 'article'
                  ? 'bg-[#B8FF00] text-black shadow-[0_0_14px_rgba(184,255,0,0.6)] scale-105'
                  : 'text-white/80 hover:text-white glass'
              }`}
            >
              VIEW 3: ARTICLE & ENGAGEMENT
            </button>
          </div>
        </section>

        {/* Hero Header Section */}
        <section className="space-y-4 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-[#B8FF00] text-xs font-mono-ui font-bold uppercase border border-[#B8FF00]/40 shadow-[0_0_16px_rgba(184,255,0,0.2)]">
            <Sparkles className="w-3.5 h-3.5" />
            ACID NEO-BRUTALISM x FROSTED GLASSMORPHISM
          </div>
          <h1 className="font-display text-5xl sm:text-7xl lg:text-8xl text-white tracking-tight leading-none">
            HOT TEA.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#B8FF00] via-[#88CC00] to-[#FFE600]">
              ZERO FILTER.
            </span>
          </h1>
          <p className="max-w-2xl font-serif text-base sm:text-lg text-white/80 leading-relaxed italic">
            High-contrast digital tabloid editorial with dark luxury cyberpunk undertones, retro tactile textures, and precision-engineered frosted glassmorphism.
          </p>
        </section>

        {/* View 2: Interactive 3D Card Deck / Magazine Carousel */}
        <section className="relative z-10 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="font-mono-ui text-sm font-bold uppercase tracking-wider flex items-center gap-2 text-white">
              <Flame className="w-5 h-5 text-[#B8FF00]" />
              FEATURED 3D MAGAZINE DECK
            </h2>
            <span className="font-mono-ui text-xs text-[#B8FF00] font-bold">
              3-CARD STACK // PERSPECTIVE 3D
            </span>
          </div>
          <LiquidCarousel articles={ARTICLES} />
        </section>

        {/* AI Recommendations Grid */}
        <section className="relative z-10 space-y-6">
          <div className="flex items-center justify-between border-b border-white/20 pb-4">
            <h2 className="font-mono-ui text-sm font-bold uppercase tracking-wider flex items-center gap-2 text-white">
              <Cpu className="w-5 h-5 text-[#B8FF00]" />
              NEURAL EDITORIAL INTEL
            </h2>
            <span className="font-mono-ui text-xs text-[#B8FF00] font-bold">
              {recommendedArticles.length} CURATED STORIES
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendedArticles.map((article) => (
              <GlassCard 
                key={article.id} 
                tier={2} 
                onClick={() => setSelectedArticle(article)}
                className="flex flex-col justify-between h-72 group relative overflow-hidden cursor-pointer border border-white/40 hover:border-[#B8FF00] transition-all duration-300 hover:shadow-[0_16px_36px_rgba(184,255,0,0.15)] rounded-[24px]"
              >
                <div className="relative z-10">
                  <div className="flex items-center justify-between text-xs font-mono-ui text-white/70 mb-3">
                    <span className="text-[#B8FF00] uppercase font-bold px-2 py-0.5 rounded bg-[#B8FF00]/10 border border-[#B8FF00]/30">
                      {article.category}
                    </span>
                    <span className="tabular-nums">{article.date}</span>
                  </div>
                  <h3 className="font-display text-xl text-white group-hover:text-[#B8FF00] transition-colors line-clamp-2 uppercase">
                    {article.title}
                  </h3>
                  <p className="font-serif text-xs sm:text-sm text-white/80 mt-3 line-clamp-3 leading-relaxed">
                    {article.excerpt}
                  </p>
                </div>

                <div className="relative z-10 pt-4 border-t border-white/15 flex items-center justify-between text-xs font-mono-ui">
                  <span className="text-white/60">BY {article.author.toUpperCase()}</span>
                  <span className="text-[#B8FF00] font-bold group-hover:translate-x-1.5 transition-transform flex items-center gap-1">
                    READ STORY
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </GlassCard>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}