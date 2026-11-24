"use client";

import { useState, useCallback } from 'react';
import { ScannerBoard } from '@/components/organisms/ScannerBoard';
import { getTeamByUniqueIdAction } from '@/server/actions/team.actions';
import { updateMemberAttendanceAction } from '@/server/actions/admin.team.actions';

export default function ScannerPage() {
  const [teamInfo, setTeamInfo] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'error' | 'success' | 'info' } | null>(null);

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
      const anyPresent = updatedMembers.some((m: any) => m.attendance === true);
      setTeamInfo({ 
        ...teamInfo, 
        members: updatedMembers,
        attendance: anyPresent || Boolean(teamInfo.attendance)
      });
      
      setMessage({ text: `Marked ${updatedMembers[memberIndex].name} as ${newStatus ? 'Present' : 'Absent'}`, type: 'success' });
      
      // Auto-clear message after 2 seconds
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
      const { updateTeamAttendanceAction } = await import('@/server/actions/admin.team.actions');
      await updateTeamAttendanceAction(teamInfo._id, newStatus);
      
      setTeamInfo({ ...teamInfo, attendance: newStatus });
      setMessage({ text: `Team ${newStatus ? 'checked in' : 'check-in revoked'}`, type: 'success' });
      setTimeout(() => setMessage(null), 2000);
    } catch {
      setMessage({ text: 'Failed to update team attendance.', type: 'error' });
    }
    setLoading(false);
  };

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
