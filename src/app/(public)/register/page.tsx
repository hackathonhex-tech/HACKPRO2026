"use client";

import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { ThemeToggle } from '@/components/atoms/ThemeToggle';
import { RegistrationForm } from '@/components/organisms/RegistrationForm';
import { BrandLogo } from '@/components/atoms/BrandLogo';

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 selection:bg-indigo-500/30 font-sans transition-colors duration-300 relative">
      {/* Background Decorative */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none hidden lg:block">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/10 dark:bg-indigo-600/20 blur-[120px] mix-blend-multiply dark:mix-blend-screen" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-teal-600/10 dark:bg-teal-600/20 blur-[120px] mix-blend-multiply dark:mix-blend-screen" />
      </div>

      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <Link href="/" className="inline-flex items-center text-slate-500 hover:text-[#3760F8] font-medium transition-colors">
              <ChevronLeft className="w-4 h-4 mr-1" /> Back to Home
            </Link>
            <BrandLogo size="md" />
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white leading-tight">Register Your Hackathon Team</h1>
          <p className="text-slate-500 mt-2">Fill out all details below. After registration, you&apos;ll receive your Team ID and QR ticket.</p>
        </div>

        <RegistrationForm />
      </div>
    </div>
  );
}
