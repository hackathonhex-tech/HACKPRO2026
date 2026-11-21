"use client";

import { useState, useEffect } from 'react';
import { TeamDashboardBoard } from '@/components/organisms/TeamDashboardBoard';
import { LoadingScreen } from '@/components/molecules/LoadingScreen';
import { meAction } from '@/server/actions/user.actions';
import { getTeamByUniqueIdAction } from '@/server/actions/team.actions';

export default function TeamDashboard() {
  const [team, setTeam] = useState<any>(null);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTeamData = async () => {
    setLoading(true);
    const authData = await meAction();
    
    if (!authData.success) {
      setLoading(false);
      return;
    }
    
    if ((authData as any).user?.uniqueId) {
      const data = await getTeamByUniqueIdAction((authData as any).user.uniqueId as string);
      if (data.success) {
        setTeam((data as any).team);
        // Feedbacks are populated in the new action if needed, but for now we expect them or default to []
        setFeedbacks((data as any).feedbacks || []);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTeamData();
  }, []);

  if (loading) {
    return <LoadingScreen variant="dashboard" />;
  }

  if (!team) {
    return <div className="text-center py-20 text-slate-500">Error loading team data.</div>;
  }

  return <TeamDashboardBoard team={team} feedbacks={feedbacks} />;
}
