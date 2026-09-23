'use client';

import { useState, useEffect } from 'react';

export type Theme = 'dark' | 'light';

export const tk = {
  dark: {
    // Backgrounds & Surfaces
    pagebg: '#07090e',
    pageBg: '#080a0f', // camelCase alias
    sidebarbg: '#0b0d13',
    headerbg: 'rgba(11,13,19,0.96)',
    headerBg: '#0c0e14', // camelCase alias
    bottombarbg: 'rgba(11,13,19,0.97)',
    contentBg: '#07090e',
    filterbg: '#0b0d13',
    filterBg: 'rgba(255,255,255,0.025)',
    modalBg: '#0f1117',
    tooltipBg: '#13161f',
    optionBg: '#0b0d13',
    
    // Typography
    text: 'rgba(255,255,255,0.92)',
    textSub: 'rgba(255,255,255,0.52)',
    textMuted: 'rgba(255,255,255,0.28)',
    textFaint: 'rgba(255,255,255,0.13)',
    textNav: 'rgba(255,255,255,0.36)',

    // Borders
    border: 'rgba(255,255,255,0.055)',
    borderLight: 'rgba(255,255,255,0.05)',
    tooltipBorder: 'rgba(255,255,255,0.09)',
    
    // Inputs, Buttons, & Controls
    inputBg: 'rgba(255,255,255,0.035)',
    inputBorder: 'rgba(255,255,255,0.08)',
    borderInput: 'rgba(255,255,255,0.09)',
    selectBg: '#0c0e14',
    toggleBg: 'rgba(255,255,255,0.055)',
    toggleBorder: 'rgba(255,255,255,0.09)',
    scrollbar: 'rgba(255,255,255,0.08)',
    btnBg: 'rgba(37,99,235,0.12)',
    btnBorder: 'rgba(59,130,246,0.3)',
    btnText: '#93c5fd',

    // Navigation (Active States)
    navActiveBg: 'rgba(28,151,6,0.11)',
    navActiveText: '#4ade80',
    navActiveDot: '#1c9706',

    // Cards
    cardbg: '#0e1118',
    cardBg: '#111318', // camelCase alias
    borderCard: 'rgba(255,255,255,0.075)',
    shadowCard: 'none',
    shadow: 'none',

    // Card Variants
    card1bg: '#0d1a28', card1border: '#1a3a5c', card1text: '#7eb8f7', card1accent: '#3b82f6',
    card2bg: '#0a1d14', card2border: '#1a4530', card2text: '#5edba8', card2accent: '#10b981',
    card3bg: '#1a1108', card3border: '#3d2b08', card3text: '#f5d060', card3accent: '#f59e0b',

    // Chips
    chipBlue:   { bg: 'rgba(59,130,246,0.11)',  text: '#93c5fd', border: 'rgba(59,130,246,0.25)' },
    chipSlate:  { bg: 'rgba(100,116,139,0.11)', text: '#cbd5e1', border: 'rgba(100,116,139,0.25)' },
    chipOrange: { bg: 'rgba(249,115,22,0.11)',  text: '#fb923c', border: 'rgba(249,115,22,0.25)' },
    chipGreen:  { bg: 'rgba(16,185,129,0.11)',  text: '#34d399', border: 'rgba(16,185,129,0.25)' },

    // Feedback & Alerts
    posBg: 'rgba(16,185,129,0.09)',   posText: '#34d399', posBorder: 'rgba(16,185,129,0.2)',
    negBg: 'rgba(239,68,68,0.09)',    negText: '#f87171', negBorder: 'rgba(239,68,68,0.2)',
    warnBg: 'rgba(245,158,11,0.07)',  warnText: '#fbbf24', warnBorder: 'rgba(245,158,11,0.18)',
    red:        { bg: 'rgba(239,68,68,0.08)',   text: '#fca5a5', border: 'rgba(239,68,68,0.18)' },
    infoBg: 'rgba(37,99,235,0.07)',   infoText: 'rgba(147,197,253,0.85)', infoBorder: 'rgba(59,130,246,0.3)',

    // Data Tables / Grids
    theadBg: '#fef08a',
    theadText: 'rgb(0, 0, 0)',
    tfootBg: '#f1e71b',
    rowAlt: 'rgba(255,255,255,0.015)',
    rowHover: 'rgba(255,255,255,0.03)',
    gridStroke: 'rgba(255,255,255,0.04)',
    sortActive: '#3b82f6',
    sortInactive: 'rgba(148,163,184,0.4)',
    summaryBg: 'rgba(255,255,255,0.02)',
    summaryBorder: 'rgba(255,255,255,0.06)',
    dragHint: 'rgba(59,130,246,0.18)',
  },

  light: {
    // Backgrounds & Surfaces
    pagebg: '#eef1f7',
    pageBg: '#f0f2f7', // camelCase alias
    sidebarbg: '#ffffff',
    headerbg: 'rgba(255,255,255,0.96)',
    headerBg: '#ffffff', // camelCase alias
    bottombarbg: 'rgba(255,255,255,0.97)',
    contentBg: '#eef1f7',
    filterbg: '#ffffff',
    filterBg: '#f8fafc',
    modalBg: '#ffffff',
    tooltipBg: '#ffffff',
    optionBg: '#ffffff',
    
    // Typography
    text: '#0f172a',
    textSub: '#475569',
    textMuted: '#94a3b8',
    textFaint: '#cbd5e1',
    textNav: '#64748b',

    // Borders
    border: 'rgba(0,0,0,0.065)',
    borderLight: 'rgba(0,0,0,0.05)',
    tooltipBorder: 'rgba(0,0,0,0.1)',
    
    // Inputs, Buttons, & Controls
    inputBg: 'rgba(0,0,0,0.03)',
    inputBorder: 'rgba(0,0,0,0.1)',
    borderInput: 'rgba(0,0,0,0.1)',
    selectBg: '#ffffff',
    toggleBg: '#f1f5f9',
    toggleBorder: 'rgba(0,0,0,0.09)',
    scrollbar: 'rgba(0,0,0,0.12)',
    btnBg: 'rgba(37,99,235,0.08)',
    btnBorder: 'rgba(37,99,235,0.25)',
    btnText: '#1d4ed8',

    // Navigation (Active States)
    navActiveBg: 'rgba(28,151,6,0.07)',
    navActiveText: '#15803d',
    navActiveDot: '#1c9706',

    // Cards
    cardbg: '#ffffff',
    cardBg: '#ffffff', // camelCase alias
    borderCard: 'rgba(0,0,0,0.08)',
    shadowCard: '0 1px 3px rgba(0,0,0,0.06)',
    shadow: '0 1px 8px rgba(0,0,0,0.07)',

    // Card Variants
    card1bg: '#eff6ff', card1border: '#bfdbfe', card1text: '#1d4ed8', card1accent: '#3b82f6',
    card2bg: '#f0fdf4', card2border: '#bbf7d0', card2text: '#15803d', card2accent: '#10b981',
    card3bg: '#fefce8', card3border: '#fde68a', card3text: '#92400e', card3accent: '#f59e0b',

    // Chips
    chipBlue:   { bg: 'rgba(37,99,235,0.07)',   text: '#1d4ed8', border: 'rgba(37,99,235,0.2)' },
    chipSlate:  { bg: 'rgba(100,116,139,0.07)', text: '#475569', border: 'rgba(100,116,139,0.16)' },
    chipOrange: { bg: 'rgba(234,88,12,0.07)',   text: '#c2410c', border: 'rgba(234,88,12,0.16)' },
    chipGreen:  { bg: 'rgba(22,163,74,0.07)',   text: '#15803d', border: 'rgba(22,163,74,0.16)' },

    // Feedback & Alerts
    posBg: '#f0fdf4',   posText: '#15803d', posBorder: '#bbf7d0',
    negBg: '#fef2f2',   negText: '#b91c1c', negBorder: '#fecaca',
    warnBg: '#fffbeb',  warnText: '#92400e', warnBorder: '#fde68a',
    red:        { bg: '#fef2f2', text: '#b91c1c', border: '#fecaca' },
    infoBg: 'rgba(37,99,235,0.08)', infoText: '#1d4ed8', infoBorder: 'rgba(37,99,235,0.25)',

    // Data Tables / Grids
    theadBg: '#fef08a',
    theadText: 'rgb(0, 0, 0)',
    tfootBg: '#f1e71b',
    rowAlt: 'rgba(0,0,0,0.018)',
    rowHover: 'rgba(0,0,0,0.03)',
    gridStroke: 'rgba(0,0,0,0.045)',
    sortActive: '#2563eb',
    sortInactive: '#cbd5e1',
    summaryBg: '#f8fafc',
    summaryBorder: 'rgba(0,0,0,0.07)',
    dragHint: 'rgba(37,99,235,0.08)',
  },
} as const;

// Chart Palette (Duotone violet + teal)
export const PREV_COLOR = '#2563eb';
export const CURR_COLOR = '#10b981';
export const POS_COLOR  = '#10b981';
export const NEG_COLOR  = '#ef4444';

// Global Constants
export const YEARS = [2022, 2023, 2024, 2025, 2026, 2027, 2028];
export const WEEKS = Array.from({ length: 52 }, (_, i) => i + 1);

export const UNIT_OPTIONS = [
  { value: 'units_dos',  label: 'Dos',   fullLabel: 'Jual (Dos Net)'  },
  { value: 'units_bks',  label: 'Bks',   fullLabel: 'Jual (Bks Net)'  },
  { value: 'units_slop', label: 'Slop',  fullLabel: 'Jual (Slop Net)' },
  { value: 'units_bal',  label: 'Bal',   fullLabel: 'Jual (Bal Net)'  },
  { value: 'omzet',      label: 'Omzet', fullLabel: 'Omzet (Rp)'      },
];

// Hooks
export function useBreakpoint() {
  const [bp, setBp] = useState({ isMobile: false, isTablet: false });
  
  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      setBp({ isMobile: w < 768, isTablet: w >= 768 && w < 1024 });
    };
    
    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return bp;
}