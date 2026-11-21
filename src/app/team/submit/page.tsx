"use client";

import { useState, useEffect } from 'react';
import { MonitorPlay, FileText, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

import { ProjectSubmissionForm } from '@/components/organisms/ProjectSubmissionForm';
import { LoadingScreen } from '@/components/molecules/LoadingScreen';
import { meAction } from '@/server/actions/user.actions';
import { getTeamByUniqueIdAction, getDeliverableAction, submitDeliverableAction } from '@/server/actions/team.actions';
import { getActiveRoundAction } from '@/server/actions/round.actions';

export default function SubmitDeliverablesPage() {
  const [team, setTeam] = useState<any>(null);
  const [activeRound, setActiveRound] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    githubLink: '',
    deckUrl: '',
    videoLink: '',
    abstract: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const authData = await meAction();
    
    if (!authData.success) {
      setLoading(false);
      return;
    }
    
    if ((authData as any).user?.uniqueId) {
      const [teamData, roundData] = await Promise.all([
        getTeamByUniqueIdAction((authData as any).user.uniqueId as string),
        getActiveRoundAction()
      ]);
      
      if (teamData.success) setTeam((teamData as any).team);
      if (roundData.success) {
        setActiveRound((roundData as any).round);
        if (teamData.success && (teamData as any).team) {
          const delivData = await getDeliverableAction((teamData as any).team._id, (roundData as any).round._id);
          if (delivData.success && (delivData as any).deliverable) {
            setHasSubmitted(true);
            setFormData({
              githubLink: (delivData as any).deliverable.githubLink || '',
              deckUrl: (delivData as any).deliverable.deckUrl || '',
              videoLink: (delivData as any).deliverable.videoLink || '',
              abstract: (delivData as any).deliverable.abstract || ''
            });
          }
        }
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!team || !activeRound) return;
    
    setIsSubmitting(true);
    setSuccess(false);
    
    const data = await submitDeliverableAction({
      teamId: team._id,
      roundId: activeRound._id,
      ...formData
    });
    
    if (data.success) {
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setHasSubmitted(true);
      }, 2000);
    } else {
      alert(data.message || "Failed to submit deliverable.");
    }
    setIsSubmitting(false);
  };

  if (loading) {
    return <LoadingScreen variant="form" />;
  }

  if (!team?.problemStatementId) {
    return (
      <div className="text-center py-20 max-w-lg mx-auto">
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-8 rounded-3xl border border-red-100 dark:border-red-900/50">
          <FileText className="w-12 h-12 mx-auto mb-4" />
          <h2 className="text-2xl font-black mb-2">Action Required</h2>
          <p className="text-sm font-medium">You must select a Problem Statement before submitting deliverables.</p>
          <Link href="/team/problem-statement" className="inline-block mt-6 px-6 py-3 bg-red-600 text-white rounded-xl font-bold shadow-lg hover:bg-red-700 transition-all active:scale-95">Go to Problem Statements</Link>
        </div>
      </div>
    );
  }

  if (!activeRound || !activeRound.isSubmissionsOpen) {
    return (
      <div className="text-center py-20 max-w-lg mx-auto">
        <div className="bg-slate-50 dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-slate-700">
          <MonitorPlay className="w-12 h-12 mx-auto mb-4 text-slate-400" />
          <h2 className="text-2xl font-black mb-2 text-slate-800 dark:text-white">Submissions Closed</h2>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {!activeRound 
              ? "There is currently no active evaluation round. Please check back later." 
              : "Deliverable submissions are currently turned off for this round. Please wait for the admin to open submissions."}
          </p>
        </div>
      </div>
    );
  }

  // Check if team is qualified for activeRound
  if (activeRound && Array.isArray(activeRound.allowedTeamIds)) {
    const allowedIds = activeRound.allowedTeamIds;
    const isTeamQualified = allowedIds.some((id: any) => String(id._id || id) === String(team._id));

    if (!isTeamQualified) {
      return (
        <div className="text-center py-20 max-w-lg mx-auto">
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 p-8 rounded-3xl shadow-sm">
            <Lock className="w-12 h-12 mx-auto mb-4 text-amber-500" />
            <h2 className="text-2xl font-black mb-2 text-slate-800 dark:text-white">Round Access Restricted</h2>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
              Your team (<strong className="text-emerald-600 dark:text-emerald-400">{team.name}</strong>) is not selected for <strong>{activeRound.name}</strong>.
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
              If you believe this is an error, please contact the event organizers to update your team selection.
            </p>
          </div>
        </div>
      );
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto pb-12 pt-4">
      <ProjectSubmissionForm
        activeRound={activeRound}
        formData={formData}
        isSubmitting={isSubmitting}
        success={success}
        hasSubmitted={hasSubmitted}
        setFormData={setFormData}
        onSubmit={handleSubmit}
      />
    </motion.div>
  );
}
