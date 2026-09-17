'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { FeedbackBox } from './FeedbackBox';
import { X, Clock, User, Calendar, Share2 } from 'lucide-react';

export const ArticleDetail = () => {
  const { selectedArticle, setSelectedArticle } = useStore();

  if (!selectedArticle) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-xl overflow-y-auto">
        <motion.div
          layoutId={`card-${selectedArticle.id}`}
          className="w-full max-w-3xl glass-tier-1 border border-white/20 rounded-3xl p-6 sm:p-10 relative overflow-hidden my-auto max-h-[90vh] overflow-y-auto"
        >
          {/* Close Button */}
          <button
            onClick={() => setSelectedArticle(null)}
            className="sticky top-0 right-0 float-right z-20 p-2 rounded-full glass-tier-3 hover:bg-white/20 text-foreground"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header Metadata */}
          <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-accent mb-4">
            <span className="px-3 py-1 rounded-full bg-accent/20 border border-accent/30 uppercase font-bold">
              {selectedArticle.category}
            </span>
            <span className="flex items-center gap-1 text-foreground/60">
              <Clock className="w-3.5 h-3.5" /> {selectedArticle.readTime}
            </span>
            <span className="flex items-center gap-1 text-foreground/60">
              <Calendar className="w-3.5 h-3.5" /> {selectedArticle.date}
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight font-mono mb-3">
            {selectedArticle.title}
          </h1>

          <p className="text-base sm:text-lg text-foreground/80 font-sans italic mb-6 border-l-2 border-accent pl-4">
            {selectedArticle.subtitle}
          </p>

          <div className="flex items-center justify-between border-y border-white/10 py-3 mb-8 text-xs font-mono">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-accent" />
              <span>BY {selectedArticle.author.toUpperCase()}</span>
            </div>
            <button className="flex items-center gap-1 text-foreground/70 hover:text-accent">
              <Share2 className="w-4 h-4" /> SHARE TEA
            </button>
          </div>

          {/* Body Content */}
          <div className="space-y-4 font-sans text-sm sm:text-base leading-relaxed text-foreground/90">
            {selectedArticle.content.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>

          {/* Interactive Feedback Box */}
          <FeedbackBox articleId={selectedArticle.id} articleTitle={selectedArticle.title} />
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
