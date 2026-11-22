"use client";
import React, { useEffect, useState } from 'react';
import { Gavel, LayoutDashboard, BarChart, Scan } from 'lucide-react';
import { DashboardTemplate } from '@/components/templates/DashboardTemplate';
import { getMeAction } from '@/server/actions/auth.actions';

const baseJudgeNav = [
  { name: 'Dashboard', href: '/judge/dashboard', icon: LayoutDashboard },
  { name: 'Live Leaderboard', href: '/leaderboard', icon: BarChart },
];

const virtualJudgeNav = [
  { name: 'Dashboard', href: '/judge/dashboard', icon: LayoutDashboard },
  { name: 'QR Scanner', href: '/judge/scanner', icon: Scan },
  { name: 'Live Leaderboard', href: '/leaderboard', icon: BarChart },
];

function getInitialNav() {
  if (typeof window !== 'undefined') {
    try {
      const mode = localStorage.getItem('judge_mode');
      if (mode === 'offline') return baseJudgeNav;
      if (mode === 'virtual') return virtualJudgeNav;
      const match = document.cookie.match(/(?:^|;\s*)judge_mode=([^;]+)/);
      if (match && match[1] === 'offline') return baseJudgeNav;
      if (match && match[1] === 'virtual') return virtualJudgeNav;
    } catch {}
  }
  return baseJudgeNav;
}

export default function JudgeLayout({ children }: { children: React.ReactNode }) {
  const [navItems, setNavItems] = useState(getInitialNav);

  useEffect(() => {
    async function checkJudgeMode() {
      try {
        const res = await getMeAction();
        if (res.success && res.user) {
          const mode = (res.user as any).assessmentMode || 'virtual';
          if (typeof window !== 'undefined') {
            localStorage.setItem('judge_mode', mode);
          }
          if (mode === 'offline') {
            setNavItems(baseJudgeNav);
          } else {
            setNavItems(virtualJudgeNav);
          }
        }
      } catch (err) {
        console.error('Failed to load judge assessment mode:', err);
      }
    }
    checkJudgeMode();
  }, []);

  return (
    <DashboardTemplate
      title="Judge Portal"
      subtitle="Evaluation Panel"
      titleIcon={Gavel}
      navItems={navItems}
      titleColorClass="text-[#3760F8]"
      activeColorClass="bg-[#3760F8]"
    >
      {children}
    </DashboardTemplate>
  );
}
