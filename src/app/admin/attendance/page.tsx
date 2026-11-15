"use client";

import { useState, useEffect, useCallback } from 'react';
import { AttendanceTable } from '@/components/organisms/AttendanceTable';
import { getTeamsAction, updateMemberAttendanceAction } from '@/server/actions/admin.team.actions';

export default function AttendancePage() {
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTeams = useCallback(async () => {
    setLoading(true);
    const data = await getTeamsAction();
    if (data.success) {
      setTeams(data.teams);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  const toggleMemberAttendance = async (teamId: string, memberIndex: number, currentStatus: boolean) => {
    const data = await updateMemberAttendanceAction(teamId, memberIndex, !currentStatus);
    
    if (data.success) {
      setTeams(teams.map(t => t._id === teamId ? data.team : t));
    }
  };

  const markAllMembers = async (team: any, status: boolean) => {
    for (let i = 0; i < team.members.length; i++) {
      if (team.members[i].attendance !== status) {
        await updateMemberAttendanceAction(team._id, i, status);
      }
    }
    fetchTeams();
  };

  return (
    <AttendanceTable 
      teams={teams} 
      loading={loading} 
      onRefresh={fetchTeams} 
      onToggleMemberAttendance={toggleMemberAttendance} 
      onMarkAllMembers={markAllMembers} 
    />
  );
}
