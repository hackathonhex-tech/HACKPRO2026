"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, Sparkles } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
  submessage?: string;
}

export function LoadingScreen({
  message = "Loading...",
  submessage = "Fetching information from database"
}: LoadingScreenProps) {
  return (
    <div className="min-h-[60vh] w-full flex flex-col items-center justify-center p-6 select-none animate-in fade-in duration-300">
      <div className="relative flex items-center justify-center mb-6">
        {/* Glow backdrop */}
        <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-blue-500/20 rounded-full blur-xl animate-pulse" />
        
        {/* Spinner ring */}
        <div className="relative w-16 h-16 rounded-2xl bg-white dark:bg-slate-900 shadow-xl border border-indigo-100 dark:border-indigo-950/50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin" />
        </div>
      </div>

      <div className="text-center max-w-sm">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center justify-center gap-1.5">
          {message}
          <Sparkles className="w-4 h-4 text-amber-500 animate-bounce inline-block" />
        </h3>
        {submessage && (
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
            {submessage}
          </p>
        )}
      </div>

      {/* Subtle Skeleton Placeholder Grid */}
      <div className="w-full max-w-2xl mt-8 space-y-3 opacity-60">
        <div className="h-10 bg-slate-200/70 dark:bg-slate-800/70 rounded-xl animate-pulse" />
        <div className="h-14 bg-slate-200/50 dark:bg-slate-800/50 rounded-xl animate-pulse delay-75" />
        <div className="h-14 bg-slate-200/40 dark:bg-slate-800/40 rounded-xl animate-pulse delay-150" />
      </div>
    </div>
  );
}
