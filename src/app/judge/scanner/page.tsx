"use client";

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ScannerBoard } from '@/components/organisms/ScannerBoard';
import { getTeamByUniqueIdAction } from '@/server/actions/team.actions';
import { updateMemberAttendanceAction, updateTeamAttendanceAction } from '@/server/actions/admin.team.actions';
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

  const handleToggleAttendance = async (memberIndex: number, currentStatus: boolean) => {
    if (!teamInfo) return;
    setLoading(true);
    try {
      const newStatus = !currentStatus;
      await updateMemberAttendanceAction(teamInfo._id, memberIndex, newStatus);
      
      const updatedMembers = [...teamInfo.members];
      updatedMembers[memberIndex].attendance = newStatus;
      setTeamInfo({ ...teamInfo, members: updatedMembers });
      
      setMessage({ text: `Marked ${updatedMembers[memberIndex].name} as ${newStatus ? 'Present' : 'Absent'}`, type: 'success' });
      setTimeout(() => setMessage(null), 2000);
    } catch {
      setMessage({ text: 'Failed to update attendance.', type: 'error' });
    }
    setLoading(false);
  };

  const handleReset = useCallback(() => {
    setTeamInfo(null);
  }, []);

  const handleToggleTeamAttendance = async (currentStatus: boolean) => {
    if (!teamInfo) return;
    setLoading(true);
    try {
      const newStatus = !currentStatus;
      await updateTeamAttendanceAction(teamInfo._id, newStatus);
      
      setTeamInfo({ ...teamInfo, attendance: newStatus });
      setMessage({ text: `Team ${newStatus ? 'checked in' : 'check-in revoked'}`, type: 'success' });
      setTimeout(() => setMessage(null), 2000);
    } catch {
      setMessage({ text: 'Failed to update team attendance.', type: 'error' });
    }
    setLoading(false);
  };

  if (checkingAccess) {
    return null;
  }

  return (
    <ScannerBoard 
      onScanResult={fetchTeamInfo}
      teamInfo={teamInfo}
      message={message}
      onToggleAttendance={handleToggleAttendance}
      onToggleTeamAttendance={handleToggleTeamAttendance}
      onReset={handleReset}
      loading={loading}
    />
  );
}
