"use client";
import React from 'react';
import { Gavel, LayoutDashboard, BarChart, Scan } from 'lucide-react';
import { DashboardTemplate } from '@/components/templates/DashboardTemplate';

const judgeNav = [
  { name: 'Dashboard', href: '/judge/dashboard', icon: LayoutDashboard },
  { name: 'QR Scanner', href: '/judge/scanner', icon: Scan },
  { name: 'Live Leaderboard', href: '/leaderboard', icon: BarChart },
];

export default function JudgeLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardTemplate
      title="Judge Portal"
      subtitle="Evaluation Panel"
      titleIcon={Gavel}
      navItems={judgeNav}
      titleColorClass="text-[#3760F8]"
      activeColorClass="bg-[#3760F8]"
    >
      {children}
    </DashboardTemplate>
  );
}
