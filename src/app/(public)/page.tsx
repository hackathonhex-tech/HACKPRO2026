"use client";

import { HeroSection } from '@/components/organisms/HeroSection';
import { LoginForm } from '@/components/organisms/LoginForm';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 selection:bg-[#3760F8]/20 relative font-sans transition-colors duration-300">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] rounded-full bg-[#3760F8]/10 blur-[130px] mix-blend-multiply dark:mix-blend-screen" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[#D3FE4F]/15 blur-[130px] mix-blend-multiply dark:mix-blend-screen" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-screen flex flex-col justify-center py-12 lg:py-0">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Hero Content */}
          <HeroSection />

          {/* Right Column: Login Card */}
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
