"use client";

import { useState, useEffect } from 'react';
import { EvaluationList } from '@/components/organisms/EvaluationList';
import { getAllEvaluationsAction } from '@/server/actions/evaluation.actions';
import { getTeamsAction } from '@/server/actions/admin.team.actions';

export default function EvaluationsPage() {
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvaluations = async () => {
    setLoading(true);
    const [evalData, teamsData] = await Promise.all([
      getAllEvaluationsAction(),
      getTeamsAction()
    ]);
    
    if (evalData.success) {
      setEvaluations(evalData.evaluations ?? []);
    }
    if (teamsData.success) {
      setTeams(teamsData.teams ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEvaluations();
  }, []);

  return <EvaluationList evaluations={evaluations} teams={teams} loading={loading} onRefresh={fetchEvaluations} />;
}
