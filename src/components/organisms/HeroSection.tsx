"use client";
import React, { useState, useEffect, useSyncExternalStore } from 'react';
import Image from 'next/image';
import { motion, Variants } from 'framer-motion';
import { ArrowRight, Code2, Rocket, Users, Trophy } from 'lucide-react';
import Link from 'next/link';
import { getPublicSettingsAction } from '@/server/actions/settings.actions';
import { BrandLogo } from '../atoms/BrandLogo';

export const HeroSection: React.FC = () => {
  const isMounted = useSyncExternalStore(() => () => {}, () => true, () => false);
  const [isRegistrationOpen, setIsRegistrationOpen] = useState<boolean>(true);

  useEffect(() => {
    getPublicSettingsAction()
      .then((res: any) => {
        if (res.success && 'settings' in res && res.settings) {
          setIsRegistrationOpen(res.settings.isRegistrationOpen ?? true);
        }
      })
      .catch(() => setIsRegistrationOpen(true));
  }, []);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } }
  };

  return (
    <motion.div
      className="lg:col-span-7 space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      suppressHydrationWarning
    >
      <motion.div variants={itemVariants} className="flex items-center">
        <BrandLogo size="lg" />
      </motion.div>

      <motion.h1 variants={itemVariants} suppressHydrationWarning className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.1]">
        Code. Compete.{' '}
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3760F8] via-[#2546ED] to-cyan-500">
          Conquer.
        </span>
      </motion.h1>

      <motion.p variants={itemVariants} suppressHydrationWarning className="text-base sm:text-lg lg:text-xl text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed font-medium">
        The ultimate platform to coordinate, evaluate, and showcase hackathon projects. Register your team, submit deliverables, and track real-time rankings.
      </motion.p>

      <motion.div variants={itemVariants} suppressHydrationWarning className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 pt-2 sm:pt-4">
        {isMounted && isRegistrationOpen === false ? (
          <div className="group relative inline-flex items-center justify-center px-6 sm:px-8 py-3.5 text-sm sm:text-base font-bold text-slate-500 bg-slate-200 dark:bg-slate-800 rounded-xl overflow-hidden cursor-not-allowed">
            <span className="relative z-10 flex items-center">
              Registration Closed
            </span>
          </div>
        ) : (
          <Link href="/register" className="group relative inline-flex items-center justify-center px-6 sm:px-8 py-3.5 text-sm sm:text-base font-bold text-white bg-[#3760F8] hover:bg-[#2546ED] rounded-xl overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-[#3760F8]/30">
            <span className="relative z-10 flex items-center">
              Register Your Team <Rocket className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
          </Link>
        )}
        <Link href="/leaderboard" className="inline-flex items-center justify-center px-6 sm:px-8 py-3.5 text-sm sm:text-base font-bold text-white bg-[#3760F8] hover:bg-[#2546ED] rounded-xl transition-all shadow-lg shadow-[#3760F8]/30 active:scale-[0.98]">
          Live Leaderboard <Trophy className="ml-2 w-5 h-5 text-white" />
        </Link>
        <a href="#login-section" className="lg:hidden inline-flex items-center justify-center px-6 sm:px-8 py-3.5 text-sm sm:text-base font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm">
          Sign In
        </a>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-3 gap-6 pt-10 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-[#3760F8]/10 text-[#3760F8] rounded-xl"><Code2 className="w-5 h-5" /></div>
          <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Live Submission</span>
        </div>
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-[#3760F8]/10 text-[#3760F8] rounded-xl"><Users className="w-5 h-5" /></div>
          <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Team Management</span>
        </div>
        <div className="flex items-center space-x-3 hidden md:flex">
          <div className="p-2.5 bg-[#3760F8]/10 text-[#3760F8] rounded-xl"><ArrowRight className="w-5 h-5" /></div>
          <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Dynamic Rubrics</span>
        </div>
      </motion.div>
    </motion.div>
  );
};

