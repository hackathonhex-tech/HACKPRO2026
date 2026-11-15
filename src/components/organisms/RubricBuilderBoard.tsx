"use client";

import { useState } from 'react';
import { Save, Copy, Plus, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

const PREBUILT_TEMPLATES = [
  {
    name: 'Template A - Innovation-Weighted',
    criteria: [
      { name: 'Innovation', weight: 30, maxScore: 10 },
      { name: 'Technical Feasibility', weight: 25, maxScore: 10 },
      { name: 'Impact', weight: 20, maxScore: 10 },
      { name: 'Presentation', weight: 15, maxScore: 10 },
      { name: 'Scalability', weight: 10, maxScore: 10 },
    ]
  },
  {
    name: 'Template B - Execution-Weighted',
    criteria: [
      { name: 'Working Prototype', weight: 35, maxScore: 10 },
      { name: 'Technical Depth', weight: 25, maxScore: 10 },
      { name: 'Problem-Fit', weight: 20, maxScore: 10 },
      { name: 'UI/UX', weight: 10, maxScore: 10 },
      { name: 'Presentation', weight: 10, maxScore: 10 },
    ]
  },
  {
    name: 'Template C - Impact-Weighted',
    criteria: [
      { name: 'Real-world Impact', weight: 30, maxScore: 10 },
      { name: 'Innovation', weight: 25, maxScore: 10 },
      { name: 'Feasibility', weight: 20, maxScore: 10 },
      { name: 'Team Understanding', weight: 15, maxScore: 10 },
      { name: 'Presentation', weight: 10, maxScore: 10 },
    ]
  },
  {
    name: 'Template D - Member Eval (Standard)',
    criteria: [
      { name: 'Technical Contribution', weight: 40, maxScore: 10 },
      { name: 'Teamwork & Collaboration', weight: 30, maxScore: 10 },
      { name: 'Communication', weight: 20, maxScore: 10 },
      { name: 'Problem Solving', weight: 10, maxScore: 10 },
    ]
  },
  {
    name: 'Template E - Member Eval (Leadership)',
    criteria: [
      { name: 'Leadership & Vision', weight: 35, maxScore: 10 },
      { name: 'Execution & Delivery', weight: 35, maxScore: 10 },
      { name: 'Communication', weight: 20, maxScore: 10 },
      { name: 'Mentorship', weight: 10, maxScore: 10 },
    ]
  }
];

export interface RubricBuilderBoardProps {
  rubrics: any[];
  onRefresh: () => void;
  onSaveRubric: (rubric: any) => Promise<boolean>;
  onDeleteRubric: (id: string) => Promise<boolean>;
}

export function RubricBuilderBoard({ rubrics, onRefresh, onSaveRubric, onDeleteRubric }: RubricBuilderBoardProps) {
  const [activeRubric, setActiveRubric] = useState({ name: 'Custom Rubric', criteria: PREBUILT_TEMPLATES[0].criteria });

  const totalWeight = activeRubric.criteria.reduce((acc, c) => acc + Number(c.weight), 0);

  const updateCriterion = (index: number, field: string, value: any) => {
    const newCriteria = [...activeRubric.criteria];
    newCriteria[index] = { ...newCriteria[index], [field]: value };
    setActiveRubric({ ...activeRubric, criteria: newCriteria });
  };

  const removeCriterion = (index: number) => {
    const newCriteria = activeRubric.criteria.filter((_, i) => i !== index);
    setActiveRubric({ ...activeRubric, criteria: newCriteria });
  };

  const addCriterion = () => {
    setActiveRubric({
      ...activeRubric,
      criteria: [...activeRubric.criteria, { name: 'New Criterion', weight: 0, maxScore: 5 }]
    });
  };

  const loadTemplate = (template: any) => {
    setActiveRubric({ name: template.name + ' (Copy)', criteria: JSON.parse(JSON.stringify(template.criteria)) });
  };

  const handleSave = async () => {
    if (totalWeight !== 100) {
      alert('Total weight must equal 100%');
      return;
    }
    const success = await onSaveRubric(activeRubric);
    if (success) {
      alert('Rubric saved successfully!');
      onRefresh();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this rubric?')) return;
    const success = await onDeleteRubric(id);
    if (success) {
      onRefresh();
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-10">
      <div className="mb-8">
        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">Rubric Builder</h2>
        <p className="text-slate-500 mt-1">Design grading criteria for your hackathon rounds.</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Templates Sidebar */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6 border border-slate-100 dark:border-slate-700/50">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Prebuilt Templates</h3>
            <div className="space-y-3">
              {PREBUILT_TEMPLATES.map((t, idx) => (
                <button
                  key={idx}
                  onClick={() => loadTemplate(t)}
                  className="w-full text-left p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all group"
                >
                  <p className="font-bold text-slate-800 dark:text-white text-sm">{t.name}</p>
                  <p className="text-xs text-slate-500 mt-1 flex items-center">
                    <Copy className="w-3 h-3 mr-1 opacity-0 group-hover:opacity-100 transition-opacity" /> Click to clone
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6 border border-slate-100 dark:border-slate-700/50">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Saved Rubrics</h3>
            <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
              {rubrics.length === 0 ? <p className="text-slate-500 text-sm italic">No custom rubrics saved yet.</p> : rubrics.map((r, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all group">
                  <button
                    onClick={() => loadTemplate(r)}
                    className="text-left flex-1"
                  >
                    <p className="font-semibold text-slate-800 dark:text-white text-sm">{r.name}</p>
                  </button>
                  <button onClick={() => handleDelete(r._id)} className="p-1.5 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all ml-2">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Builder Editor */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-8 border border-slate-100 dark:border-slate-700/50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4 border-b border-slate-100 dark:border-slate-700/50 pb-6">
              <input
                type="text"
                value={activeRubric.name}
                onChange={(e) => setActiveRubric({ ...activeRubric, name: e.target.value })}
                className="text-2xl font-black bg-transparent border-b-2 border-transparent hover:border-slate-300 focus:border-indigo-500 outline-none text-slate-900 dark:text-white pb-1 transition-colors w-full sm:w-auto"
              />
              
              <div className={`px-4 py-2 rounded-xl text-sm font-bold shadow-sm ${totalWeight === 100 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'}`}>
                Total Weight: {totalWeight}%
              </div>
            </div>

            <motion.div layout className="space-y-6">
              {activeRubric.criteria.map((criterion, index) => (
                <motion.div layout key={index} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} className="p-5 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 relative hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-colors group">
                  <button onClick={() => removeCriterion(index)} className="absolute top-5 right-5 text-slate-400 hover:text-red-500 transition-colors opacity-50 group-hover:opacity-100">
                    <Trash2 className="w-5 h-5" />
                  </button>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mr-8">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Criterion Name</label>
                      <input
                        type="text"
                        value={criterion.name}
                        onChange={(e) => updateCriterion(index, 'name', e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        <span>Weight</span>
                        <span className="text-indigo-600 dark:text-indigo-400 font-black">{criterion.weight}%</span>
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={criterion.weight}
                        onChange={(e) => updateCriterion(index, 'weight', Number(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700 accent-indigo-600 mt-3"
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            <div className="mt-8 flex flex-col sm:flex-row justify-between items-center gap-4 pt-6">
              <button
                onClick={addCriterion}
                className="flex items-center text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 px-5 py-2.5 rounded-xl font-bold transition-all"
              >
                <Plus className="w-5 h-5 mr-2" /> Add Criterion
              </button>
              
              <button
                onClick={handleSave}
                className="flex items-center bg-indigo-600 hover:bg-indigo-700 hover:scale-[1.02] active:scale-[0.98] text-white px-8 py-3 rounded-xl font-bold shadow-[0_0_20px_-5px_rgba(79,70,229,0.5)] transition-all w-full sm:w-auto justify-center"
              >
                <Save className="w-5 h-5 mr-2" /> Save Rubric
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
