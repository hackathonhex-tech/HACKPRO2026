"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { UserPlus, CheckCircle, Users, Plus, Trash2, AlertCircle } from 'lucide-react';
import { Button } from '../atoms/Button';
import { Input } from '../atoms/Input';
import { Label } from '../atoms/Label';
import { Card } from '../atoms/Card';
import { registerTeamAction } from '@/server/actions/team.actions';
import { getPublicSettingsAction } from '@/server/actions/settings.actions';
import { FormFieldConfig, RegistrationFieldsConfig } from './RegistrationFieldConfigBoard';

interface MemberForm {
  name: string;
  supersetId: string;
  email: string;
  phone: string;
  customFields: Record<string, any>;
}

const DEFAULT_TEAM_FIELDS: FormFieldConfig[] = [
  { id: 'name', key: 'name', label: 'Team Name', type: 'text', placeholder: 'e.g. Code Ninjas', required: true, enabled: true, isCustom: false },
  { id: 'collegeName', key: 'collegeName', label: 'College / Institution', type: 'text', placeholder: 'e.g. MIT Chennai', required: true, enabled: true, isCustom: false },
  { id: 'department', key: 'department', label: 'Department', type: 'text', placeholder: 'e.g. Computer Science', required: true, enabled: true, isCustom: false }
];

const DEFAULT_MEMBER_FIELDS: FormFieldConfig[] = [
  { id: 'name', key: 'name', label: 'Full Name', type: 'text', placeholder: 'e.g. John Doe', required: true, enabled: true, isCustom: false },
  { id: 'supersetId', key: 'supersetId', label: 'Superset ID / Roll No', type: 'text', placeholder: 'e.g. 123456', required: true, enabled: true, isCustom: false },
  { id: 'email', key: 'email', label: 'Email ID', type: 'email', placeholder: 'e.g. john@college.edu', required: true, enabled: true, isCustom: false },
  { id: 'phone', key: 'phone', label: 'Phone Number', type: 'tel', placeholder: 'e.g. 9876543210', required: true, enabled: true, isCustom: false }
];

const emptyMember = (): MemberForm => ({
  name: '',
  supersetId: '',
  email: '',
  phone: '',
  customFields: {}
});

export const RegistrationForm: React.FC = () => {
  const router = useRouter();

  // Dynamic fields configuration from Settings
  const [teamFields, setTeamFields] = useState<FormFieldConfig[]>(DEFAULT_TEAM_FIELDS);
  const [memberFields, setMemberFields] = useState<FormFieldConfig[]>(DEFAULT_MEMBER_FIELDS);

  // Section 1: Team Info
  const [teamName, setTeamName] = useState('');
  const [collegeName, setCollegeName] = useState('');
  const [department, setDepartment] = useState('');
  const [teamCustomFields, setTeamCustomFields] = useState<Record<string, any>>({});

  // Section 2: Team Lead
  const [leadName, setLeadName] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadSupersetId, setLeadSupersetId] = useState('');
  const [leadCustomFields, setLeadCustomFields] = useState<Record<string, any>>({});

  // Section 3: Members
  const [members, setMembers] = useState<MemberForm[]>([emptyMember(), emptyMember(), emptyMember()]);
  const [maxTeamSize, setMaxTeamSize] = useState(4);

  // System states
  const [isRegistrationOpen, setIsRegistrationOpen] = useState<boolean | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null);
  const [loading, setLoading] = useState(false);
  const [registeredTeam, setRegisteredTeam] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    getPublicSettingsAction()
      .then((data: any) => {
        if (data.success && data.settings) {
          const size = data.settings.maxTeamSize ?? 4;
          setMaxTeamSize(size);
          setIsRegistrationOpen(data.settings.isRegistrationOpen ?? true);

          if (data.settings.registrationFieldsConfig) {
            const config: RegistrationFieldsConfig = data.settings.registrationFieldsConfig;
            if (config.teamFields && config.teamFields.length > 0) {
              setTeamFields(config.teamFields);
            }
            if (config.memberFields && config.memberFields.length > 0) {
              setMemberFields(config.memberFields);
            }
          }

          const requiredMembers = Math.max(0, size - 1);
          setMembers(Array.from({ length: requiredMembers }, () => emptyMember()));
        } else {
          setIsRegistrationOpen(true);
        }
      })
      .catch(err => {
        console.error('Failed to fetch public settings:', err);
        setIsRegistrationOpen(true);
      });
  }, []);

  // Helper getters & setters for Section 1 (Team)
  const getTeamFieldValue = (key: string): any => {
    if (key === 'name') return teamName;
    if (key === 'collegeName') return collegeName;
    if (key === 'department') return department;
    return teamCustomFields[key] || '';
  };

  const setTeamFieldValue = (key: string, value: any) => {
    if (key === 'name') setTeamName(value);
    else if (key === 'collegeName') setCollegeName(value);
    else if (key === 'department') setDepartment(value);
    else setTeamCustomFields(prev => ({ ...prev, [key]: value }));
  };

  // Helper getters & setters for Section 2 (Lead)
  const getLeadFieldValue = (key: string): any => {
    if (key === 'name') return leadName;
    if (key === 'supersetId') return leadSupersetId;
    if (key === 'email') return leadEmail;
    if (key === 'phone') return leadPhone;
    return leadCustomFields[key] || '';
  };

  const setLeadFieldValue = (key: string, value: any) => {
    if (key === 'name') setLeadName(value);
    else if (key === 'supersetId') setLeadSupersetId(value);
    else if (key === 'email') setLeadEmail(value);
    else if (key === 'phone') setLeadPhone(value);
    else setLeadCustomFields(prev => ({ ...prev, [key]: value }));
  };

  // Helper getters & setters for Section 3 (Members)
  const getMemberFieldValue = (index: number, key: string): any => {
    const m = members[index];
    if (!m) return '';
    if (key === 'name') return m.name;
    if (key === 'supersetId') return m.supersetId;
    if (key === 'email') return m.email;
    if (key === 'phone') return m.phone;
    return m.customFields?.[key] || '';
  };

  const setMemberFieldValue = (index: number, key: string, value: any) => {
    setMembers(prev => {
      const copy = [...prev];
      const m = { ...copy[index] };
      if (key === 'name') m.name = value;
      else if (key === 'supersetId') m.supersetId = value;
      else if (key === 'email') m.email = value;
      else if (key === 'phone') m.phone = value;
      else {
        m.customFields = { ...(m.customFields || {}), [key]: value };
      }
      copy[index] = m;
      return copy;
    });
  };

  // Generic Field Input Renderer
  const renderFieldInput = (
    field: FormFieldConfig,
    value: any,
    onChange: (val: any) => void
  ) => {
    if (field.type === 'select') {
      return (
        <select
          required={field.required}
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#3760F8] transition-all"
        >
          <option value="">{field.placeholder || `Select ${field.label}`}</option>
          {field.options?.map((opt, idx) => (
            <option key={idx} value={opt}>{opt}</option>
          ))}
        </select>
      );
    }

    if (field.type === 'textarea') {
      return (
        <textarea
          required={field.required}
          rows={2}
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          placeholder={field.placeholder}
          className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#3760F8] transition-all"
        />
      );
    }

    return (
      <Input
        type={field.type}
        required={field.required}
        value={value || ''}
        onChange={e => {
          let v = e.target.value;
          if (field.key === 'phone' || field.type === 'tel') {
            v = v.replace(/\D/g, '').slice(0, 10);
          } else if (field.key === 'supersetId') {
            v = v.replace(/\D/g, '');
          }
          onChange(v);
        }}
        placeholder={field.placeholder}
      />
    );
  };

  if (isRegistrationOpen === false) {
    return (
      <Card className="text-center py-16">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Registration Closed</h2>
        <p className="text-slate-500 max-w-md mx-auto">We are no longer accepting new team registrations for the hackathon. Please reach out to the organizers if you have any questions.</p>
      </Card>
    );
  }

  if (isRegistrationOpen === null) {
    return (
      <div className="w-full max-w-4xl mx-auto space-y-6 py-6 animate-pulse">
        <div className="h-36 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/60 p-8 space-y-4 shadow-xs">
          <div className="h-6 w-48 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
          <div className="h-4 w-72 bg-slate-100 dark:bg-slate-700/60 rounded"></div>
        </div>
        <div className="h-64 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/60 p-8 space-y-4 shadow-xs">
          <div className="h-6 w-36 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="h-11 bg-slate-100 dark:bg-slate-700/50 rounded-xl"></div>
            <div className="h-11 bg-slate-100 dark:bg-slate-700/50 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  // Pre-submission validation
  const handlePreviewClick = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    // Section 1 validation
    for (const f of teamFields.filter(f => f.enabled && f.required)) {
      const val = getTeamFieldValue(f.key);
      if (!val || !val.toString().trim()) {
        setMessage({ text: `Please fill in required team field: "${f.label}".`, type: 'error' });
        return;
      }
    }

    // Section 2 validation (Team Lead)
    for (const f of memberFields.filter(f => f.enabled && f.required)) {
      const val = getLeadFieldValue(f.key);
      if (!val || !val.toString().trim()) {
        setMessage({ text: `Team Lead: Please fill in required field "${f.label}".`, type: 'error' });
        return;
      }
      if (f.key === 'supersetId' && !/^[0-9]+$/.test(val.toString().trim())) {
        setMessage({ text: `Team Lead ${f.label} must be a number.`, type: 'error' });
        return;
      }
      if ((f.key === 'phone' || f.type === 'tel') && !/^[0-9]{10}$/.test(val.toString().trim())) {
        setMessage({ text: `Team Lead ${f.label} must be exactly 10 digits.`, type: 'error' });
        return;
      }
    }

    // Section 3 validation (Members)
    for (let i = 0; i < members.length; i++) {
      for (const f of memberFields.filter(f => f.enabled && f.required)) {
        const val = getMemberFieldValue(i, f.key);
        if (!val || !val.toString().trim()) {
          setMessage({ text: `Member ${i + 2}: Please fill in required field "${f.label}".`, type: 'error' });
          return;
        }
        if (f.key === 'supersetId' && !/^[0-9]+$/.test(val.toString().trim())) {
          setMessage({ text: `Member ${i + 2}: ${f.label} must be a number.`, type: 'error' });
          return;
        }
        if ((f.key === 'phone' || f.type === 'tel') && val.toString().trim() && !/^[0-9]{10}$/.test(val.toString().trim())) {
          setMessage({ text: `Member ${i + 2}: ${f.label} must be exactly 10 digits.`, type: 'error' });
          return;
        }
      }
    }

    setShowPreview(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRegister = async () => {
    setLoading(true);
    setMessage(null);

    const payload = {
      name: teamName,
      collegeName,
      department,
      leadName,
      leadEmail,
      leadPhone,
      leadSupersetId,
      customFields: teamCustomFields,
      leadCustomFields,
      members: members.map(m => ({
        name: m.name,
        supersetId: m.supersetId,
        contact: m.email || m.phone,
        email: m.email,
        phone: m.phone,
        college: collegeName,
        department: department,
        customFields: m.customFields
      }))
    };

    try {
      const data = await registerTeamAction(payload);
      
      if (data.success && 'team' in data && (data as any).team) {
        setRegisteredTeam((data as any).team);
        setMessage({ text: `Registration successful! Your Team ID is ${data.team.uniqueId}. Redirecting to your dashboard...`, type: 'success' });
        setTimeout(() => {
          router.push('/team/dashboard');
        }, 3000);
      } else {
        setMessage({ text: data.message || 'Registration failed.', type: 'error' });
      }
    } catch {
      setMessage({ text: 'An unexpected error occurred during registration.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const visibleTeamFields = teamFields.filter(f => f.enabled);
  const visibleMemberFields = memberFields.filter(f => f.enabled);

  // Review & Confirmation Screen
  if (showPreview && !registeredTeam) {
    return (
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/50 p-8">
          <div className="flex items-center justify-between mb-8 border-b border-slate-100 dark:border-slate-700/50 pb-6">
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">Review Registration Details</h2>
              <p className="text-slate-500 mt-1">Please review all submitted information carefully before final submission.</p>
            </div>
          </div>

          <div className="space-y-8">
            {/* Review Section 1 */}
            <div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center">
                <div className="w-6 h-6 rounded-md bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mr-2">1</div>
                Team Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700/50">
                {visibleTeamFields.map(f => (
                  <div key={f.id} className="min-w-0">
                    <span className="text-xs text-slate-500 block mb-1">{f.label}</span>
                    <span className="font-bold text-slate-900 dark:text-white block break-words">
                      {getTeamFieldValue(f.key) || '-'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Review Section 2 */}
            <div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center">
                <div className="w-6 h-6 rounded-md bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mr-2">2</div>
                Team Lead (Member 1)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5 bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700/50">
                {visibleMemberFields.map(f => (
                  <div key={f.id} className="min-w-0">
                    <span className="text-xs text-slate-500 block mb-1">{f.label}</span>
                    <span className="font-bold text-slate-900 dark:text-white block break-words">
                      {getLeadFieldValue(f.key) || '-'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Review Section 3 */}
            <div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center">
                <div className="w-6 h-6 rounded-md bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center mr-2">3</div>
                Team Members ({members.length})
              </h3>
              <div className="space-y-4">
                {members.map((_, idx) => (
                  <div key={idx} className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-xl border border-slate-200 dark:border-slate-700/50">
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block mb-3">
                      Member #{idx + 2}
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      {visibleMemberFields.map(f => (
                        <div key={f.id} className="min-w-0">
                          <span className="text-xs text-slate-400 block mb-0.5">{f.label}</span>
                          <span className="font-bold text-slate-900 dark:text-white block break-words text-sm">
                            {getMemberFieldValue(idx, f.key) || '-'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {members.length === 0 && <div className="text-sm text-slate-500 italic">No additional team members added.</div>}
              </div>
            </div>
          </div>

          {message && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8 p-4 rounded-xl bg-red-50 text-red-700 border border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20 text-sm font-bold">
              {message.text}
            </motion.div>
          )}

          <div className="mt-10 flex flex-col sm:flex-row gap-4 pt-6 border-t border-slate-100 dark:border-slate-700/50">
            <button 
              type="button" 
              onClick={() => { setShowPreview(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              disabled={loading}
              className="flex-1 px-6 py-4 rounded-xl font-bold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              Edit Details
            </button>
            <button 
              type="button" 
              onClick={handleRegister}
              disabled={loading}
              className="flex-1 px-6 py-4 rounded-xl font-bold bg-[#3760F8] text-white hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/20 flex items-center justify-center disabled:opacity-50"
            >
              {loading ? 'Submitting Registration...' : 'Confirm & Submit'}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <form onSubmit={handlePreviewClick}>
      {/* Section 1: Team Info */}
      <Card className="mb-6">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center mr-3 text-indigo-600 dark:text-indigo-400 text-sm font-black">1</div>
          Team Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {visibleTeamFields.map(field => (
            <div key={field.id} className={field.type === 'textarea' ? 'md:col-span-2 lg:col-span-3' : ''}>
              <Label>
                {field.label} {field.required && <span className="text-red-500">*</span>}
              </Label>
              {renderFieldInput(field, getTeamFieldValue(field.key), val => setTeamFieldValue(field.key, val))}
              {field.description && <span className="text-[11px] text-slate-400 block mt-1">{field.description}</span>}
            </div>
          ))}
        </div>
      </Card>

      {/* Section 2: Team Lead */}
      <Card className="mb-6">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center mr-3 text-emerald-600 dark:text-emerald-400 text-sm font-black">2</div>
          Team Lead Details (Member 1)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {visibleMemberFields.map(field => (
            <div key={field.id} className={field.type === 'textarea' ? 'md:col-span-2 lg:col-span-3' : ''}>
              <Label>
                {field.label} {field.required && <span className="text-red-500">*</span>}
              </Label>
              {renderFieldInput(field, getLeadFieldValue(field.key), val => setLeadFieldValue(field.key, val))}
              {field.description && <span className="text-[11px] text-slate-400 block mt-1">{field.description}</span>}
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-4 ml-1">📧 Your email will be your login ID. Your Team ID will be your password.</p>
      </Card>

      {/* Section 3: Team Members */}
      <Card className="mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center">
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center mr-3 text-amber-600 dark:text-amber-400 text-sm font-black">3</div>
            Team Members
          </h2>
          {members.length < (maxTeamSize - 1) && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setMembers([...members, emptyMember()])} 
              className="text-sm py-1.5 px-3 border-dashed border-2 text-[#3760F8] border-blue-200 hover:bg-blue-50 dark:hover:bg-blue-900/20"
            >
              <Plus className="w-4 h-4 mr-1" /> Add Member
            </Button>
          )}
        </div>
        
        <div className="space-y-6">
          {members.map((_, index) => (
            <div key={index} className="relative p-5 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 group">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center">
                  <Users className="w-4 h-4 mr-1.5 text-[#3760F8]" /> Member {index + 2}
                </span>
                <button 
                  type="button" 
                  onClick={() => setMembers(members.filter((_, i) => i !== index))}
                  className="text-slate-400 hover:text-red-500 transition-colors p-1"
                  title="Remove Member"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {visibleMemberFields.map(field => (
                  <div key={field.id} className={field.type === 'textarea' ? 'md:col-span-2 lg:col-span-3' : ''}>
                    <Label>
                      {field.label} {field.required && <span className="text-red-500">*</span>}
                    </Label>
                    {renderFieldInput(
                      field, 
                      getMemberFieldValue(index, field.key), 
                      val => setMemberFieldValue(index, field.key, val)
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
          {members.length === 0 && (
            <div className="text-sm text-slate-500 text-center py-4 italic">
              No additional members added. Your team size will be 1 (Lead only).
            </div>
          )}
        </div>
      </Card>

      {/* Messages & Submit */}
      {message && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-xl text-sm font-bold flex items-center mb-6 ${
            message.type === 'success' 
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' 
              : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
          )}
          {message.text}
        </motion.div>
      )}

      {registeredTeam && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-2xl p-6 mb-6 text-center">
          <p className="text-sm font-bold text-[#3760F8] mb-2">Your credentials for login:</p>
          <p className="text-slate-800 dark:text-white font-mono text-lg"><span className="text-slate-500 font-sans text-sm">Email:</span> {leadEmail}</p>
          <p className="text-slate-800 dark:text-white font-mono text-lg"><span className="text-slate-500 font-sans text-sm">Password (Team ID):</span> {registeredTeam.uniqueId}</p>
        </motion.div>
      )}

      <Button
        type="submit"
        className="w-full text-lg py-6 bg-[#3760F8] hover:bg-blue-600 text-white shadow-lg shadow-blue-500/20"
      >
        <UserPlus className="w-5 h-5 mr-2" /> Preview Details
      </Button>
    </form>
  );
};
