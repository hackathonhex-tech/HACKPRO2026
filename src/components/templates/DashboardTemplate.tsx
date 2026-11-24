"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeToggle } from '../atoms/ThemeToggle';
import { BrandLogo } from '../atoms/BrandLogo';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
}

interface DashboardTemplateProps {
  children: React.ReactNode;
  navItems: NavItem[];
  title: string;
  subtitle: string;
  titleIcon?: React.ElementType;
  titleColorClass?: string;
  activeColorClass?: string;
}

export const DashboardTemplate: React.FC<DashboardTemplateProps> = ({ 
  children, navItems, title, subtitle, 
  titleColorClass = "from-indigo-500 to-cyan-500",
  activeColorClass = "bg-indigo-600 dark:bg-indigo-500 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10"
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('judge_mode');
        document.cookie = 'judge_mode=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      }
    } catch {}
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    router.push('/');
  };

  // Splitting activeColorClass for specific elements
  const activeTextClass = activeColorClass.includes('emerald') ? 'text-emerald-600 dark:text-emerald-400' 
                        : activeColorClass.includes('amber') ? 'text-amber-600 dark:text-amber-400'
                        : 'text-[#3760F8] dark:text-[#92B1FD]';
  
  const activeBgClass = activeColorClass.includes('emerald') ? 'bg-emerald-50 dark:bg-emerald-500/10'
                      : activeColorClass.includes('amber') ? 'bg-amber-50 dark:bg-amber-500/10'
                      : 'bg-[#3760F8]/10 dark:bg-[#3760F8]/20';

  const activeIndicatorClass = activeColorClass.includes('emerald') ? 'bg-emerald-500'
                             : activeColorClass.includes('amber') ? 'bg-amber-500'
                             : 'bg-[#3760F8]';

  return (
    <div className="h-screen bg-slate-50 dark:bg-slate-900 flex flex-col font-sans transition-colors duration-300 overflow-hidden">
      {/* Mobile Top Bar */}
      <div className="md:hidden bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-3 flex items-center justify-between z-20">
        <div className="flex items-center min-w-0 space-x-2.5">
          <Link href="/">
            <BrandLogo size="xs" />
          </Link>
          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />
          <h1 className="text-base font-black text-[#3760F8] dark:text-[#5F8AFA] truncate">
            {title}
          </h1>
        </div>
        <div className="flex items-center space-x-2">
          <ThemeToggle />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Horizontal Quick-Nav Scroll Bar */}
      <div className="md:hidden bg-white/80 dark:bg-slate-800/80 backdrop-blur border-b border-slate-200 dark:border-slate-700 px-3 py-2 overflow-x-auto no-scrollbar z-10 flex space-x-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/admin/dashboard' && item.href !== '/judge/dashboard' && item.href !== '/team/dashboard');
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 ${
                isActive
                  ? `${activeTextClass} ${activeBgClass} shadow-sm border border-slate-200/40 dark:border-slate-700/40`
                  : 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <item.icon className={`w-4 h-4 mr-1.5 ${isActive ? activeTextClass : 'text-slate-400'}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>

      {/* Mobile Slide-Over Menu Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-4/5 max-w-xs bg-white dark:bg-slate-800 shadow-2xl flex flex-col h-full z-10 border-r border-slate-200 dark:border-slate-700"
            >
              <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                <div>
                  <Link href="/" className="inline-block mb-2" onClick={() => setMobileMenuOpen(false)}>
                    <BrandLogo size="sm" />
                  </Link>
                  <h2 className={`text-lg font-black text-transparent bg-clip-text bg-gradient-to-r ${titleColorClass}`}>
                    {title}
                  </h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{subtitle}</p>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                {navItems.map((item) => {
                  const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/admin/dashboard' && item.href !== '/judge/dashboard' && item.href !== '/team/dashboard');
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center px-4 py-3 rounded-xl text-sm transition-all ${
                        isActive
                          ? `${activeTextClass} font-bold ${activeBgClass}`
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 font-medium'
                      }`}
                    >
                      <item.icon className={`w-5 h-5 mr-3 ${isActive ? activeTextClass : 'text-slate-400'}`} />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>

              <div className="p-4 border-t border-slate-100 dark:border-slate-700 space-y-3">
                <button
                  onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
                  className="w-full flex items-center justify-center px-4 py-3 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl font-bold text-sm"
                >
                  <LogOut className="w-5 h-5 mr-2" />
                  Sign Out
                </button>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row flex-1 overflow-hidden h-full min-h-0">
        {/* Desktop Sidebar - Fixed & non-scrolling with page */}
        <motion.aside 
          initial={{ x: -250, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="hidden md:flex w-72 bg-white dark:bg-slate-800 shadow-xl dark:shadow-slate-900/50 flex-shrink-0 flex-col z-20 border-r border-slate-200 dark:border-slate-700/50 h-full sticky top-0 overflow-hidden"
        >
          {/* Sidebar Brand Header aligned with Image 2 */}
          <div className="p-6 pb-5 border-b border-slate-100 dark:border-slate-700/50 flex-shrink-0">
            <Link href="/" className="inline-block mb-3 hover:opacity-90 transition-opacity">
              <BrandLogo size="md" />
            </Link>
            <h2 className="text-xl font-black text-[#3760F8] dark:text-[#5F8AFA] tracking-tight">
              {title}
            </h2>
            <p className="text-[11px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest">{subtitle}</p>
          </div>
        
          <nav className="flex-1 overflow-y-auto mt-4 px-3 space-y-1">
            {navItems.map((item, idx) => {
              const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/admin/dashboard' && item.href !== '/judge/dashboard' && item.href !== '/team/dashboard');
              return (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * idx }}
                >
                  <Link href={item.href}
                    className={`flex items-center px-4 py-3 rounded-xl transition-all relative overflow-hidden group ${
                      isActive 
                        ? `${activeTextClass} font-bold ${activeBgClass} shadow-sm` 
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 font-medium'
                    }`}
                  >
                    {isActive && (
                      <motion.div layoutId="active-nav" className={`absolute left-0 top-1.5 bottom-1.5 w-1.5 rounded-r-full ${activeIndicatorClass}`} />
                    )}
                    <item.icon className={`w-5 h-5 mr-3 transition-colors ${isActive ? activeTextClass : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`} />
                    <span className="relative z-10 text-sm">{item.name}</span>
                  </Link>
                </motion.div>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-100 dark:border-slate-700/50 space-y-3 flex-shrink-0">
            <div className="flex justify-center">
              <ThemeToggle />
            </div>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center px-4 py-2.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors font-bold text-sm"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </button>
          </div>
        </motion.aside>

        {/* Main Content Area - Independently scrollable */}
        <main className="flex-1 p-6 sm:p-8 md:p-10 overflow-y-auto relative h-full">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-full"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
};

