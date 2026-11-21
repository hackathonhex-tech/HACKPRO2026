"use client";

import { useEffect, useState, useCallback } from 'react';
import { AdminDashboardBoard } from '@/components/organisms/AdminDashboardBoard';
import { LoadingScreen } from '@/components/molecules/LoadingScreen';
import { getTeamsAction } from '@/server/actions/admin.team.actions';
import { getJudgesAction } from '@/server/actions/judge.actions';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ totalTeams: 0, totalJudges: 0, checkedIn: 0, totalMembers: 0, membersPresent: 0 });
  const [trackData, setTrackData] = useState<{track: string, count: number}[]>([]);
  const [loading, setLoading] = useState(true);

  const [permissions, setPermissions] = useState<string[]>(['admin']); // default assume admin

  const fetchStats = useCallback(async () => {
    setLoading(true);
    
    // First get current user
    const { getMeAction } = await import('@/server/actions/auth.actions');
    const meRes = await getMeAction();
    let userPerms = ['admin'];
    
    if (meRes.success && meRes.user) {
      if ((meRes.user as any).role !== 'admin') {
        userPerms = (meRes.user as any).permissions || [];
      }
      setPermissions(userPerms);
    }

    const [teamRes, judgeRes] = await Promise.all([
      getTeamsAction(),
      getJudgesAction()
    ]);

    if (teamRes.success && teamRes.teams) {
      const teams = teamRes.teams;
      const totalMembers = teams.reduce((acc: number, t: any) => acc + (t.members?.length || 1), 0);
      const membersPresent = teams.reduce((acc: number, t: any) => {
        // Only count members array (which includes the lead) to avoid double counting. 
        // Fallback to checking t.attendance if members array is empty.
        if (t.members && t.members.length > 0) {
          return acc + t.members.filter((m: any) => m.attendance).length;
        }
        return acc + (t.attendance ? 1 : 0);
      }, 0);
      
      // Build track data
      const trackMap: Record<string, number> = {};
      teams.forEach((t: any) => {
        const track = t.problemStatementId?.track || 'Unassigned';
        trackMap[track] = (trackMap[track] || 0) + 1;
      });
      const tracks = Object.entries(trackMap).map(([track, count]) => ({ track, count })).sort((a, b) => b.count - a.count);

      setStats({
        totalTeams: teams.length,
        totalJudges: judgeRes.success && judgeRes.judges ? judgeRes.judges.length : 0,
        checkedIn: teams.filter((t: any) => t.attendance).length,
        totalMembers,
        membersPresent
      });
      setTrackData(tracks);
    } else if (judgeRes.success && judgeRes.judges) {
      // If team fetch failed (e.g. no permission) but judge fetch succeeded
      setStats(prev => ({
        ...prev,
        totalJudges: judgeRes.judges.length
      }));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading) {
    return <LoadingScreen variant="dashboard" />;
  }

  return <AdminDashboardBoard stats={stats} trackData={trackData} permissions={permissions} />;
}
