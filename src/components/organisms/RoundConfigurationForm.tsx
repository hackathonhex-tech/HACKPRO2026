import React from 'react';
import { Database, Plus } from 'lucide-react';
import { Input } from '@/components/atoms/Input';
import { Button } from '@/components/atoms/Button';
import { Label } from '@/components/atoms/Label';

export interface RoundFormData {
  name: string;
  activeRubricId: string;
  activeMemberRubricId: string;
  isActive: boolean;
}

interface RoundConfigurationFormProps {
  formData: RoundFormData;
  isEditing: boolean;
  rubrics: any[];
  onChange: (data: RoundFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancelEditing?: () => void;
}

export const RoundConfigurationForm: React.FC<RoundConfigurationFormProps> = ({
  formData,
  isEditing,
  rubrics,
  onChange,
  onSubmit,
  onCancelEditing
}) => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/50 overflow-hidden">
      <div className="p-6 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center">
          <Database className="w-5 h-5 mr-2 text-indigo-500" /> {isEditing ? 'Edit Evaluation Round' : 'Create Evaluation Round'}
        </h3>
      </div>
      <div className="p-6">
        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <Label>Round Name</Label>
            <Input 
              type="text" 
              required 
              placeholder="e.g. Round 1: Idea Pitch" 
              value={formData.name} 
              onChange={e => onChange({...formData, name: e.target.value})} 
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Team Rubric</Label>
              <select 
                required 
                value={formData.activeRubricId} 
                onChange={e => onChange({...formData, activeRubricId: e.target.value})} 
                className="w-full px-4 py-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all dark:text-white appearance-none cursor-pointer"
              >
                <option value="" disabled>Select Team Rubric...</option>
                {rubrics.map(r => (
                  <option key={r._id} value={r._id}>{r.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Member Rubric (Optional)</Label>
              <select 
                value={formData.activeMemberRubricId} 
                onChange={e => onChange({...formData, activeMemberRubricId: e.target.value})} 
                className="w-full px-4 py-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all dark:text-white appearance-none cursor-pointer"
              >
                <option value="">No Member Rubric</option>
                {rubrics.map(r => (
                  <option key={r._id} value={r._id}>{r.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-700/50 mt-4">
            <label className="flex items-center space-x-3 cursor-pointer group">
              <div className="relative flex items-center">
                <input 
                  type="checkbox" 
                  checked={formData.isActive} 
                  onChange={e => onChange({...formData, isActive: e.target.checked})} 
                  className="peer sr-only" 
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-500"></div>
              </div>
              <span className="text-sm font-bold text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">Set as Active Round (Deactivates others)</span>
            </label>
          </div>

          <div className="flex gap-4 mt-6">
            <Button type="submit" className="flex-1 !bg-emerald-600 hover:!bg-emerald-700 !shadow-emerald-600/30 text-white">
              <Plus className="w-4 h-4 mr-2" /> {isEditing ? 'Update Round' : 'Create Round'}
            </Button>
            {isEditing && onCancelEditing && (
              <Button type="button" variant="outline" onClick={onCancelEditing} className="px-6">
                Cancel
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
