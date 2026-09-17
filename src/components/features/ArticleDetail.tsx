'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { ARTICLES } from '@/lib/mockData';
import { X, Heart, Zap, ThumbsUp, ThumbsDown, User, Calendar, Clock, Send, Check } from 'lucide-react';

export const ArticleDetail = () => {
  const { selectedArticle, setSelectedArticle, activeView, setActiveView } = useStore();

  // If activeView is 'article' and no article selected, use default featured article
  const currentArticle = selectedArticle || (activeView === 'article' ? ARTICLES[0] : null);

  const [metricCounts, setMetricCounts] = useState<{ [key: string]: { count: number; active: boolean } }>({
    LIKE: { count: 1200, active: false },
    DISLIKE: { count: 720, active: false },
    AGREE: { count: 176, active: false },
    DISAGREE: { count: 32, active: false },
  });

  const [commentText, setCommentText] = useState('');
  const [commentsList, setCommentsList] = useState<string[]>([
    'Post-quantum algorithms will redefine network statehood.',
    'The tactile neo-brutalist aesthetic here is immaculate.',
  ]);
  const [commentSuccess, setCommentSuccess] = useState(false);

  if (!currentArticle) return null;

  const handleMetricToggle = (label: 'LIKE' | 'DISLIKE' | 'AGREE' | 'DISAGREE') => {
    setMetricCounts((prev) => {
      const current = prev[label];
      const newActive = !current.active;
      return {
        ...prev,
        [label]: {
          count: newActive ? current.count + 1 : current.count - 1,
          active: newActive,
        },
      };
    });
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setCommentsList((prev) => [commentText.trim(), ...prev]);
    setCommentText('');
    setCommentSuccess(true);
    setTimeout(() => setCommentSuccess(false), 2000);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const metricsConfig = [
    { key: 'LIKE' as const, label: 'LIKE', count: metricCounts.LIKE.count, icon: Heart, color: '#FF3366', active: metricCounts.LIKE.active },
    { key: 'DISLIKE' as const, label: 'DISLIKE', count: metricCounts.DISLIKE.count, icon: Zap, color: '#FFAA00', active: metricCounts.DISLIKE.active },
    { key: 'AGREE' as const, label: 'AGREE', count: metricCounts.AGREE.count, icon: ThumbsUp, color: '#B8FF00', active: metricCounts.AGREE.active },
    { key: 'DISAGREE' as const, label: 'DISAGREE', count: metricCounts.DISAGREE.count, icon: ThumbsDown, color: '#A0A0A0', active: metricCounts.DISAGREE.active },
  ];

  const handleClose = () => {
    setSelectedArticle(null);
    if (activeView === 'article') {
      setActiveView('all');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 modal-overlay overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: -24 }}
          transition={{ type: 'spring', stiffness: 320, damping: 26 }}
          className="w-full max-w-5xl glass-card relative overflow-hidden my-auto max-h-[92vh] flex flex-col border border-white/50 shadow-[0_20px_40px_rgba(0,0,0,0.3)] rounded-[28px]"
        >
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 z-30 p-2.5 rounded-full glass hover:bg-white/30 transition-transform duration-300 hover:scale-110 active:scale-90 text-white/90"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="bg-noise" />

          {/* Split Two-Column Grid inside Glass Containers */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-y-auto flex-1 z-10">
            
            {/* Left Panel: Article Cover Art + Body Preview Text */}
            <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col border-b lg:border-b-0 lg:border-r border-white/20 overflow-y-auto bg-black/10">
              {/* Article Cover Art Graphic */}
              <div className="magazine-cover halftone rounded-[20px] overflow-hidden mb-6 aspect-[16/9] sm:aspect-[2/1] relative border border-white/20 shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
                <div className="red-banner absolute top-4 left-4 z-20 shadow-md">
                  {currentArticle.category}
                </div>
                <div className="absolute top-4 right-4 z-20 font-mono-ui text-[10px] text-white/90 font-bold bg-black/60 px-2.5 py-1 rounded-full border border-white/20">
                  DIGITAL TABLOID // ISSUE 88
                </div>
                
                <div className="w-full h-full relative flex items-center justify-center bg-gradient-to-tr from-[#1A3D11] via-[#0D0D0D] to-[#2B4C0A]">
                  <div className="absolute inset-0 bg-[radial-gradient(#B8FF00_1px,transparent_1px)] [background-size:12px_12px] opacity-20 pointer-events-none" />
                  <div className="relative z-10 text-center px-4">
                    <span className="font-display text-5xl sm:text-6xl text-white tracking-tighter opacity-30">
                      THE TEA
                    </span>
                  </div>
                </div>

                <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black via-black/80 to-transparent">
                  <h2 className="font-display text-2xl sm:text-3xl text-white tracking-tight leading-none uppercase">
                    {currentArticle.title}
                  </h2>
                </div>
              </div>

              {/* Metadata row */}
              <div className="flex flex-wrap items-center gap-3 text-xs font-mono-ui text-[#B8FF00] mb-4 pb-3 border-b border-white/10">
                <span className="flex items-center gap-1.5 text-white/70">
                  <User className="w-3.5 h-3.5 text-[#B8FF00]" />
                  BY {currentArticle.author.toUpperCase()}
                </span>
                <span className="text-white/30">•</span>
                <span className="flex items-center gap-1 text-white/70">
                  <Clock className="w-3.5 h-3.5 text-[#B8FF00]" />
                  {currentArticle.readTime}
                </span>
                <span className="text-white/30">•</span>
                <span className="flex items-center gap-1 text-white/70">
                  <Calendar className="w-3.5 h-3.5 text-[#B8FF00]" />
                  {currentArticle.date}
                </span>
              </div>

              {/* Subtitle / Excerpt in Serif */}
              <p className="font-serif text-base sm:text-lg text-white/90 italic mb-5 pl-4 border-l-2 border-[#B8FF00] leading-relaxed">
                "{currentArticle.subtitle}"
              </p>

              {/* Body preview text in Classic Serif high readability editorial style */}
              <div className="font-serif text-sm sm:text-base leading-relaxed text-white/85 space-y-4">
                {currentArticle.content.map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            </div>

            {/* Right Panel: Action Metrics List + Comment Input Area */}
            <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto bg-white/[0.04] space-y-6">
              <div>
                {/* Header */}
                <div className="flex items-center justify-between pb-3 mb-6 border-b border-white/20">
                  <h3 className="font-display text-2xl text-white tracking-tight uppercase">
                    READER ENGAGEMENT
                  </h3>
                  <span className="font-mono-ui text-[10px] text-[#B8FF00] font-bold px-2 py-0.5 rounded bg-[#B8FF00]/10 border border-[#B8FF00]/30">
                    LIVE
                  </span>
                </div>

                {/* Action metrics list with bold uppercase labels and line icons */}
                <div className="space-y-3">
                  {metricsConfig.map((metric) => {
                    const IconComponent = metric.icon;
                    return (
                      <button
                        key={metric.key}
                        onClick={() => handleMetricToggle(metric.key)}
                        className={`w-full metric-item group cursor-pointer flex items-center justify-between p-3.5 rounded-[16px] border transition-all duration-300 ${
                          metric.active
                            ? 'bg-white/20 border-[#B8FF00] shadow-[0_0_16px_rgba(184,255,0,0.3)]'
                            : 'bg-white/10 hover:bg-white/15 border-white/30 hover:border-white/60'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-10 h-10 rounded-xl flex items-center justify-center bg-black/40 group-hover:scale-110 transition-transform"
                            style={{ color: metric.color }}
                          >
                            <IconComponent className="w-5 h-5" />
                          </div>
                          <span className="font-display text-base tracking-wider text-white uppercase font-bold">
                            {metric.label}
                          </span>
                        </div>
                        <span className="font-mono-ui text-sm font-bold text-white tabular-nums">
                          {formatNumber(metric.count)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Section Inside Right Panel: "Comment :" input area */}
              <div className="pt-6 border-t border-white/20">
                <label 
                  htmlFor="article-comment-input" 
                  className="block font-display text-sm uppercase tracking-wider text-white mb-2 font-bold"
                >
                  Comment :
                </label>
                
                <form onSubmit={handleCommentSubmit} className="space-y-3">
                  <div className="relative">
                    <textarea
                      id="article-comment-input"
                      rows={3}
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Add your verified thought to the broadcast..."
                      className="w-full bg-[#DCDCDC] text-[#000000] placeholder-[#000000]/50 p-3.5 rounded-[14px] font-serif text-sm border border-black/15 focus:outline-none focus:ring-2 focus:ring-[#88CC00] resize-none transition-all"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-mono-ui text-[10px] text-white/50">
                      {commentsList.length} TRANSMISSIONS
                    </span>
                    <button
                      type="submit"
                      disabled={!commentText.trim()}
                      className="px-6 py-2 rounded-full bg-[#B8FF00] hover:bg-[#FFE600] text-black font-display text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                    >
                      {commentSuccess ? (
                        <>
                          <Check className="w-3.5 h-3.5" /> POSTED
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" /> POST COMMENT
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {/* Recent comments preview */}
                <div className="mt-4 space-y-2 max-h-28 overflow-y-auto pr-1">
                  {commentsList.map((comm, idx) => (
                    <div 
                      key={idx} 
                      className="p-2.5 rounded-xl bg-black/30 border border-white/10 font-serif text-xs text-white/80"
                    >
                      <span className="font-mono-ui text-[9px] text-[#B8FF00] mr-2">VERIFIED:</span>
                      {comm}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};