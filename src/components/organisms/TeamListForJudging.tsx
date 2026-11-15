import React, { useState } from 'react';
import { ChevronRight, Star, X, CheckCircle, Users } from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Pagination } from '../molecules/Pagination';

interface TeamListForJudgingProps {
  filteredTeams: any[];
  teamEvaluations: Record<string, any>;
  currentJudgeId: string;
  selectedTeam: any;
  setSelectedTeam: (team: any) => void;
  onProceedToRubric: (uniqueId: string) => void;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } }
};

export const TeamListForJudging: React.FC<TeamListForJudgingProps> = ({
  filteredTeams,
  teamEvaluations,
  currentJudgeId,
  selectedTeam,
  setSelectedTeam,
  onProceedToRubric
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(9);

  const paginatedTeams = filteredTeams.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  return (
    <>
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredTeams.length === 0 ? (
          <p className="text-slate-500 col-span-full italic">No teams found matching your search.</p>
        ) : (
          paginatedTeams.map((team) => {
            const evalInfo = teamEvaluations[team._id];
            const status = evalInfo?.status || 'NOT_STARTED';
            const isMine = evalInfo?.judgeId === currentJudgeId;
            const judgeName = evalInfo?.judgeName || 'Unknown';
            
            let cardClass = 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700/50 hover:border-slate-300';
            let statusBadge = null;
            
            if (status === 'SUBMITTED') {
              cardClass = 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800/50 hover:border-green-400 dark:hover:border-green-600';
              statusBadge = <span className="text-xs font-bold px-2 py-1 rounded bg-green-100 text-green-700 dark:bg-green-800/30 dark:text-green-400">Completed by {isMine ? 'You' : judgeName}</span>;
            } else if (status === 'DRAFT') {
              cardClass = 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800/50 hover:border-yellow-400 dark:hover:border-yellow-600';
              statusBadge = <span className="text-xs font-bold px-2 py-1 rounded bg-yellow-100 text-yellow-700 dark:bg-yellow-800/30 dark:text-yellow-400">Draft by {isMine ? 'You' : judgeName}</span>;
            } else {
              cardClass = 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-600/50';
              statusBadge = <span className="text-xs font-bold px-2 py-1 rounded bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">Ready to Score</span>;
            }

            return (
              <motion.div variants={itemVariants} key={team._id} className={`rounded-2xl shadow-sm border overflow-hidden transition-colors group relative ${cardClass}`}>
                <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className={`text-xl font-bold transition-colors ${status === 'SUBMITTED' ? 'text-green-900 dark:text-green-100 group-hover:text-green-600' : status === 'DRAFT' ? 'text-yellow-900 dark:text-yellow-100 group-hover:text-yellow-600' : 'text-red-900 dark:text-red-100 group-hover:text-red-600'}`}>
                        {team.name}
                      </h3>
                      {statusBadge}
                    </div>
                    <p className={`inline-block text-xs font-mono px-2 py-0.5 rounded ${status === 'SUBMITTED' ? 'bg-green-100 dark:bg-green-800/30 text-green-700 dark:text-green-300' : status === 'DRAFT' ? 'bg-yellow-100 dark:bg-yellow-800/30 text-yellow-700 dark:text-yellow-300' : 'bg-red-100 dark:bg-red-800/30 text-red-700 dark:text-red-300'}`}>
                      {team.uniqueId}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Star className="w-5 h-5 text-amber-500" />
                  </div>
                </div>
                
                <div className="mb-8">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Track</p>
                  <span className="inline-block bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20 text-xs font-bold px-3 py-1 rounded-full">
                    {team.problemStatementId?.track || 'Not Selected'}
                  </span>
                </div>

                <button 
                  onClick={() => {
                    if (status !== 'NOT_STARTED' && !isMine) return;
                    setSelectedTeam(team);
                  }} 
                  disabled={status !== 'NOT_STARTED' && !isMine}
                  className={`flex items-center justify-between w-full font-bold py-3.5 px-5 rounded-xl transition-all border ${
                    status !== 'NOT_STARTED' && !isMine 
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700 cursor-not-allowed opacity-70' 
                      : status === 'SUBMITTED' 
                        ? 'bg-green-100/50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800 group-hover:bg-green-100 dark:group-hover:bg-green-800/40' 
                        : status === 'DRAFT' 
                          ? 'bg-yellow-100/50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800 group-hover:bg-yellow-100 dark:group-hover:bg-yellow-800/40' 
                          : 'bg-amber-100/50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800 group-hover:bg-amber-100 dark:group-hover:bg-amber-800/40'
                  }`}
                >
                  <span>
                    {status !== 'NOT_STARTED' && !isMine ? `Locked by ${judgeName}` 
                      : status === 'SUBMITTED' ? 'View Your Evaluation' 
                      : status === 'DRAFT' ? 'Continue Your Evaluation' 
                      : 'Evaluate Team'}
                  </span>
                  <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </motion.div>
            );
          })
        )}
      </motion.div>

      {filteredTeams.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalItems={filteredTeams.length}
          pageSize={pageSize}
          pageSizeOptions={[6, 9, 18, 27]}
          onPageChange={setCurrentPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
          className="mt-6 bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700/50"
        />
      )}

      {/* Verify Team Modal */}
      <AnimatePresence>
        {selectedTeam && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedTeam(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-6 border-b border-slate-100 dark:border-slate-700/50 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Verify Team Details</h3>
                <button onClick={() => setSelectedTeam(null)} className="p-2 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"><X className="w-5 h-5" /></button>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1">
                <div className="mb-6 pb-6 border-b border-slate-100 dark:border-slate-700/50">
                  <div className="flex items-center space-x-3 mb-2">
                    <Users className="w-6 h-6 text-indigo-500" />
                    <h4 className="text-xl font-bold text-slate-900 dark:text-white">{selectedTeam.name}</h4>
                    <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded text-xs font-mono">{selectedTeam.uniqueId}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm mt-4">
                    <div>
                      <p className="text-slate-500 font-semibold mb-1 uppercase tracking-wider text-xs">Team Lead</p>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{selectedTeam.leadName || '—'}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 font-semibold mb-1 uppercase tracking-wider text-xs">College</p>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{selectedTeam.collegeName || '—'}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Selected Problem Statement</h4>
                  {selectedTeam.problemStatementId ? (
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center justify-between">
                        <p className="font-black text-base text-slate-900 dark:text-white pr-4">{selectedTeam.problemStatementId.title}</p>
                        <span className="bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider whitespace-nowrap">{selectedTeam.problemStatementId.track}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 p-4 rounded-xl border border-amber-200 dark:border-amber-500/30 flex items-center">
                      Team has not selected a problem statement yet.
                    </p>
                  )}
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50 flex justify-end space-x-3">
                <button onClick={() => setSelectedTeam(null)} className="px-6 py-3 rounded-xl font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Cancel</button>
                <button 
                  onClick={() => onProceedToRubric(selectedTeam.uniqueId)} 
                  disabled={!selectedTeam.problemStatementId}
                  className="px-6 py-3 rounded-xl font-bold bg-emerald-500 text-white hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/30 flex items-center disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                >
                  <CheckCircle className="w-5 h-5 mr-2" /> Verified & Proceed to Rubric
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
