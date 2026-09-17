'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { ChipGrid } from '../ui/ChipGrid';
import { Category } from '@/lib/types';
import { X, User, Eye, EyeOff, ShieldCheck, ArrowRight } from 'lucide-react';

const ALL_CATEGORIES: Category[] = ['AI', 'Tech', 'Finance', 'Culture', 'Cyberpunk', 'Design'];

export const AuthFlow = () => {
  const { isAuthOpen, setIsAuthOpen, setIsAuthenticated, userPreferences, setSelectedCategories } = useStore();
  const [step, setStep] = useState<1 | 2>(1);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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
    setUsername('');
    setPassword('');
  };

  const AVATARS = [
    { id: 1, name: 'Cyber Netrunner', primary: '#B8FF00', secondary: '#00FFC2', hair: '#111111' },
    { id: 2, name: 'Neon Samurai', primary: '#FFE600', secondary: '#FF0055', hair: '#1A3D11' },
    { id: 3, name: 'Neural Oracle', primary: '#00F0FF', secondary: '#7928CA', hair: '#0A0A0A' },
  ];
  const [avatarIndex, setAvatarIndex] = useState(0);

  const cycleAvatar = () => {
    setAvatarIndex((prev) => (prev + 1) % AVATARS.length);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticated(true);
    setIsAuthOpen(false);
  };

  return (
    <AnimatePresence>
      {isAuthOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay">
          <motion.div
            initial={{ scale: 0.88, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.88, opacity: 0, y: -20 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            className="w-full max-w-md glass-card p-8 sm:p-10 relative overflow-hidden specular border border-white/50 shadow-[0_20px_40px_rgba(0,0,0,0.3)] rounded-[28px]"
          >
            {/* Top Close Button */}
            <button
              onClick={() => setIsAuthOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full glass hover:bg-white/30 transition-all text-white/80 hover:text-white"
              aria-label="Close Modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Circular 3D Character Avatar */}
            <div className="flex flex-col items-center mb-6">
              <div className="relative w-28 h-28 mb-3">
                <div 
                  className="absolute inset-0 rounded-full blur-[24px] opacity-60 animate-pulse" 
                  style={{ background: AVATARS[avatarIndex].primary }}
                />
                <div className="relative w-full h-full rounded-full p-[3px] bg-gradient-to-tr from-[#1A3D11] via-[#228B22] to-[#B8FF00] shadow-[0_12px_28px_rgba(34,139,34,0.4)]">
                  <div className="w-full h-full rounded-full overflow-hidden bg-gradient-to-b from-[#182613] to-[#0a1007] flex items-center justify-center border border-white/40">
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      <defs>
                        <linearGradient id="modalSkin" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#f7d4b2" />
                          <stop offset="60%" stopColor="#dba17b" />
                          <stop offset="100%" stopColor="#824a2e" />
                        </linearGradient>
                        <linearGradient id={`modalVisor-${avatarIndex}`} x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor={AVATARS[avatarIndex].primary} />
                          <stop offset="100%" stopColor={AVATARS[avatarIndex].secondary} />
                        </linearGradient>
                      </defs>
                      <circle cx="50" cy="50" r="45" fill="#0D200E" />
                      <path d="M22 45 C22 20, 78 20, 78 45 C78 65, 75 75, 75 75 L25 75 Z" fill={AVATARS[avatarIndex].hair} />
                      <ellipse cx="50" cy="54" rx="26" ry="30" fill="url(#modalSkin)" />
                      <ellipse cx="22" cy="55" rx="5" ry="9" fill="#dba17b" />
                      <ellipse cx="78" cy="55" rx="5" ry="9" fill="#dba17b" />
                      <rect x="25" y="44" width="50" height="15" rx="7" fill={`url(#modalVisor-${avatarIndex})`} />
                      <path d="M28 47 L72 47" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
                      <ellipse cx="50" cy="67" rx="3" ry="2" fill="#9e6648" />
                      <path d="M43 74 Q50 78 57 74" stroke="#5a2f1c" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                      <circle cx="21" cy="60" r="2.5" fill="#FFE600" />
                      <circle cx="79" cy="60" r="2.5" fill={AVATARS[avatarIndex].primary} />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Condensed font button */}
              <button
                type="button"
                onClick={cycleAvatar}
                className="font-display text-xs tracking-widest text-white/80 hover:text-[#B8FF00] transition-colors px-3 py-1 rounded-full border border-white/20 hover:border-[#B8FF00]/50 bg-black/20"
              >
                CHANGE AVATAR
              </button>
            </div>

            {/* Title & Prompt */}
            <div className="text-center mb-6">
              <h2 className="font-display text-3xl sm:text-4xl text-white tracking-tight leading-none mb-1">
                ACCESS SYSTEM
              </h2>
              <p className="font-serif text-sm text-white/70 italic">
                Enter credentials to unlock unrestricted editorial intelligence.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label 
                  htmlFor="auth-username" 
                  className="block font-mono-ui text-xs uppercase tracking-wider text-white/70 mb-1.5 font-bold"
                >
                  USERNAME
                </label>
                <div className="relative">
                  <User className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-black/50 pointer-events-none" />
                  <input
                    id="auth-username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="tea_reader"
                    className="w-full bg-[#DCDCDC] text-[#000000] placeholder-[#000000]/40 pl-11 pr-4 py-3 rounded-[12px] font-mono-ui text-sm font-medium border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#88CC00] transition-all"
                  />
                </div>
              </div>

              <div>
                <label 
                  htmlFor="auth-password" 
                  className="block font-mono-ui text-xs uppercase tracking-wider text-white/70 mb-1.5 font-bold"
                >
                  PASSWORD
                </label>
                <div className="relative">
                  <input
                    id="auth-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-[#DCDCDC] text-[#000000] placeholder-[#000000]/40 px-4 pr-12 py-3 rounded-[12px] font-mono-ui text-sm font-medium border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#88CC00] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-black/60 hover:text-black transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Bottom Center Pill-Shaped SUBMIT Button */}
              <div className="pt-4 flex justify-center">
                <button
                  type="submit"
                  className="w-full sm:w-auto min-w-[200px] px-10 py-3 rounded-full bg-[#B8FF00] hover:bg-[#FFE600] text-[#000000] font-display text-lg tracking-wider uppercase font-bold shadow-[0_8px_24px_rgba(184,255,0,0.35)] transition-transform duration-300 hover:scale-105 active:scale-95 text-center flex items-center justify-center"
                >
                  SUBMIT
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};