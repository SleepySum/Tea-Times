'use client';

import { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Send, Sparkles, Check } from 'lucide-react';

interface FeedbackBoxProps {
  articleId: string;
  articleTitle: string;
}

export const FeedbackBox = ({ articleId, articleTitle }: FeedbackBoxProps) => {
  const [thought, setThought] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const shouldReduceMotion = useReducedMotion();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const message = thought.trim();
    if (!message || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId, articleTitle, message }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || 'Unable to send feedback.');

      setThought('');
      setSubmitted(true);
      window.setTimeout(() => setSubmitted(false), 2500);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Unable to send feedback.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative">
      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          rows={4}
          value={thought}
          onChange={(e) => setThought(e.target.value)}
          placeholder="Share your analysis on this broadcast..."
          maxLength={2000}
          className="comment-input w-full font-serif"
        />

        <div className="flex items-center justify-between">
          <span className="font-mono-ui text-xs text-black/50">
            {thought.length}/2000
          </span>
          <button
            type="submit"
            disabled={isSubmitting || !thought.trim()}
            className="btn-pill btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            {isSubmitting ? 'SENDING...' : 'SUBMIT THOUGHT'}
          </button>
        </div>

        {error && (
          <p className="font-mono-ui text-xs text-red-500 flex items-center gap-1" role="alert">
            <span className="w-3.5 h-3.5">!</span>
            {error}
          </p>
        )}

        {/* Success Animation */}
        <AnimatePresence>
          {submitted && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              transition={{ duration: shouldReduceMotion ? 0.1 : 0.4, ease: 'easeOut' }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-2xl flex items-center justify-center z-10"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="flex flex-col items-center gap-3 p-8 text-center glass-panel"
              >
                <motion.div
                  animate={{ 
                    scale: [0, 1.2, 1],
                    opacity: [1, 1, 0]
                  }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
                  className="w-20 h-20 rounded-full border-2 border-lime-500"
                />
                <div className="flex flex-col items-center gap-1">
                  <p className="font-display text-sm text-lime-500 tracking-widest uppercase">
                    TRANSMISSION RECEIVED
                  </p>
                  <p className="font-mono-ui text-xs text-white/70">
                    THOUGHT LOGGED
                  </p>
                </div>
                <Check className="w-8 h-8 text-lime-500" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </div>
  );
};