import React from 'react';
import { Power, Pencil, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface RoundConfigurationListProps {
  rounds: any[];
  onToggleSubmissions: (id: string, currentlyOpen: boolean) => void;
  onToggleRound: (id: string, currentlyActive: boolean) => void;
  onEditRound: (r: any) => void;
  onDeleteRound: (id: string) => void;
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
};

export const RoundConfigurationList: React.FC<RoundConfigurationListProps> = ({
  rounds,
  onToggleSubmissions,
  onToggleRound,
  onEditRound,
  onDeleteRound
}) => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/50 p-6">
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Configured Rounds</h3>
      <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
        {rounds.length === 0 ? (
          <p className="text-slate-500 text-sm italic">No rounds created.</p>
        ) : (
          rounds.map((r, idx) => (
            <motion.div 
              variants={itemVariants} 
              initial="hidden" 
              animate="visible" 
              transition={{ delay: idx * 0.05 }} 
              key={r._id || idx} 
              className={`p-4 border rounded-xl flex justify-between items-center ${r.isActive ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10' : 'border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50'}`}
            >
              <div>
                <p className={`font-bold ${r.isActive ? 'text-emerald-900 dark:text-emerald-100' : 'text-slate-900 dark:text-white'}`}>{r.name}</p>
                <p className={`text-xs mt-1 ${r.isActive ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500'}`}>
                  Team: {r.activeRubricId?.name || 'None'} | Member: {r.activeMemberRubricId?.name || 'None'}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => onToggleSubmissions(r._id, r.isSubmissionsOpen)} 
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${r.isSubmissionsOpen ? 'bg-indigo-500 text-white shadow-sm' : 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400'}`} 
                  title={r.isSubmissionsOpen ? "Close Submissions" : "Open Submissions"}
                >
                  {r.isSubmissionsOpen ? 'Submissions: ON' : 'Submissions: OFF'}
                </button>
                <button 
                  onClick={() => onToggleRound(r._id, r.isActive)} 
                  className={`p-1.5 rounded-lg transition-colors ${r.isActive ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm' : 'text-slate-400 hover:text-emerald-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`} 
                  title={r.isActive ? "Deactivate Round" : "Activate Round"}
                >
                  <Power className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => onEditRound(r)} 
                  className="text-slate-400 hover:text-indigo-500 hover:bg-slate-200 dark:hover:bg-slate-700 p-1.5 rounded-lg transition-colors" 
                  title="Edit Round"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => onDeleteRound(r._id)} 
                  className="text-slate-400 hover:text-red-500 hover:bg-slate-200 dark:hover:bg-slate-700 p-1.5 rounded-lg transition-colors" 
                  title="Delete Round"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};
