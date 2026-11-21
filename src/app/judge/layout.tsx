"use client";
import React, { useEffect, useState } from 'react';
import { Gavel, LayoutDashboard, BarChart, Scan } from 'lucide-react';
import { DashboardTemplate } from '@/components/templates/DashboardTemplate';
import { getMeAction } from '@/server/actions/auth.actions';

const defaultJudgeNav = [
  { name: 'Dashboard', href: '/judge/dashboard', icon: LayoutDashboard },
  { name: 'QR Scanner', href: '/judge/scanner', icon: Scan },
  { name: 'Live Leaderboard', href: '/leaderboard', icon: BarChart },
];

export default function JudgeLayout({ children }: { children: React.ReactNode }) {
  const [navItems, setNavItems] = useState(defaultJudgeNav);

  useEffect(() => {
    async function checkJudgeMode() {
      try {
        const res = await getMeAction();
        if (res.success && res.user) {
          const mode = (res.user as any).assessmentMode;
          if (mode === 'offline') {
            setNavItems(defaultJudgeNav.filter(item => item.href !== '/judge/scanner'));
          } else {
            setNavItems(defaultJudgeNav);
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
