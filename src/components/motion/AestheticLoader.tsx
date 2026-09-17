'use client';

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useStore } from '@/store/useStore';

export const AestheticLoader = () => {
  const { isLoading, setIsLoading } = useStore();
  const shouldReduceMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          key="loader"
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0a0a0a] text-white overflow-hidden"
          exit={{
            scale: 0,
            opacity: 0,
            borderRadius: "100%",
          }}
          transition={{
            duration: 0.7,
            ease: [0.65, 0, 0.35, 1],
          }}
        >
          {/* Ambient Glowing Orbs */}
          <div className="absolute inset-0 filter blur-[120px] opacity-40 pointer-events-none">
            <div className="absolute top-1/3 left-1/4 w-80 h-80 bg-[#39ff14] rounded-full animate-pulse-glow" />
            <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-[#00f0ff] rounded-full animate-pulse-glow" style={{ animationDelay: '2s' }} />
          </div>

          <div className="relative z-10 flex flex-col items-center max-w-md px-6 text-center">
            {/* Liquid SVG distortion text */}
            <motion.div
              className="mb-8"
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.35 }}
            >
              <h1 className="text-xl sm:text-2xl font-mono tracking-wider">
                your daily tea is loading...
              </h1>
            </motion.div>

            {/* Wavy Liquid Progress Bar */}
            <div className="w-64 h-3 rounded-full bg-white/10 p-0.5 border border-white/20 relative overflow-hidden backdrop-blur-md">
              <motion.div
                className="h-full bg-gradient-to-r from-[#39ff14] to-[#00f0ff] rounded-full relative"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: shouldReduceMotion ? 0.2 : 1.2, ease: "easeInOut" }}
                onAnimationComplete={() => setIsLoading(false)}
              >
                {/* Wavy animated edge */}
                <div className="absolute right-0 top-0 bottom-0 w-3 bg-white/50 blur-[2px] animate-pulse" />
              </motion.div>
            </div>

            <p className="mt-4 text-xs font-mono text-white/50 tracking-widest uppercase">
              System Initialization • Neo-Brutalist Engine
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
