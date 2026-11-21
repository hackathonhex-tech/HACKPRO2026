"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  ArrowUp, 
  ArrowDown, 
  Eye, 
  Save, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  Users, 
  Building2, 
  Sparkles,
  SlidersHorizontal
} from 'lucide-react';
import { Button } from '../atoms/Button';
import { Input } from '../atoms/Input';
import { Label } from '../atoms/Label';
import { Modal } from '../molecules/Modal';
import { getAdminSettingsAction, updateRegistrationFieldsConfigAction } from '@/server/actions/settings.actions';

export interface FormFieldConfig {
  id: string;
  key: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'tel' | 'select' | 'textarea';
  placeholder?: string;
  required: boolean;
  enabled: boolean;
  isCustom: boolean;
  options?: string[];
  description?: string;
}

export interface RegistrationFieldsConfig {
  teamFields: FormFieldConfig[];
  memberFields: FormFieldConfig[];
}

const DEFAULT_CONFIG: RegistrationFieldsConfig = {
  teamFields: [
    { id: 'name', key: 'name', label: 'Team Name', type: 'text', placeholder: 'e.g. Code Ninjas', required: true, enabled: true, isCustom: false, description: 'Unique name of your hackathon team' },
    { id: 'collegeName', key: 'collegeName', label: 'College / Institution', type: 'text', placeholder: 'e.g. MIT Chennai', required: true, enabled: true, isCustom: false, description: 'College or university affiliation' },
    { id: 'department', key: 'department', label: 'Department', type: 'text', placeholder: 'e.g. Computer Science', required: true, enabled: true, isCustom: false, description: 'Academic department or engineering branch' }
  ],
  memberFields: [
    { id: 'name', key: 'name', label: 'Full Name', type: 'text', placeholder: 'e.g. John Doe', required: true, enabled: true, isCustom: false, description: 'Full legal/academic name' },
    { id: 'supersetId', key: 'supersetId', label: 'Superset ID / Roll No', type: 'text', placeholder: 'e.g. 123456', required: true, enabled: true, isCustom: false, description: 'Candidate Superset ID or college roll number' },
    { id: 'email', key: 'email', label: 'Email ID', type: 'email', placeholder: 'e.g. john@college.edu', required: true, enabled: true, isCustom: false, description: 'Contact email (used as login ID for Team Lead)' },
    { id: 'phone', key: 'phone', label: 'Phone Number', type: 'tel', placeholder: 'e.g. 9876543210', required: true, enabled: true, isCustom: false, description: '10-digit mobile number' }
  ]
};

export const RegistrationFieldConfigBoard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'team' | 'member'>('team');
  const [config, setConfig] = useState<RegistrationFieldsConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingField, setEditingField] = useState<FormFieldConfig | null>(null);
  const [isNewField, setIsNewField] = useState(false);
  const [targetSection, setTargetSection] = useState<'team' | 'member'>('team');

  // Form states for modal
  const [formLabel, setFormLabel] = useState('');
  const [formKey, setFormKey] = useState('');
  const [formType, setFormType] = useState<FormFieldConfig['type']>('text');
  const [formPlaceholder, setFormPlaceholder] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formRequired, setFormRequired] = useState(false);
  const [formEnabled, setFormEnabled] = useState(true);
  const [formOptionsInput, setFormOptionsInput] = useState('');
  const [formOptions, setFormOptions] = useState<string[]>([]);

  // Preview modal
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res: any = await getAdminSettingsAction();
      if (res.success && res.settings?.registrationFieldsConfig) {
        setConfig(res.settings.registrationFieldsConfig);
      } else {
        setConfig(DEFAULT_CONFIG);
      }
    } catch {
      setFeedback({ type: 'error', message: 'Failed to load registration fields configuration.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      const res: any = await updateRegistrationFieldsConfigAction(config);
      if (res.success) {
        setFeedback({ type: 'success', message: 'Registration fields saved and live on the registration page!' });
      } else {
        setFeedback({ type: 'error', message: res.message || 'Failed to save configuration.' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Network error while saving configuration.' });
    } finally {
      setSaving(false);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const handleResetDefaults = () => {
    if (confirm('Are you sure you want to reset all registration fields to standard default fields? Any custom fields will be removed.')) {
      setConfig(DEFAULT_CONFIG);
      setFeedback({ type: 'success', message: 'Fields reset to default template. Click "Save Changes" to apply.' });
    }
  };

  const openAddFieldModal = (section: 'team' | 'member') => {
    setTargetSection(section);
    setIsNewField(true);
    setEditingField(null);
    setFormLabel('');
    setFormKey('');
    setFormType('text');
    setFormPlaceholder('');
    setFormDescription('');
    setFormRequired(false);
    setFormEnabled(true);
    setFormOptions([]);
    setFormOptionsInput('');
    setIsEditModalOpen(true);
  };

  const openEditFieldModal = (field: FormFieldConfig, section: 'team' | 'member') => {
    setTargetSection(section);
    setIsNewField(false);
    setEditingField(field);
    setFormLabel(field.label);
    setFormKey(field.key);
    setFormType(field.type);
    setFormPlaceholder(field.placeholder || '');
    setFormDescription(field.description || '');
    setFormRequired(field.required);
    setFormEnabled(field.enabled);
    setFormOptions(field.options || []);
    setFormOptionsInput('');
    setIsEditModalOpen(true);
  };

  const handleAddOption = () => {
    const trimmed = formOptionsInput.trim();
    if (trimmed && !formOptions.includes(trimmed)) {
      setFormOptions([...formOptions, trimmed]);
      setFormOptionsInput('');
    }
  };

  const handleRemoveOption = (index: number) => {
    setFormOptions(formOptions.filter((_, i) => i !== index));
  };

  const handleSaveFieldModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formLabel.trim()) return;

    let key = formKey.trim();
    if (!key) {
      key = formLabel
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .replace(/^_+|_+$/g, '');
    }

    const fieldData: FormFieldConfig = {
      id: editingField ? editingField.id : `custom_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      key,
      label: formLabel.trim(),
      type: formType,
      placeholder: formPlaceholder.trim(),
      description: formDescription.trim(),
      required: formRequired,
      enabled: formEnabled,
      isCustom: editingField ? editingField.isCustom : true,
      options: formType === 'select' ? formOptions : undefined
    };

    const targetListKey = targetSection === 'team' ? 'teamFields' : 'memberFields';
    const list = [...config[targetListKey]];

    if (isNewField) {
      list.push(fieldData);
    } else {
      const idx = list.findIndex(f => f.id === fieldData.id);
      if (idx !== -1) {
        list[idx] = fieldData;
      }
    }

    setConfig({ ...config, [targetListKey]: list });
    setIsEditModalOpen(false);
  };

  const handleDeleteField = (id: string, section: 'team' | 'member') => {
    const targetListKey = section === 'team' ? 'teamFields' : 'memberFields';
    const field = config[targetListKey].find(f => f.id === id);
    if (!field) return;

    if (!confirm(`Are you sure you want to remove the field "${field.label}"?`)) return;

    setConfig({
      ...config,
      [targetListKey]: config[targetListKey].filter(f => f.id !== id)
    });
  };

  const handleToggleEnabled = (id: string, section: 'team' | 'member') => {
    const targetListKey = section === 'team' ? 'teamFields' : 'memberFields';
    setConfig({
      ...config,
      [targetListKey]: config[targetListKey].map(f => {
        if (f.id === id) {
          return { ...f, enabled: !f.enabled };
        }
        return f;
      })
    });
  };

  const handleToggleRequired = (id: string, section: 'team' | 'member') => {
    const targetListKey = section === 'team' ? 'teamFields' : 'memberFields';
    setConfig({
      ...config,
      [targetListKey]: config[targetListKey].map(f => {
        if (f.id === id) {
          return { ...f, required: !f.required };
        }
        return f;
      })
    });
  };

  const handleMoveField = (index: number, direction: 'up' | 'down', section: 'team' | 'member') => {
    const targetListKey = section === 'team' ? 'teamFields' : 'memberFields';
    const list = [...config[targetListKey]];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;

    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;

    setConfig({ ...config, [targetListKey]: list });
  };

  const currentFields = activeTab === 'team' ? config.teamFields : config.memberFields;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#3760F8]"></div>
        <p className="text-slate-500 font-medium">Loading registration fields configuration...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="p-2 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-[#3760F8]">
              <SlidersHorizontal className="w-5 h-5" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-[#3760F8]">Registration System</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">Registration Fields Setup</h1>
          <p className="text-slate-500 text-sm mt-1 max-w-2xl">
            Customize, toggle, reorder, and add new custom fields for student registration. Any changes made here are instantly reflected on the live registration form.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button 
            variant="outline" 
            onClick={handleResetDefaults}
            className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300"
          >
            <RotateCcw className="w-4 h-4 mr-2" /> Reset Defaults
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setIsPreviewOpen(true)}
            className="text-xs sm:text-sm font-bold text-indigo-600 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
          >
            <Eye className="w-4 h-4 mr-2" /> Preview Form
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="text-xs sm:text-sm font-bold bg-[#3760F8] hover:bg-blue-600 text-white shadow-lg shadow-blue-500/20"
          >
            {saving ? (
              <span className="flex items-center"><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" /> Saving...</span>
            ) : (
              <span className="flex items-center"><Save className="w-4 h-4 mr-2" /> Save Changes</span>
            )}
          </Button>
        </div>
      </div>

      {/* Alert / Feedback message */}
      {feedback && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }} 
          className={`p-4 rounded-xl flex items-center font-bold text-sm ${
            feedback.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' 
              : 'bg-red-50 text-red-800 border border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 mr-3 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0 text-red-600 dark:text-red-400" />
          )}
          {feedback.message}
        </motion.div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 space-x-6">
        <button
          onClick={() => setActiveTab('team')}
          className={`pb-4 px-2 font-bold text-sm sm:text-base flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'team'
              ? 'border-[#3760F8] text-[#3760F8]'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Section 1: Team Information Fields ({config.teamFields.length})
        </button>
        <button
          onClick={() => setActiveTab('member')}
          className={`pb-4 px-2 font-bold text-sm sm:text-base flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'member'
              ? 'border-[#3760F8] text-[#3760F8]'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          Sections 2 & 3: Member & Lead Details ({config.memberFields.length})
        </button>
      </div>

      {/* Section Description and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            {activeTab === 'team' ? (
              <>
                <Building2 className="w-5 h-5 text-[#3760F8]" />
                Team-Level Fields (Section 1)
              </>
            ) : (
              <>
                <Users className="w-5 h-5 text-[#3760F8]" />
                Individual Member & Lead Fields (Sections 2 & 3)
              </>
            )}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {activeTab === 'team'
              ? 'These fields are filled out once for the entire team (e.g. Team Name, College, Department, Project Title, Track).'
              : 'These fields are repeated for the Team Lead (Member 1) and each subsequent Team Member (e.g. Name, Roll No, Phone, T-Shirt, Gender).'}
          </p>
        </div>

        <Button 
          onClick={() => openAddFieldModal(activeTab)}
          className="bg-[#3760F8] hover:bg-blue-600 text-white font-bold text-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Custom Field
        </Button>
      </div>

      {/* Field Cards List */}
      <div className="space-y-3">
        <AnimatePresence>
          {currentFields.map((field, index) => (
            <motion.div
              key={field.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`p-5 rounded-xl border transition-all ${
                field.enabled 
                  ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm' 
                  : 'bg-slate-50/70 dark:bg-slate-900/50 border-slate-200/60 dark:border-slate-800/60 opacity-60'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Left: Reorder Controls + Info */}
                <div className="flex items-start gap-3 min-w-0">
                  {/* Up/Down buttons */}
                  <div className="flex flex-col space-y-1 mt-0.5 flex-shrink-0">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMoveField(index, 'up', activeTab)}
                      className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 text-slate-500 transition-colors"
                      title="Move Up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={index === currentFields.length - 1}
                      onClick={() => handleMoveField(index, 'down', activeTab)}
                      className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 text-slate-500 transition-colors"
                      title="Move Down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-bold text-base text-slate-900 dark:text-white">
                        {field.label}
                      </span>
                      {field.required && (
                        <span className="text-red-500 font-bold text-sm" title="Required">*</span>
                      )}
                      <span className="text-xs font-mono bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded">
                        key: {field.key}
                      </span>
                      <span className="text-xs font-semibold bg-blue-50 dark:bg-blue-900/30 text-[#3760F8] px-2 py-0.5 rounded uppercase">
                        {field.type}
                      </span>
                      {field.isCustom ? (
                        <span className="text-xs font-semibold bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 px-2 py-0.5 rounded flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> Custom Field
                        </span>
                      ) : (
                        <span className="text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-500 px-2 py-0.5 rounded">
                          Standard Field
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                      {field.placeholder && (
                        <span>Placeholder: <code className="bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded text-slate-700 dark:text-slate-300">{field.placeholder}</code></span>
                      )}
                      {field.description && (
                        <span className="italic">{field.description}</span>
                      )}
                      {field.type === 'select' && field.options && field.options.length > 0 && (
                        <span>Options: {field.options.join(', ')}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Controls & Actions */}
                <div className="flex flex-wrap items-center gap-3 lg:self-center ml-9 lg:ml-0">
                  {/* Required Toggle */}
                  <button
                    type="button"
                    onClick={() => handleToggleRequired(field.id, activeTab)}
                    className={`text-xs px-2.5 py-1 rounded-lg font-bold border transition-all ${
                      field.required
                        ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'
                        : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                    }`}
                  >
                    {field.required ? 'Required' : 'Optional'}
                  </button>

                  {/* Enabled Toggle */}
                  <button
                    type="button"
                    onClick={() => handleToggleEnabled(field.id, activeTab)}
                    className={`text-xs px-2.5 py-1 rounded-lg font-bold border transition-all ${
                      field.enabled
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                        : 'bg-red-50 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20'
                    }`}
                  >
                    {field.enabled ? 'Visible on Form' : 'Hidden'}
                  </button>

                  {/* Edit button */}
                  <button
                    type="button"
                    onClick={() => openEditFieldModal(field, activeTab)}
                    className="p-1.5 text-slate-500 hover:text-[#3760F8] hover:bg-blue-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    title="Edit Field"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  {/* Delete button (custom fields only) */}
                  {field.isCustom && (
                    <button
                      type="button"
                      onClick={() => handleDeleteField(field.id, activeTab)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Delete Field"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Field Edit / Add Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={isNewField ? `Add Custom Field (${targetSection === 'team' ? 'Team Info' : 'Member Details'})` : `Edit Field: ${editingField?.label}`}
        maxWidth="lg"
      >
        <form onSubmit={handleSaveFieldModal} className="space-y-4">
          <div>
            <Label>Field Label *</Label>
            <Input
              type="text"
              required
              value={formLabel}
              onChange={e => {
                setFormLabel(e.target.value);
                if (isNewField && !formKey) {
                  setFormKey(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/^_+|_+$/g, ''));
                }
              }}
              placeholder="e.g. T-Shirt Size, GitHub Profile, Track"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Field Key / Database Identifier *</Label>
              <Input
                type="text"
                required
                disabled={!isNewField && !editingField?.isCustom}
                value={formKey}
                onChange={e => setFormKey(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                placeholder="e.g. tshirtSize"
              />
              <span className="text-[11px] text-slate-400 block mt-1">Unique key used in database storage.</span>
            </div>

            <div>
              <Label>Input Type *</Label>
              <select
                value={formType}
                onChange={e => setFormType(e.target.value as any)}
                disabled={!isNewField && !editingField?.isCustom}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#3760F8]"
              >
                <option value="text">Short Text (Single Line)</option>
                <option value="number">Number</option>
                <option value="email">Email Address</option>
                <option value="tel">Phone / Mobile</option>
                <option value="select">Dropdown Select</option>
                <option value="textarea">Long Text (Multi-Line)</option>
              </select>
            </div>
          </div>

          <div>
            <Label>Placeholder Text</Label>
            <Input
              type="text"
              value={formPlaceholder}
              onChange={e => setFormPlaceholder(e.target.value)}
              placeholder="e.g. Enter your roll number or select size"
            />
          </div>

          <div>
            <Label>Helper Description / Subtitle</Label>
            <Input
              type="text"
              value={formDescription}
              onChange={e => setFormDescription(e.target.value)}
              placeholder="Optional hint displayed under the field"
            />
          </div>

          {/* If Type is Select: Dropdown Options Manager */}
          {formType === 'select' && (
            <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
              <Label>Dropdown Options *</Label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={formOptionsInput}
                  onChange={e => setFormOptionsInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddOption();
                    }
                  }}
                  placeholder="Type an option and press Add (e.g. XL, Web Dev)"
                />
                <Button type="button" onClick={handleAddOption} className="bg-[#3760F8] text-white">
                  Add
                </Button>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {formOptions.map((opt, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 gap-1"
                  >
                    {opt}
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(i)}
                      className="hover:text-red-600 ml-1 text-slate-500"
                    >
                      ×
                    </button>
                  </span>
                ))}
                {formOptions.length === 0 && (
                  <span className="text-xs text-slate-400 italic">No options added yet. Add at least one option.</span>
                )}
              </div>
            </div>
          )}

          {/* Toggles */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <label className="flex items-center gap-2 cursor-pointer p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900">
              <input
                type="checkbox"
                checked={formRequired}
                onChange={e => setFormRequired(e.target.checked)}
                className="w-4 h-4 text-[#3760F8] rounded"
              />
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Required Field</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900">
              <input
                type="checkbox"
                checked={formEnabled}
                onChange={e => setFormEnabled(e.target.checked)}
                className="w-4 h-4 text-[#3760F8] rounded"
              />
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Visible on Form</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-[#3760F8] text-white font-bold">
              {isNewField ? 'Add Field' : 'Update Field'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Form Live Preview Modal */}
      <Modal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title="Live Registration Form Preview"
        maxWidth="3xl"
      >
        <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-2">
          <p className="text-xs text-slate-500">
            This preview simulates how your configured fields will look to students on the public registration page (<code className="text-[#3760F8]">/register</code>).
          </p>

          {/* Section 1 Preview */}
          <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
              <span className="w-6 h-6 rounded-md bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 flex items-center justify-center text-xs font-black">1</span>
              Team Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {config.teamFields.filter(f => f.enabled).map(f => (
                <div key={f.id} className={f.type === 'textarea' ? 'md:col-span-2 lg:col-span-3' : ''}>
                  <Label>{f.label} {f.required && <span className="text-red-500">*</span>}</Label>
                  {f.type === 'select' ? (
                    <select className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800">
                      <option value="">{f.placeholder || `Select ${f.label}`}</option>
                      {f.options?.map((o, idx) => <option key={idx} value={o}>{o}</option>)}
                    </select>
                  ) : f.type === 'textarea' ? (
                    <textarea rows={2} className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800" placeholder={f.placeholder} />
                  ) : (
                    <Input type={f.type} placeholder={f.placeholder} />
                  )}
                  {f.description && <span className="text-[11px] text-slate-400 block mt-1">{f.description}</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Section 2 Preview */}
          <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
              <span className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 flex items-center justify-center text-xs font-black">2</span>
              Team Lead Details (Member 1)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {config.memberFields.filter(f => f.enabled).map(f => (
                <div key={f.id} className={f.type === 'textarea' ? 'md:col-span-2 lg:col-span-3' : ''}>
                  <Label>{f.label} {f.required && <span className="text-red-500">*</span>}</Label>
                  {f.type === 'select' ? (
                    <select className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800">
                      <option value="">{f.placeholder || `Select ${f.label}`}</option>
                      {f.options?.map((o, idx) => <option key={idx} value={o}>{o}</option>)}
                    </select>
                  ) : f.type === 'textarea' ? (
                    <textarea rows={2} className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800" placeholder={f.placeholder} />
                  ) : (
                    <Input type={f.type} placeholder={f.placeholder} />
                  )}
                  {f.description && <span className="text-[11px] text-slate-400 block mt-1">{f.description}</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Section 3 Preview */}
          <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
              <span className="w-6 h-6 rounded-md bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 flex items-center justify-center text-xs font-black">3</span>
              Team Member 2 Preview
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {config.memberFields.filter(f => f.enabled).map(f => (
                <div key={f.id} className={f.type === 'textarea' ? 'md:col-span-2 lg:col-span-3' : ''}>
                  <Label>{f.label} {f.required && <span className="text-red-500">*</span>}</Label>
                  {f.type === 'select' ? (
                    <select className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800">
                      <option value="">{f.placeholder || `Select ${f.label}`}</option>
                      {f.options?.map((o, idx) => <option key={idx} value={o}>{o}</option>)}
                    </select>
                  ) : f.type === 'textarea' ? (
                    <textarea rows={2} className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800" placeholder={f.placeholder} />
                  ) : (
                    <Input type={f.type} placeholder={f.placeholder} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={() => setIsPreviewOpen(false)} className="bg-[#3760F8] text-white">
            Close Preview
          </Button>
        </div>
      </Modal>
    </div>
  );
};
