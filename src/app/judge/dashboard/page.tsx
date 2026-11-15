"use client";

import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

import { TeamListForJudging } from '@/components/organisms/TeamListForJudging';
import { getTeamsAction } from '@/server/actions/admin.team.actions';
import { getMyEvaluationsAction } from '@/server/actions/evaluation.actions';
import { getActiveRoundAction } from '@/server/actions/round.actions';

export default function JudgeDashboard() {
  const [teams, setTeams] = useState<any[]>([]);
  const [teamEvaluations, setTeamEvaluations] = useState<Record<string, any>>({});
  const [currentJudgeId, setCurrentJudgeId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const router = useRouter();

  const fetchTeams = async () => {
    setLoading(true);
    const [teamData, evalData, roundData] = await Promise.all([
      getTeamsAction(),
      getMyEvaluationsAction(),
      getActiveRoundAction()
    ]);

    if (teamData.success) {
      setTeams(teamData.teams);
    }
    
    if (roundData.success) {
      if (evalData.success) {
        setCurrentJudgeId(evalData.currentJudgeId as string);
        const evalMap: Record<string, any> = {};
        evalData.evaluations.forEach((ev: any) => {
          if (ev.roundId === roundData.round._id) {
            if (ev.isLocked) {
              evalMap[ev.teamId] = { status: 'SUBMITTED', judgeName: ev.judgeId?.name, judgeId: ev.judgeId?._id };
            } else if (!evalMap[ev.teamId] || evalMap[ev.teamId].status !== 'SUBMITTED') {
              evalMap[ev.teamId] = { status: 'DRAFT', judgeName: ev.judgeId?.name, judgeId: ev.judgeId?._id };
            }
          }
        });
        setTeamEvaluations(evalMap);
      }
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const filteredTeams = teams.filter(team => 
    team.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    team.uniqueId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-10">
      <div className="mb-8">
        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">Assigned Teams to Evaluate</h2>
        <p className="text-slate-500 mt-1">Select an assigned team below to begin your evaluation and scoring.</p>
      </div>
      
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/50 p-6 mb-8">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-12 pr-4 py-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 sm:text-sm transition-all"
            placeholder="Search by Team Name or Unique ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <TeamListForJudging
          filteredTeams={filteredTeams}
          teamEvaluations={teamEvaluations}
          currentJudgeId={currentJudgeId}
          selectedTeam={selectedTeam}
          setSelectedTeam={setSelectedTeam}
          onProceedToRubric={(uniqueId) => router.push(`/judge/score/${uniqueId}`)}
        />
      )}
    </motion.div>
  );
}
