'use client';

import { motion, useMotionValue, useReducedMotion, useSpring, useTransform, useVelocity } from 'framer-motion';
import { useRef } from 'react';
import { Article } from '@/lib/types';
import { useStore } from '@/store/useStore';
import { AiThumbnails } from '../features/AiThumbnails';
import { Sparkles, Clock, ArrowRight } from 'lucide-react';

interface Props {
  articles: Article[];
}

export const LiquidCarousel = ({ articles }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { setSelectedArticle } = useStore();
  const shouldReduceMotion = useReducedMotion();

  const x = useMotionValue(0);
  const xVelocity = useVelocity(x);
  
  // Smooth velocity map for liquid skew edge warping
  const smoothVelocity = useSpring(xVelocity, { damping: 48, stiffness: 240 });
  const skewX = useTransform(smoothVelocity, [-1400, 1400], [5, -5]);

  return (
    <div className="relative w-full overflow-hidden py-6" ref={containerRef}>
      <motion.div
        drag="x"
        dragConstraints={containerRef}
        dragElastic={0.12}
        style={{ x, willChange: 'transform' }}
        dragMomentum={!shouldReduceMotion}
        className="flex gap-6 px-6 sm:px-12 cursor-grab active:cursor-grabbing"
      >
        {articles.map((article) => (
          <motion.div
            key={article.id}
            layoutId={`card-${article.id}`}
            style={shouldReduceMotion ? undefined : { skewX }}
            onClick={() => setSelectedArticle(article)}
            whileHover={shouldReduceMotion ? undefined : { y: -4, scale: 1.01 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="min-w-[300px] sm:min-w-[360px] h-[460px] rounded-3xl glass-tier-2 specular-hover flex flex-col justify-between p-6 relative overflow-hidden group border border-white/10"
          >
            <div className="absolute inset-0 bg-noise pointer-events-none opacity-40" />
            
            {/* Top Tag & Time */}
            <div className="relative z-10 flex items-center justify-between">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-accent/20 text-accent border border-accent/30">
                {article.category}
              </span>
              <div className="flex items-center text-xs text-foreground/60 font-mono gap-1">
                <Clock className="w-3.5 h-3.5" />
                {article.readTime}
              </div>
            </div>

            {/* Thumbnail Visual */}
            <div className="relative z-10 my-4 h-40 rounded-2xl overflow-hidden border border-white/10">
              <AiThumbnails category={article.category} />
            </div>

            {/* Headline & Excerpt */}
            <div className="relative z-10">
              <h3 className="text-lg font-bold line-clamp-2 group-hover:text-accent transition-colors">
                {article.title}
              </h3>
              <p className="text-xs text-foreground/70 mt-2 line-clamp-2">
                {article.excerpt}
              </p>
            </div>

            {/* Card Footer Action */}
            <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-xs font-mono font-bold">
              <span className="text-accent flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                Score: {article.trendingScore}
              </span>
              <span className="flex items-center gap-1 text-foreground/80 group-hover:translate-x-1 transition-transform">
                READ TEA <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};
