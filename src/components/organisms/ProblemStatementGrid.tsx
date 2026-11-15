import React from 'react';
import { Lock, Target, ArrowRight } from 'lucide-react';
import { motion, Variants } from 'framer-motion';
import Link from 'next/link';

interface ProblemStatementGridProps {
  problemStatements: any[];
  team: any;
  hasSelected: boolean;
  selectedPsId: string | null;
  selectingPsId: string | null;
  selectedStack: string;
  setSelectingPsId: (id: string | null) => void;
  setSelectedStack: (stack: string) => void;
  onSelectProblemStatement: (id: string) => void;
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

export const ProblemStatementGrid: React.FC<ProblemStatementGridProps> = ({
  problemStatements,
  team,
  hasSelected,
  selectedPsId,
  selectingPsId,
  selectedStack,
  setSelectingPsId,
  setSelectedStack,
  onSelectProblemStatement
}) => {
  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {problemStatements.length === 0 ? (
        <p className="text-slate-500 col-span-full italic">No problem statements have been published yet.</p>
      ) : (
        problemStatements.map((ps) => {
          const isSelected = selectedPsId === ps._id;
          
          return (
            <motion.div 
              variants={itemVariants}
              key={ps._id} 
              className={`bg-white dark:bg-slate-800 rounded-3xl shadow-sm overflow-hidden flex flex-col transition-all duration-300 relative group ${
                isSelected 
                  ? 'border-2 border-emerald-500 shadow-[0_0_30px_-10px_rgba(16,185,129,0.4)] scale-[1.02]' 
                  : hasSelected 
                    ? 'border border-slate-200 dark:border-slate-700 opacity-50 grayscale-[50%]' 
                    : 'border border-slate-200 dark:border-slate-700 hover:border-emerald-400 hover:shadow-lg'
              }`}
            >
              {isSelected && (
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 blur-[50px] rounded-full pointer-events-none"></div>
              )}
              <div className="p-8 flex-1 relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <span className="inline-block bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs px-3 py-1.5 rounded-lg font-bold border border-slate-200 dark:border-slate-600 uppercase tracking-wider">
                    {ps.track}
                  </span>
                  <div className="flex gap-2">
                    {ps.slotLimit > 0 && (
                      <span className={`text-xs px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider ${
                        ps.slotLimit - ps.slotsFilled <= 0 
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                      }`}>
                        {ps.slotLimit - ps.slotsFilled <= 0 ? 'Slots Over' : `${ps.slotLimit - ps.slotsFilled} Slots Left`}
                      </span>
                    )}
                    {isSelected && (
                      <span className="bg-emerald-500 text-white text-xs px-3 py-1.5 rounded-lg font-black shadow-sm uppercase tracking-wider">Locked</span>
                    )}
                  </div>
                </div>
                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-4 leading-tight">{ps.title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-2 line-clamp-3">{ps.description}</p>
                
                <Link href={`/team/problem-statement/${ps._id}`} className="inline-flex items-center text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors mb-4">
                  View full details <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
                
                {isSelected && team?.selectedStack && (
                  <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-800/30 inline-block">
                    <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Selected Stack</p>
                    <p className="text-emerald-800 dark:text-emerald-300 font-medium">{team.selectedStack}</p>
                  </div>
                )}
              </div>
              
              {!hasSelected && (
                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700/50">
                  {ps.slotLimit > 0 && ps.slotLimit - ps.slotsFilled <= 0 ? (
                     <button
                       disabled
                       className="w-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 py-3.5 rounded-xl font-bold cursor-not-allowed"
                     >
                       <Lock className="w-5 h-5 mr-2" /> Slots Over
                     </button>
                  ) : selectingPsId === ps._id ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5 ml-1">Proposed Tech Stack *</label>
                        <input 
                          type="text"
                          required
                          placeholder="Enter tech stack (e.g. Next.js, Python, TensorFlow)..."
                          className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all dark:text-white shadow-sm"
                          value={selectedStack}
                          onChange={(e) => setSelectedStack(e.target.value)}
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setSelectingPsId(null); setSelectedStack(''); }}
                          className="flex-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 py-3.5 rounded-xl font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors text-sm"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => onSelectProblemStatement(ps._id)}
                          className="flex-[2] flex items-center justify-center bg-emerald-600 text-white hover:bg-emerald-700 py-3.5 rounded-xl font-bold transition-all shadow-md shadow-emerald-500/20 text-sm"
                        >
                          <Target className="w-5 h-5 mr-2" /> Confirm & Lock
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectingPsId(ps._id);
                        setSelectedStack('');
                      }}
                      className="w-full flex items-center justify-center bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-indigo-600 dark:hover:bg-indigo-400 dark:hover:text-white py-3.5 rounded-xl font-bold transition-all shadow-md text-sm"
                    >
                      <Target className="w-5 h-5 mr-2" /> Select Problem Statement
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          );
        })
      )}
    </motion.div>
  );
};
