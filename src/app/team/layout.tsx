"use client";

import React, { useEffect, useState } from 'react';
import { Rocket, LayoutDashboard, UploadCloud, FileText, BarChart, Lock, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { DashboardTemplate } from '@/components/templates/DashboardTemplate';
import { meAction, logoutAction } from '@/server/actions/user.actions';
import { getTeamByUniqueIdAction } from '@/server/actions/team.actions';
import { getActiveRoundAction } from '@/server/actions/round.actions';

const teamNav = [
  { name: 'My Dashboard', href: '/team/dashboard', icon: LayoutDashboard },
  { name: 'Problem Statement', href: '/team/problem-statement', icon: FileText },
  { name: 'Submit Project', href: '/team/submit', icon: UploadCloud },
  { name: 'Live Leaderboard', href: '/leaderboard', icon: BarChart },
];

export default function TeamLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [restricted, setRestricted] = useState<{ isRestricted: boolean; teamName?: string; teamUniqueId?: string; roundName?: string }>({ isRestricted: false });
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkQualification() {
      setChecking(true);
      const auth = await meAction();
      if (auth.success && (auth as any).user?.uniqueId && (auth as any).user?.role === 'team') {
        const [teamRes, roundRes] = await Promise.all([
          getTeamByUniqueIdAction((auth as any).user.uniqueId),
          getActiveRoundAction()
        ]);

        if (teamRes.success && (teamRes as any).team && roundRes.success && (roundRes as any).round) {
          const teamObj = (teamRes as any).team;
          const roundObj = (roundRes as any).round;

          if (roundObj && Array.isArray(roundObj.allowedTeamIds)) {
            const allowed = roundObj.allowedTeamIds;
            const teamIdStr = String(teamObj._id);
            const isAllowed = allowed.some((id: any) => String(id._id || id) === teamIdStr);

            if (!isAllowed) {
              setRestricted({
                isRestricted: true,
                teamName: teamObj.name,
                teamUniqueId: teamObj.uniqueId,
                roundName: roundObj.name
              });
            }
          }
        }
      }
      setChecking(false);
    }

    checkQualification();
  }, []);

  const handleLogout = async () => {
    await logoutAction();
    router.push('/');
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (restricted.isRestricted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-6">
        <div className="max-w-md w-full text-center bg-slate-800 border border-slate-700 p-8 rounded-3xl shadow-2xl space-y-5">
          <div className="w-16 h-16 bg-amber-500/10 text-amber-400 rounded-2xl flex items-center justify-center mx-auto border border-amber-500/20 shadow-inner">
            <Lock className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black mb-1">Access Restricted</h1>
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-400">Team Not Qualified</p>
          </div>
          
          <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-700/60 text-left text-xs space-y-2">
            <p className="text-slate-300">
              Your team <strong className="text-white">{restricted.teamName}</strong> (<span className="font-mono text-emerald-400">{restricted.teamUniqueId}</span>) is not selected for <strong className="text-amber-300">{restricted.roundName}</strong>.
            </p>
            <p className="text-slate-400 leading-relaxed pt-1">
              Admin qualification rules are active for this live round. Only selected teams are permitted to log in or enter the portal.
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-red-600/30 flex items-center justify-center space-x-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <DashboardTemplate
      title="Team Portal"
      subtitle="Participant Zone"
      titleIcon={Rocket}
      navItems={teamNav}
      titleColorClass="text-[#3760F8]"
      activeColorClass="bg-[#3760F8]"
    >
      {children}
    </DashboardTemplate>
  );
}
