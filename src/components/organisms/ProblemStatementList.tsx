import React from 'react';
import { Pencil, Trash2, Eye } from 'lucide-react';
import { motion } from 'framer-motion';

interface ProblemStatementListProps {
  problemStatements: any[];
  onTogglePS: (id: string, currentlyVisible: boolean) => void;
  onEditPS: (ps: any) => void;
  onDeletePS: (id: string) => void;
  onPreviewPS: (ps: any) => void;
  onAddSlot?: (ps: any) => void;
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
};

export const ProblemStatementList: React.FC<ProblemStatementListProps> = ({
  problemStatements,
  onTogglePS,
  onEditPS,
  onDeletePS,
  onPreviewPS,
  onAddSlot
}) => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/50 p-6">
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Existing Statements</h3>
      <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
        {problemStatements.length === 0 ? (
          <p className="text-slate-500 text-sm italic">No problem statements added.</p>
        ) : (
          problemStatements.map((ps, idx) => (
            <motion.div 
              variants={itemVariants} 
              initial="hidden" 
              animate="visible" 
              transition={{ delay: idx * 0.05 }} 
              key={ps._id || idx} 
              className={`p-4 border border-slate-100 dark:border-slate-700 ${ps.isVisible === false ? 'bg-slate-100 dark:bg-slate-800 opacity-60' : 'bg-slate-50 dark:bg-slate-900/50'} rounded-xl group hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-colors flex justify-between items-start`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-bold text-slate-900 dark:text-white">{ps.title}</p>
                  {ps.isVisible === false && <span className="text-[10px] font-bold bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-md uppercase">Hidden</span>}
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="inline-block text-xs font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400 px-2 py-1 rounded-full">{ps.track}</span>
                  {ps.slotLimit > 0 && (
                    <div className="flex items-center gap-1">
                      <span className="inline-block text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 px-2 py-1 rounded-full">
                        Slots: {ps.slotsFilled} / {ps.slotLimit}
                      </span>
                      {onAddSlot && (
                        <button 
                          onClick={() => onAddSlot(ps)} 
                          title="Add +1 Extra Slot"
                          className="bg-amber-200 hover:bg-amber-300 text-amber-800 dark:bg-amber-500/30 dark:hover:bg-amber-500/50 dark:text-amber-300 px-2 py-1 rounded-full text-xs font-bold transition-colors"
                        >
                          +1
                        </button>
                      )}
                    </div>
                  )}
                  {ps.allowedStacks && ps.allowedStacks.length > 0 && (
                    <span className="inline-block text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 px-2 py-1 rounded-full" title={ps.allowedStacks.join(', ')}>
                      {ps.allowedStacks.length} Stacks
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-2 items-end ml-4">
                <label className="relative inline-flex items-center cursor-pointer" title={ps.isVisible ? 'Hide from Teams' : 'Show to Teams'}>
                  <input type="checkbox" checked={ps.isVisible !== false} onChange={() => onTogglePS(ps._id, ps.isVisible !== false)} className="sr-only peer" />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-500"></div>
                </label>
                <div className="flex gap-2">
                  <button onClick={() => onPreviewPS(ps)} className="text-slate-400 hover:text-emerald-500 transition-colors p-1" title="Preview Statement">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button onClick={() => onEditPS(ps)} className="text-slate-400 hover:text-indigo-500 transition-colors p-1" title="Edit">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => onDeletePS(ps._id)} className="text-slate-400 hover:text-red-500 transition-colors p-1" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};
