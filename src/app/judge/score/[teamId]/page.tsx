"use client";

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { ChevronLeft, AlertTriangle, Flag } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { EvaluationForm } from '@/components/organisms/EvaluationForm';
import { LoadingScreen } from '@/components/molecules/LoadingScreen';
import { meAction } from '@/server/actions/user.actions';
import { getTeamByUniqueIdAction } from '@/server/actions/team.actions';
import { getActiveRoundAction } from '@/server/actions/round.actions';
import { getEvaluationAction } from '@/server/actions/evaluation.actions';

export default function JudgeScorePage() {
  const params = useParams();
  const teamUniqueId = params.teamId;

  const [judge, setJudge] = useState<any>(null);
  const [team, setTeam] = useState<any>(null);
  const [activeRound, setActiveRound] = useState<any>(null);
  
  const [initialEvaluation, setInitialEvaluation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [authData, teamData, roundData] = await Promise.all([
      meAction(),
      getTeamByUniqueIdAction(teamUniqueId as string),
      getActiveRoundAction()
    ]);

    if (authData.success) setJudge((authData as any).user);
    if (teamData.success) setTeam((teamData as any).team);
    if (roundData.success) {
      setActiveRound(roundData.round);
      
      const initialTeamScores: any = {};
      roundData.round.activeRubricId?.criteria?.forEach((c: any) => {
        initialTeamScores[c._id] = 0;
      });

      const initialMemberScores: any = {};
      if (teamData.success) {
        const leadNameClean = (teamData.team.leadName || '').trim().toLowerCase();
        const membersList = [
          { id: 'lead', name: teamData.team.leadName, role: 'Team Lead' },
          ...(teamData.team.members || [])
            .filter((m: any) => (m.name || '').trim().toLowerCase() !== leadNameClean)
            .map((m: any, i: number) => ({ id: `member_${i}`, name: m.name, role: 'Member' }))
        ];
        
        membersList.forEach(m => {
          initialMemberScores[m.id] = {};
          roundData.round.activeMemberRubricId?.criteria?.forEach((c: any) => {
            initialMemberScores[m.id][c._id] = 0;
          });
        });
      }

      if (teamData.success && authData.success && (authData as any).user?.id) {
        const evalData = await getEvaluationAction((teamData as any).team._id, (authData as any).user.id as string, roundData.round._id);
        
        const loadedTeamScores = { ...initialTeamScores };
        const loadedMemberScores = { ...initialMemberScores };
        let comment = '';
        let publicFeedback = '';
        let isFlagged = false;
        let status = 'NOT_STARTED';

        if (evalData.success && evalData.evaluation) {
          const ev = evalData.evaluation;
          comment = ev.comment || '';
          publicFeedback = ev.publicFeedback || '';
          isFlagged = ev.isFlagged || false;
          status = ev.isLocked ? 'SUBMITTED' : 'DRAFT';
          
          ev.scores?.forEach((s: any) => {
            loadedTeamScores[s.criterionId] = s.score;
          });
          
          ev.memberScores?.forEach((ms: any) => {
            if (!loadedMemberScores[ms.memberId]) loadedMemberScores[ms.memberId] = {};
            ms.scores.forEach((s: any) => {
              loadedMemberScores[ms.memberId][s.criterionId] = s.score;
            });
          });
        }
        
        setInitialEvaluation({
          scores: loadedTeamScores,
          memberScores: loadedMemberScores,
          comment,
          publicFeedback,
          isFlagged,
          status
        });
      }
    }
    setLoading(false);
  }, [teamUniqueId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return <LoadingScreen variant="form" />;
  }

  if (!team || !activeRound || !activeRound.activeRubricId) {
    return (
      <div className="text-center py-20 max-w-md mx-auto">
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-8 rounded-2xl border border-red-100 dark:border-red-900/50">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Evaluation Unavailable</h2>
          <p className="text-sm">Ensure an active round and rubric are set, and the team exists.</p>
          <Link href="/judge/dashboard" className="inline-block mt-6 px-6 py-2.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition">Return to Dashboard</Link>
        </div>
      </div>
    );
  }

  const evaluationStatus = initialEvaluation?.status || 'NOT_STARTED';
  const isFlagged = initialEvaluation?.isFlagged || false;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-6xl mx-auto pb-12 pt-4">
      <div className="mb-6">
        <Link href="/judge/dashboard" className="inline-flex items-center text-sm font-bold text-slate-400 hover:text-amber-500 transition-colors">
          <ChevronLeft className="w-4 h-4 mr-1" /> Back to Teams
        </Link>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm p-8 md:p-10 border border-slate-100 dark:border-slate-700/50 mb-8 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 dark:bg-amber-500/5 blur-[80px] rounded-full pointer-events-none group-hover:scale-110 transition-transform"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">{team.name}</h2>
            <div className="flex flex-wrap items-center gap-3 text-sm mt-3">
              <span className="font-mono font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/50 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600/50">ID: {team.uniqueId}</span>
              <span className="bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 px-3 py-1.5 rounded-lg font-bold border border-amber-200 dark:border-amber-500/30">Track: {team.problemStatementId?.track || 'N/A'}</span>
              {evaluationStatus === 'NOT_STARTED' && (
                <span className="bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300 px-3 py-1.5 rounded-lg font-bold border border-red-200 dark:border-red-500/30">Not Submitted</span>
              )}
              {evaluationStatus === 'DRAFT' && (
                <span className="bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-300 px-3 py-1.5 rounded-lg font-bold border border-yellow-200 dark:border-yellow-500/30">Draft Saved</span>
              )}
              {evaluationStatus === 'SUBMITTED' && (
                <span className="bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300 px-3 py-1.5 rounded-lg font-bold border border-green-200 dark:border-green-500/30">Submitted</span>
              )}
              {isFlagged && (
                <span className="bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300 px-3 py-1.5 rounded-lg font-bold border border-red-200 dark:border-red-500/30 flex items-center"><Flag className="w-3 h-3 mr-1" /> Flagged</span>
              )}
            </div>
          </div>
          <div className="text-left md:text-right bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Evaluating Round</p>
            <p className="text-xl font-bold text-slate-800 dark:text-slate-200">{activeRound.name}</p>
          </div>
        </div>
      </div>

      <EvaluationForm
        team={team}
        activeRound={activeRound}
        judge={judge}
        initialEvaluation={initialEvaluation}
      />
    </motion.div>
  );
}
