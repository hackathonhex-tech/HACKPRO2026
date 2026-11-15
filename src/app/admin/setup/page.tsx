"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';


import { ProblemStatementForm, ProblemStatementFormData } from '@/components/organisms/ProblemStatementForm';
import { ProblemStatementList } from '@/components/organisms/ProblemStatementList';
import { RoundConfigurationForm, RoundFormData } from '@/components/organisms/RoundConfigurationForm';
import { RoundConfigurationList } from '@/components/organisms/RoundConfigurationList';
import { ProblemStatementDetailCard } from '@/components/organisms/ProblemStatementDetailCard';
import { Modal } from '@/components/molecules/Modal';
import { getProblemStatementsAction, createProblemStatementAction, updateProblemStatementAction, deleteProblemStatementAction } from '@/server/actions/problem-statements.actions';
import { getRoundsAction, createRoundAction, updateRoundAction, deleteRoundAction } from '@/server/actions/round.actions';
import { getRubricsAction } from '@/server/actions/rubric.actions';

export default function SetupPage() {
  const [problemStatements, setProblemStatements] = useState<any[]>([]);
  const [rounds, setRounds] = useState<any[]>([]);
  const [rubrics, setRubrics] = useState<any[]>([]);
  
  const [newPS, setNewPS] = useState<ProblemStatementFormData>({ title: '', description: '', track: '', slotLimit: 0, allowedStacks: '' });
  const [editingPSId, setEditingPSId] = useState<string | null>(null);
  const [previewingPS, setPreviewingPS] = useState<any | null>(null);
  const [newRound, setNewRound] = useState<RoundFormData>({ name: '', activeRubricId: '', activeMemberRubricId: '', isActive: false });
  const [editingRoundId, setEditingRoundId] = useState<string | null>(null);
  

  const fetchData = async () => {
    const [psRes, roundRes, rubricRes] = await Promise.all([
      getProblemStatementsAction(),
      getRoundsAction(),
      getRubricsAction()
    ]);
    
    if (psRes.success) setProblemStatements(psRes.problemStatements);
    if (roundRes.success) setRounds(roundRes.rounds);
    if (rubricRes.success) setRubrics(rubricRes.rubrics);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddPS = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = editingPSId 
      ? await updateProblemStatementAction(editingPSId, newPS)
      : await createProblemStatementAction(newPS);
      
    if (res.success) {
      setNewPS({ title: '', description: '', track: '', slotLimit: 0, allowedStacks: '' });
      setEditingPSId(null);
      fetchData();
    }
  };

  const handleAddRound = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = editingRoundId 
      ? await updateRoundAction(editingRoundId, newRound)
      : await createRoundAction(newRound);
      
    if (res.success) {
      setNewRound({ name: '', activeRubricId: '', activeMemberRubricId: '', isActive: false });
      setEditingRoundId(null);
      fetchData();
    }
  };
  
  const handleEditRound = (r: any) => {
    setEditingRoundId(r._id);
    setNewRound({
      name: r.name,
      activeRubricId: r.activeRubricId?._id || '',
      activeMemberRubricId: r.activeMemberRubricId?._id || '',
      isActive: r.isActive
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleEditPS = (ps: any) => {
    setEditingPSId(ps._id);
    setNewPS({
      title: ps.title,
      description: ps.description,
      track: ps.track,
      slotLimit: ps.slotLimit || 0,
      allowedStacks: ps.allowedStacks ? ps.allowedStacks.join(', ') : ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeletePS = async (id: string) => {
    if (!confirm('Are you sure you want to delete this problem statement?')) return;
    const res = await deleteProblemStatementAction(id);
    if (res.success) fetchData();
  };

  const handleAddExtraSlot = async (ps: any) => {
    if (!confirm(`Are you sure you want to add an extra slot to "${ps.title}"?`)) return;
    const res = await updateProblemStatementAction(ps._id, { slotLimit: (ps.slotLimit || 0) + 1 });
    if (res.success) fetchData();
  };

  const handleDeleteRound = async (id: string) => {
    if (!confirm('Are you sure you want to delete this round?')) return;
    const res = await deleteRoundAction(id);
    if (res.success) fetchData();
  };

  const handleTogglePS = async (id: string, currentlyVisible: boolean) => {
    const res = await updateProblemStatementAction(id, { isVisible: !currentlyVisible });
    if (res.success) fetchData();
  };

  const handleToggleRound = async (id: string, currentlyActive: boolean) => {
    const res = await updateRoundAction(id, { isActive: !currentlyActive });
    if (res.success) fetchData();
  };

  const handleToggleSubmissions = async (id: string, currentlyOpen: boolean) => {
    const res = await updateRoundAction(id, { isSubmissionsOpen: !currentlyOpen });
    if (res.success) fetchData();
  };



  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-10">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">Event Setup</h2>
          <p className="text-slate-500 mt-1">Configure problem statements and evaluation rounds.</p>
        </div>
      </div>
      

      
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="space-y-6">
          <ProblemStatementForm 
            formData={newPS}
            isEditing={!!editingPSId}
            onChange={setNewPS}
            onSubmit={handleAddPS}
            onCancelEditing={() => { 
              setEditingPSId(null); 
              setNewPS({ title: '', description: '', track: '', slotLimit: 0, allowedStacks: '' }); 
            }}
          />
          <ProblemStatementList 
            problemStatements={problemStatements}
            onTogglePS={handleTogglePS}
            onEditPS={handleEditPS}
            onDeletePS={handleDeletePS}
            onPreviewPS={setPreviewingPS}
            onAddSlot={handleAddExtraSlot}
          />
        </div>

        <div className="space-y-6">
          <RoundConfigurationForm 
            formData={newRound}
            isEditing={!!editingRoundId}
            rubrics={rubrics}
            onChange={setNewRound}
            onSubmit={handleAddRound}
            onCancelEditing={() => {
              setEditingRoundId(null);
              setNewRound({ name: '', activeRubricId: '', activeMemberRubricId: '', isActive: false });
            }}
          />
          <RoundConfigurationList 
            rounds={rounds}
            onToggleSubmissions={handleToggleSubmissions}
            onToggleRound={handleToggleRound}
            onEditRound={handleEditRound}
            onDeleteRound={handleDeleteRound}
          />
        </div>
      </div>
      
      {/* Preview Modal */}
      <Modal isOpen={!!previewingPS} onClose={() => setPreviewingPS(null)} title="Problem Statement Preview" maxWidth="5xl">
        {previewingPS && (
          <div className="mt-2">
            <ProblemStatementDetailCard
              ps={previewingPS}
              team={null}
              hasSelected={false}
              isSelected={false}
              slotsRemaining={previewingPS.slotLimit ? previewingPS.slotLimit - (previewingPS.slotsFilled || 0) : null}
              slotsOver={previewingPS.slotLimit > 0 && (previewingPS.slotsFilled || 0) >= previewingPS.slotLimit}
              selecting={false}
              selectedStack=""
              setSelecting={() => {}}
              setSelectedStack={() => {}}
              onSelectProblemStatement={() => {}}
            />
          </div>
        )}
      </Modal>
    </motion.div>
  );
}
