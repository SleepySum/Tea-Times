'use client';

import { useState, useCallback } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { Article } from '@/lib/types';
import { ArrowRight, ChevronLeft, ChevronRight, Barcode } from 'lucide-react';

interface Props {
  articles: Article[];
}

export const LiquidCarousel = ({ articles }: Props) => {
  const { setSelectedArticle } = useStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const shouldReduceMotion = useReducedMotion();

  // Exactly 3 featured cards for the 3D deck
  const deckArticles = articles.slice(0, 3);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % deckArticles.length);
  }, [deckArticles.length]);

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + deckArticles.length) % deckArticles.length);
  }, [deckArticles.length]);

  const goToIndex = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  return (
    <div className="relative w-full py-4 flex flex-col items-center">
      {/* 3D Perspective Card Deck Container */}
      <div 
        className="relative w-full max-w-5xl h-[520px] sm:h-[480px] flex items-center justify-center overflow-visible"
        style={{ perspective: '1200px' }}
      >
        {deckArticles.map((article, index) => {
          // Circular offset for 3 cards
          let offset = index - currentIndex;
          if (offset < -1) offset += 3;
          if (offset > 1) offset -= 3;

          const isActive = offset === 0;

          // 3D transform along X-axis
          let transformStyles = '';
          let zIndex = 10;
          let opacity = 0.55;
          let filter = 'blur(2px) brightness(0.7)';

          if (offset === 0) {
            transformStyles = 'translateX(0%) translateZ(0px) rotateY(0deg) scale(1)';
            zIndex = 30;
            opacity = 1;
            filter = 'none';
          } else if (offset === 1) {
            transformStyles = 'translateX(38%) translateZ(-160px) rotateY(-18deg) scale(0.88)';
            zIndex = 20;
            opacity = 0.65;
            filter = 'blur(1.5px) brightness(0.75)';
          } else if (offset === -1) {
            transformStyles = 'translateX(-38%) translateZ(-160px) rotateY(18deg) scale(0.88)';
            zIndex = 20;
            opacity = 0.65;
            filter = 'blur(1.5px) brightness(0.75)';
          }

          return (
            <motion.div
              key={article.id}
              className="absolute w-[92%] sm:w-[680px] md:w-[740px] h-[460px] sm:h-[420px] cursor-pointer"
              style={{
                transform: transformStyles,
                zIndex,
                opacity,
                filter,
                transformStyle: 'preserve-3d',
                transition: shouldReduceMotion 
                  ? 'none' 
                  : 'transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.4s ease, filter 0.4s ease',
              }}
              onClick={() => {
                if (isActive) {
                  setSelectedArticle(article);
                } else {
                  goToIndex(index);
                }
              }}
            >
              <div className="w-full h-full glass-card p-4 sm:p-5 flex overflow-hidden specular relative border border-white/50 shadow-[0_24px_48px_rgba(0,0,0,0.35)] rounded-[28px]">
                <div className="bg-noise" />

                {/* Left Side: Vintage Distressed Magazine Cover Graphic */}
                <div className="w-1/2 h-full rounded-2xl overflow-hidden relative flex flex-col justify-between p-4 sm:p-5 bg-[#121212] border border-white/20 select-none magazine-cover halftone">
                  {/* Distressed Newspaper Texture Overlay */}
                  <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:6px_6px] opacity-15 pointer-events-none" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10" />

                  {/* Top Bar: Red Banner Headline + Issue Stamp */}
                  <div className="relative z-20 flex items-center justify-between">
                    <div className="red-banner shadow-[0_2px_8px_rgba(220,20,60,0.6)] font-bold tracking-widest text-[11px] sm:text-xs">
                      SOCIAL MEDIA
                    </div>
                    <span className="font-mono-ui text-[10px] text-white/80 font-bold tracking-wider">
                      VOL. 26 // $4.99
                    </span>
                  </div>

                  {/* Center Halftone Graphic Art */}
                  <div className="relative z-10 flex-1 flex flex-col items-center justify-center my-2">
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-2 border-dashed border-[#B8FF00]/60 flex items-center justify-center relative overflow-hidden bg-gradient-to-tr from-[#1A3D11] via-black to-[#B8FF00]/20 shadow-[0_0_20px_rgba(184,255,0,0.2)]">
                      <span className="font-display text-4xl sm:text-5xl text-[#B8FF00] tracking-tighter">
                        TEA
                      </span>
                    </div>
                    <div className="mt-3 text-center">
                      <span className="font-mono-ui text-[9px] uppercase tracking-widest text-[#B8FF00] bg-black/60 px-2 py-0.5 rounded border border-[#B8FF00]/40">
                        {article.category} SPECIAL REPORT
                      </span>
                    </div>
                  </div>

                  {/* Bottom Headline & Distressed Barcode */}
                  <div className="relative z-20 pt-2 border-t border-white/20 flex items-end justify-between">
                    <div className="max-w-[70%]">
                      <h4 className="font-display text-base sm:text-lg text-white leading-none line-clamp-2 uppercase">
                        {article.title}
                      </h4>
                      <p className="font-mono-ui text-[9px] text-white/60 mt-1">
                        BY {article.author.toUpperCase()}
                      </p>
                    </div>
                    <div className="flex flex-col items-end opacity-70">
                      <Barcode className="w-12 h-6 text-white stroke-[1.2]" />
                      <span className="font-mono-ui text-[8px] text-white/60">0 82914 91023 5</span>
                    </div>
                  </div>
                </div>

                {/* Right Side: Embedded Frosted Glass Panel with Editorial Text */}
                <div className="w-1/2 h-full pl-4 sm:pl-5 flex flex-col justify-between relative z-10">
                  <div className="glass-panel p-4 sm:p-6 h-full flex flex-col justify-between rounded-[20px] border border-white/40 bg-white/10 backdrop-blur-md">
                    <div>
                      <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/15">
                        <span className="font-mono-ui text-[10px] text-[#B8FF00] font-bold uppercase tracking-wider">
                          EXCLUSIVE EDITORIAL
                        </span>
                        <span className="font-mono-ui text-[10px] text-white/60">
                          {article.readTime}
                        </span>
                      </div>

                      {/* Editorial Title */}
                      <h3 className="font-display text-xl sm:text-2xl text-white tracking-tight leading-tight mb-3">
                        Why do we use it?
                      </h3>

                      {/* Classic Serif Editorial Copy */}
                      <p className="font-serif text-xs sm:text-sm text-white/90 leading-relaxed line-clamp-6">
                        It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using high-contrast brutalist framing is to cut through digital complacency, channeling raw information directly into conscious perception.
                      </p>
                    </div>

                    {/* Footer Action */}
                    <div className="pt-3 border-t border-white/15 flex items-center justify-between">
                      <span className="font-mono-ui text-[10px] text-white/60">
                        {article.date}
                      </span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedArticle(article);
                        }}
                        className="px-3 py-1.5 rounded-full bg-[#B8FF00] hover:bg-[#FFE600] text-black font-display text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95"
                      >
                        READ ARTICLE <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Carousel Controls & 3 Centered White Dot Indicators */}
      <div className="flex items-center justify-center gap-6 mt-6 z-20">
        <button
          onClick={goToPrev}
          className="p-2.5 rounded-full glass hover:bg-white/30 text-white transition-transform hover:scale-110 active:scale-95"
          aria-label="Previous Story"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Exactly 3 Centered White Dot Indicators */}
        <div className="flex items-center gap-3">
          {[0, 1, 2].map((dotIndex) => {
            const isDotActive = dotIndex === currentIndex;
            return (
              <button
                key={dotIndex}
                onClick={() => goToIndex(dotIndex)}
                className="group p-1"
                aria-label={`Go to slide ${dotIndex + 1}`}
              >
                <motion.div
                  animate={{
                    width: isDotActive ? '28px' : '10px',
                    backgroundColor: isDotActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.4)',
                    boxShadow: isDotActive ? '0 0 10px rgba(255, 255, 255, 0.8)' : 'none',
                  }}
                  transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                  className="h-2.5 rounded-full"
                />
              </button>
            );
          })}
        </div>

        <button
          onClick={goToNext}
          className="p-2.5 rounded-full glass hover:bg-white/30 text-white transition-transform hover:scale-110 active:scale-95"
          aria-label="Next Story"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <p className="text-center text-xs font-mono-ui text-white/50 mt-2 uppercase tracking-widest">
        CLICK ACTIVE CARD OR BUTTON TO OPEN FULL ARTICLE
      </p>
    </div>
  );
};