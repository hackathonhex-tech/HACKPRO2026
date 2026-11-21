"use client";

import React, { useState } from 'react';
import { LoadingScreen } from '@/components/molecules/LoadingScreen';

export default function SkeletonPreviewPage() {
  const [variant, setVariant] = useState<'dashboard' | 'table' | 'cards' | 'form'>('dashboard');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 sm:p-10">
      {/* Control Toolbar */}
      <div className="max-w-7xl mx-auto mb-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Skeleton Loading Preview</h1>
          <p className="text-xs text-slate-500 mt-0.5">Toggle variants to inspect the newly implemented skeletal loading screens</p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl">
          {(['dashboard', 'table', 'cards', 'form'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setVariant(v)}
              className={`px-4 py-2 rounded-lg text-xs font-bold capitalize transition-all ${
                variant === v
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Active Skeleton View */}
      <div className="max-w-7xl mx-auto">
        <LoadingScreen variant={variant} />
      </div>
    </div>
  );
}
