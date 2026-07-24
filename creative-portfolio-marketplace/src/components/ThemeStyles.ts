/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ProfileTheme } from '../types';

export interface ThemeConfig {
  id: ProfileTheme;
  name: string;
  className: string;
  fontFamilyClass: string;
  bgClass: string;
  textClass: string;
  mutedTextClass: string;
  accentBg: string;
  accentText: string;
  accentBorder: string;
  cardBg: string;
  cardBorder: string;
  cardRadius: string;
  buttonClass: string;
  glowEffect?: string;
  badgeClass: string;
  iconBg: string;
}

export const THEME_CONFIGS: Record<ProfileTheme, ThemeConfig> = {
  slate: {
    id: 'slate',
    name: 'Slate Minimal',
    className: 'theme-slate',
    fontFamilyClass: 'font-sans',
    bgClass: 'bg-slate-50',
    textClass: 'text-slate-900',
    mutedTextClass: 'text-slate-500',
    accentBg: 'bg-slate-900',
    accentText: 'text-slate-900',
    accentBorder: 'border-slate-900',
    cardBg: 'bg-white',
    cardBorder: 'border border-slate-100',
    cardRadius: 'rounded-xl',
    buttonClass: 'bg-slate-900 text-white hover:bg-slate-800 transition-colors rounded-lg font-medium',
    badgeClass: 'bg-slate-100 text-slate-800 border border-slate-200/50',
    iconBg: 'bg-slate-100 text-slate-700'
  },
  warm: {
    id: 'warm',
    name: 'Editorial Warmth',
    className: 'theme-warm',
    fontFamilyClass: 'font-serif',
    bgClass: 'bg-[#fbf9f4]', // Warm cream background
    textClass: 'text-[#2e2b26]', // Warm charcoal text
    mutedTextClass: 'text-[#706a5e]',
    accentBg: 'bg-[#8c4f3e]', // Warm terracotta
    accentText: 'text-[#8c4f3e]',
    accentBorder: 'border-[#8c4f3e]',
    cardBg: 'bg-[#f4eee1]', // Light warm beige cards
    cardBorder: 'border border-[#e5dac3]',
    cardRadius: 'rounded-sm',
    buttonClass: 'bg-[#8c4f3e] text-white hover:bg-[#723e30] transition-colors rounded-sm font-medium',
    badgeClass: 'bg-[#ebdcb9] text-[#723e30] border border-[#d6c196]',
    iconBg: 'bg-[#ebdcb9] text-[#8c4f3e]'
  },
  cyber: {
    id: 'cyber',
    name: 'Cyber Tokyo',
    className: 'theme-cyber',
    fontFamilyClass: 'font-mono',
    bgClass: 'bg-black', // Dark background
    textClass: 'text-green-400', // Neon green
    mutedTextClass: 'text-zinc-500',
    accentBg: 'bg-purple-600',
    accentText: 'text-purple-400',
    accentBorder: 'border-green-500/50',
    cardBg: 'bg-zinc-950', // Pitch-black cards
    cardBorder: 'border border-zinc-800 focus-within:border-green-400',
    cardRadius: 'rounded-none',
    buttonClass: 'bg-green-500 text-black hover:bg-green-400 font-bold transition-all border border-green-400',
    glowEffect: 'shadow-[0_0_15px_rgba(34,197,94,0.15)]',
    badgeClass: 'bg-zinc-900 text-green-300 border border-green-500/30',
    iconBg: 'bg-zinc-900 text-green-400'
  },
  brutalist: {
    id: 'brutalist',
    name: 'Brutalist Craft',
    className: 'theme-brutalist',
    fontFamilyClass: 'font-sans font-black',
    bgClass: 'bg-[#ffde47]', // Saturated yellow background
    textClass: 'text-black',
    mutedTextClass: 'text-black/80 font-medium',
    accentBg: 'bg-[#002eff]', // Rich electric blue
    accentText: 'text-black font-extrabold',
    accentBorder: 'border-2 border-black',
    cardBg: 'bg-white',
    cardBorder: 'border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
    cardRadius: 'rounded-none',
    buttonClass: 'bg-[#002eff] text-white hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-bold',
    badgeClass: 'bg-white text-black border-2 border-black font-semibold',
    iconBg: 'bg-white text-black border-2 border-black'
  }
};
