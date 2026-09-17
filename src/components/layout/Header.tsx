'use client';

import { LiquidThemeToggle } from '../motion/LiquidThemeToggle';
import { useStore } from '@/store/useStore';
import { User, LogOut, Sparkles } from 'lucide-react';

export const Header = () => {
  const { setIsAuthOpen, isAuthenticated, setIsAuthenticated, activeView, setActiveView } = useStore();

  return (
    <header className="sticky top-0 z-40 w-full px-4 sm:px-8 py-4 flex items-center justify-between backdrop-blur-md bg-black/20 border-b border-white/10">
      {/* Top-Left: Main Title + Subtitle directly below */}
      <div className="flex flex-col select-none">
        <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl text-white tracking-tight leading-none">
          THE TEA TIMES
        </h1>
        <p className="font-script text-lg sm:text-xl text-white/90 -mt-1 tracking-wide">
          your daily tea
        </p>
      </div>

      {/* Screen View Quick Nav */}
      <div className="hidden md:flex items-center gap-2 p-1.5 rounded-full glass border border-white/20">
        <button
          onClick={() => { setActiveView('all'); }}
          className={`px-3 py-1 rounded-full font-mono-ui text-xs font-bold transition-all ${
            activeView === 'all'
              ? 'bg-[#B8FF00] text-black shadow-[0_0_12px_rgba(184,255,0,0.5)]'
              : 'text-white/70 hover:text-white'
          }`}
        >
          MAGAZINE
        </button>
        <button
          onClick={() => { setActiveView('login'); setIsAuthOpen(true); }}
          className={`px-3 py-1 rounded-full font-mono-ui text-xs font-bold transition-all ${
            activeView === 'login'
              ? 'bg-[#B8FF00] text-black shadow-[0_0_12px_rgba(184,255,0,0.5)]'
              : 'text-white/70 hover:text-white'
          }`}
        >
          VIEW 1: AUTH MODAL
        </button>
        <button
          onClick={() => { setActiveView('deck'); }}
          className={`px-3 py-1 rounded-full font-mono-ui text-xs font-bold transition-all ${
            activeView === 'deck'
              ? 'bg-[#B8FF00] text-black shadow-[0_0_12px_rgba(184,255,0,0.5)]'
              : 'text-white/70 hover:text-white'
          }`}
        >
          VIEW 2: 3D CARD DECK
        </button>
        <button
          onClick={() => { setActiveView('article'); }}
          className={`px-3 py-1 rounded-full font-mono-ui text-xs font-bold transition-all ${
            activeView === 'article'
              ? 'bg-[#B8FF00] text-black shadow-[0_0_12px_rgba(184,255,0,0.5)]'
              : 'text-white/70 hover:text-white'
          }`}
        >
          VIEW 3: ARTICLE & METRICS
        </button>
      </div>

      {/* Top-Right: LoggedIn State Circular avatar badge */}
      <div className="flex items-center gap-3">
        <LiquidThemeToggle />

        {isAuthenticated ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAuthOpen(true)}
              title="Click to view Account / Auth Modal"
              className="relative group p-0.5 rounded-full transition-transform duration-300 hover:scale-105 active:scale-95"
            >
              {/* Circular avatar badge displaying a 3D stylized character inside a green circular frame */}
              <div className="w-12 h-12 rounded-full p-[2.5px] bg-gradient-to-tr from-[#1A3D11] via-[#228B22] to-[#B8FF00] shadow-[0_0_16px_rgba(34,139,34,0.6)]">
                <div className="w-full h-full rounded-full overflow-hidden bg-gradient-to-b from-[#1a2f14] to-[#0a1208] flex items-center justify-center relative border border-white/30">
                  {/* 3D Stylized Character SVG */}
                  <svg viewBox="0 0 100 100" className="w-full h-full transform group-hover:scale-110 transition-transform duration-300">
                    <defs>
                      <linearGradient id="skinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f5d0b0" />
                        <stop offset="60%" stopColor="#d89f78" />
                        <stop offset="100%" stopColor="#7a462b" />
                      </linearGradient>
                      <linearGradient id="visorGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#B8FF00" />
                        <stop offset="50%" stopColor="#00FFC2" />
                        <stop offset="100%" stopColor="#FFE600" />
                      </linearGradient>
                      <linearGradient id="hairGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#111111" />
                        <stop offset="100%" stopColor="#2B4C0A" />
                      </linearGradient>
                    </defs>
                    {/* Background Glow */}
                    <circle cx="50" cy="50" r="45" fill="#0D200E" />
                    {/* Hair Back */}
                    <path d="M22 45 C22 20, 78 20, 78 45 C78 65, 75 75, 75 75 L25 75 Z" fill="url(#hairGrad)" />
                    {/* Head 3D shading */}
                    <ellipse cx="50" cy="54" rx="26" ry="30" fill="url(#skinGrad)" />
                    {/* Ears */}
                    <ellipse cx="22" cy="55" rx="5" ry="9" fill="#d89f78" />
                    <ellipse cx="78" cy="55" rx="5" ry="9" fill="#d89f78" />
                    {/* Cyber Visor 3D glasses */}
                    <rect x="25" y="44" width="50" height="15" rx="7" fill="url(#visorGrad)" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.5))" />
                    <path d="M28 47 L72 47" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
                    {/* Nose shadow & Mouth */}
                    <ellipse cx="50" cy="67" rx="3" ry="2" fill="#9e6648" />
                    <path d="M43 74 Q50 78 57 74" stroke="#5a2f1c" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                    {/* Cyber Earring & Accents */}
                    <circle cx="21" cy="60" r="2.5" fill="#FFE600" />
                    <circle cx="79" cy="60" r="2.5" fill="#B8FF00" />
                  </svg>
                  {/* Glowing Status Dot */}
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#B8FF00] border-2 border-[#0A0A0A] rounded-full shadow-[0_0_8px_#B8FF00]" />
                </div>
              </div>
            </button>
            <button
              onClick={() => setIsAuthenticated(false)}
              title="Sign Out"
              className="p-2 rounded-full glass hover:bg-white/20 transition-all text-white/60 hover:text-red-400"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsAuthOpen(true)}
            className="glass px-5 py-2.5 rounded-full font-mono-ui text-xs font-bold uppercase tracking-wider flex items-center gap-2 hover:border-[#B8FF00] hover:text-[#B8FF00] transition-all hover:scale-105 active:scale-95"
          >
            <User className="w-4 h-4" />
            <span>SIGN IN</span>
          </button>
        )}
      </div>
    </header>
  );
};