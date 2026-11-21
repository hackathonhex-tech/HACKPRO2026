"use client";

import React from 'react';

export interface LoadingScreenProps {
  variant?: 'dashboard' | 'table' | 'cards' | 'form' | 'detail' | 'minimal';
  count?: number;
  className?: string;
  message?: string;
  submessage?: string;
}

export function LoadingScreen({
  variant = 'dashboard',
  count = 6,
  className = '',
}: LoadingScreenProps) {
  // Skeleton shimmer base styling
  const shimmer = "animate-pulse bg-slate-200/80 dark:bg-slate-700/60";
  const cardBg = "bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-xs";

  if (variant === 'minimal') {
    return (
      <div className={`space-y-3 w-full py-4 ${className}`}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className={`h-12 w-full rounded-xl ${shimmer}`} style={{ opacity: 1 - i * 0.12 }} />
        ))}
      </div>
    );
  }

  if (variant === 'cards') {
    return (
      <div className={`space-y-6 max-w-7xl mx-auto w-full pb-10 ${className}`}>
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className={`h-8 w-52 rounded-xl ${shimmer}`} />
            <div className={`h-4 w-72 rounded-lg ${shimmer} opacity-70`} />
          </div>
          <div className={`h-10 w-36 rounded-xl ${shimmer}`} />
        </div>

        {/* Search & Filter Bar */}
        <div className={`${cardBg} p-4 flex flex-col sm:flex-row gap-3 items-center justify-between`}>
          <div className={`h-10 w-full sm:w-80 rounded-xl ${shimmer}`} />
          <div className="flex gap-2 w-full sm:w-auto">
            <div className={`h-10 w-28 rounded-xl ${shimmer}`} />
            <div className={`h-10 w-28 rounded-xl ${shimmer}`} />
          </div>
        </div>

        {/* Cards Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className={`${cardBg} p-6 space-y-4`}>
              <div className="flex items-center justify-between">
                <div className={`h-6 w-24 rounded-full ${shimmer}`} />
                <div className={`h-5 w-16 rounded-md ${shimmer} opacity-60`} />
              </div>
              <div className={`h-6 w-3/4 rounded-lg ${shimmer}`} />
              <div className="space-y-2 pt-1">
                <div className={`h-3.5 w-full rounded ${shimmer} opacity-70`} />
                <div className={`h-3.5 w-4/5 rounded ${shimmer} opacity-70`} />
              </div>
              <div className="pt-4 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full ${shimmer}`} />
                  <div className={`h-4 w-20 rounded ${shimmer}`} />
                </div>
                <div className={`h-8 w-20 rounded-lg ${shimmer}`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div className={`space-y-6 max-w-7xl mx-auto w-full pb-10 ${className}`}>
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className={`h-8 w-56 rounded-xl ${shimmer}`} />
            <div className={`h-4 w-80 rounded-lg ${shimmer} opacity-70`} />
          </div>
          <div className="flex gap-3">
            <div className={`h-10 w-32 rounded-xl ${shimmer}`} />
            <div className={`h-10 w-32 rounded-xl ${shimmer}`} />
          </div>
        </div>

        {/* Search & Tabs Bar */}
        <div className={`${cardBg} p-4 flex flex-col sm:flex-row gap-3 items-center justify-between`}>
          <div className={`h-10 w-full sm:w-96 rounded-xl ${shimmer}`} />
          <div className="flex gap-2 w-full sm:w-auto">
            <div className={`h-9 w-24 rounded-xl ${shimmer}`} />
            <div className={`h-9 w-24 rounded-xl ${shimmer}`} />
            <div className={`h-9 w-24 rounded-xl ${shimmer}`} />
          </div>
        </div>

        {/* Table Skeleton */}
        <div className={`${cardBg} overflow-hidden`}>
          {/* Table Header Row */}
          <div className="h-14 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-700/60 flex items-center px-6 gap-6">
            <div className={`h-4 w-12 rounded ${shimmer}`} />
            <div className={`h-4 w-36 rounded ${shimmer}`} />
            <div className={`h-4 w-28 rounded ${shimmer}`} />
            <div className={`h-4 w-24 rounded ${shimmer} hidden sm:block`} />
            <div className={`h-4 w-20 rounded ${shimmer} ml-auto`} />
          </div>
          {/* Table Rows */}
          <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="p-5 flex items-center gap-6">
                <div className={`w-10 h-10 rounded-full ${shimmer} shrink-0`} />
                <div className="space-y-2 flex-1">
                  <div className={`h-4.5 w-44 rounded-md ${shimmer}`} />
                  <div className={`h-3 w-64 rounded ${shimmer} opacity-60`} />
                </div>
                <div className={`h-6 w-24 rounded-full ${shimmer} hidden sm:block`} />
                <div className={`h-6 w-20 rounded-full ${shimmer} hidden md:block`} />
                <div className={`h-8 w-20 rounded-lg ${shimmer} shrink-0`} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'form' || variant === 'detail') {
    return (
      <div className={`space-y-6 max-w-5xl mx-auto w-full pb-10 ${className}`}>
        {/* Header Skeleton */}
        <div className="space-y-2">
          <div className={`h-8 w-60 rounded-xl ${shimmer}`} />
          <div className={`h-4 w-80 rounded-lg ${shimmer} opacity-70`} />
        </div>

        {/* Form Card 1 */}
        <div className={`${cardBg} p-6 sm:p-8 space-y-6`}>
          <div className={`h-6 w-44 rounded-lg ${shimmer}`} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <div className={`h-4 w-24 rounded ${shimmer}`} />
              <div className={`h-11 w-full rounded-xl ${shimmer}`} />
            </div>
            <div className="space-y-2">
              <div className={`h-4 w-28 rounded ${shimmer}`} />
              <div className={`h-11 w-full rounded-xl ${shimmer}`} />
            </div>
          </div>
          <div className="space-y-2">
            <div className={`h-4 w-32 rounded ${shimmer}`} />
            <div className={`h-24 w-full rounded-xl ${shimmer}`} />
          </div>
        </div>

        {/* Form Card 2 */}
        <div className={`${cardBg} p-6 sm:p-8 space-y-5`}>
          <div className={`h-6 w-36 rounded-lg ${shimmer}`} />
          <div className="space-y-3">
            <div className={`h-12 w-full rounded-xl ${shimmer}`} />
            <div className={`h-12 w-full rounded-xl ${shimmer} opacity-80`} />
            <div className={`h-12 w-full rounded-xl ${shimmer} opacity-60`} />
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <div className={`h-10 w-24 rounded-xl ${shimmer}`} />
            <div className={`h-10 w-32 rounded-xl ${shimmer}`} />
          </div>
        </div>
      </div>
    );
  }

  // Default: Dashboard variant (Metrics cards + split panels)
  return (
    <div className={`space-y-6 max-w-7xl mx-auto w-full pb-10 ${className}`}>
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className={`h-8 w-56 rounded-xl ${shimmer}`} />
          <div className={`h-4 w-72 rounded-lg ${shimmer} opacity-70`} />
        </div>
        <div className="flex gap-3">
          <div className={`h-10 w-28 rounded-xl ${shimmer}`} />
          <div className={`h-10 w-36 rounded-xl ${shimmer}`} />
        </div>
      </div>

      {/* 4 Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={`${cardBg} p-5 space-y-3`}>
            <div className="flex items-center justify-between">
              <div className={`h-4 w-20 rounded ${shimmer}`} />
              <div className={`w-8 h-8 rounded-xl ${shimmer}`} />
            </div>
            <div className={`h-8 w-24 rounded-lg ${shimmer}`} />
            <div className={`h-3 w-32 rounded ${shimmer} opacity-70`} />
          </div>
        ))}
      </div>

      {/* Split Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart / Overview Panel */}
        <div className={`lg:col-span-2 ${cardBg} p-6 space-y-4`}>
          <div className="flex items-center justify-between">
            <div className={`h-6 w-40 rounded-lg ${shimmer}`} />
            <div className={`h-7 w-24 rounded-lg ${shimmer}`} />
          </div>
          <div className={`h-64 w-full rounded-xl ${shimmer} opacity-80`} />
        </div>

        {/* Side Panel / Recent Activity */}
        <div className={`${cardBg} p-6 space-y-4`}>
          <div className={`h-6 w-32 rounded-lg ${shimmer}`} />
          <div className="space-y-3 pt-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl ${shimmer} shrink-0`} />
                <div className="space-y-1.5 flex-1">
                  <div className={`h-3.5 w-3/4 rounded ${shimmer}`} />
                  <div className={`h-2.5 w-1/2 rounded ${shimmer} opacity-60`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
