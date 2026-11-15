import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, CheckCircle, Flag, Users, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { submitEvaluationAction } from '@/server/actions/evaluation.actions';

interface EvaluationFormProps {
  team: any;
  activeRound: any;
  judge: any;
  initialEvaluation: any;
}

export const EvaluationForm: React.FC<EvaluationFormProps> = ({
  team,
  activeRound,
  judge,
  initialEvaluation
}) => {
  const router = useRouter();

  const [scores, setScores] = useState<any>(initialEvaluation?.scores || {});
  const [memberScores, setMemberScores] = useState<Record<string, any>>(initialEvaluation?.memberScores || {});
  
  const [comment, setComment] = useState(initialEvaluation?.comment || '');
  const [publicFeedback, setPublicFeedback] = useState(initialEvaluation?.publicFeedback || '');
  const [evaluationStatus, setEvaluationStatus] = useState<'NOT_STARTED' | 'DRAFT' | 'SUBMITTED'>(initialEvaluation?.status || 'NOT_STARTED');
  const [isFlagged, setIsFlagged] = useState(initialEvaluation?.isFlagged || false);
  
  const [activeTab, setActiveTab] = useState<'team' | string>('team');

  const handleScoreChange = (criterionId: string, val: number) => {
    if (activeTab === 'team') {
      setScores({ ...scores, [criterionId]: val });
    } else {
      setMemberScores({
        ...memberScores,
        [activeTab]: {
          ...memberScores[activeTab],
          [criterionId]: val
        }
      });
    }
  };

  const calculateTeamTotalScore = () => {
    if (!activeRound?.activeRubricId?.criteria) return 0;
    let total = 0;
    activeRound.activeRubricId.criteria.forEach((c: any) => {
      const scoreGiven = scores[c._id] || 1;
      total += (scoreGiven / 5) * c.weight;
    });
    return total;
  };

  const calculateMemberTotalScore = (memberId: string) => {
    if (!activeRound?.activeMemberRubricId?.criteria) return 0;
    let total = 0;
    const mScores = memberScores[memberId] || {};
    activeRound.activeMemberRubricId.criteria.forEach((c: any) => {
      const scoreGiven = mScores[c._id] || 1;
      total += (scoreGiven / 5) * c.weight;
    });
    return total;
  };

  const submitEvaluation = async (isLocked: boolean = false, flagOverride: boolean | null = null) => {
    const formattedTeamScores = Object.keys(scores).map(criterionId => ({
      criterionId,
      score: scores[criterionId]
    }));

    const membersList = [
      { id: 'lead', name: team.leadName },
      ...(team.members || []).map((m: any, i: number) => ({ id: `member_${i}`, name: m.name }))
    ];

    const formattedMemberScores = membersList.map(m => {
      const mScores = memberScores[m.id] || {};
      return {
        memberId: m.id,
        name: m.name,
        totalScore: calculateMemberTotalScore(m.id),
        scores: Object.keys(mScores).map(criterionId => ({
          criterionId,
          score: mScores[criterionId]
        }))
      };
    });

    const finalFlagState = flagOverride !== null ? flagOverride : isFlagged;

    const payload = {
      teamId: team._id,
      judgeId: judge.id,
      roundId: activeRound._id,
      rubricId: activeRound.activeRubricId._id,
      scores: formattedTeamScores,
      memberScores: formattedMemberScores,
      totalScore: calculateTeamTotalScore(),
      comment,
      publicFeedback,
      isLocked,
      isFlagged: finalFlagState
    };

    const res = await submitEvaluationAction(payload);

    if (res.success) {
      setIsFlagged(finalFlagState);
      if (isLocked) {
        setEvaluationStatus('SUBMITTED');
        alert('Evaluation locked successfully.');
        router.push('/judge/dashboard');
      } else {
        setEvaluationStatus('DRAFT');
        alert('Evaluation saved as draft.');
      }
    } else {
      alert('Failed to save evaluation.');
    }
  };

  const teamTotal = calculateTeamTotalScore();
  const leadNameClean = (team.leadName || '').trim().toLowerCase();
  const membersList = [
    { id: 'lead', name: team.leadName, role: 'Team Lead' },
    ...(team.members || [])
      .filter((m: any) => (m.name || '').trim().toLowerCase() !== leadNameClean)
      .map((m: any, i: number) => ({ id: `member_${i}`, name: m.name, role: 'Member' }))
  ];

  const activeCriteriaList = activeTab === 'team' 
    ? activeRound.activeRubricId.criteria 
    : activeRound.activeMemberRubricId?.criteria;

  const currentScoresObj = activeTab === 'team' ? scores : (memberScores[activeTab] || {});
  const currentEntityTotal = activeTab === 'team' ? teamTotal : calculateMemberTotalScore(activeTab);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Scoring Area */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm p-8 border border-slate-100 dark:border-slate-700/50">
          
          {/* TABS */}
          <div className="flex flex-wrap gap-2 mb-8 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-2xl border border-slate-100 dark:border-slate-700/50">
            <button
              onClick={() => setActiveTab('team')}
              className={`flex-1 min-w-[120px] py-3 rounded-xl text-sm font-bold flex items-center justify-center transition-all ${activeTab === 'team' ? 'bg-white dark:bg-slate-800 shadow-sm text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 border border-transparent'}`}
            >
              <Users className="w-4 h-4 mr-2" /> Team Project
            </button>
            {membersList.map((m) => (
              <button
                key={m.id}
                onClick={() => setActiveTab(m.id)}
                className={`flex-1 min-w-[120px] py-3 rounded-xl text-sm font-bold flex flex-col items-center justify-center transition-all ${activeTab === m.id ? 'bg-white dark:bg-slate-800 shadow-sm text-amber-600 dark:text-amber-400 border border-slate-200 dark:border-slate-700' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 border border-transparent'}`}
              >
                <span className="flex items-center"><User className="w-4 h-4 mr-1.5" /> {m.name}</span>
                <span className="text-[10px] uppercase tracking-wider opacity-70 mt-0.5">{m.role}</span>
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 pb-6 border-b border-slate-100 dark:border-slate-700/50 gap-4">
            <h3 className="text-2xl font-extrabold text-slate-800 dark:text-white flex items-center">
              {activeTab === 'team' ? 'Project Score' : 'Individual Score'}
            </h3>
            <div className={`text-center p-3 px-6 rounded-2xl border transition-colors ${currentEntityTotal >= 80 ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800' : currentEntityTotal >= 50 ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800' : 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600'}`}>
              <p className={`text-2xl font-black tracking-tighter ${currentEntityTotal >= 80 ? 'text-emerald-600 dark:text-emerald-400' : currentEntityTotal >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-800 dark:text-slate-200'}`}>
                {currentEntityTotal.toFixed(1)} <span className="text-base text-slate-400">/ 100</span>
              </p>
            </div>
          </div>
          
          <motion.div className="space-y-8" layout>
            {(!activeCriteriaList || activeCriteriaList.length === 0) ? (
              <div className="text-center py-10 bg-slate-50 dark:bg-slate-900/30 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                <p className="text-slate-500 text-sm font-medium">No criteria defined for this section.</p>
              </div>
            ) : activeCriteriaList.map((c: any) => (
              <div key={c._id} className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-amber-200 dark:hover:border-amber-500/30 transition-colors">
                <div className="flex flex-col sm:flex-row justify-between sm:items-end mb-6 gap-2">
                  <div>
                    <h4 className="text-lg font-bold text-slate-800 dark:text-white">{c.name}</h4>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Weight: {c.weight}%</p>
                  </div>
                  <div className="text-4xl font-black text-amber-600 dark:text-amber-400 tabular-nums tracking-tighter">
                    {currentScoresObj[c._id] || 1} <span className="text-xl text-slate-400 font-bold">/ 5</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="0.5"
                  value={currentScoresObj[c._id] || 1}
                  onChange={(e) => handleScoreChange(c._id, Number(e.target.value))}
                  disabled={evaluationStatus === 'SUBMITTED'}
                  className={`w-full h-3 bg-slate-200 rounded-full appearance-none dark:bg-slate-700 accent-amber-500 ${evaluationStatus === 'SUBMITTED' ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                />
                <div className="flex justify-between text-xs text-slate-400 mt-3 font-bold">
                  <span>1</span>
                  <span>3</span>
                  <span>5</span>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Feedback & Submission */}
      <div className="space-y-6">
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm p-8 border border-slate-100 dark:border-slate-700/50 sticky top-6">
          
          <div className="space-y-5 mb-8">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Private Notes</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                disabled={evaluationStatus === 'SUBMITTED'}
                className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500 transition-all dark:text-white resize-none ${evaluationStatus === 'SUBMITTED' ? 'cursor-not-allowed opacity-70' : ''}`}
                rows={3}
                placeholder="Only visible to admins..."
              ></textarea>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Public Feedback</label>
              <textarea
                value={publicFeedback}
                onChange={(e) => setPublicFeedback(e.target.value)}
                disabled={evaluationStatus === 'SUBMITTED'}
                className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500 transition-all dark:text-white resize-none ${evaluationStatus === 'SUBMITTED' ? 'cursor-not-allowed opacity-70' : ''}`}
                rows={2}
                placeholder="Visible to the team..."
              ></textarea>
            </div>
          </div>

          <div className="space-y-4">
            {evaluationStatus === 'SUBMITTED' ? (
              <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 text-center font-bold flex items-center justify-center">
                <CheckCircle className="w-5 h-5 mr-2" /> Evaluation Locked
              </div>
            ) : (
              <>
                <button
                  onClick={() => submitEvaluation(false, null)}
                  className="w-full font-bold py-3.5 rounded-xl transition-all flex items-center justify-center border bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-600 border-slate-200 dark:border-slate-600"
                >
                  <Save className="w-5 h-5 mr-2" /> {evaluationStatus === 'DRAFT' ? 'Update Draft' : 'Save Draft'}
                </button>
                
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to lock this evaluation? You will not be able to edit it later.')) {
                      submitEvaluation(true, null);
                    }
                  }}
                  className="w-full bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-black py-4 rounded-xl shadow-[0_0_20px_-5px_rgba(245,158,11,0.5)] transition-all flex items-center justify-center text-lg tracking-wide"
                >
                  <CheckCircle className="w-6 h-6 mr-2" /> Submit Score
                </button>

                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-700/50 text-center">
                  <button
                    onClick={() => {
                      const newFlagState = !isFlagged;
                      submitEvaluation(false, newFlagState);
                    }}
                    className={`inline-flex items-center text-xs font-bold transition-colors uppercase tracking-wider ${isFlagged ? 'text-red-600 dark:text-red-400' : 'text-slate-400 hover:text-red-500 dark:hover:text-red-400'}`}
                  >
                    <Flag className={`w-4 h-4 mr-1.5 ${isFlagged ? 'fill-current' : ''}`} /> {isFlagged ? 'Flagged for Review' : 'Flag for Review'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
