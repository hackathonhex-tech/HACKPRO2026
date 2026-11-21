"use client";

import { useState, useEffect, useCallback } from 'react';
import { RoundQualificationBoard } from '@/components/organisms/RoundQualificationBoard';
import { LoadingScreen } from '@/components/molecules/LoadingScreen';
import { getRoundsAction, updateRoundAllowedTeamsAction } from '@/server/actions/round.actions';
import { getTeamsAction } from '@/server/actions/admin.team.actions';

export default function AdminRoundQualificationPage() {
  const [rounds, setRounds] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [roundsRes, teamsRes] = await Promise.all([
      getRoundsAction(),
      getTeamsAction()
    ]);

    if (roundsRes.success) setRounds(roundsRes.rounds || []);
    if (teamsRes.success) setTeams(teamsRes.teams || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSaveAllowedTeams = async (roundId: string, allowedTeamIds: string[]) => {
    const res = await updateRoundAllowedTeamsAction(roundId, allowedTeamIds);
    if (res.success) {
      alert('Round qualification settings saved successfully!');
      fetchData();
      return true;
    } else {
      alert(`Failed to save qualifications: ${res.message}`);
      return false;
    }
  };

  if (loading) {
    return <LoadingScreen variant="table" />;
  }

  return (
    <RoundQualificationBoard
      rounds={rounds}
      teams={teams}
      onSaveAllowedTeams={handleSaveAllowedTeams}
      onRefresh={fetchData}
    />
  );
}
