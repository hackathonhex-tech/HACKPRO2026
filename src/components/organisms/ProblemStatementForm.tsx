import React, { useState } from 'react';
import { Target, Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/atoms/Input';
import { Button } from '@/components/atoms/Button';
import { Label } from '@/components/atoms/Label';

export interface ProblemStatementFormData {
  title: string;
  description: string;
  track: string;
  slotLimit: number;
  allowedStacks: string;
}

interface ProblemStatementFormProps {
  formData: ProblemStatementFormData;
  isEditing: boolean;
  onChange: (data: ProblemStatementFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancelEditing?: () => void;
}

interface Section {
  id: string;
  heading: string;
  content: string;
}

// Parses a formatted string back into sections
const parseDescriptionToSections = (text: string): Section[] => {
  if (!text) return [{ id: Date.now().toString(), heading: '', content: '' }];
  
  const lines = text.split('\n');
  const result: Section[] = [];
  let currentHeading = '';
  let currentContent: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    // Identifies a header line (ends with colon, short length)
    if (line.endsWith(':') && line.length > 0 && line.length < 100) {
      if (currentHeading || currentContent.length > 0) {
        result.push({ id: Math.random().toString(), heading: currentHeading, content: currentContent.join('\n').trim() });
      }
      currentHeading = line.replace(/:$/, '');
      currentContent = [];
    } else {
      currentContent.push(lines[i]); // keep original spacing
    }
  }
  
  if (currentHeading || currentContent.length > 0) {
    result.push({ id: Math.random().toString(), heading: currentHeading, content: currentContent.join('\n').trim() });
  }

  // Fallback if no headings found
  if (result.length === 0 && text) {
     return [{ id: Date.now().toString(), heading: '', content: text }];
  }

  return result.length > 0 ? result : [{ id: Date.now().toString(), heading: '', content: '' }];
};

// Serializes sections into the formatted string expected by the parser
const serializeSections = (sections: Section[]): string => {
  return sections
    .filter(s => s.heading.trim() || s.content.trim())
    .map(s => {
      const h = s.heading.trim();
      const c = s.content.trim();
      if (h) {
         // Capitalize first letter to ensure regex matches
         const formattedHeading = h.charAt(0).toUpperCase() + h.slice(1);
         return `${formattedHeading}:\n${c}`;
      }
      return c;
    })
    .join('\n\n');
};

export const ProblemStatementForm: React.FC<ProblemStatementFormProps> = ({
  formData,
  isEditing,
  onChange,
  onSubmit,
  onCancelEditing
}) => {
  const [sections, setSections] = useState<Section[]>(() => parseDescriptionToSections(formData.description));
  const [prevTracked, setPrevTracked] = useState({ title: formData.title, isEditing });

  // Sync sections when switching items or editing mode changes (React-recommended state adjustment during render)
  if (prevTracked.title !== formData.title || prevTracked.isEditing !== isEditing) {
    setPrevTracked({ title: formData.title, isEditing });
    setSections(parseDescriptionToSections(formData.description));
  }

  const updateSection = (idx: number, field: keyof Section, value: string) => {
    const newSections = [...sections];
    newSections[idx][field] = value;
    setSections(newSections);
    onChange({ ...formData, description: serializeSections(newSections) });
  };

  const addSection = () => {
    setSections([...sections, { id: Date.now().toString(), heading: '', content: '' }]);
  };

  const removeSection = (idx: number) => {
    const newSections = sections.filter((_, i) => i !== idx);
    setSections(newSections);
    onChange({ ...formData, description: serializeSections(newSections) });
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/50 overflow-hidden">
      <div className="p-6 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center">
          <Target className="w-5 h-5 mr-2 text-indigo-500" /> {isEditing ? 'Edit Problem Statement' : 'Add Problem Statement'}
        </h3>
      </div>
      <div className="p-6">
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <Label>Title</Label>
              <Input 
                required 
                placeholder="e.g. AI for Healthcare" 
                value={formData.title} 
                onChange={e => onChange({...formData, title: e.target.value})} 
              />
            </div>
            <div>
              <Label>Track</Label>
              <Input 
                required 
                placeholder="e.g. Web3, GenAI" 
                value={formData.track} 
                onChange={e => onChange({...formData, track: e.target.value})} 
              />
            </div>
            <div>
              <Label>Slot Limit</Label>
              <Input 
                type="number" 
                min="0" 
                placeholder="0 (unlimited)" 
                value={formData.slotLimit} 
                onChange={e => onChange({...formData, slotLimit: parseInt(e.target.value) || 0})} 
              />
            </div>
          </div>

          <div>
            <Label className="mb-3 block">Problem Statement Description</Label>
            <div className="space-y-4">
              {sections.map((section, idx) => (
                <div key={section.id} className="relative p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700/50 flex gap-3 items-start">
                  <div className="flex-1 space-y-3">
                    <Input 
                      placeholder="Section Heading (e.g. Background, Objectives)" 
                      value={section.heading}
                      onChange={e => updateSection(idx, 'heading', e.target.value)}
                      className="font-bold text-indigo-700 dark:text-indigo-400 bg-white dark:bg-slate-800"
                    />
                    <textarea 
                      required={idx === 0 && !section.heading} // at least some content is required
                      placeholder="Content for this section..." 
                      value={section.content} 
                      onChange={e => updateSection(idx, 'content', e.target.value)} 
                      className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all dark:text-white resize-y" 
                      rows={4}
                    />
                  </div>
                  {sections.length > 1 && (
                    <button 
                      type="button" 
                      onClick={() => removeSection(idx)} 
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors mt-1"
                      title="Remove Section"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <Button type="button" variant="outline" onClick={addSection} className="w-full mt-4 border-dashed border-2 text-indigo-600 dark:text-indigo-400">
              <Plus className="w-4 h-4 mr-2" /> Add Section
            </Button>
          </div>
          
          <div className="pt-4 border-t border-slate-100 dark:border-slate-700/50">
            <Button type="submit" variant="primary" className="w-full py-4 text-lg">
              <Target className="w-5 h-5 mr-2" /> {isEditing ? 'Save Changes' : 'Create Problem Statement'}
            </Button>
            {isEditing && onCancelEditing && (
              <Button type="button" variant="outline" onClick={onCancelEditing} className="w-full mt-3 py-3">
                Cancel Editing
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
