'use client';

import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Send, Sparkles } from 'lucide-react';

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
    <div className="mt-10 pt-8 border-t border-white/10 relative overflow-hidden">
      <h4 className="text-sm font-mono font-bold uppercase tracking-wider text-accent mb-2 flex items-center gap-2">
        <Sparkles className="w-4 h-4" /> GIVE YOUR THOUGHTS ON THIS TEA
      </h4>

      <form onSubmit={handleSubmit} className="relative mt-4">
        <textarea
          rows={3}
          value={thought}
          onChange={(e) => setThought(e.target.value)}
          placeholder="What is your analysis on this broadcast?..."
          maxLength={2000}
          className="w-full bg-white/5 border border-white/20 rounded-2xl p-4 text-sm font-mono focus:outline-none focus:border-accent resize-none"
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-3 px-6 py-2.5 rounded-xl bg-accent text-black font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 hover:bg-accent/90 transition-all shadow-[0_0_15px_var(--accent-color)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Send className="w-3.5 h-3.5" /> {isSubmitting ? 'SENDING...' : 'SUBMIT THOUGHT'}
        </button>

        {error && <p className="mt-3 text-xs font-mono text-red-400" role="alert">{error}</p>}

        {/* Concentric Expanding Liquid Ripple Confirmation */}
        {submitted && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md rounded-2xl flex items-center justify-center overflow-hidden">
            <motion.div
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: 4, opacity: 0 }}
              transition={{ duration: shouldReduceMotion ? 0.1 : 1.2, ease: "easeOut" }}
              className="absolute w-24 h-24 rounded-full border-2 border-accent"
            />
            <p className="relative z-10 font-mono text-xs font-bold text-accent tracking-widest uppercase">
              TRANSMISSION RECEIVED // THOUGHT LOGGED
            </p>
          </div>
        )}
      </form>
    </div>
  );
};
