'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { ChipGrid } from '../ui/ChipGrid';
import { Category } from '@/lib/types';
import { X, ShieldCheck, Mail, ArrowRight } from 'lucide-react';

const ALL_CATEGORIES: Category[] = ['AI', 'Tech', 'Finance', 'Culture', 'Cyberpunk', 'Design'];

export const AuthFlow = () => {
  const { isAuthOpen, setIsAuthOpen, setIsAuthenticated, userPreferences, setSelectedCategories } = useStore();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');

  const handleToggleCategory = (cat: Category) => {
    const current = userPreferences.categories;
    if (current.includes(cat)) {
      setSelectedCategories(current.filter((c) => c !== cat));
    } else {
      setSelectedCategories([...current, cat]);
    }
  };

  const handleFinish = () => {
    setIsAuthenticated(true);
    setIsAuthOpen(false);
    setStep(1);
  };

  return (
    <AnimatePresence>
      {isAuthOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          {/* Liquid Blob Entrance Modal */}
          <motion.div
            initial={{ scale: 0, borderRadius: '100%' }}
            animate={{ scale: 1, borderRadius: '24px' }}
            exit={{ scale: 0, borderRadius: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="w-full max-w-md glass-tier-1 border border-white/20 p-6 sm:p-8 relative overflow-hidden shadow-2xl"
          >
            <button
              onClick={() => setIsAuthOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full glass-tier-3 hover:bg-white/20 text-foreground/80"
            >
              <X className="w-4 h-4" />
            </button>

            {step === 1 ? (
              <div>
                <div className="flex items-center gap-2 text-accent font-mono text-xs font-bold uppercase mb-2">
                  <ShieldCheck className="w-4 h-4" /> STEP 01 // AUTHENTICATION
                </div>
                <h2 className="text-2xl font-black font-mono tracking-tight">JOIN THE TEA TIMES</h2>
                <p className="text-xs text-foreground/70 mt-1">
                  Access raw cyberpunk intelligence and curated AI briefings daily.
                </p>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (email) setStep(2);
                  }}
                  className="mt-6 space-y-4"
                >
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-foreground/50" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="netrunner@teatimes.io"
                      className="w-full bg-white/5 border border-white/20 rounded-xl py-3 pl-10 pr-4 text-sm font-mono focus:outline-none focus:border-accent"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-accent text-black font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-accent/90 transition-all shadow-[0_0_20px_var(--accent-color)]"
                  >
                    CONTINUE TO PREFERENCES <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2 text-accent-secondary font-mono text-xs font-bold uppercase mb-2">
                  <ShieldCheck className="w-4 h-4" /> STEP 02 // NEURAL FEED
                </div>
                <h2 className="text-2xl font-black font-mono tracking-tight">SELECT YOUR TEA</h2>
                <p className="text-xs text-foreground/70 mt-1">
                  Choose topics to power your personalized AI recommendation engine.
                </p>

                <ChipGrid
                  categories={ALL_CATEGORIES}
                  selected={userPreferences.categories}
                  onToggle={handleToggleCategory}
                />

                <button
                  onClick={handleFinish}
                  className="w-full mt-6 py-3 rounded-xl bg-accent text-black font-mono font-bold text-xs uppercase tracking-wider hover:bg-accent/90 transition-all shadow-[0_0_20px_var(--accent-color)]"
                >
                  INITIALIZE FEED
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};