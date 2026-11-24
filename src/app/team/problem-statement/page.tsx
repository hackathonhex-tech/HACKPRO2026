"use client";

import { useState, useEffect } from 'react';
import { Lock, AlertTriangle, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';

import { ProblemStatementGrid } from '@/components/organisms/ProblemStatementGrid';
import { LoadingScreen } from '@/components/molecules/LoadingScreen';
import { meAction } from '@/server/actions/user.actions';
import { getTeamByUniqueIdAction, selectProblemStatementAction } from '@/server/actions/team.actions';
import { getProblemStatementsAction } from '@/server/actions/problem-statements.actions';

export default function ProblemStatementPage() {
  const [team, setTeam] = useState<any>(null);
  const [problemStatements, setProblemStatements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLead, setIsLead] = useState<boolean>(true);
  
  // Stacks selection state
  const [selectingPsId, setSelectingPsId] = useState<string | null>(null);
  const [selectedStack, setSelectedStack] = useState<string>('');

  const fetchData = async () => {
    setLoading(true);
    const authData = await meAction();
    
    if (!authData.success) {
      setLoading(false);
      return;
    }

    if ((authData as any).user) {
      setIsLead((authData as any).user.isLead !== false);
    }
    
    if ((authData as any).user?.uniqueId) {
      const psResPromise = getProblemStatementsAction();
      const teamDataPromise = getTeamByUniqueIdAction((authData as any).user.uniqueId as string);
      
      const [teamData, psData] = await Promise.all([teamDataPromise, psResPromise]);
      
      if (teamData.success) setTeam((teamData as any).team);
      if (psData.success) setProblemStatements((psData as any).problemStatements);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const selectProblemStatement = async (psId: string) => {
    if (!selectedStack || !selectedStack.trim()) {
      alert("Please enter your proposed tech stack first.");
      return;
    }

    if (!confirm("Are you sure? Once selected, you cannot change your problem statement.")) return;
    
    const data = await selectProblemStatementAction(team._id, psId, selectedStack);
    
    if (data.success) {
      setSelectingPsId(null);
      setSelectedStack('');
      fetchData();
    } else {
      alert(`Failed to select problem statement: ${data.message}`);
      fetchData();
    }
  };

  if (loading) {
    return <LoadingScreen variant="cards" />;
  }

  const hasSelected = !!team?.problemStatementId;
  const selectedPsId = team?.problemStatementId?._id || team?.problemStatementId;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-6xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 border-b border-slate-200 dark:border-slate-700 pb-6">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">Problem Statements</h2>
          <p className="text-slate-500 mt-1">Select the challenge your team will conquer.</p>
        </div>
        {hasSelected && (
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 px-4 py-2 rounded-xl text-sm font-bold border border-emerald-200 dark:border-emerald-500/20 shadow-sm">
            <Lock className="w-4 h-4 mr-2" /> Selection Locked
          </motion.div>
        )}
      </div>
      
      {!hasSelected && problemStatements.length > 0 && (
        isLead ? (
          <div className="mb-8 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-start">
            <AlertTriangle className="w-6 h-6 text-amber-500 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-amber-800 dark:text-amber-300">Action Required</h4>
              <p className="text-sm text-amber-700 dark:text-amber-400/80 mt-1">Review carefully. Once you select and lock a problem statement, your decision is final and cannot be changed.</p>
            </div>
          </div>
        ) : (
          <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl flex items-start">
            <ShieldAlert className="w-6 h-6 text-[#3760F8] mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-slate-800 dark:text-slate-200">Team Member View (Selection Restricted)</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                You are logged in as a Team Member. Problem statement selection and locking can only be performed by your Team Leader (<span className="font-bold text-[#3760F8]">{team?.leadName || 'Team Lead'}</span>).
              </p>
            </div>
          </div>
        )
      )}

      <ProblemStatementGrid
        problemStatements={problemStatements}
        team={team}
        hasSelected={hasSelected}
        selectedPsId={selectedPsId}
        selectingPsId={selectingPsId}
        selectedStack={selectedStack}
        isLead={isLead}
        setSelectingPsId={setSelectingPsId}
        setSelectedStack={setSelectedStack}
        onSelectProblemStatement={selectProblemStatement}
      />
    </motion.div>
  );
}
