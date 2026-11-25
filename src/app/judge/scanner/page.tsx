"use client";

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ScannerBoard } from '@/components/organisms/ScannerBoard';
import { getTeamByUniqueIdAction } from '@/server/actions/team.actions';
import { updateTeamAttendanceBatchAction } from '@/server/actions/admin.team.actions';
import { getMeAction } from '@/server/actions/auth.actions';

export default function JudgeScannerPage() {
  const router = useRouter();
  const [teamInfo, setTeamInfo] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' | 'info' } | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('judge_mode') === 'offline') {
      router.replace('/judge/dashboard');
      return;
    }
    async function verifyJudgeMode() {
      try {
        const res = await getMeAction();
        if (res.success && res.user && (res.user as any).assessmentMode === 'offline') {
          router.replace('/judge/dashboard');
          return;
        }
      } catch (e) {
        console.error('Access check failed:', e);
      } finally {
        setCheckingAccess(false);
      }
    }
    verifyJudgeMode();
  }, [router]);

  const fetchTeamInfo = useCallback(async (uniqueId: string) => {
    setLoading(true);
    setMessage({ text: 'Fetching team information...', type: 'info' });
    try {
      const data = await getTeamByUniqueIdAction(uniqueId);
      if (data.success) {
        setTeamInfo(data.team);
        setMessage(null);
      } else {
        setMessage({ text: 'Team not found', type: 'error' });
      }
    } catch {
      setMessage({ text: 'Failed to fetch team info', type: 'error' });
    }
    setLoading(false);
  }, []);

  const handleSaveAttendance = async (memberAttendances: boolean[], teamAttendance?: boolean) => {
    if (!teamInfo) return;
    try {
      const res = await updateTeamAttendanceBatchAction(teamInfo._id, memberAttendances, teamAttendance);
      if (res.success) {
        const presentCount = memberAttendances.filter(Boolean).length;
        setMessage({ 
          text: `✓ Attendance saved: ${teamInfo.name} (${presentCount}/${memberAttendances.length} present)`, 
          type: 'success' 
        });
        setTimeout(() => setMessage(null), 3000);
        return true;
      } else {
        setMessage({ text: res.message || 'Failed to save attendance', type: 'error' });
      }
    } catch {
      setMessage({ text: 'Failed to save attendance', type: 'error' });
    }
  };

  const handleReset = useCallback(() => {
    setTeamInfo(null);
  }, []);

  if (checkingAccess) {
    return null;
  }

  return (
    <ScannerBoard 
      onScanResult={fetchTeamInfo}
      teamInfo={teamInfo}
      message={message}
      onSaveAttendance={handleSaveAttendance}
      onReset={handleReset}
      loading={loading}
    />
  );
}
