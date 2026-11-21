"use client";

import { useState, useEffect, useCallback, use } from 'react';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { ProblemStatementDetailCard } from '@/components/organisms/ProblemStatementDetailCard';
import { LoadingScreen } from '@/components/molecules/LoadingScreen';
import { meAction } from '@/server/actions/user.actions';
import { getTeamByUniqueIdAction, selectProblemStatementAction } from '@/server/actions/team.actions';
import { getProblemStatementAction } from '@/server/actions/problem-statements.actions';

export default function ProblemStatementDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  
  const [team, setTeam] = useState<any>(null);
  const [ps, setPs] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState(false);
  const [selectedStack, setSelectedStack] = useState<string>('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    const authData = await meAction();
    
    if (!authData.success) {
      setLoading(false);
      return;
    }
    
    if ((authData as any).user?.uniqueId) {
      const psResPromise = getProblemStatementAction(resolvedParams.id);
      const teamDataPromise = getTeamByUniqueIdAction((authData as any).user.uniqueId as string);
      
      const [teamData, psData] = await Promise.all([teamDataPromise, psResPromise]);
      
      if (teamData.success) setTeam((teamData as any).team);
      if (psData.success) {
        setPs((psData as any).problemStatement);
      } else {
        router.push('/team/problem-statement');
      }
    }
    setLoading(false);
  }, [resolvedParams.id, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const selectProblemStatement = async () => {
    if (!selectedStack || !selectedStack.trim()) {
      alert("Please enter your proposed tech stack first.");
      return;
    }

    if (!confirm("Are you sure? Once selected, you cannot change your problem statement.")) return;
    
    const data = await selectProblemStatementAction(team._id, ps._id, selectedStack);
    
    if (data.success) {
      setSelecting(false);
      fetchData();
    } else {
      alert(`Failed to select problem statement: ${data.message}`);
      fetchData();
    }
  };

  if (loading) {
    return <LoadingScreen variant="form" />;
  }

  if (!ps) return null;

  const hasSelected = !!team?.problemStatementId;
  const isSelected = (team?.problemStatementId?._id || team?.problemStatementId) === ps._id;
  const slotsRemaining = ps.slotLimit > 0 ? ps.slotLimit - ps.slotsFilled : null;
  const slotsOver = slotsRemaining !== null && slotsRemaining <= 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full pb-10">
      <Link href="/team/problem-statement" className="inline-flex items-center text-slate-500 hover:text-slate-800 dark:hover:text-white mb-6 font-medium transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to all problem statements
      </Link>
      
      <ProblemStatementDetailCard
        ps={ps}
        team={team}
        hasSelected={hasSelected}
        isSelected={isSelected}
        slotsRemaining={slotsRemaining}
        slotsOver={slotsOver}
        selecting={selecting}
        selectedStack={selectedStack}
        setSelecting={setSelecting}
        setSelectedStack={setSelectedStack}
        onSelectProblemStatement={selectProblemStatement}
      />
    </motion.div>
  );
}
