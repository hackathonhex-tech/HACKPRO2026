"use client";

import React from 'react';
import Link from 'next/link';
import { ThemeToggle } from '../atoms/ThemeToggle';
import { BrandLogo } from '../atoms/BrandLogo';

export function EventHeader({ compact = false }: { compact?: boolean }) {
  return (
    <header className={`w-full flex items-center justify-between ${compact ? 'py-2 px-4' : 'py-3.5 px-6 sm:px-8'} bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800`}>
      <div className="flex items-center space-x-3">
        <Link href="/" className="flex items-center">
          <BrandLogo size="sm" />
        </Link>
      </div>

      <div className="flex items-center space-x-3">
        <Link href="/leaderboard" className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-[#3760F8] transition-colors">
          Leaderboard
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}
